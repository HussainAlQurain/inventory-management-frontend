import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';

import { InventoryItem } from '../../models/InventoryItem';
import { PurchaseOption } from '../../models/PurchaseOption';
import { Category } from '../../models/Category';
import { Location } from '../../models/Location';
import { Supplier } from '../../models/Supplier';
import { UnitOfMeasure } from '../../models/UnitOfMeasure';

// import { InventoryService } from '../../services/inventory.service';
import { SupplierService } from '../../services/supplier.service';
import { UomService } from '../../services/uom.service';
import { LocationService } from '../../services/location.service';
import { CategoriesService } from '../../services/categories.service';
import { PurchaseOptionService } from '../../services/purchase-option.service';
import { InventoryItemLocationService } from '../../services/inventory-item-location.service';

// Import the service for partial update of the item
import { InventoryItemsService } from '../../services/inventory-items-service.service';

import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { MatDividerModule } from '@angular/material/divider';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CompaniesService } from '../../services/companies.service';
import { PriceHistoryDialogComponent } from '../price-history-dialog/price-history-dialog.component';
import { UomDialogComponent } from '../uom-dialog/uom-dialog.component';

// Import the PurchaseOptionModal component
import { PurchaseOptionModalComponent } from '../purchase-option-modal/purchase-option-modal.component';

// Add import for the new supplier dialog
import { SupplierDialogComponent } from '../../suppliers/supplier-dialog/supplier-dialog.component';

interface LocationInventory {
  location: Location;
  quantity: number;
  value: number;
}

@Component({
  selector: 'app-inventory-item-detail-modal',
  standalone: true,
  templateUrl: './inventory-item-detail-modal.component.html',
  styleUrls: ['./inventory-item-detail-modal.component.scss'],
  imports: [
    // Angular stuff
    CommonModule,
    FormsModule,
    ReactiveFormsModule,

    // Material
    MatDialogModule,
    MatAutocompleteModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatCheckboxModule,
    MatTabsModule,
    MatTableModule,
    MatDividerModule,
    MatRadioModule,
    MatSelectModule,
    MatTooltipModule,
    MatSnackBarModule
  ],
})
export class InventoryItemDetailModalComponent implements OnInit {
  /** For category searching & creation */
  categoryCtrl = new FormControl<string>('', { nonNullable: true });
  filteredCategories: Category[] = [];
  canCreateNewCategory = false;
  allUoms: UnitOfMeasure[] = [];

  /** Display table of on-hand by location. */
  locationInventory: LocationInventory[] = [];

  constructor(
    public dialogRef: MatDialogRef<InventoryItemDetailModalComponent>,
    @Inject(MAT_DIALOG_DATA) public item: InventoryItem,

    private categoriesService: CategoriesService,
    private purchaseOptionService: PurchaseOptionService,
    private inventoryItemLocationService: InventoryItemLocationService,
    // private inventoryService: InventoryService,
    private inventoryItemsService: InventoryItemsService, // service for partial update item
    private supplierService: SupplierService,
    private uomService: UomService,
    private locationService: LocationService,
    private companiesService: CompaniesService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    // If item.category is set, reflect in the form control
    if (this.item.category) {
      this.categoryCtrl.setValue(this.item.category.name);
    }

    // Watch for changes in categoryCtrl
    this.categoryCtrl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((term: string) => this.onCategorySearchChange(term))
    ).subscribe();

    this.loadAllUoms();

    this.setupPurchaseOptionSupplierControls();

    this.setupPurchaseOptionUomControls();

    // Load location-based on-hand info
    this.loadLocationInventory();

