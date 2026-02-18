// Supabase Configuration (Vanilla JavaScript)
// For development: Set credentials in js/config.js
// For production (Vercel): Environment variables injected via window

// Get configuration from config.js or window variables
// In development: uses values from js/config.js
// In production (Vercel): uses environment variables set in Vercel dashboard
const getSupabaseConfig = () => {
  // Try to get from window.AppConfig (set in config.js)
  if (window.AppConfig && window.AppConfig.supabase) {
    const url = window.AppConfig.supabase.url;
    const anonKey = window.AppConfig.supabase.anonKey;

    if (url && anonKey) {
      return { url, anonKey };
    }
  }

  // Try to get from window variables (Vercel environment injection)
  const url = window.__SUPABASE_URL__;
  const anonKey = window.__SUPABASE_ANON_KEY__;

  if (url && anonKey) {
    return { url, anonKey };
  }

  throw new Error(
    "Supabase configuration not found. Please:\n" +
    "1. For local development: Edit js/config.js and set supabase.url and supabase.anonKey\n" +
    "2. For Vercel: Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel's Environment Variables"
  );
};

let SUPABASE_CONFIG;
try {
  SUPABASE_CONFIG = getSupabaseConfig();
} catch (error) {
  console.warn("⚠️ Warning:", error.message);
  // Use placeholder values for dev - must be configured for production
  SUPABASE_CONFIG = {
    url: "https://bsgrvwykbyqunlvlqvnt.supabase.co",
    anonKey:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzZ3J2d3lrYnlxdW5sdmxxdm50Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNTg5MDMsImV4cCI6MjA4NjczNDkwM30.zbkzBmh-TIrhhpF0YL5QrvE765meEd4V5WoTkuorNGo",
  };
}

// Initialize Supabase client
try {
  console.log("Initializing Supabase client...");
  console.log("Supabase URL:", SUPABASE_CONFIG.url);
  console.log("Anon key configured:", !!SUPABASE_CONFIG.anonKey);

  // Check if Supabase library is loaded (check the global window object)
  if (typeof window.supabase === "undefined") {
    console.error("Supabase library not loaded!");
    throw new Error("Supabase library not loaded");
  }

  // Create the supabase client using the global library
  const supabaseClient = window.supabase.createClient(
    SUPABASE_CONFIG.url,
    SUPABASE_CONFIG.anonKey
  );

  // Make it globally available
  window.supabase = supabaseClient;
  console.log("Supabase client initialized successfully");
} catch (error) {
  console.error("Failed to initialize Supabase client:", error);
  // Create a dummy supabase object to prevent further errors
  window.supabase = {
    auth: {
      signUp: async () => ({ error: { message: "Supabase not initialized" } }),
      signInWithPassword: async () => ({
        error: { message: "Supabase not initialized" },
      }),
    },
  };
}

