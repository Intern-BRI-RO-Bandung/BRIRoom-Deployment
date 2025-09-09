// BPMN Workflow Controller - Implementasi sesuai BPMN diagram
import db from '../config/db.js';
import { sendNotification } from './notificationController.js';
import { sendWhatsAppMessage } from '../services/whatsappService.js';

// Helper function untuk auto-assign zoom yang tersedia
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

// ===== ADMIN IT FUNCTIONS (Step 1: Validasi Form & Check Zoom) =====

export const getAdminItDashboard = async (req, res) => {
  try {
    const stats = await db.query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'pending') as pending_validation,
        COUNT(*) FILTER (WHERE status = 'validated_by_admin') as forwarded_to_logistik,
        COUNT(*) FILTER (WHERE status = 'approved' AND request_type = 'zoom') as approved_zoom_only,
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
    console.error('Error getAdminItDashboard:', error);
    res.status(500).json({ message: 'Gagal mengambil data dashboard', error: error.message });
  }
};

export const getPendingRequestsForAdminIt = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT r.*, u.name as user_name, u.email as user_email,
              rm.room_name, zl.zoom_link, zl.zoom_account_name
       FROM requests r
       JOIN users u ON r.user_id = u.id
       LEFT JOIN rooms rm ON r.room_id = rm.id
       LEFT JOIN zoom_links zl ON r.zoom_link_id = zl.id
       WHERE r.status = 'pending'
       ORDER BY r.created_at ASC`
    );
    
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error getPendingRequestsForAdminIt:', error);
    res.status(500).json({ message: 'Gagal mengambil data requests', error: error.message });
  }
};

export const adminItValidateRequest = async (req, res) => {
  const { id } = req.params;
  const { 
    zoom_link_id, 
    notes, 
    admin_notes,
    zoom_link_manual,
    zoom_meeting_id_manual,
    zoom_passcode_manual
  } = req.body;
  const adminId = req.user.id;

  console.log('🔍 DEBUG bpmnWorkflowController adminItValidateRequest:', {
    id,
    zoom_link_id,
    notes,
    admin_notes,
    zoom_link_manual,
    zoom_meeting_id_manual,
    zoom_passcode_manual,
    body: req.body
  });

  try {
    if (req.user.role !== 'admin_it') {
      return res.status(403).json({ message: 'Hanya Admin IT yang bisa memvalidasi' });
    }

    const requestResult = await db.query('SELECT * FROM requests WHERE id = $1', [id]);
    const request = requestResult.rows[0];

    if (!request) {
      return res.status(404).json({ message: 'Request tidak ditemukan' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request sudah diproses sebelumnya' });
    }

    let assignedZoomId = null;

    // Process Zoom untuk request yang membutuhkan Zoom
    if (request.request_type === 'zoom' || request.request_type === 'both') {
      assignedZoomId = zoom_link_id || request.zoom_link_id;
      
      if (!assignedZoomId) {
        // Auto-assign available zoom
        const availableZoom = await findAvailableZoomLink(request.date, request.start_time, request.end_time);
        if (!availableZoom) {
          // Zoom tidak tersedia - reject request
          await db.query(
            `UPDATE requests SET 
             status = 'rejected', 
             zoom_status = 'rejected',
             zoom_notes = $1,
             updated_at = CURRENT_TIMESTAMP
             WHERE id = $2`,
            ['Zoom tidak tersedia pada waktu tersebut', id]
          );

          await db.query(
            `INSERT INTO request_status_logs (request_id, changed_by, previous_status, new_status, notes, status_type)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [id, adminId, 'pending', 'rejected', 'Zoom tidak tersedia', 'zoom_status']
          );

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
      // Get zoom account information
      let zoomAccountInfo = 'Zoom tersedia dan sudah diassign';
      if (assignedZoomId) {
        const zoomResult = await db.query('SELECT zoom_account_name, max_capacity FROM zoom_links WHERE id = $1', [assignedZoomId]);
        if (zoomResult.rows.length > 0) {
          const zoom = zoomResult.rows[0];
          zoomAccountInfo = `Zoom ${zoom.zoom_account_name} (Kapasitas: ${zoom.max_capacity}) disetujui oleh admin IT`;
        }
      }

      await db.query(
        `UPDATE requests SET 
         zoom_link_id = $1,
         zoom_status = 'approved',
         zoom_notes = $2,
         admin_notes = $3,
         zoom_link_manual = $4,
         zoom_meeting_id_manual = $5,
         zoom_passcode_manual = $6,
         updated_at = CURRENT_TIMESTAMP
         WHERE id = $7`,
        [
          assignedZoomId, 
          notes || zoomAccountInfo, 
          admin_notes,
          zoom_link_manual,
          zoom_meeting_id_manual,
          zoom_passcode_manual,
          id
        ]
      );

      await db.query(
        `INSERT INTO request_status_logs (request_id, changed_by, previous_status, new_status, notes, status_type)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [id, adminId, 'pending', 'approved', `Zoom approved: ${notes || ''}`, 'zoom_status']
      );
    }

    // Jika request membutuhkan ruangan, forward ke logistik
    if (request.request_type === 'room' || request.request_type === 'both') {
      await db.query(
        `UPDATE requests SET 
         status = 'validated_by_admin',
         admin_notes = $1,
         zoom_link_manual = $2,
         zoom_meeting_id_manual = $3,
         zoom_passcode_manual = $4,
         updated_at = CURRENT_TIMESTAMP
         WHERE id = $5`,
        [admin_notes, zoom_link_manual, zoom_meeting_id_manual, zoom_passcode_manual, id]
      );

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
      // Zoom-only request selesai di Admin IT
      await db.query(
        `UPDATE requests SET 
         status = 'approved',
         zoom_approved_by = $1,
         zoom_approved_at = CURRENT_TIMESTAMP,
         admin_notes = $2,
         zoom_link_manual = $3,
         zoom_meeting_id_manual = $4,
         zoom_passcode_manual = $5,
         updated_at = CURRENT_TIMESTAMP
         WHERE id = $6`,
        [adminId, admin_notes, zoom_link_manual, zoom_meeting_id_manual, zoom_passcode_manual, id]
      );

      const zoomResult = await db.query('SELECT * FROM zoom_links WHERE id = $1', [assignedZoomId]);
      const zoomLink = zoomResult.rows[0];

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
    console.error('Error adminItValidateRequest:', error);
    res.status(500).json({ message: 'Gagal memproses request', error: error.message });
  }
};

export const adminItRejectRequest = async (req, res) => {
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

    await db.query(
      `INSERT INTO request_status_logs (request_id, changed_by, previous_status, new_status, notes, status_type)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, adminId, request.status, 'rejected', reason || 'Ditolak oleh Admin IT', 'overall']
    );

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
    console.error('Error adminItRejectRequest:', error);
    res.status(500).json({ message: 'Gagal menolak request', error: error.message });
  }
};

