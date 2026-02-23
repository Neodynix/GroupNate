// --- 1. Supabase Init & Gatekeeper Logic ---
// MUST REPLACE WITH YOUR KEYS
const supabaseUrl = 'https://zpoktahbfhnanizgvehh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpwb2t0YWhiZmhuYW5pemd2ZWhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3ODkwNTIsImV4cCI6MjA4NzM2NTA1Mn0.9xL_kLbgVQmEDtgggb5PauUCGlt4Be5dbjXjp4Hs-Xg';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

const authGate = document.getElementById('authGate');
const dashboardApp = document.getElementById('dashboardApp');
let currentUser = null; 

// Listen for Auth State Changes
supabase.auth.onAuthStateChange((event, session) => {
    if (session) {
        currentUser = session.user;
        authGate.classList.add('hidden');
        dashboardApp.classList.remove('hidden');
        
        document.getElementById('userAvatar').innerText = currentUser.email.charAt(0).toUpperCase();
        document.getElementById('profileEmail').innerText = currentUser.email;
        fetchMyGroups();
    } else {
        currentUser = null;
        dashboardApp.classList.add('hidden');
        authGate.classList.remove('hidden');
    }
});

// Auth Form Logic
window.toggleAuthMode = function() {
    const title = document.getElementById('authTitle');
    const toggleText = document.getElementById('authToggleText');
    const submitBtn = document.getElementById('authSubmitBtn');
    
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

window.handleEmailAuth = async function(e) {
    e.preventDefault();
    const email = document.getElementById('authEmail').value;
    const password = document.getElementById('authPassword').value;
    const isLogin = document.getElementById('authTitle').innerText === 'Welcome Back';
    
    const submitBtn = document.getElementById('authSubmitBtn');
    const originalText = submitBtn.innerText;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';
    submitBtn.disabled = true;

    let authError;

    if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        authError = error;
    } else {
        const { error } = await supabase.auth.signUp({ email, password });
        authError = error;
        if (!error) {
            alert("Success! Check your email for the confirmation link.");
            toggleAuthMode(); 
        }
    }

    if (authError) alert("Error: " + authError.message);
    
    submitBtn.innerText = originalText;
    submitBtn.disabled = false;
};

// --- 2. Dashboard Rules & Static Data ---
const categories = ["Art & Design", "Automotive", "Business", "Career", "Crypto", "Dating", "Education", "Entertainment", "Fashion", "Fitness", "Food", "Gaming", "Health", "Hobbies", "Investments", "Jobs", "Lifestyle", "Memes", "Music", "News", "Pets", "Politics", "Real Estate", "Science", "Shopping", "Sports", "Technology", "Travel", "Writing"];
const premiumCategories = ["Crypto", "Real Estate", "Investments"];
const locations = {
    "USA": ["New York", "Los Angeles", "Chicago", "Houston", "San Francisco"],
    "India": ["Mumbai", "Delhi", "Bangalore", "Hyderabad"],
    "Nigeria": ["Lagos", "Abuja", "Kano", "Ibadan"],
    "UK": ["London", "Manchester", "Birmingham"],
    "Brazil": ["Sao Paulo", "Rio de Janeiro", "Brasilia"],
    "Kenya": ["Nairobi", "Mombasa", "Kisumu"]
};

let myPostedGroups = []; 
let editingGroupId = null;

const linkPatterns = {
    discord: /^(https?:\/\/)?(discord\.gg|discord\.com\/invite)\/[a-zA-Z0-9-]+$/i,
    telegram: /^(https?:\/\/)?(t\.me|telegram\.me)\/[a-zA-Z0-9_]+$/i,
    whatsapp: /^(https?:\/\/)?chat\.whatsapp\.com\/[a-zA-Z0-9]+$/i,
    facebook: /^(https?:\/\/)?(www\.)?facebook\.com\/groups\/[a-zA-Z0-9_.-]+\/?$/i,
    reddit: /^(https?:\/\/)?(www\.)?reddit\.com\/r\/[a-zA-Z0-9_]+\/?$/i,
    instagram: /^(https?:\/\/)?(ig\.me\/j\/|www\.instagram\.com\/[a-zA-Z0-9_.]+\/?)$/i
};

const emojiRegex = /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g;

// --- 3. DOM Elements ---
const subName = document.getElementById('subName');
const subPlatform = document.getElementById('subPlatform');
const subCategory = document.getElementById('subCategory');
const subCountry = document.getElementById('subCountry');
const subCity = document.getElementById('subCity');
const subLink = document.getElementById('subLink');
const subDescription = document.getElementById('subDescription');
const submitBtn = document.getElementById('submitBtn');
const submitForm = document.getElementById('submitGroupForm');

