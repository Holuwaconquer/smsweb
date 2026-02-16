// Homepage JavaScript with Carousel for How It Works Section

// Update time
function updateTime() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const timeElement = document.querySelector(".time span");
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
  if (isDark) {
    document.body.style.backgroundColor = "#1a1a1a";
    document.body.style.color = "#f5f5f5";
    themeToggle.textContent = "☀️";
  } else {
    document.body.style.backgroundColor = "#f5f5f5";
    document.body.style.color = "#333";
    themeToggle.textContent = "🌙";
  }
}

applyTheme();

themeToggle.addEventListener("click", () => {
  isDark = !isDark;
  localStorage.setItem("darkMode", isDark);
  document.body.style.transition = "background-color 0.3s, color 0.3s";
  applyTheme();
});

// Carousel for How It Works Section
const servicesData = [
  {
    title: "SMS Verification",
    steps: [
      {
        number: 1,
        title: "Choose a Number",
        description: "Select from USA or global numbers for SMS verification",
      },
      {
        number: 2,
        title: "Receive SMS",
        description:
          "Use the number for verification and receive SMS instantly",
      },
      {
        number: 3,
        title: "Copy & Use",
        description: "Copy the verification code and complete your signup",
      },
    ],
  },
  {
    title: "Logs Service",
    steps: [
      {
        number: 1,
        title: "Select Service",
        description: "Choose the platform you want to access logs from",
      },
      {
        number: 2,
        title: "Get Credentials",
        description: "Receive secure login credentials instantly",
      },
      {
        number: 3,
        title: "Access Account",
        description: "Use credentials to access your desired service",
      },
    ],
  },
  {
    title: "Social Media Booster",
    steps: [
      {
        number: 1,
        title: "Choose Platform",
        description:
          "Select your social media platform (Instagram, TikTok, etc.)",
      },
      {
        number: 2,
        title: "Select Package",
        description: "Pick the boost package that fits your needs",
      },
      {
        number: 3,
        title: "Watch It Grow",
        description: "See your followers, likes, and engagement increase",
      },
    ],
  },
  {
    title: "Phone Numbers",
    steps: [
      {
        number: 1,
        title: "Browse Numbers",
        description: "Explore available phone numbers from 50+ countries",
      },
      {
        number: 2,
        title: "Purchase Number",
        description: "Select and purchase your preferred phone number",
      },
      {
        number: 3,
        title: "Start Using",
        description: "Activate and start using your new phone number",
      },
    ],
  },
];

let currentSlide = 0;

function renderCarousel() {
  const carouselTrack = document.getElementById("carouselTrack");
  const indicators = document.getElementById("carouselIndicators");

  if (!carouselTrack || !indicators) return;

  // Clear existing content
  carouselTrack.innerHTML = "";
  indicators.innerHTML = "";

  // Create slides
  servicesData.forEach((service, index) => {
    const slide = document.createElement("div");
    slide.className = `carousel-slide ${
      index === currentSlide ? "active" : ""
    }`;

    slide.innerHTML = `
            <h3 class="service-title">${service.title}</h3>
            <div class="steps">
                ${service.steps
                  .map(
                    (step) => `
                    <div class="step">
                        <div class="step-number">${step.number}</div>
                        <h3>${step.title}</h3>
                        <p>${step.description}</p>
                    </div>
                `
                  )
                  .join("")}
            </div>
        `;

    carouselTrack.appendChild(slide);

    // Create indicator
    const indicator = document.createElement("div");
    indicator.className = `indicator ${index === currentSlide ? "active" : ""}`;
    indicator.addEventListener("click", () => goToSlide(index));
    indicators.appendChild(indicator);
  });
}

function goToSlide(index) {
  currentSlide = index;
  updateCarousel();
}

function nextSlide() {
  currentSlide = (currentSlide + 1) % servicesData.length;
  updateCarousel();
}

function prevSlide() {
  currentSlide = (currentSlide - 1 + servicesData.length) % servicesData.length;
  updateCarousel();
}

function updateCarousel() {
  const slides = document.querySelectorAll(".carousel-slide");
  const indicators = document.querySelectorAll(".indicator");

  slides.forEach((slide, index) => {
    slide.classList.toggle("active", index === currentSlide);
  });

  indicators.forEach((indicator, index) => {
    indicator.classList.toggle("active", index === currentSlide);
  });
}

// Initialize carousel when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  renderCarousel();

  // Carousel button events
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");

  if (prevBtn) prevBtn.addEventListener("click", prevSlide);
  if (nextBtn) nextBtn.addEventListener("click", nextSlide);

  // Auto-play carousel (optional)
  // setInterval(nextSlide, 5000);
});

// Smooth scrolling for all buttons
document.querySelectorAll("button").forEach((button) => {
  button.addEventListener("click", function (e) {
    this.style.transform = "scale(0.95)";
    setTimeout(() => {
      this.style.transform = "";
    }, 150);
  });
});

// Intersection Observer for fade-in animations
const observerOptions = {
  threshold: 0.1,
  rootMargin: "0px 0px -100px 0px",
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = "1";
      entry.target.style.transform = "translateY(0)";
    }
  });
}, observerOptions);

// Animate feature cards and testimonials
document.querySelectorAll(".feature-card, .testimonial-card").forEach((el) => {
  el.style.opacity = "0";
  el.style.transform = "translateY(30px)";
  el.style.transition = "opacity 0.6s, transform 0.6s";
  observer.observe(el);
});

// Chat button interaction
const chatButton = document.querySelector(".chat-button");

// Add ripple effect to buttons
document.querySelectorAll("button").forEach((button) => {
  button.addEventListener("mousedown", function (e) {
    const ripple = document.createElement("span");
    const rect = this.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.3);
            left: ${x}px;
            top: ${y}px;
            pointer-events: none;
            animation: ripple 0.6s ease-out;
        `;

    this.style.position = "relative";
    this.style.overflow = "hidden";
    this.appendChild(ripple);

    setTimeout(() => ripple.remove(), 600);
  });
});

// Add ripple animation
const style = document.createElement("style");
style.textContent = `
    @keyframes ripple {
        to {
            transform: scale(2);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Footer JavaScript
// Update copyright year automatically
const yearElement = document.getElementById("currentYear");
if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}

// Smooth scroll for footer links
document.querySelectorAll(".footer-links a").forEach((link) => {
  link.addEventListener("click", function (e) {
    const href = this.getAttribute("href");
    if (href.startsWith("#")) {
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({ behavior: "smooth" });
      }
    }
  });
});
