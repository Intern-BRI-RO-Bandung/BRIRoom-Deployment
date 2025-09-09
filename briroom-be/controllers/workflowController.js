// controllers/workflowController.js
import db from '../config/db.js';
import { sendNotification } from './notificationController.js';
import { sendWhatsAppMessage } from '../services/whatsappService.js';

/**
 * WORKFLOW CONTROLLER - Mengatur alur BPMN sesuai role
 * 
 * BPMN LANES:
 * 1. USER (Lane Atas): Mengajukan request, menerima notifikasi
 * 2. ADMIN IT (Lane Tengah): Handle approval ZOOM saja
 * 3. LOGISTIK (Lane Bawah): Handle approval ROOM saja
 */

// ===== LOGISTIK FUNCTIONS (Room Approval Only) =====

export const getRoomRequests = async (req, res) => {
  try {
    // Hanya ambil request yang perlu approval ruangan
    const result = await db.query(
      `SELECT r.*, u.name as user_name, u.email as user_email,
              rm.room_name, rm.capacity as room_capacity
       FROM requests r
       JOIN users u ON r.user_id = u.id
       LEFT JOIN rooms rm ON r.room_id = rm.id
       WHERE r.room_status = 'pending'
       AND r.request_type IN ('room', 'both')
       ORDER BY r.created_at DESC`
    );
    
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error getRoomRequests:', error);
    res.status(500).json({ message: 'Gagal mengambil data requests' });
  }
};

export const approveRoomRequest = async (req, res) => {
  const { id } = req.params;
  const { room_id, notes, room_notes, admin_notes } = req.body;
  const approverId = req.user.id;

  console.log('🔍 DEBUG workflowController approveRoomRequest:', {
    id,
    room_id,
    notes,
    room_notes,
    admin_notes,
    body: req.body
  });

  try {
    // Pastikan user adalah logistik
    if (req.user.role !== 'logistik') {
      return res.status(403).json({ message: 'Hanya logistik yang bisa approve ruangan' });
    }

    // Update room_status menjadi approved
    const result = await db.query(
      `UPDATE requests 
       SET room_status = 'approved', 
           room_id = COALESCE($2, room_id),
           room_approved_by = $3,
           room_approved_at = NOW(),
           room_notes = $4,
           admin_notes = $5,
           updated_at = NOW()
       WHERE id = $1 AND (room_status = 'pending' OR room_status IS NULL)
       RETURNING *`,
      [id, room_id, approverId, notes || room_notes || admin_notes, admin_notes || room_notes]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Request tidak ditemukan atau sudah diproses' });
    }

    const request = result.rows[0];

    // Cek apakah overall status perlu diupdate
    await updateOverallStatus(id);

    // Kirim notifikasi ke user
    await sendNotification(request.user_id, 'room_approved', 
      `Ruangan untuk "${request.title}" telah disetujui`);

    // Log aktivitas
    await db.query(
      `INSERT INTO request_status_logs (request_id, status_type, old_status, new_status, changed_by, notes)
       VALUES ($1, 'room_status', 'pending', 'approved', $2, $3)`,
      [id, approverId, notes || 'Approved by logistik']
    );

    res.json({ 
      success: true, 
      message: 'Ruangan berhasil disetujui',
      data: request 
    });
  } catch (error) {
    console.error('Error approveRoomRequest:', error);
    if (error && error.stack) {
      console.error(error.stack);
    }
    res.status(500).json({ message: 'Gagal approve request', error: error.message, stack: error.stack });
  }
};

export const rejectRoomRequest = async (req, res) => {
  const { id } = req.params;
  const { notes } = req.body;
  const approverId = req.user.id;

  try {
    // Pastikan user adalah logistik
    if (req.user.role !== 'logistik') {
      return res.status(403).json({ message: 'Hanya logistik yang bisa reject ruangan' });
    }

    // Update room_status menjadi rejected
    const result = await db.query(
      `UPDATE requests 
       SET room_status = 'rejected',
           room_approved_by = $2,
           room_approved_at = NOW(), 
           room_notes = $3,
           status = 'rejected',
           updated_at = NOW()
       WHERE id = $1 AND room_status = 'pending'
       RETURNING *`,
      [id, approverId, notes]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Request tidak ditemukan atau sudah diproses' });
    }

    const request = result.rows[0];

    // Kirim notifikasi ke user
    await sendNotification(request.user_id, 'room_rejected', 
      `Ruangan untuk "${request.title}" ditolak. Alasan: ${notes}`);

    // Log aktivitas
    await db.query(
      `INSERT INTO request_status_logs (request_id, status_type, old_status, new_status, changed_by, notes)
       VALUES ($1, 'room_status', 'pending', 'rejected', $2, $3)`,
      [id, approverId, notes || 'Rejected by logistik']
    );

    res.json({ 
      success: true, 
      message: 'Ruangan berhasil ditolak',
      data: request 
    });
  } catch (error) {
    console.error('Error rejectRoomRequest:', error);
    res.status(500).json({ message: 'Gagal reject request' });
  }
};

