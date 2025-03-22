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
        if (!term || term.length < 2) return of([]);
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
        if (!term || term.length < 2) return of([]);
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

  onInventoryItemSelected(itemId: number): void {
    this.lineForm.get('inventoryItemId')?.setValue(itemId);
    
    // Look up the item to get its default UOM and cost
    this.inventoryItemsService.getInventoryItemById(itemId).subscribe(item => {
      if (item) {
        // Set the UOM if not already set
        if (!this.lineForm.get('unitOfMeasureId')?.value) {
          this.lineForm.get('unitOfMeasureId')?.setValue(item.inventoryUom?.id);
        }
        
        // Calculate line cost
        this.calculateLineCost();
      }
    });
  }

  onSubRecipeSelected(subRecipeId: number): void {
    this.lineForm.get('childSubRecipeId')?.setValue(subRecipeId);
    
    // Look up the sub-recipe to get its default UOM and cost
    this.subRecipeService.getSubRecipeById(subRecipeId).subscribe(subRecipe => {
      if (subRecipe) {
        // Set the UOM if not already set
        if (!this.lineForm.get('unitOfMeasureId')?.value) {
          this.lineForm.get('unitOfMeasureId')?.setValue(subRecipe.uomId);
        }
        
        // Calculate line cost
        this.calculateLineCost();
      }
    });
  }

  calculateLineCost(): void {
    const quantity = this.lineForm.get('quantity')?.value || 0;
    const wastage = this.lineForm.get('wastagePercent')?.value || 0;
    const effectiveQuantity = quantity * (1 + wastage / 100);
    let cost = 0;
    
    if (this.lineType === 'inventory' && this.lineForm.get('inventoryItemId')?.value) {
      // Calculate cost based on inventory item
      const itemId = this.lineForm.get('inventoryItemId')?.value;
      this.inventoryItemsService.getInventoryItemById(itemId).subscribe(item => {
        if (item) {
          cost = effectiveQuantity * (item.currentPrice || 0);
          this.lineForm.get('lineCost')?.setValue(cost);
        }
      });
    } else if (this.lineType === 'subrecipe' && this.lineForm.get('childSubRecipeId')?.value) {
      // Calculate cost based on sub-recipe
      const subRecipeId = this.lineForm.get('childSubRecipeId')?.value;
      this.subRecipeService.getSubRecipeById(subRecipeId).subscribe(subRecipe => {
        if (subRecipe) {
          // If the sub-recipe has a yield quantity, adjust the cost calculation
          const yieldAdjustment = subRecipe.yieldQty && subRecipe.yieldQty > 0 
            ? effectiveQuantity / subRecipe.yieldQty 
            : effectiveQuantity;
          
          cost = yieldAdjustment * (subRecipe.cost || 0);
          this.lineForm.get('lineCost')?.setValue(cost);
        }
      });
    }
  }

  onQuantityChange(): void {
    this.calculateLineCost();
  }

  onWastageChange(): void {
    this.calculateLineCost();
  }

  onSave(): void {
    if (this.lineForm.invalid) {
      alert('Please complete all required fields correctly');
      return;
    }
    
    // Final line cost calculation before save
    this.calculateLineCost();
    
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
  }

  onCancel(): void {
    this.cancel.emit();
  }

  onDelete(): void {
    if (this.line && this.line.id) {
      this.delete.emit(this.line.id);
    }
  }
}
