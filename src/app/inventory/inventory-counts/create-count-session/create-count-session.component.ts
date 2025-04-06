import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DayPart } from '../../../models/InventoryCountSession';
import { Location } from '../../../models/Location';

@Component({
  selector: 'app-create-count-session',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatDialogModule
  ],
  templateUrl: './create-count-session.component.html',
  styleUrls: ['./create-count-session.component.scss']
})
export class CreateCountSessionComponent implements OnInit {
  countSessionForm!: FormGroup;
  dayPartOptions: DayPart[] = ['Day Start', 'Day End'];
  maxDate: Date = new Date();

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<CreateCountSessionComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { locations: Location[], selectedLocationId: number | null }
  ) { }

  ngOnInit(): void {
    // Initialize the form with defaults
    this.countSessionForm = this.fb.group({
      locationId: [this.data.selectedLocationId || '', [Validators.required]],
      countDate: [new Date(), [Validators.required]],
      dayPart: ['Day End', [Validators.required]],
      description: ['', [Validators.maxLength(500)]]
    });
  }

  onCancelClick(): void {
    this.dialogRef.close();
  }

  onSubmitClick(): void {
    if (this.countSessionForm.valid) {
      this.dialogRef.close(this.countSessionForm.value);
    } else {
      // Mark all form controls as touched to trigger validation messages
      Object.keys(this.countSessionForm.controls).forEach(key => {
        const control = this.countSessionForm.get(key);
        control?.markAsTouched();
      });
    }
  }
}