export interface TelemetryAdapter {
  track(event: string, properties?: Record<string, unknown>): void;
  identify(userId: string, traits?: Record<string, unknown>): void;
  page(name: string, properties?: Record<string, unknown>): void;
  captureError(error: Error, context?: Record<string, unknown>): void;
}

export interface TelemetryConfig {
  adapter: TelemetryAdapter;
  enabled?: boolean;
}
