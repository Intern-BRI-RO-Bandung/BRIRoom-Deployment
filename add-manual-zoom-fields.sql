-- Add manual zoom fields to requests table
ALTER TABLE requests ADD COLUMN IF NOT EXISTS zoom_link_manual VARCHAR(500);
ALTER TABLE requests ADD COLUMN IF NOT EXISTS zoom_meeting_id_manual VARCHAR(255);
ALTER TABLE requests ADD COLUMN IF NOT EXISTS zoom_passcode_manual VARCHAR(255);
