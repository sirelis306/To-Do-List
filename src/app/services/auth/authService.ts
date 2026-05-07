import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';
import { User, UserRole } from '../../models/user';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;

  private readonly USER_KEY = 'kanban_user';
  private readonly TOKEN_KEY = 'kanban_token';
  private readonly REFRESH_TOKEN_KEY = 'kanban_refresh_token';

  constructor(private router: Router, private http: HttpClient) { }

  /* Inicia sesión en la API y guarda el token */
  login(email: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap(res => {
        if (res.token) {
          localStorage.setItem(this.TOKEN_KEY, res.token);
          localStorage.setItem('authorized', res.token);
          
          if (res.user) {
            localStorage.setItem(this.USER_KEY, JSON.stringify(res.user));
          }

          if (res.refresh_token) {
            localStorage.setItem(this.REFRESH_TOKEN_KEY, res.refresh_token);
          }
        }
      })
    );
  }

  /* Registra un nuevo usuario */
  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, userData);
  }

  /* Obtiene el perfil del usuario actual */
  getMe(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/me`).pipe(
      tap((userData: any) => {
        // Asegurar que actualizamos el localStorage con los datos más recientes del usuario,
        // incluyendo los roles, para que el sidebar pueda leerlos correctamente.
        const currentLocal = this.getUserProfile() || {};
        const updated = { ...currentLocal, ...userData };
        localStorage.setItem(this.USER_KEY, JSON.stringify(updated));
      })
    );
  }

  /* Solicita enlace de restablecimiento de contraseña */
  requestReset(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl.replace('/api', '')}/reset-password`, { email });
  }

  /* Confirma el restablecimiento de contraseña con el token */
  resetPasswordConfirm(token: string, newPassword: string): Observable<any> {
    const body = {
      plainPassword: {
        first: newPassword,
        second: newPassword
      }
    };
    return this.http.post(`${this.apiUrl.replace('/api', '')}/reset-password/reset/${token}`, body);
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

  getUserRole(): any {
    const user = this.getUserProfile();
    return user ? (user.roles || user.role) : null;
  }

  isAdmin(): boolean {
    const roles = this.getUserRole();
    if (Array.isArray(roles)) {
      return roles.includes('ROLE_SUPER_ADMIN') || roles.includes('ROLE_ADMIN');
    }
    return roles === 'admin' || roles === 'superadmin' || roles === 'ROLE_SUPER_ADMIN' || roles === 'ROLE_ADMIN';
  }

  getUserProfile(): User | null {
    const userJson = localStorage.getItem(this.USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
  }

  isSuperAdmin(): boolean {
    const roles = this.getUserRole();
    if (Array.isArray(roles)) {
      return roles.includes('ROLE_SUPER_ADMIN');
    }
    return roles === 'superadmin' || roles === 'ROLE_SUPER_ADMIN';
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
