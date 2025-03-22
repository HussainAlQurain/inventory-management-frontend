import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule, MatTable } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';

import { SubRecipe, SubRecipeLine, SubRecipeType } from '../../models/SubRecipe';
import { Category } from '../../models/Category';
import { UnitOfMeasure } from '../../models/UnitOfMeasure';
import { SubRecipeService } from '../../services/sub-recipe.service';
import { SubRecipesService } from '../../services/sub-recipes.service';
import { UomService } from '../../services/uom.service';
import { CategoriesService } from '../../services/categories.service';

import { SubRecipeLineItemComponent } from '../../components/sub-recipe-line-item/sub-recipe-line-item.component';

@Component({
  selector: 'app-sub-recipe-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTabsModule,
    MatDividerModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatMenuModule,
    MatChipsModule,
    MatTooltipModule,
    MatDialogModule,
    SubRecipeLineItemComponent
  ],
  templateUrl: './sub-recipe-detail.component.html',
  styleUrls: ['./sub-recipe-detail.component.scss']
})
export class SubRecipeDetailComponent implements OnInit {
  // Display columns for the table
  displayedColumns: string[] = [
    'name',
    'type',
    'category',
    'cost',
    'uom',
    'minOnHand',
    'par',
    'lastCount',
    'onHand'
  ];
  
  // Data sources
  subRecipes: SubRecipe[] = [];
  filteredSubRecipes: SubRecipe[] = [];
  
  // Selected subrecipe for detail view
  selectedSubRecipe: SubRecipe | null = null;
  showDetailPanel = false;
  
  // Line editing
  isEditingLine = false;
  currentLine: SubRecipeLine | undefined = undefined;
  
  // Filter values
  nameFilter = '';
  categoryFilter: number | null = null;
  typeFilter: SubRecipeType | null = null;
  
  // Filter options
  categories: Category[] = [];
  recipeTypes: {value: SubRecipeType, label: string}[] = [
    { value: 'PREPARATION', label: 'Preparation' },
    { value: 'RECIPE', label: 'Recipe' }
  ];
  
  // Loading state
  isLoading = false;
  error: string | null = null;
  
  // For adding new subrecipe
  showAddForm = false;
  
