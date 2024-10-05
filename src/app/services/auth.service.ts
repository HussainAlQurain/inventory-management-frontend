import { HttpClient, HttpHandlerFn, HttpHeaders, HttpRequest } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  authenticated = false;

  constructor(private http: HttpClient) { }
  login(){
    
  }
  getAuthToken(): string {
    return ''
  }
  
}

export function authInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn) {
  const authToken = inject(AuthService).getAuthToken();
  const newReq = req.clone({
    headers: req.headers.append('X-Authentication-Token', authToken),
  })
  return next(newReq);

}