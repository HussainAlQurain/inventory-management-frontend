import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

import { PurchaseOption } from '../../models/PurchaseOption';
import { Supplier, SupplierEmail, SupplierPhone } from '../../models/Supplier';
import { UnitOfMeasure } from '../../models/UnitOfMeasure';
import { Category } from '../../models/Category';

import { SupplierService } from '../../services/supplier.service';
import { UomService } from '../../services/uom.service';
import { CategoriesService } from '../../services/categories.service';
import { LocationService } from '../../services/location.service';
import { CompaniesService } from '../../services/companies.service';
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

// Import the new supplier form component
import { SupplierFormComponent } from '../../suppliers/supplier-form/supplier-form.component';

export interface PurchaseOptionModalData {
  inventoryItemId: number;
  existingOption?: PurchaseOption; // For editing mode
  initialSupplierName?: string; // For creating supplier from inventory item detail
  supplierCreationMode?: boolean; // If true, only use for supplier creation
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
    MatSelectModule,
    SupplierFormComponent
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
  companyId!: number;

  // Add new properties for supplier editing
  selectedSupplier: Supplier | null = null;
  isEditingSupplier = false;

  // Add arrays to store supplier emails and phones
  supplierEmails: SupplierEmail[] = [];
  supplierPhones: SupplierPhone[] = [];
  
  // Add declarations for email and phone forms
  emailForm: FormGroup;
  phoneForm: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<PurchaseOptionModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PurchaseOptionModalData,
    private fb: FormBuilder,
    private supplierService: SupplierService,
    private uomService: UomService,
    private categoriesService: CategoriesService,
    private locationService: LocationService,
    private companiesService: CompaniesService,
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

