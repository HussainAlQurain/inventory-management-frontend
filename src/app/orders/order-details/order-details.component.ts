import { Component, OnInit, NgZone } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router } from '@angular/router';
import { OrderService } from '../../services/order.service';
import { InventoryItemsService } from '../../services/inventory-items-service.service';
import { OrderSummary } from '../../models/OrderSummary';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { switchMap, catchError, finalize, map, forkJoin, of } from 'rxjs';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

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
    MatDialogModule
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
    
    // TODO: Implement receive order functionality with dialog
    this.snackBar.open('Receive order functionality will be implemented in the next phase', 'Close', {
      duration: 3000
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
    return ['DRAFT', 'CREATED'].includes(this.order.status.toUpperCase());
  }
  
  canReceiveOrder(): boolean {
    if (!this.order) return false;
    return ['SENT', 'VIEWED_BY_SUPPLIER', 'DELIVERED'].includes(this.order.status.toUpperCase());
  }
  
  canEditOrder(): boolean {
    if (!this.order) return false;
    return ['DRAFT', 'CREATED'].includes(this.order.status.toUpperCase());
  }
}