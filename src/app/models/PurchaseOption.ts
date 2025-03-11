import { Supplier } from './Supplier';
import { UnitOfMeasure } from './UnitOfMeasure';

export interface PurchaseOption {
    id?: number;
    inventoryItemId?: number;
    supplier?: Supplier;
    supplierId?: number;
    price?: number;
    taxRate?: number;
    orderingUom?: UnitOfMeasure;
    orderingUomId?: number;
    innerPackQuantity?: number;
    packsPerCase?: number;
    minOrderQuantity?: number;
    mainPurchaseOption: boolean;
    orderingEnabled: boolean;
    supplierProductCode?: string;
    nickname?: string;
    scanBarcode?: string;
    productName?: string;
    productCode?: string;
    priceChanges?: PriceChange[];
}

export interface PriceChange {
    id: number;
    purchaseOptionId: number;
    oldPrice: number;
    newPrice: number;
    changeDate: Date;
}