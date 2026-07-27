import { Body, Controller, Delete, Get, Param, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { Prisma } from '@prisma/client';
import { IsObject, IsOptional, IsString, MaxLength } from 'class-validator';
import { Audit, Permissions, Public } from '../../common/decorators';
import { SettingsService } from './settings.service';

export class UpsertSettingDto {
  @ApiProperty({
    description: 'Arbitrary JSON document — the admin UI decides the shape per key',
    example: { headline: 'I build products that ship', ctaLabel: 'Start a project' },
  })
  @IsObject()
  value!: Record<string, unknown>;

  @ApiPropertyOptional({ example: 'hero' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  group?: string;

  @ApiPropertyOptional({ example: 'Hero section' })
  @IsOptional()
  @IsString()
  label?: string;
}

@ApiTags('settings')
@Controller('settings')
@Audit('settings')
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get('public')
  @Public()
  @ApiOperation({ summary: 'Flat map of every website-visible setting' })
  publicSettings() {
    return this.settings.publicSettings();
  }

  @Get()
  @ApiBearerAuth()
  @Permissions('settings:read')
  @ApiOperation({ summary: 'All settings, optionally filtered by group' })
  list(@Query('group') group?: string) {
    return group ? this.settings.byGroup(group) : this.settings.all();
  }

  @Get(':key')
  @Public()
  @ApiOperation({ summary: 'Read a single setting document' })
  get(@Param('key') key: string) {
    return this.settings.get(key);
  }

  @Put(':key')
  @ApiBearerAuth()
  @Permissions('settings:write')
  @ApiOperation({ summary: 'Create or replace a setting document' })
  upsert(@Param('key') key: string, @Body() dto: UpsertSettingDto) {
    return this.settings.set(key, dto.value as Prisma.InputJsonValue, dto.group, dto.label);
  }

  @Delete(':key')
  @ApiBearerAuth()
  @Permissions('settings:delete')
  @ApiOperation({ summary: 'Delete a setting document' })
  remove(@Param('key') key: string) {
    return this.settings.remove(key);
  }
}
