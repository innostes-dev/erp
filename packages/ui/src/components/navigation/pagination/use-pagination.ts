/** A page number, or an ellipsis standing in for a run of hidden pages. */
export type PaginationRangeItem = number | 'ellipsis-start' | 'ellipsis-end';

export interface UsePaginationOptions {
    /** Current page, starting at 1. */
    page: number;
    /** Total number of pages. */
    pageCount: number;
    /**
     * Pages shown on each side of the current page.
     * @default 1
     */
    siblingCount?: number;
    /**
     * Pages always shown at the start and end.
     * @default 1
     */
    boundaryCount?: number;
}

/**
 * Computes which page numbers and ellipses to show. Framework-free, so it can drive any
 * pagination UI. Server-safe.
 *
 * @example
 * getPaginationRange({ page: 6, pageCount: 20 })
 * // → [1, 'ellipsis-start', 5, 6, 7, 'ellipsis-end', 20]
 */
export function getPaginationRange({
    page,
    pageCount,
    siblingCount = 1,
    boundaryCount = 1,
}: UsePaginationOptions): PaginationRangeItem[] {
    const total = Math.max(0, Math.floor(pageCount));
    if (total === 0) return [];
    const current = Math.min(Math.max(1, Math.floor(page)), total);

    const range = (start: number, end: number) =>
        Array.from({ length: Math.max(0, end - start + 1) }, (_, i) => start + i);

    // Everything fits: boundaries + siblings + current + 2 ellipsis slots.
    const maxVisible = boundaryCount * 2 + siblingCount * 2 + 3;
    if (total <= maxVisible) return range(1, total);

    const startPages = range(1, boundaryCount);
    const endPages = range(total - boundaryCount + 1, total);

    const siblingsStart = Math.max(
        Math.min(
            current - siblingCount,
            total - boundaryCount - siblingCount * 2 - 1,
        ),
        boundaryCount + 2,
    );
    const siblingsEnd = Math.min(
        Math.max(current + siblingCount, boundaryCount + siblingCount * 2 + 2),
        total - boundaryCount - 1,
    );

    return [
        ...startPages,
        siblingsStart > boundaryCount + 2 ? 'ellipsis-start' : boundaryCount + 1,
        ...range(siblingsStart, siblingsEnd),
        siblingsEnd < total - boundaryCount - 1
            ? 'ellipsis-end'
            : total - boundaryCount,
        ...endPages,
    ];
}
