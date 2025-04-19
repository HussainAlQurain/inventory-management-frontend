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
import { Observable } from 'rxjs';

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
    MatDialogModule
  ],
  templateUrl: './transfer-outgoing.component.html',
  styleUrls: ['./transfer-outgoing.component.scss']
})
export class TransferOutgoingComponent implements OnInit {
  displayedColumns: string[] = ['id', 'creationDate', 'toLocation', 'status', 'itemCount', 'actions'];
  dataSource = new MatTableDataSource<Transfer>();
  
  loading = false;
  error = '';
  
  locations: Location[] = [];
  selectedLocation: number | null = null;
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
      // Load company-wide outgoing transfers initially
      this.loadCompanyOutgoingTransfers();
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

  onLocationChange(): void {
    if (this.selectedLocation) {
      this.loadLocationOutgoingTransfers(this.selectedLocation);
    } else {
      this.loadCompanyOutgoingTransfers();
    }
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
    
    switch(status.toLowerCase()) {
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