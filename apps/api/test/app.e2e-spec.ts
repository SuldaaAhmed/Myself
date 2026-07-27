import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { AuthService } from '../src/modules/auth/auth.service';
import { CSRF_COOKIE } from '../src/common/guards/csrf.guard';

/**
 * End-to-end coverage of the paths that protect everything else: the auth flow
 * and one full resource lifecycle. Requires DATABASE_URL to point at a scratch
 * database — the suite truncates every table.
 */
describe('Portfolio API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const owner = { email: 'e2e-owner@example.com', password: 'E2ePassword123!' };
  let cookies: string[] = [];
  let csrfToken = '';

  const cookieHeader = () => cookies.map((cookie) => cookie.split(';')[0]).join('; ');

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();

    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();

    prisma = app.get(PrismaService);
    await prisma.truncateAll();

    // Minimal fixture: one owner account with the wildcard permission.
    await prisma.permission.create({
      data: { key: '*', resource: '*', action: '*', description: 'Full access' },
    });
    await prisma.user.create({
      data: {
        email: owner.email,
        name: 'E2E Owner',
        passwordHash: await AuthService.hashPassword(owner.password),
        roles: {
          create: {
            name: 'e2e-owner',
            isSystem: true,
            permissions: { connect: [{ key: '*' }] },
          },
        },
      },
    });
  });

  afterAll(async () => {
    await prisma.truncateAll();
    await app.close();
  });

  describe('health', () => {
    it('reports a reachable database', async () => {
      const response = await request(app.getHttpServer()).get('/api/v1/health').expect(200);
      expect(response.body.status).toBe('ok');
      expect(response.body.checks.database.ok).toBe(true);
    });
  });

  describe('auth', () => {
    it('rejects bad credentials', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: owner.email, password: 'wrong-password' })
        .expect(401);
    });

    it('issues session cookies on success', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send(owner)
        .expect(201);

      const setCookie = response.get('set-cookie');
      cookies = Array.isArray(setCookie) ? setCookie : setCookie ? [setCookie] : [];
      csrfToken = decodeURIComponent(
        cookies.find((cookie) => cookie.startsWith(CSRF_COOKIE))?.split('=')[1]?.split(';')[0] ?? '',
      );

      expect(response.body.email).toBe(owner.email);
      expect(cookies.some((cookie) => cookie.startsWith('access_token'))).toBe(true);
      expect(cookies.some((cookie) => cookie.startsWith('refresh_token'))).toBe(true);
      expect(csrfToken).not.toHaveLength(0);
    });

    it('returns the session profile with resolved permissions', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Cookie', cookieHeader())
        .expect(200);

      expect(response.body.permissions).toContain('*');
    });
  });

  describe('authorisation', () => {
    it('refuses an anonymous write', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/projects')
        .send({ title: 'Anonymous', summary: 'Should never be created' })
        .expect(401);
    });

    it('refuses a cookie-authenticated write without the CSRF header', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/projects')
        .set('Cookie', cookieHeader())
        .send({ title: 'No CSRF', summary: 'Should be blocked by the guard' })
        .expect(403);
    });
  });

  describe('project lifecycle', () => {
    let projectId = '';

    it('creates a draft and derives its slug', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/projects')
        .set('Cookie', cookieHeader())
        .set('x-csrf-token', csrfToken)
        .send({ title: 'E2E Control Tower', summary: 'Created by the end-to-end suite.' })
        .expect(201);

      projectId = response.body.id;
      expect(response.body.slug).toBe('e2e-control-tower');
      expect(response.body.status).toBe('DRAFT');
      expect(response.body.publishedAt).toBeNull();
    });

    it('hides the draft from the public list', async () => {
      const response = await request(app.getHttpServer()).get('/api/v1/projects').expect(200);
      expect(response.body.meta.total).toBe(0);
    });

    it('shows the draft to a permitted caller', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/projects?includeUnpublished=true')
        .set('Cookie', cookieHeader())
        .expect(200);

      expect(response.body.meta.total).toBe(1);
    });

    it('rejects an unknown field', async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/projects/${projectId}`)
        .set('Cookie', cookieHeader())
        .set('x-csrf-token', csrfToken)
        .send({ views: 9999 })
        .expect(400);
    });

    it('stamps publishedAt on first publish', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/projects/${projectId}`)
        .set('Cookie', cookieHeader())
        .set('x-csrf-token', csrfToken)
        .send({ status: 'PUBLISHED' })
        .expect(200);

      expect(response.body.publishedAt).not.toBeNull();
    });

    it('serves the published project by slug to anyone', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/projects/e2e-control-tower')
        .expect(200);

      expect(response.body.title).toBe('E2E Control Tower');
    });

    it('rejects sorting by a column that is not allow-listed', async () => {
      await request(app.getHttpServer()).get('/api/v1/projects?sort=views:desc').expect(200);
      await request(app.getHttpServer()).get('/api/v1/projects?sort=summary:desc').expect(400);
    });

    it('deletes the project and records the mutations', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/projects/${projectId}`)
        .set('Cookie', cookieHeader())
        .set('x-csrf-token', csrfToken)
        .expect(200);

      await request(app.getHttpServer()).get(`/api/v1/projects/${projectId}`).expect(404);

      const actions = await prisma.auditLog.findMany({ where: { resource: 'projects' } });
      expect(actions.map((entry) => entry.action).sort()).toEqual(['create', 'delete', 'update']);
    });
  });

  describe('contact form', () => {
    it('validates the payload', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/messages')
        .send({ name: 'x', email: 'not-an-email', body: 'too short' })
        .expect(400);
    });

    it('accepts a real submission and files it as unread', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/messages')
        .send({
          name: 'E2E Visitor',
          email: 'visitor@example.com',
          body: 'A message long enough to pass validation comfortably.',
        })
        .expect(201);

      const response = await request(app.getHttpServer())
        .get('/api/v1/messages')
        .set('Cookie', cookieHeader())
        .expect(200);

      expect(response.body.unread).toBe(1);
    });

    it('files honeypot submissions as spam', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/messages')
        .send({
          name: 'Spam Bot',
          email: 'bot@example.com',
          body: 'A message long enough to pass validation comfortably.',
          website: 'https://spam.example',
        })
        .expect(201);

      const spam = await prisma.message.count({ where: { status: 'SPAM' } });
      expect(spam).toBe(1);
    });
  });
});
