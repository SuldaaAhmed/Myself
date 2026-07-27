import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AuthService } from './auth.service';

@Injectable()
export class SessionCleanupService {
  private readonly logger = new Logger(SessionCleanupService.name);

  constructor(private readonly auth: AuthService) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async pruneExpiredSessions(): Promise<void> {
    const removed = await this.auth.pruneRefreshTokens();
    if (removed > 0) this.logger.log(`Pruned ${removed} expired refresh tokens`);
  }
}
