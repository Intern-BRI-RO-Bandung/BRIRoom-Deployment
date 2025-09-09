-- Add admin_notes column to requests table
ALTER TABLE requests ADD COLUMN IF NOT EXISTS admin_notes TEXT;
