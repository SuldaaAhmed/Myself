import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Injectable,
  Module,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiProperty,
  ApiPropertyOptional,
  ApiTags,
  PartialType,
} from '@nestjs/swagger';
import { Prisma } from '@prisma/client';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Audit, CurrentUser, Permissions } from '../../common/decorators';
import type { AuthenticatedUser } from '../../common/decorators';
import { PaginationQueryDto, paginate } from '../../common/dto/pagination.dto';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuthService } from '../auth/auth.service';

const SAFE_USER_SELECT = {
  id: true,
  email: true,
  name: true,
  jobTitle: true,
  avatarUrl: true,
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
  roles: { select: { id: true, name: true } },
} satisfies Prisma.UserSelect;

export class CreateUserDto {
  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @ApiProperty({ minLength: 10 })
  @IsString()
  @MinLength(10)
  @MaxLength(128)
  password!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  jobTitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiPropertyOptional({ type: [String], description: 'Role ids' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roleIds?: string[];

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateUserDto extends PartialType(CreateUserDto) {}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: PaginationQueryDto) {
    const where: Prisma.UserWhereInput = query.q
      ? {
          OR: [
            { name: { contains: query.q, mode: 'insensitive' } },
            { email: { contains: query.q, mode: 'insensitive' } },
          ],
        }
      : {};

    const [rows, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: query.skip,
        take: query.limit,
        select: SAFE_USER_SELECT,
      }),
      this.prisma.user.count({ where }),
    ]);

    return paginate(rows, total, query.page, query.limit);
  }

  findOne(id: string) {
    return this.prisma.user.findUniqueOrThrow({ where: { id }, select: SAFE_USER_SELECT });
  }

  async create(dto: CreateUserDto) {
    const { password, roleIds, ...rest } = dto;
    return this.prisma.user.create({
      data: {
        ...rest,
        email: rest.email.toLowerCase().trim(),
        passwordHash: await AuthService.hashPassword(password),
        roles: roleIds?.length ? { connect: roleIds.map((id) => ({ id })) } : undefined,
      },
      select: SAFE_USER_SELECT,
    });
  }

  async update(id: string, dto: UpdateUserDto) {
    const { password, roleIds, ...rest } = dto;
    return this.prisma.user.update({
      where: { id },
      data: {
        ...rest,
        ...(rest.email ? { email: rest.email.toLowerCase().trim() } : {}),
        ...(password ? { passwordHash: await AuthService.hashPassword(password) } : {}),
        ...(roleIds ? { roles: { set: roleIds.map((roleId) => ({ id: roleId })) } } : {}),
      },
      select: SAFE_USER_SELECT,
    });
  }

  async remove(id: string, actor: AuthenticatedUser) {
    if (id === actor.id) throw new ForbiddenException('You cannot delete your own account');

    const owners = await this.prisma.user.count({
      where: { roles: { some: { name: 'owner' } }, isActive: true },
    });
    const target = await this.prisma.user.findUniqueOrThrow({
      where: { id },
      include: { roles: true },
    });

    if (owners <= 1 && target.roles.some((role) => role.name === 'owner')) {
      throw new BadRequestException('The last owner account cannot be removed');
    }

    await this.prisma.user.delete({ where: { id } });
    return { id };
  }
}

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@Audit('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @Permissions('users:read')
  @ApiOperation({ summary: 'List dashboard accounts' })
  list(@Query() query: PaginationQueryDto) {
    return this.users.list(query);
  }

  @Get(':id')
  @Permissions('users:read')
  findOne(@Param('id') id: string) {
    return this.users.findOne(id);
  }

  @Post()
  @Permissions('users:write')
  @ApiOperation({ summary: 'Invite a new dashboard user' })
  create(@Body() dto: CreateUserDto) {
    return this.users.create(dto);
  }

  @Patch(':id')
  @Permissions('users:write')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.users.update(id, dto);
  }

  @Delete(':id')
  @Permissions('users:delete')
  remove(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.users.remove(id, actor);
  }
}

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
