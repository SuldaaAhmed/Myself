import 'reflect-metadata';
import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { join } from 'node:path';
import { AppModule } from './app.module';
import { PrismaService } from './common/prisma/prisma.service';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });
  const config = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  app.set('trust proxy', 1);
  app.use(cookieParser());
  app.use(compression());
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: config.get('NODE_ENV') === 'production' ? undefined : false,
    }),
  );

  app.enableCors({
    origin: config
      .get<string>('CORS_ORIGINS', 'http://localhost:3000')
      .split(',')
      .map((origin) => origin.trim()),
    credentials: true,
    exposedHeaders: ['Content-Disposition'],
  });

  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Locally stored uploads are served straight from disk; with Cloudinary
  // configured this route simply stays empty.
  app.useStaticAssets(join(process.cwd(), config.get<string>('UPLOAD_DIR', './uploads')), {
    prefix: '/uploads/',
    maxAge: '30d',
    index: false,
  });

  const swagger = new DocumentBuilder()
    .setTitle('Aurora Portfolio API')
    .setDescription(
      'REST API powering the public portfolio website and its admin dashboard. ' +
        'Reads are public where the content is published; every mutation requires a ' +
        '`resource:action` permission.',
    )
    .setVersion('1.0.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' })
    .addCookieAuth('access_token')
    .addServer('/api/v1')
    .build();

  SwaggerModule.setup(
    'api/docs',
    app,
    SwaggerModule.createDocument(app, swagger, { ignoreGlobalPrefix: true }),
    {
      swaggerOptions: { persistAuthorization: true, tagsSorter: 'alpha', operationsSorter: 'alpha' },
      customSiteTitle: 'Aurora Portfolio API',
    },
  );

  app.enableShutdownHooks();
  app.get(PrismaService).enableShutdownHooks(app);

  const port = config.get<number>('API_PORT', 4000);
  await app.listen(port, '0.0.0.0');

  logger.log(`API listening on http://localhost:${port}/api/v1`);
  logger.log(`OpenAPI docs on http://localhost:${port}/api/docs`);
}

void bootstrap();
