import { describe, expect, it } from 'vitest';
import { compareSortValues, nextSortState } from './sort';

describe('compareSortValues', () => {
  it('sorts numbers numerically', () => {
    expect([10, 2, 33].sort(compareSortValues)).toEqual([2, 10, 33]);
  });

  it('sorts strings naturally and case-insensitively', () => {
    expect(['Item 10', 'item 2', 'Item 1'].sort(compareSortValues)).toEqual([
      'Item 1',
      'item 2',
      'Item 10',
    ]);
  });

  it('sorts dates chronologically', () => {
    const a = new Date('2026-01-02');
    const b = new Date('2025-12-31');
    expect([a, b].sort(compareSortValues)).toEqual([b, a]);
  });

  it('puts empty values last', () => {
    const sorted = [null, 'b', undefined, 'a', ''].sort(compareSortValues);
    expect(sorted.slice(0, 2)).toEqual(['a', 'b']);
    expect(sorted.slice(2)).toEqual(
      expect.arrayContaining([null, undefined, '']),
    );
  });

  it('treats empty values as equal to each other', () => {
    expect(compareSortValues(null, '')).toBe(0);
    expect(compareSortValues('a', null)).toBeLessThan(0);
    expect(compareSortValues(undefined, 'a')).toBeGreaterThan(0);
  });
});

describe('nextSortState', () => {
  it('cycles asc → desc → unsorted', () => {
    const asc = nextSortState(null, 'name');
    expect(asc).toEqual({ columnId: 'name', direction: 'asc' });
    const desc = nextSortState(asc, 'name');
    expect(desc).toEqual({ columnId: 'name', direction: 'desc' });
    expect(nextSortState(desc, 'name')).toBeNull();
  });

  it('starts ascending when switching columns', () => {
    expect(
      nextSortState({ columnId: 'name', direction: 'desc' }, 'date'),
    ).toEqual({
      columnId: 'date',
      direction: 'asc',
    });
  });
});
