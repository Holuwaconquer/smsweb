# Basedsms Website

A modern, responsive SMS verification service website with separate CSS and JavaScript files for easy maintenance.

## 📁 File Structure

```
basedsms-website/
│
├── index.html          # Homepage
├── auth.html           # Combined Login & Signup page
├── README.md           # This file
│
├── css/
│   ├── home.css       # Homepage styles
│   ├── auth.css       # Auth page styles
│   └── chatbot.css    # AI Chatbot styles
│
└── js/
    ├── home.js        # Homepage functionality
    ├── auth.js        # Auth page functionality
    └── chatbot.js     # AI Chatbot with knowledge base
```

## 🚀 Features

### Homepage (index.html)
- Responsive navigation with theme toggle
- Hero section with CTA buttons
- Features grid showcasing 4 key benefits
- **Carousel in "How It Works" section** with 4 different services:
  - SMS Verification
  - Logs Service
  - Social Media Booster
  - Phone Numbers
- Left/Right arrow navigation for carousel
- Indicator dots for each slide
- Testimonials section
- Call-to-action section
- Professional footer with multiple columns
- **AI Chatbot Assistant** that answers questions about the website
- Floating chat button

### Auth Page (auth.html)
- **Combined Login & Signup in one page** with tab switching
- Login form with:
  - Email and password fields
  - Remember me checkbox
  - Forgot password link
- Signup form with:
  - Username field
  - Email field
  - Password field with strength indicator
  - Confirm password field
  - Real-time validation
- Smooth tab transitions
- Loading states for form submissions
- Success messages

## 🎨 Design Features

- ✅ Fully mobile responsive
- ✅ Dark/Light theme toggle (syncs across pages using localStorage)
- ✅ Smooth animations and transitions
- ✅ Modern gradient buttons
- ✅ Form validation with error messages
- ✅ Password strength indicator
- ✅ Carousel with left/right navigation arrows
- ✅ Clean and professional UI
- ✅ **AI-Powered Chatbot** with website knowledge

## 🤖 AI Chatbot Features

The chat button opens an intelligent assistant that can answer questions about:

- **Services**: SMS Verification, Logs, Social Media Booster, Phone Numbers
- **Pricing**: Plans, costs, and payment options
- **Features**: What makes Basedsms unique
- **Support**: How to get help and contact support
- **Getting Started**: How to sign up and use services
- **Security**: Privacy and data protection information
- **Coverage**: Available countries and global reach

### Chatbot Capabilities:
- Natural language understanding
- Context-aware responses
- Quick reply buttons for common questions
- Typing indicators for realistic conversation
- Message timestamps
- Smooth animations
- Mobile responsive design
- Dark mode support

### Example Questions You Can Ask:
- "Tell me about SMS verification"
- "What are your prices?"
- "Which countries do you support?"
- "How do I get started?"
- "Is my data secure?"
- "What features do you offer?"

## 📱 Responsive Breakpoints

- **Desktop**: 1024px and above
- **Tablet**: 640px - 1024px
- **Mobile**: Below 640px

## 🔧 How to Use

1. **Extract the ZIP file** to your desired location
2. **Open index.html** in your web browser to view the homepage
3. Click "Sign In" or "Get Started" to go to the auth page
4. **Navigate the carousel** using the left/right arrow buttons in the "How It Works" section

## 🎯 Carousel Services

The "How It Works" carousel showcases 4 different services:

1. **SMS Verification** - Temporary phone numbers for verification
2. **Logs Service** - Secure access to service credentials
3. **Social Media Booster** - Grow your social media presence
4. **Phone Numbers** - Purchase phone numbers from 50+ countries

Use the arrow buttons (← →) or click the indicator dots to switch between services.

## 🔗 Navigation Flow

```
Homepage (index.html)
    ↓
    → Sign In/Get Started Button
    ↓
Auth Page (auth.html)
    ↓
    → Tab Switch: Login ↔ Signup
    ↓
    → Back Button returns to Homepage
```

## 💻 Browser Support

Works on all modern browsers:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers

## 🎨 Customization

### Colors
Main brand color: `#00d4aa` (Teal/Turquoise)
Secondary color: `#00b894`

To change colors, update the gradient values in the CSS files.

### Adding More Services to Carousel
Edit `js/home.js` and add more objects to the `servicesData` array.

## 📝 Notes

- All CSS and JS are in separate files for easy maintenance
- Theme preference is saved in browser localStorage
- Forms have client-side validation (connect to backend for real functionality)
- Carousel auto-generates slides from JavaScript data

## 🚀 Next Steps

To make this fully functional:
1. Connect forms to your backend API
2. Add real authentication logic
3. Create dashboard pages
4. Implement actual SMS/service functionality

---

Created with ❤️ for Basedsms
