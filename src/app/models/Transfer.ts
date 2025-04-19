export interface TransferLine {
  id?: number;
  inventoryItemId?: number;
  subRecipeId?: number;
  itemName?: string;
  quantity: number;
  unitOfMeasureId: number;
  uomName?: string;
  costPerUnit?: number;
  totalCost?: number;
}

export interface Transfer {
  id?: number;
  creationDate?: string;
  completionDate?: string;
  status?: string;
  fromLocationId: number;
  fromLocationName?: string;
  toLocationId: number;
  toLocationName?: string;
  lines: TransferLine[];
}

export interface TransferRequest {
  fromLocationId: number;
  toLocationId: number;
  lines: TransferLine[];
}