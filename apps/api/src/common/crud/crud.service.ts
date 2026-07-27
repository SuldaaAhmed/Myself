import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ContentStatus } from '@prisma/client';
import { PaginatedDto, PaginationQueryDto, paginate } from '../dto/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../cache/cache.service';
import { uniqueSlug } from '../utils/slug';

export interface CrudOptions {
  /** Prisma delegate name, e.g. `project`. */
  model: string;
  /** Public resource name used for permissions, cache tags and audit rows. */
  resource: string;
  /** Columns searched by `?q=`. */
  searchFields: string[];
  /** Default ordering when the caller does not pass `?sort=`. */
  defaultSort: Record<string, 'asc' | 'desc'>;
  /** Columns the client is allowed to sort by. */
  sortableFields: string[];
  include?: Record<string, unknown>;
  /** Field the slug is derived from, when the model has a slug. */
  slugFrom?: string;
  /** Model has a `status` column and therefore draft/publish support. */
  hasStatus?: boolean;
  /** Model has a `publishedAt` column, stamped on first publish. */
  hasPublishedAt?: boolean;
  hasOrder?: boolean;
  hasFeatured?: boolean;
  hasTags?: boolean;
  hasCategory?: boolean;
  cacheTtlSeconds?: number;
}

type Delegate = {
  findMany: (args: unknown) => Promise<unknown[]>;
  findFirst: (args: unknown) => Promise<unknown>;
  findUnique: (args: unknown) => Promise<unknown>;
  count: (args?: unknown) => Promise<number>;
  create: (args: unknown) => Promise<{ id: string }>;
  update: (args: unknown) => Promise<{ id: string }>;
  delete: (args: unknown) => Promise<{ id: string }>;
};

/**
 * Every content resource shares the same lifecycle: paginate, search, sort,
 * publish/draft, slug, ordering, cache invalidation. That behaviour lives here
 * once; resource services only declare their shape and any extra rules.
 */
export abstract class CrudService<TRecord extends { id: string }> {
  protected constructor(
    protected readonly prisma: PrismaService,
    protected readonly cache: CacheService,
    protected readonly options: CrudOptions,
  ) {}

  protected get delegate(): Delegate {
    const delegate = (this.prisma as unknown as Record<string, Delegate>)[this.options.model];
    if (!delegate) throw new Error(`Unknown Prisma model "${this.options.model}"`);
    return delegate;
  }

  /** Hook for resources that need to massage payloads (relations, slugs, …). */
  protected async beforeWrite(
    data: Record<string, unknown>,
    _context: { mode: 'create' | 'update'; existing?: TRecord },
  ): Promise<Record<string, unknown>> {
    return data;
  }

  protected buildWhere(query: PaginationQueryDto, canSeeUnpublished: boolean): Record<string, unknown> {
    const where: Record<string, unknown> = {};
    const { q, status, category, tag, featured } = query;

    if (q && this.options.searchFields.length > 0) {
      where.OR = this.options.searchFields.map((field) => ({
        [field]: { contains: q, mode: 'insensitive' },
      }));
    }

    if (this.options.hasStatus) {
      if (status && canSeeUnpublished) {
        where.status = status;
      } else if (!canSeeUnpublished || !query.includeUnpublished) {
        where.status = ContentStatus.PUBLISHED;
      }
    }

    if (this.options.hasCategory && category) {
      where.category = { slug: category };
    }

    if (this.options.hasTags && tag) {
      where.tags = { has: tag };
    }

    if (this.options.hasFeatured && featured !== undefined) {
      where.featured = featured;
    }

    return where;
  }

  protected buildOrderBy(sort?: string): Record<string, 'asc' | 'desc'> {
    if (!sort) return this.options.defaultSort;
    const [field, direction = 'asc'] = sort.split(':');
    if (!this.options.sortableFields.includes(field)) {
      throw new BadRequestException(
        `Cannot sort by "${field}". Allowed: ${this.options.sortableFields.join(', ')}`,
      );
    }
    return { [field]: direction === 'desc' ? 'desc' : 'asc' };
  }

