import { SetMetadata, createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

export const IS_PUBLIC_KEY = 'auth:isPublic';
export const PERMISSIONS_KEY = 'auth:permissions';
export const AUDIT_KEY = 'audit:resource';
export const RESOURCE_KEY = 'crud:resource';

/**
 * Declares which resource a controller owns. Permissions and audit entries are
 * derived from it, so a new CMS resource needs no extra wiring.
 */
export const Resource = (resource: string) =>
  applyResourceMetadata(resource);

function applyResourceMetadata(resource: string): ClassDecorator & MethodDecorator {
  return ((target: object, key?: string | symbol, descriptor?: PropertyDescriptor) => {
    SetMetadata(RESOURCE_KEY, resource)(target as never, key as never, descriptor as never);
    SetMetadata(AUDIT_KEY, resource)(target as never, key as never, descriptor as never);
    return descriptor ?? target;
  }) as ClassDecorator & MethodDecorator;
}

/** Marks a route as reachable without an access token. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/** Requires every listed permission key, e.g. `@Permissions('projects:write')`. */
export const Permissions = (...permissions: string[]) => SetMetadata(PERMISSIONS_KEY, permissions);

/** Tags a mutating route so the audit interceptor records who changed what. */
export const Audit = (resource: string) => SetMetadata(AUDIT_KEY, resource);

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  roles: string[];
  permissions: string[];
}

export const CurrentUser = createParamDecorator(
  (field: keyof AuthenticatedUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
    const user = request.user;
    if (!user) return undefined;
    return field ? user[field] : user;
  },
);

export const ClientMeta = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<Request>();
  return {
    ip: (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ?? request.ip,
    userAgent: request.headers['user-agent'],
    referrer: request.headers['referer'],
  };
});
