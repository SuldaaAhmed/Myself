import { CacheModule } from '@nestjs/cache-manager';
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { createKeyv } from '@keyv/redis';
import Keyv from 'keyv';
import { CacheService } from './common/cache/cache.service';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { CsrfGuard } from './common/guards/csrf.guard';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { PrismaModule } from './common/prisma/prisma.module';
import { validateEnvironment } from './config/configuration';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { ContentModule } from './modules/content/content.module';
import { HealthModule } from './modules/health/health.module';
import { MediaModule } from './modules/media/media.module';
import { MessagesModule } from './modules/messages/messages.module';
import { RolesModule } from './modules/roles/roles.module';
import { SeoModule } from './modules/seo/seo.module';
import { SettingsModule } from './modules/settings/settings.module';
import { UsersModule } from './modules/users/users.module';

@Global()
@Module({
  providers: [CacheService],
  exports: [CacheService],
})
class SharedCacheModule {}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: ['.env', '../../.env'],
      validate: validateEnvironment,
    }),

    // Redis when REDIS_URL is set, in-process LRU otherwise. Same API either way.
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = config.get<string>('REDIS_URL');
        const ttl = config.get<number>('CACHE_TTL', 60) * 1000;
        // Same Keyv interface either way, so the app code never branches on it.
        return { ttl, stores: [url ? createKeyv(url) : new Keyv()] };
      },
    }),

    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: config.get<number>('THROTTLE_TTL', 60) * 1000,
            limit: config.get<number>('THROTTLE_LIMIT', 120),
          },
        ],
      }),
    }),

    ScheduleModule.forRoot(),
    PrismaModule,
    SharedCacheModule,
    AuditModule,
    AuthModule,
    UsersModule,
    RolesModule,
    ContentModule,
    SettingsModule,
    SeoModule,
    MessagesModule,
    MediaModule,
    AnalyticsModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: CsrfGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class AppModule {}
