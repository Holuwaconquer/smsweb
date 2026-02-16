# 🚀 Femzy Complete Setup Guide

## 📋 Table of Contents

1. [Supabase Setup](#supabase-setup)
2. [Paystack Setup](#paystack-setup)
3. [Configuration](#configuration)
4. [File Structure](#file-structure)
5. [Features](#features)
6. [WhatsApp Contact Integration](#whatsapp-contact)

---

## 🔧 Supabase Setup

### Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign in with GitHub
4. Create a new project
5. Choose a name, database password, and region

### Step 2: Run SQL Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Copy the entire content from `supabase-schema.sql`
3. Paste and click **RUN**
4. Wait for all tables to be created

### Step 3: Get API Credentials

1. Go to **Settings** > **API**
2. Copy your **Project URL**
3. Copy your **anon/public key**
4. Save these for configuration

---

## 💳 Paystack Setup

### Step 1: Create Paystack Account

1. Go to [https://paystack.com](https://paystack.com)
2. Sign up for an account
3. Verify your business (or use test mode)

### Step 2: Get API Keys

1. Go to **Settings** > **API Keys & Webhooks**
2. Copy your **Public Key** (starts with `pk_`)
3. For production, you'll also need the **Secret Key**

---

## ⚙️ Configuration

### Update Supabase Config (`js/supabase-config.js`)

```javascript
const SUPABASE_CONFIG = {
  url: "YOUR_SUPABASE_URL", // Replace with your URL
  anonKey: "YOUR_SUPABASE_ANON_KEY", // Replace with your anon key
};
```

### Update Paystack Config (`js/supabase-config.js`)

```javascript
const PAYSTACK_PUBLIC_KEY = "pk_test_xxxxxxxxxxxxx"; // Replace with your public key
```

---

## 📁 File Structure

```
Femzy-website/
├── index.html              # Homepage
├── auth.html               # Login/Signup (combined)
├── supabase-schema.sql     # Database schema
├── README.md
├── SETUP.md               # This file
│
├── dashboard/
│   ├── index.html         # Dashboard home
│   ├── usa-numbers.html   # USA numbers page
│   ├── all-countries.html # All countries page
│   ├── history.html       # Usage history
│   ├── wallet.html        # Wallet & payments
│   └── profile.html       # User profile settings
│
├── css/
│   ├── home.css          # Homepage styles
│   ├── auth.css          # Auth page styles
│   ├── dashboard.css     # Dashboard styles
│   └── chatbot.css       # Chatbot widget styles
│
└── js/
    ├── home.js           # Homepage functionality
    ├── auth.js           # Auth functionality
    ├── dashboard.js      # Dashboard functionality
    ├── chatbot.js        # AI chatbot
    └── supabase-config.js # Supabase & Paystack config
```

---

## ✨ Features Implemented

### 🔐 Authentication (Supabase)

- ✅ User registration with email/password
- ✅ User login
- ✅ Session management
- ✅ Auto-redirect if not authenticated
- ✅ Logout functionality

### 💰 Wallet & Payments (Paystack)

- ✅ Balance display
- ✅ Add funds via Paystack
- ✅ Transaction history
- ✅ Promo code system
- ✅ Nigerian Naira (NGN) currency

### 📱 SMS Services

- ✅ USA Numbers
- ✅ Global numbers (50+ countries)
- ✅ Service selection
- ✅ SMS message display
- ✅ Number activation

### 📊 Dashboard

- ✅ Stats cards (Balance, Messages, Spent)
- ✅ Quick access cards
- ✅ Usage history table
- ✅ Mobile responsive hamburger menu
- ✅ Dark/Light theme toggle

### 👤 Profile Management

- ✅ Update username
- ✅ Update email
- ✅ Change password
- ✅ Dark mode toggle
- ✅ Logout option

### 💬 Support

- ✅ AI chatbot for FAQs
- ✅ WhatsApp contact integration
- ✅ Help center links

---

## 📞 WhatsApp Contact Integration

The Contact Us link opens WhatsApp with a pre-filled message:

**Phone Number:** +234 901 272 6301

**How it works:**

```javascript
const whatsappNumber = "2349012726301";
const message = encodeURIComponent("Hello, I need help with Femzy");
window.open(`https://wa.me/${whatsappNumber}?text=${message}`, "_blank");
```

---

## 🎨 Theme System

### Dark Mode

- Stored in localStorage
- Syncs across all pages
- Toggle button in navigation

### Mobile Responsive

- Hamburger menu on mobile (<768px)
- Collapsible sidebar
- Touch-friendly buttons
- Optimized layouts

---

## 🔒 Security Features

### Row Level Security (RLS)

- Users can only see their own data
- Policies enforced at database level
- Secure by default

### Authentication

- Secure password hashing (Supabase)
- Session management
- Auto-logout on session expiry

---

## 🚀 Deployment

### Option 1: Vercel (Recommended)

1. Push code to GitHub
2. Import project to Vercel
3. Deploy automatically

### Option 2: Netlify

1. Drag and drop folder to Netlify
2. Configure build settings
3. Deploy

### Option 3: Traditional Hosting

1. Upload files via FTP
2. Ensure HTTPS is enabled
3. Configure domain

---

## 📝 Important Notes

### Environment Variables

For production, use environment variables instead of hardcoding:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `PAYSTACK_PUBLIC_KEY`

### Test Mode

- Use Paystack test keys during development
- Test cards: 4084084084084081 (success)
- Switch to live keys for production

### Database Backups

- Enable automatic backups in Supabase
- Export data regularly

---

## 🐛 Troubleshooting

### Authentication Not Working

1. Check Supabase URL and keys
2. Verify email confirmations are enabled
3. Check browser console for errors

### Paystack Payments Failing

1. Verify public key is correct
2. Check if in test/live mode
3. Verify Paystack account is active

### Database Errors

1. Verify SQL schema ran successfully
2. Check RLS policies are enabled
3. Ensure user permissions are correct

---

## 📧 Support

For issues or questions:

- **WhatsApp:** +234 901 272 6301
- **Email:** support@Femzy.com (configure your own)
- **GitHub Issues:** Create an issue in your repo

---

## ✅ Pre-Launch Checklist

- [ ] Supabase project created and schema installed
- [ ] Paystack account set up with API keys
- [ ] Configuration files updated with real credentials
- [ ] Test user registration
- [ ] Test user login
- [ ] Test Paystack payment
- [ ] Test WhatsApp contact link
- [ ] Mobile responsive testing
- [ ] Cross-browser testing
- [ ] SSL certificate installed (HTTPS)
- [ ] Domain configured
- [ ] Terms of Service page created
- [ ] Privacy Policy page created

---

## 🎉 You're All Set!

Your Femzy platform is ready to launch. Remember to:

1. Test thoroughly before going live
2. Start with test mode for payments
3. Monitor error logs regularly
4. Keep Supabase and dependencies updated

Good luck! 🚀
