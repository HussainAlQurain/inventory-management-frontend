import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { OrderSummary } from '../models/OrderSummary';
import { CompaniesService } from './companies.service';
import { OrderDetail } from '../orders/order-details/order-details.component';

// Interface for order item creation
export interface OrderItemCreate {
  inventoryItemId: number;
  quantity: number;
}

// Interface for creating a new order
export interface CreateOrderRequest {
  buyerLocationId: number;
  supplierId: number;
  createdByUserId?: number;
  comments?: string;
  items: OrderItemCreate[];
}

// Define an interface for order item receipt
export interface OrderItemReceipt {
  orderItemId: number;
  receivedQty: number;
  finalPrice: number;
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private apiUrl = `${environment.apiUrl}`;

  constructor(
    private http: HttpClient,
    private companiesService: CompaniesService
  ) { }

  /**
   * Get all purchase orders for the company with optional date filtering
   * @param startDate Optional start date filter (YYYY-MM-DD)
   * @param endDate Optional end date filter (YYYY-MM-DD)
   * @returns Observable of OrderSummary array
   */
  getPurchaseOrders(startDate?: string, endDate?: string): Observable<OrderSummary[]> {
    const companyId = this.companiesService.getSelectedCompanyId() || 1;
    let params = new HttpParams();
    
    if (startDate) {
      params = params.set('startDate', startDate);
    }
    
    if (endDate) {
      params = params.set('endDate', endDate);
    }
    
    return this.http.get<OrderSummary[]>(
      `${this.apiUrl}/companies/${companyId}/purchase-orders`, 
      { params }
    );
  }

  /**
   * Get a specific purchase order by ID with detailed information including line items
   * @param orderId Purchase order ID
   * @returns Observable of OrderDetail
   */
  getPurchaseOrderById(orderId: number): Observable<OrderDetail> {
    const companyId = this.companiesService.getSelectedCompanyId() || 1;
    return this.http.get<OrderDetail>(
      `${this.apiUrl}/companies/${companyId}/purchase-orders/${orderId}`
    ).pipe(
      map(response => {
        // Ensure we have an id field that matches the orderId field
        if (response.orderId && !response.id) {
          response.id = response.orderId;
        }
        return response;
      })
    );
  }

  /**
   * Create a new purchase order (draft)
   * @param order The order to create
   * @returns Observable of created OrderSummary
   */
  createPurchaseOrder(order: Partial<OrderSummary>): Observable<OrderSummary> {
    const companyId = this.companiesService.getSelectedCompanyId() || 1;
    return this.http.post<OrderSummary>(
      `${this.apiUrl}/companies/${companyId}/purchase-orders`, 
      order
    );
  }

  /**
   * Create a new purchase order with items
   * @param orderRequest The order creation request with items
   * @returns Observable of created OrderDetail
   */
  createPurchaseOrderWithItems(orderRequest: CreateOrderRequest): Observable<OrderDetail> {
    const companyId = this.companiesService.getSelectedCompanyId() || 1;
    return this.http.post<OrderDetail>(
      `${this.apiUrl}/companies/${companyId}/purchase-orders`,
      orderRequest
    ).pipe(
      map(response => {
        // Ensure we have an id field that matches the orderId field
        if (response.orderId && !response.id) {
          response.id = response.orderId;
        }
        return response;
      })
    );
  }

  /**
   * Update an existing purchase order
   * @param orderId ID of the order to update
   * @param order Updated order data
   * @returns Observable of updated OrderSummary
   */
  updatePurchaseOrder(orderId: number, order: Partial<OrderSummary>): Observable<OrderSummary> {
    const companyId = this.companiesService.getSelectedCompanyId() || 1;
    return this.http.put<OrderSummary>(
      `${this.apiUrl}/companies/${companyId}/purchase-orders/${orderId}`, 
      order
    );
  }

  /**
   * Change the status of an order
   * @param orderId ID of the order
   * @param status New status
   * @returns Observable of updated OrderSummary
   */
  updateOrderStatus(orderId: number, status: string): Observable<OrderSummary> {
    const companyId = this.companiesService.getSelectedCompanyId() || 1;
    return this.http.patch<OrderSummary>(
      `${this.apiUrl}/companies/${companyId}/purchase-orders/${orderId}/status`, 
      { status }
    );
  }

  /**
   * Send an order to the supplier
   * @param orderId ID of the order to send
   * @param comments Optional comments for the order
   * @returns Observable of updated OrderDetail
   */
  sendOrder(orderId: number, comments?: string): Observable<OrderDetail> {
    const companyId = this.companiesService.getSelectedCompanyId() || 1;
    
    let params = new HttpParams();
    if (comments) {
      params = params.set('comments', comments);
    }
    
    return this.http.patch<OrderDetail>(
      `${this.apiUrl}/companies/${companyId}/purchase-orders/${orderId}/send`,
      null, // No body needed for this PATCH request
      { params }
    ).pipe(
      map(response => {
        // Ensure we have an id field that matches the orderId field
        if (response.orderId && !response.id) {
          response.id = response.orderId;
        }
        return response;
      })
    );
  }

  /**
   * Receive an order with specified quantities and prices
   * @param orderId ID of the order to receive
   * @param items Array of order items with received quantities and final prices
   * @param updateOptionPrice Whether to update inventory item and purchase option prices
   * @returns Observable of updated OrderDetail
   */
  receiveOrder(orderId: number, items: OrderItemReceipt[], updateOptionPrice: boolean = false): Observable<OrderDetail> {
    const companyId = this.companiesService.getSelectedCompanyId() || 1;
    
    let params = new HttpParams();
    params = params.set('updateOptionPrice', updateOptionPrice.toString());
    
    return this.http.patch<OrderDetail>(
      `${this.apiUrl}/companies/${companyId}/purchase-orders/${orderId}/receive`,
      items,
      { params }
    ).pipe(
      map(response => {
        // Ensure we have an id field that matches the orderId field
        if (response.orderId && !response.id) {
          response.id = response.orderId;
        }
        return response;
      })
    );
  }
}