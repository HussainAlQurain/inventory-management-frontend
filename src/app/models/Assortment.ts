export interface Assortment {
  id?: number;
  name: string;
  companyId?: number;
  itemIds?: number[];
  subRecipeIds?: number[];
  locationIds?: number[];
  purchaseOptionIds?: number[];
}

export interface BulkIdRequest {
  ids: number[];
}
