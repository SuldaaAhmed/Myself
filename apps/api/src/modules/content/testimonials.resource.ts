import { Body, Controller, Injectable, Param, Patch, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiProperty,
  ApiPropertyOptional,
  ApiTags,
  PartialType,
} from '@nestjs/swagger';
import { ContentStatus, Testimonial } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { CacheService } from '../../common/cache/cache.service';
import { CrudController } from '../../common/crud/crud.controller';
import { CrudService } from '../../common/crud/crud.service';
import { Resource } from '../../common/decorators';
import { PrismaService } from '../../common/prisma/prisma.service';

export class CreateTestimonialDto {
  @ApiProperty({ example: 'Amina Yusuf' })
  @IsString()
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({ example: 'VP Engineering' })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional({ example: 'Northwind Labs' })
  @IsOptional()
  @IsString()
  company?: string;

  @ApiProperty()
  @IsString()
  @MaxLength(900)
  quote!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 5, default: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

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

export class UpdateTestimonialDto extends PartialType(CreateTestimonialDto) {}

@Injectable()
export class TestimonialsService extends CrudService<Testimonial> {
  constructor(prisma: PrismaService, cache: CacheService) {
    super(prisma, cache, {
      model: 'testimonial',
      resource: 'testimonials',
      searchFields: ['name', 'company', 'quote'],
      defaultSort: { order: 'asc' },
      sortableFields: ['order', 'name', 'rating', 'createdAt'],
      slugFrom: 'name',
      hasStatus: true,
      hasOrder: true,
      hasFeatured: true,
    });
  }
}

@ApiTags('testimonials')
@Controller('testimonials')
@Resource('testimonials')
export class TestimonialsController extends CrudController<Testimonial, CreateTestimonialDto, UpdateTestimonialDto> {
  constructor(testimonials: TestimonialsService) {
    super(testimonials, 'testimonials');
  }

  @Post()
  @ApiBearerAuth()
  override create(@Body() dto: CreateTestimonialDto) {
    return this.service.create({ ...dto });
  }

  @Patch(':id')
  @ApiBearerAuth()
  override update(@Param('id') id: string, @Body() dto: UpdateTestimonialDto) {
    return this.service.update(id, { ...dto });
  }
}
