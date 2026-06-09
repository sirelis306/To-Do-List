import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { Sidebar } from './components/shared/sidebar/sidebar';
import { filter } from 'rxjs/operators';
import { Chatbot } from './components/chatbot/chatbot';
import { AuthService } from './services/auth/authService';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, Sidebar, Chatbot],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  public showSidebar: boolean = false; 
  public isSidebarCollapsed: boolean = false;
  public showPasswordWarning: boolean = false;
  public isNewUser: boolean = false;

  constructor(private router: Router, private authService: AuthService) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      const url = event.urlAfterRedirects || event.url;
      this.showSidebar = !url.includes('/login');
      
      this.verificarCambioContrasena();

      if (window.innerWidth <= 768) {
        this.isSidebarCollapsed = true;
      }
    });

    if (window.innerWidth <= 768) {
      this.isSidebarCollapsed = true;
    }
  }

  verificarCambioContrasena(): void {
    const user = this.authService.getUserProfile();
    const isProfilePage = this.router.url.includes('/profile');
    const isLoginPage = this.router.url === '/login';

    if (user && user.mustChangePassword && !isProfilePage && !isLoginPage) {
      this.showPasswordWarning = true;
      
      // Si fue creado hace menos de 2 días, consideramos que es bienvenida
      if (user.createdAt) {
        const createdDate = new Date(user.createdAt);
        const now = new Date();
        const diffDays = Math.ceil(Math.abs(now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
        this.isNewUser = diffDays <= 2;
      } else {
        this.isNewUser = true; // Por defecto si no hay fecha, asumimos bienvenida
      }
    } else {
      this.showPasswordWarning = false;
    }
  }

  goToProfile(): void {
    this.showPasswordWarning = false;
    this.router.navigate(['/profile']);
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }
}