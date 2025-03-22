import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { CompaniesService } from './companies.service';
import { SubRecipe, SubRecipeLine } from '../models/SubRecipe';
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

  // Methods for managing sub-recipe lines
  getSubRecipeLines(subRecipeId: number): Observable<SubRecipeLine[]> {
    const companyId = this.companiesService.getSelectedCompanyId();
    if (!companyId) {
      return throwError(() => new Error('No company selected'));
    }
    
    return this.http.get<SubRecipeLine[]>(`${this.baseUrl}/${subRecipeId}/lines/company/${companyId}`)
      .pipe(
        catchError(err => {
          console.error(`Error fetching lines for sub recipe ID=${subRecipeId}`, err);
          return throwError(() => new Error(`Error fetching lines for sub recipe ${subRecipeId}`));
        })
      );
  }

  getSubRecipeLine(subRecipeId: number, lineId: number): Observable<SubRecipeLine> {
    const companyId = this.companiesService.getSelectedCompanyId();
    if (!companyId) {
      return throwError(() => new Error('No company selected'));
    }
    
    return this.http.get<SubRecipeLine>(`${this.baseUrl}/${subRecipeId}/lines/${lineId}/company/${companyId}`)
      .pipe(
        catchError(err => {
          console.error(`Error fetching line ID=${lineId} for sub recipe ID=${subRecipeId}`, err);
          return throwError(() => new Error(`Error fetching line ${lineId} for sub recipe ${subRecipeId}`));
        })
      );
  }

  createSubRecipeLine(subRecipeId: number, line: Partial<SubRecipeLine>): Observable<SubRecipeLine> {
    const companyId = this.companiesService.getSelectedCompanyId();
    if (!companyId) {
      return throwError(() => new Error('No company selected'));
    }
    
    return this.http.post<SubRecipeLine>(`${this.baseUrl}/${subRecipeId}/lines/company/${companyId}`, line)
      .pipe(
        catchError(err => {
          console.error(`Error creating line for sub recipe ID=${subRecipeId}`, err);
          return throwError(() => new Error(`Error creating line for sub recipe ${subRecipeId}`));
        })
      );
  }

  updateSubRecipeLine(subRecipeId: number, lineId: number, line: Partial<SubRecipeLine>): Observable<SubRecipeLine> {
    const companyId = this.companiesService.getSelectedCompanyId();
    if (!companyId) {
      return throwError(() => new Error('No company selected'));
    }
    
    return this.http.patch<SubRecipeLine>(`${this.baseUrl}/${subRecipeId}/lines/${lineId}/company/${companyId}`, line)
      .pipe(
        catchError(err => {
          console.error(`Error updating line ID=${lineId} for sub recipe ID=${subRecipeId}`, err);
          return throwError(() => new Error(`Error updating line ${lineId} for sub recipe ${subRecipeId}`));
        })
      );
  }

  deleteSubRecipeLine(subRecipeId: number, lineId: number): Observable<void> {
    const companyId = this.companiesService.getSelectedCompanyId();
    if (!companyId) {
      return throwError(() => new Error('No company selected'));
    }
    
    return this.http.delete<void>(`${this.baseUrl}/${subRecipeId}/lines/${lineId}/company/${companyId}`)
      .pipe(
        catchError(err => {
          console.error(`Error deleting line ID=${lineId} for sub recipe ID=${subRecipeId}`, err);
          return throwError(() => new Error(`Error deleting line ${lineId} for sub recipe ${subRecipeId}`));
        })
      );
  }

  // Calculate the total cost of a sub-recipe based on its lines
  calculateSubRecipeCost(subRecipe: SubRecipe): number {
    if (!subRecipe.lines || subRecipe.lines.length === 0) {
      return 0;
    }
    
    return subRecipe.lines.reduce((total, line) => total + (line.lineCost || 0), 0);
  }
}
