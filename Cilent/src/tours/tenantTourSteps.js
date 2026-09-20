// src/tours/tenantTourSteps.js

export const TENANT_TOUR_STEPS = [
  // ── Step 1 — Welcome ────────────────────────────────
  {
    target: 'body',
    title: 'Welcome to ProTech!',
    content:
      'Your account has been created and is pending ' +
      'approval from your landlord. Once approved, you ' +
      'will have full access to pay rent, view your ' +
      'balance, and receive reminders. This quick tour ' +
      'shows you how everything works.',
    placement: 'center',
    disableBeacon: true,
  },

  // ── Step 2 — Approval status ────────────────────────
  {
    target: '[data-tour="tenant-approval-status"]',
    title: 'Your Account Status',
    content:
      'This banner shows whether your landlord has ' +
      'approved your account yet. Once approved, you ' +
      'will receive a confirmation email and this ' +
      'banner will disappear. Your landlord can see ' +
      'your registration in their approvals list.',
    placement: 'bottom',
    disableBeacon: true,
  },

  // ── Step 3 — Balance card ───────────────────────────
  {
    target: '[data-tour="tenant-balance-card"]',
    title: 'Your Rent Balance',
    content:
      'This card shows exactly how much rent you owe. ' +
      'It breaks down: any unpaid balance from a ' +
      'previous period, your current cycle rent, ' +
      'what you have already paid, and the total ' +
      'remaining. The due date countdown turns red ' +
      'when fewer than 20 days remain.',
    placement: 'bottom',
    disableBeacon: true,
  },

  // ── Step 4 — Pay rent ───────────────────────────────
  {
    target: '[data-tour="nav-pay-rent"]',
    title: 'How to Pay Rent',
    content:
      'Click "Pay Rent" to make a payment. The amount ' +
      'is pre-filled with your remaining balance. ' +
      'You will also see a ₦500 service fee displayed ' +
      'clearly. Payments are processed securely by ' +
      'Paystack — no cash, no screenshots needed. ' +
      'A receipt is emailed to you immediately.',
    placement: 'right',
    disableBeacon: true,
  },

  // ── Step 5 — Payment history ────────────────────────
  {
    target: '[data-tour="nav-payment-history"]',
    title: 'Your Payment History',
    content:
      'Every payment you make is permanently recorded ' +
      'here with the receipt number, Paystack reference, ' +
      'amount, and date. You can use this as proof of ' +
      'payment at any time — no more disputes about ' +
      'whether you paid.',
    placement: 'right',
    disableBeacon: true,
  },

  // ── Step 6 — Notifications ──────────────────────────
  {
    target: '[data-tour="nav-notifications"]',
    title: 'Rent Reminders & Notifications',
    content:
      'Your landlord has set up automatic rent reminders. ' +
      'ProTech will email you (and optionally send a ' +
      'WhatsApp message) when your rent is due soon — ' +
      'at 30, 7, and 1 day before the due date. ' +
      'You can see all your past and upcoming reminders ' +
      'in the Notifications page.',
    placement: 'right',
    disableBeacon: true,
  },

  // ── Step 7 — Announcements ──────────────────────────
  {
    target: '[data-tour="nav-announcements"]',
    title: 'Property Announcements',
    content:
      'Your landlord may post announcements here — ' +
      'maintenance notices, property rules, payment ' +
      'information, and other updates. You will receive ' +
      'an email and in-app notification for every new ' +
      'announcement.',
    placement: 'right',
    disableBeacon: true,
  },

  // ── Step 8 — Done ────────────────────────────────────
  {
    target: 'body',
    title: "You're Ready!",
    content:
      'You now know how to use ProTech. ' +
      'Once your landlord approves your account:\n\n' +
      '1. Your balance and due date will appear\n' +
      '2. You can pay rent directly from the app\n' +
      '3. You will receive automatic reminders\n' +
      '4. All your receipts are stored here forever\n\n' +
      'You can restart this tour anytime from your ' +
      'Profile page.',
    placement: 'center',
    disableBeacon: true,
  },
];