  // For pagination and sorting
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatTable) table!: MatTable<SubRecipe>;

  // Add the missing allUoms property
  allUoms: UnitOfMeasure[] = [];
  
  constructor(
    private subRecipeService: SubRecipeService,
    private subRecipesService: SubRecipesService,
    private uomService: UomService,
    private categoriesService: CategoriesService,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.loadSubRecipes();
    this.loadCategories();
    this.loadUoms();  // Add this line to load UOMs on init
  }

  loadSubRecipes(): void {
    this.isLoading = true;
    this.subRecipeService.getSubRecipes().subscribe({
      next: (recipes) => {
        this.subRecipes = recipes;
        this.filteredSubRecipes = recipes;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading sub-recipes:', error);
        this.error = 'Failed to load sub-recipes. Please try again.';
        this.isLoading = false;
      }
    });
  }

  loadCategories(): void {
    this.categoriesService.getAllCategories('').subscribe({
      next: (categories) => {
        this.categories = categories;
      },
      error: (error) => {
        console.error('Error loading categories:', error);
      }
    });
  }

  // Add this method to load UOMs
  loadUoms(): void {
    this.uomService.getAllUoms().subscribe({
      next: (uoms) => {
        this.allUoms = uoms;
      },
      error: (error) => {
        console.error('Error loading UOMs:', error);
      }
    });
  }

  selectSubRecipe(recipe: SubRecipe): void {
    this.selectedSubRecipe = recipe;
    this.showDetailPanel = true;
    
    // Load full details including lines
    if (recipe.id) {
      this.loadSubRecipeDetails(recipe.id);
    }
  }

  loadSubRecipeDetails(id: number): void {
    this.isLoading = true;
    this.subRecipeService.getSubRecipeById(id).subscribe({
      next: (recipe) => {
        this.selectedSubRecipe = recipe;
        this.isLoading = false;
      },
      error: (error) => {
        console.error(`Error loading sub-recipe details for ID ${id}:`, error);
        this.isLoading = false;
      }
    });
  }

  // Filtering methods
  applyFilters(): void {
    this.filteredSubRecipes = this.subRecipes.filter(recipe => {
      // Filter by name
      const nameMatch = !this.nameFilter || 
        recipe.name.toLowerCase().includes(this.nameFilter.toLowerCase());
      
      // Filter by category
      const categoryMatch = !this.categoryFilter || 
        recipe.categoryId === this.categoryFilter;
      
      // Filter by type
      const typeMatch = !this.typeFilter || 
        recipe.type === this.typeFilter;
      
      return nameMatch && categoryMatch && typeMatch;
    });
  }

  clearAllFilters(): void {
    this.nameFilter = '';
    this.categoryFilter = null;
    this.typeFilter = null;
    this.applyFilters();
  }

  hasActiveFilters(): boolean {
    return !!(this.nameFilter || this.categoryFilter || this.typeFilter);
  }

  // Helper methods for display
  getCategoryName(categoryId: number): string {
    return this.categories.find(c => c.id === categoryId)?.name || 'Unknown';
  }
  
  getTypeName(type: SubRecipeType): string {
    return this.recipeTypes.find(t => t.value === type)?.label || type;
  }

  // Action methods
  closeDetailPanel(): void {
    this.showDetailPanel = false;
    this.selectedSubRecipe = null;
  }

  addManually(): void {
    this.showAddForm = true;
    // Implement a form to add a new sub-recipe
  }

  importFromExcel(): void {
    // To be implemented later
    alert('Import from Excel functionality will be implemented later');
  }

  downloadSubRecipes(): void {
    // To be implemented later
    alert('Download sub-recipes functionality will be implemented later');
  }

  saveSubRecipe(subRecipe: SubRecipe): void {
    if (subRecipe.id) {
      // Update existing sub-recipe
      this.subRecipeService.updateSubRecipe(subRecipe).subscribe({
        next: (updated) => {
          // Update in the list
          const index = this.subRecipes.findIndex(item => item.id === updated.id);
          if (index >= 0) {
            this.subRecipes[index] = updated;
            this.applyFilters();
          }
          // Update selected sub-recipe
          this.selectedSubRecipe = updated;
        },
        error: (error) => {
          console.error('Error updating sub-recipe:', error);
        }
      });
    } else {
      // Create new sub-recipe
      this.subRecipeService.createSubRecipe(subRecipe).subscribe({
        next: (created) => {
          this.subRecipes.push(created);
          this.applyFilters();
          this.showAddForm = false;
        },
        error: (error) => {
          console.error('Error creating sub-recipe:', error);
        }
      });
    }
  }

  // SubRecipeLine methods
  addNewLine(): void {
    this.isEditingLine = true;
    this.currentLine = undefined;
  }

  editLine(line: SubRecipeLine): void {
    this.isEditingLine = true;
    this.currentLine = { ...line }; // Clone to avoid direct mutation
  }

  saveLine(line: SubRecipeLine): void {
    if (!this.selectedSubRecipe?.id) return;

    this.isLoading = true;
    if (line.id) {
      // Update existing line
      this.subRecipeService.updateSubRecipeLine(this.selectedSubRecipe.id, line.id, line).subscribe({
        next: (updatedLine) => {
          this.loadSubRecipeDetails(this.selectedSubRecipe!.id!);
          this.isEditingLine = false;
          this.currentLine = undefined;
        },
        error: (error) => {
          console.error('Error updating line:', error);
          this.isLoading = false;
        }
      });
    } else {
      // Add new line
      this.subRecipeService.addLineToSubRecipe(this.selectedSubRecipe.id, line).subscribe({
        next: (newLine) => {
          this.loadSubRecipeDetails(this.selectedSubRecipe!.id!);
          this.isEditingLine = false;
          this.currentLine = undefined;
        },
        error: (error) => {
          console.error('Error adding line:', error);
          this.isLoading = false;
        }
      });
    }
  }

  cancelLineEdit(): void {
    this.isEditingLine = false;
    this.currentLine = undefined;
  }

  deleteLine(lineId: number): void {
    if (!this.selectedSubRecipe?.id) return;
    
    if (confirm('Are you sure you want to delete this line?')) {
      this.isLoading = true;
      this.subRecipeService.deleteSubRecipeLine(this.selectedSubRecipe.id, lineId).subscribe({
        next: () => {
          this.loadSubRecipeDetails(this.selectedSubRecipe!.id!);
        },
        error: (error) => {
          console.error('Error deleting line:', error);
          this.isLoading = false;
        }
      });
    }
  }

  // Update yield quantity and UOM
  updateYieldAndUom(yield_qty: number, uomId: number): void {
    if (!this.selectedSubRecipe?.id) return;
    
    const updates = {
      yieldQty: yield_qty,
      uomId: uomId
    };
    
    this.subRecipeService.updateSubRecipe({
      ...this.selectedSubRecipe,
      ...updates
    }).subscribe({
      next: (updated) => {
        this.selectedSubRecipe = updated;
        // Update in the list
        const index = this.subRecipes.findIndex(item => item.id === updated.id);
        if (index >= 0) {
          this.subRecipes[index] = updated;
          this.applyFilters();
        }
      },
      error: (error) => {
        console.error('Error updating sub-recipe:', error);
      }
    });
  }
}
