import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { Supplier, SupplierEmail, SupplierPhone } from '../models/Supplier';
import { CompaniesService } from './companies.service';

@Injectable({
  providedIn: 'root'
})
export class SupplierService {
  private baseUrl = environment.apiUrl + '/suppliers';

  constructor(
    private http: HttpClient,
    private companiesService: CompaniesService
  ) { }

  getAllSuppliers(): Observable<Supplier[]> {
    const companyId = this.companiesService.getSelectedCompanyId();
    return this.http.get<Supplier[]>(`${this.baseUrl}/company/${companyId}`);
  }

  getSupplierById(id: number): Observable<Supplier> {
    const companyId = this.companiesService.getSelectedCompanyId();
    return this.http.get<Supplier>(`${this.baseUrl}/${id}/company/${companyId}`);
  }

  createSupplier(supplier: Supplier): Observable<Supplier> {
    const companyId = this.companiesService.getSelectedCompanyId();
    return this.http.post<Supplier>(`${this.baseUrl}/company/${companyId}`, supplier);
  }

  updateSupplier(supplier: Partial<Supplier>): Observable<Supplier> {
    const companyId = this.companiesService.getSelectedCompanyId();
    return this.http.patch<Supplier>(`${this.baseUrl}/${supplier.id}/company/${companyId}`, supplier);
  }

  deleteSupplier(id: number): Observable<void> {
    const companyId = this.companiesService.getSelectedCompanyId();
    return this.http.delete<void>(`${this.baseUrl}/${id}/company/${companyId}`);
  }

  // Supplier emails
  getSupplierEmails(supplierId: number): Observable<SupplierEmail[]> {
    const companyId = this.companiesService.getSelectedCompanyId();
    return this.http.get<SupplierEmail[]>(`${this.baseUrl}/${supplierId}/company/${companyId}/emails`);
  }

  createSupplierEmail(supplierId: number, email: SupplierEmail): Observable<SupplierEmail> {
    const companyId = this.companiesService.getSelectedCompanyId();
    return this.http.post<SupplierEmail>(`${this.baseUrl}/${supplierId}/company/${companyId}/emails`, email);
  }

  updateSupplierEmail(supplierId: number, email: SupplierEmail): Observable<SupplierEmail> {
    const companyId = this.companiesService.getSelectedCompanyId();
    return this.http.patch<SupplierEmail>(`${this.baseUrl}/${supplierId}/company/${companyId}/emails/${email.id}`, email);
  }

  deleteSupplierEmail(supplierId: number, emailId: number): Observable<void> {
    const companyId = this.companiesService.getSelectedCompanyId();
    return this.http.delete<void>(`${this.baseUrl}/${supplierId}/company/${companyId}/emails/${emailId}`);
  }

  // Supplier phones
  getSupplierPhones(supplierId: number): Observable<SupplierPhone[]> {
    const companyId = this.companiesService.getSelectedCompanyId();
    return this.http.get<SupplierPhone[]>(`${this.baseUrl}/${supplierId}/company/${companyId}/phones`);
  }

  createSupplierPhone(supplierId: number, phone: SupplierPhone): Observable<SupplierPhone> {
    const companyId = this.companiesService.getSelectedCompanyId();
    return this.http.post<SupplierPhone>(`${this.baseUrl}/${supplierId}/company/${companyId}/phones`, phone);
  }

  updateSupplierPhone(supplierId: number, phone: SupplierPhone): Observable<SupplierPhone> {
    const companyId = this.companiesService.getSelectedCompanyId();
    return this.http.patch<SupplierPhone>(`${this.baseUrl}/${supplierId}/company/${companyId}/phones/${phone.id}`, phone);
  }

  deleteSupplierPhone(supplierId: number, phoneId: number): Observable<void> {
    const companyId = this.companiesService.getSelectedCompanyId();
    return this.http.delete<void>(`${this.baseUrl}/${supplierId}/company/${companyId}/phones/${phoneId}`);
  }

  // For supplier search functionality
  searchSuppliers(term: string): Observable<Supplier[]> {
    if (!term.trim()) {
      return this.getAllSuppliers();
    }
    const companyId = this.companiesService.getSelectedCompanyId();
    // Update the endpoint to match the backend controller method
    return this.http.get<Supplier[]>(`${this.baseUrl}/company/${companyId}/search?search=${term}`);
  }
}
