import { Component, OnInit, ViewChild, AfterViewInit, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTable } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSortModule, MatSort, Sort } from '@angular/material/sort';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field'; 
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule, MatSelect } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { InventoryItemsService } from '../../services/inventory-items-service.service';
import { PaginatedResponse } from '../../models/paginated-response';
import { InventoryItem } from '../../models/InventoryItem';
import { InventoryItemDetailModalComponent } from '../inventory-item-detail-modal/inventory-item-detail-modal.component';
import { Category } from '../../models/Category';
import { Supplier } from '../../models/Supplier';
import { CategoriesService } from '../../services/categories.service';
import { SupplierService } from '../../services/supplier.service';
import { AddInventoryItemComponent } from '../add-inventory-item/add-inventory-item.component';
import { InventoryItemLocationService } from '../../services/inventory-item-location.service';
import { InventoryItemListDTO } from '../../models/InventoryItemListDTO';
import { FilterOptionDTO } from '../../models/FilterOptionDTO';

interface Buyer {
  id: number;
  name: string;
}

@Component({
  selector: 'app-inventory-items',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
    MatMenuModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    AddInventoryItemComponent
  ],
  templateUrl: './inventory-items.component.html',
  styleUrl: './inventory-items.component.scss'
})
export class InventoryItemsComponent implements OnInit, AfterViewInit {
  // Make Math available to the template
  Math = Math;
  
  displayedColumns: string[] = [
    'name', 
    'supplier', 
    'buyer', 
    'category', 
    'pricePerUOM', 
    'uom', 
    'minOnHand', 
    'par', 
    'lastCount', 
    'onHand', 
    'onHandValue', 
    'ordering', 
    'taxRate'
  ];
  
  // Filtered data source
  filteredItems: InventoryItemListDTO[] = [];
  
  // Loading and error states
  isLoading = true;
  error: string | null = null;
  
  // Filter properties
  nameFilter: string = '';
  categoryFilter: number | null = null;
  supplierFilter: number | null = null;
  buyerFilter: number | null = null;
  
  // Filter options
  categories: FilterOptionDTO[] = [];
  suppliers: FilterOptionDTO[] = [];
  suppliersPage = 0;
  suppliersSize = 20; // Load a reasonable initial number for the dropdown
  suppliersTotal = 0;
  suppliersLoading = false;
  suppliersSearchTerm = '';

  buyers: Buyer[] = [
    { id: 1, name: 'Company' },
    { id: 2, name: 'Store Manager' },
    { id: 3, name: 'Purchasing Agent' }
  ];

  // Add inventory item panel flag
  showAddItemPanel = false;

  // Pagination and sorting
  totalItems = 0;
  pageSize = 10;
  pageIndex = 0;
  pageSizeOptions = [5, 10, 25, 50, 100];
  sortField = 'name';
  sortDirection = 'asc';
  
