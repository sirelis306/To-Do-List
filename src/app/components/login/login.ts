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

  onLogin(): void {
    this.errorMensaje = "";
    const loginExitoso = this.authService.login(this.email, this.password);

    if (loginExitoso) {
      console.log('¡Login exitoso desde el servicio!');
      this.router.navigate(['/board']);

    } else {
      console.log('Login fallido desde el servicio');
      this.errorMensaje = "Correo o contraseña incorrectos.";
    }
   
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

}
