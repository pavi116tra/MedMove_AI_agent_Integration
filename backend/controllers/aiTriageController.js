const { GoogleGenerativeAI } = require('@google/generative-ai');

// Helper function for smart chatbot fallback replies
const getChatbotFallbackReply = (message) => {
  const msg = (message || '').toLowerCase();
  const isTamil = /[\u0B80-\u0BFF]/.test(message || '');

  if (isTamil) {
    if (/வகை|மாதிரி|வித|எந்த ஆம்புலன்ஸ்|என்ன ஆம்புலன்ஸ்/.test(message)) {
      return 'MedMove-ல் 3 வகை ஆம்புலன்ஸ் இருக்கு:\n\n• Basic (BLS) — நிலையான நோயாளர்களுக்கு. டயாலிசிஸ், மருத்துவமனை வருகை, முதியோர் பயணம். மிகவும் குறைந்த விலை.\n\n• Oxygen (ALS) — பயணத்தின்போது ஆக்ஸிஜன் தேவைப்படும் நோயாளர்களுக்கு. மூச்சு சிரமம், COPD நோயாளர்கள்.\n\n• ICU — திட்டமிட்ட மருத்துவமனை மாற்றத்திற்கு. தொடர் கண்காணிப்பு தேவைப்படும் நோயாளர்கள்.\n\nமேலும் தெரிந்துகொள்ள விரும்புகிறீர்களா?';
    } else if (/விலை|கட்டணம்|எவ்வளவு|பணம்|சார்ஜ்|கால்குலேட்|கணக்கீ/.test(message)) {
      return 'MedMove விலை கணக்கீடு:\n\nமொத்த விலை = அடிப்படை கட்டணம் + (தூரம் KM × KM கட்டணம்)\n\nஉதாரணம்: சிவகாசி → மதுரை (80 KM)\nஅடிப்படை கட்டணம்: ₹800\n80 KM × ₹15 = ₹1,200\nமொத்தம்: ₹2,000\n\nஒவ்வொரு ஆம்புலன்ஸின் சரியான விலை புக்கிங் செய்வதற்கு முன்பே காட்டப்படும்.';
    } else if (/புக்கிங்|பதிவு|எப்படி|பயன்படுத்த/.test(message)) {
      return 'MedMove-ல் புக்கிங் செய்வது எப்படி:\n\n1. உங்கள் ஊர் மற்றும் இலக்கு நகரம் உள்ளிடவும்\n2. தேதி மற்றும் நேரம் தேர்வு செய்யவும்\n3. "Search Ambulance" கிளிக் செய்யவும்\n4. ஆம்புலன்ஸ் தேர்வு செய்து "Book Now" கிளிக்\n5. நோயாளர் விவரங்கள் நிரப்பவும்\n6. UPI QR code மூலம் பணம் செலுத்தவும்\n7. டிரைவர் தொலைபேசி எண் உடனே கிடைக்கும்';
    } else if (/ரத்து|கேன்சல்/.test(message)) {
      return 'புக்கிங் ரத்து செய்ய, உங்கள் புக்கிங் உறுதிப்படுத்தல் பக்கத்தில் உள்ள டிரைவர் தொலைபேசி எண்ணில் நேரடியாக தொடர்பு கொள்ளவும். MedMove புக்கிங் தளம் மட்டுமே — பயண விவரங்கள் ஆம்புலன்ஸ் நிறுவனம் கையாளும்.';
    } else if (/பதிவு|நிறுவனம்|வழங்குநர்|provider/.test(message)) {
      return 'ஆம்புலன்ஸ் நிறுவனமாக பதிவு செய்ய:\n\n1. "Register" → "I am an Ambulance Provider" கிளிக்\n2. நிறுவன விவரங்கள், லைசென்ஸ் ஆவணம் அளிக்கவும்\n3. அட்மின் அனுமதிக்குப் பிறகு உள்நுழையலாம்\n4. உங்கள் ஆம்புலன்ஸ்களை சேர்த்து புக்கிங் பெறலாம்';
    } else if (/பணம்|pay|payment|upi|qr/.test(msg)) {
      return 'MedMove UPI QR code மூலம் பணம் பெறும். புக்கிங் உறுதிப்படுத்தும்போது QR code காட்டப்படும். PhonePe, GPay அல்லது Paytm மூலம் scan செய்யவும். (இது demo project — உண்மையான பணம் வசூலிக்கப்படாது)';
    } else if (/டயாலிசிஸ்|dialysis/.test(message)) {
      return 'டயாலிசிஸ் நோயாளர்களுக்கு Basic (BLS) ஆம்புலன்ஸ் பொருத்தமானது. நிலையான நோயாளர்கள் சுதந்திரமாக சுவாசிக்கக்கூடியவர்களுக்கு இது சிறந்தது. மிகவும் குறைந்த விலையிலும் கிடைக்கும். தேட "Search Ambulance" பயன்படுத்தவும்.';
    } else if (/தொடர் பயணம்|மீண்டும் புக்|வாரம்|recurring|dialysis 3x/.test(message)) {
      return 'தொடர் பயணங்கள் (Recurring Trips):\n\nநோயாளிகள் புக்கிங் உறுதிப்படுத்தும்போது "Is this a recurring trip?" என்பதை ஆன் செய்து, வார நாட்கள் மற்றும் இறுதி தேதியை தேர்ந்தெடுக்கலாம். பயணம் செய்ய வேண்டிய நாளில் டாஷ்போர்டில் நீல நிற பேனர் தோன்றும், அதன் மூலம் ஒரே கிளிக்கில் மீண்டும் புக் செய்யலாம்.';
    } else if (/eta|வருகை நேரம்|நேரம்|தூரம்|km|distance|duration|how long/.test(message)) {
      return 'வருகை நேரம் & தூரம் (ETA & Distance):\n\nஒவ்வொரு ஆம்புலன்ஸ் தேடல் முடிவிலும் உண்மையான சாலை வழி தூரம் மற்றும் வருகை நேரம் (ETA) காட்டப்படும். இது தோராயமான கணக்கீடு அல்லாமல் உண்மையான வழித்தடத்தின் அடிப்படையில் கணக்கிடப்படுகிறது.';
    } else if (/நினைவூட்டல்|வாட்ஸ்அப்|whatsapp|driver|reminder|2 மணி/.test(message)) {
      return 'வாட்ஸ்அப் நினைவூட்டல் (WhatsApp Reminders):\n\nஉங்கள் ஆம்புலன்ஸ் வருவதற்கு 2 மணி நேரத்திற்கு முன்பு உங்கள் டாஷ்போர்டில் ஆரஞ்சு நிற நினைவூட்டல் பேனர் தோன்றும். அதன் மூலம் வாட்ஸ்அப் வழியாக டிரைவரை நேரடியாக தொடர்பு கொள்ளலாம்.';
    } else {
      return 'நான் உங்களுக்கு MedMove-ல் திட்டமிட்ட மருத்துவமனை பயணம் புக்கிங் செய்ய உதவுகிறேன். நீங்கள் என்ன தெரிந்துகொள்ள விரும்புகிறீர்கள்?\n\n• ஆம்புலன்ஸ் வகைகள் பற்றி\n• விலை கணக்கீடு\n• புக்கிங் செய்வது எப்படி\n• தொடர் பயணங்கள், ETA மற்றும் நினைவூட்டல்கள்';
    }
  } else {
    if (msg.includes('type') || msg.includes('basic') ||
        msg.includes('oxygen') || msg.includes('icu') ||
        msg.includes('difference') || msg.includes('kind') ||
        msg.includes('which ambulance') || msg.includes('what ambulance')) {
      return 'MedMove has 3 ambulance types:\n\n• Basic (BLS) — For stable patients who can breathe independently. Best for dialysis, routine hospital visits, elderly transport. Most affordable.\n\n• Oxygen (ALS) — For patients who need oxygen during travel. COPD patients, breathing difficulty, home oxygen users.\n\n• ICU (Mobile ICU) — For planned hospital-to-hospital transfers needing continuous monitoring and medical equipment.\n\nWould you like help choosing the right type for your patient?';
    } else if (msg.includes('price') || msg.includes('cost') ||
               msg.includes('charge') || msg.includes('how much') ||
               msg.includes('fee') || msg.includes('rate') || msg.includes('calculate')) {
      return 'MedMove pricing formula:\n\nTotal = Base Charge + (Distance KM × Rate per KM)\n\nExample: Sivakasi → Madurai (80 km)\nBase charge: ₹800\n80 km × ₹15 = ₹1,200\nTotal: ₹2,000\n\nExact price is always shown before you confirm booking.';
    } else if (msg.includes('book') || msg.includes('how to') ||
               msg.includes('step') || msg.includes('process')) {
      return 'How to book on MedMove:\n\n1. Enter your pickup city and destination\n2. Select date and time\n3. Click Search Ambulance\n4. Choose an ambulance and click Book Now\n5. Fill patient details\n6. Pay via UPI QR code\n7. Driver phone number appears instantly on confirmation page';
    } else if (msg.includes('cancel') || msg.includes('refund')) {
      return 'To cancel a booking, contact the driver directly using the phone number shown on your booking confirmation page. MedMove is the booking platform — the ambulance provider handles trip-related requests.';
    } else if (msg.includes('provider') || msg.includes('register') ||
               msg.includes('list') || msg.includes('company')) {
      return 'To register your ambulance company on MedMove:\n\n1. Click Register → I am an Ambulance Provider\n2. Submit company details and license document\n3. Wait for admin approval\n4. Add your ambulances and start receiving bookings';
    } else if (msg.includes('pay') || msg.includes('payment') ||
               msg.includes('upi') || msg.includes('qr')) {
      return 'MedMove uses UPI QR code payment. When you confirm booking, a QR code appears with the exact amount. Scan with PhonePe, GPay, or Paytm. (This is a college demo — no real money is charged.)';
    } else if (msg.includes('dialysis')) {
      return 'For dialysis patients, Basic (BLS) ambulance is the right choice. Stable patients who breathe independently do not need oxygen equipment. It is also the most affordable option. Use Search Ambulance to find available vehicles.';
    } else if (msg.includes('recurring') || msg.includes('repeat') || msg.includes('rebook')) {
      return 'Recurring Trips:\n\nToggle "Make this a recurring trip?" during checkout, picking day-of-week checkboxes and active until date. You will get a blue re-book banner on your dashboard when it\'s time to re-book, allowing you to re-book with a single click.';
    } else if (msg.includes('eta') || msg.includes('time') || msg.includes('how long') || msg.includes('duration') || msg.includes('distance')) {
      return 'ETA & Distance:\n\nEvery ambulance search result displays real driving distance and estimated arrival time (ETA) using live road-routing data for transparency.';
    } else if (msg.includes('reminder') || msg.includes('whatsapp') || msg.includes('driver')) {
      return 'WhatsApp Reminders:\n\nPatients automatically receive a dashboard notification ~2 hours before booked arrival with a link to message the driver directly on WhatsApp.';
    } else {
      return 'I can help you with booking planned medical transport on MedMove. What would you like to know?\n\n• Ambulance types explained\n• How pricing works\n• How to complete a booking\n• Recurring trips, ETA, and reminders';
    }
  }
};

