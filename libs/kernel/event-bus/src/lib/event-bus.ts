import mitt from 'mitt';
import type { AppEvent, AppEventMap, AppEventPayload } from './event-bus.types';

const emitter = mitt<AppEventMap>();

export function emit<E extends AppEvent>(
  event: E,
  ...args: AppEventPayload<E> extends undefined ? [] : [payload: AppEventPayload<E>]
): void {
  emitter.emit(event, ...(args as [AppEventPayload<E>]));
}

export function on<E extends AppEvent>(
  event: E,
  handler: (payload: AppEventPayload<E>) => void,
): () => void {
  emitter.on(event, handler as (payload: AppEventMap[E]) => void);
  return () => emitter.off(event, handler as (payload: AppEventMap[E]) => void);
}

export function off<E extends AppEvent>(
  event: E,
  handler: (payload: AppEventPayload<E>) => void,
): void {
  emitter.off(event, handler as (payload: AppEventMap[E]) => void);
}
