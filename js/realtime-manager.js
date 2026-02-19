/**
 * Realtime Manager - Central system for all realtime subscriptions
 * Handles Supabase realtime updates for seamless instant data sync
 * All updates are silent (invisible) - data just updates in background
 */

class RealtimeManager {
  constructor() {
    this.subscriptions = new Map();
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 0; // Disable reconnection attempts
    this.reconnectDelay = 2000;
    this.enabled = true;
  }

  /**
   * Register a listener for data changes
   * @param {string} key - Unique listener key
   * @param {function} callback - Called when data changes
   */
  on(key, callback) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, []);
    }
    this.listeners.get(key).push(callback);
  }

  /**
   * Remove a listener
   */
  off(key, callback) {
    const listeners = this.listeners.get(key);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Trigger all listeners for a key
   */
  _emit(key, data) {
    const listeners = this.listeners.get(key);
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in realtime listener ${key}:`, error);
        }
      });
    }
  }

  /**
   * Subscribe to profile changes (user's own profile)
   */
  subscribeToProfile(userId) {
    if (!this.enabled) return;
    const key = `profile:${userId}`;

    if (this.subscriptions.has(key)) {
      return; // Already subscribed
    }

    try {
      const channel = supabase
        .channel(`profiles:${userId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "profiles",
            filter: `id=eq.${userId}`,
          },
          (payload) => {
            console.log("📊 Profile updated:", payload.new);
            this._emit("profile:update", payload.new);
          }
        )
        .subscribe((status) => {
          console.log(`Profile subscription status: ${status}`);
          if (status === "CLOSED" || status === "CHANNEL_ERROR") {
            this.subscriptions.delete(key);
            this.enabled = false; // Disable realtime if connection fails
          }
        });

      this.subscriptions.set(key, channel);
    } catch (error) {
      console.log(
        "⚠️ Realtime unavailable - app will still work with manual refreshes"
      );
      this.enabled = false;
    }
  }

  /**
   * Subscribe to wallet changes (user's own wallet)
   */
  subscribeToWallet(userId) {
    const key = `wallet:${userId}`;

    if (this.subscriptions.has(key)) {
      return;
    }

    const channel = supabase
      .channel(`wallets:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "wallets",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log("💰 Wallet updated:", payload.new);
          this._emit("wallet:update", payload.new);
        }
      )
      .subscribe((status) => {
        console.log(`Wallet subscription status: ${status}`);
        if (status === "CLOSED") {
          this.subscriptions.delete(key);
          this._attemptReconnect(key, () => this.subscribeToWallet(userId));
        }
      });

    this.subscriptions.set(key, channel);
  }

  /**
   * Subscribe to transaction changes (user's transactions)
   */
  subscribeToTransactions(userId) {
    const key = `transactions:${userId}`;

    if (this.subscriptions.has(key)) {
      return;
    }

    const channel = supabase
      .channel(`transactions:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "transactions",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log("📝 New transaction:", payload.new);
          this._emit("transaction:new", payload.new);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "transactions",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log("📝 Transaction updated:", payload.new);
          this._emit("transaction:update", payload.new);
        }
      )
      .subscribe((status) => {
        console.log(`Transactions subscription status: ${status}`);
        if (status === "CLOSED") {
          this.subscriptions.delete(key);
          this._attemptReconnect(key, () =>
            this.subscribeToTransactions(userId)
          );
        }
      });

    this.subscriptions.set(key, channel);
  }

  /**
   * Subscribe to SMS numbers (user's numbers)
   */
  subscribeToSmsNumbers(userId) {
    const key = `sms:${userId}`;

    if (this.subscriptions.has(key)) {
      return;
    }

    const channel = supabase
      .channel(`sms_numbers:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "sms_numbers",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log("📱 SMS numbers updated:", payload);
          if (payload.eventType === "INSERT") {
            this._emit("sms:new", payload.new);
          } else if (payload.eventType === "DELETE") {
            this._emit("sms:deleted", payload.old);
          } else if (payload.eventType === "UPDATE") {
            this._emit("sms:updated", payload.new);
          }
        }
      )
      .subscribe((status) => {
        console.log(`SMS numbers subscription status: ${status}`);
        if (status === "CLOSED") {
          this.subscriptions.delete(key);
          this._attemptReconnect(key, () => this.subscribeToSmsNumbers(userId));
        }
      });

    this.subscriptions.set(key, channel);
  }

  /**
   * Subscribe to social media links (for contact page)
   */
  subscribeToSocialMediaLinks() {
    const key = "social-media-links";

    if (this.subscriptions.has(key)) {
      return;
    }

    const channel = supabase
      .channel(key)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "social_media_links" },
        (payload) => {
          console.log("🔗 Social media links updated:", payload);
          this._emit("social-media:update", payload);
        }
      )
      .subscribe((status) => {
        console.log(`Social media links subscription status: ${status}`);
        if (status === "CLOSED") {
          this.subscriptions.delete(key);
          this._attemptReconnect(key, () => this.subscribeToSocialMediaLinks());
        }
      });

    this.subscriptions.set(key, channel);
  }

  /**
   * ADMIN: Subscribe to all profile changes (for admin dashboard)
   */
  subscribeToAllProfiles() {
    const key = "admin:all-profiles";

    if (this.subscriptions.has(key)) {
      return;
    }

    const channel = supabase
      .channel(key)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        (payload) => {
          console.log("👥 User profile changed:", payload);
          this._emit("admin:profile-change", payload);
        }
      )
      .subscribe((status) => {
        console.log(`All profiles subscription status: ${status}`);
        if (status === "CLOSED") {
          this.subscriptions.delete(key);
          this._attemptReconnect(key, () => this.subscribeToAllProfiles());
        }
      });

    this.subscriptions.set(key, channel);
  }

  /**
   * ADMIN: Subscribe to all wallet changes
   */
  subscribeToAllWallets() {
    const key = "admin:all-wallets";

    if (this.subscriptions.has(key)) {
      return;
    }

    const channel = supabase
      .channel(key)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "wallets" },
        (payload) => {
          console.log("💰 Wallet changed:", payload);
          this._emit("admin:wallet-change", payload);
        }
      )
      .subscribe((status) => {
        console.log(`All wallets subscription status: ${status}`);
        if (status === "CLOSED") {
          this.subscriptions.delete(key);
          this._attemptReconnect(key, () => this.subscribeToAllWallets());
        }
      });

    this.subscriptions.set(key, channel);
  }

  /**
   * ADMIN: Subscribe to all transactions
   */
  subscribeToAllTransactions() {
    const key = "admin:all-transactions";

    if (this.subscriptions.has(key)) {
      return;
    }

    const channel = supabase
      .channel(key)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "transactions" },
        (payload) => {
          console.log("📊 Transaction changed:", payload);
          this._emit("admin:transaction-change", payload);
        }
      )
      .subscribe((status) => {
        console.log(`All transactions subscription status: ${status}`);
        if (status === "CLOSED") {
          this.subscriptions.delete(key);
          this._attemptReconnect(key, () => this.subscribeToAllTransactions());
        }
      });

    this.subscriptions.set(key, channel);
  }

  /**
   * Attempt to reconnect a subscription
   */
  _attemptReconnect(key, reconnectFn) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(
        `Attempting to reconnect ${key} (${this.reconnectAttempts}/${this.maxReconnectAttempts})`
      );
      setTimeout(() => {
        try {
          reconnectFn();
          this.reconnectAttempts = 0; // Reset on successful reconnect
        } catch (error) {
          console.error(`Failed to reconnect ${key}:`, error);
        }
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error(`Max reconnection attempts reached for ${key}`);
    }
  }

  /**
   * Unsubscribe from a channel
   */
  unsubscribe(key) {
    const subscription = this.subscriptions.get(key);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(key);
      console.log(`Unsubscribed from ${key}`);
    }
  }

  /**
   * Unsubscribe from all channels
   */
  unsubscribeAll() {
    this.subscriptions.forEach((subscription, key) => {
      subscription.unsubscribe();
      console.log(`Unsubscribed from ${key}`);
    });
    this.subscriptions.clear();
    this.listeners.clear();
  }
}

// Global instance
const realtimeManager = new RealtimeManager();

// Export for use in other files
window.realtimeManager = realtimeManager;
