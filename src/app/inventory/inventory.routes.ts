import { Routes } from '@angular/router';
import { InventoryItemsComponent } from './inventory-items/inventory-items.component';
import { AllergenComponent } from './allergen/allergen.component';
import { locationRoutes } from './location/location.routes';
import { subRecipeRoutes } from './sub-recipe/sub-recipe.routes';
import { purchaseOptionRoutes } from './purchase-option/purchase-option.routes';
import { ASSORTMENT_ROUTES } from './assortments/assortments.routes';

export const INVENTORY_ROUTES: Routes = [
  {
    path: 'inventory-items',
    component: InventoryItemsComponent,
  },
  {
    path: 'allergens',
    component: AllergenComponent,
  },
  {
    path: 'locations',
    children: locationRoutes,
  },
  {
    path: 'sub-recipes',
    children: subRecipeRoutes,
  },
  {
    path: 'purchase-options',
    children: purchaseOptionRoutes,
  },
  {
    path: 'assortments',
    children: ASSORTMENT_ROUTES,
  },
];
