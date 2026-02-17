// Admin Page Logic

let currentAdmin = null;
let autoRefreshInterval = null;

// Initialize UI
function initAdminPage() {
  console.log("Initializing Admin Page UI...");
  // Hamburger menu
  const hamburger = document.getElementById("hamburger");
  const sidebar = document.getElementById("sidebar");

  if (hamburger && sidebar) {
    // Clone to remove existing listeners to prevent duplication
    const newHamburger = hamburger.cloneNode(true);
    hamburger.parentNode.replaceChild(newHamburger, hamburger);

    newHamburger.addEventListener("click", (e) => {
      e.stopPropagation();
      newHamburger.classList.toggle("active");
      sidebar.classList.toggle("active");
      console.log("Hamburger clicked");
    });

    // Close sidebar when clicking outside
    document.addEventListener("click", (e) => {
      if (window.innerWidth <= 768) {
        if (!sidebar.contains(e.target) && !newHamburger.contains(e.target)) {
          sidebar.classList.remove("active");
          newHamburger.classList.remove("active");
        }
      }
    });

    // Mobile specific: Close sidebar on link click
    sidebar.querySelectorAll(".sidebar-link").forEach((link) => {
      link.addEventListener("click", () => {
        if (window.innerWidth <= 768) {
          sidebar.classList.remove("active");
          newHamburger.classList.remove("active");
        }
      });
    });
  }

  // Theme toggle
  const themeToggle = document.getElementById("themeToggle");
  if (themeToggle) {
    const newThemeToggle = themeToggle.cloneNode(true);
    themeToggle.parentNode.replaceChild(newThemeToggle, themeToggle);

    newThemeToggle.addEventListener("click", () => {
      document.body.classList.toggle("dark-theme");
      const isDark = document.body.classList.contains("dark-theme");
      newThemeToggle.textContent = isDark ? "☀️" : "🌙";
      localStorage.setItem("darkMode", isDark);
    });

    // Load saved theme
    if (localStorage.getItem("darkMode") === "true") {
      document.body.classList.add("dark-theme");
      newThemeToggle.textContent = "☀️";
    }
  }

  // Maintenance Toggle
  const maintenanceToggle = document.getElementById("maintenanceToggle");
  if (maintenanceToggle) {
    // Only attempt to load status, handle errors gracefully inside
    loadMaintenanceStatus();

    const newMaintenanceToggle = maintenanceToggle.cloneNode(true);
    maintenanceToggle.parentNode.replaceChild(
      newMaintenanceToggle,
      maintenanceToggle,
    );

    newMaintenanceToggle.addEventListener("change", async () => {
      const isEnabled = newMaintenanceToggle.checked;
      try {
        const { error } = await supabase
          .from("system_settings")
          .update({ maintenance_mode: isEnabled })
          .not("id", "is", null);

        if (error) throw error;
        alert(`✅ Maintenance Mode ${isEnabled ? "ENABLED" : "DISABLED"}`);

        // Log this admin action
        if (currentAdmin && typeof logUserActivity === "function") {
          await logUserActivity(
            currentAdmin.id,
            "admin_action",
            `Changed maintenance mode to ${isEnabled}`,
          );
        }
      } catch (error) {
        console.error("Error updating maintenance mode:", error);
        newMaintenanceToggle.checked = !isEnabled; // Revert
        alert("❌ Error: " + error.message);
      }
    });
  }
}

async function loadMaintenanceStatus() {
  try {
    const { data, error } = await supabase
      .from("system_settings")
      .select("maintenance_mode")
      .single();

    if (error) {
      // If table doesn't exist (400 or 404), allow it to fail silently
      if (
        error.code === "42P01" ||
        error.message.includes("does not exist") ||
        error.code === "PGRST204"
      ) {
        console.warn(
          "System settings table not found. Skipping maintenance mode check.",
        );
      } else {
        console.error("Error loading maintenance status:", error);
      }
      return;
    }

    if (data) {
      const toggle = document.getElementById("maintenanceToggle");
      if (toggle) toggle.checked = data.maintenance_mode;
    }
  } catch (error) {
    console.error("Exception loading maintenance status:", error);
  }
}

