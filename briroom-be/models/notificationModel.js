import pool from '../config/db.js';

export const createNotification = async ({ user_id, request_id, message }) => {
  const result = await pool.query(
    `INSERT INTO notifications (user_id, request_id, message) 
     VALUES ($1, $2, $3) RETURNING *`,
    [user_id, request_id, message]
  );
  return result.rows[0];
};
