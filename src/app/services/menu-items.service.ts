import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MenuItem } from '../models/MenuItem';
import { MenuItemLine } from '../models/MenuItemLine';
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
    const companyId = this.companiesService.getSelectedCompanyId();
    return this.http.get<MenuItem>(`${this.apiUrl}/${id}/company/${companyId}`);
  }

  // Create a new menu item
  createMenuItem(companyId: number, menuItem: MenuItem): Observable<MenuItem> {
    return this.http.post<MenuItem>(`${this.apiUrl}/company/${companyId}`, menuItem);
  }

  // Update an existing menu item
  updateMenuItem(menuItem: MenuItem): Observable<MenuItem> {
    const companyId = this.companiesService.getSelectedCompanyId();
    return this.http.put<MenuItem>(`${this.apiUrl}/${menuItem.id}/company/${companyId}`, menuItem);
  }

  // Partially update a menu item
  partialUpdateMenuItem(menuItem: Partial<MenuItem>): Observable<MenuItem> {
    const companyId = this.companiesService.getSelectedCompanyId();
    return this.http.patch<MenuItem>(`${this.apiUrl}/${menuItem.id}/company/${companyId}`, menuItem);
  }

  deleteMenuItem(id: number): Observable<void> {
    const companyId = this.companiesService.getSelectedCompanyId();
    return this.http.delete<void>(`${this.apiUrl}/${id}/company/${companyId}`);
  }

  // ===== Menu Item Lines =====

  // Get all lines for a menu item
  getMenuItemLines(menuItemId: number): Observable<MenuItemLine[]> {
    const companyId = this.companiesService.getSelectedCompanyId();
    return this.http.get<MenuItemLine[]>(
      `${this.apiUrl}/${menuItemId}/company/${companyId}/lines`
    );
  }

  // Add a new line to a menu item
  addLineToMenuItem(menuItemId: number, line: MenuItemLine): Observable<MenuItemLine> {
    const companyId = this.companiesService.getSelectedCompanyId();
    return this.http.post<MenuItemLine>(
      `${this.apiUrl}/${menuItemId}/company/${companyId}/lines`, 
      line
    );
  }

  // Update an existing line
  updateMenuItemLine(menuItemId: number, lineId: number, line: MenuItemLine): Observable<MenuItemLine> {
    const companyId = this.companiesService.getSelectedCompanyId();
    return this.http.put<MenuItemLine>(
      `${this.apiUrl}/${menuItemId}/company/${companyId}/lines/${lineId}`, 
      line
    );
  }

  // Delete a line
  deleteMenuItemLine(menuItemId: number, lineId: number): Observable<void> {
    const companyId = this.companiesService.getSelectedCompanyId();
    return this.http.delete<void>(
      `${this.apiUrl}/${menuItemId}/company/${companyId}/lines/${lineId}`
    );
  }
  
  // Search menu items (for selecting parent menu items)
  searchMenuItems(term: string): Observable<MenuItem[]> {
    const companyId = this.companiesService.getSelectedCompanyId();
    return this.http.get<MenuItem[]>(`${this.apiUrl}/company/${companyId}`, { 
      params: { search: term } 
    });
  }
}
