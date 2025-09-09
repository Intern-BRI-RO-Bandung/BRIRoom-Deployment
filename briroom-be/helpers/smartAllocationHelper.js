// helpers/smartAllocationHelper.js
import pool from '../config/db.js';

/**
 * Find available zoom account based on capacity and time slot
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {string} startTime - Start time in HH:MM:SS format
 * @param {string} endTime - End time in HH:MM:SS format
 * @param {number} requestedCapacity - Number of participants requested
 * @returns {Object|null} Available zoom account or null
 */
export const findOptimalZoomAccount = async (date, startTime, endTime, requestedCapacity) => {
  try {
    // Find zoom accounts that can accommodate the requested capacity
    // Order by capacity ascending to get the most efficient allocation
    const result = await pool.query(`
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
      LIMIT 1
    `, [date, startTime, endTime, requestedCapacity]);

    return result.rows[0] || null;
  } catch (error) {
    console.error('Error finding optimal zoom account:', error);
    return null;
  }
};

/**
 * Find available room based on capacity and time slot
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {string} startTime - Start time in HH:MM:SS format
 * @param {string} endTime - End time in HH:MM:SS format
 * @param {number} requestedCapacity - Number of participants requested
 * @returns {Object|null} Available room or null
 */
export const findOptimalRoom = async (date, startTime, endTime, requestedCapacity) => {
  try {
    // Find rooms that can accommodate the requested capacity
    // Order by capacity ascending to get the most efficient allocation
    const result = await pool.query(`
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
      LIMIT 1
    `, [date, startTime, endTime, requestedCapacity]);

    return result.rows[0] || null;
  } catch (error) {
    console.error('Error finding optimal room:', error);
    return null;
  }
};

/**
 * Get alternative time slots when requested time is not available
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {string} startTime - Start time in HH:MM:SS format
 * @param {string} endTime - End time in HH:MM:SS format
 * @param {number} requestedCapacity - Number of participants requested
 * @param {string} resourceType - 'room' or 'zoom'
 * @returns {Array} Array of alternative time slots
 */
export const getAlternativeSlots = async (date, startTime, endTime, requestedCapacity, resourceType) => {
  try {
    const duration = calculateDuration(startTime, endTime);
    const alternatives = [];
    
    // Check slots before and after the requested time
    const timeSlots = generateTimeSlots(date, duration);
    
    for (const slot of timeSlots) {
      let availableResource;
      
      if (resourceType === 'zoom') {
        availableResource = await findOptimalZoomAccount(date, slot.start, slot.end, requestedCapacity);
      } else {
        availableResource = await findOptimalRoom(date, slot.start, slot.end, requestedCapacity);
      }
      
      if (availableResource) {
        alternatives.push({
          startTime: slot.start,
          endTime: slot.end,
          resource: availableResource
        });
      }
      
      // Return max 3 alternatives
      if (alternatives.length >= 3) break;
    }
    
    return alternatives;
  } catch (error) {
    console.error('Error getting alternative slots:', error);
    return [];
  }
};

/**
 * Calculate duration between two times
 */
function calculateDuration(startTime, endTime) {
  const start = new Date(`2000-01-01 ${startTime}`);
  const end = new Date(`2000-01-01 ${endTime}`);
  return (end - start) / (1000 * 60); // Duration in minutes
}

/**
 * Generate possible time slots for alternatives
 */
function generateTimeSlots(date, duration) {
  const slots = [];
  const workingHours = {
    start: 8, // 08:00
    end: 17   // 17:00
  };
  
  for (let hour = workingHours.start; hour <= workingHours.end - (duration / 60); hour++) {
    for (let minute = 0; minute < 60; minute += 30) { // 30-minute intervals
      const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
      const endMinutes = minute + duration;
      const endHour = hour + Math.floor(endMinutes / 60);
      const endMinute = endMinutes % 60;
      const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}:00`;
      
      if (endHour <= workingHours.end) {
        slots.push({ start: startTime, end: endTime });
      }
    }
  }
  
  return slots;
}

/**
 * Check if a request can be automatically approved based on resource availability
 * @param {Object} requestData - Request data
 * @returns {Object} Approval result with recommendations
 */
export const checkAutoApproval = async (requestData) => {
  const { date, start_time, end_time, capacity, request_type } = requestData;
  
  const result = {
    canAutoApprove: false,
    roomAvailable: null,
    zoomAvailable: null,
    alternatives: {},
    recommendations: []
  };
  
  try {
    // Check room availability if needed
    if (request_type === 'room' || request_type === 'both') {
      result.roomAvailable = await findOptimalRoom(date, start_time, end_time, capacity);
      
      if (!result.roomAvailable) {
        result.alternatives.room = await getAlternativeSlots(date, start_time, end_time, capacity, 'room');
      }
    }
    
    // Check zoom availability if needed
    if (request_type === 'zoom' || request_type === 'both') {
      result.zoomAvailable = await findOptimalZoomAccount(date, start_time, end_time, capacity);
      
      if (!result.zoomAvailable) {
        result.alternatives.zoom = await getAlternativeSlots(date, start_time, end_time, capacity, 'zoom');
      }
    }
    
    // Determine if can auto-approve
    if (request_type === 'room') {
      result.canAutoApprove = !!result.roomAvailable;
    } else if (request_type === 'zoom') {
      result.canAutoApprove = !!result.zoomAvailable;
    } else { // both
      result.canAutoApprove = !!(result.roomAvailable && result.zoomAvailable);
    }
    
    // Generate recommendations
    if (result.roomAvailable) {
      result.recommendations.push(`Room tersedia: ${result.roomAvailable.room_name} (kapasitas ${result.roomAvailable.capacity})`);
    }
    
    if (result.zoomAvailable) {
      result.recommendations.push(`Zoom tersedia: ${result.zoomAvailable.zoom_account_name} (kapasitas ${result.zoomAvailable.max_capacity})`);
    }
    
    return result;
  } catch (error) {
    console.error('Error checking auto approval:', error);
    return result;
  }
};

export default {
  findOptimalZoomAccount,
  findOptimalRoom,
  getAlternativeSlots,
  checkAutoApproval
};
