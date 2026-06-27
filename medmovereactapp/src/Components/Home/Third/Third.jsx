import React from 'react';
import { useNavigate } from 'react-router-dom';
import "./Third.css";
import ambulanceImg from "../../../Assest/model-hospital.jpg";

const Third = () => {
  const navigate = useNavigate();
  return (
    <div className="provider-cta-section">
      <div className="provider-cta-container">
        <div className="provider-cta-image">
          <img src={ambulanceImg} alt="Ambulance Provider" />
          <div className="image-overlay"></div>
        </div>
        <div className="provider-cta-content">
          <div className="cta-text-wrapper">
            <h1>Are You an Ambulance Provider?</h1>
            <p>List your ambulances on MedMove and reach thousands of patients across Tamil Nadu. Grow your service with India's most trusted platform.</p>
            <button className="provider-btn" onClick={() => navigate('/register/provider')}>Register as Provider →</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Third;