const descWarning = document.getElementById('descWarning');
const descSuccess = document.getElementById('descSuccess');
const linkWarning = document.getElementById('linkWarning');
const linkSuccess = document.getElementById('linkSuccess');
const premiumWarning = document.getElementById('premiumWarning');

const profilePopup = document.getElementById('profilePopup');
const dashboardMenu = document.getElementById('dashboardMenu');

// --- 4. Initialization ---
async function initDashboard() {
    categories.forEach(cat => subCategory.appendChild(new Option(cat, cat)));
    Object.keys(locations).forEach(country => subCountry.appendChild(new Option(country, country)));
    
    setupDashboardListeners();
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) authGate.classList.remove('hidden');
}

// --- 5. Supabase CRUD Operations ---
async function fetchMyGroups() {
    const { data, error } = await supabase
        .from('communities')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

    if (!error) {
        myPostedGroups = data || [];
        renderMyGroups();
        document.getElementById('activeGroupCount').innerText = myPostedGroups.length;
    }
}

submitForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
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
    subLink.disabled = true;
    subDescription.disabled = true;
    linkSuccess.classList.add('hidden');
    descSuccess.classList.add('hidden');
    editingGroupId = null;
    submitBtn.innerHTML = 'Post Group';
    validateForm();
    
    await fetchMyGroups();
});

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
            document.getElementById('activeGroupCount').innerText = myPostedGroups.length;
        }
    }
};

// --- 6. Form Validations ---
function setupDashboardListeners() {
    subCountry.addEventListener('change', function() {
        subCity.innerHTML = '<option value="">Select City</option>';
        if(locations[this.value]) locations[this.value].forEach(city => subCity.appendChild(new Option(city, city)));
    });

    subPlatform.addEventListener('change', function() {
        const isEnabled = this.value !== "";
        subLink.disabled = !isEnabled;
        subDescription.disabled = !isEnabled;
        subLink.dispatchEvent(new Event('input'));
        validateForm();
    });

    subCategory.addEventListener('change', function() {
        if (premiumCategories.includes(this.value)) {
            premiumWarning.classList.remove('hidden');
            submitBtn.innerHTML = '<i class="fa-solid fa-crown"></i> Subscribe to Post';
            submitBtn.style.background = 'linear-gradient(45deg, #f1c40f, #e67e22)';
        } else {
            premiumWarning.classList.add('hidden');
            submitBtn.innerHTML = editingGroupId ? 'Update Group' : 'Post Group';
            submitBtn.style.background = ''; 
        }
        validateForm();
    });

    subLink.addEventListener('input', debounce(() => {
        const url = subLink.value.trim();
        if (url === "") { 
            linkWarning.classList.add('hidden'); linkSuccess.classList.add('hidden'); 
        } else if (subPlatform.value && linkPatterns[subPlatform.value].test(url)) {
            linkSuccess.classList.remove('hidden'); linkWarning.classList.add('hidden');
        } else {
            linkWarning.classList.remove('hidden'); linkSuccess.classList.add('hidden');
        }
        validateForm();
    }, 400));

    subDescription.addEventListener('input', debounce(() => {
        const text = subDescription.value.trim();
        const hasEmojis = emojiRegex.test(text);
        const words = text.split(/\s+/).filter(word => word.length > 1);
        
        if (text === "") {
            descWarning.classList.add('hidden'); descSuccess.classList.add('hidden');
        } else if (hasEmojis || text.length < 40 || words.length < 5) {
            descWarning.classList.remove('hidden'); descSuccess.classList.add('hidden');
        } else {
            descSuccess.classList.remove('hidden'); descWarning.classList.add('hidden');
        }
        validateForm();
    }, 400));
    
    if(subName) subName.addEventListener('input', validateForm);
}

function validateForm() {
    const isNameSet = subName && subName.value.trim() !== "";
    const isPlatformSet = subPlatform.value !== "";
    const isCategorySet = subCategory.value !== "";
    const isCountrySet = subCountry.value !== "";
    const isCitySet = subCity.value !== "";
    const isLinkValid = !linkSuccess.classList.contains('hidden');
    const isDescValid = !descSuccess.classList.contains('hidden');

    if (isNameSet && isPlatformSet && isCategorySet && isCountrySet && isCitySet && isLinkValid && isDescValid) {
        submitBtn.disabled = false;
        submitBtn.classList.remove('disabled-btn');
    } else {
        submitBtn.disabled = true;
        submitBtn.classList.add('disabled-btn');
    }
}

