import React from 'react';
import './Sixth.css';

const Sixth = () => {
  return (
    <div className="sixth-section">
      <h2 className="sixth-title">How It Works</h2>
      <p className="sixth-subtitle">Book your non-emergency ambulance in 3 simple steps</p>

      <div className="sixth-grid">
        <div className="sixth-card">
          <div className="step-number">1</div>
          <h3 className="sixth-card-title">Search</h3>
          <p className="sixth-card-text">
            Enter your pickup and destination locations to find available ambulances nearby.
          </p>
        </div>

        <div className="sixth-card">
          <div className="step-number">2</div>
          <h3 className="sixth-card-title">Book</h3>
          <p className="sixth-card-text">
            Select your preferred ambulance type and support options, then confirm your booking.
          </p>
        </div>

        <div className="sixth-card">
          <div className="step-number">3</div>
          <h3 className="sixth-card-title">Ride</h3>
          <p className="sixth-card-text">
            Get picked up on time and track your journey in real-time to your destination.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Sixth;
