import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { InventoryItemsComponent } from './inventory/inventory-items/inventory-items.component';

export const routes: Routes = [
    { path: '', component: HomeComponent,
        children: [
            { path: 'inventory/inventory-items', component: InventoryItemsComponent },
            // Add other routes as children here
            { path: '', redirectTo: 'inventory/inventory-items', pathMatch: 'full' }
        ]
    },
    
];
