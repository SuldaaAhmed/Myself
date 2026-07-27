import { plainToInstance } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MinLength,
  validateSync,
} from 'class-validator';

/**
 * Strongly typed, fail-fast environment contract. The process refuses to boot
 * with a half-configured environment — the cheapest production bug to prevent.
 */
export class EnvironmentVariables {
  @IsIn(['development', 'test', 'production'])
  NODE_ENV: 'development' | 'test' | 'production' = 'development';

  @IsInt()
  API_PORT = 4000;

  @IsString()
  @MinLength(1)
  DATABASE_URL!: string;

  @IsOptional()
  @IsString()
  REDIS_URL?: string;

  @IsString()
  @MinLength(16, { message: 'JWT_ACCESS_SECRET must be at least 16 characters' })
  JWT_ACCESS_SECRET!: string;

  @IsString()
  @MinLength(16, { message: 'JWT_REFRESH_SECRET must be at least 16 characters' })
  JWT_REFRESH_SECRET!: string;

  @IsInt()
  JWT_ACCESS_TTL = 900; // 15 minutes

  @IsInt()
  JWT_REFRESH_TTL = 2_592_000; // 30 days

  @IsString()
  COOKIE_DOMAIN = 'localhost';

  @IsBoolean()
  COOKIE_SECURE = false;

  @IsString()
  CORS_ORIGINS = 'http://localhost:3000';

  @IsInt()
  THROTTLE_TTL = 60;

  @IsInt()
  THROTTLE_LIMIT = 120;

  @IsInt()
  CACHE_TTL = 60;

  @IsString()
  UPLOAD_DIR = './uploads';

  @IsOptional()
  @IsString()
  CLOUDINARY_CLOUD_NAME?: string;

  @IsOptional()
  @IsString()
  CLOUDINARY_API_KEY?: string;

  @IsOptional()
  @IsString()
  CLOUDINARY_API_SECRET?: string;

  @IsOptional()
  @IsString()
  SEED_ADMIN_EMAIL?: string;

  @IsOptional()
  @IsString()
  SEED_ADMIN_PASSWORD?: string;
}

const asInt = (value: unknown, fallback: number) => {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const asBool = (value: unknown, fallback: boolean) => {
  if (value === undefined || value === null || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
};

export function validateEnvironment(raw: Record<string, unknown>): EnvironmentVariables {
  const normalised = {
    ...raw,
    API_PORT: asInt(raw.API_PORT, 4000),
    JWT_ACCESS_TTL: asInt(raw.JWT_ACCESS_TTL, 900),
    JWT_REFRESH_TTL: asInt(raw.JWT_REFRESH_TTL, 2_592_000),
    THROTTLE_TTL: asInt(raw.THROTTLE_TTL, 60),
    THROTTLE_LIMIT: asInt(raw.THROTTLE_LIMIT, 120),
    CACHE_TTL: asInt(raw.CACHE_TTL, 60),
    COOKIE_SECURE: asBool(raw.COOKIE_SECURE, raw.NODE_ENV === 'production'),
  };

  const config = plainToInstance(EnvironmentVariables, normalised, {
    enableImplicitConversion: false,
    exposeDefaultValues: true,
  });

  const errors = validateSync(config, { skipMissingProperties: false });
  if (errors.length > 0) {
    const details = errors
      .map((error) => Object.values(error.constraints ?? {}).join(', '))
      .join('\n  - ');
    throw new Error(`Invalid environment configuration:\n  - ${details}`);
  }

  return config;
}

export type AppConfig = EnvironmentVariables;
