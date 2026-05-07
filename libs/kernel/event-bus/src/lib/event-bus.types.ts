/**
 * Central typed event map. All cross-module events must be declared here.
 * Pattern: 'scope:event-name' → payload type
 */
export interface AppEventMap {
  // Auth events
  'auth:login': { userId: string };
  'auth:logout': undefined;
  'auth:token-refreshed': { token: string };

  // Notification events
  'notification:show': { message: string; type: 'success' | 'error' | 'info' | 'warning' };
  'notification:dismiss': { id: string };
}

export type AppEvent = keyof AppEventMap;
export type AppEventPayload<E extends AppEvent> = AppEventMap[E];
