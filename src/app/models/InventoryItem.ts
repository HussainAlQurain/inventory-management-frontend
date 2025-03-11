import { Category } from "./Category";
import { PurchaseOption } from "./PurchaseOption";
import { UnitOfMeasure } from "./UnitOfMeasure";
import { Location } from './Location';
import { Supplier } from './Supplier';

export interface InventoryItem {
  id?: number;
  name: string;
  sku?: string;
  productCode?: string;
  description?: string;
  currentPrice?: number;
  calories?: number;
  category?: Category;
  inventoryUom?: UnitOfMeasure;
  purchaseOptions?: PurchaseOption[];
}

export interface InventoryItemLocation {
  id?: number;
  inventoryItemId: number;
  locationId: number;
  location?: Location;
  minOnHand?: number;
  parLevel?: number;
  onHand?: number;
  lastCount?: number;
  lastCountDate?: Date;
}