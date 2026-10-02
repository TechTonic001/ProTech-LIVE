// Complete rewrite of notification engine per spec
const db = require('../config/db');
const {
  sendRentReminderEmail,
  sendLandlordRentAlert,
} = require('./email');
const { sendRentReminderEmail: sendReminderHtmlEmail } = require('./emailHelper');
const { sendWhatsAppMessage } = require('./whatsapp.service');

const computeDaysUntilDue = (dueDate, referenceDate = new Date()) => {
  if (!dueDate) return 0;

  const now = new Date(referenceDate);
  const due = new Date(`${dueDate}T00:00:00`);
  const today = new Date(
    now.toLocaleString('en-US', { timeZone: 'Africa/Lagos' })
  );

  const todayStart = new Date(
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}T00:00:00`
  );

  const diffMs = due.getTime() - todayStart.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
};

const determineShouldNotify = (daysRemaining, settings = {}) => {
  const s = settings || {};

  if (daysRemaining === 30 && s.remind_30_days !== false) {
    return { shouldNotify: true, notifyType: '30_day_reminder' };
  }
  if (daysRemaining === 14 && s.remind_14_days === true) {
    return { shouldNotify: true, notifyType: '14_day_reminder' };
  }
  if (daysRemaining === 7 && s.remind_7_days !== false) {
    return { shouldNotify: true, notifyType: '7_day_reminder' };
  }
  if (daysRemaining === 3 && s.remind_3_days === true) {
    return { shouldNotify: true, notifyType: '3_day_reminder' };
  }
  if (daysRemaining === 1 && s.remind_1_day !== false) {
    return { shouldNotify: true, notifyType: '1_day_reminder' };
  }
  if (daysRemaining === 0 && s.remind_on_due !== false) {
    return { shouldNotify: true, notifyType: 'due_today' };
  }
  if (daysRemaining < 0) {
    const frequency = s.frequency_overdue || 'daily';
    const daysPast = Math.abs(daysRemaining);

    if (frequency === 'daily') {
      return { shouldNotify: true, notifyType: 'overdue' };
    }
    if (frequency === 'every_2_days' && daysPast % 2 === 0) {
      return { shouldNotify: true, notifyType: 'overdue' };
    }
    if (frequency === 'weekly' && daysPast % 7 === 0) {
      return { shouldNotify: true, notifyType: 'overdue' };
    }
  }

  return { shouldNotify: false, notifyType: null };
};

const runNotificationEngine = async (currentHourArg, options = {}) => {
  let currentHour = currentHourArg;
  let force = false;

  if (typeof currentHourArg === 'object' && currentHourArg !== null) {
    options = currentHourArg;
    currentHour = options.currentHour || options.hour;
    force = !!options.force;
  } else if (typeof options === 'object' && options !== null) {
    force = !!options.force;
  }

  console.log(`[CRON] Notification engine running — WAT hour: ${currentHour || 'ALL'}, force mode: ${force}`);

  // Today in Africa/Lagos as YYYY-MM-DD string
  const todayWAT = new Date().toLocaleDateString('en-CA', {
    timeZone: 'Africa/Lagos'
  });

  const executionDetails = [];

  try {
    const [leases] = await db.query(`
      SELECT
        l.lease_id,
        l.tenant_id,
        l.landlord_id,
        COALESCE(l.rent_amount, 0)         AS rent_amount,
        COALESCE(l.amount_paid_this_cycle, 0) AS amount_paid_this_cycle,
        COALESCE(l.carried_forward_balance, 0) AS carried_forward_balance,
        COALESCE(l.rent_amount, 0) - COALESCE(l.amount_paid_this_cycle, 0)
          + COALESCE(l.carried_forward_balance, 0) AS remaining,
        TO_CHAR(l.end_date, 'YYYY-MM-DD')   AS end_date,
        TO_CHAR(l.end_date, 'YYYY-MM-DD')   AS due_date,
        (l.end_date::DATE -
          (NOW() AT TIME ZONE 'Africa/Lagos')::DATE
        )                                    AS days_remaining,
        u_t.email      AS tenant_email,
        u_t.full_name  AS tenant_name,
        u_l.email      AS landlord_email,
        u_l.full_name  AS landlord_name,
        u_t.phone_number AS tenant_phone,
        u_l.phone_number AS landlord_phone,
        u_l.hostel_name,
        r.room_number,
        p.property_name,
        COALESCE(ns.remind_30_days,  TRUE)    AS remind_30_days,
        COALESCE(ns.remind_14_days,  FALSE)   AS remind_14_days,
        COALESCE(ns.remind_7_days,   TRUE)    AS remind_7_days,
        COALESCE(ns.remind_3_days,   FALSE)   AS remind_3_days,
        COALESCE(ns.remind_1_day,    TRUE)    AS remind_1_day,
        COALESCE(ns.remind_on_due,   TRUE)    AS remind_on_due,
        COALESCE(ns.send_time,      '08:00') AS send_time,
        COALESCE(ns.frequency_overdue,'daily') AS frequency_overdue,
        COALESCE(ns.whatsapp_enabled, FALSE) AS whatsapp_enabled,
        COALESCE(ns.enable_email_reminders, TRUE) AS enable_email_reminders
      FROM leases l
      JOIN users u_t   ON l.tenant_id   = u_t.user_id
      JOIN users u_l   ON l.landlord_id = u_l.user_id
      JOIN rooms r     ON l.room_id     = r.room_id
      JOIN properties p ON r.property_id = p.property_id
      LEFT JOIN notification_settings ns
        ON ns.landlord_id = l.landlord_id
      WHERE l.lease_status = 'active'
        AND (COALESCE(l.amount_paid_this_cycle, 0) < l.rent_amount
          OR COALESCE(l.carried_forward_balance, 0) > 0)
        AND u_t.deleted_at IS NULL
        AND r.deleted_at IS NULL
        AND p.deleted_at IS NULL
    `);

    console.log(`[CRON] Found ${leases.length} active unpaid leases`);

    let sent = 0; let skipped = 0;

    for (const lease of leases) {

      const days = parseInt(lease.days_remaining);

      // ── Send-time filter ──────────────────────────────
      if (!force && currentHour && currentHour !== 'all') {
        const preferredHour = (lease.send_time || '08:00')
          .split(':')[0].padStart(2,'0');

        if (preferredHour !== currentHour) {
          skipped++;
          executionDetails.push({ lease_id: lease.lease_id, status: 'skipped', reason: `preferred hour ${preferredHour} != ${currentHour}` });
          continue;
        }
      }

      // ── Determine notification type ───────────────────
      let notifyType = null;

      if (days === 30 && lease.remind_30_days)
        notifyType = 'reminder_30_days';
      else if (days === 14 && lease.remind_14_days)
        notifyType = 'reminder_14_days';
      else if (days === 7  && lease.remind_7_days)
        notifyType = 'reminder_7_days';
      else if (days === 3  && lease.remind_3_days)
        notifyType = 'reminder_3_days';
      else if (days === 1  && lease.remind_1_day)
        notifyType = 'reminder_1_day';
      else if (days === 0  && lease.remind_on_due)
        notifyType = 'due_today';
      else if (days < 0) {
        const daysPast = Math.abs(days);
        const freq = lease.frequency_overdue || 'daily';
        let shouldSend = false;

        if (freq === 'daily')
          shouldSend = true;
        else if (freq === 'every_2_days' && daysPast % 2 === 0)
          shouldSend = true;
        else if (freq === 'weekly' && daysPast % 7 === 0)
          shouldSend = true;

        if (shouldSend) notifyType = 'overdue';
      }

      // If force mode is active, override empty notifyType so manual tests always send!
      if (!notifyType && force) {
        if (days > 0) notifyType = 'reminder_manual_test';
        else if (days === 0) notifyType = 'due_today_manual_test';
        else notifyType = 'overdue_manual_test';
      }

      if (!notifyType) {
        skipped++;
        executionDetails.push({ lease_id: lease.lease_id, status: 'skipped', reason: `day ${days} not scheduled for notification` });
        continue;
      }

      // ── Duplicate prevention (per-day idempotency) ───
      if (!force) {
        const [existing] = await db.query(`
          SELECT notification_id FROM notifications
          WHERE lease_id = $1
            AND notification_type = $2
            AND DATE(
              sent_at AT TIME ZONE 'Africa/Lagos'
            ) = $3::DATE
        `, [lease.lease_id, notifyType, todayWAT]);

        if (existing && existing.length > 0) {
          console.log(
            `[CRON] Duplicate skipped: ${notifyType} for lease ${lease.lease_id}`
          );
          skipped++;
          executionDetails.push({ lease_id: lease.lease_id, status: 'skipped', reason: `already sent today (${notifyType})` });
          continue;
        }
      }

      // ── Build urgency label and amount remaining ─────────
      const remaining = parseFloat(lease.remaining || 0);
      const remainingFmt = `₦${remaining.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

      let urgencyLabel, tenantSubject, landlordSubject;

      if (days > 0) {
        urgencyLabel   = `${days} day${days===1?'':'s'} remaining`;
        tenantSubject  = `Rent Reminder: ${remainingFmt} Owing — ${urgencyLabel}`;
        landlordSubject= `Tenant Rent Alert: ${lease.tenant_name} — ${remainingFmt} Outstanding (${urgencyLabel})`;
      } else if (days === 0) {
        urgencyLabel   = 'Due TODAY';
        tenantSubject  = `URGENT: ${remainingFmt} Rent Due TODAY`;
        landlordSubject= `Tenant Rent Alert: ${lease.tenant_name} — ${remainingFmt} Due TODAY`;
      } else {
        const d = Math.abs(days);
        urgencyLabel   = `${d} day${d===1?'':'s'} OVERDUE`;
        tenantSubject  = `🚨 OVERDUE: ${remainingFmt} Rent Owing (${urgencyLabel})`;
        landlordSubject= `🚨 OVERDUE ALERT: ${lease.tenant_name} — ${remainingFmt} Outstanding (${urgencyLabel})`;
      }

      // ── Send TENANT email ─────────────────────────────
      let tenantEmailSent = false;
      if (lease.enable_email_reminders) {
        try {
          await sendRentReminderEmail(
            lease.tenant_email,
            lease.tenant_name,
            {
              subject:         tenantSubject,
              hostelName:      lease.hostel_name,
              propertyName:    lease.property_name,
              roomNumber:      lease.room_number,
              amountRemaining: remaining,
              rentAmount:      lease.rent_amount,
              amountPaid:      lease.amount_paid_this_cycle,
              dueDate:         lease.due_date,
              urgencyLabel,
              notifyType,
              days,
              payNowLink: `${process.env.FRONTEND_URL || 'https://pro-tech-one.vercel.app'}/tenant/login`
            }
          );
          tenantEmailSent = true;
          console.log(`[CRON] ✅ Reminder email → ${lease.tenant_email} | ${urgencyLabel} | ${remainingFmt} owing`);
        } catch (err) {
          console.error(`[CRON] ❌ Reminder email FAILED → ${lease.tenant_email}:`, err.message);
        }
      }

      // ── Send LANDLORD alert email ─────────────────────
      let landlordEmailSent = false;
      try {
        await sendLandlordRentAlert(
          lease.landlord_email,
          lease.landlord_name,
          {
            subject:         landlordSubject,
            tenantName:      lease.tenant_name,
            roomNumber:      lease.room_number,
            propertyName:    lease.property_name,
            hostelName:      lease.hostel_name,
            amountRemaining: remaining,
            rentAmount:      lease.rent_amount,
            amountPaid:      lease.amount_paid_this_cycle,
            dueDate:         lease.due_date,
            urgencyLabel,
            notifyType,
            days
          }
        );
        landlordEmailSent = true;
        console.log(`[CRON] ✅ Landlord alert email → ${lease.landlord_email}`);
      } catch (err) {
        console.error(`[CRON] ❌ Landlord alert FAILED for lease ${lease.lease_id}:`, err.message);
      }

      if (lease.whatsapp_enabled) {
        if (lease.tenant_phone) {
          const tenantMessage = [
            'ProTech Rent Reminder',
            `Hello ${lease.tenant_name}, your rent is ${urgencyLabel}.`,
            `Property: ${lease.hostel_name || lease.property_name}`,
            `Room: ${lease.room_number}`,
            `Amount Owed: ${remainingFmt}`,
            `Due Date: ${lease.due_date}`,
            `Pay online: ${process.env.FRONTEND_URL || 'https://pro-tech-one.vercel.app'}/tenant/login`,
          ].join('\n');
          sendWhatsAppMessage(lease.tenant_phone, tenantMessage)
            .catch((err) => console.error('[CRON] Tenant WhatsApp failed:', err.message));
        }
        if (lease.landlord_phone) {
          const landlordMessage = [
            'ProTech Landlord Alert',
            `Tenant ${lease.tenant_name} rent status: ${urgencyLabel}.`,
            `Room: ${lease.room_number}`,
            `Amount Owed: ${remainingFmt}`,
            `Due Date: ${lease.due_date}`,
          ].join('\n');
          sendWhatsAppMessage(lease.landlord_phone, landlordMessage)
            .catch((err) => console.error('[CRON] Landlord WhatsApp failed:', err.message));
        }
      }

      // ── Log notification to database ──────────────────
      await db.query(`
        INSERT INTO notifications
          (lease_id, tenant_id, landlord_id,
           channel, notification_type, message_body,
           delivery_status, sent_at)
        VALUES ($1,$2,$3,'email',$4,$5,'sent',NOW())
      `, [
        lease.lease_id,
        lease.tenant_id,
        lease.landlord_id,
        notifyType,
        `${notifyType}: ${urgencyLabel} — ${remainingFmt} remaining owing — due ${lease.due_date}`
      ]);

      sent++;
      executionDetails.push({
        lease_id: lease.lease_id,
        tenant: lease.tenant_email,
        landlord: lease.landlord_email,
        amount_owing: remainingFmt,
        status: 'sent',
        tenantEmailSent,
        landlordEmailSent
      });
    }

    console.log(
      `[CRON] Complete — ${sent} notifications sent, `
      + `${skipped} skipped (time filter or already sent)`
    );

    return {
      sent,
      skipped,
      processed: leases.length,
      details: executionDetails
    };

  } catch (err) {
    console.error('[CRON] Notification engine error:', err.message);
    return { sent: 0, skipped: 0, error: err.message };
  }
};

module.exports = {
  runNotificationEngine,
  computeDaysUntilDue,
  determineShouldNotify,
};
