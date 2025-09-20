import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface LoadingState {
  [key: string]: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private loadingSubject = new BehaviorSubject<LoadingState>({});
  public loading$ = this.loadingSubject.asObservable();

  constructor() {}

  // Set loading state for a specific key
  setLoading(key: string, loading: boolean): void {
    const currentState = this.loadingSubject.value;
    this.loadingSubject.next({
      ...currentState,
      [key]: loading
    });
  }

  // Get loading state for a specific key
  getLoading(key: string): Observable<boolean> {
    return new Observable(observer => {
      this.loading$.subscribe(state => {
        observer.next(state[key] || false);
      });
    });
  }

  // Check if any loading is in progress
  isAnyLoading(): Observable<boolean> {
    return new Observable(observer => {
      this.loading$.subscribe(state => {
        const isLoading = Object.values(state).some(loading => loading);
        observer.next(isLoading);
      });
    });
  }

  // Check if specific loading is in progress
  isLoading(key: string): boolean {
    return this.loadingSubject.value[key] || false;
  }

  // Clear all loading states
  clearAll(): void {
    this.loadingSubject.next({});
  }

  // Clear specific loading state
  clear(key: string): void {
    const currentState = this.loadingSubject.value;
    const { [key]: removed, ...newState } = currentState;
    this.loadingSubject.next(newState);
  }

  // Get current loading state
  getCurrentState(): LoadingState {
    return this.loadingSubject.value;
  }

  // Common loading keys for the application
  static readonly Keys = {
    AUTH_LOGIN: 'auth.login',
    AUTH_REGISTER: 'auth.register',
    AUTH_LOGOUT: 'auth.logout',
    PRODUCTS_LOAD: 'products.load',
    PRODUCTS_SEARCH: 'products.search',
    PRODUCT_DETAIL: 'product.detail',
    CART_ADD: 'cart.add',
    CART_UPDATE: 'cart.update',
    CART_REMOVE: 'cart.remove',
    CART_LOAD: 'cart.load',
    ORDER_CREATE: 'order.create',
    ORDER_LOAD: 'order.load',
    ORDER_CANCEL: 'order.cancel',
    USER_PROFILE: 'user.profile',
    GENERAL: 'general'
  } as const;
} 