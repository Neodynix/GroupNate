// ==========================================
// dashboard-ui.js
// Handles Modals, Menus, and Form Checking
// ==========================================

console.log("UI & Validation Script Loaded");

// --- Shared Data ---
window.premiumCategories = ["Crypto", "Real Estate", "Investments", "Forex & Trading", "Business", "E-commerce"];
const categories = ["Art & Design", "Automotive", "Business", "Career", "Crypto", "Dating", "Education", "E-commerce", "Entertainment", "Fashion", "Fitness", "Food", "Forex & Trading", "Gaming", "Health", "Hobbies", "Investments", "Jobs", "Lifestyle", "Memes", "Music", "News", "Pets", "Politics", "Real Estate", "Science", "Shopping", "Sports", "Technology", "Travel", "Writing"];

// --- Advanced Regex Patterns ---
const linkPatterns = {
    discord: /^(https?:\/\/)?(discord\.gg|discord\.com\/invite)\/[a-zA-Z0-9-]+(\?[a-zA-Z0-9_=&%-]+)?$/i,
    telegram: /^(https?:\/\/)?(t\.me|telegram\.me)\/[a-zA-Z0-9_]+(\?[a-zA-Z0-9_=&%-]+)?$/i,
    facebook: /^(https?:\/\/)?(www\.)?facebook\.com\/groups\/[a-zA-Z0-9_.-]+\/?(\?[a-zA-Z0-9_=&%-]+)?$/i,
    reddit: /^(https?:\/\/)?(www\.)?reddit\.com\/r\/[a-zA-Z0-9_]+\/?(\?[a-zA-Z0-9_=&%-]+)?$/i,
    instagram: /^(https?:\/\/)?(ig\.me\/j\/[a-zA-Z0-9_-]+|www\.instagram\.com\/[a-zA-Z0-9_.-]+)\/?(\?[a-zA-Z0-9_=&%-]+)?$/i
    // WhatsApp is handled strictly in the input listener below
};

// --- Map Platforms to their Types ---
const platformTypes = {
    discord: ['Server'],
    telegram: ['Group', 'Channel'],
    whatsapp: ['Group', 'Channel', 'Community'],
    instagram: ['Broadcast Channel', 'Group Chat'],
    facebook: ['Group'],
    reddit: ['Community (Subreddit)']
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
    
    // Fetch Countries
    if (subCountry) {
        subCountry.innerHTML = '<option value="">Loading Countries...</option>';
        try {
            const res = await fetch('https://countriesnow.space/api/v0.1/countries/iso');
            const data = await res.json();
            subCountry.innerHTML = '<option value="">Select Country</option>';
            data.data.forEach(country => subCountry.appendChild(new Option(country.name, country.name)));
            subCountry.appendChild(new Option("Global (Online)", "Global"));
        } catch (err) {
            console.error("Failed to load countries", err);
            subCountry.innerHTML = '<option value="">Error loading locations</option>';
        }
    }
    
    setupFormListeners();
}

