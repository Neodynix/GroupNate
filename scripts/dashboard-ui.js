// ==========================================
// dashboard-ui.js
// Handles Modals, Menus, and Form Checking
// ==========================================

console.log("UI & Validation Script Loaded");

// --- Shared Data ---
window.premiumCategories = ["Crypto", "Real Estate", "Investments"];
const categories = ["Art & Design", "Automotive", "Business", "Career", "Crypto", "Dating", "Education", "Entertainment", "Fashion", "Fitness", "Food", "Gaming", "Health", "Hobbies", "Investments", "Jobs", "Lifestyle", "Memes", "Music", "News", "Pets", "Politics", "Real Estate", "Science", "Shopping", "Sports", "Technology", "Travel", "Writing"];
const locations = {
    "USA": ["New York", "Los Angeles", "Chicago", "Houston", "San Francisco"],
    "India": ["Mumbai", "Delhi", "Bangalore", "Hyderabad"],
    "Nigeria": ["Lagos", "Abuja", "Kano", "Ibadan"],
    "UK": ["London", "Manchester", "Birmingham"],
    "Brazil": ["Sao Paulo", "Rio de Janeiro", "Brasilia"],
    "Kenya": ["Nairobi", "Mombasa", "Kisumu"],
    "Global": ["Any / Not Applicable"]
};

// --- Regex Patterns (SPAM DETECTORS) ---
const linkPatterns = {
    discord: /^(https?:\/\/)?(discord\.gg|discord\.com\/invite)\/[a-zA-Z0-9-]+$/i,
    telegram: /^(https?:\/\/)?(t\.me|telegram\.me)\/[a-zA-Z0-9_]+$/i,
    whatsapp: /^(https?:\/\/)?chat\.whatsapp\.com\/[a-zA-Z0-9]+$/i,
    facebook: /^(https?:\/\/)?(www\.)?facebook\.com\/groups\/[a-zA-Z0-9_.-]+\/?$/i,
    reddit: /^(https?:\/\/)?(www\.)?reddit\.com\/r\/[a-zA-Z0-9_]+\/?$/i,
    instagram: /^(https?:\/\/)?(ig\.me\/j\/|www\.instagram\.com\/[a-zA-Z0-9_.]+\/?)$/i
};

// Blocks emojis
const emojiRegex = /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g;

// Blocks 4 repeating characters (jjjj) OR 6 consonants in a row (rtsdkl)
const gibberishRegex = /(.)\1{3,}|[bcdfghjklmnpqrstvwxz]{6,}/i; 

// --- Initialize UI ---
function initUI() {
    const subCategory = document.getElementById("subCategory");
    const subCountry = document.getElementById("subCountry");

    if (subCategory) {
        subCategory.innerHTML = '<option value="">Select Category</option>';
        categories.forEach(cat => subCategory.appendChild(new Option(cat, cat)));
    }
    if (subCountry) {
        subCountry.innerHTML = '<option value="">Select Country</option>';
        Object.keys(locations).forEach(country => subCountry.appendChild(new Option(country, country)));
    }
    
    setupFormListeners();
}

// --- Menu & Modal Toggles ---
window.toggleAuthMode = function() {
    const title = document.getElementById('authTitle');
    const toggleText = document.getElementById('authToggleText');
    const submitBtn = document.getElementById('authSubmitBtn');
    
    if (!title || !toggleText || !submitBtn) return;

    if (title.innerText === 'Welcome Back') {
        title.innerText = 'Create Account';
        submitBtn.innerText = 'Sign Up';
        toggleText.innerHTML = 'Already have an account? <span style="color: var(--accent); cursor: pointer; font-weight: bold;" onclick="toggleAuthMode()">Log In</span>';
    } else {
        title.innerText = 'Welcome Back';
        submitBtn.innerText = 'Log In';
        toggleText.innerHTML = 'Need an account? <span style="color: var(--accent); cursor: pointer; font-weight: bold;" onclick="toggleAuthMode()">Sign Up</span>';
    }
};

window.toggleDashboardMenu = () => {
    const menu = document.getElementById("dashboardMenu");
    if (menu) {
        menu.classList.toggle("active");
        menu.classList.toggle("show");
    }
};

