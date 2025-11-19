export interface User {
  id: number;
  email: string;
  nombre: string;
  apellido: string;
  foto?: string;
}

export interface AuthData {
  user: User;
  token: string;
}