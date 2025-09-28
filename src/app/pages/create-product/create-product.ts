import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { ProductService, CreateProductRequest } from '../../services/product';

@Component({
  selector: 'app-create-product',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './create-product.html',
  styleUrls: ['./create-product.scss']
})
export class CreateProduct implements OnInit {
  form!: FormGroup;
  isSubmitting: boolean = false;
  submitError: string = '';
  isEditMode: boolean = false;
  productId: string | null = null;

  categories: string[] = [
    'fruits', 'vegetables', 'organic', 'groceries', 'dairy', 'bakery',
    'beverages', 'spices', 'snacks', 'personal_care', 'household'
  ];

  units: string[] = ['piece', 'kg', 'g', 'liter', 'ml', 'dozen', 'pack'];

  private fb = inject(FormBuilder);
  private productService = inject(ProductService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  ngOnInit(): void {
    this.form = this.fb.group({
      // Basic info
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: [''],
      category: ['', Validators.required],
      subcategory: [''],
      // Pricing
      price: [null, [Validators.required, Validators.min(0)]],
      originalPrice: [null, [Validators.min(0)]],
      discount: [null, [Validators.min(0)]],
      // Inventory
      inStock: [true],
      quantity: [0, [Validators.min(0)]],
      unit: ['piece', Validators.required],
      featured: [false],
      organic: [false],
      fresh: [false],
      // Identifiers
      sku: [''],
      barcode: [''],
      // Media
      image: ['', Validators.required],
      images: [''], // comma separated URLs
      // Shipping/attributes
      weightKg: [null, [Validators.min(0)]],
      shelfLifeDays: [null, [Validators.min(0)]],
      storageInstructions: [''],
      originCountry: [''],
      supplierName: [''],
      // Nutrition
      caloriesPer100g: [null, [Validators.min(0)]],
      proteinG: [null, [Validators.min(0)]],
      carbsG: [null, [Validators.min(0)]],
      fatG: [null, [Validators.min(0)]],
      fiberG: [null, [Validators.min(0)]],
      vitamins: [''] // comma separated list
    });

    // Enable edit mode if an id is provided as query param (e.g., /create-product?id=...)
    this.route.queryParams.subscribe(params => {
      const editId = params['id'];
      if (editId) {
        this.isEditMode = true;
        this.productId = editId;
        this.loadExistingProduct(editId);
      }
    });
  }

  get f() { return this.form.controls; }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.isSubmitting = true;
    this.submitError = '';

    const value = this.form.value;

    const payload: CreateProductRequest = {
      name: value.name,
      description: value.description || undefined,
      price: Number(value.price),
      originalPrice: value.originalPrice !== null && value.originalPrice !== undefined && value.originalPrice !== '' ? Number(value.originalPrice) : undefined,
      category: (value.category || '').toString().toLowerCase(),
      subcategory: value.subcategory || undefined,
      image: value.image,
      images: (value.images || '')
        .split(',')
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 0),
      inStock: value.inStock,
      quantity: value.quantity !== null && value.quantity !== undefined ? Number(value.quantity) : undefined,
      unit: value.unit,
      organic: value.organic,
      fresh: value.fresh,
      discount: value.discount !== null && value.discount !== undefined && value.discount !== '' ? Number(value.discount) : undefined,
      featured: value.featured,
      sku: value.sku || undefined,
      barcode: value.barcode || undefined,
      weightKg: value.weightKg !== null && value.weightKg !== undefined && value.weightKg !== '' ? Number(value.weightKg) : undefined,
      shelfLifeDays: value.shelfLifeDays !== null && value.shelfLifeDays !== undefined && value.shelfLifeDays !== '' ? Number(value.shelfLifeDays) : undefined,
      storageInstructions: value.storageInstructions || undefined,
      originCountry: value.originCountry || undefined,
      supplierName: value.supplierName || undefined,
      nutritionalInfo: this.buildNutritionalInfo(value)
    };

    const request$ = this.isEditMode && this.productId
      ? this.productService.updateProduct(this.productId, payload)
      : this.productService.createProduct(payload);

    request$.subscribe({
      next: (created) => {
        this.isSubmitting = false;
        const id = (created as any)?.id;
        if (id) {
          this.router.navigate(['/product', id]);
        } else {
          this.router.navigate(['/products']);
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        this.submitError = err?.message || (this.isEditMode ? 'Failed to update product' : 'Failed to create product');
      }
    });
  }

  private buildNutritionalInfo(value: any): CreateProductRequest['nutritionalInfo'] | undefined {
    const vitaminsArr = (value.vitamins || '')
      .split(',')
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 0);

    const hasAny = [
      value.caloriesPer100g,
      value.proteinG,
      value.carbsG,
      value.fatG,
      value.fiberG,
      vitaminsArr.length
    ].some((v) => v !== null && v !== undefined && v !== '' && v !== 0);

    if (!hasAny) return undefined;

    return {
      caloriesPer100g: value.caloriesPer100g !== null && value.caloriesPer100g !== undefined && value.caloriesPer100g !== '' ? Number(value.caloriesPer100g) : undefined,
      proteinG: value.proteinG !== null && value.proteinG !== undefined && value.proteinG !== '' ? Number(value.proteinG) : undefined,
      carbsG: value.carbsG !== null && value.carbsG !== undefined && value.carbsG !== '' ? Number(value.carbsG) : undefined,
      fatG: value.fatG !== null && value.fatG !== undefined && value.fatG !== '' ? Number(value.fatG) : undefined,
      fiberG: value.fiberG !== null && value.fiberG !== undefined && value.fiberG !== '' ? Number(value.fiberG) : undefined,
      vitamins: vitaminsArr
    };
  }

  private loadExistingProduct(id: string) {
    this.productService.getProductById(id).subscribe({
      next: (product) => {
        if (!product) return;
        this.form.patchValue({
          name: product.name,
          description: product.description,
          category: product.category,
          subcategory: product.subcategory,
          price: product.price,
          originalPrice: product.originalPrice,
          discount: (product as any).discount,
          inStock: product.inStock,
          quantity: product.quantity,
          unit: product.unit,
          featured: (product as any).featured ?? false,
          organic: product.organic,
          fresh: product.fresh,
          sku: (product as any).sku || '',
          barcode: (product as any).barcode || '',
          image: product.image,
          images: (product.images || []).join(', '),
          weightKg: (product as any).weightKg,
          shelfLifeDays: (product as any).shelfLifeDays,
          storageInstructions: (product as any).storageInstructions,
          originCountry: (product as any).originCountry,
          supplierName: (product as any).supplierName,
          caloriesPer100g: (product as any).nutritionalInfo?.caloriesPer100g,
          proteinG: (product as any).nutritionalInfo?.proteinG,
          carbsG: (product as any).nutritionalInfo?.carbsG,
          fatG: (product as any).nutritionalInfo?.fatG,
          fiberG: (product as any).nutritionalInfo?.fiberG,
          vitamins: ((product as any).nutritionalInfo?.vitamins || []).join(', ')
        });
      },
      error: () => {}
    });
  }
}


