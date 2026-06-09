import { Routes } from '@angular/router';
import { Login } from './components/auth/login/login';
import { Board } from './components/board/board'; 
import { authGuard } from './authGuard/auth-guard'; 
import { Articles } from './components/inventory/articles/articles';
import { AddArticle } from './components/inventory/add-article/add-article';
import { Profile } from './components/profile/profile';
import { Chat } from './components/chat/chat';
import { Transcriptor } from './components/transcriptor/transcriptor';
import { Calendar } from './components/calendar/calendar';

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
    path: 'chat', 
    component: Chat,
    canActivate: [authGuard]
  },
  { 
    path: 'transcriptor', 
    component: Transcriptor,
    canActivate: [authGuard] 
  },
  { 
    path: 'calendar', 
    component: Calendar,
    canActivate: [authGuard] 
  },
  { 
    path: 'profile', 
    component: Profile, 
    canActivate: [authGuard] 
  },
  {
    path: 'user/users',
    loadComponent: () => import('./components/user/users/users').then(m => m.Users),
    canActivate: [authGuard]
  },
  {
    path: 'user/users/add',
    loadComponent: () => import('./components/user/add-user/add-user').then(m => m.AddUser),
    canActivate: [authGuard]
  },
  {
    path: 'user/users/edit/:id',
    loadComponent: () => import('./components/user/add-user/add-user').then(m => m.AddUser),
    canActivate: [authGuard]
  },

  { 
    path: '', 
    redirectTo: '/login', 
    pathMatch: 'full' 
  },
  { 
    path: '**', 
    redirectTo: '/login' 
  }
];
