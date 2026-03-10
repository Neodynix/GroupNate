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

// --- Regex Patterns ---
const linkPatterns = {
    discord: /^(https?:\/\/)?(discord\.gg|discord\.com\/invite)\/[a-zA-Z0-9-]+$/i,
    telegram: /^(https?:\/\/)?(t\.me|telegram\.me)\/[a-zA-Z0-9_]+$/i,
    whatsapp: /^(https?:\/\/)?chat\.whatsapp\.com\/[a-zA-Z0-9]+$/i,
    facebook: /^(https?:\/\/)?(www\.)?facebook\.com\/groups\/[a-zA-Z0-9_.-]+\/?$/i,
    reddit: /^(https?:\/\/)?(www\.)?reddit\.com\/r\/[a-zA-Z0-9_]+\/?$/i,
    instagram: /^(https?:\/\/)?(ig\.me\/j\/|www\.instagram\.com\/[a-zA-Z0-9_.]+\/?)$/i
};
const emojiRegex = /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g;

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
window.toggleDashboardMenu = () => {
    const menu = document.getElementById("dashboardMenu");
    if (menu) {
        // Correctly triggers the mobile sidebar using 'active'
        menu.classList.toggle("active");
        menu.classList.toggle("show");
    }
};

window.toggleProfilePopup = () => {
    document.getElementById("profilePopup")?.classList.toggle("hidden");
};

window.switchView = (viewName, el) => {
    document.querySelectorAll(".dashboard-view").forEach(v => v.classList.add("hidden"));
    document.getElementById(`view-${viewName}`)?.classList.remove("hidden");
    document.querySelectorAll(".nav-link").forEach(l => l.classList.remove("active"));
    if (el) el.classList.add("active");
    
    // Close mobile menu safely
    const menu = document.getElementById("dashboardMenu");
    if (menu) {
        menu.classList.remove("active");
        menu.classList.remove("show");
    }
};

window.openLogoutModal = () => document.getElementById("logoutModal")?.classList.remove("hidden");
window.closeModals = () => document.querySelectorAll(".overlay:not(#authGate)").forEach(m => m.classList.add("hidden"));

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
        } else {
            premiumWarning?.classList.add("hidden");
            if(btn) btn.innerText = window.editingGroupId ? "Update Group" : "Post Group";
        }
        window.validateForm();
    });

    // Link Validation (Checks specific formats like Discord, WA, etc.)
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

    // Description Validation (Blocks Emojis & Gibberish)
    subDescription?.addEventListener("input", debounce(() => {
        const text = subDescription.value.trim();
        const hasEmojis = emojiRegex.test(text);
        const words = text.split(/\s+/).filter(w => w.length > 1);
        const descWarning = document.getElementById("descWarning");
        const descSuccess = document.getElementById("descSuccess");

        if (text === "") {
            descWarning?.classList.add("hidden"); descSuccess?.classList.add("hidden");
        } else if (hasEmojis || text.length < 40 || words.length < 5) {
            descWarning?.classList.remove("hidden"); descSuccess?.classList.add("hidden");
        } else {
            descSuccess?.classList.remove("hidden"); descWarning?.classList.add("hidden");
        }
        window.validateForm();
    }, 400));
    
    // Check form dynamically on name type
    subName?.addEventListener("input", window.validateForm);
}

// Master Validation: Checks if the Submit Button should be unlocked
window.validateForm = function() {
    const btn = document.getElementById("submitBtn");
    if(!btn) return;

    const subName = document.getElementById("subName");
    const subPlatform = document.getElementById("subPlatform");
    const subCategory = document.getElementById("subCategory");
    const subCountry = document.getElementById("subCountry");
    const subCity = document.getElementById("subCity");

    const isNameSet = subName && subName.value.trim() !== "";
    const isPlatformSet = subPlatform && subPlatform.value !== "";
    const isCategorySet = subCategory && subCategory.value !== "";
    const isCountrySet = subCountry && subCountry.value !== "";
    const isCitySet = subCity && subCity.value !== "";
    
    const linkSuccess = document.getElementById("linkSuccess");
    const descSuccess = document.getElementById("descSuccess");
    
    // Safely reads the visual HTML warnings to decide if data is valid
    const isLinkValid = linkSuccess ? !linkSuccess.classList.contains("hidden") : true;
    const isDescValid = descSuccess ? !descSuccess.classList.contains("hidden") : true;

    if (isNameSet && isPlatformSet && isCategorySet && isCountrySet && isCitySet && isLinkValid && isDescValid) {
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
