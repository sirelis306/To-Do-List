import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UserService } from '../../../services/user/userService';
import { AuthService } from '../../../services/auth/authService';
import { UserRole } from '../../../models/user';

@Component({
  selector: 'app-add-user',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './add-user.html',
  styleUrl: './add-user.css'
})
export class AddUser implements OnInit {
  userData = {
    nombre: '',
    apellido: '',
    email: '',
    role: 'regular' as UserRole,
    cargo: 'Usuario',
    estado: 'Activo' as 'Activo' | 'Inactivo'
  };
  isSuperAdmin: boolean = false;

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.isSuperAdmin = this.authService.isSuperAdmin();
  }

  onSubmit(): void {
    this.userService.addUser(this.userData);
    this.router.navigate(['/admin/users']);
  }
}
