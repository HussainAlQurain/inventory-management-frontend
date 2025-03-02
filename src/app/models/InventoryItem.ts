import { Category } from "./Category";
import { PurchaseOption } from "./PurchaseOption";
import { UnitOfMeasure } from "./UnitOfMeasure";

export interface InventoryItem {
    id: number;
    name: string;
    sku: string;
    productCode: string;
    description: string;
    currentPrice: number;
    calories: number;
    category: Category;
    inventoryUom: UnitOfMeasure;
    purchaseOptions: PurchaseOption[];
    minOnHand?: number;
    par?: number;
    lastCount?: Date;
    onHand?: number;
    onHandValue?: number;
  }