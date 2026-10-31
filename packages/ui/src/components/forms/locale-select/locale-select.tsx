'use client';

import { forwardRef, useMemo, type ReactNode } from 'react';
import {
    COMMON_LANGUAGES,
    COUNTRY_CODES,
    FALLBACK_CURRENCIES,
    FALLBACK_TIME_ZONES,
    RENAMED_TIME_ZONES,
    isValidTimeZone,
    countryFlag,
    formatOffset,
    timeZoneOffsetMinutes,
} from '../../../lib/locale-data';
import { cn } from '../../../lib/cn';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../select/select';
import {
    SearchableSelect,
    type SearchableSelectOption,
    type SearchableSelectProps,
} from '../searchable-select/searchable-select';
import type { InputSize } from '../input/input-variants';

type BaseProps = Omit<SearchableSelectProps, 'options'>;

interface LocaleSelectProps extends BaseProps {
    /**
     * Language used for the option names, e.g. `"de"` shows "Deutschland".
     * @default the browser's locale
     */
    locale?: string;
    /** Values listed first, above the rest (e.g. the countries you operate in). */
    priority?: string[];
    /** Restrict the list to these values. */
    include?: string[];
}

function displayNames(
    locale: string | undefined,
    type: Intl.DisplayNamesOptions['type'],
) {
    try {
        return new Intl.DisplayNames(locale ? [locale] : undefined, {
            type,
            fallback: 'code',
        });
    } catch {
        return null;
    }
}

function supported(key: 'timeZone' | 'currency', fallback: string[]): string[] {
    const fn = (
        Intl as unknown as { supportedValuesOf?: (key: string) => string[] }
    ).supportedValuesOf;
    try {
        return fn ? fn(key) : fallback;
    } catch {
        return fallback;
    }
}

function arrange(
    options: SearchableSelectOption[],
    include?: string[],
    priority?: string[],
) {
    const filtered = include
        ? options.filter((o) => include.includes(o.value))
        : options;
    if (!priority?.length) return filtered;
    const first = priority
        .map((v) => filtered.find((o) => o.value === v))
        .filter(Boolean) as SearchableSelectOption[];
    return [...first, ...filtered.filter((o) => !priority.includes(o.value))];
}

const collator = (locale?: string) =>
    new Intl.Collator(locale, { sensitivity: 'base' });

export interface CountrySelectProps extends LocaleSelectProps {
    /**
     * Render the flag for a country code. Emoji flags are used by default; Windows shows them as
     * letters, so pass an image or icon library here if you need real flags on Windows.
     * @default emoji flag
     */
    renderFlag?: (code: string) => ReactNode;
}

/**
 * A searchable country picker. Value is the ISO 3166-1 alpha-2 code (`"IN"`, `"DE"`); names come
 * from `Intl.DisplayNames` in the user's language, so no data files are bundled.
 *
 * @example
 * <CountrySelect aria-label="Country" priority={['IN', 'US', 'GB']} value={country} onValueChange={setCountry} />
 */
export const CountrySelect = forwardRef<HTMLInputElement, CountrySelectProps>(
    function CountrySelect(
        {
            locale,
            priority,
            include,
            renderFlag,
            placeholder = 'Select a country',
            ...props
        },
        ref,
    ) {
        const options = useMemo(() => {
            const names = displayNames(locale, 'region');
            const flag =
                renderFlag ??
                ((code: string) => (
                    <span aria-hidden="true" className="text-base leading-none">
                        {countryFlag(code)}
                    </span>
                ));
            const list = COUNTRY_CODES.map((code) => ({
                value: code,
                label: names?.of(code) ?? code,
                keywords: [code],
                leading: flag(code),
            })).sort((a, b) => collator(locale).compare(a.label, b.label));
            return arrange(list, include, priority);
        }, [locale, priority, include, renderFlag]);

        return (
            <SearchableSelect
                ref={ref}
                data-slot="country-select"
                options={options}
                placeholder={placeholder}
                {...props}
            />
        );
    },
);

/**
 * A searchable time zone picker, sorted by UTC offset and labelled like
 * "(GMT+05:30) Asia/Kolkata". Value is the IANA name. Search matches the city and offset.
 *
 * @example
 * <TimezoneSelect aria-label="Time zone" defaultValue={Intl.DateTimeFormat().resolvedOptions().timeZone} />
 */
