import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatTooltipModule } from '@angular/material/tooltip';
import { debounceTime, distinctUntilChanged, Observable, of, switchMap } from 'rxjs';

import { MenuItemLine } from '../../models/MenuItemLine';
import { UnitOfMeasure } from '../../models/UnitOfMeasure';
import { InventoryItem } from '../../models/InventoryItem';
import { SubRecipe } from '../../models/SubRecipe';
import { MenuItem } from '../../models/MenuItem';

import { InventoryItemsService } from '../../services/inventory-items-service.service';
import { UomService } from '../../services/uom.service';
import { SubRecipeService } from '../../services/sub-recipe.service';
import { MenuItemsService } from '../../services/menu-items.service';

import { InventoryItemListDTO } from '../../models/InventoryItemListDTO';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-menu-item-line',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatAutocompleteModule,
    MatTooltipModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './menu-item-line.component.html',
  styleUrls: ['./menu-item-line.component.scss']
})
export class MenuItemLineComponent implements OnInit {
  @Input() line?: MenuItemLine;
  @Input() isEditMode = false;
  @Output() save = new EventEmitter<MenuItemLine>();
  @Output() cancel = new EventEmitter<void>();

  lineForm: FormGroup;
  
  // For autocomplete and selection
  filteredSubRecipes: SubRecipe[] = [];
  filteredMenuItems: MenuItem[] = [];
  allUoms: UnitOfMeasure[] = [];
  
  // Form controls for search
  inventoryItemCtrl = new FormControl<string>('', { nonNullable: true });
  subRecipeCtrl = new FormControl<string>('', { nonNullable: true });
  menuItemCtrl = new FormControl<string>('', { nonNullable: true });

  // Inventory item pagination
  inventoryItemsLoading = false;
  inventoryItemsPage = 0;
  inventoryItemsSize = 20;
  inventoryItemsTotal = 0;
  lastSearchTerm = '';
  // Update the type to use DTO
  filteredInventoryItems: InventoryItemListDTO[] = [];
  
  // Line type selection
  lineType: 'inventory' | 'subrecipe' | 'menuitem' = 'inventory';

  constructor(
    private fb: FormBuilder,
    private inventoryItemsService: InventoryItemsService,
    private subRecipeService: SubRecipeService,
    private menuItemsService: MenuItemsService,
    private uomService: UomService
  ) {
    this.lineForm = this.fb.group({
      id: [null],
      inventoryItemId: [null],
      subRecipeId: [null],
      childMenuItemId: [null],
      quantity: [0, [Validators.required, Validators.min(0.001)]],
      wastagePercent: [0, [Validators.min(0), Validators.max(100)]],
      unitOfMeasureId: [null, Validators.required],
      lineCost: [{ value: 0, disabled: true }] // Calculated field
    });
  }

  ngOnInit(): void {
    // Load UOMs
    this.loadUoms();
    
    // Setup autocomplete for inventory items
    this.setupInventoryItemAutocomplete();
    
    // Setup autocomplete for sub-recipes
    this.setupSubRecipeAutocomplete();
    
    // Setup autocomplete for menu items
    this.setupMenuItemAutocomplete();
    
    // If editing an existing line
    if (this.line && this.line.id) {
      this.initializeForm();
    }

    // Watch for quantity and wastage changes
    this.lineForm.get('quantity')?.valueChanges.subscribe(() => this.onQuantityChange());
    this.lineForm.get('wastagePercent')?.valueChanges.subscribe(() => this.onWastageChange());
    this.lineForm.get('unitOfMeasureId')?.valueChanges.subscribe(() => this.recalculateCost());

    // If editing existing line and it's a menu item type, handle UOM
    if (this.line?.childMenuItemId) {
      this.setEachUomForMenuItem();
    }

    // Set up a subscription to update UOM when the line type changes
    this.lineForm.get('childMenuItemId')?.valueChanges.subscribe(value => {
      if (value) {
        this.setEachUomForMenuItem();
      }
    });
  }

