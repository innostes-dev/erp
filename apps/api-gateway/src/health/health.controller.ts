import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { HealthDto } from '../modules/auth/dto/session.dto';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Public()
  @Get()
  @ApiOperation({
    summary: 'Health check',
    description: 'Returns service uptime, timestamp, and version. Always public — use for load-balancer probes.',
  })
  @ApiOkResponse({ type: HealthDto })
  check(): HealthDto {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      version: process.env['npm_package_version'] ?? '0.0.0',
    };
  }
}