// Function to safely check authentication
async function safeCheckAuth() {
  if (typeof checkAuth === "function") {
    return await checkAuth();
  } else if (
    typeof Auth !== "undefined" &&
    typeof Auth.checkAuth === "function"
  ) {
    return await Auth.checkAuth();
  } else {
    console.error("Authentication check function not found!");
    return false;
  }
}

// Check auth and load data
document.addEventListener("DOMContentLoaded", async () => {
  // Wait for Supabase/Auth to load if needed
  if (typeof supabase === "undefined") {
    console.error("Supabase client not loaded.");
    return;
  }

  const isAuthenticated = await safeCheckAuth();
  if (!isAuthenticated) {
    window.location.href = "../auth.html";
    return;
  }

  try {
    const { user } = await getCurrentUser();
    currentAdmin = user;

    // Check if admin
    const profile = await getProfile(user.id);
    if (!profile || !profile.is_admin) {
      alert("Access Denied: Admin privileges required");
      window.location.href = "../dashboard/index.html";
      return;
    }

    // Initialize UI
    initAdminPage();

    // Load dashboard data
    await loadDashboardData();

    // Auto-refresh every 30 seconds
    if (autoRefreshInterval) clearInterval(autoRefreshInterval);
    autoRefreshInterval = setInterval(loadDashboardData, 30000);
  } catch (e) {
    console.error("Error during admin init:", e);
  }
});

// Load all dashboard data
async function loadDashboardData() {
  try {
    const [users, transactions, numbers, boosts] = await Promise.all([
      getAllProfiles(),
      getAllTransactions(),
      getAllSMSNumbers(),
      getAllSocialBoosts(),
    ]);

    // Update metrics
    updateMetrics(users, transactions, numbers, boosts);

    // Update recent transactions
    updateRecentTransactions(transactions.slice(0, 5));

    // Update last refresh time
    const lastUpdate = document.getElementById("lastUpdate");
    if (lastUpdate) lastUpdate.textContent = new Date().toLocaleTimeString();
  } catch (error) {
    console.error("Error loading dashboard data:", error);
  }
}

// Update metrics
function updateMetrics(users, transactions, numbers, boosts) {
  // Total revenue
  const totalRevenue = transactions
    .filter((t) => t.type === "credit" && t.status === "completed")
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const totalRevenueEl = document.getElementById("totalRevenue");
  if (totalRevenueEl)
    totalRevenueEl.textContent = `₦${totalRevenue.toFixed(2)}`;

  // Total users
  const totalUsersEl = document.getElementById("totalUsers");
  if (totalUsersEl) totalUsersEl.textContent = users.length;

  // Total numbers
  const totalNumbersEl = document.getElementById("totalNumbers");
  if (totalNumbersEl) totalNumbersEl.textContent = numbers.length;

  // Total boosts
  const totalBoostsEl = document.getElementById("totalBoosts");
  if (totalBoostsEl) totalBoostsEl.textContent = boosts.length;

  // Today's stats
  const today = new Date().toDateString();
  const todayTransactions = transactions.filter(
    (t) => new Date(t.created_at).toDateString() === today,
  );
  const todayRevenue = todayTransactions
    .filter((t) => t.type === "credit" && t.status === "completed")
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const todayRevenueEl = document.getElementById("todayRevenue");
  if (todayRevenueEl)
    todayRevenueEl.textContent = `₦${todayRevenue.toFixed(2)}`;

  const todayTransactionsEl = document.getElementById("todayTransactions");
  if (todayTransactionsEl)
    todayTransactionsEl.textContent = todayTransactions.length;

  // Active numbers
  const activeNumbers = numbers.filter((n) => n.status === "active").length;
  const activeNumbersEl = document.getElementById("activeNumbers");
  if (activeNumbersEl) activeNumbersEl.textContent = activeNumbers;

  // Pending orders
  const pendingOrders = boosts.filter((b) => b.status === "pending").length;
  const pendingOrdersEl = document.getElementById("pendingOrders");
  if (pendingOrdersEl) pendingOrdersEl.textContent = pendingOrders;

  // Total records
  const totalRecords =
    users.length + transactions.length + numbers.length + boosts.length;
  const totalRecordsEl = document.getElementById("totalRecords");
  if (totalRecordsEl) totalRecordsEl.textContent = totalRecords;

  // Inventory stats
  const inventoryTotalEl = document.getElementById("inventoryTotal");
  if (inventoryTotalEl) inventoryTotalEl.textContent = numbers.length;

  const inventoryAvailableEl = document.getElementById("inventoryAvailable");
  if (inventoryAvailableEl)
    inventoryAvailableEl.textContent = numbers.filter(
      (n) => n.status === "active",
    ).length;

  const inventoryUsedEl = document.getElementById("inventoryUsed");
  if (inventoryUsedEl)
    inventoryUsedEl.textContent = numbers.filter(
      (n) => n.status === "used",
    ).length;

  const inventoryExpiredEl = document.getElementById("inventoryExpired");
  if (inventoryExpiredEl)
    inventoryExpiredEl.textContent = numbers.filter(
      (n) => n.status === "expired",
    ).length;
}

