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

import { Location } from '../../models/Location';
import { IntegrationSettings } from '../../models/IntegrationSettings';
import { AutoOrderSettings } from '../../models/AutoOrderSettings';
import { LocationService } from '../../services/location.service';
import { IntegrationSettingsService } from '../../services/integration-settings.service';
import { AutoOrderSettingsService } from '../../services/auto-order-settings.service';
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
    MatTooltipModule,
    MatTabsModule
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
  
  constructor(
    private locationService: LocationService,
    private integrationService: IntegrationSettingsService,
    private autoOrderService: AutoOrderSettingsService,
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
        this.loadAllAutoOrderSettings();
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

  loadAllAutoOrderSettings(): void {
    this.locations.forEach(location => {
      this.autoOrderService.getAutoOrderSettings(location.id!)
        .subscribe({
          next: (settings) => {
            this.autoOrderSettingsMap.set(location.id!, settings);
          },
          error: (error) => {
            // The service already handles 404 errors by returning default settings
            console.error(`Error loading auto order settings for location ${location.id}:`, error);
          }
        });
    });
  }

  editLocationSettings(location: Location): void {
    this.selectedLocation = location;
    this.loadLocationSettings(location.id!);
    this.isEditingSettings = true;
  }

  loadLocationSettings(locationId: number): void {
    this.isLoading = true;
    
    // Load integration settings
    const existingIntegrationSettings = this.integrationSettingsMap.get(locationId);
    if (existingIntegrationSettings) {
      this.selectedIntegrationSettings = { ...existingIntegrationSettings };
    } else {
      // Create new settings object if none exists
      this.selectedIntegrationSettings = {
        locationId: locationId,
        posApiUrl: '',
        frequentSyncSeconds: 60,
        frequentSyncEnabled: false,
        dailySyncEnabled: false
      };
    }
    
    // Load auto order settings
    this.autoOrderService.getAutoOrderSettings(locationId).subscribe({
      next: (settings) => {
        this.selectedAutoOrderSettings = settings;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading auto order settings:', error);
        // Create default settings if there was an error
        this.selectedAutoOrderSettings = {
          locationId: locationId,
          enabled: false,
          frequencySeconds: 86400, // Default to daily (24 hours)
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