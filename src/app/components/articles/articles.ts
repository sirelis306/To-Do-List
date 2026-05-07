import { Component, OnInit, OnDestroy, Injectable } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Article } from '../../models/article';
import { ArticleService } from '../../services/article/articleService';
import { MatPaginatorModule, PageEvent, MatPaginatorIntl } from '@angular/material/paginator';
import JsBarcode from 'jsbarcode';


import { CustomDropdown } from '../custom-dropdown/custom-dropdown';
import { Scanner } from '../scanner/scanner';


@Injectable()
export class MyPaginatorIntl extends MatPaginatorIntl {
  override itemsPerPageLabel = 'Artículos por página:';
}

@Component({
  selector: 'app-articles',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatPaginatorModule, CustomDropdown, Scanner],
  templateUrl: './articles.html',
  styleUrl: './articles.css',
  providers: [
    { provide: MatPaginatorIntl, useClass: MyPaginatorIntl }
  ]
})

export class Articles implements OnInit, OnDestroy {
  public terminoBusqueda: string = "";
  public categoryFilter: string = "";
  public categoryOptions: string[] = ['Electrónica', 'Mobiliario', 'Herramientas', 'Oficina', 'Computación', 'Redes', 'Seguridad']; // Categorías por defecto
  public showConfirmModal: boolean = false;
  public articleToDeleteId: number | null = null;
  public confirmMessage: string = "";

  public showBarcodeModal: boolean = false;
  public showScannerModal: boolean = false;
  public selectedArticle: Article | null = null;

  public articulosPaginados: Article[] = [];
  public totalArticles: number = 0;
  public pageSize: number = 10;
  public pageIndex: number = 0;
  public pageSizeOptions = [10, 25, 50, 100];

  private searchSubject = new Subject<string>();
  private searchSubscription!: Subscription;

  constructor(private router: Router, private articleService: ArticleService, private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(() => {
      this.pageIndex = 0;
      this.cargarArticulos();
    });

    this.cargarArticulos();

    // Auto-abrir escáner si viene de parámetro
    this.route.queryParams.subscribe(params => {
      if (params['scan'] === 'true' || params['scan'] === true) {
        this.showScannerModal = true;
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { scan: null },
          queryParamsHandling: 'merge'
        });
      }
    });
  }

  ngOnDestroy(): void {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }

  cargarArticulos(): void {
    this.articleService.getArticles(this.terminoBusqueda, this.categoryFilter, this.pageIndex + 1, this.pageSize).subscribe(response => {
      let data = Array.isArray(response) ? response : (response.data || []);
      
      this.articulosPaginados = data;
      this.totalArticles = response.meta?.total_items !== undefined ? response.meta.total_items : (response.total !== undefined ? response.total : data.length);
    });
  }

  onBuscar(): void {
    this.searchSubject.next(this.terminoBusqueda);
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.cargarArticulos();
  }

  onNuevoProductoClick(): void {
    this.router.navigate(['/articles/add']);
  }

  onDelete(articulo: Article): void {
    this.articleToDeleteId = articulo.id;
    this.confirmMessage = `¿Estás seguro de que quieres eliminar "${articulo.nombre}"?`;
    this.showConfirmModal = true;
  }

  onConfirmDelete(): void {
    if (this.articleToDeleteId) {
      this.articleService.deleteArticle(this.articleToDeleteId).subscribe(() => {
        this.cargarArticulos();
      });
    }
    this.onCancelDelete();
  }

  onCancelDelete(): void {
    this.showConfirmModal = false;
    this.articleToDeleteId = null;
    this.confirmMessage = "";
  }

  onShowBarcode(articulo: Article): void {
    this.selectedArticle = articulo;
    this.showBarcodeModal = true;

    setTimeout(() => {
      if (this.selectedArticle) {
        const serialStr = this.selectedArticle.serial ? this.selectedArticle.serial.toString() : "0";
        JsBarcode("#barcode", serialStr, {
          format: "CODE128",
          lineColor: "#000",
          width: 2,
          height: 80,
          displayValue: true
        });
      }
    }, 50);
  }

  onCloseBarcodeModal(): void {
    this.showBarcodeModal = false;
    this.selectedArticle = null;
  }

  onPrintBarcode(): void {
    window.print();
  }

  onOpenScanner(): void {
    this.showScannerModal = true;
  }

  onScanResult(result: string): void {
    this.showScannerModal = false;
    this.terminoBusqueda = result;
    this.pageIndex = 0;
    this.cargarArticulos();
  }

  onCloseScanner(): void {
    this.showScannerModal = false;
  }
}