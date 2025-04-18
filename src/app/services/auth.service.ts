import { HttpClient, HttpErrorResponse, HttpEvent, HttpEventType, HttpHandlerFn, HttpHeaders, HttpRequest } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment.development';
import { BehaviorSubject, catchError, map, Observable, tap, throwError } from 'rxjs';
import { Router } from '@angular/router';
import * as jwt_decode from 'jwt-decode';
import { CompaniesService } from './companies.service';


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private api = environment.apiUrl;
  private tokenKey = 'auth_token';
  private authenticatedSubject = new BehaviorSubject<boolean>(false);
  public authenticated$ = this.authenticatedSubject.asObservable();

  constructor(private http: HttpClient, private router: Router, private companiesService: CompaniesService  ) {
    // Check if the token exists in localStorage when the service is initialized
    const token = this.getAuthToken();
    if (token) {
      this.authenticatedSubject.next(true);
    }
  }

  // Login method
  login(username: string, password: string): Observable<boolean> {
    console.log(`Attempting login for username: ${username}`); // Log before request
  
    return this.http.post(`${this.api}/users/login`, { username, password }, { responseType: 'text' })
      .pipe(
        map((response: string) => {
          console.log('Response received from backend:', response); // Log after response received
          if (response) {
            // Save the token immediately
            this.setAuthToken(response);
            this.authenticatedSubject.next(true);

            this.setDefaultCompany(response);
            console.log('Login successful, token saved.');
            return true;
          } else {
            console.error('Login failed: No token received.');
            return false;
          }
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('Login failed with error:', error);
          alert(`Login failed: ${error.message}`);
          return throwError(() => new Error('Login failed'));
        })
      );
  }

  // Logout method
  logout(): void {
    this.clearAuthToken();
    this.authenticatedSubject.next(false);
    this.router.navigate(['/login']);
  }

  // Store the auth token in localStorage
  private setAuthToken(token: string): void {
    console.log('Storing token:', token);
    localStorage.setItem(this.tokenKey, token);
    console.log('Token stored successfully.');
  }

  // Retrieve the auth token from localStorage
  getAuthToken(): string | null {
    const token = localStorage.getItem(this.tokenKey);
    console.log('Retrieved token:', token);
    return token;
  }

  // Remove the auth token from localStorage
  private clearAuthToken(): void {
    console.log('Clearing auth token');
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem("selectedCompanyId");
  }

  // Check if the user is authenticated
  isAuthenticated(): boolean {
    return !!this.getAuthToken();
  }

  // Handle expired tokens
  handleExpiredToken(): void {
    console.log('Token expired. Logging out...');
    this.logout();
  }

    // Method to get the user ID from the JWT token
    getUserId(): number | null {
      const token = this.getAuthToken();
      if (token) {
        try {
          const decoded: any = jwt_decode.jwtDecode(token);
          return decoded.userId || null;
        } catch (error) {
          console.error('Error decoding token:', error);
          return null;
        }
      }
      return null;
    }

    private setDefaultCompany(token: string): void {
      try {
        const decoded: any = jwt_decode.jwtDecode(token);
        const companyIds: number[] = decoded.companyIds || [];
        if (companyIds.length > 0) {
          // Set the first company as the default
          this.companiesService.setSelectedCompanyId(companyIds[0]);
        }
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }

}


export function authInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
  const authService = inject(AuthService);
  const authToken = authService.getAuthToken();

  // Do not add the token to the login request
  // This is not being handled correctly as currently im not using route
  if (req.url.includes('/login')) {
    console.log('Interceptor: Skipping token for login request');
    return next(req); // Skip adding token for login request
  }

  // Clone headers and add required ones
  let headers = req.headers;

  if (authToken) {
    headers = headers.set('Authorization', `Bearer ${authToken}`);
  }

    // Add these headers for all API requests
    const authReq = req.clone({
      headers: headers
        .set('X-Requested-With', 'XMLHttpRequest')
        .set('Content-Type', 'application/json')
    });
  // Clone the request to add the authentication token if it exists
  // const authReq = authToken ? req.clone({
  //   headers: req.headers.set('Authorization', `Bearer ${authToken}`)
  // }) : req;

  return next(authReq).pipe(
    tap(event => {
      if (event.type === HttpEventType.Response) {
        console.log('Interceptor: Received response for', req.url);
      }
    }),
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        console.warn('Interceptor: 401 Unauthorized. Handling expired token.');
        authService.handleExpiredToken();
      }
      return throwError(() => error);
    })
  );
}





