export interface InventoryCountSession {
  id: number;
  countDate: string;
  dayPart: string;
  locationName: string;
  valueOfCount: number;
  description: string;
  locked?: boolean;
  lockedDate?: string;
  locationId?: number;
  lines?: InventoryCountLine[];
}

export interface InventoryCountLine {
  id?: number;
  inventoryItemId?: number;
  subRecipeId?: number;
  storageAreaId?: number;
  countedQuantity: number;
  countUomId: number;
  convertedQuantityInBaseUom: number;
  lineTotalValue: number;
  itemName?: string; // Added for UI display purposes
  uomName?: string; // Added for UI display purposes
}

export type DayPart = 'Day Start' | 'Day End';
