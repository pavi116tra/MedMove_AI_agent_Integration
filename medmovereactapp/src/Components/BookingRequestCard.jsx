import React from 'react';
import './BookingRequestCard.css';

const BookingRequestCard = ({ booking, onAccept, onReject, onComplete }) => {
  return (
    <div className="booking-card detail-card">
      <div className="booking-header">
        <div className={`status-badge ${booking.status}`}>
          {booking.status === 'confirmed' ? '🟡 Active' : 
           booking.status === 'completed' ? '✅ Completed' : 
           booking.status === 'pending' ? '🔔 New Request' : booking.status}
        </div>
        <div className="booking-id">#MED{String(booking.id).padStart(4, '0')}</div>
      </div>

      <div className="booking-sections-grid">
        <div className="card-section">
          <h4>👤 Patient Details</h4>
          <p><strong>Name:</strong> {booking.patient_name}</p>
          <p><strong>Age:</strong> {booking.patient_age}</p>
          <p><strong>Condition:</strong> {booking.patient_condition || 'N/A'}</p>
          <div className="tags-row">
            {booking.need_oxygen && <span className="tag-pill">💨 Oxygen</span>}
            {booking.wheelchair && <span className="tag-pill">♿ Wheelchair</span>}
          </div>
        </div>

        <div className="card-section">
          <h4>📱 Booked By</h4>
          <p><strong>Name:</strong> {booking.full_name}</p>
          <p><strong>Phone:</strong> {booking.user_phone}</p>
        </div>

        <div className="card-section">
          <h4>📍 Trip Details</h4>
          <p><strong>Route:</strong> {booking.pickup_location} → {booking.drop_location}</p>
          <p><strong>Date:</strong> {booking.booking_date}</p>
          <p><strong>Time:</strong> {booking.booking_time}</p>
          <p><strong>Distance:</strong> {booking.distance_km} km</p>
        </div>

        <div className="card-section">
          <h4>🚑 Ambulance</h4>
          <p><strong>Vehicle:</strong> {booking.vehicle_number}</p>
          <p><strong>Driver:</strong> {booking.driver_name}</p>
          <p><strong>Type:</strong> {booking.ambulance_type?.toUpperCase()}</p>
        </div>
      </div>

      <div className="card-footer-info">
        <div className="fare-display">
          <span>Total Fare:</span>
          <span className="fare-amt">₹{booking.total_price}</span>
        </div>

        {booking.status === 'pending' && (
          <div className="booking-actions">
            <button className="accept-btn" onClick={() => onAccept(booking.id)}>✅ Accept</button>
            <button className="reject-btn" onClick={() => onReject(booking.id)}>❌ Reject</button>
          </div>
        )}

        {booking.status === 'confirmed' && (
          <button className="complete-btn full-width" onClick={() => onComplete(booking.id)}>
            ✅ Mark Trip as Completed
          </button>
        )}

        {booking.status === 'completed' && (
          <div className="completed-label">🏁 Trip Successfully Completed</div>
        )}
      </div>
    </div>
  );
};

export default BookingRequestCard;
