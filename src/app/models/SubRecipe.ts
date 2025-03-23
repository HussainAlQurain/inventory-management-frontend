export type SubRecipeType = 'PREPARATION' | 'SUB_RECIPE';

export interface SubRecipe {
  id?: number;
  name: string;
  type: SubRecipeType;
  categoryId: number;
  uomId: number;
  yieldQty: number;
  photoUrl?: string;
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
  instructions?: string;
  cost: number;
  lines?: SubRecipeLine[];
}

export interface SubRecipeLine {
  id?: number;
  inventoryItemId?: number;
  childSubRecipeId?: number;
  quantity: number;
  wastagePercent: number;
  unitOfMeasureId: number;
  lineCost: number;
  
  // Extended properties for UI
  inventoryItemName?: string;
  childSubRecipeName?: string;
  uomName?: string;
  uomAbbreviation?: string;
}

// Legacy interfaces - keeping for backward compatibility
export interface SubRecipeItem {
  id?: number;
  inventoryItemId: number;
  quantity: number;
  wastagePercent?: number;
  unitOfMeasureId: number;
  cost?: number;
  
  // Extended properties
  inventoryItemName?: string;
  uomName?: string;
  uomAbbreviation?: string;
}

export interface SubRecipeComponent {
  id?: number;
  subRecipeId: number;
  quantity: number;
  wastagePercent?: number;
  unitOfMeasureId: number;
  cost?: number;
  
  // Extended properties
  subRecipeName?: string;
  uomName?: string;
  uomAbbreviation?: string;
}
