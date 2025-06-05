// types/index.ts
export interface Vehicle {
  id: number;
  brand: string;
  model: string;
  year: number;
  registration_number: string;
  daily_rate: number;
  status: 'available' | 'rented' | 'maintenance';
  fuel_type: 'gasoline' | 'diesel' | 'hybrid' | 'electric';
  transmission: 'manual' | 'automatic';
  seat_count: number;
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
  status: 'active' | 'completed' | 'cancelled' | 'reserved';
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

export interface ContractTemplate {
  id?: number;
  user_id?: string;
  company_name: string;
  company_address: string;
  company_phone?: string;
  company_email?: string;
  contract_terms: string;
  penalty_rate: number;
  logo_url?: string;
  // Novi podaci za napredni template
  jib_number?: string;
  bank_account?: string;
  owner_name?: string;
  contract_style: 'simple' | 'detailed' | 'jandra_style';
  include_km_fields: boolean;
  include_driver_license: boolean;
  include_id_details: boolean;
  fuel_policy?: string;
  additional_notes?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface ClientDetails {
  id?: number;
  client_id: number;
  user_id: string;
  birth_date?: string;
  birth_place?: string;
  id_number?: string;
  id_issued_by?: string;
  id_issue_date?: string;
  id_expiry_date?: string;
  driver_license_number?: string;
  driver_license_issued_by?: string;
  driver_license_issue_date?: string;
  driver_license_expiry_date?: string;
  additional_driver_name?: string;
  additional_driver_license?: string;
  additional_driver_issued_by?: string;
  additional_driver_issue_date?: string;
  additional_driver_expiry_date?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface RentalDetails {
  id?: number;
  rental_id: number;
  user_id: string;
  start_kilometers?: number;
  end_kilometers?: number;
  fuel_level_start?: string;
  fuel_level_end?: string;
  pickup_time?: string;
  return_time?: string;
  pickup_location?: string;
  return_location?: string;
  additional_notes?: string;
  created_at?: Date;
  updated_at?: Date;
}

// Helper funkcije za rental status
export const getRentalStatusLabel = (status: string) => {
  switch (status) {
    case 'active': return 'Aktivno';
    case 'completed': return 'Završeno';
    case 'cancelled': return 'Otkazano';
    case 'reserved': return 'Rezervisano';
    default: return status;
  }
};

export const getRentalStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-800';
    case 'completed': return 'bg-gray-100 text-gray-800';
    case 'cancelled': return 'bg-red-100 text-red-800';
    case 'reserved': return 'bg-yellow-100 text-yellow-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const getRentalStatusBadgeColor = (status: string) => {
  switch (status) {
    case 'active': return '#10b981'; // Green
    case 'completed': return '#6b7280'; // Gray
    case 'cancelled': return '#ef4444'; // Red
    case 'reserved': return '#f59e0b'; // Yellow/Orange
    default: return '#6b7280';
  }
};