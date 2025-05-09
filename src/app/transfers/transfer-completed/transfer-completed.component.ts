import { Component, OnInit, ViewChild } from '@angular/core';
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
import { MatAutocompleteModule } from '@angular/material/autocomplete';

@Component({
  selector: 'app-transfer-completed',
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
  templateUrl: './transfer-completed.component.html',
  styleUrls: ['./transfer-completed.component.scss']
})
export class TransferCompletedComponent implements OnInit {
  displayedColumns: string[] = ['id', 'completionDate', 'fromLocation', 'toLocation', 'itemCount', 'actions'];
  dataSource = new MatTableDataSource<Transfer>();

  /* ───── request / UI state ─────────────────────────── */
  loading = false;
  error = '';

  /* ───── filters & pagination ───────────────────────── */
  companyId: number | null = null;

  searchTerm = '';           // text search
  selectedLocation: number | null = null;
  fromLocation: boolean = true;  // Direction filter for completed transfers

  totalItems = 0;            // paginator
  pageSize = 10;
  currentPage = 0;

  /* location drop-down (with live search) */
  locationSearchTerm = '';
  locations: Location[] = [];
  filteredLocations: Location[] = [];

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
  ) {}

  ngOnInit(): void {
    this.companyId = this.companiesService.getSelectedCompanyId();

    if (!this.companyId) {
      this.error = 'Company ID not found';
      return;
    }

    /* preload first page of data & first 100 locations */
    this.loadCompletedTransfers();
    this.loadLocationsWithSearch('');
  }

  ngAfterViewInit(): void {
    /* Only subscribe to paginator events if it's defined */
    if (this.paginator) {
      /* paginator events (page change or page-size change) */
      this.paginator.page.subscribe((e: PageEvent) => {
        this.currentPage = e.pageIndex;
        this.pageSize = e.pageSize;
        this.loadCompletedTransfers();
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
        this.loadCompletedTransfers();
      });
    }
  }

  onLocationSearchChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.locationSearchTerm = value;
    this.loadLocationsWithSearch(value);
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
    this.loadCompletedTransfers();
  }

  onDirectionChange(): void {
    this.currentPage = 0;
    if (this.paginator) {
      this.paginator.pageIndex = 0;
    }
    this.loadCompletedTransfers();
  }

  onSearchChange(): void {
    this.currentPage = 0;
    if (this.paginator) {
      this.paginator.pageIndex = 0;
    }
    this.loadCompletedTransfers();
  }

  loadCompletedTransfers(): void {
    if (!this.companyId) return;
  
    this.loading = true;
  
    /* build "field,dir" sort string if the user clicked a header */
    let sortString = 'completionDate,desc';          // default
    if (this.sort?.active && this.sort.direction) {
      sortString = `${this.sort.active},${this.sort.direction}`;
    }
  
    this.transferService.getPaginatedCompletedTransfers(
        this.companyId,
        this.currentPage,
        this.pageSize,
        this.searchTerm.trim() || undefined,
        sortString,
        this.selectedLocation || undefined,
        this.fromLocation
    ).subscribe({
      next : resp => {
        this.dataSource.data = resp.content;
        this.totalItems      = resp.totalElements;
        this.loading         = false;
      },
      error: err => {
        console.error('Failed to load completed transfers', err);
        this.error   = 'Failed to load completed transfers';
        this.loading = false;
      }
    });
  }

  loadCompanyCompletedTransfers(): void {
    if (!this.companyId) {
      this.error = 'Company ID not found';
      this.loading = false;
      return;
    }
    
    this.loading = true;
    this.transferService.getCompanyCompletedTransfers(this.companyId).subscribe({
      next: (transfers: Transfer[]) => {
        this.dataSource.data = transfers;
        this.loading = false;
      },
      error: (err: HttpErrorResponse) => {
        console.error('Failed to load completed transfers:', err);
        this.error = 'Failed to load completed transfers';
        this.loading = false;
      }
    });
  }

  loadLocationCompletedTransfers(): void {
    if (!this.selectedLocation) {
      this.loadCompanyCompletedTransfers();
      return;
    }
    
    this.loading = true;
    this.transferService.getLocationCompletedTransfers(this.selectedLocation, this.fromLocation).subscribe({
      next: (transfers: Transfer[]) => {
        this.dataSource.data = transfers;
        this.loading = false;
      },
      error: (err: HttpErrorResponse) => {
        console.error(`Failed to load completed transfers for location ${this.selectedLocation}:`, err);
        this.error = 'Failed to load location completed transfers';
        this.loading = false;
      }
    });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  viewTransferDetails(transfer: Transfer): void {
    const isOutgoing = transfer.fromLocationId === this.selectedLocation;
    
    const dialogRef = this.dialog.open(TransferDetailsComponent, {
      width: '800px',
      data: {
        transferId: transfer.id,
        isIncoming: !isOutgoing
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'updated' || result === 'deleted') {
        this.onLocationChange(); // Reload data
      }
    });
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
    
    switch(status.toLowerCase()) {
      case 'pending': return 'status-pending';
      case 'completed': return 'status-completed';
      case 'cancelled': return 'status-cancelled';
      default: return '';
    }
  }

  getTotalCost(transfer: Transfer): number {
    return transfer.lines?.reduce((total, line) => total + (line.totalCost || 0), 0) || 0;
  }
}
