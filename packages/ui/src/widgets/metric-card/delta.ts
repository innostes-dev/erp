/** Direction of a change. */
export type Trend = 'up' | 'down' | 'neutral';

/** How a change should be read: good, bad, or neither. */
export type Sentiment = 'positive' | 'negative' | 'neutral';

/**
 * Works out the trend of a delta: from a number's sign, or from a leading `+` / `-` / `−`
 * in a string. Server-safe.
 */
export function getTrend(delta: number | string | null | undefined): Trend {
    if (delta === null || delta === undefined) return 'neutral';
    if (typeof delta === 'number')
        return delta > 0 ? 'up' : delta < 0 ? 'down' : 'neutral';
    const text = delta.trim();
    if (/^[-−]/.test(text)) return 'down';
    if (/^\+/.test(text)) return 'up';
    return 'neutral';
}

/** Whether a trend is good news. `upIsGood: false` for metrics like churn or costs. */
export function getSentiment(trend: Trend, upIsGood = true): Sentiment {
    if (trend === 'neutral') return 'neutral';
    return (trend === 'up') === upIsGood ? 'positive' : 'negative';
}

/**
 * Formats a numeric delta. Numbers are fractions: `0.124` → `+12.4%`.
 * Pass `options` for other formats, e.g. `{ style: 'decimal', signDisplay: 'exceptZero' }`.
 */
export function formatDelta(
    delta: number | string,
    locale?: string,
    options: Intl.NumberFormatOptions = {
        style: 'percent',
        maximumFractionDigits: 1,
        signDisplay: 'exceptZero',
    },
): string {
    return typeof delta === 'number'
        ? new Intl.NumberFormat(locale, options).format(delta)
        : delta;
}