// ===== LOGISTIK FUNCTIONS (Step 2: Room Approval) =====

export const getLogistikDashboard = async (req, res) => {
  console.log('🚨 getLogistikDashboard function called!');
  try {
    // PERBAIKAN FINAL: Logistik dashboard menghitung semua request yang butuh room approval
    const stats = await db.query(`
      SELECT 
        COUNT(*) FILTER (WHERE 
          request_type IN ('room', 'both') 
          AND room_status = 'pending'
          AND status IN ('pending', 'validated_by_admin')
        ) as pending_rooms,
        COUNT(*) FILTER (WHERE room_status = 'approved') as approved_rooms,
        COUNT(*) FILTER (WHERE room_status = 'rejected') as rejected_rooms,
        COUNT(*) FILTER (WHERE request_type IN ('room', 'both')) as total_room_requests
      FROM requests
    `);
    
    // Get recent requests yang perlu diproses logistik (hanya pending, sama dengan bookings)
    console.log('🔍 Dashboard query about to execute...');
    const recentRequests = await db.query(
      `SELECT r.*, u.name as user_name, u.email as user_email,
              rm.room_name, zl.zoom_link, zl.zoom_account_name
       FROM requests r
       JOIN users u ON r.user_id = u.id
       LEFT JOIN rooms rm ON r.room_id = rm.id
       LEFT JOIN zoom_links zl ON r.zoom_link_id = zl.id
       WHERE r.request_type IN ('room', 'both')
       AND r.room_status = 'pending'
       AND r.status IN ('pending', 'validated_by_admin')
       ORDER BY r.created_at ASC`
    );
    
    // DEBUG: Log the results
    console.log('🔍 Dashboard recentRequests query results:', {
      count: recentRequests.rows.length,
      ids: recentRequests.rows.map(r => ({ id: r.id, title: r.title, room_status: r.room_status, status: r.status }))
    });
    
    console.log('🔍 Dashboard query executed, result count:', recentRequests.rows.length);
    
    res.json({ 
      success: true, 
      data: { 
        stats: stats.rows[0],
        recentRequests: recentRequests.rows
      } 
    });
  } catch (error) {
    console.error('Error getLogistikDashboard:', error);
    res.status(500).json({ message: 'Gagal mengambil data dashboard', error: error.message });
  }
};

