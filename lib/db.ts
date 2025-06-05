import { neon } from '@neondatabase/serverless';

export const sql = neon(process.env.DATABASE_URL!);

// SQL za kreiranje tabela - pokrenite ovo u Neon konzoli
export const createTables = `
CREATE TABLE IF NOT EXISTS vehicles (
  id SERIAL PRIMARY KEY,
  brand VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  year INTEGER NOT NULL,
  registration_number VARCHAR(50) UNIQUE NOT NULL,
  daily_rate DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'available',
  fuel_type VARCHAR(50) DEFAULT 'gasoline',
  transmission VARCHAR(50) DEFAULT 'manual',
  seat_count INTEGER DEFAULT 5,
  image_url TEXT,
  user_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS clients (
  id SERIAL PRIMARY KEY,
  firebase_uid VARCHAR(255) UNIQUE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  address TEXT,
  id_number VARCHAR(50),
  driving_license_number VARCHAR(50) NOT NULL,
  id_card_issue_date DATE,
  id_card_valid_until DATE,
  id_card_issued_by VARCHAR(255),
  driving_license_issue_date DATE,
  driving_license_valid_until DATE,
  driving_license_issued_by VARCHAR(255),
  user_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(email, user_id)
);

CREATE TABLE IF NOT EXISTS rentals (
  id SERIAL PRIMARY KEY,
  vehicle_id INTEGER REFERENCES vehicles(id),
  client_id INTEGER REFERENCES clients(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  user_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rental_extensions (
  id SERIAL PRIMARY KEY,
  rental_id INTEGER REFERENCES rentals(id),
  extension_days INTEGER NOT NULL,
  extension_price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Dodavanje indexa za performanse
CREATE INDEX IF NOT EXISTS idx_vehicles_user_id ON vehicles(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_rentals_user_id ON rentals(user_id);
CREATE INDEX IF NOT EXISTS idx_rentals_vehicle_id ON rentals(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_rentals_client_id ON rentals(client_id);
CREATE INDEX IF NOT EXISTS idx_rentals_status ON rentals(status);
`;