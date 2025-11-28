import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class TranscriptorService {
  private readonly N8N_API_URL = '/webhook/transcribe'; 

  constructor(private http: HttpClient) {}
  
  transcribeFile(file: File): Observable<{ text: string }> {
    const formData = new FormData();
    formData.append('data', file);
    return this.http.post<{ text: string }>(this.N8N_API_URL, formData);
  }
}