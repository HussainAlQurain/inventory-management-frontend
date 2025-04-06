import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
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

import { InventoryCountService } from '../../services/inventory-count.service';
import { LocationService } from '../../services/location.service';
import { InventoryCountSession, DayPart } from '../../models/InventoryCountSession';
import { Location } from '../../models/Location';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { CreateCountSessionComponent } from './create-count-session/create-count-session.component';

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
    MatDividerModule,
    MatDialogModule
  ],
  providers: [DatePipe],
  templateUrl: './inventory-counts.component.html',
  styleUrls: ['./inventory-counts.component.scss']
})
export class InventoryCountsComponent implements OnInit, AfterViewInit {
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

  // Filters panel visibility
  showFilters = false;

  constructor(
    private inventoryCountService: InventoryCountService,
    private locationService: LocationService,
    private snackBar: MatSnackBar,
    private datePipe: DatePipe,
    private dialog: MatDialog,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.setupDateRanges();
    this.loadLocations();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    
    // Fix the type error in the sortingDataAccessor function
    this.dataSource.sortingDataAccessor = (item: InventoryCountSession, property: string): string | number => {
      switch (property) {
        case 'countDate': return new Date(item.countDate).getTime();
        case 'value': return item.valueOfCount || 0;
        case 'locked': return item.locked ? 1 : 0; // Convert boolean to number for sorting
        default: 
          // Ensure we always return string or number, not undefined
          const value = item[property as keyof InventoryCountSession];
          return value !== undefined && value !== null ? 
            (typeof value === 'string' || typeof value === 'number' ? value : String(value)) : 
            '';
      }
    };
  }

