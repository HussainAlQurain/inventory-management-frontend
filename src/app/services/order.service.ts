import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { OrderSummary } from '../models/OrderSummary';
import { CompaniesService } from './companies.service';

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
   * Get a specific purchase order by ID
   * @param orderId Purchase order ID
   * @returns Observable of OrderSummary
   */
  getPurchaseOrderById(orderId: number): Observable<OrderSummary> {
    const companyId = this.companiesService.getSelectedCompanyId() || 1;
    return this.http.get<OrderSummary>(
      `${this.apiUrl}/companies/${companyId}/purchase-orders/${orderId}`
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
}