import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, catchError, retryWhen, mergeMap, map } from 'rxjs';
import { MenuItem } from '../models/MenuItem';
import { MenuItemLine } from '../models/MenuItemLine';
import { environment } from '../../environments/environment';
import { CompanyContextService } from './company-context.service';
import { PaginatedItemsResponse } from './sub-recipes.service';
import { HttpErrorHandlerService } from './http-error-handler.service';

@Injectable({
  providedIn: 'root'
})
export class MenuItemsService {
  private baseUrl = `${environment.apiUrl}/menu-items`;

  constructor(
    private http: HttpClient, 
    private companyContext: CompanyContextService,
    private errorHandler: HttpErrorHandlerService
  ) { }

  // Get all menu items for the current company
  getMenuItemsByCompany(): Observable<MenuItem[]> {
    const companyId = this.companyContext.getCompanyId();
    
    return this.http.get<MenuItem[]>(`${this.baseUrl}/company/${companyId}`)
      .pipe(
        catchError(error => {
          console.error('Error fetching menu items:', error);
          return throwError(() => new Error('Failed to fetch menu items.'));
        })
      );
  }

  // Get paginated menu items with sorting and filtering
  getPaginatedMenuItems(
    page: number = 0,
    size: number = 10,
    sortBy: string = "name",
    direction: string = "asc",
    searchTerm?: string
  ): Observable<PaginatedItemsResponse<MenuItem>> {
    const companyId = this.companyContext.getCompanyId();
    if (!companyId) {
      return throwError(() => new Error('No company selected'));
    }

    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', sortBy)
      .set('direction', direction);

    if (searchTerm) {
      params = params.set('search', searchTerm);
    }

    return this.http.get<PaginatedItemsResponse<MenuItem>>(
      `${this.baseUrl}/company/${companyId}`,
      { params }
    ).pipe(
      retryWhen(errors => 
        errors.pipe(
          mergeMap((error: any) => {
            // If the error has a needsRetry flag and retryAttempt
            if (error.needsRetry && error.retryAttempt) {
              return this.errorHandler.handleError(
                error.error, 
                'Error fetching paginated menu items',
                error.retryAttempt
              );
            }
            // Otherwise, just pass the error through
            return throwError(() => error);
          })
        )
      ),
      catchError((error: HttpErrorResponse) => 
        this.errorHandler.handleError(error, 'Error fetching paginated menu items')
      )
    );
  }

  // Get a menu item by ID
  getMenuItemById(menuItemId: number): Observable<MenuItem> {
    const companyId = this.companyContext.getCompanyId();
    
    return this.http.get<MenuItem>(`${this.baseUrl}/${menuItemId}/company/${companyId}`)
      .pipe(
        catchError(error => {
          console.error(`Error fetching menu item with ID ${menuItemId}:`, error);
          return throwError(() => new Error(`Failed to fetch menu item details.`));
        })
      );
  }

  // Create a new menu item
  createMenuItem(menuItem: Partial<MenuItem>): Observable<MenuItem> {
    const companyId = this.companyContext.getCompanyId();
    
    return this.http.post<MenuItem>(`${this.baseUrl}/company/${companyId}`, menuItem)
      .pipe(
        catchError(error => {
          console.error('Error creating menu item:', error);
          return throwError(() => new Error('Failed to create menu item.'));
        })
      );
  }

  // Update an existing menu item
  updateMenuItem(menuItemId: number, menuItem: Partial<MenuItem>): Observable<MenuItem> {
    const companyId = this.companyContext.getCompanyId();
    
    return this.http.put<MenuItem>(`${this.baseUrl}/${menuItemId}/company/${companyId}`, menuItem)
      .pipe(
        catchError(error => {
          console.error(`Error updating menu item with ID ${menuItemId}:`, error);
          return throwError(() => new Error('Failed to update menu item.'));
        })
      );
  }

