# Paystack Integration Setup Guide

This guide walks you through setting up Paystack payment integration in your Femzy SMS web application.

## Quick Start

### Step 1: Get Paystack Credentials

1. Go to [https://dashboard.paystack.com](https://dashboard.paystack.com)
2. Create a free account or sign in
3. Navigate to **Settings → API Keys & Webhooks**
4. You'll see:
   - **PUBLIC KEY** (starts with `pk_test_` or `pk_live_`)
   - **SECRET KEY** (starts with `sk_test_` or `sk_live_`)

### Step 2: Set Up Local Environment Variables

1. Copy the `.env.example` file to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and add your keys:
   ```
   # Supabase Configuration
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key_here

   # Paystack Configuration (Test Keys - for development)
   VITE_PAYSTACK_PUBLIC_KEY=pk_test_your_test_public_key_here
   ```

3. **Important**: Never commit `.env.local` to GitHub - it's already in `.gitignore`

### Step 3: Test Locally

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to the **Wallet** page in your dashboard
3. Click **"+ Add Funds"**
4. Enter an amount (minimum ₦100)
5. Enter your email and click **"Pay Now"**
6. Use Paystack test card:
   - **Card Number**: `4111 1111 1111 1111`
   - **Expiry**: Any future date (e.g., 05/25)
   - **CVV**: Any 3 digits (e.g., 123)
   - **OTP**: `123456`

7. Check your Supabase database:
   - `payment_history` table should show the transaction
   - `wallets` table should show updated balance
   - `transactions` table should have a credit entry

---

## Environment Variables Explained

### For Development (Test Keys)

```
VITE_PAYSTACK_PUBLIC_KEY=pk_test_1234567890abcdef
```

- Use this for local development and testing
- No real money is charged with test keys
- Test transactions appear in your Paystack test dashboard

### For Production (Live Keys)

```
VITE_PAYSTACK_PUBLIC_KEY=pk_live_abcdef1234567890
```

- Use only after thoroughly testing with test keys
- Real transactions will be charged to customer's card
- Won't be charged to customer until payment is verified

---

## Project Structure

### New Files Created

```
js/
├── paystack-config.js        ← Manages Paystack configuration
└── payment.js                 ← Paystack payment logic (updated)

.env.example                   ← Template for environment variables
.gitignore                     ← Prevents committing .env files
```

### Files Modified

```
VERCEL_SETUP.md               ← Added Paystack deployment instructions
dashboard/wallet.html          ← Connected to Paystack payment system
```

---

## How It Works

### 1. **Configuration Loading** (`paystack-config.js`)
- Reads `VITE_PAYSTACK_PUBLIC_KEY` from environment
- Validates the key format (must start with `pk_`)
- Detects test vs. live mode automatically
- Makes key globally available as `PaystackConfig`

### 2. **Payment Initialization** (`payment.js`)
```javascript
// User clicks "Pay Now"
const paystack = new PaystackPayment();
const result = await paystack.initializePayment(
  amount,      // Amount in Naira
  email,       // User's email
  userId       // User ID
);
```

### 3. **Payment Flow**
1. User enters amount and clicks "Pay Now"
2. Payment record created in Supabase with status "pending"
3. Paystack modal opens for card entry
4. User enters card details
5. Paystack handles payment processing
6. On success:
   - Payment status updated to "success"
   - User wallet balance increased
   - Transaction recorded
   - User activity logged
7. On failure:
   - Payment status updated to "failed"
   - Transaction not recorded
   - Supabase remains unchanged

### 4. **Payment Verification**
- Done in `PaystackPayment.verifyPayment()` method
- Updates database after successful payment
- **Note**: For production, you should verify payments on a secure backend:
  1. Get payment reference from client
  2. Call Paystack API with SECRET key to verify
  3. Update database only if verified
  4. Return result to client

---

## Required Database Tables

Make sure your Supabase database has these tables:

### `payment_history`
```sql
CREATE TABLE payment_history (
  id BIGINT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  reference VARCHAR(255) UNIQUE,
  amount DECIMAL(10, 2),
  status VARCHAR(50), -- pending, success, failed
  payment_method VARCHAR(50), -- paystack, stripe, etc.
  paystack_reference VARCHAR(255),
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### `wallets`
```sql
CREATE TABLE wallets (
  id BIGINT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) UNIQUE,
  balance DECIMAL(10, 2) DEFAULT 0,
  total_added DECIMAL(10, 2) DEFAULT 0,
  total_spent DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### `transactions`
```sql
CREATE TABLE transactions (
  id BIGINT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  type VARCHAR(50), -- credit, debit
  amount DECIMAL(10, 2),
  description TEXT,
  reference VARCHAR(255),
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Deploying to Vercel

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Add Paystack integration with environment variables"
git push origin main
```

### Step 2: Configure Environment Variables in Vercel

1. Go to [vercel.com](https://vercel.com)
2. Select your project
3. Go to **Settings → Environment Variables**
4. Add the following for each environment:

**All Environments** (or configure per environment):

| Variable | Development Value | Production Value |
|----------|-------------------|------------------|
| `VITE_SUPABASE_URL` | `https://your-project.supabase.co` | `https://your-project.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Your test key | Your test key |
| `VITE_PAYSTACK_PUBLIC_KEY` | `pk_test_...` | `pk_live_...` |

### Step 3: Redeploy

1. Go to **Deployments**
2. Click the three dots on the latest deployment
3. Select **"Redeploy"**
4. Vercel will inject your environment variables and redeploy

---

## Testing Paystack Integration

### Local Testing Checklist

- [ ] `.env.local` created with test keys
- [ ] Can navigate to Wallet page
- [ ] "Add Funds" button opens modal
- [ ] Can enter amount and click "Pay Now"
- [ ] Paystack modal appears
- [ ] Can enter test card details (see below)
- [ ] Payment succeeds and wallet updates
- [ ] Payment appears in Supabase `payment_history` table
- [ ] Wallet balance in `wallets` table updated
- [ ] Transaction logged in `transactions` table

### Production Testing Checklist (Before Going Live)

- [ ] Environment variables set in Vercel
- [ ] All local tests pass with live keys
- [ ] Make test transaction with actual card (if applicable)
- [ ] Check Paystack dashboard for the transaction
- [ ] Verify database updates correctly
- [ ] Test error scenarios (wrong card, declined card, etc.)
- [ ] Verify payment verification logic works

---

## Test Card Details

| Field | Value |
|-------|-------|
| Card Number | `4111 1111 1111 1111` |
| Expiry Month | `05` (or any future month) |
| Expiry Year | `25` (or any future year) |
| CVV | `123` (or any 3 digits) |
| PAN | `12345` (or any 5 digits) |
| OTP | `123456` (or any 6 digits) |
| Phone | `0315884330` (or any number) |

---

## Troubleshooting

### Issue: "Paystack is not properly configured"
**Cause**: `VITE_PAYSTACK_PUBLIC_KEY` not set in environment
**Solution**: 
1. Create `.env.local` file
2. Add `VITE_PAYSTACK_PUBLIC_KEY=pk_test_your_key`
3. Restart development server

### Issue: Paystack modal doesn't appear
**Cause**: Paystack script not loading or `PaystackPop` not initialized
**Solution**:
1. Check browser console for errors
2. Verify internet connection (Paystack needs CDN access)
3. Try opening in incognito mode (check for extensions blocking)

### Issue: Payment succeeds but wallet doesn't update
**Cause**: Database tables don't exist or permission issue
**Solution**:
1. Check if `payment_history`, `wallets`, `transactions` tables exist
2. Verify Supabase policies allow writes
3. Check browser console for Supabase errors

### Issue: Can't verify test payment
**Cause**: Using live key in test mode or invalid reference
**Solution**:
1. Make sure you're using `pk_test_` key for testing
2. Check Paystack dashboard to confirm payment went through
3. Look for error in browser console

### Issue: Get secret key error
**Cause**: Frontend trying to access SECRET key
**Solution**:
1. Only use PUBLIC key in frontend code
2. SECRET key is for backend only
3. Never expose SECRET key to client

---

## Best Practices

### Security

1. **Never hard-code API keys** - Always use environment variables
2. **Use PUBLIC key only in frontend** - SECRET key for backend only
3. **Verify payments on backend** - Don't trust client verification alone
4. **Rotate keys regularly** - Every 6 months or after team changes
5. **Use different keys per environment** - Test keys for dev, live keys for production

### Development

1. **Test thoroughly with test keys** - Before going live
2. **Handle all error cases** - Network errors, user cancellation, etc.
3. **Log transactions** - For debugging and auditing
4. **Update user immediately** - Show success/error feedback
5. **Save payment reference** - For support and reconciliation

### Deployment

1. **Use environment variables** - Never hard-code production keys
2. **Keep `.env` out of git** - It's in `.gitignore`
3. **Different keys per environment** - Dev, staging, production
4. **Monitor Paystack dashboard** - Track transaction volume and issues
5. **Set up webhooks** - For async payment status updates (optional)

---

## Next Steps

1. ✅ Set up local environment variables
2. ✅ Test payment flow locally
3. ✅ Deploy to Vercel with environment variables
4. ✅ Test in production with test keys
5. ✅ Switch to live keys and monitor transactions
6. Consider setting up Paystack webhooks for payment confirmations
7. Consider adding real-time SMS notifications for payments

---

## Support

- **Paystack Documentation**: https://paystack.com/docs
- **Paystack Support**: https://support.paystack.com
- **Supabase Documentation**: https://supabase.com/docs

## Files Modified Summary

| File | Changes |
|------|---------|
| `js/payment.js` | Updated to read PAYSTACK_PUBLIC_KEY from environment |
| `js/paystack-config.js` | ✨ NEW - Manages Paystack config and validation |
| `dashboard/wallet.html` | Added paystack-config.js script, fixed payment initialization |
| `.env.example` | ✨ NEW - Template for environment variables |
| `.gitignore` | ✨ NEW - Prevents committing sensitive files |
| `VERCEL_SETUP.md` | Added comprehensive Paystack deployment guide |
