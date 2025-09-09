// helpers/zoomHelper.js
const db = require('../db');

const getAvailableZoomLinkId = async (date, startTime, endTime) => {
  const result = await db.query(`
    SELECT zl.id
    FROM zoom_links zl
    WHERE NOT EXISTS (
      SELECT 1 FROM requests r
      WHERE r.zoom_link_id = zl.id
      AND r.date = $1
      AND (
        ($2::time, $3::time) OVERLAPS (r.start_time, r.end_time)
      )
    )
    LIMIT 1;
  `, [date, startTime, endTime]);

  return result.rows[0]?.id || null;
};

module.exports = { getAvailableZoomLinkId };
