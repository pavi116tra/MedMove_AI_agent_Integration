import React from 'react'
import './Nine.css';
import saurabh from "../../../Assest/saurabh.webp";
const Nine = () => {
  return (
    <>
        <div className="home-9">
            <div className="home9-content">
                 <div className="home9-heading">
                     <h2>What our users have to say</h2>
                 </div>
                 <div className="home9-pic">
                      <div className="pic">
                         <img src={saurabh} alt="s"/>
                      </div> 
                      <p>The medmove team demonstrated true professionalism  and empathy throughout our journey to the hospital.Medmove's non-emergency ambulance service is simply outstanding.Thank you, medmove!</p>
                 </div>
            </div>
        </div>
    </>
  )
}

export default Nine
