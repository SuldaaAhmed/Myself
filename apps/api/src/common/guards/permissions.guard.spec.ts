import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { ExecutionContext } from '@nestjs/common';
import type { AuthenticatedUser } from '../decorators';
import { PERMISSIONS_KEY, RESOURCE_KEY } from '../decorators';
import { PermissionsGuard } from './permissions.guard';

const user = (permissions: string[]): AuthenticatedUser => ({
  id: 'u1',
  email: 'editor@example.com',
  name: 'Editor',
  roles: ['editor'],
  permissions,
});

function contextFor(options: {
  method?: string;
  user?: AuthenticatedUser;
  metadata?: Record<string, unknown>;
}): { context: ExecutionContext; reflector: Reflector } {
  const reflector = new Reflector();
  jest
    .spyOn(reflector, 'getAllAndOverride')
    .mockImplementation((key: unknown) => (options.metadata ?? {})[key as string] as never);

  const context = {
    getHandler: () => () => undefined,
    getClass: () => class {},
    switchToHttp: () => ({
      getRequest: () => ({ method: options.method ?? 'GET', user: options.user }),
    }),
  } as unknown as ExecutionContext;

  return { context, reflector };
}

describe('PermissionsGuard', () => {
  it('allows routes that declare no resource and no permissions', () => {
    const { context, reflector } = contextFor({ metadata: {} });
    expect(new PermissionsGuard(reflector).canActivate(context)).toBe(true);
  });

  it('lets anonymous reads through on a resource controller', () => {
    const { context, reflector } = contextFor({
      method: 'GET',
      metadata: { [RESOURCE_KEY]: 'projects' },
    });
    expect(new PermissionsGuard(reflector).canActivate(context)).toBe(true);
  });

  it('requires resource:write for a POST', () => {
    const { context, reflector } = contextFor({
      method: 'POST',
      user: user(['projects:read']),
      metadata: { [RESOURCE_KEY]: 'projects' },
    });

    expect(() => new PermissionsGuard(reflector).canActivate(context)).toThrow(ForbiddenException);
  });

  it('accepts a matching write permission', () => {
    const { context, reflector } = contextFor({
      method: 'PATCH',
      user: user(['projects:write']),
      metadata: { [RESOURCE_KEY]: 'projects' },
    });

    expect(new PermissionsGuard(reflector).canActivate(context)).toBe(true);
  });

  it('requires resource:delete for a DELETE, not just write', () => {
    const { context, reflector } = contextFor({
      method: 'DELETE',
      user: user(['projects:write']),
      metadata: { [RESOURCE_KEY]: 'projects' },
    });

    expect(() => new PermissionsGuard(reflector).canActivate(context)).toThrow(ForbiddenException);
  });

  it('honours explicit @Permissions over the resource default', () => {
    const { context, reflector } = contextFor({
      method: 'GET',
      user: user(['analytics:read']),
      metadata: { [PERMISSIONS_KEY]: ['analytics:read'], [RESOURCE_KEY]: 'projects' },
    });

    expect(new PermissionsGuard(reflector).canActivate(context)).toBe(true);
  });

  describe('isGranted', () => {
    it('treats * as full access', () => {
      expect(PermissionsGuard.isGranted(user(['*']), 'users:delete')).toBe(true);
    });

    it('expands resource wildcards', () => {
      expect(PermissionsGuard.isGranted(user(['projects:*']), 'projects:delete')).toBe(true);
      expect(PermissionsGuard.isGranted(user(['projects:*']), 'users:delete')).toBe(false);
    });

    it('denies anonymous callers', () => {
      expect(PermissionsGuard.isGranted(undefined, 'projects:read')).toBe(false);
    });
  });
});
