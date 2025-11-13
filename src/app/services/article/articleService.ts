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
        { id: 1, codigo: 123, nombre: 'Producto A', marca: 'Aaaa', modelo: 'aaa', serial: 123 },
        { id: 2, codigo: 124, nombre: 'Producto B', marca: 'Bbbb', modelo: 'bbb', serial: 456 }
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
        (a.codigo && a.codigo.toString().includes(busquedaLower)) ||
        (a.nombre && a.nombre.toLowerCase().includes(busquedaLower)) ||
        (a.marca && a.marca.toLowerCase().includes(busquedaLower)) ||
        (a.modelo && a.modelo.toLowerCase().includes(busquedaLower)) ||
        (a.serial && a.serial.toString().includes(busquedaLower)) 
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