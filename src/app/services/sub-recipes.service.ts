import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { CompaniesService } from './companies.service';
import { SubRecipe } from '../models/SubRecipe';
import { catchError, Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SubRecipesService {
  private baseUrl = `${environment.apiUrl}/sub-recipes`; // e.g. /sub-recipes

  constructor(
    private http: HttpClient,
    private companiesService: CompaniesService
  ) {}

  getAllSubRecipes(): Observable<SubRecipe[]> {
    const companyId = this.companiesService.getSelectedCompanyId();
    if (!companyId) {
      return throwError(() => new Error('No company selected'));
    }
    return this.http.get<SubRecipe[]>(`${this.baseUrl}/company/${companyId}`)
      .pipe(
        catchError(err => {
          console.error('Error fetching sub recipes', err);
          return throwError(() => new Error('Error fetching sub recipes.'));
        })
      );
  }

  getSubRecipeById(subRecipeId: number): Observable<SubRecipe> {
    const companyId = this.companiesService.getSelectedCompanyId();
    if (!companyId) {
      return throwError(() => new Error('No company selected'));
    }
    return this.http.get<SubRecipe>(`${this.baseUrl}/${subRecipeId}/company/${companyId}`)
      .pipe(
        catchError(err => {
          console.error(`Error fetching sub recipe ID=${subRecipeId}`, err);
          return throwError(() => new Error(`Error fetching sub recipe ${subRecipeId}`));
        })
      );
  }

  createSubRecipe(data: Partial<SubRecipe>): Observable<SubRecipe> {
    const companyId = this.companiesService.getSelectedCompanyId();
    if (!companyId) {
      return throwError(() => new Error('No company selected'));
    }
    return this.http.post<SubRecipe>(`${this.baseUrl}/company/${companyId}`, data)
      .pipe(
        catchError(err => {
          console.error('Error creating sub recipe', err);
          return throwError(() => new Error('Error creating sub recipe.'));
        })
      );
  }

  updateSubRecipe(subRecipeId: number, data: Partial<SubRecipe>): Observable<SubRecipe> {
    const companyId = this.companiesService.getSelectedCompanyId();
    return this.http.put<SubRecipe>(`${this.baseUrl}/${subRecipeId}/company/${companyId}`, data)
      .pipe(
        catchError(err => {
          console.error('Error updating sub recipe', err);
          return throwError(() => new Error('Error updating sub recipe.'));
        })
      );
  }

  partialUpdateSubRecipe(subRecipeId: number, data: Partial<SubRecipe>): Observable<SubRecipe> {
    const companyId = this.companiesService.getSelectedCompanyId();
    return this.http.patch<SubRecipe>(`${this.baseUrl}/${subRecipeId}/company/${companyId}`, data)
      .pipe(
        catchError(err => {
          console.error('Error patching sub recipe', err);
          return throwError(() => new Error('Error patching sub recipe.'));
        })
      );
  }

  deleteSubRecipe(subRecipeId: number): Observable<void> {
    const companyId = this.companiesService.getSelectedCompanyId();
    return this.http.delete<void>(`${this.baseUrl}/${subRecipeId}/company/${companyId}`)
      .pipe(
        catchError(err => {
          console.error('Error deleting sub recipe', err);
          return throwError(() => new Error('Error deleting sub recipe.'));
        })
      );
  }

  searchSubRecipesByName(name: string): Observable<SubRecipe[]> {
    const companyId = this.companiesService.getSelectedCompanyId();
    if (!companyId) {
      return throwError(() => new Error('No company selected'));
    }
    
    return this.http.get<SubRecipe[]>(`${this.baseUrl}/company/${companyId}`, {
      params: {
        search: name
      }
    }).pipe(
      catchError(error => {
        console.error('Error searching sub recipes:', error);
        return throwError(() => new Error('Error searching sub recipes.'));
      })
    );
  }
}
