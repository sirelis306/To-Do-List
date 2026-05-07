export type UserRole = 'superadmin' | 'admin' | 'regular';

export interface User {
  id: number;
  email: string;
  nombre: string;
  segundoNombre?: string;
  apellido: string;
  segundoApellido?: string;
  role: UserRole | string;
  roles?: string[];
  cargo?: string;
  estado?: 'Activo' | 'Inactivo';
  foto?: string;
}

export interface AuthData {
  user: User;
  token: string;
}