import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class SecurityInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        return this.sanitize(data);
      }),
    );
  }

  private sanitize(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.sanitize(item));
    }

    const sanitizedData = { ...data };

    // Remove sensitive fields
    const sensitiveFields = ['stellarSecretKey', 'secretKey', 'encryptedSecret'];
    sensitiveFields.forEach((field) => {
      if (field in sanitizedData) {
        delete sanitizedData[field];
      }
    });

    // Recursively sanitize nested objects
    for (const key in sanitizedData) {
      if (sanitizedData[key] && typeof sanitizedData[key] === 'object') {
        sanitizedData[key] = this.sanitize(sanitizedData[key]);
      }
    }

    return sanitizedData;
  }
}
