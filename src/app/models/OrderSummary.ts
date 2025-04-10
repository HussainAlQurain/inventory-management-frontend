export interface OrderSummary {
    id?: number;
    orderNumber: string;
    sentDate?: string;
    deliveryDate?: string;
    buyerLocationName: string;
    supplierName: string;
    total: number;
    status: string;
    comments?: string;
}

// Common order statuses
export type OrderStatus = 'Draft' | 'Pending' | 'Sent' | 'Partially Received' | 'Received' | 'Cancelled';