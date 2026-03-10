// ==========================================
// ui-validation.js
// Handles UI, Validation, and Interactions
// ==========================================

// --- Shared State ---
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
document.addEventListener("DOMContentLoaded", () => {
    const subCategory = document.getElementById('subCategory');
    const subCountry = document.getElementById('subCountry');
    
    if(subCategory) {
        categories.forEach(cat => subCategory.appendChild(new Option(cat, cat)));
    }
    if(subCountry) {
        Object.keys(locations).forEach(country => subCountry.appendChild(new Option(country, country)));
    }
    
    setupDashboardListeners();
});

// --- Auth UI Toggles ---
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

// --- Form Validation Listeners ---
function setupDashboardListeners() {
    const subCountry = document.getElementById('subCountry');
    const subCity = document.getElementById('subCity');
    const subPlatform = document.getElementById('subPlatform');
    const subCategory = document.getElementById('subCategory');
    const subLink = document.getElementById('subLink');
    const subDescription = document.getElementById('subDescription');
    const subName = document.getElementById('subName');

    if(subCountry) {
        subCountry.addEventListener('change', function() {
            if(subCity) {
                subCity.innerHTML = '<option value="">Select City</option>';
                if(locations[this.value]) locations[this.value].forEach(city => subCity.appendChild(new Option(city, city)));
            }
            window.validateForm();
        });
    }

    if(subPlatform) {
        subPlatform.addEventListener('change', function() {
            const isEnabled = this.value !== "";
            if(subLink) subLink.disabled = !isEnabled;
            if(subDescription) subDescription.disabled = !isEnabled;
            if(subLink) subLink.dispatchEvent(new Event('input'));
            window.validateForm();
        });
    }

    if(subCategory) {
        subCategory.addEventListener('change', function() {
            const premiumWarning = document.getElementById('premiumWarning');
            const submitBtn = document.getElementById('submitBtn');
            if (window.premiumCategories.includes(this.value)) {
                if(premiumWarning) premiumWarning.classList.remove('hidden');
                if(submitBtn) {
                    submitBtn.innerHTML = '<i class="fa-solid fa-crown"></i> Subscribe to Post';
                    submitBtn.style.background = 'linear-gradient(45deg, #f1c40f, #e67e22)';
                }
            } else {
                if(premiumWarning) premiumWarning.classList.add('hidden');
                if(submitBtn) {
                    submitBtn.innerHTML = window.editingGroupId ? 'Update Group' : 'Post Group';
                    submitBtn.style.background = ''; 
                }
            }
            window.validateForm();
        });
    }

    if(subLink) {
        subLink.addEventListener('input', debounce(() => {
            const url = subLink.value.trim();
            const linkWarning = document.getElementById('linkWarning');
            const linkSuccess = document.getElementById('linkSuccess');
            
            if (url === "") { 
                if(linkWarning) linkWarning.classList.add('hidden'); 
                if(linkSuccess) linkSuccess.classList.add('hidden'); 
            } else if (subPlatform && subPlatform.value && linkPatterns[subPlatform.value] && linkPatterns[subPlatform.value].test(url)) {
                if(linkSuccess) linkSuccess.classList.remove('hidden'); 
                if(linkWarning) linkWarning.classList.add('hidden');
            } else {
                if(linkWarning) linkWarning.classList.remove('hidden'); 
                if(linkSuccess) linkSuccess.classList.add('hidden');
            }
            window.validateForm();
        }, 400));
    }

    if(subDescription) {
        subDescription.addEventListener('input', debounce(() => {
            const text = subDescription.value.trim();
            const hasEmojis = emojiRegex.test(text);
            const words = text.split(/\s+/).filter(word => word.length > 1);
            const descWarning = document.getElementById('descWarning');
            const descSuccess = document.getElementById('descSuccess');
            
            if (text === "") {
                if(descWarning) descWarning.classList.add('hidden'); 
                if(descSuccess) descSuccess.classList.add('hidden');
            } else if (hasEmojis || text.length < 40 || words.length < 5) {
                if(descWarning) descWarning.classList.remove('hidden'); 
                if(descSuccess) descSuccess.classList.add('hidden');
            } else {
                if(descSuccess) descSuccess.classList.remove('hidden'); 
                if(descWarning) descWarning.classList.add('hidden');
            }
            window.validateForm();
        }, 400));
    }
    
    if(subName) subName.addEventListener('input', window.validateForm);
}

