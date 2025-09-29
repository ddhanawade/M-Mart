import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-nursery',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './nursery.html',
  styleUrls: ['./nursery.scss']
})
export class Nursery {}


