// controllers/roleBasedApprovalController.js
import db from '../config/db.js';
import { sendNotification } from './notificationController.js';
import { findOptimalZoomAccount, findOptimalRoom, checkAutoApproval } from '../helpers/smartAllocationHelper.js';

/**
 * Admin IT approve zoom request
 */
export const approveZoomRequest = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const { zoom_link_id, reason } = req.body;
    const adminId = req.user.id;

    console.log('Payload received:', { id, zoom_link_id, reason });

    // Verify admin is admin_it
    if (req.user.role !== 'admin_it') {
      console.error('Invalid role:', req.user.role);
      return res.status(403).json({ message: 'Unauthorized role' });
    }

    // Get request details
    const requestResult = await client.query(
      'SELECT * FROM requests WHERE id = $1',
      [id]
    );

    if (requestResult.rows.length === 0) {
      console.error('Request not found:', id);
      return res.status(404).json({ message: 'Request not found' });
    }

    const request = requestResult.rows[0];

    // Check if request needs zoom approval
    if (request.request_type !== 'zoom' && request.request_type !== 'both') {
      console.error('Invalid request type:', request.request_type);
      return res.status(400).json({ message: 'Invalid request type' });
    }

    // Check if zoom is already approved or rejected
    if (request.zoom_status !== 'pending') {
      console.error('Zoom already processed:', request.zoom_status);
      return res.status(400).json({ message: 'Zoom already processed' });
    }

    let selectedZoomId = zoom_link_id;

    // If no zoom_link_id provided, find optimal one
    if (!selectedZoomId) {
      console.error('Zoom link ID not provided');
      return res.status(400).json({ message: 'Zoom link ID not provided' });
    }

    // Verify zoom account availability
    const zoomCheckResult = await client.query(
      `SELECT 1 FROM requests 
       WHERE zoom_link_id = $1 AND date = $2
       AND (zoom_status = 'approved' OR status = 'approved')
       AND id != $4
       AND (start_time < $3 AND end_time > $5)`,
      [selectedZoomId, request.date, request.end_time, id, request.start_time]
    );

    if (zoomCheckResult.rows.length > 0) {
      console.error('Zoom link not available:', selectedZoomId);
      return res.status(400).json({ message: 'Zoom link not available' });
    }

    // Update zoom approval
    await client.query(
      `UPDATE requests 
       SET zoom_status = 'approved',
           zoom_link_id = $1,
           zoom_approved_by = $2,
           zoom_approved_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [selectedZoomId, adminId, id]
    );

    // Log the status change
    await client.query(
      `INSERT INTO request_status_logs (request_id, changed_by, previous_status, new_status, notes)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, adminId, request.zoom_status, 'approved', reason || 'Zoom request disetujui oleh Admin IT']
    );

    // Send notification
    await sendNotification(
      request.user_id,
      id,
      `Zoom request Anda telah disetujui oleh Admin IT. ${reason ? 'Catatan: ' + reason : ''}`,
      'approval'
    );

    await client.query('COMMIT');

    res.status(200).json({
      success: true,
      message: 'Zoom request berhasil disetujui',
      data: {
        requestId: id,
        zoomStatus: 'approved',
        overallStatus: request.status,
        zoomLinkId: selectedZoomId,
        reason: reason || 'Disetujui oleh Admin IT'
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error approving zoom request:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Terjadi kesalahan server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    client.release();
  }
};

/**
 * Admin IT reject zoom request
 */
export const rejectZoomRequest = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.user.id;
    
    // Verify admin is admin_it
    if (req.user.role !== 'admin_it') {
      return res.status(403).json({ 
        success: false, 
        message: 'Hanya Admin IT yang dapat menolak request zoom' 
      });
    }
    
    // Get request details
    const requestResult = await client.query(
      'SELECT * FROM requests WHERE id = $1',
      [id]
    );
    
    if (requestResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ 
        success: false, 
        message: 'Request tidak ditemukan' 
      });
    }
    
    const request = requestResult.rows[0];
    
    // Check if request needs zoom approval
    if (request.request_type !== 'zoom' && request.request_type !== 'both') {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        success: false, 
        message: 'Request ini tidak memerlukan approval zoom' 
      });
    }
    
    // Update zoom rejection
    await client.query(`
      UPDATE requests 
      SET zoom_status = 'rejected',
          zoom_approved_by = $1,
          zoom_approved_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [adminId, id]);
    
    // For pure zoom requests, reject the entire request
    // For mixed requests, only reject zoom part
    let finalStatus = request.status;
    
    if (request.request_type === 'zoom') {
      finalStatus = 'rejected';
      await client.query(`
        UPDATE requests 
        SET status = 'rejected',
            approved_by = $1,
            approved_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [adminId, id]);
    }
    
    // Log the status change
    await client.query(`
      INSERT INTO request_status_logs (request_id, changed_by, previous_status, new_status, notes)
      VALUES ($1, $2, $3, $4, $5)
    `, [id, adminId, request.zoom_status, 'rejected', reason || 'Zoom request ditolak oleh Admin IT']);
    
    // Send notification
    await sendNotification(
      request.user_id,
      id,
      `Zoom request Anda telah ditolak oleh Admin IT. ${reason ? 'Alasan: ' + reason : ''}`,
      'rejection'
    );
    
    await client.query('COMMIT');
    
    res.status(200).json({
      success: true,
      message: 'Zoom request berhasil ditolak',
      data: {
        requestId: id,
        zoomStatus: 'rejected',
        overallStatus: finalStatus,
        reason: reason || 'Ditolak oleh Admin IT'
      }
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error rejecting zoom request:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Terjadi kesalahan server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    client.release();
  }
};

