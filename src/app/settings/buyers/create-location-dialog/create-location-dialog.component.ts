import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Location } from '../../../models/Location';

@Component({
  selector: 'app-create-location-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './create-location-dialog.component.html',
  styleUrls: ['./create-location-dialog.component.scss']
})
export class CreateLocationDialogComponent {
  locationForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CreateLocationDialogComponent>
  ) {
    this.locationForm = this.fb.group({
      name: ['', Validators.required],
      code: [''],
      address: [''],
      city: [''],
      state: [''],
      zip: [''],
      phone: ['']
    });
  }

  onSubmit(): void {
    if (this.locationForm.valid) {
      const newLocation: Partial<Location> = this.locationForm.value;
      this.dialogRef.close(newLocation);
    }
  }
}
