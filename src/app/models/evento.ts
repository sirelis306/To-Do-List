export interface Evento {
  id?: number;
  title: string;
  description: string;
  place: string;
  date: string; // YYYY-MM-DD
  startAt?: string; // YYYY-MM-DD HH:mm:ss
  endAt?: string; // YYYY-MM-DD HH:mm:ss
  tags: string[];
  isCompanyWide: boolean;
  reminderAt?: string;
  isActive?: boolean;
  participants?: any[]; // Array de usuarios (ID o info)
}
