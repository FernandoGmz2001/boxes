import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { parseHttpMessage } from '../../errors/parse-http-message.js';

interface IHttpErrorBody {
  statusCode: number;
  timestamp: string;
  path: string;
  message: string | string[];
}

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status: number = exception.getStatus();
    const body: IHttpErrorBody = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: readExceptionMessage(exception),
    };

    response.status(status).json(body);
  }
}

function readExceptionMessage(exception: HttpException): string | string[] {
  const exceptionBody: string | object = exception.getResponse();

  if (typeof exceptionBody === 'string') {
    return parseHttpMessage(exceptionBody);
  }

  if (!('message' in exceptionBody)) {
    return exception.message;
  }

  const message: unknown = exceptionBody.message;

  if (typeof message === 'string') {
    return parseHttpMessage(message);
  }

  if (
    Array.isArray(message) &&
    message.every((item: unknown): item is string => typeof item === 'string')
  ) {
    return message.map((item: string) => parseHttpMessage(item));
  }

  return exception.message;
}
