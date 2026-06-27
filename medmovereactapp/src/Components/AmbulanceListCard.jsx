import React from 'react';
import './AmbulanceListCard.css';

const AmbulanceListCard = ({ ambulance, onEdit, onDelete }) => {
  const getInitials = (name) => name ? name.charAt(0).toUpperCase() : 'D';
  
  return (
    <div className="ambulance-card">
      <div className="card-header">
        <div className="vehicle-info">
          <span className="icon">🚑</span>
          <h4>{ambulance.vehicle_number}</h4>
        </div>
        <span className={`status-badge ${ambulance.status}`}>
          {ambulance.status === 'available' ? 'AVAILABLE' : 
           ambulance.status === 'booked' ? 'BOOKED' :
           ambulance.status === 'on_trip' ? 'ON_TRIP' : 'MAINTENANCE'}
        </span>
      </div>
      
      <div className="card-details">
        {/* Field 1: Type */}
        <div className="detail-item">
          <div className="detail-label">Type</div>
          <div className="detail-val">{ambulance.type.toUpperCase()}</div>
        </div>

        {/* Field 2: Driver */}
        <div className="detail-item">
          <div className="detail-label">Driver</div>
          <div className="driver-row">
            <div className="driver-avatar">{getInitials(ambulance.driver_name)}</div>
            <div className="driver-contact">
              <span className="detail-val">{ambulance.driver_name}</span>
              <span className="driver-phone">{ambulance.driver_phone}</span>
            </div>
          </div>
        </div>

        {/* Field 3: Base Location */}
        <div className="detail-item">
          <div className="detail-label">Base Location</div>
          <div className="detail-val">{ambulance.base_location}</div>
        </div>

        {/* Field 4: Charge */}
        <div className="detail-item">
          <div className="detail-label">Charge</div>
          <div className="detail-val charge">₹{ambulance.base_charge} + ₹{ambulance.price_per_km}/km</div>
        </div>
      </div>

      <div className="card-actions">
        <button className="edit-btn" onClick={() => onEdit(ambulance)}>✏️ Edit</button>
        <button className="delete-btn" onClick={() => onDelete(ambulance.id)}>🗑️ Delete</button>
      </div>
    </div>
  );
};

export default AmbulanceListCard;
