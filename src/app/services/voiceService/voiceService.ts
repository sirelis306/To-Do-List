import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VoiceService {
  private readonly N8N_URL = '/webhook/transcribe'; 

  private mediaRecorder: MediaRecorder | null = null;
  public textStream$ = new Subject<string>();
  private isRecording = false;

  constructor(private http: HttpClient) {}

  startRecording() {
    if (this.isRecording) return;

    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
      this.mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      this.isRecording = true;
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.sendAudio(event.data);
        }
      };

      this.mediaRecorder.start(3000); 
    }).catch(err => console.error('Error con el micrófono:', err));
  }

  stopRecording() {
    if (this.mediaRecorder) {
      this.mediaRecorder.stop();
      this.isRecording = false;
      this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
  }

  private sendAudio(blob: Blob) {
    const formData = new FormData();
    formData.append('file', blob, 'audio.webm'); 
    formData.append('model', 'whisper-large-v3'); 

    this.http.post<{ text: string }>(this.N8N_URL, formData).subscribe({
      next: (res) => {
        if (res && res.text) {
          this.textStream$.next(res.text);
        }
      },
      error: (err) => console.error('Error enviando a n8n:', err)
    });
  }
}