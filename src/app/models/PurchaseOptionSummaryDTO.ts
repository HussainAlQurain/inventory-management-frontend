export interface PurchaseOptionSummaryDTO {
    purchaseOptionId: number;
    inventoryItemName: string;
    purchaseOptionNickname: string | null;
    orderingUomName: string;
    price: number;
    categoryName: string | null;
    supplierName: string;
}
