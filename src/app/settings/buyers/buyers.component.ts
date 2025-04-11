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

import { Location } from '../../models/Location';
import { IntegrationSettings } from '../../models/IntegrationSettings';
import { LocationService } from '../../services/location.service';
import { IntegrationSettingsService } from '../../services/integration-settings.service';
import { CompaniesService } from '../../services/companies.service';

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
    MatTooltipModule
  ],
  templateUrl: './buyers.component.html',
  styleUrls: ['./buyers.component.scss']
})
export class BuyersComponent implements OnInit {
  locations: Location[] = [];
  integrationSettingsMap = new Map<number, IntegrationSettings>();
  displayedColumns: string[] = ['name', 'code', 'address', 'actions'];
  isLoading = true;
  selectedLocation: Location | null = null;
  selectedSettings: IntegrationSettings | null = null;
  isEditingSettings = false;
  
  constructor(
    private locationService: LocationService,
    private integrationService: IntegrationSettingsService,
    private companiesService: CompaniesService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadLocations();
  }

  loadLocations(): void {
    this.isLoading = true;
    this.locationService.getAllLocations().subscribe({
      next: (locations) => {
        this.locations = locations;
        this.loadAllIntegrationSettings();
      },
      error: (error) => {
        console.error('Error loading locations:', error);
        this.snackBar.open('Failed to load locations', 'Close', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  loadAllIntegrationSettings(): void {
    const requests = this.locations.map(location => 
      this.integrationService.getIntegrationSettings(location.id!)
        .subscribe({
          next: (settings) => {
            this.integrationSettingsMap.set(location.id!, settings);
          },
          error: (error) => {
            if (error.status !== 404) {
              console.error(`Error loading integration settings for location ${location.id}:`, error);
            }
          }
        })
    );
    
    // Mark loading as complete after a short delay to ensure UI is updated
    setTimeout(() => {
      this.isLoading = false;
    }, 500);
  }

  editIntegrationSettings(location: Location): void {
    this.selectedLocation = location;
    const existingSettings = this.integrationSettingsMap.get(location.id!);
    
    if (existingSettings) {
      this.selectedSettings = { ...existingSettings };
    } else {
      // Create new settings object if none exists
      this.selectedSettings = {
        locationId: location.id!,
        posApiUrl: '',
        frequentSyncSeconds: 60,
        frequentSyncEnabled: false,
        dailySyncEnabled: false
      };
    }
    
    this.isEditingSettings = true;
  }

  cancelEdit(): void {
    this.isEditingSettings = false;
    this.selectedLocation = null;
    this.selectedSettings = null;
  }

  saveIntegrationSettings(): void {
    if (!this.selectedSettings) return;
    
    this.isLoading = true;
    this.integrationService.updateIntegrationSettings(this.selectedSettings).subscribe({
      next: (updatedSettings) => {
        this.integrationSettingsMap.set(updatedSettings.locationId, updatedSettings);
        this.snackBar.open('Integration settings updated successfully', 'Close', { duration: 3000 });
        this.isEditingSettings = false;
        this.selectedLocation = null;
        this.selectedSettings = null;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error updating integration settings:', error);
        this.snackBar.open('Failed to update integration settings', 'Close', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  hasIntegrationSettings(locationId: number): boolean {
    return this.integrationSettingsMap.has(locationId);
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
}