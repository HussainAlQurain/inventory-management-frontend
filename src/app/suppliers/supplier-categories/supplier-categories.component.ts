import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';

import { Category } from '../../models/Category';
import { CategoriesService } from '../../services/categories.service';

@Component({
  selector: 'app-supplier-categories',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDialogModule
  ],
  templateUrl: './supplier-categories.component.html',
  styleUrls: ['./supplier-categories.component.scss']
})
export class SupplierCategoriesComponent implements OnInit {
  categoryForm: FormGroup;
  categories: Category[] = [];
  displayedColumns: string[] = ['name', 'description', 'actions'];
  isLoading: boolean = false;
  editingCategoryId: number | null = null;

  constructor(
    private categoriesService: CategoriesService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.categoryForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['']
    });
  }

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.isLoading = true;
    this.categoriesService.getAllCategories('').subscribe({
      next: (categories) => {
        this.categories = categories;
        this.isLoading = false;
      },
      error: (err: Error) => {
        console.error('Error loading categories:', err);
        this.snackBar.open('Failed to load categories', 'Close', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.categoryForm.invalid) {
      return;
    }

    const categoryData = this.categoryForm.value;
    
    if (this.editingCategoryId) {
      // Update existing category
      this.updateCategory(this.editingCategoryId, categoryData);
    } else {
      // Create new category
      this.createCategory(categoryData);
    }
  }

  createCategory(categoryData: Partial<Category>): void {
    this.isLoading = true;
    this.categoriesService.createCategory(categoryData).subscribe({
      next: (createdCategory) => {
        this.categories.push(createdCategory);
        this.resetForm();
        this.isLoading = false;
        this.snackBar.open('Category created successfully', 'Close', { duration: 3000 });
      },
      error: (err: Error) => {
        console.error('Error creating category:', err);
        this.snackBar.open('Failed to create category', 'Close', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  updateCategory(id: number, categoryData: Partial<Category>): void {
    this.isLoading = true;
    const updatedCategory = { ...categoryData, id };
    
    this.categoriesService.updateCategory(updatedCategory).subscribe({
      next: (updated: Category) => {
        const index = this.categories.findIndex(c => c.id === id);
        if (index !== -1) {
          this.categories[index] = updated;
        }
        this.resetForm();
        this.isLoading = false;
        this.snackBar.open('Category updated successfully', 'Close', { duration: 3000 });
      },
      error: (err: Error) => {
        console.error('Error updating category:', err);
        this.snackBar.open('Failed to update category', 'Close', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  deleteCategory(category: Category): void {
    if (confirm(`Are you sure you want to delete the category "${category.name}"?`)) {
      this.isLoading = true;
      this.categoriesService.deleteCategory(category.id!).subscribe({
        next: () => {
          this.categories = this.categories.filter(c => c.id !== category.id);
          this.isLoading = false;
          this.snackBar.open('Category deleted successfully', 'Close', { duration: 3000 });
        },
        error: (err: Error) => {
          console.error('Error deleting category:', err);
          this.snackBar.open('Failed to delete category', 'Close', { duration: 3000 });
          this.isLoading = false;
        }
      });
    }
  }

  editCategory(category: Category): void {
    this.editingCategoryId = category.id!;
    this.categoryForm.patchValue({
      name: category.name,
      description: category.description
    });
  }

  resetForm(): void {
    this.categoryForm.reset();
    this.editingCategoryId = null;
  }

  cancelEdit(): void {
    this.resetForm();
  }
}