// --- Menu & Modal Toggles ---
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
        if (linkElement && linkElement.classList.contains('nav-link')) linkElement.classList.add("active");
    }
    
    document.querySelectorAll(".nav-tab").forEach(t => t.classList.remove("active"));
    if (el) {
         const tabElement = el.target ? (el.target.closest('.nav-tab') || el.currentTarget) : el.currentTarget;
         if (tabElement && tabElement.classList.contains('nav-tab')) tabElement.classList.add("active");
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
    document.querySelectorAll(".overlay:not(#authGate):not(#appLoader)").forEach(m => m.classList.add("hidden"));
    const iframe = document.getElementById('gatewayIframe');
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
    const subType = document.getElementById("subType");
    const typeGroup = document.getElementById("typeGroup");
    const subCategory = document.getElementById("subCategory");
    const subLink = document.getElementById("subLink");
    const subDescription = document.getElementById("subDescription");
    const subName = document.getElementById("subName");

    // Dynamic Cities
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

    // Dynamic Platform -> Type Dropdown
    subPlatform?.addEventListener("change", function() {
        const platform = this.value;
        const isEnabled = platform !== "";
        
        if(subLink) subLink.disabled = !isEnabled;
        if(subDescription) subDescription.disabled = !isEnabled;
        
        if (isEnabled && platformTypes[platform]) {
            subType.innerHTML = '<option value="">Select Type</option>';
            platformTypes[platform].forEach(type => {
                subType.appendChild(new Option(type, type));
            });
            typeGroup.classList.remove('hidden');
            
            // Auto-select if there is only 1 option
            if (platformTypes[platform].length === 1) {
                subType.value = platformTypes[platform][0];
            }
        } else {
            typeGroup.classList.add('hidden');
            subType.innerHTML = '<option value="">Select Type</option>';
        }
        
        if(subLink) subLink.dispatchEvent(new Event('input'));
        window.validateForm();
    });

    // Re-validate link if type changes (Crucial for WhatsApp)
    subType?.addEventListener("change", function() {
        if(subLink) subLink.dispatchEvent(new Event('input'));
        window.validateForm();
    });

    subCategory?.addEventListener("change", function() {
        const premiumWarning = document.getElementById("premiumWarning");
        
        if (window.premiumCategories.includes(this.value)) {
            premiumWarning?.classList.remove("hidden");
            premiumWarning.innerHTML = '<i class="fa-solid fa-lock"></i> Premium Category (Requires Pro/Agency)';
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

    // Dynamic Strict Link Validation
    subLink?.addEventListener("input", debounce(() => {
        const url = subLink.value.trim();
        const platform = subPlatform?.value;
        const type = subType?.value;
        const linkWarning = document.getElementById("linkWarning");
        const linkSuccess = document.getElementById("linkSuccess");

        let isValid = false;

        if (url !== "") {
            // WhatsApp strict logic
            if (platform === 'whatsapp') {
                if (type === 'Channel') {
                    isValid = /^(https?:\/\/)?(www\.)?whatsapp\.com\/channel\/[a-zA-Z0-9_-]+(\?[a-zA-Z0-9_=&-]+)?$/i.test(url);
                    linkWarning.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Must be a whatsapp.com/channel/ link.';
                } else {
                    isValid = /^(https?:\/\/)?chat\.whatsapp\.com\/[a-zA-Z0-9]+(\?[a-zA-Z0-9_=&-]+)?$/i.test(url);
                    linkWarning.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Must be a chat.whatsapp.com/ link.';
                }
            } 
            // Everyone else
            else if (platform && linkPatterns[platform]) {
                isValid = linkPatterns[platform].test(url);
                linkWarning.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Invalid platform link format.';
            }
        }

        if (url === "") {
            linkWarning?.classList.add("hidden"); linkSuccess?.classList.add("hidden");
        } else if (isValid) {
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
    const subType = document.getElementById("subType");
    const typeGroup = document.getElementById("typeGroup");

    const isPlatformSet = subPlatform && subPlatform.value !== "";
    const isCategorySet = subCategory && subCategory.value !== "";
    const isCountrySet = subCountry && subCountry.value !== "";
    const isCitySet = subCity && subCity.value !== "";
    
    // Check if type is required and set
    const isTypeRequired = typeGroup && !typeGroup.classList.contains("hidden");
    const isTypeValid = !isTypeRequired || (subType && subType.value !== "");
    
    const nameSuccess = document.getElementById("nameSuccess");
    const linkSuccess = document.getElementById("linkSuccess");
    const descSuccess = document.getElementById("descSuccess");
    
    const isNameValid = nameSuccess ? !nameSuccess.classList.contains("hidden") : true;
    const isLinkValid = linkSuccess ? !linkSuccess.classList.contains("hidden") : true;
    const isDescValid = descSuccess ? !descSuccess.classList.contains("hidden") : true;

    const isPremiumCategory = isCategorySet && window.premiumCategories.includes(subCategory.value);
    const isFreePlan = window.userPlan === 'Free' || !window.userPlan;

    if (isPremiumCategory && isFreePlan) {
        btn.disabled = false;
        btn.classList.remove("disabled-btn");
        btn.innerText = "Subscribe to Post";
        btn.type = "button"; 
        btn.onclick = (e) => { 
            e.preventDefault(); 
            switchView('subscriptions', null); 
        };
        return; 
    } else {
        btn.innerText = "Post Group";
        btn.type = "submit";
        btn.onclick = null; 
    }

    if (isPlatformSet && isTypeValid && isCategorySet && isCountrySet && isCitySet && isNameValid && isLinkValid && isDescValid) {
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
