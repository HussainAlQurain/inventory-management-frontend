/**
 * Lightweight DTO for displaying inventory items in list views
 * Corresponds to the backend InventoryItemListDTO
 */
export interface InventoryItemListDTO {
    id: number;
    name: string;
    sku: string | null;
    productCode: string;
    currentPrice: number | null;
    
    // Category info
    categoryId: number | null;
    categoryName: string | null;
    
    // UOM info
    inventoryUomId: number | null;
    inventoryUomAbbreviation: string | null;
    
    // Main purchase option info (flattened)
    mainSupplierId: number | null;
    mainSupplierName: string | null;
    orderingEnabled: boolean | null;
    taxRate: number | null;
    
    // Stock info
    onHand: number;
    onHandValue: number;
  }