import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../../context/AuthContext";
import LoginModal from "../../LoginModal/LoginModal";
import "./Firstdetail.css";
import workhome from "../../../Assest/work-from-home.png";
import calender from "../../../Assest/calendar.png";
import destinationIcon from "../../../Assest/destination.png";
import ambulanceIcon from "../../../Assest/medcab-nav-icon.png"; // Using an existing icon
import search from "../../../Assest/search-interface-symbol.png";
import axios from "axios";
import API_BASE from "../../../config/api";

const startVoiceRecording = (language, onResult, onError) => {
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    alert('Voice input works best in Chrome browser.');
    return null;
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();

  recognition.lang = language === 'ta' ? 'ta-IN' : 'en-IN';
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  recognition.onresult = (event) => {
    let transcript = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript;
    }
    onResult(transcript, event.results[event.resultIndex].isFinal);
  };

  recognition.onerror = (event) => {
    if (onError) onError(event.error);
  };

  recognition.start();
  return recognition;
};

const Firstdetail = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useContext(AuthContext);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }));
  const [ambulanceType, setAmbulanceType] = useState("Basic");

  const [aiInput, setAiInput] = useState("");
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [aiResult, setAiResult] = useState(null);

  const [lang, setLang] = useState(() => localStorage.getItem('medmove_lang') || 'en');
  const [isRecording, setIsRecording] = useState(false);
  const [showMicTooltip, setShowMicTooltip] = useState(false);

  const handleMicClick = () => {
    if (!localStorage.getItem('medmove_mic_tooltip_shown')) {
      setShowMicTooltip(true);
      localStorage.setItem('medmove_mic_tooltip_shown', 'true');
      setTimeout(() => setShowMicTooltip(false), 3000);
    }
    if (isRecording) {
      setIsRecording(false);
      return;
    }
    setIsRecording(true);
    const rec = startVoiceRecording(lang, (transcript, isFinal) => {
      setAiInput(transcript);
      if (isFinal) setIsRecording(false);
    }, (err) => {
      console.error("Speech recognition error:", err);
      setIsRecording(false);
    });
    if (rec) {
      rec.onend = () => setIsRecording(false);
    }
  };

  const handleAnalyse = async () => {
    if (!aiInput.trim()) return alert(lang === 'ta' ? "தயவுசெய்து நோயாளியின் பயண தேவையை விவரிக்கவும்" : "Please describe the patient condition");
    setIsAnalysing(true);
    try {
      const response = await axios.post(`${API_BASE}/api/ai/triage`, { description: aiInput });
      if (response.data.success) {
        setAiResult(response.data);
        localStorage.setItem('medmove_ai_advice', JSON.stringify(response.data));
        
        if (!response.data.is_emergency && response.data.ambulance_type) {
          const typeLower = response.data.ambulance_type?.toLowerCase();
          if (typeLower === 'basic') setAmbulanceType('Basic');
          else if (typeLower === 'oxygen') setAmbulanceType('Oxygen');
          else if (typeLower === 'icu') setAmbulanceType('ICU');
        }
      }
    } catch (err) {
      console.error("AI Triage Error:", err);
      alert("Failed to connect to AI triage assistant.");
    } finally {
      setIsAnalysing(false);
    }
  };

  const locations = [
    "Chennai", "Madurai", "Coimbatore", "Trichy", "Salem", 
    "Tirunelveli", "Erode", "Vellore", "Thoothukudi", "Thanjavur"
  ];

  const handleSearch = () => {
    if (!isAuthenticated) {
      setIsLoginModalOpen(true);
      return;
    }

    if (!source.trim()) return alert("Please enter your location");
    if (!destination.trim()) return alert("Please enter destination");

    localStorage.setItem('medmove_search_context', JSON.stringify({
      pickup: source.trim(),
      drop: destination.trim(),
      ambulance_type: ambulanceType,
      patient_condition: aiInput || ''
    }));

    navigate('/search-results', {
      state: {
        pickup: source.trim(),
        drop: destination.trim(),
        date,
        time,
        type: ambulanceType
      }
    });
  };

  // Format date for display: 19 July, 2025
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return new Date(dateStr).toLocaleDateString('en-GB', options);
  };

  return (
    <div className="home1-details">
      <div className="details-des">
        <div className="des-text">
          {/* Source */}
          <div className="des-box des1">
            <img src={workhome} alt="source" />
            <div className="input-group">
                <label>Your Location</label>
                <input 
                    type="text" 
                    list="locations-list"
                    value={source} 
                    onChange={(e) => setSource(e.target.value)} 
                    placeholder="Enter city..."
                />
            </div>
          </div>

          {/* Destination */}
          <div className="des-box des2">
            <img src={destinationIcon} alt="destination" />
            <div className="input-group">
                <label>Destination</label>
                <input 
                    type="text" 
                    list="locations-list"
                    value={destination} 
                    onChange={(e) => setDestination(e.target.value)} 
                    placeholder="Enter city..."
                />
            </div>
          </div>

          {/* Date and Time */}
          <div className="des-box des3">
            <div className="date-time-field">
              <div className="date-time-top">
                <span className="field-label">Date & Time</span>
              </div>
              <div className="date-time-inputs">
                <input
                  type="date"
                  className="date-input"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
                <input
                  type="time"
                  className="time-input"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Ambulance Type */}
          <div className="des-box des4">
            <img src={ambulanceIcon} alt="ambulance" />
            <div className="input-group">
                <label>Ambulance Type</label>
                <select 
                    value={ambulanceType} 
                    onChange={(e) => setAmbulanceType(e.target.value)}
                    className="ambulance-select"
                >
                    <option value="Basic">Basic (BLS)</option>
                    <option value="Oxygen">Oxygen (ALS)</option>
                    <option value="ICU">ICU / Ventilator</option>
                </select>
            </div>
          </div>
        </div>

        {/* NEW AI TRIAGE SECTION */}
        <div className="ai-triage-container">
          <div className="ai-input-row" style={{ position: 'relative' }}>
            <input 
              type="text"
              className="ai-description-input"
              placeholder={lang === 'ta' ? "நோயாளியின் பயண தேவையை விவரிக்கவும்... எ.கா: என் அப்பாவுக்கு வாரம் 3 முறை டயாலிசிஸ் போக வேண்டும் எ.கா: அம்மா மருத்துவமனையிலிருந்து டிஸ்சார்ஜ் ஆகிறார் எ.கா: முதியவர் மருத்துவமனை சோதனைக்கு செல்ல வேண்டும்" : "Describe the patient's transport need... e.g. My father needs dialysis transport 3 times a week e.g. Mother is being discharged from hospital, needs stretcher e.g. Elderly patient going for chemotherapy appointment"}
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
            />

            {/* Mic Button */}
            {('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) && (
              <div style={{ position: 'relative', display: 'inline-block' }}>
                {showMicTooltip && (
                  <div className="mic-tooltip">
                    Speak in Tamil or English 🎤<br/>Works best in Chrome
                  </div>
                )}
                <button 
                  type="button"
                  className={`mic-btn ${isRecording ? 'recording' : ''}`}
                  onClick={handleMicClick}
                  title="Speech to Text"
                >
                  🎤
                </button>
              </div>
            )}

            {/* Language Toggle Pills */}
            <div className="lang-toggle-container">
              <button 
                type="button"
                className={`lang-pill ${lang === 'en' ? 'active' : ''}`} 
                onClick={() => { setLang('en'); localStorage.setItem('medmove_lang', 'en'); }}
              >
                EN
              </button>
              <button 
                type="button"
                className={`lang-pill ${lang === 'ta' ? 'active' : ''}`} 
                onClick={() => { setLang('ta'); localStorage.setItem('medmove_lang', 'ta'); }}
              >
                தமிழ்
              </button>
            </div>

            <button 
              type="button"
              className="ai-analyse-btn"
              onClick={handleAnalyse}
              disabled={isAnalysing}
            >
              {isAnalysing ? "Analysing..." : "Analyse →"}
            </button>
          </div>

          {aiResult && (
            <div className="ai-result-box-wrapper">
              {aiResult.is_emergency ? (
                <div className="ai-emergency-neutral-box">
                  MedMove is for planned medical transport only. For medical emergencies, please call 108.
                  <br/><br/>
                  If you need to schedule a hospital transport for a non-emergency situation, we are here to help.
                </div>
              ) : (
                <>
                  <div className="ai-green-result-box">
                    <div className="ai-green-left">
                      <div className="ai-recommend-title">
                        ✅ Best match for this journey: {aiResult.ambulance_type === 'basic' ? 'Basic (BLS)' : aiResult.ambulance_type === 'oxygen' ? 'Oxygen (ALS)' : 'ICU Mobile ICU'}
                      </div>
                      <div className="ai-recommend-reason">
                        {aiResult.reason}
                      </div>
                    </div>
                    <div className="ai-auto-badge">
                      Type selected for you ✓
                    </div>
                  </div>
                  <div className="ai-blue-result-box">
                    💡 Journey preparation: {aiResult.preparation_tips || aiResult.journey_tip || aiResult.safety_note || "Confirm hospital appointment time and have medical records ready."}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <datalist id="locations-list">
        {locations.map((loc) => (
            <option key={loc} value={loc} />
        ))}
      </datalist>

      {/* Search Button */}
      <button className="search-btn" onClick={handleSearch}>
        <img src={search} alt="search" />
        <span>Search Ambulance</span>
      </button>

      {/* Login Modal */}
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
        onLoginSuccess={handleSearch}
      />
    </div>
  );
};

export default Firstdetail;
