import { Component, Inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatListModule } from '@angular/material/list';
import { MatSelectModule } from '@angular/material/select';

import { Assortment } from '../../models/Assortment';
import { AssortmentService } from '../../services/assortment.service';
import { InventoryItemsService } from '../../services/inventory-items-service.service';
import { LocationService } from '../../services/location.service';
import { SubRecipeService } from '../../services/sub-recipe.service';
import { PurchaseOptionService } from '../../services/purchase-option.service';
import { Location } from '../../models/Location';
import { InventoryItem } from '../../models/InventoryItem';
import { SubRecipe } from '../../models/SubRecipe';
import { PurchaseOptionSummaryDTO } from '../../models/PurchaseOptionSummaryDTO';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-assortment-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatChipsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatCheckboxModule,
    MatListModule,
    MatSelectModule,
  ],
  templateUrl: './assortment-detail.component.html',
  styleUrl: './assortment-detail.component.scss'
})
export class AssortmentDetailComponent implements OnInit {
  assortment: Assortment | null = null;
  isLoading = false;
  nameEdit = false;
  newName = '';
  
  // Data for tabs
  locations: Location[] = [];
  inventoryItems: InventoryItem[] = [];
  subRecipes: SubRecipe[] = [];
  purchaseOptions: PurchaseOptionSummaryDTO[] = [];
  
  // Selected items for bulk operations
  selectedLocations: number[] = [];
  selectedItems: number[] = [];
  selectedSubRecipes: number[] = [];
  selectedPurchaseOptions: number[] = [];
  
  // Search filters
  locationFilter = '';
  itemFilter = '';
  subRecipeFilter = '';
  purchaseOptionFilter = '';
  
  // Filtered data for display
  filteredLocations: Location[] = [];
  filteredItems: InventoryItem[] = [];
  filteredSubRecipes: SubRecipe[] = [];
  filteredPurchaseOptions: PurchaseOptionSummaryDTO[] = [];

  // Selection state tracking
  selectionState = {
    locations: 0, // 0: none, 1: filtered, 2: all
    items: 0,
    subRecipes: 0,
    purchaseOptions: 0
  };
  
  // Counts for each section
  counts = {
    locations: {
      total: 0,
      filtered: 0,
      selected: 0
    },
    items: {
      total: 0,
      filtered: 0,
      selected: 0
    },
    subRecipes: {
      total: 0,
      filtered: 0,
      selected: 0
    },
    purchaseOptions: {
      total: 0,
      filtered: 0,
      selected: 0
    }
  };

  constructor(
    private dialogRef: MatDialogRef<AssortmentDetailComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { assortmentId: number },
    private assortmentService: AssortmentService,
    private locationService: LocationService,
    private inventoryItemsService: InventoryItemsService,
    private subRecipeService: SubRecipeService,
    private purchaseOptionService: PurchaseOptionService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef // Add ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadAssortment();
    this.loadLocations();
    this.loadInventoryItems();
    this.loadSubRecipes();
    this.loadPurchaseOptions();
  }

  loadAssortment(): void {
    if (!this.data?.assortmentId) return;
    
    this.isLoading = true;
    this.assortmentService.getAssortmentById(this.data.assortmentId).subscribe({
      next: (data) => {
        this.assortment = data;
        this.newName = data.name;
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Error loading assortment:', err);
        this.snackBar.open('Failed to load assortment details', 'Close', {
          duration: 3000
        });
        this.isLoading = false;
      }
    });
  }

  saveNameChanges(): void {
    if (!this.assortment || !this.data?.assortmentId) return;
    
    if (this.newName.trim() === this.assortment.name) {
      this.nameEdit = false;
      return;
    }
    
    this.isLoading = true;
    this.assortmentService.partialUpdateAssortment(this.data.assortmentId, { 
      name: this.newName.trim() 
    }).subscribe({
      next: (updated) => {
        this.assortment = updated;
        this.nameEdit = false;
        this.isLoading = false;
        this.snackBar.open('Name updated successfully', 'Close', {
          duration: 3000
        });
      },
      error: (err: any) => {
        console.error('Error updating name:', err);
        this.isLoading = false;
        this.snackBar.open('Failed to update name', 'Close', {
          duration: 3000
        });
      }
    });
  }

