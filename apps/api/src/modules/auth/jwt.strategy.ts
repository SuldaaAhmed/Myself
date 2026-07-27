import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import type { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { AuthenticatedUser } from '../../common/decorators';

export const ACCESS_COOKIE = 'access_token';
export const REFRESH_COOKIE = 'refresh_token';

interface AccessTokenPayload {
  sub: string;
  email: string;
  name: string;
  roles: string[];
  permissions: string[];
}

const fromCookie = (request: Request): string | null =>
  (request.cookies as Record<string, string> | undefined)?.[ACCESS_COOKIE] ?? null;

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService) {
    super({
      // Browser sessions use the HTTP-only cookie; service clients may use a
      // bearer header. Both land on the same payload.
      jwtFromRequest: ExtractJwt.fromExtractors([fromCookie, ExtractJwt.fromAuthHeaderAsBearerToken()]),
      secretOrKey: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      ignoreExpiration: false,
    });
  }

  validate(payload: AccessTokenPayload): AuthenticatedUser {
    if (!payload?.sub) throw new UnauthorizedException();
    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      roles: payload.roles ?? [],
      permissions: payload.permissions ?? [],
    };
  }
}
