import { Category } from './Category';

export interface Supplier {
  id?: number;
  name: string;
  customerNumber?: string;
  minimumOrder?: number;
  taxId?: string;
  taxRate?: number;
  paymentTerms?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  ccEmails?: string;
  comments?: string;
  defaultCategoryId?: number | null;

  // Contact information
  // API sends back orderEmails and orderPhones, but we maintain 
  // emails and phones for backward compatibility
  emails?: SupplierEmail[];
  phones?: SupplierPhone[];

  orderEmails?: SupplierEmail[];
  orderPhones?: SupplierPhone[];
}

export interface SupplierEmail {
  id?: number;
  email: string;
  isDefault?: boolean;
  default?: boolean;
  locationId?: number | null;
  location?: any;      // Location object if needed
}

export interface SupplierPhone {
  id?: number;
  phoneNumber: string;
  isDefault?: boolean;
  default?: boolean;
  locationId?: number | null;
  location?: any;      // Location object if needed
}

export interface SupplierAuthorizedBuyer {
  id: number;
  locationId: number;
  locationName?: string;
}