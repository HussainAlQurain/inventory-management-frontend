import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../services/auth.service';

import { ModalService } from '../services/modal.service';
import { CompaniesService } from '../services/companies.service';
import { CompanySelectorComponent } from '../components/company-selector/company-selector.component';

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [MatMenuModule, MatIconModule, MatButtonModule, MatTooltipModule],
  templateUrl: './user.component.html',
  styleUrl: './user.component.scss'
})
export class UserComponent implements OnInit{
  username: string | null = null;
  constructor(
    private authService: AuthService,
    private modalService: ModalService,
    private companiesService: CompaniesService
  ) {}
  

  ngOnInit(): void {
    // Fetch the username from AuthService (you can implement this based on your token or API)
    this.fetchUsername();
  }

  // Fetch username from AuthService (can be based on token or a user info API)
  fetchUsername(): void {
    const token = this.authService.getAuthToken();
    if (token) {
      const payload = this.decodeToken(token);
      this.username = payload?.sub || 'Guest';  // 'Guest' if no username available
    } else {
      this.username = 'Guest';
    }
  }

  // Decode the JWT to get user information
  private decodeToken(token: string): any {
    const payload = token.split('.')[1];
    const decoded = atob(payload); // Decode base64
    return JSON.parse(decoded);
  }

  // Perform the logout action
  logout(): void {
    this.authService.logout();
  }


  switchCompany(): void {
    this.modalService
      .openModal(CompanySelectorComponent, { disableClose: false })
      .subscribe((selectedCompanyId) => {
        if (selectedCompanyId) {
          this.companiesService.setSelectedCompanyId(selectedCompanyId);
          // Optionally, refresh data or navigate as needed
        } else {
          console.warn('No company selected.');
        }
      });
  }

  
}
