import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { User, UserRole } from '../../../models/user';

interface DialogData {
  mode: 'create' | 'edit';
  user?: User;
  availableRoles: { value: string; label: string }[];
}

@Component({
  selector: 'app-user-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatSlideToggleModule
  ],
  templateUrl: './user-form-dialog.component.html',
  styleUrls: ['./user-form-dialog.component.scss']
})
export class UserFormDialogComponent implements OnInit {
  userForm!: FormGroup;
  isCreateMode: boolean;
  passwordVisible = false;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<UserFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    this.isCreateMode = this.data.mode === 'create';
  }

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    if (this.isCreateMode) {
      // Create mode - all fields including password
      this.userForm = this.fb.group({
        username: ['', [Validators.required, Validators.minLength(3)]],
        password: ['', [Validators.required, Validators.minLength(8)]],
        email: ['', [Validators.required, Validators.email]],
        firstName: ['', Validators.required],
        lastName: ['', Validators.required],
        phone: [''],
        role: [UserRole.USER, Validators.required]
      });
    } else if (this.data.user) {
      // Edit mode - no password, prefill with user data
      this.userForm = this.fb.group({
        email: [this.data.user.email, [Validators.required, Validators.email]],
        firstName: [this.data.user.firstName, Validators.required],
        lastName: [this.data.user.lastName, Validators.required],
        phone: [this.data.user.phone || ''],
        status: [this.data.user.status || 'active']
      });
    } else {
      // Fallback empty form (shouldn't happen)
      this.userForm = this.fb.group({});
      console.error('User form dialog opened in edit mode without user data');
    }
  }

  onSubmit(): void {
    if (this.userForm.valid) {
      this.dialogRef.close(this.userForm.value);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
  }

  // Helper getter for form controls
  get f() {
    return this.userForm.controls;
  }

  getDialogTitle(): string {
    return this.isCreateMode ? 'Create New User' : 'Edit User';
  }
}