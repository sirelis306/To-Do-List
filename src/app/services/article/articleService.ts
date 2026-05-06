import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Article } from '../../models/article';

@Injectable({
  providedIn: 'root'
})
export class ArticleService {

  private apiUrl = '/api/products';

  constructor(private http: HttpClient) { }

  /* Obtiene la lista de productos desde la API */
  getArticles(busqueda: string = ''): Observable<Article[]> {
    return this.http.get<any>(this.apiUrl).pipe(
      map(response => {
        // Si la API devuelve un array directamente, lo usamos.
        // Si devuelve un objeto con propiedad 'data' (común en paginación o recursos), usamos 'data'.
        if (Array.isArray(response)) {
          return response;
        } else if (response && response.data && Array.isArray(response.data)) {
          return response.data;
        } else {
          console.warn('Estructura de respuesta de API no esperada:', response);
          return [];
        }
      })
    );
  }

  getArticleById(id: number | string): Observable<Article> {
    return this.http.get<Article>(`${this.apiUrl}/${id}`);
  }

  addArticle(nuevoProducto: Partial<Article>): Observable<Article> {
    return this.http.post<Article>(this.apiUrl, nuevoProducto);
  }

  updateArticle(id: number | string, dataActualizada: Partial<Article>): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, dataActualizada);
  }

  deleteArticle(id: number | string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
