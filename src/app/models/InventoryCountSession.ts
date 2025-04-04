export interface InventoryCountSession {
  id: number;
  countDate: string;
  dayPart: string;
  locationName: string;
  valueOfCount: number;
  description: string;
  locked?: boolean;
}
