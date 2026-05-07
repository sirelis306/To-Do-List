import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
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
  modoEdicion: boolean = false;
  userId: number | null = null;
  tituloPagina: string = 'Nuevo Usuario';

  public showSuccessModal: boolean = false;

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.isSuperAdmin = this.authService.isSuperAdmin();
    
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.modoEdicion = true;
      this.tituloPagina = 'Editar Usuario';
      this.userId = +id;
      this.cargarUsuario(this.userId);
    } else {
      this.modoEdicion = false;
      this.tituloPagina = 'Nuevo Usuario';
    }
  }

  cargarUsuario(id: number): void {
    this.userService.getUserById(id).subscribe(
      (user: any) => {
        // Asignamos los datos del usuario a nuestro formulario
        this.userData = {
          nombre: user.name || user.nombre || '',
          apellido: user.surname || user.apellido || '',
          email: user.email || '',
          role: user.roles?.includes('ROLE_ADMIN') ? 'admin' : 'regular',
          cargo: 'Usuario',
          estado: user.isActive ? 'Activo' : 'Inactivo'
        };
      },
      (error) => {
        console.error('Error al cargar el usuario', error);
        this.router.navigate(['/user/users']);
      }
    );
  }

  onSubmit(): void {
    const apiData: any = {
      email: this.userData.email,
      name: this.userData.nombre,
      surname: this.userData.apellido,
      roles: [this.userData.role === 'admin' ? 'ROLE_ADMIN' : 'ROLE_USER']
    };

    if (this.modoEdicion && this.userId) {
      // Editar
      this.userService.updateUser(this.userId, apiData).subscribe(() => {
        this.showSuccessModal = true;
      }, (error) => {
        console.error('Error actualizando usuario', error);
      });
    } else {
      // Crear
      apiData.password = 'TemporaryPassword123!';
      this.authService.register(apiData).subscribe(() => {
        this.showSuccessModal = true;
      }, (error) => {
        console.error('Error creando usuario', error);
      });
    }
  }

  onCloseSuccess() {
    this.showSuccessModal = false;
    this.router.navigate(['/user/users']);
  }
}
