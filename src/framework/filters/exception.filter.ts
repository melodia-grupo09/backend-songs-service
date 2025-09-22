import {
  ExceptionFilter as NestExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class ExceptionFilter implements NestExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    response.status(status).json({
      title: exceptionResponse['error'] as string,
      detail: Array.isArray(exceptionResponse['message'])
        ? exceptionResponse['message'].join('. ')
        : (exceptionResponse['message'] as string),
      status,
      instance: request.path,
    });
  }
}
