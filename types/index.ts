// types/index.ts
export interface Vehicle {
  id: number;
  brand: string;
  model: string;
  year: number;
  registration_number: string;
  daily_rate: number;
  status: 'available' | 'rented' | 'maintenance';
  image_url?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface Client {
  id: number;
  firebase_uid?: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  id_number?: string;
  created_at?: Date;
}

export interface Rental {
  id: number;
  vehicle_id: number;
  client_id: number;
  start_date: string;
  end_date: string;
  total_price: number;
  status: 'active' | 'completed' | 'cancelled';
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