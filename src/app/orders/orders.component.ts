import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';

import { OrderService } from '../services/order.service';
import { OrderSummary, OrderStatus } from '../models/OrderSummary';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

// Interface for date range options
interface DateRangeOption {
  label: string;
  startDate: Date;
  endDate: Date;
}

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatMenuModule,
    MatTooltipModule,
    MatChipsModule,
    MatDividerModule,
    MatDialogModule
  ],
  providers: [DatePipe],
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss']
})
export class OrdersComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = [
    'orderNumber', 
    'supplierName', 
    'buyerLocationName', 
    'sentDate', 
    'deliveryDate', 
    'total',
    'status',
    'actions'
  ];
  
  dataSource = new MatTableDataSource<OrderSummary>([]);
  
  // Filter properties
  orderNumberFilter: string = '';
  supplierNameFilter: string = '';
  locationNameFilter: string = '';
  statusFilter: string = '';
  
  startDate: Date | null = null;
  endDate: Date | null = null;
  selectedDateRange: string = '';
  
  // Status options
  orderStatuses: string[] = ['Draft', 'Pending', 'Sent', 'Partially Received', 'Received', 'Cancelled'];
  
  // Loading state
  isLoading = false;
  loadingError: string | null = null;
  
  // Pagination and sorting
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  
  // Pre-defined date ranges
  dateRangeOptions: DateRangeOption[] = [];
  
  // Filters panel visibility
  showFilters = false;

  constructor(
    private orderService: OrderService,
    private snackBar: MatSnackBar,
    private datePipe: DatePipe,
    private dialog: MatDialog,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.setupDateRanges();
    this.loadOrders();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    
    // Configure sorting accessor
    this.dataSource.sortingDataAccessor = (item: OrderSummary, property: string) => {
      switch(property) {
        case 'sentDate': return this.getSortableDate(item.sentDate);
        case 'deliveryDate': return this.getSortableDate(item.deliveryDate);
        case 'total': return item.total || 0;
        default: 
          const value = item[property as keyof OrderSummary];
          return value !== undefined && value !== null ? 
            (typeof value === 'string' || typeof value === 'number' ? value : String(value)) : 
            '';
      }
    };
  }

  private getSortableDate(dateStr?: string): number {
    if (!dateStr) return 0;
    return new Date(dateStr).getTime();
  }

  private setupDateRanges(): void {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    // Current month
    const currentMonthStart = new Date(currentYear, currentMonth, 1);
    const currentMonthEnd = new Date(currentYear, currentMonth + 1, 0);
    
    // Last month
    const lastMonthStart = new Date(currentYear, currentMonth - 1, 1);
    const lastMonthEnd = new Date(currentYear, currentMonth, 0);
    
    // Last 30 days
    const last30DaysStart = new Date();
    last30DaysStart.setDate(now.getDate() - 30);
    
    // Last 60 days
    const last60DaysStart = new Date();
    last60DaysStart.setDate(now.getDate() - 60);
    
    // Last 90 days
    const last90DaysStart = new Date();
    last90DaysStart.setDate(now.getDate() - 90);
    
    this.dateRangeOptions = [
      { label: 'Current Month', startDate: currentMonthStart, endDate: currentMonthEnd },
      { label: 'Last Month', startDate: lastMonthStart, endDate: lastMonthEnd },
      { label: 'Last 30 Days', startDate: last30DaysStart, endDate: now },
      { label: 'Last 60 Days', startDate: last60DaysStart, endDate: now },
      { label: 'Last 90 Days', startDate: last90DaysStart, endDate: now }
    ];
  }

  applyDateRange(option: DateRangeOption): void {
    this.startDate = option.startDate;
    this.endDate = option.endDate;
    this.selectedDateRange = option.label;
    this.loadOrders();
    this.showFilters = false;
  }

  confirmCustomDateRange(): void {
    if (!this.startDate || !this.endDate) {
      this.snackBar.open('Please select both start and end dates', 'Close', {
        duration: 3000
      });
      return;
    }
    
    if (this.endDate < this.startDate) {
      this.snackBar.open('End date cannot be before start date', 'Close', {
        duration: 3000
      });
      return;
    }
    
    this.selectedDateRange = 'Custom Range';
    this.loadOrders();
    this.showFilters = false;
  }

  clearDateFilter(): void {
    this.startDate = null;
    this.endDate = null;
    this.selectedDateRange = '';
    this.loadOrders();
  }

  loadOrders(): void {
    this.isLoading = true;
    this.loadingError = null;
    
    // Reset pagination when filters change
    if (this.paginator) {
      this.paginator.firstPage();
    }
    
    // Format dates for API using DatePipe
    let formattedStartDate: string | undefined = undefined;
    let formattedEndDate: string | undefined = undefined;
    
    if (this.startDate) {
      formattedStartDate = this.datePipe.transform(this.startDate, 'yyyy-MM-dd') || undefined;
    }
    
    if (this.endDate) {
      formattedEndDate = this.datePipe.transform(this.endDate, 'yyyy-MM-dd') || undefined;
    }
    
    this.orderService.getPurchaseOrders(formattedStartDate, formattedEndDate)
      .pipe(
        catchError(err => {
          console.error('Error loading orders:', err);
          this.loadingError = 'Failed to load orders. Please try again.';
          return of([]);
        }),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe(orders => {
        // Apply additional client-side filters
        let filteredOrders = orders;
        
        if (this.orderNumberFilter) {
          filteredOrders = filteredOrders.filter(o => 
            o.orderNumber.toLowerCase().includes(this.orderNumberFilter.toLowerCase()));
        }
        
        if (this.supplierNameFilter) {
          filteredOrders = filteredOrders.filter(o => 
            o.supplierName.toLowerCase().includes(this.supplierNameFilter.toLowerCase()));
        }
        
        if (this.locationNameFilter) {
          filteredOrders = filteredOrders.filter(o => 
            o.buyerLocationName.toLowerCase().includes(this.locationNameFilter.toLowerCase()));
        }
        
        if (this.statusFilter) {
          filteredOrders = filteredOrders.filter(o => 
            o.status.toLowerCase() === this.statusFilter.toLowerCase());
        }
        
        this.dataSource.data = filteredOrders;
        
        // If no records and we have a filter applied, show a specific message
        if (filteredOrders.length === 0 && this.hasAnyFilter()) {
          this.snackBar.open('No orders found matching the filters', 'Close', {
            duration: 3000
          });
        }
      });
  }

  hasAnyFilter(): boolean {
    return !!(
      this.orderNumberFilter || 
      this.supplierNameFilter || 
      this.locationNameFilter || 
      this.statusFilter || 
      this.selectedDateRange
    );
  }

  clearAllFilters(): void {
    this.orderNumberFilter = '';
    this.supplierNameFilter = '';
    this.locationNameFilter = '';
    this.statusFilter = '';
    this.startDate = null;
    this.endDate = null;
    this.selectedDateRange = '';
    this.loadOrders();
  }

  // Toggle the filters panel visibility
  toggleFiltersPanel(): void {
    this.showFilters = !this.showFilters;
  }

  // Format the currently selected date range for display
  getFormattedDateRange(): string {
    if (!this.startDate && !this.endDate) return '';
    
    let formattedRange = '';
    
    if (this.startDate) {
      formattedRange += this.datePipe.transform(this.startDate, 'MMM d, y');
    }
    
    formattedRange += ' - ';
    
    if (this.endDate) {
      formattedRange += this.datePipe.transform(this.endDate, 'MMM d, y');
    }
    
    return formattedRange;
  }

  // Status-related methods
  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'draft': return 'status-draft';
      case 'pending': return 'status-pending';
      case 'sent': return 'status-sent';
      case 'partially received': return 'status-partial';
      case 'received': return 'status-received';
      case 'cancelled': return 'status-cancelled';
      default: return '';
    }
  }

  // Actions
  viewOrderDetails(order: OrderSummary): void {
    // Navigate to order details page (to be implemented)
    // this.router.navigate(['/orders', order.id]);
    console.log('View order details:', order);
    this.snackBar.open('Order details view will be implemented in the next phase', 'Close', {
      duration: 3000
    });
  }

  createNewOrder(): void {
    // Navigate to create order page (to be implemented)
    // this.router.navigate(['/orders/create']);
    console.log('Create new order');
    this.snackBar.open('Create order functionality will be implemented in the next phase', 'Close', {
      duration: 3000
    });
  }

  receiveOrder(order: OrderSummary, event: Event): void {
    event.stopPropagation();
    console.log('Receive order:', order);
    this.snackBar.open('Receive order functionality will be implemented in the next phase', 'Close', {
      duration: 3000
    });
  }

  sendOrder(order: OrderSummary, event: Event): void {
    event.stopPropagation();
    console.log('Send order:', order);
    this.snackBar.open('Send order functionality will be implemented in the next phase', 'Close', {
      duration: 3000
    });
  }

  cancelOrder(order: OrderSummary, event: Event): void {
    event.stopPropagation();
    console.log('Cancel order:', order);
    this.snackBar.open('Cancel order functionality will be implemented in the next phase', 'Close', {
      duration: 3000
    });
  }

  createOrderWithoutReceiving(): void {
    console.log('Create order without receiving (receive without order)');
    this.snackBar.open('Receive without order functionality will be implemented in the next phase', 'Close', {
      duration: 3000
    });
  }

  checkPendingOrders(): void {
    console.log('Check pending orders');
    this.snackBar.open('Check pending orders functionality will be implemented in the next phase', 'Close', {
      duration: 3000
    });
  }
}