  cancelNameEdit(): void {
    this.nameEdit = false;
    if (this.assortment) {
      this.newName = this.assortment.name;
    }
  }

  // Helper methods for template
  getLocationById(locationId: number): Location | undefined {
    return this.locations.find(l => l.id === locationId);
  }
  
  getItemById(itemId: number): InventoryItem | undefined {
    return this.inventoryItems.find(i => i.id === itemId);
  }
  
  getSubRecipeById(recipeId: number): SubRecipe | undefined {
    return this.subRecipes.find(r => r.id === recipeId);
  }
  
  getPurchaseOptionById(optionId: number): PurchaseOptionSummaryDTO | undefined {
    return this.purchaseOptions.find(o => o.purchaseOptionId === optionId);
  }

  // Location methods
  loadLocations(): void {
    this.locationService.getAllLocations().subscribe({
      next: (locations: Location[]) => {
        this.locations = locations;
        this.filteredLocations = locations;
        this.updateCounts('locations');
      },
      error: (err: any) => console.error('Error loading locations:', err)
    });
  }

  filterLocations(): void {
    const filter = this.locationFilter.toLowerCase();
    this.filteredLocations = this.locations.filter(location => 
      location.name.toLowerCase().includes(filter)
    );
    this.updateCounts('locations');
    // Reset selection state when filter changes
    this.selectionState.locations = 0;
  }

  isLocationSelected(locationId: number | undefined): boolean {
    if (locationId === undefined) return false;
    return this.assortment?.locationIds?.includes(locationId) || false;
  }

  toggleLocationSelection(locationId: number | undefined): void {
    if (locationId === undefined) return;
    
    const index = this.selectedLocations.indexOf(locationId);
    if (index === -1) {
      this.selectedLocations = [...this.selectedLocations, locationId];
    } else {
      this.selectedLocations = this.selectedLocations.filter(id => id !== locationId);
    }
    this.updateCounts('locations');
  }

  addLocations(): void {
    if (!this.assortment?.id || this.selectedLocations.length === 0) return;
    
    this.isLoading = true;
    this.assortmentService.addLocations(this.assortment.id, this.selectedLocations).subscribe({
      next: (updated) => {
        this.assortment = updated;
        this.selectedLocations = [];
        this.isLoading = false;
        this.snackBar.open('Locations added successfully', 'Close', {
          duration: 3000
        });
      },
      error: (err: any) => {
        console.error('Error adding locations:', err);
        this.isLoading = false;
        this.snackBar.open('Failed to add locations', 'Close', {
          duration: 3000
        });
      }
    });
  }

  removeLocation(locationId: number): void {
    if (!this.assortment?.id) return;
    
    this.isLoading = true;
    this.assortmentService.removeLocations(this.assortment.id, [locationId]).subscribe({
      next: (updated) => {
        this.assortment = updated;
        this.isLoading = false;
        this.snackBar.open('Location removed', 'Close', {
          duration: 3000
        });
      },
      error: (err: any) => {
        console.error('Error removing location:', err);
        this.isLoading = false;
        this.snackBar.open('Failed to remove location', 'Close', {
          duration: 3000
        });
      }
    });
  }

  // Inventory item methods
  loadInventoryItems(): void {
    this.inventoryItemsService.getInventoryItemsByCompany().subscribe({
      next: (items: InventoryItem[]) => {
        this.inventoryItems = items;
        this.filteredItems = items;
        this.updateCounts('items');
      },
      error: (err: any) => console.error('Error loading inventory items:', err)
    });
  }

  filterItems(): void {
    const filter = this.itemFilter.toLowerCase();
    this.filteredItems = this.inventoryItems.filter(item => 
      item.name.toLowerCase().includes(filter)
    );
    this.updateCounts('items');
    // Reset selection state when filter changes
    this.selectionState.items = 0;
  }

  isItemSelected(itemId: number | undefined): boolean {
    if (itemId === undefined) return false;
    return this.assortment?.itemIds?.includes(itemId) || false;
  }

