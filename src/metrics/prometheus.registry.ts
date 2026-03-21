import * as client from 'prom-client';

/** Histograma principal para comparar baselines antes/depois de otimizações. */
export const httpRequestDurationHistogram = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duração das requisições HTTP em segundos',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [
    0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10,
  ],
});

/** Requisições em voo (útil para correlacionar com carga). */
export const httpRequestsInFlight = new client.Gauge({
  name: 'http_requests_in_flight',
  help: 'Requisições HTTP sendo processadas no momento',
  labelNames: ['method', 'route'],
});

let defaultMetricsStarted = false;

export function startDefaultNodeMetrics(): void {
  if (defaultMetricsStarted) return;
  client.collectDefaultMetrics({
    prefix: 'nodejs_',
    labels: { app: 'vibenow-backend' },
  });
  defaultMetricsStarted = true;
}

export function getMetricsText(): Promise<string> {
  return client.register.metrics();
}

export function getMetricsContentType(): string {
  return client.register.contentType;
}
