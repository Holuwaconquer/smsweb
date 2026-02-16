# Vercel Deployment Setup Guide

This guide explains how to securely deploy the BasedSMS application to Vercel with environment variables.

## Local Development Setup

### 1. Create .env.local file

Copy `.env.example` to `.env.local` and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

Get your credentials from [Supabase Dashboard](https://app.supabase.com):

1. Go to your project
2. Click on "Settings" → "API"
3. Copy the "Project URL" and "anon public" key

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
   - Add two variables:
     - Name: `VITE_SUPABASE_URL`
       Value: `https://your-project.supabase.co`
     - Name: `VITE_SUPABASE_ANON_KEY`
       Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

4. **Deploy**:
   - Click "Deploy"
   - Vercel will build and deploy automatically

### Option 2: Using Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Set environment variables in the CLI prompt
```

---

## Security Best Practices

✅ **DO:**

- Store API keys in `.env` files (never commit them)
- Use Vercel's Environment Variables for production
- Keep `.env.local` in `.gitignore`
- Rotate your API keys regularly
- Use different keys for dev/staging/production

❌ **DON'T:**

- Commit `.env` files to GitHub
- Share API keys in messages or emails
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
