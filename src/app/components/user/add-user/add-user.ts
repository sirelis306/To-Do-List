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
    estado: 'Activo' as 'Activo' | 'Inactivo',
    nuevaPassword: '',
    confirmarPassword: ''
  };
  isSuperAdmin: boolean = false;
  isAdmin: boolean = false;
  modoEdicion: boolean = false;
  userId: number | null = null;
  tituloPagina: string = 'Nuevo Usuario';
  targetUserRole: string = '';

  public showSuccessModal: boolean = false;

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.isSuperAdmin = this.authService.isSuperAdmin();
    this.isAdmin = this.authService.isAdmin();
    
    // Si no es administrador, redirigir al tablero (Seguridad básica de ruta)
    if (!this.isAdmin) {
      console.warn('Acceso denegado: Se requieren permisos de administrador.');
      this.router.navigate(['/board']);
      return;
    }

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
        const rolesArray = Array.isArray(user.roles) ? user.roles : (typeof user.roles === 'string' ? [user.roles] : (typeof user.role === 'string' ? [user.role] : []));
        const isTargetSuperAdmin = rolesArray.includes('ROLE_SUPER_ADMIN') || rolesArray.includes('SUPER_ADMIN');
        const isTargetAdmin = rolesArray.includes('ROLE_ADMIN') || rolesArray.includes('ADMIN');
        const isTargetLogistics = rolesArray.includes('ROLE_LOGISTICS') || rolesArray.includes('LOGISTICS');
        const rawRole = isTargetSuperAdmin ? 'ROLE_SUPER_ADMIN' : (isTargetAdmin ? 'ROLE_ADMIN' : (isTargetLogistics ? 'ROLE_LOGISTICS' : 'ROLE_USER'));
        
        this.targetUserRole = rawRole;

        // Si es admin normal, no puede editar a un super admin o a otro admin
        if (this.isAdmin && !this.isSuperAdmin) {
          if (isTargetSuperAdmin || isTargetAdmin) {
            alert('No tienes permisos para editar a este usuario (Nivel superior o igual).');
            this.router.navigate(['/user/users']);
            return;
          }
        }

        this.userData = {
          nombre: user.name || user.nombre || '',
          apellido: user.surname || user.apellido || '',
          email: user.email || '',
          role: isTargetSuperAdmin ? 'superadmin' : (isTargetAdmin ? 'admin' : (isTargetLogistics ? 'logistics' : 'regular')),
          cargo: 'Usuario',
          estado: (user.isActive === true || user.active === true || user.enabled === true || user.isActive === 1) ? 'Activo' : 'Inactivo',
          nuevaPassword: '',
          confirmarPassword: ''
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
      roles: [
        this.userData.role === 'superadmin' ? 'ROLE_SUPER_ADMIN' : 
        (this.userData.role === 'admin' ? 'ROLE_ADMIN' : 
        (this.userData.role === 'logistics' ? 'ROLE_LOGISTICS' : 'ROLE_USER'))
      ]
    };

    // Validar contraseñas si se ingresó algo
    if (this.userData.nuevaPassword || !this.modoEdicion) {
      if (this.userData.nuevaPassword !== this.userData.confirmarPassword) {
        alert('Las contraseñas no coinciden');
        return;
      }
    }

    // Si se escribió una nueva contraseña, forzamos el cambio al iniciar sesión
    if (this.userData.nuevaPassword) {
      apiData.password = this.userData.nuevaPassword;
      apiData.mustChangePassword = true;
    }

    if (this.modoEdicion && this.userId) {
      this.userService.updateUser(this.userId, apiData).subscribe(() => {
        this.showSuccessModal = true;
      }, (error) => {
        console.error('Error actualizando usuario', error);
      });
    } else {
      // Al crear, siempre forzamos cambio si se puso una contraseña o usamos la temporal
      apiData.password = this.userData.nuevaPassword || 'TemporaryPassword123!';
      apiData.mustChangePassword = true;

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
