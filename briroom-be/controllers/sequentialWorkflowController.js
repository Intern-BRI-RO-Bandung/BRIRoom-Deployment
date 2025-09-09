// Sequential Workflow Controller - BPMN Process dengan alur berurutan
import db from '../config/db.js';
import { sendNotification } from './notificationController.js';
import { sendWhatsAppMessage } from '../services/whatsappService.js';

/**
 * SEQUENTIAL BPMN WORKFLOW:
 * 1. User → Submit request
 * 2. Admin IT → Validate form & check Zoom availability first
 * 3. Admin IT → If Zoom OK, forward to Logistik for room
 * 4. Logistik → Approve/Reject room
 * 5. Admin IT → Send final notification to User
 */

// Helper function to find available zoom link
const findAvailableZoomLink = async (date, start_time, end_time) => {
  const result = await db.query(`
    SELECT zl.*
    FROM zoom_links zl
    WHERE zl.is_active = true
    AND NOT EXISTS (
      SELECT 1 FROM requests r
      WHERE r.zoom_link_id = zl.id
      AND r.date = $1
      AND r.status IN ('approved', 'validated_by_admin')
      AND (
        (r.start_time < $3 AND r.end_time > $2)
      )
    )
    LIMIT 1
  `, [date, start_time, end_time]);

  return result.rows[0] || null;
};

// ===== ADMIN IT FUNCTIONS (Step 1: Initial Validation & Zoom Check) =====

export const getPendingRequests = async (req, res) => {
  try {
    // Admin IT gets all pending requests for initial validation
    const result = await db.query(
      `SELECT r.*, u.name as user_name, u.email as user_email,
              rm.room_name, zl.zoom_link, zl.zoom_account_name
       FROM requests r
       JOIN users u ON r.user_id = u.id
       LEFT JOIN rooms rm ON r.room_id = rm.id
       LEFT JOIN zoom_links zl ON r.zoom_link_id = zl.id
       WHERE r.status = 'pending'
       ORDER BY r.created_at DESC`
    );
    
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error getPendingRequests:', error);
    res.status(500).json({ message: 'Gagal mengambil data requests', error: error.message });
  }
};

