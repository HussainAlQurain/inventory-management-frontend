import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatTabsModule, MatTabGroup } from '@angular/material/tabs';
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
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';

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
export class SupplierDetailComponent implements OnInit, AfterViewInit {
  @ViewChild(MatTabGroup) tabGroup!: MatTabGroup;

  supplierId: number | null = null;
  supplier: Supplier | null = null;
  supplierForm: FormGroup;
  isLoading: boolean = false;
  isEditing: boolean = false;
  selectedTabIndex: number = 0;

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
  editEmailForm: FormGroup;
  editPhoneForm: FormGroup;
  showAddEmailForm: boolean = false;
  showAddPhoneForm: boolean = false;
  editingEmailIndex: number | null = null;
  editingPhoneIndex: number | null = null;

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
    this.editEmailForm = this.createEmailForm();
    this.editPhoneForm = this.createPhoneForm();
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

  ngAfterViewInit(): void {
    // Set the tab to the last selected tab if available
    const savedTabIndex = localStorage.getItem('supplierDetailTabIndex');
    if (savedTabIndex) {
      // Use setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
      setTimeout(() => {
        this.selectedTabIndex = Number(savedTabIndex);
        if (this.tabGroup) {
          this.tabGroup.selectedIndex = this.selectedTabIndex;
        }
      });
    }
  }

  // Form creation methods
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

  // Tab management
  onTabChange(index: number): void {
    this.selectedTabIndex = index;
    localStorage.setItem('supplierDetailTabIndex', index.toString());
  }

