import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Transfer, TransferLine, TransferRequest } from '../models/Transfer';
import { PaginatedResponse } from '../models/paginated-response';

@Injectable({
  providedIn: 'root'
})
export class TransferService {
  private baseUrl = `${environment.apiUrl}/transfers`;

  constructor(private http: HttpClient) { }

  // Create a new transfer request
  createTransfer(transfer: TransferRequest): Observable<Transfer> {
    return this.http.post<Transfer>(this.baseUrl, transfer);
  }

  // Get a specific transfer by ID
  getTransfer(id: number): Observable<Transfer> {
    return this.http.get<Transfer>(`${this.baseUrl}/${id}`);
  }

  // Get outgoing transfers for a specific location
  getOutgoingTransfers(locationId: number): Observable<Transfer[]> {
    return this.http.get<Transfer[]>(`${this.baseUrl}/location/${locationId}/outgoing`);
  }

  // Get incoming transfers for a specific location
  getIncomingTransfers(locationId: number): Observable<Transfer[]> {
    return this.http.get<Transfer[]>(`${this.baseUrl}/location/${locationId}/incoming`);
  }

  // Get outgoing transfers for a company
  getCompanyOutgoingTransfers(companyId: number): Observable<Transfer[]> {
    return this.http.get<Transfer[]>(`${this.baseUrl}/company/${companyId}/outgoing`);
  }

  // Get incoming transfers for a company
  getCompanyIncomingTransfers(companyId: number): Observable<Transfer[]> {
    return this.http.get<Transfer[]>(`${this.baseUrl}/company/${companyId}/incoming`);
  }

  // Get completed transfers for a company
  getCompanyCompletedTransfers(companyId: number): Observable<Transfer[]> {
    return this.http.get<Transfer[]>(`${this.baseUrl}/company/${companyId}/completed`);
  }

  // Get completed transfers for a location
  getLocationCompletedTransfers(locationId: number, fromLocation: boolean): Observable<Transfer[]> {
    let params = new HttpParams().set('fromLocation', fromLocation.toString());
    return this.http.get<Transfer[]>(`${this.baseUrl}/location/${locationId}/completed`, { params });
  }

  // Delete a transfer
  deleteTransfer(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  // Update transfer lines
  updateTransferLines(id: number, actingLocationId: number, lines: TransferLine[]): Observable<Transfer> {
    let params = new HttpParams().set('actingLocationId', actingLocationId.toString());
    return this.http.put<Transfer>(`${this.baseUrl}/${id}/lines`, lines, { params });
  }

  // Complete a transfer
  completeTransfer(id: number): Observable<Transfer> {
    return this.http.post<Transfer>(`${this.baseUrl}/${id}/complete`, {});
  }

  // Add these methods to your TransferService class
  getPaginatedOutgoingTransfers(
    companyId: number,
    page: number = 0,
    size: number = 10,
    search?: string,
    sort: string = 'creationDate,desc',
    locationId?: number
  ): Observable<PaginatedResponse<Transfer>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', sort);

    if (search) params = params.set('search', search);
    if (locationId) params = params.set('locationId', locationId.toString());

    return this.http.get<PaginatedResponse<Transfer>>(
      `${this.baseUrl}/company/${companyId}/outgoing/paginated`,
      { params }
    );
  }

  getPaginatedIncomingTransfers(
    companyId: number,
    page: number = 0,
    size: number = 10,
    search?: string,
    sort: string = 'creationDate,desc',
    locationId?: number
  ): Observable<PaginatedResponse<Transfer>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', sort);

    if (search) params = params.set('search', search);
    if (locationId) params = params.set('locationId', locationId.toString());

    return this.http.get<PaginatedResponse<Transfer>>(
      `${this.baseUrl}/company/${companyId}/incoming/paginated`,
      { params }
    );
  }

  getPaginatedCompletedTransfers(
    companyId: number,
    page: number = 0,
    size: number = 10,
    search?: string,
    sort: string = 'completionDate,desc',
    locationId?: number,
    fromLocation: boolean = false
  ): Observable<PaginatedResponse<Transfer>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', sort)
      .set('fromLocation', fromLocation.toString());

    if (search) params = params.set('search', search);
    if (locationId) params = params.set('locationId', locationId.toString());

    return this.http.get<PaginatedResponse<Transfer>>(
      `${this.baseUrl}/company/${companyId}/completed/paginated`,
      { params }
    );
  }
}