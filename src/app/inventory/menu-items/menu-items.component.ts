import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule, MatTable } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSortModule, MatSort, Sort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
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

import { MenuItem } from '../../models/MenuItem';
import { Category } from '../../models/Category';
import { MenuItemsService } from '../../services/menu-items.service';
import { CategoriesService } from '../../services/categories.service';
import { AddMenuItemComponent } from '../add-menu-item/add-menu-item.component';
import { MenuItemDetailComponent } from '../menu-item-detail/menu-item-detail.component';
import { PaginatedItemsResponse } from '../../services/sub-recipes.service';

@Component({
  selector: 'app-menu-items',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDividerModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatMenuModule,
    MatChipsModule,
    MatTooltipModule,
    MatDialogModule,
    AddMenuItemComponent,
    MenuItemDetailComponent
  ],
  templateUrl: './menu-items.component.html',
  styleUrl: './menu-items.component.scss'
})
export class MenuItemsComponent implements OnInit, AfterViewInit {
  // Display columns for the table - removing 'actions'
  displayedColumns: string[] = [
    'name',
    'category',
    'posCode',
    'cost',
    'foodCostPercentage',
    'retailPriceExclTax'
  ];
  
  // Data sources
  filteredMenuItems: MenuItem[] = [];
  
  // Selected menu item for detail view
  selectedMenuItem: MenuItem | null = null;
  showDetailPanel = false;
  editMode = false;
  
  // Filter values
  nameFilter = '';
  categoryFilter: number | null = null;
  posCodeFilter = '';
  
  // Filter options
  categories: Category[] = [];
  
  // Loading state
  isLoading = false;
  error: string | null = null;
  
  // For adding new menu item
  showAddForm = false;
  showAddMenuItemPanel = false;

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
  @ViewChild(MatTable) table!: MatTable<MenuItem>;
  @ViewChild(MenuItemDetailComponent) menuItemDetailComponent?: MenuItemDetailComponent;

  constructor(
    private menuItemsService: MenuItemsService,
    private categoriesService: CategoriesService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.setupSearchDebounce();
    this.loadMenuItems();
    this.loadCategories();
  }

  ngAfterViewInit(): void {
    // Set up sort change listener
    if (this.sort) {
      this.sort.sortChange.subscribe((sort: Sort) => {
        this.sortBy = sort.active;
        this.sortDirection = sort.direction || 'asc';
        this.currentPage = 0; // Reset to first page
        this.loadMenuItems();
      });
    }
  }

  setupSearchDebounce(): void {
    this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(() => {
      this.currentPage = 0; // Reset to first page when search changes
      this.loadMenuItems();
    });
  }

  loadMenuItems(): void {
    this.isLoading = true;
    
    this.menuItemsService.getPaginatedMenuItems(
      this.currentPage,
      this.pageSize,
      this.sortBy,
      this.sortDirection,
      this.getSearchTerm()
    ).subscribe({
      next: (response: PaginatedItemsResponse<MenuItem>) => {
        this.filteredMenuItems = response.items;
        this.totalItems = response.totalItems;
        this.currentPage = response.currentPage;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading menu items:', error);
        this.error = 'Failed to load menu items. Please try again.';
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

  // Pagination event handler
  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadMenuItems();
  }

  // Handle search input changes
  onSearchChange(value: string): void {
    this.nameFilter = value;
    this.searchSubject.next(value);
  }

  selectMenuItem(menuItem: MenuItem): void {
    this.selectedMenuItem = menuItem;
    this.showDetailPanel = true;
    this.editMode = false; // Start in view mode, not edit mode
    
    // Load full details including lines
    if (menuItem.id) {
      this.loadMenuItemDetails(menuItem.id);
    }
  }

  loadMenuItemDetails(id: number): void {
    this.isLoading = true;
    this.menuItemsService.getMenuItemById(id).subscribe({
      next: (menuItem) => {
        this.selectedMenuItem = menuItem;
        this.isLoading = false;
        
        // Use the ViewChild reference instead of direct DOM manipulation
        // Wait for change detection to complete
        setTimeout(() => {
          if (this.menuItemDetailComponent) {
            this.menuItemDetailComponent.loadMenuItemDetails(id);
          }
        });
      },
      error: (error) => {
        console.error(`Error loading menu item details for ID ${id}:`, error);
        this.isLoading = false;
        this.snackBar.open('Error loading menu item details', 'Close', {
          duration: 3000
        });
      }
    });
  }

  // Apply filters now triggers server-side filtering by reloading data
  applyFilters(): void {
    this.currentPage = 0; // Reset to first page
    this.loadMenuItems();
  }

  clearAllFilters(): void {
    this.nameFilter = '';
    this.categoryFilter = null;
    this.posCodeFilter = '';
    this.currentPage = 0; // Reset to first page
    this.loadMenuItems();
  }

  hasActiveFilters(): boolean {
    return !!(this.nameFilter || this.categoryFilter || this.posCodeFilter);
  }

  // Helper methods for display
  getCategoryName(categoryId: number): string {
    return this.categories.find(c => c.id === categoryId)?.name || 'Unknown';
  }

  // Action methods
  closeDetailPanel(): void {
    this.showDetailPanel = false;
    this.selectedMenuItem = null;
    this.editMode = false;
  }

  addManually(): void {
    this.showAddMenuItemPanel = true;
  }

  handleCloseAddPanel(createdMenuItem: MenuItem | null): void {
    this.showAddMenuItemPanel = false;
    if (createdMenuItem) {
      // Reload menu items to include the new one
      this.loadMenuItems();
      
      // Optionally select the newly created menu item
      this.selectMenuItem(createdMenuItem);
      
      this.snackBar.open('Menu item created successfully', 'Close', {
        duration: 3000
      });
    }
  }

  importFromExcel(): void {
    // To be implemented later
    alert('Import from Excel functionality will be implemented later');
  }

  downloadMenuItems(): void {
    // To be implemented later
    alert('Download menu items functionality will be implemented later');
  }

  deleteMenuItem(id: number): void {
    if (confirm('Are you sure you want to delete this menu item? This action cannot be undone.')) {
      this.isLoading = true;
      this.menuItemsService.deleteMenuItem(id).subscribe({
        next: () => {
          // Reload menu items after deletion
          this.loadMenuItems();
          
          // Close panel if the deleted item was selected
          if (this.selectedMenuItem?.id === id) {
            this.closeDetailPanel();
          }
          
          this.isLoading = false;
          this.snackBar.open('Menu item deleted successfully', 'Close', {
            duration: 3000
          });
        },
        error: (error) => {
          console.error('Error deleting menu item:', error);
          this.isLoading = false;
          this.snackBar.open('Error deleting menu item', 'Close', {
            duration: 3000
          });
        }
      });
    }
  }

  // Handle edit menu item functionality
  editMenuItem(menuItem: MenuItem): void {
    // Set up edit mode
    this.editMode = true;
    this.selectedMenuItem = { ...menuItem };
  }

  // Handle save menu item event from detail panel
  handleSaveMenuItem(updatedMenuItem: MenuItem): void {
    // Reload menu items to refresh the list
    this.loadMenuItems();
    
    // Show success message
    this.snackBar.open('Menu item updated successfully', 'Close', {
      duration: 3000
    });
    
    // Exit edit mode
    this.editMode = false;
  }

  // Toggle edit mode
  toggleEditMode(): void {
    this.editMode = !this.editMode;
  }
}
