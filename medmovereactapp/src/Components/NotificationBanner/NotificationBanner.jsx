import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import API_BASE from '../../config/api';
import { AuthContext } from '../../context/AuthContext';
import { Bell, X, ArrowRight } from 'lucide-react';
import './NotificationBanner.css';

const NotificationBanner = () => {
  const { isAuthenticated } = useContext(AuthContext);
  const [unseenAlerts, setUnseenAlerts] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await axios.get(`${API_BASE}/api/notifications`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.success) {
          setUnseenAlerts(response.data.notifications || []);
        }
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 20000); // Poll every 20s
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const handleDismiss = async (id, type, e) => {
    if (e) e.stopPropagation();
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_BASE}/api/notifications/seen/${id}`, { type }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUnseenAlerts(prev => prev.filter(a => !(a.id === id && a.type === type)));
    } catch (err) {
      console.error('Dismiss error:', err.response?.data || err.message);
    }
  };

  const handleBookAgain = async (alert, e) => {
    if (e) e.stopPropagation();
    try {
      // Save search prefill context
      localStorage.setItem('medmove_prefill_search', JSON.stringify({
        pickup: alert.route_from,
        drop: alert.route_to,
        type: alert.vehicle_type
      }));

      // Dismiss the suggestion in the DB
      const token = localStorage.getItem('token');
      await axios.patch(`${API_BASE}/api/notifications/seen/${alert.id}`, { type: alert.type }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUnseenAlerts(prev => prev.filter(a => !(a.id === alert.id && a.type === alert.type)));

      // Navigate to homepage to prefill
      if (location.pathname === '/') {
        window.location.reload();
      } else {
        navigate('/');
      }
    } catch (err) {
      console.error('Book again failed:', err);
    }
  };

  const handleBannerClick = async (alert) => {
    if (alert.type === 'price_drop') {
      navigate('/price-watch');
    } else if (alert.type === 'reminder') {
      if (alert.link) {
        window.open(alert.link, '_blank', 'noopener,noreferrer');
      }
      // Mark as seen
      try {
        const token = localStorage.getItem('token');
        await axios.patch(`${API_BASE}/api/notifications/seen/${alert.id}`, { type: alert.type }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUnseenAlerts(prev => prev.filter(a => !(a.id === alert.id && a.type === alert.type)));
      } catch (err) {
        console.error('Mark seen failed:', err);
      }
    }
  };

  if (!isAuthenticated || unseenAlerts.length === 0) return null;

  // Don't show price watch banners if we are on the watches page
  const filteredAlerts = unseenAlerts.filter(a => !(a.type === 'price_drop' && location.pathname === '/price-watch'));
  if (filteredAlerts.length === 0) return null;

  const currentAlert = filteredAlerts[0];

  // Determine styling class based on alert type
  let bannerClass = 'notification-banner ';
  if (currentAlert.type === 'price_drop') {
    bannerClass += 'price-drop';
  } else if (currentAlert.type === 'recurring') {
    bannerClass += 'recurring-trip';
  } else if (currentAlert.type === 'reminder') {
    bannerClass += 'trip-reminder';
  }

  return (
    <div className={bannerClass}>
      <div className="banner-content" onClick={() => handleBannerClick(currentAlert)}>
        <div className="banner-icon">
          <Bell className="bell-ring" size={20} />
        </div>
        <div className="banner-text">
          {currentAlert.message}
        </div>
        {currentAlert.type === 'price_drop' && (
          <span className="banner-link">
            View Watches <ArrowRight size={14} />
          </span>
        )}
        {currentAlert.type === 'recurring' && (
          <button 
            className="book-again-action-btn"
            onClick={(e) => handleBookAgain(currentAlert, e)}
          >
            Book Again 🔁
          </button>
        )}
        {currentAlert.type === 'reminder' && (
          <span className="banner-link">
            Open WhatsApp <ArrowRight size={14} />
          </span>
        )}
      </div>
      <button 
        className="banner-dismiss" 
        onClick={(e) => handleDismiss(currentAlert.id, currentAlert.type, e)}
        title="Dismiss Alert"
      >
        <X size={18} />
      </button>
    </div>
  );
};

export default NotificationBanner;
