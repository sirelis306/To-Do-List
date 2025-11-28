import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranscriptorService } from '../../services/transcriptorService/transcriptor-service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-transcriptor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './transcriptor.html',
  styleUrl: './transcriptor.css',
})
export class Transcriptor implements OnDestroy {
  transcription: string = '';
  isLoading: boolean = false;
  selectedFile: File | null = null;
  audioUrl: SafeUrl | null = null;
  isDragging: boolean = false;
  
  visualizerBars = new Array(20).fill(0); 

  constructor(
    private transcriptorService: TranscriptorService,
    private sanitizer: DomSanitizer
  ) {}

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.procesarArchivo(event.dataTransfer.files[0]);
    }
  }

  onFileSelected(event: any) {
    if (event.target.files && event.target.files.length > 0) {
      this.procesarArchivo(event.target.files[0]);
    }
  }

  procesarArchivo(file: File) {
    if (!file.type.startsWith('audio/')) {
      alert('Por favor sube solo archivos de audio.');
      return;
    }
    
    this.selectedFile = file;
    const objectUrl = URL.createObjectURL(file);
    this.audioUrl = this.sanitizer.bypassSecurityTrustUrl(objectUrl);
    this.transcription = "";
  }

  uploadAndTranscribe() {
    if (!this.selectedFile) return;
    this.isLoading = true;
    this.transcription = ''; 

    this.transcriptorService.transcribeFile(this.selectedFile).subscribe({
      next: (res: any) => {
        console.log('Respuesta n8n:', res);

        if (!res) {
           this.transcription = "Error: La respuesta del servidor fue vacía. Probablemente el archivo excede el límite de 25MB de Groq.";
           this.isLoading = false;
           return;
        }

        const textoRecibido = res.text || res.transcription || res.output;

        if (textoRecibido) {
          this.transcription = textoRecibido;
        } else {
          console.warn('Recibido objeto vacío:', res);
          this.transcription = "No se pudo extraer texto del audio. Intenta de nuevo.";
        }

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error:', err);
        this.transcription = "Ocurrió un error. Revisa la conexión.";
        this.isLoading = false;
      }
    });
  }

  copyToClipboard() {
    if (this.transcription) {
      navigator.clipboard.writeText(this.transcription);
    }
  }

  reset() {
    this.selectedFile = null;
    this.audioUrl = null;
    this.transcription = '';
  }

  ngOnDestroy() {
    if (this.audioUrl) {
    }
  }
}
