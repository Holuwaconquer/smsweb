// ============================================
// COMPLETE DASHBOARD UTILITIES
// ============================================

// ============================================
// AUTH FUNCTIONS
// ============================================

async function checkAuth() {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return !!session;
  } catch (error) {
    console.error("Auth check error:", error);
    return false;
  }
}

async function getCurrentUser() {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return { user };
  } catch (error) {
    console.error("Get user error:", error);
    return { user: null };
  }
}

async function signOut() {
  try {
    await supabase.auth.signOut();
    return true;
  } catch (error) {
    console.error("Sign out error:", error);
    return false;
  }
}

async function isUserAdmin(userId) {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", userId)
      .single();

    if (error) throw error;
    return data && data.is_admin === true;
  } catch (error) {
    console.error("Admin check error:", error);
    return false;
  }
}

async function checkMaintenanceMode() {
  try {
    const { data, error } = await supabase
      .from("system_settings")
      .select("*")
      .single();

    if (error) return false;

    if (data && data.maintenance_mode) {
      // Check if current user is admin (admins bypass maintenance)
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const isAdmin = await isUserAdmin(user.id);
        if (isAdmin) return false;
      }

      // Redirect to maintenance page or show alert
      document.body.innerHTML = `
        <div style="height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #f8fafc; font-family: sans-serif; text-align: center; padding: 20px;">
          <div style="font-size: 64px; margin-bottom: 20px;">🛠️</div>
          <h1 style="color: #1e293b; margin-bottom: 10px;">Maintenance Mode</h1>
          <p style="color: #64748b; font-size: 18px; max-width: 500px; line-height: 1.6;">${
            data.maintenance_message ||
            "We are currently updating our system to serve you better. Please check back in a few minutes."
          }</p>
          <div style="margin-top: 30px; font-size: 14px; color: #94a3b8;">&copy; ${new Date().getFullYear()} Femzy </div>
        </div>
      `;
      return true;
    }
    return false;
  } catch (error) {
    console.error("Maintenance check error:", error);
    return false;
  }
}

// ============================================
// PROFILE FUNCTIONS
// ============================================

async function getProfile(userId) {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Get profile error:", error);
    return null;
  }
}

async function getAllProfiles() {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Get profiles error:", error);
    return [];
  }
}

// ============================================
// WALLET FUNCTIONS
// ============================================

async function getWallet(userId) {
  try {
    const { data, error } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) throw error;
    return data || { balance: 0, total_added: 0, total_spent: 0 };
  } catch (error) {
    console.error("Get wallet error:", error);
    return { balance: 0, total_added: 0, total_spent: 0 };
  }
}

async function updateWallet(userId, newBalance) {
  try {
    const { data, error } = await supabase
      .from("wallets")
      .update({ balance: newBalance })
      .eq("user_id", userId)
      .select();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Update wallet error:", error);
    throw error;
  }
}

// ============================================
// TRANSACTION FUNCTIONS
// ============================================

async function createTransaction(userId, type, amount, description, reference) {
  try {
    const { data, error } = await supabase
      .from("transactions")
      .insert({
        user_id: userId,
        type: type,
        amount: amount,
        description: description,
        reference: reference || `TXN-${Date.now()}`,
        status: "completed",
      })
      .select();

    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error("Create transaction error:", error);
    throw error;
  }
}

async function getTransactions(userId, limit = 50) {
  try {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Get transactions error:", error);
    return [];
  }
}

async function getAllTransactions() {
  try {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Get all transactions error:", error);
    return [];
  }
}

// ============================================
// SMS NUMBERS FUNCTIONS
// ============================================

async function getSMSNumbers(userId) {
  try {
    const { data, error } = await supabase
      .from("sms_numbers")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Get SMS numbers error:", error);
    return [];
  }
}

async function getAllSMSNumbers() {
  try {
    const { data, error } = await supabase
      .from("sms_numbers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Get all SMS numbers error:", error);
    return [];
  }
}

