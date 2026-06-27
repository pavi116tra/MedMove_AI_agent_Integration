import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';
import medmoveimg from "../../../Assest/medmove_new_logo.svg";
import { AuthContext } from '../../../context/AuthContext';
import { Menu, X, ChevronDown, User, LogOut, LayoutDashboard } from 'lucide-react';

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const { isAuthenticated, role, user, provider, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMobileMenuOpen(false);
    setShowDropdown(false);
  };

  const getName = () => {
    if (role === 'provider') return provider?.company_name || 'Provider';
    return user?.name || 'User';
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo" style={{ textDecoration: 'none' }} onClick={() => setIsMobileMenuOpen(false)}>
          <img src={medmoveimg} alt="MedMove" />
          <span style={{
            backgroundColor: '#16a34a',
            color: '#ffffff',
            fontSize: '11px',
            fontWeight: '700',
            padding: '3px 9px',
            borderRadius: '20px',
            marginLeft: '8px',
            letterSpacing: '0.4px',
            verticalAlign: 'middle',
            display: 'inline-block',
            textDecoration: 'none'
          }}>
            AI-Powered
          </span>
        </Link>
        
        {/* Mobile Menu Toggle */}
        <button className="mobile-menu-icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X size={28} className="active" /> : <div className="hamburger" />}
        </button>

        <div className={`navbar-links ${isMobileMenuOpen ? 'active' : ''}`}>
          <Link to="/" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>Home</Link>
          <Link to="/about" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>About Us</Link>
          <a href="#footer" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>Contact</a>

          {isAuthenticated ? (
            <div className="user-profile-section">
              <div className="profile-trigger" onClick={() => setShowDropdown(!showDropdown)}>
                <div className="avatar-circle">
                  {getName().charAt(0).toUpperCase()}
                </div>
                <span className="user-name">{getName()}</span>
                <ChevronDown size={16} className={showDropdown ? 'rotate' : ''} />
              </div>

              {showDropdown && (
                <div className="profile-dropdown">
                  {role === 'provider' && (
                    <Link to="/provider/dashboard" className="dropdown-item" onClick={() => setShowDropdown(false)}>
                      <LayoutDashboard size={18} /> Dashboard
                    </Link>
                  )}
                  <button onClick={handleLogout} className="dropdown-item logout-item">
                    <LogOut size={18} /> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="nav-auth-btn" onClick={() => setIsMobileMenuOpen(false)}>Login</Link>
              <Link to="/register" className="nav-auth-btn" onClick={() => setIsMobileMenuOpen(false)}>Register</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
