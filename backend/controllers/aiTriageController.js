const { GoogleGenerativeAI } = require('@google/generative-ai');

exports.triagePatient = async (req, res) => {
  try {
    const { description } = req.body;
    
    if (!description || description.trim().length < 3) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please describe the patient condition' 
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey || apiKey === 'your_gemini_key_here') {
      // Fallback if no API key — keyword-based logic
      const desc = description.toLowerCase();
      
      // Check emergency keywords (English & Tamil)
      if (desc.includes('accident') || desc.includes('heart attack') || 
          desc.includes('stroke') || desc.includes('unconscious') || 
          desc.includes('bleeding heavily') || desc.includes('emergency') ||
          /விபத்து|மாரடைப்பு|பக்கவாதம்|மயக்கம்/.test(description)) {
        return res.json({
          success: true,
          is_emergency: true,
          ambulance_type: null,
          reason: 'MedMove is for planned medical transport only. For emergencies please call 108.',
          confidence: 'none'
        });
      }

      // Detect Tamil Unicode characters
      const isTamil = /[\u0B80-\u0BFF]/.test(description);
      
      let ambulance_type = 'basic';
      let reason = '';
      let journey_tip = '';
      let preparation_tips = '';

      if (isTamil) {
        // Tamil keyword detection
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
        // English keyword detection
        if (desc.includes('ventilator') || desc.includes('unconscious') ||
            desc.includes('icu') || desc.includes('coma') ||
            desc.includes('critical transfer') || desc.includes('unresponsive')) {
          ambulance_type = 'icu';
          reason = 'Patient needs continuous monitoring and medical equipment during the planned hospital transfer — ICU ambulance ensures a safe journey.';
          journey_tip = 'ICU ambulance has a trained medical team onboard. Inform the destination hospital about the transfer in advance.';
          preparation_tips = '• Keep all medical reports and hospital letters in one bag\n• Contact the destination hospital before departure\n• Inform the driver about the patient\'s medical equipment needs';
        } else if (desc.includes('oxygen') || desc.includes('breathing') ||
                   desc.includes('cardiac') || desc.includes('copd') ||
                   desc.includes('lung') || desc.includes('respiratory') ||
                   desc.includes('inhaler') || desc.includes('nebulizer')) {
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

MedMove helps families arrange PLANNED hospital transport:
- Dialysis patients going to hospital 3x per week
- Patients being discharged from hospital
- Elderly patients going for regular checkups
- Cancer patients going for chemotherapy
- Post-surgery patients going for follow-up visits

MedMove ONLY serves patients with PLANNED transport needs.
If someone describes an emergency (accident, heart attack in progress, stroke, unconscious patient) — do NOT recommend an ambulance type. Instead return:
{
  "ambulance_type": null,
  "reason": "MedMove is for planned medical transport only. For emergencies please call 108.",
  "confidence": "none",
  "is_emergency": true
}

The description may be in Tamil or English. 
Understand both. Always respond in English JSON only.

Recommend the right ambulance type for planned needs:

BASIC (BLS): Stable patient who can breathe independently.
For: Routine hospital visits, dialysis, post-recovery discharge, elderly transport, regular checkups.

OXYGEN (ALS): Patient needs oxygen or monitoring during travel.
For: Home oxygen users, COPD patients going for checkup, post-cardiac appointment, breathing needs during journey.

ICU (Mobile ICU): Patient needs continuous monitoring and medical equipment during a planned hospital transfer.
For: Hospital-to-hospital planned transfers, ventilator-dependent patients being moved between hospitals, post-ICU patients going to rehabilitation centre.

Patient description: "${description}"

Respond ONLY with valid JSON, no other text:
{
  "ambulance_type": "basic",
  "reason": "one calm reassuring sentence about why this ambulance ensures a comfortable planned journey",
  "confidence": "high",
  "journey_tip": "one practical tip to make the journey more comfortable for this patient",
  "preparation_tips": "three helpful preparation tips for this planned hospital visit",
  "is_emergency": false
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // Clean and parse JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    // Validate ambulance_type
    if (parsed.ambulance_type && !['basic', 'oxygen', 'icu'].includes(parsed.ambulance_type.toLowerCase())) {
      parsed.ambulance_type = 'basic';
    }
    
    return res.json({ success: true, ...parsed });

  } catch (error) {
    console.error('AI Triage Error:', error.message);
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

    const contextStr = context?.pickup ? 
      `User's search context: Looking for ambulance from ${context.pickup} to ${context.drop}. Ambulance type: ${context.ambulance_type || 'not selected'}. Patient condition described as: ${context.patient_condition || 'not provided'}.` 
      : 'User is browsing MedMove without an active search.';

    const systemPrompt = `You are MedMove's booking assistant.
MedMove is a planned non-emergency medical transport platform in India. We help families book ambulances for scheduled hospital visits — like booking a cab for a medical appointment.

${contextStr}

OUR SERVICES:
- Dialysis transport (regular scheduled trips)
- Hospital discharge transport  
- Regular medical appointment transport
- Elderly patient transport for checkups
- Planned hospital-to-hospital patient transfers

AMBULANCE TYPES:
Basic (BLS): Stable patients, routine visits, dialysis, elderly transport. Most affordable option.

Oxygen (ALS): Patients needing oxygen or monitoring during their hospital journey. Trained paramedic onboard.

ICU (Mobile ICU): Patients needing medical equipment and continuous monitoring during planned hospital transfer. ICU-trained medical staff onboard.

PRICING: Base Charge + (Distance KM × Rate per KM).
Example: Base ₹800 + 80km × ₹15/km = ₹2,000 total.

BOOKING PROCESS:
Search → Select ambulance → Fill patient details → Pay via UPI QR → Receive booking confirmation with driver name and phone number.

PAYMENT: UPI QR code demo. Scan with PhonePe, GPay, or Paytm. (College project demo — no real charge.)

AFTER BOOKING: Driver's phone number appears on confirmation page. Family contacts driver directly for journey-related questions.

The user may write in Tamil or English.
If user writes in Tamil, always respond in Tamil.
If user writes in English, always respond in English.
Detect the language from the user message automatically.
Never mix languages in one response.

YOUR PERSONALITY:
- Calm, helpful, professional — like a customer service agent at a medical transport company
- Think of users as: families planning hospital visits, patients with regular appointments, caregivers arranging transport for elderly parents
- Keep answers SHORT — 2 to 4 sentences
- Always offer to help with something else

WHAT YOU DO NOT DO:
- Never give medical advice
- Never discuss what to do during the journey (that is between the family and the driver)
- If user describes something that sounds like a medical crisis or accident, respond ONLY with:
  "MedMove is for planned hospital transport only. We are not an emergency service. For medical emergencies please call 108."
  Then do not continue on that topic.`;

    if (!apiKey || apiKey === 'your_gemini_key_here') {
      // Smart keyword fallback — no API needed
      const msg = message.toLowerCase();
      
      // Detect if message is in Tamil
      // Tamil Unicode range: \u0B80 to \u0BFF
      const isTamil = /[\u0B80-\u0BFF]/.test(message);
      
      let reply = '';

      // ── TAMIL KEYWORD MATCHING ──────────────────────────
      if (isTamil) {
        if (/வகை|மாதிரி|வித|எந்த ஆம்புலன்ஸ்|என்ன ஆம்புலன்ஸ்/.test(message)) {
          reply = 'MedMove-ல் 3 வகை ஆம்புலன்ஸ் இருக்கு:\n\n• Basic (BLS) — நிலையான நோயாளர்களுக்கு. டயாலிசிஸ், மருத்துவமனை வருகை, முதியோர் பயணம். மிகவும் குறைந்த விலை.\n\n• Oxygen (ALS) — பயணத்தின்போது ஆக்ஸிஜன் தேவைப்படும் நோயாளர்களுக்கு. மூச்சு சிரமம், COPD நோயாளர்கள்.\n\n• ICU — திட்டமிட்ட மருத்துவமனை மாற்றத்திற்கு. தொடர் கண்காணிப்பு தேவைப்படும் நோயாளர்கள்.\n\nமேலும் தெரிந்துகொள்ள விரும்புகிறீர்களா?';
        } else if (/விலை|கட்டணம்|எவ்வளவு|பணம்|சார்ஜ்/.test(message)) {
          reply = 'MedMove விலை கணக்கீடு:\n\nமொத்த விலை = அடிப்படை கட்டணம் + (தூரம் KM × KM கட்டணம்)\n\nஉதாரணம்: சிவகாசி → மதுரை (80 KM)\nஅடிப்படை கட்டணம்: ₹800\n80 KM × ₹15 = ₹1,200\nமொத்தம்: ₹2,000\n\nஒவ்வொரு ஆம்புலன்ஸின் சரியான விலை புக்கிங் செய்வதற்கு முன்பே காட்டப்படும்.';
        } else if (/புக்கிங்|பதிவு|எப்படி|பயன்படுத்த/.test(message)) {
          reply = 'MedMove-ல் புக்கிங் செய்வது எப்படி:\n\n1. உங்கள் ஊர் மற்றும் இலக்கு நகரம் உள்ளிடவும்\n2. தேதி மற்றும் நேரம் தேர்வு செய்யவும்\n3. "Search Ambulance" கிளிக் செய்யவும்\n4. ஆம்புலன்ஸ் தேர்வு செய்து "Book Now" கிளிக்\n5. நோயாளர் விவரங்கள் நிரப்பவும்\n6. UPI QR code மூலம் பணம் செலுத்தவும்\n7. டிரைவர் தொலைபேசி எண் உடனே கிடைக்கும்';
        } else if (/ரத்து|கேன்சல்/.test(message)) {
          reply = 'புக்கிங் ரத்து செய்ய, உங்கள் புக்கிங் உறுதிப்படுத்தல் பக்கத்தில் உள்ள டிரைவர் தொலைபேசி எண்ணில் நேரடியாக தொடர்பு கொள்ளவும். MedMove புக்கிங் தளம் மட்டுமே — பயண விவரங்கள் ஆம்புலன்ஸ் நிறுவனம் கையாளும்.';
        } else if (/பதிவு|நிறுவனம்|வழங்குநர்|provider/.test(message)) {
          reply = 'ஆம்புலன்ஸ் நிறுவனமாக பதிவு செய்ய:\n\n1. "Register" → "I am an Ambulance Provider" கிளிக்\n2. நிறுவன விவரங்கள், லைசென்ஸ் ஆவணம் அளிக்கவும்\n3. அட்மின் அனுமதிக்குப் பிறகு உள்நுழையலாம்\n4. உங்கள் ஆம்புலன்ஸ்களை சேர்த்து புக்கிங் பெறலாம்';
        } else if (/பணம்|pay|payment|upi|qr/.test(msg)) {
          reply = 'MedMove UPI QR code மூலம் பணம் பெறும். புக்கிங் உறுதிப்படுத்தும்போது QR code காட்டப்படும். PhonePe, GPay அல்லது Paytm மூலம் scan செய்யவும். (இது demo project — உண்மையான பணம் வசூலிக்கப்படாது)';
        } else if (/டயாலிசிஸ்|dialysis/.test(message)) {
          reply = 'டயாலிசிஸ் நோயாளர்களுக்கு Basic (BLS) ஆம்புலன்ஸ் பொருத்தமானது. நிலையான நோயாளர்கள் சுதந்திரமாக சுவாசிக்கக்கூடியவர்களுக்கு இது சிறந்தது. மிகவும் குறைந்த விலையிலும் கிடைக்கும். தேட "Search Ambulance" பயன்படுத்தவும்.';
        } else {
          reply = 'நான் உங்களுக்கு MedMove-ல் திட்டமிட்ட மருத்துவமனை பயணம் புக்கிங் செய்ய உதவுகிறேன். நீங்கள் என்ன தெரிந்துகொள்ள விரும்புகிறீர்கள்?\n\n• ஆம்புலன்ஸ் வகைகள் பற்றி\n• விலை கணக்கீடு\n• புக்கிங் செய்வது எப்படி\n• நிறுவனமாக பதிவு செய்வது';
        }
      }
      
      // ── ENGLISH KEYWORD MATCHING ─────────────────────────
      else {
        if (msg.includes('type') || msg.includes('basic') ||
            msg.includes('oxygen') || msg.includes('icu') ||
            msg.includes('difference') || msg.includes('kind') ||
            msg.includes('which ambulance') || msg.includes('what ambulance')) {
          reply = 'MedMove has 3 ambulance types:\n\n• Basic (BLS) — For stable patients who can breathe independently. Best for dialysis, routine hospital visits, elderly transport. Most affordable.\n\n• Oxygen (ALS) — For patients who need oxygen during travel. COPD patients, breathing difficulty, home oxygen users.\n\n• ICU (Mobile ICU) — For planned hospital-to-hospital transfers needing continuous monitoring and medical equipment.\n\nWould you like help choosing the right type for your patient?';
        } else if (msg.includes('price') || msg.includes('cost') ||
                   msg.includes('charge') || msg.includes('how much') ||
                   msg.includes('fee') || msg.includes('rate')) {
          reply = 'MedMove pricing formula:\n\nTotal = Base Charge + (Distance KM × Rate per KM)\n\nExample: Sivakasi → Madurai (80 km)\nBase charge: ₹800\n80 km × ₹15 = ₹1,200\nTotal: ₹2,000\n\nExact price is always shown before you confirm booking.';
        } else if (msg.includes('book') || msg.includes('how to') ||
                   msg.includes('step') || msg.includes('process')) {
          reply = 'How to book on MedMove:\n\n1. Enter your pickup city and destination\n2. Select date and time\n3. Click Search Ambulance\n4. Choose an ambulance and click Book Now\n5. Fill patient details\n6. Pay via UPI QR code\n7. Driver phone number appears instantly on confirmation page';
        } else if (msg.includes('cancel') || msg.includes('refund')) {
          reply = 'To cancel a booking, contact the driver directly using the phone number shown on your booking confirmation page. MedMove is the booking platform — the ambulance provider handles trip-related requests.';
        } else if (msg.includes('provider') || msg.includes('register') ||
                   msg.includes('list') || msg.includes('company')) {
          reply = 'To register your ambulance company on MedMove:\n\n1. Click Register → I am an Ambulance Provider\n2. Submit company details and license document\n3. Wait for admin approval\n4. Add your ambulances and start receiving bookings';
        } else if (msg.includes('pay') || msg.includes('payment') ||
                   msg.includes('upi') || msg.includes('qr')) {
          reply = 'MedMove uses UPI QR code payment. When you confirm booking, a QR code appears with the exact amount. Scan with PhonePe, GPay, or Paytm. (This is a college demo — no real money is charged.)';
        } else if (msg.includes('dialysis')) {
          reply = 'For dialysis patients, Basic (BLS) ambulance is the right choice. Stable patients who breathe independently do not need oxygen equipment. It is also the most affordable option. Use Search Ambulance to find available vehicles.';
        } else if (msg.includes('whatsapp') || msg.includes('receipt') ||
                   msg.includes('confirm')) {
          reply = 'After booking, your confirmation page shows all driver details. Click the Share on WhatsApp button to send booking details to yourself or family members instantly.';
        } else {
          reply = 'I can help you with booking planned medical transport on MedMove. What would you like to know?\n\n• Ambulance types explained\n• How pricing works\n• How to complete a booking\n• Register as a provider';
        }
      }

      return res.json({ success: true, reply });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const result = await model.generateContent(
      systemPrompt + '\n\nUser message: ' + message
    );

    return res.json({ 
      success: true, 
      reply: result.response.text() 
    });

  } catch (error) {
    console.error('Chat error:', error.message);
    return res.json({
      success: true,
      reply: "I am currently experiencing connection difficulties. Please try again or use the search form to find an ambulance for your planned visit."
    });
  }
};
