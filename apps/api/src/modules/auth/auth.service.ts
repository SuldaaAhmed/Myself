import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { SessionUserDto } from './dto/auth.dto';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  csrfToken: string;
  accessTtl: number;
  refreshTtl: number;
}

export interface ClientContext {
  ip?: string;
  userAgent?: string;
}

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly audit: AuditService,
  ) {}

  async validateCredentials(email: string, password: string): Promise<SessionUserDto> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { roles: { include: { permissions: true } } },
    });

    // Constant-ish work whether or not the account exists.
    const passwordHash = user?.passwordHash ?? '$2b$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinva';
    const matches = await compare(password, passwordHash);

    if (!user || !matches) throw new UnauthorizedException('Invalid email or password');
    if (!user.isActive) throw new UnauthorizedException('This account has been disabled');

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return this.toSessionUser(user);
  }

  async issueTokens(user: SessionUserDto, context: ClientContext): Promise<TokenPair> {
    const accessTtl = this.config.get<number>('JWT_ACCESS_TTL', 900);
    const refreshTtl = this.config.get<number>('JWT_REFRESH_TTL', 2_592_000);

    const accessToken = await this.jwt.signAsync(
      { sub: user.id, email: user.email, name: user.name, roles: user.roles, permissions: user.permissions },
      { secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'), expiresIn: accessTtl },
    );

    const refreshToken = await this.jwt.signAsync(
      { sub: user.id, jti: randomBytes(16).toString('hex') },
      { secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'), expiresIn: refreshTtl },
    );

    await this.prisma.refreshToken.create({
      data: {
        tokenHash: sha256(refreshToken),
        userId: user.id,
        ip: context.ip,
        userAgent: context.userAgent,
        expiresAt: new Date(Date.now() + refreshTtl * 1000),
      },
    });

    return {
      accessToken,
      refreshToken,
      csrfToken: randomBytes(24).toString('base64url'),
      accessTtl,
      refreshTtl,
    };
  }

  /**
   * Rotates the refresh token. Presenting an already-used token is treated as
   * theft: every session for that user is revoked.
   */
  async rotate(refreshToken: string, context: ClientContext): Promise<{ tokens: TokenPair; user: SessionUserDto }> {
    if (!refreshToken) throw new UnauthorizedException('Missing refresh token');

    let payload: { sub: string };
    try {
      payload = await this.jwt.verifyAsync(refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: sha256(refreshToken) },
    });

    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    if (stored.revokedAt) {
      this.logger.warn(`Refresh token reuse detected for user ${stored.userId}`);
      await this.revokeAll(stored.userId);
      throw new UnauthorizedException('Refresh token already used');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { roles: { include: { permissions: true } } },
    });
    if (!user || !user.isActive) throw new UnauthorizedException('Account unavailable');

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    const sessionUser = this.toSessionUser(user);
    return { tokens: await this.issueTokens(sessionUser, context), user: sessionUser };
  }

  async logout(refreshToken?: string): Promise<void> {
    if (!refreshToken) return;
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: sha256(refreshToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAll(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async me(userId: string): Promise<SessionUserDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { roles: { include: { permissions: true } } },
    });
    if (!user) throw new UnauthorizedException();
    return this.toSessionUser(user);
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (!(await compare(currentPassword, user.passwordHash))) {
      throw new BadRequestException('Current password is incorrect');
    }
    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/\d/.test(newPassword)) {
      throw new BadRequestException('Password must mix upper case, lower case and digits');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await hash(newPassword, 12) },
    });
    await this.revokeAll(userId);
    await this.audit.record({ action: 'password-change', resource: 'auth', userId });
  }

  async updateProfile(userId: string, data: { name?: string; jobTitle?: string; avatarUrl?: string }) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data,
      include: { roles: { include: { permissions: true } } },
    });
    return this.toSessionUser(user);
  }

  /** Housekeeping for expired/revoked sessions (called from a cron job). */
  async pruneRefreshTokens(): Promise<number> {
    const { count } = await this.prisma.refreshToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { revokedAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
        ],
      },
    });
    return count;
  }

  static async hashPassword(password: string): Promise<string> {
    return hash(password, 12);
  }

  private toSessionUser(user: {
    id: string;
    email: string;
    name: string;
    avatarUrl?: string | null;
    jobTitle?: string | null;
    roles: { name: string; permissions: { key: string }[] }[];
  }): SessionUserDto {
    const permissions = new Set<string>();
    for (const role of user.roles) {
      for (const permission of role.permissions) permissions.add(permission.key);
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl ?? null,
      jobTitle: user.jobTitle ?? null,
      roles: user.roles.map((role) => role.name),
      permissions: [...permissions],
    };
  }
}
