import { Body, Controller, Delete, Get, Injectable, Module, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { ContentStatus, Prisma, SeoMeta } from '@prisma/client';
import {
  IsArray,
  IsBoolean,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { CacheService } from '../../common/cache/cache.service';
import { Audit, Permissions, Public } from '../../common/decorators';
import { PrismaService } from '../../common/prisma/prisma.service';

export class UpsertSeoDto {
  @ApiProperty({ example: 'Suldaa Ahmed — Full-stack engineer' })
  @IsString()
  @MinLength(3)
  @MaxLength(70)
  title!: string;

  @ApiProperty({ example: 'I design and build resilient web platforms.' })
  @IsString()
  @MinLength(30)
  @MaxLength(180)
  description!: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keywords?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ogImage?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  canonical?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  noIndex?: boolean;

  @ApiPropertyOptional({ description: 'JSON-LD injected into the page head' })
  @IsOptional()
  @IsObject()
  structuredData?: Record<string, unknown>;
}

export class UpsertSeoPathDto extends UpsertSeoDto {
  @ApiProperty({ example: '/projects', description: 'Route this metadata belongs to' })
  @IsString()
  @MinLength(1)
  path!: string;
}

@Injectable()
export class SeoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  list() {
    return this.prisma.seoMeta.findMany({ orderBy: { path: 'asc' } });
  }

  /** Returns null rather than throwing: pages fall back to their own defaults. */
  async forPath(path: string): Promise<SeoMeta | null> {
    const normalised = path.startsWith('/') ? path : `/${path}`;
    return this.cache.wrap(`seo:${normalised}`, ['seo'], 300, () =>
      this.prisma.seoMeta.findUnique({ where: { path: normalised } }),
    );
  }

  async upsert(path: string, dto: UpsertSeoDto) {
    const normalised = path.startsWith('/') ? path : `/${path}`;
    // JSON-LD is free-form, so Prisma needs it as an explicit input value.
    const structuredData = (dto.structuredData ?? undefined) as Prisma.InputJsonValue | undefined;
    const record = await this.prisma.seoMeta.upsert({
      where: { path: normalised },
      create: { ...dto, path: normalised, structuredData },
      update: { ...dto, structuredData },
    });
    await this.cache.invalidate('seo');
    return record;
  }

  async remove(path: string) {
    await this.prisma.seoMeta.delete({ where: { path } });
    await this.cache.invalidate('seo');
    return { path };
  }

  /**
   * Every canonical URL the site exposes, used to build `sitemap.xml`.
   * Static routes live alongside the dynamic ones so a new project shows up in
   * the sitemap the moment it is published.
   */
  async sitemap(): Promise<{ path: string; updatedAt: Date; priority: number }[]> {
    return this.cache.wrap(
      'seo:sitemap',
      ['seo', 'projects', 'blog', 'case-studies'],
      300,
      async () => {
        const published = { status: ContentStatus.PUBLISHED } as const;
        const [projects, posts, caseStudies] = await Promise.all([
          this.prisma.project.findMany({ where: published, select: { slug: true, updatedAt: true } }),
          this.prisma.post.findMany({ where: published, select: { slug: true, updatedAt: true } }),
          this.prisma.caseStudy.findMany({ where: published, select: { slug: true, updatedAt: true } }),
        ]);

        const staticPaths = [
          '/',
          '/about',
          '/services',
          '/skills',
          '/technologies',
          '/experience',
          '/education',
          '/projects',
          '/case-studies',
          '/certificates',
          '/testimonials',
          '/blog',
          '/gallery',
          '/resume',
          '/faq',
          '/contact',
        ];

        return [
          ...staticPaths.map((path) => ({
            path,
            updatedAt: new Date(),
            priority: path === '/' ? 1 : 0.7,
          })),
          ...projects.map((p) => ({ path: `/projects/${p.slug}`, updatedAt: p.updatedAt, priority: 0.8 })),
          ...caseStudies.map((c) => ({
            path: `/case-studies/${c.slug}`,
            updatedAt: c.updatedAt,
            priority: 0.8,
          })),
          ...posts.map((p) => ({ path: `/blog/${p.slug}`, updatedAt: p.updatedAt, priority: 0.6 })),
        ];
      },
    );
  }
}

@ApiTags('seo')
@Controller('seo')
@Audit('seo')
export class SeoController {
  constructor(private readonly seo: SeoService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'All SEO records, or the record for one ?path=' })
  list(@Query('path') path?: string) {
    return path ? this.seo.forPath(path) : this.seo.list();
  }

  @Get('sitemap')
  @Public()
  @ApiOperation({ summary: 'Canonical URL list used to generate sitemap.xml' })
  sitemap() {
    return this.seo.sitemap();
  }

  // Paths contain slashes, so they travel in the body / query string rather
  // than as a route parameter.
  @Put()
  @ApiBearerAuth()
  @Permissions('seo:write')
  @ApiOperation({ summary: 'Create or replace the SEO record for a path' })
  upsert(@Body() dto: UpsertSeoPathDto) {
    const { path, ...meta } = dto;
    return this.seo.upsert(path, meta);
  }

  @Delete()
  @ApiBearerAuth()
  @Permissions('seo:delete')
  @ApiOperation({ summary: 'Delete an SEO record' })
  remove(@Query('path') path: string) {
    return this.seo.remove(path);
  }
}

@Module({
  controllers: [SeoController],
  providers: [SeoService],
  exports: [SeoService],
})
export class SeoModule {}
