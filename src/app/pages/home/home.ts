import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home implements OnInit {
  isLoggedIn = false;

  private authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit() {
    this.authService.isLoggedIn$.subscribe(isLoggedIn => {
      this.isLoggedIn = isLoggedIn;
    });
  }

  navigateToCategory(category: string) {
    this.router.navigate(['/products', category]);
  }

  navigateToProducts() {
    this.router.navigate(['/products']);
  }

  navigateToFarmers() {
    this.router.navigate(['/farmers']);
  }
}
