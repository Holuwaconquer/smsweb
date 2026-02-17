// ============================================
// PAYSTACK PAYMENT INTEGRATION
// Users can add funds to their wallet
// ============================================

class PaystackPayment {
  constructor() {
    // Get your Paystack public key from https://dashboard.paystack.com
    // For testing: Use test key (starts with pk_test_)
    // For production: Use live key (starts with pk_live_)
    this.publicKey = "pk_test_YOUR_PUBLIC_KEY_HERE"; // REPLACE THIS
    this.initialized = false;
    this.checkPaystackScript();
  }

  // Check if Paystack script is loaded
  checkPaystackScript() {
    if (typeof PaystackPop !== "undefined") {
      this.initialized = true;
    } else {
      // Load Paystack script dynamically
      const script = document.createElement("script");
      script.src = "https://js.paystack.co/v1/inline.js";
      script.onload = () => {
        this.initialized = true;
      };
      script.onerror = () => {
        console.error("Failed to load Paystack script");
      };
      document.head.appendChild(script);
    }
  }

  // Initialize payment
  async initializePayment(amount, email, userId) {
    if (!this.initialized) {
      throw new Error("Paystack not initialized");
    }

    // Generate unique reference
    const reference =
      "BDSMS_" + Math.random().toString(36).substring(2, 15) + Date.now();

    // Save payment to database as pending
    try {
      const { error } = await supabase.from("payment_history").insert({
        user_id: userId,
        reference: reference,
        amount: amount,
        status: "pending",
        payment_method: "paystack",
      });

      if (error) throw error;
    } catch (error) {
      console.error("Error saving payment:", error);
      throw new Error("Failed to initialize payment");
    }

    // Return payment configuration
    return new Promise((resolve, reject) => {
      const handler = PaystackPop.setup({
        key: this.publicKey,
        email: email,
        amount: amount * 100, // Convert to kobo (Naira cents)
        currency: "NGN",
        ref: reference,
        metadata: {
          custom_fields: [
            {
              display_name: "User ID",
              variable_name: "user_id",
              value: userId,
            },
          ],
        },
        callback: async (response) => {
          // Payment successful
          console.log("Payment successful:", response);

          // Verify payment
          const verified = await this.verifyPayment(response.reference, userId);

          if (verified.success) {
            resolve({
              success: true,
              reference: response.reference,
              amount: amount,
            });
          } else {
            reject(new Error("Payment verification failed"));
          }
        },
        onClose: () => {
          // User closed payment modal
          reject(new Error("Payment cancelled by user"));
        },
      });

      handler.openIframe();
    });
  }

  // Verify payment on backend
  async verifyPayment(reference, userId) {
    try {
      // In production, this should be done on a secure backend
      // For now, we'll update the database directly
      // Get payment record
      const { data: payment, error: fetchError } = await supabase
        .from("payment_history")
        .select("*")
        .eq("reference", reference)
        .single();

      if (fetchError || !payment) {
        throw new Error("Payment not found");
      }

      // Update payment status
      await supabase
        .from("payment_history")
        .update({
          status: "success",
          paystack_reference: reference,
          verified_at: new Date().toISOString(),
        })
        .eq("reference", reference);

      // Add funds to user wallet
      const { data: wallet } = await supabase
        .from("wallets")
        .select("balance, total_added")
        .eq("user_id", userId)
        .single();

      await supabase
        .from("wallets")
        .update({
          balance: parseFloat(wallet.balance) + parseFloat(payment.amount),
          total_added:
            parseFloat(wallet.total_added) + parseFloat(payment.amount),
        })
        .eq("user_id", userId);

      // Create transaction record
      await supabase.from("transactions").insert({
        user_id: userId,
        type: "credit",
        amount: payment.amount,
        description: "Wallet Top-up via Paystack",
        reference: reference,
        status: "completed",
      });

      // Log activity
      await logUserActivity(
        userId,
        "wallet_topup",
        `Added ₦${payment.amount.toFixed(2)} to wallet`,
        { reference: reference },
      );

      return {
        success: true,
        amount: payment.amount,
      };
    } catch (error) {
      console.error("Payment verification error:", error);

      // Mark payment as failed
      await supabase
        .from("payment_history")
        .update({ status: "failed" })
        .eq("reference", reference);

      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Get payment history
  async getPaymentHistory(userId, limit = 50) {
    try {
      const { data, error } = await supabase
        .from("payment_history")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;

      return {
        success: true,
        payments: data || [],
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

// Add funds to wallet
async function addFundsToWallet(userId, email, amount) {
  try {
    const paystack = new PaystackPayment();
    const result = await paystack.initializePayment(amount, email, userId);

    return {
      success: true,
      message: `Successfully added ₦${amount.toFixed(2)} to your wallet!`,
      reference: result.reference,
    };
  } catch (error) {
    console.error("Error adding funds:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Get pricing for a service
async function getServicePrice(category, serviceName, country = null) {
  try {
    let query = supabase
      .from("pricing")
      .select("*")
      .eq("category", category)
      .eq("service_name", serviceName)
      .eq("is_active", true);

    if (country) {
      query = query.eq("country", country);
    } else {
      query = query.is("country", null);
    }

    const { data, error } = await query.single();

    if (error) throw error;

    return {
      success: true,
      price: data,
    };
  } catch (error) {
    console.error("Error fetching price:", error);
    return {
      success: false,
      error: error.message,
      defaultPrice: 1000, // Fallback price
    };
  }
}

// Get all pricing
async function getAllPricing() {
  try {
    const { data, error } = await supabase
      .from("pricing")
      .select("*")
      .eq("is_active", true)
      .order("category", { ascending: true })
      .order("service_name", { ascending: true });

    if (error) throw error;

    return {
      success: true,
      pricing: data || [],
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

// Update pricing (admin only)
async function updatePricing(pricingId, updates) {
  try {
    const { data, error } = await supabase
      .from("pricing")
      .update(updates)
      .eq("id", pricingId)
      .select()
      .single();

    if (error) throw error;

    // Log activity
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await logUserActivity(
      user.id,
      "pricing_update",
      `Updated pricing for ${data.service_name}`,
      { pricingId, updates },
    );

    return {
      success: true,
      data: data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

// Create new pricing entry (admin only)
async function createPricing(pricingData) {
  try {
    const { data, error } = await supabase
      .from("pricing")
      .insert(pricingData)
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      data: data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

// Delete pricing (admin only)
async function deletePricing(pricingId) {
  try {
    const { error } = await supabase
      .from("pricing")
      .delete()
      .eq("id", pricingId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

// Format currency
function formatCurrency(amount) {
  return `₦${parseFloat(amount).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// Make globally available
window.PaystackPayment = PaystackPayment;
window.addFundsToWallet = addFundsToWallet;
window.getServicePrice = getServicePrice;
window.getAllPricing = getAllPricing;
window.updatePricing = updatePricing;
window.createPricing = createPricing;
window.deletePricing = deletePricing;
window.formatCurrency = formatCurrency;
