import { Component } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule, MatNavList } from '@angular/material/list';
import { MatExpansionModule } from '@angular/material/expansion';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';

@Component({
  selector: 'app-sidenav-bar',
  standalone: true,
  imports: [MatSidenavModule, MatToolbarModule, MatListModule, MatExpansionModule, RouterLink, RouterLinkActive, MatIconModule, MatButtonModule],
  templateUrl: './sidenav-bar.component.html',
  styleUrl: './sidenav-bar.component.scss'
})
export class SidenavBarComponent {
  expandedIndex = -1; // To track which menu is expanded

  menus = [
    {
      id: 0,
      title: 'Orders',
      icon: 'shopping_cart',
      submenus: [
        { id: 0, title: 'Orders List', route: '/orders' },
        { id: 1, title: 'Pending Approval', route: '/orders/pending' },
      ],
    },
    {
      id: 1,
      title: 'Inventory',
      icon: 'store',
      submenus: [
        { id: 0, title: 'Inventory items', route: '/inventory/inventory-items' },
        { id: 1, title: 'Assortments', route: '/inventory/assortments' },
        { id: 2, title: 'Allergens', route: '/inventory/allergens' },
        { id: 3, title: 'Sub-recipes / Preparations', route: '/inventory/sub-recipes' },
        { id: 4, title: 'Menu Items', route: '/inventory/menu-items' },
        { id: 5, title: 'Inventory counts', route: '/inventory/counts' },
        { id: 6, title: 'Sales summary', route: '/inventory/sales-summary' },
        { id: 7, title: 'Actual vs. Theoretical', route: '/inventory/actual-vs-theoretical' },
        { id: 8, title: 'Menu Profitability', route: '/inventory/menu-profitability' },
        { id: 9, title: 'Inventory count values', route: '/inventory/count-values' },
      ],
    },
    {
      id: 2,
      title: 'Suppliers',
      icon: 'local_shipping',
      submenus: [
        { id: 0, title: 'Suppliers', route: '/suppliers/list' },
        { id: 1, title: 'Prices', route: '/suppliers/prices' },
        { id: 2, title: 'Categories', route: '/suppliers/categories' },
      ],
    },
    {
      id: 3,
      title: 'Accounting',
      icon: 'account_balance_wallet',
      submenus: [
        { id: 0, title: 'Invoices / Delivery Notes', route: '/accounting/invoices' },
        { id: 1, title: 'Scanned Invoices', route: '/accounting/scanned-invoices' },
        { id: 2, title: 'Credit reminders', route: '/accounting/credit-reminders' },
        { id: 3, title: 'Irregular prices', route: '/accounting/irregular-prices' },
      ],
    },
    {
      id: 4,
      title: 'Reports',
      icon: 'assessment',
      submenus: [
        { id: 0, title: 'COGS and Gross Profits', route: '/reports/cogs-profit' },
        { id: 1, title: 'COGS Over Time', route: '/reports/cogs-overtime' },
        { id: 2, title: 'Price report', route: '/reports/price-report' },
        { id: 3, title: 'Ordering', route: '/reports/ordering' },
        { id: 4, title: 'Spend by product', route: '/reports/spend-by-product' },
        { id: 5, title: 'Purchase by items', route: '/reports/purchase-by-items' },
        { id: 6, title: 'Purchases by supplier', route: '/reports/purchases-by-supplier' },
        { id: 7, title: 'Supplier by week', route: '/reports/supplier-by-week' },
        { id: 8, title: 'Store summary', route: '/reports/store-summary' },
        { id: 9, title: 'Open orders', route: '/reports/open-orders' },
        { id: 10, title: 'Transfers', route: '/reports/transfers' },
        { id: 11, title: 'Production events', route: '/reports/production-events' },
        { id: 12, title: 'Waste report', route: '/reports/waste-report' },
        { id: 13, title: 'Dashboard', route: '/reports/dashboard' },
      ],
    },
    {
      id: 5,
      title: 'Settings',
      icon: 'settings',
      submenus: [
        { id: 0, title: 'Company', route: '/settings/company' },
        { id: 1, title: 'Manage Users', route: '/settings/users-management' },
        { id: 2, title: 'Regional managers', route: '/settings/regional-managers' },
        { id: 3, title: 'Buyers', route: '/settings/buyers' },
        { id: 4, title: 'User details', route: '/settings/user-details' },
        { id: 5, title: 'Daily email', route: '/settings/daily-email' },
        { id: 6, title: 'Switch user', route: '/settings/switch-user' },
        { id: 7, title: 'Activity log', route: '/settings/activity-logs' },
        { id: 8, title: 'User settings', route: '/settings/user-settings' },
        { id: 9, title: 'Logout', route: '/settings/logout' },
      ],
    },
  ];


  setExpandedIndex(index: number): void {
    this.expandedIndex = index;
  }

  clearExpandedIndex(index: number): void {
    if (this.expandedIndex === index) {
      this.expandedIndex = -1;
    }
  }
}
