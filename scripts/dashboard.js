// ===============================
// 1. SUPABASE INITIALIZATION
// ===============================

const supabaseUrl = "https://zpoktahbfhnanizgvehh.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpwb2t0YWhiZmhuYW5pemd2ZWhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3ODkwNTIsImV4cCI6MjA4NzM2NTA1Mn0.9xL_kLbgVQmEDtgggb5PauUCGlt4Be5dbjXjp4Hs-Xg";

const { createClient } = window.supabase;
const supabase = createClient(supabaseUrl, supabaseKey);

console.log("GroupNate dashboard loaded");

// ===============================
// 2. STATIC DATA & RULES
// ===============================

const categories = ["Art & Design", "Automotive", "Business", "Career", "Crypto", "Dating", "Education", "Entertainment", "Fashion", "Fitness", "Food", "Gaming", "Health", "Hobbies", "Investments", "Jobs", "Lifestyle", "Memes", "Music", "News", "Pets", "Politics", "Real Estate", "Science", "Shopping", "Sports", "Technology", "Travel", "Writing"];
const premiumCategories = ["Crypto", "Real Estate", "Investments"];
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

// ===============================
// 3. DOM ELEMENTS
// ===============================

const authGate = document.getElementById("authGate");
const dashboardApp = document.getElementById("dashboardApp");

const authForm = document.getElementById("authForm");
const authTitle = document.getElementById("authTitle");
const authSubmitBtn = document.getElementById("authSubmitBtn");
const authToggleText = document.getElementById('authToggleText');

const userAvatar = document.getElementById("userAvatar");
const profileEmail = document.getElementById("profileEmail");
const activeGroupCount = document.getElementById("activeGroupCount");

const subName = document.getElementById("subName");
const subPlatform = document.getElementById("subPlatform");
const subCategory = document.getElementById("subCategory");
const subCountry = document.getElementById("subCountry");
const subCity = document.getElementById("subCity");
const subLink = document.getElementById("subLink");
const subDescription = document.getElementById("subDescription");
const submitForm = document.getElementById("submitGroupForm");
const submitBtn = document.getElementById("submitBtn");

const descWarning = document.getElementById('descWarning');
const descSuccess = document.getElementById('descSuccess');
const linkWarning = document.getElementById('linkWarning');
const linkSuccess = document.getElementById('linkSuccess');
const premiumWarning = document.getElementById('premiumWarning');
const myGroupsList = document.getElementById("myGroupsList");

let currentUser = null;
let editingGroupId = null;
let myPostedGroups = [];

// ===============================
// 4. AUTH STATE HANDLER
// ===============================

supabase.auth.onAuthStateChange((event, session) => {
    if (session?.user) {
        currentUser = session.user;
        if(authGate) authGate.classList.add("hidden");
        if(dashboardApp) dashboardApp.classList.remove("hidden");

        if (userAvatar) userAvatar.innerText = currentUser.email?.charAt(0)?.toUpperCase() || "U";
        if (profileEmail) profileEmail.innerText = currentUser.email || "";
        
        fetchMyGroups();
    } else {
        currentUser = null;
        if(dashboardApp) dashboardApp.classList.add("hidden");
        if(authGate) authGate.classList.remove("hidden");
    }
});

// ===============================
// 5. INITIALIZATION
// ===============================

async function initDashboard() {
    // Safely populate Dropdowns if they exist
    if (subCategory) {
        subCategory.innerHTML = '<option value="">Select Category</option>';
        categories.forEach(cat => subCategory.appendChild(new Option(cat, cat)));
    }
    
    if (subCountry) {
        subCountry.innerHTML = '<option value="">Select Country</option>';
        Object.keys(locations).forEach(country => subCountry.appendChild(new Option(country, country)));
    }
    
    setupFormListeners();

    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
        currentUser = session.user;
        if(authGate) authGate.classList.add("hidden");
        if(dashboardApp) dashboardApp.classList.remove("hidden");
        if (userAvatar) userAvatar.innerText = currentUser.email?.charAt(0)?.toUpperCase() || "U";
        if (profileEmail) profileEmail.innerText = currentUser.email;
        fetchMyGroups();
    }
}

// ===============================
// 6. AUTH FORM HANDLING
// ===============================

