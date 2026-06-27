import React from 'react';
import './DashboardStats.css';

const DashboardStats = ({ stats }) => {
  return (
    <div className="stats-container">
      <div className="stat-card">
        <div className="stat-icon ambulance">🚑</div>
        <div className="stat-info">
          <h3>Total Ambulances</h3>
          <p>{stats.total_ambulances || 0}</p>
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-icon available">✅</div>
        <div className="stat-info">
          <h3>Available</h3>
          <p>{stats.available || 0}</p>
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-icon pending">📋</div>
        <div className="stat-info">
          <h3>Pending Bookings</h3>
          <p>{stats.pending_bookings || 0}</p>
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-icon earnings">💰</div>
        <div className="stat-info">
          <h3>Total Earnings</h3>
          <p>₹{stats.total_earnings || 0}</p>
        </div>
      </div>
    </div>
  );
};

export default DashboardStats;
