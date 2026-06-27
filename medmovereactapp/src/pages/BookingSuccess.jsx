import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import './BookingSuccess.css';

const BookingSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    booking, ambulance,
    pickup, drop, date, time, amount
  } = location.state || {};

  let aiAdvice = null;
  try {
    const stored = localStorage.getItem('medmove_ai_advice');
    if (stored) aiAdvice = JSON.parse(stored);
  } catch(e){}

  const generatePDF = (bookingIdStr, formattedAmount) => {
    const doc = new jsPDF();

    // 1. Red Top Header Banner
    doc.setFillColor(204, 0, 0);
    doc.rect(0, 0, 210, 32, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('Medi Ride Ambulance Services', 14, 20);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Official Booking Receipt & Travel Pass', 14, 27);

    // 2. Main Title Header
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text(`BOOKING RECEIPT #${bookingIdStr}`, 14, 46);

    // 3. Box 1: Booking Details Box (Clean light gray background)
    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, 52, 182, 45, 3, 3, 'FD');

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('Booking Details', 20, 62);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Booking ID:', 20, 70);
    doc.text('Route:', 20, 77);
    doc.text('Travel Date & Time:', 20, 84);
    doc.text('Amount Paid:', 20, 91);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`#${bookingIdStr}`, 70, 70);
    doc.text(`${pickup || 'N/A'} -> ${drop || 'N/A'}`, 70, 77);
    doc.text(`${date || 'N/A'} at ${time || '10:00 AM'}`, 70, 84);
    
    doc.setTextColor(204, 0, 0);
    doc.text(`RS. ${formattedAmount}`, 70, 91);

    // 4. Box 2: Ambulance & Transport Details Box (Clean light gray background)
    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, 104, 182, 45, 3, 3, 'FD');

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('Ambulance & Transport Details', 20, 114);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Service Provider:', 20, 122);
    doc.text('Vehicle Number:', 20, 129);
    doc.text('Driver Name:', 20, 136);
    doc.text('Driver Phone:', 20, 143);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`${ambulance?.company_name || booking?.company_name || 'Medi Ride Partner'}`, 70, 122);
    doc.text(`${ambulance?.vehicle_number || booking?.vehicle_number || 'TN37AB9999'}`, 70, 129);
    doc.text(`${ambulance?.driver_name || booking?.driver_name || 'Assigned Driver'}`, 70, 136);
    doc.text(`${ambulance?.driver_phone || booking?.driver_phone || '+91 9876543210'}`, 70, 143);

    // 5. Box 3: Patient Care & Guidelines Box (Clean light gray background)
    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, 156, 182, 40, 3, 3, 'FD');

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('Patient Care & Journey Guidelines', 20, 166);

    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    doc.text('- Keep patient comfortable and lying down during travel.', 20, 175);
    doc.text('- Do not provide food or water immediately prior to transport.', 20, 182);
    doc.text('- Carry doctor prescriptions, medical reports, and ID proof.', 20, 189);

    // 6. Footer Note
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text('Thank you for choosing Medi Ride Ambulance Services. Emergency Support: +91 98765 43210', 14, 212);

    // Save PDF file
    doc.save(`MediRide_Receipt_MED${bookingIdStr}.pdf`);
  };

  const handleShareWhatsApp = () => {
    const bookingIdNum = booking?.id || 18;
    const bookingIdStr = `MED${String(bookingIdNum).padStart(4, '0')}`;
    const formattedAmount = Number(amount || 10140).toLocaleString('en-IN');

    // Step 1: Generate and Download crisp, highly visible PDF receipt
    generatePDF(bookingIdStr, formattedAmount);

    // Step 2: Formulate exact WhatsApp message text
    const waMessage = `🏥 *Ambulance Booking Confirmed*

*Booking ID:* #${bookingIdStr}
*Route:* ${pickup || 'Chennai'} → ${drop || 'Coimbatore'}
*Date:* ${date || '27-Jun-2026'}
*Amount Paid:* ₹${formattedAmount}

📄 *Receipt Generated Successfully*

Please find the attached receipt PDF (MediRide_Receipt_${bookingIdStr}.pdf).

Thank you for choosing Medi Ride Ambulance Services.`;

    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(waMessage)}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div className="success-page">
      <div className="success-header">
        <div className="checkmark">✅</div>
        <h1>Booking Confirmed!</h1>
        <p>Your ambulance has been booked successfully. Receipt sent to your WhatsApp!</p>
      </div>

      <div className="booking-id-box">
        <span>Booking ID</span>
        <strong>#MED{String(booking?.id || 18).padStart(4,'0')}</strong>
      </div>

      <div className="confirm-card">
        <h3>🚑 Ambulance Details</h3>
        <div className="confirm-row"><span>Company</span><span>{ambulance?.company_name || 'Medi Ride Partner'}</span></div>
        <div className="confirm-row"><span>Vehicle</span><span>{ambulance?.vehicle_number || 'TN37AB9999'}</span></div>
        <div className="confirm-row"><span>Driver</span><span>{ambulance?.driver_name || 'Assigned Driver'}</span></div>
        <div className="confirm-row"><span>Driver Phone</span><span>{ambulance?.driver_phone || '+91 9876543210'}</span></div>
      </div>

      <div className="confirm-card">
        <h3>📍 Trip Details</h3>
        <div className="confirm-row"><span>Pickup</span><span>{pickup || 'Chennai'}</span></div>
        <div className="confirm-row"><span>Drop</span><span>{drop || 'Coimbatore'}</span></div>
        <div className="confirm-row"><span>Date & Time</span><span>{date || '27-Jun-2026'} at {time || '10:00 AM'}</span></div>
        <div className="confirm-row total"><span>Amount Paid</span><span>₹{Number(amount || 10140).toLocaleString('en-IN')}</span></div>
      </div>

      <div className="whatsapp-notice">
        📱 Receipt sent to your WhatsApp number!
      </div>

      <div className="ai-guide-section">
        <h3 className="ai-guide-title">🤖 Journey Preparation Guide</h3>
        <div className="ai-cards-grid">
          <div className="ai-card">
            <h4>Why this ambulance?</h4>
            <p>{aiAdvice?.reason || "Stable patient — Basic (BLS) ambulance recommended for a comfortable journey."}</p>
          </div>
          <div className="ai-card">
            <h4>Prepare now</h4>
            <p>Keep patient lying down comfortably. Loosen tight clothing. Do not give food or water. Stay calm and reassure patient.</p>
          </div>
          <div className="ai-card">
            <h4>Documents to carry</h4>
            <p>• Aadhaar card / ID proof<br/>• Doctor's prescription or referral letter<br/>• Previous medical reports<br/>• Health insurance card (if any)</p>
          </div>
          <div className="ai-card">
            <h4>Plan your next visit</h4>
            <p>MedMove makes repeat hospital visits easy. Save your frequent routes and book in seconds next time.</p>
          </div>
        </div>

        <button className="whatsapp-share-btn" onClick={handleShareWhatsApp}>
          📱 Share Booking Details on WhatsApp
        </button>
      </div>

      <div className="success-buttons" style={{ marginTop: '1.5rem' }}>
        <button onClick={() => navigate('/')} className="home-btn">Back to Home</button>
      </div>
    </div>
  );
};

export default BookingSuccess;
