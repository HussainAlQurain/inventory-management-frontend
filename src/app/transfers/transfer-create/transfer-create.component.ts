import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Observable, of, startWith, map, forkJoin, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { TransferService } from '../../services/transfer.service';
import { LocationService } from '../../services/location.service';
import { InventoryItemsService } from '../../services/inventory-items-service.service';
import { SubRecipeService } from '../../services/sub-recipe.service';
import { UomService } from '../../services/uom.service';
import { Location } from '../../models/Location';
import { InventoryItem } from '../../models/InventoryItem';
import { SubRecipe } from '../../models/SubRecipe';
import { UnitOfMeasure } from '../../models/UnitOfMeasure';
import { Transfer, TransferLine } from '../../models/Transfer';
import { InventoryItemListDTO } from '../../models/InventoryItemListDTO';
import { SubRecipesService } from '../../services/sub-recipes.service';
import { PaginatedSubRecipeResponse } from '../../models/PaginatedSubRecipeResponse';
import { PaginatedResponse } from '../../models/paginated-response';
import { SubRecipeListDTO } from '../../models/SubRecipeListDTO';

// Define TransferRequest interface locally to avoid import issues
interface TransferRequest {
  fromLocationId: number;
  toLocationId: number;
  lines: TransferLine[];
}

// Define ItemOption interface for filtering and displaying items
interface ItemOption {
  id: number;
  name: string;
  type: 'inventory' | 'subrecipe';
  uoms: UnitOfMeasure[];
}

@Component({
  selector: 'app-transfer-create',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    FormsModule
  ],
  templateUrl: './transfer-create.component.html',
  styleUrls: ['./transfer-create.component.scss']
})
export class TransferCreateComponent implements OnInit, OnDestroy {
  transferForm: FormGroup;
  loading = false;
  submitting = false;
  error = '';

  // Locations with search functionality
  fromLocationSearchTerm = '';
  toLocationSearchTerm = '';
  fromLocations: Location[] = [];
  toLocations: Location[] = [];

  // Subjects for debounced location search - made public for template access
  public fromLocationSearchSubject = new Subject<string>();
  public toLocationSearchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  inventoryItems: InventoryItemListDTO[] = [];

  subRecipes: SubRecipeListDTO[] = [];
  unitOfMeasures: UnitOfMeasure[] = [];
  filteredItems: ItemOption[] = [];

  // Add pagination and search properties
  itemSearchTerm: string = '';
  inventoryPage: number = 0;
  inventoryPageSize: number = 20;
  inventoryTotal: number = 0;
  inventoryLoading: boolean = false;

  subRecipePage: number = 0;
  subRecipePageSize: number = 20;
  subRecipeTotal: number = 0;
  subRecipeLoading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private transferService: TransferService,
    private locationService: LocationService,
    private inventoryItemsService: InventoryItemsService,
    private subRecipeService: SubRecipeService,
    private subRecipesService: SubRecipesService,
    private uomService: UomService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    this.transferForm = this.fb.group({
      fromLocationId: ['', [Validators.required]],
      toLocationId: ['', [Validators.required]],
      lines: this.fb.array([])
    });

    // Setup debounced search for locations
    this.fromLocationSearchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(searchTerm => {
      this.loadFromLocationsWithSearch(searchTerm);
    });

