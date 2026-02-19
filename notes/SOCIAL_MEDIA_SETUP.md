# Social Media Contact System & Profile Redesign - Setup Guide

## Overview

The Femzy application now includes a completely redesigned profile page and a new social media contact management system. This guide walks you through setup and usage.

## New Files Created

### 1. Database Schema (`db/social-media-links.sql`)

- Creates `social_media_links` table for storing social media URLs
- Creates `social_media_audit_log` table for tracking admin changes
- Includes RLS (Row Level Security) policies
- Adds trigger function for automatic audit logging
- Performance indexes on frequently queried columns

**Includes 5 default platforms:**

- Facebook (👍)
- Instagram (📸)
- TikTok (🎵)
- Telegram (✈️)
- WhatsApp (💬)

### 2. User-Facing Contact Page (`dashboard/contact.html`)

Beautiful social media contact page with:

- Dynamic loading of active social media links from database
- Responsive card grid layout
- Dark mode support
- Profile header integration
- "Coming Soon" badges for inactive platforms
- Easy click-to-visit functionality

### 3. Admin Management Page (`admin/social-media.html`)

Complete admin interface for managing social media links:

- View all platforms with status badges
- Edit URLs for each platform
- Toggle platforms active/inactive
- Real-time audit log showing recent changes
- Admin name and timestamp for each change
- Responsive mobile design
- Dark mode support

### 4. Updated Profile Page (`dashboard/profile.html`)

Modern, beautiful profile page featuring:

- **Gradient header** with animated profile avatar
- **Stats grid** showing:
  - Total Balance
  - Total Spent
  - Member Since (date)
  - Order Count
- **Personal Information Form** with:
  - Full Name
  - Username
  - Email (locked/verified)
  - Phone Number
  - Country
  - Save/Cancel buttons with visual feedback
- **Preferences Section** (Dark mode toggle)
- **Support Section** with links to:
  - WhatsApp support chat
  - Telegram channel
- **Security/Danger Zone** with:
  - Change Password option
  - Logout button
- Full dark mode CSS support
- Responsive mobile design with animations

## Setup Instructions

### Step 1: Execute SQL Script in Supabase