// Update recent transactions display
function updateRecentTransactions(transactions) {
  const container = document.getElementById("recentTransactions");
  if (!container) return;

  if (transactions.length === 0) {
    container.innerHTML =
      '<p style="text-align: center; color: #999; padding: 20px;">No transactions yet</p>';
    return;
  }

  let html = '<div style="display: flex; flex-direction: column; gap: 12px;">';
  transactions.forEach((t) => {
    const typeColor = t.type === "credit" ? "#43e97b" : "#f5576c";
    const typeIcon = t.type === "credit" ? "↓" : "↑";
    html += `
    <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: rgba(0,0,0,0.02); border-radius: 10px;">
        <div>
        <div style="font-weight: 600; color: #2d3748;">${t.description || "Transaction"}</div>
        <div style="font-size: 12px; color: #718096; margin-top: 4px;">${new Date(t.created_at).toLocaleString()}</div>
        </div>
        <div style="text-align: right;">
        <div style="font-weight: 700; font-size: 16px; color: ${typeColor};">${typeIcon} ₦${parseFloat(t.amount).toFixed(2)}</div>
        <div style="font-size: 12px; color: #718096; margin-top: 4px; text-transform: capitalize;">${t.type}</div>
        </div>
    </div>
    `;
  });
  html += "</div>";
  container.innerHTML = html;
}

// Show section
function showSection(section) {
  // Hide all sections
  ["dashboard", "users", "transactions", "inventory"].forEach((s) => {
    const el = document.getElementById(s + "-section");
    if (el) el.style.display = "none";
  });

  // Show selected section
  const el = document.getElementById(section + "-section");
  if (el) el.style.display = "block";

  // Update sidebar active state
  document.querySelectorAll(".sidebar-link").forEach((link) => {
    link.classList.remove("active");
  });
  // Need event to work? Make it global or attach to window?
  // The functions are called from onclick in HTML.
  if (typeof event !== "undefined" && event.target) {
    event.target.closest(".sidebar-link")?.classList.add("active");
  }

  // Load section-specific data
  if (section === "users") refreshUsers();
  else if (section === "transactions") refreshTransactions();

  // Close sidebar on mobile
  if (window.innerWidth <= 768) {
    const sidebar = document.getElementById("sidebar");
    const hamburger = document.getElementById("hamburger");
    if (sidebar) sidebar.classList.remove("active");
    if (hamburger) hamburger.classList.remove("active");
  }
  // Make function available globally for onclick events
  window.showSection = showSection;
}

