// types/index.ts - Ažurirani tipovi
export interface Vehicle {
  id: number;
  brand: string;
  model: string;
  year: number;
  registration_number: string;
  daily_rate: number;
  status: 'available' | 'rented' | 'maintenance';
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
  name: string;
  email: string;
  phone?: string;
  address?: string;
  id_number?: string;
  user_id?: string;
  created_at?: Date;
}

export interface Rental {
  id: number;
  vehicle_id: number;
  client_id: number;
  start_date: string;
  end_date: string;
  start_datetime?: string; // Nova polja za rezervacije
  end_datetime?: string;
  total_price: number;
  status: 'active' | 'completed' | 'cancelled' | 'reserved'; // Dodano 'reserved'
  notes?: string; // Nova polja za napomene
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

// Novi tipovi specifični za rezervacije
export interface Reservation extends Rental {
  status: 'reserved';
  start_datetime: string;
  end_datetime: string;
}

export interface ReservationFormData {
  vehicle_id: string;
  client_id: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  notes?: string;
}

// Dashboard tipovi
export interface DashboardStats {
  totalVehicles: number;
  totalClients: number;
  activeRentals: number;
  reservedRentals: number;
  monthlyRevenue: number;
  availableVehicles: number;
  upcomingReservations: number;
}