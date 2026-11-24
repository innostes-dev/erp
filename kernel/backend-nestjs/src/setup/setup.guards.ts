import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { InvalidSetupTokenError, SetupNotAvailableError, TooManyRequestsError } from '../common/errors';
import { APP_CONFIG, AppConfig } from '../config/env';
import { InstallStateService } from './install-state.service';
import { SetupTokenService } from './setup-token.service';

/** 404 once installed or when web setup is disabled (checked before any token handling). */
@Injectable()
export class SetupAvailableGuard implements CanActivate {
  constructor(
    @Inject(APP_CONFIG) private readonly cfg: AppConfig,
    private readonly state: InstallStateService,
  ) {}

  async canActivate(): Promise<boolean> {
    if (!this.cfg.setup.enabled) throw new SetupNotAvailableError();
    if (await this.state.isInstalled()) throw new SetupNotAvailableError();
    return true;
  }
}

@Injectable()
export class SetupTokenGuard implements CanActivate {
  constructor(private readonly tokens: SetupTokenService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const client = req.ip ?? req.socket?.remoteAddress ?? 'unknown';
    const wait = this.tokens.retryAfter(client);
    if (wait !== null) throw new TooManyRequestsError('Too many invalid setup tokens. Try again later.', wait);
    const header = req.headers['x-setup-token'];
    const candidate = Array.isArray(header) ? header[0] : header;
    if (!this.tokens.verify(candidate)) {
      this.tokens.recordFailure(client);
      throw new InvalidSetupTokenError();
    }
    this.tokens.reset(client);
    return true;
  }
}
