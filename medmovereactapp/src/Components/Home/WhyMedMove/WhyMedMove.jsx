import React from 'react'
import './WhyMedMove.css'

const WhyMedMove = () => {
  const stats = [
    { label: "Providers", value: "500+" },
    { label: "Cities", value: "12" },
    { label: "Sec Booking", value: "60" }
  ]

  const pills = [
    { emoji: "🏥", text: "Post-surgery discharge" },
    { emoji: "💊", text: "Dialysis transport" },
    { emoji: "👴", text: "Elderly care visits" },
    { emoji: "🚑", text: "Inter-hospital transfer" }
  ]

  return (
    <section className="why-section">
      <div className="why-overlay" />
      
      <div className="why-content">
        <span className="why-eyebrow">WHY WE BUILT MEDMOVE</span>
        <h2 className="why-heading">
          Because Every Patient<br />
          Deserves a <span className="why-red">Safe Ride</span><br />
          Home.
        </h2>
        
        <p className="why-body">
          We discovered MedMove through a simple but painful truth —
          when a patient is discharged, the emergency is over,
          but the journey isn't. Families struggle to find reliable,
          safe, and affordable transport for dialysis runs, 
          post-surgery discharge, and elderly care visits.
          MedMove was built to solve exactly that.
        </p>

        <div className="why-pills">
          {pills.map((pill, i) => (
            <div className="why-pill" key={i}>
              <span>{pill.emoji}</span> {pill.text}
            </div>
          ))}
        </div>
      </div>

      <div className="why-stats">
        {stats.map((stat, i) => (
          <div className="why-stat-box" key={i}>
            <div className="why-stat-value">{stat.value}</div>
            <div className="why-stat-label">{stat.label}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default WhyMedMove
