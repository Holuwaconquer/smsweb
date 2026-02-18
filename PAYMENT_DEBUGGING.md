# Payment Flow Debugging Guide

## What Should Happen

When you complete a payment, you should see these console logs in order:

### Step-by-step Logs to Look For

1. **Payment Starts**
   ```
   === PAYMENT PROCESS STARTED ===
   ✓ Step 1: Current user verified: [email] Amount: [amount]
   ✓ Step 2: User profile found: [email]
   ✓ Step 3: Paystack initialized, opening payment modal...
   Starting payment verification process...
   Opening Paystack iframe...
   ```

2. **Paystack Modal Opens**
   - You should see the Paystack payment form
   - Complete the payment with test card:
     - Card: `4111 1111 1111 1111`
     - Expiry: `05/25`
     - CVV: `123`
     - OTP: `123456`

3. **Payment Successful**
   ```
   💳 PAYSTACK CALLBACK FIRED - onSuccess
   Response from Paystack: {reference: "BDSMS_...", status: "success"}
   Reference: BDSMS_...
   ```

4. **Verification**
   ```
   Starting payment verification for: BDSMS_...
   Found payment record: {id: ..., amount: 5000, ...}
   Payment status updated to success
   Current wallet: {balance: 0, total_added: 0}
   Calculating new balance: {currentBalance: 0, paymentAmount: 5000, newBalance: 5000}
   Wallet updated. New balance: 5000
   Transaction created successfully
   ✓ PAYMENT VERIFICATION SUCCESSFUL
   ```

5. **Modal Closes**
   ```
   ✓ Step 4: Payment completed
   ✓ Step 5: Payment verification successful
   ✓ Step 6: Closing modal and cleaning up UI...
   ✓ Step 7: Modal closed successfully
   ✓ Step 8: Success alerts shown, reloading wallet data...
   ```

6. **Wallet Reloads**
   ```
   Loading wallet data for user: [user-id]
   Updating UI with wallet data: {balance: 5000, total_added: 5000, total_spent: 0}
   Loading transactions for user: [user-id]
   ✓ Step 9: Wallet data reloaded
   === PAYMENT PROCESS COMPLETED SUCCESSFULLY ===
   ```

## If Payment Doesn't Complete

### Modal Still Open
- Check browser console (F12)
- Look for `⚠️ PAYSTACK MODAL CLOSED` - means user closed the modal without paying
- Look for `❌ PAYMENT ERROR:` - means verification failed

### Common Errors

**"Payment cancelled by user"**
- You clicked the X or cancelled in Paystack modal
- Try again and complete the payment

**"Payment timeout"**
- The Paystack modal didn't respond for 5 minutes
- Try refreshing and paying again

**"Payment verification failed"**
- Supabase couldn't record the payment
- Check your database connection
- Wallet may still be updated (check transaction history)

**"No payment result returned"**
- Paystack callback fired but result was empty
- Contact support

## Direct Supabase Check

To verify payment was recorded, check your Supabase tables:

1. **payment_history table**
   - Look for record with your reference (BDSMS_...)
   - Status should be "success"

2. **wallets table**
   - Check user's balance was updated
   - total_added should include payment amount

3. **transactions table**
   - Look for "credit" transaction with your payment amount
   - Status should be "completed"

## Test Steps

1. Open wallet page
2. Click "Add Funds"
3. Enter amount: `1000` (or higher)
4. Click "Pay Now"
5. Complete Paystack payment with test card
6. Modal should close automatically
7. See "✅ Payment Successful!" and "✅ Your wallet has been updated!"
8. Balance should update on the page
9. Transaction should appear in history

## If Still Not Working

Open browser F12 console and:
1. Look for any RED ERROR logs
2. Copy the error message
3. Check if Supabase is initialized (should see "Supabase client initialized successfully")
4. Check if Paystack is configured (should see "Paystack initialized in test mode")
5. Check if you're authenticated (should see "User authenticated: [email]")
