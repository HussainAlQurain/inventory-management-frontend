import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators, AbstractControl, FormControl } from '@angular/forms';
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
import { Observable, of, catchError, finalize, combineLatest, map, startWith, switchMap, debounceTime, distinctUntilChanged } from 'rxjs';

import { OrderService, CreateOrderRequest, OrderItemCreate, AvailableInventoryItem } from '../../services/order.service';
import { OrderDetail } from '../../orders/order-details/order-details.component';
import { LocationService } from '../../services/location.service';
import { SupplierService } from '../../services/supplier.service';
import { InventoryItemsService } from '../../services/inventory-items-service.service';
import { AuthService } from '../../services/auth.service';

import { Location } from '../../models/Location';
import { Supplier } from '../../models/Supplier';
import { InventoryItem } from '../../models/InventoryItem';
import { Lookup } from '../../models/Lookup';

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

  // Search control for autocomplete search fields
  locationSearchCtrl = new FormControl('');
  supplierSearchCtrl = new FormControl('');
  inventorySearchCtrl = new FormControl('');

  // Data for dropdowns and selections
  filteredLocations$!: Observable<Location[]>;
  filteredSuppliers$!: Observable<Supplier[]>;
  filteredInventoryItems$!: Observable<AvailableInventoryItem[]>;

  // Order items list
  orderItems: OrderItem[] = [];
  dataSource = new MatTableDataSource<OrderItem>([]);

  // UI state
  isLoading = false;
  isSubmitting = false;
  loadingError: string | null = null;
  
  // Selected entities
  selectedLocation: Location | null = null;
  selectedSupplier: Supplier | null = null;

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
    this.setupLocationAutocomplete();
    this.setupSupplierAutocomplete();
    this.setupInventoryItemFiltering();
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

  setupLocationAutocomplete(): void {
    // Use the locationSearchCtrl for text input filtering
    this.filteredLocations$ = this.locationSearchCtrl.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(search => {
        // Type check to handle objects in event of selection
        const searchText = typeof search === 'string' ? search : '';
        return this.locationService.getPaginatedLocations(0, 10, "name,asc", searchText);
      }),
      map(response => response.content),
      catchError(() => {
        // Fallback to non-paginated endpoint if paginated endpoint fails
        return this.locationService.getAllLocations();
      })
    );
  }

  setupSupplierAutocomplete(): void {
    // Use the supplierSearchCtrl for text input filtering
    this.filteredSuppliers$ = this.supplierSearchCtrl.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(search => {
        // Type check to handle objects in event of selection
        const searchText = typeof search === 'string' ? search : '';
        return this.supplierService.getPaginatedSuppliers(0, 10, "name,asc", searchText);
      }),
      map(response => response.content),
      catchError(() => {
        // Fallback to non-paginated endpoint if paginated endpoint fails
        return this.supplierService.getAllSuppliers();
      })
    );
  }

  setupInventoryItemFiltering(): void {
    // Get available inventory items only when both location and supplier are selected
    this.filteredInventoryItems$ = combineLatest([
      this.orderForm.get('buyerLocationId')!.valueChanges.pipe(startWith(this.orderForm.get('buyerLocationId')?.value)),
      this.orderForm.get('supplierId')!.valueChanges.pipe(startWith(this.orderForm.get('supplierId')?.value)),
      this.inventorySearchCtrl.valueChanges.pipe(startWith(''), debounceTime(300))
    ]).pipe(
      switchMap(([locationId, supplierId, search]) => {
        if (!locationId || !supplierId) {
          return of({ content: [] });
        }
        
        // Type check to handle objects in event of selection
        const searchText = typeof search === 'string' ? search : '';
        
        return this.orderService.getAvailableItems(supplierId, locationId, 0, 10, searchText);
      }),
      map(response => response.content),
      catchError(() => {
        // Fallback to non-paginated endpoint
        const locationId = this.orderForm.get('buyerLocationId')?.value;
        const supplierId = this.orderForm.get('supplierId')?.value;
        return (locationId && supplierId)
          ? this.orderService.getAvailableInventoryItems(supplierId, locationId)   // returns array ✅
          : of([]);
      })
    );
  }

  onLocationSelected(event: any): void {
    const location = event.option.value;
    this.selectedLocation = location;
    this.orderForm.patchValue({ buyerLocationId: location.id });
  }

  onSupplierSelected(event: any): void {
    const supplier = event.option.value;
    this.selectedSupplier = supplier;
    this.orderForm.patchValue({ supplierId: supplier.id });
  }

  onInventoryItemSelected(event: any): void {
    const inventoryItem = event.option.value;
    this.itemForm.patchValue({ 
      inventoryItemId: inventoryItem.id,
      inventoryItemInput: inventoryItem
    });
  }

  displayLocationFn = (loc?: Location | string): string => 
    typeof loc === 'object' ? loc?.name ?? '' : '';

  displaySupplierFn = (supplier?: Supplier | string): string => 
    typeof supplier === 'object' ? supplier?.name ?? '' : '';

  displayInventoryItemFn = (item?: AvailableInventoryItem | string): string => 
    typeof item === 'object' ? item?.name ?? '' : '';

  addItem(): void {
    if (this.itemForm.invalid) {
      // Mark all fields as touched to show validation errors
      Object.keys(this.itemForm.controls).forEach(key => {
        const control = this.itemForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    const inventoryItem = this.itemForm.get('inventoryItemInput')?.value;
    const quantity = this.itemForm.get('quantity')?.value;

    // Check if item already exists in the list
    const existingItemIndex = this.orderItems.findIndex(item => item.inventoryItemId === inventoryItem.id);

    if (existingItemIndex !== -1) {
      // Update quantity of existing item
      this.orderItems[existingItemIndex].quantity += quantity;
      this.snackBar.open('Updated quantity of existing item', 'Close', { duration: 3000 });
    } else {
      // Add new item
      this.orderItems.push({
        inventoryItemId: inventoryItem.id,
        inventoryItemName: inventoryItem.name,
        quantity: quantity,
        uomName: inventoryItem.inventoryUom?.name
      });
      this.snackBar.open('Item added to order', 'Close', { duration: 3000 });
    }

    // Update the table data source
    this.dataSource.data = [...this.orderItems];

    // Reset form fields for new item
    this.itemForm.patchValue({
      inventoryItemId: '',
      inventoryItemInput: '',
      quantity: 1
    });
    this.inventorySearchCtrl.setValue('');
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