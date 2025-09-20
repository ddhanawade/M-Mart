import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth';
import { User, Address } from '../../models/user.model';

@Component({
  selector: 'app-profile',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './profile.html',
  styleUrl: './profile.scss'
})
export class Profile implements OnInit {
  user: User | null = null;
  isSavingUser = false;
  isSavingAddresses = false;

  // Editable user fields
  editName = '';
  editPhone = '';

  // Address form
  showAddressForm = false;
  isEditingAddress = false;
  editingAddressId: string | null = null;
  addressForm: Partial<Address> = {
    id: '',
    type: 'home',
    name: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
    landmark: '',
    isDefault: false
  };

  private authService = inject(AuthService);

  ngOnInit(): void {
    // Ensure we have the latest profile from backend
    this.authService.fetchMe().subscribe({
      next: () => {},
      error: () => {}
    });

    this.authService.currentUser$.subscribe(user => {
      this.user = user;
      if (user) {
        this.editName = user.name || '';
        this.editPhone = user.phone || '';
      }
    });
  }

  // User details
  saveUserDetails() {
    if (!this.user) return;
    this.isSavingUser = true;
    this.authService.updateProfile({ name: this.editName, phone: this.editPhone }).subscribe({
      next: () => (this.isSavingUser = false),
      error: () => (this.isSavingUser = false)
    });
  }

  // Addresses
  get addresses(): Address[] {
    return this.user?.addresses || [];
  }

  openAddAddress() {
    this.isEditingAddress = false;
    this.editingAddressId = null;
    this.addressForm = {
      id: '',
      type: 'home',
      name: '',
      street: '',
      city: '',
      state: '',
      pincode: '',
      landmark: '',
      isDefault: this.addresses.length === 0
    };
    this.showAddressForm = true;
  }

  editAddress(addr: Address) {
    this.isEditingAddress = true;
    this.editingAddressId = addr.id;
    this.addressForm = { ...addr };
    this.showAddressForm = true;
  }

  cancelAddressForm() {
    this.showAddressForm = false;
    this.isEditingAddress = false;
    this.editingAddressId = null;
  }

  saveAddress() {
    if (!this.user) return;
    const form = this.addressForm as Address;
    const current = [...this.addresses];

    // Ensure single default
    if (form.isDefault) {
      for (const a of current) a.isDefault = false;
    }

    if (this.isEditingAddress && this.editingAddressId) {
      const idx = current.findIndex(a => a.id === this.editingAddressId);
      if (idx > -1) current[idx] = { ...(current[idx]), ...form, id: this.editingAddressId } as Address;
    } else {
      const newId = 'addr_' + Date.now();
      current.push({ ...(form as Address), id: newId });
    }

    // Persist using backend: send full user payload subset (addresses only)
    this.persistAddresses(current);
  }

  deleteAddress(id: string) {
    if (!this.user) return;
    const remaining = this.addresses.filter(a => a.id !== id);
    // If default removed, make first one default
    if (remaining.length && !remaining.some(a => a.isDefault)) {
      remaining[0].isDefault = true;
    }
    this.persistAddresses(remaining);
  }

  setDefaultAddress(id: string) {
    const updated = this.addresses.map(a => ({ ...a, isDefault: a.id === id }));
    this.persistAddresses(updated);
  }

  private persistAddresses(addresses: Address[]) {
    this.isSavingAddresses = true;
    this.authService.updateProfile({ addresses }).subscribe({
      next: () => {
        this.isSavingAddresses = false;
        this.showAddressForm = false;
        this.isEditingAddress = false;
        this.editingAddressId = null;
      },
      error: () => {
        this.isSavingAddresses = false;
      }
    });
  }
}


