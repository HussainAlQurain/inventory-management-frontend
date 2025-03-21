import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Observable, catchError, throwError } from 'rxjs';
import { InventoryItem } from '../models/InventoryItem';
import { CompaniesService } from './companies.service';

@Injectable({
  providedIn: 'root'
})
export class InventoryItemsService {
  private baseUrl = environment.apiUrl + "/inventory-items";

  constructor(
    private http: HttpClient,
    private companiesService: CompaniesService
  ) {}

  getInventoryItemsByCompany(): Observable<InventoryItem[]> {
    const companyId = this.companiesService.getSelectedCompanyId();
    if (!companyId) {
      return throwError(() => new Error('No company selected'));
    }
    
    return this.http.get<InventoryItem[]>(`${this.baseUrl}/company/${companyId}`).pipe(
      catchError(error => {
        console.error('Error fetching inventory items:', error);
        return throwError(() => new Error('Error fetching inventory items.'));
      })
    );
  }

  getInventoryItemById(id: number): Observable<InventoryItem> {
    return this.http.get<InventoryItem>(`${this.baseUrl}/${id}`).pipe(
      catchError(error => {
        console.error(`Error fetching inventory item with ID ${id}:`, error);
        return throwError(() => new Error(`Error fetching inventory item with ID ${id}.`));
      })
    );
  }

  partialUpdateItem(itemId: number, partialDto: any, companyId: number): Observable<InventoryItem> {
    // or get companyId from this.companiesService if you prefer
    return this.http.patch<InventoryItem>(
      `${this.baseUrl}/${itemId}/company/${companyId}`,
      partialDto
    );
  }

  createInventoryItem(itemData: any): Observable<InventoryItem> {
    const companyId = this.companiesService.getSelectedCompanyId();
    if (!companyId) {
      return throwError(() => new Error('No company selected'));
    }
    
    return this.http.post<InventoryItem>(`${this.baseUrl}/company/${companyId}`, itemData).pipe(
      catchError(error => {
        console.error('Error creating inventory item:', error);
        return throwError(() => new Error('Error creating inventory item.'));
      })
    );
  }
}