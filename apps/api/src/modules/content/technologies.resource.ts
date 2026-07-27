import { Body, Controller, Injectable, Param, Patch, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiProperty,
  ApiPropertyOptional,
  ApiTags,
  PartialType,
} from '@nestjs/swagger';
import { ContentStatus, Technology } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { CacheService } from '../../common/cache/cache.service';
import { CrudController } from '../../common/crud/crud.controller';
import { CrudService } from '../../common/crud/crud.service';
import { Resource } from '../../common/decorators';
import { PrismaService } from '../../common/prisma/prisma.service';

export class CreateTechnologyDto {
  @ApiProperty({ example: 'PostgreSQL' })
  @IsString()
  @MaxLength(80)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({ example: 'backend', description: 'frontend | backend | devops | design | tooling' })
  @IsOptional()
  @IsString()
  group?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  iconUrl?: string;

  @ApiPropertyOptional({ example: '#336791' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ minimum: 0, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  level?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  order?: number;

  @ApiPropertyOptional({ enum: ContentStatus })
  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;
}

export class UpdateTechnologyDto extends PartialType(CreateTechnologyDto) {}

@Injectable()
export class TechnologiesService extends CrudService<Technology> {
  constructor(prisma: PrismaService, cache: CacheService) {
    super(prisma, cache, {
      model: 'technology',
      resource: 'technologies',
      searchFields: ['name', 'group'],
      defaultSort: { order: 'asc' },
      sortableFields: ['order', 'name', 'level', 'createdAt'],
      slugFrom: 'name',
      hasStatus: true,
      hasOrder: true,
    });
  }
}

@ApiTags('technologies')
@Controller('technologies')
@Resource('technologies')
export class TechnologiesController extends CrudController<Technology, CreateTechnologyDto, UpdateTechnologyDto> {
  constructor(technologies: TechnologiesService) {
    super(technologies, 'technologies');
  }

  @Post()
  @ApiBearerAuth()
  override create(@Body() dto: CreateTechnologyDto) {
    return this.service.create({ ...dto });
  }

  @Patch(':id')
  @ApiBearerAuth()
  override update(@Param('id') id: string, @Body() dto: UpdateTechnologyDto) {
    return this.service.update(id, { ...dto });
  }
}