    this.toLocationSearchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(searchTerm => {
      this.loadToLocationsWithSearch(searchTerm);
    });
  }

  ngOnInit(): void {
    this.loading = true;
    
    // Only load UOMs initially as they're a smaller dataset
    this.uomService.getAllUoms().subscribe({
      next: (uoms) => {
        this.unitOfMeasures = uoms;
        
        // Initialize both location search dropdowns
        this.loadFromLocationsWithSearch('');
        this.loadToLocationsWithSearch('');
        
        // Add initial line
        this.addLine();
        
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading UOMs:', error);
        this.loading = false;
      }
    });
  }

  ngOnDestroy(): void {
    // Clean up subscriptions
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Form array getter for lines
  get lines() {
    return this.transferForm.get('lines') as FormArray;
  }

  // Add a new line to the transfer
  addLine() {
    const lineForm = this.fb.group({
      itemId: ['', [Validators.required]],
      itemType: ['', [Validators.required]],
      quantity: [1, [Validators.required, Validators.min(0.001)]],
      unitOfMeasureId: ['', [Validators.required]]
    });

    this.lines.push(lineForm);
  }

  // Remove a line from the transfer
  removeLine(index: number) {
    this.lines.removeAt(index);
  }

  // Location search functionality with debounce
  onFromLocationSearchChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.fromLocationSearchTerm = value;
    this.fromLocationSearchSubject.next(value);
  }

  onToLocationSearchChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.toLocationSearchTerm = value;
    this.toLocationSearchSubject.next(value);
  }

  loadFromLocationsWithSearch(term: string): void {
    this.locationService.getPaginatedLocations(0, 10, 'name,asc', term)
      .subscribe({
        next: res => this.fromLocations = res.content,
        error: err => console.error('Failed to load from locations', err)
      });
  }

  loadToLocationsWithSearch(term: string): void {
    this.locationService.getPaginatedLocations(0, 10, 'name,asc', term)
      .subscribe({
        next: res => this.toLocations = res.content,
        error: err => console.error('Failed to load to locations', err)
      });
  }

  // Search inventory items with pagination
  searchInventoryItems(searchTerm: string = ''): void {
    this.inventoryLoading = true;
    this.itemSearchTerm = searchTerm;
    this.inventoryPage = 0;
    
    this.inventoryItemsService.getPaginatedInventoryItemsList(
      this.inventoryPage,
      this.inventoryPageSize,
      'name,asc',
      undefined,
      searchTerm
    ).subscribe({
      next: (response: PaginatedResponse<InventoryItemListDTO>) => {
        this.inventoryItems = response.content;
        this.inventoryTotal = response.totalElements;
        this.updateFilteredItems();
        this.inventoryLoading = false;
      },
      error: (error: any) => {
        console.error('Error searching inventory items:', error);
        this.inventoryLoading = false;
      }
    });
  }

  // Search subrecipes with pagination
  searchSubRecipes(searchTerm: string = ''): void {
    this.subRecipeLoading = true;
    this.itemSearchTerm = searchTerm;
    this.subRecipePage = 0;
    
    this.subRecipesService.getPaginatedSubRecipesList(
      this.subRecipePage,
      this.subRecipePageSize,
      'name',
      'asc',
      searchTerm,
      undefined,
      'PREPARATION'
    ).subscribe({
      next: (response: PaginatedSubRecipeResponse) => {
        this.subRecipes = response.items;
        this.subRecipeTotal = response.totalItems;
        this.updateFilteredItems();
        this.subRecipeLoading = false;
      },
      error: (error: any) => {
        console.error('Error searching sub-recipes:', error);
        this.subRecipeLoading = false;
      }
    });
  }

  loadMoreInventoryItems(): void {
    if (this.inventoryLoading) return;
    
    this.inventoryLoading = true;
    this.inventoryPage++;
    
    this.inventoryItemsService.getPaginatedInventoryItemsList(
      this.inventoryPage,
      this.inventoryPageSize,
      'name,asc',
      undefined,
      this.itemSearchTerm
    ).subscribe({
      next: (response: PaginatedResponse<InventoryItemListDTO>) => {
        // Append new items to existing array
        this.inventoryItems = [...this.inventoryItems, ...response.content];
        this.inventoryTotal = response.totalElements;
        this.updateFilteredItems();
        this.inventoryLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading more inventory items:', error);
        this.inventoryLoading = false;
        this.inventoryPage--; // Revert page increment on error
      }
    });
  }

  loadMoreSubRecipes(): void {
    if (this.subRecipeLoading) return;
    
    this.subRecipeLoading = true;
    this.subRecipePage++;
    
    this.subRecipesService.getPaginatedSubRecipesList(
      this.subRecipePage,
      this.subRecipePageSize,
      'name',
      'asc',
      this.itemSearchTerm,
      undefined,
      'PREPARATION'
    ).subscribe({
      next: (response: PaginatedSubRecipeResponse) => {
        this.subRecipes = [...this.subRecipes, ...response.items];
        this.subRecipeTotal = response.totalItems;
        this.updateFilteredItems();
        this.subRecipeLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading more sub-recipes:', error);
        this.subRecipeLoading = false;
        this.subRecipePage--; // Revert page increment on error
      }
    });
  }

  // Handle search input changes
  onItemSearch(event: Event): void {
    event.stopPropagation();
    const inputElement = event.target as HTMLInputElement;
    const searchTerm = inputElement.value;
    
    // Get the selected item type
    const currentLine = this.getCurrentLine();
    if (!currentLine) return;
    
    const itemType = currentLine.get('itemType')?.value;
    
    if (itemType === 'inventory') {
      this.searchInventoryItems(searchTerm);
    } else if (itemType === 'subrecipe') {
      this.searchSubRecipes(searchTerm);
    }
  }

  // Update filtered items based on current search results
  updateFilteredItems(): void {
    const fromLocationId = this.transferForm.get('fromLocationId')?.value;
    if (!fromLocationId) {
      this.filteredItems = [];
      return;
    }

    const inventoryOptions: ItemOption[] = this.inventoryItems.map(item => ({
      id: item.id!,
      name: item.name,
      type: 'inventory' as const,
      uoms: item.inventoryUomId ? [this.unitOfMeasures.find(u => u.id === item.inventoryUomId)!].filter(Boolean) : []
    }));

    const subRecipeOptions: ItemOption[] = this.subRecipes.map(recipe => ({
      id: recipe.id!,
      name: recipe.name,
      type: 'subrecipe' as const,
      uoms: recipe.uomId ? [this.unitOfMeasures.find(u => u.id === recipe.uomId)!].filter(Boolean) : []
    }));

    this.filteredItems = [...inventoryOptions, ...subRecipeOptions];
  }

  // Helper method to get the current line being edited
  getCurrentLine(): FormGroup | null {
    if (!this.transferForm || !this.transferForm.get('lines')) return null;
    
    const lines = this.transferForm.get('lines') as FormArray;
    if (lines.length === 0) return null;
    
    // Get the currently focused line or the first line
    // You might want to track the active line index separately
    return lines.at(0) as FormGroup;
  }

  // Get UOMs for a selected item
  getItemUoms(itemId: number, itemType: string): UnitOfMeasure[] {
    if (itemType === 'inventory') {
      const item = this.inventoryItems.find(i => i.id === itemId);
      if (item?.inventoryUomId) {
        const uom = this.unitOfMeasures.find(u => u.id === item.inventoryUomId);
        return uom ? [uom] : this.unitOfMeasures;
      }
      return this.unitOfMeasures;
    } else if (itemType === 'subrecipe') {
      const recipe = this.subRecipes.find(r => r.id === itemId);
      if (recipe?.uomId) {
        const uom = this.unitOfMeasures.find(u => u.id === recipe.uomId);
        return uom ? [uom] : this.unitOfMeasures;
      }
      return this.unitOfMeasures;
    }
    return [];
  }

  // When an item type is selected, reset the item and UOM
  onItemTypeChange(index: number): void {
    const lines = this.transferForm.get('lines') as FormArray;
    const line = lines.at(index) as FormGroup;
    
    // Reset the item and UOM when changing item type
    line.get('itemId')?.setValue(null);
    line.get('unitOfMeasureId')?.setValue(null);
    
    // Load the appropriate items based on the selected type
    const itemType = line.get('itemType')?.value;
    
    if (itemType === 'inventory') {
      // Clear any existing sub-recipes and load inventory items
      this.subRecipes = [];
      this.searchInventoryItems('');
    } else if (itemType === 'subrecipe') {
      // Clear any existing inventory items and load sub-recipes
      this.inventoryItems = [];
      this.searchSubRecipes('');
    }
  }

  // When an item is selected, update available UOMs
  onItemChange(index: number) {
    const lineForm = this.lines.at(index) as FormGroup;
    const itemId = lineForm.get('itemId')?.value;
    const itemType = lineForm.get('itemType')?.value;

    if (itemId && itemType) {
      const uoms = this.getItemUoms(itemId, itemType);
      if (uoms.length > 0) {
        lineForm.patchValue({
          unitOfMeasureId: uoms[0].id
        });
      }
    }
  }

  // Validate the form before submitting
  validateForm(): boolean {
    // Check if locations are the same
    if (this.transferForm.value.fromLocationId === this.transferForm.value.toLocationId) {
      this.snackBar.open('From and To locations cannot be the same', 'Close', { duration: 3000 });
      return false;
    }

    // Check if there are any lines
    if (this.lines.length === 0) {
      this.snackBar.open('You must add at least one item to transfer', 'Close', { duration: 3000 });
      return false;
    }

    return true;
  }

  // Submit the transfer
  onSubmit() {
    if (this.transferForm.invalid || this.submitting) {
      return;
    }

    if (!this.validateForm()) {
      return;
    }

    this.submitting = true;

    const formValue = this.transferForm.value;

    // Construct transfer request
    const transferRequest: TransferRequest = {
      fromLocationId: formValue.fromLocationId,
      toLocationId: formValue.toLocationId,
      lines: formValue.lines.map((line: any) => {
        const transferLine: TransferLine = {
          quantity: parseFloat(line.quantity),
          unitOfMeasureId: line.unitOfMeasureId
        };

        if (line.itemType === 'inventory') {
          transferLine.inventoryItemId = line.itemId;
        } else if (line.itemType === 'subrecipe') {
          transferLine.subRecipeId = line.itemId;
        }

        return transferLine;
      })
    };

    this.transferService.createTransfer(transferRequest).subscribe({
      next: (response) => {
        this.snackBar.open('Transfer request created successfully', 'Close', { duration: 3000 });
        this.router.navigate(['/transfers']);
        this.submitting = false;
      },
      error: (err) => {
        console.error('Failed to create transfer:', err);
        this.snackBar.open('Failed to create transfer request', 'Close', { duration: 3000 });
        this.submitting = false;
      }
    });
  }

  // Cancel and go back to transfers
  cancel() {
    this.router.navigate(['/transfers']);
  }

  // Get display name for an item
  getItemDisplayName(itemId: number, itemType: string): string {
    if (itemType === 'inventory') {
      return this.inventoryItems.find(i => i.id === itemId)?.name || '';
    } else if (itemType === 'subrecipe') {
      return this.subRecipes.find(r => r.id === itemId)?.name || '';
    }
    return '';
  }

  // Get UOM name
  getUomName(uomId: number): string {
    return this.unitOfMeasures.find(u => u.id === uomId)?.name || '';
  }
}