export const validateAndProcessZoom = async (req, res) => {
  const { id } = req.params;
  const { zoom_link_id, notes } = req.body;
  const adminId = req.user.id;

  try {
    // Pastikan user adalah admin IT
    if (req.user.role !== 'admin_it') {
      return res.status(403).json({ message: 'Hanya Admin IT yang bisa memvalidasi' });
    }

    // Get request data
    const requestResult = await db.query('SELECT * FROM requests WHERE id = $1', [id]);
    const request = requestResult.rows[0];

    if (!request) {
      return res.status(404).json({ message: 'Request tidak ditemukan' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request sudah diproses sebelumnya' });
    }

    let assignedZoomId = null; // Declare outside if blocks for scope access

    // Process based on request type
    if (request.request_type === 'zoom' || request.request_type === 'both') {
      // Check zoom availability
      assignedZoomId = zoom_link_id || request.zoom_link_id;
      
      if (!assignedZoomId) {
        // Auto-assign available zoom
        const availableZoom = await findAvailableZoomLink(request.date, request.start_time, request.end_time);
        if (!availableZoom) {
          // No zoom available - reject request
          await db.query(
            `UPDATE requests SET 
             status = 'rejected', 
             zoom_status = 'rejected',
             zoom_notes = $1,
             updated_at = CURRENT_TIMESTAMP
             WHERE id = $2`,
            ['Zoom tidak tersedia pada waktu tersebut', id]
          );

          // Log status change
          await db.query(
            `INSERT INTO request_status_logs (request_id, changed_by, previous_status, new_status, notes, status_type)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [id, adminId, 'pending', 'rejected', 'Zoom tidak tersedia', 'zoom_status']
          );

          // Send notification to user
          await sendNotification(request.user_id, `Permintaan Anda ditolak karena Zoom tidak tersedia pada ${request.date} ${request.start_time}-${request.end_time}`, 'error');
          
          if (request.whatsapp_number) {
            await sendWhatsAppMessage(request.whatsapp_number, `Permintaan "${request.title}" ditolak karena Zoom tidak tersedia pada waktu tersebut.`);
          }

          return res.json({ 
            success: true, 
            message: 'Request ditolak karena Zoom tidak tersedia',
            action: 'rejected'
          });
        }
        assignedZoomId = availableZoom.id;
      }

      // Zoom tersedia - update dengan zoom assignment
      await db.query(
        `UPDATE requests SET 
         zoom_link_id = $1,
         zoom_status = 'approved',
         zoom_notes = $2,
         updated_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        [assignedZoomId, notes || 'Zoom tersedia dan sudah diassign', id]
      );

      // Log zoom approval
      await db.query(
        `INSERT INTO request_status_logs (request_id, changed_by, previous_status, new_status, notes, status_type)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [id, adminId, 'pending', 'approved', `Zoom approved: ${notes || ''}`, 'zoom_status']
      );
    }

    // If request needs room approval, forward to logistik
    if (request.request_type === 'room' || request.request_type === 'both') {
      await db.query(
        `UPDATE requests SET 
         status = 'validated_by_admin',
         updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [id]
      );

      // Log forwarding to logistik
      await db.query(
        `INSERT INTO request_status_logs (request_id, changed_by, previous_status, new_status, notes, status_type)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [id, adminId, 'pending', 'validated_by_admin', 'Diteruskan ke Logistik untuk approval ruangan', 'overall']
      );

      return res.json({ 
        success: true, 
        message: 'Request divalidasi dan diteruskan ke Logistik untuk approval ruangan',
        action: 'forwarded_to_logistik'
      });
    } else {
      // Zoom-only request is complete
      await db.query(
        `UPDATE requests SET 
         status = 'approved',
         zoom_approved_by = $1,
         zoom_approved_at = CURRENT_TIMESTAMP,
         updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [adminId, id]
      );

      // Get zoom link details for notification
      const zoomResult = await db.query('SELECT * FROM zoom_links WHERE id = $1', [assignedZoomId]);
      const zoomLink = zoomResult.rows[0];

      // Send final notification to user
      await sendNotification(request.user_id, `Permintaan Zoom Anda telah disetujui. Link: ${zoomLink.zoom_link}`, 'success');
      
      if (request.whatsapp_number) {
        await sendWhatsAppMessage(request.whatsapp_number, `Permintaan Zoom "${request.title}" telah DISETUJUI. Link: ${zoomLink.zoom_link}`);
      }

      return res.json({ 
        success: true, 
        message: 'Request Zoom berhasil disetujui',
        action: 'approved',
        data: { zoom_link: zoomLink.zoom_link }
      });
    }

  } catch (error) {
    console.error('Error validateAndProcessZoom:', error);
    res.status(500).json({ message: 'Gagal memproses request', error: error.message });
  }
};

export const rejectRequest = async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const adminId = req.user.id;

  try {
    if (req.user.role !== 'admin_it') {
      return res.status(403).json({ message: 'Hanya Admin IT yang bisa menolak request' });
    }

    const requestResult = await db.query('SELECT * FROM requests WHERE id = $1', [id]);
    const request = requestResult.rows[0];

    if (!request) {
      return res.status(404).json({ message: 'Request tidak ditemukan' });
    }

    await db.query(
      `UPDATE requests SET 
       status = 'rejected',
       updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [id]
    );

    // Log rejection
    await db.query(
      `INSERT INTO request_status_logs (request_id, changed_by, previous_status, new_status, notes, status_type)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, adminId, request.status, 'rejected', reason || 'Ditolak oleh Admin IT', 'overall']
    );

    // Send notification
    await sendNotification(request.user_id, `Permintaan Anda ditolak oleh Admin IT. Alasan: ${reason || ''}`, 'error');
    
    if (request.whatsapp_number) {
      await sendWhatsAppMessage(request.whatsapp_number, `Permintaan "${request.title}" ditolak oleh Admin IT. ${reason || ''}`);
    }

    res.json({ 
      success: true, 
      message: 'Request berhasil ditolak',
      data: { reason }
    });
  } catch (error) {
    console.error('Error rejectRequest:', error);
    res.status(500).json({ message: 'Gagal menolak request', error: error.message });
  }
};

// ===== LOGISTIK FUNCTIONS (Step 2: Room Approval) =====

export const getValidatedRequests = async (req, res) => {
  try {
    // Logistik hanya melihat request yang sudah divalidasi admin IT
    const result = await db.query(
      `SELECT r.*, u.name as user_name, u.email as user_email,
              rm.room_name, rm.capacity as room_capacity,
              zl.zoom_link, zl.zoom_account_name
       FROM requests r
       JOIN users u ON r.user_id = u.id
       LEFT JOIN rooms rm ON r.room_id = rm.id
       LEFT JOIN zoom_links zl ON r.zoom_link_id = zl.id
       WHERE r.status = 'validated_by_admin'
       AND r.request_type IN ('room', 'both')
       ORDER BY r.created_at DESC`
    );
    
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error getValidatedRequests:', error);
    res.status(500).json({ message: 'Gagal mengambil data requests', error: error.message });
  }
};

export const approveRoomRequest = async (req, res) => {
  const { id } = req.params;
  const { room_id, notes } = req.body;
  const logistikId = req.user.id;

  try {
    if (req.user.role !== 'logistik') {
      return res.status(403).json({ message: 'Hanya Logistik yang bisa approve ruangan' });
    }

    const requestResult = await db.query('SELECT * FROM requests WHERE id = $1', [id]);
    const request = requestResult.rows[0];

    if (!request) {
      return res.status(404).json({ message: 'Request tidak ditemukan' });
    }

    if (request.status !== 'validated_by_admin') {
      return res.status(400).json({ message: 'Request belum divalidasi Admin IT' });
    }

    // Assign room if provided, or use existing
    const finalRoomId = room_id || request.room_id;

    // Update room approval
    await db.query(
      `UPDATE requests SET 
       room_id = $1,
       room_status = 'approved',
       room_notes = $2,
       status = 'approved',
       room_approved_by = $3,
       room_approved_at = CURRENT_TIMESTAMP,
       updated_at = CURRENT_TIMESTAMP
       WHERE id = $4`,
      [finalRoomId, notes || 'Ruangan disetujui oleh Logistik', logistikId, id]
    );

    // Log room approval
    await db.query(
      `INSERT INTO request_status_logs (request_id, changed_by, previous_status, new_status, notes, status_type)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, logistikId, 'validated_by_admin', 'approved', `Room approved: ${notes || ''}`, 'room_status']
    );

    // Get room and zoom details for final notification
    let roomInfo = '';
    let zoomInfo = '';
    
    if (finalRoomId) {
      const roomResult = await db.query('SELECT * FROM rooms WHERE id = $1', [finalRoomId]);
      if (roomResult.rows.length > 0) {
        const room = roomResult.rows[0];
        roomInfo = `Ruangan: ${room.room_name} (${room.location})`;
      }
    }

    if (request.zoom_link_id) {
      const zoomResult = await db.query('SELECT * FROM zoom_links WHERE id = $1', [request.zoom_link_id]);
      if (zoomResult.rows.length > 0) {
        const zoom = zoomResult.rows[0];
        zoomInfo = `Zoom: ${zoom.zoom_link}`;
      }
    }

    // Send final notification to user with complete info
    const finalMessage = `Permintaan Anda telah DISETUJUI! ${roomInfo} ${zoomInfo}`;
    await sendNotification(request.user_id, finalMessage, 'success');
    
    if (request.whatsapp_number) {
      await sendWhatsAppMessage(request.whatsapp_number, `Permintaan "${request.title}" telah DISETUJUI! ${finalMessage}`);
    }

    res.json({ 
      success: true, 
      message: 'Ruangan berhasil disetujui dan notifikasi terkirim ke user',
      data: { room_info: roomInfo, zoom_info: zoomInfo }
    });
  } catch (error) {
    console.error('Error approveRoomRequest:', error);
    res.status(500).json({ message: 'Gagal approve ruangan', error: error.message });
  }
};

export const rejectRoomRequest = async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const logistikId = req.user.id;

  try {
    if (req.user.role !== 'logistik') {
      return res.status(403).json({ message: 'Hanya Logistik yang bisa reject ruangan' });
    }

    const requestResult = await db.query('SELECT * FROM requests WHERE id = $1', [id]);
    const request = requestResult.rows[0];

    if (!request) {
      return res.status(404).json({ message: 'Request tidak ditemukan' });
    }

    if (request.status !== 'validated_by_admin') {
      return res.status(400).json({ message: 'Request belum divalidasi Admin IT' });
    }

    // Reject room request
    await db.query(
      `UPDATE requests SET 
       room_status = 'rejected',
       room_notes = $1,
       status = 'rejected',
       updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [reason || 'Ruangan ditolak oleh Logistik', id]
    );

    // Log room rejection
    await db.query(
      `INSERT INTO request_status_logs (request_id, changed_by, previous_status, new_status, notes, status_type)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, logistikId, 'validated_by_admin', 'rejected', `Room rejected: ${reason || ''}`, 'room_status']
    );

    // Send notification to user
    await sendNotification(request.user_id, `Permintaan ruangan Anda ditolak oleh Logistik. Alasan: ${reason || ''}`, 'error');
    
    if (request.whatsapp_number) {
      await sendWhatsAppMessage(request.whatsapp_number, `Permintaan ruangan "${request.title}" ditolak oleh Logistik. ${reason || ''}`);
    }

    res.json({ 
      success: true, 
      message: 'Ruangan berhasil ditolak',
      data: { reason }
    });
  } catch (error) {
    console.error('Error rejectRoomRequest:', error);
    res.status(500).json({ message: 'Gagal reject ruangan', error: error.message });
  }
};

// ===== DASHBOARD STATS =====

export const getAdminItStats = async (req, res) => {
  try {
    const stats = await db.query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'pending') as pending_validation,
        COUNT(*) FILTER (WHERE status = 'approved' AND request_type = 'zoom') as approved_zoom_only,
        COUNT(*) FILTER (WHERE status = 'validated_by_admin') as forwarded_to_logistik,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected_total,
        COUNT(*) as total_requests
      FROM requests
    `);

    res.json({ 
      success: true, 
      data: { 
        stats: stats.rows[0] 
      } 
    });
  } catch (error) {
    console.error('Error getAdminItStats:', error);
    res.status(500).json({ message: 'Gagal mengambil statistik', error: error.message });
  }
};

export const getLogistikStats = async (req, res) => {
  try {
    const stats = await db.query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'validated_by_admin' AND request_type IN ('room', 'both')) as pending_rooms,
        COUNT(*) FILTER (WHERE room_status = 'approved') as approved_rooms,
        COUNT(*) FILTER (WHERE room_status = 'rejected') as rejected_rooms,
        COUNT(*) FILTER (WHERE request_type IN ('room', 'both')) as total_room_requests
      FROM requests
    `);

    res.json({ 
      success: true, 
      data: { 
        stats: stats.rows[0] 
      } 
    });
  } catch (error) {
    console.error('Error getLogistikStats:', error);
    res.status(500).json({ message: 'Gagal mengambil statistik', error: error.message });
  }
};
