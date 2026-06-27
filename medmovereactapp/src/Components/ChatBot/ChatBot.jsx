import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import API_BASE from '../../config/api';
import './ChatBot.css';

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

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const [lang, setLang] = useState(() => localStorage.getItem('medmove_lang') || 'en');
  const [isRecording, setIsRecording] = useState(false);
  const [showMicTooltip, setShowMicTooltip] = useState(false);
  const messagesEndRef = useRef(null);

  const quickRepliesEN = [
    "Find an ambulance",
    "Ambulance types",
    "How is price calculated?",
    "How to book?"
  ];

  const quickRepliesTA = [
    "ஆம்புலன்ஸ் தேடு",
    "வகைகள் என்ன?",
    "விலை எவ்வளவு?",
    "புக்கிங் எப்படி?"
  ];

  const currentQuickReplies = lang === 'ta' ? quickRepliesTA : quickRepliesEN;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setHasUnread(false);
    }
  }, [messages, isOpen, isTyping]);

  useEffect(() => {
    let searchContext = null;
    try {
      const stored = localStorage.getItem('medmove_search_context');
      if (stored) searchContext = JSON.parse(stored);
    } catch (e) {}

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let welcomeText = "";
    if (lang === 'ta') {
      welcomeText = `வணக்கம்! 👋 நான் MedMove புக்கிங் உதவியாளர்.\n\nதிட்டமிட்ட மருத்துவமனை பயணங்களுக்கு வசதியான போக்குவரத்து ஏற்பாடு செய்ய நான் உங்களுக்கு உதவுகிறேன்:\n• சரியான ஆம்புலன்ஸ் வகை தேர்வு\n• புக்கிங் செய்வது எப்படி\n• விலை கணக்கீடு புரிந்துகொள்வது\n• ஆம்புலன்ஸ் நிறுவனம் பதிவு செய்வது\n\nநான் என்ன உதவி செய்யட்டும்?`;
    } else {
      if (searchContext && searchContext.pickup && searchContext.drop) {
        welcomeText = `Hi! 👋 I'm your MedMove booking assistant.\n\nI can see you're looking for an ambulance from ${searchContext.pickup} to ${searchContext.drop}.\n\nI can help you:\n• Understand ambulance types and pricing\n• Complete your booking\n• Find the right ambulance for your need\n• Answer questions about how MedMove works\n\nWhat do you need help with?`;
      } else {
        welcomeText = `Hi! 👋 I'm your MedMove booking assistant.\n\nI help families arrange comfortable medical transport for planned hospital visits. I can help you with:\n• Finding the right ambulance for your patient\n• Understanding ambulance types and pricing\n• Completing your booking step by step\n• Registering your ambulance company\n\nWhat can I help you with today?`;
      }
    }

    setMessages([
      { id: 1, sender: 'ai', text: welcomeText, time: timeStr }
    ]);
  }, [lang]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) setHasUnread(false);
  };

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
      setInputMessage(transcript);
      if (isFinal) {
        setIsRecording(false);
        sendMessage(transcript);
      }
    }, (err) => {
      console.error("Speech recognition error:", err);
      setIsRecording(false);
    });
    if (rec) {
      rec.onend = () => setIsRecording(false);
    }
  };

  const sendMessage = async (textToSend) => {
    const text = textToSend || inputMessage;
    if (!text.trim()) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg = { id: Date.now(), sender: 'user', text, time: timeStr };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputMessage('');
    setShowQuickReplies(false);
    setIsTyping(true);

    let searchContext = null;
    try {
      const stored = localStorage.getItem('medmove_search_context');
      if (stored) searchContext = JSON.parse(stored);
    } catch (e) {}

    try {
      const response = await axios.post(`${API_BASE}/api/ai/chat`, {
        message: text,
        context: searchContext
      });

      const aiReply = response.data.reply || (lang === 'ta' ? "நான் உங்கள் MedMove புக்கிங் உதவியாளர். நான் வேறு எவ்வாறு உதவ வேண்டும்?" : "I am your MedMove booking assistant. How can I help you further?");
      const aiMsg = { id: Date.now() + 1, sender: 'ai', text: aiReply, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
      setMessages(prev => [...prev, aiMsg]);
      if (!isOpen) setHasUnread(true);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMsg = { id: Date.now() + 1, sender: 'ai', text: lang === 'ta' ? "தற்போது தொடர்புகொள்வதில் சிக்கல் உள்ளது. தயவுசெய்து மீண்டும் முயற்சிக்கவும்." : "I'm having trouble connecting right now. Please try again or use the search form to find an ambulance.", time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button className="chat-toggle-btn" onClick={toggleChat} aria-label="Toggle Booking Assistant">
        <span className="chat-icon">💬</span>
        {hasUnread && <span className="chat-badge-dot" />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="chat-window">
          {/* Header */}
          <div className="chat-header">
            <div className="chat-header-left">
              <div className="chat-title">🚑 MedMove Assistant</div>
              <div className="chat-subtitle">Online • Booking Help</div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Language Toggle */}
              <div className="chat-lang-toggle">
                <button 
                  type="button" 
                  className={`chat-lang-btn ${lang === 'en' ? 'active' : ''}`}
                  onClick={() => { setLang('en'); localStorage.setItem('medmove_lang', 'en'); }}
                >
                  EN
                </button>
                <button 
                  type="button" 
                  className={`chat-lang-btn ${lang === 'ta' ? 'active' : ''}`}
                  onClick={() => { setLang('ta'); localStorage.setItem('medmove_lang', 'ta'); }}
                >
                  தமிழ்
                </button>
              </div>
              <button className="chat-close-btn" onClick={toggleChat}>×</button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="chat-messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`chat-bubble-wrapper ${msg.sender}`}>
                <div className={`chat-bubble ${msg.sender}`}>
                  {msg.text.split('\n').map((line, idx) => (
                    <React.Fragment key={idx}>
                      {line}
                      {idx !== msg.text.split('\n').length - 1 && <br />}
                    </React.Fragment>
                  ))}
                  <div className="chat-timestamp">{msg.time}</div>
                </div>
              </div>
            ))}

            {/* Quick Replies Chips */}
            {showQuickReplies && (
              <div className="quick-replies-container">
                {currentQuickReplies.map((reply, index) => (
                  <button key={index} className="quick-reply-chip" onClick={() => sendMessage(reply)}>
                    {reply}
                  </button>
                ))}
              </div>
            )}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="chat-bubble-wrapper ai">
                <div className="chat-bubble ai typing-indicator">
                  <span className="dot" />
                  <span className="dot" />
                  <span className="dot" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Row */}
          <div className="chat-input-row" style={{ position: 'relative' }}>
            <input
              type="text"
              className="chat-input"
              placeholder={lang === 'ta' ? "உங்கள் கேள்வியை தட்டச்சு செய்யவும்..." : "Type your question..."}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
            />

            {/* Mic Button */}
            {('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) && (
              <div style={{ position: 'relative', display: 'inline-block' }}>
                {showMicTooltip && (
                  <div className="chat-mic-tooltip">
                    Speak in Tamil or English 🎤
                  </div>
                )}
                <button 
                  type="button"
                  className={`chat-mic-btn ${isRecording ? 'recording' : ''}`}
                  onClick={handleMicClick}
                  title="Speech to Text"
                >
                  🎤
                </button>
              </div>
            )}

            <button className="chat-send-btn" onClick={() => sendMessage()}>
              ➔
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatBot;
