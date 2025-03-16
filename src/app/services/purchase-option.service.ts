// purchase-option.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { PurchaseOption } from '../models/PurchaseOption';
import { CompaniesService } from './companies.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PurchaseOptionService {
  private baseUrl = environment.apiUrl + '/purchase-options';

  constructor(
    private http: HttpClient,
    private companiesService: CompaniesService
  ) {}

  updatePriceManually(purchaseOptionId: number, newPrice: number): Observable<PurchaseOption> {
    const companyId = this.companiesService.getSelectedCompanyId();
    return this.http.patch<PurchaseOption>(
      `${this.baseUrl}/${purchaseOptionId}/company/${companyId}/price?newPrice=${newPrice}`,
      {}
    );
  }

  partialUpdateEnabled(purchaseOptionId: number, orderingEnabled: boolean): Observable<PurchaseOption> {
    const companyId = this.companiesService.getSelectedCompanyId();
    return this.http.patch<PurchaseOption>(
      `${this.baseUrl}/${purchaseOptionId}/company/${companyId}`,
      { orderingEnabled }
    );
  }

  setAsMainOption(purchaseOptionId: number): Observable<PurchaseOption> {
    const companyId = this.companiesService.getSelectedCompanyId();
    // Possibly you have a custom endpoint
    return this.http.patch<PurchaseOption>(
      `${this.baseUrl}/${purchaseOptionId}/company/${companyId}`,
      { mainPurchaseOption: true }
    );
  }

  createPurchaseOption(purchaseOption: PurchaseOption, itemId: number): Observable<PurchaseOption> {
    const companyId = this.companiesService.getSelectedCompanyId();
    // The shape of your create endpoint is:
    // POST /purchase-options/company/{companyId}/inventory-items/{itemId}
    // with a request body => PurchaseOptionCreateDTO
    const createDto = {
      price: purchaseOption.price ?? 0,
      taxRate: purchaseOption.taxRate ?? 0,
      innerPackQuantity: purchaseOption.innerPackQuantity ?? 1,
      packsPerCase: purchaseOption.packsPerCase ?? 1,
      minOrderQuantity: purchaseOption.minOrderQuantity ?? 1,
      mainPurchaseOption: purchaseOption.mainPurchaseOption ?? false,
      orderingEnabled: purchaseOption.orderingEnabled ?? true,
      supplierProductCode: purchaseOption.supplierProductCode,
      nickname: purchaseOption.nickname,
      scanBarcode: purchaseOption.scanBarcode,
      // etc.
    };
    return this.http.post<PurchaseOption>(
      `${this.baseUrl}/company/${companyId}/inventory-items/${itemId}`,
      createDto
    );
  }
  
  deleteOption(poId: number): Observable<void> {
    const companyId = this.companiesService.getSelectedCompanyId();
    return this.http.delete<void>(`${this.baseUrl}/${poId}/company/${companyId}`);
  }

  // etc. for partial updates
}
