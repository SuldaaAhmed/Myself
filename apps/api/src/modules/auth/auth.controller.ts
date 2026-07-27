import { Body, Controller, Get, HttpCode, HttpStatus, Patch, Post, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { CookieOptions, Request, Response } from 'express';
import { ClientMeta, CurrentUser, Public } from '../../common/decorators';
import type { AuthenticatedUser } from '../../common/decorators';
import { CSRF_COOKIE } from '../../common/guards/csrf.guard';
import { AuditService } from '../audit/audit.service';
import { AuthService, TokenPair } from './auth.service';
import { ChangePasswordDto, LoginDto, SessionUserDto, UpdateProfileDto } from './dto/auth.dto';
import { ACCESS_COOKIE, REFRESH_COOKIE } from './jwt.strategy';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
    private readonly audit: AuditService,
  ) {}

  @Post('login')
  @Public()
  @Throttle({ default: { limit: 8, ttl: 60_000 } })
  @ApiOperation({ summary: 'Sign in and receive HTTP-only session cookies' })
  @ApiOkResponse({ type: SessionUserDto })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
    @ClientMeta() meta: { ip?: string; userAgent?: string },
  ): Promise<SessionUserDto> {
    const user = await this.auth.validateCredentials(dto.email, dto.password);
    const tokens = await this.auth.issueTokens(user, meta);
    this.setSessionCookies(response, tokens);
    await this.audit.record({
      action: 'login',
      resource: 'auth',
      userId: user.id,
      ip: meta.ip,
      userAgent: meta.userAgent,
    });
    return user;
  }

  @Post('refresh')
  @Public()
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOperation({ summary: 'Rotate the refresh token and issue a new access token' })
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @ClientMeta() meta: { ip?: string; userAgent?: string },
  ): Promise<SessionUserDto> {
    const token = (request.cookies as Record<string, string> | undefined)?.[REFRESH_COOKIE];
    const { tokens, user } = await this.auth.rotate(token ?? '', meta);
    this.setSessionCookies(response, tokens);
    return user;
  }

  @Post('logout')
  @Public()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke the current session' })
  async logout(@Req() request: Request, @Res({ passthrough: true }) response: Response): Promise<void> {
    const token = (request.cookies as Record<string, string> | undefined)?.[REFRESH_COOKIE];
    await this.auth.logout(token);
    for (const name of [ACCESS_COOKIE, REFRESH_COOKIE, CSRF_COOKIE]) {
      response.clearCookie(name, { path: '/' });
    }
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Current session profile with resolved permissions' })
  @ApiOkResponse({ type: SessionUserDto })
  me(@CurrentUser() user: AuthenticatedUser): Promise<SessionUserDto> {
    return this.auth.me(user.id);
  }

  @Patch('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update your own profile' })
  updateProfile(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateProfileDto) {
    return this.auth.updateProfile(user.id, dto);
  }

  @Post('change-password')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Change your password (revokes all sessions)' })
  async changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangePasswordDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    await this.auth.changePassword(user.id, dto.currentPassword, dto.newPassword);
    for (const name of [ACCESS_COOKIE, REFRESH_COOKIE, CSRF_COOKIE]) {
      response.clearCookie(name, { path: '/' });
    }
  }

  private setSessionCookies(response: Response, tokens: TokenPair): void {
    const secure = this.config.get<boolean>('COOKIE_SECURE', false);
    const domain = this.config.get<string>('COOKIE_DOMAIN', 'localhost');

    const base: CookieOptions = {
      httpOnly: true,
      secure,
      sameSite: secure ? 'none' : 'lax',
      domain: domain === 'localhost' ? undefined : domain,
      path: '/',
    };

    response.cookie(ACCESS_COOKIE, tokens.accessToken, {
      ...base,
      maxAge: tokens.accessTtl * 1000,
    });
    response.cookie(REFRESH_COOKIE, tokens.refreshToken, {
      ...base,
      maxAge: tokens.refreshTtl * 1000,
      path: '/',
    });
    // Readable by the dashboard so it can echo it back as `x-csrf-token`.
    response.cookie(CSRF_COOKIE, tokens.csrfToken, {
      ...base,
      httpOnly: false,
      maxAge: tokens.refreshTtl * 1000,
    });
  }
}