  toggleItemSelection(itemId: number | undefined): void {
    if (itemId === undefined) return;
    const index = this.selectedItems.indexOf(itemId);
    if (index === -1) {
      this.selectedItems = [...this.selectedItems, itemId];
    } else {
      this.selectedItems = this.selectedItems.filter(id => id !== itemId);
    }
    this.updateCounts('items');
  }

  addItems(): void {
    if (!this.assortment?.id || this.selectedItems.length === 0) return;
    
    this.isLoading = true;
    this.assortmentService.addInventoryItems(this.assortment.id, this.selectedItems).subscribe({
      next: (updated) => {
        this.assortment = updated;
        this.selectedItems = [];
        this.isLoading = false;
        this.snackBar.open('Items added successfully', 'Close', {
          duration: 3000
        });
      },
      error: (err: any) => {
        console.error('Error adding items:', err);
        this.isLoading = false;
        this.snackBar.open('Failed to add items', 'Close', {
          duration: 3000
        });
      }
    });
  }

  removeItem(itemId: number): void {
    if (!this.assortment?.id) return;
    
    this.isLoading = true;
    this.assortmentService.removeInventoryItems(this.assortment.id, [itemId]).subscribe({
      next: (updated) => {
        this.assortment = updated;
        this.isLoading = false;
        this.snackBar.open('Item removed', 'Close', {
          duration: 3000
        });
      },
      error: (err: any) => {
        console.error('Error removing item:', err);
        this.isLoading = false;
        this.snackBar.open('Failed to remove item', 'Close', {
          duration: 3000
        });
      }
    });
  }

  // Sub-recipe methods
  loadSubRecipes(): void {
    this.subRecipeService.getSubRecipes().subscribe({
      next: (recipes: SubRecipe[]) => {
        this.subRecipes = recipes;
        this.filteredSubRecipes = recipes;
        this.updateCounts('subRecipes');
      },
      error: (err: any) => console.error('Error loading sub-recipes:', err)
    });
  }

  filterSubRecipes(): void {
    const filter = this.subRecipeFilter.toLowerCase();
    this.filteredSubRecipes = this.subRecipes.filter(recipe => 
      recipe.name.toLowerCase().includes(filter)
    );
    this.updateCounts('subRecipes');
    // Reset selection state when filter changes
    this.selectionState.subRecipes = 0;
  }

  isSubRecipeSelected(subRecipeId: number | undefined): boolean {
    if (subRecipeId === undefined) return false;
    return this.assortment?.subRecipeIds?.includes(subRecipeId) || false;
  }

  toggleSubRecipeSelection(subRecipeId: number | undefined): void {
    if (subRecipeId === undefined) return;
    const index = this.selectedSubRecipes.indexOf(subRecipeId);
    if (index === -1) {
      this.selectedSubRecipes = [...this.selectedSubRecipes, subRecipeId];
    } else {
      this.selectedSubRecipes = this.selectedSubRecipes.filter(id => id !== subRecipeId);
    }
    this.updateCounts('subRecipes');
  }

  addSubRecipes(): void {
    if (!this.assortment?.id || this.selectedSubRecipes.length === 0) return;
    
    this.isLoading = true;
    this.assortmentService.addSubRecipes(this.assortment.id, this.selectedSubRecipes).subscribe({
      next: (updated) => {
        this.assortment = updated;
        this.selectedSubRecipes = [];
        this.isLoading = false;
        this.snackBar.open('Sub-recipes added successfully', 'Close', {
          duration: 3000
        });
      },
      error: (err: any) => {
        console.error('Error adding sub-recipes:', err);
        this.isLoading = false;
        this.snackBar.open('Failed to add sub-recipes', 'Close', {
          duration: 3000
        });
      }
    });
  }

  removeSubRecipe(subRecipeId: number): void {
    if (!this.assortment?.id) return;
    
    this.isLoading = true;
    this.assortmentService.removeSubRecipes(this.assortment.id, [subRecipeId]).subscribe({
      next: (updated) => {
        this.assortment = updated;
        this.isLoading = false;
        this.snackBar.open('Sub-recipe removed', 'Close', {
          duration: 3000
        });
      },
      error: (err: any) => {
        console.error('Error removing sub-recipe:', err);
        this.isLoading = false;
        this.snackBar.open('Failed to remove sub-recipe', 'Close', {
          duration: 3000
        });
      }
    });
  }

