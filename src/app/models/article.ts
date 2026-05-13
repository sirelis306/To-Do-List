export interface Article {
  id: number;
  nombre: string;
  marca: string;
  categoria: string;
  modelo: string;
  caracteristicas: string;
  color: string;
  serial: string | null;
  condicion: string;
  locacion: string;
  cantidad: number | null;
}