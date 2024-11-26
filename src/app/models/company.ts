export interface Company {
    id: number;
    name: string;
    tax_id: string;
    phone: string;
    mobile: string;
    email: string;
    state: string;
    city: string;
    address: string;
    zip: string;
    addPurchasedItemsToFavorites?: boolean;
    logo?: string;
    allowedInvoiceDeviation?: number;
    accountingSoftware?: string;
    exportDeliveryNotesAsBills?: boolean;

}