import { Category } from "./Category";

export interface UnitOfMeasure {
    id: number;
    name: string;
    abbreviation: string;
    conversionFactor: number;
    category: Category;
  }