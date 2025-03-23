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

import { SubRecipe, SubRecipeLine } from '../../models/SubRecipe';
import { UnitOfMeasure } from '../../models/UnitOfMeasure';
import { InventoryItem } from '../../models/InventoryItem';

import { InventoryItemsService } from '../../services/inventory-items-service.service';
import { UomService } from '../../services/uom.service';
import { SubRecipeService } from '../../services/sub-recipe.service';

@Component({
  selector: 'app-sub-recipe-line-item',
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
    MatTooltipModule
  ],
  templateUrl: './sub-recipe-line-item.component.html',
  styleUrls: ['./sub-recipe-line-item.component.scss']
})
export class SubRecipeLineItemComponent implements OnInit {
  @Input() line?: SubRecipeLine;
  @Input() isEditMode = false;
  @Output() save = new EventEmitter<SubRecipeLine>();
  @Output() cancel = new EventEmitter<void>();
  @Output() delete = new EventEmitter<number>();

  lineForm: FormGroup;
  
  // For autocomplete and selection
  filteredInventoryItems: InventoryItem[] = [];
  filteredSubRecipes: SubRecipe[] = [];
  allUoms: UnitOfMeasure[] = [];
  
  // Form controls for search
  inventoryItemCtrl = new FormControl<string>('', { nonNullable: true });
  subRecipeCtrl = new FormControl<string>('', { nonNullable: true });
  
  // Line type selection
  lineType: 'inventory' | 'subrecipe' = 'inventory';

