import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AddAmbulance.css';
import API_BASE from '../config/api';

const AddAmbulance = () => {
  const [formData, setFormData] = useState({
    vehicle_number: '',
    type: 'basic',
    driver_name: '',
    driver_phone: '',
    base_location: '',
    base_charge: '',
    price_per_km: '',
    status: 'available',
    equipment: []
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) navigate('/login/provider');
  }, [token]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      const newEquipment = checked 
        ? [...formData.equipment, value]
        : formData.equipment.filter(item => item !== value);
      setFormData({ ...formData, equipment: newEquipment });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Basic Validation
    const vehicleRegex = /^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$/;
    if (!vehicleRegex.test(formData.vehicle_number)) {
      return setError('Invalid format. Use TN##AB####');
    }
    if (formData.driver_name.length < 3) {
      return setError('Driver Name must be at least 3 characters');
    }
    if (formData.driver_phone.length !== 10) {
      return setError('Must be 10 digits');
    }
    if (parseFloat(formData.base_charge) < 500) {
      return setError('Minimum ₹500');
    }
    if (parseFloat(formData.price_per_km) < 10) {
      return setError('Price per KM must be at least ₹10');
    }

    try {
      const res = await fetch(`${API_BASE}/api/provider/ambulances/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
      } else {
        setError(data.message || 'Failed to add ambulance');
      }
    } catch (err) {
      setError('Server connection error');
    }
  };

  if (success) {
    return (
      <div className="success-overlay">
        <div className="success-modal">
          <div className="success-icon">✅</div>
          <h2>Ambulance Added Successfully!</h2>
          <p>{formData.vehicle_number} is now listed and available for bookings.</p>
          <div className="modal-actions">
            <button onClick={() => { setSuccess(false); setFormData({ ...formData, vehicle_number: '', driver_name: '', driver_phone: '' }); }}>Add Another</button>
            <button className="primary" onClick={() => navigate('/provider/dashboard')}>Go to Dashboard</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="form-wrapper">
      <div className="form-container">
        <button className="back-btn" onClick={() => navigate('/provider/dashboard')}>← Back to Dashboard</button>
        <h2>Add New Ambulance</h2>
        {error && <div className="error-msg">{error}</div>}
        
        <form onSubmit={handleSubmit} className="ambulance-form">
          <div className="form-grid">
            <div className="input-group">
              <label>Vehicle Number *</label>
              <input 
                type="text" name="vehicle_number" 
                placeholder="e.g. TN59AB1234" required 
                onChange={handleChange} value={formData.vehicle_number}
              />
            </div>
            
            <div className="input-group">
              <label>Ambulance Type *</label>
              <select name="type" onChange={handleChange} value={formData.type}>
                <option value="basic">Basic (BLS)</option>
                <option value="oxygen">Oxygen (ALS)</option>
                <option value="icu">ICU Ambulance</option>
              </select>
            </div>

            <div className="input-group">
              <label>Driver Name *</label>
              <input type="text" name="driver_name" required onChange={handleChange} />
            </div>

            <div className="input-group">
              <label>Driver Phone *</label>
              <input type="tel" name="driver_phone" required onChange={handleChange} />
            </div>

            <div className="input-group">
              <label>Base Location (City) *</label>
              <input type="text" name="base_location" required onChange={handleChange} />
            </div>

            <div className="input-group">
              <label>Base Charge (₹) *</label>
              <input type="number" name="base_charge" required onChange={handleChange} />
            </div>

            <div className="input-group">
              <label>Price per KM (₹) *</label>
              <input type="number" name="price_per_km" required onChange={handleChange} />
            </div>

            <div className="input-group">
              <label>Availability Status *</label>
              <select name="status" onChange={handleChange} value={formData.status}>
                <option value="available">Available</option>
                <option value="maintenance">Under Maintenance</option>
              </select>
            </div>
          </div>

          <div className="equipment-section">
            <label>Equipment Available</label>
            <div className="checkbox-grid">
              {['Stretcher', 'First Aid Kit', 'Oxygen Cylinder', 'Wheelchair Support', 'ECG Monitor', 'Ventilator'].map(item => (
                <label key={item} className="checkbox-label">
                  <input 
                    type="checkbox" value={item} 
                    onChange={handleChange}
                    checked={formData.equipment.includes(item)}
                  /> {item}
                </label>
              ))}
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={() => navigate('/provider/dashboard')} className="cancel-btn">Cancel</button>
            <button type="submit" className="submit-btn">Add Ambulance 🚑</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAmbulance;
