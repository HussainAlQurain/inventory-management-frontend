import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { TransferService } from '../../services/transfer.service';
import { Transfer } from '../../models/Transfer';
import { Location } from '../../models/Location';
import { LocationService } from '../../services/location.service';
import { TransferDetailsComponent } from '../transfer-details/transfer-details.component';
import { CompaniesService } from '../../services/companies.service';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { MatAutocompleteModule } from '@angular/material/autocomplete';

@Component({
  selector: 'app-transfer-outgoing',
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
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    MatAutocompleteModule
  ],
  templateUrl: './transfer-outgoing.component.html',
  styleUrls: ['./transfer-outgoing.component.scss']
})
export class TransferOutgoingComponent implements OnInit, OnDestroy {
  displayedColumns: string[] = [
    'id', 'creationDate', 'toLocation', 'status', 'itemCount', 'actions'
  ];
  dataSource = new MatTableDataSource<Transfer>();

  /* ───── request / UI state ─────────────────────────── */
  loading = false;
  error = '';

  /* ───── filters & pagination ───────────────────────── */
  companyId: number | null = null;

  searchTerm = '';           // text search
  selectedLocation: number | null = null;

  totalItems = 0;            // paginator
  pageSize = 10;
  currentPage = 0;

  /* location drop-down (with live search) */
  locationSearchTerm = '';
  locations: Location[] = [];
  filteredLocations: Location[] = [];
  
  // Subjects for debounced search - made public for template access
  public locationSearchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  /* ───── material helpers ───────────────────────────── */
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private transferService: TransferService,
    private locationService: LocationService,
    private companiesService: CompaniesService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) { 
    // Setup debounced search for locations
    this.locationSearchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(term => {
      this.loadLocationsWithSearch(term);
    });
  }

  ngOnInit(): void {
    this.companyId = this.companiesService.getSelectedCompanyId();

    if (!this.companyId) {
      this.error = 'Company ID not found';
      return;
    }

    /* preload first page of data & first 100 locations */
    this.loadOutgoingTransfers();
    this.loadLocationsWithSearch('');
  }
  
  ngOnDestroy(): void {
    // Clean up subscriptions
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewInit(): void {
    /* Only subscribe to paginator events if it's defined */
    if (this.paginator) {
      /* paginator events (page change or page-size change) */
      this.paginator.page.subscribe((e: PageEvent) => {
        this.currentPage = e.pageIndex;
        this.pageSize = e.pageSize;
        this.loadOutgoingTransfers();
      });
    }

    /* Only subscribe to sort events if it's defined */
    if (this.sort) {
      /* sort events */
      this.sort.sortChange.subscribe(() => {
        this.currentPage = 0;
        if (this.paginator) {
          this.paginator.pageIndex = 0;
        }
        this.loadOutgoingTransfers();
      });
    }
  }

  onLocationSearchChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.locationSearchTerm = value;
    this.locationSearchSubject.next(value);
  }
  
  loadLocationsWithSearch(term: string): void {
    if (!this.companyId) return;
  
    this.locationService.getPaginatedLocations(
        0, 20, 'name,asc', term)
      .subscribe({
        next : res => this.filteredLocations = res.content,
        error: err => console.error('Failed to load locations', err)
      });
  }
  
  onLocationChange(): void {
    this.currentPage = 0;
    if (this.paginator) {
      this.paginator.pageIndex = 0;
    }
    this.loadOutgoingTransfers();
  }

  onSearchChange(): void {
    this.currentPage = 0;
    if (this.paginator) {
      this.paginator.pageIndex = 0;
    }
    this.loadOutgoingTransfers();
  }

  loadOutgoingTransfers(): void {
    if (!this.companyId) return;
  
    this.loading = true;
  
    /* build "field,dir" sort string if the user clicked a header */
    let sortString = 'creationDate,desc';          // default
    if (this.sort?.active && this.sort.direction) {
      sortString = `${this.sort.active},${this.sort.direction}`;
    }
  
    this.transferService.getPaginatedOutgoingTransfers(
        this.companyId,
        this.currentPage,
        this.pageSize,
        this.searchTerm.trim() || undefined,
        sortString,
        this.selectedLocation || undefined
    ).subscribe({
      next : resp => {
        this.dataSource.data = resp.content;
        this.totalItems      = resp.totalElements;
        this.loading         = false;
      },
      error: err => {
        console.error('Failed to load outgoing transfers', err);
        this.error   = 'Failed to load outgoing transfers';
        this.loading = false;
      }
    });
  }
  
  loadCompanyOutgoingTransfers(): void {
    if (!this.companyId) {
      this.error = 'Company ID not found';
      this.loading = false;
      return;
    }

    this.loading = true;
    // Use type assertion to fix runtime error
    (this.transferService as any).getCompanyOutgoingTransfers(this.companyId).subscribe({
      next: (transfers: Transfer[]) => {
        this.dataSource.data = transfers;
        this.loading = false;
      },
      error: (err: HttpErrorResponse) => {
        console.error('Failed to load outgoing transfers:', err);
        this.error = 'Failed to load outgoing transfers';
        this.loading = false;
      }
    });
  }

  loadLocationOutgoingTransfers(locationId: number): void {
    this.loading = true;
    // Use type assertion to fix runtime error
    (this.transferService as any).getOutgoingTransfers(locationId).subscribe({
      next: (transfers: Transfer[]) => {
        this.dataSource.data = transfers;
        this.loading = false;
      },
      error: (err: HttpErrorResponse) => {
        console.error(`Failed to load outgoing transfers for location ${locationId}:`, err);
        this.error = 'Failed to load location outgoing transfers';
        this.loading = false;
      }
    });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  viewTransferDetails(transfer: Transfer): void {
    const dialogRef = this.dialog.open(TransferDetailsComponent, {
      width: '800px',
      data: {
        transferId: transfer.id,
        isIncoming: false
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'completed' || result === 'updated' || result === 'deleted') {
        this.onLocationChange(); // Reload data
      }
    });
  }

  deleteTransfer(transfer: Transfer, event: Event): void {
    event.stopPropagation(); // Prevent row click event

    if (confirm(`Are you sure you want to delete transfer #${transfer.id}?`)) {
      this.transferService.deleteTransfer(transfer.id!).subscribe({
        next: () => {
          this.snackBar.open('Transfer deleted successfully', 'Close', { duration: 3000 });
          this.onLocationChange(); // Reload data
        },
        error: (err: HttpErrorResponse) => {
          console.error('Failed to delete transfer:', err);
          this.snackBar.open('Failed to delete transfer', 'Close', { duration: 3000 });
        }
      });
    }
  }

  getItemCount(transfer: Transfer): number {
    return transfer.lines?.length || 0;
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  }

  getStatusClass(status: string | undefined): string {
    if (!status) return '';

    switch (status.toLowerCase()) {
      case 'pending': return 'status-pending';
      case 'completed': return 'status-completed';
      case 'cancelled': return 'status-cancelled';
      default: return '';
    }
  }

  createTransfer(): void {
    this.router.navigate(['/transfers/create']);
  }
}