import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError, BehaviorSubject, filter, take } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from '../services/auth';

// Global refresh token subject to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Don't add auth headers to login/register/refresh requests
  if (req.url.includes('/auth/login') || 
      req.url.includes('/auth/register') || 
      req.url.includes('/auth/refresh') ||
      req.url.includes('/actuator/health')) {
    return next(req);
  }

  const token = localStorage.getItem(environment.auth.tokenKey);
  
  if (token) {
    const authReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
    
    return next(authReq).pipe(
      catchError(error => {
        // Handle 401 unauthorized - token might be expired
        if (error.status === 401) {
          return handle401Error(authReq, next);
        }
        return throwError(() => error);
      })
    );
  }
  
  return next(req);
};

function handle401Error(request: HttpRequest<any>, next: HttpHandlerFn) {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    const refreshToken = localStorage.getItem(environment.auth.refreshTokenKey);
    
    if (refreshToken) {
      const authService = inject(AuthService);
      
      return authService.refreshToken().pipe(
        switchMap((authResponse: any) => {
          isRefreshing = false;
          refreshTokenSubject.next(authResponse.accessToken);
          
          // Retry the original request with new token
          const newAuthReq = request.clone({
            headers: request.headers.set('Authorization', `Bearer ${authResponse.accessToken}`)
          });
          
          return next(newAuthReq);
        }),
        catchError((error) => {
          isRefreshing = false;
          
          // Refresh failed, clear tokens and redirect to login
          localStorage.removeItem(environment.auth.tokenKey);
          localStorage.removeItem(environment.auth.refreshTokenKey);
          localStorage.removeItem(environment.auth.userKey);
          
          // Redirect to login page
          window.location.href = '/auth';
          
          return throwError(() => error);
        })
      );
    } else {
      // No refresh token available, clear storage and redirect
      isRefreshing = false;
      localStorage.removeItem(environment.auth.tokenKey);
      localStorage.removeItem(environment.auth.refreshTokenKey);
      localStorage.removeItem(environment.auth.userKey);
      
      window.location.href = '/auth';
      return throwError(() => new Error('No refresh token available'));
    }
  } else {
    // If already refreshing, wait for the new token
    return refreshTokenSubject.pipe(
      filter(token => token != null),
      take(1),
      switchMap(jwt => {
        const newAuthReq = request.clone({
          headers: request.headers.set('Authorization', `Bearer ${jwt}`)
        });
        return next(newAuthReq);
      })
    );
  }
} 