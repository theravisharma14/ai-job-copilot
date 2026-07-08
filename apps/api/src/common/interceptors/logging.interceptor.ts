import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    
    const startTime = Date.now();
    const { method, url, ip } = request;

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        const statusCode = response.statusCode;
        
        console.log(`[${method}] ${url}`, {
          statusCode,
          duration: `${duration}ms`,
          ip,
          userAgent: request.headers['user-agent'],
          userId: request.user?.sub || 'anonymous',
        });
      }),
    );
  }
}
