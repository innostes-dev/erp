import type { ComponentProps, ReactElement } from 'react';
import { cloneElement, isValidElement, forwardRef } from 'react';
import { cn } from '../../../lib/cn';
import { ChevronRightIcon, MoreHorizontalIcon } from '../../../lib/icons';

/**
 * Shows where the current page sits in the app's hierarchy, with links to each level.
 *
 * @example
 * <Breadcrumb>
 *   <BreadcrumbList>
 *     <BreadcrumbItem><BreadcrumbLink href="/">Home</BreadcrumbLink></BreadcrumbItem>
 *     <BreadcrumbSeparator />
 *     <BreadcrumbItem><BreadcrumbLink href="/orders">Orders</BreadcrumbLink></BreadcrumbItem>
 *     <BreadcrumbSeparator />
 *     <BreadcrumbItem><BreadcrumbPage>ORD-1024</BreadcrumbPage></BreadcrumbItem>
 *   </BreadcrumbList>
 * </Breadcrumb>
 */
export const Breadcrumb = forwardRef<HTMLElement, ComponentProps<'nav'>>(
    function Breadcrumb(
        { 'aria-label': ariaLabel = 'Breadcrumb', ...props },
        ref,
    ) {
        return (
            <nav ref={ref} data-slot="breadcrumb" aria-label={ariaLabel} {...props} />
        );
    },
);

export const BreadcrumbList = forwardRef<
    HTMLOListElement,
    ComponentProps<'ol'>
>(function BreadcrumbList({ className, ...props }, ref) {
    return (
        <ol
            ref={ref}
            data-slot="breadcrumb-list"
            className={cn(
                'flex flex-wrap items-center gap-1.5 text-sm break-words text-muted-foreground',
                className,
            )}
            {...props}
        />
    );
});

export const BreadcrumbItem = forwardRef<HTMLLIElement, ComponentProps<'li'>>(
    function BreadcrumbItem({ className, ...props }, ref) {
        return (
            <li
                ref={ref}
                data-slot="breadcrumb-item"
                className={cn('inline-flex items-center gap-1.5', className)}
                {...props}
            />
        );
    },
);

export interface BreadcrumbLinkProps extends ComponentProps<'a'> {
    /**
     * Render your router's link instead of `<a>`, e.g. `render={<Link href="/orders" />}`.
     * Our props and children are merged into it.
     */
    render?: ReactElement<Record<string, unknown>>;
}

/** A link to an ancestor page. */
export const BreadcrumbLink = forwardRef<
    HTMLAnchorElement,
    BreadcrumbLinkProps
>(function BreadcrumbLink({ className, render, children, ...props }, ref) {
    const classes = cn('transition-colors hover:text-foreground', className);
    if (render && isValidElement(render)) {
        return cloneElement(
            render,
            { 'data-slot': 'breadcrumb-link', className: classes, ...props, ref },
            children,
        );
    }
    return (
        <a ref={ref} data-slot="breadcrumb-link" className={classes} {...props}>
            {children}
        </a>
    );
});

/** The current page. Not a link; marked with `aria-current="page"`. */
export const BreadcrumbPage = forwardRef<
    HTMLSpanElement,
    ComponentProps<'span'>
>(function BreadcrumbPage({ className, ...props }, ref) {
    return (
        <span
            ref={ref}
            data-slot="breadcrumb-page"
            aria-current="page"
            className={cn('font-medium text-foreground', className)}
            {...props}
        />
    );
});

/** The divider between items. Defaults to a chevron. */
export const BreadcrumbSeparator = forwardRef<
    HTMLLIElement,
    ComponentProps<'li'>
>(function BreadcrumbSeparator({ className, children, ...props }, ref) {
    return (
        <li
            ref={ref}
            data-slot="breadcrumb-separator"
            role="presentation"
            aria-hidden="true"
            className={cn('[&>svg]:size-3.5 rtl:[&>svg]:rotate-180', className)}
            {...props}
        >
            {children ?? <ChevronRightIcon />}
        </li>
    );
});

/** Stands in for collapsed levels in long paths. */
export const BreadcrumbEllipsis = forwardRef<
    HTMLSpanElement,
    ComponentProps<'span'>
>(function BreadcrumbEllipsis({ className, ...props }, ref) {
    return (
        <span
            ref={ref}
            data-slot="breadcrumb-ellipsis"
            role="presentation"
            aria-hidden="true"
            className={cn('flex size-5 items-center justify-center', className)}
            {...props}
        >
            <MoreHorizontalIcon className="size-4" />
        </span>
    );
});
