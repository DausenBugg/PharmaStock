import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { NotificationSetting } from './notification-setting.model';

@Injectable({
  providedIn: 'root'
})
export class NotificationSettingService {
  private apiUrl = 'http://localhost:5177/api/NotificationSettings';

  constructor(private http: HttpClient) {}

  get(): Observable<NotificationSetting> {
    return this.http.get<NotificationSetting>(this.apiUrl);
  }

  update(settings: Omit<NotificationSetting, 'updatedAtUtc'>): Observable<NotificationSetting> {
    return this.http.put<NotificationSetting>(this.apiUrl, settings);
  }
}
