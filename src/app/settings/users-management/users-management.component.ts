import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatMenuModule } from '@angular/material/menu';

import { UserService } from '../../services/user.service';
import { CompaniesService } from '../../services/companies.service';
import { User, UserRole, UserCreateDTO, UserUpdateDTO } from '../../models/user';
import { UserFormDialogComponent } from './user-form-dialog/user-form-dialog.component';

@Component({
  selector: 'app-users-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    MatTooltipModule,
    MatTabsModule,
    MatSelectModule,
    MatPaginatorModule,
    MatSortModule,
    MatMenuModule
  ],
  templateUrl: './users-management.component.html',
  styleUrls: ['./users-management.component.scss']
})
export class UsersManagementComponent implements OnInit {
  users: User[] = [];
  isLoading = false;
  loadError = false;
  selectedCompanyId: number | null = null;
  
  // For table display
  displayedColumns: string[] = ['username', 'name', 'email', 'role', 'status', 'actions'];
  
  // Define available roles for dropdown
  availableRoles = [
    { value: UserRole.USER, label: 'User' },
    { value: UserRole.STAFF, label: 'Staff' },
    { value: UserRole.MANAGER, label: 'Manager' },
    { value: UserRole.ADMIN, label: 'Admin' }
    // Usually SUPER_ADMIN and SYSTEM_ADMIN are not assignable through the UI
  ];

  constructor(
    private userService: UserService,
    private companiesService: CompaniesService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Get the selected company ID
    this.selectedCompanyId = this.companiesService.getSelectedCompanyId();
    if (this.selectedCompanyId) {
      this.loadUsers();
    } else {
      this.snackBar.open('No company selected. Please select a company first.', 'Close', { duration: 5000 });
      this.loadError = true;
    }
  }

  loadUsers(): void {
    if (!this.selectedCompanyId) return;
    
    this.isLoading = true;
    this.loadError = false;
    
    this.userService.getUsersByCompany(this.selectedCompanyId)
      .subscribe({
        next: (users) => {
          this.users = users;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading users:', error);
          this.snackBar.open('Failed to load users. Please try again.', 'Close', { duration: 5000 });
          this.isLoading = false;
          this.loadError = true;
        }
      });
  }

  openCreateUserDialog(): void {
    const dialogRef = this.dialog.open(UserFormDialogComponent, {
      width: '600px',
      data: { 
        mode: 'create',
        availableRoles: this.availableRoles
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && this.selectedCompanyId) {
        this.createUser(result);
      }
    });
  }

  createUser(userData: UserCreateDTO): void {
    if (!this.selectedCompanyId) return;
    
    this.isLoading = true;
    this.userService.createUser(this.selectedCompanyId, userData)
      .subscribe({
        next: (newUser) => {
          this.users.push(newUser);
          this.snackBar.open('User created successfully', 'Close', { duration: 3000 });
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error creating user:', error);
          this.snackBar.open('Failed to create user. Please try again.', 'Close', { duration: 5000 });
          this.isLoading = false;
        }
      });
  }

  openEditUserDialog(user: User): void {
    const dialogRef = this.dialog.open(UserFormDialogComponent, {
      width: '600px',
      data: { 
        mode: 'edit',
        user: user,
        availableRoles: this.availableRoles
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.updateUser(user.id!, result);
      }
    });
  }

  updateUser(userId: number, userData: UserUpdateDTO): void {
    this.isLoading = true;
    this.userService.updateUser(userId, userData)
      .subscribe({
        next: (updatedUser) => {
          const index = this.users.findIndex(u => u.id === userId);
          if (index !== -1) {
            this.users[index] = updatedUser;
          }
          this.snackBar.open('User updated successfully', 'Close', { duration: 3000 });
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error updating user:', error);
          this.snackBar.open('Failed to update user. Please try again.', 'Close', { duration: 5000 });
          this.isLoading = false;
        }
      });
  }

  toggleUserStatus(user: User): void {
    if (!user.id) return;
    
    this.isLoading = true;
    const action = user.status === 'active' ? 'disable' : 'enable';
    const method = action === 'disable' ? this.userService.disableUser(user.id) : this.userService.enableUser(user.id);
    
    method.subscribe({
      next: () => {
        user.status = action === 'disable' ? 'disabled' : 'active';
        this.snackBar.open(`User ${action}d successfully`, 'Close', { duration: 3000 });
        this.isLoading = false;
      },
      error: (error) => {
        console.error(`Error ${action}ing user:`, error);
        this.snackBar.open(`Failed to ${action} user. Please try again.`, 'Close', { duration: 5000 });
        this.isLoading = false;
      }
    });
  }

  changeUserRole(user: User, newRole: string): void {
    if (!user.id) return;
    
    this.isLoading = true;
    this.userService.changeUserRole(user.id, newRole)
      .subscribe({
        next: (updatedUser) => {
          const index = this.users.findIndex(u => u.id === user.id);
          if (index !== -1) {
            this.users[index] = updatedUser;
          }
          this.snackBar.open('User role updated successfully', 'Close', { duration: 3000 });
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error changing user role:', error);
          this.snackBar.open('Failed to change user role. Please try again.', 'Close', { duration: 5000 });
          this.isLoading = false;
        }
      });
  }

  // Helper function to get the label of a role
  getRoleLabel(roleValue: string): string {
    const role = this.availableRoles.find(r => r.value === roleValue);
    return role ? role.label : 'Unknown';
  }

  // Helper function to get primary role
  getPrimaryRole(user: User): string {
    return user.roles && user.roles.length > 0 ? user.roles[0] : UserRole.USER;
  }
}