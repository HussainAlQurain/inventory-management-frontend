import { Category } from './Category';

export interface MenuItem {
  id?: number;
  name: string;
  posCode?: string;
  cost?: number;
  retailPriceExclTax?: number;
  foodCostPercentage?: number;
  maxAllowedFoodCostPct?: number;
  modifierGroups?: string;
  category?: Category;
  categoryId?: number;
  menuItemLines?: MenuItemLine[];
  
  // UI helper properties
  categoryName?: string;
}

export interface MenuItemLine {
  id?: number;
  inventoryItemId?: number;
  inventoryItemName?: string;
  subRecipeId?: number;
  subRecipeName?: string;
  childMenuItem?: number;
  childMenuItemName?: string;
  quantity: number;
  wastagePercent?: number;
  unitOfMeasureId: number;
  uomName?: string;
  uomAbbreviation?: string;
  lineCost?: number;
}