exports.triagePatient = async (req, res) => {
  try {
    const { description } = req.body;
    
    if (!description || description.trim().length < 3) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please describe the patient condition' 
      });
    }

    const isTamil = /[\u0B80-\u0BFF]/.test(description);
    const descLower = description.toLowerCase();

    // Check emergency keywords (English & Tamil)
    if (descLower.includes('accident') || descLower.includes('heart attack') || 
        descLower.includes('stroke') || descLower.includes('unconscious') || 
        descLower.includes('bleeding heavily') || descLower.includes('emergency') ||
        /விபத்து|மாரடைப்பு|பக்கவாதம்|மயக்கம்/.test(description)) {
      return res.json({
        success: true,
        is_emergency: true,
        ambulance_type: null,
        reason: isTamil ? 'MedMove திட்டமிட்ட மருத்துவமனை பயணத்திற்கு மட்டுமே. அவசர நிலைக்கு 108 அழைக்கவும்.' : 'MedMove is for planned medical transport only. For emergencies please call 108.',
        confidence: 'none'
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey || apiKey === 'your_gemini_key_here') {
      // Fallback if no API key — keyword-based logic
      let ambulance_type = 'basic';
      let reason = '';
      let journey_tip = '';
      let preparation_tips = '';

      if (isTamil) {
        if (/வென்டிலேட்டர்|ventilator|ஐசியு|ICU|தீவிர சிகிச்சை|கோமா|மயக்கம்/.test(description)) {
          ambulance_type = 'icu';
          reason = 'நோயாளருக்கு பயணத்தின்போது தொடர் மருத்துவ கண்காணிப்பு தேவை — ICU ஆம்புலன்ஸ் பாதுகாப்பான பயணம் உறுதி செய்யும்.';
          journey_tip = 'ICU ஆம்புலன்ஸில் பயிற்சி பெற்ற மருத்துவ ஊழியர் இருப்பார். மருத்துவமனையிடம் முன்கூட்டியே தெரிவிக்கவும்.';
          preparation_tips = '• அனைத்து மருத்துவ ஆவணங்களையும் ஒரே இடத்தில் வைக்கவும்\n• இலக்கு மருத்துவமனையை முன்கூட்டியே தொடர்பு கொள்ளவும்\n• டிரைவருக்கு நோயாளர் நிலை பற்றி தெரிவிக்கவும்';
        } else if (/ஆக்ஸிஜன்|oxygen|மூச்சு|சுவாசம்|COPD|இதய|cardiac|நுரையீரல்/.test(description)) {
          ambulance_type = 'oxygen';
          reason = 'நோயாளருக்கு பயணத்தின்போது ஆக்ஸிஜன் ஆதரவு தேவை — Oxygen (ALS) ஆம்புலன்ஸ் வசதியான பயணம் உறுதி செய்யும்.';
          journey_tip = 'ஆம்புலன்ஸில் ஆக்ஸிஜன் சிலிண்டர் மற்றும் பயிற்சி பெற்ற பரிசோதகர் இருப்பார்.';
          preparation_tips = '• வீட்டிலுள்ள ஆக்ஸிஜன் சிலிண்டர் அளவை சரிபார்க்கவும்\n• மருத்துவர் கடிதம் மற்றும் ஆவணங்கள் தயாராக வைக்கவும்\n• பயண நேரத்தை மருத்துவரிடம் தெரிவிக்கவும்';
        } else {
          ambulance_type = 'basic';
          reason = 'நிலையான நோயாளர்களுக்கு Basic (BLS) ஆம்புலன்ஸ் பொருத்தமானது — வசதியான மற்றும் மலிவான பயணம்.';
          journey_tip = 'பயணத்திற்கு முன் நோயாளர் சாப்பிட்டு, ஓய்வெடுத்திருக்கட்டும்.';
          preparation_tips = '• ஆதார் அட்டை மற்றும் மருத்துவ ஆவணங்கள் எடுத்துச் செல்லவும்\n• மருத்துவமனை அப்பாயிண்ட்மெண்ட் லெட்டர் கையில் வைக்கவும்\n• டிரைவரின் தொலைபேசி எண்ணை புக்கிங் உறுதிப்படுத்தல் பக்கத்தில் பாருங்கள்';
        }
      } else {
        if (descLower.includes('ventilator') || descLower.includes('unconscious') ||
            descLower.includes('icu') || descLower.includes('coma') ||
            descLower.includes('critical transfer') || descLower.includes('unresponsive')) {
          ambulance_type = 'icu';
          reason = 'Patient needs continuous monitoring and medical equipment during the planned hospital transfer — ICU ambulance ensures a safe journey.';
          journey_tip = 'ICU ambulance has a trained medical team onboard. Inform the destination hospital about the transfer in advance.';
          preparation_tips = '• Keep all medical reports and hospital letters in one bag\n• Contact the destination hospital before departure\n• Inform the driver about the patient\'s medical equipment needs';
        } else if (descLower.includes('oxygen') || descLower.includes('breathing') ||
                   descLower.includes('cardiac') || descLower.includes('copd') ||
                   descLower.includes('lung') || descLower.includes('respiratory') ||
                   descLower.includes('inhaler') || descLower.includes('nebulizer')) {
          ambulance_type = 'oxygen';
          reason = 'Patient needs oxygen support during travel — Oxygen (ALS) ambulance ensures a comfortable and safe journey.';
          journey_tip = 'The ambulance carries an oxygen cylinder and trained paramedic. Inform them of current oxygen flow rate if patient uses home oxygen.';
          preparation_tips = '• Check home oxygen cylinder level before departure\n• Carry prescription and doctor\'s referral letter\n• Note the paramedic\'s contact number from your booking confirmation';
        } else {
          ambulance_type = 'basic';
          reason = 'Stable patient — Basic (BLS) ambulance is the right choice for a comfortable, planned hospital journey.';
          journey_tip = 'Ensure patient has eaten and rested well before the journey for maximum comfort.';
          preparation_tips = '• Carry Aadhaar card and any medical reports\n• Keep hospital appointment letter ready\n• Driver\'s phone number will appear on your booking confirmation page';
        }
      }

      return res.json({
        success: true,
        ambulance_type,
        reason,
        confidence: 'medium',
        journey_tip,
        preparation_tips
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `You are a transport advisor for MedMove, a planned non-emergency medical transport booking platform in India — like RedBus but for ambulances.

MedMove helps families arrange PLANNED hospital transport (dialysis, discharge, elderly checkup, chemotherapy, post-surgery).

MedMove ONLY serves patients with PLANNED transport needs.
If someone describes an emergency (accident, heart attack, stroke, unconscious) — return:
{
  "ambulance_type": null,
  "reason": "${isTamil ? 'MedMove திட்டமிட்ட மருத்துவமனை பயணத்திற்கு மட்டுமே. அவசர நிலைக்கு 108 அழைக்கவும்.' : 'MedMove is for planned medical transport only. For emergencies please call 108.'}",
  "confidence": "none",
  "is_emergency": true
}

CRITICAL LANGUAGE REQUIREMENT:
The user input language is: ${isTamil ? 'TAMIL (தமிழ்)' : 'ENGLISH'}.
${isTamil ? 'You MUST write the JSON string values for "reason", "journey_tip", and "preparation_tips" in clear, natural TAMIL script. Do NOT respond in English.' : 'Write all JSON string values in ENGLISH.'}

Recommend the right ambulance type:
BASIC (BLS): Stable patient (dialysis, checkup, discharge).
OXYGEN (ALS): Patient needs oxygen or breathing monitoring.
ICU (Mobile ICU): Continuous monitoring / ventilator / critical planned transfer.

Patient description: "${description}"

Respond ONLY with valid JSON (keys in English, text values in ${isTamil ? 'TAMIL' : 'ENGLISH'}):
{
  "ambulance_type": "basic",
  "reason": "sentence explaining why this ambulance ensures a comfortable planned journey",
  "confidence": "high",
  "journey_tip": "practical tip to make journey comfortable",
  "preparation_tips": "three helpful preparation tips",
  "is_emergency": false
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    if (parsed.ambulance_type && !['basic', 'oxygen', 'icu'].includes(parsed.ambulance_type.toLowerCase())) {
      parsed.ambulance_type = 'basic';
    }
    
    return res.json({ success: true, ...parsed });

  } catch (error) {
    console.error('AI Triage Error:', error.message);
    const isTamil = /[\u0B80-\u0BFF]/.test(req.body.description || '');
    if (isTamil) {
      return res.json({
        success: true,
        is_emergency: false,
        ambulance_type: 'basic',
        reason: 'நிலையான நோயாளர்களுக்கு Basic (BLS) ஆம்புலன்ஸ் பொருத்தமானது — வசதியான மற்றும் மலிவான பயணம்.',
        confidence: 'low',
        journey_tip: 'பயணத்திற்கு முன் நோயாளர் சாப்பிட்டு, ஓய்வெடுத்திருக்கட்டும்.',
        preparation_tips: '• ஆதார் அட்டை மற்றும் மருத்துவ ஆவணங்கள் எடுத்துச் செல்லவும்\n• மருத்துவமனை அப்பாயிண்ட்மெண்ட் லெட்டர் கையில் வைக்கவும்\n• டிரைவரின் தொலைபேசி எண்ணை புக்கிங் உறுதிப்படுத்தல் பக்கத்தில் பாருங்கள்'
      });
    }
    return res.json({
      success: true,
      is_emergency: false,
      ambulance_type: 'basic',
      reason: 'Basic (BLS) ambulance selected for your planned hospital visit. Please inform driver of any specific travel preferences.',
      confidence: 'low',
      journey_tip: 'Keep patient comfortable during travel.',
      preparation_tips: '• Keep medical documents ready\n• Confirm appointment time\n• Stay relaxed during transport'
    });
  }
};

exports.chatWithGuide = async (req, res) => {
  try {
    const { message, context } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === 'your_gemini_key_here') {
      const reply = getChatbotFallbackReply(message);
      return res.json({ success: true, reply });
    }

    const isTamil = /[\u0B80-\u0BFF]/.test(message || '');

    const contextStr = context?.pickup ? 
      `User's search context: Looking for ambulance from ${context.pickup} to ${context.drop}. Ambulance type: ${context.ambulance_type || 'not selected'}. Patient condition: ${context.patient_condition || 'not provided'}.` 
      : 'User is browsing MedMove without an active search.';

    const systemPrompt = `You are MedMove's booking assistant.
MedMove is a planned non-emergency medical transport platform in India.

Here is some info about MedMove's features that you can use to answer questions:

[ENGLISH KNOWLEDGE BASE]
- Ambulance Types:
  * Basic (BLS) - For stable patients. Dialysis, routine visits. Most affordable.
  * Oxygen (ALS) - For patients needing oxygen support.
  * ICU (Mobile ICU) - For critical patient transfers needing monitoring/ventilator.
- Pricing Formula: Total = Base Charge + (Distance KM x Rate per KM). Exact price is shown before booking confirmation.
- Booking Steps:
  1. Enter pickup and destination.
  2. Select date and time.
  3. Search and choose an ambulance, click Book Now.
  4. Fill patient details and pay via UPI QR code.
  5. Driver details are shown on confirmation.
- Recurring Trips: Patients can toggle "Make this a recurring trip?" during checkout, picking day-of-week checkboxes and active until date. They get a blue re-book banner on their dashboard to book again in one click without manual search.
- ETA & Distance: Every ambulance search result displays real driving distance and estimated arrival time (ETA) using live road-routing data, not flat estimates. If a patient asks "how long will it take," explain that the ETA on the card is the real-time estimate for that specific vehicle's route.
- WhatsApp Reminders: Patients automatically receive a dashboard notification ~2 hours before booked arrival with a link to message the driver on WhatsApp. No signup needed, it is automatic for all confirmed bookings.

[TAMIL KNOWLEDGE BASE / தமிழ் அறிவுத் தளம்]
- ஆம்புலன்ஸ் வகைகள்:
  * Basic (BLS) — நிலையான நோயாளர்களுக்கு. டயாலிசிஸ், வழக்கமான மருத்துவமனை பயணம். மிக குறைந்த கட்டணம்.
  * Oxygen (ALS) — ஆக்ஸிஜன் தேவைப்படும் நோயாளர்களுக்கு.
  * ICU — தீவிர கண்காணிப்பு / வென்டிலேட்டர் தேவைப்படும் நோயாளிகளுக்கு.
- விலை கணக்கீடு: மொத்த விலை = அடிப்படை கட்டணம் + (தூரம் KM × KM கட்டணம்). புக்கிங் செய்வதற்கு முன் சரியான விலை காட்டப்படும்.
- புக்கிங் செய்யும் படிகள்:
  1. புறப்படும் இடம் மற்றும் சேருமிடம் உள்ளிடவும்.
  2. தேதி, நேரம் தேர்வு செய்யவும்.
  3. "Search Ambulance" கிளிக் செய்து, ஆம்புலன்ஸை தேர்வு செய்யவும்.
  4. "Book Now" கிளிக் செய்து, விவரங்களை பூர்த்தி செய்து UPI QR மூலம் பணம் செலுத்தவும்.
  5. புக்கிங் உறுதிப்படுத்தியவுடன் டிரைவர் எண் உடனே காட்டப்படும்.
- தொடர் பயணங்கள் (Recurring Trips): நோயாளிகள் புக்கிங் உறுதிப்படுத்தும்போது "Is this a recurring trip?" என்பதை ஆன் செய்து, வார நாட்களை (Mon-Sun) மற்றும் இறுதி தேதியை தேர்வு செய்யலாம். பிறகு, அவர்கள் தேட வேண்டிய அவசியமின்றி டாஷ்போர்டில் உள்ள நீல நிற பேனர் வழியாக ஒரே கிளிக்கில் மீண்டும் புக் செய்யலாம்.
- வருகை நேரம் & தூரம் (ETA & Distance): ஒவ்வொரு ஆம்புலன்ஸ் தேடல் முடிவும் உண்மையான சாலை வழி தூரம் மற்றும் வருகை நேரத்தை (ETA) காட்டும். நோயாளி "பயணம் எவ்வளவு நேரம் ஆகும்" என்று கேட்டால், கார்டில் காட்டப்படும் வருகை நேரம் (ETA) என்பது அந்த குறிப்பிட்ட வாகனத்தின் வழித்தடத்திற்கான நிகழ்நேர மதிப்பீடாகும் என்று விளக்கவும்.
- வாட்ஸ்அப் நினைவூட்டல் (WhatsApp Reminders): ஆம்புலன்ஸ் வருவதற்கு 2 மணி நேரத்திற்கு முன்பு நோயாளியின் டாஷ்போர்டில் தானியங்கி நினைவூட்டல் பேனர் தோன்றும். அதன் மூலம் வாட்ஸ்அப்பில் டிரைவரை நேரடியாக தொடர்பு கொள்ளலாம். இதற்கு தனியாக பதிவு செய்ய தேவையில்லை, அனைத்து உறுதிப்படுத்தப்பட்ட புக்கிங்களுக்கும் இது தானாகவே நடக்கும்.

${contextStr}

CRITICAL LANGUAGE RULE:
The user message language is: ${isTamil ? 'TAMIL (தமிழ்)' : 'ENGLISH'}.
${isTamil ? 'You MUST respond ONLY in TAMIL script. Do NOT use English.' : 'You MUST respond ONLY in ENGLISH.'}

Keep answers short (2-4 sentences). Be helpful, polite, and reassuring.

User message: ${message}`;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const result = await model.generateContent(systemPrompt);
    return res.json({ 
      success: true, 
      reply: result.response.text() 
    });

  } catch (error) {
    console.error('Chat error:', error.message);
    const reply = getChatbotFallbackReply(req.body.message || '');
    return res.json({
      success: true,
      reply
    });
  }
};
