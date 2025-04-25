import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule, MatTable } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSortModule, MatSort, Sort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { SubRecipe, SubRecipeLine, SubRecipeType } from '../../models/SubRecipe';
import { Category } from '../../models/Category';
import { UnitOfMeasure } from '../../models/UnitOfMeasure';
import { SubRecipeService } from '../../services/sub-recipe.service';
import { SubRecipesService, PaginatedItemsResponse } from '../../services/sub-recipes.service';
import { UomService } from '../../services/uom.service';
import { CategoriesService } from '../../services/categories.service';

import { SubRecipeLineItemComponent } from '../../components/sub-recipe-line-item/sub-recipe-line-item.component';
import { AddSubRecipeComponent } from '../add-sub-recipe/add-sub-recipe.component';

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
    SubRecipeLineItemComponent,
    AddSubRecipeComponent
  ],
  templateUrl: './sub-recipe-detail.component.html',
  styleUrls: ['./sub-recipe-detail.component.scss']
})
export class SubRecipeDetailComponent implements OnInit, AfterViewInit {
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
  filteredSubRecipes: SubRecipe[] = [];
  
  // Selected subrecipe for detail view
  selectedSubRecipe: SubRecipe | null = null;
  showDetailPanel = false;
  editMode = false;
  
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
    { value: 'SUB_RECIPE', label: 'Recipe' }
  ];
  
  // Loading state
  isLoading = false;
  error: string | null = null;
  
  // For adding new subrecipe
  showAddForm = false;
  showAddSubRecipePanel = false;
  
  // Pagination and sorting
  totalItems = 0;
  currentPage = 0;
  pageSize = 10;
  pageSizeOptions = [5, 10, 25, 50];
  sortBy = 'name';
  sortDirection = 'asc';
  
  // For search debounce
  private searchSubject = new Subject<string>();
  Math = Math; // For template usage
  
  // For pagination and sorting
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatTable) table!: MatTable<SubRecipe>;

  // UOMs collection
  allUoms: UnitOfMeasure[] = [];

  // Display columns for the lines table
  linesDisplayedColumns: string[] = [
    'item', 'type', 'netQuantity', 'wastage', 'grossQuantity', 'uom', 'cost', 'actions'
  ];
  
  constructor(
    private subRecipeService: SubRecipeService,
    private subRecipesService: SubRecipesService,
    private uomService: UomService,
    private categoriesService: CategoriesService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.setupSearchDebounce();
    this.loadSubRecipes();
    this.loadCategories();
    this.loadUoms();
  }

  ngAfterViewInit(): void {
    // Set up sort change listener
    if (this.sort) {
      this.sort.sortChange.subscribe((sort: Sort) => {
        this.sortBy = sort.active;
        this.sortDirection = sort.direction || 'asc';
        this.currentPage = 0; // Reset to first page
        this.loadSubRecipes();
      });
    }
  }

  setupSearchDebounce(): void {
    this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(() => {
      this.currentPage = 0; // Reset to first page when search changes
      this.loadSubRecipes();
    });
  }

  loadSubRecipes(): void {
    this.isLoading = true;
    this.error = null;
    
    this.subRecipesService.getPaginatedSubRecipes(
      this.currentPage,
      this.pageSize,
      this.sortBy,
      this.sortDirection,
      this.getSearchTerm()
    ).subscribe({
      next: (response: PaginatedItemsResponse<SubRecipe>) => {
        this.filteredSubRecipes = response.items;
        this.totalItems = response.totalItems;
        this.currentPage = response.currentPage;
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Error loading sub-recipes:', err);
        
        // Customize error message based on error type
        if (err.error && err.error.status === 0) {
          this.error = 'Cannot connect to the server. Please check your internet connection.';
        } else if (err.error && err.error.status === 500 && 
                  (err.message?.includes('Connection') || err.message?.includes('HikariPool'))) {
          this.error = 'Database connection issue. The server might be under heavy load. Please try again in a moment.';
        } else {
          this.error = 'Failed to load sub-recipes. Please try again.';
        }
        
        this.isLoading = false;
      }
    });
  }

  // Create a search term based on active filters
  getSearchTerm(): string | undefined {
    if (this.nameFilter) {
      return this.nameFilter;
    }
    return undefined;
  }

  // Pagination event handler
  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadSubRecipes();
  }

  // Handle search input changes
  onSearchChange(value: string): void {
    this.nameFilter = value;
    this.searchSubject.next(value);
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
    // Reset editing states when selecting a new recipe
    this.isEditingLine = false;
    this.currentLine = undefined;
    this.editMode = false;
    
    this.selectedSubRecipe = recipe;
    this.showDetailPanel = true;
    
    // Load full details including lines
    if (recipe.id) {
      this.loadSubRecipeDetails(recipe.id);
    }
  }

  loadSubRecipeDetails(id: number): void {
    // Reset line editing state when loading new sub-recipe details
    this.isEditingLine = false;
    this.currentLine = undefined;
    
    this.isLoading = true;
    this.subRecipeService.getSubRecipeById(id).subscribe({
      next: (recipe) => {
        this.selectedSubRecipe = recipe;
        this.isLoading = false;
      },
      error: (error) => {
        console.error(`Error loading sub-recipe details for ID ${id}:`, error);
        this.isLoading = false;
        this.snackBar.open('Error loading sub-recipe details', 'Close', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom'
        });
      }
    });
  }

  // Apply filters now triggers server-side filtering by reloading data
  applyFilters(): void {
    this.currentPage = 0; // Reset to first page
    this.loadSubRecipes();
  }

  clearAllFilters(): void {
    this.nameFilter = '';
    this.categoryFilter = null;
    this.typeFilter = null;
    this.currentPage = 0; // Reset to first page
    this.loadSubRecipes();
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

  getUomInfo(uomId: number | undefined): string {
    if (!uomId) return 'N/A';
    const uom = this.allUoms.find(u => u.id === uomId);
    return uom ? `${uom.name} (${uom.abbreviation})` : 'Unknown';
  }

  // Action methods
  closeDetailPanel(): void {
    this.showDetailPanel = false;
    this.selectedSubRecipe = null;
    this.editMode = false;
    // Reset line editing state when closing the panel
    this.isEditingLine = false;
    this.currentLine = undefined;
  }

  addManually(): void {
    this.showAddSubRecipePanel = true;
  }

  handleCloseAddPanel(createdSubRecipe: SubRecipe | null): void {
    this.showAddSubRecipePanel = false;
    if (createdSubRecipe) {
      // Reload sub-recipes to include the new one
      this.loadSubRecipes();
      
      // Optionally select the newly created sub-recipe
      this.selectSubRecipe(createdSubRecipe);
      
      this.snackBar.open('Sub-recipe created successfully', 'Close', {
        duration: 3000
      });
    }
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
    if (!subRecipe) return;
    this.isLoading = true;
    
    if (subRecipe.id) {
      // Update existing sub-recipe
      this.subRecipeService.updateSubRecipe(subRecipe).subscribe({
        next: (updated) => {
          // Reload list to show updated data
          this.loadSubRecipes();
          
          // Update selected sub-recipe
          this.selectedSubRecipe = updated;
          this.isLoading = false;
          this.editMode = false;
          this.snackBar.open('Sub-recipe updated successfully', 'Close', {
            duration: 3000
          });
        },
        error: (error) => {
          console.error('Error updating sub-recipe:', error);
          this.isLoading = false;
          this.snackBar.open('Error updating sub-recipe', 'Close', {
            duration: 3000
          });
        }
      });
    } else {
      // Create new sub-recipe
      this.subRecipeService.createSubRecipe(subRecipe).subscribe({
        next: (created) => {
          this.loadSubRecipes();
          this.showAddForm = false;
          this.isLoading = false;
          this.snackBar.open('New sub-recipe created', 'Close', {
            duration: 3000
          });
        },
        error: (error) => {
          console.error('Error creating sub-recipe:', error);
          this.isLoading = false;
          this.snackBar.open('Error creating sub-recipe', 'Close', {
            duration: 3000
          });
        }
      });
    }
  }

  // Enable edit mode
  enableEditMode(): void {
    this.editMode = true;
  }

  // Cancel edit mode
  cancelEdit(): void {
    this.editMode = false;
    if (this.selectedSubRecipe?.id) {
      this.loadSubRecipeDetails(this.selectedSubRecipe.id);
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
          this.snackBar.open('Line updated successfully', 'Close', {
            duration: 3000
          });
        },
        error: (error) => {
          console.error('Error updating line:', error);
          this.isLoading = false;
          this.snackBar.open('Error updating line', 'Close', {
            duration: 3000
          });
        }
      });
    } else {
      // Add new line
      this.subRecipeService.addLineToSubRecipe(this.selectedSubRecipe.id, line).subscribe({
        next: (newLine) => {
          this.loadSubRecipeDetails(this.selectedSubRecipe!.id!);
          this.isEditingLine = false;
          this.currentLine = undefined;
          this.snackBar.open('New line added', 'Close', {
            duration: 3000
          });
        },
        error: (error) => {
          console.error('Error adding line:', error);
          this.isLoading = false;
          this.snackBar.open('Error adding line', 'Close', {
            duration: 3000
          });
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
          this.snackBar.open('Line deleted', 'Close', {
            duration: 3000
          });
        },
        error: (error) => {
          console.error('Error deleting line:', error);
          this.isLoading = false;
          this.snackBar.open('Error deleting line', 'Close', {
            duration: 3000
          });
        }
      });
    }
  }

  // Calculate gross quantity
  calculateGrossQuantity(line: SubRecipeLine): number {
    return line.quantity * (1 + (line.wastagePercent || 0) / 100);
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
        // Update in the list by reloading
        this.loadSubRecipes();
      },
      error: (error) => {
        console.error('Error updating sub-recipe:', error);
      }
    });
  }

  deleteSubRecipe(): void {
    if (!this.selectedSubRecipe?.id) return;
    
    if (confirm(`Are you sure you want to delete '${this.selectedSubRecipe.name}'? This action cannot be undone.`)) {
      this.isLoading = true;
      this.subRecipeService.deleteSubRecipe(this.selectedSubRecipe.id).subscribe({
        next: () => {
          // Reload list
          this.loadSubRecipes();
          
          // Close panel
          this.closeDetailPanel();
          this.isLoading = false;
          this.snackBar.open('Sub-recipe deleted successfully', 'Close', {
            duration: 3000
          });
        },
        error: (error) => {
          console.error('Error deleting sub-recipe:', error);
          this.isLoading = false;
          this.snackBar.open('Error deleting sub-recipe', 'Close', {
            duration: 3000
          });
        }
      });
    }
  }
}
