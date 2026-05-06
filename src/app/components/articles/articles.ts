import { Component, OnInit, Injectable } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router'; 
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
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

export class Articles implements OnInit {
  public articulosFiltrados: Article[] = [];
  public terminoBusqueda: string = "";
  public categoryFilter: string = "";
  public categoryOptions: string[] = [];
  public showConfirmModal: boolean = false;
  public articleToDeleteId: number | null = null;
  public confirmMessage: string = "";

  public showBarcodeModal: boolean = false;
  public showScannerModal: boolean = false;
  public selectedArticle: Article | null = null;

  public articulosPaginados: Article[] = [];
  public pageSize: number = 10;  
  public pageIndex: number = 0; 
  public pageSizeOptions = [5, 10, 25];

  constructor(private router: Router, private articleService: ArticleService, private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.articleService.getArticles("").subscribe(allArticles => {
      this.categoryOptions = [...new Set(allArticles.map(a => a.categoria))].filter(c => c);
      this.onBuscar(); 
    });

    // Auto-abrir escáner si viene de parámetro
    this.route.queryParams.subscribe(params => {
      if (params['scan'] === 'true' || params['scan'] === true) {
        this.showScannerModal = true;
        // Limpiar el parámetro para permitir volver a activarlo al hacer clic
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { scan: null },
          queryParamsHandling: 'merge'
        });
      }
    });
  }

  onBuscar(): void {
    this.articleService.getArticles(this.terminoBusqueda).subscribe(results => {
      let filteredResults = results;
      
      // Filtrado local por término de búsqueda (si la API no lo hace)
      if (this.terminoBusqueda.trim()) {
        const busquedaLower = this.terminoBusqueda.toLowerCase();
        filteredResults = filteredResults.filter(a => 
          (a.id && a.id.toString().includes(busquedaLower)) ||
          (a.nombre && a.nombre.toLowerCase().includes(busquedaLower)) ||
          (a.marca && a.marca.toLowerCase().includes(busquedaLower)) ||
          (a.modelo && a.modelo.toLowerCase().includes(busquedaLower)) ||
          (a.serial && a.serial.toLowerCase().includes(busquedaLower)) ||
          (a.locacion && a.locacion.toLowerCase().includes(busquedaLower))
        );
      }

      if (this.categoryFilter) {
        filteredResults = filteredResults.filter(a => a.categoria === this.categoryFilter);
      }

      this.articulosFiltrados = filteredResults;
      this.pageIndex = 0;
      this.actualizarVistaPaginada();
    });
  }

  actualizarVistaPaginada(): void {
    const startIndex = this.pageIndex * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.articulosPaginados = this.articulosFiltrados.slice(startIndex, endIndex);
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.actualizarVistaPaginada();
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
        this.onBuscar(); 
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
    this.onBuscar();
    
    // Si solo hay un resultado, podríamos seleccionarlo o dar feedback
    if (this.articulosFiltrados.length === 0) {
      // Tal vez el serial es numérico y el resultado es texto
      const serialNum = parseInt(result);
      if (!isNaN(serialNum)) {
        this.terminoBusqueda = serialNum.toString();
        this.onBuscar();
      }
    }
  }

  onCloseScanner(): void {
    this.showScannerModal = false;
  }
}