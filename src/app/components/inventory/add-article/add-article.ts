import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Article } from '../../../models/article';
import { ArticleService } from '../../../services/article/articleService';


import { CustomDropdown } from '../../shared/custom-dropdown/custom-dropdown';

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
  public idArticuloActual: number | null = null;
  public opcionesCondicion: string[] = ['Nuevo', 'Usado', 'Defectuoso', 'Dañado'];
  public opcionesEmpresa: string[] = ['JPL', 'PAFAR', '3D3', 'TecnoLab Kids'];

  public nuevoProducto: Partial<Article> = {
    nombre: '',
    categoria: '',
    marca: '',
    modelo: '',
    caracteristicas: '',
    color: '',
    serial: null,
    condicion: 'Nuevo',
    locacion: '',
    cantidad: 1,
    empresa: 'JPL'
  };

  public showSuccessModal: boolean = false;
  public showErrorModal: boolean = false;
  public modalTitle: string = "";
  public modalMessage: string = "";
  public isSaving: boolean = false;
  public submitted: boolean = false;

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
    this.submitted = true;

    // Validación manual simple antes de proceder
    if (!this.nuevoProducto.nombre || !this.nuevoProducto.categoria || !this.nuevoProducto.marca ||
      !this.nuevoProducto.modelo || !this.nuevoProducto.condicion ||
      !this.nuevoProducto.color || !this.nuevoProducto.locacion || !this.nuevoProducto.caracteristicas) {

      this.modalTitle = "Faltan datos";
      this.modalMessage = "Por favor, completa todos los campos obligatorios resaltados en rojo.";
      this.showErrorModal = true;
      return;
    }

    // Validación: El campo de color no debe contener números
    if (this.nuevoProducto.color && /\d/.test(this.nuevoProducto.color)) {
      this.modalTitle = "Color Inválido";
      this.modalMessage = "El campo 'Color' no puede contener números. Por favor, ingresa un nombre de color válido.";
      this.showErrorModal = true;
      return;
    }

    if (this.isSaving) return;
    this.isSaving = true;

    // Asegurar que el serial se envíe como null si no está lleno
    if (!this.nuevoProducto.serial || !this.nuevoProducto.serial.trim()) {
      this.nuevoProducto.serial = null;
    } else {
      this.nuevoProducto.serial = this.nuevoProducto.serial.trim();
    }

    // Asegurar que la fecha de registro se envíe como null si no está llena
    if (!this.nuevoProducto.registeredAt || !this.nuevoProducto.registeredAt.trim()) {
      this.nuevoProducto.registeredAt = null as any;
    }

    if (this.modoEdicion && this.idArticuloActual) {
      this.articleService.updateArticle(this.idArticuloActual, this.nuevoProducto).subscribe({
        next: () => {
          this.isSaving = false;
          this.modalTitle = "¡Cambios Guardados!";
          this.modalMessage = "El producto ha sido actualizado correctamente.";
          this.showSuccessModal = true;
        },
        error: () => {
          this.isSaving = false;
        }
      });
    } else {
      this.articleService.addArticle(this.nuevoProducto).subscribe({
        next: () => {
          this.isSaving = false;
          this.modalTitle = "¡Producto Registrado!";
          this.modalMessage = "El nuevo producto ha sido agregado al inventario.";
          this.showSuccessModal = true;
        },
        error: () => {
          this.isSaving = false;
        }
      });
    }
  }

  onCloseSuccess() {
    this.showSuccessModal = false;
    this.router.navigate(['/articles']);
  }

  onCloseError() {
    this.showErrorModal = false;
  }

  onRegresarClick(): void {
    this.router.navigate(['/articles']);
  }
}
