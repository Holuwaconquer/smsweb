// AI Chatbot for Femzy Website

// Knowledge Base about the website
const websiteKnowledge = {
  services: {
    sms: {
      name: "SMS Verification",
      description:
        "Get instant access to temporary phone numbers for SMS verification. Perfect for testing, privacy, or accessing services without using your personal number.",
      steps: [
        "Choose a number from USA or global numbers",
        "Use the number for verification and receive SMS instantly",
        "Copy the verification code and complete your signup",
      ],
    },
    logs: {
      name: "Logs Service",
      description:
        "Secure access to service credentials and logs for various platforms.",
      steps: [
        "Select the platform you want to access logs from",
        "Receive secure login credentials instantly",
        "Use credentials to access your desired service",
      ],
    },
    socialBooster: {
      name: "Social Media Booster",
      description:
        "Grow your social media presence with our boosting services for Instagram, TikTok, and more.",
      steps: [
        "Choose your social media platform",
        "Select the boost package that fits your needs",
        "Watch your followers, likes, and engagement increase",
      ],
    },
    phoneNumbers: {
      name: "Phone Numbers",
      description:
        "Purchase and use phone numbers from 50+ countries worldwide.",
      steps: [
        "Browse available phone numbers from 50+ countries",
        "Select and purchase your preferred phone number",
        "Activate and start using your new phone number",
      ],
    },
  },
  features: [
    "Lightning Fast - Receive SMS verification codes instantly",
    "Secure & Private - Your data is protected with enterprise-grade security",
    "Global Coverage - Access phone numbers from 50+ countries worldwide",
    "Trusted Service - Used by thousands of satisfied customers daily",
  ],
  pricing:
    "We offer flexible pricing plans. Click 'View Pricing' on our homepage to see our competitive rates.",
  contact:
    "You can reach our support team through the Help Center link in the footer, or use this chat for instant assistance!",
  about:
    "Femzy is a fast, secure, and temporary SMS verification service. We provide temporary phone numbers, logs service, social media boosting, and phone numbers from 50+ countries.",
};

