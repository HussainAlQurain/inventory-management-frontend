import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { InventoryItem } from '../../models/InventoryItem';
import { Category } from '../../models/Category';
import { UnitOfMeasure } from '../../models/UnitOfMeasure';
import { PurchaseOption } from '../../models/PurchaseOption';
import { Supplier } from '../../models/Supplier';

import { InventoryItemsService } from '../../services/inventory-items-service.service';
import { CategoriesService } from '../../services/categories.service';
import { UomService } from '../../services/uom.service';
import { SupplierService } from '../../services/supplier.service';
import { CompaniesService } from '../../services/companies.service';

import { UomDialogComponent } from '../uom-dialog/uom-dialog.component';
import { PurchaseOptionModalComponent } from '../purchase-option-modal/purchase-option-modal.component';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-add-inventory-item',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatAutocompleteModule,
    MatDividerModule,
    MatTabsModule,
    MatCheckboxModule,
    MatSelectModule,
    MatTooltipModule
  ],
  templateUrl: './add-inventory-item.component.html',
  styleUrls: ['./add-inventory-item.component.scss']
})
export class AddInventoryItemComponent implements OnInit {
  @Output() closePanel = new EventEmitter<InventoryItem | null>();
  
  // Form for the inventory item
  itemForm: FormGroup;
  
  // Category selection
  categoryCtrl = new FormControl<string>('', { nonNullable: true });
  filteredCategories: Category[] = [];
  canCreateNewCategory = false;
  
  // UOM selection
  uomCtrl = new FormControl<string>('', { nonNullable: true });
  filteredUoms: UnitOfMeasure[] = [];
  allUoms: UnitOfMeasure[] = [];
  
  // Purchase options
  purchaseOptions: PurchaseOption[] = [];
  
  // Loading states
  isSubmitting = false;
  
  constructor(
    private fb: FormBuilder,
    private inventoryItemsService: InventoryItemsService,
    private categoriesService: CategoriesService,
    private uomService: UomService,
    private supplierService: SupplierService,
    private companiesService: CompaniesService,
    private dialog: MatDialog
  ) {
    // Initialize the item form
    this.itemForm = this.fb.group({
      name: ['', Validators.required],
      sku: [''],
      productCode: [''],
      description: [''],
      currentPrice: [0],
      calories: [0],
      categoryId: [null],
      inventoryUomId: [null]
    });
  }

  ngOnInit(): void {
    // Setup category autocomplete
    this.setupCategoryAutocomplete();
    
    // Setup UOM autocomplete
    this.setupUomAutocomplete();
  }
  
  private setupCategoryAutocomplete(): void {
    this.categoryCtrl.valueChanges.pipe(
      debounceTime(500), // Increase from 300ms to 500ms to reduce database load
      distinctUntilChanged(),
      switchMap(term => this.onCategorySearchChange(term))
    ).subscribe();
  }
  
  private onCategorySearchChange(term: string): Observable<void> {
    if (!term) term = '';
    
    // Use the lightweight paginated endpoint
    return this.categoriesService.getPaginatedCategoryFilterOptions(0, 20, term).pipe(
      switchMap((response) => {
        this.filteredCategories = response.content;
        const exactMatch = response.content.some(c => c.name.toLowerCase() === term.toLowerCase());
        this.canCreateNewCategory = term.length > 0 && !exactMatch;
        return of();
      })
    );
  }
  
  onCategorySelected(value: string): void {
    const category = this.filteredCategories.find(c => c.name === value);
    if (category) {
      this.itemForm.get('categoryId')?.setValue(category.id);
    }
  }
  
  onCategoryOptionSelected(fullValue: string): void {
    // Check if selected an existing category
    const existing = this.filteredCategories.find(c => c.name === fullValue);
    if (existing) {
      this.itemForm.get('categoryId')?.setValue(existing.id);
      return;
    }
    
    // Otherwise, create a new category
    this.createNewCategory(fullValue);
  }
  
  private createNewCategory(name: string): void {
    const newCat: Partial<Category> = { name };
    this.categoriesService.createCategory(newCat).subscribe({
      next: (created) => {
        this.itemForm.get('categoryId')?.setValue(created.id);
        this.categoryCtrl.setValue(created.name);
        this.filteredCategories.push(created);
        this.canCreateNewCategory = false;
      },
      error: (err) => console.error('Error creating category:', err)
    });
  }
  
