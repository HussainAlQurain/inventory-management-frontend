import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { TransferService } from '../../services/transfer.service';
import { InventoryItemsService } from '../../services/inventory-items-service.service';
import { SubRecipeService } from '../../services/sub-recipe.service';
import { LocationService } from '../../services/location.service';
import { Transfer, TransferLine } from '../../models/Transfer';
import { Location } from '../../models/Location';
import { UnitOfMeasure } from '../../models/UnitOfMeasure';

@Component({
  selector: 'app-transfer-details',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatSnackBarModule
  ],
  templateUrl: './transfer-details.component.html',
  styleUrls: ['./transfer-details.component.scss']
})
export class TransferDetailsComponent implements OnInit {
  transfer: Transfer | null = null;
  loading = false;
  submitting = false;
  error = '';
  isEditing = false;
  
  // For editing lines
  linesForm: FormGroup;
  unitOfMeasures: UnitOfMeasure[] = [];
  
  get isIncoming(): boolean {
    return this.data.isIncoming;
  }
  
  get transferId(): number {
    return this.data.transferId;
  }
  
  get canEdit(): boolean {
    return this.transfer?.status?.toLowerCase() !== 'completed' && this.isIncoming;
  }
  
  get canComplete(): boolean {
    return this.transfer?.status?.toLowerCase() !== 'completed' && this.isIncoming;
  }
  
  get canDelete(): boolean {
    return this.transfer?.status?.toLowerCase() !== 'completed' && !this.isIncoming;
  }
  
  constructor(
    private dialogRef: MatDialogRef<TransferDetailsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { transferId: number, isIncoming: boolean },
    private transferService: TransferService,
    private inventoryItemsService: InventoryItemsService,
    private subRecipeService: SubRecipeService,
    private locationService: LocationService,
    private snackBar: MatSnackBar,
    private fb: FormBuilder
  ) {
    this.linesForm = this.fb.group({
      lines: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.loadTransferDetails();
  }
  
  get lines(): FormArray {
    return this.linesForm.get('lines') as FormArray;
  }
  
  loadTransferDetails(): void {
    this.loading = true;
    this.transferService.getTransfer(this.transferId).subscribe({
      next: (transfer) => {
        this.transfer = transfer;
        // Create form controls for each line
        this.initLinesForm();
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load transfer details:', err);
        this.error = 'Failed to load transfer details';
        this.loading = false;
      }
    });
  }
  
  initLinesForm(): void {
    // Clear existing lines
    while (this.lines.length !== 0) {
      this.lines.removeAt(0);
    }
    
    // Add form group for each line
    this.transfer?.lines.forEach(line => {
      this.lines.push(this.fb.group({
        id: [line.id],
        inventoryItemId: [line.inventoryItemId],
        subRecipeId: [line.subRecipeId],
        itemName: [line.itemName],
        quantity: [line.quantity, [Validators.required, Validators.min(0.001)]],
        unitOfMeasureId: [line.unitOfMeasureId, Validators.required],
        uomName: [line.uomName],
        costPerUnit: [line.costPerUnit],
        totalCost: [line.totalCost]
      }));
    });
  }
  
  startEditing(): void {
    this.isEditing = true;
    // Load UOMs if needed for editing
    this.inventoryItemsService.getUnitOfMeasures().subscribe(uoms => {
      this.unitOfMeasures = uoms;
    });
  }
  
  cancelEditing(): void {
    this.isEditing = false;
    this.initLinesForm(); // Reset form to original values
  }
  
  saveChanges(): void {
    if (this.linesForm.invalid || !this.transfer) {
      return;
    }
    
    this.submitting = true;
    
    // Get the location ID for the receiving location (toLocationId)
    const actingLocationId = this.transfer.toLocationId;
    
    // Map form values to TransferLines
    const updatedLines: TransferLine[] = this.lines.value;
    
    this.transferService.updateTransferLines(this.transferId, actingLocationId, updatedLines).subscribe({
      next: (updatedTransfer) => {
        this.transfer = updatedTransfer;
        this.isEditing = false;
        this.submitting = false;
        this.snackBar.open('Transfer updated successfully', 'Close', { duration: 3000 });
      },
      error: (err) => {
        console.error('Failed to update transfer:', err);
        this.snackBar.open('Failed to update transfer', 'Close', { duration: 3000 });
        this.submitting = false;
      }
    });
  }
  
  completeTransfer(): void {
    if (!this.transfer || !this.canComplete) {
      return;
    }
    
    if (confirm('Are you sure you want to complete this transfer? This action cannot be undone.')) {
      this.submitting = true;
      
      this.transferService.completeTransfer(this.transferId).subscribe({
        next: (completedTransfer) => {
          this.transfer = completedTransfer;
          this.submitting = false;
          this.snackBar.open('Transfer completed successfully', 'Close', { duration: 3000 });
          this.dialogRef.close('completed');
        },
        error: (err) => {
          console.error('Failed to complete transfer:', err);
          this.snackBar.open('Failed to complete transfer', 'Close', { duration: 3000 });
          this.submitting = false;
        }
      });
    }
  }
  
  deleteTransfer(): void {
    if (!this.transfer || !this.canDelete) {
      return;
    }
    
    if (confirm('Are you sure you want to delete this transfer? This action cannot be undone.')) {
      this.submitting = true;
      
      this.transferService.deleteTransfer(this.transferId).subscribe({
        next: () => {
          this.submitting = false;
          this.snackBar.open('Transfer deleted successfully', 'Close', { duration: 3000 });
          this.dialogRef.close('deleted');
        },
        error: (err) => {
          console.error('Failed to delete transfer:', err);
          this.snackBar.open('Failed to delete transfer', 'Close', { duration: 3000 });
          this.submitting = false;
        }
      });
    }
  }
  
  removeLine(index: number): void {
    this.lines.removeAt(index);
  }
  
  closeDialog(): void {
    this.dialogRef.close();
  }
  
  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  }
  
  getItemType(line: TransferLine): string {
    return line.inventoryItemId ? 'Inventory Item' : 'Sub-Recipe';
  }
}