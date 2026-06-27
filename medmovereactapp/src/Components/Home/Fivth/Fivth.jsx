import React from 'react';
import "./Fivth.css";
import home from "../../../Assest/toyamb.jpg"; // Using for Oxygen
import sup from "../../../Assest/supporter.jpg"; // Using for Basic
import wheelchair from "../../../Assest/wheelChair_and_cylinder (1).webp"; // Using for ICU

const Fivth = () => {
  return (
    <div className="home-5">
      <div className="home5-header">
        <h2>Our Ambulance Types</h2>
        <p>Choose the best fit for your medical needs</p>
      </div>
      <div className="home5-content">
        <div className="part1">
          <div className="h5-img">
            <img src={sup} alt="Basic Ambulance" />
          </div>
          <div className="h5-tools">
            <div className="tools-text">
              <h2>Basic (BLS)</h2>
              <p>For stable patients requiring basic monitoring and transport.</p>
            </div>
          </div>
        </div>

        <div className="part1">
          <div className="h5-img">
            <img src={home} alt="Oxygen Ambulance" />
          </div>
          <div className="h5-tools">
            <div className="tools-text">
              <h2>Oxygen (ALS)</h2>
              <p>Equipped with oxygen support for patients with respiratory needs.</p>
            </div>
          </div>
        </div>

        <div className="part1">
          <div className="h5-img">
            <img src={wheelchair} alt="ICU Ambulance" />
          </div>
          <div className="h5-tools">
            <div className="tools-text">
              <h2>ICU / Ventilator</h2>
              <p>Advanced life support with ventilators for critical patients.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Fivth;
