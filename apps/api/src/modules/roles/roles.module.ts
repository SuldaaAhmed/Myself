import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Injectable,
  Module,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiProperty,
  ApiPropertyOptional,
  ApiTags,
  PartialType,
} from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Audit, Permissions } from '../../common/decorators';
import { PrismaService } from '../../common/prisma/prisma.service';

export class CreateRoleDto {
  @ApiProperty({ example: 'editor' })
  @IsString()
  @MinLength(2)
  @MaxLength(40)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;

  @ApiPropertyOptional({ type: [String], description: 'Permission keys, e.g. projects:write' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissionKeys?: string[];
}

export class UpdateRoleDto extends PartialType(CreateRoleDto) {}

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.role.findMany({
      orderBy: { name: 'asc' },
      include: {
        permissions: { orderBy: { key: 'asc' } },
        _count: { select: { users: true } },
      },
    });
  }

  findOne(id: string) {
    return this.prisma.role.findUniqueOrThrow({
      where: { id },
      include: { permissions: true, users: { select: { id: true, name: true, email: true } } },
    });
  }

  create(dto: CreateRoleDto) {
    return this.prisma.role.create({
      data: {
        name: dto.name.toLowerCase().trim(),
        description: dto.description,
        permissions: dto.permissionKeys?.length
          ? { connect: dto.permissionKeys.map((key) => ({ key })) }
          : undefined,
      },
      include: { permissions: true },
    });
  }

  async update(id: string, dto: UpdateRoleDto) {
    const role = await this.prisma.role.findUniqueOrThrow({ where: { id } });
    if (role.isSystem && dto.name && dto.name !== role.name) {
      throw new BadRequestException('System roles cannot be renamed');
    }

    return this.prisma.role.update({
      where: { id },
      data: {
        ...(dto.name ? { name: dto.name.toLowerCase().trim() } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.permissionKeys
          ? { permissions: { set: dto.permissionKeys.map((key) => ({ key })) } }
          : {}),
      },
      include: { permissions: true },
    });
  }

  async remove(id: string) {
    const role = await this.prisma.role.findUniqueOrThrow({
      where: { id },
      include: { _count: { select: { users: true } } },
    });
    if (role.isSystem) throw new BadRequestException('System roles cannot be deleted');
    if (role._count.users > 0) {
      throw new BadRequestException('Reassign the users on this role before deleting it');
    }

    await this.prisma.role.delete({ where: { id } });
    return { id };
  }
}

@Injectable()
export class PermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Grouped by resource, which is how the role editor renders them. */
  async grouped() {
    const permissions = await this.prisma.permission.findMany({ orderBy: { key: 'asc' } });
    const groups = new Map<string, typeof permissions>();
    for (const permission of permissions) {
      const bucket = groups.get(permission.resource) ?? [];
      bucket.push(permission);
      groups.set(permission.resource, bucket);
    }
    return [...groups.entries()].map(([resource, items]) => ({ resource, permissions: items }));
  }
}

@ApiTags('roles')
@ApiBearerAuth()
@Controller('roles')
@Audit('roles')
export class RolesController {
  constructor(private readonly roles: RolesService) {}

  @Get()
  @Permissions('roles:read')
  @ApiOperation({ summary: 'Roles with their permissions and user counts' })
  list() {
    return this.roles.list();
  }

  @Get(':id')
  @Permissions('roles:read')
  findOne(@Param('id') id: string) {
    return this.roles.findOne(id);
  }

  @Post()
  @Permissions('roles:write')
  create(@Body() dto: CreateRoleDto) {
    return this.roles.create(dto);
  }

  @Patch(':id')
  @Permissions('roles:write')
  update(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.roles.update(id, dto);
  }

  @Delete(':id')
  @Permissions('roles:delete')
  remove(@Param('id') id: string) {
    return this.roles.remove(id);
  }
}

@ApiTags('roles')
@ApiBearerAuth()
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissions: PermissionsService) {}

  @Get()
  @Permissions('roles:read')
  @ApiOperation({ summary: 'Every permission the API enforces, grouped by resource' })
  grouped() {
    return this.permissions.grouped();
  }
}

@Module({
  controllers: [RolesController, PermissionsController],
  providers: [RolesService, PermissionsService],
})
export class RolesModule {}
