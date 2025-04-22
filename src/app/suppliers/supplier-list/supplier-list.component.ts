import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

import { Supplier } from '../../models/Supplier';
import { SupplierService } from '../../services/supplier.service';
import { SupplierDialogComponent } from '../supplier-dialog/supplier-dialog.component';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-supplier-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatMenuModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './supplier-list.component.html',
  styleUrls: ['./supplier-list.component.scss']
})
export class SupplierListComponent implements OnInit {
  displayedColumns: string[] = ['name', 'customerNumber', 'address', 'defaultContact', 'minimumOrder', 'actions'];
  suppliers: Supplier[] = [];
  filteredSuppliers: Supplier[] = [];
  isLoading = true;
  searchQuery = '';
  private searchSubject = new Subject<string>();

  constructor(
    private supplierService: SupplierService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadSuppliers();
    this.setupSearch();
  }

  loadSuppliers(): void {
    this.isLoading = true;
    this.supplierService.getAllSuppliers().subscribe({
      next: (suppliers) => {
        this.suppliers = suppliers;
        this.filteredSuppliers = suppliers;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading suppliers', error);
        this.isLoading = false;
        this.snackBar.open('Failed to load suppliers', 'Close', { duration: 3000 });
      }
    });
  }

  setupSearch(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(searchTerm => {
      this.filterSuppliers(searchTerm);
    });
  }

  onSearchChange(searchQuery: string): void {
    this.searchSubject.next(searchQuery);
  }

  filterSuppliers(query: string): void {
    if (!query.trim()) {
      this.filteredSuppliers = [...this.suppliers];
      return;
    }

    query = query.toLowerCase().trim();
    this.filteredSuppliers = this.suppliers.filter(supplier => {
      const nameMatch = supplier.name?.toLowerCase().includes(query);
      const customerNumberMatch = supplier.customerNumber?.toLowerCase().includes(query);
      const addressMatch = (supplier.address?.toLowerCase().includes(query) || 
                          supplier.city?.toLowerCase().includes(query) ||
                          supplier.state?.toLowerCase().includes(query) ||
                          supplier.zip?.toLowerCase().includes(query));

      // Search in emails
      const emailMatch = supplier.orderEmails?.some(email => email.email.toLowerCase().includes(query)) || 
                        supplier.emails?.some(email => email.email.toLowerCase().includes(query));
      
      // Search in phones
      const phoneMatch = supplier.orderPhones?.some(phone => phone.phoneNumber.toLowerCase().includes(query)) ||
                        supplier.phones?.some(phone => phone.phoneNumber.toLowerCase().includes(query));

      return nameMatch || customerNumberMatch || addressMatch || emailMatch || phoneMatch;
    });
  }

  openSupplierDialog(supplier?: Supplier): void {
    const dialogRef = this.dialog.open(SupplierDialogComponent, {
      width: '800px',
      data: { supplier }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadSuppliers();
      }
    });
  }

  viewSupplierDetails(id: number): void {
    this.router.navigate(['/suppliers/detail', id]);
  }

  deleteSupplier(supplier: Supplier): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Confirm Deletion',
        message: `Are you sure you want to delete ${supplier.name}?`,
        confirmText: 'Delete',
        cancelText: 'Cancel'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && supplier.id) {
        this.supplierService.deleteSupplier(supplier.id).subscribe({
          next: () => {
            this.snackBar.open('Supplier deleted successfully', 'Close', { duration: 3000 });
            this.loadSuppliers();
          },
          error: (error) => {
            console.error('Error deleting supplier', error);
            this.snackBar.open('Failed to delete supplier', 'Close', { duration: 3000 });
          }
        });
      }
    });
  }

  getAddress(supplier: Supplier): string {
    const addressParts = [
      supplier.address,
      supplier.city,
      supplier.state,
      supplier.zip
    ].filter(Boolean);
    
    return addressParts.length > 0 ? addressParts.join(', ') : 'No address provided';
  }

  getDefaultContact(supplier: Supplier): string {
    // Check for default email in orderEmails
    const defaultOrderEmail = supplier.orderEmails?.find(email => email.default);
    if (defaultOrderEmail) {
      return defaultOrderEmail.email;
    }
    
    // Check for default email in emails
    const defaultEmail = supplier.emails?.find(email => email.isDefault);
    if (defaultEmail) {
      return defaultEmail.email;
    }
    
    // Check for default phone in orderPhones
    const defaultOrderPhone = supplier.orderPhones?.find(phone => phone.default);
    if (defaultOrderPhone) {
      return defaultOrderPhone.phoneNumber;
    }
    
    // Check for default phone in phones
    const defaultPhone = supplier.phones?.find(phone => phone.isDefault);
    if (defaultPhone) {
      return defaultPhone.phoneNumber;
    }
    
    // Return first email or phone if no default is set
    if (supplier.orderEmails && supplier.orderEmails.length > 0) {
      return supplier.orderEmails[0].email;
    }
    
    if (supplier.emails && supplier.emails.length > 0) {
      return supplier.emails[0].email;
    }
    
    if (supplier.orderPhones && supplier.orderPhones.length > 0) {
      return supplier.orderPhones[0].phoneNumber;
    }
    
    if (supplier.phones && supplier.phones.length > 0) {
      return supplier.phones[0].phoneNumber;
    }
    
    return 'No contact info';
  }
}