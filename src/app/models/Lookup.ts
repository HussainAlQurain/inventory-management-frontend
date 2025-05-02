/**
 * Lightweight interface for lookup/dropdown items
 * Used when we need to reference an entity with just its ID and name
 */
export interface Lookup {
    id: number;
    name: string;
    code?: string;  // Optional code field for items that have SKU/product codes
}