  private loadUoms(): void {
    this.uomService.getAllUoms().subscribe({
      next: (uoms) => {
        this.allUoms = uoms;
      },
      error: (err) => console.error('Error loading UOMs:', err)
    });
  }

  private setupInventoryItemAutocomplete(): void {
    this.inventoryItemCtrl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => {
        // If we already have an object (after selection), don't trigger a new search
        if (typeof term === 'object' && term !== null) return of({ content: [], totalElements: 0 });
        if (!term || typeof term !== 'string' || term.length < 1) return of({ content: [], totalElements: 0 });
        
        this.inventoryItemsLoading = true;
        this.inventoryItemsPage = 0; // Reset page when searching
        this.lastSearchTerm = term;
        
        return this.inventoryItemsService.getPaginatedInventoryItemsList(
          this.inventoryItemsPage,
          this.inventoryItemsSize,
          'name,asc',
          undefined, // categoryId
          term
        ).pipe(
          catchError(err => {
            console.error('Error searching inventory items:', err);
            this.inventoryItemsLoading = false;
            return of({ content: [], totalElements: 0 });
          })
        );
      })
    ).subscribe({
      next: (response) => {
        this.filteredInventoryItems = response.content;
        this.inventoryItemsTotal = response.totalElements;
        this.inventoryItemsLoading = false;
      },
      error: (err) => console.error('Error searching inventory items:', err)
    });
  }

  loadMoreInventoryItems(): void {
    if (this.inventoryItemsLoading) return;
    
    this.inventoryItemsPage++;
    this.inventoryItemsLoading = true;
    
    this.inventoryItemsService.getPaginatedInventoryItemsList(
      this.inventoryItemsPage,
      this.inventoryItemsSize,
      'name,asc',
      undefined, // categoryId
      this.lastSearchTerm
    ).subscribe({
      next: (response) => {
        this.filteredInventoryItems = [...this.filteredInventoryItems, ...response.content];
        this.inventoryItemsLoading = false;
      },
      error: (error) => {
        console.error('Error loading more inventory items:', error);
        this.inventoryItemsLoading = false;
        this.inventoryItemsPage--; // Revert on error
      }
    });
  }

  private setupSubRecipeAutocomplete(): void {
    this.subRecipeCtrl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => {
        // If we already have an object (after selection), don't trigger a new search
        if (typeof term === 'object' && term !== null) return of([]);
        if (!term || typeof term !== 'string' || term.length < 1) return of([]);
        return this.subRecipeService.searchSubRecipes(term);
      })
    ).subscribe({
      next: (recipes) => {
        this.filteredSubRecipes = recipes;
      },
      error: (err) => console.error('Error searching sub-recipes:', err)
    });
  }

  private setupMenuItemAutocomplete(): void {
    this.menuItemCtrl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => {
        // If we already have an object (after selection), don't trigger a new search
        if (typeof term === 'object' && term !== null) return of([]);
        if (!term || typeof term !== 'string' || term.length < 1) return of([]);
        return this.menuItemsService.searchMenuItems(term);
      })
    ).subscribe({
      next: (items) => {
        this.filteredMenuItems = items;
      },
      error: (err) => console.error('Error searching menu items:', err)
    });
  }

  private initializeForm(): void {
    if (!this.line) return;
    
    this.lineForm.patchValue({
      id: this.line.id,
      inventoryItemId: this.line.inventoryItemId,
      subRecipeId: this.line.subRecipeId,
      childMenuItemId: this.line.childMenuItemId,
      quantity: this.line.quantity,
      wastagePercent: this.line.wastagePercent || 0,
      unitOfMeasureId: this.line.unitOfMeasureId,
      lineCost: this.line.lineCost || 0
    });
    
    // Set line type based on the data
    if (this.line.inventoryItemId) {
      this.lineType = 'inventory';
      // Load and set inventory item name
      if (this.line.inventoryItemName) {
        this.inventoryItemCtrl.setValue(this.line.inventoryItemName);
      } else if (this.line.inventoryItemId) {
        this.inventoryItemsService.getInventoryItemById(this.line.inventoryItemId).subscribe(item => {
          if (item) {
            this.inventoryItemCtrl.setValue(item.name);
          }
        });
      }
    } else if (this.line.subRecipeId) {
      this.lineType = 'subrecipe';
      // Load and set sub-recipe name
      if (this.line.subRecipeName) {
        this.subRecipeCtrl.setValue(this.line.subRecipeName);
      } else if (this.line.subRecipeId) {
        this.subRecipeService.getSubRecipeById(this.line.subRecipeId).subscribe(subRecipe => {
          if (subRecipe) {
            this.subRecipeCtrl.setValue(subRecipe.name);
          }
        });
      }
    } else if (this.line.childMenuItemId) {
      this.lineType = 'menuitem';
      // Load and set menu item name
      if (this.line.childMenuItemName) {
        this.menuItemCtrl.setValue(this.line.childMenuItemName);
      } else if (this.line.childMenuItemId) {
        this.menuItemsService.getMenuItemById(this.line.childMenuItemId).subscribe(menuItem => {
          if (menuItem) {
            this.menuItemCtrl.setValue(menuItem.name);
          }
        });
      }
    }
  }

  setLineType(type: 'inventory' | 'subrecipe' | 'menuitem'): void {
    this.lineType = type;
    
    // Clear values of the other types
    if (type === 'inventory') {
      this.lineForm.get('subRecipeId')?.setValue(undefined);
      this.lineForm.get('childMenuItemId')?.setValue(undefined);
      this.subRecipeCtrl.setValue('');
      this.menuItemCtrl.setValue('');
      this.lineForm.get('unitOfMeasureId')?.enable();
    } else if (type === 'subrecipe') {
      this.lineForm.get('inventoryItemId')?.setValue(undefined);
      this.lineForm.get('childMenuItemId')?.setValue(undefined);
      this.inventoryItemCtrl.setValue('');
      this.menuItemCtrl.setValue('');
      this.lineForm.get('unitOfMeasureId')?.enable();
    } else {
      this.lineForm.get('inventoryItemId')?.setValue(undefined);
      this.lineForm.get('subRecipeId')?.setValue(undefined);
      this.inventoryItemCtrl.setValue('');
      this.subRecipeCtrl.setValue('');
      
      // For menu items, set UOM to "Each" automatically
      this.setEachUomForMenuItem();
    }

    // Reset cost
    this.lineForm.get('lineCost')?.setValue(0);
  }

  onInventoryItemSelected(item: InventoryItemListDTO): void {
    if (!item) return;
    
    // Store the selected item ID
    this.lineForm.get('inventoryItemId')?.setValue(item.id);
    
    // Update the display control value with just the item name
    this.inventoryItemCtrl.setValue(item.name, { emitEvent: false });
    
    // Fetch the full item to get UOM and price details
    this.inventoryItemsService.getInventoryItemById(item.id).subscribe({
      next: (fullItem) => {
        // Set the UOM if not already set
        if (!this.lineForm.get('unitOfMeasureId')?.value && fullItem.inventoryUom?.id) {
          this.lineForm.get('unitOfMeasureId')?.setValue(fullItem.inventoryUom.id);
        }
        
        // Calculate cost immediately
        this.calculateInventoryItemCost(fullItem);
      },
      error: (err) => console.error('Error fetching full item details:', err)
    });
  }

  onSubRecipeSelected(subRecipe: SubRecipe): void {
    if (!subRecipe) return;
    
    // Store the selected sub-recipe ID
    this.lineForm.get('subRecipeId')?.setValue(subRecipe.id);
    
    // Set the UOM if not already set
    if (!this.lineForm.get('unitOfMeasureId')?.value && subRecipe.uomId) {
      this.lineForm.get('unitOfMeasureId')?.setValue(subRecipe.uomId);
    }
    
    // Update the display control value with just the recipe name
    this.subRecipeCtrl.setValue(subRecipe.name, { emitEvent: false });
    
    // Calculate cost immediately
    this.calculateSubRecipeCost(subRecipe);
  }

  onMenuItemSelected(menuItem: MenuItem): void {
    if (!menuItem) return;
    
    // Store the selected menu item ID
    this.lineForm.get('childMenuItemId')?.setValue(menuItem.id);
    
    // Update the display control value with just the menu item name
    this.menuItemCtrl.setValue(menuItem.name, { emitEvent: false });
    
    // For menu items, set UOM to "Each" automatically
    this.setEachUomForMenuItem();
    
    // Calculate cost immediately
    this.calculateMenuItemCost(menuItem);
  }

  // Helper method to set UOM to "Each" for menu items
  private setEachUomForMenuItem(): void {
    // Find the UOM for "Each" or use a default one
    const eachUom = this.allUoms.find(uom => 
      uom.name?.toLowerCase() === 'each' || uom.abbreviation?.toLowerCase() === 'ea');
    
    if (eachUom?.id) {
      // Set UOM ID to Each but we'll hide the select component in the UI
      this.lineForm.get('unitOfMeasureId')?.setValue(eachUom.id);
    } else if (this.allUoms.length > 0) {
      // If we can't find Each, use the first UOM (just to make sure there's a value)
      this.lineForm.get('unitOfMeasureId')?.setValue(this.allUoms[0].id);
    }
  }

  // Calculate inventory item cost
  private calculateInventoryItemCost(item: InventoryItem): void {
    const quantity = this.lineForm.get('quantity')?.value || 0;
    const wastage = this.lineForm.get('wastagePercent')?.value || 0;
    const effectiveQuantity = quantity * (1 + wastage / 100);
    
    let cost = effectiveQuantity * (item.currentPrice || 0);
    
    // Convert units if needed
    const lineUom = this.allUoms.find(u => u.id === this.lineForm.get('unitOfMeasureId')?.value);
    const itemUom = item.inventoryUom;
    if (lineUom && itemUom && lineUom.conversionFactor > 0 && itemUom.conversionFactor > 0) {
      const convertedQty = effectiveQuantity * (lineUom.conversionFactor / itemUom.conversionFactor);
      cost = convertedQty * (item.currentPrice || 0);
    }
    
    this.lineForm.get('lineCost')?.setValue(cost);
  }

  // Calculate sub-recipe cost
  private calculateSubRecipeCost(subRecipe: SubRecipe): void {
    const quantity = this.lineForm.get('quantity')?.value || 0;
    const wastage = this.lineForm.get('wastagePercent')?.value || 0;
    const effectiveQuantity = quantity * (1 + wastage / 100);

    // Get the sub-recipe UOM
    const subRecipeUom = this.allUoms.find(u => u.id === subRecipe.uomId);
    
    if (subRecipeUom) {
      // Convert units if needed
      const lineUom = this.allUoms.find(u => u.id === this.lineForm.get('unitOfMeasureId')?.value);
      if (lineUom && lineUom.conversionFactor > 0 && subRecipeUom.conversionFactor > 0) {
        const convertedQty = effectiveQuantity * (lineUom.conversionFactor / subRecipeUom.conversionFactor);
        const childYield = subRecipe.yieldQty && subRecipe.yieldQty > 0 ? subRecipe.yieldQty : 1;
        const cost = (convertedQty / childYield) * (subRecipe.cost || 0);
        this.lineForm.get('lineCost')?.setValue(cost);
        return;
      }
    }

    // Fall back if no matching UOM
    const cost = (subRecipe.cost || 0) * (effectiveQuantity / (subRecipe.yieldQty || 1));
    this.lineForm.get('lineCost')?.setValue(cost);
  }

  // Calculate menu item cost
  private calculateMenuItemCost(menuItem: MenuItem): void {
    const quantity = this.lineForm.get('quantity')?.value || 0;
    const wastage = this.lineForm.get('wastagePercent')?.value || 0;
    const effectiveQuantity = quantity * (1 + wastage / 100);
    
    // Simple multiplication for menu items
    const cost = (menuItem.cost || 0) * effectiveQuantity;
    this.lineForm.get('lineCost')?.setValue(cost);
  }

  // Recalculate cost based on current line type
  recalculateCost(): void {
    if (this.lineType === 'inventory' && this.lineForm.get('inventoryItemId')?.value) {
      const itemId = this.lineForm.get('inventoryItemId')?.value;
      this.inventoryItemsService.getInventoryItemById(itemId).subscribe({
        next: (item) => {
          if (item) {
            this.calculateInventoryItemCost(item);
          }
        },
        error: (err) => console.error('Error calculating inventory item cost:', err)
      });
    } else if (this.lineType === 'subrecipe' && this.lineForm.get('subRecipeId')?.value) {
      const subRecipeId = this.lineForm.get('subRecipeId')?.value;
      this.subRecipeService.getSubRecipeById(subRecipeId).subscribe({
        next: (subRecipe) => {
          if (subRecipe) {
            this.calculateSubRecipeCost(subRecipe);
          }
        },
        error: (err) => console.error('Error calculating sub-recipe cost:', err)
      });
    } else if (this.lineType === 'menuitem' && this.lineForm.get('childMenuItemId')?.value) {
      const menuItemId = this.lineForm.get('childMenuItemId')?.value;
      this.menuItemsService.getMenuItemById(menuItemId).subscribe({
        next: (menuItem) => {
          if (menuItem) {
            this.calculateMenuItemCost(menuItem);
          }
        },
        error: (err) => console.error('Error calculating menu item cost:', err)
      });
    }
  }

  onQuantityChange(): void {
    this.recalculateCost();
  }

  onWastageChange(): void {
    this.recalculateCost();
  }

  onSave(): void {
    if (this.lineForm.invalid) {
      alert('Please complete all required fields');
      return;
    }
    
    // Get the raw form values
    const formValues = this.lineForm.getRawValue();
    
    // Prepare the line data
    const lineData: MenuItemLine = {
      ...formValues,
      // Add display names for UI
      inventoryItemName: this.lineType === 'inventory' ? this.inventoryItemCtrl.value : undefined,
      subRecipeName: this.lineType === 'subrecipe' ? this.subRecipeCtrl.value : undefined,
      childMenuItemName: this.lineType === 'menuitem' ? this.menuItemCtrl.value : undefined,
      uomName: this.allUoms.find(u => u.id === this.lineForm.get('unitOfMeasureId')?.value)?.name,
      uomAbbreviation: this.allUoms.find(u => u.id === this.lineForm.get('unitOfMeasureId')?.value)?.abbreviation
    };
    
    // Make sure only the correct ID is included based on the type
    if (this.lineType !== 'inventory') lineData.inventoryItemId = undefined;
    if (this.lineType !== 'subrecipe') lineData.subRecipeId = undefined;
    if (this.lineType !== 'menuitem') lineData.childMenuItemId = undefined;
    
    this.save.emit(lineData);
  }

  onCancel(): void {
    this.cancel.emit();
  }
  
  // Display functions for autocomplete
  displayInventoryFn(item: InventoryItemListDTO | string): string {
    if (typeof item === 'string') return item;
    return item && item.name ? item.name : '';
  }
  
  displaySubRecipeFn(recipe: SubRecipe | string): string {
    if (typeof recipe === 'string') return recipe;
    return recipe && recipe.name ? recipe.name : '';
  }
  
  displayMenuItemFn(menuItem: MenuItem | string): string {
    if (typeof menuItem === 'string') return menuItem;
    return menuItem && menuItem.name ? menuItem.name : '';
  }
}
