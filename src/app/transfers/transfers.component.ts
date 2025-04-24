import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { TransferCreateComponent } from './transfer-create/transfer-create.component';
import { TransferOutgoingComponent } from './transfer-outgoing/transfer-outgoing.component';
import { TransferIncomingComponent } from './transfer-incoming/transfer-incoming.component';
import { TransferCompletedComponent } from './transfer-completed/transfer-completed.component';

@Component({
  selector: 'app-transfers',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatTabsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    TransferCreateComponent,
    TransferOutgoingComponent,
    TransferIncomingComponent,
    TransferCompletedComponent
  ],
  templateUrl: './transfers.component.html',
  styleUrls: ['./transfers.component.scss']
})
export class TransfersComponent implements OnInit {
  activeTabIndex = 0;

  constructor(
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
  }

  tabChanged(event: any): void {
    this.activeTabIndex = event.index;
  }

  createTransfer(): void {
    this.router.navigate(['/transfers/create']);
  }
}