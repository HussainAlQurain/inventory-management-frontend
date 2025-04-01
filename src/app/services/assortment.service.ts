import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Assortment, BulkIdRequest } from '../models/Assortment';
import { CompaniesService } from './companies.service';

@Injectable({
  providedIn: 'root'
})
export class AssortmentService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private companiesService: CompaniesService
  ) {}

  private getCompanyId(): number {
    return this.companiesService.getSelectedCompanyId() || 0;
  }

  getAllAssortments(): Observable<Assortment[]> {
    const companyId = this.getCompanyId();
    return this.http.get<Assortment[]>(`${this.apiUrl}/companies/${companyId}/assortments`);
  }

  getAssortmentById(id: number): Observable<Assortment> {
    const companyId = this.getCompanyId();
    return this.http.get<Assortment>(`${this.apiUrl}/companies/${companyId}/assortments/${id}`);
  }

  createSimpleAssortment(name: string): Observable<Assortment> {
    const companyId = this.getCompanyId();
    return this.http.post<Assortment>(`${this.apiUrl}/companies/${companyId}/assortments/simple?name=${encodeURIComponent(name)}`, {});
  }

  updateAssortment(id: number, assortment: Assortment): Observable<Assortment> {
    const companyId = this.getCompanyId();
    return this.http.put<Assortment>(`${this.apiUrl}/companies/${companyId}/assortments/${id}`, assortment);
  }

  partialUpdateAssortment(id: number, assortment: Partial<Assortment>): Observable<Assortment> {
    const companyId = this.getCompanyId();
    return this.http.patch<Assortment>(`${this.apiUrl}/companies/${companyId}/assortments/${id}`, assortment);
  }

  deleteAssortment(id: number): Observable<void> {
    const companyId = this.getCompanyId();
    return this.http.delete<void>(`${this.apiUrl}/companies/${companyId}/assortments/${id}`);
  }

  // Bulk operations for inventory items
  addInventoryItems(assortmentId: number, itemIds: number[]): Observable<Assortment> {
    const companyId = this.getCompanyId();
    const request: BulkIdRequest = { ids: itemIds };
    return this.http.post<Assortment>(
      `${this.apiUrl}/companies/${companyId}/assortments/${assortmentId}/items/add`,
      request
    );
  }

  removeInventoryItems(assortmentId: number, itemIds: number[]): Observable<Assortment> {
    const companyId = this.getCompanyId();
    const request: BulkIdRequest = { ids: itemIds };
    return this.http.post<Assortment>(
      `${this.apiUrl}/companies/${companyId}/assortments/${assortmentId}/items/remove`,
      request
    );
  }

  // Bulk operations for subrecipes
  addSubRecipes(assortmentId: number, subRecipeIds: number[]): Observable<Assortment> {
    const companyId = this.getCompanyId();
    const request: BulkIdRequest = { ids: subRecipeIds };
    return this.http.post<Assortment>(
      `${this.apiUrl}/companies/${companyId}/assortments/${assortmentId}/subrecipes/add`,
      request
    );
  }

  removeSubRecipes(assortmentId: number, subRecipeIds: number[]): Observable<Assortment> {
    const companyId = this.getCompanyId();
    const request: BulkIdRequest = { ids: subRecipeIds };
    return this.http.post<Assortment>(
      `${this.apiUrl}/companies/${companyId}/assortments/${assortmentId}/subrecipes/remove`,
      request
    );
  }

  // Bulk operations for purchase options
  addPurchaseOptions(assortmentId: number, purchaseOptionIds: number[]): Observable<Assortment> {
    const companyId = this.getCompanyId();
    const request: BulkIdRequest = { ids: purchaseOptionIds };
    return this.http.post<Assortment>(
      `${this.apiUrl}/companies/${companyId}/assortments/${assortmentId}/purchaseoptions/add`,
      request
    );
  }

  removePurchaseOptions(assortmentId: number, purchaseOptionIds: number[]): Observable<Assortment> {
    const companyId = this.getCompanyId();
    const request: BulkIdRequest = { ids: purchaseOptionIds };
    return this.http.post<Assortment>(
      `${this.apiUrl}/companies/${companyId}/assortments/${assortmentId}/purchaseoptions/remove`,
      request
    );
  }

  // Bulk operations for locations
  addLocations(assortmentId: number, locationIds: number[]): Observable<Assortment> {
    const companyId = this.getCompanyId();
    const request: BulkIdRequest = { ids: locationIds };
    return this.http.post<Assortment>(
      `${this.apiUrl}/companies/${companyId}/assortments/${assortmentId}/locations/add`,
      request
    );
  }

  removeLocations(assortmentId: number, locationIds: number[]): Observable<Assortment> {
    const companyId = this.getCompanyId();
    const request: BulkIdRequest = { ids: locationIds };
    return this.http.post<Assortment>(
      `${this.apiUrl}/companies/${companyId}/assortments/${assortmentId}/locations/remove`,
      request
    );
  }
}
