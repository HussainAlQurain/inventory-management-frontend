import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Observable, catchError, throwError } from 'rxjs';
import { InventoryItem } from '../models/InventoryItem';
import { CompaniesService } from './companies.service';
import { PaginatedResponse } from '../models/paginated-response';
import { InventoryItemListDTO } from '../models/InventoryItemListDTO';

@Injectable({
  providedIn: 'root'
})
export class InventoryItemsService {
  private baseUrl = environment.apiUrl + "/inventory-items";

  constructor(
    private http: HttpClient,
    private companiesService: CompaniesService
  ) {}

  // New method for paginated inventory items
  getPaginatedInventoryItems(
    page: number = 0,
    size: number = 10,
    sort: string = "name,asc",
    categoryId?: number,
    searchTerm?: string,
    includeDetails: boolean = false
  ): Observable<PaginatedResponse<InventoryItem>> {
    const companyId = this.companiesService.getSelectedCompanyId();
    if (!companyId) {
      return throwError(() => new Error('No company selected'));
    }
    
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', sort);

    if (categoryId) {
      params = params.set('categoryId', categoryId.toString());
    }

    if (searchTerm) {
      params = params.set('search', searchTerm);
    }

    if (includeDetails) {
      params = params.set('includeDetails', includeDetails.toString());
    }
    
    return this.http.get<PaginatedResponse<InventoryItem>>(
      `${this.baseUrl}/company/${companyId}/paginated`,
      { params }
    ).pipe(
      catchError(error => {
        console.error('Error fetching paginated inventory items:', error);
        return throwError(() => new Error('Error fetching paginated inventory items.'));
      })
    );
  }

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
    const companyId = this.companiesService.getSelectedCompanyId();
    if (!companyId) {
      return throwError(() => new Error('No company selected'));
    }
    
    return this.http.get<InventoryItem>(`${this.baseUrl}/${id}/company/${companyId}`).pipe(
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


  //optimized inventory-items
  getPaginatedInventoryItemsList(
    page: number = 0,
    size: number = 10,
    sort: string = "name,asc",
    categoryId?: number,
    search?: string
  ): Observable<PaginatedResponse<InventoryItemListDTO>> {
    const companyId = this.companiesService.getSelectedCompanyId();
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', sort);
    
    if (search) {
      params = params.set('search', search);
    }
    
    if (categoryId) {
      params = params.set('categoryId', categoryId.toString());
    }
    
    return this.http.get<PaginatedResponse<InventoryItemListDTO>>(
      `${this.baseUrl}/company/${companyId}/paginated-list`,
      { params }
    );
  }

}