  private loadLocations(): void {
    this.isLoading = true;
    
    this.locationService.getAllLocations()
      .pipe(
        catchError(err => {
          console.error('Error loading locations:', err);
          this.loadingError = 'Failed to load locations. Please try again.';
          return of([]);
        }),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe(locations => {
        this.locations = locations;
        
        // If locations were loaded, select the first one and load data
        if (this.locations.length > 0) {
          this.selectedLocationId = this.locations[0].id || null;
          
          // Apply default date range (Current Month)
          if (this.dateRangeOptions.length > 0) {
            this.applyDateRange(this.dateRangeOptions[0]);
          } else {
            this.loadInventoryCounts();
          }
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
    // Auto-collapse filters after selection
    this.showFilters = false;
  }

  applyDateRange(option: DateRangeOption): void {
    this.startDate = option.startDate;
    this.endDate = option.endDate;
    this.selectedDateRange = option.label;
    this.loadInventoryCounts();
    // Auto-collapse filters after selection
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
    this.loadInventoryCounts();
    // Auto-collapse filters after selection
    this.showFilters = false;
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
    
    this.inventoryCountService.getInventoryCountSessions(
      this.selectedLocationId,
      formattedStartDate,
      formattedEndDate
    )
    .pipe(
      catchError(err => {
        console.error('Error loading inventory counts:', err);
        this.loadingError = 'Failed to load inventory counts. Please try again.';
        return of([]);
      }),
      finalize(() => {
        this.isLoading = false;
      })
    )
    .subscribe(sessions => {
      // Ensure all sessions have a locked property (default to false if not provided)
      sessions.forEach(session => {
        session.locked = session.locked ?? false;
      });
      
      this.dataSource.data = sessions;
      
      // If no records and we have a filter applied, show a specific message
      if (sessions.length === 0 && this.selectedDateRange) {
        this.snackBar.open(`No inventory counts found for ${this.selectedDateRange}`, 'Close', {
          duration: 3000
        });
      }
    });
  }

  formatCountDate(countDate: string, dayPart: string): string {
    try {
      const date = new Date(countDate);
      const formattedDate = this.datePipe.transform(date, 'yyyy MMM dd');
      return `${formattedDate}, ${dayPart}`;
    } catch (error) {
      return `${countDate}, ${dayPart}`;
    }
  }

  addNewCountSession(): void {
    const dialogRef = this.dialog.open(CreateCountSessionComponent, {
      width: '600px',
      data: { 
        locations: this.locations,
        selectedLocationId: this.selectedLocationId 
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.isLoading = true;
        
        // Format date for API
        const formattedDate = this.datePipe.transform(result.countDate, 'yyyy-MM-dd');
        
        const newSession: Partial<InventoryCountSession> = {
          countDate: formattedDate || '',
          dayPart: result.dayPart,
          description: result.description,
          locationId: result.locationId,
          locked: false
        };
        
        this.inventoryCountService.createInventoryCountSession(result.locationId, newSession)
          .pipe(
            catchError(err => {
              console.error('Error creating inventory count session:', err);
              this.snackBar.open('Failed to create inventory count session. Please try again.', 'Close', {
                duration: 5000
              });
              return of(null);
            }),
            finalize(() => {
              this.isLoading = false;
            })
          )
          .subscribe(session => {
            if (session) {
              this.snackBar.open('Inventory count session created successfully!', 'Close', {
                duration: 3000
              });
              
              // Navigate to the edit page for the new session
              this.router.navigate(['/inventory/counts/edit', result.locationId, session.id]);
            }
          });
      }
    });
  }

  viewCountDetails(countSession: InventoryCountSession): void {
    if (!this.selectedLocationId || !countSession.id) return;
    
    this.router.navigate(['/inventory/counts/edit', this.selectedLocationId, countSession.id]);
  }

  // Toggle the filters panel visibility
  toggleFiltersPanel(): void {
    this.showFilters = !this.showFilters;
  }

  // Get the name of the selected location
  getSelectedLocationName(): string {
    if (!this.selectedLocationId) return '';
    const location = this.locations.find(loc => loc.id === this.selectedLocationId);
    return location ? location.name : '';
  }

  // Format the currently selected date range for display in the summary
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
  
  // Lock an inventory count session
  lockCountSession(session: InventoryCountSession, event: Event): void {
    event.stopPropagation(); // Prevent row click event
    
    if (!this.selectedLocationId || !session.id) return;
    
    this.isLoading = true;
    
    this.inventoryCountService.lockInventoryCountSession(this.selectedLocationId, session.id)
      .pipe(
        catchError(err => {
          console.error('Error locking inventory count session:', err);
          this.snackBar.open('Failed to lock inventory count session. Please try again.', 'Close', {
            duration: 5000
          });
          return of(null);
        }),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe(result => {
        if (result) {
          // Update the session in the data source
          const updatedSessions = this.dataSource.data.map(s => 
            s.id === session.id ? { ...s, locked: true, lockedDate: result.lockedDate } : s
          );
          this.dataSource.data = updatedSessions;
          
          this.snackBar.open('Inventory count session locked successfully!', 'Close', {
            duration: 3000
          });
        }
      });
  }
  
  // Unlock an inventory count session
  unlockCountSession(session: InventoryCountSession, event: Event): void {
    event.stopPropagation(); // Prevent row click event
    
    if (!this.selectedLocationId || !session.id) return;
    
    this.isLoading = true;
    
    this.inventoryCountService.unlockInventoryCountSession(this.selectedLocationId, session.id)
      .pipe(
        catchError(err => {
          console.error('Error unlocking inventory count session:', err);
          this.snackBar.open('Failed to unlock inventory count session. Please try again.', 'Close', {
            duration: 5000
          });
          return of(null);
        }),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe(result => {
        if (result) {
          // Update the session in the data source
          const updatedSessions = this.dataSource.data.map(s => 
            s.id === session.id ? { ...s, locked: false, lockedDate: undefined } : s
          );
          this.dataSource.data = updatedSessions;
          
          this.snackBar.open('Inventory count session unlocked successfully!', 'Close', {
            duration: 3000
          });
        }
      });
  }
}
