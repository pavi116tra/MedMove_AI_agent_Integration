import React, { useState } from 'react';
import './BookingConfirmModal.css';

const BookingConfirmModal = ({
  ambulance, pickup, drop,
  date, time, onConfirm, onCancel
}) => {
  const [patientDetails, setPatientDetails] = useState({
    patient_name: '',
    patient_age: '',
    patient_condition: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPatientDetails({
      ...patientDetails,
      [name]: value
    });
  };

  const handleProceed = () => {
    if (!patientDetails.patient_name) return alert("Please enter patient name");
    onConfirm(patientDetails);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <div className="modal-icon">🚑</div>
        <h2>Confirm Your Booking</h2>

        <div className="booking-summary">
          <div className="summary-row">
            <span>Company</span>
            <span>{ambulance.company_name}</span>
          </div>
          <div className="summary-row">
            <span>Route</span>
            <span>{pickup} → {drop}</span>
          </div>
          <div className="summary-row">
            <span>Date</span>
            <span>{date} {time ? `at ${time}` : ''}</span>
          </div>
          <div className="summary-row total">
            <span>Total Amount</span>
            <span>₹{ambulance.estimated_total}</span>
          </div>
        </div>

        <div className="patient-form">
          <h3 style={{ textAlign: 'left', fontSize: '0.95rem', fontWeight: '700', marginBottom: '10px', color: '#1e293b' }}>
            Patient Details
          </h3>
          <input 
            type="text" 
            name="patient_name" 
            placeholder="Patient Full Name *" 
            className="modal-input" 
            value={patientDetails.patient_name} 
            onChange={handleChange} 
          />
          <div style={{ display: 'flex', gap: '10px' }}>
            <input 
              type="number" 
              name="patient_age" 
              placeholder="Age" 
              className="modal-input" 
              value={patientDetails.patient_age} 
              onChange={handleChange}
              style={{ flex: 1 }}
            />
            <input 
              type="text" 
              name="patient_condition" 
              placeholder="Condition (e.g. Fever)" 
              className="modal-input" 
              value={patientDetails.patient_condition} 
              onChange={handleChange}
              style={{ flex: 1.5 }}
            />
          </div>
        </div>

        <div className="note">
          ⚠️ Payment will be collected via QR scan.
        </div>

        <div className="modal-buttons">
          <button className="cancel-btn" onClick={onCancel}>Cancel</button>
          <button className="confirm-btn" onClick={handleProceed}>Proceed to Pay →</button>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmModal;
