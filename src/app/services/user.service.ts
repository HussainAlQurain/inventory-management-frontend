import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { User, UserCreateDTO, UserUpdateDTO } from '../models/user';

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
}