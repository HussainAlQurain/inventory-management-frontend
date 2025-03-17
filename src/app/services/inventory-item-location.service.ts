// inventory-item-location.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CompaniesService } from './companies.service';
import { LocationInventory } from '../models/LocationInventory';

@Injectable({
  providedIn: 'root'
})
export class InventoryItemLocationService {
  private baseUrl = environment.apiUrl + '/inventory-item-locations';

  constructor(
    private http: HttpClient,
    private companiesService: CompaniesService
  ) {}

  // ...
  // NEW:
  bulkUpdate(itemId: number, payload: { newMin?: number; newPar?: number }): Observable<void> {
    const companyId = this.companiesService.getSelectedCompanyId();
    return this.http.post<void>(
      `${this.baseUrl}/bulk-update`,
      {
        itemId,
        ...payload,
        companyId
      }
    );
  }

  getItemLocations(itemId: number): Observable<LocationInventory[]> {
    const companyId = this.companiesService.getSelectedCompanyId();
    return this.http.get<LocationInventory[]>(
      `${this.baseUrl}/item/${itemId}/company/${companyId}`
    );
  }
}
