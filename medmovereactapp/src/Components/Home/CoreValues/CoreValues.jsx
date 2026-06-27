import React from 'react';
import { Zap, Heart, Link, Cpu } from 'lucide-react';
import './CoreValues.css';

const CoreValues = () => {
  const values = [
    {
      id: 1,
      icon: <Zap size={24} color="#ffffff" />,
      title: 'Fast Access',
      desc: 'Quick connections to essential healthcare services.'
    },
    {
      id: 2,
      icon: <Heart size={24} color="#ffffff" />,
      title: 'Human Care',
      desc: 'Every patient is treated with empathy and respect.'
    },
    {
      id: 3,
      icon: <Link size={24} color="#ffffff" />,
      title: 'Trusted Network',
      desc: 'Partnered hospitals and verified medical providers.'
    },
    {
      id: 4,
      icon: <Cpu size={24} color="#ffffff" />,
      title: 'Smart Platform',
      desc: 'Simple bookings and coordinated healthcare access.'
    }
  ];

  return (
    <section className="core-values-section">
      <div className="core-values-container">
        <div className="core-values-header">
          <h2>Our Core Values & Platform Impact</h2>
          <p>What guides how MedMove connects patients with trusted healthcare services.</p>
        </div>

        <div className="core-values-grid">
          {values.map((val) => (
            <div className="core-value-card" key={val.id}>
              {/* Outer double border ring */}
              <div className="core-value-ring">
                <div className="core-value-content">
                  <div className="core-value-icon-wrapper">
                    {val.icon}
                  </div>
                  <h3>{val.title}</h3>
                  <p>{val.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CoreValues;
