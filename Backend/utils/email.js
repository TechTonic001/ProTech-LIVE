// utils/email.js
const nodemailer = require('nodemailer');

const SMTP_HOST = process.env.SMTP_HOST || process.env.EMAIL_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT || process.env.EMAIL_PORT || 587);
const SMTP_USER = process.env.SMTP_USER || process.env.EMAIL_USER;
const SMTP_PASS = process.env.SMTP_PASS || process.env.EMAIL_PASS;

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
  pool: true,
  maxConnections: 3,
  maxMessages: 100,
  tls: {
    rejectUnauthorized: false,
  },
});

transporter.verify((err) => {
  if (err) {
    console.error('SMTP Verification Warning:', err.message || err);
  } else {
    console.log('SMTP Server Ready');
  }
});

const emailFooter = 'ProTech Automated Rent System • Ogbomoso, Oyo State, Nigeria';
const frontendUrl = (process.env.FRONTEND_URL || 'https://pro-tech-one.vercel.app').replace(/\/+$/, '');
const sendFrom = process.env.EMAIL_FROM || (SMTP_USER ? `"ProTech" <${SMTP_USER}>` : '"ProTech" <noreply@protech.com>');
const buildFrontEndLink = (path = '') => `${frontendUrl}/${String(path).replace(/^\/+/, '')}`;

const logEmailAttempt = (label, toEmail, subject) => {
  console.log(`[EMAIL] ${label}`, { toEmail, subject, from: sendFrom });
};

const sendOTPEmail = async (toEmail, otpCode) => {
  const htmlContent = `
    <html>
      <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
        <div style="max-width: 600px; background-color: white; margin: 0 auto; padding: 30px; border-radius: 8px;">
          <h2 style="color: #333; text-align: center;">ProTech Password Reset</h2>
          <p style="color: #666; text-align: center;">Your password reset code is:</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 48px; font-weight: bold; letter-spacing: 8px; color: #1a7f7e;">${otpCode}</span>
          </div>
          <p style="color: #d32f2f; text-align: center; font-weight: bold;">This code expires in 10 minutes</p>
          <p style="color: #666; font-size: 14px;">If you did not request a password reset, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">${emailFooter}</p>
        </div>
      </body>
    </html>
  `;

  const textContent = `Your ProTech password reset code is: ${otpCode}\n\nThis code expires in 10 minutes.\n\n${emailFooter}`;

  try {
    logEmailAttempt('OTPEmail', toEmail, 'ProTech • Your Password Reset Code');
    await transporter.sendMail({
      from: sendFrom,
      to: toEmail,
      subject: 'ProTech • Your Password Reset Code',
      html: htmlContent,
      text: textContent,
    });
    return { success: true };
  } catch (error) {
    console.error('SMTP Error: ', error);
    return { success: false, error: error.message };
  }
};

const sendPasswordChangedEmail = async (toEmail, fullName) => {
  const htmlContent = `
    <html>
      <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
        <div style="max-width: 600px; background-color: white; margin: 0 auto; padding: 30px; border-radius: 8px;">
          <h2 style="color: #333; text-align: center;">Password Changed Successfully</h2>
          <p style="color: #666;">Hello ${fullName},</p>
          <p style="color: #666;">Your ProTech account password has been changed successfully.</p>
          <p style="color: #d32f2f; font-weight: bold;">If you did not make this change, please contact our support team immediately.</p>
          <p style="color: #666;">Your account security is important to us.</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">${emailFooter}</p>
        </div>
      </body>
    </html>
  `;

  const textContent = `Hello ${fullName},\n\nYour ProTech account password has been changed successfully.\n\nIf you did not make this change, please contact support immediately.\n\n${emailFooter}`;

  try {
    logEmailAttempt('PasswordChangedEmail', toEmail, 'ProTech • Password Changed Successfully');
    await transporter.sendMail({
      from: sendFrom,
      to: toEmail,
      subject: 'ProTech • Password Changed Successfully',
      html: htmlContent,
      text: textContent,
    });
    return { success: true };
  } catch (error) {
    console.error('SMTP Error: ', error);
    return { success: false, error: error.message };
  }
};

const sendApprovalEmail = async (toEmail, fullName, approved, propertyName) => {
  const subject = approved
    ? 'ProTech • Your Account Has Been Approved'
    : 'ProTech • Your Account Request Was Not Approved';

  const statusMessage = approved
    ? `Your account has been approved by the landlord of ${propertyName}. You can now log in and view your lease details.`
    : `Unfortunately, your account request for ${propertyName} has not been approved at this time. Please contact the landlord for more information.`;

  const actionButton = approved
    ? `<a href="${buildFrontEndLink('login')}" style="background-color: #1a7f7e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin-top: 15px;">Log In Now</a>`
    : '';

  const htmlContent = `
    <html>
      <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
        <div style="max-width: 600px; background-color: white; margin: 0 auto; padding: 30px; border-radius: 8px;">
          <h2 style="color: #333; text-align: center;">${approved ? 'Account Approved!' : 'Account Request Status'}</h2>
          <p style="color: #666;">Hello ${fullName},</p>
          <p style="color: #666;">${statusMessage}</p>
          <div style="text-align: center;">
            ${actionButton}
          </div>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">${emailFooter}</p>
        </div>
      </body>
    </html>
  `;

  const textContent = `Hello ${fullName},\n\n${statusMessage}\n\n${emailFooter}`;

  try {
    logEmailAttempt('ApprovalEmail', toEmail, subject);
    await transporter.sendMail({
      from: sendFrom,
      to: toEmail,
      subject: subject,
      html: htmlContent,
      text: textContent,
    });
    return { success: true };
  } catch (error) {
    console.error('SMTP Error: ', error);
    return { success: false, error: error.message };
  }
};

// Legacy simple rent reminder removed in favor of the modern templates used by
// the notification engine. Notification engine calls `sendRentReminderEmail`
// and `sendLandlordRentAlert` which are defined further below and wrap the
// tenant/landlord-specific implementations.

const sendPaymentConfirmationEmail = async (
  toEmail,
  tenantName,
  amount,
  receiptNumber,
  roomNumber,
  propertyName,
  paymentDate
) => {
  const htmlContent = `
    <html>
      <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
        <div style="max-width: 600px; background-color: white; margin: 0 auto; padding: 30px; border-radius: 8px;">
          <h2 style="color: #1a7f7e; text-align: center;">Payment Confirmed</h2>
          <p style="color: #666;">Hello ${tenantName},</p>
          <p style="color: #666;">Your rent payment has been received and confirmed.</p>
          <div style="background-color: #f0f8f7; padding: 20px; border-radius: 4px; margin: 20px 0;">
            <p style="color: #333; margin: 10px 0;"><strong>Receipt Number:</strong> ${receiptNumber}</p>
            <p style="color: #333; margin: 10px 0;"><strong>Amount Paid:</strong> <span style="color: #1a7f7e; font-weight: bold;">₦${parseFloat(amount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span></p>
            <p style="color: #333; margin: 10px 0;"><strong>Property:</strong> ${propertyName}</p>
            <p style="color: #333; margin: 10px 0;"><strong>Room:</strong> ${roomNumber}</p>
            <p style="color: #333; margin: 10px 0;"><strong>Payment Date:</strong> ${paymentDate}</p>
          </div>
          <p style="color: #666; font-size: 14px;">Keep this receipt for your records.</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">${emailFooter}</p>
        </div>
      </body>
    </html>
  `;

  const textContent = `Hello ${tenantName},\n\nPayment Confirmed\n\nReceipt Number: ${receiptNumber}\nAmount Paid: ₦${parseFloat(amount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}\nProperty: ${propertyName}\nRoom: ${roomNumber}\nPayment Date: ${paymentDate}\n\nKeep this receipt for your records.\n\n${emailFooter}`;

  try {
    logEmailAttempt('PaymentConfirmationEmail', toEmail, `Payment Confirmed Receipt ${receiptNumber}`);
    await transporter.sendMail({
      from: sendFrom,
      to: toEmail,
      subject: `Payment Confirmed Receipt ${receiptNumber}`,
      html: htmlContent,
      text: textContent,
    });
    return { success: true };
  } catch (error) {
    console.error('[ERROR] Payment confirmation email error:', error.message);
    return { success: false, error: error.message };
  }
};

