import { Component, inject, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { CartService } from '../../services/cart';

@Component({
  selector: 'app-mobile-nav',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './mobile-nav.html',
  styleUrls: ['./mobile-nav.scss']
})
export class MobileNav implements OnInit {
  @Input() cartCount: number = 0;
  private router = inject(Router);
  private cartService = inject(CartService);

  isActive(path: string): boolean {
    return this.router.isActive(path, { paths: 'subset', queryParams: 'ignored', fragment: 'ignored', matrixParams: 'ignored' });
  }

  ngOnInit() {
    this.cartService.cartSummary$.subscribe(summary => {
      if (summary && typeof summary.totalQuantity === 'number' && summary.totalQuantity > 0) {
        this.cartCount = summary.totalQuantity;
        return;
      }
      if (summary && typeof summary.totalItems === 'number') {
        this.cartCount = summary.totalItems;
        return;
      }
      const items = Array.isArray(summary?.items) ? summary.items : [];
      this.cartCount = items.reduce((sum: number, it: any) => sum + Number(it?.selectedQuantity ?? it?.quantity ?? 0), 0) || items.length;
    });

    this.cartService.getCartItemCount().subscribe(count => {
      if (typeof count === 'number') {
        this.cartCount = count;
      }
    });
  }
}


