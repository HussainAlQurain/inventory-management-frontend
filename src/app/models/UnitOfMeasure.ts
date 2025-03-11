import { Category } from "./Category";

export interface UnitOfMeasure {
  id?: number;
  name: string;
  abbreviation?: string;
  categoryId?: number;
  conversionFactor: number;
  category?: UnitOfMeasureCategory;
}

export interface UnitOfMeasureCategory {
  id?: number;
  name: string;
}