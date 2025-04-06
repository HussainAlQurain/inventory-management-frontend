import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { InventoryCountSession, InventoryCountLine } from '../models/InventoryCountSession';
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
    // Fix the endpoint to use the correct path without company ID. Might make it use id from backend directly by checking authorization or update the routes.
    return this.http.post<InventoryCountSession>(
      `${this.apiUrl}/locations/${locationId}/inventory-count-sessions`,
      session
    );
  }
  
  // Get a specific inventory count session by ID
  getInventoryCountSessionById(locationId: number, sessionId: number): Observable<InventoryCountSession> {
    return this.http.get<InventoryCountSession>(
      `${this.apiUrl}/locations/${locationId}/inventory-count-sessions/${sessionId}`
    );
  }
  
  // Get inventory count lines for a session
  getInventoryCountLines(locationId: number, sessionId: number): Observable<InventoryCountLine[]> {
    return this.http.get<InventoryCountLine[]>(
      `${this.apiUrl}/locations/${locationId}/inventory-count-sessions/${sessionId}/lines`
    );
  }
  
  // Update an inventory count session
  updateInventoryCountSession(locationId: number, sessionId: number, session: Partial<InventoryCountSession>): Observable<InventoryCountSession> {
    return this.http.patch<InventoryCountSession>(
      `${this.apiUrl}/locations/${locationId}/inventory-count-sessions/${sessionId}`,
      session
    );
  }
  
  // Update a specific inventory count line
  updateInventoryCountLine(locationId: number, sessionId: number, lineId: number, line: Partial<InventoryCountLine>): Observable<InventoryCountLine> {
    return this.http.patch<InventoryCountLine>(
      `${this.apiUrl}/locations/${locationId}/inventory-count-sessions/${sessionId}/lines/${lineId}`,
      line
    );
  }
  
  // Lock an inventory count session
  lockInventoryCountSession(locationId: number, sessionId: number): Observable<InventoryCountSession> {
    return this.http.post<InventoryCountSession>(
      `${this.apiUrl}/locations/${locationId}/inventory-count-sessions/${sessionId}/lock`,
      {}
    );
  }
  
  // Unlock an inventory count session
  unlockInventoryCountSession(locationId: number, sessionId: number): Observable<InventoryCountSession> {
    return this.http.post<InventoryCountSession>(
      `${this.apiUrl}/locations/${locationId}/inventory-count-sessions/${sessionId}/unlock`,
      {}
    );
  }
}
