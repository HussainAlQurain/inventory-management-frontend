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
  // New form control for UOM category name (for search and creation)
  categoryCtrl = new FormControl<string>('');
  filteredCategories: UnitOfMeasureCategory[] = [];
  canCreateNewCategory = false;
  allCategories: UnitOfMeasureCategory[] = [];
  companyId!: number;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<UomDialogComponent>,
    private uomService: UomService,
    private uomCategoryService: UomCategoryService,
    private companiesService: CompaniesService
  ) {}

  ngOnInit(): void {
    // Build form with new field "categoryName"
    this.uomForm = this.fb.group({
      name: ['', Validators.required],
      abbreviation: ['', Validators.required],
      conversionFactor: [1, [Validators.required, Validators.min(0.01)]],
      categoryName: ['', Validators.required] // new control for UOM category
    });

    // Get selected company ID
    this.companyId = this.companiesService.getSelectedCompanyId() || 0;

    // Load all UOM categories for this company
    this.uomCategoryService.getAllCategories(this.companyId).subscribe(categories => {
      this.allCategories = categories;
      this.filteredCategories = categories;
    });

    // Filter categories as user types into categoryCtrl
    this.categoryCtrl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      map(term => term ? this.filterCategories(term) : this.allCategories)
    ).subscribe(filtered => {
      this.filteredCategories = filtered;
      const exactMatch = filtered.some(cat => cat.name.toLowerCase() === this.categoryCtrl.value?.toLowerCase());
      this.canCreateNewCategory = !!this.categoryCtrl.value && !exactMatch;
    });
  }

  private filterCategories(term: string): UnitOfMeasureCategory[] {
    const lowerTerm = term.toLowerCase();
    return this.allCategories.filter(cat => cat.name.toLowerCase().includes(lowerTerm));
  }

  onSubmit() {
    if (this.uomForm.valid) {
      const categoryName = this.uomForm.get('categoryName')?.value;
      const existingCat = this.allCategories.find(cat => cat.name.toLowerCase() === categoryName.toLowerCase());
      if (existingCat) {
        this.saveUom(existingCat.id!);
      } else {
        // Create new UOM category
        this.uomCategoryService.createCategory(this.companyId, { name: categoryName }).subscribe(newCat => {
          // Add the new category locally
          this.allCategories.push(newCat);
          this.saveUom(newCat.id!);
        });
      }
    }
  }

  private saveUom(categoryId: number) {
    const formValues = this.uomForm.value;
    const newUom: UnitOfMeasure = {
      id: 0,
      name: formValues.name,
      abbreviation: formValues.abbreviation,
      conversionFactor: formValues.conversionFactor,
      category: { id: categoryId, name: '' } as UnitOfMeasureCategory // minimal info; backend can fill more details
    };
    this.uomService.createUom(newUom).subscribe({
      next: (uom) => this.dialogRef.close(uom),
      error: (err) => console.error('Failed to create UOM', err)
    });
  }

  onCancel() {
    this.dialogRef.close();
  }
}