export const TimezoneSelect = forwardRef<HTMLInputElement, LocaleSelectProps>(
    function TimezoneSelect(
        {
            priority,
            include,
            placeholder = 'Select a time zone',
            locale: _locale,
            ...props
        },
        ref,
    ) {
        const current = props.value ?? props.defaultValue ?? null;
        const options = useMemo(() => {
            const now = new Date();
            const zones = new Set(
                supported('timeZone', FALLBACK_TIME_ZONES).map(
                    (z) => RENAMED_TIME_ZONES[z] ?? z,
                ),
            );
            // Always offer the field's own value, even if this runtime's list doesn't include it.
            if (current && !zones.has(current) && isValidTimeZone(current))
                zones.add(current);
            const list = [...zones]
                .map((zone) => {
                    const offset = timeZoneOffsetMinutes(zone, now);
                    const gmt = formatOffset(offset);
                    return {
                        value: zone,
                        label: `(${gmt}) ${zone.replace(/_/g, ' ')}`,
                        keywords: [
                            zone,
                            gmt,
                            zone.split('/').pop()?.replace(/_/g, ' ') ?? '',
                        ],
                        offset,
                    };
                })
                .sort((a, b) => a.offset - b.offset || a.value.localeCompare(b.value))
                .map(({ offset: _offset, ...option }) => option);
            return arrange(list, include, priority);
        }, [priority, include, current]);

        return (
            <SearchableSelect
                ref={ref}
                data-slot="timezone-select"
                options={options}
                placeholder={placeholder}
                {...props}
            />
        );
    },
);

export interface LanguageSelectProps extends LocaleSelectProps {
    /** BCP 47 codes to offer. @default ~50 common languages and regional variants */
    languages?: readonly string[];
    /** Also show each language's name in its own language, e.g. "German · Deutsch". @default true */
    showNativeName?: boolean;
}

/**
 * A searchable language picker. Value is a BCP 47 tag (`"en-IN"`, `"de"`). Names come from
 * `Intl.DisplayNames`, e.g. "English (India)".
 *
 * @example
 * <LanguageSelect aria-label="Default language" defaultValue="en-IN" />
 */
export const LanguageSelect = forwardRef<HTMLInputElement, LanguageSelectProps>(
    function LanguageSelect(
        {
            locale,
            priority,
            include,
            languages = COMMON_LANGUAGES,
            showNativeName = true,
            placeholder = 'Select a language',
            ...props
        },
        ref,
    ) {
        const options = useMemo(() => {
            const names = displayNames(locale, 'language');
            const list = languages
                .map((tag) => {
                    const label = names?.of(tag) ?? tag;
                    const native = displayNames(tag, 'language')?.of(tag);
                    return {
                        value: tag,
                        label,
                        keywords: [tag, native ?? ''],
                        trailing:
                            showNativeName && native && native !== label ? native : undefined,
                    };
                })
                .sort((a, b) => collator(locale).compare(a.label, b.label));
            return arrange(list, include, priority);
        }, [locale, priority, include, languages, showNativeName]);

        return (
            <SearchableSelect
                ref={ref}
                data-slot="language-select"
                options={options}
                placeholder={placeholder}
                {...props}
            />
        );
    },
);

/**
 * A searchable currency picker. Value is the ISO 4217 code (`"INR"`, `"EUR"`), shown with its
 * name and symbol.
 *
 * @example
 * <CurrencySelect aria-label="Currency" priority={['INR', 'USD', 'EUR']} defaultValue="INR" />
 */
export const CurrencySelect = forwardRef<HTMLInputElement, LocaleSelectProps>(
    function CurrencySelect(
        { locale, priority, include, placeholder = 'Select a currency', ...props },
        ref,
    ) {
        const options = useMemo(() => {
            const names = displayNames(locale, 'currency');
            const list = supported('currency', FALLBACK_CURRENCIES)
                .map((code) => {
                    let symbol = code;
                    try {
                        symbol =
                            new Intl.NumberFormat(locale, {
                                style: 'currency',
                                currency: code,
                                currencyDisplay: 'narrowSymbol',
                            })
                                .formatToParts(0)
                                .find((p) => p.type === 'currency')?.value ?? code;
                    } catch {
                        // Unknown to this runtime: keep the code.
                    }
                    return {
                        value: code,
                        label: `${names?.of(code) ?? code} (${code})`,
                        keywords: [code, symbol],
                        trailing: symbol !== code ? symbol : undefined,
                    };
                })
                .sort((a, b) => collator(locale).compare(a.label, b.label));
            return arrange(list, include, priority);
        }, [locale, priority, include]);

        return (
            <SearchableSelect
                ref={ref}
                data-slot="currency-select"
                options={options}
                placeholder={placeholder}
                {...props}
            />
        );
    },
);

