import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { BehaviorSubject, catchError, Observable, throwError } from 'rxjs';
import { Company } from '../models/company';

@Injectable({
  providedIn: 'root'
})
export class CompaniesService {
  private selectedCompanySubject = new BehaviorSubject<number | null>(null);
  public selectedCompany$ = this.selectedCompanySubject.asObservable();

  private baseUrl = environment.apiUrl + "/companies";
  
  constructor(private http: HttpClient) {
    const storedCompanyId = localStorage.getItem('selectedCompanyId');
    if (storedCompanyId) {
      this.selectedCompanySubject.next(Number(storedCompanyId));
    }
   }


  getCompaniesByUserId(userId: number): Observable<Company[]> {
    return this.http.get<Company[]>(`${this.baseUrl}/user/${userId}`).pipe(
      catchError(error => {
        console.error('Error fetching companies:', error);
        return throwError(() => new Error('Error fetching companies.'));
      })
    );
  }

    // Method to set the selected company ID
    setSelectedCompanyId(companyId: number): void {
      this.selectedCompanySubject.next(companyId);
      // Optionally persist in localStorage
      localStorage.setItem('selectedCompanyId', companyId.toString());
    }

  // Method to get the selected company ID
  getSelectedCompanyId(): number | null {
    return this.selectedCompanySubject.getValue();
  }
  
}
