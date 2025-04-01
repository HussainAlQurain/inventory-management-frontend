import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { Assortment } from '../../models/Assortment';
import { AssortmentService } from '../../services/assortment.service';
import { AssortmentDetailComponent } from '../assortment-detail/assortment-detail.component';
import { AddAssortmentComponent } from '../add-assortment/add-assortment.component';

@Component({
  selector: 'app-assortments',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
    MatMenuModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
  ],
  templateUrl: './assortments.component.html',
  styleUrl: './assortments.component.scss'
})
export class AssortmentsComponent implements OnInit {
  displayedColumns: string[] = ['name', 'locations', 'items', 'purchaseOptions', 'subRecipes', 'actions'];
  dataSource: Assortment[] = [];
  filteredData: Assortment[] = [];
  isLoading = false;
  error: string | null = null;
  
  // Search filter
  nameFilter = '';
  
  // For pagination and sorting
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private assortmentService: AssortmentService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadAssortments();
  }

  loadAssortments(): void {
    this.isLoading = true;
    this.error = null;
    
    this.assortmentService.getAllAssortments().subscribe({
      next: (data) => {
        this.dataSource = data;
        this.filteredData = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading assortments:', err);
        this.error = 'Failed to load assortments. Please try again.';
        this.isLoading = false;
      }
    });
  }

  addAssortment(): void {
    const dialogRef = this.dialog.open(AddAssortmentComponent, {
      width: '500px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadAssortments(); // Reload the list after adding
      }
    });
  }

  editAssortment(assortment: Assortment): void {
    const dialogRef = this.dialog.open(AssortmentDetailComponent, {
      width: '800px',
      data: { assortmentId: assortment.id }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadAssortments(); // Reload the list after editing
      }
    });
  }

  deleteAssortment(id: number): void {
    if (confirm('Are you sure you want to delete this assortment?')) {
      this.assortmentService.deleteAssortment(id).subscribe({
        next: () => {
          this.snackBar.open('Assortment deleted successfully', 'Close', {
            duration: 3000
          });
          this.loadAssortments(); // Reload the list after deletion
        },
        error: (err) => {
          console.error('Error deleting assortment:', err);
          this.snackBar.open('Failed to delete assortment', 'Close', {
            duration: 3000
          });
        }
      });
    }
  }

  applyFilter(): void {
    const filterValue = this.nameFilter.toLowerCase();
    this.filteredData = this.dataSource.filter(assortment => 
      assortment.name.toLowerCase().includes(filterValue)
    );
  }

  clearFilter(): void {
    this.nameFilter = '';
    this.filteredData = this.dataSource;
  }

  downloadAssortments(): void {
    // Generate CSV data
    const headers = ['Name', 'Number of Locations', 'Number of Inventory Items', 'Number of Purchase Options', 'Number of Sub-Recipes'];
    const csvData = this.dataSource.map(a => [
      a.name,
      a.locationIds?.length || 0,
      a.itemIds?.length || 0,
      a.purchaseOptionIds?.length || 0,
      a.subRecipeIds?.length || 0
    ]);
    
    // Add headers to CSV data
    csvData.unshift(headers);
    
    // Convert to CSV string
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = 'assortments.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  importFromExcel(): void {
    // To be implemented later
    this.snackBar.open('Import from Excel functionality will be implemented later', 'Close', {
      duration: 3000
    });
  }
}
