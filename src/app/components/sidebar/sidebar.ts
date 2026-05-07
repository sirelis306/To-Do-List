import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router'; 
import { CommonModule } from '@angular/common'; 
import { AuthService } from '../../services/auth/authService';

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
  standalone: true,
})
export class Sidebar implements OnInit {
  @Input() isCollapsed: boolean = false;
  @Output() toggleCollapsed = new EventEmitter<void>();

  constructor(private authService: AuthService) { }

  ngOnInit(): void {
    // Forzar la actualización del perfil para asegurar que tenemos los roles correctos
    if (this.authService.isAuthenticated()) {
      this.authService.getMe().subscribe();
    }
  }

  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  onLogout(): void {
    this.authService.logout();
  }

  onToggleSidebar(): void {
    this.toggleCollapsed.emit();
  }

  closeOnMobile(): void {
    if (window.innerWidth <= 768 && !this.isCollapsed) {
      this.toggleCollapsed.emit();
    }
  }
}