  constructor(
    private fb: FormBuilder,
    private inventoryItemsService: InventoryItemsService,
    private subRecipeService: SubRecipeService,
    private uomService: UomService
  ) {
    this.lineForm = this.fb.group({
      id: [null],
      inventoryItemId: [null],
      childSubRecipeId: [null],
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
    
    // If editing an existing line
    if (this.line && this.line.id) {
      this.initializeForm();
    }
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
        if (!term || typeof term !== 'string' || term.length < 1) return of([]);
        return this.inventoryItemsService.searchInventoryItems(term);
      })
    ).subscribe({
      next: (items) => {
        this.filteredInventoryItems = items;
      },
      error: (err) => console.error('Error searching inventory items:', err)
    });
  }

  private setupSubRecipeAutocomplete(): void {
    this.subRecipeCtrl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => {
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

  private initializeForm(): void {
    if (!this.line) return;
    
    this.lineForm.patchValue({
      id: this.line.id,
      inventoryItemId: this.line.inventoryItemId,
      childSubRecipeId: this.line.childSubRecipeId,
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
    } else if (this.line.childSubRecipeId) {
      this.lineType = 'subrecipe';
      // Load and set sub-recipe name
      if (this.line.childSubRecipeName) {
        this.subRecipeCtrl.setValue(this.line.childSubRecipeName);
      } else if (this.line.childSubRecipeId) {
        this.subRecipeService.getSubRecipeById(this.line.childSubRecipeId).subscribe(subRecipe => {
          if (subRecipe) {
            this.subRecipeCtrl.setValue(subRecipe.name);
          }
        });
      }
    }
  }

  setLineType(type: 'inventory' | 'subrecipe'): void {
    this.lineType = type;
    
    // Clear values of the other type
    if (type === 'inventory') {
      this.lineForm.get('childSubRecipeId')?.setValue(null);
      this.subRecipeCtrl.setValue('');
    } else {
      this.lineForm.get('inventoryItemId')?.setValue(null);
      this.inventoryItemCtrl.setValue('');
    }
  }

  onInventoryItemSelected(item: InventoryItem): void {
    if (!item) return;
    
    // Store the selected item ID
    this.lineForm.get('inventoryItemId')?.setValue(item.id);
    
    // Set the UOM if not already set
    if (!this.lineForm.get('unitOfMeasureId')?.value && item.inventoryUom?.id) {
      this.lineForm.get('unitOfMeasureId')?.setValue(item.inventoryUom.id);
    }
    
    // Calculate cost immediately
    this.calculateInventoryItemCost(item);
  }

  onSubRecipeSelected(subRecipe: SubRecipe): void {
    if (!subRecipe) return;
    
    // Store the selected sub-recipe ID
    this.lineForm.get('childSubRecipeId')?.setValue(subRecipe.id);
    
    // Set the UOM if not already set
    if (!this.lineForm.get('unitOfMeasureId')?.value && subRecipe.uomId) {
      this.lineForm.get('unitOfMeasureId')?.setValue(subRecipe.uomId);
    }
    
    // Calculate cost immediately
    this.calculateSubRecipeCost(subRecipe);
  }

  // New method to calculate inventory item cost
  private calculateInventoryItemCost(item: InventoryItem): void {
    const quantity = this.lineForm.get('quantity')?.value || 0;
    const wastage = this.lineForm.get('wastagePercent')?.value || 0;
    const effectiveQuantity = quantity * (1 + wastage / 100);
    const cost = effectiveQuantity * (item.currentPrice || 0);
    this.lineForm.get('lineCost')?.setValue(cost);
  }

  // New method to calculate sub-recipe cost
  private calculateSubRecipeCost(subRecipe: SubRecipe): void {
    const quantity = this.lineForm.get('quantity')?.value || 0;
    const wastage = this.lineForm.get('wastagePercent')?.value || 0;
    const effectiveQuantity = quantity * (1 + wastage / 100);
    
    // If the sub-recipe has a yield quantity, adjust the cost calculation
    let yieldAdjustment = effectiveQuantity;
    if (subRecipe.yieldQty && subRecipe.yieldQty > 0) {
      yieldAdjustment = effectiveQuantity / subRecipe.yieldQty;
    }
    
    const cost = yieldAdjustment * (subRecipe.cost || 0);
    this.lineForm.get('lineCost')?.setValue(cost);
  }

  calculateLineCost(): void {
    const quantity = this.lineForm.get('quantity')?.value || 0;
    const wastage = this.lineForm.get('wastagePercent')?.value || 0;
    const effectiveQuantity = quantity * (1 + wastage / 100);
    
    if (this.lineType === 'inventory' && this.lineForm.get('inventoryItemId')?.value) {
      // Calculate cost based on inventory item
      const itemId = this.lineForm.get('inventoryItemId')?.value;
      this.inventoryItemsService.getInventoryItemById(itemId).subscribe({
        next: (item) => {
          if (item) {
            this.calculateInventoryItemCost(item);
          }
        },
        error: (err) => console.error('Error getting inventory item for cost calculation:', err)
      });
    } else if (this.lineType === 'subrecipe' && this.lineForm.get('childSubRecipeId')?.value) {
      // Calculate cost based on sub-recipe
      const subRecipeId = this.lineForm.get('childSubRecipeId')?.value;
      this.subRecipeService.getSubRecipeById(subRecipeId).subscribe({
        next: (subRecipe) => {
          if (subRecipe) {
            this.calculateSubRecipeCost(subRecipe);
          }
        },
        error: (err) => console.error('Error getting sub-recipe for cost calculation:', err)
      });
    }
  }

  onQuantityChange(): void {
    // Store selected item/recipe information so we don't need to fetch again
    if (this.lineType === 'inventory' && this.lineForm.get('inventoryItemId')?.value) {
      const itemId = this.lineForm.get('inventoryItemId')?.value;
      this.inventoryItemsService.getInventoryItemById(itemId).subscribe({
        next: (item) => {
          if (item) {
            this.calculateInventoryItemCost(item);
          }
        },
        error: (err) => console.error('Error getting inventory item for cost calculation:', err)
      });
    } else if (this.lineType === 'subrecipe' && this.lineForm.get('childSubRecipeId')?.value) {
      const subRecipeId = this.lineForm.get('childSubRecipeId')?.value;
      this.subRecipeService.getSubRecipeById(subRecipeId).subscribe({
        next: (subRecipe) => {
          if (subRecipe) {
            this.calculateSubRecipeCost(subRecipe);
          }
        },
        error: (err) => console.error('Error getting sub-recipe for cost calculation:', err)
      });
    }
  }

  onWastageChange(): void {
    // Use the same logic as onQuantityChange to recalculate
    this.onQuantityChange();
  }

  // New method to manually set selected item display
  // This helps with selection visibility
  updateSelectedItemDisplay(): void {
    if (this.lineType === 'inventory' && this.lineForm.get('inventoryItemId')?.value) {
      const itemId = this.lineForm.get('inventoryItemId')?.value;
      this.inventoryItemsService.getInventoryItemById(itemId).subscribe({
        next: (item) => {
          if (item) {
            this.inventoryItemCtrl.setValue(item.name);
          }
        }
      });
    } else if (this.lineType === 'subrecipe' && this.lineForm.get('childSubRecipeId')?.value) {
      const subRecipeId = this.lineForm.get('childSubRecipeId')?.value;
      this.subRecipeService.getSubRecipeById(subRecipeId).subscribe({
        next: (subRecipe) => {
          if (subRecipe) {
            this.subRecipeCtrl.setValue(subRecipe.name);
          }
        }
      });
    }
  }

  onSave(): void {
    if (this.lineForm.invalid) {
      alert('Please complete all required fields correctly');
      return;
    }
    
    // Update the display name one final time to ensure it's correct
    this.updateSelectedItemDisplay();
    
    // Allow a brief moment for the display name update
    setTimeout(() => {
      // Prepare the line data
      const lineData: SubRecipeLine = {
        ...this.lineForm.getRawValue(),
        // Add display names for UI if available
        inventoryItemName: this.lineType === 'inventory' ? this.inventoryItemCtrl.value : undefined,
        childSubRecipeName: this.lineType === 'subrecipe' ? this.subRecipeCtrl.value : undefined,
        uomName: this.allUoms.find(u => u.id === this.lineForm.get('unitOfMeasureId')?.value)?.name,
        uomAbbreviation: this.allUoms.find(u => u.id === this.lineForm.get('unitOfMeasureId')?.value)?.abbreviation
      };
      
      this.save.emit(lineData);
    }, 100);
  }

  onCancel(): void {
    this.cancel.emit();
  }
  
  onDelete(): void {
    if (this.line && this.line.id) {
      this.delete.emit(this.line.id);
    }
  }
  
  // Display functions for autocomplete - modified to properly handle string inputs
  displayInventoryFn(item: InventoryItem | string): string {
    if (typeof item === 'string') return item;
    return item && item.name ? item.name : '';
  }
  
  displaySubRecipeFn(recipe: SubRecipe | string): string {
    if (typeof recipe === 'string') return recipe;
    return recipe && recipe.name ? recipe.name : '';
  }
}
