import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Request, Response } from 'express';

interface ErrorBody {
  statusCode: number;
  code: string;
  message: string | string[];
  path: string;
  timestamp: string;
  requestId?: string;
}

/** Single funnel for every error leaving the API, so clients get one shape. */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const body = this.toErrorBody(exception, request);

    if (body.statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${request.method} ${request.url} -> ${body.statusCode}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else {
      this.logger.warn(`${request.method} ${request.url} -> ${body.statusCode}: ${body.message}`);
    }

    response.status(body.statusCode).json(body);
  }

  private toErrorBody(exception: unknown, request: Request): ErrorBody {
    const base = {
      path: request.originalUrl,
      timestamp: new Date().toISOString(),
      requestId: request.headers['x-request-id'] as string | undefined,
    };

    if (exception instanceof HttpException) {
      const payload = exception.getResponse();
      const message =
        typeof payload === 'string'
          ? payload
          : ((payload as { message?: string | string[] }).message ?? exception.message);
      return {
        ...base,
        statusCode: exception.getStatus(),
        code: (payload as { code?: string })?.code ?? this.codeFor(exception.getStatus()),
        message,
      };
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return { ...base, ...this.mapPrismaError(exception) };
    }

    if (exception instanceof Prisma.PrismaClientValidationError) {
      return {
        ...base,
        statusCode: HttpStatus.BAD_REQUEST,
        code: 'INVALID_PAYLOAD',
        message: 'The submitted data does not match the expected shape.',
      };
    }

    return {
      ...base,
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_ERROR',
      message: 'Unexpected server error',
    };
  }

  private mapPrismaError(error: Prisma.PrismaClientKnownRequestError) {
    const target = (error.meta?.target as string[] | string | undefined) ?? [];
    const field = Array.isArray(target) ? target.join(', ') : target;

    switch (error.code) {
      case 'P2002':
        return {
          statusCode: HttpStatus.CONFLICT,
          code: 'DUPLICATE_VALUE',
          message: `A record with this ${field || 'value'} already exists.`,
        };
      case 'P2003':
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          code: 'INVALID_RELATION',
          message: 'A related record referenced by this request does not exist.',
        };
      case 'P2025':
        return {
          statusCode: HttpStatus.NOT_FOUND,
          code: 'NOT_FOUND',
          message: 'The requested record does not exist.',
        };
      default:
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          code: `PRISMA_${error.code}`,
          message: 'The database rejected this request.',
        };
    }
  }

  private codeFor(status: number): string {
    return (
      {
        400: 'BAD_REQUEST',
        401: 'UNAUTHORIZED',
        403: 'FORBIDDEN',
        404: 'NOT_FOUND',
        409: 'CONFLICT',
        422: 'UNPROCESSABLE_ENTITY',
        429: 'RATE_LIMITED',
      }[status] ?? 'ERROR'
    );
  }
}
