import { Component, OnInit, OnDestroy, Injectable } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { AuthService } from '../../services/auth/authService';
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
  public empresaFilter: string = "";
  public opcionesEmpresa: string[] = ['JPL', 'PAFAR', '3D3'];
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

  private searchSubject = new Subject<string>();
  private searchSubscription!: Subscription;

  constructor(private router: Router, private articleService: ArticleService, private route: ActivatedRoute, private authService: AuthService) { }

  ngOnInit(): void {
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(() => {
      this.pageIndex = 0;
      this.cargarArticulos();
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
      let data = Array.isArray(response) ? response : (response.data || []);

      // Filtro de seguridad por si la API no filtra correctamente
      if (this.mostrarEliminados) {
        this.articulosPaginados = data.filter((a: Article) => a.deletedAt !== null);
      } else {
        this.articulosPaginados = data.filter((a: Article) => a.deletedAt === null);
      }
      
      this.totalArticles = response.meta?.total_items !== undefined ? response.meta.total_items : (response.total !== undefined ? response.total : this.articulosPaginados.length);
    });
  }

  toggleVerEliminados(): void {
    this.mostrarEliminados = !this.mostrarEliminados;
    this.pageIndex = 0;
    this.cargarArticulos();
  }

  onBuscar(): void {
    this.searchSubject.next(this.terminoBusqueda);
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

    // Hacemos la búsqueda rápida del producto escaneado
    this.articleService.getArticles(result, '', 1, 50).subscribe(response => {
      let data = Array.isArray(response) ? response : (response.data || []);

      const exactMatch = data.find((a: Article) => a.serial === result || a.id.toString() === result);

      if (exactMatch) {
        // Mostramos el modal de detalles
        this.scannedArticle = exactMatch;
        this.showScannedDetailsModal = true;
      } else {
        // Si no hay match exacto, usamos el buscador normal
        this.terminoBusqueda = result;
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