// Dashboard JavaScript

// Check authentication on page load
document.addEventListener('DOMContentLoaded', async () => {
    await checkAuthentication();
    await loadDashboardData();
    initializeUI();
});

// Check if user is authenticated
async function checkAuthentication() {
    const isAuthenticated = await Auth.checkAuth();
    
    if (!isAuthenticated) {
        // Redirect to auth page if not logged in
        window.location.href = '../auth.html';
        return;
    }
    
    // Load user data
    const { user } = await Auth.getCurrentUser();
    if (user) {
        loadUserData(user);
    }
}

// Load user data
async function loadUserData(user) {
    // Get profile
    const profileResult = await DB.getProfile(user.id);
    if (profileResult.success) {
        const profile = profileResult.data;
        document.querySelector('.page-header h1').textContent = `Welcome back${profile.username ? ', ' + profile.username : ''}!`;
    }
    
    // Get wallet
    const walletResult = await DB.getWallet(user.id);
    if (walletResult.success) {
        const wallet = walletResult.data;
        updateBalance(wallet.balance);
    }
}

// Load dashboard data
async function loadDashboardData() {
    const { user } = await Auth.getCurrentUser();
    if (!user) return;
    
    try {
        // Load transactions
        const transactionsResult = await DB.getTransactions(user.id, 10);
        
        // Load SMS numbers count
        const smsResult = await DB.getSMSNumbers(user.id);
        if (smsResult.success) {
            const messagesCount = smsResult.data.length;
            document.querySelector('.stats-grid .stat-card:nth-child(2) .stat-value').textContent = messagesCount;
        }
        
        // Load total spent from wallet
        const walletResult = await DB.getWallet(user.id);
        if (walletResult.success) {
            const wallet = walletResult.data;
            document.querySelector('.stats-grid .stat-card:nth-child(3) .stat-value').textContent = `₦${wallet.total_spent.toFixed(2)}`;
        }
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

// Update balance display
function updateBalance(balance) {
    const balanceFormatted = `₦${parseFloat(balance).toFixed(2)}`;
    document.getElementById('balanceDisplay').textContent = balanceFormatted;
    document.getElementById('statsBalance').textContent = balanceFormatted;
}

// Initialize UI
function initializeUI() {
    // Update time
    updateTime();
    setInterval(updateTime, 60000);
    
    // Hamburger menu
    const hamburger = document.getElementById('hamburger');
    const sidebar = document.getElementById('sidebar');
    
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        sidebar.classList.toggle('active');
    });
    
    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768) {
            if (!sidebar.contains(e.target) && !hamburger.contains(e.target)) {
                sidebar.classList.remove('active');
                hamburger.classList.remove('active');
            }
        }
    });
    
    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    let isDark = localStorage.getItem('darkMode') === 'true';
    
    function applyTheme() {
        if (isDark) {
            document.body.style.backgroundColor = '#1a1a1a';
            themeToggle.textContent = '☀️';
        } else {
            document.body.style.backgroundColor = '#f8f9fa';
            themeToggle.textContent = '🌙';
        }
    }
    
    applyTheme();
    
    themeToggle.addEventListener('click', () => {
        isDark = !isDark;
        localStorage.setItem('darkMode', isDark);
        applyTheme();
    });
    
    // Contact link - Open WhatsApp
    const contactLink = document.getElementById('contactLink');
    contactLink.addEventListener('click', (e) => {
        e.preventDefault();
        const whatsappNumber = '2349012726301'; // +234 901 272 6301
        const message = encodeURIComponent('Hello, I need help with Basedsms');
        window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
    });
    
    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    logoutBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        
        if (confirm('Are you sure you want to log out?')) {
            const result = await Auth.signOut();
            if (result.success) {
                window.location.href = '../index.html';
            } else {
                alert('Error logging out. Please try again.');
            }
        }
    });
}

// Update time display
function updateTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const mobileTime = document.getElementById('mobileTime');
    if (mobileTime) {
        mobileTime.textContent = `${hours}:${minutes}`;
    }
}

// Resize handler for sidebar
window.addEventListener('resize', () => {
    const sidebar = document.getElementById('sidebar');
    const hamburger = document.getElementById('hamburger');
    
    if (window.innerWidth > 768) {
        sidebar.classList.remove('hidden');
        hamburger.classList.remove('active');
    } else {
        sidebar.classList.remove('active');
    }
});
