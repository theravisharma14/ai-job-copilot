import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

export interface ErrorResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  message: string | string[];
  error?: string;
  stack?: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error: string | undefined;
    let stack: string | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else {
        message = (exceptionResponse as any).message || message;
        error = (exceptionResponse as any).error;
      }
      
      if (process.env.NODE_ENV === 'development') {
        stack = exception.stack;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      if (process.env.NODE_ENV === 'development') {
        stack = exception.stack;
      }
    }

    const errorResponse: ErrorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: Array.isArray(message) ? message : [message],
      ...(error && { error }),
      ...(stack && { stack }),
    };

    // Log error for monitoring
    console.error(`[${request.method}] ${request.url}`, {
      status,
      message,
      stack,
      userAgent: request.headers['user-agent'],
      ip: request.ip,
    });

    response.status(status).json(errorResponse);
  }
}