  // Purchase option methods
  loadPurchaseOptions(): void {
    this.purchaseOptionService.getPurchaseOptions().subscribe({
      next: (options: PurchaseOptionSummaryDTO[]) => {
        this.purchaseOptions = options;
        this.filteredPurchaseOptions = options;
        this.updateCounts('purchaseOptions');
      },
      error: (err: any) => console.error('Error loading purchase options:', err)
    });
  }

  filterPurchaseOptions(): void {
    const filter = this.purchaseOptionFilter.toLowerCase();
    this.filteredPurchaseOptions = this.purchaseOptions.filter(option => 
      (option.purchaseOptionNickname && option.purchaseOptionNickname.toLowerCase().includes(filter)) || 
      (option.inventoryItemName && option.inventoryItemName.toLowerCase().includes(filter))
    );
    this.updateCounts('purchaseOptions');
    // Reset selection state when filter changes
    this.selectionState.purchaseOptions = 0;
  }

  isPurchaseOptionSelected(purchaseOptionId: number | undefined): boolean {
    if (purchaseOptionId === undefined) return false;
    return this.assortment?.purchaseOptionIds?.includes(purchaseOptionId) || false;
  }

  togglePurchaseOptionSelection(purchaseOptionId: number | undefined): void {
    if (purchaseOptionId === undefined) return;
    const index = this.selectedPurchaseOptions.indexOf(purchaseOptionId);
    if (index === -1) {
      this.selectedPurchaseOptions = [...this.selectedPurchaseOptions, purchaseOptionId];
    } else {
      this.selectedPurchaseOptions = this.selectedPurchaseOptions.filter(id => id !== purchaseOptionId);
    }
    this.updateCounts('purchaseOptions');
  }

  addPurchaseOptions(): void {
    if (!this.assortment?.id || this.selectedPurchaseOptions.length === 0) return;
    
    this.isLoading = true;
    this.assortmentService.addPurchaseOptions(this.assortment.id, this.selectedPurchaseOptions).subscribe({
      next: (updated) => {
        this.assortment = updated;
        this.selectedPurchaseOptions = [];
        this.isLoading = false;
        this.snackBar.open('Purchase options added successfully', 'Close', {
          duration: 3000
        });
      },
      error: (err: any) => {
        console.error('Error adding purchase options:', err);
        this.isLoading = false;
        this.snackBar.open('Failed to add purchase options', 'Close', {
          duration: 3000
        });
      }
    });
  }

  removePurchaseOption(purchaseOptionId: number): void {
    if (!this.assortment?.id) return;
    
    this.isLoading = true;
    this.assortmentService.removePurchaseOptions(this.assortment.id, [purchaseOptionId]).subscribe({
      next: (updated) => {
        this.assortment = updated;
        this.isLoading = false;
        this.snackBar.open('Purchase option removed', 'Close', {
          duration: 3000
        });
      },
      error: (err: any) => {
        console.error('Error removing purchase option:', err);
        this.isLoading = false;
        this.snackBar.open('Failed to remove purchase option', 'Close', {
          duration: 3000
        });
      }
    });
  }

  getPurchaseOptionName(option: PurchaseOptionSummaryDTO): string {
    return option.purchaseOptionNickname || option.inventoryItemName || `Purchase Option #${option.purchaseOptionId}`;
  }

  // New methods for tri-state selection
  