// --- 7. Render Ledger ---
function renderMyGroups() {
    const list = document.getElementById('myGroupsList');
    list.innerHTML = '';

    if (myPostedGroups.length === 0) {
        list.innerHTML = '<p style="color:var(--text-muted); text-align:center;">You haven\'t posted any communities yet.</p>';
        return;
    }

    myPostedGroups.forEach(group => {
        let statusHtml = '';
        if (group.status === 'live') statusHtml = '<div class="status-badge status-live"><i class="fa-solid fa-check"></i> Live</div>';
        if (group.status === 'pending') statusHtml = '<div class="status-badge status-pending"><i class="fa-solid fa-clock"></i> Pending</div>';
        if (group.status === 'expired') statusHtml = '<div class="status-badge status-expired"><i class="fa-solid fa-triangle-exclamation"></i> Expired</div>';
        if (group.status === 'rejected') statusHtml = '<div class="status-badge status-rejected"><i class="fa-solid fa-ban"></i> Rejected</div>';

        const item = document.createElement('div');
        item.className = 'ledger-item';
        
        item.innerHTML = `
            <div style="display: flex; justify-content: space-between; width: 100%; align-items: center;">
                <div class="ledger-info">
                    <h4>${group.name}</h4>
                    <p>Platform: <span style="text-transform: capitalize;">${group.platform}</span></p>
                </div>
                ${statusHtml}
            </div>
            <div class="ledger-actions">
                <button class="action-btn edit-btn" onclick="editGroup(${group.id})"><i class="fa-solid fa-pen"></i> Edit</button>
                <button class="action-btn delete-btn" onclick="deleteGroup(${group.id})"><i class="fa-solid fa-trash"></i> Delete</button>
            </div>
        `;
        list.appendChild(item);
    });
}

window.editGroup = function(id) {
    const group = myPostedGroups.find(g => g.id === id);
    if (!group) return;

    editingGroupId = group.id;

    if(subName) subName.value = group.name;
    subPlatform.value = group.platform;
    subCategory.value = group.category;
    subCountry.value = group.country;
    
    subCountry.dispatchEvent(new Event('change'));
    subCity.value = group.city;
    
    subLink.value = group.link;
    subLink.disabled = false;
    subDescription.value = group.description;
    subDescription.disabled = false;

    subLink.dispatchEvent(new Event('input'));
    subDescription.dispatchEvent(new Event('input'));
    subCategory.dispatchEvent(new Event('change'));
    if(subName) subName.dispatchEvent(new Event('input'));

    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// --- 8. Views & Modals ---
window.switchView = function(viewName, event) {
    if(event) event.preventDefault();
    document.querySelectorAll('.dashboard-view').forEach(view => view.classList.remove('active'));
    document.querySelectorAll('.side-menu .nav-link').forEach(link => link.classList.remove('active'));
    document.getElementById(`view-${viewName}`).classList.add('active');
    if(event) event.currentTarget.classList.add('active');
    if(window.innerWidth < 768) toggleDashboardMenu();
};

window.openPaymentModal = function(planName, price) {
    document.getElementById('gatewayIframe').src = `https://example.com/checkout?plan=${planName}&amount=${price}`;
    document.getElementById('paymentModal').classList.remove('hidden');
};

window.openLogoutModal = function() {
    document.getElementById('logoutModal').classList.remove('hidden');
    document.getElementById('dashboardMenu').classList.remove('active');
};

window.closeModals = function() {
    document.querySelectorAll('.overlay').forEach(modal => {
        if (modal.id !== 'authGate') modal.classList.add('hidden');
    });
    document.getElementById('gatewayIframe').src = 'about:blank';
};

window.confirmLogout = async function() {
    const { error } = await supabase.auth.signOut();
    if (error) alert("Error logging out: " + error.message);
    else window.location.href = "index.html";
};

// --- Helpers ---
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}
window.toggleDashboardMenu = function() { document.getElementById('dashboardMenu').classList.toggle('active'); };
window.toggleProfilePopup = function() { document.getElementById('profilePopup').classList.toggle('hidden'); };

document.addEventListener('click', (e) => {
    if (e.target.classList.contains('overlay') && e.target.id !== 'authGate') closeModals();
});

// Start App
initDashboard();
