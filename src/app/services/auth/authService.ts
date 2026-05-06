import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';
import { User, UserRole } from '../../models/user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = '/api';

  private readonly USER_KEY = 'kanban_user';
  private readonly TOKEN_KEY = 'kanban_token';
  private readonly REFRESH_TOKEN_KEY = 'kanban_refresh_token';

  constructor(private router: Router, private http: HttpClient) { }

  /* Inicia sesión en la API y guarda el token */
  login(email: string, password: string): Observable<any> {
    console.log('Intentando login en:', `${this.apiUrl}/login`);
    console.log('Con datos:', { email, password });

    return this.http.post<any>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap(res => {
        console.log('Respuesta de API recibida:', res);
        if (res.token) {
          localStorage.setItem(this.TOKEN_KEY, res.token);
          localStorage.setItem('authorized', res.token);
          if (res.refresh_token) {
            localStorage.setItem(this.REFRESH_TOKEN_KEY, res.refresh_token);
          }
        }
      }),
      catchError(err => {
        console.error('Error en la petición de login:', err);
        throw err;
      })
    );
  }

  /* Refresca el token JWT usando el refresh_token almacenado */
  refreshToken(): Observable<any> {
    const refresh_token = localStorage.getItem(this.REFRESH_TOKEN_KEY);
    if (!refresh_token) return of(null);

    return this.http.post<any>(`${this.apiUrl}/token/refresh`, { refresh_token }).pipe(
      tap(res => {
        if (res.token) {
          localStorage.setItem(this.TOKEN_KEY, res.token);
          localStorage.setItem(this.REFRESH_TOKEN_KEY, res.refresh_token);
        }
      }),
      catchError(err => {
        this.logout();
        throw err;
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem(this.TOKEN_KEY);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY) || localStorage.getItem('authorized');
  }

  getUserRole(): UserRole | null {
    const user = this.getUserProfile();
    return user ? user.role : null;
  }

  isAdmin(): boolean {
    const role = this.getUserRole();
    return role === 'admin' || role === 'superadmin';
  }

  getUserProfile(): User | null {
    const userJson = localStorage.getItem(this.USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
  }

  isSuperAdmin(): boolean {
    return this.getUserRole() === 'superadmin';
  }

  updateUserProfile(updatedUser: Partial<User>): void {
    const currentUser = this.getUserProfile();
    if (currentUser) {
      const newUser = { ...currentUser, ...updatedUser } as User;
      localStorage.setItem(this.USER_KEY, JSON.stringify(newUser));
    }
  }

  updatePassword(oldPass: string, newPass: string): boolean {
    console.log('Intento de actualización de contraseña');
    return true;
  }
}
