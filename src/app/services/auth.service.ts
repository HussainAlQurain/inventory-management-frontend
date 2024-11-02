import { HttpClient, HttpErrorResponse, HttpEvent, HttpEventType, HttpHandlerFn, HttpHeaders, HttpRequest } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment.development';
import { BehaviorSubject, catchError, map, Observable, tap, throwError } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private api = environment.apiUrl;
  private tokenKey = 'auth_token';
  private authenticatedSubject = new BehaviorSubject<boolean>(false);
  public authenticated$ = this.authenticatedSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
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
}


export function authInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
  const authService = inject(AuthService);
  const authToken = authService.getAuthToken();

  // Do not add the token to the login request
  if (req.url.includes('/login')) {
    console.log('Interceptor: Skipping token for login request');
    return next(req); // Skip adding token for login request
  }

  // Clone the request to add the authentication token if it exists
  const authReq = authToken ? req.clone({
    headers: req.headers.set('Authorization', `Bearer ${authToken}`)
  }) : req;

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