/**
 * Logistik approve room request
 */
export const approveRoomRequest = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { room_id, reason } = req.body;
    const logistikId = req.user.id;
    
    // Verify user is logistik
    if (req.user.role !== 'logistik') {
      return res.status(403).json({ 
        success: false, 
        message: 'Hanya Logistik yang dapat menyetujui request ruangan' 
      });
    }
    
    // Get request details
    const requestResult = await client.query(
      'SELECT * FROM requests WHERE id = $1',
      [id]
    );
    
    if (requestResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ 
        success: false, 
        message: 'Request tidak ditemukan' 
      });
    }
    
    const request = requestResult.rows[0];
    
    // Check if request needs room approval
    if (request.request_type !== 'room' && request.request_type !== 'both') {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        success: false, 
        message: 'Request ini tidak memerlukan approval ruangan' 
      });
    }
    
    let selectedRoomId = room_id;
    
    // If no room_id provided, find optimal one
    if (!selectedRoomId) {
      const optimalRoom = await findOptimalRoom(
        request.date, 
        request.start_time, 
        request.end_time, 
        request.capacity
      );
      
      if (!optimalRoom) {
        await client.query('ROLLBACK');
        return res.status(400).json({ 
          success: false, 
          message: 'Tidak ada ruangan yang tersedia untuk waktu dan kapasitas yang diminta' 
        });
      }
      
      selectedRoomId = optimalRoom.id;
    }
    
    // Update room approval
    await client.query(`
      UPDATE requests 
      SET room_status = 'approved',
          room_id = $1,
          room_approved_by = $2,
          room_approved_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
    `, [selectedRoomId, logistikId, id]);
    
    // Check if overall request should be approved
    const updatedRequest = await client.query(
      'SELECT * FROM requests WHERE id = $1',
      [id]
    );
    
    const updated = updatedRequest.rows[0];
    let finalStatus = updated.status;
    
    if (updated.request_type === 'room') {
      // Pure room request - approve immediately
      finalStatus = 'approved';
      await client.query(`
        UPDATE requests 
        SET status = 'approved',
            approved_by = $1,
            approved_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [logistikId, id]);
    } else if (updated.request_type === 'both') {
      // Mixed request - check if zoom is also approved
      if (updated.zoom_status === 'approved') {
        finalStatus = 'approved';
        await client.query(`
          UPDATE requests 
          SET status = 'approved',
              approved_at = CURRENT_TIMESTAMP
          WHERE id = $1
        `, [id]);
      } else {
        finalStatus = 'partial_approved';
        await client.query(`
          UPDATE requests 
          SET status = 'partial_approved'
          WHERE id = $1
        `, [id]);
      }
    }
    
    // Log the status change
    await client.query(`
      INSERT INTO request_status_logs (request_id, changed_by, previous_status, new_status, notes)
      VALUES ($1, $2, $3, $4, $5)
    `, [id, logistikId, request.room_status, 'approved', reason || 'Room request disetujui oleh Logistik']);
    
    // Send notification
    await sendNotification(
      request.user_id,
      id,
      `Room request Anda telah disetujui oleh Logistik. ${reason ? 'Catatan: ' + reason : ''}`,
      'approval'
    );
    
    await client.query('COMMIT');
    
    res.status(200).json({
      success: true,
      message: 'Room request berhasil disetujui',
      data: {
        requestId: id,
        roomStatus: 'approved',
        overallStatus: finalStatus,
        roomId: selectedRoomId,
        reason: reason || 'Disetujui oleh Logistik'
      }
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error approving room request:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Terjadi kesalahan server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    client.release();
  }
};

/**
 * Logistik reject room request
 */
export const rejectRoomRequest = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { reason } = req.body;
    const logistikId = req.user.id;
    
    // Verify user is logistik
    if (req.user.role !== 'logistik') {
      return res.status(403).json({ 
        success: false, 
        message: 'Hanya Logistik yang dapat menolak request ruangan' 
      });
    }
    
    // Get request details
    const requestResult = await client.query(
      'SELECT * FROM requests WHERE id = $1',
      [id]
    );
    
    if (requestResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ 
        success: false, 
        message: 'Request tidak ditemukan' 
      });
    }
    
    const request = requestResult.rows[0];
    
    // Update room rejection
    await client.query(`
      UPDATE requests 
      SET room_status = 'rejected',
          room_approved_by = $1,
          room_approved_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [logistikId, id]);
    
    // For pure room requests, reject the entire request
    let finalStatus = request.status;
    
    if (request.request_type === 'room') {
      finalStatus = 'rejected';
      await client.query(`
        UPDATE requests 
        SET status = 'rejected',
            approved_by = $1,
            approved_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [logistikId, id]);
    }
    
    // Log the status change
    await client.query(`
      INSERT INTO request_status_logs (request_id, changed_by, previous_status, new_status, notes)
      VALUES ($1, $2, $3, $4, $5)
    `, [id, logistikId, request.room_status, 'rejected', reason || 'Room request ditolak oleh Logistik']);
    
    // Send notification
    await sendNotification(
      request.user_id,
      id,
      `Room request Anda telah ditolak oleh Logistik. ${reason ? 'Alasan: ' + reason : ''}`,
      'rejection'
    );
    
    await client.query('COMMIT');
    
    res.status(200).json({
      success: true,
      message: 'Room request berhasil ditolak',
      data: {
        requestId: id,
        roomStatus: 'rejected',
        overallStatus: finalStatus,
        reason: reason || 'Ditolak oleh Logistik'
      }
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error rejecting room request:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Terjadi kesalahan server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    client.release();
  }
};

/**
 * Get available zoom accounts for admin selection
 */
export const getAvailableZoomAccounts = async (req, res) => {
  try {
    const { date, start_time, end_time, capacity } = req.query;
    
    if (!date || !start_time || !end_time || !capacity) {
      return res.status(400).json({
        success: false,
        message: 'Parameter date, start_time, end_time, dan capacity diperlukan'
      });
    }
    
    // Get all zoom accounts that can accommodate the capacity
    const result = await db.query(`
      SELECT zl.*, 
             CASE WHEN EXISTS (
               SELECT 1 FROM requests r
               WHERE r.zoom_link_id = zl.id
               AND r.date = $1
               AND (r.zoom_status = 'approved' OR r.status IN ('approved', 'pending'))
               AND (r.start_time < $3 AND r.end_time > $2)
             ) THEN false ELSE true END as is_available
      FROM zoom_links zl
      WHERE zl.is_active = true
      AND zl.max_capacity >= $4
      ORDER BY zl.max_capacity ASC, zl.zoom_account_name ASC
    `, [date, start_time, end_time, parseInt(capacity)]);
    
    res.status(200).json({
      success: true,
      data: result.rows
    });
    
  } catch (error) {
    console.error('Error getting available zoom accounts:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

/**
 * Get available rooms for logistik selection
 */
export const getAvailableRooms = async (req, res) => {
  try {
    const { date, start_time, end_time, capacity } = req.query;
    
    if (!date || !start_time || !end_time || !capacity) {
      return res.status(400).json({
        success: false,
        message: 'Parameter date, start_time, end_time, dan capacity diperlukan'
      });
    }
    
    // Get all rooms that can accommodate the capacity
    const result = await db.query(`
      SELECT r.*, 
             CASE WHEN EXISTS (
               SELECT 1 FROM requests req
               WHERE req.room_id = r.id
               AND req.date = $1
               AND (req.room_status = 'approved' OR req.status IN ('approved', 'pending'))
               AND (req.start_time < $3 AND req.end_time > $2)
             ) THEN false ELSE true END as is_available
      FROM rooms r
      WHERE r.is_active = true
      AND r.capacity >= $4
      ORDER BY r.capacity ASC, r.room_name ASC
    `, [date, start_time, end_time, parseInt(capacity)]);
    
    res.status(200).json({
      success: true,
      data: result.rows
    });
    
  } catch (error) {
    console.error('Error getting available rooms:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};
