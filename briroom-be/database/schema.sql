-- BRIRoom Database Schema
-- Created for room and zoom meeting booking system

-- Drop tables if exist (untuk development)
DROP TABLE IF EXISTS request_status_logs CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS requests CASCADE;
DROP TABLE IF EXISTS zoom_links CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('user', 'admin_it', 'logistik')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Rooms table
CREATE TABLE rooms (
    id SERIAL PRIMARY KEY,
    room_name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    capacity INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Zoom Links table
CREATE TABLE zoom_links (
    id SERIAL PRIMARY KEY,
    zoom_account_name VARCHAR(255) NOT NULL,
    zoom_email VARCHAR(255) NOT NULL,
    zoom_link VARCHAR(500),
    meeting_id VARCHAR(255),
    passcode VARCHAR(255),
    max_capacity INTEGER DEFAULT 100,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Requests table
CREATE TABLE requests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    purpose TEXT,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    capacity INTEGER NOT NULL,
    request_type VARCHAR(50) NOT NULL CHECK (request_type IN ('room', 'zoom', 'both')),
    room_id INTEGER REFERENCES rooms(id) ON DELETE SET NULL,
    zoom_link_id INTEGER REFERENCES zoom_links(id) ON DELETE SET NULL,
    whatsapp_number VARCHAR(20),
    pic_name VARCHAR(255),
    pic_contact VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled', 'partial_approved')),
    
    -- Separate approval tracking
    room_status VARCHAR(50) DEFAULT 'pending' CHECK (room_status IN ('pending', 'approved', 'rejected', 'not_required')),
    zoom_status VARCHAR(50) DEFAULT 'pending' CHECK (zoom_status IN ('pending', 'approved', 'rejected', 'not_required')),
    
    room_approved_by INTEGER REFERENCES users(id),
    zoom_approved_by INTEGER REFERENCES users(id),
    room_approved_at TIMESTAMP,
    zoom_approved_at TIMESTAMP,
    room_notes TEXT,
    zoom_notes TEXT,
    
    approved_by INTEGER REFERENCES users(id),
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications table
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    request_id INTEGER REFERENCES requests(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    is_read BOOLEAN DEFAULT false,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Request Status Logs table
CREATE TABLE request_status_logs (
    id SERIAL PRIMARY KEY,
    request_id INTEGER NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
    status_type VARCHAR(50) NOT NULL CHECK (status_type IN ('overall', 'room_status', 'zoom_status')),
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by INTEGER NOT NULL REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_requests_user_id ON requests(user_id);
CREATE INDEX idx_requests_date ON requests(date);
CREATE INDEX idx_requests_status ON requests(status);
CREATE INDEX idx_requests_room_id ON requests(room_id);
CREATE INDEX idx_requests_zoom_link_id ON requests(zoom_link_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

-- Insert sample data
INSERT INTO users (name, email, password, role) VALUES 
('Admin IT', 'admin@bri.co.id', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin_it'),
('Staff Logistik', 'logistik@bri.co.id', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'logistik'),
('Pegawai User', 'user@bri.co.id', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user'),
('John Doe', 'john@bri.co.id', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user'),
('Jane Smith', 'jane@bri.co.id', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user');

INSERT INTO rooms (room_name, location, capacity) VALUES 
('Ruang Meeting A', 'Lantai 1', 10),
('Ruang Meeting B', 'Lantai 1', 8),
('Ruang Meeting C', 'Lantai 2', 15),
('Ruang Rapat Besar', 'Lantai 3', 25),
('Ruang Diskusi', 'Lantai 2', 6);

INSERT INTO zoom_links (zoom_account_name, zoom_email, zoom_link, meeting_id, passcode) VALUES 
('BRI Zoom 1', 'zoom1@bri.co.id', 'https://zoom.us/j/1234567890', '1234567890', '123456'),
('BRI Zoom 2', 'zoom2@bri.co.id', 'https://zoom.us/j/0987654321', '0987654321', '654321'),
('BRI Zoom 3', 'zoom3@bri.co.id', 'https://zoom.us/j/1122334455', '1122334455', '112233');

-- Default password for all sample users is: password
-- (hashed with bcrypt)
