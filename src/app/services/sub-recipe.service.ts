import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { SubRecipe, SubRecipeLine } from '../models/SubRecipe';
import { CompaniesService } from './companies.service';

@Injectable({
  providedIn: 'root'
})
export class SubRecipeService {
  private apiUrl = `${environment.apiUrl}/sub-recipes`;

  constructor(
    private http: HttpClient,
    private companiesService: CompaniesService
  ) {}

  // Basic CRUD methods
  getSubRecipes(): Observable<SubRecipe[]> {
    const companyId = this.companiesService.getSelectedCompanyId();
    if (!companyId) {
      return throwError(() => new Error('No company selected'));
    }
    
    return this.http.get<SubRecipe[]>(`${this.apiUrl}/company/${companyId}`);
  }

  getSubRecipeById(id: number): Observable<SubRecipe> {
    const companyId = this.companiesService.getSelectedCompanyId();
    if (!companyId) {
      return throwError(() => new Error('No company selected'));
    }
    
    return this.http.get<SubRecipe>(`${this.apiUrl}/${id}/company/${companyId}`);
  }

  createSubRecipe(subRecipe: Partial<SubRecipe>): Observable<SubRecipe> {
    const companyId = this.companiesService.getSelectedCompanyId();
    if (!companyId) {
      return throwError(() => new Error('No company selected'));
    }
    
    return this.http.post<SubRecipe>(`${this.apiUrl}/company/${companyId}`, subRecipe);
  }

  updateSubRecipe(subRecipe: Partial<SubRecipe>): Observable<SubRecipe> {
    const companyId = this.companiesService.getSelectedCompanyId();
    if (!companyId || !subRecipe.id) {
      return throwError(() => new Error('No company selected or invalid subRecipe ID'));
    }
    
    return this.http.patch<SubRecipe>(`${this.apiUrl}/${subRecipe.id}/company/${companyId}`, subRecipe);
  }

  deleteSubRecipe(id: number): Observable<void> {
    const companyId = this.companiesService.getSelectedCompanyId();
    if (!companyId) {
      return throwError(() => new Error('No company selected'));
    }
    
    return this.http.delete<void>(`${this.apiUrl}/${id}/company/${companyId}`);
  }

  // Line management methods
  getSubRecipeLines(subRecipeId: number): Observable<SubRecipeLine[]> {
    const companyId = this.companiesService.getSelectedCompanyId();
    if (!companyId) {
      return throwError(() => new Error('No company selected'));
    }
    
    return this.http.get<SubRecipeLine[]>(`${this.apiUrl}/${subRecipeId}/lines/company/${companyId}`);
  }

  addLineToSubRecipe(subRecipeId: number, line: Partial<SubRecipeLine>): Observable<SubRecipeLine> {
    const companyId = this.companiesService.getSelectedCompanyId();
    if (!companyId) {
      return throwError(() => new Error('No company selected'));
    }
    
    return this.http.post<SubRecipeLine>(`${this.apiUrl}/${subRecipeId}/lines/company/${companyId}`, line);
  }

  updateSubRecipeLine(subRecipeId: number, lineId: number, line: Partial<SubRecipeLine>): Observable<SubRecipeLine> {
    const companyId = this.companiesService.getSelectedCompanyId();
    if (!companyId) {
      return throwError(() => new Error('No company selected'));
    }
    
    return this.http.patch<SubRecipeLine>(`${this.apiUrl}/${subRecipeId}/lines/${lineId}/company/${companyId}`, line);
  }

  deleteSubRecipeLine(subRecipeId: number, lineId: number): Observable<void> {
    const companyId = this.companiesService.getSelectedCompanyId();
    if (!companyId) {
      return throwError(() => new Error('No company selected'));
    }
    
    return this.http.delete<void>(`${this.apiUrl}/${subRecipeId}/lines/${lineId}/company/${companyId}`);
  }

  // Search sub-recipes by name
  searchSubRecipes(term: string): Observable<SubRecipe[]> {
    const companyId = this.companiesService.getSelectedCompanyId();
    if (!companyId) {
      return throwError(() => new Error('No company selected'));
    }
    
    return this.http.get<SubRecipe[]>(`${this.apiUrl}/company/${companyId}`, {
      params: { search: term }
    });
  }

  // Calculate the total cost of a sub-recipe based on its lines
  calculateSubRecipeCost(subRecipe: SubRecipe): number {
    if (!subRecipe.lines || subRecipe.lines.length === 0) {
      return 0;
    }
    
    return subRecipe.lines.reduce((total, line) => total + (line.lineCost || 0), 0);
  }
}
