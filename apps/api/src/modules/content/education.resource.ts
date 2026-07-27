import { Body, Controller, Injectable, Param, Patch, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiProperty,
  ApiPropertyOptional,
  ApiTags,
  PartialType,
} from '@nestjs/swagger';
import { ContentStatus, Education } from '@prisma/client';
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';
import { CacheService } from '../../common/cache/cache.service';
import { CrudController } from '../../common/crud/crud.controller';
import { CrudService } from '../../common/crud/crud.service';
import { Resource } from '../../common/decorators';
import { PrismaService } from '../../common/prisma/prisma.service';

export class CreateEducationDto {
  @ApiProperty({ example: 'University of Hargeisa' })
  @IsString()
  @MaxLength(160)
  institution!: string;

  @ApiProperty({ example: 'BSc Computer Science' })
  @IsString()
  @MaxLength(160)
  degree!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({ example: 'Software Engineering' })
  @IsOptional()
  @IsString()
  field?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ example: '2019-09-01' })
  @IsDateString()
  startDate!: string;

  @ApiPropertyOptional({ example: '2023-06-30' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ example: 'First class' })
  @IsOptional()
  @IsString()
  grade?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  order?: number;

  @ApiPropertyOptional({ enum: ContentStatus })
  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;
}

export class UpdateEducationDto extends PartialType(CreateEducationDto) {}

@Injectable()
export class EducationService extends CrudService<Education> {
  constructor(prisma: PrismaService, cache: CacheService) {
    super(prisma, cache, {
      model: 'education',
      resource: 'education',
      searchFields: ['institution', 'degree', 'field'],
      defaultSort: { startDate: 'desc' },
      sortableFields: ['startDate', 'endDate', 'order', 'institution'],
      slugFrom: 'degree',
      hasStatus: true,
      hasOrder: true,
    });
  }
}

@ApiTags('education')
@Controller('education')
@Resource('education')
export class EducationController extends CrudController<Education, CreateEducationDto, UpdateEducationDto> {
  constructor(education: EducationService) {
    super(education, 'education');
  }

  @Post()
  @ApiBearerAuth()
  override create(@Body() dto: CreateEducationDto) {
    return this.service.create({ ...dto });
  }

  @Patch(':id')
  @ApiBearerAuth()
  override update(@Param('id') id: string, @Body() dto: UpdateEducationDto) {
    return this.service.update(id, { ...dto });
  }
}
