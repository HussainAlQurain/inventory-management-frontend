import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, interval } from 'rxjs';
import { switchMap, tap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Notification, MarkReadBatchRequest } from '../models/Notification';
import { CompaniesService } from './companies.service';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private baseUrl = environment.apiUrl + '/notifications';
  private refreshInterval = 30000; // 30 seconds
  
  // BehaviorSubjects to track notifications
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  private unreadCountSubject = new BehaviorSubject<number>(0);
  
  // Observables that components can subscribe to
  public notifications$ = this.notificationsSubject.asObservable();
  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(
    private http: HttpClient,
    private companiesService: CompaniesService
  ) {
    // Start polling for notifications
    this.startPolling();
  }

  // Start polling for notifications
  private startPolling(): void {
    interval(this.refreshInterval)
      .pipe(
        switchMap(() => this.fetchRecentNotifications())
      )
      .subscribe({
        next: () => {
          // Polling succeeded
        },
        error: (error) => {
          console.error('Error polling notifications:', error);
        }
      });
  }

  // Fetch recent notifications
  fetchRecentNotifications(): Observable<Notification[]> {
    const companyId = this.companiesService.getSelectedCompanyId();
    if (!companyId) {
      return new Observable(observer => {
        observer.next([]);
        observer.complete();
      });
    }

    return this.http.get<Notification[]>(`${this.baseUrl}/company/${companyId}/recent`)
      .pipe(
        tap(notifications => {
          this.notificationsSubject.next(notifications);
          this.unreadCountSubject.next(notifications.length);
        }),
        catchError(error => {
          console.error('Error fetching notifications:', error);
          // Return current value on error
          return this.notifications$;
        })
      );
  }

  // Mark a notification as read
  markAsRead(notificationId: number): Observable<Notification> {
    return this.http.put<Notification>(`${this.baseUrl}/${notificationId}/read`, {})
      .pipe(
        tap(() => {
          // Update the local notifications list
          const currentNotifications = this.notificationsSubject.value;
          const updatedNotifications = currentNotifications.map(notification => 
            notification.id === notificationId 
              ? { ...notification, isRead: true } 
              : notification
          );
          
          this.notificationsSubject.next(updatedNotifications);
          this.updateUnreadCount();
        })
      );
  }

  // Mark multiple notifications as read
  markMultipleAsRead(notificationIds: number[]): Observable<any> {
    const request: MarkReadBatchRequest = {
      notificationIds: notificationIds
    };
    
    return this.http.post(`${this.baseUrl}/mark-read-batch`, request)
      .pipe(
        tap(() => {
          // Update the local notifications list
          const currentNotifications = this.notificationsSubject.value;
          const updatedNotifications = currentNotifications.map(notification => 
            notificationIds.includes(notification.id) 
              ? { ...notification, isRead: true } 
              : notification
          );
          
          this.notificationsSubject.next(updatedNotifications);
          this.updateUnreadCount();
        })
      );
  }

  // Mark all visible notifications as read
  markAllAsRead(): Observable<any> {
    const notificationIds = this.notificationsSubject.value
      .filter(notification => !notification.isRead)
      .map(notification => notification.id);
    
    if (notificationIds.length === 0) {
      return new Observable(observer => {
        observer.next(null);
        observer.complete();
      });
    }
    
    return this.markMultipleAsRead(notificationIds);
  }

  // Update the unread count
  private updateUnreadCount(): void {
    const unreadCount = this.notificationsSubject.value.filter(n => !n.isRead).length;
    this.unreadCountSubject.next(unreadCount);
  }
}