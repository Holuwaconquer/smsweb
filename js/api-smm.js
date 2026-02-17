// ============================================
// SMM PANEL API INTEGRATION
// Social Media Boosters (Instagram, TikTok, YouTube, etc.)
// ============================================

class SMMPanelAPI {
  constructor() {
    this.apiURL = null;
    this.apiKey = null;
    this.init();
  }

  async init() {
    // Get API credentials from system settings
    try {
      const { data, error } = await supabase
        .from("system_settings")
        .select("api_smm_panel_url, api_smm_panel_key")
        .single();

      if (!error && data) {
        this.apiURL = data.api_smm_panel_url;
        this.apiKey = data.api_smm_panel_key;
      }
    } catch (error) {
      console.error("Failed to load SMM API credentials:", error);
    }
  }

  // Helper: Make API request
  async makeRequest(action, params = {}) {
    if (!this.apiURL || !this.apiKey) {
      throw new Error("SMM Panel API not configured");
    }

    const requestData = {
      key: this.apiKey,
      action: action,
      ...params,
    };

    try {
      const response = await fetch(this.apiURL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams(requestData),
      });

      if (!response.ok) {
        throw new Error("API request failed");
      }

      const data = await response.json();

      // Check for API errors
      if (data.error) {
        throw new Error(data.error);
      }

      return data;
    } catch (error) {
      console.error("SMM API Error:", error);
      throw error;
    }
  }

  // Get account balance
  async getBalance() {
    try {
      const data = await this.makeRequest("balance");
      return {
        success: true,
        balance: parseFloat(data.balance),
        currency: data.currency || "USD",
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get all available services
  async getServices() {
    try {
      const data = await this.makeRequest("services");
      return {
        success: true,
        services: data,
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Place an order
  async addOrder(serviceId, link, quantity, runs = null, interval = null) {
    try {
      const params = {
        service: serviceId,
        link: link,
        quantity: quantity,
      };

      // For drip-feed orders
      if (runs !== null && interval !== null) {
        params.runs = runs;
        params.interval = interval;
      }

      const data = await this.makeRequest("add", params);

      return {
        success: true,
        orderId: data.order,
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get order status
  async getOrderStatus(orderId) {
    try {
      const data = await this.makeRequest("status", { order: orderId });

      return {
        success: true,
        charge: parseFloat(data.charge),
        startCount: parseInt(data.start_count),
        status: data.status,
        remains: parseInt(data.remains),
        currency: data.currency || "USD",
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get multiple orders status
  async getMultipleStatus(orderIds) {
    try {
      const data = await this.makeRequest("status", {
        orders: orderIds.join(","),
      });

      return {
        success: true,
        orders: data,
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Create refill
  async createRefill(orderId) {
    try {
      const data = await this.makeRequest("refill", { order: orderId });

      return {
        success: true,
        refillId: data.refill,
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get refill status
  async getRefillStatus(refillId) {
    try {
      const data = await this.makeRequest("refill_status", {
        refill: refillId,
      });

      return {
        success: true,
        status: data.status,
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Cancel order (if supported)
  async cancelOrder(orderId) {
    try {
      await this.makeRequest("cancel", { order: orderId });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

// Parse and categorize services
function categorizeServices(services) {
  const categories = {
    instagram: [],
    tiktok: [],
    youtube: [],
    twitter: [],
    facebook: [],
    telegram: [],
    other: [],
  };

  services.forEach((service) => {
    const name = service.name.toLowerCase();

    if (name.includes("instagram")) {
      categories.instagram.push(service);
    } else if (name.includes("tiktok") || name.includes("tik tok")) {
      categories.tiktok.push(service);
    } else if (name.includes("youtube")) {
      categories.youtube.push(service);
    } else if (name.includes("twitter") || name.includes("x ")) {
      categories.twitter.push(service);
    } else if (name.includes("facebook")) {
      categories.facebook.push(service);
    } else if (name.includes("telegram")) {
      categories.telegram.push(service);
    } else {
      categories.other.push(service);
    }
  });

  return categories;
}

// Place social boost order
async function placeSocialBoostOrder(
  userId,
  platform,
  boostType,
  serviceId,
  targetUrl,
  quantity,
  amount,
) {
  try {
    const api = new SMMPanelAPI();

    // Place order with SMM panel
    const result = await api.addOrder(serviceId, targetUrl, quantity);

    if (!result.success) {
      throw new Error(result.error);
    }

    // Save to database
    const { data: boost, error } = await supabase
      .from("social_boosts")
      .insert({
        user_id: userId,
        platform: platform,
        boost_type: boostType,
        target_url: targetUrl,
        quantity: quantity,
        amount: amount,
        status: "processing",
        order_id: result.orderId,
        start_count: 0,
        remains: quantity,
      })
      .select()
      .single();

    if (error) throw error;

    // Create transaction
    await supabase.from("transactions").insert({
      user_id: userId,
      type: "debit",
      amount: amount,
      description: `${platform} ${boostType} - ${quantity} units`,
      reference: `BOOST-${result.orderId}`,
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
        balance: parseFloat(wallet.balance) - parseFloat(amount),
        total_spent: parseFloat(wallet.total_spent) + parseFloat(amount),
      })
      .eq("user_id", userId);

    // Log activity
    await logUserActivity(
      userId,
      "purchase",
      `Ordered ${quantity} ${boostType} for ${platform}`,
      { orderId: result.orderId, targetUrl },
    );

    return {
      success: true,
      data: boost,
    };
  } catch (error) {
    console.error("Error placing social boost order:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Update social boost status
async function updateSocialBoostStatus(boostId) {
  try {
    const { data: boost } = await supabase
      .from("social_boosts")
      .select("*")
      .eq("id", boostId)
      .single();

    if (!boost || !boost.order_id) {
      return { success: false, error: "Boost not found" };
    }

    const api = new SMMPanelAPI();
    const result = await api.getOrderStatus(boost.order_id);

    if (!result.success) {
      return result;
    }

    // Calculate delivered amount
    const delivered = boost.quantity - result.remains;

    // Update database
    await supabase
      .from("social_boosts")
      .update({
        status: result.status,
        start_count: result.startCount,
        remains: result.remains,
        delivered: delivered,
      })
      .eq("id", boostId);

    return {
      success: true,
      status: result.status,
      delivered: delivered,
      remains: result.remains,
    };
  } catch (error) {
    console.error("Error updating boost status:", error);
    return { success: false, error: error.message };
  }
}

// Auto-refresh boost status
async function startBoostStatusPolling(boostId, callback, interval = 30000) {
  const pollInterval = setInterval(async () => {
    const result = await updateSocialBoostStatus(boostId);

    if (result.success && callback) {
      callback(result);
    }

    // Stop polling if completed or failed
    if (result.status === "Completed" || result.status === "Failed") {
      clearInterval(pollInterval);
    }
  }, interval);

  return pollInterval;
}

// Get available services with caching
let servicesCache = null;
let cacheExpiry = null;

async function getAvailableServices(forceRefresh = false) {
  // Check cache
  if (
    !forceRefresh &&
    servicesCache &&
    cacheExpiry &&
    Date.now() < cacheExpiry
  ) {
    return { success: true, services: servicesCache };
  }

  try {
    const api = new SMMPanelAPI();
    const result = await api.getServices();

    if (result.success) {
      servicesCache = result.services;
      cacheExpiry = Date.now() + 60 * 60 * 1000; // Cache for 1 hour
    }

    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Calculate total price with markup
function calculateBoostPrice(apiPrice, markup = 1.5) {
  // Convert USD to NGN (approximate rate: 1 USD = 750 NGN)
  const usdToNgn = 750;
  const priceInNgn = parseFloat(apiPrice) * usdToNgn;
  return Math.ceil(priceInNgn * markup);
}

// Format service display
function formatServiceDisplay(service) {
  return {
    id: service.service,
    name: service.name,
    type: service.type,
    category: service.category || "Other",
    rate: `₦${calculateBoostPrice(service.rate)} per ${service.min}`,
    min: service.min,
    max: service.max,
    description: service.description || "",
    apiPrice: service.rate,
  };
}

// Make API globally available
window.SMMPanelAPI = SMMPanelAPI;
window.placeSocialBoostOrder = placeSocialBoostOrder;
window.updateSocialBoostStatus = updateSocialBoostStatus;
window.startBoostStatusPolling = startBoostStatusPolling;
window.getAvailableServices = getAvailableServices;
window.categorizeServices = categorizeServices;
window.calculateBoostPrice = calculateBoostPrice;
window.formatServiceDisplay = formatServiceDisplay;
