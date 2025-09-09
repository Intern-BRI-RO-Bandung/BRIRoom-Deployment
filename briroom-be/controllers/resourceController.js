// controllers/resourceController.js
import db from '../config/db.js';
import { findOptimalRoom, findOptimalZoomAccount } from '../helpers/smartAllocationHelper.js';

/**
 * RESOURCE CONTROLLER
 * Menangani endpoint untuk mendapatkan resource yang tersedia (room & zoom)
 */

// ===== ROOM RESOURCES =====

export const getAvailableRooms = async (req, res) => {
  try {
    const { date, startTime, endTime, capacity } = req.query;
    
    if (!date || !startTime || !endTime || !capacity) {
      return res.status(400).json({ 
        message: 'Parameter date, startTime, endTime, dan capacity diperlukan' 
      });
    }

    // Fix time format - PostgreSQL expects HH:MM:SS not HH:MM:SS:SS
    const start_time = startTime.length > 8 ? startTime.substring(0, 8) : startTime;
    const end_time = endTime.length > 8 ? endTime.substring(0, 8) : endTime;

    console.log('🔍 Finding available rooms for:', { date, start_time, end_time, capacity });

    // Find all rooms that can accommodate the requested capacity and are available
    const result = await db.query(`
      SELECT r.*
      FROM rooms r
      WHERE r.is_active = true
      AND r.capacity >= $4
      AND NOT EXISTS (
        SELECT 1 FROM requests req
        WHERE req.room_id = r.id
        AND req.date = $1
        AND (req.room_status = 'approved' OR req.status IN ('approved', 'pending'))
        AND (
          (req.start_time < $3 AND req.end_time > $2)
        )
      )
      ORDER BY r.capacity ASC
    `, [date, start_time, end_time, parseInt(capacity)]);

    console.log('✅ Available rooms found:', result.rows.length);
    
    res.json({
      success: true,
      data: result.rows,
      message: `${result.rows.length} ruangan tersedia`
    });
  } catch (error) {
    console.error('Error getAvailableRooms:', error);
    res.status(500).json({ message: 'Gagal mengambil data ruangan tersedia' });
  }
};

export const getOptimalRoom = async (req, res) => {
  try {
    const { date, startTime, endTime, capacity } = req.query;
    
    if (!date || !startTime || !endTime || !capacity) {
      return res.status(400).json({ 
        message: 'Parameter date, startTime, endTime, dan capacity diperlukan' 
      });
    }

    const optimalRoom = await findOptimalRoom(date, startTime, endTime, parseInt(capacity));
    
    if (!optimalRoom) {
      return res.status(404).json({ 
        success: false,
        message: 'Tidak ada ruangan yang tersedia untuk kriteria yang diminta' 
      });
    }

    res.json({
      success: true,
      data: optimalRoom,
      message: 'Ruangan optimal ditemukan'
    });
  } catch (error) {
    console.error('Error getOptimalRoom:', error);
    res.status(500).json({ message: 'Gagal mencari ruangan optimal' });
  }
};

// ===== ZOOM RESOURCES =====

export const getAvailableZoom = async (req, res) => {
  try {
    const { date, startTime, endTime, capacity } = req.query;
    
    if (!date || !startTime || !endTime || !capacity) {
      return res.status(400).json({ 
        message: 'Parameter date, startTime, endTime, dan capacity diperlukan' 
      });
    }

    // Convert time format if needed
    const start_time = startTime.includes(':') ? startTime + ':00' : startTime;
    const end_time = endTime.includes(':') ? endTime + ':00' : endTime;

    console.log('🔍 Finding available zoom accounts for:', { date, start_time, end_time, capacity });

    // Find all zoom accounts that can accommodate the requested capacity and are available
    const result = await db.query(`
      SELECT zl.*
      FROM zoom_links zl
      WHERE zl.is_active = true
      AND zl.max_capacity >= $4
      AND NOT EXISTS (
        SELECT 1 FROM requests r
        WHERE r.zoom_link_id = zl.id
        AND r.date = $1
        AND (r.zoom_status = 'approved' OR r.status IN ('approved', 'pending'))
        AND (
          (r.start_time < $3 AND r.end_time > $2)
        )
      )
      ORDER BY zl.max_capacity ASC
    `, [date, start_time, end_time, parseInt(capacity)]);

    console.log('✅ Available zoom accounts found:', result.rows.length);
    
    res.json({
      success: true,
      data: result.rows,
      message: `${result.rows.length} akun zoom tersedia`
    });
  } catch (error) {
    console.error('Error getAvailableZoom:', error);
    res.status(500).json({ message: 'Gagal mengambil data zoom tersedia' });
  }
};

export const getOptimalZoom = async (req, res) => {
  try {
    const { date, startTime, endTime, capacity } = req.query;
    
    if (!date || !startTime || !endTime || !capacity) {
      return res.status(400).json({ 
        message: 'Parameter date, startTime, endTime, dan capacity diperlukan' 
      });
    }

    const optimalZoom = await findOptimalZoomAccount(date, startTime, endTime, parseInt(capacity));
    
    if (!optimalZoom) {
      return res.status(404).json({ 
        success: false,
        message: 'Tidak ada akun zoom yang tersedia untuk kriteria yang diminta' 
      });
    }

    res.json({
      success: true,
      data: optimalZoom,
      message: 'Akun zoom optimal ditemukan'
    });
  } catch (error) {
    console.error('Error getOptimalZoom:', error);
    res.status(500).json({ message: 'Gagal mencari akun zoom optimal' });
  }
};

// ===== CHECK CONFLICTS =====

export const checkResourceConflicts = async (req, res) => {
  try {
    const { date, startTime, endTime, resourceType, resourceId } = req.query;
    
    if (!date || !startTime || !endTime || !resourceType) {
      return res.status(400).json({ 
        message: 'Parameter date, startTime, endTime, dan resourceType diperlukan' 
      });
    }

    let conflictQuery;
    let params = [date, startTime, endTime];

    if (resourceType === 'room') {
      conflictQuery = `
        SELECT r.*, u.name as user_name, u.email as user_email
        FROM requests r
        JOIN users u ON r.user_id = u.id
        WHERE r.room_id = $4
        AND r.date = $1
        AND (r.room_status = 'approved' OR r.status IN ('approved', 'pending'))
        AND (
          (r.start_time < $3 AND r.end_time > $2)
        )
        ORDER BY r.start_time
      `;
      params.push(resourceId);
    } else if (resourceType === 'zoom') {
      conflictQuery = `
        SELECT r.*, u.name as user_name, u.email as user_email
        FROM requests r
        JOIN users u ON r.user_id = u.id
        WHERE r.zoom_link_id = $4
        AND r.date = $1
        AND (r.zoom_status = 'approved' OR r.status IN ('approved', 'pending'))
        AND (
          (r.start_time < $3 AND r.end_time > $2)
        )
        ORDER BY r.start_time
      `;
      params.push(resourceId);
    } else {
      return res.status(400).json({ message: 'Resource type harus room atau zoom' });
    }

    const result = await db.query(conflictQuery, params);
    
    res.json({
      success: true,
      hasConflicts: result.rows.length > 0,
      conflicts: result.rows,
      message: result.rows.length > 0 ? 
        `Ditemukan ${result.rows.length} konflik waktu` : 
        'Tidak ada konflik waktu'
    });
  } catch (error) {
    console.error('Error checkResourceConflicts:', error);
    res.status(500).json({ message: 'Gagal mengecek konflik resource' });
  }
};
