import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  timestamp: string;
  status: number;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  
  constructor(private http: HttpClient) {}

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else {
      // Server-side error
      if (error.error?.message) {
        errorMessage = error.error.message;
      } else {
        errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
      }
    }
    
    console.error('API Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  private getFullUrl(service: keyof typeof environment.api, endpoint: string): string {
    return `${environment.api[service]}${endpoint}`;
  }

  get<T>(service: keyof typeof environment.api, endpoint: string, params?: any, options?: { headers?: any }): Observable<T> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key].toString());
        }
      });
    }

    return this.http.get<ApiResponse<T>>(this.getFullUrl(service, endpoint), { params: httpParams, withCredentials: true, headers: options?.headers })
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
      );
  }

  post<T>(service: keyof typeof environment.api, endpoint: string, body: any, options?: { headers?: any }): Observable<T> {
    return this.http.post<ApiResponse<T>>(this.getFullUrl(service, endpoint), body, { withCredentials: true, headers: options?.headers })
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
      );
  }

  put<T>(service: keyof typeof environment.api, endpoint: string, body: any, options?: { headers?: any }): Observable<T> {
    return this.http.put<ApiResponse<T>>(this.getFullUrl(service, endpoint), body, { withCredentials: true, headers: options?.headers })
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
      );
  }

  delete<T>(service: keyof typeof environment.api, endpoint: string, options?: { headers?: any }): Observable<T> {
    return this.http.delete<ApiResponse<T>>(this.getFullUrl(service, endpoint), { withCredentials: true, headers: options?.headers })
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
      );
  }

  // For endpoints that return raw data without ApiResponse wrapper
  getRaw<T>(service: keyof typeof environment.api, endpoint: string, params?: any, options?: { headers?: any }): Observable<T> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key].toString());
        }
      });
    }

    return this.http.get<T>(this.getFullUrl(service, endpoint), { params: httpParams, withCredentials: true, headers: options?.headers })
      .pipe(catchError(this.handleError));
  }

  postRaw<T>(service: keyof typeof environment.api, endpoint: string, body: any, options?: { headers?: any }): Observable<T> {
    return this.http.post<T>(this.getFullUrl(service, endpoint), body, { withCredentials: true, headers: options?.headers })
      .pipe(catchError(this.handleError));
  }
} 