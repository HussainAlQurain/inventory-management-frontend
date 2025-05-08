export interface SubRecipeListDTO {
    id: number;
    name: string;
    type: string;
    categoryId: number;
    categoryName: string;
    uomId: number;
    uomName: string;
    uomAbbreviation: string;
    yieldQty: number;
    cost: number;
  }