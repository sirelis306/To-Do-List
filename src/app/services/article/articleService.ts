import { Injectable } from '@angular/core';
import { Article } from '../../models/article';

@Injectable({
  providedIn: 'root'
})
export class ArticleService {

  private readonly STORAGE_KEY = 'articles';
  private articulos: Article[] = [];

  constructor() {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (data) {
      this.articulos = JSON.parse(data);
    } else {
      this.articulos = [
        { id: 1, nombre: 'Producto A', categoria: 'Categoría A', marca: 'Aaaa', modelo: 'aaa', caracteristicas: 'AA', color: 'negro', serial: 123, condicion: 'nuevo', locacion: 'Logistica' },
        { id: 2, nombre: 'Producto B', categoria: 'Categoría B', marca: 'Bbbb', modelo: 'bbb', caracteristicas: 'BB', color: 'negro', serial: 456, condicion: 'nuevo', locacion: 'Logistica' },
        { id: 3, nombre: 'Producto C', categoria: 'Categoría C', marca: 'Cccc', modelo: 'ccc', caracteristicas: 'CC', color: 'negro', serial: 789, condicion: 'nuevo', locacion: 'Logistica' },
        { id: 4, nombre: 'Producto D', categoria: 'Categoría D', marca: 'Dddd', modelo: 'ddd', caracteristicas: 'DD', color: 'negro', serial: 123, condicion: 'nuevo', locacion: 'Logistica' },
        { id: 5, nombre: 'Producto E', categoria: 'Categoría E', marca: 'Eeee', modelo: 'eee', caracteristicas: 'EE', color: 'negro', serial: 456, condicion: 'nuevo', locacion: 'Logistica' },
        { id: 6, nombre: 'Producto F', categoria: 'Categoría F', marca: 'Ffff', modelo: 'fff', caracteristicas: 'FF', color: 'negro', serial: 789, condicion: 'nuevo', locacion: 'Logistica' }
      ];
      this.guardarArticulos();
    }
  }

  private guardarArticulos(): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.articulos));
  }

  getArticles(busqueda: string): Article[] {
    let articulosFiltrados = [...this.articulos]; 
    
    if (busqueda.trim()) {
      const busquedaLower = busqueda.toLowerCase();
      
      articulosFiltrados = this.articulos.filter(a => 
        (a.id && a.id.toString().includes(busquedaLower)) ||
        (a.nombre && a.nombre.toLowerCase().includes(busquedaLower)) ||
        (a.marca && a.marca.toLowerCase().includes(busquedaLower)) ||
        (a.modelo && a.modelo.toLowerCase().includes(busquedaLower)) ||
        (a.serial && a.serial.toString().includes(busquedaLower)) ||
        (a.locacion && a.locacion.toLowerCase().includes(busquedaLower)) 
      );
    }
    return articulosFiltrados;
  }
  addArticle(nuevoProducto: Partial<Article>): void {
    const productoGuardado: Article = {
      id: Date.now(),
      ...nuevoProducto
    } as Article;
    
    this.articulos.push(productoGuardado);
    this.guardarArticulos(); 
  }

  getArticleById(id: number): Article | undefined {
    return this.articulos.find(a => a.id === id);
  }

  updateArticle(id: number, dataActualizada: Partial<Article>): void {
    const index = this.articulos.findIndex(a => a.id === id);
    if (index !== -1) {
      this.articulos[index] = { ...this.articulos[index], ...dataActualizada };
      this.guardarArticulos();
    }
  }

  deleteArticle(id: number): void {
    this.articulos = this.articulos.filter(a => a.id !== id);
    this.guardarArticulos();
  }
}