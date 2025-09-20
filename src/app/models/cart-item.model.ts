import { Product } from './product.model';

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  selectedQuantity: number; // in the unit specified by product
  totalPrice: number;
  addedAt: Date;
}
