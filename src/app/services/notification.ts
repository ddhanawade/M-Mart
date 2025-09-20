import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap, catchError, of, interval } from 'rxjs';
import { ApiService } from './api.service';

export interface NotificationHealth {
  status: 'UP' | 'DOWN' | 'UNKNOWN';
  lastChecked: Date;
  responseTime?: number;
}

export interface SystemNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  autoClose?: boolean;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private healthSubject = new BehaviorSubject<NotificationHealth>({
    status: 'UNKNOWN',
    lastChecked: new Date()
  });
  private notificationsSubject = new BehaviorSubject<SystemNotification[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);

  public health$ = this.healthSubject.asObservable();
  public notifications$ = this.notificationsSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();

  constructor(private apiService: ApiService) {
    // Check notification service health periodically (every 5 minutes)
    interval(5 * 60 * 1000).subscribe(() => {
      this.checkHealth();
    });
    
    // Initial health check
    this.checkHealth();
  }

  private setLoading(loading: boolean) {
    this.loadingSubject.next(loading);
  }

  /**
   * Check notification service health
   */
  checkHealth(): Observable<NotificationHealth> {
    this.setLoading(true);
    const startTime = Date.now();

    return this.apiService.getRaw<any>('notificationService', '/actuator/health').pipe(
      tap(response => {
        const responseTime = Date.now() - startTime;
        const health: NotificationHealth = {
          status: response?.status === 'UP' ? 'UP' : 'DOWN',
          lastChecked: new Date(),
          responseTime
        };
        this.healthSubject.next(health);
        this.setLoading(false);
      }),
      catchError(error => {
        console.error('Notification service health check failed:', error);
        const health: NotificationHealth = {
          status: 'DOWN',
          lastChecked: new Date(),
          responseTime: Date.now() - startTime
        };
        this.healthSubject.next(health);
        this.setLoading(false);
        return of(health);
      })
    );
  }

  /**
   * Add a system notification (for UI feedback)
   */
  addNotification(notification: Omit<SystemNotification, 'id' | 'timestamp' | 'read'>): void {
    const newNotification: SystemNotification = {
      ...notification,
      id: this.generateId(),
      timestamp: new Date(),
      read: false
    };

    const currentNotifications = this.notificationsSubject.value;
    this.notificationsSubject.next([newNotification, ...currentNotifications]);

    // Auto-remove notification if autoClose is enabled
    if (newNotification.autoClose) {
      const duration = newNotification.duration || 5000; // Default 5 seconds
      setTimeout(() => {
        this.removeNotification(newNotification.id);
      }, duration);
    }
  }

  /**
   * Remove a notification
   */
  removeNotification(notificationId: string): void {
    const currentNotifications = this.notificationsSubject.value;
    const updatedNotifications = currentNotifications.filter(n => n.id !== notificationId);
    this.notificationsSubject.next(updatedNotifications);
  }

  /**
   * Mark notification as read
   */
  markAsRead(notificationId: string): void {
    const currentNotifications = this.notificationsSubject.value;
    const updatedNotifications = currentNotifications.map(n => 
      n.id === notificationId ? { ...n, read: true } : n
    );
    this.notificationsSubject.next(updatedNotifications);
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead(): void {
    const currentNotifications = this.notificationsSubject.value;
    const updatedNotifications = currentNotifications.map(n => ({ ...n, read: true }));
    this.notificationsSubject.next(updatedNotifications);
  }

  /**
   * Clear all notifications
   */
  clearAllNotifications(): void {
    this.notificationsSubject.next([]);
  }

  /**
   * Get current notifications
   */
  getCurrentNotifications(): SystemNotification[] {
    return this.notificationsSubject.value;
  }

  /**
   * Get unread notifications count
   */
  getUnreadCount(): number {
    return this.notificationsSubject.value.filter(n => !n.read).length;
  }

  /**
   * Get current health status
   */
  getCurrentHealth(): NotificationHealth {
    return this.healthSubject.value;
  }

  /**
   * Show success notification
   */
  showSuccess(title: string, message: string, autoClose: boolean = true): void {
    this.addNotification({
      type: 'success',
      title,
      message,
      autoClose,
      duration: 4000
    });
  }

  /**
   * Show error notification
   */
  showError(title: string, message: string, autoClose: boolean = false): void {
    this.addNotification({
      type: 'error',
      title,
      message,
      autoClose,
      duration: 8000
    });
  }

  /**
   * Show warning notification
   */
  showWarning(title: string, message: string, autoClose: boolean = true): void {
    this.addNotification({
      type: 'warning',
      title,
      message,
      autoClose,
      duration: 6000
    });
  }

  /**
   * Show info notification
   */
  showInfo(title: string, message: string, autoClose: boolean = true): void {
    this.addNotification({
      type: 'info',
      title,
      message,
      autoClose,
      duration: 5000
    });
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}
