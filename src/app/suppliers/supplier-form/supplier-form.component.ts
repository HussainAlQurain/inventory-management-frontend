import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

import { Supplier, SupplierEmail, SupplierPhone } from '../../models/Supplier';
import { Category } from '../../models/Category';

import { SupplierService } from '../../services/supplier.service';
import { CategoriesService } from '../../services/categories.service';

import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-supplier-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatAutocompleteModule,
    MatDialogModule
  ],
  templateUrl: './supplier-form.component.html',
  styleUrls: ['./supplier-form.component.scss']
})
export class SupplierFormComponent implements OnInit {
  @Input() initialSupplierName: string = '';
  @Input() supplier: Supplier | null = null;
  @Output() supplierCreated = new EventEmitter<Supplier>();
  @Output() supplierUpdated = new EventEmitter<Supplier>();
  @Output() cancel = new EventEmitter<void>();

  supplierForm: FormGroup;
  categoryCtrl = new FormControl<string>('', { nonNullable: true });
  filteredCategories: Category[] = [];
  canCreateNewCategory = false;
  isEditMode = false;

  // Email and phone management
  supplierEmails: SupplierEmail[] = [];
  supplierPhones: SupplierPhone[] = [];
  emailForm: FormGroup;
  phoneForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private supplierService: SupplierService,
    private categoriesService: CategoriesService
  ) {
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
    // Setup category autocomplete
    this.setupCategoryAutocomplete();

    // If initial supplier name is provided, set it
    if (this.initialSupplierName) {
      this.supplierForm.get('name')?.setValue(this.initialSupplierName);
    }

    // If editing an existing supplier
    if (this.supplier) {
      this.isEditMode = true;
      this.populateForm();
    }
  }

  private populateForm(): void {
    if (!this.supplier) return;

    // Populate the form with the supplier data
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
    
    // Fetch and set the category name if a categoryId exists
    if (this.supplier && this.supplier.defaultCategoryId) {
      this.categoriesService.getAllCategories('').subscribe({
        next: (categories: Category[]) => {
          const category = categories.find(c => c.id === this.supplier?.defaultCategoryId);
          if (category) {
            this.categoryCtrl.setValue(category.name);
          }
        },
        error: (err: any) => console.error('Error fetching categories:', err)
      });
    }
    
    // Copy emails and phones
    this.supplierEmails = this.supplier.emails ? [...this.supplier.emails] : [];
    this.supplierPhones = this.supplier.phones ? [...this.supplier.phones] : [];
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
    if (!categoryName) return;
    
    const newCategory = { 
      name: categoryName,
      description: ''
    };
    
    this.categoriesService.createCategory(newCategory).subscribe({
      next: (createdCategory) => {
        if (createdCategory) {
          this.filteredCategories.push(createdCategory);
          this.supplierForm.get('defaultCategoryId')?.setValue(createdCategory.id);
          this.categoryCtrl.setValue(createdCategory.name);
          this.canCreateNewCategory = false;
        }
      },
      error: (err) => console.error('Error creating category:', err)
    });
  }

  // Email methods
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
  
  // Phone methods
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

  onSubmit(): void {
    if (!this.supplierForm.valid) {
      alert('Please fill in all required supplier fields');
      return;
    }
    
    const supplierData: Supplier = {
      ...this.supplierForm.value,
      emails: this.supplierEmails,
      phones: this.supplierPhones
    };
    
    if (this.isEditMode && this.supplier?.id) {
      // Update existing supplier
      supplierData.id = this.supplier.id;
      this.supplierService.updateSupplier(supplierData).subscribe({
        next: (updatedSupplier) => {
          this.supplierUpdated.emit(updatedSupplier);
        },
        error: (err) => console.error('Error updating supplier:', err)
      });
    } else {
      // Create new supplier
      this.supplierService.createSupplier(supplierData).subscribe({
        next: (createdSupplier) => {
          this.supplierCreated.emit(createdSupplier);
        },
        error: (err) => console.error('Error creating supplier:', err)
      });
    }
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
