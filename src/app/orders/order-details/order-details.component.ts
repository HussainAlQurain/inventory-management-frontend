import { Component, OnInit, NgZone, Inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router } from '@angular/router';
import { OrderService, OrderItemReceipt } from '../../services/order.service';
import { InventoryItemsService } from '../../services/inventory-items-service.service';
import { OrderSummary } from '../../models/OrderSummary';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { switchMap, catchError, finalize, map, forkJoin, of } from 'rxjs';
import { MatDialogModule, MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { FormsModule } from '@angular/forms';

// Extended interface for order details with items
export interface OrderDetail extends OrderSummary {
  orderId?: number; // Backend returns orderId instead of id in some cases
  creationDate: string;
  buyerLocationId: number;
  supplierId: number;
  items: OrderItemDetail[];
}

// Interface for order line items
export interface OrderItemDetail {
  orderItemId: number;
  inventoryItemId: number;
  inventoryItemName: string;
  quantity: number;
  price: number;
  total: number;
  uomName: string;
  productCode?: string; // Will be populated from inventory item lookup
}

// Interface for receiving items
export interface ReceiveItemData extends OrderItemDetail {
  receivedQty: number;
  finalPrice: number;
  includeInReceipt: boolean;
  priceChanged: boolean;
}

// Dialog component for sending order
@Component({
  selector: 'send-order-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  template: `
    <h2 mat-dialog-title>Send Order to Supplier</h2>
    <mat-dialog-content>
      <form [formGroup]="sendOrderForm">
        <mat-form-field appearance="fill" style="width: 100%">
          <mat-label>Additional Comments (Optional)</mat-label>
          <textarea matInput formControlName="comments" rows="4" 
                   placeholder="Add any comments for the supplier..."></textarea>
        </mat-form-field>
      </form>
      <p>Are you sure you want to send this order to the supplier?</p>
      <p>The order status will be updated to "SENT".</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" [mat-dialog-close]="sendOrderForm.value" 
              [disabled]="sendOrderForm.invalid">Send Order</button>
    </mat-dialog-actions>
  `
})
export class SendOrderDialogComponent {
  sendOrderForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.sendOrderForm = this.fb.group({
      comments: ['']
    });
  }
}

// Dialog component for receiving order
@Component({
  selector: 'receive-order-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatCheckboxModule,
    MatTooltipModule,
    MatSlideToggleModule
  ],
  template: `
    <h2 mat-dialog-title>Receive Order #{{ orderNumber }}</h2>
    <mat-dialog-content>
      <p class="instruction-text">
        Review your order items below. You can adjust quantities, update prices, or exclude items from receipt.
      </p>
      
      <!-- Price Update Option -->
      <div class="update-price-option">
        <div class="option-content">
          <mat-slide-toggle [(ngModel)]="updatePriceOptions" color="primary">
            Update inventory prices when changed
          </mat-slide-toggle>
          <mat-icon 
            matTooltip="When enabled, changes to item prices will update the purchase option and inventory item prices"
            class="info-icon">info</mat-icon>
        </div>
        <div class="price-hint" *ngIf="hasPriceChanges()">
          <mat-icon color="accent">notification_important</mat-icon>
          <span>Price changes detected. Select whether to update inventory prices.</span>
        </div>
      </div>

      <!-- Items Table -->
      <div class="table-container">
        <table mat-table [dataSource]="items" class="receive-items-table">
          <!-- Include Checkbox Column -->
          <ng-container matColumnDef="include">
            <th mat-header-cell *matHeaderCellDef>
              <div class="header-cell-content">Include</div>
            </th>
            <td mat-cell *matCellDef="let item">
              <mat-checkbox [(ngModel)]="item.includeInReceipt" 
                          color="primary"></mat-checkbox>
            </td>
          </ng-container>
          
          <!-- Product Name Column -->
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>
              <div class="header-cell-content">Product</div>
            </th>
            <td mat-cell *matCellDef="let item">
              <div class="product-name">{{ item.inventoryItemName }}</div>
              <div class="product-code" *ngIf="item.productCode">{{ item.productCode }}</div>
            </td>
          </ng-container>
          
          <!-- Ordered Qty Column -->
          <ng-container matColumnDef="ordered">
            <th mat-header-cell *matHeaderCellDef>
              <div class="header-cell-content">Ordered</div>
            </th>
            <td mat-cell *matCellDef="let item">
              <div class="quantity-display">
                {{ item.quantity }} <span class="uom-label">{{ item.uomName }}</span>
              </div>
            </td>
          </ng-container>
          
          <!-- Received Qty Column -->
          <ng-container matColumnDef="received">
            <th mat-header-cell *matHeaderCellDef>
              <div class="header-cell-content">Received</div>
            </th>
            <td mat-cell *matCellDef="let item">
              <mat-form-field appearance="outline" class="qty-input">
                <input matInput type="number" [(ngModel)]="item.receivedQty" 
                      [disabled]="!item.includeInReceipt" 
                      min="0" step="0.001">
              </mat-form-field>
              <span class="uom-label">{{ item.uomName }}</span>
            </td>
          </ng-container>
          
          <!-- Price Column -->
          <ng-container matColumnDef="price">
            <th mat-header-cell *matHeaderCellDef>
              <div class="header-cell-content">Price</div>
            </th>
            <td mat-cell *matCellDef="let item">
              <div class="price-field">
                <mat-form-field appearance="outline" class="price-input">
                  <input matInput type="number" [(ngModel)]="item.finalPrice" 
                        [disabled]="!item.includeInReceipt" 
                        min="0" step="0.01"
                        (ngModelChange)="onPriceChange(item)">
                </mat-form-field>
                <mat-icon *ngIf="item.priceChanged" 
                        matTooltip="Price changed from original {{ item.price | currency }}"
                        color="accent" class="price-changed-icon">
                  price_change
                </mat-icon>
              </div>
            </td>
          </ng-container>
          
          <!-- Total Column -->
          <ng-container matColumnDef="total">
            <th mat-header-cell *matHeaderCellDef>
              <div class="header-cell-content align-right">Total</div>
            </th>
            <td mat-cell *matCellDef="let item" class="align-right">
              {{ (item.includeInReceipt ? item.receivedQty * item.finalPrice : 0) | currency }}
            </td>
          </ng-container>

          <!-- Row Definitions -->
          <tr mat-header-row *matHeaderRowDef="displayedColumns; sticky: true"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"
              [class.disabled-row]="!row.includeInReceipt"></tr>
        </table>
      </div>
      
      <div class="receipt-summary">
        <div class="summary-item">
          <span class="label">Total Items:</span>
          <span class="value">{{ getTotalIncludedItems() }}</span>
        </div>
        <div class="summary-item">
          <span class="label">Total Value:</span>
          <span class="value">{{ getTotalValue() | currency }}</span>
        </div>
      </div>
    </mat-dialog-content>
    
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" 
             [mat-dialog-close]="getReceiptData()"
             [disabled]="getTotalIncludedItems() === 0">
        <mat-icon>inventory</mat-icon> Receive Items
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .instruction-text {
      margin-bottom: 16px;
      font-size: 16px;
    }
    
    .table-container {
      max-height: 400px;
      overflow: auto;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      margin-bottom: 16px;
    }
    
    .receive-items-table {
      width: 100%;
    }
    
    .header-cell-content {
      font-weight: 500;
      white-space: nowrap;
    }
    
    .align-right {
      text-align: right;
    }
    
    .qty-input, .price-input {
      width: 80px;
      margin-right: 8px;
    }
    
    .uom-label {
      color: rgba(0, 0, 0, 0.6);
      font-size: 14px;
    }
    
    .price-changed-icon {
      vertical-align: middle;
    }
    
    .product-name {
      font-weight: 500;
      margin-bottom: 4px;
    }
    
    .product-code {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.6);
    }
    
    .update-price-option {
      background-color: #f5f5f5;
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .option-content {
      display: flex;
      align-items: center;
    }
    
    .info-icon {
      margin-left: 8px;
      font-size: 18px;
      color: rgba(0, 0, 0, 0.54);
    }
    
    .price-hint {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background-color: rgba(255, 152, 0, 0.1);
      border-radius: 4px;
      font-size: 14px;
    }
    
    .disabled-row {
      background-color: rgba(0, 0, 0, 0.04);
      color: rgba(0, 0, 0, 0.38);
    }
    
    .price-field {
      display: flex;
      align-items: center;
    }
    
    .quantity-display {
      padding: 4px 0;
    }
    
    .receipt-summary {
      margin-top: 20px;
      display: flex;
      justify-content: flex-end;
      gap: 32px;
      background-color: #f5f5f5;
      padding: 16px;
      border-radius: 8px;
    }
    
    .summary-item {
      display: flex;
      gap: 8px;
      align-items: center;
    }
    
    .summary-item .label {
      font-weight: 500;
      color: rgba(0, 0, 0, 0.7);
    }
    
    .summary-item .value {
      font-weight: 700;
      font-size: 18px;
    }
    
    mat-dialog-actions button {
      min-width: 120px;
    }
  `]
})
export class ReceiveOrderDialogComponent {
  orderNumber: string;
  items: ReceiveItemData[] = [];
  updatePriceOptions = false;
  displayedColumns: string[] = ['include', 'name', 'ordered', 'received', 'price', 'total'];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { order: OrderDetail },
    private dialogRef: MatDialogRef<ReceiveOrderDialogComponent>
  ) {
    this.orderNumber = data.order.orderNumber;
    
    // Initialize items for receipt
    if (data.order.items && data.order.items.length > 0) {
      this.items = data.order.items.map(item => ({
        ...item,
        receivedQty: item.quantity, // Initialize with ordered quantity 
        finalPrice: item.price,     // Initialize with original price
        includeInReceipt: true,     // Include by default
        priceChanged: false         // Track price changes
      }));
    }
  }

  onPriceChange(item: ReceiveItemData): void {
    // Set priceChanged flag if price differs from original
    item.priceChanged = item.finalPrice !== item.price;
  }

  hasPriceChanges(): boolean {
    return this.items.some(item => item.priceChanged);
  }

  getTotalIncludedItems(): number {
    return this.items.filter(item => item.includeInReceipt).length;
  }

  getTotalValue(): number {
    return this.items.reduce((total, item) => {
      if (item.includeInReceipt) {
        return total + (item.receivedQty * item.finalPrice);
      }
      return total;
    }, 0);
  }

  getReceiptData(): { items: OrderItemReceipt[], updatePrices: boolean } {
    const receiptItems = this.items
      .filter(item => item.includeInReceipt)
      .map(item => ({
        orderItemId: item.orderItemId,
        receivedQty: item.receivedQty,
        finalPrice: item.finalPrice
      }));
      
    return {
      items: receiptItems,
      updatePrices: this.updatePriceOptions
    };
  }
}

@Component({
  selector: 'app-order-details',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatDividerModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatTooltipModule,
    MatSlideToggleModule
  ],
  providers: [DatePipe],
  templateUrl: './order-details.component.html',
  styleUrls: ['./order-details.component.scss']
})
export class OrderDetailsComponent implements OnInit {
  orderId!: number;
  order: OrderDetail | null = null;
  isLoading = true;
  error: string | null = null;
  
  // Table columns for order items
  displayedColumns: string[] = ['productName', 'productCode', 'unitOfOrdering', 'quantity', 'price', 'total'];
  
  // Totals
  totalItems = 0;
  grandTotal = 0;
  
  // Processing state for operations
  isSending = false;
  isReceiving = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private orderService: OrderService,
    private inventoryItemsService: InventoryItemsService,
    private snackBar: MatSnackBar,
    private datePipe: DatePipe,
    private ngZone: NgZone,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    console.log('OrderDetailsComponent initializing...');
    
    // Get the order ID from the route parameters
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (!id) {
        this.error = 'Order ID is required';
        this.isLoading = false;
        return;
      }
      
      const orderId = parseInt(id, 10);
      this.orderId = orderId;
      
      console.log(`Fetching order details for ID: ${orderId}`);
      
      // Fetch the order details
      this.orderService.getPurchaseOrderById(orderId).subscribe({
        next: (orderDetail) => {
          console.log('Received order details:', orderDetail);
          
          // Store the order details and handle the id/orderId mapping
          this.order = orderDetail;
          if (orderDetail.orderId && !orderDetail.id) {
            this.order.id = orderDetail.orderId;
          }
          
          // Calculate order totals
          this.calculateTotals();
          
          // We've got the order - set loading to false
          this.isLoading = false;
          
          // Now fetch product codes in separate subscriptions (optional enhancement)
          if (orderDetail.items && orderDetail.items.length > 0) {
            this.fetchProductCodesForItems(orderDetail.items);
          }
        },
        error: (err) => {
          console.error('Error loading order details:', err);
          this.error = 'Failed to load order details. Please try again.';
          this.isLoading = false;
        }
      });
    });
  }
  
  private fetchProductCodesForItems(items: OrderItemDetail[]): void {
    console.log(`Looking up product codes for ${items.length} items`);
    
    // For each item, fetch its product code but don't block the UI
    items.forEach(item => {
      this.inventoryItemsService.getInventoryItemById(item.inventoryItemId).subscribe({
        next: (inventoryItem) => {
          if (inventoryItem && this.order && this.order.items) {
            console.log(`Got product code for item ${item.inventoryItemId}: ${inventoryItem.productCode || 'N/A'}`);
            
            // Update only this specific item with its product code
            this.ngZone.run(() => {
              const updatedItems = this.order!.items.map(orderItem => {
                if (orderItem.orderItemId === item.orderItemId) {
                  return {
                    ...orderItem,
                    productCode: inventoryItem.productCode || 'N/A'
                  };
                }
                return orderItem;
              });
              
              // Update the items array
              this.order!.items = updatedItems;
            });
          }
        },
        error: (err) => {
          console.error(`Error fetching inventory item ${item.inventoryItemId}:`, err);
        }
      });
    });
  }

  private calculateTotals(): void {
    if (!this.order) return;
    
    this.totalItems = this.order.items.reduce((sum, item) => sum + item.quantity, 0);
    this.grandTotal = this.order.items.reduce((sum, item) => sum + item.total, 0);
  }

  getStatusClass(status: string): string {
    switch (status.toUpperCase()) {
      case 'DRAFT': return 'status-draft';
      case 'CREATED': return 'status-draft';
      case 'SUBMITTED_FOR_APPROVAL': return 'status-pending';
      case 'APPROVED': return 'status-approved';
      case 'SENT': return 'status-sent';
      case 'VIEWED_BY_SUPPLIER': return 'status-viewed';
      case 'DELIVERED': return 'status-delivered';
      case 'COMPLETED': return 'status-received';
      case 'CANCELLED': return 'status-cancelled';
      default: return '';
    }
  }
  
  sendOrder(): void {
    if (!this.order) return;
    
    const dialogRef = this.dialog.open(SendOrderDialogComponent, {
      width: '500px'
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.isSending = true;
        
        // Call the service to send the order
        this.orderService.sendOrder(
          this.orderId, 
          result.comments
        ).subscribe({
          next: (updatedOrder) => {
            console.log('Order sent successfully:', updatedOrder);
            this.order = updatedOrder;
            this.snackBar.open('Order sent successfully to supplier', 'Close', {
              duration: 3000
            });
          },
          error: (err) => {
            console.error('Error sending order:', err);
            
            // Extract the specific error message from the response if available
            let errorMessage = 'Failed to send order. Please try again.';
            
            if (err.error && err.error.debugMessage) {
              errorMessage = err.error.debugMessage;
            } else if (err.error && err.error.message) {
              errorMessage = err.error.message;
            }
            
            this.snackBar.open(errorMessage, 'Close', {
              duration: 6000,
              panelClass: ['error-snackbar']
            });
          },
          complete: () => {
            this.isSending = false;
          }
        });
      }
    });
  }
  
  receiveOrder(): void {
    if (!this.order) return;
    
    // Calculate dialog width based on screen size (70% of viewport width)
    const screenWidth = window.innerWidth;
    const dialogWidth = Math.min(Math.round(screenWidth * 0.7), 1200) + 'px';
    
    const dialogRef = this.dialog.open(ReceiveOrderDialogComponent, {
      width: dialogWidth,
      maxWidth: '95vw',
      height: 'auto',
      maxHeight: '90vh',
      data: { order: this.order },
      panelClass: 'receive-order-dialog'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.isReceiving = true;

        // Call the service to receive the order
        this.orderService.receiveOrder(
          this.orderId,
          result.items,
          result.updatePrices
        ).subscribe({
          next: (updatedOrder) => {
            console.log('Order received successfully:', updatedOrder);
            this.order = updatedOrder;
            this.snackBar.open('Order received successfully', 'Close', {
              duration: 3000
            });
          },
          error: (err) => {
            console.error('Error receiving order:', err);

            let errorMessage = 'Failed to receive order. Please try again.';
            if (err.error && err.error.debugMessage) {
              errorMessage = err.error.debugMessage;
            } else if (err.error && err.error.message) {
              errorMessage = err.error.message;
            }

            this.snackBar.open(errorMessage, 'Close', {
              duration: 6000,
              panelClass: ['error-snackbar']
            });
          },
          complete: () => {
            this.isReceiving = false;
          }
        });
      }
    });
  }
  
  editOrder(): void {
    if (!this.order) return;
    
    // TODO: Implement edit order functionality
    this.snackBar.open('Edit order functionality will be implemented in a future phase', 'Close', {
      duration: 3000
    });
  }
  
  printOrder(): void {
    if (!this.order) return;
    
    // TODO: Implement print order functionality
    this.snackBar.open('Print order functionality will be implemented in a future phase', 'Close', {
      duration: 3000
    });
  }
  
  goBack(): void {
    this.router.navigate(['/orders']);
  }
  
  canSendOrder(): boolean {
    if (!this.order) return false;
    return ['DRAFT', 'CREATED', 'APPROVED'].includes(this.order.status.toUpperCase());
  }
  
  canReceiveOrder(): boolean {
    if (!this.order) return false;
    return ['DRAFT', 'SENT', 'VIEWED_BY_SUPPLIER', 'APPROVED'].includes(this.order.status.toUpperCase());
  }
  
  canEditOrder(): boolean {
    if (!this.order) return false;
    return ['DRAFT', 'CREATED'].includes(this.order.status.toUpperCase());
  }
}