// AI Response Generator
function generateAIResponse(userMessage) {
  const message = userMessage.toLowerCase();

  // Greetings
  if (
    message.match(/\b(hi|hello|hey|good morning|good afternoon|good evening)\b/)
  ) {
    return "Hello! 👋 Welcome to Femzy! I'm your virtual assistant. How can I help you today? You can ask me about our services, pricing, features, or anything else!";
  }

  // SMS Verification questions
  if (message.match(/\b(sms|verification|verify|code|message|text)\b/)) {
    return `📱 **SMS Verification Service**\n\n${
      websiteKnowledge.services.sms.description
    }\n\n**How it works:**\n${websiteKnowledge.services.sms.steps
      .map((step, i) => `${i + 1}. ${step}`)
      .join("\n")}\n\nWould you like to get started?`;
  }

  // Logs Service questions
  if (message.match(/\b(log|logs|credential|access|account)\b/)) {
    return `📋 **Logs Service**\n\n${
      websiteKnowledge.services.logs.description
    }\n\n**How it works:**\n${websiteKnowledge.services.logs.steps
      .map((step, i) => `${i + 1}. ${step}`)
      .join("\n")}`;
  }

  // Social Media Booster questions
  if (
    message.match(
      /\b(social|instagram|tiktok|facebook|twitter|follower|like|boost|engagement)\b/
    )
  ) {
    return `📈 **Social Media Booster**\n\n${
      websiteKnowledge.services.socialBooster.description
    }\n\n**How it works:**\n${websiteKnowledge.services.socialBooster.steps
      .map((step, i) => `${i + 1}. ${step}`)
      .join(
        "\n"
      )}\n\nSupported platforms: Instagram, TikTok, Facebook, Twitter, and more!`;
  }

  // Phone Numbers questions
  if (
    message.match(
      /\b(phone number|numbers|buy number|purchase|country|countries)\b/
    )
  ) {
    return `📞 **Phone Numbers Service**\n\n${
      websiteKnowledge.services.phoneNumbers.description
    }\n\n**How it works:**\n${websiteKnowledge.services.phoneNumbers.steps
      .map((step, i) => `${i + 1}. ${step}`)
      .join("\n")}\n\nWe support 50+ countries worldwide!`;
  }

  // Pricing questions
  if (
    message.match(
      /\b(price|pricing|cost|how much|payment|pay|cheap|expensive|plan)\b/
    )
  ) {
    return `💰 **Pricing Information**\n\n${websiteKnowledge.pricing}\n\nWe offer:\n• Pay-as-you-go options\n• Monthly subscriptions\n• Bulk discounts\n• Enterprise plans\n\nAll plans include 24/7 support and instant delivery!`;
  }

  // Features questions
  if (message.match(/\b(feature|benefit|why|advantage|what do you offer)\b/)) {
    return `✨ **Our Key Features:**\n\n${websiteKnowledge.features
      .map((f) => `• ${f}`)
      .join(
        "\n"
      )}\n\nWe're committed to providing the best service in the industry!`;
  }

  // Sign up / Get started
  if (
    message.match(
      /\b(sign up|signup|register|join|create account|get started|start)\b/
    )
  ) {
    return "🚀 **Ready to Get Started?**\n\nClick the 'Get Started' or 'Sign In' button at the top of the page to create your free account. It only takes a minute!\n\nYou'll get instant access to all our services after signing up.";
  }

  // Support / Help
  if (message.match(/\b(help|support|contact|issue|problem|question)\b/)) {
    return `🤝 **Need Help?**\n\n${websiteKnowledge.contact}\n\nOur support team is available 24/7 to assist you. You can also:\n• Check our FAQ section\n• Visit the Help Center\n• Email us directly\n• Or continue chatting with me here!`;
  }

  // About the company
  if (message.match(/\b(about|who are you|what is Femzy|tell me about)\b/)) {
    return `ℹ️ **About Femzy**\n\n${websiteKnowledge.about}\n\nWe've been serving thousands of satisfied customers daily with our fast, secure, and reliable services. Our mission is to make SMS verification and phone services accessible to everyone!`;
  }

  // Security questions
  if (message.match(/\b(secure|security|safe|privacy|private|protect)\b/)) {
    return "🔒 **Security & Privacy**\n\nYour security is our top priority! We use:\n• Enterprise-grade encryption\n• Secure data storage\n• Privacy-first approach\n• No data sharing with third parties\n• Compliance with international standards\n\nYour information is always safe with us!";
  }

  // Countries / Coverage
  if (
    message.match(
      /\b(which countries|what countries|coverage|available|where)\b/
    )
  ) {
    return "🌍 **Global Coverage**\n\nWe provide services in 50+ countries including:\n• USA & Canada\n• United Kingdom\n• European Union countries\n• Asian countries\n• Australia & New Zealand\n• And many more!\n\nOur coverage is constantly expanding!";
  }

  // Thank you
  if (message.match(/\b(thank|thanks|appreciate)\b/)) {
    return "You're very welcome! 😊 Is there anything else I can help you with? Feel free to ask me any questions about our services!";
  }

  // Goodbye
  if (message.match(/\b(bye|goodbye|see you|later)\b/)) {
    return "Goodbye! 👋 Thanks for chatting with me. If you have any more questions, I'm always here to help. Have a great day!";
  }

  // Default response for unrecognized questions
  return "I'd be happy to help! 😊 I can answer questions about:\n\n• 📱 SMS Verification\n• 📋 Logs Service\n• 📈 Social Media Booster\n• 📞 Phone Numbers\n• 💰 Pricing\n• ✨ Features\n• 🤝 Support\n\nWhat would you like to know more about?";
}

// Chat Widget Controller
class ChatBot {
  constructor() {
    this.isOpen = false;
    this.messages = [];
    this.init();
  }

  init() {
    this.createChatWidget();
    this.attachEventListeners();
    this.sendWelcomeMessage();
  }

