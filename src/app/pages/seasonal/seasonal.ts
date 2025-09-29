import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-seasonal',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './seasonal.html',
  styleUrls: ['./seasonal.scss']
})
export class Seasonal implements OnInit {
  constructor(private router: Router) {}

  ngOnInit(): void {}

  shop(term: string) {
    this.router.navigate(['/products'], { queryParams: { season: term } });
  }
}


