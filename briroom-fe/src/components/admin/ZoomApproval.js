import React, { useState } from 'react';
import axios from 'axios';

const ZoomApproval = ({ requestId }) => {
  const [zoomLinkId, setZoomLinkId] = useState('');
  const [notes, setNotes] = useState('');

  const handleApprove = async () => {
    try {
      const response = await axios.patch(
        `http://localhost:5001/api/requests/admin/${requestId}/approve`,
        {
          zoom_link_id: zoomLinkId,
          reason: notes,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
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
      <h3> Zoom Request</h3>Approve
      <input
        type="text"
        placeholder="Zoom Link ID"
        value={zoomLinkId}
        onChange={(e) => setZoomLinkId(e.target.value)}
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

export default ZoomApproval;