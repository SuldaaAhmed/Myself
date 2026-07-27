import { readingTime, slugify, uniqueSlug } from './slug';

describe('slugify', () => {
  it('lowercases and strips punctuation', () => {
    expect(slugify('Realtime Logistics: Control Tower!')).toBe('realtime-logistics-control-tower');
  });

  it('falls back to a usable value for empty input', async () => {
    expect(await uniqueSlug('', async () => false)).toBe('item');
  });
});

describe('uniqueSlug', () => {
  it('returns the base slug when nothing collides', async () => {
    expect(await uniqueSlug('My Project', async () => false)).toBe('my-project');
  });

  it('appends a counter until the slug is free', async () => {
    const taken = new Set(['my-project', 'my-project-2']);
    expect(await uniqueSlug('My Project', async (slug) => taken.has(slug))).toBe('my-project-3');
  });
});

describe('readingTime', () => {
  it('never returns less than a minute', () => {
    expect(readingTime('short')).toBe(1);
  });

  it('scales with word count', () => {
    expect(readingTime('word '.repeat(660))).toBe(3);
  });
});
