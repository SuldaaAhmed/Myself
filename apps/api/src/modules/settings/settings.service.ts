import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CacheService } from '../../common/cache/cache.service';
import { PrismaService } from '../../common/prisma/prisma.service';

/** Settings whose contents are safe to expose on the public website. */
const PUBLIC_GROUPS = ['hero', 'about', 'contact', 'social', 'theme', 'seo', 'resume', 'general'];

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  async all() {
    return this.prisma.setting.findMany({ orderBy: [{ group: 'asc' }, { key: 'asc' }] });
  }

  async byGroup(group: string) {
    return this.prisma.setting.findMany({ where: { group }, orderBy: { key: 'asc' } });
  }

  async get<T = unknown>(key: string): Promise<T> {
    const setting = await this.prisma.setting.findUnique({ where: { key } });
    if (!setting) throw new NotFoundException(`Setting "${key}" not found`);
    return setting.value as T;
  }

  /** Upsert so the admin panel can create a document that was never seeded. */
  async set(key: string, value: Prisma.InputJsonValue, group = 'general', label?: string) {
    const setting = await this.prisma.setting.upsert({
      where: { key },
      create: { key, value, group, label },
      update: { value, ...(label ? { label } : {}) },
    });
    await this.cache.invalidate('settings');
    return setting;
  }

  async remove(key: string) {
    await this.prisma.setting.delete({ where: { key } });
    await this.cache.invalidate('settings');
    return { key };
  }

  /**
   * Flattened `{ key: value }` map of everything the website may read. Cached
   * because it is requested by every server-rendered page.
   */
  async publicSettings(): Promise<Record<string, unknown>> {
    return this.cache.wrap('settings:public', ['settings'], 300, async () => {
      const rows = await this.prisma.setting.findMany({ where: { group: { in: PUBLIC_GROUPS } } });
      return Object.fromEntries(rows.map((row) => [row.key, row.value]));
    });
  }
}
