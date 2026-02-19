# Complete Payment Integration Setup

This guide will help you set up the complete payment system with Supabase database integration.

## 🗄️ Required Database Tables

Create these tables in your Supabase database:

### 1. **payment_history** Table
```sql
CREATE TABLE payment_history (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  reference VARCHAR(255) NOT NULL UNIQUE,
  amount DECIMAL(15, 2) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',  -- pending, success, failed
  payment_method VARCHAR(50) NOT NULL DEFAULT 'paystack',
  paystack_reference VARCHAR(255),
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for faster queries
CREATE INDEX idx_payment_history_user_id ON payment_history(user_id);
CREATE INDEX idx_payment_history_reference ON payment_history(reference);
CREATE INDEX idx_payment_history_status ON payment_history(status);
```

### 2. **wallets** Table
```sql
CREATE TABLE wallets (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id),
  balance DECIMAL(15, 2) NOT NULL DEFAULT 0,
  total_added DECIMAL(15, 2) NOT NULL DEFAULT 0,
  total_spent DECIMAL(15, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index
CREATE INDEX idx_wallets_user_id ON wallets(user_id);
```

### 3. **transactions** Table
```sql
CREATE TABLE transactions (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  type VARCHAR(50) NOT NULL,  -- credit, debit
  amount DECIMAL(15, 2) NOT NULL,
  description TEXT,
  reference VARCHAR(255),
  status VARCHAR(50) NOT NULL DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_type ON transactions(type);
```

## ✅ Setup Steps

### Step 1: Create Tables in Supabase
1. Go to https://app.supabase.com
2. Select your project
3. Go to **SQL Editor**
4. Copy and paste the SQL code above
5. Run each CREATE TABLE statement

### Step 2: Create RLS Policies (Row Level Security)

For security, add these policies:

```sql
-- payment_history policies
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payment history"
ON payment_history FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payment history"
ON payment_history FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payment history"
ON payment_history FOR UPDATE
USING (auth.uid() = user_id);

-- wallets policies
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own wallet"
ON wallets FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own wallet"
ON wallets FOR UPDATE
USING (auth.uid() = user_id);

-- transactions policies
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions"
ON transactions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions"
ON transactions FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

### Step 3: Update Your Paystack Config

Edit `js/config.js` with your **actual Paystack public key**:

```javascript
const AppConfig = {
  supabase: {
    url: "https://your-actual-url.supabase.co",
    anonKey: "your-actual-anon-key",
  },
  paystack: {
    publicKey: "pk_test_YOUR_ACTUAL_KEY",  // ← Replace with real key
  },
  app: {
    name: "Femzy",
    environment: "development",
  },
};
```

### Step 4: Test the Integration

1. **Open your wallet page**
   - Go to Dashboard → Wallet

2. **Make a test payment**
   - Click "Add Funds"
   - Enter amount (minimum ₦100)
   - Click "Pay Now"
   - Use test card: `4111 1111 1111 1111`
   - Expiry: `05/25`, CVV: `123`, OTP: `123456`

3. **Verify the payment was recorded**
   - Check Supabase:
     - `payment_history` table should have a "success" record
     - `wallets` table should show updated balance
     - `transactions` table should show a "credit" entry

## 🔄 What Happens When User Pays

```
1. User clicks "Pay Now"
   ↓
2. Paystack modal opens
   ↓
3. User enters card details
   ↓
4. Payment processed by Paystack
   ↓
5. Paystack returns success (if approved)
   ↓
6. verifyPayment() called automatically
   ↓
7. Update payment_history → status to "success"
   ↓
8. Get current wallet balance
   ↓
9. Add payment amount to wallet → Update wallets table
   ↓
10. Create transaction record in transactions table
   ↓
11. Show success message to user
   ↓
12. Reload wallet page with new balance
```

## 📊 Testing Checklist

After setup, verify everything works:

- [ ] Tables created in Supabase
- [ ] RLS policies enabled
- [ ] `js/config.js` has real Paystack key
- [ ] Wallet page loads without errors
- [ ] Can click "Add Funds" and open modal
- [ ] Paystack modal appears after "Pay Now"
- [ ] Test payment completes without errors
- [ ] `payment_history` table has new record with status "success"
- [ ] `wallets` table shows updated balance
- [ ] `transactions` table has new credit entry
- [ ] Wallet page shows new balance immediately after payment
- [ ] Transaction appears in history table

## 🆘 Troubleshooting

### Payment shows success but balance doesn't update

**Cause:** Database query failed silently
**Fix:** 
1. Check browser console for JavaScript errors
2. Check Supabase table exists and has correct name
3. Check RLS policies aren't blocking writes
4. Enable query logging in Supabase

### "Cannot read properties of undefined" error

**Cause:** Missing database table or column
**Fix:**
1. Verify all three tables exist
2. Check column names match exactly (case-sensitive)
3. Check RLS policies allow the operation

### Payment verification hangs

**Cause:** Network timeout or Supabase connection issue
**Fix:**
1. Check internet connection
2. Verify Supabase URL in config.js is correct
3. Check Supabase token has correct permissions
4. Try again with smaller amount

## 💡 Key Features Included

✅ **Automatic Payment Verification**
- Paystack integration handles card processing
- Automatic wallet balance update on success
- Transaction record creation

✅ **Transaction History**
- All payments and transactions logged
- Clear records of credits and debits
- Reference numbers for tracking

✅ **Wallet Management**
- Live balance display
- Total amount added tracking
- Total amount spent tracking

✅ **Security**
- No payment processing on frontend
- RLS policies protect user data
- Reference numbers prevent duplicates

## 📱 Testing with Real Payments (Later)

Once you're confident with test payments:

1. Switch Paystack key to `pk_live_`
2. Update `js/config.js` with live key
3. Test with small real transaction
4. Monitor Paystack dashboard for transactions
5. Verify Supabase database updates

## 🎉 You're All Set!

Your payment integration is now complete. Users can:
- ✅ Add funds to their wallet via Paystack
- ✅ See balance update instantly
- ✅ View transaction history
- ✅ Track total added and spent

---

**Need help?** Check the console (F12) for detailed error messages. All functions have console.log statements to help debug!
