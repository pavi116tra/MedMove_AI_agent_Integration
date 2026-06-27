const twilio = require('twilio');
require('dotenv').config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioNumber = process.env.TWILIO_PHONE_NUMBER;

let client;
if (accountSid && authToken) {
    client = twilio(accountSid, authToken);
}

const sendOTP = async (phone, otp) => {
    // If Twilio credentials are missing, we log to console (Dev Mode/Fallback)
    if (!client || !twilioNumber) {
        console.log(`[DEV MODE] OTP for ${phone}: ${otp}`);
        return { success: true, message: 'OTP sent successfully (Mock)' };
    }

    try {
        const message = await client.messages.create({
            body: `Your MedMove verification code is: ${otp}. It will expire in 10 minutes.`,
            from: twilioNumber,
            to: `+91${phone}` // Assuming India prefix, fallback to +91
        });
        console.log(`[OTP SENT] SID: ${message.sid}`);
        return { success: true, message: 'OTP sent successfully via Twilio' };
    } catch (err) {
        console.error('Twilio Send Error:', err);
        // We throw so the controller handles it with a 500 status
        throw new Error('Failed to send SMS via Twilio');
    }
};

const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

module.exports = { sendOTP, generateOTP };
