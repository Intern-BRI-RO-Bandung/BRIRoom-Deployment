import React, { useState } from 'react';
import axios from 'axios';

const RoomApproval = ({ requestId }) => {
  const [roomId, setRoomId] = useState('');
  const [notes, setNotes] = useState('');

  const handleApprove = async () => {
    try {
      const response = await axios.patch(
        `http://localhost:5001/api/workflow/logistik/room/${requestId}/approve`,
        {
          room_id: roomId,
          notes,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('logistikToken')}`,
            'Content-Type': 'application/json',
          },
        }
      );
      console.log('Approval successful:', response.data);
    } catch (error) {
      console.error('Error approving request:', error);
    }
  };

  return (
    <div>
      <h3>Approve Room Request</h3>
      <input
        type="text"
        placeholder="Room ID"
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
      />
      <textarea
        placeholder="Notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
      <button onClick={handleApprove}>Approve</button>
    </div>
  );
};

export default RoomApproval;