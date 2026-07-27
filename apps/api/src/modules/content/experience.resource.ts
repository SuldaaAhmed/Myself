import { Body, Controller, Injectable, Param, Patch, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiProperty,
  ApiPropertyOptional,
  ApiTags,
  PartialType,
} from '@nestjs/swagger';
import { ContentStatus, Experience } from '@prisma/client';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { CacheService } from '../../common/cache/cache.service';
import { CrudController } from '../../common/crud/crud.controller';
import { CrudService } from '../../common/crud/crud.service';
import { Resource } from '../../common/decorators';
import { PrismaService } from '../../common/prisma/prisma.service';

export class CreateExperienceDto {
  @ApiProperty({ example: 'Northwind Labs' })
  @IsString()
  @MaxLength(120)
  company!: string;

  @ApiProperty({ example: 'Senior Full-Stack Engineer' })
  @IsString()
  @MaxLength(120)
  role!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({ example: 'Remote — EU' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ example: 'full-time' })
  @IsOptional()
  @IsString()
  employmentType?: string;

  @ApiProperty({ example: '2023-02-01' })
  @IsDateString()
  startDate!: string;

  @ApiPropertyOptional({ example: '2025-04-30' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  current?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiPropertyOptional({ type: [String], description: 'Bullet points of measurable impact' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  highlights?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  stack?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  url?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  order?: number;

  @ApiPropertyOptional({ enum: ContentStatus })
  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;
}

export class UpdateExperienceDto extends PartialType(CreateExperienceDto) {}

@Injectable()
export class ExperienceService extends CrudService<Experience> {
  constructor(prisma: PrismaService, cache: CacheService) {
    super(prisma, cache, {
      model: 'experience',
      resource: 'experience',
      searchFields: ['company', 'role', 'summary'],
      defaultSort: { startDate: 'desc' },
      sortableFields: ['startDate', 'endDate', 'order', 'company'],
      slugFrom: 'company',
      hasStatus: true,
      hasOrder: true,
    });
  }

  protected override async beforeWrite(data: Record<string, unknown>) {
    // "Current role" and an end date are mutually exclusive.
    if (data.current === true) data.endDate = null;
    return data;
  }
}

@ApiTags('experience')
@Controller('experience')
@Resource('experience')
export class ExperienceController extends CrudController<Experience, CreateExperienceDto, UpdateExperienceDto> {
  constructor(experience: ExperienceService) {
    super(experience, 'experience');
  }

  @Post()
  @ApiBearerAuth()
  override create(@Body() dto: CreateExperienceDto) {
    return this.service.create({ ...dto });
  }

  @Patch(':id')
  @ApiBearerAuth()
  override update(@Param('id') id: string, @Body() dto: UpdateExperienceDto) {
    return this.service.update(id, { ...dto });
  }
}