  // Debounce for search
  private searchSubject = new Subject<string>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatTable) table!: MatTable<InventoryItem>;
  @ViewChild('supplierSelect') supplierSelect!: MatSelect;
  @ViewChild('supplierSearchInput') supplierSearchInput!: ElementRef;
  @ViewChild('categorySelect') categorySelect!: MatSelect;
  @ViewChild('categorySearchInput') categorySearchInput!: ElementRef;

  // Add these properties for category search and pagination
  categoriesPage = 0;
  categoriesSize = 20;
  categoriesTotal = 0;
  categoriesLoading = false;
  categoriesSearchTerm = '';

  constructor(
    private inventoryService: InventoryItemsService,
    private categoriesService: CategoriesService,
    private supplierService: SupplierService,
    private dialog: MatDialog,
    private inventoryItemLocationService: InventoryItemLocationService
  ) {}

  ngOnInit(): void {
    this.setupSearchDebounce();
    this.loadInventoryItems();
    this.loadCategories();
    this.loadSuppliers();
  }
  
  ngAfterViewInit() {
    // Set up sort change listener after the view is initialized
    if (this.sort) {
      this.sort.sortChange.subscribe((sort: Sort) => {
        this.sortField = sort.active;
        this.sortDirection = sort.direction || 'asc';
        this.pageIndex = 0; // Reset to first page on sort change
        this.loadInventoryItems();
      });
    }

    // Set up the panel scroll listener after view is initialized
    if (this.supplierSelect) {
      this.supplierSelect.openedChange.subscribe(opened => {
        if (opened) {
          // Focus the search input when the dropdown opens
          setTimeout(() => {
            if (this.supplierSearchInput) {
              this.supplierSearchInput.nativeElement.focus();
            }
            
            // Set up scroll listener
            const panel = document.querySelector('.mat-mdc-select-panel') as HTMLElement;
            if (panel) {
              panel.addEventListener('scroll', this.onDropdownScroll.bind(this));
            }
          }, 100);
        }
      });
    }

    // Add this code for category select
    if (this.categorySelect) {
      this.categorySelect.openedChange.subscribe(opened => {
        if (opened) {
          setTimeout(() => {
            if (this.categorySearchInput) {
              this.categorySearchInput.nativeElement.focus();
            }
            
            const panel = document.querySelector('.mat-mdc-select-panel') as HTMLElement;
            if (panel) {
              panel.addEventListener('scroll', this.onCategoryDropdownScroll.bind(this));
            }
          }, 100);
        }
      });
    }
  }
  
  setupSearchDebounce(): void {
    this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(() => {
      this.pageIndex = 0; // Reset to first page when search changes
      this.loadInventoryItems();
    });
  }

  loadInventoryItems(): void {
    this.isLoading = true;
    
    this.inventoryService.getPaginatedInventoryItemsList(
      this.pageIndex,
      this.pageSize,
      `${this.sortField},${this.sortDirection}`,
      this.categoryFilter || undefined,
      this.nameFilter || undefined
    ).subscribe({
      next: (response: PaginatedResponse<InventoryItemListDTO>) => {
        this.filteredItems = response.content;
        this.totalItems = response.totalElements;
        this.isLoading = false;
      },
      error: (error) => {
        this.error = error.message;
        this.isLoading = false;
        console.error('Error loading inventory items:', error);
      }
    });
  }

  loadCategories(): void {
    this.categoriesLoading = true;
    this.categoriesService.getPaginatedCategoryFilterOptions(
      this.categoriesPage,
      this.categoriesSize,
      this.categoriesSearchTerm
    ).subscribe({
      next: (response) => {
        this.categories = response.content;
        this.categoriesTotal = response.totalElements;
        this.categoriesLoading = false;
      },
      error: (error) => {
        console.error('Error loading category options:', error);
        this.categoriesLoading = false;
      }
    });
  }

  loadSuppliers(): void {
    this.suppliersLoading = true;
    this.supplierService.getPaginatedSupplierFilterOptions(
      this.suppliersPage,
      this.suppliersSize,
      this.suppliersSearchTerm
    ).subscribe({
      next: (response) => {
        this.suppliers = response.content;
        this.suppliersTotal = response.totalElements;
        this.suppliersLoading = false;
      },
      error: (error) => {
        console.error('Error loading supplier options:', error);
        this.suppliersLoading = false;
      }
    });
  }
  
  onSupplierSearch(event: Event): void {
    // Stop propagation to prevent the dropdown from closing
    event.stopPropagation();
    
    const inputElement = event.target as HTMLInputElement;
    this.suppliersSearchTerm = inputElement.value;
    
    // Reset pagination and clear existing suppliers
    this.suppliersPage = 0;
    this.suppliers = [];
    
    // Load suppliers with the search term
    this.loadSuppliers();
  }
  
  // Add a method to clear the search
  clearSupplierSearch(): void {
    this.suppliersSearchTerm = '';
    this.suppliersPage = 0;
    this.suppliers = [];
    this.loadSuppliers();
  }

  // Add this method for loading more suppliers
  loadMoreSuppliers(): void {
    if (this.suppliersLoading) return;
    
    this.suppliersLoading = true;
    this.suppliersPage++;
    
    this.supplierService.getPaginatedSupplierFilterOptions(
      this.suppliersPage,
      this.suppliersSize,
      this.suppliersSearchTerm
    ).subscribe({
      next: (response) => {
        // Append new suppliers to existing array
        this.suppliers = [...this.suppliers, ...response.content];
        this.suppliersTotal = response.totalElements;
        this.suppliersLoading = false;
      },
      error: (error) => {
        console.error('Error loading more suppliers:', error);
        this.suppliersLoading = false;
        this.suppliersPage--; // Revert page increment on error
      }
    });
  }

  onDropdownScroll(event: Event): void {
    const panel = event.target as HTMLElement;
    // Check if scrolled near bottom
    if (panel.scrollTop + panel.clientHeight >= panel.scrollHeight - 50) {
      if (!this.suppliersLoading && this.suppliers.length < this.suppliersTotal) {
        this.loadMoreSuppliers();
      }
    }
  }

  // Add these methods for category search functionality
  onCategorySearch(event: Event): void {
    event.stopPropagation();
    
    const inputElement = event.target as HTMLInputElement;
    this.categoriesSearchTerm = inputElement.value;
    
    // Reset pagination and clear existing categories
    this.categoriesPage = 0;
    this.categories = [];
    
    // Load categories with the search term
    this.loadCategories();
  }

  clearCategorySearch(): void {
    this.categoriesSearchTerm = '';
    this.categoriesPage = 0;
    this.categories = [];
    this.loadCategories();
  }

  loadMoreCategories(): void {
    if (this.categoriesLoading) return;
    
    this.categoriesLoading = true;
    this.categoriesPage++;
    
    this.categoriesService.getPaginatedCategoryFilterOptions(
      this.categoriesPage,
      this.categoriesSize,
      this.categoriesSearchTerm
    ).subscribe({
      next: (response) => {
        // Append new categories to existing array
        this.categories = [...this.categories, ...response.content];
        this.categoriesTotal = response.totalElements;
        this.categoriesLoading = false;
      },
      error: (error) => {
        console.error('Error loading more categories:', error);
        this.categoriesLoading = false;
        this.categoriesPage--; // Revert page increment on error
      }
    });
  }

  onCategoryDropdownScroll(event: Event): void {
    const panel = event.target as HTMLElement;
    // Check if scrolled near bottom
    if (panel.scrollTop + panel.clientHeight >= panel.scrollHeight - 50) {
      if (!this.categoriesLoading && this.categories.length < this.categoriesTotal) {
        this.loadMoreCategories();
      }
    }
  }

  // Handle pagination events
  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadInventoryItems();
  }

  // Filtering methods - now trigger server-side filtering
  applyFilters(): void {
    this.pageIndex = 0; // Reset to first page when filters change
    this.loadInventoryItems();
  }
  
  onSearchChange(value: string): void {
    this.nameFilter = value;
    this.searchSubject.next(value);
  }

  clearAllFilters(): void {
    this.nameFilter = '';
    this.categoryFilter = null;
    this.supplierFilter = null;
    this.buyerFilter = null;
    this.pageIndex = 0; // Reset to first page
    this.loadInventoryItems();
  }

  hasActiveFilters(): boolean {
    return !!(this.nameFilter || this.categoryFilter || this.supplierFilter || this.buyerFilter);
  }

  getBuyerName(id: number): string {
    return this.buyers.find(b => b.id === id)?.name || 'Unknown';
  }

  // Add and download methods
  addInventoryItem(): void {
    this.showAddItemPanel = true;
  }

  // Handle closing the add item panel
  handleClosePanel(createdItem: InventoryItem | null): void {
    this.showAddItemPanel = false;
    if (createdItem) {
      // Refresh the inventory items list
      this.loadInventoryItems();
    }
  }

  importFromExcel(): void {
    // To be implemented
    console.log('Import from Excel clicked');
    alert('Import from Excel functionality will be implemented later');
  }

  downloadInventoryItems(): void {
    // To be implemented
    console.log('Download inventory items clicked');
    alert('Download inventory items functionality will be implemented later');
  }

  downloadPurchaseOptions(): void {
    // To be implemented
    console.log('Download purchase options clicked');
    alert('Download purchase options functionality will be implemented later');
  }

  openItemDetails(item: InventoryItemListDTO): void {
    // If your detail modal needs a full InventoryItem object, fetch it first
    this.inventoryService.getInventoryItemById(item.id).subscribe({
      next: (fullItem) => {
        this.dialog.open(InventoryItemDetailModalComponent, {
          width: '800px',
          data: fullItem
        });
      },
      error: (error) => {
        console.error('Error fetching item details:', error);
      }
    });
  }

  getCategoryName(id: number | null): string {
    if (!id) return '';
    const category = this.categories.find(c => c.id === id);
    return category?.name || '';
  }
  
  getSupplierName(id: number | null): string {
    if (!id) return '';
    const supplier = this.suppliers.find(s => s.id === id);
    return supplier?.name || '';
  }
  
}