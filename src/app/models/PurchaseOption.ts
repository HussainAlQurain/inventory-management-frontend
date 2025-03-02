import { Supplier } from "./Supplier";
import { UnitOfMeasure } from "./UnitOfMeasure";

export interface PurchaseOption {
    id: number;
    price: number;
    taxRate: number;
    innerPackQuantity: number;
    packsPerCase: number;
    minOrderQuantity: number;
    mainPurchaseOption: boolean;
    orderingEnabled: boolean;
    supplierProductCode: string;
    nickname: string;
    scanBarcode: string;
    supplierId: number | null;
    supplierName: string | null;
    orderingUom: UnitOfMeasure;
    supplier: Supplier;
    orderingUomId: number | null;
    orderingUomName: string | null;
    orderingUomAbbreviation: string | null;
  }