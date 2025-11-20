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
  public passwordError = '';

  public previewImageUrl: string | ArrayBuffer | null = null; 
  public selectedFile: File | null = null;

  constructor(private authService: AuthService) { }

  ngOnInit(): void {
    this.cargarDatosUsuario();
  }

  cargarDatosUsuario(): void {
    this.user = this.authService.getUserProfile();
    if (this.user) {
      this.tempUser = { ...this.user }; 
      this.previewImageUrl = this.user.foto || null;
    }
  }

  activarEdicion(): void {
    this.modoEdicion = true;
    this.mensajeEstado = '';
    this.selectedFile = null;
  }

  cancelarEdicion(): void {
    this.modoEdicion = false;
    this.tempUser = { ...this.user! };
    this.mensajeEstado = '';
    this.previewImageUrl = this.user?.foto || null; 
    this.selectedFile = null;
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
      if (this.selectedFile) {
        this.tempUser.foto = this.previewImageUrl as string; 
        this.selectedFile = null; 
      } else if (!this.previewImageUrl) {
        this.tempUser.foto = undefined; 
      }
      
      this.authService.updateUserProfile(this.tempUser);
      this.cargarDatosUsuario(); 
      this.modoEdicion = false;
      this.mensajeEstado = 'Perfil actualizado con éxito.';
    } else {
        this.mensajeEstado = 'Por favor, rellena todos los campos.';
    }
  }

  cambiarContrasena(): void {
    this.passwordError = '';
    this.mensajeEstado = '';

    if (this.newPassword) {
      this.mensajeEstado = 'Contraseña actualizada con éxito.';
      this.newPassword = '';
    } else {
      this.passwordError = 'La contraseña actual es incorrecta.';
    }
  }

  eliminarImagenPerfil(): void {
    this.tempUser.foto = undefined; 
    this.previewImageUrl = null; 
    this.selectedFile = null; 
  }
}
