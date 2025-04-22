import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatTableModule } from '@angular/material/table';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';

import { Supplier, SupplierEmail, SupplierPhone } from '../../models/Supplier';
import { SupplierService } from '../../services/supplier.service';
import { CategoriesService } from '../../services/categories.service';
import { LocationService } from '../../services/location.service';
import { Category } from '../../models/Category';
import { Location } from '../../models/Location';
import { debounceTime, distinctUntilChanged, switchMap, Observable, of } from 'rxjs';

@Component({
  selector: 'app-supplier-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatTabsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatTooltipModule,
    MatAutocompleteModule,
    MatTableModule,
    MatDialogModule
  ],
  templateUrl: './supplier-detail.component.html',
  styleUrls: ['./supplier-detail.component.scss']
})
export class SupplierDetailComponent implements OnInit {
  supplierId: number | null = null;
  supplier: Supplier | null = null;
  supplierForm: FormGroup;
  isLoading: boolean = false;
  isEditing: boolean = false;
  
  // Category management
  categories: Category[] = [];
  filteredCategories: Category[] = [];
  
  // Location management
  locations: Location[] = [];
  
  // Contact management
  supplierEmails: SupplierEmail[] = [];
  supplierPhones: SupplierPhone[] = [];
  
  emailColumns: string[] = ['email', 'isDefault', 'location', 'actions'];
  phoneColumns: string[] = ['phoneNumber', 'isDefault', 'location', 'actions'];
  
