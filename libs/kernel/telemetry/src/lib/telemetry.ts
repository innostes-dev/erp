import type { TelemetryAdapter, TelemetryConfig } from './telemetry.types';

const noop: TelemetryAdapter = {
  track: () => void 0,
  identify: () => void 0,
  page: () => void 0,
  captureError: () => void 0,
};

let _adapter: TelemetryAdapter = noop;
let _enabled = false;

export function initTelemetry(config: TelemetryConfig): void {
  _adapter = config.adapter;
  _enabled = config.enabled ?? true;
}

export function track(event: string, properties?: Record<string, unknown>): void {
  if (!_enabled) return;
  _adapter.track(event, properties);
}

export function identify(userId: string, traits?: Record<string, unknown>): void {
  if (!_enabled) return;
  _adapter.identify(userId, traits);
}

export function captureError(error: Error, context?: Record<string, unknown>): void {
  if (!_enabled) return;
  _adapter.captureError(error, context);
}
