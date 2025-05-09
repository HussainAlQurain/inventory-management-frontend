import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError, forkJoin, of } from 'rxjs';
import { catchError, map, retry, tap, switchMap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { SubRecipe, SubRecipeLine } from '../models/SubRecipe';
import { CompaniesService } from './companies.service';
import { InventoryItemsService } from './inventory-items-service.service';
import { PaginatedResponse } from '../models/paginated-response';

@Injectable({
  providedIn: 'root'
})
export class SubRecipeService {
  private apiUrl = `${environment.apiUrl}/sub-recipes`;

  constructor(
    private http: HttpClient,
    private companiesService: CompaniesService,
    private inventoryItemsService: InventoryItemsService
  ) {}

  // New method for paginated sub-recipe items
  getPaginatedSubRecipeItems(
    subRecipeId: number,
    page: number = 0,
    size: number = 10,
    sort: string = "inventoryItemId,asc",
    searchTerm?: string
  ): Observable<PaginatedResponse<SubRecipeLine>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', sort);

    if (searchTerm) {
      params = params.set('search', searchTerm);
    }
    
    return this.http.get<PaginatedResponse<SubRecipeLine>>(
      `${this.apiUrl}/${subRecipeId}/items/paginated`,
      { params }
    ).pipe(
      switchMap(response => {
        // Enhance the items with names
        if (response.content && response.content.length > 0) {
          return this.enhanceLinesWithNames(response.content).pipe(
            map(enhancedLines => {
              return {
                ...response,
                content: enhancedLines
              };
            })
          );
        }
        return of(response);
      }),
      catchError(error => {
        console.error(`Error fetching paginated items for sub-recipe ID=${subRecipeId}:`, error);
        return throwError(() => new Error(`Error fetching paginated items for sub-recipe ${subRecipeId}`));
      })
    );
  }

  // Basic CRUD methods
  // Update to handle paginated responses
  getSubRecipes(): Observable<SubRecipe[]> {
    const companyId = this.companiesService.getSelectedCompanyId();
    if (!companyId) {
      return throwError(() => new Error('No company selected'));
    }
    
    let params = new HttpParams()
      .set('page', '0')
      .set('size', '100')  // Get a larger number to simulate "get all"
      .set('sort', 'name')
      .set('direction', 'asc');
    
    return this.http.get<any>(`${this.apiUrl}/company/${companyId}`, { params })
      .pipe(
        map(response => {
          // Extract items from paginated response
          return response.items || [];
        }),
        catchError(err => {
          console.error('Error fetching sub recipes', err);
          return throwError(() => new Error('Error fetching sub recipes'));
        })
      );
  }

  getSubRecipeById(id: number): Observable<SubRecipe> {
    const companyId = this.companiesService.getSelectedCompanyId();
    if (!companyId) {
      return throwError(() => new Error('No company selected'));
    }

    // Create observable for the sub-recipe
    const subRecipe$ = this.http.get<SubRecipe>(`${this.apiUrl}/${id}/company/${companyId}`)
      .pipe(
        catchError(err => {
          console.error(`Error fetching sub-recipe with ID=${id}`, err);
          return throwError(() => new Error(`Error fetching sub-recipe ${id}`));
        })
      );

    // First fetch the sub-recipe, then fetch its lines
    return subRecipe$.pipe(
      map(subRecipe => {
        // Return a basic recipe first before loading lines
        return subRecipe;
      }),
      tap(subRecipe => {
        // After getting the basic recipe, load its lines separately
        this.getSubRecipeLines(id).subscribe({
          next: (lines) => {
            // When lines are loaded, update the recipe object
            subRecipe.lines = lines;
          },
          error: (err) => {
            console.error(`Error loading lines for sub-recipe ID=${id}`, err);
            // Don't fail the entire operation if lines loading fails
            subRecipe.lines = [];
          }
        });
      }),
      catchError(err => {
        console.error(`Error in getSubRecipeById ID=${id}`, err);
        return throwError(() => new Error(`Error fetching sub-recipe ${id}`));
      })
    );
  }

  createSubRecipe(subRecipe: SubRecipe): Observable<SubRecipe> {
    const companyId = this.companiesService.getSelectedCompanyId();
    return this.http.post<SubRecipe>(`${this.apiUrl}/company/${companyId}`, subRecipe)
      .pipe(
        catchError(err => {
          console.error('Error creating sub recipe', err);
          return throwError(() => new Error('Error creating sub recipe.'));
        })
      );
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
    // Use the correct endpoint format without company ID
    console.log(`Fetching lines for sub-recipe ID=${subRecipeId}`);
    
    return this.http.get<SubRecipeLine[]>(`${this.apiUrl}/${subRecipeId}/lines`).pipe(
      // Add retry logic for network issues
      retry(1),
      // Enhance lines with names of referenced entities
      switchMap(lines => this.enhanceLinesWithNames(lines)),
      catchError((err: HttpErrorResponse) => {
        console.error(`Error fetching lines for sub-recipe ID=${subRecipeId}`, err);
        if (err.status === 401) {
          console.warn('Authentication error when fetching lines. Token may be invalid.');
          return of([]);
        }
        return throwError(() => new Error(`Error fetching lines for sub-recipe ${subRecipeId}`));
      })
    );
  }

  addLineToSubRecipe(subRecipeId: number, line: Partial<SubRecipeLine>): Observable<SubRecipeLine> {
    // Update this method to use the correct endpoint without company ID
    return this.http.post<SubRecipeLine>(`${this.apiUrl}/${subRecipeId}/lines`, line);
  }

  updateSubRecipeLine(subRecipeId: number, lineId: number, line: Partial<SubRecipeLine>): Observable<SubRecipeLine> {
    // Update this method to use the correct endpoint without company ID
    return this.http.patch<SubRecipeLine>(`${this.apiUrl}/${subRecipeId}/lines/${lineId}`, line);
  }

  deleteSubRecipeLine(subRecipeId: number, lineId: number): Observable<void> {
    // Update this method to use the correct endpoint without company ID
    return this.http.delete<void>(`${this.apiUrl}/${subRecipeId}/lines/${lineId}`);
  }

  // Helper method to enhance lines with names
  private enhanceLinesWithNames(lines: SubRecipeLine[]): Observable<SubRecipeLine[]> {
    if (!lines || lines.length === 0) {
      return of([]);
    }

    const enhancedLines$: Observable<SubRecipeLine>[] = lines.map(line => {
      if (line.childSubRecipeId) {
        // Get sub-recipe info
        return this.getSimpleSubRecipe(line.childSubRecipeId).pipe(
          map(subRecipe => ({
            ...line,
            childSubRecipeName: subRecipe ? subRecipe.name : `Sub-Recipe #${line.childSubRecipeId}`
          })),
          catchError(() => of({
            ...line,
            childSubRecipeName: `Sub-Recipe #${line.childSubRecipeId}`
          }))
        );
      } else if (line.inventoryItemId) {
        // Get inventory item info using the injected service
        return this.inventoryItemsService.getInventoryItemById(line.inventoryItemId).pipe(
          map(item => ({
            ...line,
            inventoryItemName: item.name || `Inventory Item #${line.inventoryItemId}`
          })),
          catchError(() => of({
            ...line,
            inventoryItemName: `Inventory Item #${line.inventoryItemId}`
          }))
        );
      }
      return of(line);
    });

    return forkJoin(enhancedLines$).pipe(
      catchError(() => {
        console.error('Error enhancing line names');
        return of(lines);
      })
    );
  }

  // Changed from private to public so it can be accessed from other components
  getSimpleSubRecipe(id: number): Observable<SubRecipe | null> {
    const companyId = this.companiesService.getSelectedCompanyId();
    if (!companyId) {
      return of(null);
    }

    return this.http.get<SubRecipe>(`${this.apiUrl}/${id}/company/${companyId}`).pipe(
      catchError(() => of(null))
    );
  }

  // Update the search method to handle paginated responses
  searchSubRecipes(term: string): Observable<SubRecipe[]> {
    const companyId = this.companiesService.getSelectedCompanyId();
    if (!companyId) {
      return throwError(() => new Error('No company selected'));
    }
    
    // Create parameters for pagination
    let params = new HttpParams()
      .set('search', term)
      .set('page', '0')
      .set('size', '20')
      .set('sort', 'name')
      .set('direction', 'asc');
    
    // Use the properly structured endpoint
    return this.http.get<any>(`${this.apiUrl}/company/${companyId}`, { params })
      .pipe(
        map(response => {
          // Extract items from paginated response
          return response.items || [];
        }),
        catchError(err => {
          console.error('Error searching sub recipes', err);
          return throwError(() => new Error('Error searching sub recipes.'));
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
