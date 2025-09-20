import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth';
import { LoginRequest, RegisterRequest } from '../../models/user.model';

@Component({
  selector: 'app-auth',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './auth.html',
  styleUrl: './auth.scss'
})
export class Auth implements OnInit {
  isLoginMode: boolean = true;
  isLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  // Login form data
  loginData: LoginRequest = {
    email: '',
    password: ''
  };

  // Register form data
  registerData: RegisterRequest = {
    name: '',
    email: '',
    password: '',
    phone: ''
  };

  // Password visibility
  showPassword: boolean = false;
  
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  ngOnInit() {
    // Check if user is already logged in
    this.authService.isLoggedIn$.subscribe(isLoggedIn => {
      if (isLoggedIn) {
        this.router.navigate(['/']);
      }
    });

    // Check route to determine login/register mode
    this.route.url.subscribe(segments => {
      if (segments.length > 0) {
        this.isLoginMode = segments[0].path === 'login' || segments[0].path === 'auth';
      }
    });
  }

  toggleMode() {
    this.isLoginMode = !this.isLoginMode;
    this.clearMessages();
    this.resetForms();
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  onSubmit() {
    if (this.isLoginMode) {
      this.onLogin();
    } else {
      this.onRegister();
    }
  }

  onLogin() {
    this.clearMessages();
    
    // Validation
    if (!this.loginData.email || !this.loginData.password) {
      this.errorMessage = 'Please fill in all fields';
      return;
    }

    if (!this.isValidEmail(this.loginData.email)) {
      this.errorMessage = 'Please enter a valid email address';
      return;
    }

    this.isLoading = true;

    this.authService.login(this.loginData).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.successMessage = 'Login successful! Redirecting...';
        
        // Redirect to previous page or home after successful login
        setTimeout(() => {
          const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
          this.router.navigate([returnUrl]);
        }, 1500);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.message || 'Login failed. Please try again.';
      }
    });
  }

  onRegister() {
    this.clearMessages();
    
    // Validation
    if (!this.registerData.name || !this.registerData.email || !this.registerData.password) {
      this.errorMessage = 'Please fill in all required fields';
      return;
    }

    if (!this.isValidEmail(this.registerData.email)) {
      this.errorMessage = 'Please enter a valid email address';
      return;
    }

    if (this.registerData.password.length < 6) {
      this.errorMessage = 'Password must be at least 6 characters long';
      return;
    }

    this.isLoading = true;

    this.authService.register(this.registerData).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.successMessage = 'Registration successful! Welcome aboard!';
        
        // Redirect after successful registration
        setTimeout(() => {
          const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
          this.router.navigate([returnUrl]);
        }, 1500);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.message || 'Registration failed. Please try again.';
      }
    });
  }

  // Quick login for demo purposes
  quickLogin() {
    this.loginData.email = 'demo@mahabaleshwermart.com';
    this.loginData.password = 'demo123';
    this.onLogin();
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private clearMessages() {
    this.errorMessage = '';
    this.successMessage = '';
  }

  private resetForms() {
    this.loginData = { email: '', password: '' };
    this.registerData = { name: '', email: '', password: '', phone: '' };
  }

  goBack() {
    window.history.back();
  }
}
