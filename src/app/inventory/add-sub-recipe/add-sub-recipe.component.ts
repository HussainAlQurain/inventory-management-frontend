import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { SubRecipe, SubRecipeLine, SubRecipeType } from '../../models/SubRecipe';
import { Category } from '../../models/Category';
import { UnitOfMeasure } from '../../models/UnitOfMeasure';
import { InventoryItem } from '../../models/InventoryItem';

import { SubRecipeService } from '../../services/sub-recipe.service';
import { CategoriesService } from '../../services/categories.service';
import { UomService } from '../../services/uom.service';
import { InventoryItemsService } from '../../services/inventory-items-service.service';
import { CompaniesService } from '../../services/companies.service';

import { UomDialogComponent } from '../uom-dialog/uom-dialog.component';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { SubRecipeLineItemComponent } from '../../components/sub-recipe-line-item/sub-recipe-line-item.component';

@Component({
  selector: 'app-add-sub-recipe',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatAutocompleteModule,
    MatDividerModule,
    MatTabsModule,
    MatCheckboxModule,
    MatSelectModule,
    MatTooltipModule,
    MatTableModule,
    SubRecipeLineItemComponent
  ],
  templateUrl: './add-sub-recipe.component.html',
  styleUrls: ['./add-sub-recipe.component.scss']
})
export class AddSubRecipeComponent implements OnInit {
  @Output() closePanel = new EventEmitter<SubRecipe | null>();
  
  // Form for the sub-recipe
  subRecipeForm: FormGroup;
  
  // Category selection
  categoryCtrl = new FormControl<string>('', { nonNullable: true });
  filteredCategories: Category[] = [];
  canCreateNewCategory = false;
  
  // UOM selection
  uomCtrl = new FormControl<string>('', { nonNullable: true });
  filteredUoms: UnitOfMeasure[] = [];
  allUoms: UnitOfMeasure[] = [];
  
  // Recipe lines (ingredients)
  recipeLines: SubRecipeLine[] = [];
  
  // Loading states
  isSubmitting = false;
  isEditingLine = false;
  currentLine: SubRecipeLine | undefined = undefined;
  
  // Available recipe types
  recipeTypes: {value: SubRecipeType, label: string}[] = [
    { value: 'PREPARATION', label: 'Preparation' },
    { value: 'SUB_RECIPE', label: 'Sub-Recipe' }
  ];
  
  // Display columns for the lines table
  displayedColumns: string[] = [
    'item', 'type', 'netQuantity', 'wastage', 'grossQuantity', 'uom', 'cost', 'actions'
  ];

  // Cost tracking
  totalCost = 0;
  
  constructor(
    private fb: FormBuilder,
    private subRecipeService: SubRecipeService,
    private categoriesService: CategoriesService,
    private uomService: UomService,
    private inventoryItemsService: InventoryItemsService,
    private companiesService: CompaniesService,
    private dialog: MatDialog
  ) {
    // Initialize the recipe form
    this.subRecipeForm = this.fb.group({
      name: ['', Validators.required],
      type: ['PREPARATION', Validators.required],
      categoryId: [null, Validators.required],
      uomId: [null, Validators.required],
      yieldQty: [1, [Validators.required, Validators.min(0.001)]],
      photoUrl: [''],
      prepTimeMinutes: [0, Validators.min(0)],
      cookTimeMinutes: [0, Validators.min(0)],
      instructions: [''],
      cost: [{ value: 0, disabled: true }]
    });
  }

  ngOnInit(): void {
    // Setup category autocomplete
    this.setupCategoryAutocomplete();
    
    // Setup UOM autocomplete
    this.setupUomAutocomplete();
    
    // Watch for changes to prep time and cook time to calculate total time
    this.subRecipeForm.get('prepTimeMinutes')?.valueChanges.subscribe(() => {
      this.updateTotalTime();
    });
    
    this.subRecipeForm.get('cookTimeMinutes')?.valueChanges.subscribe(() => {
      this.updateTotalTime();
    });
    
    // Watch for changes to yield quantity to recalculate costs
    this.subRecipeForm.get('yieldQty')?.valueChanges.subscribe(() => {
      this.updateCosts();
    });
  }
  
