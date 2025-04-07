import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { InventoryCountService } from '../../../services/inventory-count.service';
import { InventoryItemsService } from '../../../services/inventory-items-service.service';
import { SubRecipeService } from '../../../services/sub-recipe.service';
import { UomService } from '../../../services/uom.service';
import { InventoryCountSession, InventoryCountLine, DayPart } from '../../../models/InventoryCountSession';
import { InventoryItem } from '../../../models/InventoryItem';
import { UnitOfMeasure } from '../../../models/UnitOfMeasure';
import { SubRecipe } from '../../../models/SubRecipe';
import { catchError, finalize, forkJoin, of, Observable, tap } from 'rxjs';
import { LocationService } from '../../../services/location.service';

// First, update the interface to use a proper TypeScript string literal union type
interface CountItemUomGroup {
  itemId?: number;  // For inventory items
  subRecipeId?: number;  // For sub-recipes
  name: string;
  itemType: 'inventory' | 'subrecipe';  // Properly defined string literal union type
  uoms: {
    uomId: number;
    uomName: string;
    lineId?: number;
    countedQuantity: number;
  }[];
}

@Component({
  selector: 'app-inventory-count-editor',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDividerModule,
    MatTabsModule,
    MatTableModule,
    MatCheckboxModule,
    MatTooltipModule,
    MatChipsModule,
    MatDialogModule
  ],
  providers: [DatePipe],
  templateUrl: './inventory-count-editor.component.html',
  styleUrls: ['./inventory-count-editor.component.scss']
})
export class InventoryCountEditorComponent implements OnInit {
  // Route params
  locationId!: number;
  sessionId!: number;
  
  // Loading state
  isLoading = false;
  loadingError: string | null = null;
  
  // Session data
  session: InventoryCountSession | null = null;
  
  // Form for session details
  sessionForm!: FormGroup;
  
  // Items and counts
  inventoryItems: Map<number, InventoryItem> = new Map();
  subRecipes: Map<number, SubRecipe> = new Map();
  countLines: InventoryCountLine[] = [];
  countItemGroups: CountItemUomGroup[] = [];
  
  // UOMs
  availableUoms: UnitOfMeasure[] = [];
  
