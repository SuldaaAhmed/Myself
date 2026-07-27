import { Body, Controller, Injectable, Param, Patch, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiProperty,
  ApiPropertyOptional,
  ApiTags,
  PartialType,
} from '@nestjs/swagger';
import { ContentStatus, Skill, SkillGroup } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { CacheService } from '../../common/cache/cache.service';
import { CrudController } from '../../common/crud/crud.controller';
import { CrudService } from '../../common/crud/crud.service';
import { Resource } from '../../common/decorators';
import { PrismaService } from '../../common/prisma/prisma.service';

export class CreateSkillDto {
  @ApiProperty({ example: 'System design' })
  @IsString()
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({ minimum: 0, maximum: 100, default: 80 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  level?: number;

  @ApiPropertyOptional({ description: 'Years of hands-on practice' })
  @IsOptional()
  @IsInt()
  @Min(0)
  years?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'lucide-react icon name' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ description: 'Skill group id' })
  @IsOptional()
  @IsString()
  groupId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  order?: number;

  @ApiPropertyOptional({ enum: ContentStatus })
  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;
}

export class UpdateSkillDto extends PartialType(CreateSkillDto) {}

export class CreateSkillGroupDto {
  @ApiProperty({ example: 'Engineering' })
  @IsString()
  @MaxLength(80)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  order?: number;
}

export class UpdateSkillGroupDto extends PartialType(CreateSkillGroupDto) {}

@Injectable()
export class SkillsService extends CrudService<Skill> {
  constructor(prisma: PrismaService, cache: CacheService) {
    super(prisma, cache, {
      model: 'skill',
      resource: 'skills',
      searchFields: ['name', 'description'],
      defaultSort: { order: 'asc' },
      sortableFields: ['order', 'name', 'level', 'createdAt'],
      include: { group: true },
      slugFrom: 'name',
      hasStatus: true,
      hasOrder: true,
    });
  }
}

@Injectable()
export class SkillGroupsService extends CrudService<SkillGroup> {
  constructor(prisma: PrismaService, cache: CacheService) {
    super(prisma, cache, {
      model: 'skillGroup',
      resource: 'skill-groups',
      searchFields: ['name'],
      defaultSort: { order: 'asc' },
      sortableFields: ['order', 'name'],
      include: { skills: { orderBy: { order: 'asc' } } },
      slugFrom: 'name',
      hasOrder: true,
    });
  }
}

@ApiTags('skills')
@Controller('skills')
@Resource('skills')
export class SkillsController extends CrudController<Skill, CreateSkillDto, UpdateSkillDto> {
  constructor(skills: SkillsService) {
    super(skills, 'skills');
  }

  @Post()
  @ApiBearerAuth()
  override create(@Body() dto: CreateSkillDto) {
    return this.service.create({ ...dto });
  }

  @Patch(':id')
  @ApiBearerAuth()
  override update(@Param('id') id: string, @Body() dto: UpdateSkillDto) {
    return this.service.update(id, { ...dto });
  }
}

@ApiTags('skills')
@Controller('skill-groups')
@Resource('skills')
export class SkillGroupsController extends CrudController<SkillGroup, CreateSkillGroupDto, UpdateSkillGroupDto> {
  constructor(groups: SkillGroupsService) {
    super(groups, 'skill-groups');
  }

  @Post()
  @ApiBearerAuth()
  override create(@Body() dto: CreateSkillGroupDto) {
    return this.service.create({ ...dto });
  }

  @Patch(':id')
  @ApiBearerAuth()
  override update(@Param('id') id: string, @Body() dto: UpdateSkillGroupDto) {
    return this.service.update(id, { ...dto });
  }
}
