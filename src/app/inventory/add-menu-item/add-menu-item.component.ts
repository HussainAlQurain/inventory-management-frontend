import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Observable, of, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { map } from 'rxjs/operators';
import { catchError } from 'rxjs/operators';

import { MenuItem } from '../../models/MenuItem';
import { MenuItemLine } from '../../models/MenuItemLine';
import { Category } from '../../models/Category';
import { UnitOfMeasure } from '../../models/UnitOfMeasure';
import { InventoryItem } from '../../models/InventoryItem';
import { SubRecipe } from '../../models/SubRecipe';
import { FilterOptionDTO } from '../../models/FilterOptionDTO';

import { MenuItemsService } from '../../services/menu-items.service';
import { CategoriesService } from '../../services/categories.service';
import { UomService } from '../../services/uom.service';
import { InventoryItemsService } from '../../services/inventory-items-service.service';
import { SubRecipeService } from '../../services/sub-recipe.service';
import { CompaniesService } from '../../services/companies.service';

import { MenuItemLineComponent } from '../../components/menu-item-line/menu-item-line.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-add-menu-item',
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
    MatDividerModule,
    MatTabsModule,
    MatTableModule,
    MatTooltipModule,
    MenuItemLineComponent,
    MatProgressSpinnerModule
  ],
  templateUrl: './add-menu-item.component.html',
  styleUrls: ['./add-menu-item.component.scss']
})
export class AddMenuItemComponent implements OnInit {
  @Output() closePanel = new EventEmitter<MenuItem | null>();
  
  // Form for the menu item
  menuItemForm: FormGroup;
  
  // Category selection
  categoryCtrl = new FormControl<string>('', { nonNullable: true });
  filteredCategories: Category[] = [];
  canCreateNewCategory = false;
  categoriesLoading = false;
  
  // Menu item lines (components)
  menuItemLines: MenuItemLine[] = [];
  
  // States
  isSubmitting = false;
  isEditingLine = false;
  currentLine: MenuItemLine | undefined = undefined;
  
  // Column definitions for the lines table
  displayedColumns: string[] = [
    'item', 'type', 'quantity', 'wastage', 'uom', 'cost', 'actions'
  ];
  
  constructor(
    private fb: FormBuilder,
    private menuItemsService: MenuItemsService,
    private categoriesService: CategoriesService,
    private uomService: UomService,
    private inventoryItemsService: InventoryItemsService,
    private subRecipeService: SubRecipeService,
    private companiesService: CompaniesService
  ) {
    // Initialize the form
    this.menuItemForm = this.fb.group({
      name: ['', Validators.required],
      posCode: [''],
      categoryId: [null, Validators.required],
      retailPriceExclTax: [0, [Validators.required, Validators.min(0)]],
      maxAllowedFoodCostPct: [30, [Validators.min(0), Validators.max(100)]], // Changed to 30 (for 30%) and added max validator
      modifierGroups: [''],
      cost: [{ value: 0, disabled: true }],
      foodCostPercentage: [{ value: 0, disabled: true }]
    });
  }

  ngOnInit(): void {
    
    // Watch for changes to retail price to recalculate food cost percentage
    this.menuItemForm.get('retailPriceExclTax')?.valueChanges.subscribe(() => {
      this.updateFoodCostPercentage();
    });

    // Setup category autocomplete
    this.setupCategoryAutocomplete();
  }
  
