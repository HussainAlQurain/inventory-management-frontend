export interface OrderSummary {
    id?: number;
    orderId?: number;
    orderNumber: string;
    sentDate?: string;
    deliveryDate?: string;
    buyerLocationName: string;
    supplierName: string;
    total: number;
    status: string;
    comments?: string;
}

// Common order statuses from backend
export type OrderStatus = 'DRAFT' | 'CREATED' | 'SUBMITTED_FOR_APPROVAL' | 'APPROVED' | 'SENT' | 'VIEWED_BY_SUPPLIER' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED';