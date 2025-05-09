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
import { SupplierService } from '../services/supplier.service'; // Ensure this is imported
import { LocationService } from '../services/location.service'; // Ensure this is imported
import { OrderSummary, OrderStatus } from '../models/OrderSummary';
import { Supplier } from '../models/Supplier';
import { Location } from '../models/Location';
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
    'createdBy',
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
  
  selectedSupplier: Supplier | null = null;
  selectedLocation: Location | null = null;
  availableSuppliers: Supplier[] = [];
  availableLocations: Location[] = [];
  
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

  // Pagination and sorting properties
  totalItems = 0;
  isServerSide = true;
  currentPage = 0;
  pageSize = 10;
  sortField = 'creationDate';
  sortDirection = 'desc';

  constructor(
    private orderService: OrderService,
    private supplierService: SupplierService, // Make sure this is injected
    private locationService: LocationService, // Make sure this is injected
    private snackBar: MatSnackBar,
    private datePipe: DatePipe,
    private dialog: MatDialog,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.setupDateRanges();
    this.loadSuppliers();
    this.loadLocations();
    this.loadPaginatedOrders();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    
    // Listen for paginator events
    this.paginator.page.subscribe(() => {
      this.currentPage = this.paginator.pageIndex;
      this.pageSize = this.paginator.pageSize;
      this.loadPaginatedOrders();
    });
    
    // Listen for sort events
    this.sort.sortChange.subscribe(() => {
      this.sortField = this.sort.active;
      this.sortDirection = this.sort.direction;
      this.paginator.pageIndex = 0; // Reset to first page when sorting changes
      this.currentPage = 0;
      this.loadPaginatedOrders();
    });
    
    // Initial load
    this.loadPaginatedOrders();
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
    this.selectedDateRange = 'Custom';
    
    // Reset pagination to first page
    if (this.paginator) {
      this.paginator.pageIndex = 0;
      this.currentPage = 0;
    }
    
    this.loadPaginatedOrders();
    this.showFilters = false;
  }

  clearDateFilter(): void {
    this.startDate = null;
    this.endDate = null;
    this.selectedDateRange = '';
    
    // Reset pagination to first page
    if (this.paginator) {
      this.paginator.pageIndex = 0;
      this.currentPage = 0;
    }
    
    this.loadPaginatedOrders();
  }

  clearAllFilters(): void {
    this.orderNumberFilter = '';
    this.supplierNameFilter = '';
    this.locationNameFilter = '';
    this.statusFilter = '';
    this.startDate = null;
    this.endDate = null;
    this.selectedDateRange = '';
    this.selectedSupplier = null;
    this.selectedLocation = null;
    
    // Reset pagination to first page
    if (this.paginator) {
      this.paginator.pageIndex = 0;
      this.currentPage = 0;
    }
    
    this.loadPaginatedOrders();
  }

  loadOrders(): void {
    // Reset to first page when filters change
    if (this.paginator) {
      this.paginator.pageIndex = 0;
      this.currentPage = 0;
    }
    
    this.loadPaginatedOrders();
  }

  loadPaginatedOrders(): void {
    this.isLoading = true;
    this.loadingError = null;
    
    // Format dates for API
    let formattedStartDate: string | undefined = undefined;
    let formattedEndDate: string | undefined = undefined;
    
    if (this.startDate) {
      formattedStartDate = this.datePipe.transform(this.startDate, 'yyyy-MM-dd') || undefined;
    }
    
    if (this.endDate) {
      formattedEndDate = this.datePipe.transform(this.endDate, 'yyyy-MM-dd') || undefined;
    }
    
    // Determine supplier, location, and status filters
    const supplierIdFilter = this.selectedSupplier?.id;
    const locationIdFilter = this.selectedLocation?.id;
    const statusFilter = this.statusFilter ? this.statusFilter.toUpperCase() : undefined;
    
    // Create sort string (field,direction)
    const sortString = this.sortField && this.sortDirection 
      ? `${this.sortField},${this.sortDirection}`
      : undefined;
    
    this.orderService.getPaginatedPurchaseOrders(
      this.currentPage,
      this.pageSize,
      sortString,
      formattedStartDate,
      formattedEndDate,
      supplierIdFilter,
      locationIdFilter,
      statusFilter
    ).pipe(
      finalize(() => {
        this.isLoading = false;
      }),
      catchError(err => {
        console.error('Error loading orders:', err);
        this.loadingError = 'Failed to load orders. Please try again.';
        return of({
          content: [],
          totalElements: 0,
          totalPages: 0,
          currentPage: 0,
          pageSize: this.pageSize,
          hasNext: false,
          hasPrevious: false
        });
      })
    ).subscribe(response => {
      // Update data source with paginated content
      this.dataSource.data = response.content;
      
      // Update paginator values
      this.totalItems = response.totalElements;
      
      // Apply additional client-side filtering for order number, supplier name, location name
      // (if these filters are not already handled by the server)
      if (this.orderNumberFilter || this.supplierNameFilter || this.locationNameFilter) {
        this.applyClientSideFilters();
      }
    });
  }

  loadSuppliers(searchTerm: string = ''): void {
    this.supplierService.getPaginatedSuppliers(0, 100, 'name,asc', searchTerm)
      .subscribe({
        next: (response) => {
          this.availableSuppliers = response.content;
        },
        error: (err) => {
          console.error('Error loading suppliers', err);
        }
      });
  }

  loadLocations(searchTerm: string = ''): void {
    this.locationService.getPaginatedLocations(0, 100, 'name,asc', searchTerm)
      .subscribe({
        next: (response) => {
          this.availableLocations = response.content;
        },
        error: (err) => {
          console.error('Error loading locations', err);
        }
      });
  }

  applyClientSideFilters(): void {
    if (this.orderNumberFilter || this.supplierNameFilter || this.locationNameFilter) {
      let filteredData = [...this.dataSource.data];
      
      if (this.orderNumberFilter) {
        filteredData = filteredData.filter(o => 
          o.orderNumber.toLowerCase().includes(this.orderNumberFilter.toLowerCase()));
      }
      
      if (this.supplierNameFilter) {
        filteredData = filteredData.filter(o => 
          o.supplierName.toLowerCase().includes(this.supplierNameFilter.toLowerCase()));
      }
      
      if (this.locationNameFilter) {
        filteredData = filteredData.filter(o => 
          o.buyerLocationName.toLowerCase().includes(this.locationNameFilter.toLowerCase()));
      }
      
      this.dataSource.data = filteredData;
    }
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
    // Navigate to order details page
    const orderId = order.id || order.orderId;
    if (orderId) {
      this.router.navigate(['/orders', orderId]);
    } else {
      this.snackBar.open('Cannot view order: Missing order ID', 'Close', {
        duration: 3000
      });
    }
  }

  createNewOrder(): void {
    this.router.navigate(['/orders/create']);
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

  // When selecting a supplier
  onSupplierSelected(): void {
    if (this.selectedSupplier && this.selectedSupplier.id) {
      // Do something with the supplier ID
      console.log('Selected supplier ID:', this.selectedSupplier.id);
      this.loadOrders();
    }
  }

  // When selecting a location
  onLocationSelected(): void {
    if (this.selectedLocation && this.selectedLocation.id) {
      // Do something with the location ID
      console.log('Selected location ID:', this.selectedLocation.id);
      this.loadOrders();
    }
  }
}