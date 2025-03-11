import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { Observable, of, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

import { InventoryItem } from '../../models/InventoryItem';
import { PurchaseOption } from '../../models/PurchaseOption';
import { Supplier } from '../../models/Supplier';
import { UnitOfMeasure } from '../../models/UnitOfMeasure';
import { Location } from '../../models/Location';
import { InventoryService } from '../../services/inventory.service';
import { SupplierService } from '../../services/supplier.service';
import { UomService } from '../../services/uom.service';
import { LocationService } from '../../services/location.service';

interface LocationInventory {
  location: Location;
  quantity: number;
  value: number;
}

@Component({
  selector: 'app-inventory-item-detail-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatTableModule,
    MatCardModule,
    MatChipsModule,
    MatDividerModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatSelectModule,
    MatAutocompleteModule
  ],
  templateUrl: './inventory-item-detail-modal.component.html',
  styleUrl: './inventory-item-detail-modal.component.scss'
})
export class InventoryItemDetailModalComponent implements OnInit {
  // For purchase options display
  displayedPurchaseColumns: string[] = [
    'productName',
    'supplier', 
    'productCode',
    'orderingUnit',
    'price',
    'taxRate',
    'innerPack',
    'packsPerCase',
    'minOrderQty',
    'priceChanges',
    'orderingEnabled', 
    'mainOption',
    'actions'
  ];

  // For location inventory display
  displayedLocationColumns: string[] = [
    'location',
    'quantity',
    'value'
  ];

  // For purchase option editing
  editingOption: number | null = null;
  originalItem: InventoryItem;
  
  // For price history display
  showingPriceHistory = false;
  selectedOption: PurchaseOption | null = null;

  // For dropdowns
  suppliers: Supplier[] = [];
  unitOfMeasures: UnitOfMeasure[] = [];
  locations: Location[] = [];
  
  // For search functionality
  supplierSearch = new Subject<string>();
  filteredSuppliers$: Observable<Supplier[]>;

  // For location inventory
  locationInventory: LocationInventory[] = [];
  totalOnHand = 0;
  totalValue = 0;

  constructor(
    public dialogRef: MatDialogRef<InventoryItemDetailModalComponent>,
    @Inject(MAT_DIALOG_DATA) public item: InventoryItem,
    private inventoryService: InventoryService,
    private supplierService: SupplierService,
    private uomService: UomService,
    private locationService: LocationService
  ) {
    // Create a deep copy of the item to enable cancellation of changes
    this.originalItem = JSON.parse(JSON.stringify(item));
    
    // Initialize filtered suppliers observable
    this.filteredSuppliers$ = this.supplierSearch.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => this.searchSuppliers(term))
    );
  }

  ngOnInit(): void {
    this.loadSuppliers();
    this.loadUnitOfMeasures();
    this.loadLocations();
    this.loadLocationInventory();
  }

  loadSuppliers(): void {
    this.supplierService.getAllSuppliers().subscribe(suppliers => {
      this.suppliers = suppliers;
    });
  }

  loadUnitOfMeasures(): void {
    this.uomService.getAllUoms().subscribe(uoms => {
      this.unitOfMeasures = uoms;
    });
  }

  loadLocations(): void {
    this.locationService.getAllLocations().subscribe(locations => {
      this.locations = locations;
    });
  }

  loadLocationInventory(): void {
    // This would be a real API call in production
    this.inventoryService.getInventoryByItemAndLocation(this.item.id || 0).subscribe(inventory => {
      this.locationInventory = inventory;
      this.calculateTotals();
    });
    
    // For demonstration, create sample data
    if (!this.locationInventory.length) {
      this.locationInventory = [
        { location: { id: 1, name: 'Main Warehouse' } as Location, quantity: 100, value: 1000 },
        { location: { id: 2, name: 'Store Front' } as Location, quantity: 25, value: 250 }
      ];
      this.calculateTotals();
    }
  }

  calculateTotals(): void {
    this.totalOnHand = this.locationInventory.reduce((total, loc) => total + loc.quantity, 0);
    this.totalValue = this.locationInventory.reduce((total, loc) => total + loc.value, 0);
  }

  searchSuppliers(term: string): Observable<Supplier[]> {
    if (!term.trim()) {
      return of(this.suppliers);
    }
    return this.supplierService.searchSuppliers(term);
  }

  close(): void {
    this.dialogRef.close();
  }
  
  saveChanges(): void {
    // Save changes to the inventory item
    this.dialogRef.close(this.item);
  }

  // Purchase Option Methods
  editPurchaseOption(option: PurchaseOption): void {
    this.editingOption = option.id || null;
  }
  
  savePurchaseOption(option: PurchaseOption): void {
    // Save changes to the purchase option
    this.editingOption = null;
  }
  
  cancelEdit(): void {
    this.editingOption = null;
  }
  
  deletePurchaseOption(option: PurchaseOption): void {
    if (confirm(`Are you sure you want to delete this purchase option from ${option.supplier?.name}?`)) {
      if (this.item.purchaseOptions) {
        const index = this.item.purchaseOptions.findIndex(po => po.id === option.id);
        if (index !== -1) {
          this.item.purchaseOptions.splice(index, 1);
        }
      }
      this.editingOption = null;
    }
  }
  
  addNewPurchaseOption(): void {
    // Add a new purchase option and start editing it
    const newOption: PurchaseOption = {
      id: this.getNextPurchaseOptionId(),
      inventoryItemId: this.item.id || 0,
      price: 0,
      taxRate: 0,
      orderingEnabled: false,
      mainPurchaseOption: false,
      innerPackQuantity: 1,
      packsPerCase: 1,
      minOrderQuantity: 1
    };
    
    if (!this.item.purchaseOptions) {
      this.item.purchaseOptions = [];
    }
    
    this.item.purchaseOptions.push(newOption);
    this.editingOption = newOption.id ?? null;
  }
  
  getNextPurchaseOptionId(): number {
    // Simple method to generate a temporary ID for new purchase options
    if (!this.item.purchaseOptions || this.item.purchaseOptions.length === 0) {
      return 1;
    }
    const maxId = Math.max(0, ...this.item.purchaseOptions.map(po => po.id || 0));
    return maxId + 1;
  }
  
  setAsMainOption(option: PurchaseOption): void {
    // Set this as main purchase option and unset others
    if (this.item.purchaseOptions) {
      this.item.purchaseOptions.forEach(po => {
        po.mainPurchaseOption = po.id === option.id;
      });
    }
  }

  // Price History Methods
  showPriceHistory(option: PurchaseOption, event: Event): void {
    event.stopPropagation(); // Stop event propagation to prevent row selection
    this.selectedOption = option;
    this.showingPriceHistory = true;
    
    // Here you would fetch price history data from your API
    // For now, we're just showing the overlay
  }
  
  closePriceHistory(): void {
    this.showingPriceHistory = false;
    this.selectedOption = null;
  }
  
  // Supplier handling
  displaySupplierFn(supplier?: Supplier): string {
    return supplier ? supplier.name : '';
  }
  
  createNewSupplier(name: string): void {
    const newSupplier: Supplier = {
      id: 0, // Temporary ID
      name: name,
      // Add other required fields for your Supplier model
    };
    
    this.supplierService.createSupplier(newSupplier).subscribe(supplier => {
      this.suppliers.push(supplier);
      // You could update the currently edited option here
    });
  }
}