  // Data loading methods
  loadSupplier(): void {
    if (!this.supplierId) return;

    this.isLoading = true;
    this.supplierService.getSupplierById(this.supplierId).subscribe({
      next: (supplier) => {
        this.supplier = supplier;
        this.populateForm();
        this.loadSupplierEmails();
        this.loadSupplierPhones();
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

  loadSupplierEmails(): void {
    if (!this.supplierId) return;

    this.supplierService.getSupplierEmails(this.supplierId).subscribe({
      next: (emails) => {
        this.supplierEmails = emails.map(email => ({
          ...email,
          isDefault: email.default
        }));

        // Ensure we stay on the Contact Information tab
        setTimeout(() => {
          if (this.tabGroup) {
            this.tabGroup.selectedIndex = this.selectedTabIndex;
          }
        });
      },
      error: (err) => {
        console.error('Error loading supplier emails:', err);
      }
    });
  }

  loadSupplierPhones(): void {
    if (!this.supplierId) return;

    this.supplierService.getSupplierPhones(this.supplierId).subscribe({
      next: (phones) => {
        this.supplierPhones = phones.map(phone => ({
          ...phone,
          isDefault: phone.default
        }));

        // Ensure we stay on the Contact Information tab
        setTimeout(() => {
          if (this.tabGroup) {
            this.tabGroup.selectedIndex = this.selectedTabIndex;
          }
        });
      },
      error: (err) => {
        console.error('Error loading supplier phones:', err);
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

  // Form filtering and editing methods
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

  // Save supplier basic info
  saveSupplier(): void {
    if (!this.supplierForm.valid) {
      this.snackBar.open('Please fill out all required fields correctly', 'Close', { duration: 3000 });
      return;
    }

    const supplierData: Supplier = {
      ...this.supplierForm.value
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
      // Cancel any ongoing edits
      this.cancelEditEmail();
    }
  }

  startEditEmail(index: number): void {
    const email = this.supplierEmails[index];
    this.editingEmailIndex = index;

    // Cancel add form if it's open
    this.showAddEmailForm = false;

    // Populate edit form with current values
    this.editEmailForm.patchValue({
      email: email.email,
      isDefault: email.isDefault || email.default,
      locationId: email.locationId
    });
  }

  cancelEditEmail(): void {
    this.editingEmailIndex = null;
  }

  saveEditEmail(): void {
    if (this.editEmailForm.invalid || !this.supplierId || this.editingEmailIndex === null) {
      return;
    }

    const emailToUpdate = this.supplierEmails[this.editingEmailIndex];

    const updatedEmail = {
      id: emailToUpdate.id,
      email: this.editEmailForm.value.email,
      locationId: this.editEmailForm.value.locationId,
      default: this.editEmailForm.value.isDefault
    };

    this.isLoading = true;
    this.supplierService.updateSupplierEmail(this.supplierId, emailToUpdate.id!, updatedEmail).subscribe({
      next: () => {
        this.snackBar.open('Email updated successfully', 'Close', { duration: 3000 });
        this.loadSupplierEmails();
        this.cancelEditEmail();
        this.isLoading = false;

        // Ensure we stay on the Contact Information tab
        setTimeout(() => {
          if (this.tabGroup) {
            this.tabGroup.selectedIndex = this.selectedTabIndex;
          }
        });
      },
      error: (err) => {
        console.error('Error updating email:', err);
        this.snackBar.open('Failed to update email', 'Close', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  addEmail(): void {
    if (this.newEmailForm.invalid || !this.supplierId) {
      return;
    }

    const emailData = {
      email: this.newEmailForm.value.email,
      locationId: this.newEmailForm.value.locationId,
      default: this.newEmailForm.value.isDefault
    };

    this.isLoading = true;
    this.supplierService.addSupplierEmail(this.supplierId, emailData).subscribe({
      next: (addedEmail) => {
        this.snackBar.open('Email added successfully', 'Close', { duration: 3000 });
        this.loadSupplierEmails(); // Reload all emails to ensure we have latest data with server-assigned IDs
        this.toggleAddEmailForm();
        this.isLoading = false;

        // Ensure we stay on the Contact Information tab
        setTimeout(() => {
          if (this.tabGroup) {
            this.tabGroup.selectedIndex = this.selectedTabIndex;
          }
        });
      },
      error: (err) => {
        console.error('Error adding email:', err);
        this.snackBar.open('Failed to add email', 'Close', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  removeEmail(index: number): void {
    if (!this.supplierId || !this.supplierEmails[index].id) {
      return;
    }

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Confirm Deletion',
        message: `Are you sure you want to delete this email?`,
        confirmText: 'Delete',
        cancelText: 'Cancel'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const emailId = this.supplierEmails[index].id!;

        this.isLoading = true;
        this.supplierService.deleteSupplierEmail(this.supplierId!, emailId).subscribe({
          next: () => {
            this.snackBar.open('Email deleted successfully', 'Close', { duration: 3000 });
            this.loadSupplierEmails();
            this.isLoading = false;

            // Ensure we stay on the Contact Information tab
            setTimeout(() => {
              if (this.tabGroup) {
                this.tabGroup.selectedIndex = this.selectedTabIndex;
              }
            });
          },
          error: (err) => {
            console.error('Error deleting email:', err);
            this.snackBar.open('Failed to delete email', 'Close', { duration: 3000 });
            this.isLoading = false;
          }
        });
      }
    });
  }

  setDefaultEmail(index: number): void {
    if (!this.supplierId || !this.supplierEmails[index].id) {
      return;
    }

    const emailToUpdate = this.supplierEmails[index];

    const updatedEmail = {
      id: emailToUpdate.id,
      email: emailToUpdate.email,
      locationId: emailToUpdate.locationId,
      default: true
    };

    this.isLoading = true;
    this.supplierService.updateSupplierEmail(this.supplierId, emailToUpdate.id!, updatedEmail).subscribe({
      next: () => {
        this.snackBar.open('Default email updated', 'Close', { duration: 3000 });
        this.loadSupplierEmails();
        this.isLoading = false;

        // Ensure we stay on the Contact Information tab
        setTimeout(() => {
          if (this.tabGroup) {
            this.tabGroup.selectedIndex = this.selectedTabIndex;
          }
        });
      },
      error: (err) => {
        console.error('Error updating email:', err);
        this.snackBar.open('Failed to update email', 'Close', { duration: 3000 });
        this.isLoading = false;
      }
    });
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
      // Cancel any ongoing edits
      this.cancelEditPhone();
    }
  }

  startEditPhone(index: number): void {
    const phone = this.supplierPhones[index];
    this.editingPhoneIndex = index;

    // Cancel add form if it's open
    this.showAddPhoneForm = false;

    // Populate edit form with current values
    this.editPhoneForm.patchValue({
      phoneNumber: phone.phoneNumber,
      isDefault: phone.isDefault || phone.default,
      locationId: phone.locationId
    });
  }

  cancelEditPhone(): void {
    this.editingPhoneIndex = null;
  }

  saveEditPhone(): void {
    if (this.editPhoneForm.invalid || !this.supplierId || this.editingPhoneIndex === null) {
      return;
    }

    const phoneToUpdate = this.supplierPhones[this.editingPhoneIndex];

    const updatedPhone = {
      id: phoneToUpdate.id,
      phoneNumber: this.editPhoneForm.value.phoneNumber,
      locationId: this.editPhoneForm.value.locationId,
      default: this.editPhoneForm.value.isDefault
    };

    this.isLoading = true;
    this.supplierService.updateSupplierPhone(this.supplierId, phoneToUpdate.id!, updatedPhone).subscribe({
      next: () => {
        this.snackBar.open('Phone updated successfully', 'Close', { duration: 3000 });
        this.loadSupplierPhones();
        this.cancelEditPhone();
        this.isLoading = false;

        // Ensure we stay on the Contact Information tab
        setTimeout(() => {
          if (this.tabGroup) {
            this.tabGroup.selectedIndex = this.selectedTabIndex;
          }
        });
      },
      error: (err) => {
        console.error('Error updating phone:', err);
        this.snackBar.open('Failed to update phone', 'Close', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  addPhone(): void {
    if (this.newPhoneForm.invalid || !this.supplierId) {
      return;
    }

    const phoneData = {
      phoneNumber: this.newPhoneForm.value.phoneNumber,
      locationId: this.newPhoneForm.value.locationId,
      default: this.newPhoneForm.value.isDefault
    };

    this.isLoading = true;
    this.supplierService.addSupplierPhone(this.supplierId, phoneData).subscribe({
      next: (addedPhone) => {
        this.snackBar.open('Phone number added successfully', 'Close', { duration: 3000 });
        this.loadSupplierPhones(); // Reload all phones to ensure we have latest data with server-assigned IDs
        this.toggleAddPhoneForm();
        this.isLoading = false;

        // Ensure we stay on the Contact Information tab
        setTimeout(() => {
          if (this.tabGroup) {
            this.tabGroup.selectedIndex = this.selectedTabIndex;
          }
        });
      },
      error: (err) => {
        console.error('Error adding phone:', err);
        this.snackBar.open('Failed to add phone number', 'Close', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  removePhone(index: number): void {
    if (!this.supplierId || !this.supplierPhones[index].id) {
      return;
    }

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Confirm Deletion',
        message: `Are you sure you want to delete this phone number?`,
        confirmText: 'Delete',
        cancelText: 'Cancel'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const phoneId = this.supplierPhones[index].id!;

        this.isLoading = true;
        this.supplierService.deleteSupplierPhone(this.supplierId!, phoneId).subscribe({
          next: () => {
            this.snackBar.open('Phone number deleted successfully', 'Close', { duration: 3000 });
            this.loadSupplierPhones();
            this.isLoading = false;

            // Ensure we stay on the Contact Information tab
            setTimeout(() => {
              if (this.tabGroup) {
                this.tabGroup.selectedIndex = this.selectedTabIndex;
              }
            });
          },
          error: (err) => {
            console.error('Error deleting phone:', err);
            this.snackBar.open('Failed to delete phone number', 'Close', { duration: 3000 });
            this.isLoading = false;
          }
        });
      }
    });
  }

  setDefaultPhone(index: number): void {
    if (!this.supplierId || !this.supplierPhones[index].id) {
      return;
    }

    const phoneToUpdate = this.supplierPhones[index];

    const updatedPhone = {
      id: phoneToUpdate.id,
      phoneNumber: phoneToUpdate.phoneNumber,
      locationId: phoneToUpdate.locationId,
      default: true
    };

    this.isLoading = true;
    this.supplierService.updateSupplierPhone(this.supplierId, phoneToUpdate.id!, updatedPhone).subscribe({
      next: () => {
        this.snackBar.open('Default phone updated', 'Close', { duration: 3000 });
        this.loadSupplierPhones();
        this.isLoading = false;

        // Ensure we stay on the Contact Information tab
        setTimeout(() => {
          if (this.tabGroup) {
            this.tabGroup.selectedIndex = this.selectedTabIndex;
          }
        });
      },
      error: (err) => {
        console.error('Error updating phone:', err);
        this.snackBar.open('Failed to update phone', 'Close', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  // Helper methods
  getLocationName(locationId: number | null): string {
    if (!locationId) return 'All Locations';
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