import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
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
    MatDialogModule
  ],
  templateUrl: './transfer-completed.component.html',
  styleUrls: ['./transfer-completed.component.scss']
})
export class TransferCompletedComponent implements OnInit {
  displayedColumns: string[] = ['id', 'completionDate', 'fromLocation', 'toLocation', 'itemCount', 'actions'];
  dataSource = new MatTableDataSource<Transfer>();
  
  loading = false;
  error = '';
  
  locations: Location[] = [];
  selectedLocation: number | null = null;
  fromLocation: boolean = true;
  companyId: number | null = null;
  
  constructor(
    private transferService: TransferService,
    private locationService: LocationService,
    private companiesService: CompaniesService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loading = true;
    
    // Get company ID from companies service
    this.companyId = this.companiesService.getSelectedCompanyId();
    
    if (this.companyId) {
      // Load company-wide completed transfers initially
      this.loadCompanyCompletedTransfers();
    } else {
      this.error = 'Company ID not found';
      this.loading = false;
    }
    
    // Load locations for the filter dropdown
    this.locationService.getAllLocations().subscribe({
      next: (locations) => {
        this.locations = locations;
      },
      error: (err: HttpErrorResponse) => {
        console.error('Failed to load locations:', err);
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

  onLocationChange(): void {
    if (this.selectedLocation) {
      this.loadLocationCompletedTransfers();
    } else {
      this.loadCompanyCompletedTransfers();
    }
  }

  onDirectionChange(): void {
    if (this.selectedLocation) {
      this.loadLocationCompletedTransfers();
    }
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