export const getValidatedRequestsForLogistik = async (req, res) => {
  try {
    // PERBAIKAN FINAL: Logistik melihat semua request yang membutuhkan room approval
    // Tidak peduli status zoom, karena logistik bertanggung jawab untuk room
    const result = await db.query(
      `SELECT r.*, u.name as user_name, u.email as user_email,
              rm.room_name, rm.capacity as room_capacity,
              zl.zoom_link, zl.zoom_account_name
       FROM requests r
       JOIN users u ON r.user_id = u.id
       LEFT JOIN rooms rm ON r.room_id = rm.id
       LEFT JOIN zoom_links zl ON r.zoom_link_id = zl.id
       WHERE r.request_type IN ('room', 'both')
       AND r.room_status = 'pending'
       AND r.status IN ('pending', 'validated_by_admin')
       ORDER BY r.created_at ASC`
    );
    
    // DEBUG: Log the results
    console.log('🔍 Bookings validatedRequests query results:', {
      count: result.rows.length,
      ids: result.rows.map(r => ({ id: r.id, title: r.title, room_status: r.room_status, status: r.status }))
    });
    
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error getValidatedRequestsForLogistik:', error);
    res.status(500).json({ message: 'Gagal mengambil data requests', error: error.message });
  }
};

export const logistikApproveRoom = async (req, res) => {
  const { id } = req.params;
  const { room_id, notes, admin_notes } = req.body;
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

    // PERBAIKAN: Untuk request type 'both', logistik bisa approve room
    // meskipun Admin IT sudah approve zoom (status tidak perlu 'validated_by_admin')
    if (request.request_type === 'room' && request.status !== 'validated_by_admin') {
      return res.status(400).json({ message: 'Request belum divalidasi Admin IT' });
    }

    const finalRoomId = room_id || request.room_id;

    await db.query(
      `UPDATE requests SET 
       room_id = $1,
       room_status = 'approved',
       room_notes = $2,
       admin_notes = $3,
       status = 'approved',
       room_approved_by = $4,
       room_approved_at = CURRENT_TIMESTAMP,
       updated_at = CURRENT_TIMESTAMP
       WHERE id = $5`,
      [finalRoomId, notes || 'Ruangan disetujui oleh Logistik', admin_notes, logistikId, id]
    );

    await db.query(
      `INSERT INTO request_status_logs (request_id, changed_by, previous_status, new_status, notes, status_type)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, logistikId, 'validated_by_admin', 'approved', `Room approved: ${notes || ''}`, 'room_status']
    );

    // Get room and zoom details untuk final notification
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
    console.error('Error logistikApproveRoom:', error);
    res.status(500).json({ message: 'Gagal approve ruangan', error: error.message });
  }
};

export const logistikRejectRoom = async (req, res) => {
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

    await db.query(
      `UPDATE requests SET 
       room_status = 'rejected',
       room_notes = $1,
       status = 'rejected',
       updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [reason || 'Ruangan ditolak oleh Logistik', id]
    );

    await db.query(
      `INSERT INTO request_status_logs (request_id, changed_by, previous_status, new_status, notes, status_type)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, logistikId, 'validated_by_admin', 'rejected', `Room rejected: ${reason || ''}`, 'room_status']
    );

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
    console.error('Error logistikRejectRoom:', error);
    res.status(500).json({ message: 'Gagal reject ruangan', error: error.message });
  }
};
