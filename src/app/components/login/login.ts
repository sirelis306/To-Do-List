import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth/authService';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  public email:string = '';
  public password:string = '';
  public errorMensaje:string = '';
  public showPassword: boolean = false;

  constructor(private router: Router, private authService: AuthService) {}
  
  ngOnInit(): void {
    // Si el usuario ya está autenticado, lo mandamos directo al board
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/board']);
    }
  }

  onLogin(): void {
    console.log('Botón de login presionado con:', this.email);
    this.errorMensaje = "";
    this.authService.login(this.email, this.password).subscribe({
      next: (res) => {
        console.log('¡Login exitoso desde el servicio!');
        // Redirigir al tablero o dashboard
        this.router.navigate(['/board']);
      },
      error: (err) => {
        console.log('Login fallido:', err);
        this.errorMensaje = "Correo o contraseña incorrectos.";
      }
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

}
