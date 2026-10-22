import { describe, expect, it } from 'vitest';
import { getPaginationRange } from './use-pagination';

describe('getPaginationRange', () => {
  it('returns nothing for zero pages', () => {
    expect(getPaginationRange({ page: 1, pageCount: 0 })).toEqual([]);
  });

  it('shows every page when they fit', () => {
    expect(getPaginationRange({ page: 3, pageCount: 7 })).toEqual([
      1, 2, 3, 4, 5, 6, 7,
    ]);
  });

  it('collapses the end near the start', () => {
    expect(getPaginationRange({ page: 1, pageCount: 20 })).toEqual([
      1,
      2,
      3,
      4,
      5,
      'ellipsis-end',
      20,
    ]);
  });

  it('collapses both sides in the middle', () => {
    expect(getPaginationRange({ page: 10, pageCount: 20 })).toEqual([
      1,
      'ellipsis-start',
      9,
      10,
      11,
      'ellipsis-end',
      20,
    ]);
  });

  it('collapses the start near the end', () => {
    expect(getPaginationRange({ page: 20, pageCount: 20 })).toEqual([
      1,
      'ellipsis-start',
      16,
      17,
      18,
      19,
      20,
    ]);
  });

  it('keeps a constant number of items so controls do not jump', () => {
    for (let page = 1; page <= 30; page++) {
      expect(getPaginationRange({ page, pageCount: 30 })).toHaveLength(7);
    }
  });

  it('clamps out-of-range pages', () => {
    expect(getPaginationRange({ page: 99, pageCount: 5 })).toEqual([
      1, 2, 3, 4, 5,
    ]);
    expect(getPaginationRange({ page: -3, pageCount: 20 })[0]).toBe(1);
  });

  it('respects siblingCount and boundaryCount', () => {
    expect(
      getPaginationRange({
        page: 10,
        pageCount: 20,
        siblingCount: 2,
        boundaryCount: 2,
      }),
    ).toEqual([
      1,
      2,
      'ellipsis-start',
      8,
      9,
      10,
      11,
      12,
      'ellipsis-end',
      19,
      20,
    ]);
  });
});
