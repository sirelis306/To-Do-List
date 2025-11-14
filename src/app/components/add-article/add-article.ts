import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router'; 
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Article } from '../../models/article';
import { ArticleService} from '../../services/article/articleService';


@Component({
  selector: 'app-add-article',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-article.html',
  styleUrl: './add-article.css',
})
export class AddArticle implements OnInit {
  public modoEdicion: boolean = false;
  public tituloPagina: string = "Nuevo Producto";
  private idArticuloActual: number | null = null;

  public nuevoProducto: Partial<Article> = {
    codigo: 0,
    nombre: '',
    marca: '',
    modelo: '',
    serial: 0,
    sede: '',
    oficina: '',
    detalle: '',
  };

  constructor(private router: Router, private articleService: ArticleService, private route: ActivatedRoute) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    
    if (id) {
      this.modoEdicion = true;
      this.tituloPagina = "Editar Producto";
      this.idArticuloActual = +id; 
      
      const articuloExistente = this.articleService.getArticleById(this.idArticuloActual);
      if (articuloExistente) {
        this.nuevoProducto = { ...articuloExistente };
      } else {
        this.router.navigate(['/articles']);
      }
      
    } else {
      this.modoEdicion = false;
      this.tituloPagina = "Nuevo Producto";
    }
  }

  onGuardar(): void {
    if (this.modoEdicion && this.idArticuloActual) {
      this.articleService.updateArticle(this.idArticuloActual, this.nuevoProducto);
    } else {
      this.articleService.addArticle(this.nuevoProducto);
    }
    this.router.navigate(['/articles']);
  }

  onRegresarClick(): void {
    this.router.navigate(['/articles']);
  }
}