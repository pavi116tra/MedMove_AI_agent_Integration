import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import API_BASE from '../../config/api';
import { AuthContext } from '../../context/AuthContext';
import { Bell, X, ArrowRight } from 'lucide-react';
import './PriceDropAlert.css';

const PriceDropAlert = () => {
  const { isAuthenticated } = useContext(AuthContext);
  const [unseenAlerts, setUnseenAlerts] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchUnseenAlerts = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await axios.get(`${API_BASE}/api/price-watch/my-watches`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.success) {
          const unseen = response.data.watches.filter(w => !w.alert_seen && w.alert_message);
          setUnseenAlerts(unseen);
        }
      } catch (err) {
        console.error('Failed to fetch price watch alerts:', err);
      }
    };

    fetchUnseenAlerts();
    const interval = setInterval(fetchUnseenAlerts, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const handleDismiss = async (id, e) => {
    e.stopPropagation();
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_BASE}/api/price-watch/seen/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUnseenAlerts(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      console.error('Failed to dismiss alert:', err);
    }
  };

  if (!isAuthenticated || unseenAlerts.length === 0 || location.pathname === '/price-watch') return null;

  const currentAlert = unseenAlerts[0];

  return (
    <div className="price-drop-banner">
      <div className="banner-content" onClick={() => navigate('/price-watch')}>
        <div className="banner-icon">
          <Bell className="bell-ring" size={20} />
        </div>
        <div className="banner-text">
          <strong>🎉 Price Dropped!</strong> {currentAlert.vehicle_type.toUpperCase()} on your {currentAlert.route_from} to {currentAlert.route_to} route is now cheaper!
        </div>
        <Link to="/price-watch" className="banner-link">
          View Watches <ArrowRight size={14} />
        </Link>
      </div>
      <button 
        className="banner-dismiss" 
        onClick={(e) => handleDismiss(currentAlert.id, e)}
        title="Dismiss Alert"
      >
        <X size={18} />
      </button>
    </div>
  );
};

export default PriceDropAlert;
