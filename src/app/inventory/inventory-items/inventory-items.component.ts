import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
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
import { MatSelectModule } from '@angular/material/select';
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
  filteredItems: InventoryItem[] = [];
  
  // Loading and error states
  isLoading = true;
  error: string | null = null;
  
  // Filter properties
  nameFilter: string = '';
  categoryFilter: number | null = null;
  supplierFilter: number | null = null;
  buyerFilter: number | null = null;
  
  // Filter options
  categories: Category[] = [];
  suppliers: Supplier[] = [];
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
    
    this.inventoryService.getPaginatedInventoryItems(
      this.pageIndex,
      this.pageSize,
      `${this.sortField},${this.sortDirection}`,
      this.categoryFilter || undefined,
      this.nameFilter || undefined,
      false // Use lightweight DTOs for list view to avoid N+1 query problems
    ).subscribe({
      next: (response: PaginatedResponse<InventoryItem>) => {
        this.filteredItems = response.content;
        this.totalItems = response.totalElements;
        
        // Fetch location data for each item
        const selectedLocationId = this.inventoryItemLocationService.getSelectedLocationId();
        this.filteredItems.forEach(item => {
          if (item.id) {
            this.inventoryItemLocationService.getItemLocationData(item.id, selectedLocationId)
              .subscribe({
                next: (locationData) => {
                  // Update the item with location-specific data
                  item.minOnHand = locationData.minOnHand;
                  item.par = locationData.parLevel;
                  item.lastCount = locationData.lastCount;
                },
                error: () => {
                  // If no location data exists or there's an error, keep the default values
                }
              });
          }
        });
        
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
    this.categoriesService.getAllCategories('').subscribe({
      next: (categories) => {
        this.categories = categories;
      },
      error: (error) => {
        console.error('Error loading categories:', error);
      }
    });
  }

  loadSuppliers(): void {
    this.supplierService.searchSuppliers('').subscribe({
      next: (suppliers) => {
        this.suppliers = suppliers;
      },
      error: (error) => {
        console.error('Error loading suppliers:', error);
      }
    });
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

  // Helper methods to get names for display
  getCategoryName(id: number): string {
    return this.categories.find(c => c.id === id)?.name || 'Unknown';
  }

  getSupplierName(id: number): string {
    return this.suppliers.find(s => s.id === id)?.name || 'Unknown';
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

  openItemDetails(item: InventoryItem): void {
    this.dialog.open(InventoryItemDetailModalComponent, {
      width: '800px',
      data: item
    });
  }

  getMainPurchaseOption(item: InventoryItem) {
    return item.purchaseOptions?.find(po => po.mainPurchaseOption);
  }

  getMainSupplier(item: InventoryItem): string {
    const mainOption = this.getMainPurchaseOption(item);
    return mainOption?.supplier?.name || 'N/A';
  }

  getOrderingStatus(item: InventoryItem): boolean {
    const mainOption = this.getMainPurchaseOption(item);
    return mainOption?.orderingEnabled || false;
  }

  getTaxRate(item: InventoryItem): number {
    const mainOption = this.getMainPurchaseOption(item);
    return mainOption?.taxRate || 0;
  }
}