# Admin Dashboard Fixes - Setup Guide

## Issues Fixed

### 1. **Only One User Showing in Admin Dashboard**

- **Problem**: RLS (Row Level Security) policies were restricting users to view only their own profile
- **Solution**: Added admin-specific RLS policies that allow admins to view all profiles

### 2. **User Account Deletion Not Working**

- **Problem**:
  - Missing DELETE permissions in RLS policies
  - Related data (wallets, transactions, etc.) wasn't being deleted properly
- **Solution**:
  - Added DELETE policies for admins
  - Created cascade deletion function
  - Updated JavaScript to delete related records in proper order

## Step 1: Apply Database Schema Changes

Run the following SQL scripts in your Supabase SQL Editor in this exact order:

### Script 1: Admin RLS Policies

Go to **Supabase Dashboard → SQL Editor** and run:

```bash
File: /db/admin-rls-policies.sql
```

This adds policies that allow:

- Admins to view all profiles
- Admins to delete user profiles (excluding other admins)
- Admins to view and manage wallets
- Admins to view all transactions and other user data

### Script 2: User Deletion Cascade Functions

Go to **Supabase Dashboard → SQL Editor** and run:

```bash
File: /db/user-deletion-cascade.sql
```

This creates:

- Function to automatically clean up user data when deleted
- Trigger to execute on profile deletion
- Admin logs table to track admin actions
- Function to log deletion actions

## Step 3: Verify Your Changes

1. **Test Admin View**

   - Log in as an admin user
   - Go to Admin Dashboard → Users
   - You should now see **ALL users** in the table, not just one

2. **Test User Deletion**
   - Click the 🗑️ Delete button on any non-admin user
   - Confirm the deletion
   - The user and all their related data should be permanently deleted
   - Check admin logs to confirm the action was logged

## Important Notes

### Security⚠️

- Only users with `is_admin = TRUE` in the profiles table can:
  - View all user data
  - Delete user accounts
- Admins cannot delete themselves or other admins
- All deletion actions are logged in the `admin_logs` table

### What Gets Deleted When You Delete a User

When you delete a user account, the following are automatically deleted:

1. ✅ User Profile
2. ✅ User Wallet & Balance
3. ✅ All Transactions
4. ✅ All SMS Numbers
5. ✅ All SMS Messages
6. ✅ All Logs Accounts
7. ✅ All Social Boosts
8. ✅ All Phone Numbers
9. ✅ Promo Code Usage

### Setting Up an Admin User

If you don't have an admin user yet, run this SQL in Supabase:

```sql
-- Make a user an admin (replace the email)
UPDATE public.profiles
SET is_admin = TRUE
WHERE email = 'your-email@example.com';
```

## Troubleshooting

### Still Seeing Only One User?

1. Make sure you applied the `admin-rls-policies.sql` script
2. Verify the logged-in user has `is_admin = TRUE` in the profiles table
3. Try logging out and back in to refresh the session

### Delete Button Not Working?

1. Make sure you applied both SQL scripts
2. Check browser console for error messages (F12 → Console tab)
3. Verify the user you're trying to delete is not an admin
4. Check Supabase logs for any policy violations

### Getting "You do not have permission" Error?

This means the RLS policies weren't applied. Go back to **Step 1** and run both SQL scripts.

## Database Changes Summary

| Feature            | Before                                | After                             |
| ------------------ | ------------------------------------- | --------------------------------- |
| View all users     | ❌ No (RLS restricted to own profile) | ✅ Yes (for admins)               |
| Delete users       | ❌ No (no delete policies)            | ✅ Yes (for admins, with cascade) |
| User deletion logs | ❌ No                                 | ✅ Yes (admin_logs table)         |
| User data cleanup  | ⚠️ Partial (needs cascade)            | ✅ Complete (automatic)           |

## Files Modified

### Backend (SQL)

- ✅ `db/admin-rls-policies.sql` - New file with admin policies
- ✅ `db/user-deletion-cascade.sql` - New file with deletion logic

### Frontend (JavaScript)

- ✅ `js/dashboard.js` - Added `getAllProfilesAsAdmin()` function
- ✅ `js/admin.js` - Updated `refreshUsers()` and `deleteUserAccount()` functions
- ✅ `js/notifications.js` - Uses confirmation modal and notifications (already updated)

## API Changes

### New JavaScript Function

```javascript
// Get all profiles when user is an admin
getAllProfilesAsAdmin();
```

This function:

1. Verifies the current user is an admin
2. Fetches all user profiles from the database
3. Returns empty array if user is not an admin

## Next Steps

1. ✅ Apply both SQL scripts to your Supabase database
2. ✅ Test by logging in as an admin and viewing the Users page
3. ✅ Try deleting a test user (non-admin)
4. ✅ Check that all their data is completely removed

## Questions or Issues?

If you encounter any problems:

1. Check the browser console for errors (F12)
2. Check Supabase logs for database errors
3. Verify all SQL scripts were executed successfully
4. Make sure you're logged in as an admin user
5. Try clearing browser cache and reloading the page
