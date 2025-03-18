import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

import { PurchaseOption } from '../../models/PurchaseOption';
import { Supplier } from '../../models/Supplier';
import { UnitOfMeasure } from '../../models/UnitOfMeasure';
import { Category } from '../../models/Category';

import { SupplierService } from '../../services/supplier.service';
import { UomService } from '../../services/uom.service';
import { CategoriesService } from '../../services/categories.service';
import { LocationService } from '../../services/location.service';
import { UomDialogComponent } from '../uom-dialog/uom-dialog.component';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSelectModule } from '@angular/material/select';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';

export interface PurchaseOptionModalData {
  inventoryItemId: number;
  existingOption?: PurchaseOption; // For editing mode
}

@Component({
  selector: 'app-purchase-option-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatSelectModule
  ],
  templateUrl: './purchase-option-modal.component.html',
  styleUrls: ['./purchase-option-modal.component.scss']
})
export class PurchaseOptionModalComponent implements OnInit {
  purchaseOptionForm: FormGroup;
  
  // Supplier selection
  supplierCtrl = new FormControl<string>('', { nonNullable: true });
  filteredSuppliers: Supplier[] = [];
  canCreateNewSupplier = false;
  
  // UOM selection
  uomCtrl = new FormControl<string>('', { nonNullable: true });
  filteredUoms: UnitOfMeasure[] = [];
  allUoms: UnitOfMeasure[] = [];
  
  // Supplier creation fields
  showSupplierCreation = false;
  supplierForm: FormGroup;
  filteredCategories: Category[] = [];
  canCreateNewCategory = false;
  categoryCtrl = new FormControl<string>('', { nonNullable: true });
  allLocations: any[] = [];

  constructor(
    public dialogRef: MatDialogRef<PurchaseOptionModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PurchaseOptionModalData,
    private fb: FormBuilder,
    private supplierService: SupplierService,
    private uomService: UomService,
    private categoriesService: CategoriesService,
    private locationService: LocationService,
    private dialog: MatDialog
  ) {
    // Initialize the purchase option form
    this.purchaseOptionForm = this.fb.group({
      nickname: [''],
      price: [0, Validators.required],
      taxRate: [15, Validators.required],
      innerPackQuantity: [1, Validators.required],
      packsPerCase: [1, Validators.required],
      minOrderQuantity: [1, Validators.required],
      mainPurchaseOption: [false],
      orderingEnabled: [true],
      supplierProductCode: [''],
      scanBarcode: ['']
    });

    // Initialize supplier form
    this.supplierForm = this.fb.group({
      name: ['', Validators.required],
      customerNumber: [''],
      minimumOrder: [0],
      taxId: [''],
      taxRate: [15],
      paymentTerms: [''],
      comments: [''],
      address: [''],
      city: [''],
      state: [''],
      zip: [''],
      ccEmails: [''],
      defaultCategoryId: [null]
    });
  }

  ngOnInit(): void {
    // Pre-fill form if editing an existing option
    if (this.data.existingOption) {
      const option = this.data.existingOption;
      this.purchaseOptionForm.patchValue({
        nickname: option.nickname,
        price: option.price,
        taxRate: option.taxRate,
        innerPackQuantity: option.innerPackQuantity,
        packsPerCase: option.packsPerCase,
        minOrderQuantity: option.minOrderQuantity,
        mainPurchaseOption: option.mainPurchaseOption,
        orderingEnabled: option.orderingEnabled,
        supplierProductCode: option.supplierProductCode,
        scanBarcode: option.scanBarcode
      });
      
      if (option.supplier) {
        this.supplierCtrl.setValue(option.supplier.name);
      }
      
      if (option.orderingUom) {
        this.uomCtrl.setValue(option.orderingUom.name);
      }
    }

    // Setup supplier autocomplete
    this.setupSupplierAutocomplete();
    
    // Setup UOM autocomplete
    this.setupUomAutocomplete();
    
    // Setup category autocomplete for supplier creation
    this.setupCategoryAutocomplete();
    
    // Load locations
    this.loadLocations();
  }
  
