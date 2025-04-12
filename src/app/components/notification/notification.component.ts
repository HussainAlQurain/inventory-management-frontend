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

    // Add additional navigation logic for other notification types here
    
    // Default: no specific navigation
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