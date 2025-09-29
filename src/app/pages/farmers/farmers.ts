import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-farmers',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './farmers.html',
  styleUrls: ['./farmers.scss']
})
export class Farmers {
  constructor(private router: Router) {}

  shopSeasonal(tag: string) {
    this.router.navigate(['/products'], { queryParams: { farmer: tag } });
  }
}


