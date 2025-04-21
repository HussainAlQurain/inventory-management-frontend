import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';

import { Company } from '../../models/company';
import { AutoRedistributeSetting } from '../../models/AutoRedistributeSetting';
import { CompanySettingsService } from '../../services/company-settings.service';
import { CompaniesService } from '../../services/companies.service';

@Component({
  selector: 'app-company',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDividerModule,
    MatTabsModule,
    MatTooltipModule
  ],
  templateUrl: './company.component.html',
  styleUrls: ['./company.component.scss']
})
export class CompanyComponent implements OnInit {
  companyForm: FormGroup;
  redistributeSettingsForm: FormGroup;
  
  company: Company | null = null;
  autoRedistributeSettings: AutoRedistributeSetting | null = null;
  
  isLoading = true;
  isEditingCompany = false;
  isEditingRedistributeSettings = false;
  isSaving = false;

  constructor(
    private fb: FormBuilder,
    private companySettingsService: CompanySettingsService,
    private companiesService: CompaniesService,
    private snackBar: MatSnackBar
  ) {
    // Initialize company form with disabled controls
    this.companyForm = this.fb.group({
      name: [{value: '', disabled: true}, Validators.required],
      tax_id: [{value: '', disabled: true}],
      phone: [{value: '', disabled: true}],
      mobile: [{value: '', disabled: true}],
      email: [{value: '', disabled: true}, [Validators.email]],
      state: [{value: '', disabled: true}],
      city: [{value: '', disabled: true}],
      address: [{value: '', disabled: true}],
      zip: [{value: '', disabled: true}],
      addPurchasedItemsToFavorites: [{value: false, disabled: true}],
      allowedInvoiceDeviation: [{value: 0, disabled: true}],
      accountingSoftware: [{value: '', disabled: true}],
      exportDeliveryNotesAsBills: [{value: false, disabled: true}]
    });
    
    // Initialize redistribute settings form with disabled controls
    this.redistributeSettingsForm = this.fb.group({
      enabled: [{value: false, disabled: true}],
      frequencySeconds: [{value: 300, disabled: true}, [Validators.required, Validators.min(60)]],
      autoTransferComment: [{value: 'Auto Redistribute Transfer', disabled: true}, Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadCompanyData();
  }

  loadCompanyData(): void {
    this.isLoading = true;
    
    // Get current company ID
    const companyId = this.companiesService.getSelectedCompanyId();
    if (!companyId) {
      this.snackBar.open('No company selected', 'Close', { duration: 3000 });
      this.isLoading = false;
      return;
    }
    
    // Load company details
    this.companySettingsService.getCompanyById(companyId).subscribe({
      next: (company) => {
        this.company = company;
        this.populateCompanyForm();
        
        // Load auto redistribute settings after company data is loaded
        this.loadAutoRedistributeSettings(companyId);
      },
      error: (error) => {
        console.error('Error loading company data:', error);
        this.snackBar.open('Failed to load company data', 'Close', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  loadAutoRedistributeSettings(companyId: number): void {
    this.companySettingsService.getAutoRedistributeSettings(companyId).subscribe({
      next: (settings) => {
        this.autoRedistributeSettings = settings;
        this.populateRedistributeSettingsForm();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading auto redistribute settings:', error);
        // Create default settings in case of error
        this.autoRedistributeSettings = {
          enabled: false,
          frequencySeconds: 300,
          autoTransferComment: 'Auto Redistribute Transfer'
        };
        this.populateRedistributeSettingsForm();
        this.isLoading = false;
      }
    });
  }

  populateCompanyForm(): void {
    if (!this.company) return;
    
    this.companyForm.patchValue({
      name: this.company.name,
      tax_id: this.company.tax_id,
      phone: this.company.phone,
      mobile: this.company.mobile,
      email: this.company.email,
      state: this.company.state,
      city: this.company.city,
      address: this.company.address,
      zip: this.company.zip,
      addPurchasedItemsToFavorites: this.company.addPurchasedItemsToFavorites || false,
      allowedInvoiceDeviation: this.company.allowedInvoiceDeviation || 0,
      accountingSoftware: this.company.accountingSoftware || '',
      exportDeliveryNotesAsBills: this.company.exportDeliveryNotesAsBills || false
    });
  }

  populateRedistributeSettingsForm(): void {
    if (!this.autoRedistributeSettings) return;
    
    this.redistributeSettingsForm.patchValue({
      enabled: this.autoRedistributeSettings.enabled,
      frequencySeconds: this.autoRedistributeSettings.frequencySeconds,
      autoTransferComment: this.autoRedistributeSettings.autoTransferComment
    });
  }

  toggleEditCompany(): void {
    if (this.isEditingCompany) {
      // If already editing, cancel and reset the form
      this.companyForm.disable();
      this.populateCompanyForm();
    } else {
      // Enable editing
      this.companyForm.enable();
    }
    this.isEditingCompany = !this.isEditingCompany;
  }

  toggleEditRedistributeSettings(): void {
    if (this.isEditingRedistributeSettings) {
      // If already editing, cancel and reset the form
      this.redistributeSettingsForm.get('frequencySeconds')?.disable();
      this.redistributeSettingsForm.get('autoTransferComment')?.disable();
      this.populateRedistributeSettingsForm();
    } else {
      // Enable editing - but keep the enabled toggle disabled since that's controlled separately
      this.redistributeSettingsForm.get('frequencySeconds')?.enable();
      this.redistributeSettingsForm.get('autoTransferComment')?.enable();
    }
    this.isEditingRedistributeSettings = !this.isEditingRedistributeSettings;
  }

  saveCompanyChanges(): void {
    if (!this.companyForm.valid || !this.company?.id) {
      this.snackBar.open('Please fill in all required fields', 'Close', { duration: 3000 });
      return;
    }
    
    this.isSaving = true;
    
    // Create update payload
    const companyData: Partial<Company> = {
      name: this.companyForm.get('name')?.value,
      tax_id: this.companyForm.get('tax_id')?.value,
      phone: this.companyForm.get('phone')?.value,
      mobile: this.companyForm.get('mobile')?.value,
      email: this.companyForm.get('email')?.value,
      state: this.companyForm.get('state')?.value,
      city: this.companyForm.get('city')?.value,
      address: this.companyForm.get('address')?.value,
      zip: this.companyForm.get('zip')?.value,
      addPurchasedItemsToFavorites: this.companyForm.get('addPurchasedItemsToFavorites')?.value,
      allowedInvoiceDeviation: this.companyForm.get('allowedInvoiceDeviation')?.value,
      accountingSoftware: this.companyForm.get('accountingSoftware')?.value,
      exportDeliveryNotesAsBills: this.companyForm.get('exportDeliveryNotesAsBills')?.value
    };
    
    this.companySettingsService.updateCompany(this.company.id, companyData).subscribe({
      next: (updatedCompany) => {
        this.company = updatedCompany;
        this.isEditingCompany = false;
        this.companyForm.disable();
        this.snackBar.open('Company details updated successfully', 'Close', { duration: 3000 });
        this.isSaving = false;
      },
      error: (error) => {
        console.error('Error updating company:', error);
        this.snackBar.open('Failed to update company details', 'Close', { duration: 3000 });
        this.isSaving = false;
      }
    });
  }

  toggleRedistributeEnabled(): void {
    if (!this.autoRedistributeSettings || !this.company?.id) return;
    
    this.isSaving = true;
    
    const updatedSettings: Partial<AutoRedistributeSetting> = {
      enabled: !this.autoRedistributeSettings.enabled
    };
    
    this.companySettingsService.updateAutoRedistributeSettings(this.company.id, updatedSettings).subscribe({
      next: (settings) => {
        this.autoRedistributeSettings = settings;
        this.populateRedistributeSettingsForm();
        this.snackBar.open(
          `Auto redistribute ${settings.enabled ? 'enabled' : 'disabled'} successfully`, 
          'Close', 
          { duration: 3000 }
        );
        this.isSaving = false;
      },
      error: (error) => {
        console.error('Error toggling redistribute settings:', error);
        this.snackBar.open('Failed to update redistribute settings', 'Close', { duration: 3000 });
        this.isSaving = false;
      }
    });
  }

  saveRedistributeSettings(): void {
    if (!this.redistributeSettingsForm.valid || !this.company?.id) {
      this.snackBar.open('Please fill in all required fields', 'Close', { duration: 3000 });
      return;
    }
    
    this.isSaving = true;
    
    // Create update payload
    const settingsData: Partial<AutoRedistributeSetting> = {
      frequencySeconds: this.redistributeSettingsForm.get('frequencySeconds')?.value,
      autoTransferComment: this.redistributeSettingsForm.get('autoTransferComment')?.value
    };
    
    this.companySettingsService.updateAutoRedistributeSettings(this.company.id, settingsData).subscribe({
      next: (settings) => {
        this.autoRedistributeSettings = settings;
        this.isEditingRedistributeSettings = false;
        this.redistributeSettingsForm.get('frequencySeconds')?.disable();
        this.redistributeSettingsForm.get('autoTransferComment')?.disable();
        this.snackBar.open('Redistribute settings updated successfully', 'Close', { duration: 3000 });
        this.isSaving = false;
      },
      error: (error) => {
        console.error('Error updating redistribute settings:', error);
        this.snackBar.open('Failed to update redistribute settings', 'Close', { duration: 3000 });
        this.isSaving = false;
      }
    });
  }

  formatFrequency(seconds: number): string {
    if (seconds < 60) return `${seconds} seconds`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours`;
    return `${Math.floor(seconds / 86400)} days`;
  }
}