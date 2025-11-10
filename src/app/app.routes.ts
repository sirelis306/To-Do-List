import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { Board } from './components/board/board'; 
import { authGuard } from './authGuard/auth-guard'; 

export const routes: Routes = [
  { 
    path: 'login', 
    component: Login
  },
  { 
    path: 'board', 
    component: Board,
    canActivate: [authGuard] 
  },

  { 
    path: '', 
    redirectTo: '/board', 
    pathMatch: 'full' 
  },
  { 
    path: '**', 
    redirectTo: '/board' 
  }
];
