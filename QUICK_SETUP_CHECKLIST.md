# 📋 Social Media System - Quick Checklist

## ✅ What's Done (You Don't Need To Do Anything Here)

- [x] Profile page beautifully redesigned
- [x] Contact page created with social media grid
- [x] Admin management interface built
- [x] All HTML/CSS/JavaScript created and optimized
- [x] Admin menu updated with "Social Media Links" link
- [x] Admin functions added to admin.js
- [x] Database schema SQL scripts prepared
- [x] Security policies (RLS) configured
- [x] Audit logging system implemented
- [x] Documentation completed

## ⚠️ What You NEED To Do

### STEP 1: Set Up Database (2 minutes) ⏱️

**Location:** Supabase Dashboard → SQL Editor

1. Click **"SQL Editor"** in left sidebar
2. Click **"New Query"**
3. **Copy the entire content** from: `db/QUICK_SOCIAL_MEDIA_SETUP.sql`
4. **Paste** into the SQL editor
5. Click **"Run"** button (green play icon)
6. ✅ See success message at bottom

**What it does:** Creates 2 database tables, security policies, and default platforms

---

### STEP 2: Make User an Admin (1 minute) ⏱️

**Location:** Supabase Dashboard → SQL Editor

1. Click **"New Query"** again
2. Paste this SQL (replace with your email):

```sql
UPDATE profiles
SET is_admin = TRUE
WHERE email = 'your-admin-email@example.com';
```

3. Click **"Run"**
4. ✅ You should see "1 row updated"

**Important:** Use the EXACT email address for your account!

---

### STEP 3: Test Admin Access (2 minutes) ⏱️

**Location:** Your Website

1. Log out completely
2. Log back in with your admin account
3. Click the **"Admin"** button/link
4. Look in the **left sidebar**
5. You should see **"🔗 Social Media Links"** option
6. Click it
7. ✅ Should show 5 platforms (Facebook, Instagram, TikTok, Telegram, WhatsApp)

**If you don't see it:**

- Make sure you ran STEP 1 (SQL script)
- Make sure you ran STEP 2 (set is_admin = TRUE)
- Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

---

### STEP 4: Add Your Social Media Links (5 minutes) ⏱️

**Location:** Admin Dashboard → Social Media Links

For each platform you want to use:

1. Find the platform card
2. Click in the **URL field**
3. Paste your link (examples below)
4. Click **"💾 Save URL"**
5. Toggle the **"Active"** switch ON
6. ✅ Should show "✅ Link saved successfully"

**Link Examples:**

| Platform  | Link Format                     | Example                                 |
| --------- | ------------------------------- | --------------------------------------- |
| Facebook  | `https://www.facebook.com/...`  | `https://www.facebook.com/YourBusiness` |
| Instagram | `https://www.instagram.com/...` | `https://www.instagram.com/yourhandle`  |
| TikTok    | `https://www.tiktok.com/@...`   | `https://www.tiktok.com/@yourhandle`    |
| Telegram  | `https://t.me/...`              | `https://t.me/your_group`               |
| WhatsApp  | `https://wa.me/...`             | `https://wa.me/2349012726301`           |

**Platforms You Don't Use?** Just leave them inactive (toggle OFF)

---

### STEP 5: Test User Access (2 minutes) ⏱️

**Location:** Dashboard (Regular User View)

1. Logout as admin
2. Log back in as a regular user (or any test account)
3. Go to **Dashboard**
4. Click **"Contact Us"** in the sidebar (left side)
5. ✅ You should see your active social media platforms displayed as cards
6. Click any platform to test it opens correctly

---

## 🎓 What Users Will See

### Contact Page

```
┌─────────────────────────────────┐
│     Get in Touch                │
│                                 │
│  [👍 Facebook]  [📸 Instagram]  │
│  [🎵 TikTok]    [✈️ Telegram]   │
│  [💬 WhatsApp]                  │
│                                 │
│  (Inactive platforms show as    │
│   "Coming Soon")                │
└─────────────────────────────────┘
```

### Profile Page

```
┌─────────────────────────────────┐
│  ┌─────────┐                    │
│  │  Avatar │  Name              │
│  └─────────┘  email@example.com │
├─────────────────────────────────┤
│ Balance: ₦X,XXX.XX              │
│ [💳 Add] [📊 View]              │
├─────────────────────────────────┤
│ Stats: [Spent][Orders][Date]    │
├─────────────────────────────────┤
│ Personal Info (editable form)   │
├─────────────────────────────────┤
│ Dark Mode [Toggle]              │
├─────────────────────────────────┤
│ Support: [WhatsApp] [Telegram]  │
├─────────────────────────────────┤
│ ⚠️ Danger Zone                  │
│ [Change Password] [Logout]      │
└─────────────────────────────────┘
```

