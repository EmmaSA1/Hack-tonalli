import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class SecretKeySanitizerInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const isExportSecret =
      request.method === 'POST' &&
      request.url.includes('/users/me/wallet/export-secret');

    return next.handle().pipe(
      map((data) => {
        if (isExportSecret) {
          return data;
        }
        return this.sanitize(data);
      }),
    );
  }

  private sanitize(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitize(item));
    }

    if (typeof obj === 'object') {
      const sanitized: any = {};
      for (const key of Object.keys(obj)) {
        if (key === 'stellarSecretKey') {
          continue;
        }
        sanitized[key] = this.sanitize(obj[key]);
      }
      return sanitized;
    }

    return obj;
  }
}