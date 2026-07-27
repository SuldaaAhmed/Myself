import { Module } from '@nestjs/common';
import { SettingsModule } from '../settings/settings.module';
import { BlogController, BlogService } from './blog.resource';
import { CaseStudiesController, CaseStudiesService } from './case-studies.resource';
import { CategoriesController, CategoriesService } from './categories.resource';
import { CertificatesController, CertificatesService } from './certificates.resource';
import { EducationController, EducationService } from './education.resource';
import { ExperienceController, ExperienceService } from './experience.resource';
import { FaqController, FaqService } from './faq.resource';
import { GalleryController, GalleryService } from './gallery.resource';
import { ProjectsController, ProjectsService } from './projects.resource';
import { ServicesController, ServicesService } from './services.resource';
import {
  SkillGroupsController,
  SkillGroupsService,
  SkillsController,
  SkillsService,
} from './skills.resource';
import { SiteController, SiteService } from './site.controller';
import { TechnologiesController, TechnologiesService } from './technologies.resource';
import { TestimonialsController, TestimonialsService } from './testimonials.resource';

/**
 * Every CMS-managed collection. Each `*.resource.ts` file is a vertical slice:
 * DTOs, service and controller for one resource, all built on the shared
 * `CrudService` / `CrudController` pair.
 */
@Module({
  imports: [SettingsModule],
  controllers: [
    ProjectsController,
    CaseStudiesController,
    ServicesController,
    SkillsController,
    SkillGroupsController,
    TechnologiesController,
    ExperienceController,
    EducationController,
    CertificatesController,
    TestimonialsController,
    BlogController,
    CategoriesController,
    GalleryController,
    FaqController,
    SiteController,
  ],
  providers: [
    ProjectsService,
    CaseStudiesService,
    ServicesService,
    SkillsService,
    SkillGroupsService,
    TechnologiesService,
    ExperienceService,
    EducationService,
    CertificatesService,
    TestimonialsService,
    BlogService,
    CategoriesService,
    GalleryService,
    FaqService,
    SiteService,
  ],
  exports: [ProjectsService, BlogService],
})
export class ContentModule {}