  createChatWidget() {
    const chatHTML = `
            <div class="chat-widget" id="chatWidget">
                <div class="chat-header">
                    <div class="chat-header-info">
                        <div class="chat-avatar">🤖</div>
                        <div class="chat-header-text">
                            <h3>Femzy Assistant</h3>
                            <div class="chat-status">
                                <span class="status-dot"></span>
                                <span>Online</span>
                            </div>
                        </div>
                    </div>
                    <button class="chat-close" id="chatClose">×</button>
                </div>
                
                <div class="chat-messages" id="chatMessages">
                    <!-- Messages will be added here -->
                </div>

                <div class="typing-indicator" id="typingIndicator">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
                
                <div class="quick-replies" id="quickReplies">
                    <button class="quick-reply-btn" data-message="Tell me about SMS verification">SMS Verification</button>
                    <button class="quick-reply-btn" data-message="What are your prices?">Pricing</button>
                    <button class="quick-reply-btn" data-message="Tell me about your features">Features</button>
                    <button class="quick-reply-btn" data-message="How do I get started?">Get Started</button>
                </div>
                
                <div class="chat-input-container">
                    <div class="chat-input-wrapper">
                        <input 
                            type="text" 
                            class="chat-input" 
                            id="chatInput" 
                            placeholder="Ask me anything..."
                            autocomplete="off"
                        >
                        <button class="chat-send-btn" id="chatSend">
                            ➤
                        </button>
                    </div>
                </div>
            </div>
        `;

    document.body.insertAdjacentHTML("beforeend", chatHTML);
  }

  attachEventListeners() {
    // Open/Close chat
    const chatButton = document.querySelector(".chat-button");
    const chatWidget = document.getElementById("chatWidget");
    const chatClose = document.getElementById("chatClose");

    // Only attach listeners if elements exist
    if (chatButton) {
      chatButton.addEventListener("click", () => this.toggleChat());
    }
    
    if (chatClose) {
      chatClose.addEventListener("click", () => this.closeChat());
    }

    // Send message
    const chatSend = document.getElementById("chatSend");
    const chatInput = document.getElementById("chatInput");

    if (chatSend) {
      chatSend.addEventListener("click", () => this.sendMessage());
    }
    
    if (chatInput) {
      chatInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") this.sendMessage();
      });
    }

    // Quick replies
    document.querySelectorAll(".quick-reply-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const message = e.target.dataset.message;
        this.sendMessage(message);
      });
    });
  }

  toggleChat() {
    this.isOpen = !this.isOpen;
    const chatWidget = document.getElementById("chatWidget");
    chatWidget.classList.toggle("active");

    if (this.isOpen) {
      document.getElementById("chatInput").focus();
    }
  }

  closeChat() {
    this.isOpen = false;
    document.getElementById("chatWidget").classList.remove("active");
  }

  sendWelcomeMessage() {
    setTimeout(() => {
      this.addMessage(
        "bot",
        "Hi there! 👋 I'm the Femzy Assistant. I'm here to help you learn about our services. What would you like to know?"
      );
    }, 500);
  }

  sendMessage(text) {
    const input = document.getElementById("chatInput");
    const message = text || input.value.trim();

    if (!message) return;

    // Add user message
    this.addMessage("user", message);
    input.value = "";

    // Show typing indicator
    this.showTyping();

    // Generate and send AI response
    setTimeout(() => {
      this.hideTyping();
      const response = generateAIResponse(message);
      this.addMessage("bot", response);
    }, 1000 + Math.random() * 1000); // Random delay for realistic effect
  }

  addMessage(type, text) {
    const messagesContainer = document.getElementById("chatMessages");
    const time = new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const messageHTML = `
            <div class="message ${type}-message">
                <div class="message-avatar">${
                  type === "bot" ? "🤖" : "👤"
                }</div>
                <div class="message-content">
                    <div class="message-bubble">${this.formatMessage(
                      text
                    )}</div>
                    <div class="message-time">${time}</div>
                </div>
            </div>
        `;

    messagesContainer.insertAdjacentHTML("beforeend", messageHTML);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    this.messages.push({ type, text, time });
  }

  formatMessage(text) {
    // Convert markdown-style formatting
    return text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") // Bold
      .replace(/\n/g, "<br>"); // Line breaks
  }

  showTyping() {
    const typingIndicator = document.getElementById("typingIndicator");
    const messagesContainer = document.getElementById("chatMessages");
    typingIndicator.classList.add("active");
    messagesContainer.appendChild(typingIndicator);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  hideTyping() {
    const typingIndicator = document.getElementById("typingIndicator");
    typingIndicator.classList.remove("active");
  }
}

// Initialize chatbot when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.chatBot = new ChatBot();
});
