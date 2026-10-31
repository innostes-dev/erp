import { describe, expect, it } from 'vitest';
import {
    addMonths,
    compareDays,
    fromISODate,
    getMonthGrid,
    getWeekStartsOn,
    isSameDay,
    isWithinRange,
    startOfWeek,
    toISODate,
} from './date';

describe('date helpers', () => {
    it('clamps the day when adding months', () => {
        expect(toISODate(addMonths(new Date(2026, 0, 31), 1))).toBe('2026-02-28');
        expect(toISODate(addMonths(new Date(2024, 0, 31), 1))).toBe('2024-02-29');
        expect(toISODate(addMonths(new Date(2026, 2, 15), -3))).toBe('2025-12-15');
    });

    it('finds the start of the week for a given first day', () => {
        // Thu 22 Oct 2026
        expect(toISODate(startOfWeek(new Date(2026, 9, 22), 1))).toBe('2026-10-19');
        expect(toISODate(startOfWeek(new Date(2026, 9, 22), 0))).toBe('2026-10-18');
    });

    it('builds a 6×7 month grid starting on the week start', () => {
        const grid = getMonthGrid(new Date(2026, 9, 1), 1);
        expect(grid).toHaveLength(6);
        expect(grid.every((week) => week.length === 7)).toBe(true);
        expect(toISODate(grid[0]![0]!)).toBe('2026-09-28'); // Monday before Oct 1
        expect(grid[0]![0]!.getDay()).toBe(1);
    });

    it('compares calendar days ignoring time', () => {
        expect(compareDays(new Date(2026, 1, 1, 23), new Date(2026, 1, 1, 1))).toBe(
            0,
        );
        expect(isSameDay(new Date(2026, 1, 1, 9), new Date(2026, 1, 1, 18))).toBe(
            true,
        );
    });

    it('checks ranges in either order', () => {
        const d = new Date(2026, 4, 10);
        expect(isWithinRange(d, new Date(2026, 4, 1), new Date(2026, 4, 31))).toBe(
            true,
        );
        expect(isWithinRange(d, new Date(2026, 4, 31), new Date(2026, 4, 1))).toBe(
            true,
        );
        expect(isWithinRange(d, new Date(2026, 4, 11), new Date(2026, 4, 31))).toBe(
            false,
        );
    });

    it('round-trips ISO dates and rejects invalid ones', () => {
        expect(toISODate(fromISODate('2026-02-28')!)).toBe('2026-02-28');
        expect(fromISODate('2026-02-30')).toBeNull();
        expect(fromISODate('28/02/2026')).toBeNull();
    });

    it('knows the first day of the week per locale', () => {
        expect(getWeekStartsOn('en-US')).toBe(0);
        expect(getWeekStartsOn('de-DE')).toBe(1);
    });
});
