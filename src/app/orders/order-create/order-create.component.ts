import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatDividerModule } from '@angular/material/divider';
import { Router } from '@angular/router';
import { Observable, of, catchError, finalize, forkJoin, map, startWith, switchMap } from 'rxjs';

import { OrderService, CreateOrderRequest, OrderItemCreate } from '../../services/order.service';
import { OrderDetail } from '../../orders/order-details/order-details.component';
import { LocationService } from '../../services/location.service';
import { SupplierService } from '../../services/supplier.service';
import { InventoryItemsService } from '../../services/inventory-items-service.service';
import { AuthService } from '../../services/auth.service';

import { Location } from '../../models/Location';
import { Supplier } from '../../models/Supplier';
import { InventoryItem } from '../../models/InventoryItem';

interface OrderItem {
  inventoryItemId: number;
  inventoryItemName: string;
  quantity: number;
  uomName?: string;
}

@Component({
  selector: 'app-order-create',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatAutocompleteModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatDividerModule
  ],
  templateUrl: './order-create.component.html',
  styleUrls: ['./order-create.component.scss']
})
export class OrderCreateComponent implements OnInit {
  // Forms
  orderForm!: FormGroup;
  itemForm!: FormGroup;

  // Data for dropdowns and selections
  locations: Location[] = [];
  suppliers: Supplier[] = [];
  inventoryItems: InventoryItem[] = [];
  filteredInventoryItems!: Observable<InventoryItem[]>;

  // Order items - now using MatTableDataSource for better change detection
  orderItems: OrderItem[] = [];
  dataSource = new MatTableDataSource<OrderItem>([]);

  // UI state
  isLoading = false;
  isSubmitting = false;
  loadingError: string | null = null;

  // Table columns for order items
  displayedColumns: string[] = ['name', 'quantity', 'actions'];

  constructor(
    private fb: FormBuilder,
    private orderService: OrderService,
    private locationService: LocationService,
    private supplierService: SupplierService,
    private inventoryItemsService: InventoryItemsService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    this.createForms();
  }

  ngOnInit(): void {
    this.isLoading = true;

    // Load all necessary data in parallel
    forkJoin({
      locations: this.locationService.getAllLocations(),
      suppliers: this.supplierService.getAllSuppliers(),
      inventoryItems: this.inventoryItemsService.getInventoryItemsByCompany()
    }).pipe(
      catchError(err => {
        console.error('Error loading form data:', err);
        this.loadingError = 'Failed to load necessary data. Please try again.';
        return of({ locations: [], suppliers: [], inventoryItems: [] });
      }),
      finalize(() => {
        this.isLoading = false;
      })
    ).subscribe(result => {
      this.locations = result.locations;
      this.suppliers = result.suppliers;
      this.inventoryItems = result.inventoryItems;

      // If there's only one location, auto-select it
      if (this.locations.length === 1) {
        this.orderForm.patchValue({ buyerLocationId: this.locations[0].id });
      }

      // Setup inventory item filtering for autocomplete
      this.setupInventoryItemFiltering();
    });
  }

