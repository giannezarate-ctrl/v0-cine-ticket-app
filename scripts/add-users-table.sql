-- Add users table to existing database
-- This adds the users table with proper authentication fields

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'client' CHECK (role IN ('admin', 'client')),
  phone VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Insert default admin user (password: admin123)
-- Note: In production, you would hash the password properly
INSERT INTO users (name, email, password_hash, role, phone)
VALUES 
  ('Administrador', 'admin@gmail.com', '$2a$10$rZ5q2W8VNJJjQxV5vX1Y0eIXqX1Y0eIXqX1Y0eIXqX1Y0eIXqX1Y0e', 'admin', '3001234567'),
  ('Usuario Prueba', 'test@test.com', '$2a$10$dummyhashedpasswordfortestuser', 'client', '3009876543')
ON CONFLICT DO NOTHING;