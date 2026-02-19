# Paystack Integration - Quick Reference (Vanilla JavaScript)

## 🚀 5-Minute Setup

```bash
# 1. Edit your config file
# Open: js/config.js

# 2. Get your credentials from:
# - Supabase: https://app.supabase.com (Settings > API)
# - Paystack: https://dashboard.paystack.com (Settings > API Keys)

# 3. Update js/config.js with your credentials
# const AppConfig = {
#   supabase: {
#     url: "your-url",
#     anonKey: "your-key"
#   },
#   paystack: {
#     publicKey: "pk_test_your_key"
#   }
# };

# 4. Test on Wallet page
```

## 📦 What Was Added

1. **`js/config.js`** - Your credentials (EDIT THIS!)
2. **`js/config.example.js`** - Template example
3. **`js/paystack-config.js`** - Configuration loader
4. **Updated `js/payment.js`** - Uses AppConfig
5. **Updated `js/supabase-config.js`** - Reads from AppConfig
6. **Updated HTML files** - Load config.js first
7. **`VANILLA_JS_SETUP.md`** - Vanilla JS specific guide

## 🔑 Configuration

Edit `js/config.js` and add your credentials:

```javascript
const AppConfig = {
  supabase: {
    url: "https://your-project.supabase.co",
    anonKey: "your_supabase_anon_key_here",
  },
  paystack: {
    publicKey: "pk_test_your_paystack_public_key",
  },
  app: {
    name: "Femzy",
    environment: "development",
  },
};
```

## 🧪 Test Paystack Locally

1. Edit `js/config.js` with your test credentials
2. Go to Wallet page → Click "Add Funds"
3. Enter amount → Click "Pay Now"
4. Use test card: `4111 1111 1111 1111` / `05/25` / `123` / OTP: `123456`
5. Check Supabase database for payment record

## 🌐 Test Keys vs Live Keys

### Test Keys (pk_test_...)
- ✅ Free to test
- ✅ No real charges
- ✅ Appears in test dashboard
- ✅ Use for development

### Live Keys (pk_live_...)
- ⚠️ Real transactions
- ⚠️ Real charges
- ⚠️ Requires testing first
- ✅ Only for production

## 🔐 Never Do This

```javascript
// ❌ WRONG - Hardcoded keys
this.publicKey = "pk_test_xxxxx";

// ❌ WRONG - Committing js/config.js to GitHub
git add js/config.js

// ✅ RIGHT - Use AppConfig from js/config.js
const publicKey = window.AppConfig.paystack.publicKey;

// ✅ RIGHT - Keep js/config.js in .gitignore
git add .gitignore  # Make sure it contains: js/config.js
```

## 📝 File Organization

```
Your Project/
├── js/
│   ├── config.js               ← YOUR CREDENTIALS (edit this!)
│   ├── config.example.js       ← Reference example
│   ├── paystack-config.js      ← Configuration loader
│   ├── payment.js              ← Payment logic
│   └── supabase-config.js      ← Supabase config
├── dashboard/
│   ├── wallet.html             ← Payment UI
│   └── ... other pages
├── .gitignore                  ← js/config.js in here (don't commit!)
├── VANILLA_JS_SETUP.md         ← Vanilla JS guide
├── PAYSTACK_SETUP.md           ← Full setup guide
└── VERCEL_SETUP.md             ← Deployment guide
```

## 🚢 Deploying to Vercel

```
1. Commit code (without js/config.js - it's in .gitignore)
2. Push to GitHub
3. Go to vercel.com → Your Project → Settings → Environment Variables
4. Add for Production: VITE_PAYSTACK_PUBLIC_KEY=pk_live_xxxxx
5. Add for Preview/Staging: VITE_PAYSTACK_PUBLIC_KEY=pk_test_xxxxx
6. Redeploy your project
```

## 🆘 Common Issues

| Problem | Solution |
|---------|----------|
| "AppConfig is not defined" | Make sure `js/config.js` exists and loads first |
| "Key not configured" | Edit `js/config.js` and add your credentials |
| Modal doesn't appear | Check key format (must be `pk_test_` or `pk_live_`) |
| Wallet doesn't update | Check database tables exist, check Supabase policies |
| Can't process payment | Use `pk_test_` key for testing, not `pk_live_` |

## ✅ Production Checklist

- [ ] Edit `js/config.js` with real credentials ✓
- [ ] All database tables exist ✓
- [ ] `js/config.js` is in `.gitignore` ✓
- [ ] `js/config.example.js` committed for reference ✓
- [ ] Environment variables set in Vercel ✓
- [ ] Using `pk_live_` key in production ✓
- [ ] Using `pk_test_` key in preview ✓
- [ ] Error handling working ✓
- [ ] User feedback on success/failure ✓

## 📚 Documentation

- Quick Start: This file (you are here)
- Full guide: `VANILLA_JS_SETUP.md` (vanilla JS specific)
- Detailed setup: `PAYSTACK_SETUP.md`
- Deployment: `VERCEL_SETUP.md`
- Architecture: `ARCHITECTURE.md`

## 💡 Key Functions

```javascript
// Configuration is automatically loaded in all pages
// Check: window.AppConfig.paystack.publicKey
// Check: window.AppConfig.supabase.url

// In payment.js:
const paystack = new PaystackPayment();  // Reads from AppConfig
await paystack.initializePayment(amount, email, userId);

// Get payment status:
window.PaystackConfig.isConfigured();   // true/false
```

## 🎯 Next Steps

1. ✅ Edit `js/config.js` with your credentials
2. ✅ Test payment flow locally
3. ✅ Commit to GitHub (without `js/config.js`)
4. ✅ Deploy to Vercel
5. ✅ Set environment variables in Vercel
6. ✅ Switch to live keys for production
5. ✅ Deploy to Vercel with live key
6. 📌 Monitor transactions in Paystack dashboard
7. 📌 (Optional) Set up Paystack webhooks

---

**Last Updated**: February 18, 2026
**Status**: ✅ Ready to use

For detailed instructions, see `PAYSTACK_SETUP.md`
