// filepath: /home/rayleigh/Desktop/projects/inventory-management-frontend/src/app/settings/buyers/buyers.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
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
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

import { Location } from '../../models/Location';
import { IntegrationSettings } from '../../models/IntegrationSettings';
import { AutoOrderSettings } from '../../models/AutoOrderSettings';
import { LocationService } from '../../services/location.service';
import { IntegrationSettingsService } from '../../services/integration-settings.service';
import { AutoOrderSettingsService } from '../../services/auto-order-settings.service';
import { CompaniesService } from '../../services/companies.service';
import { CreateLocationDialogComponent } from './create-location-dialog/create-location-dialog.component';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-buyers',
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
    MatPaginatorModule,
    CreateLocationDialogComponent
  ],
  templateUrl: './buyers.component.html',
  styleUrls: ['./buyers.component.scss']
})
export class BuyersComponent implements OnInit {
  locations: Location[] = [];
  integrationSettingsMap = new Map<number, IntegrationSettings>();
  autoOrderSettingsMap = new Map<number, AutoOrderSettings>();
  displayedColumns: string[] = ['name', 'code', 'address', 'actions'];
  isLoading = true;
  selectedLocation: Location | null = null;
  selectedIntegrationSettings: IntegrationSettings | null = null;
  selectedAutoOrderSettings: AutoOrderSettings | null = null;
  isEditingSettings = false;

  // Pagination properties
  pageSize = 10;
  pageSizeOptions: number[] = [10, 25, 50, 100];
  currentPage = 0;
  totalItems = 0;
  totalPages = 0;

  // Search property
  searchTerm: string = '';

  constructor(
    private locationService: LocationService,
    private integrationService: IntegrationSettingsService,
    private autoOrderService: AutoOrderSettingsService,
    private companiesService: CompaniesService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadLocations();
  }

