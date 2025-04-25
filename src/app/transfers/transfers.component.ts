import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
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
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { TransferOutgoingComponent } from './transfer-outgoing/transfer-outgoing.component';
import { TransferIncomingComponent } from './transfer-incoming/transfer-incoming.component';
import { TransferCompletedComponent } from './transfer-completed/transfer-completed.component';
import { TransferDetailsComponent } from './transfer-details/transfer-details.component';
import { TransferNotificationService } from '../services/transfer-notification.service';
import { Transfer } from '../models/Transfer';

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
    MatDialogModule,
    TransferOutgoingComponent,
    TransferIncomingComponent,
    TransferCompletedComponent
  ],
  templateUrl: './transfers.component.html',
  styleUrls: ['./transfers.component.scss']
})
export class TransfersComponent implements OnInit, OnDestroy, AfterViewInit {
  activeTabIndex = 0;
  private transferNotificationSubscription: Subscription = new Subscription();
  private pendingTransferId: number | null = null;

  @ViewChild(TransferOutgoingComponent) outgoingComponent!: TransferOutgoingComponent;
  @ViewChild(TransferIncomingComponent) incomingComponent!: TransferIncomingComponent;
  @ViewChild(TransferCompletedComponent) completedComponent!: TransferCompletedComponent;

  constructor(
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private transferNotificationService: TransferNotificationService
  ) {}

  ngOnInit(): void {
    console.log('TransfersComponent initialized');
    // Subscribe to transfer notification service
    this.transferNotificationSubscription = this.transferNotificationService.openTransferDetails$.subscribe(
      (transferId: number) => {
        console.log('Transfer notification received for ID:', transferId);
        this.pendingTransferId = transferId;
        this.openTransferDetailsDialog(transferId);
      }
    );
  }

  ngAfterViewInit(): void {
    // If we have a pending transfer ID (clicked from notification before view was ready)
    // Process it now that the components are initialized
    if (this.pendingTransferId !== null) {
      // Use setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
      setTimeout(() => {
        this.openTransferDetailsDialog(this.pendingTransferId!);
        this.pendingTransferId = null;
      });
    }
  }

  ngOnDestroy(): void {
    if (this.transferNotificationSubscription) {
      this.transferNotificationSubscription.unsubscribe();
    }
  }

  tabChanged(event: any): void {
    this.activeTabIndex = event.index;
  }

  createTransfer(): void {
    this.router.navigate(['/transfers/create']);
  }

  // Open transfer details dialog with the provided ID
  private openTransferDetailsDialog(transferId: number): void {
    console.log('Opening transfer details dialog for ID:', transferId);
    
    // If view children aren't initialized yet, save the ID for later
    if (!this.outgoingComponent || !this.incomingComponent) {
      console.log('Components not ready yet, saving pending transferId:', transferId);
      this.pendingTransferId = transferId;
      return;
    }

    // Ensure data is loaded in both components before proceeding
    this.ensureDataIsLoaded().then(() => {
      // Find the transfer in the appropriate component's data
      let transfer: Transfer | undefined;
      let isIncoming = false;

      // Check each component for the transfer
      if (this.incomingComponent && this.incomingComponent.dataSource) {
        console.log('Checking incoming transfers...', this.incomingComponent.dataSource.data);
        transfer = this.incomingComponent.dataSource.data.find(t => t.id === transferId);
        if (transfer) {
          console.log('Found transfer in incoming:', transfer);
          isIncoming = true;
          // If found, set the active tab to incoming
          this.activeTabIndex = 1;
        }
      }

      // If not found in incoming, check outgoing
      if (!transfer && this.outgoingComponent && this.outgoingComponent.dataSource) {
        console.log('Checking outgoing transfers...', this.outgoingComponent.dataSource.data);
        transfer = this.outgoingComponent.dataSource.data.find(t => t.id === transferId);
        if (transfer) {
          console.log('Found transfer in outgoing:', transfer);
          isIncoming = false;
          // If found, set the active tab to outgoing
          this.activeTabIndex = 0;
        }
      }

      // If still not found, check completed
      if (!transfer && this.completedComponent) {
        console.log('Checking completed transfers...');
        // Assuming completedComponent has a similar dataSource structure
        transfer = this.completedComponent.dataSource?.data.find(t => t.id === transferId);
        if (transfer) {
          console.log('Found transfer in completed:', transfer);
          // If found in completed, set the appropriate tab
          this.activeTabIndex = 2;
        }
      }

      // Open the dialog if the transfer was found
      if (transfer) {
        console.log('Opening dialog for transfer:', transfer);
        const dialogRef = this.dialog.open(TransferDetailsComponent, {
          width: '800px',
          data: {
            transferId: transferId,
            isIncoming: isIncoming,
            transferObject: transfer // Pass the full transfer object
          }
        });

        dialogRef.afterClosed().subscribe(result => {
          if (result === 'completed' || result === 'updated' || result === 'deleted') {
            // Refresh the current tab data
            this.snackBar.open('Transfer data refreshed', 'Close', { duration: 2000 });
            
            // Refresh the appropriate component based on the active tab
            if (this.activeTabIndex === 0 && this.outgoingComponent) {
              this.outgoingComponent.onLocationChange();
            } else if (this.activeTabIndex === 1 && this.incomingComponent) {
              this.incomingComponent.onLocationChange();
            } else if (this.activeTabIndex === 2 && this.completedComponent) {
              this.completedComponent.onLocationChange();
            }
          }
        });
      } else {
        console.log('Transfer not found in any loaded data');
        // Transfer not found in any component's data
        this.snackBar.open(`Transfer #${transferId} not found in loaded data`, 'Close', { duration: 3000 });
      }
    });
  }

  // Ensure data is loaded in the transfer components
  private ensureDataIsLoaded(): Promise<void> {
    return new Promise<void>((resolve) => {
      // First check if data is already loaded
      const outgoingHasData = this.outgoingComponent?.dataSource?.data?.length > 0;
      const incomingHasData = this.incomingComponent?.dataSource?.data?.length > 0;

      if (outgoingHasData && incomingHasData) {
        console.log('Data already loaded in both components');
        resolve();
        return;
      }

      // If not loaded, trigger loading and wait a bit
      console.log('Loading data in components...');
      
      if (this.outgoingComponent && !outgoingHasData) {
        console.log('Loading outgoing transfers...');
        this.outgoingComponent.onLocationChange();
      }
      
      if (this.incomingComponent && !incomingHasData) {
        console.log('Loading incoming transfers...');
        this.incomingComponent.onLocationChange();
      }

      // Give the components time to load their data (adjust timeout as needed)
      setTimeout(() => {
        console.log('Data load completed');
        resolve();
      }, 500);
    });
  }
}