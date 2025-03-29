export interface LocationInventory {
  id?: number;
  inventoryItemId: number;
  locationId: number;
  location?: { id: number; name: string };
  minOnHand?: number;
  parLevel?: number;
  onHand?: number;
  lastCount?: number;
  lastCountDate?: Date;
  quantity?: number;
  value?: number;
}
  