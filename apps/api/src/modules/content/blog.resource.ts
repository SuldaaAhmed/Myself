import { Body, Controller, Injectable, Param, Patch, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiProperty,
  ApiPropertyOptional,
  ApiTags,
  PartialType,
} from '@nestjs/swagger';
import { ContentStatus, Post as BlogPost } from '@prisma/client';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { CacheService } from '../../common/cache/cache.service';
import { CrudController } from '../../common/crud/crud.controller';
import { CrudService } from '../../common/crud/crud.service';
import { CurrentUser, Public, Resource } from '../../common/decorators';
import type { AuthenticatedUser } from '../../common/decorators';
import { PrismaService } from '../../common/prisma/prisma.service';
import { readingTime } from '../../common/utils/slug';

export class CreatePostDto {
  @ApiProperty({ example: 'Designing for the first 400 milliseconds' })
  @IsString()
  @MinLength(3)
  @MaxLength(180)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiProperty({ description: 'Card and meta-description copy' })
  @IsString()
  @MaxLength(400)
  excerpt!: string;

  @ApiProperty({ description: 'Markdown body' })
  @IsString()
  content!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  coverUrl?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  order?: number;

  @ApiPropertyOptional({ enum: ContentStatus })
  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;
}

export class UpdatePostDto extends PartialType(CreatePostDto) {}

@Injectable()
export class BlogService extends CrudService<BlogPost> {
  constructor(prisma: PrismaService, cache: CacheService) {
    super(prisma, cache, {
      model: 'post',
      resource: 'blog',
      searchFields: ['title', 'excerpt', 'content'],
      defaultSort: { publishedAt: 'desc' },
      sortableFields: ['publishedAt', 'createdAt', 'title', 'views', 'order'],
      include: {
        category: true,
        author: { select: { id: true, name: true, avatarUrl: true, jobTitle: true } },
      },
      slugFrom: 'title',
      hasStatus: true,
      hasPublishedAt: true,
      hasOrder: true,
      hasFeatured: true,
      hasTags: true,
      hasCategory: true,
    });
  }

  protected override async beforeWrite(data: Record<string, unknown>) {
    if (typeof data.content === 'string') {
      data.readingTime = readingTime(data.content);
    }
    return data;
  }

  async createAs(authorId: string, dto: Record<string, unknown>) {
    return this.create({ ...dto, authorId });
  }

  async trackView(slug: string): Promise<void> {
    await this.prisma.post.updateMany({ where: { slug }, data: { views: { increment: 1 } } });
  }
}

@ApiTags('blog')
@Controller('blog')
@Resource('blog')
export class BlogController extends CrudController<BlogPost, CreatePostDto, UpdatePostDto> {
  constructor(private readonly blog: BlogService) {
    super(blog, 'blog');
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a post (authored by the current user)' })
  override create(@Body() dto: CreatePostDto, @CurrentUser() user?: AuthenticatedUser) {
    return this.blog.createAs(user!.id, { ...dto });
  }

  @Patch(':id')
  @ApiBearerAuth()
  override update(@Param('id') id: string, @Body() dto: UpdatePostDto) {
    return this.service.update(id, { ...dto });
  }

  @Post(':slug/views')
  @Public()
  @ApiOperation({ summary: 'Increment the read counter for a post' })
  async trackView(@Param('slug') slug: string): Promise<{ ok: true }> {
    await this.blog.trackView(slug);
    return { ok: true };
  }
}
