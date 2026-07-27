import { Controller, Get, Injectable, Module } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class HealthService {
  private readonly startedAt = Date.now();

  constructor(private readonly prisma: PrismaService) {}

  async check() {
    const database = await this.probe(() => this.prisma.$queryRaw`SELECT 1`);
    const status = database.ok ? 'ok' : 'degraded';

    return {
      status,
      uptimeSeconds: Math.round((Date.now() - this.startedAt) / 1000),
      version: process.env.npm_package_version ?? '1.0.0',
      checks: { database },
      timestamp: new Date().toISOString(),
    };
  }

  private async probe(fn: () => Promise<unknown>) {
    const started = Date.now();
    try {
      await fn();
      return { ok: true, latencyMs: Date.now() - started };
    } catch (error) {
      return { ok: false, latencyMs: Date.now() - started, error: (error as Error).message };
    }
  }
}

@ApiTags('health')
@Controller()
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Get('health')
  @Public()
  @ApiOperation({ summary: 'Liveness and dependency probe used by Docker and Nginx' })
  check() {
    return this.health.check();
  }
}

@Module({
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
