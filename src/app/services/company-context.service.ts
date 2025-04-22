import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CompanyContextService {
  private currentCompanyIdSubject: BehaviorSubject<number>;
  public currentCompanyId$: Observable<number>;

  constructor() {
    // Initialize with a default value or from localStorage
    const storedCompanyId = localStorage.getItem('currentCompanyId');
    this.currentCompanyIdSubject = new BehaviorSubject<number>(
      storedCompanyId ? parseInt(storedCompanyId, 10) : 1
    );
    this.currentCompanyId$ = this.currentCompanyIdSubject.asObservable();
  }

  setCompanyId(companyId: number): void {
    // Store in localStorage for persistence
    localStorage.setItem('currentCompanyId', companyId.toString());
    this.currentCompanyIdSubject.next(companyId);
  }

  getCompanyId(): number {
    return this.currentCompanyIdSubject.value;
  }
}