window.toggleAuthMode = function() {
    if (authTitle.innerText === 'Welcome Back') {
        authTitle.innerText = 'Create Account';
        authSubmitBtn.innerText = 'Sign Up';
        if(authToggleText) authToggleText.innerHTML = 'Already have an account? <span style="color: var(--accent); cursor: pointer; font-weight: bold;" onclick="toggleAuthMode()">Log In</span>';
    } else {
        authTitle.innerText = 'Welcome Back';
        authSubmitBtn.innerText = 'Log In';
        if(authToggleText) authToggleText.innerHTML = 'Need an account? <span style="color: var(--accent); cursor: pointer; font-weight: bold;" onclick="toggleAuthMode()">Sign Up</span>';
    }
};

if (authForm) {
    authForm.addEventListener("submit", async function(e) {
        e.preventDefault(); 
        
        const email = document.getElementById("authEmail").value;
        const password = document.getElementById("authPassword").value;
        const isLogin = authTitle.innerText === "Welcome Back";

        const originalText = authSubmitBtn.innerText;
        authSubmitBtn.disabled = true;
        authSubmitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';

        let error;

        if (isLogin) {
            const result = await supabase.auth.signInWithPassword({ email, password });
            error = result.error;
        } else {
            const result = await supabase.auth.signUp({ email, password });
            error = result.error;
            if (!error) {
                alert("Success! Check your email for the confirmation link.");
                toggleAuthMode();
            }
        }

        if (error) alert("Error: " + error.message);

        authSubmitBtn.disabled = false;
        authSubmitBtn.innerText = originalText;
    });
}

// ===============================
// 7. FORM VALIDATIONS
// ===============================

function setupFormListeners() {
    if (subCountry) {
        subCountry.addEventListener('change', function() {
            if(subCity) {
                subCity.innerHTML = '<option value="">Select City</option>';
                if(locations[this.value]) locations[this.value].forEach(city => subCity.appendChild(new Option(city, city)));
            }
        });
    }

    if (subPlatform) {
        subPlatform.addEventListener('change', function() {
            const isEnabled = this.value !== "";
            if(subLink) subLink.disabled = !isEnabled;
            if(subDescription) subDescription.disabled = !isEnabled;
            if(subLink && subLink.value) subLink.dispatchEvent(new Event('input'));
            validateForm();
        });
    }

    if (subCategory) {
        subCategory.addEventListener('change', function() {
            if (premiumCategories.includes(this.value)) {
                if(premiumWarning) premiumWarning.classList.remove('hidden');
                if(submitBtn) {
                    submitBtn.innerHTML = '<i class="fa-solid fa-crown"></i> Subscribe to Post';
                    submitBtn.style.background = 'linear-gradient(45deg, #f1c40f, #e67e22)';
                }
            } else {
                if(premiumWarning) premiumWarning.classList.add('hidden');
                if(submitBtn) {
                    submitBtn.innerHTML = editingGroupId ? 'Update Group' : 'Post Group';
                    submitBtn.style.background = ''; 
                }
            }
            validateForm();
        });
    }

    if (subLink) {
        subLink.addEventListener('input', debounce(() => {
            const url = subLink.value.trim();
            if (url === "") { 
                if(linkWarning) linkWarning.classList.add('hidden'); 
                if(linkSuccess) linkSuccess.classList.add('hidden'); 
            } else if (subPlatform.value && linkPatterns[subPlatform.value] && linkPatterns[subPlatform.value].test(url)) {
                if(linkSuccess) linkSuccess.classList.remove('hidden'); 
                if(linkWarning) linkWarning.classList.add('hidden');
            } else {
                if(linkWarning) linkWarning.classList.remove('hidden'); 
                if(linkSuccess) linkSuccess.classList.add('hidden');
            }
            validateForm();
        }, 400));
    }

    if (subDescription) {
        subDescription.addEventListener('input', debounce(() => {
            const text = subDescription.value.trim();
            const hasEmojis = emojiRegex.test(text);
            const words = text.split(/\s+/).filter(word => word.length > 1);
            
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
            validateForm();
        }, 400));
    }
    
    if(subName) subName.addEventListener('input', validateForm);
}

