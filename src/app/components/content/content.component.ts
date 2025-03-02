import { Component, OnInit } from '@angular/core';
import { Company } from '../../models/company';
import { CompaniesService } from '../../services/companies.service';
import { AuthService } from '../../services/auth.service';
import { SidenavBarComponent } from "../../sidenav-bar/sidenav-bar.component";
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-content',
  standalone: true,
  imports: [SidenavBarComponent, RouterOutlet],
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
        // this.loadCompanies();
      } else {
        console.warn('User not authenticated. Redirecting to login.');
      }
    });
  }
  

  // loadCompanies(): void {
  //   this.companyService.getCompaniesByUserId(1).subscribe(_data => {
  //     this.data = _data;
  //   });
  // }

}
