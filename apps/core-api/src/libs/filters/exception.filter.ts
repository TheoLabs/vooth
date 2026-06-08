import {
  type ArgumentsHost,
  Catch,
  HttpException,
  HttpStatus,
  Logger,
  ExceptionFilter as NestExceptionFilter,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Context, ContextKey } from '@common/context';
import { ConfigsService } from '@configs';
import { getLogContext } from '@libs/logger';

@Catch()
export class ExceptionFilter implements NestExceptionFilter {
  private readonly logger = new Logger();

  constructor(
    private readonly context: Context,
    private readonly configsService: ConfigsService
  ) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse = exception instanceof HttpException ? exception.getResponse() : 'Internal Server Error';

    const txId = this.context.get<string>(ContextKey.TXID);
    const stack = exception instanceof Error ? exception.stack : '';

    const logPayload = {
      message: `[${request.method}] ${request.url} - ${txId}${'\n' + stack}`,
      txId,
      stack,
      error: exceptionResponse,
      ...getLogContext(request),
    };

    if (status >= Number(HttpStatus.INTERNAL_SERVER_ERROR)) {
      this.logger.error(logPayload);
    } else {
      this.logger.warn(logPayload);
    }

    response.status(status).json({
      data: {
        message:
          status >= Number(HttpStatus.INTERNAL_SERVER_ERROR)
            ? '서버에 예기치 않은 오류가 발생했습니다.'
            : exception instanceof Error && exception.cause
              ? exception.cause
              : typeof exceptionResponse === 'string'
                ? exceptionResponse
                : (exceptionResponse as any).message || exceptionResponse,
      },
    });
  }
}
