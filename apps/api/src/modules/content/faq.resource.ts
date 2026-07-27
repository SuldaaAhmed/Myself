import { Body, Controller, Injectable, Param, Patch, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiProperty,
  ApiPropertyOptional,
  ApiTags,
  PartialType,
} from '@nestjs/swagger';
import { ContentStatus, Faq } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';
import { CacheService } from '../../common/cache/cache.service';
import { CrudController } from '../../common/crud/crud.controller';
import { CrudService } from '../../common/crud/crud.service';
import { Resource } from '../../common/decorators';
import { PrismaService } from '../../common/prisma/prisma.service';

export class CreateFaqDto {
  @ApiProperty({ example: 'How do you price a project?' })
  @IsString()
  @MaxLength(240)
  question!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiProperty()
  @IsString()
  answer!: string;

  @ApiPropertyOptional({ example: 'Working together' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  order?: number;

  @ApiPropertyOptional({ enum: ContentStatus })
  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;
}

export class UpdateFaqDto extends PartialType(CreateFaqDto) {}

@Injectable()
export class FaqService extends CrudService<Faq> {
  constructor(prisma: PrismaService, cache: CacheService) {
    super(prisma, cache, {
      model: 'faq',
      resource: 'faq',
      searchFields: ['question', 'answer', 'category'],
      defaultSort: { order: 'asc' },
      sortableFields: ['order', 'question', 'createdAt'],
      slugFrom: 'question',
      hasStatus: true,
      hasOrder: true,
    });
  }
}

@ApiTags('faq')
@Controller('faq')
@Resource('faq')
export class FaqController extends CrudController<Faq, CreateFaqDto, UpdateFaqDto> {
  constructor(faq: FaqService) {
    super(faq, 'faq');
  }

  @Post()
  @ApiBearerAuth()
  override create(@Body() dto: CreateFaqDto) {
    return this.service.create({ ...dto });
  }

  @Patch(':id')
  @ApiBearerAuth()
  override update(@Param('id') id: string, @Body() dto: UpdateFaqDto) {
    return this.service.update(id, { ...dto });
  }
}
