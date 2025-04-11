// filepath: /home/rayleigh/Desktop/projects/inventory-management-frontend/src/app/services/integration-settings.service.ts
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { IntegrationSettings } from '../models/IntegrationSettings';

@Injectable({
  providedIn: 'root'
})
export class IntegrationSettingsService {
  private baseUrl = environment.apiUrl + '/integration-settings';

  constructor(private http: HttpClient) { }

  getIntegrationSettings(locationId: number): Observable<IntegrationSettings> {
    return this.http.get<IntegrationSettings>(`${this.baseUrl}/${locationId}`);
  }

  updateIntegrationSettings(settings: IntegrationSettings): Observable<IntegrationSettings> {
    return this.http.put<IntegrationSettings>(`${this.baseUrl}/${settings.locationId}`, settings);
  }
}