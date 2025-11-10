import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class Auth {

  constructor(private router: Router) { }

  login(email: string, pass: string): boolean {
    if (email === 'ssire006@gmail.com' && pass === '1234') {

      localStorage.setItem('kanban_token', 'true');
      return true;
    }
    return false;
  }

  logout(): void {
    localStorage.removeItem('kanban_token');
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('kanban_token');
  }
}
