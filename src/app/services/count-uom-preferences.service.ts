import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { UnitOfMeasure } from '../models/UnitOfMeasure';

export interface CountUomPreference {
  id?: number;
  inventoryItemId?: number;
  subRecipeId?: number;
  countUomId: number;
  defaultUom: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CountUomPreferencesService {
  private apiUrl = environment.apiUrl;
  
  constructor(private http: HttpClient) { }
  
  // Get all count UOM preferences for an inventory item
  getInventoryItemCountUomPreferences(itemId: number): Observable<CountUomPreference[]> {
    return this.http.get<CountUomPreference[]>(`${this.apiUrl}/count-uom-preferences/items/${itemId}`);
  }
  
  // Get available UOMs that can be added for an inventory item
  getAvailableUomsForItem(itemId: number): Observable<UnitOfMeasure[]> {
    return this.http.get<UnitOfMeasure[]>(`${this.apiUrl}/count-uom-preferences/items/${itemId}/available-uoms`);
  }
  
  // Add a UOM preference to an inventory item
  addUomPreferenceToItem(itemId: number, uomId: number, defaultUom: boolean = false): Observable<CountUomPreference> {
    return this.http.post<CountUomPreference>(
      `${this.apiUrl}/count-uom-preferences/items/${itemId}`,
      null,
      { params: { uomId: uomId.toString(), defaultUom: defaultUom.toString() } }
    );
  }
  
  // Remove a UOM preference from an inventory item
  removeUomPreferenceFromItem(itemId: number, uomId: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/count-uom-preferences/items/${itemId}`,
      { params: { uomId: uomId.toString() } }
    );
  }
}
