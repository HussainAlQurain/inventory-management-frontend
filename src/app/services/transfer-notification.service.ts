import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TransferNotificationService {
  // Subject to emit transfer IDs that need to be opened in a dialog
  private openTransferDetailsSource = new Subject<number>();
  
  // Observable that components can subscribe to
  public openTransferDetails$ = this.openTransferDetailsSource.asObservable();

  constructor() { }

  // Method to trigger the opening of transfer details
  openTransferDetails(transferId: number): void {
    this.openTransferDetailsSource.next(transferId);
  }
}