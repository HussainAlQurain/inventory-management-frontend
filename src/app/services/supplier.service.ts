import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { Supplier, SupplierEmail, SupplierPhone } from '../models/Supplier';
import { CompaniesService } from './companies.service';
import { LocationService } from './location.service';

@Injectable({
  providedIn: 'root'
})
export class SupplierService {
  private baseUrl = environment.apiUrl + '/suppliers';

  constructor(
    private http: HttpClient,
    private companiesService: CompaniesService,
    private locationService: LocationService
  ) { }

  getAllSuppliers(): Observable<Supplier[]> {
    const companyId = this.companiesService.getSelectedCompanyId();
    return this.http.get<Supplier[]>(`${this.baseUrl}/company/${companyId}`)
    .pipe(
      map(suppliers => suppliers.map(supplier => {
        // Normalize the data structure
        if (supplier.orderEmails && !supplier.emails) {
          supplier.emails = supplier.orderEmails.map(email => ({
            ...email,
            isDefault: email.default
          }));
        }
        
        if (supplier.orderPhones && !supplier.phones) {
          supplier.phones = supplier.orderPhones.map(phone => ({
            ...phone,
            isDefault: phone.default
          }));
        }
        
        return supplier;
      }))
    );

  }

  getSupplierById(id: number): Observable<Supplier> {
    const companyId = this.companiesService.getSelectedCompanyId();
    return this.http.get<Supplier>(`${this.baseUrl}/${id}/company/${companyId}`)
    .pipe(
      map(supplier => {
        // Normalize the data structure by copying orderEmails to emails and orderPhones to phones
        if (supplier.orderEmails && !supplier.emails) {
          supplier.emails = supplier.orderEmails.map(email => ({
            ...email,
            isDefault: email.default // Copy default to isDefault for UI
          }));
        }
        
        if (supplier.orderPhones && !supplier.phones) {
          supplier.phones = supplier.orderPhones.map(phone => ({
            ...phone,
            isDefault: phone.default // Copy default to isDefault for UI
          }));
        }
        
        return supplier;
      })
    );

  }

  createSupplier(supplier: Supplier): Observable<Supplier> {
    const companyId = this.companiesService.getSelectedCompanyId();
    const locationId = this.locationService.getSelectedLocationId();
    const apiSupplier = { ...supplier };
    
    // Transform emails (ensure locationId is set)
    if (apiSupplier.emails && apiSupplier.emails.length > 0) {
      apiSupplier.emails = apiSupplier.emails.map((email: SupplierEmail) => ({
        ...email,
        locationId: email.locationId || locationId,
        default: email.isDefault
      }));      
    }
    
    // Transform phones (ensure locationId is set)
    if (apiSupplier.phones && apiSupplier.phones.length > 0) {
      apiSupplier.phones = apiSupplier.phones.map((phone: SupplierPhone) => ({
        ...phone,
        locationId: phone.locationId || locationId,
        default: phone.isDefault
      }));
    }
    
    return this.http.post<Supplier>(`${this.baseUrl}/company/${companyId}`, apiSupplier);

  }

  updateSupplier(supplier: Partial<Supplier>): Observable<Supplier> {
    const companyId = this.companiesService.getSelectedCompanyId();
    const locationId = this.locationService.getSelectedLocationId();
    const apiSupplier = { ...supplier };
    
    // Transform emails (ensure locationId is set)
    if (apiSupplier.emails && apiSupplier.emails.length > 0) {
      apiSupplier.emails = apiSupplier.emails.map((email: SupplierEmail) => ({
        ...email,
        locationId: email.locationId || locationId,
        default: email.isDefault
      }));      
    }
    
    // Transform phones (ensure locationId is set)
    if (apiSupplier.phones && apiSupplier.phones.length > 0) {
      apiSupplier.phones = apiSupplier.phones.map((phone: SupplierPhone) => ({
        ...phone,
        locationId: phone.locationId || locationId,
        default: phone.isDefault
      }));
    }
    return this.http.patch<Supplier>(`${this.baseUrl}/${supplier.id}/company/${companyId}`, apiSupplier);
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
    return this.http.get<Supplier[]>(`${this.baseUrl}/company/${companyId}/search?search=${term}`)
    .pipe(
      map(suppliers => suppliers.map(supplier => {
        // Normalize the data structure
        if (supplier.orderEmails && !supplier.emails) {
          supplier.emails = supplier.orderEmails.map(email => ({
            ...email,
            isDefault: email.default
          }));
        }
        
        if (supplier.orderPhones && !supplier.phones) {
          supplier.phones = supplier.orderPhones.map(phone => ({
            ...phone,
            isDefault: phone.default
          }));
        }
        
        return supplier;
      }))
    );
  }
}
