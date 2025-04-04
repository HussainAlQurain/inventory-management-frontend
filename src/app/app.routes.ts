import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { InventoryItemsComponent } from './inventory/inventory-items/inventory-items.component';
import { SubRecipeDetailComponent } from './inventory/sub-recipe-detail/sub-recipe-detail.component';
import { MenuItemsComponent } from './inventory/menu-items/menu-items.component';
import { AssortmentsComponent } from './inventory/assortments/assortments.component';
import { InventoryCountsComponent } from './inventory/inventory-counts/inventory-counts.component';

export const routes: Routes = [
    { path: '', component: HomeComponent,
        children: [
            { path: 'inventory/inventory-items', component: InventoryItemsComponent },
            { path: 'inventory/sub-recipes', component: SubRecipeDetailComponent },
            { path: 'inventory/menu-items', component: MenuItemsComponent },
            { path: 'inventory/assortments', component: AssortmentsComponent },
            { path: 'inventory/counts', component: InventoryCountsComponent },
            // Add other routes as children here
            { path: '', redirectTo: 'inventory/inventory-items', pathMatch: 'full' },
        ]
    },
    
];
