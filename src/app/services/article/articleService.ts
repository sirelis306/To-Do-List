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
        { id: 1, codigo: 123, nombre: 'Producto A', marca: 'Aaaa', modelo: 'aaa', serial: 123, sede: 'El Recreo', oficina: 'Logistica', detalle: 'Estante 1' },
        { id: 2, codigo: 124, nombre: 'Producto B', marca: 'Bbbb', modelo: 'bbb', serial: 456, sede: 'El Recreo', oficina: 'Logistica', detalle: 'Estante 2' },
        { id: 3, codigo: 125, nombre: 'Producto C', marca: 'Cccc', modelo: 'ccc', serial: 789, sede: 'El Recreo', oficina: 'Logistica', detalle: 'Estante 3' },
        { id: 4, codigo: 126, nombre: 'Producto D', marca: 'Dddd', modelo: 'ddd', serial: 123, sede: 'El Recreo', oficina: 'Logistica', detalle: 'Estante 4' },
        { id: 5, codigo: 127, nombre: 'Producto E', marca: 'Eeee', modelo: 'eee', serial: 456, sede: 'El Recreo', oficina: 'Logistica', detalle: 'Estante 5' },
        { id: 6, codigo: 128, nombre: 'Producto F', marca: 'Ffff', modelo: 'fff', serial: 789, sede: 'El Recreo', oficina: 'Logistica', detalle: 'Estante 6' }
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
        (a.serial && a.serial.toString().includes(busquedaLower)) ||
        (a.sede && a.sede.toLowerCase().includes(busquedaLower)) ||
        (a.oficina && a.oficina.toLowerCase().includes(busquedaLower)) 
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