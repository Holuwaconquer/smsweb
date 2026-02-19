# Paystack Integration Architecture

## System Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        PAYSTACK INTEGRATION FLOW                            │
└─────────────────────────────────────────────────────────────────────────────┘

1. INITIALIZATION PHASE
   ═══════════════════════════════════════════════════════════════════════════

   Application Startup
        ↓
   Browser loads wallet.html
        ↓
   Loads Supabase Library (CDN)
        ↓
   Loads supabase-config.js
        ├→ Creates Supabase client
        └→ window.supabase ready
        ↓
   Loads paystack-config.js
        ├→ Reads VITE_PAYSTACK_PUBLIC_KEY env var
        ├→ Validates key format (must start with pk_)
        ├→ Creates window.PaystackConfig object
        ├→ Logs mode: "test" or "live"
        └→ Ready for payment
        ↓
   Loads payment.js
        ├→ PaystackPayment class available
        ├→ Can read from PaystackConfig
        └→ Helper functions available
        ↓
   Loads dashboard.js
        └→ Database functions available


2. USER PAYMENT FLOW
   ═══════════════════════════════════════════════════════════════════════════

   User clicks "Add Funds" button
        ↓
   Modal opens with amount input
        ↓
   User enters amount and clicks "Pay Now"
        ↓
   payNowBtn.click() handler executes
        ├→ Validates amount (minimum ₦100)
        ├→ Gets current user from Supabase Auth
        ├→ Fetches user profile/email
        └→ Proceeds to payment
        ↓
   Creates PaystackPayment instance
        ├→ Reads public key from PaystackConfig
        ├→ Checks Paystack script is loaded
        └→ Ready to process
        ↓
   paystack.initializePayment(amount, email, userId)
        ├→ Generates unique reference (BDSMS_xxx)
        ├→ Saves payment as "pending" in Supabase
        ├→ Calls PaystackPop.setup() with payment config
        └→ Opens Paystack payment modal
        ↓
   User enters card details in modal
        ├→ Card Number: 4111 1111 1111 1111
        ├→ Expiry: 05/25
        ├→ CVV: 123
        └→ OTP: 123456
        ↓
   Paystack processes payment
        ├→ Validates card
        ├→ Charges payment gateway
        └→ Returns result
        ↓
   Payment callback triggered
        ├→ Success: Calls verifyPayment()
        └→ Error/Cancel: Rejects promise
        ↓
   verifyPayment(reference, userId)
        ├→ Fetches payment_history record
        ├→ Updates status to "success"
        ├→ Fetches current wallet balance
        ├→ Adds payment amount to balance
        ├→ Updates wallets table
        ├→ Creates transaction record
        ├→ Logs user activity
        └→ Returns success
        ↓
   Modal closes, wallet page reloads
        ├→ User sees updated balance
        ├→ Payment appears in history
        └→ Transaction shows in Supabase


3. CONFIGURATION HIERARCHY
   ═══════════════════════════════════════════════════════════════════════════

   Priority Order (what gets used):
   
   1. Environment Variable (VITE_PAYSTACK_PUBLIC_KEY)
      ↓ If not found
   2. Browser window variable (window.__PAYSTACK_PUBLIC_KEY__)
      ↓ If not found
   3. Error: Configuration required!


