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
}