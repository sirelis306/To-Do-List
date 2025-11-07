export type EstadoTarea = 'por_hacer' | 'en_progreso' | 'completada';

export enum Importancia {
  alta = 'alta', 
  media = 'media', 
  baja = 'baja', 
}

export interface Tarea {
    id: number;
    titulo: string;
    estado: EstadoTarea;
    categoria?: string;
    importancia?: Importancia;
    subtareas?: Subtarea[];
}
export interface Subtarea {
  id: number;
  descripcion: string;
  completada: boolean;
}