---

## 🔑 Key Commands Reference

**View all social media links in DB:**

```sql
SELECT * FROM social_media_links;
```

**Activate a platform:**

```sql
UPDATE social_media_links
SET active = TRUE
WHERE platform = 'Facebook';
```

**View audit log (who changed what):**

```sql
SELECT * FROM social_media_audit_log
ORDER BY created_at DESC;
```

**Make someone an admin:**

```sql
UPDATE profiles SET is_admin = TRUE WHERE email = 'admin@example.com';
```

**Remove admin access:**

```sql
UPDATE profiles SET is_admin = FALSE WHERE email = 'nonadmin@example.com';
```

---

## ❓ Common Errors & Fixes

### Error: "You do not have permission to access this page"

**Problem:** Your account doesn't have admin access
**Fix:** Run STEP 2 again (make sure email is correct)

### Social media links not showing on contact page

**Problem:** Platforms are not activated
**Fix:** Go to Admin → Social Media Links and toggle platforms ON

### Can't find "Social Media Links" menu

**Problem:** Tables weren't created or permissions aren't set
**Fix:**

1. Run STEP 1 again (full SQL script)
2. Hard refresh browser
3. Logout and login again

### Links aren't clickable

**Problem:** Invalid URL format
**Fix:** Make sure URL starts with:

- ✅ `https://` (preferred)
- ✅ `http://`
- ❌ `facebook.com` (missing http/https)

---

## 📱 Testing on Different Devices

### Desktop

- ✅ Admin panel works perfectly
- ✅ Contact form displays in grid
- ✅ All buttons clickable

### Tablet

- ✅ Responsive layout adjusts
- ✅ Contact form shows 2-3 per row
- ✅ Touch-friendly buttons

### Mobile

- ✅ Contact form single column
- ✅ Large touch targets
- ✅ Full screen optimization
- ✅ Dark mode works great

---

## 🎨 Customization Options

### Change Platform Colors

Edit `admin/social-media.html` find:

```javascript
background: linear-gradient(135deg, #00d4aa 0%, #00b894 100%);
```

Replace `#00d4aa` and `#00b894` with your colors

### Add More Platforms

Modify `db/QUICK_SOCIAL_MEDIA_SETUP.sql` and add:

```sql
INSERT INTO social_media_links (platform, icon_emoji, active, display_order) VALUES
  ('LinkedIn', '💼', FALSE, 6);
```

### Change Platform Emoji

In admin panel, each platform shows an emoji. To change:

1. Admin → Social Media Links
2. Look at card emoji
3. To change, you'd need to edit database directly:

```sql
UPDATE social_media_links
SET icon_emoji = '💼'
WHERE platform = 'Facebook';
```

---

## 📊 Analytics

### View what changed and when

```sql
SELECT
  platform,
  action,
  created_at,
  admin_id
FROM social_media_audit_log
ORDER BY created_at DESC;
```

### See most recent changes

```sql
SELECT * FROM social_media_audit_log
LIMIT 10
ORDER BY created_at DESC;
```

---

## ✨ Last Checklist Before Go-Live

- [ ] STEP 1 Complete (SQL script ran)
- [ ] STEP 2 Complete (admin access set)
- [ ] STEP 3 Complete (can see admin panel)
- [ ] STEP 4 Complete (added all social links)
- [ ] STEP 5 Complete (tested as regular user)
- [ ] All social links are correct
- [ ] All active platforms work (click to test)
- [ ] Contact page looks good
- [ ] Dark mode toggle works
- [ ] Mobile view looks good
- [ ] Tested on different devices
- [ ] No error messages in console (F12)

---

## 🚀 You're Done!

Once you complete all 5 steps:

- ✅ Your users can see your social media links
- ✅ You can manage them from admin panel
- ✅ Changes are automatically logged
- ✅ Profile page looks beautiful
- ✅ Everything is mobile-friendly
- ✅ Dark mode works perfectly

**Need help?** Check `notes/SOCIAL_MEDIA_SETUP.md` for detailed documentation.

---

**Time to Complete:** ~15 minutes total
**Difficulty:** ⭐⭐ Very Easy
**Status:** Ready to Deploy ✅
