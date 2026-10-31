import { forwardRef, type ComponentProps, ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../lib/cn';
import {
    CircleAlertIcon,
    CircleCheckIcon,
    InfoIcon,
    TriangleAlertIcon,
} from '../../../lib/icons';

const alertVariants = cva(
    [
        'relative grid w-full grid-cols-[0_1fr] items-start gap-y-1 rounded-lg border px-4 py-3 text-sm',
        'has-[>[data-slot=alert-icon]]:grid-cols-[1rem_1fr] has-[>[data-slot=alert-icon]]:gap-x-3',
    ],
    {
        variants: {
            /** Meaning of the message. Sets colour and the default icon. */
            variant: {
                default: 'border-border bg-card text-card-foreground',
                info: 'border-info/30 bg-info/8 text-foreground [&>[data-slot=alert-icon]]:text-info',
                success:
                    'border-success/30 bg-success/8 text-foreground [&>[data-slot=alert-icon]]:text-success',
                warning:
                    'border-warning/50 bg-warning/10 text-foreground [&>[data-slot=alert-icon]]:text-warning',
                destructive:
                    'border-destructive/30 bg-destructive/8 text-foreground [&>[data-slot=alert-icon]]:text-destructive',
            },
        },
        defaultVariants: { variant: 'default' },
    },
);

type AlertVariant = NonNullable<VariantProps<typeof alertVariants>['variant']>;

const defaultIcons: Record<AlertVariant, ReactNode> = {
    default: <InfoIcon />,
    info: <InfoIcon />,
    success: <CircleCheckIcon />,
    warning: <TriangleAlertIcon />,
    destructive: <CircleAlertIcon />,
};

export interface AlertProps
    extends ComponentProps<'div'>, VariantProps<typeof alertVariants> {
    /**
     * Icon before the content. Defaults to an icon matching `variant`; pass `null` for none.
     */
    icon?: ReactNode | null;
}

/**
 * A static message in the page flow, e.g. a warning above a form. Uses `role="alert"` for
 * `destructive` and `warning` (announced immediately), `role="status"` otherwise.
 * For temporary notifications use `toast` instead.
 *
 * @example
 * <Alert variant="warning">
 *   <AlertTitle>Your trial ends in 3 days</AlertTitle>
 *   <AlertDescription>Add a payment method to keep your data.</AlertDescription>
 * </Alert>
 */
export const Alert = forwardRef<HTMLDivElement, AlertProps>(function Alert(
    { className, variant, icon, children, role, ...props },
    ref,
) {
    const resolved = variant ?? 'default';
    const shownIcon = icon === undefined ? defaultIcons[resolved] : icon;

    return (
        <div
            ref={ref}
            data-slot="alert"
            data-variant={resolved}
            role={
                role ??
                (resolved === 'destructive' || resolved === 'warning'
                    ? 'alert'
                    : 'status')
            }
            className={cn(alertVariants({ variant }), className)}
            {...props}
        >
            {shownIcon && (
                <span
                    data-slot="alert-icon"
                    className="flex translate-y-0.5 [&>svg]:size-4"
                    aria-hidden="true"
                >
                    {shownIcon}
                </span>
            )}
            {children}
        </div>
    );
});

/** The alert heading. */
export const AlertTitle = forwardRef<HTMLDivElement, ComponentProps<'div'>>(
    function AlertTitle({ className, ...props }, ref) {
        return (
            <div
                ref={ref}
                data-slot="alert-title"
                className={cn('col-start-2 leading-5 font-medium', className)}
                {...props}
            />
        );
    },
);

/** The alert body. */
export const AlertDescription = forwardRef<
    HTMLDivElement,
    ComponentProps<'div'>
>(function AlertDescription({ className, ...props }, ref) {
    return (
        <div
            ref={ref}
            data-slot="alert-description"
            className={cn(
                'col-start-2 text-muted-foreground [&_p]:leading-relaxed',
                className,
            )}
            {...props}
        />
    );
});
