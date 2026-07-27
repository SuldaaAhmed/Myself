import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Injectable,
  Logger,
  Module,
  Param,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MediaProvider } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';
import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import sharp from 'sharp';
import { Audit, CurrentUser, Permissions } from '../../common/decorators';
import type { AuthenticatedUser } from '../../common/decorators';
import { PaginationQueryDto, paginate } from '../../common/dto/pagination.dto';
import { PrismaService } from '../../common/prisma/prisma.service';

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/svg+xml',
  'application/pdf',
]);

const MAX_BYTES = 8 * 1024 * 1024;

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);
  private readonly useCloudinary: boolean;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    const cloudName = this.config.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.config.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.config.get<string>('CLOUDINARY_API_SECRET');
    this.useCloudinary = Boolean(cloudName && apiKey && apiSecret);

    if (this.useCloudinary) {
      cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });
      this.logger.log('Media uploads will be stored on Cloudinary');
    } else {
      this.logger.log('Cloudinary is not configured — storing uploads on local disk');
    }
  }

  async upload(file: Express.Multer.File, folder: string, user: AuthenticatedUser) {
    if (!file) throw new BadRequestException('No file received');
    if (!ALLOWED_MIME.has(file.mimetype)) {
      throw new BadRequestException(`Unsupported file type: ${file.mimetype}`);
    }
    if (file.size > MAX_BYTES) {
      throw new BadRequestException('Files must be 8 MB or smaller');
    }

    const dimensions = await this.probe(file);

    const stored = this.useCloudinary
      ? await this.toCloudinary(file, folder)
      : await this.toDisk(file, folder);

    return this.prisma.media.create({
      data: {
        ...stored,
        filename: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        width: dimensions?.width,
        height: dimensions?.height,
        folder,
        uploadedById: user.id,
      },
    });
  }

  private async probe(file: Express.Multer.File): Promise<{ width?: number; height?: number } | null> {
    if (!file.mimetype.startsWith('image/') || file.mimetype === 'image/svg+xml') return null;
    try {
      const meta = await sharp(file.buffer).metadata();
      return { width: meta.width, height: meta.height };
    } catch {
      return null;
    }
  }

  private async toCloudinary(file: Express.Multer.File, folder: string) {
    const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder: `portfolio/${folder}`, resource_type: 'auto' }, (error, uploaded) => {
          if (error || !uploaded) return reject(error ?? new Error('Cloudinary upload failed'));
          resolve({ secure_url: uploaded.secure_url, public_id: uploaded.public_id });
        })
        .end(file.buffer);
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      provider: MediaProvider.CLOUDINARY,
    };
  }

  private async toDisk(file: Express.Multer.File, folder: string) {
    const root = this.config.get<string>('UPLOAD_DIR', './uploads');
    const directory = join(root, folder);
    await mkdir(directory, { recursive: true });

    const name = `${randomUUID()}${extname(file.originalname) || ''}`;
    await writeFile(join(directory, name), file.buffer);

    return {
      url: `/uploads/${folder}/${name}`,
      publicId: `${folder}/${name}`,
      provider: MediaProvider.LOCAL,
    };
  }

  async list(query: PaginationQueryDto, folder?: string) {
    const where = {
      ...(folder ? { folder } : {}),
      ...(query.q ? { filename: { contains: query.q, mode: 'insensitive' as const } } : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.media.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.media.count({ where }),
    ]);

    return paginate(rows, total, query.page, query.limit);
  }

  async remove(id: string) {
    const media = await this.prisma.media.findUniqueOrThrow({ where: { id } });

    try {
      if (media.provider === MediaProvider.CLOUDINARY && media.publicId) {
        await cloudinary.uploader.destroy(media.publicId);
      } else if (media.publicId) {
        await unlink(join(this.config.get<string>('UPLOAD_DIR', './uploads'), media.publicId));
      }
    } catch (error) {
      // The database row is the source of truth for the CMS; a missing blob
      // should not block the delete.
      this.logger.warn(`Could not remove blob for media ${id}: ${(error as Error).message}`);
    }

    await this.prisma.media.delete({ where: { id } });
    return { id };
  }
}

@ApiTags('media')
@ApiBearerAuth()
@Controller('media')
@Audit('media')
export class MediaController {
  constructor(private readonly media: MediaService) {}

  @Post('upload')
  @Permissions('media:write')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload an image or PDF to the media library' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        folder: { type: 'string', example: 'projects' },
      },
      required: ['file'],
    },
  })
  upload(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: AuthenticatedUser,
    @Query('folder') folder = 'general',
  ) {
    return this.media.upload(file, folder.replace(/[^a-z0-9-_]/gi, ''), user);
  }

  @Get()
  @Permissions('media:read')
  @ApiOperation({ summary: 'Browse the media library' })
  list(@Query() query: PaginationQueryDto, @Query('folder') folder?: string) {
    return this.media.list(query, folder);
  }

  @Delete(':id')
  @Permissions('media:delete')
  @ApiOperation({ summary: 'Delete a media item and its stored blob' })
  remove(@Param('id') id: string) {
    return this.media.remove(id);
  }
}

@Module({
  controllers: [MediaController],
  providers: [MediaService],
  exports: [MediaService],
})
export class MediaModule {}
