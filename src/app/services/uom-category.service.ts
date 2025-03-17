import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { UnitOfMeasureCategory } from '../models/UnitOfMeasure';

@Injectable({
  providedIn: 'root'
})
export class UomCategoryService {

  private baseUrl = `${environment.apiUrl}/unit-of-measures/categories`;

  constructor(private http: HttpClient) {}

  getAllCategories(companyId: number): Observable<UnitOfMeasureCategory[]> {
    return this.http.get<UnitOfMeasureCategory[]>(`${this.baseUrl}/company/${companyId}`);
  }

  createCategory(companyId: number, newCategory: Partial<UnitOfMeasureCategory>): Observable<UnitOfMeasureCategory> {
    return this.http.post<UnitOfMeasureCategory>(`${this.baseUrl}/company/${companyId}`, newCategory);
  }

}
