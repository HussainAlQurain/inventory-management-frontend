import { Category } from './Category';
import { MenuItemLine } from './MenuItemLine';

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
