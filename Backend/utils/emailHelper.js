const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || process.env.EMAIL_HOST,
  port: Number(process.env.SMTP_PORT || process.env.EMAIL_PORT || 587),
  secure: Number(process.env.SMTP_PORT || process.env.EMAIL_PORT || 587) === 465,
  auth: {
    user: process.env.SMTP_USER || process.env.EMAIL_USER,
    pass: process.env.SMTP_PASS || process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

transporter.verify((err) => {
  if (err) {
    console.error('SMTP verification failed:', err);
    throw err;
  }
  console.log('SMTP Server Ready');
});

const formatMoney = (amount) => {
  const numericAmount = Number(amount || 0);
  return `₦${numericAmount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const buildDashboardLink = () => {
  const baseUrl = (process.env.FRONTEND_URL || 'https://pro-tech-one.vercel.app').replace(/\/+$/, '');
  return `${baseUrl}/tenant/dashboard`;
};

const sendRentReminderEmail = async (tenantEmail, tenantName, amount, dueDate, propertyName) => {
  if (!tenantEmail) {
    throw new Error('Tenant email is required to send reminder');
  }

  const subject = `Rent Reminder for ${propertyName || 'your property'}`;
  const html = `
    <div style="font-family: Arial, sans-serif; background-color: #f4f7fb; padding: 32px 16px; margin: 0;">
      <div style="max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0;">
        <div style="background: linear-gradient(135deg, #0f172a 0%, #1d4ed8 100%); padding: 28px 32px; color: #ffffff;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 700;">ProTech</h1>
          <p style="margin: 8px 0 0; font-size: 13px; letter-spacing: 0.08em; text-transform: uppercase; opacity: 0.85;">
            Rent Reminder
          </p>
        </div>

        <div style="padding: 32px; color: #0f172a;">
          <p style="margin: 0 0 16px; font-size: 16px;">Hello <strong>${tenantName || 'Tenant'}</strong>,</p>
          <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.7; color: #334155;">
            This is a reminder that your rent payment for <strong>${propertyName || 'your property'}</strong> is due soon.
          </p>

          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #475569; font-size: 13px;">Property</td>
                <td style="padding: 8px 0; text-align: right; color: #0f172a; font-size: 14px; font-weight: 700;">${propertyName || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #475569; font-size: 13px;">Amount Due</td>
                <td style="padding: 8px 0; text-align: right; color: #b91c1c; font-size: 18px; font-weight: 800;">${formatMoney(amount)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #475569; font-size: 13px;">Due Date</td>
                <td style="padding: 8px 0; text-align: right; color: #0f172a; font-size: 14px; font-weight: 700;">${dueDate || 'Not specified'}</td>
              </tr>
            </table>
          </div>

          <div style="text-align: center; margin: 20px 0 28px;">
            <a href="${buildDashboardLink()}" style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-size: 15px; font-weight: 700;">
              Go to Dashboard
            </a>
          </div>

          <p style="margin: 0; font-size: 14px; line-height: 1.7; color: #475569;">
            Please ensure your payment is made on time to avoid disruption to your tenancy. If you have already made this payment, please ignore this reminder.
          </p>
        </div>

        <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 32px; text-align: center; color: #64748b; font-size: 12px; line-height: 1.6;">
          ProTech • Automated Rent Tracking System<br />
          Ogbomoso, Oyo State, Nigeria
        </div>
      </div>
    </div>
  `;

  const text = `Hello ${tenantName || 'Tenant'},\n\nThis is a reminder that your rent for ${propertyName || 'your property'} is due.\nAmount Due: ${formatMoney(amount)}\nDue Date: ${dueDate || 'Not specified'}\n\nPlease visit your ProTech dashboard: ${buildDashboardLink()}`;

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: tenantEmail,
      subject,
      html,
      text,
    });

    return { success: true };
  } catch (error) {
    console.error('SMTP Error: ', error);
    throw error;
  }
};

const sendAnnouncementEmail = async (tenantEmail, subject, message) => {
  if (!tenantEmail) {
    throw new Error('Tenant email is required to send announcement');
  }

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 24px; color: #0f172a;">
      <h2 style="color: #1d4ed8;">${subject}</h2>
      <div style="white-space: pre-wrap; line-height: 1.6; color: #334155;">${message}</div>
      <p style="margin-top: 24px; color: #64748b; font-size: 12px;">ProTech Automated Rent Tracking System</p>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: tenantEmail,
    subject,
    html,
    text: message,
  });

  return { success: true };
};

module.exports = {
  transporter,
  sendRentReminderEmail,
  sendAnnouncementEmail,
};
