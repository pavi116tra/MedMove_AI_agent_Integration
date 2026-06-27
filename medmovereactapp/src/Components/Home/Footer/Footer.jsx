import React from 'react';
import { Globe, MessageCircle, Camera, Briefcase, Mail, Phone, MapPin, Ambulance } from 'lucide-react';
import medmoveimg from '../../../Assest/medmove_new_logo.svg';
import './Footer.css';

const Footer = () => {
  return (
    <footer id="footer" className="modern-footer">
      <div className="footer-container">
        <div className="footer-main">
          {/* Brand Section */}
          <div className="footer-brand">
            <div className="brand-logo">
              <img src={medmoveimg} alt="MedMove Logo" style={{ height: '40px' }} />
            </div>
            <p className="brand-description">
              Tamil Nadu's first technology-driven ambulance booking platform. 
              Connecting patients with verified medical transport quickly, safely, and affordably.
            </p>
            <div className="social-links">
              <a href="#" className="social-icon"><Globe size={20} /></a>
              <a href="#" className="social-icon"><MessageCircle size={20} /></a>
              <a href="#" className="social-icon"><Camera size={20} /></a>
              <a href="#" className="social-icon"><Briefcase size={20} /></a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-links-grid">
            <div className="links-group">
              <h4 className="group-title">Platform</h4>
              <ul>
                <li><a href="/">Search Ambulance</a></li>
                <li><a href="/login/provider">Provider Login</a></li>
                <li><a href="/register/provider">Join as Provider</a></li>
                <li><a href="/search-results">Available Cities</a></li>
              </ul>
            </div>
            
            <div className="links-group">
              <h4 className="group-title">Company</h4>
              <ul>
                <li><a href="#">About Us</a></li>
                <li><a href="#">Our Mission</a></li>
                <li><a href="#">Careers</a></li>
                <li><a href="#">Press Release</a></li>
              </ul>
            </div>

            <div className="links-group">
              <h4 className="group-title">Contact</h4>
              <ul className="contact-info">
                <li><Mail size={16} /> <span>support@medmove.in</span></li>
                <li><Phone size={16} /> <span>+91 98765 43210</span></li>
                <li><MapPin size={16} /> <span>Madurai, Tamil Nadu</span></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="footer-divider"></div>

        <div className="footer-bottom">
          <p className="copyright">© 2024 MedMove Pvt. Ltd. All rights reserved.</p>
          <div className="legal-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
