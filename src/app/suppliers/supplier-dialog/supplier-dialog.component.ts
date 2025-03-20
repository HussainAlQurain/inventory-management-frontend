import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';

import { Supplier } from '../../models/Supplier';
import { SupplierFormComponent } from '../supplier-form/supplier-form.component';

export interface SupplierDialogData {
  initialSupplierName?: string;
  supplier?: Supplier;
}

@Component({
  selector: 'app-supplier-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    SupplierFormComponent
  ],
  template: `
    <h2 mat-dialog-title>{{ data.supplier ? 'Edit' : 'Create New' }} Supplier</h2>
    <mat-dialog-content>
      <app-supplier-form
        [initialSupplierName]="data.initialSupplierName || ''"
        [supplier]="data.supplier || null"
        (supplierCreated)="onSupplierCreated($event)"
        (supplierUpdated)="onSupplierUpdated($event)"
        (cancel)="onCancel()">
      </app-supplier-form>
    </mat-dialog-content>
  `,
  styles: [`
    mat-dialog-content {
      max-height: 80vh;
      min-width: 500px;
    }
  `]
})
export class SupplierDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<SupplierDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SupplierDialogData
  ) {}

  onSupplierCreated(supplier: Supplier): void {
    this.dialogRef.close(supplier);
  }

  onSupplierUpdated(supplier: Supplier): void {
    this.dialogRef.close(supplier);
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
