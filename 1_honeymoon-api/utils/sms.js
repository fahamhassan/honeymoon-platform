const twilio = require('twilio');

let client = null;

const getClient = () => {
  if (!client) {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      throw new Error('Twilio credentials not configured');
    }
    client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }
  return client;
};

/**
 * Send an OTP code via SMS.
 * In dev mode (NODE_ENV !== 'production'), logs to console and skips Twilio.
 */
const sendSms = async (to, body) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`\n📱 [DEV SMS] To: ${to}\n   Body: ${body}\n`);
    return { sid: 'DEV_MODE', status: 'dev' };
  }

  const msg = await getClient().messages.create({
    body,
    from: process.env.TWILIO_PHONE_NUMBER,
    to,
  });
  return msg;
};

const sendOtpSms = async (phone, code, purpose = 'verify') => {
  const messages = {
    verify: `Your HoneyMoon verification code is: ${code}\nValid for 10 minutes. Do not share this code.`,
    reset:  `Your HoneyMoon password reset code is: ${code}\nValid for 10 minutes. Do not share this code.`,
    login:  `Your HoneyMoon login code is: ${code}\nValid for 10 minutes. Do not share this code.`,
  };
  return sendSms(phone, messages[purpose] || messages.verify);
};

module.exports = { sendSms, sendOtpSms };
