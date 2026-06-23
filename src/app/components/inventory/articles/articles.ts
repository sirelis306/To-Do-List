import { Component, OnInit, OnDestroy, Injectable } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { AuthService } from '../../../services/auth/authService';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Article } from '../../../models/article';
import { ArticleService } from '../../../services/article/articleService';
import { MatPaginatorModule, PageEvent, MatPaginatorIntl } from '@angular/material/paginator';
import JsBarcode from 'jsbarcode';


import { CustomDropdown } from '../../shared/custom-dropdown/custom-dropdown';
import { Scanner } from '../../scanner/scanner';


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
  public empresaFilter: string = "";
  public opcionesEmpresa: string[] = ['JPL', 'PAFAR', '3D3', 'TecnoLab Kids'];
  public showConfirmModal: boolean = false;
  public articleToDeleteId: number | null = null;
  public articleToRestoreId: number | null = null;
  public confirmMessage: string = "";
  public confirmActionType: 'delete' | 'restore' = 'delete';
  public isDeleting: boolean = false;

  public showBarcodeModal: boolean = false;
  public showScannerModal: boolean = false;
  public selectedArticle: Article | null = null;
  public showScannedDetailsModal: boolean = false;
  public scannedArticle: Article | null = null;

  public articulosPaginados: Article[] = [];
  public totalArticles: number = 0;
  public pageSize: number = 10;
  public pageIndex: number = 0;
  public pageSizeOptions = [10, 25, 50, 100];

  public isAdmin: boolean = false;
  public mostrarEliminados: boolean = false;

  public sortField: string = 'id';
  public sortOrder: 'ASC' | 'DESC' = 'DESC';

  public recentSearches: string[] = [];
  public showRecentSearches: boolean = false;
  public highlightedArticleId: number | null = null;

  private searchSubject = new Subject<string>();
  private searchSubscription!: Subscription;
  private searchIdSubject = new Subject<string>();
  private searchIdSubscription!: Subscription;

  constructor(private router: Router, private articleService: ArticleService, private route: ActivatedRoute, private authService: AuthService) { }

  ngOnInit(): void {
    const savedSearches = localStorage.getItem('recentSearches');
    if (savedSearches) {
      try {
        this.recentSearches = JSON.parse(savedSearches);
      } catch (e) {}
    }

    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe((term) => {
      this.pageIndex = 0;
      this.cargarArticulos();
      
      if (term && term.trim()) {
        const cleanTerm = term.trim();
        this.recentSearches = this.recentSearches.filter(s => s !== cleanTerm);
        this.recentSearches.unshift(cleanTerm);
        if (this.recentSearches.length > 3) {
          this.recentSearches.pop();
        }
        localStorage.setItem('recentSearches', JSON.stringify(this.recentSearches));
      }
    });

    this.searchIdSubscription = this.searchIdSubject.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe((term) => {
      this.ejecutarBusquedaPorId(term);
    });
    
    this.isAdmin = this.authService.isAdmin();

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
    if (this.searchIdSubscription) {
      this.searchIdSubscription.unsubscribe();
    }
  }

  cargarArticulos(): void {
    this.articleService.getArticles(
      this.terminoBusqueda, 
      '', 
      this.pageIndex + 1, 
      this.pageSize, 
      this.mostrarEliminados, 
      this.empresaFilter,
      this.sortField,
      this.sortOrder
    ).subscribe(response => {
      this.articulosPaginados = Array.isArray(response) ? response : (response.data || []);
      this.totalArticles = response.meta?.total_items !== undefined ? response.meta.total_items : (response.total !== undefined ? response.total : this.articulosPaginados.length);
    });
  }

  public terminoBusquedaId: string = '';

  toggleVerEliminados(): void {
    this.mostrarEliminados = !this.mostrarEliminados;
    this.pageIndex = 0;
    if (this.terminoBusquedaId) {
      this.onBuscarPorId();
    } else {
      this.cargarArticulos();
    }
  }

  onBuscar(): void {
    if (this.terminoBusquedaId) {
      this.terminoBusquedaId = ''; // Limpiar ID si usan la búsqueda general
    }
    this.searchSubject.next(this.terminoBusqueda);
  }

  onBuscarPorId(): void {
    if (this.terminoBusqueda) {
      this.terminoBusqueda = ''; // Limpiamos el texto general
    }
    this.searchIdSubject.next(this.terminoBusquedaId);
  }

  ejecutarBusquedaPorId(termId: string): void {
    const term = termId.trim();
    if (!term) {
      this.cargarArticulos();
      return;
    }

    this.articleService.getArticleById(term).subscribe({
      next: (response: any) => {
        const product = (response && response.data) ? response.data : response;
        if (product && (product.id || product.nombre)) {
          // Respetar el tab actual de eliminados/activos
          const isDeleted = (product.deletedAt != null && product.deletedAt !== '') || 
                            product.isActive === false || 
                            product.isActive === 0 || 
                            product.isActive === '0' || 
                            product.isActive === 'false';
          
          if (this.mostrarEliminados && isDeleted) {
            this.articulosPaginados = [product];
          } else if (!this.mostrarEliminados && !isDeleted) {
            this.articulosPaginados = [product];
          } else {
            this.articulosPaginados = []; // Está en el estado opuesto
          }
          this.totalArticles = this.articulosPaginados.length;
        } else {
          this.articulosPaginados = [];
          this.totalArticles = 0;
        }
      },
      error: () => {
        this.articulosPaginados = [];
        this.totalArticles = 0;
      }
    });
  }

  clearSearchId(): void {
    this.terminoBusquedaId = '';
    this.pageIndex = 0;
    this.cargarArticulos();
  }

  toggleHighlight(id: number, event?: Event): void {
    if (event) {
      const target = event.target as HTMLElement;
      // Evitar resaltar si se hizo clic en un botón de acción
      if (target.closest('.actions-cell') || target.closest('button')) {
        return;
      }
    }

    if (this.highlightedArticleId === id) {
      this.highlightedArticleId = null;
    } else {
      this.highlightedArticleId = id;
    }
  }

  onSelectRecentSearch(term: string): void {
    this.terminoBusqueda = term;
    this.showRecentSearches = false;
    this.onBuscar();
  }

  onSearchBlur(): void {
    setTimeout(() => {
      this.showRecentSearches = false;
    }, 200);
  }

  onEmpresaChange(empresa: string): void {
    this.empresaFilter = empresa;
    this.pageIndex = 0;
    this.cargarArticulos();
  }

  clearSearch(): void {
    this.terminoBusqueda = '';
    this.onBuscar();
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
    this.articleToDeleteId = articulo.id as number;
    this.confirmMessage = `¿Estás seguro de que deseas desactivar el producto "${articulo.nombre}"?`;
    this.confirmActionType = 'delete';
    this.showConfirmModal = true;
  }

  verDetalles(articulo: Article): void {
    this.scannedArticle = articulo;
    this.showScannedDetailsModal = true;
  }

  onRestore(articulo: Article): void {
    this.articleToRestoreId = articulo.id as number;
    this.confirmMessage = `¿Estás seguro de que deseas restaurar el producto "${articulo.nombre}" al listado activo?`;
    this.confirmActionType = 'restore';
    this.showConfirmModal = true;
  }

  onConfirmAction(): void {
    if (this.confirmActionType === 'delete') {
      this.onConfirmDelete();
    } else {
      this.onConfirmRestore();
    }
  }

  onConfirmDelete(): void {
    if (this.articleToDeleteId && !this.isDeleting) {
      this.isDeleting = true;
      this.articleService.deleteArticle(this.articleToDeleteId).subscribe({
        next: () => {
          this.cargarArticulos();
          this.isDeleting = false;
          this.onCancelDelete();
        },
        error: (err) => {
          console.error('Error al eliminar o producto ya eliminado:', err);
          this.isDeleting = false;
          this.onCancelDelete();
          this.cargarArticulos(); // Recargar para limpiar la lista
        }
      });
    } else {
      this.onCancelDelete();
    }
  }

  onConfirmRestore(): void {
    if (this.articleToRestoreId && !this.isDeleting) {
      this.isDeleting = true;
      this.articleService.restoreArticle(this.articleToRestoreId).subscribe({
        next: () => {
          this.cargarArticulos();
          this.isDeleting = false;
          this.onCancelDelete();
        },
        error: (err) => {
          console.error('Error al restaurar producto', err);
          this.isDeleting = false;
          this.onCancelDelete();
        }
      });
    }
  }

  onCancelDelete(): void {
    this.showConfirmModal = false;
    this.articleToDeleteId = null;
    this.articleToRestoreId = null;
    this.confirmMessage = "";
  }

  onShowBarcode(articulo: Article): void {
    this.selectedArticle = articulo;
    this.showBarcodeModal = true;

    setTimeout(() => {
      if (this.selectedArticle) {
        const idStr = this.selectedArticle.id ? this.selectedArticle.id.toString() : "0";
        JsBarcode("#barcode", idStr, {
          format: "CODE128",
          lineColor: "#000",
          width: 2,
          height: 80,
          displayValue: false,
          margin: 0
        });
      }
    }, 50);
  }

  onCloseBarcodeModal(): void {
    this.showBarcodeModal = false;
    this.selectedArticle = null;
  }

  onPrintBarcode(): void {
    const originalTitle = document.title;
    if (this.selectedArticle && this.selectedArticle.id) {
      document.title = this.selectedArticle.id.toString();
    }
    
    window.print();
    
    // Restaurar el título original de la página para que la pestaña no sufra cambios permanentes
    setTimeout(() => {
      document.title = originalTitle;
    }, 150);
  }

  onOpenScanner(): void {
    this.showScannerModal = true;
  }

  onScanResult(result: string): void {
    this.showScannerModal = false;

    const cleanResult = result.trim();
    const isNumericId = !isNaN(Number(cleanResult)) && Number(cleanResult) > 0 && !cleanResult.includes('.');

    if (isNumericId) {
      // Intentamos obtener el producto directamente por su ID primario (es 100% exacto y rápido)
      this.articleService.getArticleById(cleanResult).subscribe({
        next: (response: any) => {
          // Robustez por si la API lo devuelve envuelto en "data" o directamente
          const product = (response && response.data) ? response.data : response;
          if (product && (product.id || product.nombre)) {
            this.scannedArticle = product;
            this.showScannedDetailsModal = true;
          } else {
            this.buscarPorSerialOTexto(cleanResult);
          }
        },
        error: () => {
          // Si da error (como un 404 porque no existe ese ID), buscamos por texto/serial
          this.buscarPorSerialOTexto(cleanResult);
        }
      });
    } else {
      this.buscarPorSerialOTexto(cleanResult);
    }
  }

  private buscarPorSerialOTexto(termino: string): void {
    this.articleService.getArticles(termino, '', 1, 50).subscribe({
      next: (response) => {
        let data = Array.isArray(response) ? response : (response.data || []);
        const exactMatch = data.find((a: Article) => a.serial === termino || a.id.toString() === termino);

        if (exactMatch) {
          this.scannedArticle = exactMatch;
          this.showScannedDetailsModal = true;
        } else {
          // Si no hay match exacto, usamos el buscador normal
          this.terminoBusqueda = termino;
          this.pageIndex = 0;
          this.cargarArticulos();
        }
      },
      error: () => {
        this.terminoBusqueda = termino;
        this.pageIndex = 0;
        this.cargarArticulos();
      }
    });
  }

  onCloseScanner(): void {
    this.showScannerModal = false;
  }

  onCloseScannedDetails(): void {
    this.showScannedDetailsModal = false;
    this.scannedArticle = null;
  }

  onSort(field: string): void {
    if (this.sortField === field) {
      if (this.sortOrder === 'ASC') {
        this.sortOrder = 'DESC';
      } else {
        // Tercer estado: Volver al orden por defecto (id, DESC)
        this.sortField = 'id';
        this.sortOrder = 'DESC';
      }
    } else {
      this.sortField = field;
      this.sortOrder = 'ASC';
    }
    this.pageIndex = 0;
    this.cargarArticulos();
  }

  getSortIcon(field: string): string {
    if (this.sortField !== field) return 'fa-sort opacity-20';
    return this.sortOrder === 'ASC' ? 'fa-sort-up' : 'fa-sort-down';
  }
}