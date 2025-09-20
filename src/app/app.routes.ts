import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Products } from './pages/products/products';
import { ProductDetail } from './pages/product-detail/product-detail';
import { Cart } from './pages/cart/cart';
import { Auth } from './pages/auth/auth';
import { Checkout } from './pages/checkout/checkout';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'home', component: Home },
  { path: 'products', component: Products },
  { path: 'products/:category', component: Products },
  { path: 'product/:id', component: ProductDetail },
  { path: 'cart', component: Cart },
  { path: 'checkout', component: Checkout },
  { path: 'auth', component: Auth },
  { path: 'login', component: Auth },
  { path: 'register', component: Auth },
  { path: '**', redirectTo: '' }
];