    // Initialize email and phone forms
    this.emailForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      isDefault: [false]
    });

    this.phoneForm = this.fb.group({
      phoneNumber: ['', Validators.required],
      isDefault: [false]
    });
  }

  ngOnInit(): void {
    // Get the company ID
    this.companyId = this.companiesService.getSelectedCompanyId() || 0;
    
    // If used for supplier creation, initialize supplier name
    if (this.data.supplierCreationMode && this.data.initialSupplierName) {
      this.supplierCtrl.setValue(this.data.initialSupplierName);
      this.toggleSupplierCreation();
    }
    
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
        // Load full supplier details when editing
        if (option.supplier.id) {
          this.loadSupplierDetails(option.supplier.id);
        }
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

  // Add method to load full supplier details
  private loadSupplierDetails(supplierId: number): void {
    this.supplierService.getSupplierById(supplierId).subscribe({
      next: (supplier) => {
        this.selectedSupplier = supplier;
        // Copy emails and phones from the supplier
        this.supplierEmails = supplier.emails ? [...supplier.emails] : [];
        this.supplierPhones = supplier.phones ? [...supplier.phones] : [];
      },
      error: (err) => console.error('Error loading supplier details:', err)
    });
  }
  
  private setupSupplierAutocomplete(): void {
    // Initialize with a search if we have a value
    if (this.supplierCtrl.value) {
      this.searchSuppliers(this.supplierCtrl.value).subscribe(suppliers => {
        this.filteredSuppliers = suppliers;
      });
    }
    
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
    if (!term || !term.trim()) {
      return of([]);
    }
    console.log('Searching suppliers with term:', term);
    return this.supplierService.searchSuppliers(term);
  }
  
  onSupplierSelected(value: string): void {
    const match = this.filteredSuppliers.find(s => s.name === value);
    if (match) {
      // Store the selected supplier
      this.selectedSupplier = match;
      // Load full supplier details
      if (match.id) {
        this.loadSupplierDetails(match.id);
      }
    }
  }
  
  toggleSupplierCreation(): void {
    this.showSupplierCreation = !this.showSupplierCreation;
    this.isEditingSupplier = false;
    
    if (this.showSupplierCreation) {
      // Pre-fill the supplier name from the search field
      this.supplierForm.get('name')?.setValue(this.supplierCtrl.value);
    }
  }

  // Add handler for supplier creation/update from the form component
  onSupplierCreated(supplier: Supplier): void {
    this.showSupplierCreation = false;
    this.selectedSupplier = supplier;
    this.supplierCtrl.setValue(supplier.name);
    this.filteredSuppliers = [supplier];
    
    // If in supplier creation mode, return the created supplier
    if (this.data.supplierCreationMode) {
      this.dialogRef.close({ supplier });
    }
  }

  onSupplierUpdated(supplier: Supplier): void {
    this.showSupplierCreation = false;
    this.selectedSupplier = supplier;
    this.supplierCtrl.setValue(supplier.name);
    
    // Update the supplier in the filtered list
    const index = this.filteredSuppliers.findIndex(s => s.id === supplier.id);
    if (index >= 0) {
      this.filteredSuppliers[index] = supplier;
    }
  }

  onSupplierFormCancel(): void {
    this.showSupplierCreation = false;
  }

  // Add new method to edit existing supplier
  editSupplier(): void {
    if (!this.selectedSupplier) return;
    
    this.showSupplierCreation = true;
    this.isEditingSupplier = true;
    
    // Populate the form with the current supplier data
    this.supplierForm.patchValue({
      name: this.selectedSupplier.name,
      customerNumber: this.selectedSupplier.customerNumber || '',
      minimumOrder: this.selectedSupplier.minimumOrder || 0,
      taxId: this.selectedSupplier.taxId || '',
      taxRate: this.selectedSupplier.taxRate || 15,
      paymentTerms: this.selectedSupplier.paymentTerms || '',
      comments: this.selectedSupplier.comments || '',
      address: this.selectedSupplier.address || '',
      city: this.selectedSupplier.city || '',
      state: this.selectedSupplier.state || '',
      zip: this.selectedSupplier.zip || '',
      ccEmails: this.selectedSupplier.ccEmails || '',
      defaultCategoryId: this.selectedSupplier.defaultCategoryId || null
    });
    
    // Set the category control value if a category exists
    if (this.selectedSupplier.defaultCategory) {
      this.categoryCtrl.setValue(this.selectedSupplier.defaultCategory.name);
    }
    
    // Copy emails and phones
    this.supplierEmails = this.selectedSupplier.emails ? [...this.selectedSupplier.emails] : [];
    this.supplierPhones = this.selectedSupplier.phones ? [...this.selectedSupplier.phones] : [];
  }

  // Add methods for managing emails
  addEmail(): void {
    if (this.emailForm.valid) {
      const newEmail: SupplierEmail = {
        email: this.emailForm.get('email')?.value,
        isDefault: this.emailForm.get('isDefault')?.value || false
      };
      
      // If this is set as default, update all others to not default
      if (newEmail.isDefault) {
        this.supplierEmails.forEach(email => email.isDefault = false);
      }
      
      this.supplierEmails.push(newEmail);
      this.emailForm.reset({
        email: '',
        isDefault: false
      });
    }
  }
  
  removeEmail(index: number): void {
    this.supplierEmails.splice(index, 1);
  }
  
  setDefaultEmail(index: number): void {
    this.supplierEmails.forEach((email, i) => {
      email.isDefault = (i === index);
    });
  }
  
  // Add methods for managing phones
  addPhone(): void {
    if (this.phoneForm.valid) {
      const newPhone: SupplierPhone = {
        phoneNumber: this.phoneForm.get('phoneNumber')?.value,
        isDefault: this.phoneForm.get('isDefault')?.value || false
      };
      
      // If this is set as default, update all others to not default
      if (newPhone.isDefault) {
        this.supplierPhones.forEach(phone => phone.isDefault = false);
      }
      
      this.supplierPhones.push(newPhone);
      this.phoneForm.reset({
        phoneNumber: '',
        isDefault: false
      });
    }
  }
  
  removePhone(index: number): void {
    this.supplierPhones.splice(index, 1);
  }
  
  setDefaultPhone(index: number): void {
    this.supplierPhones.forEach((phone, i) => {
      phone.isDefault = (i === index);
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
      switchMap(term => this.categoriesService.getAllCategories(term || ''))
    ).subscribe({
      next: (categories) => {
        this.filteredCategories = categories || [];
        const ctrlValue = this.categoryCtrl.value || '';
        const exact = this.filteredCategories.some(c => 
          c?.name && c.name.toLowerCase() === ctrlValue.toLowerCase()
        );
        this.canCreateNewCategory = !!ctrlValue && !exact;
      },
      error: (err) => console.error('Error loading categories:', err)
    });
  }
  
  onCategorySelected(value: string): void {
    if (!value) return;
    
    const match = this.filteredCategories.find(c => c?.name === value);
    if (match?.id) {
      this.supplierForm.get('defaultCategoryId')?.setValue(match.id);
    }
  }
  
  onCategoryOptionSelected(event: any): void {
    const selectedValue = event.option.value;
    const existing = this.filteredCategories.find(
      c => c.name.toLowerCase() === selectedValue.toLowerCase()
    );
    if (existing) {
      // Existing category selected – assign its ID and update the control
      this.supplierForm.get('defaultCategoryId')?.setValue(existing.id);
      this.categoryCtrl.setValue(existing.name);
    } else {
      // No existing category: create a new one using the selected value.
      this.createNewCategory(selectedValue);
    }
  }
  
  createNewCategory(categoryName: string): void {
    console.log('Creating new category:', categoryName);
    if (!categoryName) return;
    
    const newCategory = { 
      name: categoryName,
      description: '' // Optionally add a description
    };
    
    this.categoriesService.createCategory(newCategory).subscribe({
      next: (createdCategory) => {
        if (createdCategory) {
          // Add the new category to the filtered list,
          // update the supplier form with the new category ID,
          // and set the control to the new category name.
          this.filteredCategories.push(createdCategory);
          this.supplierForm.get('defaultCategoryId')?.setValue(createdCategory.id);
          this.categoryCtrl.setValue(createdCategory.name);
          this.canCreateNewCategory = false;
        }
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
      emails: this.supplierEmails,
      phones: this.supplierPhones
    };
    
    if (this.isEditingSupplier && this.selectedSupplier?.id) {
      // Update existing supplier
      supplierData.id = this.selectedSupplier.id;
      this.supplierService.updateSupplier(supplierData).subscribe({
        next: (updatedSupplier) => {
          this.showSupplierCreation = false;
          this.selectedSupplier = updatedSupplier;
          this.supplierCtrl.setValue(updatedSupplier.name);
          // Update the supplier in the filtered list
          const index = this.filteredSuppliers.findIndex(s => s.id === updatedSupplier.id);
          if (index >= 0) {
            this.filteredSuppliers[index] = updatedSupplier;
          }
        },
        error: (err) => console.error('Error updating supplier:', err)
      });
    } else {
      // Create new supplier
      this.supplierService.createSupplier(supplierData).subscribe({
        next: (createdSupplier) => {
          this.showSupplierCreation = false;
          this.selectedSupplier = createdSupplier;
          this.supplierCtrl.setValue(createdSupplier.name);
          this.filteredSuppliers = [createdSupplier];
          
          // If in supplier creation mode, return the created supplier
          if (this.data.supplierCreationMode) {
            this.dialogRef.close({ supplier: createdSupplier });
          }
        },
        error: (err) => console.error('Error creating supplier:', err)
      });
    }
  }
  
  savePurchaseOption(): void {
    if (!this.purchaseOptionForm.valid) {
      alert('Please fill in all required fields');
      return;
    }
    
    // Get purchase option data
    const purchaseOptionData = this.purchaseOptionForm.value;
    
    // Get supplier ID and object
    const supplier = this.filteredSuppliers.find(s => s.name === this.supplierCtrl.value);
    if (supplier) {
      purchaseOptionData.supplierId = supplier.id;
      purchaseOptionData.supplier = supplier; // Add full supplier object
    }
    
    // Get UOM ID and object
    const uom = this.allUoms.find(u => u.name === this.uomCtrl.value);
    if (uom) {
      purchaseOptionData.orderingUomId = uom.id;
      purchaseOptionData.orderingUom = uom; // Add full UOM object
    }
    
    // Close dialog and return data
    this.dialogRef.close(purchaseOptionData);
  }
  
  cancel(): void {
    this.dialogRef.close();
  }
}
