import React from 'react'
import { Gauge, Clock, MapPin, ShieldCheck } from 'lucide-react'
import './Mission.css'

const cards = [
  { icon: <Gauge size={32} color="white" />, title: "Reliable", sub: "Ambulance Network" },
  { icon: <Clock size={32} color="white" />, title: "24/7", sub: "Always Available" },
  { icon: <MapPin size={32} color="white" />, title: "Real-time", sub: "Live GPS Tracking" },
  { icon: <ShieldCheck size={32} color="white" />, title: "Verified", sub: "OTP Checked Providers" },
]

const Mission = () => {
  return (
    <section className="mission-section">
      <div className="mission-overlay" />
      <div className="mission-inner">

        <div className="mission-left">
          <div className="mission-badge">Est. 2024 · Tamil Nadu</div>
          <h2 className="mission-heading">
            Our Mission —<br />
            Simplifying{' '}
            <span className="mission-muted">Healthcare</span>{' '}
            Access<br />
            Across Tamil Nadu
          </h2>
          <p className="mission-body">
            MedMove is Tamil Nadu's first technology-driven ambulance
            booking platform — connecting patients with verified medical
            transport quickly, safely, and affordably, whenever it
            matters most.
          </p>
        </div>

        <div className="mission-grid">
          {cards.map((c, i) => (
            <div className="mission-card" key={i}>
              <div className="mission-card-icon">{c.icon}</div>
              <div className="mission-card-title">{c.title}</div>
              <div className="mission-card-sub">{c.sub}</div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}

export default Mission
