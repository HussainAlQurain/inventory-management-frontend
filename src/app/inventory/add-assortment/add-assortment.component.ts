import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AssortmentService } from '../../services/assortment.service';

@Component({
  selector: 'app-add-assortment',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './add-assortment.component.html',
  styleUrl: './add-assortment.component.scss'
})
export class AddAssortmentComponent {
  assortmentName = '';
  isSubmitting = false;
  errorMessage = '';

  constructor(
    private dialogRef: MatDialogRef<AddAssortmentComponent>,
    private assortmentService: AssortmentService
  ) {}

  onSubmit(): void {
    if (!this.assortmentName.trim()) {
      this.errorMessage = 'Assortment name is required';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    this.assortmentService.createSimpleAssortment(this.assortmentName).subscribe({
      next: (createdAssortment) => {
        this.isSubmitting = false;
        this.dialogRef.close(createdAssortment);
      },
      error: (error) => {
        console.error('Error creating assortment:', error);
        this.isSubmitting = false;
        this.errorMessage = 'Failed to create assortment. Please try again.';
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
