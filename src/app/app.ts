import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from './components/header/header';
import { Footer } from './components/footer/footer';
import { MobileNav } from './components/mobile-nav/mobile-nav';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Footer, MobileNav],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  title = 'Mahabaleshwer Mart';
}