    // Load supplier from PurchaseOptionModal component if available
    if (window.history.state && window.history.state.newSupplier) {
      const newSupplier = window.history.state.newSupplier;
      console.log('New supplier received:', newSupplier);
      // Use the new supplier
    }
  }

  private loadAllUoms() {
    this.uomService.getAllUoms().subscribe({
      next: (uoms) => {
        this.allUoms = uoms;
      },
      error: (err) => console.error(err)
    });
  }


  private setupPurchaseOptionSupplierControls(): void {
    if (!this.item.purchaseOptions) return;
    this.item.purchaseOptions.forEach(opt => {
      opt.supplierCtrl = new FormControl<string>('', { nonNullable: true });
      opt.filteredSuppliers = [];
      opt.canCreateNewSupplier = false;

      if (opt.supplier?.name) {
        opt.supplierCtrl.setValue(opt.supplier.name);
      }

      opt.supplierCtrl.valueChanges
        .pipe(
          debounceTime(300),
          distinctUntilChanged(),
          switchMap(term => this.searchSuppliers(term))
        )
        .subscribe({
          next: (list) => {
            opt.filteredSuppliers = list;
            const exact = list.some(s => s.name.toLowerCase() === opt.supplierCtrl?.value.toLowerCase());
            opt.canCreateNewSupplier = !!opt.supplierCtrl?.value && !exact;
          },
          error: (err) => console.error(err)
        });
    });
  }

  // The search method:
  private searchSuppliers(term: string): Observable<Supplier[]> {
    if (!term || !term.trim()) {
      return of([]);
    }
    console.log('Searching suppliers with term:', term);
    return this.supplierService.searchSuppliers(term);
  }

  onSupplierSelected(value: string, opt: PurchaseOption) {
    const match = opt.filteredSuppliers?.find(s => s.name === value);
    if (match) {
      opt.supplier = match;
      opt.supplierId = match.id;
      this.savePurchaseOptionChanges(opt);
    } else if (opt.canCreateNewSupplier) {
      // Open supplier creation dialog with the new component
      this.openSupplierCreationDialog(value);
    }
  }

  // Replace openSupplierCreationDialog with the new implementation
  openSupplierCreationDialog(initialName: string = ''): void {
    const dialogRef = this.dialog.open(SupplierDialogComponent, {
      width: '800px',
      data: {
        initialSupplierName: initialName
      }
    });

    dialogRef.afterClosed().subscribe(supplier => {
      if (supplier) {
        // Refresh supplier lists with the newly created supplier
        this.item.purchaseOptions?.forEach(po => {
          if (po.filteredSuppliers) {
            po.filteredSuppliers = [supplier, ...po.filteredSuppliers];
          }
          // If the supplier creation was triggered from this purchase option, select it
          if (po.supplierCtrl?.value === initialName) {
            po.supplier = supplier;
            po.supplierId = supplier.id;
            po.supplierCtrl.setValue(supplier.name);
            this.savePurchaseOptionChanges(po);
          }
        });
      }
    });
  }

  showPriceHistory(opt: PurchaseOption) {
    this.dialog.open(PriceHistoryDialogComponent, {
      data: { purchaseOptionId: opt.id }
    });
  }


  /** For Category searching */
  onCategorySearchChange(term: string): Observable<void> {
    if (!term) term = '';
    return this.categoriesService.getAllCategories(term).pipe(
      switchMap((cats: Category[]) => {
        this.filteredCategories = cats;
        const exactMatch = cats.some(c => c.name.toLowerCase() === term.toLowerCase());
        this.canCreateNewCategory = term.length > 0 && !exactMatch;
        return of();
      })
    );
  }

  /** Called when user selects a category from mat-autocomplete */
  onCategorySelected(name: string) {
    const cat = this.filteredCategories.find(c => c.name === name);
    if (cat) {
      this.item.category = cat;
    }
  }

  /** Called when the user picks any option (existing or "create new"). */
  onOptionSelected(fullValue: string) {
    console.log('optionSelected =>', fullValue);

    // 1) If user selected an existing category, `fullValue` equals cat.name
    const existing = this.filteredCategories.find(c => c.name === fullValue);
    if (existing) {
      // they picked a real category
      this.item.category = existing;
      return;
    }

    // 2) Otherwise, user must have clicked the "Create <xxx>" line
    //    so we do:
    this.createNewCategory(fullValue);
  }

  /** Actually create the new category */
  createNewCategory(name: string) {
    const newCat: Partial<Category> = { name };
    this.categoriesService.createCategory(newCat).subscribe(created => {
      this.item.category = created;
      // update the control with the newly created category name
      this.categoryCtrl.setValue(created.name);
      this.filteredCategories.push(created);
      this.canCreateNewCategory = false;
    });
  }


  /** Bulk update bridging for minOnHand / par across all stores */
  updateAllStores() {
    if (!this.item.id) return;
    
    this.inventoryItemLocationService.bulkSetThresholdsForCompany(
      this.item.id,
      this.item.minOnHand,
      this.item.par
    ).subscribe({
      next: () => {
        this.snackBar.open('Thresholds updated for all locations', 'Close', {
          duration: 3000
        });
      },
      error: (err: any) => {
        console.error('Error updating thresholds for all locations:', err);
        this.snackBar.open('Failed to update thresholds', 'Close', {
          duration: 3000
        });
      }
    });
  }

  /** Update thresholds for a single location */
  updateLocationThresholds(locationId: number) {
    if (!this.item.id) return;
    
    this.inventoryItemLocationService.updateLocationThresholds(
      this.item.id,
      locationId,
      this.item.minOnHand,
      this.item.par
    ).subscribe({
      next: () => {
        this.snackBar.open('Thresholds updated for selected location', 'Close', {
          duration: 3000
        });
      },
      error: (err: any) => {
        console.error('Error updating thresholds for location:', err);
        this.snackBar.open('Failed to update thresholds for location', 'Close', {
          duration: 3000
        });
      }
    });
  }

  /** Load table of on-hand by location (for the 3rd tab) */
  loadLocationInventory() {
    const itemId = this.item.id || 0;
    this.inventoryItemLocationService.getItemLocations(itemId).subscribe({
      next: (list) => {
        this.locationInventory = list.map(dto => ({
          location: { id: dto.location.id, name: dto.location.name },
          quantity: dto.quantity,
          value: dto.value
        }));
        // compute total
        const totalQty = this.locationInventory.reduce((sum, row) => sum + row.quantity, 0);
        const totalVal = this.locationInventory.reduce((sum, row) => sum + row.value, 0);
        this.item.onHand = totalQty;
        this.item.onHandValue = totalVal;
      },
      error: err => console.error(err)
    });
  }

  // -------------------------------
  // PurchaseOption immediate actions
  // -------------------------------

  /** Create a new PurchaseOption in memory, then call the backend to persist it. */
  addNewPurchaseOption() {
    if (!this.item.id) {
      alert('Cannot add purchase options until item is saved or has an ID.');
      return;
    }
    
    // Open the Purchase Option modal dialog
    const dialogRef = this.dialog.open(PurchaseOptionModalComponent, {
      width: '700px',
      data: {
        inventoryItemId: this.item.id
      }
    });
    
    dialogRef.afterClosed().subscribe(purchaseOptionData => {
      if (purchaseOptionData) {
        // Call backend to create
        // Using non-null assertion (!) since we've already checked this.item.id is not falsy above
        this.purchaseOptionService.createPurchaseOption(purchaseOptionData, this.item.id!).subscribe({
          next: created => {
            // Fetch the updated item data from the server to ensure all purchase options are up-to-date
            this.inventoryItemsService.getInventoryItemById(this.item.id!).subscribe({
              next: (updatedItem) => {
                // Update the item with the refreshed data
                this.item = updatedItem;
                
                // Set up controls for all purchase options
                this.setupPurchaseOptionSupplierControls();
                this.setupPurchaseOptionUomControls();
              },
              error: (err) => {
                console.error('Error refreshing item data:', err);
                
                // Fallback: if we can't refresh the whole item, at least add the new purchase option
                if (!this.item.purchaseOptions) {
                  this.item.purchaseOptions = [];
                }
                this.item.purchaseOptions.push(created);
                
                // Setup controls for just the new purchase option
                this.setupPurchaseOptionSupplierControls();
                this.setupPurchaseOptionUomControls();
              }
            });
          },
          error: err => console.error('Error creating purchase option:', err)
        });
      }
    });
  }

  /** Remove purchase option from DB and local array */
  deletePurchaseOption(option: PurchaseOption) {
    if (!option.id) {
      // It's never persisted, just remove from array
      const idx = this.item.purchaseOptions?.indexOf(option);
      if (idx !== undefined && idx >= 0) {
        this.item.purchaseOptions?.splice(idx, 1);
      }
      return;
    }
    this.purchaseOptionService.deleteOption(option.id).subscribe({
      next: () => {
        const idx = this.item.purchaseOptions?.indexOf(option);
        if (idx !== undefined && idx >= 0) {
          this.item.purchaseOptions?.splice(idx, 1);
        }
      },
      error: err => console.error(err)
    });
  }

  /** Called when user toggles 'orderingEnabled' checkbox */
  onOrderingToggled(option: PurchaseOption) {
    if (!option.id) return;
    this.purchaseOptionService.partialUpdateEnabled(option.id, option.orderingEnabled)
      .subscribe({
        next: updated => {
          // update local
          option.orderingEnabled = updated.orderingEnabled;
        },
        error: (err: any) => console.error(err)
      });
  }

  /** Save changes to purchase option fields */
  savePurchaseOptionChanges(option: PurchaseOption) {
    if (!option.id) return;
    
    // Create update payload
    const updateData: Partial<PurchaseOption> = {
      nickname: option.nickname,
      supplierProductCode: option.supplierProductCode,
      // Remove price from here as it needs special handling
      supplierId: option.supplierId,
      orderingUomId: option.orderingUomId,
      // Include other fields as needed
      innerPackQuantity: option.innerPackQuantity,
      packsPerCase: option.packsPerCase,
      minOrderQuantity: option.minOrderQuantity,
      taxRate: option.taxRate,
      scanBarcode: option.scanBarcode
    };
    
    this.purchaseOptionService.partialUpdatePurchaseOption(option.id, updateData)
      .subscribe({
        next: updated => {
          // Update local option with values from server
          Object.assign(option, updated);
          console.log('Purchase option updated successfully');
        },
        error: err => console.error('Failed to update purchase option', err)
      });
  }

  /** Handle price changes specifically using the dedicated price update endpoint */
  onPriceChange(option: PurchaseOption) {
    if (!option.id || option.price === undefined || option.price === null) return;
    
    this.purchaseOptionService.updatePriceManually(option.id, option.price)
      .subscribe({
        next: updated => {
          option.price = updated.price;
          console.log('Price updated successfully');
        },
        error: err => console.error('Failed to update price', err)
      });
  }

  /** Called when user sets an option as main purchase option */
  onSetAsMain(option: PurchaseOption) {
    if (!option.id) return;
    // Mark local array
    if (this.item.purchaseOptions) {
      this.item.purchaseOptions.forEach(po => po.mainPurchaseOption = (po === option));
    }
    this.purchaseOptionService.setAsMainOption(option.id).subscribe({
      next: updated => {
        // updated => mainPurchaseOption = true
      },
      error: err => console.error(err)
    });
  }

  /** Called when user clicks the 'edit price' icon to change the price. */
  editPrice(option: PurchaseOption) {
    const newPrice = prompt('Enter new price:', option.price?.toString() || '0');
    if (newPrice === null) return; // user cancelled
    const parsed = parseFloat(newPrice);
    if (isNaN(parsed)) {
      alert('Invalid number');
      return;
    }
    if (!option.id) return;
    this.purchaseOptionService.updatePriceManually(option.id, parsed)
      .subscribe({
        next: updated => {
          option.price = updated.price;
          alert('Price updated and price history record created');
        },
        error: (err: any) => console.error(err)
      });
  }

  // -------------------------------
  // Save item changes
  // -------------------------------

  /** On final "Save," we do a partial update of the item itself (sku, productCode, desc, category, etc.) */
  saveChanges() {
    if (!this.item.id) {
      // If the item is new, you'd do a "create" flow. For demonstration,
      // we'll do partialUpdate if we have an ID, or skip if there's no ID.
      alert('Item has no ID. Typically you would do a create flow here.');
      return this.close();
    }

    // build partial update fields
    // e.g. if item.category is chosen, use item.category.id for categoryId
    const partialDto: any = {
      name: this.item.name,
      calories: this.item.calories,
      sku: this.item.sku,
      productCode: this.item.productCode,
      description: this.item.description,
    };
    if (this.item.category?.id != null) {
      partialDto.categoryId = this.item.category.id;
    }
    // etc., if you have name or other fields

    const companyId = this.companiesService.getSelectedCompanyId() || -1;

    this.inventoryItemsService.partialUpdateItem(this.item.id, partialDto, companyId).subscribe({
      next: updatedItem => {
        // Merge changes into local item
        this.item.name = updatedItem.name;
        this.item.calories = updatedItem.calories;
        this.item.sku = updatedItem.sku;
        this.item.productCode = updatedItem.productCode;
        this.item.description = updatedItem.description;
        this.item.category = updatedItem.category;
        // Possibly merge other fields from updatedItem
        alert('Item updated!');
        this.dialogRef.close(this.item);
      },
      error: (err: any) => {
        console.error(err);
        alert('Failed to save item changes');
      }
    });
  }

  close() {
    this.dialogRef.close();
  }

  openNewUomDialog(option: PurchaseOption): void {
    const dialogRef = this.dialog.open(UomDialogComponent, {
      width: '400px'
    });
    dialogRef.afterClosed().subscribe((newUom: UnitOfMeasure) => {
      if (newUom) {
        // Add the new UOM to the local allUoms array so it appears in the dropdown.
        this.allUoms.push(newUom);
        // Set the purchase option's orderingUom and orderingUomId
        option.orderingUom = newUom;
        option.orderingUomId = newUom.id;
        // Also update the uom control so the text displays correctly.
        option.uomCtrl!.setValue(newUom.name);
        // Save the changes to the backend
        this.savePurchaseOptionChanges(option);
      }
    });
  }

  private setupPurchaseOptionUomControls(): void {
    if (!this.item.purchaseOptions) return;
    this.item.purchaseOptions.forEach(opt => {
      // Initialize the control and filtered list for UOM
      opt.uomCtrl = new FormControl<string>('', { nonNullable: true });
      opt.filteredUoms = [];
      if (opt.orderingUom && opt.orderingUom.name) {
        opt.uomCtrl.setValue(opt.orderingUom.name);
      }
      opt.uomCtrl.valueChanges
        .pipe(
          debounceTime(300),
          distinctUntilChanged(),
          switchMap((term: string) => this.filterUoms(term))
        )
        .subscribe(filtered => {
          opt.filteredUoms = filtered;
        });
    });
  }
  
  private filterUoms(term: string): Observable<UnitOfMeasure[]> {
    if (!term) {
      // If no term, show all UOMs
      return of(this.allUoms);
    }
    const lowerTerm = term.toLowerCase();
    const filtered = this.allUoms.filter(uom =>
      uom.name.toLowerCase().includes(lowerTerm) ||
      (uom.abbreviation && uom.abbreviation.toLowerCase().includes(lowerTerm))
    );
    return of(filtered);
  }
  
  onUomSelected(selectedName: string, option: PurchaseOption): void {
    if (!selectedName) return;
    
    // Find the matching UOM from allUoms - add null check for uom.name
    const found = this.allUoms.find(uom => 
      uom.name && uom.name.toLowerCase() === selectedName.toLowerCase()
    );
    
    if (found) {
      option.orderingUom = found;
      option.orderingUomId = found.id;
    }
  }
}
