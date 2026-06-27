import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './SearchResults.css';
import BookingConfirmModal from '../Components/BookingConfirmModal';
import API_BASE from '../config/api';
import Navbar from '../Components/Home/Navbar/Navbar';
import Footer from '../Components/Home/Footer/Footer';

const SearchResults = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { pickup, drop, date, time, type } = location.state || {};

  const [ambulances, setAmbulances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [distance, setDistance] = useState(0);
  const [filterType, setFilterType] = useState(type?.toLowerCase() || 'all');
  
  // State for filtering cheaper options when Watch Price is clicked
  const [watchedFilter, setWatchedFilter] = useState(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedAmbulance, setSelectedAmbulance] = useState(null);

  useEffect(() => {
    if (!pickup || !drop) {
      navigate('/');
      return;
    }
    fetchAmbulances();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType]);

  const fetchAmbulances = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(
        `${API_BASE}/api/ambulances/search`,
        {
          params: { pickup, drop, date, time, type: filterType }
        }
      );

      if (response.data.success) {
        setAmbulances(response.data.ambulances);
        setDistance(response.data.distance_km);
      }
    } catch (err) {
      console.error('Search Error:', err);
      setError('Could not fetch ambulances. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleBookNow = (ambulance) => {
    setSelectedAmbulance(ambulance);
    setShowModal(true);
  };

  const confirmBooking = (patientDetails) => {
    setShowModal(false);
    navigate('/payment', {
      state: { 
        ambulance: selectedAmbulance, 
        pickup, drop, date, time, 
        distance_km: distance,
        patientDetails
      }
    });
  };

  const handleWatchPrice = async (ambulance) => {
    const token = localStorage.getItem('token');
    
    if (token) {
      axios.post(
        `${API_BASE}/api/price-watch/add`,
        {
          route_from: pickup,
          route_to: drop,
          travel_date: date,
          vehicle_type: ambulance.type,
          watched_price: ambulance.estimated_total
        },
        { headers: { Authorization: `Bearer ${token}` } }
      ).catch(err => console.error('Silent watch save error:', err));
    }

    setWatchedFilter({
      price: Number(ambulance.estimated_total),
      companyName: ambulance.company_name,
      vehicleType: ambulance.type,
      id: ambulance.id
    });
  };

  const displayedAmbulances = ambulances.filter(amb => {
    if (watchedFilter && Number(amb.estimated_total) >= watchedFilter.price) {
      return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="loading-container">
          <div className="spinner"></div>
          <h3>🔍 Finding ambulances near {pickup}...</h3>
          <p>Please wait a moment</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Navbar />
        <div className="error-container">
          <h2>⚠️ Something went wrong</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/')}>← Go Back</button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <div className="search-results-page" style={{ flex: 1 }}>
        {showModal && (
          <BookingConfirmModal 
            ambulance={selectedAmbulance}
            pickup={pickup}
            drop={drop}
            date={date}
            time={time}
            onConfirm={confirmBooking}
            onCancel={() => setShowModal(false)}
          />
        )}
        <div className="summary-bar">
          <div className="route-info">
            <span className="location">📍 {pickup}</span>
            <span className="arrow"> ──→ </span>
            <span className="location">🏥 {drop}</span>
            <span className="meta">
              📅 {date} &nbsp; 🕐 {time} &nbsp; 📏 ~{distance} km
            </span>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            {watchedFilter && (
              <button 
                className="modify-btn" 
                style={{ backgroundColor: '#ffffff', color: '#CC0000', border: '1.5px solid #CC0000' }} 
                onClick={() => setWatchedFilter(null)}
              >
                ← Back to all results
              </button>
            )}
            <button className="modify-btn" onClick={() => navigate('/')}>✏️ Modify Search</button>
          </div>
        </div>

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
          <span className="results-count">
            {watchedFilter 
              ? `${displayedAmbulances.length} cheaper options found for your watched price ₹${watchedFilter.price.toLocaleString('en-IN')}`
              : `${ambulances.length} ambulances found`}
          </span>
        </div>

        <div className="price-watch-info-note">
          🔔 <strong>Watch Price</strong> → Click on any card to get alerted automatically when price drops for your route.
        </div>

        {watchedFilter && (
          <div className="price-watch-yellow-banner">
            <div className="yellow-banner-text">
              🔔 Showing cheaper alternatives to <strong>₹{watchedFilter.price.toLocaleString('en-IN')}</strong> ({watchedFilter.companyName}). We are also watching this route for future drops.
            </div>
            <button className="reset-watch-filter-btn" onClick={() => setWatchedFilter(null)}>
              ← Back to all results
            </button>
          </div>
        )}

        {displayedAmbulances.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">🚑</div>
            <h3>No cheaper options available</h3>
            <p>
              {watchedFilter 
                ? `No ambulances found cheaper than ₹${watchedFilter.price.toLocaleString('en-IN')}. We are actively watching this route and will alert you if prices drop!`
                : `No ${filterType !== 'all' ? filterType : ''} ambulances found for this route.`}
            </p>
            {watchedFilter ? (
              <button onClick={() => setWatchedFilter(null)}>← Back to all results</button>
            ) : (
              <button onClick={() => navigate('/')}>🔍 Search Again</button>
            )}
          </div>
        )}

        <div className="cards-grid">
          {displayedAmbulances.map(amb => (
            <div key={amb.id} className="ambulance-card">
              <div className="card-top">
                <span className={`type-badge ${amb.type}`}>🚑 {amb.type.toUpperCase()}</span>
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
                <div className="price-row"><span>{distance} km × ₹{amb.price_per_km}</span><span>₹{amb.distance_charge}</span></div>
                <div className="price-total"><span>Estimated Total</span><span>₹{amb.estimated_total}</span></div>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <button className="book-btn" style={{ flex: 2 }} onClick={() => handleBookNow(amb)}>Book Now →</button>
                <button 
                  className="watch-price-btn" 
                  style={{
                    flex: 1,
                    backgroundColor: '#ffffff',
                    color: '#16a34a',
                    border: '1.5px solid #16a34a',
                    borderRadius: '8px',
                    fontWeight: '600',
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }} 
                  onClick={() => handleWatchPrice(amb)}
                  title="Alert me if price drops"
                >
                  Watch Price 🔔
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default SearchResults;

