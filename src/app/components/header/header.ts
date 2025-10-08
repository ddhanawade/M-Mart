import { Component, OnInit, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth';
import { CartService } from '../../services/cart';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class Header implements OnInit {
  searchQuery: string = '';
  cartItemCount: number = 0;
  isLoggedIn: boolean = false;
  userName: string = '';
  isMobileMenuOpen: boolean = false;
  isUserDropdownOpen: boolean = false;
  isProductDropdownOpen: boolean = false;
  isExploreOpen: boolean = false; // desktop Explore dropdown
  isExploreMobileOpen: boolean = false; // mobile Explore dropdown
  isLoggingOut: boolean = false;
  isScrolled: boolean = false;

  private authService = inject(AuthService);
  private cartService = inject(CartService);
  private router = inject(Router);

  ngOnInit() {
    // Subscribe to authentication state
    this.authService.isLoggedIn$.subscribe(isLoggedIn => {
      this.isLoggedIn = isLoggedIn;
    });

    this.authService.currentUser$.subscribe(user => {
      this.userName = user?.name || 'User';
    });

    // Subscribe to cart summary to reflect item count (use totalQuantity when available)
    this.cartService.cartSummary$.subscribe(summary => {
      if (summary && typeof summary.totalQuantity === 'number' && summary.totalQuantity > 0) {
        this.cartItemCount = summary.totalQuantity;
        return;
      }
      if (summary && typeof summary.totalItems === 'number') {
        this.cartItemCount = summary.totalItems;
        return;
      }
      const items = Array.isArray(summary?.items) ? summary.items : [];
      this.cartItemCount = items.reduce((sum, it: any) => sum + Number(it?.selectedQuantity ?? it?.quantity ?? 0), 0) || items.length;
    });

    // Fetch lightweight count on header init to handle page refresh
    this.cartService.getCartItemCount().subscribe(count => {
      if (typeof count === 'number') {
        this.cartItemCount = count;
      }
    });
  }

  // Handle scroll events for header styling
  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrolled = window.pageYOffset > 50;
  }

  // Close dropdowns when clicking outside
  @HostListener('document:click', ['$event'])
  closeDropdowns(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-dropdown-container')) {
      this.isUserDropdownOpen = false;
    }
    if (!target.closest('.product-dropdown-container')) {
      this.isProductDropdownOpen = false;
    }
    if (!target.closest('.explore-dropdown-container')) {
      this.isExploreOpen = false;
    }
  }

  onSearch() {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/products'], { 
        queryParams: { search: this.searchQuery.trim() } 
      });
      this.closeMobileMenu();
      this.searchQuery = '';
    }
  }

  onLogout() {
    if (this.isLoggingOut) return; // Prevent multiple logout attempts
    
    this.isLoggingOut = true;
    this.closeMobileMenu();
    this.closeAllDropdowns();
    
    this.authService.logout().subscribe({
      next: () => {
        this.isLoggingOut = false;
        console.log('Logout successful');
      },
      error: (error) => {
        this.isLoggingOut = false;
        console.error('Logout failed:', error);
        // Even if logout fails, the auth service handles clearing local data
      }
    });
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    this.closeAllDropdowns();
  }

  closeMobileMenu() {
    this.isMobileMenuOpen = false;
  }

  toggleUserDropdown(event: Event) {
    event.stopPropagation();
    this.isUserDropdownOpen = !this.isUserDropdownOpen;
    this.isProductDropdownOpen = false;
    this.isExploreOpen = false;
  }

  toggleProductDropdown(event: Event) {
    event.stopPropagation();
    this.isProductDropdownOpen = !this.isProductDropdownOpen;
    this.isUserDropdownOpen = false;
    this.isExploreOpen = false;
  }

  // Desktop hover handlers for product dropdown
  openProductDropdown() {
    this.isProductDropdownOpen = true;
    this.isUserDropdownOpen = false;
    this.isExploreOpen = false;
  }

  closeProductDropdown() {
    this.isProductDropdownOpen = false;
  }

  // Close dropdown after selecting an item
  onDropdownItemSelect() {
    this.isProductDropdownOpen = false;
  }

  closeAllDropdowns() {
    this.isUserDropdownOpen = false;
    this.isProductDropdownOpen = false;
    this.isExploreOpen = false;
    this.isExploreMobileOpen = false;
  }

  navigateToCategory(category: string) {
    this.router.navigate(['/products', category]);
    this.closeMobileMenu();
    this.closeAllDropdowns();
  }
}
