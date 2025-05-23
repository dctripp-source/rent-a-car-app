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
  image_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS clients (
  id SERIAL PRIMARY KEY,
  firebase_uid VARCHAR(255) UNIQUE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  address TEXT,
  id_number VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rentals (
  id SERIAL PRIMARY KEY,
  vehicle_id INTEGER REFERENCES vehicles(id),
  client_id INTEGER REFERENCES clients(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
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
`;