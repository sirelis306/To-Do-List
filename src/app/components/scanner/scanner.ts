import { Component, AfterViewInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Html5QrcodeScanner } from 'html5-qrcode';

@Component({
  selector: 'app-scanner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './scanner.html',
  styleUrl: './scanner.css'
})
export class Scanner implements AfterViewInit, OnDestroy {
  private scanner: any;
  @Output() scanResult = new EventEmitter<string>();
  @Output() close = new EventEmitter<void>();

  constructor() {}

  ngAfterViewInit(): void {
    // Un pequeño delay para asegurar que el DOM está listo
    setTimeout(() => {
      this.startScanner();
    }, 100);
  }

  startScanner(): void {
    this.scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 150 } },
      /* verbose= */ false
    );
    this.scanner.render(this.onScanSuccess.bind(this), this.onScanFailure.bind(this));
  }

  onScanSuccess(decodedText: string, decodedResult: any): void {
    console.log(`Code matched = ${decodedText}`, decodedResult);
    this.scanResult.emit(decodedText);
    this.stopScanner();
  }

  onScanFailure(error: any): void {
    // console.warn(`Code scan error = ${error}`);
  }

  stopScanner(): void {
    if (this.scanner) {
      this.scanner.clear().catch((error: any) => {
        console.error("Failed to clear scanner", error);
      });
    }
  }

  ngOnDestroy(): void {
    this.stopScanner();
  }

  onClose(): void {
    this.close.emit();
  }
}
