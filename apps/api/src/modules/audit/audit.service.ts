import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PaginationQueryDto, paginate } from '../../common/dto/pagination.dto';
import { PrismaService } from '../../common/prisma/prisma.service';

export interface AuditEntry {
  action: string;
  resource: string;
  resourceId?: string;
  userId?: string;
  before?: object;
  after?: object;
  ip?: string;
  userAgent?: string;
}

const REDACTED_KEYS = new Set(['password', 'passwordHash', 'currentPassword', 'newPassword', 'token']);

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Fire-and-forget: auditing must never break the request it describes. */
  async record(entry: AuditEntry): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          action: entry.action,
          resource: entry.resource,
          resourceId: entry.resourceId,
          userId: entry.userId,
          before: this.sanitise(entry.before),
          after: this.sanitise(entry.after),
          ip: entry.ip,
          userAgent: entry.userAgent,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to write audit log: ${(error as Error).message}`);
    }
  }

  async list(query: PaginationQueryDto) {
    const where: Prisma.AuditLogWhereInput = query.q
      ? {
          OR: [
            { resource: { contains: query.q, mode: 'insensitive' } },
            { action: { contains: query.q, mode: 'insensitive' } },
            { user: { email: { contains: query.q, mode: 'insensitive' } } },
          ],
        }
      : {};

    const [rows, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: query.skip,
        take: query.limit,
        include: { user: { select: { id: true, name: true, email: true } } },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return paginate(rows, total, query.page, query.limit);
  }

  private sanitise(value?: object): Prisma.InputJsonValue | undefined {
    if (!value) return undefined;
    const clone = JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
    const walk = (node: unknown): unknown => {
      if (Array.isArray(node)) return node.map(walk);
      if (node && typeof node === 'object') {
        return Object.fromEntries(
          Object.entries(node as Record<string, unknown>).map(([key, val]) =>
            REDACTED_KEYS.has(key) ? [key, '[redacted]'] : [key, walk(val)],
          ),
        );
      }
      return node;
    };
    return walk(clone) as Prisma.InputJsonValue;
  }
}
