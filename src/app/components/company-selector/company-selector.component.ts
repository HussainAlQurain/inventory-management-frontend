import { Component, OnInit } from '@angular/core';
import { Company } from '../../models/company';
import { CompaniesService } from '../../services/companies.service';
import { MatDialogRef } from '@angular/material/dialog';
import { AuthService } from '../../services/auth.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { CommonModule } from '@angular/common';
import { MatOptionModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';



@Component({
  selector: 'app-company-selector',
  standalone: true,
  imports: [MatFormFieldModule, MatSelectModule, CommonModule, MatOptionModule, MatButtonModule],
  templateUrl: './company-selector.component.html',
  styleUrl: './company-selector.component.scss'
})
export class CompanySelectorComponent implements OnInit {
  companies: Company[] = [];
  selectedCompanyId: number | null = null;

  constructor(
    private companiesService: CompaniesService,
    private dialogRef: MatDialogRef<CompanySelectorComponent>,
    private authService: AuthService
  ) {}

  ngOnInit() {
    const userId = this.authService.getUserId();
    if (!userId) {
      console.error('User ID not found.');
      this.dialogRef.close();
      return;
    }

    // Fetch companies by user ID
    this.companiesService.getCompaniesByUserId(userId).subscribe(
      (companies) => {
        this.companies = companies;
        if (companies.length > 0) {
          this.selectedCompanyId = companies[0].id; // Default to the first company
        } else {
          console.warn('No companies available for the user.');
          this.dialogRef.close();
        }
      },
      (error) => {
        console.error('Error fetching companies:', error);
        this.dialogRef.close();
      }
    );
  }

  onConfirm() {
    this.dialogRef.close(this.selectedCompanyId);
  }

  onCancel() {
    this.dialogRef.close(null);
  }

}
