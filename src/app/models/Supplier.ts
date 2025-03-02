export interface Supplier {
    id: number;
    name: string;
    customerNumber: string;
    minimumOrder: number;
    taxId: string;
    taxRate: number;
    paymentTerms: string;
    comments: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    ccEmails: string;
    defaultCategory: any | null;
    orderEmails: string[];
    orderPhones: string[];
    authorizedBuyers: AuthorizedBuyer[];
  }
  
  interface AuthorizedBuyer {
    id: number;
    locationId: number;
  }