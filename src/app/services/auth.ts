import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap, map, catchError, of } from 'rxjs';
import { Router } from '@angular/router';
import { User, LoginRequest, RegisterRequest } from '../models/user.model';
import { ApiService } from './api.service';
import { environment } from '../../environments/environment';

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
  expiresIn: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isLoggedInSubject = new BehaviorSubject<boolean>(false);
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private loadingSubject = new BehaviorSubject<boolean>(false);

  public isLoggedIn$ = this.isLoggedInSubject.asObservable();
  public currentUser$ = this.currentUserSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {
    // Check if user is already logged in (from localStorage)
    this.checkAuthState();
  }

  private checkAuthState() {
    const token = localStorage.getItem(environment.auth.tokenKey);
    const userData = localStorage.getItem(environment.auth.userKey);
    
    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        this.currentUserSubject.next(user);
        this.isLoggedInSubject.next(true);
        
        // Optionally verify token with backend
        this.verifyToken().subscribe({
          next: (isValid) => {
            if (!isValid) {
              this.logout();
            }
          },
          error: () => {
            this.logout();
          }
        });
      } catch (error) {
        console.error('Error parsing user data from localStorage:', error);
        this.clearAuthData();
      }
    }
  }

  private verifyToken(): Observable<boolean> {
    return this.apiService.get<User>('userService', '/api/auth/me').pipe(
      map(user => {
        this.currentUserSubject.next(user);
        return true;
      }),
      catchError(() => of(false))
    );
  }

  private clearAuthData() {
    localStorage.removeItem(environment.auth.tokenKey);
    localStorage.removeItem(environment.auth.refreshTokenKey);
    localStorage.removeItem(environment.auth.userKey);
  }

  private setAuthData(authResponse: AuthResponse) {
    localStorage.setItem(environment.auth.tokenKey, authResponse.accessToken);
    localStorage.setItem(environment.auth.refreshTokenKey, authResponse.refreshToken);
    localStorage.setItem(environment.auth.userKey, JSON.stringify(authResponse.user));
    
    this.currentUserSubject.next(authResponse.user);
    this.isLoggedInSubject.next(true);
  }

  login(loginData: LoginRequest): Observable<AuthResponse> {
    this.loadingSubject.next(true);
    
    return this.apiService.post<AuthResponse>('userService', '/api/auth/login', {
      email: loginData.email,
      password: loginData.password
    }).pipe(
      tap(authResponse => {
        this.setAuthData(authResponse);
      }),
      catchError(error => {
        console.error('Login error:', error);
        throw error;
      }),
      tap(() => this.loadingSubject.next(false))
    );
  }

  register(registerData: RegisterRequest): Observable<AuthResponse> {
    this.loadingSubject.next(true);
    
    return this.apiService.post<AuthResponse>('userService', '/api/auth/register', {
      name: registerData.name,
      email: registerData.email,
      password: registerData.password,
      phone: registerData.phone
    }).pipe(
      tap(authResponse => {
        this.setAuthData(authResponse);
      }),
      catchError(error => {
        console.error('Registration error:', error);
        throw error;
      }),
      tap(() => this.loadingSubject.next(false))
    );
  }

  refreshToken(): Observable<AuthResponse> {
    const refreshToken = localStorage.getItem(environment.auth.refreshTokenKey);
    
    if (!refreshToken) {
      this.logout();
      throw new Error('No refresh token available');
    }

    return this.apiService.post<AuthResponse>('userService', '/api/auth/refresh', {
      refreshToken: refreshToken
    }).pipe(
      tap(authResponse => {
        this.setAuthData(authResponse);
      }),
      catchError(error => {
        console.error('Token refresh error:', error);
        this.logout();
        throw error;
      })
    );
  }

  logout(): Observable<any> {
    const token = localStorage.getItem(environment.auth.tokenKey);
    
    // Call logout endpoint if token exists
    const logoutRequest = token ? 
      this.apiService.post('userService', '/api/auth/logout', {}) :
      of(null);

    return logoutRequest.pipe(
      tap(() => {
        this.currentUserSubject.next(null);
        this.isLoggedInSubject.next(false);
        this.clearAuthData();
        this.router.navigate(['/auth']);
      }),
      catchError(error => {
        // Even if logout fails on server, clear local data
        console.error('Logout error:', error);
        this.currentUserSubject.next(null);
        this.isLoggedInSubject.next(false);
        this.clearAuthData();
        this.router.navigate(['/auth']);
        return of(null);
      })
    );
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return this.isLoggedInSubject.value;
  }

  getToken(): string | null {
    return localStorage.getItem(environment.auth.tokenKey);
  }

  // Update user profile
  updateProfile(userData: Partial<User>): Observable<User> {
    return this.apiService.put<User>('userService', '/api/users/profile', userData).pipe(
      tap(updatedUser => {
        this.currentUserSubject.next(updatedUser);
        localStorage.setItem(environment.auth.userKey, JSON.stringify(updatedUser));
      })
    );
  }

  // Change password
  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    return this.apiService.post('userService', '/api/users/change-password', {
      currentPassword,
      newPassword
    });
  }

  // Request password reset
  requestPasswordReset(email: string): Observable<any> {
    return this.apiService.post('userService', '/api/auth/forgot-password', { email });
  }

  // Reset password with token
  resetPassword(token: string, newPassword: string): Observable<any> {
    return this.apiService.post('userService', '/api/auth/reset-password', {
      token,
      newPassword
    });
  }

  // Verify email
  verifyEmail(token: string): Observable<any> {
    return this.apiService.post('userService', '/api/auth/verify-email', { token });
  }

  // Resend verification email
  resendVerificationEmail(): Observable<any> {
    return this.apiService.post('userService', '/api/auth/resend-verification', {});
  }
}
