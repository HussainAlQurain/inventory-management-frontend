import { HttpClient, HttpHandlerFn, HttpHeaders, HttpRequest } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private baseUrl = environment.apiUrl;
  private token: string | null = null; // Variable to store the token

  constructor(private http: HttpClient) { }
  login(username: string = "hussain", password: string = "secret"): Observable<any> {
    const body = { username, password };
    return this.http.post<any>(`${this.baseUrl}/login`, body,  {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    }).pipe(tap(respone => {
      this.token = respone.Token;
    }));
  }
  getAuthToken(): string | null {
    return this.token;
  }
  
}

export function authInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn) {
  const authToken = inject(AuthService).getAuthToken();
  const newReq = req.clone({
    headers: req.headers.append('X-Authentication-Token', authToken || ''),
  })
  return next(newReq);

}