import { Inject, Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { APP_CONFIG, AppConfig } from '../config/env';
import { InstallStateService } from './install-state.service';
import { SetupTokenService } from './setup-token.service';

/** Prints a generated setup token at startup while the system is not installed. */
@Injectable()
export class SetupBootstrap implements OnApplicationBootstrap {
  private readonly logger = new Logger(SetupBootstrap.name);

  constructor(
    @Inject(APP_CONFIG) private readonly cfg: AppConfig,
    private readonly state: InstallStateService,
    private readonly tokens: SetupTokenService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    if (!this.cfg.setup.enabled || this.cfg.setup.token) return;
    try {
      if (!(await this.state.isInstalled())) this.tokens.announce();
    } catch {
      this.logger.warn('Database unavailable at startup; setup token will be generated on first use');
    }
  }
}
