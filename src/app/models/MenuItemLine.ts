export interface MenuItemLine {
  id?: number;
  inventoryItemId?: number;
  subRecipeId?: number;
  childMenuItemId?: number;
  quantity: number;
  wastagePercent?: number;
  unitOfMeasureId: number;
  lineCost?: number;
  
  // UI display fields (not sent to backend)
  inventoryItemName?: string;
  subRecipeName?: string;
  childMenuItemName?: string;
  uomName?: string;
  uomAbbreviation?: string;
}
