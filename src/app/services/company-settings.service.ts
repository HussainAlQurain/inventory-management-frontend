import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Company } from '../models/company';
import { AutoRedistributeSetting } from '../models/AutoRedistributeSetting';
import { CompaniesService } from './companies.service';

@Injectable({
  providedIn: 'root'
})
export class CompanySettingsService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private companiesService: CompaniesService
  ) {}

  // Get company by ID
  getCompanyById(id: number): Observable<Company> {
    return this.http.get<Company>(`${this.apiUrl}/companies/${id}`);
  }

  // Update company
  updateCompany(id: number, companyData: Partial<Company>): Observable<Company> {
    return this.http.patch<Company>(`${this.apiUrl}/companies/${id}`, companyData);
  }

  // Get auto-redistribute settings for a company
  getAutoRedistributeSettings(companyId: number): Observable<AutoRedistributeSetting> {
    return this.http.get<AutoRedistributeSetting>(`${this.apiUrl}/companies/${companyId}/auto-redistribute-setting`);
  }

  // Update auto-redistribute settings
  updateAutoRedistributeSettings(companyId: number, settings: Partial<AutoRedistributeSetting>): Observable<AutoRedistributeSetting> {
    return this.http.put<AutoRedistributeSetting>(`${this.apiUrl}/companies/${companyId}/auto-redistribute-setting`, settings);
  }
}