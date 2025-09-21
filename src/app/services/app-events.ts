import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AppEventsService {
  private cartRefreshSubject = new Subject<void>();

  get cartRefresh$(): Observable<void> {
    return this.cartRefreshSubject.asObservable();
  }

  requestCartRefresh(): void {
    this.cartRefreshSubject.next();
  }
}