  // Delete a menu item
  deleteMenuItem(menuItemId: number): Observable<void> {
    const companyId = this.companyContext.getCompanyId();
    
    return this.http.delete<void>(`${this.baseUrl}/${menuItemId}/company/${companyId}`)
      .pipe(
        catchError(error => {
          console.error(`Error deleting menu item with ID ${menuItemId}:`, error);
          return throwError(() => new Error('Failed to delete menu item.'));
        })
      );
  }

  // Get all lines for a menu item
  getMenuItemLines(menuItemId: number): Observable<MenuItemLine[]> {
    const companyId = this.companyContext.getCompanyId();
    
    return this.http.get<MenuItemLine[]>(`${this.baseUrl}/${menuItemId}/lines/company/${companyId}`)
      .pipe(
        catchError(error => {
          console.error(`Error fetching lines for menu item with ID ${menuItemId}:`, error);
          return throwError(() => new Error('Failed to fetch menu item lines.'));
        })
      );
  }

  // Add a line to a menu item
  addLineToMenuItem(menuItemId: number, line: Partial<MenuItemLine>): Observable<MenuItemLine> {
    const companyId = this.companyContext.getCompanyId();
    
    return this.http.post<MenuItemLine>(`${this.baseUrl}/${menuItemId}/lines/company/${companyId}`, line)
      .pipe(
        catchError(error => {
          console.error(`Error adding line to menu item with ID ${menuItemId}:`, error);
          return throwError(() => new Error('Failed to add line to menu item.'));
        })
      );
  }

  // Update a line in a menu item
  updateMenuItemLine(menuItemId: number, lineId: number, line: Partial<MenuItemLine>): Observable<MenuItemLine> {
    const companyId = this.companyContext.getCompanyId();
    
    return this.http.put<MenuItemLine>(
      `${this.baseUrl}/${menuItemId}/lines/${lineId}/company/${companyId}`, 
      line
    ).pipe(
      catchError(error => {
        console.error(`Error updating line ${lineId} for menu item with ID ${menuItemId}:`, error);
        return throwError(() => new Error('Failed to update menu item line.'));
      })
    );
  }

  // Delete a line from a menu item
  deleteMenuItemLine(menuItemId: number, lineId: number): Observable<void> {
    const companyId = this.companyContext.getCompanyId();
    
    return this.http.delete<void>(
      `${this.baseUrl}/${menuItemId}/lines/${lineId}/company/${companyId}`
    ).pipe(
      catchError(error => {
        console.error(`Error deleting line ${lineId} from menu item with ID ${menuItemId}:`, error);
        return throwError(() => new Error('Failed to delete menu item line.'));
      })
    );
  }

  // Calculate the total cost of a menu item based on its lines
  calculateMenuItemCost(menuItem: MenuItem): number {
    if (!menuItem.menuItemLines || menuItem.menuItemLines.length === 0) {
      return 0;
    }
    
    return menuItem.menuItemLines.reduce((total: number, line: any) => total + (line.lineCost || 0), 0);
  }

  // Search menu items by name
  searchMenuItemsByName(name: string): Observable<MenuItem[]> {
    const companyId = this.companyContext.getCompanyId();
    if (!companyId) {
      return throwError(() => new Error('No company selected'));
    }
    
    // Use the paginated endpoint with proper parameters
    let params = new HttpParams()
      .set('search', name)
      .set('page', '0')
      .set('size', '20')
      .set('sort', 'name')
      .set('direction', 'asc');
    
    return this.http.get<PaginatedItemsResponse<MenuItem>>(
      `${this.baseUrl}/company/${companyId}`,
      { params }
    ).pipe(
      map(response => response.items || []),
      catchError(error => {
        console.error('Error searching menu items:', error);
        return throwError(() => new Error('Failed to search menu items.'));
      })
    );
  }

  // Alias for searchMenuItemsByName to match what's being called in components
  searchMenuItems(name: string): Observable<MenuItem[]> {
    return this.searchMenuItemsByName(name);
  }
}
