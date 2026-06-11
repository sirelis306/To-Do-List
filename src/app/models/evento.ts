export interface Evento {
  id?: number;
  title: string;
  description: string;
  place: string;
  date: string;
  startAt?: string;
  endAt?: string;
  tags: string[];
  isCompanyWide: boolean;
  reminderAt?: string;
  isActive?: boolean;
  participants?: any[];
  tipoEvento?: string;
  cliente?: string;
  participantName?: string;
  participantCount?: number;
  color?: string;
  user?: any; // Para mostrar el creador del evento
}
