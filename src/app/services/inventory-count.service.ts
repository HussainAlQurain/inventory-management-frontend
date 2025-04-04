import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { InventoryCountSession } from '../models/InventoryCountSession';
import { CompaniesService } from './companies.service';

@Injectable({
  providedIn: 'root'
})
export class InventoryCountService {
  private apiUrl = `${environment.apiUrl}`;

  constructor(
    private http: HttpClient,
    private companiesService: CompaniesService
  ) { }

  getInventoryCountSessions(locationId: number, startDate?: string, endDate?: string): Observable<InventoryCountSession[]> {
    const companyId = this.companiesService.getSelectedCompanyId() || 1;
    
    let url = `${this.apiUrl}/locations/${locationId}/inventory-count-sessions/company/${companyId}`;
    
    // Add query params if provided
    if (startDate || endDate) {
      const params: string[] = [];
      if (startDate) params.push(`startDate=${startDate}`);
      if (endDate) params.push(`endDate=${endDate}`);
      url += `?${params.join('&')}`;
    }
    
    return this.http.get<InventoryCountSession[]>(url);
  }

  createInventoryCountSession(locationId: number, session: Partial<InventoryCountSession>): Observable<InventoryCountSession> {
    const companyId = this.companiesService.getSelectedCompanyId() || 1;
    return this.http.post<InventoryCountSession>(
      `${this.apiUrl}/locations/${locationId}/inventory-count-sessions/company/${companyId}`,
      session
    );
  }
}
