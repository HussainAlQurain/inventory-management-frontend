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

  // etc. for partial updates
}
