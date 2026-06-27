import React from 'react'
import './First.css'
const First = () => {
  return (
    <>
       <div className="home-1">
             <div className="home1-text">
                   <div className="hero-content">
                     <div style={{
                        display: 'inline-block',
                        backgroundColor: '#fff0f0',
                        color: '#E53935',
                        border: '1px solid #fca5a5',
                        fontSize: '12px',
                        fontWeight: '600',
                        borderRadius: '20px',
                        padding: '5px 14px',
                        marginBottom: '12px'
                      }}>
                        📅 Planned Medical Transport — Not for Emergencies
                      </div>
                     <h2>Redefining Non-Emergency Medical Transport in India</h2>
                     <p className="hero-tagline">Delivering comfort, care, and convenience through advanced booking solutions.</p>
                   </div>
             </div>
       </div>
    </>
  )
}

export default First