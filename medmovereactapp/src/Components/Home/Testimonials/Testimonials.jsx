import React from 'react';
import { Star } from 'lucide-react';
import './Testimonials.css';

const Testimonials = () => {
  const reviews = [
    {
      id: 1,
      name: 'Rajesh Kumar',
      location: 'Madurai',
      quote: "My father needs dialysis three times a week. Before MedMove, we struggled every single time to find transport. Now I book in 2 minutes and the ambulance arrives on time, every time. This service has genuinely changed our lives.",
      tag: 'Dialysis Transport'
    },
    {
      id: 2,
      name: 'Arjun Venkatesh',
      location: 'Chennai',
      quote: "After my bypass surgery, the hospital discharge was stressful enough. MedMove made the ride home completely worry-free. The price shown before booking was exactly what I paid. No hidden charges at all.",
      tag: 'Hospital Discharge'
    },
    {
      id: 3,
      name: 'Lakshmi Devi',
      location: 'Erode',
      quote: "I was nervous booking online for the first time. But the process was so simple. The ambulance came exactly on time. I use MedMove every week now for my chemotherapy sessions.",
      tag: 'Recurring Bookings'
    }
  ];

  const getInitials = (name) => {
    return name.charAt(0);
  };

  return (
    <section className="testimonials-section">
      <div className="testimonials-container">
        <div className="testimonials-header">
          <span className="testimonials-eyebrow">Real stories, real families</span>
          <h2>What Our Patients Say</h2>
        </div>

        <div className="testimonials-grid">
          {reviews.map((review) => (
            <div className="testimonial-card" key={review.id}>
              
              {/* Profile Area */}
              <div className="testimonial-profile">
                <div className="testimonial-avatar">
                  {getInitials(review.name)}
                </div>
                <div className="testimonial-author">
                  <h4>{review.name}</h4>
                  <span className="location">{review.location}</span>
                </div>
              </div>

              {/* Stars */}
              <div className="testimonial-stars">
                {[...Array(5)].map((_, index) => (
                  <Star key={index} fill="#F5A623" color="#F5A623" size={18} />
                ))}
              </div>

              {/* Quote */}
              <div className="testimonial-quote">
                "{review.quote}"
              </div>

              {/* Tag Pill */}
              <div className="testimonial-tag-pill">
                {review.tag}
              </div>

            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