  private setupCategoryAutocomplete(): void {
    this.categoryCtrl.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      switchMap(term => this.onCategorySearchChange(term))
    ).subscribe();
  }
  
  private onCategorySearchChange(term: string): Observable<void> {
    this.categoriesLoading = true;
    if (!term) term = '';
    
    // Use the paginated endpoint
    return this.categoriesService.getPaginatedCategoryFilterOptions(0, 20, term).pipe(
      map(response => {
        this.categoriesLoading = false;
        this.filteredCategories = response.content.map(option => ({
          id: option.id,
          name: option.name,
          description: '' // FilterOptionDTO doesn't include description
        } as Category));
        
        const exactMatch = this.filteredCategories.some(c => c.name.toLowerCase() === term.toLowerCase());
        this.canCreateNewCategory = term.length > 0 && !exactMatch;
        return;
      }),
      catchError(err => {
        this.categoriesLoading = false;
        console.error('Error loading categories:', err);
        return of();
      })
    );
  }
  
  onCategorySelected(value: string): void {
    const category = this.filteredCategories.find(c => c.name === value);
    if (category) {
      this.menuItemForm.get('categoryId')?.setValue(category.id);
    }
  }
  
  onCategoryOptionSelected(fullValue: string): void {
    // Check if selected an existing category
    const existing = this.filteredCategories.find(c => c.name === fullValue);
    if (existing) {
      this.menuItemForm.get('categoryId')?.setValue(existing.id);
      return;
    }
    
    // Otherwise, create a new category
    this.createNewCategory(fullValue);
  }
  
  private createNewCategory(name: string): void {
    const newCat: Partial<Category> = { name };
    this.categoriesService.createCategory(newCat).subscribe({
      next: (created) => {
        this.menuItemForm.get('categoryId')?.setValue(created.id);
        this.categoryCtrl.setValue(created.name);
        this.filteredCategories.push(created);
        this.canCreateNewCategory = false;
      },
      error: (err) => console.error('Error creating category:', err)
    });
  }
  
  // Line management methods
  addNewLine(): void {
    this.isEditingLine = true;
    this.currentLine = undefined;
  }
  
  editLine(line: MenuItemLine): void {
    this.isEditingLine = true;
    this.currentLine = { ...line }; // Clone to avoid direct mutation
  }
  
  saveLine(line: MenuItemLine): void {
    // Check if we're editing an existing line
    const existingIndex = this.menuItemLines.findIndex(l => l === this.currentLine);
    
    // Create a copy of the line to avoid reference issues
    const lineToSave = { ...line };
    
    // Ensure the line has either inventoryItemId, subRecipeId, or childMenuItemId
    if (!lineToSave.inventoryItemId && !lineToSave.subRecipeId && !lineToSave.childMenuItemId) {
      alert('Please select an inventory item, sub-recipe, or menu item');
      return;
    }
    
    // Make sure only one ID type is set based on the item type
    if (lineToSave.inventoryItemId) {
      lineToSave.subRecipeId = undefined;
      lineToSave.childMenuItemId = undefined;
    } else if (lineToSave.subRecipeId) {
      lineToSave.inventoryItemId = undefined;
      lineToSave.childMenuItemId = undefined;
    } else if (lineToSave.childMenuItemId) {
      lineToSave.inventoryItemId = undefined;
      lineToSave.subRecipeId = undefined;
    }
    
    if (existingIndex !== -1) {
      // Update existing line
      this.menuItemLines[existingIndex] = lineToSave;
    } else {
      // Add new line
      this.menuItemLines.push(lineToSave);
    }
    
    this.isEditingLine = false;
    this.currentLine = undefined;
    
    // Update costs
    this.updateCosts();
  }
  
  cancelLineEdit(): void {
    this.isEditingLine = false;
    this.currentLine = undefined;
  }
  
  deleteLine(index: number): void {
    this.menuItemLines.splice(index, 1);
    this.updateCosts();
  }
  
  // Update costs when lines or yield changes
  updateCosts(): void {
    // Calculate total cost from all lines
    const totalCost = this.menuItemLines.reduce((sum, line) => {
      return sum + (line.lineCost || 0);
    }, 0);
    
    // Update form
    this.menuItemForm.get('cost')?.setValue(totalCost);
    
    // Update food cost percentage
    this.updateFoodCostPercentage();
  }
  
  // Update food cost percentage based on retail price and cost
  updateFoodCostPercentage(): void {
    const cost = this.menuItemForm.get('cost')?.value || 0;
    const retailPrice = this.menuItemForm.get('retailPriceExclTax')?.value || 0;
    
    let foodCostPct = 0;
    if (retailPrice > 0) {
      // Calculate as percentage (0-100 range)
      foodCostPct = (cost / retailPrice) * 100;
    }
    
    this.menuItemForm.get('foodCostPercentage')?.setValue(foodCostPct);
  }
  
  // Form submission
  submitForm(): void {
    if (!this.menuItemForm.valid) {
      alert('Please fill out all required fields');
      return;
    }
    
    if (this.menuItemLines.length === 0) {
      alert('Please add at least one component line');
      return;
    }
    
    this.isSubmitting = true;
    
    // Build the request object
    const formValues = this.menuItemForm.getRawValue();
    
    // Clean up the menu item lines to ensure they have the correct format for the backend
    const cleanedLines = this.menuItemLines.map(line => {
      // Create a new object with only the properties needed for the backend
      return {
        id: line.id,
        inventoryItemId: line.inventoryItemId,
        subRecipeId: line.subRecipeId,
        childMenuItemId: line.childMenuItemId,
        quantity: line.quantity,
        wastagePercent: line.wastagePercent,
        unitOfMeasureId: line.unitOfMeasureId,
        lineCost: line.lineCost
      };
    });
    
    // Convert food cost percentage from display format (0-100) to decimal format (0-1) for backend
    const foodCostPercentage = formValues.foodCostPercentage / 100;
    
    const menuItemData: MenuItem = {
      ...formValues,
      maxAllowedFoodCostPct: formValues.maxAllowedFoodCostPct / 100, // Convert to decimal
      cost: this.menuItemForm.get('cost')?.value || 0,
      foodCostPercentage: foodCostPercentage, // Store as decimal for backend
      menuItemLines: cleanedLines
    };
    
    // The createMenuItem method no longer needs companyId as it gets it from the service
    this.menuItemsService.createMenuItem(menuItemData).subscribe({
      next: (createdMenuItem) => {
          this.isSubmitting = false;
          this.closePanel.emit(createdMenuItem);
      },
      error: (error) => {
          this.isSubmitting = false;
          console.error('Error creating menu item:', error);
          alert('Error creating menu item. Please try again.');
      }
    });
  }
  
  cancel(): void {
    this.closePanel.emit(null);
  }
}
