import { Injectable } from '@angular/core';
import { User } from '../../models/user';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly USERS_KEY = 'kanban_users';

  constructor() {
    const stored = localStorage.getItem(this.USERS_KEY);
    if (!stored || !JSON.parse(stored)[0].cargo) {
      const initialUsers: User[] = [
        { id: 1, nombre: 'Sirelis', apellido: 'Sarmiento', email: 'ssire006@gmail.com', role: 'superadmin', cargo: 'Apoyo Técnico', estado: 'Activo' },
        { id: 2, nombre: 'Usuario', apellido: 'QA', email: 'qa@gmail.com', role: 'admin', cargo: 'Analista', estado: 'Activo' },
        { id: 3, nombre: 'Regular', apellido: 'User', email: 'user@example.com', role: 'regular', cargo: 'Operador', estado: 'Inactivo' }
      ];
      localStorage.setItem(this.USERS_KEY, JSON.stringify(initialUsers));
    }
  }

  getUsers(): User[] {
    const usersJson = localStorage.getItem(this.USERS_KEY);
    return usersJson ? JSON.parse(usersJson) : [];
  }

  addUser(user: Omit<User, 'id'>): void {
    const users = this.getUsers();
    const newUser: User = { ...user, id: Date.now() };
    users.push(newUser);
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
  }
}
