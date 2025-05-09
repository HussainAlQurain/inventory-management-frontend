import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { User, UserCreateDTO, UserUpdateDTO } from '../models/user';
import { PaginatedResponse } from '../models/paginated-response';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private api = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // Get all users for a specific company
  getUsersByCompany(companyId: number): Observable<User[]> {
    return this.http.get<User[]>(`${this.api}/users/companies/${companyId}`);
  }

  // Get specific user by ID
  getUserById(userId: number): Observable<User> {
    return this.http.get<User>(`${this.api}/users/${userId}`);
  }

  // Create a new user for a company
  createUser(companyId: number, user: UserCreateDTO): Observable<User> {
    return this.http.post<User>(`${this.api}/users/companies/${companyId}`, user);
  }

  // Update a user's details
  updateUser(userId: number, userUpdate: UserUpdateDTO): Observable<User> {
    return this.http.put<User>(`${this.api}/users/${userId}`, userUpdate);
  }

  // Enable a disabled user
  enableUser(userId: number): Observable<void> {
    return this.http.patch<void>(`${this.api}/users/${userId}/enable`, {});
  }

  // Disable a user (soft delete)
  disableUser(userId: number): Observable<void> {
    return this.http.patch<void>(`${this.api}/users/${userId}/disable`, {});
  }

  // Change a user's role
  changeUserRole(userId: number, role: string): Observable<User> {
    return this.http.patch<User>(`${this.api}/users/${userId}/roles?role=${role}`, {});
  }

  // Get paginated users for a specific company
  getPaginatedUsersByCompany(
    companyId: number, 
    page: number = 0, 
    size: number = 10, 
    sort: string = "lastName,asc", 
    search?: string
  ): Observable<PaginatedResponse<User>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', sort);
      
    if (search) {
      params = params.set('search', search);
    }
    
    return this.http.get<PaginatedResponse<User>>(
      `${this.api}/users/companies/${companyId}/paginated`, 
      { params }
    );
  }
}