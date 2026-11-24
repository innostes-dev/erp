import { Body, Controller, Get, Headers, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { RATE_TTL_MS, limitFor } from '../common/rate-limits';
import { InstallStateService } from './install-state.service';
import { SetupTokenService } from './setup-token.service';
import { SetupAvailableGuard, SetupTokenGuard } from './setup.guards';
import { SetupRequest } from './setup.dto';
import { SetupService } from './setup.service';

@ApiTags('Setup')
@Throttle({ default: { limit: limitFor('setup'), ttl: RATE_TTL_MS } })
@Controller('setup')
export class SetupController {
  constructor(
    private readonly state: InstallStateService,
    private readonly setup: SetupService,
    private readonly tokens: SetupTokenService,
  ) {}

  @Get('status')
  @ApiOperation({ summary: 'Get setup status', operationId: 'setup_get_status' })
  async status() {
    return { installed: await this.state.isInstalled() };
  }

  @Get('checks')
  @UseGuards(SetupAvailableGuard, SetupTokenGuard)
  @ApiSecurity('SetupToken')
  @ApiHeader({ name: 'X-Setup-Token', required: true })
  @ApiOperation({ summary: 'Run pre-install checks', operationId: 'setup_run_checks' })
  checks(@Headers('x-setup-token') _token?: string) {
    return this.setup.checks();
  }

  @Post()
  @HttpCode(201)
  @UseGuards(SetupAvailableGuard, SetupTokenGuard)
  @ApiSecurity('SetupToken')
  @ApiHeader({ name: 'X-Setup-Token', required: true })
  @ApiOperation({ summary: 'Run first-run setup', operationId: 'setup_execute_install' })
  async install(@Body() body: SetupRequest) {
    const result = await this.setup.install(body);
    this.tokens.discard();
    return result;
  }
}