  async list(query: PaginationQueryDto, canSeeUnpublished = false): Promise<PaginatedDto<TRecord>> {
    const where = this.buildWhere(query, canSeeUnpublished);
    const orderBy = this.buildOrderBy(query.sort);
    const args = {
      where,
      orderBy,
      skip: query.skip,
      take: query.limit,
      include: this.options.include,
    };

    const run = async () => {
      const [rows, total] = await Promise.all([
        this.delegate.findMany(args) as Promise<TRecord[]>,
        this.delegate.count({ where }),
      ]);
      return paginate(rows, total, query.page, query.limit);
    };

    // Only anonymous, published reads are cacheable.
    if (canSeeUnpublished) return run();

    const key = `${this.options.resource}:list:${JSON.stringify({ where, orderBy, page: query.page, limit: query.limit })}`;
    return this.cache.wrap(key, [this.options.resource], this.options.cacheTtlSeconds ?? 60, run);
  }

  async findOne(idOrSlug: string, canSeeUnpublished = false): Promise<TRecord> {
    const or: Record<string, unknown>[] = [{ id: idOrSlug }];
    if (this.options.slugFrom) or.push({ slug: idOrSlug });

    const where: Record<string, unknown> = { OR: or };
    if (this.options.hasStatus && !canSeeUnpublished) where.status = ContentStatus.PUBLISHED;

    const record = (await this.delegate.findFirst({ where, include: this.options.include })) as
      | TRecord
      | null;

    if (!record) throw new NotFoundException(`${this.options.resource} "${idOrSlug}" not found`);
    return record;
  }

  async create(dto: Record<string, unknown>): Promise<TRecord> {
    const data = await this.withSlug(await this.beforeWrite({ ...dto }, { mode: 'create' }));
    this.stampPublishedAt(data, undefined);
    const created = (await this.delegate.create({
      data,
      include: this.options.include,
    })) as unknown as TRecord;
    await this.cache.invalidate(this.options.resource);
    return created;
  }

  async update(id: string, dto: Record<string, unknown>): Promise<TRecord> {
    const existing = await this.findOne(id, true);
    const data = await this.beforeWrite({ ...dto }, { mode: 'update', existing });
    this.stampPublishedAt(data, existing as unknown as Record<string, unknown>);

    const updated = (await this.delegate.update({
      where: { id: existing.id },
      data,
      include: this.options.include,
    })) as unknown as TRecord;

    await this.cache.invalidate(this.options.resource);
    return updated;
  }

  async remove(id: string): Promise<{ id: string }> {
    const existing = await this.findOne(id, true);
    await this.delegate.delete({ where: { id: existing.id } });
    await this.cache.invalidate(this.options.resource);
    return { id: existing.id };
  }

  /** Persists a drag-and-drop ordering coming from the admin dashboard. */
  async reorder(ids: string[]): Promise<{ updated: number }> {
    if (!this.options.hasOrder) {
      throw new BadRequestException(`${this.options.resource} is not orderable`);
    }
    await this.prisma.$transaction(async (tx) => {
      const delegate = (tx as unknown as Record<
        string,
        { update: (args: unknown) => Promise<unknown> }
      >)[this.options.model];

      for (const [index, id] of ids.entries()) {
        await delegate.update({ where: { id }, data: { order: index } });
      }
    });
    await this.cache.invalidate(this.options.resource);
    return { updated: ids.length };
  }

  private async withSlug(data: Record<string, unknown>): Promise<Record<string, unknown>> {
    const source = this.options.slugFrom;
    if (!source || data.slug) return data;
    const seed = String(data[source] ?? '');
    if (!seed) return data;

    data.slug = await uniqueSlug(seed, async (candidate) =>
      Boolean(await this.delegate.findFirst({ where: { slug: candidate }, select: { id: true } })),
    );
    return data;
  }

  private stampPublishedAt(
    data: Record<string, unknown>,
    existing?: Record<string, unknown>,
  ): void {
    if (!this.options.hasPublishedAt) return;
    const becomingPublished =
      data.status === ContentStatus.PUBLISHED && existing?.status !== ContentStatus.PUBLISHED;
    if (becomingPublished && !data.publishedAt && !existing?.publishedAt) {
      data.publishedAt = new Date();
    }
  }
}
