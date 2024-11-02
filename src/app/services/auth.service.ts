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
    return this.http.post<{ token: string }>(`${this.api}/users/login`, { username, password })
      .pipe(
        map(response => {
          if (response.token) {
            this.setAuthToken(response.token);
            this.authenticatedSubject.next(true);
            return true;
          }
          return false;
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('Login failed', error);
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
    localStorage.setItem(this.tokenKey, token);
  }

  // Retrieve the auth token from localStorage
  getAuthToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  // Remove the auth token from localStorage
  private clearAuthToken(): void {
    localStorage.removeItem(this.tokenKey);
  }

  // Check if the user is authenticated
  isAuthenticated(): boolean {
    return !!this.getAuthToken();
  }

  // Handle expired tokens
  handleExpiredToken(): void {
    this.logout(); // Logout the user and clear the token
    this.router.navigate(['/login']); // Redirect to login page
  }
}


export function authInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
  const authService = inject(AuthService);
  const authToken = authService.getAuthToken();

  // Clone the request to add the authentication token if it exists
  const authReq = authToken ? req.clone({
    headers: req.headers.set('Authorization', `Bearer ${authToken}`)
  }) : req;

  return next(authReq).pipe(
    tap(event => {
      // Optional: Log the event if it's a response (for debugging purposes)
      if (event.type === HttpEventType.Response) {
        console.log('Received response for', req.url);
      }
    }),
    catchError((error: HttpErrorResponse) => {
      // Handle 401 Unauthorized response by logging out the user
      if (error.status === 401) {
        authService.handleExpiredToken();
      }
      return throwError(() => error);
    })
  );
}