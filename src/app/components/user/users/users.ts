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
import { CustomDropdown } from '../../custom-dropdown/custom-dropdown';

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

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.isSuperAdmin = this.authService.isSuperAdmin();
    this.isAdminUser = this.authService.isAdmin();
    
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
    else if (this.roleFilter === 'regular') apiRole = 'ROLE_USER';

    this.userService.getUsers(this.pageIndex + 1, this.pageSize, this.searchTerm, apiRole).subscribe(
      (response) => {
        let data = Array.isArray(response) ? response : (response.data || []);
        this.totalUsers = response.meta?.total_items !== undefined ? response.meta.total_items : (response.total !== undefined ? response.total : data.length);

        this.users = data.map((u: any) => ({
          ...u,
          nombre: u.name || u.nombre,
          apellido: u.surname || u.apellido,
          role: u.roles?.includes('ROLE_SUPER_ADMIN') ? 'superadmin' 
              : u.roles?.includes('ROLE_ADMIN') ? 'admin' 
              : 'regular',
          cargo: 'Usuario',
          estado: u.isActive ? 'Activo' : 'Inactivo'
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

  onDeleteUser(id: number): void {
    if (confirm('¿Estás seguro de eliminar este usuario?')) {
      this.userService.deleteUser(id).subscribe(() => {
        this.cargarUsuarios();
      });
    }
  }

  onToggleActive(id: number): void {
    if (!this.isAdminUser) {
      alert('Solo un administrador puede realizar esta acción.');
      return;
    }
    this.userService.toggleActive(id).subscribe(() => {
      this.cargarUsuarios();
    });
  }
}
