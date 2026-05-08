import { Component, OnInit } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth/authService';
import { User } from '../../models/user';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, TitleCasePipe],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile implements OnInit{
  public user: User | null = null;
  public tempUser: Partial<User> = {};
  public modoEdicion: boolean = false;
  public mensajeEstado: string = '';

  public newPassword = '';
  public confirmPassword = '';
  public passwordError = '';

  public previewImageUrl: string | ArrayBuffer | null = null; 
  public selectedFile: File | null = null;

  constructor(private authService: AuthService) { }

  ngOnInit(): void {
    this.cargarDatosUsuario();
  }

  cargarDatosUsuario(): void {
    this.authService.getMe().subscribe(
      (userData: any) => {
        this.user = {
          ...userData,
          nombre: userData.name,
          apellido: userData.surname,
          role: userData.roles?.includes('ROLE_SUPER_ADMIN') ? 'superadmin' : userData.roles?.includes('ROLE_ADMIN') ? 'admin' : 'regular'
        };
        this.tempUser = { ...this.user }; 
        this.previewImageUrl = this.user?.foto || null;
      },
      (error) => {
        console.error('Error al cargar el perfil', error);
      }
    );
  }

  activarEdicion(): void {
    this.modoEdicion = true;
    this.mensajeEstado = '';
    this.selectedFile = null;
    this.newPassword = '';
    this.confirmPassword = '';
  }

  cancelarEdicion(): void {
    this.modoEdicion = false;
    this.tempUser = { ...this.user! };
    this.mensajeEstado = '';
    this.previewImageUrl = this.user?.foto || null; 
    this.selectedFile = null;
    this.newPassword = '';
    this.confirmPassword = '';
    this.passwordError = '';
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];
      const reader = new FileReader();

      reader.onload = (e) => {
        this.previewImageUrl = reader.result; 
      };

      reader.readAsDataURL(this.selectedFile);
    } else {
      this.selectedFile = null;
      this.previewImageUrl = this.user?.foto || null; 
    }
  }

  guardarPerfil(): void {
    if (this.user && this.tempUser.nombre && this.tempUser.apellido && this.tempUser.email) {
      const apiData = {
        name: this.tempUser.nombre,
        surname: this.tempUser.apellido,
        email: this.tempUser.email,
        foto: this.selectedFile ? (this.previewImageUrl as string) : this.user.foto
      };

      this.authService.updateProfile(apiData).subscribe({
        next: (updatedUser) => {
          this.user = {
            ...updatedUser,
            nombre: updatedUser.nombre || (updatedUser as any).name,
            apellido: updatedUser.apellido || (updatedUser as any).surname,
            role: this.user?.role || 'regular'
          };
          this.modoEdicion = false;
          this.mensajeEstado = 'Perfil actualizado con éxito.';
          this.selectedFile = null;
        },
        error: (err) => {
          console.error('Error al actualizar perfil', err);
          this.mensajeEstado = 'Error al guardar los cambios.';
        }
      });
    } else {
      this.mensajeEstado = 'Por favor, rellena todos los campos.';
    }
  }

  cambiarContrasena(): void {
    this.passwordError = '';
    this.mensajeEstado = '';

    if (this.newPassword) {
      if (this.newPassword.length < 6) {
        this.passwordError = 'La contraseña debe tener al menos 6 caracteres.';
        return;
      }

      if (this.newPassword !== this.confirmPassword) {
        this.passwordError = 'Las contraseñas no coinciden.';
        return;
      }

      this.authService.changePassword(this.newPassword).subscribe({
        next: () => {
          this.mensajeEstado = 'Contraseña actualizada con éxito.';
          this.newPassword = '';
          this.confirmPassword = '';
          // Si estamos en un estado de "debe cambiar contraseña", esto lo limpiará
          const user = this.authService.getUserProfile();
          if (user) {
            user.mustChangePassword = false;
            this.authService.updateLocalProfile(user);
          }
        },
        error: (err) => {
          console.error('Error al cambiar contraseña', err);
          this.passwordError = 'Hubo un error al intentar cambiar la contraseña.';
        }
      });
    } else {
      this.passwordError = 'Por favor ingrese una nueva contraseña.';
    }
  }

  eliminarImagenPerfil(): void {
    this.tempUser.foto = undefined; 
    this.previewImageUrl = null; 
    this.selectedFile = null; 
  }
}
