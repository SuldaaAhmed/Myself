import { Body, Controller, Injectable, Param, Patch, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiProperty,
  ApiPropertyOptional,
  ApiTags,
  PartialType,
} from '@nestjs/swagger';
import { ContentStatus, GalleryItem } from '@prisma/client';
import { IsArray, IsEnum, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';
import { CacheService } from '../../common/cache/cache.service';
import { CrudController } from '../../common/crud/crud.controller';
import { CrudService } from '../../common/crud/crud.service';
import { Resource } from '../../common/decorators';
import { PrismaService } from '../../common/prisma/prisma.service';

export class CreateGalleryItemDto {
  @ApiProperty()
  @IsString()
  @MaxLength(160)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsString()
  imageUrl!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  thumbUrl?: string;

  @ApiPropertyOptional({ example: 'Conference talks' })
  @IsOptional()
  @IsString()
  album?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  width?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  height?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  order?: number;

  @ApiPropertyOptional({ enum: ContentStatus })
  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;
}

export class UpdateGalleryItemDto extends PartialType(CreateGalleryItemDto) {}

@Injectable()
export class GalleryService extends CrudService<GalleryItem> {
  constructor(prisma: PrismaService, cache: CacheService) {
    super(prisma, cache, {
      model: 'galleryItem',
      resource: 'gallery',
      searchFields: ['title', 'description', 'album'],
      defaultSort: { order: 'asc' },
      sortableFields: ['order', 'title', 'createdAt'],
      slugFrom: 'title',
      hasStatus: true,
      hasOrder: true,
      hasTags: true,
    });
  }
}

@ApiTags('gallery')
@Controller('gallery')
@Resource('gallery')
export class GalleryController extends CrudController<GalleryItem, CreateGalleryItemDto, UpdateGalleryItemDto> {
  constructor(gallery: GalleryService) {
    super(gallery, 'gallery');
  }

  @Post()
  @ApiBearerAuth()
  override create(@Body() dto: CreateGalleryItemDto) {
    return this.service.create({ ...dto });
  }

  @Patch(':id')
  @ApiBearerAuth()
  override update(@Param('id') id: string, @Body() dto: UpdateGalleryItemDto) {
    return this.service.update(id, { ...dto });
  }
}
