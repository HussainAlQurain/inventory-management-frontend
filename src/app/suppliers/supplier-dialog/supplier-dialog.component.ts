import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { Supplier, SupplierEmail, SupplierPhone } from '../../models/Supplier';
import { Category } from '../../models/Category';
import { Location } from '../../models/Location';
import { SupplierService } from '../../services/supplier.service';
import { CategoriesService } from '../../services/categories.service';
import { LocationService } from '../../services/location.service';

@Component({
  selector: 'app-supplier-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatCheckboxModule,
  ],
  templateUrl: './supplier-dialog.component.html',
  styleUrls: ['./supplier-dialog.component.scss']
})
export class SupplierDialogComponent implements OnInit {
  supplierForm: FormGroup;
  isLoading = false;
  categories: Category[] = [];
  locations: Location[] = [];
  categoriesLoading = false;
  
  // For email/phone management
  emailForm: FormGroup;
  phoneForm: FormGroup;
  supplierEmails: SupplierEmail[] = [];
  supplierPhones: SupplierPhone[] = [];

  constructor(
    private fb: FormBuilder,
    private supplierService: SupplierService,
    private categoriesService: CategoriesService,
    private locationService: LocationService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<SupplierDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { supplier?: Supplier }
  ) {
    this.supplierForm = this.createSupplierForm();
    this.emailForm = this.createEmailForm();
    this.phoneForm = this.createPhoneForm();
  }

  ngOnInit(): void {
    this.loadCategories();
    this.loadLocations();
    
    if (this.data.supplier) {
      this.populateForm(this.data.supplier);
      
      if (this.data.supplier.orderEmails && this.data.supplier.orderEmails.length > 0) {
        this.supplierEmails = this.data.supplier.orderEmails.map(email => ({
          id: email.id,
          email: email.email,
          isDefault: email.default,
          locationId: email.locationId
        }));
      } else if (this.data.supplier.emails) {
        this.supplierEmails = [...this.data.supplier.emails];
      }

      if (this.data.supplier.orderPhones && this.data.supplier.orderPhones.length > 0) {
        this.supplierPhones = this.data.supplier.orderPhones.map(phone => ({
          id: phone.id,
          phoneNumber: phone.phoneNumber,
          isDefault: phone.default,
          locationId: phone.locationId
        }));
      } else if (this.data.supplier.phones) {
        this.supplierPhones = [...this.data.supplier.phones];
      }
    }
  }

  createSupplierForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      customerNumber: [''],
      minimumOrder: [0, [Validators.min(0)]],
      taxId: [''],
      taxRate: [15, [Validators.min(0), Validators.max(100)]],
      paymentTerms: [''],
      address: [''],
      city: [''],
      state: [''],
      zip: [''],
      ccEmails: [''],
      defaultCategoryId: [null],
      comments: ['']
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
      phoneNumber: ['', Validators.required],
      isDefault: [false],
      locationId: [null]
    });
  }

  loadCategories(): void {
    this.categoriesLoading = true;
    this.categoriesService.getPaginatedCategoryFilterOptions(0, 50, '').pipe(
      map(response => response.content.map(option => ({
        id: option.id,
        name: option.name,
        description: '' // FilterOptionDTO doesn't include description
      } as Category))),
      catchError(error => {
        console.error('Error loading categories', error);
        return of([] as Category[]);
      })
    ).subscribe({
      next: (categories) => {
        this.categories = categories;
        this.categoriesLoading = false;
      },
      error: (error) => {
        console.error('Error loading categories', error);
        this.categoriesLoading = false;
      }
    });
  }

  loadLocations(): void {
    this.locationService.getAllLocations().subscribe({
      next: (locations) => {
        this.locations = locations;
      },
      error: (error) => {
        console.error('Error loading locations', error);
      }
    });
  }

  populateForm(supplier: Supplier): void {
    this.supplierForm.patchValue({
      name: supplier.name,
      customerNumber: supplier.customerNumber,
      minimumOrder: supplier.minimumOrder,
      taxId: supplier.taxId,
      taxRate: supplier.taxRate,
      paymentTerms: supplier.paymentTerms,
      address: supplier.address,
      city: supplier.city,
      state: supplier.state,
      zip: supplier.zip,
      ccEmails: supplier.ccEmails,
      defaultCategoryId: supplier.defaultCategoryId,
      comments: supplier.comments
    });
  }

  onSubmit(): void {
    if (this.supplierForm.invalid) {
      return;
    }

    this.isLoading = true;
    
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

    if (this.data.supplier?.id) {
      supplierData.id = this.data.supplier.id;
      this.updateSupplier(supplierData);
    } else {
      this.createSupplier(supplierData);
    }
  }

  createSupplier(supplier: Supplier): void {
    this.supplierService.createSupplier(supplier).subscribe({
      next: (result) => {
        this.isLoading = false;
        this.dialogRef.close(result);
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error creating supplier', error);
        this.snackBar.open('Failed to create supplier', 'Close', { duration: 3000 });
      }
    });
  }

  updateSupplier(supplier: Supplier): void {
    this.supplierService.updateSupplier(supplier).subscribe({
      next: (result) => {
        this.isLoading = false;
        this.dialogRef.close(result);
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error updating supplier', error);
        this.snackBar.open('Failed to update supplier', 'Close', { duration: 3000 });
      }
    });
  }

  addEmail(): void {
    if (this.emailForm.invalid) return;
    
    const email: SupplierEmail = {
      ...this.emailForm.value,
      default: this.emailForm.value.isDefault
    };
    
    if (email.isDefault) {
      this.supplierEmails.forEach(e => e.isDefault = false);
    }
    
    this.supplierEmails.push(email);
    this.emailForm.reset({
      email: '',
      isDefault: false,
      locationId: null
    });
  }

  removeEmail(index: number): void {
    this.supplierEmails.splice(index, 1);
  }

  addPhone(): void {
    if (this.phoneForm.invalid) return;
    
    const phone: SupplierPhone = {
      ...this.phoneForm.value,
      default: this.phoneForm.value.isDefault
    };
    
    if (phone.isDefault) {
      this.supplierPhones.forEach(p => p.isDefault = false);
    }
    
    this.supplierPhones.push(phone);
    this.phoneForm.reset({
      phoneNumber: '',
      isDefault: false,
      locationId: null
    });
  }

  removePhone(index: number): void {
    this.supplierPhones.splice(index, 1);
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  getLocationName(locationId: number | null): string {
    if (!locationId) return 'All Locations';
    const location = this.locations.find(loc => loc.id === locationId);
    return location ? location.name : 'Unknown';
  }

  categoryCtrl = new FormControl<string>('', { nonNullable: true });
  filteredCategories: Category[] = [];

  searchCategories(term: string): void {
    this.categoriesLoading = true;
    this.categoriesService.getPaginatedCategoryFilterOptions(0, 20, term).pipe(
      map(response => response.content.map(option => ({
        id: option.id,
        name: option.name,
        description: '' // FilterOptionDTO doesn't include description
      } as Category))),
      catchError(error => {
        console.error('Error searching categories', error);
        return of([] as Category[]);
      })
    ).subscribe({
      next: (categories) => {
        this.filteredCategories = categories;
        this.categoriesLoading = false;
      },
      error: (error) => {
        console.error('Error searching categories', error);
        this.categoriesLoading = false;
      }
    });
  }
}
