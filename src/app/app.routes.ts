import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { InventoryItemsComponent } from './inventory/inventory-items/inventory-items.component';
import { SubRecipeDetailComponent } from './inventory/sub-recipe-detail/sub-recipe-detail.component';
import { MenuItemsComponent } from './inventory/menu-items/menu-items.component';
import { AssortmentsComponent } from './inventory/assortments/assortments.component';
import { InventoryCountsComponent } from './inventory/inventory-counts/inventory-counts.component';
import { InventoryCountEditorComponent } from './inventory/inventory-counts/inventory-count-editor/inventory-count-editor.component';
import { OrdersComponent } from './orders/orders.component';
import { OrderDetailsComponent } from './orders/order-details/order-details.component';
import { OrderCreateComponent } from './orders/order-create/order-create.component';
import { BuyersComponent } from './settings/buyers/buyers.component';
import { CompanyComponent } from './settings/company/company.component';
import { TransfersComponent } from './transfers/transfers.component';
import { TransferCreateComponent } from './transfers/transfer-create/transfer-create.component';

export const routes: Routes = [
    { path: '', component: HomeComponent,
        children: [
            { path: 'inventory/inventory-items', component: InventoryItemsComponent },
            { path: 'inventory/sub-recipes', component: SubRecipeDetailComponent },
            { path: 'inventory/menu-items', component: MenuItemsComponent },
            { path: 'inventory/assortments', component: AssortmentsComponent },
            { path: 'inventory/counts', component: InventoryCountsComponent },
            { path: 'inventory/counts/edit/:locationId/:sessionId', component: InventoryCountEditorComponent },
            { path: 'orders', component: OrdersComponent },
            { path: 'orders/create', component: OrderCreateComponent },
            { path: 'orders/:id', component: OrderDetailsComponent },
            { path: 'settings/buyers', component: BuyersComponent },
            { path: 'settings/company', component: CompanyComponent },
            { path: 'transfers', component: TransfersComponent },
            { path: 'transfers/create', component: TransferCreateComponent },
            // Add other routes as children here
            { path: '', redirectTo: 'inventory/inventory-items', pathMatch: 'full' },
        ]
    },
    
];
