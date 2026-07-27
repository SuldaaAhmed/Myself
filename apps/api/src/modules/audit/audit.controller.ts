import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../../common/decorators';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { AuditService } from './audit.service';

@ApiTags('audit')
@ApiBearerAuth()
@Controller('audit-log')
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  @Permissions('audit:read')
  @ApiOperation({ summary: 'Who changed what, when — newest first' })
  list(@Query() query: PaginationQueryDto) {
    return this.audit.list(query);
  }
}
