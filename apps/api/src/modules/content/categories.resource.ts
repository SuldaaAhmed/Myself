import { Body, Controller, Injectable, Param, Patch, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiProperty,
  ApiPropertyOptional,
  ApiTags,
  PartialType,
} from '@nestjs/swagger';
import { Category } from '@prisma/client';
import { IsInt, IsOptional, IsString, MaxLength } from 'class-validator';
import { CacheService } from '../../common/cache/cache.service';
import { CrudController } from '../../common/crud/crud.controller';
import { CrudService } from '../../common/crud/crud.service';
import { Resource } from '../../common/decorators';
import { PrismaService } from '../../common/prisma/prisma.service';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Web platforms' })
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
  description?: string;

  @ApiPropertyOptional({ example: '#6366f1' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  order?: number;
}

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}

@Injectable()
export class CategoriesService extends CrudService<Category> {
  constructor(prisma: PrismaService, cache: CacheService) {
    super(prisma, cache, {
      model: 'category',
      resource: 'categories',
      searchFields: ['name', 'description'],
      defaultSort: { order: 'asc' },
      sortableFields: ['order', 'name'],
      slugFrom: 'name',
      hasOrder: true,
      include: { _count: { select: { projects: true, posts: true } } },
    });
  }
}

@ApiTags('categories')
@Controller('categories')
@Resource('categories')
export class CategoriesController extends CrudController<Category, CreateCategoryDto, UpdateCategoryDto> {
  constructor(categories: CategoriesService) {
    super(categories, 'categories');
  }

  @Post()
  @ApiBearerAuth()
  override create(@Body() dto: CreateCategoryDto) {
    return this.service.create({ ...dto });
  }

  @Patch(':id')
  @ApiBearerAuth()
  override update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.service.update(id, { ...dto });
  }
}
