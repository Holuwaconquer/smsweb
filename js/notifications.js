// Custom Toast Notification System
// Replaces browser native alerts with beautiful web-based notifications

const NotificationManager = {
  // Create toast container if it doesn't exist
  init() {
    if (!document.getElementById("notification-container")) {
      const container = document.createElement("div");
      container.id = "notification-container";
      container.style.cssText = `
        position: fixed;
        top: 100px;
        right: 24px;
        z-index: 9999;
        max-width: 400px;
        pointer-events: none;
      `;
      document.body.appendChild(container);
    }
  },

  // Show notification toast
  show(message, type = "info", duration = 3000) {
    this.init();

    const container = document.getElementById("notification-container");
    const toast = document.createElement("div");
    const toastId = `toast-${Date.now()}`;
    toast.id = toastId;

    // Determine styling based on type
    let bgColor, borderColor, icon;
    switch (type) {
      case "success":
        bgColor = "#10b981";
        borderColor = "#059669";
        icon = "✅";
        break;
      case "error":
        bgColor = "#ef4444";
        borderColor = "#dc2626";
        icon = "❌";
        break;
      case "warning":
        bgColor = "#f59e0b";
        borderColor = "#d97706";
        icon = "⚠️";
        break;
      case "info":
      default:
        bgColor = "#3b82f6";
        borderColor = "#1d4ed8";
        icon = "ℹ️";
    }

    toast.style.cssText = `
      background: linear-gradient(135deg, ${bgColor} 0%, ${bgColor}dd 100%);
      color: white;
      padding: 16px 20px;
      border-radius: 12px;
      margin-bottom: 12px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
      border-left: 4px solid ${borderColor};
      animation: slideIn 0.3s cubic-bezier(0.23, 1, 0.32, 1);
      pointer-events: auto;
      font-weight: 500;
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 12px;
      max-width: 100%;
      word-wrap: break-word;
    `;

    toast.innerHTML = `
      <span style="min-width: 20px; font-size: 18px;">${icon}</span>
      <span style="flex: 1;">${message}</span>
      <button onclick="document.getElementById('${toastId}').remove()" style="
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        cursor: pointer;
        font-size: 18px;
        width: 28px;
        height: 28px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
        padding: 0;
      " onmouseover="this.style.background='rgba(255, 255, 255, 0.3)'" onmouseout="this.style.background='rgba(255, 255, 255, 0.2)'">
        ✕
      </button>
    `;

    container.appendChild(toast);

    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        toast.style.animation = "slideOut 0.3s cubic-bezier(0.23, 1, 0.32, 1)";
        setTimeout(() => toast.remove(), 300);
      }, duration);
    }

    return toast;
  },

  success(message, duration = 3000) {
    return this.show(message, "success", duration);
  },

  error(message, duration = 4000) {
    return this.show(message, "error", duration);
  },

  warning(message, duration = 3500) {
    return this.show(message, "warning", duration);
  },

  info(message, duration = 3000) {
    return this.show(message, "info", duration);
  },

  // Show loading state (doesn't auto-close)
  loading(message) {
    return this.show(`⏳ ${message}`, "info", 0);
  },
};

// Add animation styles to page
const style = document.createElement("style");
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }

  @media (max-width: 768px) {
    #notification-container {
      left: 12px !important;
      right: 12px !important;
      max-width: none !important;
    }
  }
`;
document.head.appendChild(style);

// Optional: Override window.alert globally (advanced - use with caution)
window.showNotification = function (message, type = "info") {
  NotificationManager.show(message, type);
};

// Confirmation Modal Dialog System
const ConfirmationManager = {
  init() {
    if (!document.getElementById("confirmation-modal-container")) {
      const container = document.createElement("div");
      container.id = "confirmation-modal-container";
      container.style.cssText = `
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: 10000;
        align-items: center;
        justify-content: center;
        animation: fadeInBg 0.2s ease-in;
      `;
      document.body.appendChild(container);
    }
  },

  show(message, onConfirm, onCancel = null) {
    this.init();

    const container = document.getElementById("confirmation-modal-container");
    const modalId = `confirm-${Date.now()}`;

    const modal = document.createElement("div");
    modal.id = modalId;
    modal.style.cssText = `
      background: white;
      border-radius: 12px;
      padding: 28px 24px;
      max-width: 400px;
      width: 90%;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      animation: slideInUp 0.3s cubic-bezier(0.23, 1, 0.32, 1);
      z-index: 10001;
    `;

    // Check if it's a dark theme
    const isDarkMode =
      localStorage.getItem("darkMode") === "true" ||
      document.body.style.backgroundColor === "#1a1a1a";
    if (isDarkMode) {
      modal.style.background = "#2a2a2a";
      modal.style.color = "#f5f5f5";
    }

    const closeModal = () => {
      container.style.display = "none";
      modal.remove();
    };

    const handleConfirm = () => {
      closeModal();
      if (onConfirm) onConfirm(true);
    };

    const handleCancel = () => {
      closeModal();
      if (onCancel) onCancel(false);
    };

    modal.innerHTML = `
      <p style="${
        isDarkMode ? "color: #f5f5f5;" : "color: #333;"
      } font-size: 16px; line-height: 1.5; margin: 0 0 24px 0; word-break: break-word;">
        ${message}
      </p>
      <div style="display: flex; gap: 12px; justify-content: flex-end;">
        <button id="cancel-btn-${modalId}" style="
          padding: 10px 20px;
          border: 1px solid #ccc;
          background: ${isDarkMode ? "#333" : "#f0f0f0"};
          color: ${isDarkMode ? "#f5f5f5" : "#333"};
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
        " onmouseover="this.style.background='${
          isDarkMode ? "#444" : "#e0e0e0"
        }'" onmouseout="this.style.background='${
      isDarkMode ? "#333" : "#f0f0f0"
    }'">
          Cancel
        </button>
        <button id="confirm-btn-${modalId}" style="
          padding: 10px 20px;
          border: none;
          background: #10b981;
          color: white;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
        " onmouseover="this.style.background='#059669'" onmouseout="this.style.background='#10b981'">
          Confirm
        </button>
      </div>
    `;

    container.appendChild(modal);
    container.style.display = "flex";

    document
      .getElementById(`cancel-btn-${modalId}`)
      .addEventListener("click", handleCancel);
    document
      .getElementById(`confirm-btn-${modalId}`)
      .addEventListener("click", handleConfirm);

    // Close on overlay click
    container.addEventListener("click", (e) => {
      if (e.target === container) {
        handleCancel();
      }
    });

    return modal;
  },
};

// Add additional animations
const additionalStyles = document.createElement("style");
additionalStyles.textContent = `
  @keyframes fadeInBg {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes slideInUp {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
`;
document.head.appendChild(additionalStyles);
