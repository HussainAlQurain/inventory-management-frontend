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
  locationId?: number;
}

export interface SupplierPhone {
  id?: number;
  phoneNumber: string;
  isDefault: boolean;
  locationId?: number;
}