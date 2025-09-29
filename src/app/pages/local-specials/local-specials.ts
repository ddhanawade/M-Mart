import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-local-specials',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './local-specials.html',
  styleUrls: ['./local-specials.scss']
})
export class LocalSpecials {
  constructor(private router: Router) {}

  shop(term: string) {
    this.router.navigate(['/products'], { queryParams: { query: term } });
  }
}


