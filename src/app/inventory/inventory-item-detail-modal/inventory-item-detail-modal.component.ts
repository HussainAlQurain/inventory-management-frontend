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

import { InventoryService } from '../../services/inventory.service';
import { SupplierService } from '../../services/supplier.service';
import { UomService } from '../../services/uom.service';
import { LocationService } from '../../services/location.service';
import { CategoriesService } from '../../services/categories.service';
import { PurchaseOptionService } from '../../services/purchase-option.service';
import { InventoryItemLocationService } from '../../services/inventory-item-location.service';

import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { CommonModule } from '@angular/common'; 
import {MatDividerModule} from '@angular/material/divider';
import {MatRadioModule} from '@angular/material/radio';

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
  // Type the FormControl to a non-nullable string
  categoryCtrl = new FormControl<string>('', { nonNullable: true });
  filteredCategories: Category[] = [];
  canCreateNewCategory = false;

  locationInventory: LocationInventory[] = [];

  constructor(
    public dialogRef: MatDialogRef<InventoryItemDetailModalComponent>,
    @Inject(MAT_DIALOG_DATA) public item: InventoryItem,
    private categoriesService: CategoriesService,
    private purchaseOptionService: PurchaseOptionService,
    private inventoryItemLocationService: InventoryItemLocationService,
    private inventoryService: InventoryService,
    private supplierService: SupplierService,
    private uomService: UomService,
    private locationService: LocationService
  ) {}

  ngOnInit(): void {
    // Initialize category search control
    if (this.item.category) {
      this.categoryCtrl.setValue(this.item.category.name);
    }

    // Watch for changes in categoryCtrl
    this.categoryCtrl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((term: string) => this.onCategorySearchChange(term))
    ).subscribe();

    // Load location inventory info
    this.loadLocationInventory();
  }

  onCategorySearchChange(term: string): Observable<void> {
    if (!term) {
      term = '';
    }
    return this.categoriesService.getAllCategories(term).pipe(
      switchMap((cats: Category[]) => {
        this.filteredCategories = cats;
        const exactMatch = cats.some(c => c.name.toLowerCase() === term.toLowerCase());
        this.canCreateNewCategory = term.length > 0 && !exactMatch;
        return of();
      })
    );
  }

  onCategorySelected(name: string) {
    // find the Category from filteredCategories
    const cat = this.filteredCategories.find(c => c.name === name);
    if (cat) {
      this.item.category = cat;
    }
  }

  createNewCategory(name: string) {
    const newCat: Partial<Category> = { name };
    this.categoriesService.createCategory(newCat).subscribe(created => {
      this.item.category = created;
      this.categoryCtrl.setValue(created.name);
      this.filteredCategories.push(created);
      this.canCreateNewCategory = false;
    });
  }

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

  loadLocationInventory() {
    const itemId = this.item.id || 0;
    this.inventoryService.getInventoryByItemAndLocation(itemId).subscribe({
      next: (list) => {
        this.locationInventory = list;
        // compute total
        const totalQty = list.reduce((sum, row) => sum + row.quantity, 0);
        const totalVal = list.reduce((sum, row) => sum + row.value, 0);
        this.item.onHand = totalQty;
        this.item.onHandValue = totalVal;
      },
      error: (err: any) => console.error(err)
    });
  }

  addNewPurchaseOption() {
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
    if (!this.item.purchaseOptions) {
      this.item.purchaseOptions = [];
    }
    this.item.purchaseOptions.push(newOption);
  }

  deletePurchaseOption(option: PurchaseOption) {
    if (!this.item.purchaseOptions) return;
    const idx = this.item.purchaseOptions.indexOf(option);
    if (idx !== -1) {
      this.item.purchaseOptions.splice(idx, 1);
    }
    // optionally call a backend endpoint to delete
    // e.g. purchaseOptionService.deleteOption(option.id!)...
  }

  onOrderingToggled(option: PurchaseOption) {
    if (!option.id) return;
    this.purchaseOptionService.partialUpdateEnabled(option.id, option.orderingEnabled)
      .subscribe({
        next: updated => console.log('Updated orderingEnabled to ', updated.orderingEnabled),
        error: (err: any) => console.error(err)
      });
  }

  onSetAsMain(option: PurchaseOption) {
    if (!option.id) return;
    if (!this.item.purchaseOptions) return;
    this.item.purchaseOptions.forEach(po => po.mainPurchaseOption = (po === option));
    this.purchaseOptionService.setAsMainOption(option.id)
      .subscribe({
        next: updated => console.log('Set as main', updated),
        error: (err: any) => console.error(err)
      });
  }

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

  close() {
    this.dialogRef.close();
  }

  saveChanges() {
    // If needed, call an update item method in your service
    // e.g. inventoryItemsService.updateItem(this.item)...

    this.dialogRef.close(this.item);
  }
}
