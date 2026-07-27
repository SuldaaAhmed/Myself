import { Body, Controller, Get, HttpCode, HttpStatus, Injectable, Module, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { ContentStatus, MessageStatus } from '@prisma/client';
import { Throttle } from '@nestjs/throttler';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { createHash } from 'node:crypto';
import { ClientMeta, Permissions, Public } from '../../common/decorators';
import { PrismaService } from '../../common/prisma/prisma.service';

export class TrackPageViewDto {
  @ApiProperty({ example: '/projects/logistics-control-tower' })
  @IsString()
  @MaxLength(300)
  path!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  referrer?: string;

  @ApiPropertyOptional({ description: 'Client-side session identifier' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  sessionId?: string;

  @ApiPropertyOptional({ description: 'Time spent on the previous page, in ms' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(86_400_000)
  durationMs?: number;
}

const deviceOf = (userAgent = ''): string => {
  if (/bot|crawler|spider|crawling/i.test(userAgent)) return 'bot';
  if (/mobile|iphone|android/i.test(userAgent)) return 'mobile';
  if (/ipad|tablet/i.test(userAgent)) return 'tablet';
  return 'desktop';
};

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Privacy-preserving visitor id: a salted hash of IP + user agent, never the
   * raw address. Enough to count returning visitors, useless as an identifier.
   */
  private visitorId(ip = '', userAgent = ''): string {
    return createHash('sha256').update(`${ip}|${userAgent}|aurora`).digest('hex').slice(0, 32);
  }

  async track(dto: TrackPageViewDto, meta: { ip?: string; userAgent?: string }) {
    const device = deviceOf(meta.userAgent);
    if (device === 'bot') return { tracked: false };

    const visitorId = this.visitorId(meta.ip, meta.userAgent);

    await this.prisma.$transaction([
      this.prisma.visitor.upsert({
        where: { id: visitorId },
        create: { id: visitorId, device, userAgent: meta.userAgent, referrer: dto.referrer },
        update: { visits: { increment: 1 } },
      }),
      this.prisma.pageView.create({
        data: {
          path: dto.path,
          referrer: dto.referrer,
          device,
          sessionId: dto.sessionId,
          durationMs: dto.durationMs,
          visitorId,
        },
      }),
    ]);

    return { tracked: true };
  }

  /** Numbers behind the dashboard home screen. */
  async overview(days = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const published = { status: ContentStatus.PUBLISHED } as const;

    const [
      views,
      visitors,
      topPages,
      topReferrers,
      devices,
      daily,
      contentCounts,
      unreadMessages,
      recentMessages,
    ] = await Promise.all([
      this.prisma.pageView.count({ where: { createdAt: { gte: since } } }),
      this.prisma.visitor.count({ where: { lastSeenAt: { gte: since } } }),
      this.prisma.pageView.groupBy({
        by: ['path'],
        where: { createdAt: { gte: since } },
        _count: { path: true },
        orderBy: { _count: { path: 'desc' } },
        take: 8,
      }),
      this.prisma.pageView.groupBy({
        by: ['referrer'],
        where: { createdAt: { gte: since }, referrer: { not: null } },
        _count: { referrer: true },
        orderBy: { _count: { referrer: 'desc' } },
        take: 6,
      }),
      this.prisma.pageView.groupBy({
        by: ['device'],
        where: { createdAt: { gte: since } },
        _count: { device: true },
      }),
      this.prisma.$queryRaw<{ day: Date; views: bigint }[]>`
        SELECT date_trunc('day', "createdAt") AS day, COUNT(*) AS views
        FROM "PageView"
        WHERE "createdAt" >= ${since}
        GROUP BY day
        ORDER BY day ASC
      `,
      Promise.all([
        this.prisma.project.count({ where: published }),
        this.prisma.post.count({ where: published }),
        this.prisma.caseStudy.count({ where: published }),
        this.prisma.testimonial.count({ where: published }),
        this.prisma.certificate.count({ where: published }),
        this.prisma.project.count({ where: { status: ContentStatus.DRAFT } }),
        this.prisma.post.count({ where: { status: ContentStatus.DRAFT } }),
      ]),
      this.prisma.message.count({ where: { status: MessageStatus.NEW } }),
      this.prisma.message.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, name: true, email: true, subject: true, status: true, createdAt: true },
      }),
    ]);

    return {
      range: { days, since },
      traffic: {
        views,
        visitors,
        daily: daily.map((row) => ({ day: row.day, views: Number(row.views) })),
        topPages: topPages.map((row) => ({ path: row.path, views: row._count.path })),
        topReferrers: topReferrers.map((row) => ({
          referrer: row.referrer,
          views: row._count.referrer,
        })),
        devices: devices.map((row) => ({ device: row.device ?? 'unknown', views: row._count.device })),
      },
      content: {
        projects: contentCounts[0],
        posts: contentCounts[1],
        caseStudies: contentCounts[2],
        testimonials: contentCounts[3],
        certificates: contentCounts[4],
        drafts: contentCounts[5] + contentCounts[6],
      },
      inbox: { unread: unreadMessages, recent: recentMessages },
    };
  }

  async topContent() {
    const [projects, posts] = await Promise.all([
      this.prisma.project.findMany({
        orderBy: { views: 'desc' },
        take: 5,
        select: { id: true, title: true, slug: true, views: true },
      }),
      this.prisma.post.findMany({
        orderBy: { views: 'desc' },
        take: 5,
        select: { id: true, title: true, slug: true, views: true },
      }),
    ]);
    return { projects, posts };
  }
}

@ApiTags('analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Post('track')
  @Public()
  @HttpCode(HttpStatus.ACCEPTED)
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @ApiOperation({ summary: 'Record an anonymous page view' })
  track(@Body() dto: TrackPageViewDto, @ClientMeta() meta: { ip?: string; userAgent?: string }) {
    return this.analytics.track(dto, meta);
  }

  @Get('overview')
  @ApiBearerAuth()
  @Permissions('analytics:read')
  @ApiOperation({ summary: 'Traffic, content and inbox metrics for the dashboard' })
  overview(@Query('days') days?: string) {
    const parsed = Number.parseInt(days ?? '30', 10);
    return this.analytics.overview(Number.isFinite(parsed) ? Math.min(365, Math.max(1, parsed)) : 30);
  }

  @Get('top-content')
  @ApiBearerAuth()
  @Permissions('analytics:read')
  @ApiOperation({ summary: 'Most viewed projects and posts' })
  topContent() {
    return this.analytics.topContent();
  }
}

@Module({
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