// Refresh users
async function refreshUsers() {
  const tbody = document.getElementById("usersTableBody");
  if (!tbody) return;

  tbody.innerHTML =
    '<tr><td colspan="5" style="padding: 20px; text-align: center; color: #999;">Loading...</td></tr>';

  try {
    const users = await getAllProfiles();

    if (users.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="5" style="padding: 20px; text-align: center; color: #999;">No users found</td></tr>';
      return;
    }

    let html = "";
    for (const user of users) {
      const wallet = await getWallet(user.id);
      html += `
        <tr style="border-bottom: 1px solid rgba(0,0,0,0.05); transition: background 0.3s;" onmouseover="this.style.background='rgba(102,126,234,0.02)'" onmouseout="this.style.background='transparent'">
        <td style="padding: 12px;">${user.email}</td>
        <td style="padding: 12px;">${user.username || "N/A"}</td>
        <td style="padding: 12px; font-weight: 600;">₦${parseFloat(wallet.balance || 0).toFixed(2)}</td>
        <td style="padding: 12px;">${new Date(user.created_at).toLocaleDateString()}</td>
        <td style="padding: 12px;">${user.is_admin ? "✅ Yes" : "❌ No"}</td>
        <td style="padding: 12px; display: flex; gap: 8px;">
            <button class="btn-secondary" style="padding: 6px 10px; font-size: 12px;" onclick="viewUserLogs('${user.id}', '${user.email}')">📋 Logs</button>
            ${!user.is_admin ? `<button class="btn-danger" style="padding: 6px 10px; font-size: 12px; background: #ff4757;" onclick="deleteUserAccount('${user.id}')">🗑️ Delete</button>` : ""}
        </td>
        </tr>
    `;
    }
    tbody.innerHTML = html;
  } catch (error) {
    console.error("Error loading users:", error);
    tbody.innerHTML =
      '<tr><td colspan="6" style="padding: 20px; text-align: center; color: #f5576c;">Error loading users</td></tr>';
  }
}

// Delete User Account
async function deleteUserAccount(userId) {
  if (
    !confirm(
      "⚠️ ARE YOU SURE? This will permanently delete this user, their wallet, and all their data! This cannot be undone.",
    )
  )
    return;

  try {
    // Note: In Supabase, deleting from profiles will cascade if set correctly,
    // but we usually delete from auth.users via an edge function or admin API.
    // For now, we delete from the profile which triggers our RLS/Cascade if set.
    const { error } = await supabase.from("profiles").delete().eq("id", userId);
    if (error) throw error;

    alert("✅ User deleted successfully.");
    refreshUsers();
    loadDashboardData();
  } catch (error) {
    alert("❌ Error deleting user: " + error.message);
  }
}

// View User Logs
async function viewUserLogs(userId, email) {
  showSection("logs");
  const logTitle = document.getElementById("logViewTitle");
  if (logTitle) logTitle.textContent = `Activity Logs for: ${email}`;
  refreshLogs(userId);
}

