// inventory-item-location.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CompaniesService } from './companies.service';
import { LocationInventory } from '../models/LocationInventory';
import { PaginatedResponse } from './inventory-items-service.service';

// Interface for the on-hand totals
export interface ItemOnHandTotals {
  itemId: number;
  totalQuantity: number;
  totalValue: number;
}

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

  // NEW METHOD: Get on-hand totals without loading all locations
  getItemOnHandTotals(itemId: number): Observable<ItemOnHandTotals> {
    const companyId = this.companiesService.getSelectedCompanyId();
    return this.http.get<ItemOnHandTotals>(
      `${this.baseUrl}/item/${itemId}/company/${companyId}/totals`
    );
  }

  // UPDATED METHOD: Get paginated item locations with search
  getPaginatedItemLocations(
    itemId: number, 
    page: number = 0, 
    size: number = 10, 
    locationSearch?: string
  ): Observable<PaginatedResponse<LocationInventory>> {
    const companyId = this.companiesService.getSelectedCompanyId();
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    
    if (locationSearch) {
      params = params.set('locationSearch', locationSearch);
    }
    
    return this.http.get<PaginatedResponse<LocationInventory>>(
      `${this.baseUrl}/item/${itemId}/company/${companyId}/paginated`,
      { params }
    );
  }

  // Keep for backwards compatibility until refactoring is complete
  getItemLocations(itemId: number): Observable<LocationInventory[]> {
    const companyId = this.companiesService.getSelectedCompanyId();
    return this.http.get<LocationInventory[]>(
      `${this.baseUrl}/item/${itemId}/company/${companyId}`
    );
  }

  // New endpoint to get all locations for an item
  getAllLocationsForItem(itemId: number): Observable<LocationInventory[]> {
    return this.http.get<LocationInventory[]>(
      `${this.baseUrl}/item/${itemId}`
    );
  }

  // New endpoint to get specific location data for an item
  getItemLocationData(itemId: number, locationId: number): Observable<LocationInventory> {
    return this.http.get<LocationInventory>(
      `${this.baseUrl}/item/${itemId}/location/${locationId}`
    );
  }

  // TODO: Update this later to actually allow selecting a location
  // For now, hardcoded to location ID 1
  getSelectedLocationId(): number {
    return 1;
  }
}
