import { Component, OnInit, Injectable } from '@angular/core';
import { Router } from '@angular/router'; 
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Article } from '../../models/article';
import { ArticleService } from '../../services/article/articleService'; 
import { MatPaginatorModule, PageEvent, MatPaginatorIntl } from '@angular/material/paginator';


@Injectable()
export class MyPaginatorIntl extends MatPaginatorIntl {
  override itemsPerPageLabel = 'Artículos por página:';
}

@Component({
  selector: 'app-articles',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatPaginatorModule],
  templateUrl: './articles.html',
  styleUrl: './articles.css',
  providers: [
    { provide: MatPaginatorIntl, useClass: MyPaginatorIntl }
  ]
})

export class Articles implements OnInit {
  public articulosFiltrados: Article[] = [];
  public terminoBusqueda: string = "";
  public showConfirmModal: boolean = false;
  public articleToDeleteId: number | null = null;
  public confirmMessage: string = "";

  public articulosPaginados: Article[] = [];
  public pageSize: number = 10;  
  public pageIndex: number = 0; 
  public pageSizeOptions = [5, 10, 25];

  constructor(private router: Router, private articleService: ArticleService) { }

  ngOnInit(): void {
    this.onBuscar(); 
  }

  onBuscar(): void {
    this.articulosFiltrados = this.articleService.getArticles(this.terminoBusqueda);
    this.pageIndex = 0;
    this.actualizarVistaPaginada();
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
      this.articleService.deleteArticle(this.articleToDeleteId);
      this.onBuscar(); 
    }
    this.onCancelDelete();
  }

  onCancelDelete(): void {
    this.showConfirmModal = false;
    this.articleToDeleteId = null;
    this.confirmMessage = "";
  }
}