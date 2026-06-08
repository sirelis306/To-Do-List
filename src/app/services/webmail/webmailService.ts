import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface WebmailSsoResponse {
  session: string;
  token: string;
  hostname: string;
}

@Injectable({
  providedIn: 'root'
})
export class WebmailService {
  private apiUrl = `${environment.apiUrl}/webmail`;

  constructor(private http: HttpClient) { }

  getSSOToken(): Observable<WebmailSsoResponse> {
    return this.http.post<WebmailSsoResponse>(`${this.apiUrl}/sso-token`, {});
  }
}
