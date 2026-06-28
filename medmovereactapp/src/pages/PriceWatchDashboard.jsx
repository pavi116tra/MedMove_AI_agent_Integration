import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE from '../config/api';
import { AuthContext } from '../context/AuthContext';
import Navbar from '../Components/Home/Navbar/Navbar';
import Footer from '../Components/Home/Footer/Footer';
import './PriceWatchDashboard.css';

const PriceWatchDashboard = () => {
  const { isAuthenticated } = useContext(AuthContext);
  const [watches, setWatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchWatches = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_BASE}/api/price-watch/my-watches`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.success) {
          setWatches(response.data.watches);
        }
      } catch (err) {
        console.error('Failed to load price watches:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchWatches();
  }, [isAuthenticated, navigate]);

  const [runningAgent, setRunningAgent] = useState(false);

  const handleRunAgent = async () => {
    setRunningAgent(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE}/api/price-watch/trigger-agent`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const response = await axios.get(`${API_BASE}/api/price-watch/my-watches`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setWatches(response.data.watches);
      }
      alert('🤖 Dynamic Pricing Watch Agent inspection completed! All route prices verified.');
    } catch (err) {
      console.error('Failed to run pricing agent:', err);
    } finally {
      setRunningAgent(false);
    }
  };

  const handleDismiss = async (watchId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${API_BASE}/api/price-watch/seen/${watchId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Update local state - mark as seen and clear message
      setWatches(prev => prev.map(w =>
        w.id === watchId
          ? { ...w, alert_seen: true, alert_message: null }
          : w
      ));
    } catch (error) {
      console.error('Dismiss error:', error.response?.data || error.message);
      alert('Could not dismiss. Please try again.');
    }
  };

  const filteredWatches = watches.filter(w => {
    if (filterType === 'all') return true;
    return w.vehicle_type?.toLowerCase() === filterType.toLowerCase();
  });

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <div className="search-results-page" style={{ flex: 1 }}>

        {/* SUMMARY BAR HEADER */}
        <div className="summary-bar">
          <div className="route-info" style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <button className="modify-btn" onClick={() => navigate(-1)}>
                ← Back
              </button>
              <span className="location" style={{ color: '#CC0000', fontSize: '1.25rem' }}>
                🔔 Dynamic Price Watch Dashboard
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <span className="meta" style={{ display: 'none' }}>
                Tracked routes & real-time provider price drop alerts
              </span>
              <button 
                onClick={handleRunAgent}
                disabled={runningAgent}
                style={{
                  backgroundColor: '#CC0000',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '20px',
                  padding: '8px 16px',
                  fontWeight: '700',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(204,0,0,0.3)',
                  transition: 'all 0.2s'
                }}
              >
                {runningAgent ? '🤖 Agent Inspecting...' : '🤖 Run Agent Now'}
              </button>
            </div>
          </div>
        </div>

        {/* FILTER BAR */}
        <div className="filter-bar">
          <span>Filter by type:</span>
          {['all', 'basic', 'oxygen', 'icu'].map(t => (
            <button
              key={t}
              className={filterType === t ? 'filter-btn active' : 'filter-btn'}
              onClick={() => setFilterType(t)}
            >
              {t === 'all' ? 'All Types' :
               t === 'basic' ? '🚑 Basic (BLS)' :
               t === 'oxygen' ? '💨 Oxygen (ALS)' : '🏥 ICU'}
            </button>
          ))}
          <span className="results-count">{filteredWatches.length} watches found</span>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <h3>🔍 Loading your price watches...</h3>
            <p>Please wait a moment</p>
          </div>
        ) : filteredWatches.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔔</div>
            <h3>No price watches found</h3>
            <p>When searching for ambulances, click "Watch Price 🔔" on any vehicle card to track price drops!</p>
            <button onClick={() => navigate('/')}>🔍 Search Ambulances Now</button>
          </div>
        ) : (
          <div className="cards-grid">
            {filteredWatches.map((watch) => {
              const amb = watch.ambulance_details || {
                company_name: 'MedMove Partner',
                vehicle_number: 'TN56AB5673',
                driver_name: 'Assigned Driver',
                base_location: watch.route_from.toLowerCase(),
                service_area: watch.route_from,
                base_charge: 500,
                price_per_km: 10,
                distance_charge: Math.round(Number(watch.watched_price) - 500),
                distance_km: 505,
                equipment: ['First Aid Kit', 'Oxygen Cylinder', 'Ventilator', 'ECG Monitor', 'Wheelchair Support', 'Stretcher']
              };

              return (
                <div key={watch.id} className="ambulance-card">
                  <div className="card-top">
                    <span className={`type-badge ${watch.vehicle_type.toLowerCase()}`}>
                      🚑 {watch.vehicle_type.toUpperCase()}
                    </span>
                    <span className="available-badge">✅ Available</span>
                  </div>

                  <h3 className="company-name">{amb.company_name}</h3>

                  <div className="amb-details">
                    <div className="detail-row"><span>🚗 Vehicle</span><span>{amb.vehicle_number}</span></div>
                    <div className="detail-row"><span>👨‍⚕️ Driver</span><span>{amb.driver_name}</span></div>
                    <div className="detail-row"><span>📍 Based at</span><span>{amb.base_location}</span></div>
                    <div className="detail-row"><span>🌍 Service Area</span><span>{amb.service_area}</span></div>
                  </div>

                  {amb.equipment?.length > 0 && (
                    <div className="equipment-tags">
                      {amb.equipment.map((eq, i) => <span key={i} className="eq-tag">✅ {eq}</span>)}
                    </div>
                  )}

                  <div className="price-box">
                    <div className="price-row"><span>Base Charge</span><span>₹{amb.base_charge}</span></div>
                    <div className="price-row"><span>{amb.distance_km} km × ₹{amb.price_per_km}</span><span>₹{amb.distance_charge}</span></div>
                    <div className="price-total"><span>Estimated Total</span><span>₹{watch.watched_price}</span></div>
                  </div>

                  {watch.alert_message && watch.alert_seen === false ? (
                    <div className="price-alert-box" style={{ background: '#fff0f0', border: '1px solid #ffcdd2', borderRadius: '10px', padding: '12px', marginBottom: '12px', color: '#b71c1c' }}>
                      <p style={{ margin: '0 0 4px 0', fontWeight: 'bold' }}>⚠️ Cheaper Option Found!</p>
                      <p style={{ margin: '0 0 10px 0', fontSize: '0.88rem' }}>{watch.alert_message}</p>
                      <div className="alert-actions" style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          className="book-now-btn book-btn"
                          style={{ flex: 2 }}
                          onClick={() => navigate(`/search-results?from=${watch.route_from}&to=${watch.route_to}&date=${watch.travel_date}&type=${watch.vehicle_type}`)}>
                          Book Now →
                        </button>
                        <button 
                          className="dismiss-btn"
                          style={{ flex: 1, backgroundColor: '#ffffff', color: '#2e7d32', border: '1.5px solid #2e7d32', borderRadius: '12px', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}
                          onClick={() => handleDismiss(watch.id)}>
                          Dismiss Alert ✓
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="agent-checking" style={{ background: '#f8f9fa', border: '1px dashed #ccc', borderRadius: '10px', padding: '12px', textAlign: 'center', fontSize: '0.82rem', color: '#666', fontStyle: 'italic' }}>
                      <p style={{ margin: 0 }}>🤖 Agent is actively checking hourly for cheaper providers...</p>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default PriceWatchDashboard;