function validateForm() {
    if (!submitBtn) return;

    const isNameSet = subName && subName.value.trim() !== "";
    const isPlatformSet = subPlatform && subPlatform.value !== "";
    const isCategorySet = subCategory && subCategory.value !== "";
    const isCountrySet = subCountry && subCountry.value !== "";
    const isCitySet = subCity && subCity.value !== "";
    
    // Safety checks for HTML versions that don't have success labels
    const isLinkValid = linkSuccess ? !linkSuccess.classList.contains('hidden') : true;
    const isDescValid = descSuccess ? !descSuccess.classList.contains('hidden') : true;

    if (isNameSet && isPlatformSet && isCategorySet && isCountrySet && isCitySet && isLinkValid && isDescValid) {
        submitBtn.disabled = false;
        submitBtn.classList.remove('disabled-btn');
    } else {
        submitBtn.disabled = true;
        submitBtn.classList.add('disabled-btn');
    }
}

// ===============================
// 8. CRUD OPERATIONS
// ===============================

async function fetchMyGroups() {
    if (!currentUser) return;

    const { data, error } = await supabase
        .from('communities')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

    if (!error) {
        myPostedGroups = data || [];
        renderMyGroups();
        if(activeGroupCount) activeGroupCount.innerText = myPostedGroups.length;
    }
}

if(submitForm) {
    submitForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!currentUser) {
            alert("You must be logged in.");
            return;
        }

        const originalBtnText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
        submitBtn.disabled = true;

        let determinedType = 'Group';
        if (subPlatform.value === 'discord') determinedType = 'Server';
        if (subPlatform.value === 'reddit') determinedType = 'Community';
        if (subPlatform.value === 'instagram' || subPlatform.value === 'telegram') determinedType = 'Channel';

        const groupData = {
            user_id: currentUser.id,
            name: subName.value.trim(),
            platform: subPlatform.value,
            type: determinedType,
            category: subCategory.value,
            country: subCountry.value,
            city: subCity.value,
            link: subLink.value.trim(),
            description: subDescription.value.trim(),
            is_premium: premiumCategories.includes(subCategory.value),
            status: 'pending' 
        };

        let resultError;

        if (editingGroupId) {
            const { error } = await supabase.from('communities').update(groupData).eq('id', editingGroupId).eq('user_id', currentUser.id);
            resultError = error;
        } else {
            const { error } = await supabase.from('communities').insert([groupData]);
            resultError = error;
        }

        if (resultError) {
            alert("Error saving community: " + resultError.message);
            submitBtn.innerHTML = originalBtnText;
            submitBtn.disabled = false;
            return;
        }

        alert(editingGroupId ? "Community Updated Successfully!" : "Community Submitted for Review!");
        
        submitForm.reset();
        if(subLink) subLink.disabled = true;
        if(subDescription) subDescription.disabled = true;
        if(linkSuccess) linkSuccess.classList.add('hidden');
        if(descSuccess) descSuccess.classList.add('hidden');
        editingGroupId = null;
        submitBtn.innerHTML = 'Post Group';
        validateForm();
        
        fetchMyGroups();
    });
}