  private setupUomAutocomplete(): void {
    // Load all UOMs
    this.uomService.getAllUoms().subscribe({
      next: (uoms) => {
        this.allUoms = uoms;
        this.filteredUoms = uoms;
      },
      error: (err) => console.error('Error loading UOMs:', err)
    });
    
    // Filter UOMs based on input
    this.uomCtrl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe({
      next: (term) => {
        if (!term) {
          this.filteredUoms = this.allUoms;
          return;
        }
        
        const lowerTerm = term.toLowerCase();
        this.filteredUoms = this.allUoms.filter(uom => 
          uom.name.toLowerCase().includes(lowerTerm) ||
          (uom.abbreviation && uom.abbreviation.toLowerCase().includes(lowerTerm))
        );
      },
      error: (err) => console.error('Error filtering UOMs:', err)
    });
  }
  
  onUomSelected(selectedName: string): void {
    if (!selectedName) return;
    
    const found = this.allUoms.find(uom => 
      uom.name && uom.name.toLowerCase() === selectedName.toLowerCase()
    );
    
    if (found) {
      this.itemForm.get('inventoryUomId')?.setValue(found.id);
    }
  }
  
  openNewUomDialog(): void {
    const dialogRef = this.dialog.open(UomDialogComponent, {
      width: '400px'
    });
    
    dialogRef.afterClosed().subscribe((newUom: UnitOfMeasure) => {
      if (newUom) {
        this.allUoms.push(newUom);
        this.filteredUoms = [...this.allUoms];
        this.uomCtrl.setValue(newUom.name);
        this.itemForm.get('inventoryUomId')?.setValue(newUom.id);
      }
    });
  }
  
  addPurchaseOption(): void {
    // Open purchase option modal dialog
    const dialogRef = this.dialog.open(PurchaseOptionModalComponent, {
      width: '700px',
      data: { 
        inventoryItemId: 0, // Temporary ID, will be replaced after saving the item
        supplierCreationMode: false
      }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Add the new purchase option to the array
        this.purchaseOptions.push(result);
      }
    });
  }
  
  removePurchaseOption(index: number): void {
    this.purchaseOptions.splice(index, 1);
  }
  
  submitForm(): void {
    if (!this.itemForm.valid) {
      alert('Please fill out all required fields');
      return;
    }
    
    this.isSubmitting = true;
    
    // Build the request object
    const itemData = {
      ...this.itemForm.value,
      purchaseOptions: this.purchaseOptions.map(po => {
        // Create a clean copy of the purchase option data
        const cleanPO: any = {
          price: po.price,
          taxRate: po.taxRate,
          innerPackQuantity: po.innerPackQuantity,
          packsPerCase: po.packsPerCase,
          minOrderQuantity: po.minOrderQuantity,
          mainPurchaseOption: po.mainPurchaseOption,
          orderingEnabled: po.orderingEnabled,
          supplierProductCode: po.supplierProductCode,
          nickname: po.nickname,
          scanBarcode: po.scanBarcode
        };

        // Handle supplier - prefer ID if available
        if (po.supplierId) {
          cleanPO.supplierId = po.supplierId;
        } else if (po.supplier?.id) {
          cleanPO.supplierId = po.supplier.id;
        } else if (po.supplier) {
          // Full supplier object with no ID (new supplier)
          cleanPO.supplier = po.supplier;
        }

        // Handle ordering UOM - prefer ID if available
        if (po.orderingUomId) {
          cleanPO.orderingUomId = po.orderingUomId;
        } else if (po.orderingUom?.id) {
          cleanPO.orderingUomId = po.orderingUom.id;
        } else if (po.orderingUom) {
          // Full UOM object with no ID (new UOM)
          cleanPO.orderingUom = po.orderingUom;
        }

        return cleanPO;
      })
    };
    
    this.inventoryItemsService.createInventoryItem(itemData).subscribe({
      next: (createdItem) => {
        this.isSubmitting = false;
        this.closePanel.emit(createdItem);
      },
      error: (error) => {
        this.isSubmitting = false;
        console.error('Error creating inventory item:', error);
        alert('Error creating inventory item. Please try again.');
      }
    });
  }
  
  cancel(): void {
    this.closePanel.emit(null);
  }
}
