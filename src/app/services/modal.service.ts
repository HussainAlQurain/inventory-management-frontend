import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ModalComponent } from '../shared/modal/modal.component';

@Injectable({
  providedIn: 'root'
})
export class ModalService {

  constructor(private dialog: MatDialog) {}

  openModal(component: any, config?: any) {
    const dialogRef = this.dialog.open(component, {
      width: '400px',
      ...config,
    });
    return dialogRef.afterClosed();
  }
  
}
