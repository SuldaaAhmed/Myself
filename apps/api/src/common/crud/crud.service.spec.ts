import { BadRequestException } from '@nestjs/common';
import { ContentStatus } from '@prisma/client';
import { PaginationQueryDto } from '../dto/pagination.dto';
import type { CacheService } from '../cache/cache.service';
import type { PrismaService } from '../prisma/prisma.service';
import { CrudService } from './crud.service';

interface Row {
  id: string;
}

/** Minimal concrete subclass so the shared behaviour can be exercised directly. */
class TestService extends CrudService<Row> {
  constructor() {
    super({} as PrismaService, {} as CacheService, {
      model: 'project',
      resource: 'projects',
      searchFields: ['title', 'summary'],
      defaultSort: { order: 'asc' },
      sortableFields: ['order', 'title'],
      slugFrom: 'title',
      hasStatus: true,
      hasCategory: true,
      hasTags: true,
      hasFeatured: true,
    });
  }

  where(query: PaginationQueryDto, canSeeUnpublished: boolean) {
    return this.buildWhere(query, canSeeUnpublished);
  }

  order(sort?: string) {
    return this.buildOrderBy(sort);
  }
}

const query = (overrides: Partial<PaginationQueryDto> = {}): PaginationQueryDto =>
  Object.assign(new PaginationQueryDto(), overrides);

describe('CrudService.buildWhere', () => {
  const service = new TestService();

  it('restricts anonymous callers to published records', () => {
    expect(service.where(query(), false)).toEqual({ status: ContentStatus.PUBLISHED });
  });

  it('still hides drafts from an admin who did not ask for them', () => {
    expect(service.where(query(), true)).toEqual({ status: ContentStatus.PUBLISHED });
  });

  it('returns everything when an admin opts in', () => {
    expect(service.where(query({ includeUnpublished: true }), true)).toEqual({});
  });

  it('ignores includeUnpublished from callers without permission', () => {
    expect(service.where(query({ includeUnpublished: true }), false)).toEqual({
      status: ContentStatus.PUBLISHED,
    });
  });

  it('filters by an explicit status for permitted callers', () => {
    expect(service.where(query({ status: ContentStatus.DRAFT }), true)).toEqual({
      status: ContentStatus.DRAFT,
    });
  });

  it('builds a case-insensitive OR across the searchable columns', () => {
    expect(service.where(query({ q: 'latency' }), false).OR).toEqual([
      { title: { contains: 'latency', mode: 'insensitive' } },
      { summary: { contains: 'latency', mode: 'insensitive' } },
    ]);
  });

  it('applies category, tag and featured filters', () => {
    const where = service.where(query({ category: 'web', tag: 'perf', featured: true }), false);
    expect(where).toMatchObject({
      category: { slug: 'web' },
      tags: { has: 'perf' },
      featured: true,
    });
  });
});

describe('CrudService.buildOrderBy', () => {
  const service = new TestService();

  it('falls back to the default ordering', () => {
    expect(service.order()).toEqual({ order: 'asc' });
  });

  it('accepts an allowed field and direction', () => {
    expect(service.order('title:desc')).toEqual({ title: 'desc' });
  });

  it('rejects fields that are not explicitly sortable', () => {
    expect(() => service.order('passwordHash:asc')).toThrow(BadRequestException);
  });
});

describe('PaginationQueryDto', () => {
  it('computes skip from page and limit', () => {
    expect(query({ page: 3, limit: 12 }).skip).toBe(24);
  });
});
