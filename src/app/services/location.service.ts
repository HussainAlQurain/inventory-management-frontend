import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { Location } from '../models/Location';
import { CompaniesService } from './companies.service';
import { AuthService } from './auth.service';
import { PaginatedResponse } from '../models/paginated-response';

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  private baseUrl = environment.apiUrl + '/locations';
  private selectedLocationId: number | null = null;

  constructor(
    private http: HttpClient,
    private companiesService: CompaniesService,
    private authService: AuthService
  ) { 
      // Initialize selected location from localStorage if available
    const storedLocationId = localStorage.getItem('selectedLocationId');
    if (storedLocationId) {
      this.selectedLocationId = Number(storedLocationId);
    } else {
      // If no stored location, try to get the first available location for the user
      this.initializeDefaultLocation();
    }
  }

  /**
   * Get locations with pagination
   * @param page The page number (0-based)
   * @param size The page size
   * @param sort Sorting expression (e.g., "name,asc")
   * @param searchTerm Optional search term to filter locations by name
   * @returns Observable of paginated Location response
   */
  getPaginatedLocations(
    page: number = 0,
    size: number = 10,
    sort: string = "name,asc",
    searchTerm: string = ""
  ): Observable<PaginatedResponse<Location>> {
    const companyId = this.companiesService.getSelectedCompanyId();
    if (!companyId) {
      return throwError(() => new Error('No company selected'));
    }
    
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', sort);

    if (searchTerm) {
      params = params.set('search', searchTerm);
    }
    
    return this.http.get<PaginatedResponse<Location>>(
      `${this.baseUrl}/company/${companyId}/paginated`,
      { params }
    );
  }

  getAllLocations(): Observable<Location[]> {
    const companyId = this.companiesService.getSelectedCompanyId();
    return this.http.get<Location[]>(`${this.baseUrl}/company/${companyId}`);
  }

  getLocationById(locationId: number): Observable<Location> {
    return this.http.get<Location>(`${this.baseUrl}/${locationId}`);
  }

  createLocation(location: Location): Observable<Location> {
    const companyId = this.companiesService.getSelectedCompanyId();
    return this.http.post<Location>(`${this.baseUrl}/${companyId}`, location);
  }

  addUsersToLocation(locationId: number, userIds: number[]): Observable<any> {
    return this.http.post(`${this.baseUrl}/${locationId}/users`, userIds);
  }

  getUsersByLocation(locationId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/${locationId}/users`);
  }
  
  removeUserFromLocation(locationId: number, userId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${locationId}/users/${userId}`);
  }

  // Updated method to use AuthService
  getLocationsForCurrentUser(): Observable<Location[]> {
    const companyId = this.companiesService.getSelectedCompanyId();
    const userId = this.authService.getUserId();
    
    if (!userId) {
      console.error('Cannot get locations: User ID is not available');
      return new Observable(subscriber => subscriber.complete());
    }
    
    return this.http.get<Location[]>(`${this.baseUrl}/company/${companyId}/user/${userId}`);
  }

  setSelectedLocationId(locationId: number): void {
    this.selectedLocationId = locationId;
    // Optionally persist in localStorage like CompaniesService does
    localStorage.setItem('selectedLocationId', locationId.toString());
  }

  getSelectedLocationId(): number | null {
    // First check if we have a location ID in memory
    if (this.selectedLocationId) {
      return this.selectedLocationId;
    }
    
    // If not, check localStorage for previously saved value
    const storedLocationId = localStorage.getItem('selectedLocationId');
    if (storedLocationId) {
      this.selectedLocationId = Number(storedLocationId);
      return this.selectedLocationId;
    }
    
    // If still not found, return null
    return null;
  }
  
  private initializeDefaultLocation(): void {
    // Only attempt if we have a user ID and company ID
    if (this.authService.getUserId() && this.companiesService.getSelectedCompanyId()) {
      this.getLocationsForCurrentUser().subscribe({
        next: (locations) => {
          if (locations && locations.length > 0) {
            // Auto-select the first location
            this.setSelectedLocationId(locations[0].id!);
            console.log(`Auto-selected location: ${locations[0].name} (ID: ${locations[0].id})`);
          }
        },
        error: (err) => console.error('Failed to initialize default location:', err)
      });
    }
  }
}
