# Vercel Deployment Setup Guide

This guide explains how to securely deploy the Femzy application to Vercel with environment variables.

## Local Development Setup

### 1. Create .env.local file

Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# Paystack Configuration
VITE_PAYSTACK_PUBLIC_KEY=pk_test_your_test_key_here
```

### Getting Your Credentials

#### Supabase
Get your credentials from [Supabase Dashboard](https://app.supabase.com):
1. Go to your project
2. Click on "Settings" → "API"
3. Copy the "Project URL" and "anon public" key

#### Paystack
Get your credentials from [Paystack Dashboard](https://dashboard.paystack.com):
1. Go to "Settings" → "API Keys & Webhooks"
2. Copy your **Public Key** (starts with `pk_test_` or `pk_live_`)
3. **Important**: For client-side integration, only use the PUBLIC key
4. Keep your SECRET key safe - never expose it to frontend (only for serverless functions)

### 2. Install Dependencies (if using build tool)

```bash
npm install
```

### 3. Run Locally

```bash
npm run dev
```

---

## Vercel Deployment Setup

### Option 1: Using Vercel Dashboard (Recommended for Static Site)

Since this is a static HTML/CSS/JS site:

1. **Push your code to GitHub** (without `.env.local` - it's in `.gitignore`)

2. **Connect to Vercel**:

   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Select your GitHub repository
   - Click "Import"

3. **Set Environment Variables**:

   - In the Vercel project dashboard, go to **Settings → Environment Variables**
   - Add the following variables for **All Environments** (Production, Preview, Development):

   **Supabase:**
   - Name: `VITE_SUPABASE_URL`
     Value: `https://your-project.supabase.co`
   - Name: `VITE_SUPABASE_ANON_KEY`
     Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

   **Paystack:**
   - Name: `VITE_PAYSTACK_PUBLIC_KEY`
     Value: `pk_live_your_live_public_key_here` (for production)
     
   **For Preview/Development:**
   - Use test keys instead:
     - `pk_test_your_test_key_here`

4. **Deploy**:
   - Click "Deploy"
   - Vercel will deploy automatically
   - Your environment variables will be injected during build

### Option 2: Using Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy with environment variables
vercel --env VITE_SUPABASE_URL=https://... --env VITE_SUPABASE_ANON_KEY=... --env VITE_PAYSTACK_PUBLIC_KEY=pk_live_...
```

---

## Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | `https://bsgrvwykbyqunlvlqvnt.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous public key | `eyJhbGciOiJIUzI1NiI...` |
| `VITE_PAYSTACK_PUBLIC_KEY` | Paystack public key (client-safe) | `pk_live_1234567890...` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_APP_NAME` | Application name | `Femzy` |
| `VITE_APP_ENVIRONMENT` | Environment mode | `production` |

---

## Testing Paystack Integration

### 1. Using Test Keys (FREE - No real charges)

Before going live, test with Paystack test keys:
- **Test Public Key**: Starts with `pk_test_`
- **Test Card**: 
  - Card number: `4111 1111 1111 1111`
  - Expiry: Any future date (e.g., 05/25)
  - CVV: Any 3 digits (e.g., 123)
  - OTP: `123456`

### 2. Using Live Keys (Real Transactions)

Once you've tested thoroughly:
- Update `VITE_PAYSTACK_PUBLIC_KEY` to your live key (starts with `pk_live_`)
- Verify all payment flows work correctly
- Monitor transactions in Paystack dashboard

---

## Security Best Practices

✅ **DO:**

- Store API keys in `.env` files locally (never commit them)
- Use Vercel's Environment Variables for production
- Keep `.env.local` in `.gitignore`
- Rotate your API keys regularly
- Use **different keys** for dev/staging/production
- Use Paystack **PUBLIC key** only for frontend
- Keep Paystack **SECRET key** only on your backend/serverless functions
- Verify payments on a secure backend before crediting users

❌ **DON'T:**

- Commit `.env` files to GitHub
- Share API keys in messages or emails
- Expose Paystack SECRET key in frontend code
- Use test keys in production
- Use production keys while testing

---

## Testing Locally

1. Create `.env.local` with test keys
2. Run your development server
3. Test payment flow in wallet page
4. Check Paystack dashboard for test transactions

All test transactions appear in your Paystack dashboard under "Test Balance".
- Use the same keys across multiple environments
- Log sensitive credentials to console

---

## Troubleshooting

### "Supabase configuration not found" Error

This means environment variables aren't set. Check:

1. `.env.local` exists for local development
2. Environment variables are set in Vercel dashboard for production
3. Variable names are exactly: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

### Building with Environment Variables

For static sites, ensure your build process includes environment variable interpolation:

```bash
# The build command should include environment variable substitution
# Standard npm/vite build handles this automatically
npm run build
```

---

## Environment Variable Reference

| Variable               | Example                   | Source                                                |
| ---------------------- | ------------------------- | ----------------------------------------------------- |
| VITE_SUPABASE_URL      | https://xxxxx.supabase.co | Supabase Dashboard → Settings → API → Project URL     |
| VITE_SUPABASE_ANON_KEY | eyJhbGc...                | Supabase Dashboard → Settings → API → anon public key |

---

## More Information

- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Supabase API Keys](https://supabase.com/docs/guides/api-keys)
- [Securing Frontend Apps](https://supabase.com/docs/guides/auth/frontend-settings)
