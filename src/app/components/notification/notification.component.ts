import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { NotificationService } from '../../services/notification.service';
import { TransferNotificationService } from '../../services/transfer-notification.service';
import { Notification } from '../../models/Notification';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [
    CommonModule,
    MatBadgeModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule
  ],
  templateUrl: './notification.component.html',
  styleUrl: './notification.component.scss'
})
export class NotificationComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  unreadCount: number = 0;
  private subscriptions: Subscription[] = [];

  constructor(
    public notificationService: NotificationService,
    private transferNotificationService: TransferNotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Subscribe to notifications
    this.subscriptions.push(
      this.notificationService.notifications$.subscribe(
        notifications => {
          this.notifications = notifications;
        }
      )
    );

    // Subscribe to unread count
    this.subscriptions.push(
      this.notificationService.unreadCount$.subscribe(
        count => {
          this.unreadCount = count;
        }
      )
    );

    // Initial fetch of notifications
    this.notificationService.fetchRecentNotifications().subscribe();
  }

  ngOnDestroy(): void {
    // Cleanup subscriptions
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }

  // Handle notification click
  onNotificationClick(notification: Notification): void {
    this.notificationService.markAsRead(notification.id).subscribe();
    this.navigateBasedOnNotification(notification);
  }

  // Navigate based on notification type/content
  private navigateBasedOnNotification(notification: Notification): void {
    // Check for auto-order notifications with order ID
    const orderIdMatch = notification.message.match(/PO \(ID=(\d+)\)/);
    if (orderIdMatch && orderIdMatch[1]) {
      this.router.navigate(['/orders', orderIdMatch[1]]);
      return;
    }

    // Check for auto-transfer notifications with transfer ID
    if (notification.title.includes('Auto-Transfer') || notification.title.includes('Auto‑Transfer')) {
      // Extract the transfer ID from the notification message - handles "Draft #3 + 100.0" format
      const transferIdMatch = notification.message.match(/Draft #(\d+)/);
      if (transferIdMatch && transferIdMatch[1]) {
        const transferId = parseInt(transferIdMatch[1]);
        console.log('Found transfer ID in notification:', transferId);
        // Navigate to transfers and open the transfer dialog
        this.openTransferDetails(transferId);
        return;
      }
    }

    // Add additional navigation logic for other notification types here
    
    // Default: no specific navigation
  }

  // Open transfer details dialog
  private openTransferDetails(transferId: number): void {
    // Navigate to the transfers page first
    this.router.navigate(['/transfers']).then(() => {
      // After navigation is complete, trigger the transfer notification service
      // to open the dialog through the transfers component
      this.transferNotificationService.openTransferDetails(transferId);
    });
  }

  // Mark all visible notifications as read
  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe();
  }

  // Format the notification date
  formatNotificationDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    
    // If the notification is from today, show only the time
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // Otherwise show the date
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
}