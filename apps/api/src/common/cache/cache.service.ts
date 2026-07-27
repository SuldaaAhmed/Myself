import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Cache } from 'cache-manager';

/**
 * Thin tag-aware layer over cache-manager. Each cached entry registers itself
 * under one or more resource tags, so a single mutation can drop exactly the
 * entries it invalidates — this works with the in-memory store in development
 * and with Redis in production because the tag index lives in the cache too.
 */
@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  private tagKey(tag: string): string {
    return `tag:${tag}`;
  }

  async wrap<T>(key: string, tags: string[], ttlSeconds: number, factory: () => Promise<T>): Promise<T> {
    try {
      const hit = await this.cache.get<T>(key);
      if (hit !== undefined && hit !== null) return hit;
    } catch (error) {
      this.logger.warn(`Cache read failed for ${key}: ${(error as Error).message}`);
    }

    const value = await factory();

    try {
      await this.cache.set(key, value, ttlSeconds * 1000);
      await Promise.all(tags.map((tag) => this.register(tag, key)));
    } catch (error) {
      this.logger.warn(`Cache write failed for ${key}: ${(error as Error).message}`);
    }

    return value;
  }

  private async register(tag: string, key: string): Promise<void> {
    const index = (await this.cache.get<string[]>(this.tagKey(tag))) ?? [];
    if (!index.includes(key)) {
      index.push(key);
      await this.cache.set(this.tagKey(tag), index, 0);
    }
  }

  async invalidate(...tags: string[]): Promise<void> {
    try {
      for (const tag of tags) {
        const index = (await this.cache.get<string[]>(this.tagKey(tag))) ?? [];
        await Promise.all(index.map((key) => this.cache.del(key)));
        await this.cache.del(this.tagKey(tag));
      }
    } catch (error) {
      this.logger.warn(`Cache invalidation failed: ${(error as Error).message}`);
    }
  }
}
