'use client';

import { forwardRef, type ReactNode } from 'react';
import { Toast as BaseToast } from '@base-ui/react/toast';
import { cn } from '../../../lib/cn';
import {
  CircleAlertIcon,
  CircleCheckIcon,
  InfoIcon,
  TriangleAlertIcon,
  XIcon,
} from '../../../lib/icons';
import { Spinner } from '../spinner/spinner';

/** Toast types. Set colour and icon. */
export type ToastType =
  'default' | 'success' | 'error' | 'warning' | 'info' | 'loading';

export interface ToastOptions {
  /** Heading. */
  title?: ReactNode;
  /** Body text. */
  description?: ReactNode;
  /** Sets colour and icon. @default 'default' */
  type?: ToastType;
  /** Auto-dismiss delay in ms. `0` keeps the toast until dismissed. @default 5000 */
  timeout?: number;
  /** `high` announces the toast immediately (assertive); `low` waits politely. @default 'low' (errors: 'high') */
  priority?: 'low' | 'high';
  /** One action button, e.g. "Undo". */
  action?: { label: ReactNode; onClick: () => void };
  /** Called when the toast closes. */
  onClose?: () => void;
}

const manager = BaseToast.createToastManager();

function add(options: ToastOptions): string {
  const { action, type = 'default', priority, ...rest } = options;
  return manager.add({
    ...rest,
    type,
    priority: priority ?? (type === 'error' ? 'high' : 'low'),
    actionProps: action
      ? { children: action.label, onClick: action.onClick }
      : undefined,
  });
}

type ToastShortcut = (
  title: ReactNode,
  options?: Omit<ToastOptions, 'title' | 'type'>,
) => string;
const shortcut =
  (type: ToastType): ToastShortcut =>
  (title, options) =>
    add({ ...options, title, type });

/**
 * Show a temporary notification from anywhere, including outside React components.
 * Requires one `<Toaster />` mounted near the root of the app.
 *
 * Every function returns the toast id, which you can pass to `toast.update` or `toast.dismiss`.
 *
 * @example
 * toast.success('Invoice sent');
 * toast.error('Could not save', { description: error.message });
 * toast('Item archived', { action: { label: 'Undo', onClick: restore } });
 *
 * await toast.promise(saveOrder(), {
 *   loading: 'Saving order…',
 *   success: 'Order saved',
 *   error: (err) => `Failed: ${err.message}`,
 * });
 */
export const toast = Object.assign(
  (title: ReactNode, options?: Omit<ToastOptions, 'title'>) =>
    add({ ...options, title }),
  {
    /** Show a toast with full control over its options. */
    show: add,
    success: shortcut('success'),
    error: shortcut('error'),
    warning: shortcut('warning'),
    info: shortcut('info'),
    loading: (
      title: ReactNode,
      options?: Omit<ToastOptions, 'title' | 'type'>,
    ) => add({ timeout: 0, ...options, title, type: 'loading' }),
    /** Change an existing toast, e.g. turn a loading toast into a success. */
    update: (id: string, options: ToastOptions) => {
      const { action, ...rest } = options;
      manager.update(id, {
        ...rest,
        ...(action
          ? { actionProps: { children: action.label, onClick: action.onClick } }
          : {}),
      });
    },
    /** Close one toast, or all toasts when called without an id. */
    dismiss: (id?: string) => manager.close(id),
    /** Show a loading toast that turns into success or error when the promise settles. */
    promise: <T,>(
      promise: Promise<T>,
      messages: {
        loading: ReactNode;
        success: ReactNode | ((value: T) => ReactNode);
        error: ReactNode | ((error: unknown) => ReactNode);
      },
    ): Promise<T> =>
      manager.promise(promise, {
        loading: { title: messages.loading, type: 'loading' },
        success: (value: T) => ({
          title:
            typeof messages.success === 'function'
              ? messages.success(value)
              : messages.success,
          type: 'success',
        }),
        error: (err: unknown) => ({
          title:
            typeof messages.error === 'function'
              ? messages.error(err)
              : messages.error,
          type: 'error',
          priority: 'high',
        }),
      }),
  },
);

