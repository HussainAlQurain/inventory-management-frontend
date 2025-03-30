import { Component, EventEmitter, Input, OnChanges, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { forkJoin, of, Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { MenuItem } from '../../models/MenuItem';
import { MenuItemLine } from '../../models/MenuItemLine';
import { Category } from '../../models/Category';
import { InventoryItem } from '../../models/InventoryItem';
import { SubRecipe } from '../../models/SubRecipe';
import { UnitOfMeasure } from '../../models/UnitOfMeasure';

import { MenuItemsService } from '../../services/menu-items.service';
import { CategoriesService } from '../../services/categories.service';
import { MenuItemLineComponent } from '../../components/menu-item-line/menu-item-line.component';
import { InventoryItemsService } from '../../services/inventory-items-service.service';
import { SubRecipeService } from '../../services/sub-recipe.service';
import { UomService } from '../../services/uom.service';

@Component({
  selector: 'app-menu-item-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDividerModule,
    MatTableModule,
    MatTabsModule,
    MatTooltipModule,
    MatSnackBarModule,
    MenuItemLineComponent
  ],
  templateUrl: './menu-item-detail.component.html',
  styleUrls: ['./menu-item-detail.component.scss']
})
export class MenuItemDetailComponent implements OnInit, OnChanges {
  @Input() menuItem: MenuItem | null = null;
  @Input() isEditMode = false;
  @Output() closePanel = new EventEmitter<void>();
  @Output() save = new EventEmitter<MenuItem>();

  menuItemForm: FormGroup;
  categories: Category[] = [];
  
  // For line management
  isEditingLine = false;
  currentLine?: MenuItemLine;
  
  // For table display
  displayedColumns: string[] = [
    'item', 'type', 'quantity', 'wastage', 'uom', 'cost', 'actions'
  ];

  // For data lookup
  inventoryItems: Map<number, InventoryItem> = new Map();
  subRecipes: Map<number, SubRecipe> = new Map();
  menuItems: Map<number, MenuItem> = new Map();
  uoms: Map<number, UnitOfMeasure> = new Map();

  constructor(
    private fb: FormBuilder,
    private menuItemsService: MenuItemsService,
    private categoriesService: CategoriesService,
    private inventoryItemsService: InventoryItemsService,
    private subRecipeService: SubRecipeService,
    private uomService: UomService,
    private snackBar: MatSnackBar
  ) {
    this.menuItemForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadCategories();
    if (this.menuItem) {
      this.initializeForm();
    }
    this.loadUoms();
  }

  ngOnChanges(): void {
    // When inputs change (especially isEditMode), update the form
    if (this.menuItem) {
      this.initializeForm();
    }
    this.updateFormState();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      id: [null],
      name: ['', Validators.required],
      posCode: [''],
      categoryId: [null, Validators.required],
      retailPriceExclTax: [0, [Validators.required, Validators.min(0)]],
      maxAllowedFoodCostPct: [30, [Validators.min(0), Validators.max(100)]],
      modifierGroups: [''],
      cost: [{ value: 0, disabled: true }],
      foodCostPercentage: [{ value: 0, disabled: true }]
    });
  }

  private loadCategories(): void {
    this.categoriesService.getAllCategories('').subscribe({
      next: (categories) => {
        this.categories = categories;
      },
      error: (err) => console.error('Error loading categories:', err)
    });
  }

  private initializeForm(): void {
    if (!this.menuItem) return;

    // Reset the form with new values
    this.menuItemForm.patchValue({
      id: this.menuItem.id,
      name: this.menuItem.name,
      posCode: this.menuItem.posCode,
      categoryId: this.menuItem.category?.id,
      retailPriceExclTax: this.menuItem.retailPriceExclTax,
      maxAllowedFoodCostPct: this.menuItem.maxAllowedFoodCostPct ? this.menuItem.maxAllowedFoodCostPct * 100 : 30, // Convert from decimal to percentage display
      modifierGroups: this.menuItem.modifierGroups,
      cost: this.menuItem.cost || 0,
      foodCostPercentage: this.menuItem.foodCostPercentage || 0
    });

    this.updateFormState();
  }

  private updateFormState(): void {
    if (this.isEditMode) {
      this.menuItemForm.enable();
      // Cost and food cost percentage should always be disabled
      this.menuItemForm.get('cost')?.disable();
      this.menuItemForm.get('foodCostPercentage')?.disable();
    } else {
      this.menuItemForm.disable();
    }
  }

  toggleEditMode(): void {
    this.isEditMode = !this.isEditMode;
    this.updateFormState();
  }

  // Line management methods
  addNewLine(): void {
    if (!this.isEditMode || !this.menuItem || !this.menuItem.id) return;
    this.isEditingLine = true;
    this.currentLine = undefined;
  }

  editLine(line: MenuItemLine): void {
    if (!this.isEditMode || !this.menuItem || !this.menuItem.id) return;
    this.isEditingLine = true;
    this.currentLine = { ...line }; // Clone to avoid direct mutation
  }

  saveLine(line: MenuItemLine): void {
    if (!this.menuItem || !this.menuItem.id) return;

    const isNew = !line.id;
    
    if (isNew) {
      // Add new line
      this.menuItemsService.addLineToMenuItem(this.menuItem.id, line).subscribe({
        next: (savedLine) => {
          if (!this.menuItem?.menuItemLines) {
            this.menuItem!.menuItemLines = [];
          }
          this.menuItem!.menuItemLines.push(savedLine);
          this.isEditingLine = false;
          this.currentLine = undefined;
          this.updateMenuItemCosts();
          this.snackBar.open('Line added successfully', 'Close', { duration: 3000 });
        },
        error: (err) => {
          console.error('Error adding line:', err);
          this.snackBar.open('Error adding line', 'Close', { duration: 3000 });
        }
      });
    } else {
      // Update existing line
      this.menuItemsService.updateMenuItemLine(this.menuItem.id, line.id!, line).subscribe({
        next: (updatedLine) => {
          const index = this.menuItem!.menuItemLines?.findIndex(l => l.id === line.id) ?? -1;
          if (index !== -1 && this.menuItem?.menuItemLines) {
            this.menuItem.menuItemLines[index] = updatedLine;
          }
          this.isEditingLine = false;
          this.currentLine = undefined;
          this.updateMenuItemCosts();
          this.snackBar.open('Line updated successfully', 'Close', { duration: 3000 });
        },
        error: (err) => {
          console.error('Error updating line:', err);
          this.snackBar.open('Error updating line', 'Close', { duration: 3000 });
        }
      });
    }
  }

  cancelLineEdit(): void {
    this.isEditingLine = false;
    this.currentLine = undefined;
  }

  deleteLine(line: MenuItemLine): void {
    if (!this.menuItem || !this.menuItem.id || !line.id) return;

    if (confirm('Are you sure you want to delete this component?')) {
      this.menuItemsService.deleteMenuItemLine(this.menuItem.id, line.id).subscribe({
        next: () => {
          if (this.menuItem?.menuItemLines) {
            this.menuItem.menuItemLines = this.menuItem.menuItemLines.filter(l => l.id !== line.id);
          }
          this.updateMenuItemCosts();
          this.snackBar.open('Line deleted successfully', 'Close', { duration: 3000 });
        },
        error: (err) => {
          console.error('Error deleting line:', err);
          this.snackBar.open('Error deleting line', 'Close', { duration: 3000 });
        }
      });
    }
  }

  // Update the menu item's overall costs based on its lines
  updateMenuItemCosts(): void {
    if (!this.menuItem) return;

    // Calculate total cost from all lines
    let totalCost = 0;
    if (this.menuItem.menuItemLines) {
      totalCost = this.menuItem.menuItemLines.reduce((sum, line) => sum + (line.lineCost || 0), 0);
    }
    
    // Update cost
    this.menuItem.cost = totalCost;
    this.menuItemForm.get('cost')?.setValue(totalCost);
    
    // Update food cost percentage
    const retailPrice = this.menuItemForm.get('retailPriceExclTax')?.value || 0;
    let foodCostPct = 0;
    if (retailPrice > 0) {
      foodCostPct = (totalCost / retailPrice) * 100; // Calculate as percentage (0-100 range)
    }
    
    this.menuItem.foodCostPercentage = foodCostPct;
    this.menuItemForm.get('foodCostPercentage')?.setValue(foodCostPct);
  }

  saveMenuItem(): void {
    if (!this.menuItem || !this.menuItemForm.valid) return;

    // Get form values
    const formValues = this.menuItemForm.getRawValue();
    
    // Convert maxAllowedFoodCostPct to decimal for backend
    const maxAllowedFoodCostPct = formValues.maxAllowedFoodCostPct / 100;

    // Prepare the updated menu item
    const updatedMenuItem: MenuItem = {
      ...this.menuItem,
      name: formValues.name,
      posCode: formValues.posCode,
      categoryId: formValues.categoryId,
      retailPriceExclTax: formValues.retailPriceExclTax,
      maxAllowedFoodCostPct: maxAllowedFoodCostPct,
      modifierGroups: formValues.modifierGroups,
      // Keep the existing cost and food cost percentage
    };

    // Save the updated menu item
    this.menuItemsService.updateMenuItem(updatedMenuItem).subscribe({
      next: (savedMenuItem) => {
        this.menuItem = savedMenuItem;
        this.isEditMode = false;
        this.updateFormState();
        this.save.emit(savedMenuItem);
        this.snackBar.open('Menu item updated successfully', 'Close', { duration: 3000 });
      },
      error: (err) => {
        console.error('Error updating menu item:', err);
        this.snackBar.open('Error updating menu item', 'Close', { duration: 3000 });
      }
    });
  }

  onClose(): void {
    this.closePanel.emit();
  }

  getCategoryName(categoryId: number): string {
    return this.categories.find(c => c.id === categoryId)?.name || 'Unknown';
  }

  loadMenuItemDetails(menuItemId: number): void {
    this.menuItemsService.getMenuItemById(menuItemId).subscribe({
      next: (menuItem) => {
        this.menuItem = menuItem;
        this.initializeForm();
        
        // Load related data for lines
        this.loadRelatedData();
      },
      error: (err) => {
        console.error(`Error loading menu item with ID ${menuItemId}:`, err);
        this.snackBar.open('Error loading menu item details', 'Close', { duration: 3000 });
      }
    });
  }
  
  private loadRelatedData(): void {
    if (!this.menuItem || !this.menuItem.menuItemLines || this.menuItem.menuItemLines.length === 0) {
      return;
    }
    
    // Extract unique IDs to fetch
    const inventoryItemIds: number[] = [];
    const subRecipeIds: number[] = [];
    const menuItemIds: number[] = [];
    const uomIds: number[] = [];
    
    this.menuItem.menuItemLines.forEach(line => {
      if (line.inventoryItemId) inventoryItemIds.push(line.inventoryItemId);
      if (line.subRecipeId) subRecipeIds.push(line.subRecipeId);
      if (line.childMenuItemId) menuItemIds.push(line.childMenuItemId);
      if (line.unitOfMeasureId) uomIds.push(line.unitOfMeasureId);
    });
    
    // Create observables for fetching data
    const requests: Observable<boolean>[] = [];
    
    // Fetch inventory items
    if (inventoryItemIds.length > 0) {
      requests.push(this.fetchInventoryItems(inventoryItemIds));
    }
    
    // Fetch sub-recipes
    if (subRecipeIds.length > 0) {
      requests.push(this.fetchSubRecipes(subRecipeIds));
    }
    
    // Fetch menu items
    if (menuItemIds.length > 0) {
      requests.push(this.fetchMenuItems(menuItemIds));
    }
    
    // Execute requests in parallel
    if (requests.length > 0) {
      forkJoin(requests).subscribe({
        next: () => {
          // Now enhance the lines with names
          this.enhanceMenuItemLines();
        },
        error: (err) => {
          console.error('Error loading related data:', err);
        }
      });
    }
  }
  
  private fetchInventoryItems(ids: number[]): Observable<boolean> {
    // In a real app, you might want to make a batch request
    // For now, we'll fetch items one by one
    const requests = ids.map(id => this.inventoryItemsService.getInventoryItemById(id));
    
    return forkJoin(requests).pipe(
      switchMap((items: InventoryItem[]) => {
        items.forEach((item: InventoryItem) => {
          if (item && item.id) {
            this.inventoryItems.set(item.id, item);
          }
        });
        return of(true);
      })
    );
  }
  
  private fetchSubRecipes(ids: number[]): Observable<boolean> {
    const requests = ids.map(id => this.subRecipeService.getSubRecipeById(id));
    
    return forkJoin(requests).pipe(
      switchMap((subRecipes: SubRecipe[]) => {
        subRecipes.forEach((subRecipe: SubRecipe) => {
          if (subRecipe && subRecipe.id) {
            this.subRecipes.set(subRecipe.id, subRecipe);
          }
        });
        return of(true);
      })
    );
  }
  
  private fetchMenuItems(ids: number[]): Observable<boolean> {
    const requests = ids.map(id => this.menuItemsService.getMenuItemById(id));
    
    return forkJoin(requests).pipe(
      switchMap((menuItems: MenuItem[]) => {
        menuItems.forEach((menuItem: MenuItem) => {
          if (menuItem && menuItem.id) {
            this.menuItems.set(menuItem.id, menuItem);
          }
        });
        return of(true);
      })
    );
  }
  
  private loadUoms(): void {
    this.uomService.getAllUoms().subscribe({
      next: (uoms) => {
        uoms.forEach(uom => {
          if (uom.id) {
            this.uoms.set(uom.id, uom);
          }
        });
      },
      error: (err) => console.error('Error loading UOMs:', err)
    });
  }
  
  private enhanceMenuItemLines(): void {
    if (!this.menuItem?.menuItemLines) return;
    
    this.menuItem.menuItemLines = this.menuItem.menuItemLines.map(line => {
      const enhancedLine = { ...line };
      
      // Add inventory item name
      if (line.inventoryItemId && this.inventoryItems.has(line.inventoryItemId)) {
        const item = this.inventoryItems.get(line.inventoryItemId);
        enhancedLine.inventoryItemName = item?.name;
      }
      
      // Add sub-recipe name
      if (line.subRecipeId && this.subRecipes.has(line.subRecipeId)) {
        const subRecipe = this.subRecipes.get(line.subRecipeId);
        enhancedLine.subRecipeName = subRecipe?.name;
      }
      
      // Add menu item name
      if (line.childMenuItemId && this.menuItems.has(line.childMenuItemId)) {
        const menuItem = this.menuItems.get(line.childMenuItemId);
        enhancedLine.childMenuItemName = menuItem?.name;
      }
      
      // Add UOM information
      if (line.unitOfMeasureId && this.uoms.has(line.unitOfMeasureId)) {
        const uom = this.uoms.get(line.unitOfMeasureId);
        enhancedLine.uomName = uom?.name;
        enhancedLine.uomAbbreviation = uom?.abbreviation;
      }
      
      return enhancedLine;
    });
  }
}
