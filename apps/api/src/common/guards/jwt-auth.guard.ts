import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators';

/**
 * Applied globally: every route needs a valid access token unless marked
 * `@Public()`. Public handlers still get `request.user` populated when a token
 * happens to be present — that is how the admin dashboard reads drafts through
 * the very same endpoints the website uses.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  private isPublic(context: ExecutionContext): boolean {
    return (
      this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? false
    );
  }

  handleRequest<TUser>(err: unknown, user: TUser, info: unknown, context: ExecutionContext): TUser {
    if (this.isPublic(context)) {
      // Never reject a public route; simply forward the user when we have one.
      return (user || undefined) as TUser;
    }
    return super.handleRequest(err, user, info, context);
  }
}
