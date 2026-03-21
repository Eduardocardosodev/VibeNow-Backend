import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { Request, Response } from 'express';
import {
  httpRequestDurationHistogram,
  httpRequestsInFlight,
} from './prometheus.registry';

/** Reduz cardinalidade: troca ids numéricos por :id na URL. */
export function normalizeRoutePath(path: string): string {
  if (!path) return 'unknown';
  const base = path.split('?')[0] || path;
  return base.replace(/\/\d+/g, '/:id');
}

function routeLabel(req: Request): string {
  const expressRoute = (req as Request & { route?: { path?: string } }).route
    ?.path;
  if (expressRoute) {
    return normalizeRoutePath(expressRoute);
  }
  return normalizeRoutePath(req.path || req.url || 'unknown');
}

@Injectable()
export class HttpMetricsInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();
    const method = req.method;
    const route = routeLabel(req);

    const labels = { method, route };
    httpRequestsInFlight.inc(labels);

    const start = process.hrtime.bigint();

    return next.handle().pipe(
      finalize(() => {
        httpRequestsInFlight.dec(labels);
        const seconds = Number(process.hrtime.bigint() - start) / 1e9;
        const statusCode = String(res.statusCode || 500);
        httpRequestDurationHistogram.observe(
          { method, route, status_code: statusCode },
          seconds,
        );
      }),
    );
  }
}
