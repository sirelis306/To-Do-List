import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { Board } from './components/board/board'; 
import { authGuard } from './authGuard/auth-guard'; 
import { Articles } from './components/articles/articles';
import { AddArticle } from './components/add-article/add-article';

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
    path: 'articles', 
    component: Articles, 
    canActivate: [authGuard]
  },
  { 
    path: 'articles/add', 
    component: AddArticle,
    canActivate: [authGuard]
  },
  { 
    path: 'articles/edit/:id', 
    component: AddArticle,
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
