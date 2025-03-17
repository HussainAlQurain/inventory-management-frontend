import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { Observable, of } from 'rxjs';

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
import { CompaniesService } from '../../services/companies.service';

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
    MatRadioModule
  ],
})
export class InventoryItemDetailModalComponent implements OnInit {
  /** For category searching & creation */
  categoryCtrl = new FormControl<string>('', { nonNullable: true });
  filteredCategories: Category[] = [];
  canCreateNewCategory = false;

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
    private companiesService: CompaniesService
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

    // Load location-based on-hand info
    this.loadLocationInventory();
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

  /** Called when the user picks any option (existing or “create new”). */
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
    console.log('Creating new category with name:', name);
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
    const payload = {
      newMin: this.item.minOnHand,
      newPar: this.item.par
    };
    this.inventoryItemLocationService.bulkUpdate(this.item.id, payload)
      .subscribe({
        next: () => alert('All stores updated'),
        error: (err: any) => console.error(err)
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
    const newOption: PurchaseOption = {
      inventoryItemId: this.item.id,
      price: 0,
      taxRate: 0,
      orderingEnabled: true,
      mainPurchaseOption: false,
      innerPackQuantity: 1,
      packsPerCase: 1,
      minOrderQuantity: 1
    };
    // Call backend to create
    this.purchaseOptionService.createPurchaseOption(newOption, this.item.id).subscribe({
      next: created => {
        // push to local array
        if (!this.item.purchaseOptions) {
          this.item.purchaseOptions = [];
        }
        this.item.purchaseOptions.push(created);
      },
      error: err => console.error(err)
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

  /** On final “Save,” we do a partial update of the item itself (sku, productCode, desc, category, etc.) */
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
}