function renderMyGroups() {
    if (!myGroupsList) return;
    myGroupsList.innerHTML = '';

    if (myPostedGroups.length === 0) {
        myGroupsList.innerHTML = '<p style="color:var(--text-muted); text-align:center;">You haven\'t posted any communities yet.</p>';
        return;
    }

    myPostedGroups.forEach(group => {
        let statusHtml = '';
        if (group.status === 'live') statusHtml = '<div class="status-badge status-live" style="color: #2ed573;"><i class="fa-solid fa-check"></i> Live</div>';
        if (group.status === 'pending') statusHtml = '<div class="status-badge status-pending" style="color: #ffa502;"><i class="fa-solid fa-clock"></i> Pending</div>';
        if (group.status === 'expired') statusHtml = '<div class="status-badge status-expired" style="color: #ff4757;"><i class="fa-solid fa-triangle-exclamation"></i> Expired</div>';
        if (group.status === 'rejected') statusHtml = '<div class="status-badge status-rejected" style="color: #ff4757;"><i class="fa-solid fa-ban"></i> Rejected</div>';

        const item = document.createElement('div');
        item.className = 'ledger-item glass-panel';
        item.style.marginBottom = '15px';
        item.style.padding = '15px';
        
        item.innerHTML = `
            <div style="display: flex; justify-content: space-between; width: 100%; align-items: flex-start; margin-bottom: 10px;">
                <div class="ledger-info">
                    <h4 style="margin: 0; color: var(--text-light);">${group.name}</h4>
                    <p style="margin: 5px 0 0 0; color: var(--text-muted); font-size: 0.9rem;">
                        <i class="fa-brands fa-${group.platform.toLowerCase()}"></i> <span style="text-transform: capitalize;">${group.platform}</span> | ${group.category}
                    </p>
                </div>
                ${statusHtml}
            </div>
            <div class="ledger-actions" style="display: flex; gap: 10px;">
                <button class="nav-btn edit-btn" onclick="editGroup('${group.id}')"><i class="fa-solid fa-pen"></i> Edit</button>
                <button class="nav-btn delete-btn" style="color: #ff4757; border-color: rgba(255, 71, 87, 0.3);" onclick="deleteGroup('${group.id}')"><i class="fa-solid fa-trash"></i> Delete</button>
            </div>
        `;
        myGroupsList.appendChild(item);
    });
}

window.deleteGroup = async function(id) {
    if (confirm("Are you sure you want to delete this community?")) {
        const previousGroups = [...myPostedGroups];
        myPostedGroups = myPostedGroups.filter(g => g.id !== id);
        renderMyGroups();

        const { error } = await supabase.from('communities').delete().eq('id', id).eq('user_id', currentUser.id);

        if (error) {
            alert("Failed to delete. Please try again.");
            myPostedGroups = previousGroups; 
            renderMyGroups();
        } else {
            if(activeGroupCount) activeGroupCount.innerText = myPostedGroups.length;
        }
    }
};

window.editGroup = function(id) {
    const group = myPostedGroups.find(g => g.id === id);
    if (!group) return;

    editingGroupId = group.id;

    if(subName) subName.value = group.name;
    if(subPlatform) subPlatform.value = group.platform;
    if(subCategory) subCategory.value = group.category;
    
    if(subCountry) {
        subCountry.value = group.country;
        subCountry.dispatchEvent(new Event('change'));
    }
    
    if(subCity) subCity.value = group.city;
    
    if(subLink) {
        subLink.value = group.link;
        subLink.disabled = false;
    }
    
    if(subDescription) {
        subDescription.value = group.description;
        subDescription.disabled = false;
    }

    if(subLink) subLink.dispatchEvent(new Event('input'));
    if(subDescription) subDescription.dispatchEvent(new Event('input'));
    if(subCategory) subCategory.dispatchEvent(new Event('change'));
    if(subName) subName.dispatchEvent(new Event('input'));

    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// ===============================
// 9. UI & MODAL HELPERS
// ===============================

window.switchView = function(viewName, element) {
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
    
    if(element) element.classList.add('active');
    
    const menu = document.getElementById('dashboardMenu');
    if(menu && menu.classList.contains('active')) menu.classList.remove('active');
    if(menu && menu.classList.contains('show')) menu.classList.remove('show');
};

window.openPaymentModal = function(planName, price) {
    document.getElementById('gatewayIframe').src = `about:blank`; 
    document.getElementById('paymentModal').classList.remove('hidden');
};

window.openLogoutModal = function() {
    document.getElementById('logoutModal').classList.remove('hidden');
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

window.confirmLogout = async function() {
    const { error } = await supabase.auth.signOut();
    if (error) alert("Error logging out: " + error.message);
    else window.location.reload();
};

window.toggleDashboardMenu = function() { 
    const menu = document.getElementById('dashboardMenu');
    if(menu) {
        menu.classList.toggle('active'); 
        menu.classList.toggle('show'); 
    }
};

window.toggleProfilePopup = function() { 
    const popup = document.getElementById('profilePopup');
    if(popup) popup.classList.toggle('hidden'); 
};

document.addEventListener('click', (e) => {
    if (e.target.classList.contains('overlay') && e.target.id !== 'authGate') closeModals();
});

function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// ===============================
// 10. START APP
// ===============================
initDashboard();