  createForms(): void {
    // Main order form
    this.orderForm = this.fb.group({
      buyerLocationId: ['', Validators.required],
      supplierId: ['', Validators.required],
      comments: ['']
    });

    // Form for adding items
    this.itemForm = this.fb.group({
      inventoryItemId: ['', Validators.required],
      inventoryItemInput: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(0.001)]]
    });
  }

  setupInventoryItemFiltering(): void {
    this.filteredInventoryItems = this.itemForm.get('inventoryItemInput')!.valueChanges.pipe(
      startWith(''),
      map(value => {
        if (typeof value === 'number') {
          // If value is already an ID (selected from dropdown), don't filter
          return this.inventoryItems;
        }
        return this.filterInventoryItems(value || '');
      })
    );
  }

  filterInventoryItems(value: string): InventoryItem[] {
    if (!value) return this.inventoryItems;
    
    const filterValue = value.toLowerCase();
    return this.inventoryItems.filter(item =>
      item.name.toLowerCase().includes(filterValue) ||
      (item.productCode && item.productCode.toLowerCase().includes(filterValue))
    );
  }

  displayInventoryItemFn = (itemId: number | null): string => {
    if (itemId == null) return '';
    const item = this.inventoryItems.find(i => i.id === itemId);
    return item ? item.name : '';
  }

  onInventoryItemSelected(event: any): void {
    const itemId = event.option.value;
    this.itemForm.patchValue({ 
      inventoryItemId: itemId,
      // Keep the item name in the input field
      inventoryItemInput: itemId
    });
  }

  addItem(): void {
    if (this.itemForm.invalid) {
      // Mark all fields as touched to show validation errors
      Object.keys(this.itemForm.controls).forEach(key => {
        const control = this.itemForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    const inventoryItemId = this.itemForm.get('inventoryItemId')?.value;
    const quantity = this.itemForm.get('quantity')?.value;

    // Check if item already exists in the list
    const existingItemIndex = this.orderItems.findIndex(item => item.inventoryItemId === inventoryItemId);

    if (existingItemIndex !== -1) {
      // Update quantity of existing item
      this.orderItems[existingItemIndex].quantity += quantity;
      this.snackBar.open('Updated quantity of existing item', 'Close', { duration: 3000 });
    } else {
      // Add new item
      const inventoryItem = this.inventoryItems.find(item => item.id === inventoryItemId);
      if (inventoryItem) {
        this.orderItems.push({
          inventoryItemId: inventoryItemId,
          inventoryItemName: inventoryItem.name,
          quantity: quantity,
          uomName: inventoryItem.inventoryUom?.name
        });
        this.snackBar.open('Item added to order', 'Close', { duration: 3000 });
      }
    }

    // Update the table data source
    this.dataSource.data = [...this.orderItems];

    // Reset form fields for new item
    this.itemForm.patchValue({
      inventoryItemId: '',
      inventoryItemInput: '',
      quantity: 1
    });
  }

  removeItem(index: number): void {
    this.orderItems.splice(index, 1);
    this.dataSource.data = [...this.orderItems];
    this.snackBar.open('Item removed from order', 'Close', { duration: 3000 });
  }

  createOrder(): void {
    if (this.orderForm.invalid) {
      // Mark all fields as touched to show validation errors
      Object.keys(this.orderForm.controls).forEach(key => {
        const control = this.orderForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    if (this.orderItems.length === 0) {
      this.snackBar.open('Please add at least one item to the order', 'Close', { duration: 3000 });
      return;
    }

    this.isSubmitting = true;

    // Get current user ID directly from auth service
    const userId = this.authService.getUserId();
    
    const orderRequest: CreateOrderRequest = {
      ...this.orderForm.value,
      createdByUserId: userId || undefined,
      items: this.orderItems.map(item => ({
        inventoryItemId: item.inventoryItemId,
        quantity: item.quantity
      }))
    };

    this.orderService.createPurchaseOrderWithItems(orderRequest)
      .pipe(
        catchError(err => {
          console.error('Error creating order:', err);
          
          // Extract the specific error message from the response if available
          let errorMessage = 'Failed to create order. Please try again.';
          if (err.error && err.error.debugMessage) {
            errorMessage = err.error.debugMessage;
          } else if (err.error && err.error.message) {
            errorMessage = err.error.message;
          }
          
          this.snackBar.open(errorMessage, 'Close', {
            duration: 6000,
            panelClass: ['error-snackbar']
          });
          return of(null);
        }),
        finalize(() => {
          this.isSubmitting = false;
        })
      )
      .subscribe((result: OrderDetail | null) => {
        if (result) {
          this.snackBar.open('Order created successfully', 'Close', { duration: 3000 });
          
          // Navigate to the order details page
          this.router.navigate(['/orders', result.id || result.orderId]);
        }
      });
  }

  cancel(): void {
    this.router.navigate(['/orders']);
  }
}