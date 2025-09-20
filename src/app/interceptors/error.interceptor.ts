import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ErrorHandlerService } from '../services/error-handler.service';
import { Router } from '@angular/router';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const errorHandler = inject(ErrorHandlerService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Handle different types of errors
      if (error.error instanceof ErrorEvent) {
        // Client-side error
        console.error('Client-side error:', error.error.message);
        errorHandler.handleNetworkError();
      } else {
        // Server-side error
        console.error('Server-side error:', error);
        
        // Handle 401 specifically - redirect to login
        if (error.status === 401) {
          // Clear local storage
          localStorage.clear();
          sessionStorage.clear();
          
          // Redirect to login page
          router.navigate(['/auth'], { 
            queryParams: { returnUrl: router.url }
          });
        } else {
          // Handle other errors
          errorHandler.handleHttpError(error);
        }
      }

      // Re-throw the error so components can still handle it if needed
      return throwError(() => error);
    })
  );
}; 