  loadLocations(): void {
    this.isLoading = true;

    this.locationService.getPaginatedLocations(
      this.currentPage,
      this.pageSize,
      'name,asc',
      this.searchTerm
    ).subscribe({
      next: (response) => {
        this.locations = response.content;
        this.totalItems = response.totalElements;
        this.totalPages = response.totalPages;
        this.isLoading = false;

        this.loadAllIntegrationSettings();
        this.loadAllAutoOrderSettings();
      },
      error: (error) => {
        console.error('Error loading locations:', error);
        this.snackBar.open('Failed to load locations', 'Close', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  handlePageEvent(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadLocations();
  }

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm = value;
    this.currentPage = 0; // Reset to first page when searching
    this.loadLocations();
  }

  openCreateLocationDialog(): void {
    const dialogRef = this.dialog.open(CreateLocationDialogComponent);

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.createNewLocation(result);
        this.currentPage = 0; // Go back to first page to see the new location
        this.loadLocations();
      }
    });
  }

  createNewLocation(newLocationData: Partial<Location>): void {
    this.isLoading = true;

    const companyId = this.companiesService.getSelectedCompanyId();
    newLocationData.companyId = companyId!;

    this.locationService.createLocation(newLocationData as Location).subscribe({
      next: (createdLocation) => {
        console.log('Location created successfully:', createdLocation);

        const userId = this.authService.getUserId();
        console.log("userId: ", userId);

        if (userId) {
          this.locationService.addUsersToLocation(createdLocation.id!, [userId]).subscribe({
            next: () => {
              this.snackBar.open('Location created and user added successfully', 'Close', { duration: 3000 });
              this.loadLocations();
            },
            error: (error) => {
              console.error('Error adding user to location:', error);
              this.snackBar.open('Location created but failed to add user', 'Close', { duration: 3000 });
              this.loadLocations();
              this.isLoading = false;
            }
          });
        } else {
          this.snackBar.open('Location created successfully', 'Close', { duration: 3000 });
          this.loadLocations();
          this.isLoading = false;
        }
      },
      error: (error) => {
        console.error('Error creating location:', error);
        this.snackBar.open('Failed to create location', 'Close', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  loadAllIntegrationSettings(): void {
    // Use only the locations we have on the current page
    for (const location of this.locations) {
      this.loadIntegrationSettings(location.id!);
    }
  }

  loadAllAutoOrderSettings(): void {
    // Use only the locations we have on the current page
    for (const location of this.locations) {
      this.loadAutoOrderSettings(location.id!);
    }
  }

  loadIntegrationSettings(locationId: number): void {
    this.integrationService.getIntegrationSettings(locationId)
      .subscribe({
        next: (settings) => {
          this.integrationSettingsMap.set(locationId, settings);
        },
        error: (error) => {
          if (error.status !== 404) {
            console.error(`Error loading integration settings for location ${locationId}:`, error);
          }
        }
      });
  }

  loadAutoOrderSettings(locationId: number): void {
    this.autoOrderService.getAutoOrderSettings(locationId)
      .subscribe({
        next: (settings) => {
          this.autoOrderSettingsMap.set(locationId, settings);
        },
        error: (error) => {
          console.error(`Error loading auto order settings for location ${locationId}:`, error);
        }
      });
  }

  editLocationSettings(location: Location): void {
    this.selectedLocation = location;
    this.loadLocationSettings(location.id!);
    this.isEditingSettings = true;
  }

  loadLocationSettings(locationId: number): void {
    this.isLoading = true;

    const existingIntegrationSettings = this.integrationSettingsMap.get(locationId);
    if (existingIntegrationSettings) {
      this.selectedIntegrationSettings = { ...existingIntegrationSettings };
    } else {
      this.selectedIntegrationSettings = {
        locationId: locationId,
        posApiUrl: '',
        frequentSyncSeconds: 60,
        frequentSyncEnabled: false,
        dailySyncEnabled: false
      };
    }

    this.autoOrderService.getAutoOrderSettings(locationId).subscribe({
      next: (settings) => {
        this.selectedAutoOrderSettings = settings;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading auto order settings:', error);
        this.selectedAutoOrderSettings = {
          locationId: locationId,
          enabled: false,
          frequencySeconds: 86400,
          autoOrderComment: 'System suggest order'
        };
        this.isLoading = false;
      }
    });
  }

  cancelEdit(): void {
    this.isEditingSettings = false;
    this.selectedLocation = null;
    this.selectedIntegrationSettings = null;
    this.selectedAutoOrderSettings = null;
  }

  saveIntegrationSettings(): void {
    if (!this.selectedIntegrationSettings) return;

    this.isLoading = true;
    this.integrationService.updateIntegrationSettings(this.selectedIntegrationSettings).subscribe({
      next: (updatedSettings) => {
        this.integrationSettingsMap.set(updatedSettings.locationId, updatedSettings);
        this.snackBar.open('Integration settings updated successfully', 'Close', { duration: 3000 });
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error updating integration settings:', error);
        this.snackBar.open('Failed to update integration settings', 'Close', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  saveAutoOrderSettings(): void {
    if (!this.selectedAutoOrderSettings) return;

    this.isLoading = true;
    this.autoOrderService.updateAutoOrderSettings(this.selectedAutoOrderSettings).subscribe({
      next: (updatedSettings) => {
        this.autoOrderSettingsMap.set(updatedSettings.locationId, updatedSettings);
        this.snackBar.open('Auto order settings updated successfully', 'Close', { duration: 3000 });
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error updating auto order settings:', error);
        this.snackBar.open('Failed to update auto order settings', 'Close', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  saveAllSettings(): void {
    if (this.selectedIntegrationSettings) {
      this.saveIntegrationSettings();
    }
    if (this.selectedAutoOrderSettings) {
      this.saveAutoOrderSettings();
    }
    this.isEditingSettings = false;
    this.selectedLocation = null;
  }

  hasIntegrationSettings(locationId: number): boolean {
    return this.integrationSettingsMap.has(locationId);
  }

  hasAutoOrderSettings(locationId: number): boolean {
    const settings = this.autoOrderSettingsMap.get(locationId);
    return !!settings && settings.enabled === true;
  }

  getIntegrationStatus(locationId: number): string {
    const settings = this.integrationSettingsMap.get(locationId);
    if (!settings) return 'Not Configured';

    if (settings.frequentSyncEnabled || settings.dailySyncEnabled) {
      return 'Active';
    } else {
      return 'Disabled';
    }
  }

  getAutoOrderStatus(locationId: number): string {
    const settings = this.autoOrderSettingsMap.get(locationId);
    if (!settings) return 'Not Configured';

    return settings.enabled ? 'Active' : 'Disabled';
  }

  formatFrequency(seconds: number): string {
    if (seconds < 60) return `${seconds} seconds`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours`;
    return `${Math.floor(seconds / 86400)} days`;
  }
}