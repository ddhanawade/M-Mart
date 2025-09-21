import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../environments/environment';

// Simple correlation id generator
function generateCorrelationId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 10)}`;
}

export const correlationInterceptor: HttpInterceptorFn = (req, next) => {
  // Reuse existing correlation id if server sent it, otherwise create and attach
  const existing = (req.headers.get('X-Correlation-Id') || sessionStorage.getItem('x-correlation-id')) ?? '';
  const correlationId = existing && existing.trim().length > 0 ? existing : generateCorrelationId();

  const enriched = req.clone({
    headers: req.headers.set('X-Correlation-Id', correlationId)
  });

  // Save for subsequent requests and to display in UI errors
  sessionStorage.setItem('x-correlation-id', correlationId);

  // Optionally log outbound request for local debugging
  if (!environment.production) {
    // eslint-disable-next-line no-console
    console.debug('[HTTP] ->', enriched.method, enriched.url, 'cid=', correlationId);
  }

  return next(enriched);
};