const sendAnnouncementEmail = async (toEmail, tenantName, title, messageBody) => {
  const htmlContent = `
    <html>
      <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
        <div style="max-width: 600px; background-color: white; margin: 0 auto; padding: 30px; border-radius: 8px;">
          <h2 style="color: #1a7f7e; text-align: center;">New Announcement</h2>
          <p style="color: #666;">Hello ${tenantName},</p>
          <p style="color: #333; font-size: 18px; font-weight: bold; margin: 20px 0;">${title}</p>
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 4px; margin: 20px 0;">
            <p style="color: #666; line-height: 1.6;">${messageBody.replace(/\n/g, '<br>')}</p>
          </div>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">${emailFooter}</p>
        </div>
      </body>
    </html>
  `;

  const textContent = `Hello ${tenantName},\n\nNew Announcement\n\n${title}\n\n${messageBody}\n\n${emailFooter}`;

  try {
    logEmailAttempt('AnnouncementEmail', toEmail, `ProTech Announcement: ${title}`);
    await transporter.sendMail({
      from: sendFrom,
      to: toEmail,
      subject: `ProTech Announcement: ${title}`,
      html: htmlContent,
      text: textContent,
    });
    return { success: true };
  } catch (error) {
    console.error('[ERROR] Announcement email error:', error.message);
    return { success: false, error: error.message };
  }
};

const sendLandlordWelcomeEmail = async (toEmail, fullName, hostelName, landlordCode) => {
  const hostelLine = hostelName
    ? `<p>Your landlord account for <strong>${hostelName}</strong> has been created successfully.</p>`
    : `<p>Your ProTech landlord account has been created successfully.</p>`;

  const hostelTextLine = hostelName
    ? `Your landlord account and hostel "${hostelName}" have been set up successfully.`
    : `Your ProTech landlord account has been set up successfully.`;

  const htmlContent = `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto">
      <div style="background:#0F2A5E;padding:24px;text-align:center;border-radius:12px 12px 0 0">
          <img src="https://pro-tech-one.vercel.app/logo192.png" alt="ProTech" width="60" style="display:block;margin:0 auto 12px" />
        </div>
      <div style="background:#fff;padding:28px;border-radius:0 0 12px 12px">
        <p>Dear ${fullName},</p>
        ${hostelLine}

        <div style="background:#FFFBEB;border:2px solid #F59E0B;
                    border-radius:12px;padding:20px;text-align:center;
                    margin:20px 0">
          <p style="margin:0;font-size:12px;color:#92400E;
                    text-transform:uppercase;letter-spacing:1px;
                    font-weight:bold">Your Unique Landlord Code</p>
          <p style="margin:8px 0;font-size:32px;font-weight:900;
                    color:#0F2A5E;letter-spacing:2px;
                    font-family:monospace">${landlordCode}</p>
          <p style="margin:0;font-size:12px;color:#92400E">
            Share this code with your tenants — NOT your username
          </p>
        </div>

        <p style="font-size:14px;color:#475569">
          <strong>Important:</strong> Your tenants will need this
          exact code to register and request access to your hostel.
          Each landlord on ProTech has a different code, so make
          sure you share <strong>${landlordCode}</strong> and not
          anyone else's code.
        </p>

        <a href="${buildFrontEndLink('login')}"
           style="display:inline-block;background:#1565C0;color:#fff;
                  padding:12px 28px;border-radius:8px;
                  text-decoration:none;font-weight:bold;margin-top:16px">
          Go to My Dashboard
        </a>
      </div>
    </div>
  `;

  const textContent = `Hello ${fullName},\n\n${hostelTextLine}\n\nYour unique landlord code is: ${landlordCode}\n\nShare this code with your tenants so they can register.\n\n${emailFooter}`;

  try {
    logEmailAttempt('LandlordWelcomeEmail', toEmail, `Welcome to ProTech — Your Code is ${landlordCode}`);
    await transporter.sendMail({
      from: sendFrom,
      to: toEmail,
      subject: `Welcome to ProTech — Your Code is ${landlordCode}`,
      html: htmlContent,
      text: textContent,
    });
    return { success: true };
  } catch (error) {
    console.error('[ERROR] Landlord welcome email error:', error.message);
    return { success: false, error: error.message };
  }
};

const sendTenantWelcomeEmail = async (toEmail, tenantName, landlordName) => {
  const htmlContent = `
    <html>
      <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
        <div style="max-width: 600px; background-color: white; margin: 0 auto; padding: 30px; border-radius: 8px;">
          <h2 style="color: #1a7f7e; text-align: center;">Welcome to ProTech, ${tenantName}!</h2>
          <p style="color: #666;">Your tenant account has been registered successfully.</p>
          <p style="color: #666;">Your approval request has been forwarded to your landlord <strong>@${landlordName}</strong>. Once approved, you will be assigned to a room and can start paying rent online securely.</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">${emailFooter}</p>
        </div>
      </body>
    </html>
  `;

  const textContent = `Hello ${tenantName},\n\nWelcome to ProTech! Your account has been created and is currently awaiting approval from landlord @${landlordName}.\n\n${emailFooter}`;

  try {
    logEmailAttempt('TenantWelcomeEmail', toEmail, 'Welcome to ProTech • Account Awaiting Approval');
    await transporter.sendMail({
      from: sendFrom,
      to: toEmail,
      subject: 'Welcome to ProTech • Account Awaiting Approval',
      html: htmlContent,
      text: textContent,
    });
    return { success: true };
  } catch (error) {
    console.error('[ERROR] Tenant welcome email error:', error.message);
    return { success: false, error: error.message };
  }
};

const sendLandlordTenantRegistrationNotificationEmail = async (toEmail, landlordName, tenantName) => {
  const htmlContent = `
    <html>
      <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
        <div style="max-width: 600px; background-color: white; margin: 0 auto; padding: 30px; border-radius: 8px;">
          <h2 style="color: #1a7f7e; text-align: center;">New Tenant Awaiting Approval</h2>
          <p style="color: #666;">Hello ${landlordName},</p>
          <p style="color: #666;">A new tenant, <strong>${tenantName}</strong>, has registered on ProTech under your landlord space and is awaiting your approval.</p>
          <div style="text-align: center; margin: 25px 0;">
            <a href="${buildFrontEndLink('login')}" style="background-color: #1a7f7e; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block;">Approve Requests</a>
          </div>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">${emailFooter}</p>
        </div>
      </body>
    </html>
  `;

  const textContent = `Hello ${landlordName},\n\nNew Tenant Registration: ${tenantName} has registered under your space and is awaiting approval.\n\n${emailFooter}`;

  try {
    logEmailAttempt('LandlordTenantRegistrationNotificationEmail', toEmail, 'ProTech Alert • New Tenant Requesting Approval');
    await transporter.sendMail({
      from: sendFrom,
      to: toEmail,
      subject: 'ProTech Alert • New Tenant Requesting Approval',
      html: htmlContent,
      text: textContent,
    });
    return { success: true };
  } catch (error) {
    console.error('[ERROR] Landlord tenant registration notification email error:', error.message);
    return { success: false, error: error.message };
  }
};