// Auth Helper Functions
const Auth = {
  // Sign up new user
  async signUp(email, password, username) {
    try {
      console.log("Starting signup process for:", email);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username,
          },
          emailRedirectTo: window.location.origin + "/auth.html",
        },
      });

      console.log("Supabase signup response:", { data, error });

      if (error) {
        console.error("Supabase signup error:", error);
        throw error;
      }
      console.log("Signup successful:", data);

      // For development: Auto-signin after signup to bypass email confirmation
      if (data.user && !data.user.email_confirmed_at) {
        console.log(
          "User created but not confirmed, attempting auto sign-in..."
        );
        try {
          const { data: signInData, error: signInError } =
            await supabase.auth.signInWithPassword({
              email,
              password,
            });

          if (signInError) {
            console.log("Auto sign-in failed (expected):", signInError.message);
            return {
              success: true,
              data,
              needsConfirmation: true,
              message:
                "Account created! Please check your email to confirm, then try signing in.",
            };
          }

          console.log("Auto sign-in successful!");
          return {
            success: true,
            data: signInData,
            autoSignedIn: true,
            message: "Account created and signed in successfully! ",
          };
        } catch (autoSignInError) {
          console.log("Auto sign-in error:", autoSignInError);
          return {
            success: true,
            data,
            needsConfirmation: true,
            message: "Account created! Please check your email to confirm.",
          };
        }
      }

      return { success: true, data };
    } catch (error) {
      console.error("Auth.signUp error:", error);
      return { success: false, error: error.message };
    }
  },

  // Sign in user
  async signIn(email, password) {
    try {
      console.log("Starting signin process for:", email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log("Supabase signin response:", { data, error });

      if (error) {
        console.error("Supabase signin error:", error);
        return { success: false, error: error.message };
      }
      console.log("Signin successful:", data);
      return { success: true, data };
    } catch (error) {
      console.error("Auth.signIn error:", error);
      return { success: false, error: error.message };
    }
  },

  // Sign out user
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Get current user
  async getCurrentUser() {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error) throw error;
      return { success: true, user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Check if user is logged in
  async checkAuth() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session !== null;
  },
};

// Make Auth globally available
window.Auth = Auth;
console.log("Auth object created and made globally available");

// Database Helper Functions
const DB = {
  // Get user profile
  async getProfile(userId) {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Update user profile
  async updateProfile(userId, updates) {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", userId)
        .select();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Get wallet balance
  async getWallet(userId) {
    try {
      const { data, error } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Get transactions
  async getTransactions(userId, limit = 50) {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Get SMS numbers
  async getSMSNumbers(userId) {
    try {
      const { data, error } = await supabase
        .from("sms_numbers")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Get logs accounts
  async getLogsAccounts(userId) {
    try {
      const { data, error } = await supabase
        .from("logs_accounts")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Get social boosts
  async getSocialBoosts(userId) {
    try {
      const { data, error } = await supabase
        .from("social_boosts")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Apply promo code
  async applyPromoCode(userId, code) {
    try {
      // Check if promo code exists and is valid
      const { data: promoCode, error: promoError } = await supabase
        .from("promo_codes")
        .select("*")
        .eq("code", code.toUpperCase())
        .eq("active", true)
        .single();

      if (promoError) throw new Error("Invalid promo code");

      // Check if user has already used this code
      const { data: usage } = await supabase
        .from("promo_code_usage")
        .select("*")
        .eq("user_id", userId)
        .eq("promo_code_id", promoCode.id);

      if (usage && usage.length > 0) {
        throw new Error("You have already used this promo code");
      }

      // Check if code has expired
      if (promoCode.expires_at && new Date(promoCode.expires_at) < new Date()) {
        throw new Error("This promo code has expired");
      }

      // Check if max uses reached
      if (promoCode.max_uses && promoCode.used_count >= promoCode.max_uses) {
        throw new Error("This promo code has reached its usage limit");
      }

      return { success: true, data: promoCode };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
};

// Paystack Integration
const PAYSTACK_PUBLIC_KEY = "YOUR_PAYSTACK_PUBLIC_KEY"; // Replace with your Paystack public key

const Paystack = {
  // Initialize payment
  initializePayment(amount, email, callback) {
    const handler = PaystackPop.setup({
      key: PAYSTACK_PUBLIC_KEY,
      email: email,
      amount: amount * 100, // Convert to kobo
      currency: "NGN",
      ref: "BDSMS_" + Math.floor(Math.random() * 1000000000 + 1),
      callback: function (response) {
        callback(response);
      },
      onClose: function () {
        console.log("Payment window closed");
      },
    });
    handler.openIframe();
  },

  // Verify payment
  async verifyPayment(reference) {
    // This should be done on your backend for security
    // For now, we'll just return success
    return { success: true, reference };
  },
};

// Export for use in other files
if (typeof module !== "undefined" && module.exports) {
  module.exports = { Auth, DB, Paystack, supabase };
}