1. Go to [Supabase Dashboard](https://supabase.com) → Your Project → SQL Editor
2. Create a new query and paste the entire content of `db/social-media-links.sql`
3. Run the query to create tables, policies, and functions

**What gets created:**

- `social_media_links` table with 5 default platform rows (all inactive)
- `social_media_audit_log` table for tracking changes
- Admin-only RLS policies for management
- Public read-only access to active links only
- Audit trigger function

### Step 2: Verify Admin User

Ensure your admin user has the `is_admin` field set to `TRUE` in the `profiles` table:

```sql
UPDATE profiles
SET is_admin = TRUE
WHERE email = 'your-admin-email@example.com';
```

### Step 3: Access Admin Panel

1. Log in as admin user
2. Go to Admin Dashboard
3. Click **"Social Media Links"** in the sidebar
4. Begin managing your social media links

### Step 4: Configure Social Media Links

For each platform you want to use:

1. Find the platform card (Facebook, Instagram, TikTok, Telegram, WhatsApp)
2. Enter the full URL (must start with `http://` or `https://`)
3. Toggle the **Active** switch to show it on the public contact page
4. Click **Save URL**

Examples:

- Facebook: `https://www.facebook.com/yourpage`
- Instagram: `https://www.instagram.com/yourprofile`
- TikTok: `https://www.tiktok.com/@yourprofile`
- Telegram: `https://t.me/yourgroup`
- WhatsApp: `https://wa.me/2349012726301`

### Step 5: Users Access Contact Page

1. Users navigate to **Contact Us** link in dashboard sidebar
2. They see all active social media platforms with buttons
3. Clicking a platform opens it in a new window

## Technical Architecture

### Database Schema

**social_media_links Table:**

```sql
id (UUID) - Primary key
platform (TEXT) - Facebook, Instagram, TikTok, Telegram, WhatsApp
url (TEXT) - The actual social media link/profile URL
icon_emoji (TEXT) - Display emoji (👍, 📸, etc.)
active (BOOLEAN) - Whether to show on public contact page
display_order (INTEGER) - Sort order in grid
created_at (TIMESTAMP) - Creation date
updated_at (TIMESTAMP) - Last update date
updated_by (UUID) - Admin who made the change
```

**social_media_audit_log Table:**

```sql
id (UUID) - Primary key
link_id (UUID) - Reference to social_media_links
admin_id (UUID) - Admin who made the change
action (TEXT) - CREATE, UPDATE, DELETE, ACTIVATE, DEACTIVATE
old_value (JSON) - Previous values
new_value (JSON) - New values
created_at (TIMESTAMP) - When change occurred
```

### Security (RLS Policies)

✅ **Public Users:**

- Can SELECT only ACTIVE social media links

✅ **Admin Users:**

- Can SELECT all social media links (active or inactive)
- Can UPDATE links (URL, status, display order)
- Can DELETE links
- Can INSERT new links
- Can view all audit logs

### API Functions (in `js/admin.js`)

```javascript
// Get all social media links
getSocialMediaLinks();

// Update a link (URL and status)
updateSocialMediaLink(linkId, url, isActive);

// Get audit log
getSocialMediaAuditLog((limit = 20));
```

All functions are exported to `window` for global access.

## Profile Features

### Authentication & Authorization

- Auto-checks if user is logged in
- Redirects to login if not authenticated
- Displays user-specific data only

### Real-Time Data Sync

- Loads profile information on page load
- Updates wallet balance dynamically
- Shows transaction count
- Displays member since date

### Form Validation

- Email field locked (shows as verified)
- Phone number accepts international formats
- All fields have visual feedback on focus
- Cancel button only shows when form is modified

### Payment Integration

- "Add Funds" button triggers Paystack payment
- Wallet updates after successful payment
- Uses existing payment.js integration

### Theme Support

- Dark mode toggle with localStorage persistence
- All colors use CSS variables for easy theming
- Responsive design works on all screen sizes

## User Experience

### Contact Page Flow

1. User clicks "Contact Us" in dashboard sidebar
2. Loads beautifully designed contact page
3. Shows only ACTIVE social media platforms
4. Can click any platform to visit in new window
5. Supports all devices (responsive design)
6. Works in dark mode

### Admin Management Flow

1. Admin logs in and accesses Admin Dashboard
2. Clicks "Social Media Links" in sidebar
3. Sees all 5 platforms with their status
4. Can edit URLs and toggle status
5. Changes are logged automatically
6. Can view audit log showing all changes with admin names and timestamps

### Profile Management Flow

1. User goes to Profile page
2. Sees beautiful header with avatar and stats
3. Can edit personal info (except email)
4. Can change password
5. Can logout securely
6. Can access support channels

## Styling & Design

### Color Scheme

- **Primary Gradient:** `#00d4aa` → `#00b894` (teal)
- **Text:** `#1a3a3a` (dark) / `#cbd5e0` (light dark mode)
- **Borders:** `rgba(0, 212, 170, 0.15)` (subtle)
- **Backgrounds:** Gradient overlays for modern look

### Animations

- Smooth card hover effects (translate + shadow)
- Button hover animations
- Form input focus effects
- Smooth transitions between states
- Loading spinner animation

### Responsive Breakpoints

- Desktop: Full multi-column grid
- Tablet: 2-column layout
- Mobile: Single column, optimized spacing

## Troubleshooting

### "You do not have permission to access this page"

**Cause:** User is not an admin
**Fix:** Update their `is_admin` field to `TRUE` in Supabase

### Social media links not showing on contact page

**Cause:** Links might be inactive
**Fix:** Check admin panel and toggle the `active` switch for each platform

### Changes not reflecting immediately

**Cause:** Browser cache
**Fix:** Hard refresh (Cmd+Shift+R or Ctrl+Shift+R)

### Audit log not showing

**Cause:** No changes have been made yet
**Fix:** Make a change to any social media link to generate audit log entry

## Future Enhancements

Potential improvements:

- QR codes for social media profiles
- Custom emoji per platform instead of defaults
- View analytics on clicks per platform
- Set custom display text per platform
- Bulk import/export of links
- Link preview on hover
- Analytics dashboard showing engagement by platform

## Support

For issues or questions:

1. Check browser console (F12) for errors
2. Verify SQL script ran successfully in Supabase
3. Ensure admin user has `is_admin = TRUE`
4. Check RLS policies are enabled
5. Clear browser cache and try again

## Files Modified

- ✅ `dashboard/profile.html` - Already redesigned with modern UI
- ✅ `dashboard/index.html` - Added "Contact Us" link pointing to contact.html
- ✅ `admin/index.html` - Added "Social Media Links" menu item
- ✅ `js/admin.js` - Added social media management functions

## Files Created

- ✅ `db/social-media-links.sql` - Complete database schema
- ✅ `dashboard/contact.html` - User-facing contact page
- ✅ `admin/social-media.html` - Admin management interface

---

**Version:** 1.0
**Last Updated:** 2024
**Status:** Production Ready ✅
