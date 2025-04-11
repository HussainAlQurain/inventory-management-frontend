// filepath: /home/rayleigh/Desktop/projects/inventory-management-frontend/src/app/models/IntegrationSettings.ts
export interface IntegrationSettings {
  locationId: number;
  posApiUrl: string;
  frequentSyncSeconds: number;
  frequentSyncEnabled: boolean;
  dailySyncEnabled: boolean;
}