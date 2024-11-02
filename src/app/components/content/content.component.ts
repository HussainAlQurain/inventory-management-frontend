import { Component, OnInit } from '@angular/core';
import { Company } from '../../models/company';
import { CompaniesService } from '../../services/companies.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-content',
  standalone: true,
  imports: [],
  templateUrl: './content.component.html',
  styleUrl: './content.component.scss'
})
export class ContentComponent implements OnInit {
  data: Company[] = [];

  constructor(private companyService: CompaniesService, private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.authenticated$.subscribe(isAuthenticated => {
      console.log('Authentication status:', isAuthenticated);
      if (isAuthenticated) {
        this.loadCompanies();
      } else {
        console.warn('User not authenticated. Redirecting to login.');
      }
    });
  }
  

  loadCompanies(): void {
    this.companyService.getCompanies().subscribe(_data => {
      this.data = _data;
    });
  }

}
