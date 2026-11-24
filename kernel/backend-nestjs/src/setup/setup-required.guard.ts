import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { SetupRequiredError } from '../common/errors';
import { InstallStateService } from './install-state.service';

const ALWAYS_ALLOWED = new Set(['/', '/health', '/docs', '/redoc', '/openapi.json']);
const ALLOWED_PREFIXES = ['/setup', '/docs/'];

export function isAllowedBeforeSetup(path: string): boolean {
  if (ALWAYS_ALLOWED.has(path)) return true;
  return ALLOWED_PREFIXES.some((p) => (p.endsWith('/') ? path.startsWith(p) : path === p || path.startsWith(`${p}/`)));
}

/** 503 `setup_required` for every route except the allow-list until first-run setup is complete. */
@Injectable()
export class SetupRequiredGuard implements CanActivate {
  constructor(private readonly state: InstallStateService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    if (isAllowedBeforeSetup(req.path)) return true;
    if (!(await this.state.isInstalled())) throw new SetupRequiredError();
    return true;
  }
}
