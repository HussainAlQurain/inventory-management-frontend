import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { UnitOfMeasure, UnitOfMeasureCategory } from '../models/UnitOfMeasure';
import { CompaniesService } from './companies.service';
import { UomFilterOptionDTO } from '../models/UomFilterOptionDTO';
import { PaginatedResponse } from '../models/paginated-response';

@Injectable({
  providedIn: 'root'
})
export class UomService {
  private baseUrl = environment.apiUrl + '/unit-of-measures';

  constructor(
    private http: HttpClient,
    private companiesService: CompaniesService
  ) { }

  getAllUoms(): Observable<UnitOfMeasure[]> {
    const companyId = this.companiesService.getSelectedCompanyId();
    return this.http.get<UnitOfMeasure[]>(`${this.baseUrl}/company/${companyId}`);
  }

  getUomById(id: number): Observable<UnitOfMeasure> {
    const companyId = this.companiesService.getSelectedCompanyId();
    return this.http.get<UnitOfMeasure>(`${this.baseUrl}/${id}/company/${companyId}`);
  }

  createUom(uom: UnitOfMeasure): Observable<UnitOfMeasure> {
    const companyId = this.companiesService.getSelectedCompanyId();
    return this.http.post<UnitOfMeasure>(`${this.baseUrl}/company/${companyId}`, uom);
  }

  updateUom(uom: Partial<UnitOfMeasure>): Observable<UnitOfMeasure> {
    const companyId = this.companiesService.getSelectedCompanyId();
    return this.http.patch<UnitOfMeasure>(`${this.baseUrl}/${uom.id}/company/${companyId}`, uom);
  }

  deleteUom(id: number): Observable<void> {
    const companyId = this.companiesService.getSelectedCompanyId();
    return this.http.delete<void>(`${this.baseUrl}/${id}/company/${companyId}`);
  }

  getAllUomCategories(): Observable<UnitOfMeasureCategory[]> {
    const companyId = this.companiesService.getSelectedCompanyId();
    return this.http.get<UnitOfMeasureCategory[]>(`${this.baseUrl}/categories/company/${companyId}`);
  }
  
  getPaginatedUomFilterOptions(
    page: number = 0,
    size: number = 10,
    searchTerm: string = ''
  ): Observable<PaginatedResponse<UomFilterOptionDTO>> {
    const companyId = this.companiesService.getSelectedCompanyId();
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    
    if (searchTerm) {
      params = params.set('search', searchTerm);
    }
    
    return this.http.get<PaginatedResponse<UomFilterOptionDTO>>(
      `${this.baseUrl}/company/${companyId}/filter-options/paginated`,
      { params }
    );
  }
}
