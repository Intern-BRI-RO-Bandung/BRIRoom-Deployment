import pool from '../config/db.js';

export const getAlternativeTimeSlot = async (idColumn, idValue, date, durationMinutes = 60) => {
  const query = `
    SELECT end_time FROM requests
    WHERE ${idColumn} = $1
    AND date = $2
    AND status IN ('pending', 'approved')
    ORDER BY end_time DESC
    LIMIT 1
  `;
  const result = await pool.query(query, [idValue, date]);

  if (result.rows.length > 0) {
    const lastEnd = result.rows[0].end_time;
    const altStart = new Date(`1970-01-01T${lastEnd}`);
    altStart.setMinutes(altStart.getMinutes() + 15);
    const altEnd = new Date(altStart.getTime() + durationMinutes * 60000);

    const pad = (n) => n.toString().padStart(2, '0');
    const timeToString = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}:00`;

    return {
      suggestion: {
        start_time: timeToString(altStart),
        end_time: timeToString(altEnd)
      }
    };
  }

  return null;
};