  // New email/phone forms
  newEmailForm: FormGroup;
  newPhoneForm: FormGroup;
  showAddEmailForm: boolean = false;
  showAddPhoneForm: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private supplierService: SupplierService,
    private categoriesService: CategoriesService,
    private locationService: LocationService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.supplierForm = this.createSupplierForm();
    this.newEmailForm = this.createEmailForm();
    this.newPhoneForm = this.createPhoneForm();
  }

  ngOnInit(): void {
    this.loadCategories();
    this.loadLocations();
    
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.supplierId = +id;
        this.loadSupplier();
      } else {
        this.initNewSupplier();
      }
    });
  }

  createSupplierForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      customerNumber: [''],
      minimumOrder: [0, [Validators.min(0)]],
      taxId: [''],
      taxRate: [15, [Validators.min(0), Validators.max(100)]],
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

  createEmailForm(): FormGroup {
    return this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      isDefault: [false],
      locationId: [null]
    });
  }

  createPhoneForm(): FormGroup {
    return this.fb.group({
      phoneNumber: ['', [Validators.required]],
      isDefault: [false],
      locationId: [null]
    });
  }

  loadSupplier(): void {
    if (!this.supplierId) return;
    
    this.isLoading = true;
    this.supplierService.getSupplierById(this.supplierId).subscribe({
      next: (supplier) => {
        this.supplier = supplier;
        this.populateForm();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading supplier:', err);
        this.snackBar.open('Failed to load supplier details', 'Close', { duration: 3000 });
        this.isLoading = false;
        this.router.navigate(['/suppliers/list']);
      }
    });
  }

  initNewSupplier(): void {
    this.supplier = {
      name: '',
      emails: [],
      phones: []
    };
    this.isEditing = true;
  }

  populateForm(): void {
    if (!this.supplier) return;
    
    this.supplierForm.patchValue({
      name: this.supplier.name,
      customerNumber: this.supplier.customerNumber || '',
      minimumOrder: this.supplier.minimumOrder || 0,
      taxId: this.supplier.taxId || '',
      taxRate: this.supplier.taxRate || 15,
      paymentTerms: this.supplier.paymentTerms || '',
      comments: this.supplier.comments || '',
      address: this.supplier.address || '',
      city: this.supplier.city || '',
      state: this.supplier.state || '',
      zip: this.supplier.zip || '',
      ccEmails: this.supplier.ccEmails || '',
      defaultCategoryId: this.supplier.defaultCategoryId || null
    });
    
    // Set up emails and phones arrays from orderEmails and orderPhones
    if (this.supplier.orderEmails && this.supplier.orderEmails.length > 0) {
      this.supplierEmails = this.supplier.orderEmails.map(email => ({
        id: email.id,
        email: email.email,
        isDefault: email.default,
        locationId: email.locationId
      }));
    } else if (this.supplier.emails) {
      this.supplierEmails = [...this.supplier.emails];
    } else {
      this.supplierEmails = [];
    }

    if (this.supplier.orderPhones && this.supplier.orderPhones.length > 0) {
      this.supplierPhones = this.supplier.orderPhones.map(phone => ({
        id: phone.id,
        phoneNumber: phone.phoneNumber,
        isDefault: phone.default,
        locationId: phone.locationId
      }));
    } else if (this.supplier.phones) {
      this.supplierPhones = [...this.supplier.phones];
    } else {
      this.supplierPhones = [];
    }
  }

  loadCategories(): void {
    this.categoriesService.getAllCategories('').subscribe({
      next: (categories) => {
        this.categories = categories;
        this.filteredCategories = categories;
      },
      error: (err) => {
        console.error('Error loading categories:', err);
      }
    });
  }

  loadLocations(): void {
    this.locationService.getAllLocations().subscribe({
      next: (locations) => {
        this.locations = locations;
      },
      error: (err) => {
        console.error('Error loading locations:', err);
      }
    });
  }

  onCategoryInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.filteredCategories = this._filterCategories(value);
  }

  private _filterCategories(value: string): Category[] {
    if (!value) return this.categories;
    
    const filterValue = value.toLowerCase();
    return this.categories.filter(category => 
      category.name.toLowerCase().includes(filterValue)
    );
  }

  toggleEditMode(): void {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) {
      // If we're canceling edit mode, reset the form
      this.populateForm();
    }
  }

  saveSupplier(): void {
    if (!this.supplierForm.valid) {
      this.snackBar.open('Please fill out all required fields correctly', 'Close', { duration: 3000 });
      return;
    }
    
    // Map UI isDefault to API default property
    const emailsForApi = this.supplierEmails.map(email => ({
      ...email,
      default: email.isDefault
    }));

    const phonesForApi = this.supplierPhones.map(phone => ({
      ...phone,
      default: phone.isDefault
    }));
    
    const supplierData: Supplier = {
      ...this.supplierForm.value,
      orderEmails: emailsForApi,
      orderPhones: phonesForApi
    };
    
    if (this.supplier?.id) {
      // Update existing supplier
      supplierData.id = this.supplier.id;
      
      this.isLoading = true;
      this.supplierService.updateSupplier(supplierData).subscribe({
        next: (updatedSupplier) => {
          this.supplier = updatedSupplier;
          this.populateForm();
          this.isLoading = false;
          this.isEditing = false;
          this.snackBar.open('Supplier updated successfully', 'Close', { duration: 3000 });
        },
        error: (err) => {
          console.error('Error updating supplier:', err);
          this.snackBar.open('Failed to update supplier', 'Close', { duration: 3000 });
          this.isLoading = false;
        }
      });
    } else {
      // Create new supplier
      this.isLoading = true;
      this.supplierService.createSupplier(supplierData).subscribe({
        next: (newSupplier) => {
          this.snackBar.open('Supplier created successfully', 'Close', { duration: 3000 });
          this.router.navigate(['/suppliers/detail', newSupplier.id]);
        },
        error: (err) => {
          console.error('Error creating supplier:', err);
          this.snackBar.open('Failed to create supplier', 'Close', { duration: 3000 });
          this.isLoading = false;
        }
      });
    }
  }

  // Email methods
  toggleAddEmailForm(): void {
    this.showAddEmailForm = !this.showAddEmailForm;
    if (this.showAddEmailForm) {
      this.newEmailForm.reset({
        email: '',
        isDefault: false,
        locationId: null
      });
    }
  }

  addEmail(): void {
    if (this.newEmailForm.invalid) {
      return;
    }
    
    const newEmail: SupplierEmail = {
      ...this.newEmailForm.value,
      default: this.newEmailForm.value.isDefault
    };
    
    // If this is set as default, update all others to not default
    if (newEmail.isDefault) {
      this.supplierEmails.forEach(email => email.isDefault = false);
    }
    
    this.supplierEmails.push(newEmail);
    this.toggleAddEmailForm();
    
    // If we're in edit mode and have an existing supplier, save the changes
    if (this.isEditing && this.supplier?.id) {
      this.saveSupplier();
    }
  }

  removeEmail(index: number): void {
    this.supplierEmails.splice(index, 1);
    
    // If we're in edit mode and have an existing supplier, save the changes
    if (this.isEditing && this.supplier?.id) {
      this.saveSupplier();
    }
  }

  setDefaultEmail(index: number): void {
    this.supplierEmails.forEach((email, i) => {
      email.isDefault = (i === index);
    });
    
    // If we're in edit mode and have an existing supplier, save the changes
    if (this.isEditing && this.supplier?.id) {
      this.saveSupplier();
    }
  }

  // Phone methods
  toggleAddPhoneForm(): void {
    this.showAddPhoneForm = !this.showAddPhoneForm;
    if (this.showAddPhoneForm) {
      this.newPhoneForm.reset({
        phoneNumber: '',
        isDefault: false,
        locationId: null
      });
    }
  }

  addPhone(): void {
    if (this.newPhoneForm.invalid) {
      return;
    }
    
    const newPhone: SupplierPhone = {
      ...this.newPhoneForm.value,
      default: this.newPhoneForm.value.isDefault
    };
    
    // If this is set as default, update all others to not default
    if (newPhone.isDefault) {
      this.supplierPhones.forEach(phone => phone.isDefault = false);
    }
    
    this.supplierPhones.push(newPhone);
    this.toggleAddPhoneForm();
    
    // If we're in edit mode and have an existing supplier, save the changes
    if (this.isEditing && this.supplier?.id) {
      this.saveSupplier();
    }
  }

  removePhone(index: number): void {
    this.supplierPhones.splice(index, 1);
    
    // If we're in edit mode and have an existing supplier, save the changes
    if (this.isEditing && this.supplier?.id) {
      this.saveSupplier();
    }
  }

  setDefaultPhone(index: number): void {
    this.supplierPhones.forEach((phone, i) => {
      phone.isDefault = (i === index);
    });
    
    // If we're in edit mode and have an existing supplier, save the changes
    if (this.isEditing && this.supplier?.id) {
      this.saveSupplier();
    }
  }

  getLocationName(locationId: number | null): string {
    if (!locationId) return 'N/A';
    const location = this.locations.find(loc => loc.id === locationId);
    return location ? location.name : 'Unknown';
  }

  getCategoryName(categoryId: number | null): string {
    if (!categoryId) return '';
    const category = this.categories.find(cat => cat.id === categoryId);
    return category ? category.name : '';
  }

  navigateBack(): void {
    this.router.navigate(['/suppliers/list']);
  }
}