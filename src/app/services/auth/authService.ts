import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { User, AuthData } from '../../models/user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private mockUser: User = {
    id: 1,
    email: 'ssire006@gmail.com',
    nombre: 'Sirelis',
    apellido: 'Sarmiento',
    foto: '',
  };

  private readonly USER_KEY = 'kanban_user';
  private readonly TOKEN_KEY = 'kanban_token';

  constructor(private router: Router) {
    if (!localStorage.getItem(this.USER_KEY) && this.isAuthenticated()) {
      localStorage.setItem(this.USER_KEY, JSON.stringify(this.mockUser));
   }
  }

  login(email: string, pass: string): boolean {
    if (email === 'ssire006@gmail.com' && pass === '1234') {

      localStorage.setItem('kanban_token', 'true');
      localStorage.setItem(this.USER_KEY, JSON.stringify(this.mockUser)); 
      return true;
    }
    return false;
  }

  logout(): void {
    localStorage.removeItem('kanban_token');
    localStorage.removeItem(this.USER_KEY); 
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('kanban_token');
  }

  getUserProfile(): User | null {
    const userJson = localStorage.getItem(this.USER_KEY); 
    return userJson ? JSON.parse(userJson) : null; 
  }

  updateUserProfile(updatedUser: Partial<User>): void {
    const currentUser = this.getUserProfile(); 
    if (currentUser) {
      const newUser = { ...currentUser, ...updatedUser }; 
      localStorage.setItem(this.USER_KEY, JSON.stringify(newUser)); 
    }
  }

  updatePassword(oldPass: string, newPass: string): boolean {
    if (oldPass === '1234') {
      console.log('Contraseña actualizada con éxito (simulado)');
      return true;
    }
    return false;
  }
}
