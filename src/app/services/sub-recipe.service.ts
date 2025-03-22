import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { SubRecipe, SubRecipeComponent, SubRecipeItem } from '../models/SubRecipe';
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

  getSubRecipes(): Observable<SubRecipe[]> {
    return this.http.get<SubRecipe[]>(this.apiUrl);
  }

  getSubRecipeById(id: number): Observable<SubRecipe> {
    return this.http.get<SubRecipe>(`${this.apiUrl}/${id}`);
  }

  createSubRecipe(subRecipe: SubRecipe): Observable<SubRecipe> {
    return this.http.post<SubRecipe>(this.apiUrl, subRecipe);
  }

  updateSubRecipe(subRecipe: SubRecipe): Observable<SubRecipe> {
    // Use subRecipe.id as the identifier
    return this.http.put<SubRecipe>(`${this.apiUrl}/${subRecipe.id}`, subRecipe);
  }

  deleteSubRecipe(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Methods for sub-recipe items
  addItemToSubRecipe(subRecipeId: number, item: SubRecipeItem): Observable<SubRecipeItem> {
    const companyId = this.companiesService.getSelectedCompanyId();
    if (!companyId) {
      return throwError(() => new Error('No company selected'));
    }
    
    return this.http.post<SubRecipeItem>(`${this.apiUrl}/${subRecipeId}/items/company/${companyId}`, item).pipe(
      catchError(error => {
        console.error(`Error adding item to sub-recipe with ID ${subRecipeId}:`, error);
        return throwError(() => new Error(`Error adding item to sub-recipe with ID ${subRecipeId}.`));
      })
    );
  }

  updateSubRecipeItem(subRecipeId: number, item: SubRecipeItem): Observable<SubRecipeItem> {
    const companyId = this.companiesService.getSelectedCompanyId();
    if (!companyId || !item.id) {
      return throwError(() => new Error('No company selected or invalid item ID'));
    }
    
    return this.http.put<SubRecipeItem>(`${this.apiUrl}/${subRecipeId}/items/${item.id}/company/${companyId}`, item).pipe(
      catchError(error => {
        console.error(`Error updating item with ID ${item.id}:`, error);
        return throwError(() => new Error(`Error updating item with ID ${item.id}.`));
      })
    );
  }

  removeItemFromSubRecipe(subRecipeId: number, itemId: number): Observable<void> {
    const companyId = this.companiesService.getSelectedCompanyId();
    if (!companyId) {
      return throwError(() => new Error('No company selected'));
    }
    
    return this.http.delete<void>(`${this.apiUrl}/${subRecipeId}/items/${itemId}/company/${companyId}`).pipe(
      catchError(error => {
        console.error(`Error removing item with ID ${itemId}:`, error);
        return throwError(() => new Error(`Error removing item with ID ${itemId}.`));
      })
    );
  }

  // New methods for sub-recipe components (nested sub-recipes)
  addComponentToSubRecipe(subRecipeId: number, component: SubRecipeComponent): Observable<SubRecipeComponent> {
    const companyId = this.companiesService.getSelectedCompanyId();
    if (!companyId) {
      return throwError(() => new Error('No company selected'));
    }
    
    return this.http.post<SubRecipeComponent>(`${this.apiUrl}/${subRecipeId}/components/company/${companyId}`, component).pipe(
      catchError(error => {
        console.error(`Error adding component to sub-recipe with ID ${subRecipeId}:`, error);
        return throwError(() => new Error(`Error adding component to sub-recipe with ID ${subRecipeId}.`));
      })
    );
  }

  updateSubRecipeComponent(subRecipeId: number, component: SubRecipeComponent): Observable<SubRecipeComponent> {
    const companyId = this.companiesService.getSelectedCompanyId();
    if (!companyId || !component.id) {
      return throwError(() => new Error('No company selected or invalid component ID'));
    }
    
    return this.http.put<SubRecipeComponent>(`${this.apiUrl}/${subRecipeId}/components/${component.id}/company/${companyId}`, component).pipe(
      catchError(error => {
        console.error(`Error updating component with ID ${component.id}:`, error);
        return throwError(() => new Error(`Error updating component with ID ${component.id}.`));
      })
    );
  }

  removeComponentFromSubRecipe(subRecipeId: number, componentId: number): Observable<void> {
    const companyId = this.companiesService.getSelectedCompanyId();
    if (!companyId) {
      return throwError(() => new Error('No company selected'));
    }
    
    return this.http.delete<void>(`${this.apiUrl}/${subRecipeId}/components/${componentId}/company/${companyId}`).pipe(
      catchError(error => {
        console.error(`Error removing component with ID ${componentId}:`, error);
        return throwError(() => new Error(`Error removing component with ID ${componentId}.`));
      })
    );
  }

  // Calculate the total cost of a sub-recipe based on its items and components
  calculateSubRecipeCost(subRecipe: SubRecipe): number {
    let totalCost = 0;
    
    // Add costs from inventory items
    if (subRecipe.items && subRecipe.items.length > 0) {
      totalCost += subRecipe.items.reduce((sum: number, item: SubRecipeItem) => sum + (item.cost || 0), 0);
    }
    
    // Add costs from sub-recipe components
    if (subRecipe.subRecipeComponents && subRecipe.subRecipeComponents.length > 0) {
      totalCost += subRecipe.subRecipeComponents.reduce((sum: number, component: SubRecipeComponent) => sum + (component.cost || 0), 0);
    }
    
    return totalCost;
  }

  // Search sub-recipes by name
  searchSubRecipes(term: string): Observable<SubRecipe[]> {
    const companyId = this.companiesService.getSelectedCompanyId();
    if (!companyId) {
      return throwError(() => new Error('No company selected'));
    }
    
    return this.http.get<SubRecipe[]>(`${this.apiUrl}/company/${companyId}`, {
      params: { search: term }
    }).pipe(
      catchError(error => {
        console.error('Error searching sub-recipes:', error);
        return throwError(() => new Error('Error searching sub-recipes.'));
      })
    );
  }
}
