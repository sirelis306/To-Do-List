import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router'; 
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Article } from '../../models/article';
import { ArticleService} from '../../services/article/articleService';


import { CustomDropdown } from '../custom-dropdown/custom-dropdown';

@Component({
  selector: 'app-add-article',
  standalone: true,
  imports: [CommonModule, FormsModule, CustomDropdown],
  templateUrl: './add-article.html',
  styleUrl: './add-article.css',
})
export class AddArticle implements OnInit {
  public modoEdicion: boolean = false;
  public tituloPagina: string = "Nuevo Producto";
  private idArticuloActual: number | null = null;
  public opcionesCondicion: string[] = ['Nuevo', 'Usado'];

  public nuevoProducto: Partial<Article> = {
    nombre: '',
    categoria: '',
    marca: '',
    modelo: '',
    caracteristicas: '',
    color: '',
    serial: null,
    condicion: '',
    locacion: '',
  };

  public showSuccessModal: boolean = false;
  public modalTitle: string = "";
  public modalMessage: string = "";

  constructor(private router: Router, private articleService: ArticleService, private route: ActivatedRoute) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    
    if (id) {
      this.modoEdicion = true;
      this.tituloPagina = "Editar Producto";
      this.idArticuloActual = +id; 
      
      this.articleService.getArticleById(this.idArticuloActual).subscribe(articuloExistente => {
        if (articuloExistente) {
          this.nuevoProducto = { ...articuloExistente };
        } else {
          this.router.navigate(['/articles']);
        }
      });
      
    } else {
      this.modoEdicion = false;
      this.tituloPagina = "Nuevo Producto";
    }
  }

  onGuardar(): void {
    if (this.modoEdicion && this.idArticuloActual) {
      this.articleService.updateArticle(this.idArticuloActual, this.nuevoProducto).subscribe(() => {
        this.modalTitle = "¡Cambios Guardados!";
        this.modalMessage = "El producto ha sido actualizado correctamente.";
        this.showSuccessModal = true;
      });
    } else {
      this.articleService.addArticle(this.nuevoProducto).subscribe(() => {
        this.modalTitle = "¡Producto Registrado!";
        this.modalMessage = "El nuevo producto ha sido agregado al inventario.";
        this.showSuccessModal = true;
      });
    }
  }

  onCloseSuccess() {
    this.showSuccessModal = false;
    this.router.navigate(['/articles']);
  }

  onRegresarClick(): void {
    this.router.navigate(['/articles']);
  }
}