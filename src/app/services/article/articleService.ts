import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Article } from '../../models/article';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ArticleService {

  private apiUrl = `${environment.apiUrl}/products`;

  constructor(private http: HttpClient) { }

  /* Obtiene la lista de productos desde la API con paginación y búsqueda */
  getArticles(busqueda: string = '', category: string = '', page: number = 1, limit: number = 10, deleted: boolean = false, empresa: string = ''): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString())
      .set('per_page', limit.toString())
      .set('size', limit.toString());

    if (deleted) {
      params = params.set('only_deleted', '1');
    }

    if (busqueda) {
      params = params.set('search', busqueda);
    }
    if (category) {
      params = params.set('category', category);
    }
    if (empresa) {
      params = params.set('empresa', empresa);
    }

    return this.http.get<any>(this.apiUrl, { params });
  }

  getArticleById(id: number | string): Observable<Article | undefined> {
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

  restoreArticle(id: number | string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/toggle-active`, {});
  }
}
