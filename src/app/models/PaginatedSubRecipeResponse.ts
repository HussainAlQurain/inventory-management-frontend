import { SubRecipeListDTO } from "./SubRecipeListDTO";

export interface PaginatedSubRecipeResponse {
    items: SubRecipeListDTO[];
    currentPage: number;
    totalItems: number;
    totalPages: number;
  }