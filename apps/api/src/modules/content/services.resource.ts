import { Body, Controller, Injectable, Param, Patch, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiProperty,
  ApiPropertyOptional,
  ApiTags,
  PartialType,
} from '@nestjs/swagger';
import { ContentStatus, Service } from '@prisma/client';
import { IsArray, IsEnum, IsInt, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { CacheService } from '../../common/cache/cache.service';
import { CrudController } from '../../common/crud/crud.controller';
import { CrudService } from '../../common/crud/crud.service';
import { Resource } from '../../common/decorators';
import { PrismaService } from '../../common/prisma/prisma.service';

export class CreateServiceDto {
  @ApiProperty({ example: 'Product engineering' })
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiProperty()
  @IsString()
  @MaxLength(600)
  description!: string;

  @ApiPropertyOptional({ description: 'lucide-react icon name', example: 'Layers' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @ApiPropertyOptional({ example: 'from $4k' })
  @IsOptional()
  @IsString()
  priceFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  order?: number;

  @ApiPropertyOptional({ enum: ContentStatus })
  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;
}

export class UpdateServiceDto extends PartialType(CreateServiceDto) {}

@Injectable()
export class ServicesService extends CrudService<Service> {
  constructor(prisma: PrismaService, cache: CacheService) {
    super(prisma, cache, {
      model: 'service',
      resource: 'services',
      searchFields: ['title', 'description'],
      defaultSort: { order: 'asc' },
      sortableFields: ['order', 'title', 'createdAt'],
      slugFrom: 'title',
      hasStatus: true,
      hasOrder: true,
    });
  }
}

@ApiTags('services')
@Controller('services')
@Resource('services')
export class ServicesController extends CrudController<Service, CreateServiceDto, UpdateServiceDto> {
  constructor(services: ServicesService) {
    super(services, 'services');
  }

  @Post()
  @ApiBearerAuth()
  override create(@Body() dto: CreateServiceDto) {
    return this.service.create({ ...dto });
  }

  @Patch(':id')
  @ApiBearerAuth()
  override update(@Param('id') id: string, @Body() dto: UpdateServiceDto) {
    return this.service.update(id, { ...dto });
  }
}
