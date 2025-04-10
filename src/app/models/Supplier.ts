import { Category } from './Category';

export interface Supplier {
  id?: number;
  name: string;
  customerNumber?: string;
  minimumOrder?: number;
  taxId?: string;
  taxRate?: number;
  paymentTerms?: string;
  comments?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  ccEmails?: string;
  emails?: SupplierEmail[];
  phones?: SupplierPhone[];
  defaultCategoryId?: number;
  defaultCategory?: Category; // Add this property for the category object
  authorizedBuyerIds?: number[];
}

export interface SupplierEmail {
  id?: number;
  email: string;
  isDefault: boolean;
  default?: boolean;   // This will be used for API communication
  locationId?: number | null;
}

export interface SupplierPhone {
  id?: number;
  phoneNumber: string;
  isDefault: boolean;
  default?: boolean;   // This will be used for API communication
  locationId?: number | null;
}