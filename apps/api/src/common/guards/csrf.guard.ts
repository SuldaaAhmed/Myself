import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
export const CSRF_COOKIE = 'csrf_token';
export const CSRF_HEADER = 'x-csrf-token';

/**
 * Double-submit cookie CSRF protection.
 *
 * Session auth uses HTTP-only cookies, so a mutating request must additionally
 * echo the readable `csrf_token` cookie in the `x-csrf-token` header — a value
 * a cross-site attacker cannot read. Bearer-token clients (mobile, CI, other
 * services) are unaffected because their credential is never sent ambiently.
 */
@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    if (context.getType() !== 'http') return true;
    const request = context.switchToHttp().getRequest<Request>();

    if (SAFE_METHODS.has(request.method)) return true;
    if (request.headers.authorization?.startsWith('Bearer ')) return true;

    const cookieToken = (request.cookies as Record<string, string> | undefined)?.[CSRF_COOKIE];
    if (!cookieToken) return true; // no session cookie flow in play

    const headerToken = request.headers[CSRF_HEADER];
    if (typeof headerToken !== 'string' || headerToken !== cookieToken) {
      throw new ForbiddenException('Invalid or missing CSRF token');
    }

    return true;
  }
}
