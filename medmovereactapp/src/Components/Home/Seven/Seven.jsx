import React from 'react'
import './Seven.css';
import pic from '../../../Assest/bed.webp';
import usericon from "../../../Assest/user-icon.png";
import navy from "../../../Assest/medcab-nav-icon.png";
import  choose from "../../../Assest/why-choose-us-icon.webp";
import hos from "../../../Assest/WCU-icon6.webp";
const Seven = () => {
  return (
    <div className="home-7">
        <div className="home7-oneline">
            <div className="home7-h2">
               <h2>Why Choose MedMove</h2>
            </div>
            <p>We are India's one of the leading non-emergency ambulance providers known for quick response and efficient medical services...</p>
         </div>
        <div className="home7-secondline">
           <div className="secondline">
              <div className="leftpart">
                  <div className="lp">
                      <div className="leftpart-1">
                             <div className="leftpart-img1">
                                 <img src={navy} alt="nav"/>
                             </div>
                             <div className="leftpart-con1">
                                <h2>Live Patient Tracking</h2>
                                <p>Track the ambulance in real time with location, ETA, and journey updates..</p>
                             </div>
                      </div> 
                      <div className="leftpart-1">
                            <div className="leftpart-img2">
                                <img src={usericon} alt="amb"/>
                            </div>
                             <div className="leftpart-con2">
                                  <h2>Women Supporter</h2>
                                  <p>Option to request a female assistant for patient comfort and safety..</p>
                             </div>
                       </div>
                      <div className="leftpart-1">
                             <div className="leftpart-img3">
                                <img src={choose}  alt=""/>
                             </div>
                              <div className="leftpart-con3">
                                <h2>Non-Emergency Ambulance</h2>
                                <p>Safe, scheduled transport for patients, pets, or other non-urgent needs..</p>
                             </div>
                       </div>  
                   </div>
              </div>
                 <div className="rightpart">
                    <img src={pic} alt="picture"/>
                </div>
           </div>
        </div>
    </div>
  )
}

export default Seven
