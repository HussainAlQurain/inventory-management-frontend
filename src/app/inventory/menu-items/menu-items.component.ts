import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule, MatTable } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
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

import { MenuItem } from '../../models/MenuItem';
import { Category } from '../../models/Category';
import { MenuItemsService } from '../../services/menu-items.service';
import { CategoriesService } from '../../services/categories.service';
import { AddMenuItemComponent } from '../add-menu-item/add-menu-item.component';

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
    AddMenuItemComponent
  ],
  templateUrl: './menu-items.component.html',
  styleUrl: './menu-items.component.scss'
})
export class MenuItemsComponent implements OnInit {
  // Display columns for the table
  displayedColumns: string[] = [
    'name',
    'category',
    'posCode',
    'cost',
    'foodCostPercentage',
    'retailPriceExclTax',
    'actions'
  ];
  
  // Data sources
  menuItems: MenuItem[] = [];
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
  
  // For pagination and sorting
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatTable) table!: MatTable<MenuItem>;

  constructor(
    private menuItemsService: MenuItemsService,
    private categoriesService: CategoriesService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.loadMenuItems();
    this.loadCategories();
  }

  loadMenuItems(): void {
    this.isLoading = true;
    this.menuItemsService.getMenuItemsByCompany().subscribe({
      next: (items) => {
        this.menuItems = items;
        this.filteredMenuItems = items;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading menu items:', error);
        this.error = 'Failed to load menu items. Please try again.';
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

  selectMenuItem(menuItem: MenuItem): void {
    this.selectedMenuItem = menuItem;
    this.showDetailPanel = true;
    
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

  // Filtering methods
  applyFilters(): void {
    this.filteredMenuItems = this.menuItems.filter(item => {
      // Filter by name
      const nameMatch = !this.nameFilter || 
        item.name.toLowerCase().includes(this.nameFilter.toLowerCase());
      
      // Filter by category
      const categoryMatch = !this.categoryFilter || 
        item.category?.id === this.categoryFilter;
      
      // Filter by POS code
      const posCodeMatch = !this.posCodeFilter || 
        (item.posCode && item.posCode.toLowerCase().includes(this.posCodeFilter.toLowerCase()));
      
      return nameMatch && categoryMatch && posCodeMatch;
    });
  }

  clearAllFilters(): void {
    this.nameFilter = '';
    this.categoryFilter = null;
    this.posCodeFilter = '';
    this.applyFilters();
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
      this.menuItems.push(createdMenuItem);
      this.applyFilters();
      
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
          // Remove from list
          this.menuItems = this.menuItems.filter(item => item.id !== id);
          this.filteredMenuItems = this.filteredMenuItems.filter(item => item.id !== id);
          
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
}
