import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type NotificationType = 'success' | 'error' | '';

export interface AppNotification {
  message: string;
  type: NotificationType;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationSubject = new BehaviorSubject<AppNotification>({
    message: '',
    type: ''
  });

  notification$ = this.notificationSubject.asObservable();

  show(message: string, type: 'success' | 'error' = 'success'): void {
    this.notificationSubject.next({ message, type });

    setTimeout(() => {
      this.clear();
    }, 3000);
  }

  clear(): void {
    this.notificationSubject.next({ message: '', type: '' });
  }
}