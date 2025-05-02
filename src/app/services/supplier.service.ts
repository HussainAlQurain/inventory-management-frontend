import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { Supplier, SupplierEmail, SupplierPhone } from '../models/Supplier';
import { environment } from '../../environments/environment';
import { CompaniesService } from './companies.service';
import { PaginatedResponse } from '../models/paginated-response';

@Injectable({
  providedIn: 'root'
})
export class SupplierService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private companiesService: CompaniesService
  ) {}

  // Get paginated suppliers
  getPaginatedSuppliers(
    page: number = 0,
    size: number = 10,
    sort: string = "name,asc",
    searchTerm?: string
  ): Observable<PaginatedResponse<Supplier>> {
    const companyId = this.companiesService.getSelectedCompanyId();

    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', sort);

    if (searchTerm) {
      params = params.set('search', searchTerm);
    }
    
    return this.http.get<PaginatedResponse<Supplier>>(
      `${this.apiUrl}/suppliers/company/${companyId}/paginated`,
      { params }
    ).pipe(
      map(response => {
        response.content = this.normalizeSupplierContacts(response.content);
        return response;
      }),
      catchError(error => {
        console.error('Error fetching paginated suppliers:', error);
        throw error;
      })
    );
  }

  // Get all suppliers for a company
  getAllSuppliers(): Observable<Supplier[]> {
    const companyId = this.companiesService.getSelectedCompanyId();
    return this.http.get<Supplier[]>(`${this.apiUrl}/suppliers/company/${companyId}`).pipe(
      map(suppliers => this.normalizeSupplierContacts(suppliers)),
      catchError(error => {
        console.error('Error fetching suppliers', error);
        return of([]);
      })
    );
  }

  // Search suppliers by term
  searchSuppliers(searchTerm: string): Observable<Supplier[]> {
    const companyId = this.companiesService.getSelectedCompanyId();
    return this.http.get<Supplier[]>(`${this.apiUrl}/suppliers/company/${companyId}/search?search=${searchTerm}`).pipe(
      map(suppliers => this.normalizeSupplierContacts(suppliers)),
      catchError(error => {
        console.error('Error searching suppliers', error);
        return of([]);
      })
    );
  }

  // Get supplier by ID
  getSupplierById(supplierId: number): Observable<Supplier> {
    const companyId = this.companiesService.getSelectedCompanyId();
    return this.http.get<Supplier>(`${this.apiUrl}/suppliers/${supplierId}/company/${companyId}`).pipe(
      map(supplier => this.normalizeSupplierContacts([supplier])[0])
    );
  }

  // Create new supplier
  createSupplier(supplier: Supplier): Observable<Supplier> {
    const companyId = this.companiesService.getSelectedCompanyId();
    return this.http.post<Supplier>(`${this.apiUrl}/suppliers/company/${companyId}`, supplier).pipe(
      map(newSupplier => this.normalizeSupplierContacts([newSupplier])[0])
    );
  }

  // Update supplier
  updateSupplier(supplier: Supplier): Observable<Supplier> {
    const companyId = this.companiesService.getSelectedCompanyId();
    return this.http.patch<Supplier>(`${this.apiUrl}/suppliers/${supplier.id}/company/${companyId}`, supplier).pipe(
      map(updatedSupplier => this.normalizeSupplierContacts([updatedSupplier])[0])
    );
  }

  // Delete supplier
  deleteSupplier(supplierId: number): Observable<void> {
    const companyId = this.companiesService.getSelectedCompanyId();
    return this.http.delete<void>(`${this.apiUrl}/suppliers/${supplierId}/company/${companyId}`);
  }

  // Email management
  getSupplierEmails(supplierId: number): Observable<SupplierEmail[]> {
    const companyId = this.companiesService.getSelectedCompanyId();
    return this.http.get<SupplierEmail[]>(`${this.apiUrl}/suppliers/${supplierId}/company/${companyId}/emails`);
  }

  addSupplierEmail(supplierId: number, email: Partial<SupplierEmail>): Observable<SupplierEmail> {
    const companyId = this.companiesService.getSelectedCompanyId();
    return this.http.post<SupplierEmail>(`${this.apiUrl}/suppliers/${supplierId}/company/${companyId}/emails`, email);
  }

  updateSupplierEmail(supplierId: number, emailId: number, email: Partial<SupplierEmail>): Observable<SupplierEmail> {
    const companyId = this.companiesService.getSelectedCompanyId();
    return this.http.patch<SupplierEmail>(`${this.apiUrl}/suppliers/${supplierId}/company/${companyId}/emails/${emailId}`, email);
  }

  deleteSupplierEmail(supplierId: number, emailId: number): Observable<void> {
    const companyId = this.companiesService.getSelectedCompanyId();
    return this.http.delete<void>(`${this.apiUrl}/suppliers/${supplierId}/company/${companyId}/emails/${emailId}`);
  }

  // Phone management
  getSupplierPhones(supplierId: number): Observable<SupplierPhone[]> {
    const companyId = this.companiesService.getSelectedCompanyId();
    return this.http.get<SupplierPhone[]>(`${this.apiUrl}/suppliers/${supplierId}/company/${companyId}/phones`);
  }

  addSupplierPhone(supplierId: number, phone: Partial<SupplierPhone>): Observable<SupplierPhone> {
    const companyId = this.companiesService.getSelectedCompanyId();
    return this.http.post<SupplierPhone>(`${this.apiUrl}/suppliers/${supplierId}/company/${companyId}/phones`, phone);
  }

  updateSupplierPhone(supplierId: number, phoneId: number, phone: Partial<SupplierPhone>): Observable<SupplierPhone> {
    const companyId = this.companiesService.getSelectedCompanyId();
    return this.http.patch<SupplierPhone>(`${this.apiUrl}/suppliers/${supplierId}/company/${companyId}/phones/${phoneId}`, phone);
  }

  deleteSupplierPhone(supplierId: number, phoneId: number): Observable<void> {
    const companyId = this.companiesService.getSelectedCompanyId();
    return this.http.delete<void>(`${this.apiUrl}/suppliers/${supplierId}/company/${companyId}/phones/${phoneId}`);
  }

  // Helper function to normalize contact information (ensures backward compatibility)
  private normalizeSupplierContacts(suppliers: Supplier[]): Supplier[] {
    return suppliers.map(supplier => {
      const normalizedSupplier = { ...supplier };
      
      // Ensure emails are accessible via both orderEmails and emails properties
      if (supplier.orderEmails && !supplier.emails) {
        normalizedSupplier.emails = [...supplier.orderEmails];
      } else if (supplier.emails && !supplier.orderEmails) {
        normalizedSupplier.orderEmails = [...supplier.emails];
      }
      
      // Ensure phones are accessible via both orderPhones and phones properties
      if (supplier.orderPhones && !supplier.phones) {
        normalizedSupplier.phones = [...supplier.orderPhones];
      } else if (supplier.phones && !supplier.orderPhones) {
        normalizedSupplier.orderPhones = [...supplier.phones];
      }
      
      return normalizedSupplier;
    });
  }
}
