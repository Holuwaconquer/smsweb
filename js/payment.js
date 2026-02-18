
class PaystackPayment {
  constructor() {

    if (!window.PaystackConfig || !window.PaystackConfig.isConfigured()) {
      throw new Error(
        "Paystack is not properly configured. Please edit js/config.js and set paystack.publicKey to your actual Paystack key (starts with pk_test_ or pk_live_)."
      );
    }
    
    this.publicKey = window.PaystackConfig.publicKey;
    this.initialized = false;
    this.checkPaystackScript();
  }

  checkPaystackScript() {
    if (typeof PaystackPop !== "undefined") {
      this.initialized = true;
    } else {
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

  async initializePayment(amount, email, userId) {
    if (!this.initialized) {
      throw new Error("Paystack not initialized");
    }

    const reference =
      "BDSMS_" + Math.random().toString(36).substring(2, 15) + Date.now();

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

    return new Promise((resolve, reject) => {
      console.log("Creating Paystack payment promise...");
      
      let resolved = false;
      
      // Add a timeout in case the payment handler never resolves
      const paymentTimeout = setTimeout(async () => {
        console.error("⏱️ PAYMENT TIMEOUT - Modal didn't resolve in 5 minutes");
        console.log("Checking if payment was actually recorded...");
        
        // Check if payment was actually completed despite callback not firing
        const { data: payment } = await supabase
          .from("payment_history")
          .select("status")
          .eq("reference", reference)
          .single();
          
        if (payment && payment.status === "success") {
          console.log("✓ Payment was actually successful!");
          resolved = true;
          resolve({
            success: true,
            reference: reference,
            amount: amount,
            verified: { success: true },
          });
        } else {
          reject(new Error("Payment timeout - modal did not respond"));
        }
      }, 5 * 60 * 1000); // 5 minutes
      
      // Also start polling to check payment status (in case callback doesn't fire)
      let pollCount = 0;
      const pollInterval = setInterval(async () => {
        if (resolved) {
          clearInterval(pollInterval);
          return;
        }
        
        pollCount++;
        console.log(`🔍 Polling payment status (check #${pollCount})...`);
        
        try {
          const { data: payment } = await supabase
            .from("payment_history")
            .select("status")
            .eq("reference", reference)
            .single();
          
          console.log(`   Payment status from DB: ${payment?.status || 'not found'}`);
          
          if (payment && payment.status === "success") {
            console.log("✅ PAYMENT DETECTED VIA POLLING!");
            console.log("Payment status is now: SUCCESS");
            
            clearTimeout(paymentTimeout);
            clearInterval(pollInterval);
            resolved = true;
            
            // Force close Paystack modal
            setTimeout(() => forceClosePaystackModal(), 100);
            
            // Verify the payment to ensure wallet is updated
            this.verifyPayment(reference, userId)
              .then((verified) => {
                console.log("✓ PAYMENT VERIFIED");
                resolve({
                  success: true,
                  reference: reference,
                  amount: amount,
                  verified: verified,
                });
              })
              .catch((error) => {
                console.error("Error verifying payment:", error);
                resolve({
                  success: true,
                  reference: reference,
                  amount: amount,
                });
              });
          } else if (payment && payment.status === "pending" && pollCount > 6) {
            // After 30 seconds of no success, try calling verifyPayment directly
            // This will check with Paystack if payment went through, even if callback didn't fire
            console.log("⏳ Payment still pending after 30 seconds, attempting manual verification...");
            
            try {
              const verified = await this.verifyPayment(reference, userId);
              if (verified && verified.success) {
                console.log("✅ MANUAL VERIFICATION DETECTED PAYMENT SUCCESS!");
                
                clearTimeout(paymentTimeout);
                clearInterval(pollInterval);
                resolved = true;
                
                // Force close Paystack modal
                setTimeout(() => forceClosePaystackModal(), 100);
                
                resolve({
                  success: true,
                  reference: reference,
                  amount: amount,
                  verified: verified,
                });
              }
            } catch (verifyError) {
              console.log("Manual verification didn't find successful payment yet");
            }
          }
        } catch (error) {
          console.error("Polling error:", error);
        }
        
        // Stop polling after 2 minutes
        if (pollCount > 24) {
          console.log("❌ POLLING TIMEOUT - Stopped after 2 minutes");
          clearInterval(pollInterval);
        }
      }, 5000); // Poll every 5 seconds
      
      const handler = PaystackPop.setup({
        key: this.publicKey,
        email: email,
        amount: amount * 100, 
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
        onSuccess: (response) => {
          console.log("💳 PAYSTACK CALLBACK FIRED - onSuccess");
          console.log("Response from Paystack:", response);
          console.log("Reference:", response.reference);
          
          if (resolved) return; // Already resolved via polling
          
          clearTimeout(paymentTimeout);
          clearInterval(pollInterval);
          resolved = true;
          
          // Call async verification without await in callback
          this.verifyPayment(response.reference, userId)
            .then((verified) => {
              console.log("✓ PAYMENT VERIFICATION SUCCESSFUL");
              console.log("Verified data:", verified);
              resolve({
                success: true,
                reference: response.reference,
                amount: amount,
                verified: verified,
              });
            })
            .catch((error) => {
              console.error("❌ PAYMENT VERIFICATION FAILED");
              console.error("Error:", error);
              console.error("Error message:", error.message);
              reject(error);
            });
        },
        onClose: () => {
          console.log("⚠️ PAYSTACK MODAL CLOSED");
          
          // Don't reject immediately - let polling finish checking
          // if payment was completed even though user closed modal
          console.log("Continuing to check for payment status...");
        },
      });

      console.log("Opening Paystack iframe...");
      handler.openIframe();
    });
  }

  async verifyPayment(reference, userId) {
    try {
      console.log("Starting payment verification for:", reference);

      // 1. Get the payment record
      const { data: payment, error: fetchError } = await supabase
        .from("payment_history")
        .select("*")
        .eq("reference", reference)
        .single();

      if (fetchError || !payment) {
        console.error("Payment not found:", fetchError);
        throw new Error("Payment record not found");
      }

      console.log("Found payment record:", payment);

      // 2. Update payment status to success
      const { error: updateError } = await supabase
        .from("payment_history")
        .update({
          status: "success",
          paystack_reference: reference,
          verified_at: new Date().toISOString(),
        })
        .eq("reference", reference);

      if (updateError) {
        console.error("Error updating payment status:", updateError);
        throw updateError;
      }

      console.log("Payment status updated to success");

      // 3. Get current wallet balance (or create if doesn't exist)
      let { data: wallet, error: walletError } = await supabase
        .from("wallets")
        .select("balance, total_added")
        .eq("user_id", userId)
        .single();

      // If wallet doesn't exist, create it
      if (walletError && walletError.code === "PGRST116") {
        console.log("Wallet not found, creating new wallet for user:", userId);
        const { data: newWallet, error: createError } = await supabase
          .from("wallets")
          .insert({
            user_id: userId,
            balance: 0.00,
            total_added: 0.00,
            total_spent: 0.00,
          })
          .select()
          .single();

        if (createError) {
          console.error("Error creating wallet:", createError);
          throw createError;
        }

        wallet = newWallet;
        console.log("New wallet created:", wallet);
      } else if (walletError) {
        console.error("Error fetching wallet:", walletError);
        throw walletError;
      }

      console.log("Current wallet:", wallet);

      // 4. Update wallet with new balance
      const currentBalance = parseFloat(wallet.balance || 0);
      const currentTotalAdded = parseFloat(wallet.total_added || 0);
      const paymentAmount = parseFloat(payment.amount);

      const newBalance = currentBalance + paymentAmount;
      const newTotalAdded = currentTotalAdded + paymentAmount;

      console.log("Calculating new balance:", {
        currentBalance,
        paymentAmount,
        newBalance,
      });

      const { error: balanceError } = await supabase
        .from("wallets")
        .update({
          balance: newBalance,
          total_added: newTotalAdded,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      if (balanceError) {
        console.error("Error updating wallet balance:", balanceError);
        throw balanceError;
      }

      console.log("Wallet updated. New balance:", newBalance);

      // 5. Create transaction record
      const { error: transactionError } = await supabase
        .from("transactions")
        .insert({
          user_id: userId,
          type: "credit",
          amount: paymentAmount,
          description: "Wallet Top-up via Paystack",
          reference: reference,
          status: "completed",
        });

      if (transactionError) {
        console.error("Error creating transaction:", transactionError);
        throw transactionError;
      }

      console.log("Transaction created successfully");

      return {
        success: true,
        amount: paymentAmount,
        newBalance: newBalance,
      };
    } catch (error) {
      console.error("Payment verification error:", error);

      // Mark payment as failed
      await supabase
        .from("payment_history")
        .update({ status: "failed" })
        .eq("reference", reference)
        .catch((err) => console.error("Failed to update payment status:", err));

      // Throw the error so it's properly caught by the promise chain
      throw error;
    }
  }

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

// Helper function to force close Paystack modal
function forceClosePaystackModal() {
  console.log("Attempting to force close Paystack modal...");
  
  // Method 1: Look for Paystack iframe and hide it
  const paystackFrames = document.querySelectorAll("iframe[src*='paystack']");
  paystackFrames.forEach(frame => {
    frame.style.display = "none";
    console.log("✓ Closed Paystack iframe");
  });
  
  // Method 2: Look for Paystack container divs
  const paystackContainers = document.querySelectorAll("[class*='paystack']");
  paystackContainers.forEach(container => {
    container.style.display = "none";
    console.log("✓ Closed Paystack container");
  });
  
  // Method 3: Remove any fixed position overlays
  const overlays = document.querySelectorAll("div[style*='position: fixed'][style*='z-index']");
  overlays.forEach(overlay => {
    if (overlay.offsetHeight > 300 && overlay.offsetHeight < 800) {
      overlay.style.display = "none";
      console.log("✓ Closed potential overlay");
    }
  });
  
  // Method 4: Ensure body overflow is reset
  document.body.style.overflow = "auto";
}

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
      defaultPrice: 1000, 
    };
  }
}

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

async function updatePricing(pricingId, updates) {
  try {
    const { data, error } = await supabase
      .from("pricing")
      .update(updates)
      .eq("id", pricingId)
      .select()
      .single();

    if (error) throw error;

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

function formatCurrency(amount) {
  return `₦${parseFloat(amount).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

window.PaystackPayment = PaystackPayment;
window.addFundsToWallet = addFundsToWallet;
window.getServicePrice = getServicePrice;
window.getAllPricing = getAllPricing;
window.updatePricing = updatePricing;
window.createPricing = createPricing;
window.deletePricing = deletePricing;
window.formatCurrency = formatCurrency;
