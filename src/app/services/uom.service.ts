import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { UnitOfMeasure, UnitOfMeasureCategory } from '../models/UnitOfMeasure';
import { CompaniesService } from './companies.service';

@Injectable({
  providedIn: 'root'
})
export class UomService {
  private baseUrl = environment.apiUrl + '/unit-of-measures'; // Adjust based on actual API endpoint

  constructor(
    private http: HttpClient,
    private companiesService: CompaniesService
  ) { }

  getAllUoms(): Observable<UnitOfMeasure[]> {
    const companyId = this.companiesService.getSelectedCompanyId();
    // TODO - missing implementation - endpoint not yet defined in backend
    return this.http.get<UnitOfMeasure[]>(`${this.baseUrl}/company/${companyId}`);
  }

  getUomById(id: number): Observable<UnitOfMeasure> {
    // TODO - missing implementation - endpoint not yet defined in backend
    const companyId = this.companiesService.getSelectedCompanyId();
    return this.http.get<UnitOfMeasure>(`${this.baseUrl}/${id}/company/${companyId}`);
  }

  createUom(uom: UnitOfMeasure): Observable<UnitOfMeasure> {
    // TODO - missing implementation - endpoint not yet defined in backend
    const companyId = this.companiesService.getSelectedCompanyId();
    return this.http.post<UnitOfMeasure>(`${this.baseUrl}/company/${companyId}`, uom);
  }

  updateUom(uom: Partial<UnitOfMeasure>): Observable<UnitOfMeasure> {
    // TODO - missing implementation - endpoint not yet defined in backend
    const companyId = this.companiesService.getSelectedCompanyId();
    return this.http.patch<UnitOfMeasure>(`${this.baseUrl}/${uom.id}/company/${companyId}`, uom);
  }

  deleteUom(id: number): Observable<void> {
    // TODO - missing implementation - endpoint not yet defined in backend
    const companyId = this.companiesService.getSelectedCompanyId();
    return this.http.delete<void>(`${this.baseUrl}/${id}/company/${companyId}`);
  }

  getAllUomCategories(): Observable<UnitOfMeasureCategory[]> {
    // TODO - missing implementation - endpoint not yet defined in backend
    const companyId = this.companiesService.getSelectedCompanyId();
    return this.http.get<UnitOfMeasureCategory[]>(`${this.baseUrl}/categories/company/${companyId}`);
  }
}
