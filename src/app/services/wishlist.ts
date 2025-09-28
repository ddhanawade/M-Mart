import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class WishlistService {
  private storageKey = 'mmart_wishlist_ids';

  private read(): string[] {
    try {
      const raw = localStorage.getItem(this.storageKey);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }

  private write(ids: string[]) {
    localStorage.setItem(this.storageKey, JSON.stringify(ids));
  }

  list(): string[] { return this.read(); }
  has(id: string): boolean { return this.read().includes(id); }
  add(id: string) { const s = new Set(this.read()); s.add(id); this.write(Array.from(s)); }
  remove(id: string) { const s = new Set(this.read()); s.delete(id); this.write(Array.from(s)); }
  toggle(id: string) { this.has(id) ? this.remove(id) : this.add(id); }
}


