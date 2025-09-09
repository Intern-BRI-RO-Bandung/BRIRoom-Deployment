import db from '../config/db.js';


export async function sendNotification(userId, message, type = 'info') {
  try {
    await db.query(
      `INSERT INTO notifications (user_id, message, type, is_read, created_at)
       VALUES ($1, $2, $3, false, NOW())`,
      [userId, message, type]
    );
    console.log(`Notifikasi berhasil dikirim ke user ${userId}: ${message}`);
  } catch (err) {
    console.error('Gagal mengirim notifikasi:', err.message);
  }
}

export const getMyNotifications = async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await db.query(
      `SELECT * FROM notifications 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error getMyNotifications:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server', error: error.message });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const notifId = req.params.id;

    const result = await db.query(
      `UPDATE notifications SET is_read = true WHERE id = $1 RETURNING *`,
      [notifId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Notifikasi tidak ditemukan' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error markAsRead:', error);
    res.status(500).json({ message: 'Gagal menandai notifikasi sebagai terbaca', error: error.message });
  }
};

