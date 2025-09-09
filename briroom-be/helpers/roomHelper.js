import db from '../config/db.js';

export async function findAvailableRoom(date, startTimestamp, endTimestamp, capacity) {
  console.log('=== findAvailableRoom Debug ===');
  console.log('Date:', date);
  console.log('Start:', startTimestamp);
  console.log('End:', endTimestamp);
  console.log('Capacity:', capacity);
  
  const result = await db.query(
    `SELECT * FROM rooms WHERE capacity >= $1`,
    [capacity]
  );

  const rooms = result.rows;
  console.log('Available rooms by capacity:', rooms.length);

  for (const room of rooms) {
    console.log(`Checking room ${room.id} (${room.room_name}, capacity: ${room.capacity})`);
    
    const conflictResult = await db.query(
      `SELECT * FROM requests 
       WHERE room_id = $1 
       AND date = $2 
       AND status IN ('pending', 'approved') 
       AND ($3::timestamp < (date + end_time)::timestamp AND $4::timestamp > (date + start_time)::timestamp)`,
      [room.id, date, startTimestamp, endTimestamp]
    );

    console.log(`Room ${room.id} conflicts:`, conflictResult.rows.length);
    
    if (conflictResult.rows.length === 0) {
      console.log(`✅ Room ${room.id} is available!`);
      return room; // ✅ tersedia
    } else {
      console.log(`❌ Room ${room.id} is not available due to conflicts:`, conflictResult.rows);
    }
  }

  console.log('❌ No rooms available');
  return null; // ❌ Tidak ada ruangan tersedia
}
