const axios = require('axios');

const META_API_VERSION = process.env.META_WHATSAPP_API_VERSION || 'v23.0';

const formatNigerianPhone = (phone) => {
  if (!phone) return null;

  const digits = String(phone).replace(/\D/g, '');
  if (digits.startsWith('234') && digits.length === 13) return digits;
  if (digits.startsWith('0') && digits.length === 11) {
    return `234${digits.slice(1)}`;
  }
  if (digits.length === 10) return `234${digits}`;
  return null;
};

const sendWhatsAppMessage = async (phone, body) => {
  const phoneNumberId = process.env.META_WHATSAPP_PHONE_ID;
  const accessToken = process.env.META_WHATSAPP_ACCESS_TOKEN;
  const recipient = formatNigerianPhone(phone);

  if (!phoneNumberId || !accessToken) {
    console.warn('[WHATSAPP] Meta Cloud API is not configured — skipping');
    return { skipped: true };
  }

  if (!recipient) {
    console.warn(`[WHATSAPP] Invalid Nigerian phone number: ${phone}`);
    return { skipped: true };
  }

  try {
    const response = await axios.post(
      `https://graph.facebook.com/${META_API_VERSION}/${phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: recipient,
        type: 'text',
        text: {
          preview_url: false,
          body: String(body),
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      },
    );

    console.log(`[WHATSAPP] Meta message sent to ${recipient}`);
    return response.data;
  } catch (error) {
    const details = error.response?.data?.error?.message || error.message;
    console.error(`[WHATSAPP] Meta delivery failed for ${recipient}: ${details}`);
    return { sent: false, error: details };
  }
};

module.exports = { formatNigerianPhone, sendWhatsAppMessage };