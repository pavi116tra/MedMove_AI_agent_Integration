import React, { useState } from "react";
import "./AmbulanceSelection.css";

const AmbulanceSelection = () => {
  const [ambulanceType, setAmbulanceType] = useState("");
  const [supporter, setSupporter] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`Selected: ${ambulanceType} ambulance with ${supporter}`);
  };

  return (
    <div className="selection-container">
      <h2>Book Your Ambulance</h2>

      <form onSubmit={handleSubmit}>
        {/* Ambulance Type */}
        <div className="form-section">
          <h3>Select Ambulance Type</h3>
          <label>
            <input
              type="radio"
              value="Patient"
              checked={ambulanceType === "Patient"}
              onChange={(e) => setAmbulanceType(e.target.value)}
            />
            Patient
          </label>
          <label>
            <input
              type="radio"
              value="Dead Body"
              checked={ambulanceType === "Dead Body"}
              onChange={(e) => setAmbulanceType(e.target.value)}
            />
            Dead Body
          </label>
          <label>
            <input
              type="radio"
              value="Veterinary"
              checked={ambulanceType === "Veterinary"}
              onChange={(e) => setAmbulanceType(e.target.value)}
            />
            Veterinary
          </label>
        </div>

        {/* Supporter */}
        <div className="form-section">
          <h3>Select Supporter</h3>
          <label>
            <input
              type="radio"
              value="No Supporter"
              checked={supporter === "No Supporter"}
              onChange={(e) => setSupporter(e.target.value)}
            />
            No Supporter
          </label>
          <label>
            <input
              type="radio"
              value="Supporter"
              checked={supporter === "Supporter"}
              onChange={(e) => setSupporter(e.target.value)}
            />
            Supporter
          </label>
          <label>
            <input
              type="radio"
              value="Woman Supporter"
              checked={supporter === "Woman Supporter"}
              onChange={(e) => setSupporter(e.target.value)}
            />
            Woman Supporter
          </label>
        </div>

        <button type="submit" className="book-btn">
          Continue
        </button>
      </form>
    </div>
  );
};

export default AmbulanceSelection;
