// types/index.ts - Ažurirani tipovi
export interface Vehicle {
  id: number;
  brand: string;
  model: string;
  year: number;
  registration_number: string;
  daily_rate: number;
  status: 'available' | 'rented' | 'maintenance' | 'broken'; // Dodano 'broken'
  fuel_type?: 'gasoline' | 'diesel' | 'hybrid' | 'electric';
  transmission?: 'manual' | 'automatic';
  seat_count?: number;
  image_url?: string;
  user_id?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface Client {
  id: number;
  firebase_uid?: string;
  name: string; // OBAVEZNO - jedino obavezno polje
  email?: string; // opciono - promjena sa obaveznog na opciono
  phone?: string;
  address?: string;
  id_number?: string; // opciono
  jmbg?: string; // opciono - novo polje
  driving_license_number?: string; // opciono - više nije obavezno
  id_card_issue_date?: string;
  id_card_valid_until?: string;
  id_card_issued_by?: string;
  driving_license_issue_date?: string;
  driving_license_valid_until?: string;
  driving_license_issued_by?: string;
  user_id?: string;
  created_at?: Date;
}

export interface Rental {
  id: number;
  vehicle_id: number;
  client_id: number;
  start_date: string;
  end_date: string;
  total_price: number | string;
  status: 'active' | 'completed' | 'cancelled' | 'reserved'; // Zadržan 'reserved' status
  notes?: string; // Dodano polje za napomene
  user_id?: string;
  created_at?: Date;
  updated_at?: Date;
  vehicle?: Vehicle;
  client?: Client;
}

export interface RentalExtension {
  id: number;
  rental_id: number;
  extension_days: number;
  extension_price: number;
  created_at?: Date;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: {
    rental: Rental;
  };
}

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
}