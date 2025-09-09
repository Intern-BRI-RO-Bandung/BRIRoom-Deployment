// controllers/adminController.js
import db from '../config/db.js'; // atau sesuaikan dengan koneksi DB kamu

// 🔹 ZOOM
export const getAllZoomLinks = async (req, res) => {
  const result = await db.query('SELECT * FROM zoom_links');
  res.json(result.rows);
};

export const createZoomLink = async (req, res) => {
  const { zoom_account_name, zoom_email, zoom_link, meeting_id, passcode } = req.body;
  await db.query(
    'INSERT INTO zoom_links (zoom_account_name, zoom_email, zoom_link, meeting_id, passcode) VALUES ($1, $2, $3, $4, $5)',
    [zoom_account_name, zoom_email, zoom_link, meeting_id, passcode]
  );
  res.status(201).json({ message: 'Zoom link berhasil ditambahkan' });
};

// 🔹 ROOM
export const getAllRooms = async (req, res) => {
  try {
    console.log('🔍 Fetching all rooms...');
    const result = await db.query('SELECT * FROM rooms ORDER BY created_at DESC');
    console.log(`✅ Found ${result.rows.length} rooms`);
    
    // Transform data to include 'name' field for frontend compatibility
    const transformedRooms = result.rows.map(room => ({
      ...room,
      name: room.room_name // Add 'name' field that matches frontend expectation
    }));
    
    res.json({ 
      success: true,
      data: transformedRooms 
    });
  } catch (error) {
    console.error('❌ Error fetching rooms:', error);
    res.status(500).json({ 
      success: false,
      message: 'Gagal mengambil data ruangan', 
      error: error.message 
    });
  }
};

export const createRoom = async (req, res) => {
  // Accept both 'name' and 'room_name' from frontend
  const { name, room_name, location, capacity, is_active } = req.body;
  const finalRoomName = name || room_name;
  const finalIsActive = is_active !== undefined ? is_active : true;
  
  try {
    console.log('🔨 Creating new room:', { name: finalRoomName, location, capacity, is_active: finalIsActive });
    
    const result = await db.query(
      'INSERT INTO rooms (room_name, location, capacity, is_active) VALUES ($1, $2, $3, $4) RETURNING *',
      [finalRoomName, location, capacity, finalIsActive]
    );
    
    console.log('✅ Room created successfully:', result.rows[0]);
    
    // Transform response to include 'name' field for frontend compatibility
    const createdRoom = {
      ...result.rows[0],
      name: result.rows[0].room_name
    };
    
    res.status(201).json({ 
      message: 'Ruangan berhasil ditambahkan',
      data: createdRoom
    });
  } catch (error) {
    console.error('❌ Error creating room:', error);
    res.status(500).json({ 
      message: 'Gagal menambahkan ruangan', 
      error: error.message 
    });
  }
};

export const updateRoom = async (req, res) => {
  const { id } = req.params;
  // Accept both 'name' and 'room_name' from frontend
  const { name, room_name, location, capacity, is_active } = req.body;
  const finalRoomName = name || room_name;
  
  try {
    console.log(`🔄 Updating room ${id} with data:`, { name: finalRoomName, location, capacity, is_active });
    
    const result = await db.query(
      'UPDATE rooms SET room_name = $1, location = $2, capacity = $3, is_active = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *',
      [finalRoomName, location, capacity, is_active !== undefined ? is_active : true, id]
    );
    
    if (result.rows.length === 0) {
      console.log(`❌ Room ${id} not found`);
      return res.status(404).json({ message: 'Ruangan tidak ditemukan' });
    }
    
    console.log('✅ Room updated successfully:', result.rows[0]);
    
    // Transform response to include 'name' field for frontend compatibility
    const updatedRoom = {
      ...result.rows[0],
      name: result.rows[0].room_name
    };
    
    res.json({ 
      message: 'Ruangan berhasil diubah', 
      data: updatedRoom 
    });
  } catch (error) {
    console.error('❌ Error updating room:', error);
    res.status(500).json({ 
      message: 'Gagal mengubah ruangan', 
      error: error.message 
    });
  }
};

export const deleteRoom = async (req, res) => {
  const { id } = req.params;
  
  try {
    console.log(`🗑️ Deleting room ${id}...`);
    
    const result = await db.query('DELETE FROM rooms WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      console.log(`❌ Room ${id} not found`);
      return res.status(404).json({ message: 'Ruangan tidak ditemukan' });
    }
    
    console.log('✅ Room deleted successfully:', result.rows[0]);
    res.json({ 
      message: 'Ruangan berhasil dihapus',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Error deleting room:', error);
    res.status(500).json({ 
      message: 'Gagal menghapus ruangan', 
      error: error.message 
    });
  }
};

export const deleteZoomLink = async (req, res) => {
  const { id } = req.params;

  try {
    await db.query('DELETE FROM zoom_links WHERE id = $1', [id]);
    res.json({ message: 'Zoom link berhasil dihapus' });
  } catch (error) {
    console.error('Gagal menghapus Zoom link:', error);
    res.status(500).json({ error: 'Gagal menghapus Zoom link' });
  }
};

export const updateZoomLink = async (req, res) => {
  const { id } = req.params;
  const { zoom_account_name, zoom_email, zoom_link, meeting_id, passcode, is_active } = req.body;

  try {
    const result = await db.query(
      'UPDATE zoom_links SET zoom_account_name = $1, zoom_email = $2, zoom_link = $3, meeting_id = $4, passcode = $5, is_active = $6 WHERE id = $7 RETURNING *',
      [zoom_account_name, zoom_email, zoom_link, meeting_id, passcode, is_active, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Zoom link tidak ditemukan' });
    }

    res.json({
      message: 'Zoom link berhasil diperbarui',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Gagal update Zoom link:', error);
    res.status(500).json({ error: 'Gagal update Zoom link' });
  }
};
