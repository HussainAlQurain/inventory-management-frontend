import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MenuItem } from '../models/MenuItem';
import { environment } from '../../environments/environment';
import { CompaniesService } from './companies.service';

@Injectable({
  providedIn: 'root'
})
export class MenuItemsService {
  private apiUrl = `${environment.apiUrl}/menu-items`;

  constructor(
    private http: HttpClient,
    private companiesService: CompaniesService
  ) {}

  getMenuItemsByCompany(search?: string): Observable<MenuItem[]> {
    const companyId = this.companiesService.getSelectedCompanyId();
    let params = new HttpParams();
    if (search) {
      params = params.set('search', search);
    }
    return this.http.get<MenuItem[]>(`${this.apiUrl}/company/${companyId}`, { params });
  }

  getMenuItemById(id: number): Observable<MenuItem> {
    return this.http.get<MenuItem>(`${this.apiUrl}/${id}`);
  }

  createMenuItem(menuItem: MenuItem): Observable<MenuItem> {
    return this.http.post<MenuItem>(`${this.apiUrl}`, menuItem);
  }

  updateMenuItem(menuItem: MenuItem): Observable<MenuItem> {
    return this.http.put<MenuItem>(`${this.apiUrl}/${menuItem.id}`, menuItem);
  }

  deleteMenuItem(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Methods for menu item lines
  addLineToMenuItem(menuItemId: number, line: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${menuItemId}/lines`, line);
  }

  updateMenuItemLine(menuItemId: number, lineId: number, line: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${menuItemId}/lines/${lineId}`, line);
  }

  deleteMenuItemLine(menuItemId: number, lineId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${menuItemId}/lines/${lineId}`);
  }
  
  // Search menu items (for selecting parent menu items)
  searchMenuItems(term: string): Observable<MenuItem[]> {
    const companyId = this.companiesService.getSelectedCompanyId();
    return this.http.get<MenuItem[]>(`${this.apiUrl}/company/${companyId}`, { 
      params: { search: term } 
    });
  }
}
