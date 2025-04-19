import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
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
import { Observable, of, startWith, map, forkJoin } from 'rxjs';
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
    MatSnackBarModule
  ],
  templateUrl: './transfer-create.component.html',
  styleUrls: ['./transfer-create.component.scss']
})
export class TransferCreateComponent implements OnInit {
  transferForm: FormGroup;
  loading = false;
  submitting = false;
  error = '';
  
  locations: Location[] = [];
  inventoryItems: InventoryItem[] = [];
  subRecipes: SubRecipe[] = [];
  unitOfMeasures: UnitOfMeasure[] = [];
  
  filteredItems: ItemOption[] = [];

  constructor(
    private fb: FormBuilder,
    private transferService: TransferService,
    private locationService: LocationService,
    private inventoryItemsService: InventoryItemsService,
    private subRecipeService: SubRecipeService,
    private uomService: UomService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    this.transferForm = this.fb.group({
      fromLocationId: ['', [Validators.required]],
      toLocationId: ['', [Validators.required]],
      lines: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.loading = true;
    
    // Load all necessary data
    forkJoin({
      locations: this.locationService.getAllLocations(),
      inventoryItems: this.inventoryItemsService.getInventoryItemsByCompany(),
      subRecipes: this.subRecipeService.getSubRecipes(),
      uoms: this.uomService.getAllUoms()
    }).subscribe({
      next: (results) => {
        this.locations = results.locations;
        this.inventoryItems = results.inventoryItems;
        this.subRecipes = results.subRecipes.filter(sr => sr.type === 'PREPARATION'); // Only prep type
        this.unitOfMeasures = results.uoms;
        
        // Update filtered items
        this.updateFilteredItems();
        
        // Add initial line
        this.addLine();
        
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load data:', err);
        this.error = 'Failed to load data. Please try again later.';
        this.loading = false;
      }
    });

    // Listen for location changes to update filtered items
    this.transferForm.get('fromLocationId')?.valueChanges.subscribe(() => {
      this.updateFilteredItems();
    });
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

  // Update filtered items based on selected fromLocation
  updateFilteredItems() {
    const fromLocationId = this.transferForm.get('fromLocationId')?.value;
    if (!fromLocationId) {
      this.filteredItems = [];
      return;
    }

    // Here we would ideally filter items by what's available at the location
    // For simplicity, we're just showing all items
    const inventoryOptions: ItemOption[] = this.inventoryItems.map(item => ({
      id: item.id!,
      name: item.name,
      type: 'inventory' as const,
      uoms: item.inventoryUom ? [item.inventoryUom] : []
    }));

    const subRecipeOptions: ItemOption[] = this.subRecipes.map(recipe => ({
      id: recipe.id!,
      name: recipe.name,
      type: 'subrecipe' as const,
      uoms: [] // We'd need proper UOM data for sub-recipes here
    }));

    this.filteredItems = [...inventoryOptions, ...subRecipeOptions];
  }

  // Get UOMs for a selected item
  getItemUoms(itemId: number, itemType: string): UnitOfMeasure[] {
    if (itemType === 'inventory') {
      const item = this.inventoryItems.find(i => i.id === itemId);
      return item?.inventoryUom ? [item.inventoryUom] : this.unitOfMeasures;
    } else if (itemType === 'subrecipe') {
      const recipe = this.subRecipes.find(r => r.id === itemId);
      // For sub-recipes, we'd need to return the appropriate UOMs
      // For now, we'll just return all UOMs
      return this.unitOfMeasures;
    }
    return [];
  }

  // When an item type is selected, reset the item and UOM
  onItemTypeChange(index: number) {
    const lineForm = this.lines.at(index) as FormGroup;
    lineForm.patchValue({
      itemId: '',
      unitOfMeasureId: ''
    });
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