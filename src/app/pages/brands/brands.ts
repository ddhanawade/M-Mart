import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-brands',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './brands.html',
  styleUrls: ['./brands.scss']
})
export class Brands {
  constructor(private router: Router) {}

  shopBrand(brand: string) {
    this.router.navigate(['/products'], { queryParams: { brand } });
  }
}


