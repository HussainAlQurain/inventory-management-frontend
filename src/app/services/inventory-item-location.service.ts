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

  // Remove deprecated bulkUpdate and replace with bulkSetThresholdsForCompany
  bulkSetThresholdsForCompany(
    itemId: number, 
    minOnHand?: number, 
    parLevel?: number
  ): Observable<void> {
    const companyId = this.companiesService.getSelectedCompanyId();
    return this.http.put<void>(
      `${this.baseUrl}/items/${itemId}/companies/${companyId}/thresholds`,
      {
        minOnHand: minOnHand,
        parLevel: parLevel
      }
    );
  }

  // Keep the location-specific update method
  updateLocationThresholds(
    itemId: number, 
    locationId: number, 
    minOnHand?: number, 
    parLevel?: number
  ): Observable<void> {
    return this.http.put<void>(
      `${this.baseUrl}/items/${itemId}/locations/${locationId}/thresholds`,
      {
        minOnHand: minOnHand,
        parLevel: parLevel
      }
    );
  }

  getItemLocations(itemId: number): Observable<LocationInventory[]> {
    const companyId = this.companiesService.getSelectedCompanyId();
    return this.http.get<LocationInventory[]>(
      `${this.baseUrl}/item/${itemId}/company/${companyId}`
    );
  }

  // TODO: Update this later to actually allow selecting a location
  // For now, hardcoded to location ID 1
  getSelectedLocationId(): number {
    return 1;
  }
}