window.toggleProfilePopup = () => {
    document.getElementById("profilePopup")?.classList.toggle("hidden");
};

// FIXED: View Switcher Logic
window.switchView = (viewName, el) => {
    // 1. Hide all views
    document.querySelectorAll(".dashboard-view").forEach(v => {
        v.classList.add("hidden");
        v.classList.remove("active"); 
    });
    
    // 2. Show the selected view
    const selectedView = document.getElementById(`view-${viewName}`);
    if (selectedView) {
        selectedView.classList.remove("hidden");
        // Use a small timeout to allow CSS transitions to apply after removing 'hidden'
        setTimeout(() => selectedView.classList.add("active"), 10);
    }
    
    // 3. Update the navigation link styling
    document.querySelectorAll(".nav-link").forEach(l => l.classList.remove("active"));
    if (el) {
        // If the click came from an icon inside the link, make sure we get the <a> tag
        const linkElement = el.target ? (el.target.closest('.nav-link') || el.currentTarget) : el.currentTarget;
        if (linkElement) linkElement.classList.add("active");
    }
    
    // 4. Close the mobile menu automatically
    const menu = document.getElementById("dashboardMenu");
    if (menu) {
        menu.classList.remove("active");
        menu.classList.remove("show");
    }
    
    // Smooth scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.openLogoutModal = () => document.getElementById("logoutModal")?.classList.remove("hidden");

// --- Form Validation Listeners ---
function setupFormListeners() {
    const subCountry = document.getElementById("subCountry");
    const subCity = document.getElementById("subCity");
    const subPlatform = document.getElementById("subPlatform");
    const subCategory = document.getElementById("subCategory");
    const subLink = document.getElementById("subLink");
    const subDescription = document.getElementById("subDescription");
    const subName = document.getElementById("subName");

    // Dynamic Cities
    subCountry?.addEventListener("change", function() {
        if(subCity) {
            subCity.innerHTML = '<option value="">Select City</option>';
            if(locations[this.value]) locations[this.value].forEach(city => subCity.appendChild(new Option(city, city)));
        }
        window.validateForm();
    });

    // Platform Unlocker
    subPlatform?.addEventListener("change", function() {
        const isEnabled = this.value !== "";
        if(subLink) subLink.disabled = !isEnabled;
        if(subDescription) subDescription.disabled = !isEnabled;
        if(subLink) subLink.dispatchEvent(new Event('input'));
        window.validateForm();
    });

    // Premium Warning
    subCategory?.addEventListener("change", function() {
        const premiumWarning = document.getElementById("premiumWarning");
        const btn = document.getElementById("submitBtn");
        
        if (window.premiumCategories.includes(this.value)) {
            premiumWarning?.classList.remove("hidden");
            if(btn) btn.innerHTML = '<i class="fa-solid fa-crown"></i> Subscribe to Post';
            if(btn) btn.style.background = 'linear-gradient(45deg, #f1c40f, #e67e22)';
        } else {
            premiumWarning?.classList.add("hidden");
            if(btn) btn.innerText = window.editingGroupId ? "Update Group" : "Post Group";
            if(btn) btn.style.background = '';
        }
        window.validateForm();
    });

    // Name Validation
    subName?.addEventListener("input", debounce(() => {
        const text = subName.value.trim();
        const hasEmojis = emojiRegex.test(text);
        const isGibberish = gibberishRegex.test(text);
        const nameWarning = document.getElementById("nameWarning");
        const nameSuccess = document.getElementById("nameSuccess");

        if (text === "") {
            nameWarning?.classList.add("hidden"); nameSuccess?.classList.add("hidden");
        } else if (hasEmojis || isGibberish || text.length < 3) {
            nameWarning?.classList.remove("hidden"); nameSuccess?.classList.add("hidden");
        } else {
            nameSuccess?.classList.remove("hidden"); nameWarning?.classList.add("hidden");
        }
        window.validateForm();
    }, 400));

    // Link Validation
    subLink?.addEventListener("input", debounce(() => {
        const url = subLink.value.trim();
        const platform = subPlatform?.value;
        const linkWarning = document.getElementById("linkWarning");
        const linkSuccess = document.getElementById("linkSuccess");

        if (url === "") {
            linkWarning?.classList.add("hidden"); linkSuccess?.classList.add("hidden");
        } else if (platform && linkPatterns[platform] && linkPatterns[platform].test(url)) {
            linkSuccess?.classList.remove("hidden"); linkWarning?.classList.add("hidden");
        } else {
            linkWarning?.classList.remove("hidden"); linkSuccess?.classList.add("hidden");
        }
        window.validateForm();
    }, 400));

    // Description Validation
    subDescription?.addEventListener("input", debounce(() => {
        const text = subDescription.value.trim();
        const hasEmojis = emojiRegex.test(text);
        const isGibberish = gibberishRegex.test(text);
        const words = text.split(/\s+/).filter(w => w.length > 1);
        
        const descWarning = document.getElementById("descWarning");
        const descSuccess = document.getElementById("descSuccess");

        if (text === "") {
            descWarning?.classList.add("hidden"); descSuccess?.classList.add("hidden");
        } else if (hasEmojis || isGibberish || text.length < 40 || words.length < 5) {
            descWarning?.classList.remove("hidden"); descSuccess?.classList.add("hidden");
        } else {
            descSuccess?.classList.remove("hidden"); descWarning?.classList.add("hidden");
        }
        window.validateForm();
    }, 400));
}

// Master Validation
window.validateForm = function() {
    const btn = document.getElementById("submitBtn");
    if(!btn) return;

    const subPlatform = document.getElementById("subPlatform");
    const subCategory = document.getElementById("subCategory");
    const subCountry = document.getElementById("subCountry");
    const subCity = document.getElementById("subCity");

    const isPlatformSet = subPlatform && subPlatform.value !== "";
    const isCategorySet = subCategory && subCategory.value !== "";
    const isCountrySet = subCountry && subCountry.value !== "";
    const isCitySet = subCity && subCity.value !== "";
    
    const nameSuccess = document.getElementById("nameSuccess");
    const linkSuccess = document.getElementById("linkSuccess");
    const descSuccess = document.getElementById("descSuccess");
    
    const isNameValid = nameSuccess ? !nameSuccess.classList.contains("hidden") : true;
    const isLinkValid = linkSuccess ? !linkSuccess.classList.contains("hidden") : true;
    const isDescValid = descSuccess ? !descSuccess.classList.contains("hidden") : true;

    if (isPlatformSet && isCategorySet && isCountrySet && isCitySet && isNameValid && isLinkValid && isDescValid) {
        btn.disabled = false;
        btn.classList.remove("disabled-btn");
    } else {
        btn.disabled = true;
        btn.classList.add("disabled-btn");
    }
}

// Utility
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// ==========================================
// SUBSCRIPTION CHECKOUT LOGIC
// ==========================================

window.openPaymentModal = function(planName, price) {
    // 1. You must be logged in to buy a subscription
    if (!window.currentUser) {
        alert("Please log in to upgrade your account.");
        return;
    }

    const iframe = document.getElementById('gatewayIframe');
    let checkoutUrl = '';

    // 2. Put your real Payment Links here later
    // Example: Use Flutterwave, Paystack, or Stripe links
    if (planName === 'Creator Pro') {
        checkoutUrl = 'https://paystack.com/pay/your-pro-link'; 
    } else if (planName === 'Agency') {
        checkoutUrl = 'https://paystack.com/pay/your-agency-link';
    }

    // 3. Pass the user's email to pre-fill the checkout and link the payment
    const finalUrl = `${checkoutUrl}?email=${encodeURIComponent(window.currentUser.email)}`;

    if(iframe) {
        iframe.src = finalUrl;
    }
    
    // 4. Show the modal
    document.getElementById('paymentModal')?.classList.remove('hidden');
};

// Clear the iframe when the modal is closed so it doesn't keep running in the background
window.closeModals = () => {
    document.querySelectorAll(".overlay:not(#authGate)").forEach(m => m.classList.add("hidden"));
    const iframe = document.getElementById('gatewayIframe');
    if (iframe) iframe.src = 'about:blank';
};

// Start UI
document.addEventListener("DOMContentLoaded", initUI);
