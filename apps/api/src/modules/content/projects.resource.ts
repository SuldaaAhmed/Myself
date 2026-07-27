import { Body, Controller, Injectable, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiPropertyOptional, ApiTags, PartialType } from '@nestjs/swagger';
import { ApiProperty } from '@nestjs/swagger';
import { ContentStatus, Project } from '@prisma/client';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { CacheService } from '../../common/cache/cache.service';
import { CrudController } from '../../common/crud/crud.controller';
import { CrudService } from '../../common/crud/crud.service';
import { Resource } from '../../common/decorators';
import { PrismaService } from '../../common/prisma/prisma.service';

export class CreateProjectDto {
  @ApiProperty({ example: 'Realtime logistics control tower' })
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  title!: string;

  @ApiPropertyOptional({ description: 'Derived from the title when omitted' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiProperty({ description: 'One or two sentences shown on cards' })
  @IsString()
  @MaxLength(400)
  summary!: string;

  @ApiPropertyOptional({ description: 'Long-form markdown body' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  coverUrl?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  gallery?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  repoUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  liveUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  client?: string;

  @ApiPropertyOptional({ example: 'Lead engineer' })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional({ example: 2025 })
  @IsOptional()
  @IsInt()
  @Min(1990)
  year?: number;

  @ApiPropertyOptional({
    description: 'Impact numbers rendered as a stat row',
    example: [{ label: 'p95 latency', value: '-64%' }],
  })
  @IsOptional()
  @IsArray()
  metrics?: { label: string; value: string }[];

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  order?: number;

  @ApiPropertyOptional({ enum: ContentStatus, default: ContentStatus.DRAFT })
  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ type: [String], description: 'Technology ids to link' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  technologyIds?: string[];
}

export class UpdateProjectDto extends PartialType(CreateProjectDto) {}

@Injectable()
export class ProjectsService extends CrudService<Project> {
  constructor(prisma: PrismaService, cache: CacheService) {
    super(prisma, cache, {
      model: 'project',
      resource: 'projects',
      searchFields: ['title', 'summary', 'client', 'role'],
      defaultSort: { order: 'asc' },
      sortableFields: ['order', 'title', 'year', 'createdAt', 'publishedAt', 'views'],
      include: { category: true, technologies: { orderBy: { order: 'asc' } } },
      slugFrom: 'title',
      hasStatus: true,
      hasPublishedAt: true,
      hasOrder: true,
      hasFeatured: true,
      hasCategory: true,
    });
  }

  protected override async beforeWrite(data: Record<string, unknown>) {
    const technologyIds = data.technologyIds as string[] | undefined;
    delete data.technologyIds;

    if (technologyIds) {
      data.technologies = { set: technologyIds.map((id) => ({ id })) };
    }
    return data;
  }

  /** Fire-and-forget view counter used by the public project page. */
  async trackView(slug: string): Promise<void> {
    await this.prisma.project.updateMany({ where: { slug }, data: { views: { increment: 1 } } });
  }
}

@ApiTags('projects')
@Controller('projects')
@Resource('projects')
export class ProjectsController extends CrudController<Project, CreateProjectDto, UpdateProjectDto> {
  constructor(private readonly projects: ProjectsService) {
    super(projects, 'projects');
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a project' })
  override create(@Body() dto: CreateProjectDto) {
    return this.service.create({ ...dto });
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a project' })
  override update(@Param('id') id: string, @Body() dto: UpdateProjectDto) {
    return this.service.update(id, { ...dto });
  }
}
