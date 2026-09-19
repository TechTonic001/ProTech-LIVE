// src/tours/landlordTourSteps.js

export const LANDLORD_TOUR_STEPS = [
  // ── Step 1 — Welcome ────────────────────────────────
  {
    target: 'body',
    title: 'Welcome to ProTech! 🎉',
    content:
      'You have successfully created your landlord account. ' +
      'This short tour will walk you through everything you ' +
      'need to set up and start managing your properties. ' +
      'It will only take about 2 minutes.',
    placement: 'center',
    disableBeacon: true,
  },

  // ── Step 2 — Landlord Code ──────────────────────────
  {
    target: '[data-tour="landlord-code"]',
    title: 'Your Unique Landlord Code',
    content:
      'This is your landlord code (e.g. PT-A1B2C3). ' +
      'Share this code with your tenants  they will ' +
      'need it to register on ProTech and link their ' +
      'account to your hostel. Keep it somewhere safe.',
    placement: 'bottom',
    disableBeacon: true,
  },

  // ── Step 3 — Dashboard overview ─────────────────────
  {
    target: '[data-tour="dashboard-stats"]',
    title: 'Your Dashboard at a Glance',
    content:
      'These cards show your live stats: total properties, ' +
      'active tenants, revenue this month, and overdue ' +
      'rent count. Each card is clickable and takes you ' +
      'directly to the relevant page. The overdue card ' +
      'pulses red when any tenant is behind on rent.',
    placement: 'bottom',
    disableBeacon: true,
  },

  // ── Step 4 — Add Property ───────────────────────────
  {
    target: '[data-tour="add-property-btn"]',
    title: 'Step 1: Add Your Property',
    content:
      'Click "Add Property" to register your hostel. ' +
      'Enter the property name, address, city, and the ' +
      'number of rooms available. ProTech will ' +
      'automatically create all the rooms for you — ' +
      'named Room 1, Room 2... all the way up to the ' +
      'number you enter. No manual room creation needed.',
    placement: 'bottom',
    disableBeacon: true,
  },

  // ── Step 5 — Rooms page ─────────────────────────────
  {
    target: '[data-tour="nav-rooms"]',
    title: 'Step 2: Edit Your Rooms',
    content:
      'Open the Rooms page to see all your rooms split ' +
      'into two tabs: Available and Assigned. Click the ' +
      'Edit button on any room to change its name, type ' +
      '(single, shared, self-contain), monthly rent, and ' +
      'payment frequency (monthly or annually).',
    placement: 'right',
    disableBeacon: true,
  },

  // ── Step 6 — Tenant Approvals ───────────────────────
  {
    target: '[data-tour="nav-approvals"]',
    title: 'Step 3: Approve Your Tenants',
    content:
      'When a tenant registers using your landlord code, ' +
      'their request appears here. Review their details ' +
      'and click Approve to assign them to a room. You ' +
      'will set the lease start date and end date — the ' +
      'end date is also the rent due date. Once approved, ' +
      'the tenant gets email confirmation and can log in.',
    placement: 'right',
    disableBeacon: true,
  },

  // ── Step 7 — Bank Setup ─────────────────────────────
  {
    target: '[data-tour="nav-bank-setup"]',
    title: 'Step 4: Connect Your Bank Account',
    content:
      'Set up your bank account so rent payments go ' +
      'directly to your bank — automatically. Select ' +
      'your bank, enter your 10-digit account number, ' +
      'and your account name will be verified instantly. ' +
      'Every payment a tenant makes is securely processed ' +
      'by Paystack and settled into your account.',
    placement: 'right',
    disableBeacon: true,
  },

  // ── Step 8 — Notification Settings ──────────────────
  {
    target: '[data-tour="nav-notif-settings"]',
    title: 'Step 5: Configure Rent Reminders',
    content:
      'Choose WHEN ProTech sends rent reminders to your ' +
      'tenants. Toggle on the thresholds you want: ' +
      '30 days, 14 days, 7 days, 3 days, 1 day, or on ' +
      'the due date itself. Set the time of day for ' +
      'delivery. ProTech sends reminders automatically ' +
      'by email and by WhatsApp if you enable it.',
    placement: 'right',
    disableBeacon: true,
  },

  // ── Step 9 — Announcements ──────────────────────────
  {
    target: '[data-tour="nav-announcements"]',
    title: 'Broadcast Announcements',
    content:
      'Use Announcements to send a message to ALL your ' +
      'tenants at once — maintenance notices, hostel ' +
      'rules, payment reminders, any message you choose. ' +
      'Every active tenant receives the announcement by ' +
      'email and as an in-app notification instantly.',
    placement: 'right',
    disableBeacon: true,
  },

  // ── Step 10 — Profile ───────────────────────────────
  {
    target: '[data-tour="nav-profile"]',
    title: 'Complete Your Profile',
    content:
      'Add your hostel name, phone number, and address ' +
      'in your Profile page. These details appear on ' +
      'every digital rent receipt that tenants receive. ' +
      'You can also restart this tour anytime from your ' +
      'profile page.',
    placement: 'right',
    disableBeacon: true,
  },

  // ── Step 11 — Done ───────────────────────────────────
  {
    target: 'body',
    title: "You're All Set!",
    content:
      'That covers everything. Your next steps are:\n\n' +
      '1. Add your first property\n' +
      '2. Set up your bank account\n' +
      '3. Configure your notification settings\n' +
      '4. Share your landlord code with tenants\n\n' +
      'ProTech handles the rest automatically. ' +
      'Welcome to stress-free rent management!',
    placement: 'center',
    disableBeacon: true,
  },
];
