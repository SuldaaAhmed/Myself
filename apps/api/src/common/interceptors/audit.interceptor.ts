import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { Observable, tap } from 'rxjs';
import { AUDIT_KEY, AuthenticatedUser } from '../decorators';
import { AuditService } from '../../modules/audit/audit.service';

const ACTION_BY_METHOD: Record<string, string> = {
  POST: 'create',
  PATCH: 'update',
  PUT: 'update',
  DELETE: 'delete',
};

/** Writes an audit row for every successful mutation on an `@Audit()` controller. */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly audit: AuditService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const resource = this.reflector.getAllAndOverride<string>(AUDIT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const request = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
    const action = ACTION_BY_METHOD[request.method];

    if (!resource || !action) return next.handle();

    return next.handle().pipe(
      tap((result) => {
        const record = result as { id?: string } | undefined;
        void this.audit.record({
          action,
          resource,
          resourceId: record?.id ?? (request.params?.id as string | undefined),
          userId: request.user?.id,
          after: action === 'delete' ? undefined : (result as object | undefined),
          ip: request.ip,
          userAgent: request.headers['user-agent'],
        });
      }),
    );
  }
}