// ── Tenant rent reminder email (Issue 1B — cron notification engine) ──────────
// Called by runNotificationEngine for each lease that needs a notification.
const sendTenantRentReminderEmail = async ({
  toEmail, tenantName, hostelName, roomNumber,
  rentAmount, amountPaid, dueDate, daysUntilDue,
}) => {
  const balance = parseFloat(rentAmount) - parseFloat(amountPaid || 0);
  const balanceStr = `₦${balance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
  const rentStr = `₦${parseFloat(rentAmount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;

  let subjectLine, statusBadge, headlineText, statusColor;

  if (daysUntilDue > 0) {
    subjectLine = `Rent Reminder: ${daysUntilDue} Day${daysUntilDue === 1 ? '' : 's'} Until Your Rent is Due`;
    statusBadge = `${daysUntilDue} DAY${daysUntilDue === 1 ? '' : 'S'} REMAINING`;
    headlineText = `Your rent is due in <strong>${daysUntilDue} day${daysUntilDue === 1 ? '' : 's'}</strong>.`;
    statusColor = '#1565C0';
  } else if (daysUntilDue === 0) {
    subjectLine = 'Action Required: Your Rent is Due Today';
    statusBadge = 'DUE TODAY';
    headlineText = 'Your rent is <strong>due today</strong>. Please make your payment now to avoid late fees.';
    statusColor = '#e65100';
  } else {
    const overdueDays = Math.abs(daysUntilDue);
    subjectLine = `OVERDUE: Your Rent is ${overdueDays} Day${overdueDays === 1 ? '' : 's'} Past Due`;
    statusBadge = `${overdueDays} DAY${overdueDays === 1 ? '' : 'S'} OVERDUE`;
    headlineText = `Your rent is <strong>${overdueDays} day${overdueDays === 1 ? '' : 's'} overdue</strong>. Please pay immediately.`;
    statusColor = '#c62828';
  }

  const htmlContent = `
    <html>
      <body style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f0f4f8; padding: 24px; margin: 0;">
        <div style="max-width: 600px; margin: 0 auto;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #1565C0 0%, #0D47A1 100%); border-radius: 16px 16px 0 0; padding: 32px; text-align: center;">
            <h1 style="color: #fff; font-size: 22px; margin: 0; font-weight: 800; letter-spacing: -0.5px;">ProTech Rent System</h1>
            <p style="color: rgba(255,255,255,0.75); font-size: 13px; margin: 6px 0 0;">Automated Rent Tracking & Notification</p>
          </div>

          <!-- Status Badge -->
          <div style="background: ${statusColor}; text-align: center; padding: 14px;">
            <span style="color: #fff; font-size: 13px; font-weight: 900; letter-spacing: 2px;">${statusBadge}</span>
          </div>

          <!-- Body -->
          <div style="background: #fff; border-radius: 0 0 16px 16px; padding: 32px; border: 1px solid #e2e8f0; border-top: none;">
            <p style="color: #1e293b; font-size: 16px; font-weight: 700; margin: 0 0 8px;">Hello ${tenantName},</p>
            <p style="color: #475569; font-size: 14px; margin: 0 0 24px; line-height: 1.6;">${headlineText}</p>

            <!-- Details Card -->
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
              <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <tr>
                  <td style="color: #94a3b8; padding: 6px 0; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Hostel</td>
                  <td style="color: #1e293b; padding: 6px 0; font-weight: 700; text-align: right;">${hostelName || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="color: #94a3b8; padding: 6px 0; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Room</td>
                  <td style="color: #1e293b; padding: 6px 0; font-weight: 700; text-align: right;">Room ${roomNumber}</td>
                </tr>
                <tr>
                  <td style="color: #94a3b8; padding: 6px 0; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Yearly Rent</td>
                  <td style="color: #1e293b; padding: 6px 0; font-weight: 700; text-align: right;">${rentStr}</td>
                </tr>
                <tr style="border-top: 1px solid #e2e8f0;">
                  <td style="color: #94a3b8; padding: 10px 0 6px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Balance Due</td>
                  <td style="color: ${statusColor}; padding: 10px 0 6px; font-weight: 900; text-align: right; font-size: 16px;">${balanceStr}</td>
                </tr>
                <tr>
                  <td style="color: #94a3b8; padding: 6px 0; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Due Date</td>
                  <td style="color: #1e293b; padding: 6px 0; font-weight: 700; text-align: right;">${dueDate}</td>
                </tr>
              </table>
            </div>

            <!-- CTA -->
            <div style="text-align: center; margin: 28px 0;">
              <a href="${buildFrontEndLink('tenant/login')}"
                 style="background-color: #1565C0; color: #fff; padding: 14px 36px; text-decoration: none;
                        border-radius: 10px; font-weight: 800; font-size: 14px; display: inline-block;
                        letter-spacing: 0.5px; box-shadow: 0 4px 14px rgba(21,101,192,0.4);">
                Pay Rent Now →
              </a>
            </div>

            <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 24px;">
              This is an automated reminder from ProTech. If you have already paid, please ignore this message.
            </p>
          </div>

          <!-- Footer -->
          <p style="color: #94a3b8; font-size: 11px; text-align: center; margin-top: 20px;">${emailFooter}</p>
        </div>
      </body>
    </html>
  `;

  const textContent = `${subjectLine}\n\nHello ${tenantName},\n\nHostel: ${hostelName}\nRoom: ${roomNumber}\nBalance Due: ${balanceStr}\nDue Date: ${dueDate}\n\nPay at: ${buildFrontEndLink('tenant/login')}\n\n${emailFooter}`;

  try {
    logEmailAttempt('TenantRentReminderEmail', toEmail, subjectLine);
    await transporter.sendMail({
      from: sendFrom,
      to: toEmail,
      subject: subjectLine,
      html: htmlContent,
      text: textContent,
    });
    return { success: true };
  } catch (error) {
    console.error('[ERROR] Tenant rent reminder email error:', error.message);
    return { success: false, error: error.message };
  }
};

// ── Landlord rent alert email (Issue 1B — cron notification engine) ───────────
// Brief informational alert to the landlord when a tenant's rent is due/overdue.
const sendLandlordRentAlertEmail = async ({
  toEmail, landlordName, tenantName, tenantUsername,
  roomNumber, hostelName, rentAmount, amountPaid,
  dueDate, daysUntilDue,
}) => {
  const balance = parseFloat(rentAmount) - parseFloat(amountPaid || 0);
  const balanceStr = `₦${balance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;

  const dayLabel = daysUntilDue >= 0
    ? `${daysUntilDue} day${daysUntilDue === 1 ? '' : 's'} until due`
    : `${Math.abs(daysUntilDue)} day${Math.abs(daysUntilDue) === 1 ? '' : 's'} OVERDUE`;

  const subjectLine = `Tenant Rent Alert: ${tenantName} — ${dayLabel}`;
  const headerColor = daysUntilDue < 0 ? '#c62828' : daysUntilDue === 0 ? '#e65100' : '#1565C0';

  const htmlContent = `
    <html>
      <body style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f0f4f8; padding: 24px; margin: 0;">
        <div style="max-width: 560px; margin: 0 auto;">
          <div style="background: ${headerColor}; border-radius: 12px 12px 0 0; padding: 24px 28px;">
            <h1 style="color: #fff; font-size: 18px; margin: 0; font-weight: 800;">Rent Status Alert</h1>
            <p style="color: rgba(255,255,255,0.8); font-size: 12px; margin: 4px 0 0;">ProTech Landlord Notification</p>
          </div>
          <div style="background: #fff; border-radius: 0 0 12px 12px; padding: 28px; border: 1px solid #e2e8f0; border-top: none;">
            <p style="color: #1e293b; font-size: 15px; font-weight: 700; margin: 0 0 6px;">Hello ${landlordName},</p>
            <p style="color: #475569; font-size: 13px; margin: 0 0 20px;">This is an automated alert about one of your tenants' rent status.</p>

            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px; margin-bottom: 20px;">
              <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
                <tr>
                  <td style="color: #94a3b8; padding: 5px 0; font-weight: 600; text-transform: uppercase;">Tenant</td>
                  <td style="color: #1e293b; font-weight: 700; text-align: right;">${tenantName}</td>
                </tr>
                <tr>
                  <td style="color: #94a3b8; padding: 5px 0; font-weight: 600; text-transform: uppercase;">Username</td>
                  <td style="color: #475569; font-weight: 600; text-align: right;">@${tenantUsername}</td>
                </tr>
                <tr>
                  <td style="color: #94a3b8; padding: 5px 0; font-weight: 600; text-transform: uppercase;">Room</td>
                  <td style="color: #1e293b; font-weight: 700; text-align: right;">${hostelName} — Room ${roomNumber}</td>
                </tr>
                <tr style="border-top: 1px solid #e2e8f0;">
                  <td style="color: #94a3b8; padding: 8px 0 5px; font-weight: 600; text-transform: uppercase;">Balance Due</td>
                  <td style="color: ${headerColor}; font-weight: 900; font-size: 15px; text-align: right;">${balanceStr}</td>
                </tr>
                <tr>
                  <td style="color: #94a3b8; padding: 5px 0; font-weight: 600; text-transform: uppercase;">Due Date</td>
                  <td style="color: #1e293b; font-weight: 700; text-align: right;">${dueDate}</td>
                </tr>
                <tr>
                  <td style="color: #94a3b8; padding: 5px 0; font-weight: 600; text-transform: uppercase;">Status</td>
                  <td style="color: ${headerColor}; font-weight: 800; text-align: right; text-transform: uppercase;">${dayLabel}</td>
                </tr>
              </table>
            </div>

            <p style="color: #94a3b8; font-size: 11px; text-align: center;">
              A reminder has also been sent to the tenant. No action required on your part unless rent remains unpaid.
            </p>
          </div>
          <p style="color: #94a3b8; font-size: 11px; text-align: center; margin-top: 16px;">${emailFooter}</p>
        </div>
      </body>
    </html>
  `;

  const textContent = `${subjectLine}\n\nHello ${landlordName},\n\nTenant: ${tenantName} (@${tenantUsername})\nRoom: ${hostelName} - Room ${roomNumber}\nBalance Due: ${balanceStr}\nDue Date: ${dueDate}\nStatus: ${dayLabel}\n\n${emailFooter}`;

  try {
    logEmailAttempt('LandlordRentAlertEmail', toEmail, subjectLine);
    await transporter.sendMail({
      from: sendFrom,
      to: toEmail,
      subject: subjectLine,
      html: htmlContent,
      text: textContent,
    });
    return { success: true };
  } catch (error) {
    console.error('[ERROR] Landlord rent alert email error:', error.message);
    return { success: false, error: error.message };
  }
};

// ── PAYMENT RECEIPT — sent to tenant after webhook confirms success ─────────
const sendPaymentReceiptEmail = async (toEmail, {
  tenant_name,
  hostel_name,
  room_number,
  property_name,
  receipt_number,
  amount_paid,
  service_fee,
  total_charged,
  end_date,
  remaining,
  paystack_ref,
}) => {
  const subjectLine = `🧾 Payment Receipt — ${receipt_number}`;
  const paidFmt     = Number(amount_paid || 0).toLocaleString('en-NG', { style: 'currency', currency: 'NGN' });
  const feeFmt      = Number(service_fee  || 0).toLocaleString('en-NG', { style: 'currency', currency: 'NGN' });
  const totalFmt    = Number(total_charged|| 0).toLocaleString('en-NG', { style: 'currency', currency: 'NGN' });
  const remainFmt   = remaining != null
    ? Number(remaining).toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })
    : null;

  const htmlContent = `
    <html><body style="font-family:Arial,sans-serif;background:#f5f5f5;padding:20px;">
      <div style="max-width:600px;margin:0 auto;background:white;border-radius:12px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#1a7f7e,#0d5c5b);padding:32px;text-align:center;">
          <h1 style="color:white;margin:0;font-size:22px;">✅ Payment Confirmed</h1>
          <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">Receipt: <strong>${receipt_number}</strong></p>
        </div>
        <div style="padding:32px;">
          <p style="color:#555;font-size:15px;">Hi <strong>${tenant_name}</strong>,</p>
          <p style="color:#555;font-size:14px;">Your rent payment has been received and confirmed. Here is your official receipt.</p>

          <table style="width:100%;border-collapse:collapse;margin:24px 0;font-size:14px;">
            <tr style="background:#f8fafc;"><td style="padding:12px 16px;color:#888;font-weight:bold;">Property</td><td style="padding:12px 16px;color:#222;font-weight:bold;">${hostel_name || property_name}</td></tr>
            <tr><td style="padding:12px 16px;color:#888;font-weight:bold;">Room</td><td style="padding:12px 16px;color:#222;font-weight:bold;">${room_number}</td></tr>
            <tr style="background:#f8fafc;"><td style="padding:12px 16px;color:#888;font-weight:bold;">Rent Paid</td><td style="padding:12px 16px;color:#222;font-weight:bold;">${paidFmt}</td></tr>
            <tr><td style="padding:12px 16px;color:#888;font-weight:bold;">Service Fee</td><td style="padding:12px 16px;color:#222;font-weight:bold;">${feeFmt}</td></tr>
            <tr style="background:#1a7f7e;"><td style="padding:12px 16px;color:white;font-weight:bold;font-size:15px;">Total Charged</td><td style="padding:12px 16px;color:white;font-weight:bold;font-size:15px;">${totalFmt}</td></tr>
            ${remainFmt ? `<tr style="background:#f0fdf4;"><td style="padding:12px 16px;color:#166534;font-weight:bold;">Remaining Balance</td><td style="padding:12px 16px;color:#166534;font-weight:bold;">${remainFmt}</td></tr>` : ''}
            ${end_date ? `<tr><td style="padding:12px 16px;color:#888;font-weight:bold;">Due Date</td><td style="padding:12px 16px;color:#222;">${end_date}</td></tr>` : ''}
            <tr style="background:#f8fafc;"><td style="padding:12px 16px;color:#888;font-weight:bold;">Reference</td><td style="padding:12px 16px;color:#555;font-size:12px;font-family:monospace;">${paystack_ref}</td></tr>
          </table>

          <p style="color:#555;font-size:13px;">Keep this email as proof of payment. Contact your landlord or ProTech support if you have any questions.</p>
        </div>
        <div style="background:#f8fafc;padding:16px;text-align:center;">
          <p style="color:#999;font-size:12px;margin:0;">${emailFooter}</p>
        </div>
      </div>
    </body></html>
  `;

  const textContent = `Payment Receipt: ${receipt_number}\nRent Paid: ${paidFmt}\nService Fee: ${feeFmt}\nTotal: ${totalFmt}\nRef: ${paystack_ref}\n\n${emailFooter}`;

  try {
    logEmailAttempt('PaymentReceiptEmail', toEmail, subjectLine);
    await transporter.sendMail({ from: sendFrom, to: toEmail, subject: subjectLine, html: htmlContent, text: textContent });
    return { success: true };
  } catch (error) {
    console.error('[ERROR] Payment receipt email error:', error.message);
    return { success: false, error: error.message };
  }
};

// Send payment receipt to tenant and CC landlord (or other recipient)
const sendPaymentReceiptToBoth = async (toEmail, ccEmail, payload = {}) => {
  const subjectLine = `🧾 Payment Receipt — ${payload.receipt_number || payload.paystack_ref || 'Receipt'}`;
  const paidFmt     = Number(payload.amount_paid || 0).toLocaleString('en-NG', { style: 'currency', currency: 'NGN' });
  const feeFmt      = Number(payload.service_fee  || 0).toLocaleString('en-NG', { style: 'currency', currency: 'NGN' });
  const totalFmt    = Number(payload.total_charged|| 0).toLocaleString('en-NG', { style: 'currency', currency: 'NGN' });
  const remainFmt   = payload.remaining != null
    ? Number(payload.remaining).toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })
    : null;

  const htmlContent = `
    <html><body style="font-family:Arial,sans-serif;background:#f5f5f5;padding:20px;">
      <div style="max-width:600px;margin:0 auto;background:white;border-radius:12px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#1a7f7e,#0d5c5b);padding:32px;text-align:center;">
          <h1 style="color:white;margin:0;font-size:22px;">✅ Payment Confirmed</h1>
          <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">Receipt: <strong>${payload.receipt_number || payload.paystack_ref || ''}</strong></p>
        </div>
        <div style="padding:32px;">
          <p style="color:#555;font-size:15px;">Hi <strong>${payload.tenant_name || ''}</strong>,</p>
          <p style="color:#555;font-size:14px;">Your rent payment has been received and confirmed. Here is your official receipt.</p>

          <table style="width:100%;border-collapse:collapse;margin:24px 0;font-size:14px;">
            <tr style="background:#f8fafc;"><td style="padding:12px 16px;color:#888;font-weight:bold;">Property</td><td style="padding:12px 16px;color:#222;font-weight:bold;">${payload.hostel_name || payload.property_name || ''}</td></tr>
            <tr><td style="padding:12px 16px;color:#888;font-weight:bold;">Room</td><td style="padding:12px 16px;color:#222;font-weight:bold;">${payload.room_number || ''}</td></tr>
            <tr style="background:#f8fafc;"><td style="padding:12px 16px;color:#888;font-weight:bold;">Rent Paid</td><td style="padding:12px 16px;color:#222;font-weight:bold;">${paidFmt}</td></tr>
            <tr><td style="padding:12px 16px;color:#888;font-weight:bold;">Service Fee</td><td style="padding:12px 16px;color:#222;font-weight:bold;">${feeFmt}</td></tr>
            <tr style="background:#1a7f7e;"><td style="padding:12px 16px;color:white;font-weight:bold;font-size:15px;">Total Charged</td><td style="padding:12px 16px;color:white;font-weight:bold;font-size:15px;">${totalFmt}</td></tr>
            ${remainFmt ? `<tr style="background:#f0fdf4;"><td style="padding:12px 16px;color:#166534;font-weight:bold;">Remaining Balance</td><td style="padding:12px 16px;color:#166534;font-weight:bold;">${remainFmt}</td></tr>` : ''}
            ${payload.end_date ? `<tr><td style="padding:12px 16px;color:#888;font-weight:bold;">Due Date</td><td style="padding:12px 16px;color:#222;">${payload.end_date}</td></tr>` : ''}
            <tr style="background:#f8fafc;"><td style="padding:12px 16px;color:#888;font-weight:bold;">Reference</td><td style="padding:12px 16px;color:#555;font-size:12px;font-family:monospace;">${payload.paystack_ref || ''}</td></tr>
          </table>

          <p style="color:#555;font-size:13px;">Keep this email as proof of payment. Contact your landlord or ProTech support if you have any questions.</p>
        </div>
        <div style="background:#f8fafc;padding:16px;text-align:center;">
          <p style="color:#999;font-size:12px;margin:0;">${emailFooter}</p>
        </div>
      </div>
    </body></html>
  `;

  const textContent = `Payment Receipt: ${payload.receipt_number || payload.paystack_ref}\nRent Paid: ${paidFmt}\nService Fee: ${feeFmt}\nTotal: ${totalFmt}\nRef: ${payload.paystack_ref || ''}\n\n${emailFooter}`;

  try {
    logEmailAttempt('PaymentReceiptEmailBoth', `${toEmail}${ccEmail ? `, cc:${ccEmail}` : ''}`, subjectLine);
    await transporter.sendMail({ from: sendFrom, to: toEmail, cc: ccEmail || undefined, subject: subjectLine, html: htmlContent, text: textContent });
    return { success: true };
  } catch (error) {
    console.error('[ERROR] Payment receipt (both) email error:', error.message);
    return { success: false, error: error.message };
  }
};

// ── LANDLORD PAYMENT ALERT — sent when a tenant pays rent ────────────────────
const sendLandlordPaymentAlert = async (toEmail, {
  landlord_name,
  tenant_name,
  room_number,
  amount_paid,
  receipt_number,
  remaining,
}) => {
  const subjectLine = `💰 Rent Received from ${tenant_name}`;
  const paidFmt     = Number(amount_paid || 0).toLocaleString('en-NG', { style: 'currency', currency: 'NGN' });
  const remainFmt   = remaining != null
    ? Number(remaining).toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })
    : null;

  const htmlContent = `
    <html><body style="font-family:Arial,sans-serif;background:#f5f5f5;padding:20px;">
      <div style="max-width:600px;margin:0 auto;background:white;border-radius:12px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#1e40af,#1d4ed8);padding:32px;text-align:center;">
          <h1 style="color:white;margin:0;font-size:22px;">💰 Rent Received</h1>
        </div>
        <div style="padding:32px;">
          <p style="color:#555;font-size:15px;">Hi <strong>${landlord_name}</strong>,</p>
          <p style="color:#555;font-size:14px;"><strong>${tenant_name}</strong> (Room ${room_number}) has made a successful rent payment.</p>
          <table style="width:100%;border-collapse:collapse;margin:24px 0;font-size:14px;">
            <tr style="background:#eff6ff;"><td style="padding:12px 16px;color:#888;font-weight:bold;">Tenant</td><td style="padding:12px 16px;color:#222;font-weight:bold;">${tenant_name}</td></tr>
            <tr><td style="padding:12px 16px;color:#888;font-weight:bold;">Room</td><td style="padding:12px 16px;color:#222;font-weight:bold;">${room_number}</td></tr>
            <tr style="background:#1e40af;"><td style="padding:12px 16px;color:white;font-weight:bold;">Amount Paid</td><td style="padding:12px 16px;color:white;font-weight:bold;font-size:15px;">${paidFmt}</td></tr>
            ${remainFmt ? `<tr style="background:#fefce8;"><td style="padding:12px 16px;color:#854d0e;font-weight:bold;">Remaining</td><td style="padding:12px 16px;color:#854d0e;font-weight:bold;">${remainFmt}</td></tr>` : ''}
            <tr><td style="padding:12px 16px;color:#888;font-weight:bold;">Receipt #</td><td style="padding:12px 16px;color:#555;font-family:monospace;font-size:12px;">${receipt_number}</td></tr>
          </table>
          <p style="color:#555;font-size:13px;">Funds are being settled into your linked bank account within 24-48 hours via Paystack.</p>
        </div>
        <div style="background:#f8fafc;padding:16px;text-align:center;">
          <p style="color:#999;font-size:12px;margin:0;">${emailFooter}</p>
        </div>
      </div>
    </body></html>
  `;

  const textContent = `Rent received from ${tenant_name} (Room ${room_number})\nAmount: ${paidFmt}\nReceipt: ${receipt_number}\n\n${emailFooter}`;

  try {
    logEmailAttempt('LandlordPaymentAlert', toEmail, subjectLine);
    await transporter.sendMail({ from: sendFrom, to: toEmail, subject: subjectLine, html: htmlContent, text: textContent });
    return { success: true };
  } catch (error) {
    console.error('[ERROR] Landlord payment alert error:', error.message);
    return { success: false, error: error.message };
  }
};

const sendTenantApprovalEmail = async (
  tenantEmail,
  tenantName,
  opts = {}
) => {
  const {
    landlordName  = 'Your Landlord',
    propertyName  = 'the property',
    roomNumber    = '',
    hostelName    = '',
    loginLink     = (process.env.FRONTEND_URL || 'https://pro-tech-one.vercel.app') + '/tenant/login',
    leaseStartDate = '',
    leaseEndDate   = '',
    rentAmount     = '',
    paymentFrequency = 'monthly'
  } = opts

  const displayProperty = hostelName || propertyName

  const html = `
    <div style="font-family:Arial,sans-serif;
                max-width:560px;margin:0 auto;
                background:#F8FFFE">

      <!-- Header -->
      <div style="background:#0A3D2E;padding:28px 32px;
                  border-bottom:5px solid #D97706">
        <h1 style="color:#ffffff;margin:0;font-size:24px;
                   font-weight:900;letter-spacing:-0.5px">
          ProTech
        </h1>
        <p style="color:#D97706;margin:4px 0 0;
                  font-size:12px;font-weight:600;
                  letter-spacing:0.5px">
          PROPERTY MANAGEMENT PLATFORM
        </p>
      </div>

      <!-- Success banner -->
      <div style="background:#05966910;border-left:5px solid #059669;
                  padding:20px 32px;border-bottom:1px solid #BBF7D0">
        <p style="color:#059669;font-size:13px;font-weight:700;
                  margin:0 0 4px;letter-spacing:0.3px">
          ✅ ACCOUNT APPROVED
        </p>
        <h2 style="color:#0A3D2E;font-size:22px;font-weight:900;
                   margin:0">
          Welcome aboard, ${tenantName}!
        </h2>
      </div>

      <!-- Body -->
      <div style="background:#ffffff;padding:32px">

        <p style="color:#475569;font-size:15px;
                  line-height:1.7;margin:0 0 20px">
          Great news! Your tenant account on ProTech has
          been <strong style="color:#059669">officially
          approved</strong> by
          <strong>${landlordName}</strong>.
          You now have full access to your tenant dashboard.
        </p>

        <!-- Lease details card -->
        <div style="background:#F0FDF4;border:1px solid #BBF7D0;
                    border-radius:12px;padding:20px 24px;
                    margin:0 0 24px">
          <p style="color:#065F46;font-size:12px;font-weight:700;
                    letter-spacing:0.5px;margin:0 0 14px">
            YOUR TENANCY DETAILS
          </p>
          <table style="width:100%;border-collapse:collapse">
            ${displayProperty ? `
            <tr>
              <td style="padding:7px 0;color:#64748B;
                         font-size:14px;width:40%">
                Property
              </td>
              <td style="padding:7px 0;color:#0A3D2E;
                         font-weight:700;font-size:14px;
                         text-align:right">
                ${displayProperty}
              </td>
            </tr>` : ''}
            ${roomNumber ? `
            <tr style="border-top:1px solid #D1FAE5">
              <td style="padding:7px 0;color:#64748B;font-size:14px">
                Room / Unit
              </td>
              <td style="padding:7px 0;color:#0A3D2E;
                         font-weight:700;font-size:14px;
                         text-align:right">
                ${roomNumber}
              </td>
            </tr>` : ''}
            ${rentAmount ? `
            <tr style="border-top:1px solid #D1FAE5">
              <td style="padding:7px 0;color:#64748B;font-size:14px">
                Rent Amount
              </td>
              <td style="padding:7px 0;color:#0A3D2E;
                         font-weight:700;font-size:14px;
                         text-align:right">
                ₦${parseFloat(rentAmount).toLocaleString()}
                / ${paymentFrequency}
              </td>
            </tr>` : ''}
            ${leaseStartDate ? `
            <tr style="border-top:1px solid #D1FAE5">
              <td style="padding:7px 0;color:#64748B;font-size:14px">
                Lease Start
              </td>
              <td style="padding:7px 0;color:#0A3D2E;
                         font-weight:700;font-size:14px;
                         text-align:right">
                ${leaseStartDate}
              </td>
            </tr>` : ''}
            ${leaseEndDate ? `
            <tr style="border-top:1px solid #D1FAE5">
              <td style="padding:7px 0;color:#64748B;font-size:14px">
                Payment Due Date
              </td>
              <td style="padding:7px 0;color:#B91C1C;
                         font-weight:700;font-size:14px;
                         text-align:right">
                ${leaseEndDate}
              </td>
            </tr>` : ''}
          </table>
        </div>

        <!-- What to do next -->
        <p style="color:#0A3D2E;font-size:14px;
                  font-weight:700;margin:0 0 12px">
          Here is what you can do now:
        </p>
        <div style="space-y:8px">
          ${[
            ['View your rent balance and due date',
             'Your dashboard shows exactly how much you owe and when.'],
            ['Pay rent securely online',
             'Pay using your debit card through Paystack — '
             + 'a receipt is emailed to you immediately.'],
            ['Receive automatic reminders',
             'ProTech will email you before your rent is due so '
             + 'you never miss a payment.'],
            ['Access your payment history',
             'Every payment is permanently recorded '
             + 'with a unique receipt number.']
          ].map(([title, desc]) => `
            <div style="display:flex;gap:12px;
                        margin-bottom:10px;
                        padding:12px 16px;
                        background:#F8FAFC;
                        border-radius:10px;
                        border-left:3px solid #059669">
              <div style="color:#059669;font-size:18px;
                          flex-shrink:0;line-height:1.2">
                ✓
              </div>
              <div>
                <p style="color:#0A3D2E;font-size:13px;
                           font-weight:700;margin:0 0 2px">
                  ${title}
                </p>
                <p style="color:#64748B;font-size:12px;
                           margin:0;line-height:1.5">
                  ${desc}
                </p>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- CTA Button -->
        <div style="text-align:center;margin:28px 0 8px">
          <a href="${loginLink}"
             style="background:#0D4F3C;color:#ffffff;
                    padding:14px 40px;border-radius:12px;
                    text-decoration:none;font-weight:800;
                    font-size:15px;display:inline-block;
                    letter-spacing:0.3px">
            Go to My Dashboard →
          </a>
        </div>

      </div>

      <!-- Footer -->
      <div style="background:#0A3D2E;padding:20px 32px;
                  text-align:center">
        <p style="color:#94A3B8;font-size:11px;margin:0;
                  line-height:1.6">
          This email was sent by ProTech on behalf of
          ${landlordName}.<br>
          You are receiving this because you registered
          as a tenant on ProTech.
        </p>
        <p style="color:#D97706;font-size:11px;
                  margin:8px 0 0;font-weight:700">
          ProTech — Property Management Platform
        </p>
      </div>

    </div>
  `

  await transporter.sendMail({
    from:    process.env.EMAIL_FROM || sendFrom,
    to:      tenantEmail,
    subject: `✅ Account Approved — Welcome to ${displayProperty || 'ProTech'}!`,
    html,
    text:
      `Hello ${tenantName},\n\n`
      + `Your tenant account has been approved by ${landlordName}.\n\n`
      + (displayProperty ? `Property: ${displayProperty}\n` : '')
      + (roomNumber ? `Room: ${roomNumber}\n` : '')
      + (rentAmount
          ? `Rent: ₦${parseFloat(rentAmount).toLocaleString()}/${paymentFrequency}\n`
          : '')
      + (leaseEndDate ? `Payment Due Date: ${leaseEndDate}\n` : '')
      + `\nLog in to your dashboard: ${loginLink}\n\n`
      + `ProTech — Property Management Platform`
  })

  console.log(
    `[EMAIL] ✅ Approval email sent to tenant: ${tenantEmail}`
  )
}

const sendLandlordApprovalConfirmEmail = async (
  landlordEmail,
  landlordName,
  opts = {}
) => {
  const {
    tenantName = 'The tenant',
    roomNumber = '',
    propertyName = '',
    dashboardLink =
      (process.env.FRONTEND_URL || 'https://pro-tech-one.vercel.app') + '/landlord/approvals'
  } = opts

  const html = `
    <div style="font-family:Arial,sans-serif;
                max-width:540px;margin:0 auto">
      <div style="background:#0A3D2E;padding:24px 28px;
                  border-bottom:4px solid #D97706">
        <h1 style="color:#fff;margin:0;font-size:20px;
                   font-weight:900">ProTech</h1>
      </div>
      <div style="background:#fff;padding:28px">
        <h2 style="color:#0A3D2E;font-size:18px;margin:0 0 12px">
          Tenant Approved ✓
        </h2>
        <p style="color:#475569;font-size:14px;line-height:1.6">
          Hello <strong>${landlordName}</strong>,<br><br>
          You have successfully approved
          <strong>${tenantName}</strong>
          ${roomNumber ? `for <strong>${roomNumber}</strong>` : ''}
          ${propertyName ? `at <strong>${propertyName}</strong>` : ''}.
          A welcome email has been sent to the tenant
          with their login details and lease information.
        </p>
        <a href="${dashboardLink}"
           style="background:#0D4F3C;color:#fff;
                  padding:12px 28px;border-radius:10px;
                  text-decoration:none;font-weight:700;
                  font-size:13px;display:inline-block;
                  margin-top:16px">
          View All Approvals →
        </a>
      </div>
    </div>
  `

  await transporter.sendMail({
    from:    process.env.EMAIL_FROM || sendFrom,
    to:      landlordEmail,
    subject: `Tenant Approved — ${tenantName}`,
    html,
    text: `Hello ${landlordName},\n\nYou approved ${tenantName}`
          + `${roomNumber ? ` for ${roomNumber}` : ''}.\n\n`
          + `A welcome email has been sent to the tenant.\n\n`
          + `ProTech — Property Management Platform`
  })

  console.log(
    `[EMAIL] ✅ Landlord approval confirmation sent to: ${landlordEmail}`
  )
}

const sendRentReminderEmail = async (
  tenantEmail,
  tenantName,
  opts = {}
) => {
  const {
    subject,
    hostelName,
    propertyName,
    roomNumber,
    amountRemaining,
    rentAmount,
    amountPaid,
    dueDate,
    urgencyLabel = 'Upcoming Rent',
    notifyType,
    days,
    payNowLink   = (process.env.FRONTEND_URL || 'https://pro-tech-one.vercel.app') + '/tenant/login'
  } = opts

  const displayProperty = hostelName || propertyName || 'Your Property'
  const isOverdue  = parseInt(days) < 0
  const isDueToday = parseInt(days) === 0

  const totalRentVal = parseFloat(rentAmount || 0);
  const paidVal = parseFloat(amountPaid || 0);
  const remainingVal = amountRemaining !== undefined && amountRemaining !== null
    ? parseFloat(amountRemaining)
    : Math.max(0, totalRentVal - paidVal);

  const totalRentFmt = `₦${totalRentVal.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const paidFmt      = `₦${paidVal.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const remainingFmt = `₦${remainingVal.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const headerBg = isOverdue || isDueToday ? '#B91C1C' : '#D97706'
  const headerText = isOverdue
    ? `🚨 RENT OVERDUE: ${remainingFmt} OWING`
    : isDueToday
    ? `⚠️ RENT DUE TODAY: ${remainingFmt} OWING`
    : `📅 RENT REMINDER: ${remainingFmt} OWING`

  const defaultSubject = isOverdue
    ? `🚨 OVERDUE RENT: ${remainingFmt} Owing — ${urgencyLabel}`
    : isDueToday
    ? `⚠️ RENT DUE TODAY: ${remainingFmt} Owing`
    : `📅 Rent Reminder: ${remainingFmt} Owing — ${urgencyLabel}`

  const finalSubject = subject || defaultSubject;

  const html = `
    <div style="font-family:Arial,sans-serif;
                max-width:560px;margin:0 auto;
                background:#F8FFFE">

      <div style="background:#0A3D2E;padding:24px 28px;
                  border-bottom:4px solid #D97706">
        <h1 style="color:#fff;margin:0;font-size:22px;
                   font-weight:900">ProTech</h1>
        <p style="color:#D97706;margin:4px 0 0;
                  font-size:11px;font-weight:600;
                  letter-spacing:0.5px">
          PROPERTY MANAGEMENT PLATFORM
        </p>
      </div>

      <div style="background:${headerBg};padding:18px 28px;
                  text-align:center">
        <h2 style="color:#fff;margin:0;font-size:18px;
                   font-weight:900">
          ${headerText}
        </h2>
      </div>

      <div style="background:#ffffff;padding:28px">

        <p style="color:#334155;font-size:15px;line-height:1.6">
          Dear <strong>${tenantName}</strong>,
        </p>
        <p style="color:#475569;font-size:14px;line-height:1.6">
          ${isOverdue
            ? `Your rent payment is now overdue. You currently have an outstanding balance of <strong style="color:#B91C1C">${remainingFmt}</strong>. Please pay immediately.`
            : isDueToday
            ? `Your rent payment is due today. You currently owe <strong style="color:#B91C1C">${remainingFmt}</strong>. Please complete payment now.`
            : `This is a reminder that your rent payment is coming due. You currently owe <strong style="color:#D97706">${remainingFmt}</strong>.`}
        </p>

        <div style="background:#F0FDF4;border:1px solid #BBF7D0;
                    border-radius:12px;padding:20px 24px;
                    margin:20px 0">
          <p style="color:#065F46;font-size:12px;font-weight:700;
                    letter-spacing:0.4px;margin:0 0 12px">
            PAYMENT BREAKDOWN & DETAILS
          </p>
          <table style="width:100%;border-collapse:collapse">
            <tr>
              <td style="padding:8px 0;color:#64748B;font-size:14px">
                Property
              </td>
              <td style="padding:8px 0;color:#0A3D2E;font-weight:700;
                         font-size:14px;text-align:right">
                ${displayProperty}
              </td>
            </tr>
            ${roomNumber ? `
            <tr style="border-top:1px solid #D1FAE5">
              <td style="padding:8px 0;color:#64748B;font-size:14px">
                Room / Unit
              </td>
              <td style="padding:8px 0;color:#0A3D2E;font-weight:700;
                         text-align:right;font-size:14px">
                Room ${roomNumber}
              </td>
            </tr>` : ''}
            ${totalRentVal > 0 ? `
            <tr style="border-top:1px solid #D1FAE5">
              <td style="padding:8px 0;color:#64748B;font-size:14px">
                Total Rent
              </td>
              <td style="padding:8px 0;color:#334155;font-weight:600;
                         font-size:14px;text-align:right">
                ${totalRentFmt}
              </td>
            </tr>` : ''}
            ${paidVal > 0 ? `
            <tr style="border-top:1px solid #D1FAE5">
              <td style="padding:8px 0;color:#64748B;font-size:14px">
                Amount Paid
              </td>
              <td style="padding:8px 0;color:#059669;font-weight:600;
                         font-size:14px;text-align:right">
                ${paidFmt}
              </td>
            </tr>` : ''}
            <tr style="border-top:2px solid #BBF7D0">
              <td style="padding:10px 0;color:#B91C1C;font-size:15px;font-weight:800">
                Amount Owing (Balance Due)
              </td>
              <td style="padding:10px 0;color:#B91C1C;font-weight:900;
                         font-size:18px;text-align:right">
                ${remainingFmt}
              </td>
            </tr>
            <tr style="border-top:1px solid #D1FAE5">
              <td style="padding:8px 0;color:#64748B;font-size:14px">
                Payment Due Date
              </td>
              <td style="padding:8px 0;color:#0A3D2E;font-weight:700;
                         text-align:right;font-size:14px">
                ${dueDate || 'N/A'}
              </td>
            </tr>
            <tr style="border-top:1px solid #D1FAE5">
              <td style="padding:8px 0;color:#64748B;font-size:14px">
                Status
              </td>
              <td style="padding:8px 0;text-align:right">
                <span style="background:${headerBg};color:#fff;
                             padding:3px 10px;border-radius:20px;
                             font-size:12px;font-weight:700">
                  ${urgencyLabel}
                </span>
              </td>
            </tr>
          </table>
        </div>

        <div style="text-align:center;margin:24px 0">
          <a href="${payNowLink}"
             style="background:#0D4F3C;color:#fff;
                    padding:14px 40px;border-radius:12px;
                    text-decoration:none;font-weight:800;
                    font-size:15px;display:inline-block">
            Pay Rent Now →
          </a>
        </div>

        <p style="color:#94A3B8;font-size:12px;
                  text-align:center;
                  border-top:1px solid #E2E8F0;
                  padding-top:16px;margin-top:8px">
          This reminder was sent automatically by ProTech.<br>
          You are receiving this because you have an active
          lease managed on ProTech.
        </p>

      </div>

      <div style="background:#0A3D2E;padding:16px 28px;
                  text-align:center">
        <p style="color:#94A3B8;font-size:11px;margin:0">
          ProTech Property Management Platform
        </p>
      </div>

    </div>
  `

  await transporter.sendMail({
    from:    process.env.EMAIL_FROM || sendFrom,
    to:      tenantEmail,
    subject: finalSubject,
    html,
    text:
      `${finalSubject}\n\n`
      + `Dear ${tenantName},\n\n`
      + `${urgencyLabel}\n\n`
      + `Property: ${displayProperty}\n`
      + (roomNumber ? `Room: ${roomNumber}\n` : '')
      + `Total Rent: ${totalRentFmt}\n`
      + `Amount Paid: ${paidFmt}\n`
      + `Amount Owing (Balance Due): ${remainingFmt}\n`
      + `Due Date: ${dueDate || 'N/A'}\n\n`
      + `Pay now: ${payNowLink}\n\n`
      + `ProTech Property Management Platform`
  })

  console.log(
    `[EMAIL] ✅ Reminder sent → ${tenantEmail} | ${urgencyLabel} | ${remainingFmt} owing`
  )
}

const sendLandlordRentAlert = async (
  landlordEmail,
  landlordName,
  opts = {}
) => {
  const {
    subject,
    tenantName,
    roomNumber,
    propertyName,
    hostelName,
    amountRemaining,
    rentAmount,
    amountPaid,
    dueDate,
    urgencyLabel = 'Rent Alert',
    days
  } = opts

  const displayProperty = hostelName || propertyName || ''
  const isOverdue = parseInt(days) < 0
  const headerBg  = isOverdue ? '#B91C1C' : '#D97706'

  const totalRentVal = parseFloat(rentAmount || 0);
  const paidVal = parseFloat(amountPaid || 0);
  const remainingVal = amountRemaining !== undefined && amountRemaining !== null
    ? parseFloat(amountRemaining)
    : Math.max(0, totalRentVal - paidVal);

  const totalRentFmt = `₦${totalRentVal.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const paidFmt      = `₦${paidVal.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const remainingFmt = `₦${remainingVal.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const defaultSubject = `Tenant Rent Alert: ${tenantName} — ${remainingFmt} Outstanding (${urgencyLabel})`;
  const finalSubject = subject || defaultSubject;

  const html = `
    <div style="font-family:Arial,sans-serif;
                max-width:540px;margin:0 auto">
      <div style="background:#0A3D2E;padding:22px 28px;
                  border-bottom:4px solid #D97706">
        <h1 style="color:#fff;margin:0;font-size:20px;
                   font-weight:900">ProTech</h1>
        <p style="color:#D97706;margin:3px 0 0;
                  font-size:11px;font-weight:600">
          LANDLORD RENT ALERT
        </p>
      </div>
      <div style="background:${headerBg};padding:14px 28px">
        <h2 style="color:#fff;margin:0;font-size:15px;
                   font-weight:900">
          ${finalSubject}
        </h2>
      </div>
      <div style="background:#fff;padding:28px">
        <p style="color:#334155;font-size:14px;line-height:1.6">
          Hello <strong>${landlordName}</strong>,
        </p>
        <p style="color:#475569;font-size:13px;line-height:1.6">
          A rent alert has been triggered for one of your tenants:
        </p>
        <div style="background:#F8FAFC;border:1px solid #E2E8F0;
                    border-radius:12px;padding:18px 22px;margin:16px 0">
          <table style="width:100%;border-collapse:collapse">
            <tr>
              <td style="padding:7px 0;color:#64748B;font-size:13px">
                Tenant
              </td>
              <td style="padding:7px 0;font-weight:700;
                         text-align:right;color:#0A3D2E;font-size:13px">
                ${tenantName}
              </td>
            </tr>
            ${roomNumber ? `
            <tr style="border-top:1px solid #E2E8F0">
              <td style="padding:7px 0;color:#64748B;font-size:13px">
                Room / Unit
              </td>
              <td style="padding:7px 0;text-align:right;
                         color:#334155;font-size:13px;font-weight:600">
                Room ${roomNumber}
              </td>
            </tr>` : ''}
            ${displayProperty ? `
            <tr style="border-top:1px solid #E2E8F0">
              <td style="padding:7px 0;color:#64748B;font-size:13px">
                Property
              </td>
              <td style="padding:7px 0;text-align:right;
                         color:#334155;font-size:13px">
                ${displayProperty}
              </td>
            </tr>` : ''}
            ${totalRentVal > 0 ? `
            <tr style="border-top:1px solid #E2E8F0">
              <td style="padding:7px 0;color:#64748B;font-size:13px">
                Total Rent
              </td>
              <td style="padding:7px 0;text-align:right;
                         color:#334155;font-size:13px">
                ${totalRentFmt}
              </td>
            </tr>` : ''}
            ${paidVal > 0 ? `
            <tr style="border-top:1px solid #E2E8F0">
              <td style="padding:7px 0;color:#64748B;font-size:13px">
                Amount Paid
              </td>
              <td style="padding:7px 0;text-align:right;
                         color:#059669;font-size:13px;font-weight:600">
                ${paidFmt}
              </td>
            </tr>` : ''}
            <tr style="border-top:2px solid #E2E8F0">
              <td style="padding:9px 0;color:#B91C1C;font-size:14px;font-weight:800">
                Amount Outstanding (Owing)
              </td>
              <td style="padding:9px 0;text-align:right;
                         font-weight:900;color:#B91C1C;font-size:16px">
                ${remainingFmt}
              </td>
            </tr>
            <tr style="border-top:1px solid #E2E8F0">
              <td style="padding:7px 0;color:#64748B;font-size:13px">
                Payment Status
              </td>
              <td style="padding:7px 0;text-align:right">
                <span style="background:${headerBg};color:#fff;
                             padding:2px 10px;border-radius:20px;
                             font-size:12px;font-weight:700">
                  ${urgencyLabel}
                </span>
              </td>
            </tr>
            <tr style="border-top:1px solid #E2E8F0">
              <td style="padding:7px 0;color:#64748B;font-size:13px">
                Due Date
              </td>
              <td style="padding:7px 0;text-align:right;
                         color:#334155;font-size:13px">
                ${dueDate || 'N/A'}
              </td>
            </tr>
          </table>
        </div>
        <p style="color:#94A3B8;font-size:12px;
                  border-top:1px solid #E2E8F0;
                  padding-top:14px;text-align:center">
          This alert was sent automatically by ProTech.<br>
          A reminder email has also been sent to the tenant.
        </p>
      </div>
    </div>
  `

  await transporter.sendMail({
    from:    process.env.EMAIL_FROM || sendFrom,
    to:      landlordEmail,
    subject: finalSubject,
    html,
    text:
      `${finalSubject}\n\n`
      + `Hello ${landlordName},\n\n`
      + `Tenant: ${tenantName}\n`
      + (roomNumber ? `Room: ${roomNumber}\n` : '')
      + `Status: ${urgencyLabel}\n`
      + `Total Rent: ${totalRentFmt}\n`
      + `Amount Paid: ${paidFmt}\n`
      + `Amount Outstanding: ${remainingFmt}\n`
      + `Due Date: ${dueDate || 'N/A'}\n\n`
      + `ProTech Property Management Platform`
  })

  console.log(
    `[EMAIL] ✅ Landlord alert sent → ${landlordEmail} | ${tenantName} owing ${remainingFmt}`
  )
}

module.exports = {
  sendOTPEmail,
  sendPasswordChangedEmail,
  sendApprovalEmail,
  sendTenantApprovalEmail,
  sendLandlordApprovalConfirmEmail,
  sendRentReminderEmail,
  sendPaymentConfirmationEmail,
  sendAnnouncementEmail,
  sendLandlordWelcomeEmail,
  sendTenantWelcomeEmail,
  sendLandlordTenantRegistrationNotificationEmail,
  sendTenantRentReminderEmail,
  sendLandlordRentAlertEmail,
  sendLandlordRentAlert,
  sendPaymentReceiptEmail,
  sendLandlordPaymentAlert,
  sendPaymentReceiptToBoth,
};
