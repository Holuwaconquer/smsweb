// Paystack Configuration Module (Vanilla JavaScript)
// Handles loading Paystack credentials from config.js or window variables
// For development: Edit js/config.js with your credentials
// For production (Vercel): Environment variables injected via window

const getPaystackConfig = () => {
  // Try to get from window.AppConfig (set in config.js)
  if (window.AppConfig && window.AppConfig.paystack) {
    const publicKey = window.AppConfig.paystack.publicKey;
    
    if (publicKey && publicKey.startsWith("pk_")) {
      return { publicKey };
    }
  }

  // Try to get from window variable (Vercel environment injection)
  if (window.__PAYSTACK_PUBLIC_KEY__) {
    const publicKey = window.__PAYSTACK_PUBLIC_KEY__;
    if (publicKey.startsWith("pk_")) {
      return { publicKey };
    }
  }

  // Not found
  throw new Error(
    "Paystack public key not found. Please:\n" +
    "1. For local development: Edit js/config.js and set paystack.publicKey\n" +
    "2. For Vercel: Set VITE_PAYSTACK_PUBLIC_KEY in Vercel's Environment Variables"
  );
};

let PAYSTACK_CONFIG;
try {
  PAYSTACK_CONFIG = getPaystackConfig();
} catch (error) {
  console.warn("⚠️ Warning:", error.message);
  PAYSTACK_CONFIG = {
    publicKey: "pk_test_placeholder",
  };
}

// Export configuration
const PaystackConfig = {
  publicKey: PAYSTACK_CONFIG.publicKey,
  // Helper function to check if configured
  isConfigured() {
    return (
      this.publicKey &&
      this.publicKey !== "pk_test_placeholder" &&
      this.publicKey.startsWith("pk_")
    );
  },
  // Get environment
  getEnvironment() {
    if (this.publicKey.includes("pk_test_")) {
      return "test";
    } else if (this.publicKey.includes("pk_live_")) {
      return "live";
    }
    return "unknown";
  },
};

// Log configuration status (safe - only shows key prefix)
console.log(
  `Paystack initialized in ${PaystackConfig.getEnvironment()} mode`
);

// Make globally available
window.PaystackConfig = PaystackConfig;

// Export for module systems
if (typeof module !== "undefined" && module.exports) {
  module.exports = PaystackConfig;
}