async function addSMSNumber(
  userId,
  phoneNumber,
  country,
  countryCode,
  service,
  amount
) {
  try {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days validity

    const { data, error } = await supabase
      .from("sms_numbers")
      .insert({
        user_id: userId,
        phone_number: phoneNumber,
        country: country,
        country_code: countryCode,
        service: service,
        status: "active",
        amount: amount,
        expires_at: expiresAt.toISOString(),
        activation_code: Math.random().toString().substring(2, 8),
      })
      .select();

    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error("Add SMS number error:", error);
    throw error;
  }
}

async function deleteSMSNumber(numberId) {
  try {
    const { error } = await supabase
      .from("sms_numbers")
      .delete()
      .eq("id", numberId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Delete SMS number error:", error);
    throw error;
  }
}

// ============================================
// SMS MESSAGES FUNCTIONS
// ============================================

async function getSMSMessages(smsNumberId) {
  try {
    const { data, error } = await supabase
      .from("sms_messages")
      .select("*")
      .eq("sms_number_id", smsNumberId)
      .order("received_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Get SMS messages error:", error);
    return [];
  }
}

// ============================================
// LOGS ACCOUNTS FUNCTIONS
// ============================================

async function getLogsAccounts(userId) {
  try {
    const { data, error } = await supabase
      .from("logs_accounts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Get logs accounts error:", error);
    return [];
  }
}

async function addLogsAccount(userId, platform, email, password, amount) {
  try {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days validity

    const { data, error } = await supabase
      .from("logs_accounts")
      .insert({
        user_id: userId,
        platform: platform,
        email: email,
        password: password,
        status: "active",
        amount: amount,
        expires_at: expiresAt.toISOString(),
      })
      .select();

    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error("Add logs account error:", error);
    throw error;
  }
}

// ============================================
// SOCIAL BOOSTS FUNCTIONS
// ============================================

async function getSocialBoosts(userId) {
  try {
    const { data, error } = await supabase
      .from("social_boosts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Get social boosts error:", error);
    return [];
  }
}

async function addSocialBoost(
  userId,
  platform,
  boostType,
  username,
  targetUrl,
  quantity,
  amount
) {
  try {
    const { data, error } = await supabase
      .from("social_boosts")
      .insert({
        user_id: userId,
        platform: platform,
        boost_type: boostType,
        username: username,
        target_url: targetUrl,
        quantity: quantity,
        amount: amount,
        status: "pending",
        delivered: 0,
      })
      .select();

    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error("Add social boost error:", error);
    throw error;
  }
}

// ============================================
// PROMO CODE FUNCTIONS
// ============================================

async function applyPromoCode(userId, code) {
  try {
    // Get promo code
    const { data: promoData, error: promoError } = await supabase
      .from("promo_codes")
      .select("*")
      .eq("code", code)
      .single();

    if (promoError || !promoData) throw new Error("Invalid promo code");

    if (
      !promoData.active ||
      (promoData.expires_at && new Date(promoData.expires_at) < new Date())
    ) {
      throw new Error("Promo code expired or inactive");
    }

    if (promoData.max_uses && promoData.used_count >= promoData.max_uses) {
      throw new Error("Promo code limit reached");
    }

    // Check if user already used this code
    const { data: usageData, error: usageError } = await supabase
      .from("promo_code_usage")
      .select("*")
      .eq("user_id", userId)
      .eq("promo_code_id", promoData.id);

    if (usageData && usageData.length > 0) {
      throw new Error("You already used this promo code");
    }

    // Record usage
    const { error: insertError } = await supabase
      .from("promo_code_usage")
      .insert({
        user_id: userId,
        promo_code_id: promoData.id,
      });

    if (insertError) throw insertError;

    // Update usage count
    const newCount = (promoData.used_count || 0) + 1;
    await supabase
      .from("promo_codes")
      .update({ used_count: newCount })
      .eq("id", promoData.id);

    return {
      discountType: promoData.discount_type,
      discountValue: promoData.discount_value,
    };
  } catch (error) {
    console.error("Apply promo code error:", error);
    throw error;
  }
}

// ============================================
// ADMIN FUNCTIONS
// ============================================

async function getAdminStats() {
  try {
    const profiles = await getAllProfiles();
    const transactions = await getAllTransactions();
    const numbers = await getAllSMSNumbers();

    const totalRevenue = transactions
      .filter((t) => t.type === "debit" && t.status === "completed")
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      totalUsers: profiles.length,
      totalRevenue: totalRevenue,
      activeNumbers: numbers.filter((n) => n.status === "active").length,
      totalTransactions: transactions.length,
    };
  } catch (error) {
    console.error("Get admin stats error:", error);
    return {
      totalUsers: 0,
      totalRevenue: 0,
      activeNumbers: 0,
      totalTransactions: 0,
    };
  }
}
// ============================================
// DYNAMIC PRICING FUNCTIONS
// ============================================

