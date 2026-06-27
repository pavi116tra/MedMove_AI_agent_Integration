import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './AddAmbulance.css'; // Reusing styles
import API_BASE from '../config/api';

const EditAmbulance = () => {
  const { id } = useParams();
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
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      navigate('/login/provider');
      return;
    }

    const fetchAmbulance = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/provider/ambulances`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          const amb = data.ambulances.find(a => a.id === parseInt(id));
          if (amb) {
            setFormData(amb);
          } else {
            setError('Ambulance not found');
          }
        }
        setLoading(false);
      } catch (err) {
        setError('Failed to load data');
        setLoading(false);
      }
    };

    fetchAmbulance();
  }, [id, token]);

  const equipmentList = [
    'Stretcher',
    'First Aid Kit',
    'Oxygen Cylinder',
    'Wheelchair Support',
    'ECG Monitor',
    'Ventilator'
  ];

  const allSelected = formData.equipment?.length === equipmentList.length;
  const someSelected = formData.equipment?.length > 0 && !allSelected;

  const selectAllRef = useRef(null);

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someSelected;
    }
  }, [someSelected]);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setFormData({ ...formData, equipment: [...equipmentList] });
    } else {
      setFormData({ ...formData, equipment: [] });
    }
  };

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
      const res = await fetch(`${API_BASE}/api/provider/ambulances/${id}`, {
        method: 'PUT',
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
        setError(data.message || 'Update failed');
      }
    } catch (err) {
      setError('Server connection error');
    }
  };

  if (loading) return <div className="loading">Loading ambulance data...</div>;

  if (success) {
    return (
      <div className="success-overlay">
        <div className="success-modal">
          <div className="success-icon">✨</div>
          <h2>Ambulance Updated!</h2>
          <p>Changes to {formData.vehicle_number} have been saved.</p>
          <div className="modal-actions">
            <button className="primary" onClick={() => navigate('/provider/dashboard')}>Back to Dashboard</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="form-wrapper">
      <div className="form-container">
        <button className="back-btn" onClick={() => navigate('/provider/dashboard')}>← Back to Dashboard</button>
        <h2>Edit Ambulance</h2>
        {error && <div className="error-msg">{error}</div>}
        
        <form onSubmit={handleSubmit} className="ambulance-form">
          <div className="form-grid">
            <div className="input-group">
              <label>Vehicle Number</label>
              <input type="text" value={formData.vehicle_number} disabled />
              <small>Vehicle number cannot be changed.</small>
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
              <input type="text" name="driver_name" required onChange={handleChange} value={formData.driver_name} />
            </div>

            <div className="input-group">
              <label>Driver Phone *</label>
              <input type="tel" name="driver_phone" required onChange={handleChange} value={formData.driver_phone} />
            </div>

            <div className="input-group">
              <label>Base Location (City) *</label>
              <input type="text" name="base_location" required onChange={handleChange} value={formData.base_location} />
            </div>

            <div className="input-group">
              <label>Base Charge (₹) *</label>
              <input type="number" name="base_charge" required onChange={handleChange} value={formData.base_charge} />
            </div>

            <div className="input-group">
              <label>Price per KM (₹) *</label>
              <input type="number" name="price_per_km" required onChange={handleChange} value={formData.price_per_km} />
            </div>

            <div className="input-group">
              <label>Availability Status *</label>
              <select name="status" onChange={handleChange} value={formData.status}>
                <option value="available">Available</option>
                <option value="booked">Booked</option>
                <option value="on_trip">On Trip</option>
                <option value="maintenance">Under Maintenance</option>
              </select>
            </div>
          </div>

          <div className="equipment-section">
            <label>Equipment Available</label>

            {/* Select All row */}
            <label className="checkbox-label select-all-row">
              <input
                type="checkbox"
                ref={selectAllRef}
                checked={allSelected}
                onChange={handleSelectAll}
              />
              Select All Equipment
            </label>

            <div className="equipment-divider" />

            <div className="checkbox-grid">
              {equipmentList.map(item => (
                <label key={item} className="checkbox-label">
                  <input
                    type="checkbox"
                    value={item}
                    onChange={handleChange}
                    checked={formData.equipment?.includes(item)}
                  /> {item}
                </label>
              ))}
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={() => navigate('/provider/dashboard')} className="cancel-btn">Cancel</button>
            <button type="submit" className="submit-btn">Update Ambulance ✨</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditAmbulance;
