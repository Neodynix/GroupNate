// ==========================================
// dashboard-ui.js
// Handles Modals, Menus, and Form Checking
// ==========================================

console.log("UI & Validation Script Loaded");

// --- Shared Data ---
window.premiumCategories = ["Crypto", "Real Estate", "Investments", "Forex & Trading", "Business", "E-commerce"];
const categories = ["Art & Design", "Automotive", "Business", "Career", "Crypto", "Dating", "Education", "E-commerce", "Entertainment", "Fashion", "Fitness", "Food", "Forex & Trading", "Gaming", "Health", "Hobbies", "Investments", "Jobs", "Lifestyle", "Memes", "Music", "News", "Pets", "Politics", "Real Estate", "Science", "Shopping", "Sports", "Technology", "Travel", "Writing"];

// --- Regex Patterns (SPAM DETECTORS) ---
const linkPatterns = {
    discord: /^(https?:\/\/)?(discord\.gg|discord\.com\/invite)\/[a-zA-Z0-9-]+$/i,
    telegram: /^(https?:\/\/)?(t\.me|telegram\.me)\/[a-zA-Z0-9_]+$/i,
    whatsapp: /^(https?:\/\/)?chat\.whatsapp\.com\/[a-zA-Z0-9]+$/i,
    facebook: /^(https?:\/\/)?(www\.)?facebook\.com\/groups\/[a-zA-Z0-9_.-]+\/?$/i,
    reddit: /^(https?:\/\/)?(www\.)?reddit\.com\/r\/[a-zA-Z0-9_]+\/?$/i,
    instagram: /^(https?:\/\/)?(ig\.me\/j\/|www\.instagram\.com\/[a-zA-Z0-9_.]+\/?)$/i
};

const emojiRegex = /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g;
const gibberishRegex = /(.)\1{3,}|[bcdfghjklmnpqrstvwxz]{6,}/i; 

// --- Initialize UI ---
async function initUI() {
    const subCategory = document.getElementById("subCategory");
    const subCountry = document.getElementById("subCountry");

    if (subCategory) {
        subCategory.innerHTML = '<option value="">Select Category</option>';
        categories.sort().forEach(cat => subCategory.appendChild(new Option(cat, cat)));
    }
    
    // Fetch Countries dynamically from a free public API
    if (subCountry) {
        subCountry.innerHTML = '<option value="">Loading Countries...</option>';
        try {
            const res = await fetch('https://countriesnow.space/api/v0.1/countries/iso');
            const data = await res.json();
            subCountry.innerHTML = '<option value="">Select Country</option>';
            data.data.forEach(country => subCountry.appendChild(new Option(country.name, country.name)));
            subCountry.appendChild(new Option("Global (Online)", "Global")); // Add global option
        } catch (err) {
            console.error("Failed to load countries", err);
            subCountry.innerHTML = '<option value="">Error loading locations</option>';
        }
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

window.switchView = (viewName, el) => {
    document.querySelectorAll(".dashboard-view").forEach(v => {
        v.classList.add("hidden");
        v.classList.remove("active"); 
    });
    
    const selectedView = document.getElementById(`view-${viewName}`);
    if (selectedView) {
        selectedView.classList.remove("hidden");
        setTimeout(() => selectedView.classList.add("active"), 10);
    }
    
    document.querySelectorAll(".nav-link").forEach(l => l.classList.remove("active"));
    if (el) {
        const linkElement = el.target ? (el.target.closest('.nav-link') || el.currentTarget) : el.currentTarget;
        if (linkElement) linkElement.classList.add("active");
    }
    
    const menu = document.getElementById("dashboardMenu");
    if (menu) {
        menu.classList.remove("active");
        menu.classList.remove("show");
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.openLogoutModal = () => document.getElementById("logoutModal")?.classList.remove("hidden");

window.closeModals = () => {
    document.querySelectorAll(".overlay:not(#authGate)").forEach(m => m.classList.add("hidden"));
    const iframe = document.getElementById('gatewayIframe');
    // Clear iframe to stop background processes from the payment gateway
    if (iframe) {
        iframe.src = 'about:blank';
        iframe.removeAttribute('srcdoc');
    }
};

// --- Form Validation Listeners ---
function setupFormListeners() {
    const subCountry = document.getElementById("subCountry");
    const subCity = document.getElementById("subCity");
    const subPlatform = document.getElementById("subPlatform");
    const subCategory = document.getElementById("subCategory");
    const subLink = document.getElementById("subLink");
    const subDescription = document.getElementById("subDescription");
    const subName = document.getElementById("subName");

    // Dynamically fetch cities when a country is selected
    subCountry?.addEventListener("change", async function() {
        if(!subCity) return;
        
        if (this.value === "Global") {
            subCity.innerHTML = '<option value="Online">Online / Anywhere</option>';
            window.validateForm();
            return;
        }

        subCity.innerHTML = '<option value="">Loading Cities...</option>';
        try {
            const res = await fetch('https://countriesnow.space/api/v0.1/countries/cities', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ country: this.value })
            });
            const data = await res.json();
            
            subCity.innerHTML = '<option value="">Select City</option>';
            if (data.data && data.data.length > 0) {
                data.data.forEach(city => subCity.appendChild(new Option(city, city)));
            } else {
                subCity.innerHTML = '<option value="Any">Any City</option>';
            }
        } catch (err) {
            subCity.innerHTML = '<option value="Any">Any City</option>';
        }
        window.validateForm();
    });

    subPlatform?.addEventListener("change", function() {
        const isEnabled = this.value !== "";
        if(subLink) subLink.disabled = !isEnabled;
        if(subDescription) subDescription.disabled = !isEnabled;
        if(subLink) subLink.dispatchEvent(new Event('input'));
        window.validateForm();
    });

    subCategory?.addEventListener("change", function() {
        const premiumWarning = document.getElementById("premiumWarning");
        const btn = document.getElementById("submitBtn");
        
        if (window.premiumCategories.includes(this.value)) {
            premiumWarning?.classList.remove("hidden");
            if(btn) {
                // Changing UI to alert users that this requires Pro, but not blocking them here.
                // The actual blocking will happen in data.js based on their subscription status.
                premiumWarning.innerHTML = '<i class="fa-solid fa-lock"></i> Premium Category (Requires Pro/Agency)';
            }
        } else {
            premiumWarning?.classList.add("hidden");
        }
        window.validateForm();
    });

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

// Start UI
document.addEventListener("DOMContentLoaded", initUI);