  toggleSelectionState(section: 'locations' | 'items' | 'subRecipes' | 'purchaseOptions'): void {
    // Cycle through states: 0 (none) -> 1 (filtered) -> 2 (all) -> 0 (none)
    this.selectionState[section] = (this.selectionState[section] + 1) % 3;
    
    // Clear current selection first
    if (section === 'locations') {
      this.selectedLocations = [];
    } else if (section === 'items') {
      this.selectedItems = [];
    } else if (section === 'subRecipes') {
      this.selectedSubRecipes = [];
    } else if (section === 'purchaseOptions') {
      this.selectedPurchaseOptions = [];
    }
    
    // Apply new selection based on state
    setTimeout(() => {
      switch (this.selectionState[section]) {
        case 0: // None selected
          break;
        case 1: // Filtered items
          if (section === 'locations') {
            this.selectedLocations = this.filteredLocations
              .filter(location => !this.isLocationSelected(location.id!))
              .map(location => location.id!)
              .filter(id => id !== undefined);
          } else if (section === 'items') {
            this.selectedItems = this.filteredItems
              .filter(item => !this.isItemSelected(item.id!))
              .map(item => item.id!)
              .filter(id => id !== undefined);
          } else if (section === 'subRecipes') {
            this.selectedSubRecipes = this.filteredSubRecipes
              .filter(recipe => !this.isSubRecipeSelected(recipe.id!))
              .map(recipe => recipe.id!)
              .filter(id => id !== undefined);
          } else if (section === 'purchaseOptions') {
            this.selectedPurchaseOptions = this.filteredPurchaseOptions
              .filter(option => !this.isPurchaseOptionSelected(option.purchaseOptionId))
              .map(option => option.purchaseOptionId)
              .filter(id => id !== undefined);
          }
          break;
        case 2: // All items
          if (section === 'locations') {
            this.selectedLocations = this.locations
              .filter(location => !this.isLocationSelected(location.id!))
              .map(location => location.id!)
              .filter(id => id !== undefined);
          } else if (section === 'items') {
            this.selectedItems = this.inventoryItems
              .filter(item => !this.isItemSelected(item.id!))
              .map(item => item.id!)
              .filter(id => id !== undefined);
          } else if (section === 'subRecipes') {
            this.selectedSubRecipes = this.subRecipes
              .filter(recipe => !this.isSubRecipeSelected(recipe.id!))
              .map(recipe => recipe.id!)
              .filter(id => id !== undefined);
          } else if (section === 'purchaseOptions') {
            this.selectedPurchaseOptions = this.purchaseOptions
              .filter(option => !this.isPurchaseOptionSelected(option.purchaseOptionId))
              .map(option => option.purchaseOptionId)
              .filter(id => id !== undefined);
          }
          break;
      }
      
      // Update counts after selection
      this.updateCounts(section);
      this.cdr.detectChanges();
    });
  }
  
  updateCounts(section: 'locations' | 'items' | 'subRecipes' | 'purchaseOptions'): void {
    switch (section) {
      case 'locations':
        this.counts.locations = {
          total: this.locations.length,
          filtered: this.filteredLocations.length,
          selected: this.selectedLocations.length
        };
        break;
      case 'items':
        this.counts.items = {
          total: this.inventoryItems.length,
          filtered: this.filteredItems.length,
          selected: this.selectedItems.length
        };
        break;
      case 'subRecipes':
        this.counts.subRecipes = {
          total: this.subRecipes.length,
          filtered: this.filteredSubRecipes.length,
          selected: this.selectedSubRecipes.length
        };
        break;
      case 'purchaseOptions':
        this.counts.purchaseOptions = {
          total: this.purchaseOptions.length,
          filtered: this.filteredPurchaseOptions.length,
          selected: this.selectedPurchaseOptions.length
        };
        break;
    }
  }
  
  // Get selection state label
  getSelectionStateLabel(section: 'locations' | 'items' | 'subRecipes' | 'purchaseOptions'): string {
    switch (this.selectionState[section]) {
      case 0: return 'Select All';
      case 1: return 'Select All (Filtered Only)';
      case 2: return 'Unselect All';
      default: return 'Select All';
    }
  }
  
  // Get selection state icon
  getSelectionStateIcon(section: 'locations' | 'items' | 'subRecipes' | 'purchaseOptions'): string {
    switch (this.selectionState[section]) {
      case 0: return 'check_box_outline_blank';
      case 1: return 'indeterminate_check_box';
      case 2: return 'check_box';
      default: return 'check_box_outline_blank';
    }
  }

  // Close the dialog
  close(): void {
    this.dialogRef.close(true);
  }
}
