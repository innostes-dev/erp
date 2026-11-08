import { describe, expect, it } from 'vitest';
import { parseRoute, paths } from './routes';

describe('parseRoute', () => {
  it('parses top-level pages', () => {
    expect(parseRoute('/')).toEqual({ kind: 'home' });
    expect(parseRoute('/modules')).toEqual({ kind: 'modules-catalog' });
    expect(parseRoute('/plugins/')).toEqual({ kind: 'plugins-catalog' });
  });

  it('makes module and plugin sub-pages addressable', () => {
    expect(parseRoute('/modules/peopleops')).toEqual({ kind: 'module', moduleId: 'peopleops', subId: undefined });
    expect(parseRoute('/modules/peopleops/leave')).toEqual({ kind: 'module', moduleId: 'peopleops', subId: 'leave' });
    expect(parseRoute('/plugins/tracura/logs')).toEqual({ kind: 'plugin', pluginId: 'tracura', subId: 'logs' });
  });

  it('keeps legacy administration URLs working', () => {
    expect(parseRoute('/audit')).toEqual({ kind: 'audit' });
    expect(parseRoute('/administration/audit')).toEqual({ kind: 'audit' });
    expect(parseRoute('/administration')).toEqual({ kind: 'api-keys' });
    expect(parseRoute('/api-keys')).toEqual({ kind: 'api-keys' });
    expect(parseRoute('/administration/api-keys')).toEqual({ kind: 'api-keys' });
  });

  it('reports unknown paths instead of silently showing Home', () => {
    expect(parseRoute('/does-not-exist')).toEqual({ kind: 'not-found' });
    expect(parseRoute('/administration/unknown')).toEqual({ kind: 'not-found' });
  });

  it('round-trips the path builders', () => {
    expect(parseRoute(paths.module('salesflow', 'deals'))).toEqual({ kind: 'module', moduleId: 'salesflow', subId: 'deals' });
    expect(parseRoute(paths.plugin('tracura'))).toEqual({ kind: 'plugin', pluginId: 'tracura', subId: undefined });
    expect(parseRoute(paths.audit)).toEqual({ kind: 'audit' });
    expect(parseRoute(paths.apiKeys)).toEqual({ kind: 'api-keys' });
  });
});
