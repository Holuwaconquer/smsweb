// ============================================
// 5SIM.NET API INTEGRATION
// Real-time SMS number purchasing and inbox
// ============================================

class FiveSimAPI {
  constructor() {
    this.baseURL = "https://5sim.net/v1";
    this.apiKey = null;
    this.init();
  }

  async init() {
    // Get API key from system settings
    try {
      const { data, error } = await supabase
        .from("system_settings")
        .select("api_5sim_key")
        .single();

      if (!error && data) {
        this.apiKey = data.api_5sim_key;
      }
    } catch (error) {
      console.error("Failed to load 5sim API key:", error);
    }
  }

  // Helper: Make API request
  async makeRequest(endpoint, method = "GET", body = null) {
    if (!this.apiKey) {
      throw new Error("5sim API key not configured");
    }

    const headers = {
      Authorization: `Bearer ${this.apiKey}`,
      Accept: "application/json",
    };

    const options = {
      method,
      headers,
    };

    if (body) {
      options.body = JSON.stringify(body);
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, options);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "API request failed");
    }

    return await response.json();
  }

  // Get available countries
  async getCountries() {
    try {
      return await this.makeRequest("/guest/countries");
    } catch (error) {
      console.error("Error fetching countries:", error);
      return {};
    }
  }

  // Get available products/services
  async getProducts(country = "any", operator = "any") {
    try {
      return await this.makeRequest(`/guest/products/${country}/${operator}`);
    } catch (error) {
      console.error("Error fetching products:", error);
      return {};
    }
  }

  // Get prices for a service
  async getPrices(country = "any", service = null) {
    try {
      let endpoint = `/guest/prices?country=${country}`;
      if (service) {
        endpoint += `&product=${service}`;
      }
      return await this.makeRequest(endpoint);
    } catch (error) {
      console.error("Error fetching prices:", error);
      return {};
    }
  }

  // Buy activation (purchase number)
  async buyActivation(country, operator, service) {
    try {
      const data = await this.makeRequest(
        `/user/buy/activation/${country}/${operator}/${service}`,
      );

      return {
        success: true,
        activationId: data.id,
        phone: data.phone,
        price: data.price,
        status: data.status,
        expires: data.expires,
      };
    } catch (error) {
      console.error("Error buying activation:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Check for SMS messages
  async checkSMS(activationId) {
    try {
      const data = await this.makeRequest(`/user/check/${activationId}`);

      return {
        success: true,
        status: data.status,
        sms: data.sms || [],
        phone: data.phone,
      };
    } catch (error) {
      console.error("Error checking SMS:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Finish activation (mark as completed)
  async finishActivation(activationId) {
    try {
      await this.makeRequest(`/user/finish/${activationId}`);
      return { success: true };
    } catch (error) {
      console.error("Error finishing activation:", error);
      return { success: false, error: error.message };
    }
  }

  // Cancel activation (get refund)
  async cancelActivation(activationId) {
    try {
      await this.makeRequest(`/user/cancel/${activationId}`);
      return { success: true };
    } catch (error) {
      console.error("Error canceling activation:", error);
      return { success: false, error: error.message };
    }
  }

  // Get user balance
  async getBalance() {
    try {
      const data = await this.makeRequest("/user/profile");
      return {
        success: true,
        balance: data.balance,
        rating: data.rating,
      };
    } catch (error) {
      console.error("Error fetching balance:", error);
      return { success: false, error: error.message };
    }
  }

  // Ban activation (ban if number already used)
  async banActivation(activationId) {
    try {
      await this.makeRequest(`/user/ban/${activationId}`);
      return { success: true };
    } catch (error) {
      console.error("Error banning activation:", error);
      return { success: false, error: error.message };
    }
  }

  // Reuse activation (use same number again for same service)
  async reuseActivation(service, number) {
    try {
      const data = await this.makeRequest(`/user/reuse/${service}/${number}`);
      return {
        success: true,
        activationId: data.id,
        phone: data.phone,
        price: data.price,
      };
    } catch (error) {
      console.error("Error reusing activation:", error);
      return { success: false, error: error.message };
    }
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

// Purchase SMS number for user
async function purchaseSMSNumber(userId, country, service, userPrice) {
  try {
    const api = new FiveSimAPI();

    // Buy activation from 5sim
    const result = await api.buyActivation(country, "any", service);

    if (!result.success) {
      throw new Error(result.error);
    }

    // Calculate expiry (30 minutes from now)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 30);

    // Save to database
    const { data: smsNumber, error } = await supabase
      .from("sms_numbers")
      .insert({
        user_id: userId,
        phone_number: result.phone,
        country: country,
        country_code: country,
        service: service,
        status: "active",
        amount: userPrice,
        activation_id: result.activationId,
        expires_at: expiresAt.toISOString(),
        purchased_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    // Create transaction
    await supabase.from("transactions").insert({
      user_id: userId,
      type: "debit",
      amount: userPrice,
      description: `SMS Number Purchase - ${service} (${country})`,
      reference: `SMS-${result.activationId}`,
      status: "completed",
    });

    // Update wallet
    const { data: wallet } = await supabase
      .from("wallets")
      .select("balance, total_spent")
      .eq("user_id", userId)
      .single();

    await supabase
      .from("wallets")
      .update({
        balance: parseFloat(wallet.balance) - parseFloat(userPrice),
        total_spent: parseFloat(wallet.total_spent) + parseFloat(userPrice),
      })
      .eq("user_id", userId);

    // Log activity
    await logUserActivity(
      userId,
      "purchase",
      `Purchased SMS number for ${service}`,
    );

    return {
      success: true,
      data: smsNumber,
    };
  } catch (error) {
    console.error("Error purchasing SMS number:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Check for new SMS messages
async function checkForNewSMS(smsNumberId) {
  try {
    const { data: smsNumber } = await supabase
      .from("sms_numbers")
      .select("*")
      .eq("id", smsNumberId)
      .single();

    if (!smsNumber || !smsNumber.activation_id) {
      return { success: false, error: "Number not found" };
    }

    const api = new FiveSimAPI();
    const result = await api.checkSMS(smsNumber.activation_id);

    if (!result.success) {
      return result;
    }

    // Save new messages to database
    if (result.sms && result.sms.length > 0) {
      for (const sms of result.sms) {
        // Check if message already exists
        const { data: existing } = await supabase
          .from("sms_messages")
          .select("id")
          .eq("sms_number_id", smsNumberId)
          .eq("message", sms.text)
          .single();

        if (!existing) {
          await supabase.from("sms_messages").insert({
            sms_number_id: smsNumberId,
            sender: sms.sender || "Unknown",
            message: sms.text,
            received_at: sms.date || new Date().toISOString(),
          });
        }
      }
    }

    // Update status if needed
    if (result.status === "FINISHED" || result.status === "CANCELLED") {
      await supabase
        .from("sms_numbers")
        .update({ status: result.status === "FINISHED" ? "used" : "cancelled" })
        .eq("id", smsNumberId);
    }

    return {
      success: true,
      messages: result.sms,
    };
  } catch (error) {
    console.error("Error checking for SMS:", error);
    return { success: false, error: error.message };
  }
}

// Auto-refresh inbox for active numbers
async function startSMSPolling(smsNumberId, callback, interval = 5000) {
  const pollInterval = setInterval(async () => {
    const result = await checkForNewSMS(smsNumberId);

    if (result.success && callback) {
      callback(result.messages);
    }

    // Stop polling if number is no longer active
    const { data } = await supabase
      .from("sms_numbers")
      .select("status")
      .eq("id", smsNumberId)
      .single();

    if (!data || data.status !== "active") {
      clearInterval(pollInterval);
    }
  }, interval);

  return pollInterval;
}

// Log user activity
async function logUserActivity(
  userId,
  activityType,
  description,
  metadata = null,
) {
  try {
    await supabase.from("user_activity_logs").insert({
      user_id: userId,
      activity_type: activityType,
      description: description,
      metadata: metadata,
    });
  } catch (error) {
    console.error("Error logging activity:", error);
  }
}

// Make API globally available
window.FiveSimAPI = FiveSimAPI;
window.purchaseSMSNumber = purchaseSMSNumber;
window.checkForNewSMS = checkForNewSMS;
window.startSMSPolling = startSMSPolling;
window.logUserActivity = logUserActivity;
