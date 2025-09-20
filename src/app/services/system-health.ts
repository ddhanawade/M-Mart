import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, forkJoin, tap, catchError, of, interval } from 'rxjs';
import { ApiService } from './api.service';
import { NotificationService } from './notification';
import { ServiceHealthStatus, NotificationHealth } from '../models/notification.model';

@Injectable({
  providedIn: 'root'
})
export class SystemHealthService {
  private healthStatusSubject = new BehaviorSubject<ServiceHealthStatus>({
    userService: { status: 'UNKNOWN', lastChecked: new Date() },
    productService: { status: 'UNKNOWN', lastChecked: new Date() },
    cartService: { status: 'UNKNOWN', lastChecked: new Date() },
    orderService: { status: 'UNKNOWN', lastChecked: new Date() },
    notificationService: { status: 'UNKNOWN', lastChecked: new Date() }
  });

  private loadingSubject = new BehaviorSubject<boolean>(false);

  public healthStatus$ = this.healthStatusSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();

  constructor(
    private apiService: ApiService,
    private notificationService: NotificationService
  ) {
    // Check all services health periodically (every 10 minutes)
    interval(10 * 60 * 1000).subscribe(() => {
      this.checkAllServicesHealth();
    });
    
    // Initial health check
    this.checkAllServicesHealth();
  }

  private setLoading(loading: boolean) {
    this.loadingSubject.next(loading);
  }

  /**
   * Check health of all backend services
   */
  checkAllServicesHealth(): Observable<ServiceHealthStatus> {
    this.setLoading(true);

    const healthChecks = {
      userService: this.checkServiceHealth('userService', '/api/auth/health'),
      productService: this.checkServiceHealth('productService', '/api/products/health'),
      cartService: this.checkServiceHealth('cartService', '/api/cart/health'),
      orderService: this.checkServiceHealth('orderService', '/api/orders/health'),
      notificationService: this.checkServiceHealth('notificationService', '/actuator/health')
    };

    return forkJoin(healthChecks).pipe(
      tap(healthStatus => {
        this.healthStatusSubject.next(healthStatus);
        this.checkForServiceIssues(healthStatus);
        this.setLoading(false);
      }),
      catchError(error => {
        console.error('Error checking services health:', error);
        this.setLoading(false);
        return of(this.healthStatusSubject.value);
      })
    );
  }

  /**
   * Check health of a specific service
   */
  private checkServiceHealth(serviceName: keyof ServiceHealthStatus, endpoint: string): Observable<NotificationHealth> {
    const startTime = Date.now();

    return this.apiService.getRaw<any>(serviceName, endpoint).pipe(
      tap(response => {
        const responseTime = Date.now() - startTime;
        return {
          status: (response?.status === 'UP' || response?.success === true) ? 'UP' : 'DOWN',
          lastChecked: new Date(),
          responseTime
        } as NotificationHealth;
      }),
      catchError(error => {
        console.error(`${serviceName} health check failed:`, error);
        const responseTime = Date.now() - startTime;
        return of({
          status: 'DOWN',
          lastChecked: new Date(),
          responseTime
        } as NotificationHealth);
      })
    );
  }

  /**
   * Check for service issues and notify user if needed
   */
  private checkForServiceIssues(healthStatus: ServiceHealthStatus): void {
    const downServices = Object.entries(healthStatus)
      .filter(([_, health]) => health.status === 'DOWN')
      .map(([serviceName, _]) => serviceName);

    if (downServices.length > 0) {
      this.notificationService.showWarning(
        'Service Issues Detected',
        `The following services are currently unavailable: ${downServices.join(', ')}. Some features may not work properly.`,
        false
      );
    }

    // Check for slow response times (> 5 seconds)
    const slowServices = Object.entries(healthStatus)
      .filter(([_, health]) => health.responseTime && health.responseTime > 5000)
      .map(([serviceName, _]) => serviceName);

    if (slowServices.length > 0) {
      this.notificationService.showWarning(
        'Slow Service Response',
        `The following services are responding slowly: ${slowServices.join(', ')}. You may experience delays.`,
        true
      );
    }
  }

  /**
   * Get current health status
   */
  getCurrentHealthStatus(): ServiceHealthStatus {
    return this.healthStatusSubject.value;
  }

  /**
   * Get overall system health
   */
  getOverallSystemHealth(): 'UP' | 'DEGRADED' | 'DOWN' {
    const healthStatus = this.healthStatusSubject.value;
    const services = Object.values(healthStatus);
    
    const upCount = services.filter(s => s.status === 'UP').length;
    const totalCount = services.length;

    if (upCount === totalCount) {
      return 'UP';
    } else if (upCount > 0) {
      return 'DEGRADED';
    } else {
      return 'DOWN';
    }
  }

  /**
   * Get services that are currently down
   */
  getDownServices(): string[] {
    const healthStatus = this.healthStatusSubject.value;
    return Object.entries(healthStatus)
      .filter(([_, health]) => health.status === 'DOWN')
      .map(([serviceName, _]) => serviceName);
  }

  /**
   * Get average response time across all services
   */
  getAverageResponseTime(): number {
    const healthStatus = this.healthStatusSubject.value;
    const responseTimes = Object.values(healthStatus)
      .map(health => health.responseTime)
      .filter(time => time !== undefined) as number[];

    if (responseTimes.length === 0) return 0;
    
    return responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
  }

  /**
   * Force refresh all service health checks
   */
  refreshHealthStatus(): Observable<ServiceHealthStatus> {
    return this.checkAllServicesHealth();
  }
}
