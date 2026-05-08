import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { Sidebar } from './components/sidebar/sidebar';
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

  constructor(private router: Router, private authService: AuthService) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.showSidebar = (event.url !== '/login');
      
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