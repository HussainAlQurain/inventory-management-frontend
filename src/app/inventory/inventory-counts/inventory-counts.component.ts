import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
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

import { InventoryCountService } from '../../services/inventory-count.service';
import { LocationService } from '../../services/location.service';
import { InventoryCountSession } from '../../models/InventoryCountSession';
import { Location } from '../../models/Location';
import { MatDividerModule } from '@angular/material/divider';

// Interface for date range options
interface DateRangeOption {
  label: string;
  startDate: Date;
  endDate: Date;
}

@Component({
  selector: 'app-inventory-counts',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
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
    MatDividerModule
  ],
  providers: [DatePipe],
  templateUrl: './inventory-counts.component.html',
  styleUrls: ['./inventory-counts.component.scss']
})
export class InventoryCountsComponent implements OnInit {
  displayedColumns: string[] = ['countDate', 'location', 'value', 'description', 'locked', 'actions'];
  dataSource = new MatTableDataSource<InventoryCountSession>([]);
  
  // Filter properties
  locations: Location[] = [];
  selectedLocationId: number | null = null;
  startDate: Date | null = null;
  endDate: Date | null = null;
  selectedDateRange: string = '';
  
  // Loading state
  isLoading = false;
  loadingError: string | null = null;
  
  // Pagination and sorting
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  
  // Pre-defined date ranges
  dateRangeOptions: DateRangeOption[] = [];

  constructor(
    private inventoryCountService: InventoryCountService,
    private locationService: LocationService,
    private snackBar: MatSnackBar,
    private datePipe: DatePipe
  ) { }

  ngOnInit(): void {
    this.loadLocations();
    this.setupDateRanges();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  private loadLocations(): void {
    this.locationService.getAllLocations().subscribe({
      next: (locations) => {
        this.locations = locations;
        // If locations were loaded, select the first one and load data
        if (this.locations.length > 0) {
          this.selectedLocationId = this.locations[0].id || null;
          this.loadInventoryCounts();
        }
      },
      error: (err) => {
        console.error('Error loading locations:', err);
        this.loadingError = 'Failed to load locations. Please try again.';
      }
    });
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
    
    // Current year
    const currentYearStart = new Date(currentYear, 0, 1);
    const currentYearEnd = new Date(currentYear, 11, 31);
    
    // Last year
    const lastYearStart = new Date(currentYear - 1, 0, 1);
    const lastYearEnd = new Date(currentYear - 1, 11, 31);
    
    this.dateRangeOptions = [
      { label: 'Current Month', startDate: currentMonthStart, endDate: currentMonthEnd },
      { label: 'Last Month', startDate: lastMonthStart, endDate: lastMonthEnd },
      { label: 'Current Year', startDate: currentYearStart, endDate: currentYearEnd },
      { label: 'Last Year', startDate: lastYearStart, endDate: lastYearEnd }
    ];
  }

  onLocationChange(): void {
    this.loadInventoryCounts();
  }

  applyDateRange(option: DateRangeOption): void {
    this.startDate = option.startDate;
    this.endDate = option.endDate;
    this.selectedDateRange = option.label;
    this.loadInventoryCounts();
  }

  confirmCustomDateRange(): void {
    if (!this.startDate || !this.endDate) {
      this.snackBar.open('Please select both start and end dates', 'Close', {
        duration: 3000
      });
      return;
    }
    
    this.selectedDateRange = 'Custom Range';
    this.loadInventoryCounts();
  }

  clearDateFilter(): void {
    this.startDate = null;
    this.endDate = null;
    this.selectedDateRange = '';
    this.loadInventoryCounts();
  }

  loadInventoryCounts(): void {
    if (!this.selectedLocationId) return;
    
    this.isLoading = true;
    this.loadingError = null;
    
    // Format dates for API using DatePipe instead of date-fns
    let formattedStartDate: string | undefined = undefined;
    let formattedEndDate: string | undefined = undefined;
    
    if (this.startDate) {
      formattedStartDate = this.datePipe.transform(this.startDate, 'yyyy-MM-dd') || undefined;
    }
    
    if (this.endDate) {
      formattedEndDate = this.datePipe.transform(this.endDate, 'yyyy-MM-dd') || undefined;
    }
    
    this.inventoryCountService.getInventoryCountSessions(
      this.selectedLocationId,
      formattedStartDate,
      formattedEndDate
    ).subscribe({
      next: (sessions) => {
        this.dataSource.data = sessions;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading inventory counts:', err);
        this.loadingError = 'Failed to load inventory counts. Please try again.';
        this.isLoading = false;
      }
    });
  }

  formatCountDate(countDate: string, dayPart: string): string {
    const date = new Date(countDate);
    const formattedDate = this.datePipe.transform(date, 'yyyy MMM dd');
    return `${formattedDate}, ${dayPart}`;
  }

  addNewCountSession(): void {
    // TODO: Implement functionality to add new inventory count session
    this.snackBar.open('Add inventory count session functionality will be implemented later', 'Close', {
      duration: 3000
    });
  }

  viewCountDetails(countSession: InventoryCountSession): void {
    // TODO: Implement functionality to view count details
    this.snackBar.open(`Viewing details for count session #${countSession.id}`, 'Close', {
      duration: 3000
    });
  }
}
