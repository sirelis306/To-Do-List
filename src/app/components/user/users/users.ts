import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../services/user/userService';
import { AuthService } from '../../../services/auth/authService';
import { User } from '../../../models/user';

import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

import { CustomDropdown } from '../../custom-dropdown/custom-dropdown';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatPaginatorModule, CustomDropdown],
  templateUrl: './users.html',
  styleUrl: './users.css'
})
export class Users implements OnInit {
  public roleOptions = [
    { label: 'Super Admin', value: 'superadmin' },
    { label: 'Administrador', value: 'admin' },
    { label: 'Regular', value: 'regular' }
  ];
  users: User[] = [];
  isSuperAdmin: boolean = false;
  searchTerm: string = '';
  roleFilter: string = '';

  // Paginación
  pageSize: number = 10;
  pageIndex: number = 0;
  pageSizeOptions = [5, 10, 25];

  constructor(
    private userService: UserService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.users = this.userService.getUsers();
    this.isSuperAdmin = this.authService.isSuperAdmin();
  }

  get filteredUsers(): User[] {
    return this.users.filter(u => {
      const matchesSearch = (u.nombre + ' ' + u.apellido).toLowerCase().includes(this.searchTerm.toLowerCase()) || 
                           u.email.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesRole = this.roleFilter ? u.role === this.roleFilter : true;
      return matchesSearch && matchesRole;
    });
  }

  get paginatedUsers(): User[] {
    const startIndex = this.pageIndex * this.pageSize;
    return this.filteredUsers.slice(startIndex, startIndex + this.pageSize);
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
  }
}
