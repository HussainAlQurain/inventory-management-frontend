import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-price-history-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './price-history-dialog.component.html',
  styleUrl: './price-history-dialog.component.scss'
})
export class PriceHistoryDialogComponent {

  constructor(
    private dialogRef: MatDialogRef<PriceHistoryDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { purchaseOptionId: number }
  ) {}

  close() {
    this.dialogRef.close();
  }

}
