import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProductService } from '../../services/product';
import { WishlistService } from '../../services/wishlist';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './wishlist.html',
  styleUrls: ['./wishlist.scss']
})
export class Wishlist implements OnInit {
  items: any[] = [];
  isLoading = true;

  private productService = inject(ProductService);
  private wishlist = inject(WishlistService);

  ngOnInit(): void {
    this.load();
  }

  load() {
    const ids = this.wishlist.list();
    if (ids.length === 0) {
      this.items = [];
      this.isLoading = false;
      return;
    }
    this.productService.getProductsByIds(ids).subscribe({
      next: (list) => { this.items = list; this.isLoading = false; },
      error: () => { this.items = []; this.isLoading = false; }
    });
  }

  remove(id: string) {
    this.wishlist.remove(id);
    this.load();
  }
}


