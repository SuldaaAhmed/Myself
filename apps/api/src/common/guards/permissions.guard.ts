import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { AuthenticatedUser, PERMISSIONS_KEY, RESOURCE_KEY } from '../decorators';

const ACTION_BY_METHOD: Record<string, string> = {
  POST: 'write',
  PATCH: 'write',
  PUT: 'write',
  DELETE: 'delete',
};

/**
 * Role-based access control resolved down to fine-grained `resource:action`
 * keys. Controllers can be explicit with `@Permissions(...)`, or simply declare
 * `@Resource('projects')` and let the HTTP verb decide: reads are open (the
 * public website uses them), writes need `projects:write`, deletes need
 * `projects:delete`.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  static isGranted(user: AuthenticatedUser | undefined, permission: string): boolean {
    if (!user) return false;
    if (user.permissions.includes('*')) return true;
    const [resource] = permission.split(':');
    return user.permissions.includes(permission) || user.permissions.includes(`${resource}:*`);
  }

  canActivate(context: ExecutionContext): boolean {
    const required = this.resolveRequired(context);
    if (required.length === 0) return true;

    const request = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
    const user = request.user;
    if (!user) throw new ForbiddenException('Authentication required');

    const missing = required.filter((permission) => !PermissionsGuard.isGranted(user, permission));
    if (missing.length > 0) {
      throw new ForbiddenException(`Missing permission(s): ${missing.join(', ')}`);
    }

    return true;
  }

  private resolveRequired(context: ExecutionContext): string[] {
    const explicit = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (explicit?.length) return explicit;

    const resource = this.reflector.getAllAndOverride<string>(RESOURCE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!resource) return [];

    const action = ACTION_BY_METHOD[context.switchToHttp().getRequest<Request>().method];
    return action ? [`${resource}:${action}`] : [];
  }
}
