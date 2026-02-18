# Paystack Integration Setup - Vanilla JavaScript Version

This guide is for vanilla JavaScript projects (no build tools like Vite).

## Quick Start - 3 Steps

### Step 1: Edit Configuration File
Edit `js/config.js` and add your credentials:

```javascript
const AppConfig = {
  supabase: {
    url: "https://your-project.supabase.co",
    anonKey: "your_supabase_anon_key_here",
  },
  paystack: {
    publicKey: "pk_test_your_paystack_public_key_here",
  },
  app: {
    name: "Femzy",
    environment: "development",
  },
};
```

### Step 2: Get Your Credentials

**Supabase** (free tier available):
1. Go to https://app.supabase.com
2. Create/select your project
3. Go to Settings → API
4. Copy "Project URL" and "anon public" key
5. Paste into `js/config.js`

**Paystack** (free account):
1. Go to https://dashboard.paystack.com
2. Sign up or log in
3. Go to Settings → API Keys & Webhooks
4. Copy "Public Key" (starts with `pk_test_` for testing)
5. Paste into `js/config.js`

### Step 3: Test It
1. Open your wallet page
2. Click "Add Funds"
3. Enter amount and click "Pay Now"
4. Use test card: `4111 1111 1111 1111`
5. Expiry: `05/25`, CVV: `123`, OTP: `123456`
6. Check your Supabase database for the payment record

---

## File Structure

```
js/
├── config.js                ✓ Your credentials go here (edit this!)
├── paystack-config.js       ✓ Reads from config.js
├── supabase-config.js       ✓ Reads from config.js
├── payment.js               ✓ Payment logic
├── dashboard.js             ✓ Dashboard utilities
└── ... other files

All HTML files now load:
  1. config.js (first!)
  2. supabase-config.js
  3. paystack-config.js
  4. payment.js
  5. dashboard.js
```

---

## How It Works

### Local Development
```
1. Browser loads HTML
   ↓
2. Loads config.js
   • Sets window.AppConfig with your credentials
   ↓
3. Loads supabase-config.js
   • Reads from window.AppConfig.supabase
   ↓
4. Loads paystack-config.js
   • Reads from window.AppConfig.paystack
   ↓
5. Ready to use!
```

### Production (Vercel)
```
1. Vercel sets environment variables
   ↓
2. Build process injects into window
   ↓
3. config.js fallback reads window variables
   ↓
4. Ready to use!
```

---

## Configuration Priority

When loading credentials, this is the order:

1. **`window.AppConfig`** (from `js/config.js`) ← Used in local development
2. **`window.__SUPABASE_URL__`** (Vercel injection) ← Used in production
3. **Error** if none found

Same for Paystack:
1. **`window.AppConfig.paystack.publicKey`** ← Local
2. **`window.__PAYSTACK_PUBLIC_KEY__`** ← Production
3. **Error** if not configured

---

## Deploying to Vercel

### Step 1: Add to `.gitignore`
Make sure `js/config.js` is in `.gitignore` (already is):
```
js/config.js
```

Create a `js/config.example.js` for reference:
```javascript
const AppConfig = {
  supabase: {
    url: "https://your-project.supabase.co",
    anonKey: "your_anon_key_here",
  },
  paystack: {
    publicKey: "pk_test_your_key_here",
  },
  app: {
    name: "Femzy",
    environment: "development",
  },
};
```

### Step 2: Push to GitHub
```bash
git add .
git commit -m "Add Paystack integration for vanilla JS"
git push origin main
```

### Step 3: Configure Vercel
1. Go to vercel.com → Your Project
2. Settings → Environment Variables
3. Add these variables:

**For All Environments** (or customize per environment):
- `VITE_SUPABASE_URL` = `https://your-project.supabase.co`
- `VITE_SUPABASE_ANON_KEY` = `your_anon_key`
- `VITE_PAYSTACK_PUBLIC_KEY` = `pk_live_your_key` (use pk_live_ for production!)

### Step 4: Redeploy
1. Go to Deployments
2. Click three dots on latest deployment
3. Select "Redeploy"
4. Vercel will inject environment variables and deploy

---

## Creating Production Configuration

For Vercel, you need a way to inject environment variables. Here's a simple method:

### Option 1: Use Vercel's Environment Variables (Recommended)

Vercel automatically injects environment variables prefixed with `VITE_` into window variables:
- `VITE_SUPABASE_URL` → `window.__SUPABASE_URL__`
- `VITE_SUPABASE_ANON_KEY` → `window.__SUPABASE_ANON_KEY__`
- `VITE_PAYSTACK_PUBLIC_KEY` → `window.__PAYSTACK_PUBLIC_KEY__`

