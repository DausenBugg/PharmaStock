import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UsageHistoryEntry } from '../models/usage-history.model';

@Injectable({ providedIn: 'root' })
export class UsageHistoryService {
  private readonly baseUrl = 'http://localhost:5177/api/usagehistory';

  constructor(private readonly http: HttpClient) {}

  getRecent(take = 5): Observable<UsageHistoryEntry[]> {
    return this.http.get<UsageHistoryEntry[]>(this.baseUrl, { params: { take } });
  }
}
