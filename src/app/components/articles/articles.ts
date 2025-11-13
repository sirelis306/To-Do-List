import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router'; 
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Article } from '../../models/article';
import { ArticleService } from '../../services/article/articleService'; 

@Component({
  selector: 'app-articles',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './articles.html',
  styleUrl: './articles.css',
})

export class Articles implements OnInit {
  public articulosFiltrados: Article[] = [];
  public terminoBusqueda: string = "";
  public showConfirmModal: boolean = false;
  public articleToDeleteId: number | null = null;
  public confirmMessage: string = "";

  constructor(private router: Router, private articleService: ArticleService) { }

  ngOnInit(): void {
    this.onBuscar(); 
  }

  onBuscar(): void {
    this.articulosFiltrados = this.articleService.getArticles(this.terminoBusqueda);
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
      this.onBuscar(); // Refresca la lista
    }
    this.onCancelDelete();
  }

  onCancelDelete(): void {
    this.showConfirmModal = false;
    this.articleToDeleteId = null;
    this.confirmMessage = "";
  }
}