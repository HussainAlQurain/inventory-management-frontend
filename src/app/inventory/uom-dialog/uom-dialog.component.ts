import { Component, OnInit } from '@angular/core';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { UomService } from '../../services/uom.service';
import { UomCategoryService } from '../../services/uom-category.service';
import { UnitOfMeasure } from '../../models/UnitOfMeasure';
import { UnitOfMeasureCategory } from '../../models/UnitOfMeasure';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';
import { CompaniesService } from '../../services/companies.service';
import { MatAutocompleteModule } from '@angular/material/autocomplete';

@Component({
  selector: 'app-uom-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatAutocompleteModule
  ],
  templateUrl: './uom-dialog.component.html',
  styleUrls: ['./uom-dialog.component.scss']
})
export class UomDialogComponent implements OnInit {
  uomForm!: FormGroup;
  categoryCtrl = new FormControl<string>('');
  filteredCategories: UnitOfMeasureCategory[] = [];
  canCreateNewCategory = false;
  allCategories: UnitOfMeasureCategory[] = [];
  companyId!: number;
  selectedCategoryId: number | null = null;

  // Add a property to store the current category text
  currentCategoryText: string = '';

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<UomDialogComponent>,
    private uomService: UomService,
    private uomCategoryService: UomCategoryService,
    private companiesService: CompaniesService
  ) {}

  ngOnInit(): void {
    // Build form with simplified fields
    this.uomForm = this.fb.group({
      name: ['', Validators.required],
      abbreviation: ['', Validators.required],
      conversionFactor: [1, [Validators.required, Validators.min(0.01)]],
      categoryName: ['', Validators.required]
    });

    // Get selected company ID
    this.companyId = this.companiesService.getSelectedCompanyId() || 0;

    // Load all UOM categories for this company
    this.uomCategoryService.getAllCategories(this.companyId).subscribe(categories => {
      this.allCategories = categories;
      this.filteredCategories = categories;
    });

    // Filter categories as user types
    this.categoryCtrl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      map(term => term ? this.filterCategories(term) : this.allCategories)
    ).subscribe(filtered => {
      this.filteredCategories = filtered;
      const exactMatch = filtered.some(cat => cat.name.toLowerCase() === this.categoryCtrl.value?.toLowerCase());
      this.canCreateNewCategory = !!this.categoryCtrl.value && !exactMatch;
      
      // Save the current value to our property
      if (this.categoryCtrl.value) {
        this.currentCategoryText = this.categoryCtrl.value;
      }
      
      // Update form when category is typed
      if (this.categoryCtrl.value) {
        this.uomForm.patchValue({
          categoryName: this.categoryCtrl.value
        });
      }
    });
  }

  private filterCategories(term: string): UnitOfMeasureCategory[] {
    const lowerTerm = term.toLowerCase();
    return this.allCategories.filter(cat => cat.name.toLowerCase().includes(lowerTerm));
  }

  selectCategory(category: UnitOfMeasureCategory): void {
    this.selectedCategoryId = category.id!;
    this.categoryCtrl.setValue(category.name);
    this.uomForm.patchValue({
      categoryName: category.name
    });
  }

  // Called when user selects the "Create new" option
  createNewCategory(): void {
    console.log("Creating uom category");
    
    // Use the saved value from our property
    const categoryName = this.currentCategoryText.trim();
    console.log(categoryName);
    if (!categoryName) return;
    
    // Directly create a new category with the entered name
    this.uomCategoryService.createCategory(this.companyId, { 
      name: categoryName,
      description: '' // Empty description as requested
    }).subscribe({
      next: (newCategory) => {
        // Add the new category to our local list
        this.allCategories.push(newCategory);
        
        // Select this new category
        this.selectedCategoryId = newCategory.id ?? null;
        this.categoryCtrl.setValue(newCategory.name);
        
        // Update filtered categories
        this.filteredCategories = [
          ...this.filteredCategories.filter(c => c.name.toLowerCase() !== categoryName.toLowerCase()),
          newCategory
        ];
        
        // Make sure to update the form value too
        this.uomForm.patchValue({
          categoryName: newCategory.name
        });
        
        this.canCreateNewCategory = false;
      },
      error: (err) => console.error('Failed to create category', err)
    });
  }

  onSubmit() {
    if (this.uomForm.valid && this.selectedCategoryId) {
      const formValues = this.uomForm.value;
      
      // Create UOM with selected category ID
      const newUom: UnitOfMeasure = {
        id: 0,
        name: formValues.name,
        abbreviation: formValues.abbreviation,
        conversionFactor: formValues.conversionFactor,
        categoryId: this.selectedCategoryId
      };
      
      this.uomService.createUom(newUom).subscribe({
        next: (uom) => this.dialogRef.close(uom),
        error: (err) => console.error('Failed to create UOM', err)
      });
    } else if (this.uomForm.valid) {
      // If form is valid but no category is selected, 
      // check if we need to create a new category
      const categoryName = this.uomForm.get('categoryName')?.value;
      const existingCat = this.allCategories.find(cat => 
        cat.name.toLowerCase() === categoryName.toLowerCase());
        
      if (existingCat) {
        // Use existing category
        this.selectedCategoryId = existingCat.id!;
        this.onSubmit();
      } else {
        // Create new category then UOM
        this.uomCategoryService.createCategory(this.companyId, { 
          name: categoryName,
          description: '' 
        }).subscribe({
          next: (newCategory) => {
              this.allCategories.push(newCategory);
              this.selectedCategoryId = newCategory.id ?? null;
              this.onSubmit();
            },
            error: (err) => console.error('Failed to create category', err)
          });
      }
    }
  }

  onCancel() {
    this.dialogRef.close();
  }

  displayFn(category: UnitOfMeasureCategory): string {
    return category && category.name ? category.name : '';
  }
}
