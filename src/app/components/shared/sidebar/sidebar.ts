import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router'; 
import { CommonModule } from '@angular/common'; 
import { AuthService } from '../../../services/auth/authService';
import { WebmailService } from '../../../services/webmail/webmailService';
import { ChatService } from '../../../services/chat/chatService';
import { Router, NavigationEnd } from '@angular/router';

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
  public isWebmailLoading: boolean = false;
  public unreadChatCount: number = 0;

  constructor(
    private authService: AuthService, 
    private webmailService: WebmailService,
    private chatService: ChatService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Forzar la actualización del perfil para asegurar que tenemos los roles correctos
    if (this.authService.isAuthenticated()) {
      this.authService.getMe().subscribe();
      
      // Suscribirse a cambios de ruta para resetear el contador si entramos a chat
      this.router.events.subscribe((event) => {
        if (event instanceof NavigationEnd) {
          if (event.urlAfterRedirects.includes('/chat')) {
            this.unreadChatCount = 0;
          }
        }
      });

      if (this.router.url.includes('/chat')) {
        this.unreadChatCount = 0;
      } else {
        // Obtener la cantidad global de mensajes no leídos
        this.chatService.getGlobalUnreadCount().subscribe({
          next: (res: any) => {
            this.unreadChatCount = typeof res === 'number' ? res : (res.count || res.unreadCount || res.total || 0);
          },
          error: (err) => console.error('Error obteniendo conteo de mensajes no leídos', err)
        });
      }
    }
  }

  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  get canViewInventory(): boolean {
    return this.authService.isAdmin() || this.authService.isLogistics();
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

  onOpenWebmail(): void {
    if (this.isWebmailLoading) return;
    
    this.isWebmailLoading = true;
    this.webmailService.getSSOToken().subscribe({
      next: (res) => {
        this.isWebmailLoading = false;
        // La URL de login de cPanel Webmail con SSO suele tener este formato:
        const url = `https://${res.hostname}:2096${res.token}/login/?session=${res.session}`;
        window.open(url, '_blank');
      },
      error: (err) => {
        this.isWebmailLoading = false;
        console.error('Error al generar token SSO para webmail', err);
        // Fallback a la URL normal en caso de error
        window.open('https://www.pafar.com.ve:2096/', '_blank');
      }
    });
  }
}
