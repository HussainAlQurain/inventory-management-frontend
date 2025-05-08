import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { CompaniesService } from './companies.service';
import { Observable } from 'rxjs';
import { Category } from '../models/Category';
import { FilterOptionDTO } from '../models/FilterOptionDTO';
import { PaginatedResponse } from '../models/paginated-response';

@Injectable({
  providedIn: 'root'
})
export class CategoriesService {
  private baseUrl = environment.apiUrl + '/categories';

  constructor(
    private http: HttpClient,
    private companiesService: CompaniesService
  ) { }

  // getAllCategories(searchTerm: string = ''): Observable<Category[]> {
  //   const companyId = this.companiesService.getSelectedCompanyId();
  //   return this.http.get<Category[]>(`${this.baseUrl}/company/${companyId}?search=${searchTerm}`);
  // }
  
  createCategory(newCat: Partial<Category>): Observable<Category> {
    const companyId = this.companiesService.getSelectedCompanyId();
    return this.http.post<Category>(`${this.baseUrl}/company/${companyId}`, newCat);
  }

  updateCategory(category: Partial<Category>): Observable<Category> {
    const companyId = this.companiesService.getSelectedCompanyId();
    return this.http.patch<Category>(`${this.baseUrl}/${category.id}/company/${companyId}`, category);
  }

  deleteCategory(categoryId: number): Observable<void> {
    const companyId = this.companiesService.getSelectedCompanyId();
    return this.http.delete<void>(`${this.baseUrl}/${categoryId}/company/${companyId}`);
  }

  getCategoryFilterOptions(searchTerm: string = ''): Observable<FilterOptionDTO[]> {
    const companyId = this.companiesService.getSelectedCompanyId();
    let params = new HttpParams();
    
    if (searchTerm) {
      params = params.set('search', searchTerm);
    }
    
    return this.http.get<FilterOptionDTO[]>(
      `${this.baseUrl}/company/${companyId}/filter-options`,
      { params }
    );
  }

  getPaginatedCategoryFilterOptions(
    page: number = 0,
    size: number = 10,
    searchTerm: string = ''
  ): Observable<PaginatedResponse<FilterOptionDTO>> {
    const companyId = this.companiesService.getSelectedCompanyId();
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    
    if (searchTerm) {
      params = params.set('search', searchTerm);
    }
    
    return this.http.get<PaginatedResponse<FilterOptionDTO>>(
      `${this.baseUrl}/company/${companyId}/filter-options/paginated`,
      { params }
    );
  }
}