// ===== ADMIN IT FUNCTIONS (Zoom Approval Only) =====

export const getZoomRequests = async (req, res) => {
  try {
    // Hanya ambil request yang perlu approval zoom
    const result = await db.query(
      `SELECT r.*, u.name as user_name, u.email as user_email,
              zl.zoom_link, zl.max_capacity as zoom_capacity
       FROM requests r
       JOIN users u ON r.user_id = u.id
       LEFT JOIN zoom_links zl ON r.zoom_link_id = zl.id
       WHERE r.zoom_status = 'pending'
       AND r.request_type IN ('zoom', 'both')
       ORDER BY r.created_at DESC`
    );
    
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error getZoomRequests:', error);
    res.status(500).json({ message: 'Gagal mengambil data requests' });
  }
};

export const approveZoomRequest = async (req, res) => {
  const { id } = req.params;
  const { zoom_link_id, notes, admin_notes } = req.body;
  const approverId = req.user.id;

  console.log('🔍 DEBUG workflowController approveZoomRequest:', {
    id,
    zoom_link_id,
    notes,
    admin_notes,
    body: req.body
  });

  try {
    // Pastikan user adalah admin_it
    if (req.user.role !== 'admin_it') {
      return res.status(403).json({ message: 'Hanya admin IT yang bisa approve zoom' });
    }

    // Get zoom account information if zoom_link_id is provided
    let zoomAccountInfo = '';
    if (zoom_link_id) {
      const zoomResult = await db.query('SELECT zoom_account_name, max_capacity FROM zoom_links WHERE id = $1', [zoom_link_id]);
      if (zoomResult.rows.length > 0) {
        const zoom = zoomResult.rows[0];
        zoomAccountInfo = `Zoom ${zoom.zoom_account_name} (Kapasitas: ${zoom.max_capacity}) disetujui oleh admin IT`;
      }
    }

    // Use provided notes or generate from zoom account info
    const finalZoomNotes = notes || zoomAccountInfo || 'Zoom request disetujui oleh admin IT';

    // Update zoom_status menjadi approved
    const result = await db.query(
      `UPDATE requests 
       SET zoom_status = 'approved', 
           zoom_link_id = COALESCE($2, zoom_link_id),
           zoom_approved_by = $3,
           zoom_approved_at = NOW(),
           zoom_notes = $4,
           admin_notes = $5,
           updated_at = NOW()
       WHERE id = $1 AND zoom_status = 'pending'
       RETURNING *`,
      [id, zoom_link_id, approverId, finalZoomNotes, admin_notes]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Request tidak ditemukan atau sudah diproses' });
    }

    const request = result.rows[0];

    // Cek apakah overall status perlu diupdate
    await updateOverallStatus(id);

    // Kirim notifikasi ke user
    await sendNotification(request.user_id, 'zoom_approved', 
      `Zoom untuk "${request.title}" telah disetujui`);

    // Log aktivitas
    await db.query(
      `INSERT INTO request_status_logs (request_id, status_type, old_status, new_status, changed_by, notes)
       VALUES ($1, 'zoom_status', 'pending', 'approved', $2, $3)`,
      [id, approverId, admin_notes || notes || 'Approved by admin IT']
    );

    res.json({ 
      success: true, 
      message: 'Zoom berhasil disetujui',
      data: request 
    });
  } catch (error) {
    console.error('Error approveZoomRequest:', error);
    res.status(500).json({ message: 'Gagal approve request' });
  }
};

export const rejectZoomRequest = async (req, res) => {
  const { id } = req.params;
  const { notes } = req.body;
  const approverId = req.user.id;

  try {
    // Pastikan user adalah admin_it
    if (req.user.role !== 'admin_it') {
      return res.status(403).json({ message: 'Hanya admin IT yang bisa reject zoom' });
    }

    // Update zoom_status menjadi rejected
    const result = await db.query(
      `UPDATE requests 
       SET zoom_status = 'rejected',
           zoom_approved_by = $2,
           zoom_approved_at = NOW(), 
           zoom_notes = $3,
           status = 'rejected',
           updated_at = NOW()
       WHERE id = $1 AND zoom_status = 'pending'
       RETURNING *`,
      [id, approverId, notes]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Request tidak ditemukan atau sudah diproses' });
    }

    const request = result.rows[0];

    // Kirim notifikasi ke user
    await sendNotification(request.user_id, 'zoom_rejected', 
      `Zoom untuk "${request.title}" ditolak. Alasan: ${notes}`);

    // Log aktivitas
    await db.query(
      `INSERT INTO request_status_logs (request_id, status_type, old_status, new_status, changed_by, notes)
       VALUES ($1, 'zoom_status', 'pending', 'rejected', $2, $3)`,
      [id, approverId, notes || 'Rejected by admin IT']
    );

    res.json({ 
      success: true, 
      message: 'Zoom berhasil ditolak',
      data: request 
    });
  } catch (error) {
    console.error('Error rejectZoomRequest:', error);
    res.status(500).json({ message: 'Gagal reject request' });
  }
};

