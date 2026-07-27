import {
  Body,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiParam } from '@nestjs/swagger';
import { CurrentUser, Public } from '../decorators';
import type { AuthenticatedUser } from '../decorators';
import { PaginationQueryDto, ReorderDto } from '../dto/pagination.dto';
import { PermissionsGuard } from '../guards/permissions.guard';
import { CrudService } from './crud.service';

/**
 * Shared REST surface for every content resource:
 *
 *   GET    /{resource}            public list (published only)
 *   GET    /{resource}/:idOrSlug  public detail
 *   POST   /{resource}            create        → `{resource}:write`
 *   PATCH  /{resource}/:id        update        → `{resource}:write`
 *   DELETE /{resource}/:id        delete        → `{resource}:delete`
 *   POST   /{resource}/reorder    drag & drop   → `{resource}:write`
 *
 * Subclasses override `create`/`update` purely to attach typed DTOs, which is
 * what gives the generated OpenAPI document per-resource request schemas.
 */
export abstract class CrudController<
  TRecord extends { id: string },
  TCreate = Record<string, unknown>,
  TUpdate = Partial<TCreate>,
> {
  protected constructor(
    protected readonly service: CrudService<TRecord>,
    protected readonly resource: string,
  ) {}

  /** Admins reading through the public endpoints also see drafts. */
  protected canSeeUnpublished(user?: AuthenticatedUser): boolean {
    return PermissionsGuard.isGranted(user, `${this.resource}:read`);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'List records (paginated, searchable, sortable)' })
  @ApiOkResponse({ description: 'Paginated collection' })
  list(@Query() query: PaginationQueryDto, @CurrentUser() user?: AuthenticatedUser) {
    return this.service.list(query, this.canSeeUnpublished(user));
  }

  @Get(':idOrSlug')
  @Public()
  @ApiOperation({ summary: 'Fetch a single record by id or slug' })
  @ApiParam({ name: 'idOrSlug' })
  findOne(@Param('idOrSlug') idOrSlug: string, @CurrentUser() user?: AuthenticatedUser) {
    return this.service.findOne(idOrSlug, this.canSeeUnpublished(user));
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a record' })
  create(@Body() dto: TCreate, @CurrentUser() _user?: AuthenticatedUser) {
    return this.service.create({ ...(dto as object) } as Record<string, unknown>);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a record' })
  update(@Param('id') id: string, @Body() dto: TUpdate) {
    return this.service.update(id, { ...(dto as object) } as Record<string, unknown>);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a record' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Post('reorder')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Persist a new display order' })
  reorder(@Body() dto: ReorderDto) {
    return this.service.reorder(dto.ids);
  }
}
