import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { AutoOrderSettings } from '../models/AutoOrderSettings';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AutoOrderSettingsService {
  private baseUrl = environment.apiUrl + '/auto-order-settings';

  constructor(private http: HttpClient) { }

  getAutoOrderSettings(locationId: number): Observable<AutoOrderSettings> {
    return this.http.get<AutoOrderSettings>(`${this.baseUrl}/${locationId}`).pipe(
      catchError(error => {
        // If no configuration exists yet, return a default empty configuration
        const defaultSettings: AutoOrderSettings = {
          locationId: locationId,
          enabled: false,
          frequencySeconds: 86400, // Default to daily (24 hours)
          autoOrderComment: 'System suggest order'
        };
        return of(defaultSettings);
      })
    );
  }

  updateAutoOrderSettings(settings: AutoOrderSettings): Observable<AutoOrderSettings> {
    return this.http.put<AutoOrderSettings>(`${this.baseUrl}/${settings.locationId}`, settings);
  }
}