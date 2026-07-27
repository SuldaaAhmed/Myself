import { Body, Controller, Injectable, Param, Patch, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiProperty,
  ApiPropertyOptional,
  ApiTags,
  PartialType,
} from '@nestjs/swagger';
import { CaseStudy, ContentStatus } from '@prisma/client';
import { IsArray, IsEnum, IsInt, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { CacheService } from '../../common/cache/cache.service';
import { CrudController } from '../../common/crud/crud.controller';
import { CrudService } from '../../common/crud/crud.service';
import { Resource } from '../../common/decorators';
import { PrismaService } from '../../common/prisma/prisma.service';

export class CreateCaseStudyDto {
  @ApiProperty()
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiProperty()
  @IsString()
  @MaxLength(400)
  summary!: string;

  @ApiProperty({ description: 'Client, timeline, team — the brief' })
  @IsString()
  context!: string;

  @ApiProperty({ description: 'What was broken or missing' })
  @IsString()
  problem!: string;

  @ApiProperty({ description: 'How it was solved' })
  @IsString()
  approach!: string;

  @ApiProperty({ description: 'Measured result' })
  @IsString()
  outcome!: string;

  @ApiPropertyOptional({ example: [{ label: 'Conversion', value: '+38%', delta: 'up' }] })
  @IsOptional()
  @IsArray()
  metrics?: { label: string; value: string; delta?: string }[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  coverUrl?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  gallery?: string[];

  @ApiPropertyOptional({ description: 'Project this case study belongs to' })
  @IsOptional()
  @IsString()
  projectId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  order?: number;

  @ApiPropertyOptional({ enum: ContentStatus })
  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;
}

export class UpdateCaseStudyDto extends PartialType(CreateCaseStudyDto) {}

@Injectable()
export class CaseStudiesService extends CrudService<CaseStudy> {
  constructor(prisma: PrismaService, cache: CacheService) {
    super(prisma, cache, {
      model: 'caseStudy',
      resource: 'case-studies',
      searchFields: ['title', 'summary', 'problem', 'outcome'],
      defaultSort: { order: 'asc' },
      sortableFields: ['order', 'title', 'createdAt', 'publishedAt'],
      include: { project: { select: { id: true, title: true, slug: true, coverUrl: true } } },
      slugFrom: 'title',
      hasStatus: true,
      hasPublishedAt: true,
      hasOrder: true,
    });
  }
}

@ApiTags('case-studies')
@Controller('case-studies')
@Resource('case-studies')
export class CaseStudiesController extends CrudController<CaseStudy, CreateCaseStudyDto, UpdateCaseStudyDto> {
  constructor(caseStudies: CaseStudiesService) {
    super(caseStudies, 'case-studies');
  }

  @Post()
  @ApiBearerAuth()
  override create(@Body() dto: CreateCaseStudyDto) {
    return this.service.create({ ...dto });
  }

  @Patch(':id')
  @ApiBearerAuth()
  override update(@Param('id') id: string, @Body() dto: UpdateCaseStudyDto) {
    return this.service.update(id, { ...dto });
  }
}
