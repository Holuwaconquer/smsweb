// Auth Page JavaScript (Login & Signup Combined) with Supabase Integration

// Update time
function updateTime() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const timeElement = document.getElementById("currentTime");
  if (timeElement) {
    timeElement.textContent = `${hours}:${minutes}`;
  }
}
updateTime();
setInterval(updateTime, 60000);

// Theme Toggle
const themeToggle = document.getElementById("themeToggle");
let isDark = localStorage.getItem("darkMode") === "true";

function applyTheme() {
  const body = document.body;
  const authCard = document.querySelector(".auth-card");
  const inputs = document.querySelectorAll(".form-input");
  const labels = document.querySelectorAll(".form-label");

  if (isDark) {
    body.style.backgroundColor = "#1a1a1a";
    document.querySelector(".main-content").style.backgroundColor = "#1a1a1a";
    if (authCard) {
      authCard.style.backgroundColor = "#2a2a2a";
      authCard.style.color = "#f5f5f5";
    }
    inputs.forEach((input) => {
      input.style.backgroundColor = "#333";
      input.style.borderColor = "#444";
      input.style.color = "#f5f5f5";
    });
    labels.forEach((label) => {
      label.style.color = "#e0e0e0";
    });
    themeToggle.textContent = "☀️";
  } else {
    body.style.backgroundColor = "#f5f5f5";
    document.querySelector(".main-content").style.backgroundColor = "#f5f5f5";
    if (authCard) {
      authCard.style.backgroundColor = "white";
      authCard.style.color = "#333";
    }
    inputs.forEach((input) => {
      input.style.backgroundColor = "#fafafa";
      input.style.borderColor = "#e0e0e0";
      input.style.color = "#333";
    });
    labels.forEach((label) => {
      label.style.color = "#333";
    });
    themeToggle.textContent = "🌙";
  }
}

applyTheme();

themeToggle.addEventListener("click", () => {
  isDark = !isDark;
  localStorage.setItem("darkMode", isDark);
  document.body.style.transition = "background-color 0.3s";
  applyTheme();
});

// Tab Switching
const authTabs = document.querySelectorAll(".auth-tab");
const tabContents = document.querySelectorAll(".tab-content");

authTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const targetTab = tab.dataset.tab;

    authTabs.forEach((t) => t.classList.remove("active"));
    tabContents.forEach((content) => content.classList.remove("active"));

    tab.classList.add("active");
    document.getElementById(`${targetTab}-tab`).classList.add("active");
  });
});

// Login Form Handling with Supabase
const loginForm = document.getElementById("loginForm");
const signInBtn = document.getElementById("signInBtn");

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    signInBtn.classList.add("loading");
    signInBtn.textContent = "";

    const result = await Auth.signIn(email, password);

    signInBtn.classList.remove("loading");
    signInBtn.textContent = "Sign In";

    if (result.success) {
      alert("Login successful! Welcome back! 🎉");
      window.location.href = "dashboard/index.html";
    } else {
      alert("Error: " + result.error);
    }
  });
}

// Signup Form Handling with Supabase
const signupForm = document.getElementById("signupForm");
const signupBtn = document.getElementById("signupBtn");
const successMessage = document.getElementById("successMessage");

// Password Strength Checker
const signupPassword = document.getElementById("signupPassword");
const strengthIndicator = document.getElementById("passwordStrength");
const strengthBar = document.getElementById("strengthBar");

if (signupPassword) {
  signupPassword.addEventListener("input", function () {
    const password = this.value;
    strengthIndicator.style.display = password.length > 0 ? "block" : "none";

    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
    if (password.match(/\d/)) strength++;
    if (password.match(/[^a-zA-Z\d]/)) strength++;

    strengthBar.className = "password-strength-bar";
    if (strength <= 1) {
      strengthBar.classList.add("strength-weak");
    } else if (strength <= 2) {
      strengthBar.classList.add("strength-medium");
    } else {
      strengthBar.classList.add("strength-strong");
    }
  });
}

// Form Validation Functions
function showError(inputId, errorId, message) {
  const input = document.getElementById(inputId);
  const error = document.getElementById(errorId);
  if (input && error) {
    input.classList.add("error");
    error.style.display = "block";
    error.textContent = message;
  }
}

function clearError(inputId, errorId) {
  const input = document.getElementById(inputId);
  const error = document.getElementById(errorId);
  if (input && error) {
    input.classList.remove("error");
    error.style.display = "none";
  }
}

// Real-time validation for signup
const username = document.getElementById("username");
const signupEmail = document.getElementById("signupEmail");
const confirmPassword = document.getElementById("confirmPassword");

if (username) {
  username.addEventListener("input", function () {
    if (this.value.length >= 3) {
      clearError("username", "usernameError");
    }
  });
}

if (signupEmail) {
  signupEmail.addEventListener("input", function () {
    if (this.value.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      clearError("signupEmail", "emailError");
    }
  });
}

if (confirmPassword) {
  confirmPassword.addEventListener("input", function () {
    const password = document.getElementById("signupPassword").value;
    if (this.value === password) {
      clearError("confirmPassword", "confirmError");
    }
  });
}

// Signup form submission with Supabase
if (signupForm) {
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    let isValid = true;

    clearError("username", "usernameError");
    clearError("signupEmail", "emailError");
    clearError("signupPassword", "passwordError");
    clearError("confirmPassword", "confirmError");

    const usernameVal = document.getElementById("username").value;
    const emailVal = document.getElementById("signupEmail").value;
    const passwordVal = document.getElementById("signupPassword").value;
    const confirmPasswordVal = document.getElementById("confirmPassword").value;

    if (usernameVal.length < 3) {
      showError(
        "username",
        "usernameError",
        "Username must be at least 3 characters"
      );
      isValid = false;
    }

    if (!emailVal.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      showError(
        "signupEmail",
        "emailError",
        "Please enter a valid email address"
      );
      isValid = false;
    }

    if (passwordVal.length < 6) {
      showError(
        "signupPassword",
        "passwordError",
        "Password must be at least 6 characters"
      );
      isValid = false;
    }

    if (passwordVal !== confirmPasswordVal) {
      showError("confirmPassword", "confirmError", "Passwords do not match");
      isValid = false;
    }

    if (isValid) {
      signupBtn.classList.add("loading");
      signupBtn.textContent = "";

      const result = await Auth.signUp(emailVal, passwordVal, usernameVal);

      signupBtn.classList.remove("loading");
      signupBtn.textContent = "Create Account";

      if (result.success) {
        successMessage.style.display = "block";
        signupForm.reset();
        strengthIndicator.style.display = "none";

        setTimeout(() => {
          successMessage.style.display = "none";
          document.querySelector('[data-tab="login"]').click();
        }, 2000);
      } else {
        alert("Error: " + result.error);
      }
    }
  });
}

// Input focus animations
document.querySelectorAll(".form-input").forEach((input) => {
  input.addEventListener("focus", function () {
    this.parentElement.parentElement.style.transform = "translateY(-2px)";
    this.parentElement.parentElement.style.transition = "transform 0.3s";
  });

  input.addEventListener("blur", function () {
    this.parentElement.parentElement.style.transform = "translateY(0)";
  });
});

// Chat button interaction
const chatButton = document.querySelector(".chat-button");
