import { Controller, Get, Injectable } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ContentStatus } from '@prisma/client';
import { CacheService } from '../../common/cache/cache.service';
import { Public } from '../../common/decorators';
import { PrismaService } from '../../common/prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';

/**
 * The public home page needs a dozen collections. Fetching them one endpoint at
 * a time would mean a dozen round trips, so the API composes the payload once
 * and caches it under the tags of every resource it touches.
 */
@Injectable()
export class SiteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly settings: SettingsService,
  ) {}

  async home() {
    const published = { status: ContentStatus.PUBLISHED } as const;

    return this.cache.wrap(
      'site:home',
      ['settings', 'projects', 'services', 'skills', 'technologies', 'testimonials', 'blog', 'experience'],
      120,
      async () => {
        const [
          settings,
          featuredProjects,
          services,
          skillGroups,
          technologies,
          testimonials,
          posts,
          experience,
          counts,
        ] = await Promise.all([
          this.settings.publicSettings(),
          this.prisma.project.findMany({
            where: { ...published, featured: true },
            orderBy: { order: 'asc' },
            take: 6,
            include: { technologies: true, category: true },
          }),
          this.prisma.service.findMany({ where: published, orderBy: { order: 'asc' }, take: 6 }),
          this.prisma.skillGroup.findMany({
            orderBy: { order: 'asc' },
            include: { skills: { where: published, orderBy: { order: 'asc' } } },
          }),
          this.prisma.technology.findMany({ where: published, orderBy: { order: 'asc' } }),
          this.prisma.testimonial.findMany({
            where: { ...published, featured: true },
            orderBy: { order: 'asc' },
            take: 6,
          }),
          this.prisma.post.findMany({
            where: published,
            orderBy: { publishedAt: 'desc' },
            take: 3,
            include: { category: true },
          }),
          this.prisma.experience.findMany({ where: published, orderBy: { startDate: 'desc' }, take: 4 }),
          Promise.all([
            this.prisma.project.count({ where: published }),
            this.prisma.certificate.count({ where: published }),
            this.prisma.post.count({ where: published }),
            this.prisma.testimonial.count({ where: published }),
          ]),
        ]);

        return {
          settings,
          featuredProjects,
          services,
          skillGroups,
          technologies,
          testimonials,
          posts,
          experience,
          stats: {
            projects: counts[0],
            certificates: counts[1],
            posts: counts[2],
            testimonials: counts[3],
          },
        };
      },
    );
  }
}

@ApiTags('site')
@Controller('site')
export class SiteController {
  constructor(private readonly site: SiteService) {}

  @Get('home')
  @Public()
  @ApiOperation({ summary: 'Everything the home page renders, in one request' })
  home() {
    return this.site.home();
  }
}
