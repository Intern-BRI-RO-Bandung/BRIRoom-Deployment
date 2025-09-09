-- Perbaiki database schema yang error

-- 1. Tambahkan kolom yang hilang ke request_status_logs
ALTER TABLE request_status_logs 
ADD COLUMN IF NOT EXISTS old_status VARCHAR(50),
ADD COLUMN IF NOT EXISTS changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- 2. Pastikan kolom di zoom_links benar
ALTER TABLE zoom_links 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS capacity INTEGER DEFAULT 100;

-- 3. Update rooms table
ALTER TABLE rooms 
ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- 4. Add admin_notes column to requests table
ALTER TABLE requests ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- 5. Tambahkan indexes untuk performa
CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_date ON requests(date, start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_zoom_links_active ON zoom_links(is_active);
CREATE INDEX IF NOT EXISTS idx_rooms_available ON rooms(is_available);

-- 5. Insert data test jika belum ada
INSERT INTO users (name, email, password, role) VALUES 
('Test User', 'user@bri.co.id', '$2b$10$rOzJtjZoOuTsn4sz22zOKeBT0VlSFh3JxLyLJr8l3sGcpkOzN7Ae2', 'user'),
('Admin IT', 'admin@bri.co.id', '$2b$10$rOzJtjZoOuTsn4sz22zOKeBT0VlSFh3JxLyLJr8l3sGcpkOzN7Ae2', 'admin_it'),
('Logistik', 'logistik@bri.co.id', '$2b$10$rOzJtjZoOuTsn4sz22zOKeBT0VlSFh3JxLyLJr8l3sGcpkOzN7Ae2', 'logistik')
ON CONFLICT (email) DO NOTHING;

-- 6. Insert sample rooms
INSERT INTO rooms (room_name, capacity, location) VALUES 
('Meeting Room A', 10, 'Lantai 2'),
('Meeting Room B', 20, 'Lantai 3'),
('Conference Room', 50, 'Lantai 4')
ON CONFLICT DO NOTHING;

-- 7. Insert sample zoom accounts
INSERT INTO zoom_links (link_url, host_email, capacity) VALUES 
('https://zoom.us/j/1234567890', 'zoom1@bri.co.id', 100),
('https://zoom.us/j/0987654321', 'zoom2@bri.co.id', 200),
('https://zoom.us/j/1122334455', 'zoom3@bri.co.id', 500)
ON CONFLICT DO NOTHING;