async function getServicePrice(category, serviceName, country = null) {
  try {
    let query = supabase
      .from("pricing")
      .select("selling_price")
      .eq("category", category)
      .eq("service_name", serviceName)
      .eq("is_active", true);

    if (country) {
      query = query.eq("country", country);
    }

    const { data, error } = await query.single();

    if (error) throw error;
    return data ? data.selling_price : null;
  } catch (error) {
    console.error(`Error fetching price for ${serviceName}:`, error);
    return null;
  }
}

async function getAllActivePricing(category = null) {
  try {
    let query = supabase.from("pricing").select("*").eq("is_active", true);

    if (category) {
      query = query.eq("category", category);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching pricing:", error);
    return [];
  }
}
// ============================================
// UTILITY FUNCTIONS
// ============================================

function formatCurrency(amount) {
  return `₦${parseFloat(amount).toFixed(2)}`;
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString();
}

function formatDateTime(dateString) {
  return new Date(dateString).toLocaleString();
}

// Initialize UI
function initializeUI() {
  // Update time
  updateTime();
  setInterval(updateTime, 60000);

  // Hamburger menu
  const hamburger = document.getElementById("hamburger");
  const sidebar = document.getElementById("sidebar");

  if (hamburger && sidebar) {
    hamburger.addEventListener("click", () => {
      hamburger.classList.toggle("active");
      sidebar.classList.toggle("active");
    });

    // Close sidebar when clicking outside on mobile
    document.addEventListener("click", (e) => {
      if (window.innerWidth <= 768) {
        if (!sidebar.contains(e.target) && !hamburger.contains(e.target)) {
          sidebar.classList.remove("active");
          hamburger.classList.remove("active");
        }
      }
    });
  }

  // Theme toggle
  const themeToggle = document.getElementById("themeToggle");
  let isDark = localStorage.getItem("darkMode") === "true";

  function applyTheme() {
    if (isDark) {
      document.body.style.backgroundColor = "#1a1a1a";
      if (themeToggle) {
        themeToggle.textContent = "☀️";
      }
    } else {
      document.body.style.backgroundColor = "#f5f5f5";
      if (themeToggle) {
        themeToggle.textContent = "🌙";
      }
    }
  }

  applyTheme();

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      isDark = !isDark;
      localStorage.setItem("darkMode", isDark);
      document.body.style.transition = "background-color 0.3s";
      applyTheme();
    });
  }

  // Contact link - Open WhatsApp
  const contactLink = document.getElementById("contactLink");
  if (contactLink) {
    contactLink.addEventListener("click", (e) => {
      e.preventDefault();
      const whatsappNumber = "2349012726301"; // +234 901 272 6301
      const message = encodeURIComponent("Hello, I need help with Femzy");
      window.open(`https://wa.me/${whatsappNumber}?text=${message}`, "_blank");
    });
  }

  // Logout
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async (e) => {
      e.preventDefault();

      if (confirm("Are you sure you want to log out?")) {
        const result = await Auth.signOut();
        if (result.success) {
          window.location.href = "../index.html";
        } else {
          alert("Error logging out. Please try again.");
        }
      }
    });
  }
}

// Update time display
function updateTime() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const mobileTime = document.getElementById("mobileTime");
  if (mobileTime) {
    mobileTime.textContent = `${hours}:${minutes}`;
  }
}

// Resize handler for sidebar
window.addEventListener("resize", () => {
  const sidebar = document.getElementById("sidebar");
  const hamburger = document.getElementById("hamburger");

  if (window.innerWidth > 768) {
    sidebar.classList.remove("hidden");
    hamburger.classList.remove("active");
  } else {
    sidebar.classList.remove("active");
  }
});
