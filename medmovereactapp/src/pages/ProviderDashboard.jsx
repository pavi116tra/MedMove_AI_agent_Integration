import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import DashboardStats from '../Components/DashboardStats';
import AmbulanceListCard from '../Components/AmbulanceListCard';
import BookingRequestCard from '../Components/BookingRequestCard';
import './ProviderDashboard.css';
import medmoveimg from '../Assest/medmove_new_logo.svg';
import API_BASE from '../config/api';

const ProviderDashboard = () => {
  const { provider, logout } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('ambulances');
  const [stats, setStats] = useState({});
  const [ambulances, setAmbulances] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [earnings, setEarnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const token = localStorage.getItem('token');

  const fetchData = async () => {
    try {
      setLoading(true);
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const statsRes = await fetch(`${API_BASE}/api/provider/dashboard-stats`, { headers });
      const statsData = await statsRes.json();
      if (statsData.success) setStats(statsData.stats);

      const ambRes = await fetch(`${API_BASE}/api/provider/ambulances`, { headers });
      const ambData = await ambRes.json();
      if (ambData.success) setAmbulances(ambData.ambulances);

      const bookRes = await fetch(`${API_BASE}/api/provider/bookings`, { headers });
      const bookData = await bookRes.json();
      if (bookData.success) setBookings(bookData.bookings);

      const earnRes = await fetch(`${API_BASE}/api/provider/earnings`, { headers });
      const earnData = await earnRes.json();
      if (earnData.success) setEarnings(earnData.earnings);

      setLoading(false);
    } catch (err) {
      console.error('Fetch Dashboard Error:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate('/login/provider');
    } else {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleAcceptBooking = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/provider/bookings/${id}/accept`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) fetchData();
    } catch (err) {
      console.error('Accept Booking Error:', err);
    }
  };

  const handleRejectBooking = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/provider/bookings/${id}/reject`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) fetchData();
    } catch (err) {
      console.error('Reject Booking Error:', err);
    }
  };

  const handleCompleteBooking = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/provider/bookings/${id}/complete`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) fetchData();
    } catch (err) {
      console.error('Complete Booking Error:', err);
    }
  };

  const handleDeleteAmbulance = async (id) => {
    if (!window.confirm('Are you sure you want to remove this ambulance?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/provider/ambulances/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) fetchData();
    } catch (err) {
      console.error('Delete Ambulance Error:', err);
    }
  };

  if (loading) return <div className="loading">Loading Dashboard...</div>;

  return (
    <div className="dashboard-wrapper">
      <nav className="dashboard-nav">
        <div className="nav-logo">
          <img src={medmoveimg} alt="MedMove" style={{ height: '42px', objectFit: 'contain' }} />
        </div>
        <div className="nav-user">
          <span>Welcome, <strong>{provider?.company_name || 'Aarthi Ambulance'}</strong></span>
          <button onClick={() => { logout(); navigate('/'); }} className="logout-btn">Logout</button>
        </div>
      </nav>

      <main className="dashboard-main">
        <DashboardStats stats={stats} />

        <div className="tab-menu">
          <button 
            className={activeTab === 'ambulances' ? 'active' : ''} 
            onClick={() => setActiveTab('ambulances')}
          >
            My Ambulances
          </button>
          <button 
            className={activeTab === 'bookings' ? 'active' : ''} 
            onClick={() => setActiveTab('bookings')}
          >
            Booking Requests {bookings.length > 0 && <span className="badge">{bookings.length}</span>}
          </button>
          <button 
            className={activeTab === 'earnings' ? 'active' : ''} 
            onClick={() => setActiveTab('earnings')}
          >
            Earnings
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'ambulances' && (
            <div className="fleet-section">
              <div className="section-header">
                <h2>My Ambulances</h2>
                <button 
                  className="add-btn" 
                  onClick={() => navigate('/provider/add-ambulance')}
                >
                  + Add Ambulance
                </button>
              </div>
              <div className="ambulance-grid">
                {ambulances.map(amb => (
                  <AmbulanceListCard 
                    key={amb.id} 
                    ambulance={amb} 
                    onEdit={(a) => navigate(`/provider/edit-ambulance/${a.id}`)}
                    onDelete={handleDeleteAmbulance}
                  />
                ))}
                {ambulances.length === 0 && <p className="empty">No ambulances added yet.</p>}
              </div>
            </div>
          )}

          {activeTab === 'bookings' && (
            <div className="bookings-section">
              <h2>Recent Booking Requests</h2>
              <div className="booking-list">
                {bookings.map(book => (
                  <BookingRequestCard 
                    key={book.id} 
                    booking={book} 
                    onAccept={handleAcceptBooking}
                    onReject={handleRejectBooking}
                    onComplete={handleCompleteBooking}
                  />
                ))}
                {bookings.length === 0 && <p className="empty">No booking requests found.</p>}
              </div>
            </div>
          )}

          {activeTab === 'earnings' && (
            <div className="earnings-section">
              <div className="earnings-summary">
                <div className="earn-card">
                  <span>💰 Total Earnings</span>
                  <strong>₹{stats.total_earnings || 0}</strong>
                </div>
                <div className="earn-card">
                  <span>✅ Completed Trips</span>
                  <strong>{earnings.filter(e => e.trip_status === 'completed').length}</strong>
                </div>
                <div className="earn-card">
                  <span>📋 Total Bookings</span>
                  <strong>{earnings.length}</strong>
                </div>
              </div>

              <table className="earnings-table">
                <thead>
                  <tr>
                    <th>Booking ID</th>
                    <th>Date</th>
                    <th>Patient</th>
                    <th>Route</th>
                    <th>Vehicle</th>
                    <th>Fare</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {earnings.map(e => (
                    <tr key={e.id}>
                      <td>#MED{String(e.booking_id).padStart(4,'0')}</td>
                      <td>{e.booking_date}</td>
                      <td>{e.booked_by_name}<br/><small>{e.booked_by_phone}</small></td>
                      <td>{e.pickup_location} → {e.drop_location}</td>
                      <td>{e.vehicle_number}</td>
                      <td>₹{e.total_fare}</td>
                      <td><span className={`status-pill ${e.trip_status}`}>{e.trip_status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {earnings.length === 0 && <p className="empty">No earnings data available yet.</p>}
            </div>
          )}
        </div>
      </main>

      {/* BOTTOM DECORATION SVG */}
      <svg className="bottom-decoration" viewBox="0 0 400 150" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M40 150V60H80V150M90 150V30H200V150M210 150V80H260V150M270 150V50H360V150" fill="#a5d8ff" fillOpacity="0.8"/>
        <rect x="110" y="50" width="20" height="20" fill="#a5d8ff" fillOpacity="0.6"/>
        <rect x="150" y="50" width="20" height="20" fill="#a5d8ff" fillOpacity="0.6"/>
        <rect x="110" y="90" width="20" height="20" fill="#a5d8ff" fillOpacity="0.6"/>
        <rect x="150" y="90" width="20" height="20" fill="#a5d8ff" fillOpacity="0.6"/>
        <rect x="290" y="70" width="20" height="20" fill="#a5d8ff" fillOpacity="0.6"/>
        <rect x="330" y="70" width="20" height="20" fill="#a5d8ff" fillOpacity="0.6"/>
        <rect x="290" y="110" width="20" height="20" fill="#a5d8ff" fillOpacity="0.6"/>
        <rect x="330" y="110" width="20" height="20" fill="#a5d8ff" fillOpacity="0.6"/>
        <path d="M140 10H160M150 0V20" stroke="#a5d8ff" strokeWidth="4" strokeLinecap="round"/>
        <path d="M0 148H400" stroke="#a5d8ff" strokeWidth="4"/>
      </svg>
    </div>
  );
};

export default ProviderDashboard;
