import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import './Payment.css';
import API_BASE from '../config/api';

const Payment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [paid, setPaid] = useState(false);
  const [copied, setCopied] = useState(false);

  const {
    ambulance, pickup, drop,
    date, time, distance_km,
    patientDetails
  } = location.state || {};

  const amount = ambulance?.estimated_total || 0;
  const upiString = `upi://pay?pa=medmove@paytm&pn=MedMove&am=${amount}&cu=INR&tn=MedMove Ambulance Booking`;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText('medmove@paytm');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleScanned = async () => {
    setScanned(true);
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const bookingData = {
        ambulance_id: ambulance?.id,
        provider_id: ambulance?.provider_id,
        pickup_location: pickup,
        drop_location: drop,
        booking_date: date,
        booking_time: time,
        distance_km,
        
        // Patient details
        patient_name: patientDetails?.patient_name || "Guest",
        patient_age: patientDetails?.patient_age || 0,
        patient_condition: patientDetails?.patient_condition || "",
        need_oxygen: patientDetails?.need_oxygen || false,
        wheelchair: patientDetails?.wheelchair || false,
        special_notes: patientDetails?.special_instructions || "",

        // Fare Breakdown
        base_charge: ambulance?.base_charge,
        distance_charge: distance_km * ambulance?.price_per_km,
        total_price: amount
      };

      const bookingRes = await axios.post(
        `${API_BASE}/api/bookings/create`,
        bookingData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (bookingRes.data.success) {
        await axios.post(
          `${API_BASE}/api/bookings/send-receipt`,
          { booking_id: bookingRes.data.booking.id },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setPaid(true);
        setLoading(false);
        setTimeout(() => {
          navigate('/booking-success', {
            state: {
              booking: bookingRes.data.booking,
              ambulance, pickup, drop, date, time, amount
            }
          });
        }, 2200);
      }
    } catch (error) {
      console.error('Payment error:', error);
      setLoading(false);
      alert('Payment processing failed. Check console.');
    }
  };

  return (
    <div className={`payment-page ${paid ? 'confirmed-state' : ''}`}>
      {/* 9. PROGRESS BAR AT VERY TOP WHEN CONFIRMED */}
      {paid && <div className="completion-bar"></div>}

      {/* 1. TOP HEADER ROW */}
      <div className="payment-header">
        <button className="back-btn-red" onClick={() => navigate(-1)}>← Back</button>
        <h2 className="payment-title">💳 Payment</h2>
        <span className="secure-badge-green">🔒 100% Secure</span>
      </div>

      {/* 2. TOTAL AMOUNT BOX */}
      <div className="amount-box">
        <span className="amount-label">Total Amount</span>
        <span className="amount">₹{amount}</span>
        <span className="amount-sub">inclusive of all transport charges</span>
      </div>

      {/* 3. DEMO PAYMENT BANNER */}
      <div className="demo-notice-blue">
        <span className="demo-icon">ℹ️</span>
        <span>Demo Mode — This is a college project demonstration. No real money will be charged.</span>
      </div>

      {!paid && (
        <div className="payment-body">
          {/* 4. QR CODE SECTION */}
          <div className="qr-container">
            <h3 className="qr-title">Scan to Pay ₹{amount}</h3>
            <span className="qr-subtitle">Scan with any UPI app</span>
            
            <div className="qr-box">
              <QRCodeSVG value={upiString} size={200} fgColor="#CC0000" />
            </div>

            <div className="upi-apps-row">
              <span className="upi-badge">GPay</span>
              <span className="upi-badge">PhonePe</span>
              <span className="upi-badge">Paytm</span>
            </div>

            <div className="upi-id-row" onClick={handleCopyUpi} title="Click to copy">
              <span>UPI ID: <strong>medmove@paytm</strong></span>
              <button className="copy-btn">📋</button>
              {copied && <span className="copied-tooltip">Copied!</span>}
            </div>
          </div>
          
          {/* 5. PRICE BREAKDOWN BOX */}
          <div className="breakdown-box">
            <div className="breakdown-row">
              <span>Base Charge</span>
              <span>₹{ambulance?.base_charge}</span>
            </div>
            <div className="breakdown-row">
              <span>Distance ({distance_km}km)</span>
              <span>₹{distance_km * (ambulance?.price_per_km || 0)}</span>
            </div>
            <div className="breakdown-divider"></div>
            <div className="breakdown-row total-row">
              <span>Total</span>
              <span>₹{amount}</span>
            </div>
          </div>

          {/* 6. CONFIRM PAYMENT BUTTON */}
          {!scanned && (
            <button className="scanned-btn pulse-anim" onClick={handleScanned}>
              🔒 I Have Scanned — Confirm Payment
            </button>
          )}

          {loading && (
            <div className="processing">
              <div className="spinner"></div>
              <p className="proc-title">Processing payment...</p>
              <p className="proc-sub">Sending receipt to WhatsApp...</p>
            </div>
          )}
        </div>
      )}

      {/* 7, 8, 9. PAYMENT CONFIRMED STATE */}
      {paid && (
        <div className="paid-success-container">
          <div className="success-svg-wrapper">
            <svg className="checkmark-svg" viewBox="0 0 52 52">
              <circle className="checkmark-circle" cx="26" cy="26" r="23" fill="none" />
              <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
            </svg>
          </div>
          <h3 className="success-title">Payment Confirmed!</h3>
          <p className="success-subtitle">
            Your ambulance booking is secured. Driver details will be shared shortly.
          </p>
          <div className="redirect-row">
            <span>Redirecting to success page</span>
            <span className="dots-anim"><span>.</span><span>.</span><span>.</span></span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payment;
