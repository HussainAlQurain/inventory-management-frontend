import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTable } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
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

import { InventoryItemsService } from '../../services/inventory-items-service.service';
import { InventoryItem } from '../../models/InventoryItem';
import { InventoryItemDetailModalComponent } from '../inventory-item-detail-modal/inventory-item-detail-modal.component';
import { Category } from '../../models/Category';
import { Supplier } from '../../models/Supplier';
import { CategoriesService } from '../../services/categories.service';
import { SupplierService } from '../../services/supplier.service';
import { AddInventoryItemComponent } from '../add-inventory-item/add-inventory-item.component';
import { InventoryItemLocationService } from '../../services/inventory-item-location.service';
import { InventoryItemLocation } from '../../models/InventoryItem';

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
export class InventoryItemsComponent implements OnInit {
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
  
  // Original and filtered data sources
  dataSource: InventoryItem[] = [];
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
    this.loadInventoryItems();
    this.loadCategories();
    this.loadSuppliers();
  }

  loadInventoryItems(): void {
    this.isLoading = true;
    this.inventoryService.getInventoryItemsByCompany().subscribe({
      next: (items) => {
        this.dataSource = items;
        this.filteredItems = items;
        
        // Fetch location data for each item
        const selectedLocationId = this.inventoryItemLocationService.getSelectedLocationId();
        items.forEach(item => {
          if (item.id) {
            this.inventoryItemLocationService.getItemLocationData(item.id, selectedLocationId)
              .subscribe({
                next: (locationData) => {
                  // Update the item with location-specific data
                  item.minOnHand = locationData.minOnHand;
                  item.par = locationData.parLevel;
                  item.lastCount = locationData.lastCount;
                },
                error: (error) => {
                  // If no location data exists or there's an error, keep the default values
                  // console.log(`No location data for item ${item.id}`);
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

  // Filtering methods
  applyFilters(): void {
    this.filteredItems = this.dataSource.filter(item => {
      // Filter by name
      const nameMatch = !this.nameFilter || 
        item.name.toLowerCase().includes(this.nameFilter.toLowerCase());
      
      // Filter by category
      const categoryMatch = !this.categoryFilter || 
        item.category?.id === this.categoryFilter;
      
      // Filter by supplier - check all purchase options for any supplier match
      const supplierMatch = !this.supplierFilter || 
        item.purchaseOptions?.some(po => po.supplier?.id === this.supplierFilter);
      
      // Filter by buyer - example filter (using placeholder data)
      const buyerMatch = !this.buyerFilter || this.buyerFilter === 1; // Always match Company buyer for now
      
      // Return true only if all filters match
      return nameMatch && categoryMatch && supplierMatch && buyerMatch;
    });
  }

  clearAllFilters(): void {
    this.nameFilter = '';
    this.categoryFilter = null;
    this.supplierFilter = null;
    this.buyerFilter = null;
    this.applyFilters();
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