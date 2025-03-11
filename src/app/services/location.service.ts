import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Location } from '../models/Location';
import { CompaniesService } from './companies.service';

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  private baseUrl = environment.apiUrl + '/locations';

  constructor(
    private http: HttpClient,
    private companiesService: CompaniesService
  ) { }

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
}