// Refresh Logs
async function refreshLogs(userId = null) {
  const tbody = document.getElementById("logsTableBody");
  if (!tbody) return;

  tbody.innerHTML =
    '<tr><td colspan="4" style="padding: 20px; text-align: center;">Loading logs...</td></tr>';

  try {
    let query = supabase
      .from("user_activity_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (userId) query = query.eq("user_id", userId);

    const { data, error } = await query;
    if (error) throw error;

    if (data.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="4" style="padding: 20px; text-align: center;">No logs found.</td></tr>';
      return;
    }

    tbody.innerHTML = data
      .map(
        (log) => `
    <tr style="border-bottom: 1px solid rgba(0,0,0,0.05);">
        <td style="padding: 12px; font-size: 13px;">${new Date(log.created_at).toLocaleString()}</td>
        <td style="padding: 12px;"><span style="padding: 4px 8px; border-radius: 4px; background: rgba(102,126,234,0.1); font-size: 11px; font-weight: 700;">${log.activity_type.toUpperCase()}</span></td>
        <td style="padding: 12px; font-size: 13px;">${log.description}</td>
        <td style="padding: 12px; font-size: 11px; color: #777;">${log.metadata ? JSON.stringify(log.metadata) : "-"}</td>
    </tr>
    `,
      )
      .join("");
  } catch (error) {
    tbody.innerHTML = `<tr><td colspan="4" style="padding: 20px; text-align: center; color: red;">Error: ${error.message}</td></tr>`;
  }
}

// Refresh transactions
async function refreshTransactions() {
  const tbody = document.getElementById("transactionsTableBody");
  if (!tbody) return;

  tbody.innerHTML =
    '<tr><td colspan="5" style="padding: 20px; text-align: center; color: #999;">Loading...</td></tr>';

  try {
    const transactions = await getAllTransactions();

    if (transactions.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="5" style="padding: 20px; text-align: center; color: #999;">No transactions found</td></tr>';
      return;
    }

    let html = "";
    transactions.forEach((t) => {
      const typeColor = t.type === "credit" ? "#43e97b" : "#f5576c";
      const statusColor =
        t.status === "completed"
          ? "#43e97b"
          : t.status === "pending"
            ? "#fee140"
            : "#f5576c";
      html += `
        <tr style="border-bottom: 1px solid rgba(0,0,0,0.05);">
        <td style="padding: 12px;">${new Date(t.created_at).toLocaleString()}</td>
        <td style="padding: 12px; text-transform: capitalize; color: ${typeColor}; font-weight: 600;">${t.type}</td>
        <td style="padding: 12px; font-weight: 600;">₦${parseFloat(t.amount).toFixed(2)}</td>
        <td style="padding: 12px;">${t.description || "N/A"}</td>
        <td style="padding: 12px;"><span style="padding: 4px 12px; background: ${statusColor}22; color: ${statusColor}; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: capitalize;">${t.status}</span></td>
        </tr>
    `;
    });
    tbody.innerHTML = html;
  } catch (error) {
    console.error("Error loading transactions:", error);
    tbody.innerHTML =
      '<tr><td colspan="5" style="padding: 20px; text-align: center; color: #f5576c;">Error loading transactions</td></tr>';
  }
}

// Get all social boosts
async function getAllSocialBoosts() {
  try {
    const { data, error } = await supabase
      .from("social_boosts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching social boosts:", error);
    return [];
  }
}

// Attach these functions to window to be accessible from HTML onclick
window.showSection = showSection;
window.refreshUsers = refreshUsers;
window.deleteUserAccount = deleteUserAccount;
window.viewUserLogs = viewUserLogs;
window.refreshLogs = refreshLogs;
window.refreshTransactions = refreshTransactions;

// Add number form handler
// We need to attach this safely.
const addNumberForm = document.getElementById("addNumberForm");
if (addNumberForm) {
  // Cloning to prevent double listener
  const newForm = addNumberForm.cloneNode(true);
  addNumberForm.parentNode.replaceChild(newForm, addNumberForm);

  newForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const country = document.getElementById("inventoryCountry").value;
    const phone = document.getElementById("inventoryPhone").value;
    const service = document.getElementById("inventoryService").value;
    const price = parseFloat(document.getElementById("inventoryPrice").value);

    const messageEl = document.getElementById("inventoryMessage");
    messageEl.style.display = "block";
    messageEl.textContent = "Adding number...";
    messageEl.style.background = "rgba(102, 126, 234, 0.1)";
    messageEl.style.color = "#667eea";

    try {
      // Add to database (admin user ID)
      const { data, error } = await supabase.from("sms_numbers").insert({
        user_id: currentAdmin.id,
        phone_number: phone,
        country: country,
        country_code: country,
        service: service,
        amount: price,
        status: "active",
      });

      if (error) throw error;

      messageEl.textContent = "✓ Number added successfully!";
      messageEl.style.background = "rgba(67, 233, 123, 0.1)";
      messageEl.style.color = "#43e97b";

      // Reset form
      newForm.reset();

      // Refresh dashboard
      await loadDashboardData();

      setTimeout(() => {
        messageEl.style.display = "none";
      }, 3000);
    } catch (error) {
      console.error("Error adding number:", error);
      messageEl.textContent = "✗ Error adding number: " + error.message;
      messageEl.style.background = "rgba(245, 87, 108, 0.1)";
      messageEl.style.color = "#f5576c";
    }
  });
}

// Logout handlers
const logoutBtnSidebar = document.getElementById("logoutBtnSidebar");
if (logoutBtnSidebar) {
  const newLogoutBtn = logoutBtnSidebar.cloneNode(true);
  logoutBtnSidebar.parentNode.replaceChild(newLogoutBtn, logoutBtnSidebar);

  newLogoutBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    if (confirm("Are you sure you want to logout?")) {
      await Auth.signOut(); // Use Auth.signOut for consistency
      window.location.href = "../auth.html";
    }
  });
}

// Cleanup on page unload
window.addEventListener("beforeunload", () => {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval);
  }
});
