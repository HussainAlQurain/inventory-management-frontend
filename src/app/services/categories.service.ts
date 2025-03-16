import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { CompaniesService } from './companies.service';
import { Observable } from 'rxjs';
import { Category } from '../models/Category';

@Injectable({
  providedIn: 'root'
})
export class CategoriesService {
  private baseUrl = environment.apiUrl + '/categories';

  constructor(
    private http: HttpClient,
    private companiesService: CompaniesService
  ) { }

  getAllCategories(searchTerm: string = ''): Observable<Category[]> {
    const companyId = this.companiesService.getSelectedCompanyId();
    return this.http.get<Category[]>(`${this.baseUrl}/company/${companyId}?search=${searchTerm}`);
  }
  

  createCategory(newCat: Partial<Category>): Observable<Category> {
    const companyId = this.companiesService.getSelectedCompanyId();
    return this.http.post<Category>(`${this.baseUrl}/company/${companyId}`, newCat);
  }

}
