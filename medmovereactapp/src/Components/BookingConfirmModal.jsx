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

  const [isRecurring, setIsRecurring] = useState(false);
  const [daysOfWeek, setDaysOfWeek] = useState([]);
  const [activeUntil, setActiveUntil] = useState('');

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPatientDetails({
      ...patientDetails,
      [name]: value
    });
  };

  const handleDayChange = (day) => {
    if (daysOfWeek.includes(day)) {
      setDaysOfWeek(daysOfWeek.filter(d => d !== day));
    } else {
      setDaysOfWeek([...daysOfWeek, day]);
    }
  };

  const handleProceed = () => {
    if (!patientDetails.patient_name) return alert("Please enter patient name");
    if (isRecurring) {
      if (daysOfWeek.length === 0) return alert("Please select at least one day for recurring trip");
      if (!activeUntil) return alert("Please select an active until date");
    }
    onConfirm({
      ...patientDetails,
      is_recurring: isRecurring,
      days_of_week: daysOfWeek,
      active_until: activeUntil
    });
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

        {/* Recurring Trip Section */}
        <div className="recurring-trip-section">
          <div className="recurring-toggle-row">
            <input 
              type="checkbox" 
              id="is_recurring_toggle" 
              checked={isRecurring} 
              onChange={(e) => setIsRecurring(e.target.checked)} 
            />
            <label htmlFor="is_recurring_toggle" className="recurring-toggle-label">
              🔄 Make this a recurring trip?
            </label>
          </div>

          {isRecurring && (
            <div className="recurring-details" style={{ animation: 'fadeIn 0.2s' }}>
              <div style={{ textAlign: 'left', fontSize: '0.85rem', fontWeight: '700', marginBottom: '8px', color: '#475569' }}>
                Select Days
              </div>
              <div className="days-grid">
                {days.map(day => (
                  <label key={day} className="day-checkbox">
                    <input 
                      type="checkbox" 
                      checked={daysOfWeek.includes(day)} 
                      onChange={() => handleDayChange(day)} 
                    />
                    <span>{day.substring(0, 3)}</span>
                  </label>
                ))}
              </div>
              
              <div className="until-date-row">
                <label htmlFor="active_until_input" style={{ textAlign: 'left', fontSize: '0.8rem', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px' }}>Active Until</label>
                <input 
                  type="date" 
                  id="active_until_input" 
                  className="until-date-input" 
                  value={activeUntil}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setActiveUntil(e.target.value)}
                />
              </div>
            </div>
          )}
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