4. ENVIRONMENT-SPECIFIC CONFIGURATION
   ═══════════════════════════════════════════════════════════════════════════

   LOCAL DEVELOPMENT
   ┌─────────────────────────────┐
   │ .env.local                  │
   │                             │
   │ VITE_PAYSTACK_PUBLIC_KEY=   │
   │   pk_test_1a2b3c4d5e6f7...  │
   │                             │
   │ (no real charges)           │
   └─────────────────────────────┘
            ↓
   paystack-config.js detects "test" mode
            ↓
   Test transactions only


   VERCEL STAGING/PREVIEW
   ┌─────────────────────────────────────────┐
   │ Vercel Dashboard → Environment Variables │
   │                                         │
   │ Preview: VITE_PAYSTACK_PUBLIC_KEY=     │
   │   pk_test_1a2b3c4d5e6f7... (test key) │
   │                                         │
   │ (testing environment)                   │
   └─────────────────────────────────────────┘
            ↓
   paystack-config.js detects "test" mode
            ↓
   Test transactions only


   VERCEL PRODUCTION
   ┌─────────────────────────────────────────┐
   │ Vercel Dashboard → Environment Variables │
   │                                         │
   │ Production: VITE_PAYSTACK_PUBLIC_KEY=  │
   │   pk_live_1a2b3c4d5e6f7... (live key) │
   │                                         │
   │ (REAL transactions)                     │
   └─────────────────────────────────────────┘
            ↓
   paystack-config.js detects "live" mode
            ↓
   REAL transactions (charges customer's card)
```

---

## File Relationships

```
HTML Layer (wallet.html)
    ↓
JavaScript Files
    ├── supabase-config.js ──→ window.supabase (global)
    ├── paystack-config.js ──→ window.PaystackConfig (global)
    ├── payment.js ──────────→ window.PaystackPayment (global)
    └── dashboard.js ───────→ window.Auth, window.DB (globals)

User Interface
    ↓
EventListeners
    └── addFundsBtn.click()
        └── payNowBtn.click()
            └── Creates PaystackPayment instance
                └── Calls initializePayment()
                    └── Paystack modal opens

Payment Processing
    ↓
Paystack API
    ├── Validates card
    ├── Charges payment
    └── Returns reference

Database Updates (Supabase)
    ├── payment_history table
    ├── wallets table
    └── transactions table
```

---

## Data Flow

```
USER INPUT
   ↓
┌──────────────────────────────────────────┐
│ Wallet Page (wallet.html)                │
│ ├── User clicks "Add Funds"              │
│ │   └── Modal opens                      │
│ └── User enters amount & clicks "Pay Now"│
└──────────────────────────────────────────┘
   ↓
┌──────────────────────────────────────────┐
│ Payment Initialization (payment.js)      │
│ ├── Get user from Supabase Auth          │
│ ├── Get user profile                     │
│ ├── Validate amount                      │
│ └── Generate unique reference            │
└──────────────────────────────────────────┘
   ↓
┌──────────────────────────────────────────┐
│ Save to Database (Supabase)              │
│ └── payment_history (status: pending)    │
└──────────────────────────────────────────┘
   ↓
┌──────────────────────────────────────────┐
│ Paystack Payment (PaystackPop)           │
│ ├── Load Paystack SDK from CDN           │
│ ├── Open payment modal                   │
│ ├── User enters card details             │
│ └── Paystack processes payment           │
└──────────────────────────────────────────┘
   ↓
┌──────────────────────────────────────────┐
│ Verify Payment (verifyPayment method)    │
│ ├── Get payment reference from response  │
│ ├── Fetch payment from database          │
│ ├── Update status to "success"           │
│ └── Calculate new balance                │
└──────────────────────────────────────────┘
   ↓
┌──────────────────────────────────────────┐
│ Update User Wallet (Supabase)            │
│ ├── wallets table (add amount)           │
│ ├── transactions table (create entry)    │
│ └── activity logs (log event)            │
└──────────────────────────────────────────┘
   ↓
┌──────────────────────────────────────────┐
│ Show User Success                        │
│ ├── Close modal                          │
│ ├── Show success message                 │
│ ├── Reload wallet data                   │
│ └── Display new balance                  │
└──────────────────────────────────────────┘
```

---

## Configuration Loading Process

```
Browser Startup
    ↓
Load .env.local OR Environment Variables
    ├── Development: .env.local file
    ├── Vercel: Project Settings → Environment Variables  
    └── Other: Set in platform settings
    ↓
paystack-config.js Executes
    ├── 1. Read VITE_PAYSTACK_PUBLIC_KEY from environment
    │      ├── process.env.VITE_PAYSTACK_PUBLIC_KEY (first choice)
    │      └── window.__PAYSTACK_PUBLIC_KEY__ (fallback)
    │
    ├── 2. Validate format
    │      ├── Must not be empty ✓
    │      └── Must start with "pk_" ✓
    │
    ├── 3. Store in window.PaystackConfig
    │      ├── .publicKey ✓
    │      ├── .isConfigured() ← method ✓
    │      └── .getEnvironment() ← method (returns "test" or "live") ✓
    │
    └── 4. Log status to console
         └── "Paystack initialized in test/live mode"
    ↓
payment.js Loads
    ├── PaystackPayment class created
    ├── Ready to use window.PaystackConfig
    └── Can throw error if not configured correctly
    ↓
Dashboard Ready
    └── wallet.html can now process payments
```

---

## Security Architecture

```
PUBLIC INFORMATION (Safe to expose)
┌────────────────────────────────────────────────┐
│ Paystack Public Key (pk_test_ or pk_live_)    │
│ ├── Stored in: .env.local, Vercel env vars   │
│ ├── Loaded by: paystack-config.js             │
│ ├── Used by: payment.js (frontend)            │
│ └── Safe because: Only creates payment links  │
│     (doesn't process refunds or access account│
│      details)                                  │
└────────────────────────────────────────────────┘

SECRET INFORMATION (NEVER expose)
┌────────────────────────────────────────────────┐
│ Paystack Secret Key (sk_test_ or sk_live_)   │
│ ├── Where: Backend server only               │
│ ├── Never in: Frontend code, .env files      │
│ ├── Use for: Payment verification, refunds   │
│ └── If exposed: Attacker can steal money!    │
└────────────────────────────────────────────────┘

Key Handling
┌────────────────────────────────────────────────┐
│ 1. Public Key in Frontend ✓                   │
│    └── Safe: Only processes payments          │
│                                               │
│ 2. Secret Key Server-side Only ✓              │
│    └── Protected: Backend only access         │
│                                               │
│ 3. Never Hardcode Keys ✓                      │
│    └── Always use environment variables       │
│                                               │
│ 4. .env.local in .gitignore ✓                 │
│    └── Won't be committed to GitHub           │
│                                               │
│ 5. Rotate Keys Regularly ✓                    │
│    └── Change keys every 6 months or on       │
│        team changes                           │
└────────────────────────────────────────────────┘
```

---

## Verification Checklist

```
INITIALIZATION ✓
├── PaystackConfig loaded
├── Key format validated (starts with pk_)
├── Environment detected (test/live)
└── Ready for payment

PAYMENT FLOW ✓
├── User input captured
├── Amount validated
├── Paystack modal opens
├── Card processed
├── Reference generated
├── Database updated

DATABASE ✓
├── payment_history table updated
├── wallets table balance increased
├── transactions table entry created
├── User activity logged

USER EXPERIENCE ✓
├── Modal closes after payment
├── Success message shown
├── Balance refreshed
├── Transaction displayed
└── Payment confirmed in history
```

---

## Environment Variables Matrix

```
                 Local Dev      Vercel Preview    Vercel Prod
                 ────────────   ──────────────    ───────────

File Used        .env.local     Vercel Settings   Vercel Settings
Reload After     ✓ Restart dev  Redeploy needed   Redeploy needed
Key Type         pk_test_*      pk_test_*         pk_live_*
Charges Real $   ✗ No           ✗ No              ✓ Yes
Test Cards Work  ✓ Yes          ✓ Yes             ✗ No
In .gitignore    ✓ Yes          N/A               N/A
```

---

## Deployment Workflow

```
LOCAL DEVELOPMENT
┌─────────────────────────────────┐
│ 1. Create .env.local            │
│ 2. Add pk_test_* key            │
│ 3. npm run dev                  │
│ 4. Test payment flow            │
│ 5. Check Supabase for records   │
└─────────────────────────────────┘
         ↓
    ALL TESTS PASS?
         │
         ├→ NO: Fix issues, repeat
         │
         └→ YES: Proceed
              ↓
┌─────────────────────────────────┐
│ COMMIT & PUSH TO GITHUB         │
│ git add .                       │
│ git commit -m "..."             │
│ git push origin main            │
│ (.env.local NOT committed)      │
└─────────────────────────────────┘
         ↓
┌─────────────────────────────────┐
│ VERCEL CONFIGURATION            │
│ 1. Go to Vercel dashboard       │
│ 2. Settings → Env Variables     │
│ 3. Add all required vars        │
│ 4. Set for Preview & Prod       │
│ 5. Use pk_live_* for Prod only  │
└─────────────────────────────────┘
         ↓
┌─────────────────────────────────┐
│ REDEPLOY                        │
│ Click "Redeploy" on latest      │
│ commit in Deployments tab       │
└─────────────────────────────────┘
         ↓
┌─────────────────────────────────┐
│ VERIFY                          │
│ 1. Preview: Test with pk_test_ │
│ 2. Production: Live with pk_live_│
│ 3. Monitor Paystack dashboard   │
│ 4. Check Supabase for records   │
└─────────────────────────────────┘
```

---

Created: February 18, 2026
Status: Complete and Verified