/** A date format offered by `DateFormatSelect`. */
export interface DateFormatOption {
    /** The pattern stored as the value, e.g. `"DD/MM/YYYY"`. */
    value: string;
    /** Formats a date in this pattern, for the example shown next to it. */
    format: (date: Date) => string;
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Common date formats. Tokens: `DD` day, `MM` month, `MMM` short month name, `YYYY` year. */
export const defaultDateFormats: DateFormatOption[] = [
    {
        value: 'DD/MM/YYYY',
        format: (d) =>
            `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`,
    },
    {
        value: 'MM/DD/YYYY',
        format: (d) =>
            `${pad(d.getMonth() + 1)}/${pad(d.getDate())}/${d.getFullYear()}`,
    },
    {
        value: 'YYYY-MM-DD',
        format: (d) =>
            `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    },
    {
        value: 'DD.MM.YYYY',
        format: (d) =>
            `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`,
    },
    {
        value: 'DD MMM YYYY',
        format: (d) =>
            `${pad(d.getDate())} ${d.toLocaleString('en', { month: 'short' })} ${d.getFullYear()}`,
    },
    {
        value: 'MMM DD, YYYY',
        format: (d) =>
            `${d.toLocaleString('en', { month: 'short' })} ${pad(d.getDate())}, ${d.getFullYear()}`,
    },
];

export interface DateFormatSelectProps {
    /** Selected pattern (controlled). */
    value?: string | null;
    /** Initially selected pattern (uncontrolled). */
    defaultValue?: string | null;
    /** Called with the new pattern. */
    onValueChange?: (value: string | null) => void;
    /** Formats to offer. @default defaultDateFormats */
    formats?: DateFormatOption[];
    /** Show today's date in each format next to the pattern. @default true */
    showExample?: boolean;
    /** Form field name. */
    name?: string;
    /** Height and text size. @default 'md' */
    size?: InputSize;
    /** Disable the field. */
    disabled?: boolean;
    /** Text shown when nothing is selected. */
    placeholder?: string;
    /** Id of the trigger, for `<Label htmlFor>`. */
    id?: string;
    /** Accessible name when there's no visible label. */
    'aria-label'?: string;
    /** Extra classes for the trigger. */
    className?: string;
}

/**
 * Pick how dates are displayed (an organisation or user preference). Value is a pattern
 * string such as `"DD/MM/YYYY"`; each option shows today's date in that format.
 *
 * @example
 * <DateFormatSelect aria-label="Date format" defaultValue="DD/MM/YYYY" name="dateFormat" />
 */
export const DateFormatSelect = forwardRef<
    HTMLButtonElement,
    DateFormatSelectProps
>(function DateFormatSelect(
    {
        value,
        defaultValue,
        onValueChange,
        formats = defaultDateFormats,
        showExample = true,
        name,
        size,
        disabled,
        placeholder = 'Select a format',
        id,
        'aria-label': ariaLabel,
        className,
    },
    ref,
) {
    const today = useMemo(() => new Date(), []);
    const items = formats.map((f) => ({ value: f.value, label: f.value }));
    return (
        <Select<string>
            items={items}
            value={value}
            defaultValue={defaultValue}
            onValueChange={(v) => onValueChange?.(v)}
            name={name}
            disabled={disabled}
        >
            <SelectTrigger
                ref={ref}
                id={id}
                data-slot="date-format-select"
                aria-label={ariaLabel}
                size={size}
                className={cn(className)}
            >
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
                {formats.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                        <span className="flex w-full items-center justify-between gap-6">
                            <span>{f.value}</span>
                            {showExample && (
                                <span className="text-xs text-muted-foreground tabular-nums">
                                    {f.format(today)}
                                </span>
                            )}
                        </span>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
});
