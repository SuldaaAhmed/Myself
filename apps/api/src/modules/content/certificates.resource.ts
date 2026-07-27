import { Body, Controller, Injectable, Param, Patch, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiProperty,
  ApiPropertyOptional,
  ApiTags,
  PartialType,
} from '@nestjs/swagger';
import { Certificate, ContentStatus } from '@prisma/client';
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';
import { CacheService } from '../../common/cache/cache.service';
import { CrudController } from '../../common/crud/crud.controller';
import { CrudService } from '../../common/crud/crud.service';
import { Resource } from '../../common/decorators';
import { PrismaService } from '../../common/prisma/prisma.service';

export class CreateCertificateDto {
  @ApiProperty({ example: 'AWS Certified Solutions Architect' })
  @IsString()
  @MaxLength(180)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiProperty({ example: 'Amazon Web Services' })
  @IsString()
  @MaxLength(120)
  issuer!: string;

  @ApiProperty({ example: '2025-03-14' })
  @IsDateString()
  issuedAt!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  credentialId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  credentialUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  order?: number;

  @ApiPropertyOptional({ enum: ContentStatus })
  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;
}

export class UpdateCertificateDto extends PartialType(CreateCertificateDto) {}

@Injectable()
export class CertificatesService extends CrudService<Certificate> {
  constructor(prisma: PrismaService, cache: CacheService) {
    super(prisma, cache, {
      model: 'certificate',
      resource: 'certificates',
      searchFields: ['title', 'issuer', 'credentialId'],
      defaultSort: { issuedAt: 'desc' },
      sortableFields: ['issuedAt', 'order', 'title', 'issuer'],
      slugFrom: 'title',
      hasStatus: true,
      hasOrder: true,
    });
  }
}

@ApiTags('certificates')
@Controller('certificates')
@Resource('certificates')
export class CertificatesController extends CrudController<Certificate, CreateCertificateDto, UpdateCertificateDto> {
  constructor(certificates: CertificatesService) {
    super(certificates, 'certificates');
  }

  @Post()
  @ApiBearerAuth()
  override create(@Body() dto: CreateCertificateDto) {
    return this.service.create({ ...dto });
  }

  @Patch(':id')
  @ApiBearerAuth()
  override update(@Param('id') id: string, @Body() dto: UpdateCertificateDto) {
    return this.service.update(id, { ...dto });
  }
}
