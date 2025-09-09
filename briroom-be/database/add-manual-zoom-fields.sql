-- Add manual Zoom information fields to requests table
-- These fields will be filled by admin during approval

ALTER TABLE requests ADD COLUMN IF NOT EXISTS zoom_link_manual TEXT;
ALTER TABLE requests ADD COLUMN IF NOT EXISTS zoom_meeting_id_manual VARCHAR(255);
ALTER TABLE requests ADD COLUMN IF NOT EXISTS zoom_passcode_manual VARCHAR(255);

-- Add admin_notes column if not exists (for admin notes feature)
ALTER TABLE requests ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Update any existing schema references
COMMENT ON COLUMN requests.zoom_link_manual IS 'Manual Zoom link entered by admin during approval';
COMMENT ON COLUMN requests.zoom_meeting_id_manual IS 'Manual Zoom meeting ID entered by admin during approval';
COMMENT ON COLUMN requests.zoom_passcode_manual IS 'Manual Zoom passcode entered by admin during approval';
COMMENT ON COLUMN requests.admin_notes IS 'Additional notes from admin for the user';
