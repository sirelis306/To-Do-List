import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../services/user/userService';
import { AuthService } from '../../../services/auth/authService';
import { User } from '../../../models/user';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { CustomDropdown } from '../../shared/custom-dropdown/custom-dropdown';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatPaginatorModule, CustomDropdown],
  templateUrl: './users.html',
  styleUrl: './users.css'
})
export class Users implements OnInit, OnDestroy {
  public roleOptions = [
    { label: 'Super Admin', value: 'superadmin' },
    { label: 'Administrador', value: 'admin' },
    { label: 'Logística', value: 'logistics' },
    { label: 'Regular', value: 'regular' }
  ];
  users: User[] = [];
  totalUsers: number = 0;
  isSuperAdmin: boolean = false;
  isAdminUser: boolean = false;
  
  searchTerm: string = '';
  roleFilter: string = '';
  private searchSubject = new Subject<string>();
  private searchSubscription!: Subscription;

  // Paginación
  pageSize: number = 10;
  pageIndex: number = 0;
  pageSizeOptions = [10, 25, 50, 100];

  public showUserDetailsModal: boolean = false;
  public selectedUser: User | null = null;

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.isSuperAdmin = this.authService.isSuperAdmin();
    this.isAdminUser = this.authService.isAdmin();

    // Si no es administrador, redirigir al tablero
    if (!this.isAdminUser) {
      console.warn('Acceso denegado: Se requieren permisos de administrador.');
      this.router.navigate(['/board']);
      return;
    }
    
    // Configurar debounce para el buscador
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(() => {
      this.pageIndex = 0;
      this.cargarUsuarios();
    });

    this.cargarUsuarios();
  }

  ngOnDestroy(): void {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }

  cargarUsuarios(): void {
    // Convertimos filtros de vista a valores esperados por API
    let apiRole = '';
    if (this.roleFilter === 'superadmin') apiRole = 'ROLE_SUPER_ADMIN';
    else if (this.roleFilter === 'admin') apiRole = 'ROLE_ADMIN';
    else if (this.roleFilter === 'logistics') apiRole = 'ROLE_LOGISTICS';
    else if (this.roleFilter === 'regular') apiRole = 'ROLE_USER';

    this.userService.getUsers(this.pageIndex + 1, this.pageSize, this.searchTerm, apiRole).subscribe(
      (response) => {
        let data = Array.isArray(response) ? response : (response.data || []);
        this.totalUsers = response.meta?.total_items !== undefined ? response.meta.total_items : (response.total !== undefined ? response.total : data.length);

        this.users = data.map((u: any) => ({
          ...u,
          nombre: u.name || u.nombre,
          apellido: u.surname || u.apellido,
          role: (() => {
            const roles = Array.isArray(u.roles) ? u.roles : (typeof u.roles === 'string' ? [u.roles] : (typeof u.role === 'string' ? [u.role] : []));
            if (roles.includes('ROLE_SUPER_ADMIN') || roles.includes('SUPER_ADMIN')) return 'superadmin';
            if (roles.includes('ROLE_ADMIN') || roles.includes('ADMIN')) return 'admin';
            if (roles.includes('ROLE_LOGISTICS') || roles.includes('LOGISTICS')) return 'logistics';
            return 'regular';
          })(),
          cargo: 'Usuario',
          estado: (u.isActive === true || u.active === true || u.enabled === true || u.isActive === 1) ? 'Activo' : 'Inactivo'
        }));
      },
      (error) => {
        console.error('Error al cargar usuarios', error);
      }
    );
  }

  onSearchChange(): void {
    this.searchSubject.next(this.searchTerm);
  }

  onRoleFilterChange(newRole: string): void {
    this.roleFilter = newRole;
    this.pageIndex = 0;
    this.cargarUsuarios();
  }

  get paginatedUsers(): User[] {
    return this.users; // Ya viene paginado desde el backend
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.cargarUsuarios();
  }

  onEditUser(id: number): void {
    this.router.navigate(['/user/users/edit', id]);
  }

  onViewDetails(user: User): void {
    this.selectedUser = user;
    this.showUserDetailsModal = true;
  }

  onCloseDetails(): void {
    this.showUserDetailsModal = false;
    this.selectedUser = null;
  }

  onDeleteUser(id: number): void {
    if (confirm('¿Estás seguro de eliminar este usuario?')) {
      this.userService.deleteUser(id).subscribe(() => {
        this.cargarUsuarios();
      });
    }
  }

  onToggleActive(id: number): void {
    const targetUser = this.users.find(u => u.id === id);
    
    if (!targetUser || !this.canDelete(targetUser)) {
      alert('No tienes permisos para cambiar el estado de este usuario.');
      return;
    }

    const newStatus = targetUser.estado !== 'Activo';
    this.userService.toggleActive(id, newStatus).subscribe({
      next: () => {
        this.cargarUsuarios();
      },
      error: (error) => {
        console.error('Error al cambiar estado del usuario', error);
        alert('No se pudo cambiar el estado del usuario (Error 403 Forbidden). Esto suele ser un problema de permisos en el servidor o que la sesión ha expirado.');
      }
    });
  }

  // Ayudantes para la vista para controlar visibilidad de acciones
  canEdit(targetUser: User | null | undefined): boolean {
    if (!targetUser) return false;
    if (this.isSuperAdmin) return true;
    if (!this.isAdminUser) return false;
    // Un Admin solo puede editar a usuarios Regulares o Logística
    return targetUser.role === 'regular' || targetUser.role === 'logistics';
  }

  canDelete(targetUser: User | null | undefined): boolean {
    // En este sistema toggleActive actúa como eliminar/activar
    return this.canEdit(targetUser);
  }
}