window.validateForm = function() {
    const subName = document.getElementById('subName');
    const subPlatform = document.getElementById('subPlatform');
    const subCategory = document.getElementById('subCategory');
    const subCountry = document.getElementById('subCountry');
    const subCity = document.getElementById('subCity');
    const linkSuccess = document.getElementById('linkSuccess');
    const descSuccess = document.getElementById('descSuccess');
    const submitBtn = document.getElementById('submitBtn');

    if(!submitBtn) return;

    const isNameSet = subName && subName.value.trim() !== "";
    const isPlatformSet = subPlatform && subPlatform.value !== "";
    const isCategorySet = subCategory && subCategory.value !== "";
    const isCountrySet = subCountry && subCountry.value !== "";
    const isCitySet = subCity && subCity.value !== "";
    
    const isLinkValid = linkSuccess ? !linkSuccess.classList.contains('hidden') : true;
    const isDescValid = descSuccess ? !descSuccess.classList.contains('hidden') : true;

    if (isNameSet && isPlatformSet && isCategorySet && isCountrySet && isCitySet && isLinkValid && isDescValid) {
        submitBtn.disabled = false;
        submitBtn.classList.remove('disabled-btn');
    } else {
        submitBtn.disabled = true;
        submitBtn.classList.add('disabled-btn');
    }
};

// --- Views & Modals ---
window.switchView = function(viewName, event) {
    if(event) event.preventDefault();
    document.querySelectorAll('.dashboard-view').forEach(view => {
        view.classList.remove('active');
        view.classList.add('hidden');
    });
    document.querySelectorAll('.side-menu .nav-link').forEach(link => link.classList.remove('active'));
    
    const target = document.getElementById(`view-${viewName}`);
    if(target) {
        target.classList.add('active');
        target.classList.remove('hidden');
    }
    
    if(event && event.currentTarget) event.currentTarget.classList.add('active');
    
    if(window.innerWidth < 768) {
        const menu = document.getElementById('dashboardMenu');
        if(menu) {
            menu.classList.remove('active');
            menu.classList.remove('show');
            menu.classList.add('hidden');
        }
    }
};

window.openPaymentModal = function(planName, price) {
    const iframe = document.getElementById('gatewayIframe');
    if(iframe) iframe.src = `https://example.com/checkout?plan=${planName}&amount=${price}`;
    document.getElementById('paymentModal')?.classList.remove('hidden');
};

window.openLogoutModal = function() {
    document.getElementById('logoutModal')?.classList.remove('hidden');
    const menu = document.getElementById('dashboardMenu');
    if(menu) {
        menu.classList.remove('active');
        menu.classList.remove('show');
    }
};

window.closeModals = function() {
    document.querySelectorAll('.overlay').forEach(modal => {
        if (modal.id !== 'authGate') modal.classList.add('hidden');
    });
    const iframe = document.getElementById('gatewayIframe');
    if(iframe) iframe.src = 'about:blank';
};

window.toggleDashboardMenu = function() { 
    const menu = document.getElementById('dashboardMenu');
    if(menu) {
        menu.classList.toggle('active');
        menu.classList.toggle('show');
        menu.classList.toggle('hidden');
    }
};

window.toggleProfilePopup = function() { 
    document.getElementById('profilePopup')?.classList.toggle('hidden'); 
};

// Close modals when clicking outside
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('overlay') && e.target.id !== 'authGate') window.closeModals();
});

function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}