  private setupSupplierAutocomplete(): void {
    this.supplierCtrl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => this.searchSuppliers(term))
    ).subscribe({
      next: (suppliers) => {
        this.filteredSuppliers = suppliers;
        const exact = suppliers.some(s => s.name.toLowerCase() === this.supplierCtrl.value.toLowerCase());
        this.canCreateNewSupplier = !!this.supplierCtrl.value && !exact;
      },
      error: (err) => console.error('Error searching suppliers:', err)
    });
  }
  
  private searchSuppliers(term: string): Observable<Supplier[]> {
    if (!term.trim()) {
      return of([]);
    }
    return this.supplierService.searchSuppliers(term);
  }
  
  onSupplierSelected(value: string): void {
    const match = this.filteredSuppliers.find(s => s.name === value);
    if (match) {
      // Store supplier ID for form submission
      this.supplierForm.get('name')?.setValue(match.name);
    }
  }
  
  toggleSupplierCreation(): void {
    this.showSupplierCreation = !this.showSupplierCreation;
    
    if (this.showSupplierCreation) {
      // Pre-fill the supplier name from the search field
      this.supplierForm.get('name')?.setValue(this.supplierCtrl.value);
    }
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
      // Store UOM ID for submission
      // We'll access this when creating the purchase option
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
      }
    });
  }
  
  private setupCategoryAutocomplete(): void {
    this.categoryCtrl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => this.categoriesService.getAllCategories(term))
    ).subscribe({
      next: (categories) => {
        this.filteredCategories = categories;
        const exact = categories.some(c => c.name.toLowerCase() === this.categoryCtrl.value.toLowerCase());
        this.canCreateNewCategory = !!this.categoryCtrl.value && !exact;
      },
      error: (err) => console.error('Error loading categories:', err)
    });
  }
  
  onCategorySelected(value: string): void {
    const match = this.filteredCategories.find(c => c.name === value);
    if (match) {
      this.supplierForm.get('defaultCategoryId')?.setValue(match.id);
    }
  }
  
  createNewCategory(): void {
    if (!this.categoryCtrl.value) return;
    
    const newCategory = { name: this.categoryCtrl.value };
    this.categoriesService.createCategory(newCategory).subscribe({
      next: (createdCategory) => {
        this.filteredCategories.push(createdCategory);
        this.supplierForm.get('defaultCategoryId')?.setValue(createdCategory.id);
        this.canCreateNewCategory = false;
      },
      error: (err) => console.error('Error creating category:', err)
    });
  }
  
  private loadLocations(): void {
    this.locationService.getAllLocations().subscribe({
      next: (locations) => {
        this.allLocations = locations;
      },
      error: (err) => console.error('Error loading locations:', err)
    });
  }
  
  saveSupplier(): void {
    if (!this.supplierForm.valid) {
      alert('Please fill in all required supplier fields');
      return;
    }
    
    const supplierData: Supplier = {
      ...this.supplierForm.value,
      emails: [],
      phones: []
    };
    
    this.supplierService.createSupplier(supplierData).subscribe({
      next: (createdSupplier) => {
        this.showSupplierCreation = false;
        this.supplierCtrl.setValue(createdSupplier.name);
        this.filteredSuppliers = [createdSupplier];
      },
      error: (err) => console.error('Error creating supplier:', err)
    });
  }
  
  savePurchaseOption(): void {
    if (!this.purchaseOptionForm.valid) {
      alert('Please fill in all required fields');
      return;
    }
    
    // Get purchase option data
    const purchaseOptionData = this.purchaseOptionForm.value;
    
    // Get supplier ID
    const supplier = this.filteredSuppliers.find(s => s.name === this.supplierCtrl.value);
    if (supplier) {
      purchaseOptionData.supplierId = supplier.id;
    }
    
    // Get UOM ID
    const uom = this.allUoms.find(u => u.name === this.uomCtrl.value);
    if (uom) {
      purchaseOptionData.orderingUomId = uom.id;
    }
    
    // Close dialog and return data
    this.dialogRef.close(purchaseOptionData);
  }
  
  cancel(): void {
    this.dialogRef.close();
  }
}
