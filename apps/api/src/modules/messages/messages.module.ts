import {
  Body,
  Controller,
  Delete,
  Get,
  Injectable,
  Module,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { MessageStatus, Prisma } from '@prisma/client';
import { Throttle } from '@nestjs/throttler';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Audit, ClientMeta, Permissions, Public } from '../../common/decorators';
import { PaginationQueryDto, paginate } from '../../common/dto/pagination.dto';
import { PrismaService } from '../../common/prisma/prisma.service';

export class CreateMessageDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @ApiProperty()
  @IsEmail()
  @MaxLength(180)
  email!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(160)
  subject?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  company?: string;

  @ApiPropertyOptional({ example: '$5k – $15k' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  budget?: string;

  @ApiProperty()
  @IsString()
  @MinLength(20)
  @MaxLength(4000)
  body!: string;

  /** Honeypot: bots fill hidden fields, humans never see them. */
  @ApiPropertyOptional({ description: 'Leave empty — spam trap' })
  @IsOptional()
  @IsString()
  website?: string;
}

export class UpdateMessageDto {
  @ApiPropertyOptional({ enum: MessageStatus })
  @IsOptional()
  @IsEnum(MessageStatus)
  status?: MessageStatus;

  @ApiPropertyOptional({ description: 'Internal notes, never shown publicly' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateMessageDto, meta: { ip?: string; userAgent?: string }) {
    const { website, ...data } = dto;
    const looksLikeSpam = Boolean(website) || /https?:\/\//i.test(dto.name);

    const message = await this.prisma.message.create({
      data: {
        ...data,
        status: looksLikeSpam ? MessageStatus.SPAM : MessageStatus.NEW,
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
      select: { id: true, createdAt: true },
    });

    return { id: message.id, receivedAt: message.createdAt };
  }

  async list(query: PaginationQueryDto & { status?: string }) {
    const where: Prisma.MessageWhereInput = {};
    if (query.q) {
      where.OR = [
        { name: { contains: query.q, mode: 'insensitive' } },
        { email: { contains: query.q, mode: 'insensitive' } },
        { subject: { contains: query.q, mode: 'insensitive' } },
        { body: { contains: query.q, mode: 'insensitive' } },
      ];
    }
    const status = query.status as MessageStatus | undefined;
    if (status && Object.values(MessageStatus).includes(status)) {
      where.status = status;
    }

    const [rows, total, unread] = await Promise.all([
      this.prisma.message.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.message.count({ where }),
      this.prisma.message.count({ where: { status: MessageStatus.NEW } }),
    ]);

    return { ...paginate(rows, total, query.page, query.limit), unread };
  }

  findOne(id: string) {
    return this.prisma.message.findUniqueOrThrow({ where: { id } });
  }

  update(id: string, dto: UpdateMessageDto) {
    return this.prisma.message.update({
      where: { id },
      data: {
        ...dto,
        repliedAt: dto.status === MessageStatus.REPLIED ? new Date() : undefined,
      },
    });
  }

  async remove(id: string) {
    await this.prisma.message.delete({ where: { id } });
    return { id };
  }
}

@ApiTags('messages')
@Controller('messages')
@Audit('messages')
export class MessagesController {
  constructor(private readonly messages: MessagesService) {}

  @Post()
  @Public()
  @Throttle({ default: { limit: 5, ttl: 600_000 } })
  @ApiOperation({ summary: 'Public contact form submission' })
  create(@Body() dto: CreateMessageDto, @ClientMeta() meta: { ip?: string; userAgent?: string }) {
    return this.messages.create(dto, meta);
  }

  @Get()
  @ApiBearerAuth()
  @Permissions('messages:read')
  @ApiOperation({ summary: 'Inbox with unread count' })
  list(@Query() query: PaginationQueryDto, @Query('status') status?: string) {
    return this.messages.list(Object.assign(query, { status }));
  }

  @Get(':id')
  @ApiBearerAuth()
  @Permissions('messages:read')
  findOne(@Param('id') id: string) {
    return this.messages.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @Permissions('messages:write')
  @ApiOperation({ summary: 'Change status or add internal notes' })
  update(@Param('id') id: string, @Body() dto: UpdateMessageDto) {
    return this.messages.update(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @Permissions('messages:delete')
  remove(@Param('id') id: string) {
    return this.messages.remove(id);
  }
}

@Module({
  controllers: [MessagesController],
  providers: [MessagesService],
})
export class MessagesModule {}
