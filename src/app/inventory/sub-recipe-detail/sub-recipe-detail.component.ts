import { Component, OnInit, ViewChild, AfterViewInit, ElementRef } from '@angular/core';
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
import { SubRecipeListDTO } from '../../models/SubRecipeListDTO';
import { PaginatedSubRecipeResponse } from '../../models/PaginatedSubRecipeResponse';

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

  @ViewChild('categorySearchInput', { static: false }) categorySearchInput!: ElementRef;
  
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
  filteredSubRecipes: SubRecipeListDTO[] = [];
  
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
    // Only load sub-recipes initially
    this.loadSubRecipes();
    
    // Delay loading categories and UOMs to spread out database load
    setTimeout(() => {
      // Don't load categories until the category dropdown is opened
    }, 500);
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
    this.error     = null;

    this.subRecipesService.getPaginatedSubRecipesList(
        this.currentPage,
        this.pageSize,
        this.sortBy,
        this.sortDirection,
        this.nameFilter || undefined,   // search
        this.categoryFilter || undefined,
        this.typeFilter    || undefined // <-- new arg
    )
    .subscribe({
      next: (res) => {
        this.filteredSubRecipes = res.items;
        this.totalItems         = res.totalItems;
        this.currentPage        = res.currentPage;
        this.isLoading          = false;
      },
      error: (error) => {
        console.error('Error loading sub-recipes:', error);
        this.isLoading = false;
        this.error = 'Failed to load sub-recipes. Please try again.';
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

  private categorySearchTerm = '';
  categoriesLoading = false;
  
  loadCategoriesLazy(searchTerm: string = ''): void {
    // Don't make duplicate requests while loading
    if (this.categoriesLoading) return;
    
    this.categoriesLoading = true;
    this.categorySearchTerm = searchTerm;
    
    this.categoriesService.getPaginatedCategoryFilterOptions(0, 20, searchTerm).subscribe({
      next: (response) => {
        this.categories = response.content.map(dto => ({
          id: dto.id,
          name: dto.name,
          description: ''
        } as Category));
        this.categoriesLoading = false;
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.categoriesLoading = false;
      }
    });
  }
  
  // Add this method to handle category search
  onCategorySearch(event: Event): void {
    event.stopPropagation(); // Prevent dropdown from closing on input click
    const input = event.target as HTMLInputElement;
    this.loadCategoriesLazy(input.value);
  }

  loadUomsLazy(): void {
    if (this.allUoms.length === 0) {
      this.uomService.getPaginatedUomFilterOptions(0, 50, '').subscribe({
        next: (response) => {
          this.allUoms = response.content.map(dto => ({
            id: dto.id,
            name: dto.name,
            abbreviation: dto.abbreviation,
            conversionFactor: 1 // Default value since this isn't in the DTO
          } as UnitOfMeasure));
        },
        error: (error) => {
          console.error('Error loading UOMs:', error);
        }
      });
    }
  }

  selectSubRecipe(recipe: SubRecipeListDTO): void {
    // Reset editing states when selecting a new recipe
    this.isEditingLine = false;
    this.currentLine = undefined;
    this.editMode = false;
    
    // Only loading basic info from the list DTO
    const basicRecipe: SubRecipe = {
      id: recipe.id,
      name: recipe.name,
      type: recipe.type as SubRecipeType,
      categoryId: recipe.categoryId,
      uomId: recipe.uomId,
      yieldQty: recipe.yieldQty,
      cost: recipe.cost,
      lines: [] // Empty array initially
    };
    
    this.selectedSubRecipe = basicRecipe;
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
  getCategoryName(id: number): string {
    return this.filteredSubRecipes.find(r => r.categoryId === id)?.categoryName ?? '…';
  }
  
  getTypeName(type: SubRecipeType): string {
    return this.recipeTypes.find(t => t.value === type)?.label || type;
  }

  getUomInfo(id: number|undefined): string {
    const rec = this.filteredSubRecipes.find(r => r.uomId === id);
    return rec ? `${rec.uomName} (${rec.uomAbbreviation})` : '…';
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
      
      // Convert SubRecipe to SubRecipeListDTO format
      const categoryName = this.categories.find(c => c.id === createdSubRecipe.categoryId)?.name || '';
      const uom = this.allUoms.find(u => u.id === createdSubRecipe.uomId);
      
      const subRecipeDTO: SubRecipeListDTO = {
        id: createdSubRecipe.id!,
        name: createdSubRecipe.name,
        type: createdSubRecipe.type,
        categoryId: createdSubRecipe.categoryId!,
        categoryName: categoryName,
        uomId: createdSubRecipe.uomId!,
        uomName: uom?.name || '',
        uomAbbreviation: uom?.abbreviation || '',
        yieldQty: createdSubRecipe.yieldQty!,
        cost: createdSubRecipe.cost || 0
      };
      
      // Now select the converted object
      this.selectSubRecipe(subRecipeDTO);
      
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
    this.loadCategoriesLazy();
    this.loadUomsLazy();
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

  onCategoryDropdownOpened(): void {
    // Initialize with empty search instead of loading all categories right away
    this.loadCategoriesLazy('');
    
    // Focus the search input when dropdown opens
    setTimeout(() => {
      if (this.categorySearchInput) {
        this.categorySearchInput.nativeElement.focus();
      }
    }, 100);
  }

  onUomDropdownOpened(): void {
    this.loadUomsLazy();
  }
}
