import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';

import { InventoryItem } from '../../models/InventoryItem';

@Component({
  selector: 'app-inventory-item-detail-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatTableModule,
    MatCardModule,
    MatChipsModule,
    MatDividerModule,
    MatTooltipModule
  ],
  templateUrl: './inventory-item-detail-modal.component.html',
  styleUrl: './inventory-item-detail-modal.component.scss'
})
export class InventoryItemDetailModalComponent {
  displayedPurchaseColumns: string[] = [
    'supplier', 
    'price', 
    'taxRate', 
    'orderingEnabled', 
    'innerPackQuantity',
    'packsPerCase',
    'minOrderQuantity',
    'orderingUom',
    'supplierProductCode'
  ];

  constructor(
    public dialogRef: MatDialogRef<InventoryItemDetailModalComponent>,
    @Inject(MAT_DIALOG_DATA) public item: InventoryItem
  ) {}

  close(): void {
    this.dialogRef.close();
  }

  getOrderingStatus(enabled: boolean): string {
    return enabled ? 'Enabled' : 'Disabled';
  }
}