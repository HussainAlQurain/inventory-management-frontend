import { Component } from '@angular/core';
import { Company } from '../../models/company';
import { CompaniesService } from '../../services/companies.service';

@Component({
  selector: 'app-content',
  standalone: true,
  imports: [],
  templateUrl: './content.component.html',
  styleUrl: './content.component.scss'
})
export class ContentComponent {
  data: Company[] = [];

  constructor(private companyService: CompaniesService){

  }
  ngOnInit(): void {
    this.companyService.getCompanies().subscribe(_data => {
      this.data = _data;
    })
  }

}
