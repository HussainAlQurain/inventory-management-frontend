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

import { InventoryItemsService } from '../../services/inventory-items-service.service';
import { InventoryItem } from '../../models/InventoryItem';
import { InventoryItemDetailModalComponent } from '../inventory-item-detail-modal/inventory-item-detail-modal.component';

@Component({
  selector: 'app-inventory-items',
  standalone: true,
  imports: [
    CommonModule, 
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule
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
  
  dataSource: InventoryItem[] = [];
  isLoading = true;
  error: string | null = null;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatTable) table!: MatTable<InventoryItem>;

  constructor(
    private inventoryService: InventoryItemsService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadInventoryItems();
  }

  loadInventoryItems(): void {
    this.isLoading = true;
    this.inventoryService.getInventoryItemsByCompany().subscribe({
      next: (items) => {
        this.dataSource = items;
        this.isLoading = false;
      },
      error: (error) => {
        this.error = error.message;
        this.isLoading = false;
        console.error('Error loading inventory items:', error);
      }
    });
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