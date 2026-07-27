import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ContentStatus } from '@prisma/client';

const toBool = ({ value }: { value: unknown }) =>
  typeof value === 'boolean' ? value : ['1', 'true', 'yes'].includes(String(value).toLowerCase());

export class PaginationQueryDto {
  /** 1-based page number. */
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  /** Items per page (max 100). */
  @ApiPropertyOptional({ default: 12, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 12;

  /** Free-text search across the resource's searchable columns. */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  q?: string;

  /** `field:direction`, e.g. `createdAt:desc`. */
  @ApiPropertyOptional({ example: 'order:asc' })
  @IsOptional()
  @IsString()
  sort?: string;

  @ApiPropertyOptional({ enum: ContentStatus })
  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tag?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(toBool)
  @IsBoolean()
  featured?: boolean;

  /**
   * Admin-only: include drafts and archived records. Ignored for callers
   * without the matching `:read` permission.
   */
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @Transform(toBool)
  @IsBoolean()
  includeUnpublished?: boolean;

  get skip(): number {
    return (this.page - 1) * this.limit;
  }
}

export class PaginationMetaDto {
  @ApiProperty() total!: number;
  @ApiProperty() page!: number;
  @ApiProperty() limit!: number;
  @ApiProperty() pageCount!: number;
  @ApiProperty() hasNextPage!: boolean;
  @ApiProperty() hasPreviousPage!: boolean;
}

export class PaginatedDto<T> {
  data!: T[];
  @ApiProperty({ type: PaginationMetaDto }) meta!: PaginationMetaDto;
}

export function paginate<T>(data: T[], total: number, page: number, limit: number): PaginatedDto<T> {
  const pageCount = Math.max(1, Math.ceil(total / limit));
  return {
    data,
    meta: {
      total,
      page,
      limit,
      pageCount,
      hasNextPage: page < pageCount,
      hasPreviousPage: page > 1,
    },
  };
}

export class ReorderDto {
  @ApiProperty({ type: [String], description: 'Record ids in their new display order' })
  @IsString({ each: true })
  ids!: string[];
}
