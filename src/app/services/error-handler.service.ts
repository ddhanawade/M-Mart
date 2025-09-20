import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface AppError {
  id: string;
  message: string;
  type: 'error' | 'warning' | 'info' | 'success';
  timestamp: Date;
  details?: any;
  dismissible: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {
  private errorsSubject = new BehaviorSubject<AppError[]>([]);
  public errors$ = this.errorsSubject.asObservable();

  constructor() {}

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Add an error
  addError(message: string, type: AppError['type'] = 'error', details?: any, dismissible: boolean = true): void {
    const error: AppError = {
      id: this.generateId(),
      message,
      type,
      timestamp: new Date(),
      details,
      dismissible
    };

    const currentErrors = this.errorsSubject.value;
    this.errorsSubject.next([...currentErrors, error]);

    // Auto-dismiss success and info messages after 5 seconds
    if (type === 'success' || type === 'info') {
      setTimeout(() => {
        this.removeError(error.id);
      }, 5000);
    }
  }

  // Remove a specific error
  removeError(errorId: string): void {
    const currentErrors = this.errorsSubject.value;
    const filteredErrors = currentErrors.filter(error => error.id !== errorId);
    this.errorsSubject.next(filteredErrors);
  }

  // Clear all errors
  clearAll(): void {
    this.errorsSubject.next([]);
  }

  // Clear errors by type
  clearByType(type: AppError['type']): void {
    const currentErrors = this.errorsSubject.value;
    const filteredErrors = currentErrors.filter(error => error.type !== type);
    this.errorsSubject.next(filteredErrors);
  }

  // Handle HTTP errors
  handleHttpError(error: any): void {
    let message = 'An unexpected error occurred';
    
    if (error?.error?.message) {
      message = error.error.message;
    } else if (error?.message) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    }

    // Handle specific HTTP status codes
    switch (error?.status) {
      case 400:
        this.addError('Bad request. Please check your input.', 'error', error);
        break;
      case 401:
        this.addError('You are not authorized. Please login again.', 'warning', error);
        break;
      case 403:
        this.addError('Access forbidden. You do not have permission.', 'error', error);
        break;
      case 404:
        this.addError('The requested resource was not found.', 'error', error);
        break;
      case 408:
        this.addError('Request timeout. Please try again.', 'warning', error);
        break;
      case 409:
        this.addError('Conflict. The resource already exists or has been modified.', 'error', error);
        break;
      case 422:
        this.addError('Validation failed. Please check your input.', 'error', error);
        break;
      case 429:
        this.addError('Too many requests. Please wait and try again.', 'warning', error);
        break;
      case 500:
        this.addError('Server error. Please try again later.', 'error', error);
        break;
      case 502:
        this.addError('Service unavailable. Please try again later.', 'error', error);
        break;
      case 503:
        this.addError('Service temporarily unavailable. Please try again later.', 'warning', error);
        break;
      default:
        this.addError(message, 'error', error);
    }
  }

  // Handle network errors
  handleNetworkError(): void {
    this.addError(
      'Network connection failed. Please check your internet connection.',
      'error',
      null,
      true
    );
  }

  // Show success message
  showSuccess(message: string, dismissible: boolean = true): void {
    this.addError(message, 'success', null, dismissible);
  }

  // Show info message
  showInfo(message: string, dismissible: boolean = true): void {
    this.addError(message, 'info', null, dismissible);
  }

  // Show warning message
  showWarning(message: string, dismissible: boolean = true): void {
    this.addError(message, 'warning', null, dismissible);
  }

  // Get current errors
  getCurrentErrors(): AppError[] {
    return this.errorsSubject.value;
  }
} 