export interface ToasterProps {
  /**
   * Screen corner where toasts appear.
   * @default 'bottom-right'
   */
  position?:
    | 'top-left'
    | 'top-center'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-center'
    | 'bottom-right';
  /** Max toasts visible at once; older ones wait. @default 3 */
  limit?: number;
  /** Default auto-dismiss delay in ms. @default 5000 */
  timeout?: number;
  /** Class for the toast list container. */
  className?: string;
}

const positionClass: Record<NonNullable<ToasterProps['position']>, string> = {
  'top-left': 'top-4 left-4 items-start',
  'top-center': 'top-4 left-1/2 -translate-x-1/2 items-center',
  'top-right': 'top-4 right-4 items-end',
  'bottom-left': 'bottom-4 left-4 items-start flex-col-reverse',
  'bottom-center':
    'bottom-4 left-1/2 -translate-x-1/2 items-center flex-col-reverse',
  'bottom-right': 'bottom-4 right-4 items-end flex-col-reverse',
};

const typeIcon: Partial<Record<ToastType, ReactNode>> = {
  success: <CircleCheckIcon className="size-4 text-success" />,
  error: <CircleAlertIcon className="size-4 text-destructive" />,
  warning: <TriangleAlertIcon className="size-4 text-warning" />,
  info: <InfoIcon className="size-4 text-info" />,
  loading: <Spinner label={null} className="text-muted-foreground" />,
};

function ToastList() {
  const { toasts } = BaseToast.useToastManager();
  return toasts.map((t) => (
    <BaseToast.Root
      key={t.id}
      toast={t}
      data-slot="toast"
      className={cn(
        'pointer-events-auto relative flex w-[min(24rem,calc(100vw-2rem))] items-start gap-3 rounded-lg border border-border bg-popover p-4 text-popover-foreground shadow-lg',
        'transition-[opacity,translate] duration-200 ease-out',
        'translate-x-(--toast-swipe-movement-x) translate-y-(--toast-swipe-movement-y)',
        'data-starting-style:translate-y-2 data-starting-style:opacity-0',
        'data-ending-style:opacity-0 data-limited:hidden',
        'data-[type=error]:border-destructive/40',
      )}
    >
      {t.type && typeIcon[t.type as ToastType] && (
        <span className="mt-0.5 flex shrink-0" aria-hidden="true">
          {typeIcon[t.type as ToastType]}
        </span>
      )}
      <BaseToast.Content className="flex min-w-0 flex-1 flex-col gap-1">
        <BaseToast.Title className="text-sm leading-5 font-medium" />
        <BaseToast.Description className="text-sm text-muted-foreground" />
        {t.actionProps && (
          <BaseToast.Action className="mt-2 inline-flex h-7 w-fit cursor-pointer items-center rounded-md border border-input bg-background px-2.5 text-xs font-medium hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring" />
        )}
      </BaseToast.Content>
      <BaseToast.Close
        aria-label="Dismiss notification"
        className="-me-1 -mt-1 flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-ring"
      >
        <XIcon className="size-4" />
      </BaseToast.Close>
    </BaseToast.Root>
  ));
}

/**
 * Renders the toasts created with `toast()`. Mount it once, near the root of your app.
 *
 * @example
 * export default function RootLayout({ children }) {
 *   return <body>{children}<Toaster position="bottom-right" /></body>;
 * }
 */
export const Toaster = forwardRef<HTMLDivElement, ToasterProps>(
  function Toaster(
    { position = 'bottom-right', limit = 3, timeout = 5000, className },
    ref,
  ) {
    return (
      <BaseToast.Provider
        toastManager={manager}
        limit={limit}
        timeout={timeout}
      >
        <BaseToast.Portal>
          <BaseToast.Viewport
            ref={ref}
            data-slot="toaster"
            className={cn(
              'pointer-events-none fixed z-[100] flex max-h-screen flex-col gap-2 outline-none',
              positionClass[position],
              className,
            )}
          >
            <ToastList />
          </BaseToast.Viewport>
        </BaseToast.Portal>
      </BaseToast.Provider>
    );
  },
);