// ===== HELPER FUNCTIONS =====

export const updateOverallStatus = async (requestId) => {
  try {
    const result = await db.query(
      `SELECT request_type, room_status, zoom_status FROM requests WHERE id = $1`,
      [requestId]
    );

    if (result.rows.length === 0) return;

    const { request_type, room_status, zoom_status } = result.rows[0];
    let newStatus = 'pending';

    // Logika update overall status berdasarkan request_type
    if (request_type === 'room') {
      newStatus = room_status === 'approved' ? 'approved' : 
                 room_status === 'rejected' ? 'rejected' : 'pending';
    } else if (request_type === 'zoom') {
      newStatus = zoom_status === 'approved' ? 'approved' : 
                 zoom_status === 'rejected' ? 'rejected' : 'pending';
    } else if (request_type === 'both') {
      // Both harus kedua-duanya approved
      if (room_status === 'approved' && zoom_status === 'approved') {
        newStatus = 'approved';
      } else if (room_status === 'rejected' || zoom_status === 'rejected') {
        newStatus = 'rejected';
      } else {
        newStatus = 'pending';
      }
    }

    // Update overall status
    await db.query(
      `UPDATE requests SET status = $1, updated_at = NOW() WHERE id = $2`,
      [newStatus, requestId]
    );

    console.log(`✅ Overall status updated to: ${newStatus} for request ${requestId}`);
  } catch (error) {
    console.error('Error updateOverallStatus:', error);
  }
};

// ===== DASHBOARD FUNCTIONS =====

export const getLogistikDashboard = async (req, res) => {
  try {
    // Stats untuk logistik (hanya room-related)
    const stats = await db.query(`
      SELECT 
        COUNT(*) FILTER (WHERE room_status = 'pending' AND request_type IN ('room', 'both')) as pending_rooms,
        COUNT(*) FILTER (WHERE room_status = 'approved' AND request_type IN ('room', 'both')) as approved_rooms,
        COUNT(*) FILTER (WHERE room_status = 'rejected' AND request_type IN ('room', 'both')) as rejected_rooms,
        COUNT(*) FILTER (WHERE request_type IN ('room', 'both')) as total_room_requests
      FROM requests
      WHERE DATE(created_at) >= CURRENT_DATE - INTERVAL '30 days'
    `);

    // Recent room requests
    const recentRequests = await db.query(`
      SELECT r.*, u.name as user_name, rm.room_name
      FROM requests r
      JOIN users u ON r.user_id = u.id
      LEFT JOIN rooms rm ON r.room_id = rm.id
      WHERE r.request_type IN ('room', 'both')
      ORDER BY r.created_at DESC
      LIMIT 10
    `);

    res.json({
      success: true,
      data: {
        stats: stats.rows[0],
        recentRequests: recentRequests.rows
      }
    });
  } catch (error) {
    console.error('Error getLogistikDashboard:', error);
    res.status(500).json({ message: 'Gagal mengambil data dashboard' });
  }
};

export const getAdminItDashboard = async (req, res) => {
  try {
    // Stats untuk admin IT (hanya zoom-related)
    const stats = await db.query(`
      SELECT 
        COUNT(*) FILTER (WHERE zoom_status = 'pending' AND request_type IN ('zoom', 'both')) as pending_zooms,
        COUNT(*) FILTER (WHERE zoom_status = 'approved' AND request_type IN ('zoom', 'both')) as approved_zooms,
        COUNT(*) FILTER (WHERE zoom_status = 'rejected' AND request_type IN ('zoom', 'both')) as rejected_zooms,
        COUNT(*) FILTER (WHERE request_type IN ('zoom', 'both')) as total_zoom_requests
      FROM requests
      WHERE DATE(created_at) >= CURRENT_DATE - INTERVAL '30 days'
    `);

    // Recent zoom requests
    const recentRequests = await db.query(`
      SELECT r.*, u.name as user_name, zl.zoom_link
      FROM requests r
      JOIN users u ON r.user_id = u.id
      LEFT JOIN zoom_links zl ON r.zoom_link_id = zl.id
      WHERE r.request_type IN ('zoom', 'both')
      ORDER BY r.created_at DESC
      LIMIT 10
    `);

    res.json({
      success: true,
      data: {
        stats: stats.rows[0],
        recentRequests: recentRequests.rows
      }
    });
  } catch (error) {
    console.error('Error getAdminItDashboard:', error);
    res.status(500).json({ message: 'Gagal mengambil data dashboard' });
  }
};
