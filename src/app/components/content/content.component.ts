import { Component } from '@angular/core';
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
export class ContentComponent {
  data: Company[] = [];

  constructor(private companyService: CompaniesService, private authService: AuthService){

  }
  ngOnInit(): void {
    this.authService.login().subscribe(_ => {
      this.companyService.getCompanies().subscribe(_data => {
        this.data = _data;
      })
    })
  }

}
