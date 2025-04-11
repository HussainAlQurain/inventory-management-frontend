export interface AutoOrderSettings {
  locationId: number;
  enabled: boolean;
  frequencySeconds: number;
  systemUserId?: number; // Not editable by users
  autoOrderComment: string;
}