  private setupCategoryAutocomplete(): void {
    this.categoryCtrl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => this.onCategorySearchChange(term))
    ).subscribe();
  }
  
  private onCategorySearchChange(term: string): Observable<void> {
    if (!term) term = '';
    return this.categoriesService.getAllCategories(term).pipe(
      switchMap((cats: Category[]) => {
        this.filteredCategories = cats;
        const exactMatch = cats.some(c => c.name.toLowerCase() === term.toLowerCase());
        this.canCreateNewCategory = term.length > 0 && !exactMatch;
        return of();
      })
    );
  }
  
  onCategorySelected(value: string): void {
    const category = this.filteredCategories.find(c => c.name === value);
    if (category) {
      this.subRecipeForm.get('categoryId')?.setValue(category.id);
    }
  }
  
  onCategoryOptionSelected(fullValue: string): void {
    // Check if selected an existing category
    const existing = this.filteredCategories.find(c => c.name === fullValue);
    if (existing) {
      this.subRecipeForm.get('categoryId')?.setValue(existing.id);
      return;
    }
    
    // Otherwise, create a new category
    this.createNewCategory(fullValue);
  }
  
  private createNewCategory(name: string): void {
    const newCat: Partial<Category> = { name };
    this.categoriesService.createCategory(newCat).subscribe({
      next: (created) => {
        this.subRecipeForm.get('categoryId')?.setValue(created.id);
        this.categoryCtrl.setValue(created.name);
        this.filteredCategories.push(created);
        this.canCreateNewCategory = false;
      },
      error: (err) => console.error('Error creating category:', err)
    });
  }
  
  private setupUomAutocomplete(): void {
    // Load all UOMs
    this.uomService.getAllUoms().subscribe({
      next: (uoms) => {
        this.allUoms = uoms;
        this.filteredUoms = uoms;
      },
      error: (err) => console.error('Error loading UOMs:', err)
    });
    
    // Filter UOMs based on input
    this.uomCtrl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe({
      next: (term) => {
        if (!term) {
          this.filteredUoms = this.allUoms;
          return;
        }
        
        const lowerTerm = term.toLowerCase();
        this.filteredUoms = this.allUoms.filter(uom => 
          uom.name.toLowerCase().includes(lowerTerm) ||
          (uom.abbreviation && uom.abbreviation.toLowerCase().includes(lowerTerm))
        );
      },
      error: (err) => console.error('Error filtering UOMs:', err)
    });
  }
  
  onUomSelected(selectedName: string): void {
    if (!selectedName) return;
    
    const found = this.allUoms.find(uom => 
      uom.name && uom.name.toLowerCase() === selectedName.toLowerCase()
    );
    
    if (found) {
      this.subRecipeForm.get('uomId')?.setValue(found.id);
    }
  }
  
  openNewUomDialog(): void {
    const dialogRef = this.dialog.open(UomDialogComponent, {
      width: '400px'
    });
    
    dialogRef.afterClosed().subscribe((newUom: UnitOfMeasure) => {
      if (newUom) {
        this.allUoms.push(newUom);
        this.filteredUoms = [...this.allUoms];
        this.uomCtrl.setValue(newUom.name);
        this.subRecipeForm.get('uomId')?.setValue(newUom.id);
      }
    });
  }
  
  // Line management methods
  addNewLine(): void {
    this.isEditingLine = true;
    this.currentLine = undefined;
  }
  
  editLine(line: SubRecipeLine): void {
    this.isEditingLine = true;
    this.currentLine = { ...line }; // Clone to avoid direct mutation
  }
  
  saveLine(line: SubRecipeLine): void {
    // Check if we're editing an existing line
    const existingIndex = this.recipeLines.findIndex(l => l === this.currentLine);
    
    // Create a copy of the line to avoid reference issues
    const lineToSave = { ...line };
    
    // Ensure the line has either inventoryItemId or childSubRecipeId
    if (!lineToSave.inventoryItemId && !lineToSave.childSubRecipeId) {
      alert('Please select an inventory item or sub-recipe');
      return;
    }
    
    if (existingIndex !== -1) {
      // Update existing line
      this.recipeLines[existingIndex] = lineToSave;
    } else {
      // Add new line
      this.recipeLines.push(lineToSave);
    }
    
    this.isEditingLine = false;
    this.currentLine = undefined;
    
    // Update costs
    this.updateCosts();
    
    console.log('Recipe lines:', this.recipeLines);
  }
  
  cancelLineEdit(): void {
    this.isEditingLine = false;
    this.currentLine = undefined;
  }
  
  deleteLine(index: number): void {
    this.recipeLines.splice(index, 1);
    this.updateCosts();
  }
  
  // Calculate gross quantity (quantity + wastage)
  calculateGrossQuantity(line: SubRecipeLine): number {
    return line.quantity * (1 + (line.wastagePercent || 0) / 100);
  }
  
  // Calculate total time from prep time and cook time
  updateTotalTime(): number {
    const prepTime = this.subRecipeForm.get('prepTimeMinutes')?.value || 0;
    const cookTime = this.subRecipeForm.get('cookTimeMinutes')?.value || 0;
    return prepTime + cookTime;
  }
  
  // Update costs when lines or yield changes
  updateCosts(): void {
    // Calculate total cost from all lines
    this.totalCost = this.recipeLines.reduce((sum, line) => {
      return sum + (line.lineCost || 0);
    }, 0);
    
    // Update form
    this.subRecipeForm.get('cost')?.setValue(this.totalCost);
  }
  
  // Get cost per unit (total cost divided by yield quantity)
  getCostPerUnit(): number {
    const yieldQty = this.subRecipeForm.get('yieldQty')?.value || 1;
    if (yieldQty <= 0) return 0;
    return this.totalCost / yieldQty;
  }
  
  // Get UOM info for display
  getUomInfo(uomId: number | undefined): string {
    if (!uomId) return 'N/A';
    const uom = this.allUoms.find(u => u.id === uomId);
    return uom ? `${uom.name} (${uom.abbreviation})` : 'Unknown';
  }
  
  // Form submission
  submitForm(): void {
    if (!this.subRecipeForm.valid) {
      alert('Please fill out all required fields');
      return;
    }
    
    if (this.recipeLines.length === 0) {
      alert('Please add at least one ingredient line');
      return;
    }
    
    this.isSubmitting = true;
    
    // Build the request object
    const subRecipeData: SubRecipe = {
      ...this.subRecipeForm.getRawValue(),
      cost: this.totalCost,
      lines: this.recipeLines.map(line => ({
        inventoryItemId: line.inventoryItemId,
        childSubRecipeId: line.childSubRecipeId,
        quantity: line.quantity,
        wastagePercent: line.wastagePercent || 0,
        unitOfMeasureId: line.unitOfMeasureId,
        lineCost: line.lineCost || 0
      }))
    };
    
    console.log('Submitting sub-recipe data:', subRecipeData);
    
    this.subRecipeService.createSubRecipe(subRecipeData).subscribe({
      next: (createdSubRecipe) => {
        this.isSubmitting = false;
        this.closePanel.emit(createdSubRecipe);
      },
      error: (error) => {
        this.isSubmitting = false;
        console.error('Error creating sub-recipe:', error);
        alert('Error creating sub-recipe. Please try again.');
      }
    });
  }
  
  cancel(): void {
    this.closePanel.emit(null);
  }
}
