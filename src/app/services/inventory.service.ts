import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { InventoryItem } from '../models/InventoryItem';

interface LocationInventory {
  location: any;
  quantity: number;
  value: number;
}

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  private apiUrl = `${environment.apiUrl}/inventory`;

  constructor(private http: HttpClient) { }

  // Get all inventory items
  getAllItems(): Observable<InventoryItem[]> {
    return this.http.get<InventoryItem[]>(`${this.apiUrl}/items`);
  }

  // Get an inventory item by ID
  getItemById(id: number): Observable<InventoryItem> {
    return this.http.get<InventoryItem>(`${this.apiUrl}/items/${id}`);
  }

  // Create a new inventory item
  createItem(item: InventoryItem): Observable<InventoryItem> {
    return this.http.post<InventoryItem>(`${this.apiUrl}/items`, item);
  }

  // Update an existing inventory item
  updateItem(item: InventoryItem): Observable<InventoryItem> {
    return this.http.put<InventoryItem>(`${this.apiUrl}/items/${item.id}`, item);
  }

  // Delete an inventory item
  deleteItem(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/items/${id}`);
  }

  // Get inventory by item ID and location
  getInventoryByItemAndLocation(itemId: number): Observable<LocationInventory[]> {
    return this.http.get<LocationInventory[]>(`${this.apiUrl}/items/${itemId}/locations`);
    
    // For development/testing, you can use this mock implementation:
    // return of([
    //   { location: { id: 1, name: 'Main Warehouse' }, quantity: 100, value: 1000 },
    //   { location: { id: 2, name: 'Store Front' }, quantity: 25, value: 250 }
    // ]);
  }
}