  // Day part options
  dayPartOptions: DayPart[] = ['Day Start', 'Day End'];
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private inventoryCountService: InventoryCountService,
    private inventoryItemService: InventoryItemsService,
    private subRecipeService: SubRecipeService,
    private uomService: UomService,
    private snackBar: MatSnackBar,
    private datePipe: DatePipe,
    private dialog: MatDialog,
    private locationService: LocationService
  ) { }

  ngOnInit(): void {
    this.initForm();
    
    // Get route params
    this.route.paramMap.subscribe(params => {
      const locationIdParam = params.get('locationId');
      const sessionIdParam = params.get('sessionId');
      
      if (locationIdParam && sessionIdParam) {
        this.locationId = +locationIdParam;
        this.sessionId = +sessionIdParam;
        this.loadSessionData();
      } else {
        this.router.navigate(['/inventory/counts']);
        this.snackBar.open('Invalid session parameters', 'Close', { duration: 3000 });
      }
    });
  }
  
  private initForm(): void {
    this.sessionForm = this.fb.group({
      countDate: ['', Validators.required],
      dayPart: ['', Validators.required],
      description: ['', Validators.maxLength(500)]
    });
  }
  
  public loadSessionData(): void {
    this.isLoading = true;
    this.loadingError = null;
    
    // Load session and available UOMs in parallel
    forkJoin({
      session: this.inventoryCountService.getInventoryCountSessionById(this.locationId, this.sessionId)
        .pipe(catchError(err => {
          console.error('Error loading session data:', err);
          this.loadingError = 'Failed to load count session details';
          return of(null);
        })),
        location: this.locationService.getLocationById(this.locationId).pipe(catchError(err => {
          console.log('Error loading location data:', err);
          return of(null);
        })),
      uoms: this.uomService.getAllUoms()
        .pipe(catchError(err => {
          console.error('Error loading UOMs:', err);
          return of([]);
        }))
    }).pipe(
      finalize(() => {
        this.isLoading = false;
      })
    ).subscribe(results => {
      if (results.session) {
        this.session = results.session;
        this.availableUoms = results.uoms;
        // Add location name to session
        if (results.location) {
          this.session.locationName = results.location.name;
        }
        
        // The session already contains the lines
        if (this.session.lines) {
          this.countLines = this.session.lines;
          
          this.updateSessionForm();
          
          // Load all inventory items and sub-recipes referenced in the lines
          this.loadReferencedItemsAndSubRecipes();
        } else {
          // If lines are not included in the session response, fetch them separately
          this.loadCountLines();
        }
      }
    });
  }
  
  private loadCountLines(): void {
    if (!this.session) return;
    
    this.isLoading = true;
    
    this.inventoryCountService.getInventoryCountLines(this.locationId, this.sessionId)
      .pipe(
        catchError(err => {
          console.error('Error loading count lines:', err);
          this.loadingError = 'Failed to load count lines';
          return of([]);
        }),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe(lines => {
        this.countLines = lines;
        this.loadReferencedItemsAndSubRecipes();
      });
  }
  
  private loadReferencedItemsAndSubRecipes(): void {
    // Extract unique inventory item IDs and sub-recipe IDs from the count lines
    const inventoryItemIds = new Set<number>();
    const subRecipeIds = new Set<number>();
    
    this.countLines.forEach(line => {
      if (line.inventoryItemId) {
        inventoryItemIds.add(line.inventoryItemId);
      } else if (line.subRecipeId) {
        subRecipeIds.add(line.subRecipeId);
      }
    });
    
    const requests: Observable<any>[] = [];
    
    // Inventory item requests
    inventoryItemIds.forEach(itemId => {
      requests.push(
        this.inventoryItemService.getInventoryItemById(itemId).pipe(
          catchError(err => {
            console.error(`Error loading inventory item ${itemId}:`, err);
            // Return a placeholder item if fetch fails
            return of({ id: itemId, name: `Item #${itemId}` } as InventoryItem);
          }),
          tap(item => this.inventoryItems.set(itemId, item))
        )
      );
    });
    
    // Sub-recipe requests
    subRecipeIds.forEach(recipeId => {
      requests.push(
        this.subRecipeService.getSimpleSubRecipe(recipeId).pipe(
          catchError(err => {
            console.error(`Error loading sub-recipe ${recipeId}:`, err);
            // Return a placeholder sub-recipe if fetch fails
            return of({ id: recipeId, name: `Sub-Recipe #${recipeId}` } as SubRecipe);
          }),
          tap(recipe => {
            if (recipe) this.subRecipes.set(recipeId, recipe);
          })
        )
      );
    });
    
    if (requests.length > 0) {
      this.isLoading = true;
      
      forkJoin(requests)
        .pipe(finalize(() => {
          this.isLoading = false;
          this.prepareCountItemGroups();
        }))
        .subscribe();
    } else {
      this.prepareCountItemGroups();
    }
  }
  
  private updateSessionForm(): void {
    if (!this.session) return;
    
    this.sessionForm.patchValue({
      countDate: new Date(this.session.countDate),
      dayPart: this.session.dayPart,
      description: this.session.description || ''
    });
    
    // Disable form if session is locked
    if (this.session.locked === true) {
      this.sessionForm.disable();
    }
  }
  
  private prepareCountItemGroups(): void {
    // Group count items by UoM for displaying in the UI
    const itemGroups: CountItemUomGroup[] = [];
    
    // Process all count lines
    this.countLines.forEach(line => {
      if (line.inventoryItemId) {
        // Handle inventory item lines
        const inventoryItem = this.inventoryItems.get(line.inventoryItemId);
        
        // Check if this item is already in our groups
        let group = itemGroups.find(g => 
          g.itemType === 'inventory' && g.itemId === line.inventoryItemId
        );
        
        if (!group) {
          // Create a new group for this item
          group = {
            itemId: line.inventoryItemId,
            name: inventoryItem?.name || `Inventory Item #${line.inventoryItemId}`,
            itemType: 'inventory',
            uoms: []
          };
          itemGroups.push(group);
        }
        
        if (line.countUomId) {
          const uom = this.availableUoms.find(u => u.id === line.countUomId);
          if (uom) {
            group.uoms.push({
              uomId: line.countUomId,
              uomName: uom.name,
              lineId: line.id,
              countedQuantity: line.countedQuantity || 0
            });
          }
        }
      } else if (line.subRecipeId) {
        // Handle sub-recipe lines
        const subRecipe = this.subRecipes.get(line.subRecipeId);
        
        // Check if this sub-recipe is already in our groups
        let group = itemGroups.find(g => 
          g.itemType === 'subrecipe' && g.subRecipeId === line.subRecipeId
        );
        
        if (!group) {
          // Create a new group for this sub-recipe
          group = {
            subRecipeId: line.subRecipeId,
            name: subRecipe?.name || `Sub-Recipe #${line.subRecipeId}`,
            itemType: 'subrecipe',
            uoms: []
          };
          itemGroups.push(group);
        }
        
        if (line.countUomId) {
          const uom = this.availableUoms.find(u => u.id === line.countUomId);
          if (uom) {
            group.uoms.push({
              uomId: line.countUomId,
              uomName: uom.name,
              lineId: line.id,
              countedQuantity: line.countedQuantity || 0
            });
          }
        }
      }
    });
    
    // Sort groups: inventory items first, then sub-recipes, both in alphabetical order
    this.countItemGroups = itemGroups.sort((a, b) => {
      // First sort by type
      if (a.itemType !== b.itemType) {
        return a.itemType === 'inventory' ? -1 : 1;
      }
      // Then by name
      return a.name.localeCompare(b.name);
    });
  }
  
  // Get UoM data for a count item, used in the template
  getUomForItem(itemGroup: CountItemUomGroup, uomId: number): { uomId: number; uomName: string; lineId?: number; countedQuantity: number; } | null {
    const uom = itemGroup.uoms.find(u => u.uomId === uomId);
    if (uom) {
      return uom;
    }
    
    // If no UoM found for this item, return null
    return null;
  }
  
  updateSessionDetails(): void {
    if (this.sessionForm.invalid || !this.session || this.session.locked === true) {
      return;
    }
    
    this.isLoading = true;
    
    const formValue = this.sessionForm.value;
    const formattedDate = this.datePipe.transform(formValue.countDate, 'yyyy-MM-dd');
    
    const updatedSession: Partial<InventoryCountSession> = {
      countDate: formattedDate || '',
      dayPart: formValue.dayPart,
      description: formValue.description
    };
    
    this.inventoryCountService.updateInventoryCountSession(this.locationId, this.sessionId, updatedSession)
      .pipe(
        catchError(err => {
          console.error('Error updating session:', err);
          this.snackBar.open('Failed to update session details', 'Close', { duration: 5000 });
          return of(null);
        }),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe(result => {
        if (result) {
          this.session = { ...this.session, ...result } as InventoryCountSession;
          this.snackBar.open('Session details updated successfully', 'Close', { duration: 3000 });
        }
      });
  }
  
  updateCountLine(lineId: number, countItem: CountItemUomGroup, uomId: number, countedQuantity: number): void {
    if (!this.session || this.session.locked === true) return;
    
    this.isLoading = true;
    
    // Build the line object based on item type
    const line: Partial<InventoryCountLine> = {
      id: lineId,
      countUomId: uomId,
      countedQuantity: countedQuantity
    };
    
    // Add the correct ID field based on item type
    if (countItem.itemType === 'inventory') {
      line.inventoryItemId = countItem.itemId;
    } else {
      line.subRecipeId = countItem.subRecipeId;
    }
    
    this.inventoryCountService.updateInventoryCountLine(this.locationId, this.sessionId, lineId, line)
      .pipe(
        catchError(err => {
          console.error('Error updating count line:', err);
          this.snackBar.open('Failed to update count', 'Close', { duration: 5000 });
          return of(null);
        }),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe(result => {
        if (result) {
          // Update local data
          const updatedCountLines = this.countLines.map(l => 
            l.id === lineId ? { ...l, countedQuantity } : l
          );
          this.countLines = updatedCountLines;
          
          // Show brief confirmation
          this.snackBar.open('Count updated', '', { duration: 1000 });
        }
      });
  }
  
  lockSession(): void {
    if (!this.session || this.session.locked === true) return;
    
    this.isLoading = true;
    
    this.inventoryCountService.lockInventoryCountSession(this.locationId, this.sessionId)
      .pipe(
        catchError(err => {
          console.error('Error locking session:', err);
          this.snackBar.open('Failed to lock inventory count', 'Close', { duration: 5000 });
          return of(null);
        }),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe(result => {
        if (result) {
          this.session = { ...this.session, locked: true, lockedDate: result.lockedDate } as InventoryCountSession;
          this.sessionForm.disable();
          this.snackBar.open('Inventory count locked successfully', 'Close', { duration: 3000 });
        }
      });
  }
  
  unlockSession(): void {
    if (!this.session || this.session.locked !== true) return;
    
    this.isLoading = true;
    
    this.inventoryCountService.unlockInventoryCountSession(this.locationId, this.sessionId)
      .pipe(
        catchError(err => {
          console.error('Error unlocking session:', err);
          this.snackBar.open('Failed to unlock inventory count', 'Close', { duration: 5000 });
          return of(null);
        }),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe(result => {
        if (result) {
          this.session = { ...this.session, locked: false, lockedDate: undefined } as InventoryCountSession;
          this.sessionForm.enable();
          this.snackBar.open('Inventory count unlocked successfully', 'Close', { duration: 3000 });
        }
      });
  }
  
  navigateBack(): void {
    this.router.navigate(['/inventory/counts']);
  }

  // Helper method to get item type icon
  getItemTypeIcon(itemType: 'inventory' | 'subrecipe'): string {
    return itemType === 'inventory' ? 'inventory_2' : 'receipt';
  }

  // Update the hasItemType method to use the correct string literal type
  hasItemType(itemType: 'inventory' | 'subrecipe'): boolean {
    return this.countItemGroups.some(g => g.itemType === itemType);
  }

  // Type guard functions for use in templates
  isInventoryType(itemType: any): boolean {
    return itemType === 'inventory';
  }

  isSubrecipeType(itemType: any): boolean {
    return itemType === 'subrecipe';
  }

  getItemTooltip(itemType: any): string {
    return itemType === 'inventory' ? 'Inventory Item' : 'Sub-Recipe';
  }
}