### Option 2: Create a Config Script for Vercel

Create `js/config.prod.js` (optional):
```javascript
// This is generated during Vercel build
// It reads environment variables and sets window.AppConfig
const AppConfig = {
  supabase: {
    url: window.__SUPABASE_URL__ || "https://your-project.supabase.co",
    anonKey: window.__SUPABASE_ANON_KEY__ || "your_anon_key",
  },
  paystack: {
    publicKey: window.__PAYSTACK_PUBLIC_KEY__ || "pk_test_xxx",
  },
  app: {
    name: "Femzy",
    environment: window.__ENVIRONMENT__ || "production",
  },
};
```

Then load this in production HTML instead of config.js.

---

## Security Best Practices

✅ **DO:**
- Store credentials in `js/config.js` for local development
- Keep `js/config.js` in `.gitignore` (never commit!)
- Use different keys for dev/production
- Use `pk_test_` keys for testing
- Use `pk_live_` keys for production only
- Rotate keys regularly

❌ **DON'T:**
- Commit `js/config.js` to GitHub
- Hardcode keys in HTML/JS files
- Share your config.js file
- Use live keys while testing
- Use test keys in production

---

## Troubleshooting

### Issue: "AppConfig is not defined"
**Cause**: `config.js` not loaded or wrong order
**Fix**: Make sure `config.js` is loaded FIRST in your HTML:
```html
<script src="../js/config.js"></script>
<script src="../js/supabase-config.js"></script>
```

### Issue: "Paystack public key not found"
**Cause**: `window.AppConfig.paystack.publicKey` not set
**Fix**: Edit `js/config.js` and add your key:
```javascript
paystack: {
  publicKey: "pk_test_your_key",
}
```

### Issue: Payment modal doesn't appear
**Cause**: Paystack key misconfigured
**Fix**: 
1. Check browser console for errors
2. Verify key starts with `pk_test_` or `pk_live_`
3. Try test card in test mode

### Issue: "Payment verification failed"
**Cause**: Database tables don't exist or wrong configuration
**Fix**:
1. Check Supabase has these tables: `payment_history`, `wallets`, `transactions`
2. Check Supabase credentials in `js/config.js`
3. Check browser console for full error

---

## Testing Checklist

- [ ] Edit `js/config.js` with real credentials
- [ ] Supabase URL correct
- [ ] Supabase key correct
- [ ] Paystack key correct (starts with `pk_test_`)
- [ ] Open wallet page without errors
- [ ] "Add Funds" button works
- [ ] Paystack modal appears
- [ ] Can enter test card details
- [ ] Payment succeeds
- [ ] Database updated with payment record
- [ ] Wallet balance increases
- [ ] Transaction shown in history

---

## Production Checklist

- [ ] All local tests pass with test keys
- [ ] `js/config.js` is in `.gitignore`
- [ ] `js/config.example.js` committed for reference
- [ ] Environment variables set in Vercel
- [ ] Vercel using `pk_live_` key in production
- [ ] Vercel using `pk_test_` key in preview/staging
- [ ] First test payment made and verified
- [ ] Paystack dashboard monitored for transactions
- [ ] Error handling tested
- [ ] Ready for production traffic

---

## File Summary

### New/Modified Files

| File | Purpose | Status |
|------|---------|--------|
| `js/config.js` | ✨ Your credentials (EDIT THIS) | Setup required |
| `js/paystack-config.js` | Reads from config.js | Ready |
| `js/supabase-config.js` | Updated for vanilla JS | Ready |
| `js/payment.js` | Paystack payment logic | Ready |
| All dashboard `.html` files | Load config.js first | Updated |

### Documentation Files

- `VANILLA_JS_SETUP.md` - This file (quick start)
- `PAYSTACK_SETUP.md` - Detailed setup guide
- `ARCHITECTURE.md` - System diagrams
- `INTEGRATION_SUMMARY.md` - Overview of all changes

---

## Next Steps

1. ✅ Edit `js/config.js` with your credentials
2. ✅ Test locally with test cards
3. ✅ Deploy to Vercel
4. ✅ Set environment variables in Vercel
5. ✅ Switch to live keys (`pk_live_`)
6. ✅ Monitor Paystack dashboard

---

## Support

- Paystack Docs: https://paystack.com/docs
- Supabase Docs: https://supabase.com/docs
- See `PAYSTACK_SETUP.md` for detailed troubleshooting

**Version**: 1.0 (Vanilla JavaScript)
**Updated**: February 18, 2026
