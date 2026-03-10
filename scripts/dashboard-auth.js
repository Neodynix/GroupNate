// ==========================================
// dashboard-auth.js (MOBILE DEBUGGER VERSION)
// ==========================================

const supabaseUrl = 'https://zpoktahbfhnanizgvehh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpwb2t0YWhiZmhuYW5pemd2ZWhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3ODkwNTIsImV4cCI6MjA4NzM2NTA1Mn0.9xL_kLbgVQmEDtgggb5PauUCGlt4Be5dbjXjp4Hs-Xg';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

window.currentUser = null; 
window.editingGroupId = null;
window.myPostedGroups = [];
window.initialLoadComplete = false;

document.addEventListener("DOMContentLoaded", () => {
    // Check session on load
    supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session) {
            document.getElementById('authGate')?.classList.remove('hidden');
        }
    });

    const authForm = document.getElementById('authForm');
    
    if (!authForm) {
        alert("CRITICAL ERROR: The script cannot find your login form in the HTML!");
        return; 
    }

    authForm.addEventListener('submit', async function(e) {
        e.preventDefault(); 
        
        // POPUP 1: Did the button actually register the click?
        alert("Step 1: Button clicked! Form submission intercepted.");

        const email = document.getElementById('authEmail').value;
        const password = document.getElementById('authPassword').value;
        const submitBtn = document.getElementById('authSubmitBtn');
        const authTitle = document.getElementById('authTitle');

        if (!email || !password) {
            alert("Please enter an email and password.");
            return;
        }

        const isLogin = authTitle.innerText.includes('Welcome Back');
        
        // POPUP 2: Did it correctly figure out if you are logging in or signing up?
        alert("Step 2: Action detected -> " + (isLogin ? "Logging In" : "Signing Up"));

        const originalText = submitBtn.innerText;
        submitBtn.innerText = "Processing...";
        submitBtn.disabled = true;

        try {
            if (isLogin) {
                // POPUP 3: Sending to Supabase
                alert("Step 3: Talking to Supabase to log in...");
                const { data, error } = await supabase.auth.signInWithPassword({ email, password });
                
                if (error) throw error;
                
                // POPUP 4: Success!
                alert("Step 4: LOGIN SUCCESS! Connecting to dashboard...");
            } else {
                alert("Step 3: Talking to Supabase to create account...");
                const { data, error } = await supabase.auth.signUp({ email, password });
                
                if (error) throw error;
                
                alert("Step 4: SIGNUP SUCCESS! Check your email for a confirmation link.");
            }
        } catch (error) {
            // POPUP 5: Supabase yelled at us. What did it say?
            alert("SUPABASE ERROR: " + error.message);
        } finally {
            submitBtn.innerText = originalText;
            submitBtn.disabled = false;
        }
    });
});

// --- Auth State Changes ---
supabase.auth.onAuthStateChange((event, session) => {
    const authGate = document.getElementById('authGate');
    const dashboardApp = document.getElementById('dashboardApp');
    
    if (session?.user) {
        window.currentUser = session.user;
        if(authGate) authGate.classList.add('hidden');
        if(dashboardApp) dashboardApp.classList.remove('hidden');
        
        const avatar = document.getElementById('userAvatar');
        const emailLabel = document.getElementById('profileEmail');
        if(avatar) avatar.innerText = window.currentUser.email.charAt(0).toUpperCase();
        if(emailLabel) emailLabel.innerText = window.currentUser.email;
        
        fetchMyGroups(); 
    } else {
        window.currentUser = null;
        if(dashboardApp) dashboardApp.classList.add('hidden');
        if(authGate) authGate.classList.remove('hidden');
    }
});

// --- Logout ---
window.confirmLogout = async function() {
    const { error } = await supabase.auth.signOut();
    if (error) alert("Error logging out: " + error.message);
    else window.location.reload(); 
};

// ==========================================
// CRUD OPERATIONS
// ==========================================

async function fetchMyGroups() {
    if(!window.currentUser) return;
    
    const list = document.getElementById('myGroupsList');
    if (list && !window.initialLoadComplete) {
        list.innerHTML = '<p style="color:var(--text-muted); text-align:center;">Loading communities...</p>';
    }

    const { data, error } = await supabase
        .from('communities')
        .select('*')
        .eq('user_id', window.currentUser.id)
        .order('created_at', { ascending: false });

    window.initialLoadComplete = true;

    if (!error) {
        window.myPostedGroups = data || [];
        const countLabel = document.getElementById('activeGroupCount');
        if(countLabel) countLabel.innerText = window.myPostedGroups.length;
        renderMyGroups();
    } else {
        alert("Error fetching groups: " + error.message);
    }
}

document.getElementById('submitGroupForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    if(!window.currentUser) return;
    
    const submitBtn = document.getElementById('submitBtn');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.innerHTML = 'Saving...';
    submitBtn.disabled = true;

    const subPlatform = document.getElementById('subPlatform');
    const subCategory = document.getElementById('subCategory');

    let determinedType = 'Group';
    if (subPlatform.value === 'discord') determinedType = 'Server';
    if (subPlatform.value === 'reddit') determinedType = 'Community';
    if (subPlatform.value === 'instagram' || subPlatform.value === 'telegram') determinedType = 'Channel';

    const isPremium = window.premiumCategories ? window.premiumCategories.includes(subCategory.value) : false;

    const groupData = {
        user_id: window.currentUser.id,
        name: document.getElementById('subName').value.trim(),
        platform: subPlatform.value,
        type: determinedType,
        category: subCategory.value,
        country: document.getElementById('subCountry').value,
        city: document.getElementById('subCity').value,
        link: document.getElementById('subLink').value.trim(),
        description: document.getElementById('subDescription').value.trim(),
        is_premium: isPremium,
        status: window.editingGroupId ? undefined : 'pending' 
    };

    let resultError;

    if (window.editingGroupId) {
        const { error } = await supabase.from('communities').update(groupData).eq('id', window.editingGroupId).eq('user_id', window.currentUser.id);
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

    alert(window.editingGroupId ? "Community Updated Successfully!" : "Community Submitted for Review!");
    e.target.reset();
    
    const elementsToDisable = ['subLink', 'subDescription'];
    const elementsToHide = ['nameSuccess', 'linkSuccess', 'descSuccess', 'premiumWarning'];
    elementsToDisable.forEach(id => { const el = document.getElementById(id); if (el) el.disabled = true; });
    elementsToHide.forEach(id => { const el = document.getElementById(id); if (el) el.classList.add('hidden'); });
    
    window.editingGroupId = null;
    submitBtn.innerHTML = 'Post Group';
    submitBtn.style.background = ''; 
    if(window.validateForm) window.validateForm();
    
    await fetchMyGroups();
});

window.deleteGroup = async function(id) {
    if (confirm("Are you sure you want to delete this community?")) {
        const previousGroups = [...window.myPostedGroups];
        window.myPostedGroups = window.myPostedGroups.filter(g => g.id !== id);
        renderMyGroups();
        
        const countLabel = document.getElementById('activeGroupCount');
        if(countLabel) countLabel.innerText = window.myPostedGroups.length;

        const { error } = await supabase.from('communities').delete().eq('id', id).eq('user_id', window.currentUser.id);

        if (error) {
            alert("Failed to delete. Please try again.");
            window.myPostedGroups = previousGroups; 
            renderMyGroups();
            if(countLabel) countLabel.innerText = window.myPostedGroups.length;
        }
    }
};

function renderMyGroups() {
    const list = document.getElementById('myGroupsList');
    if(!list) return;
    list.innerHTML = '';

    if (window.myPostedGroups.length === 0) {
        list.innerHTML = '<p style="color:var(--text-muted); text-align:center;">You haven\'t posted any communities yet.</p>';
        return;
    }

    window.myPostedGroups.forEach(group => {
        let statusHtml = '';
        if (group.status === 'live') statusHtml = '<div class="status-badge status-live">Live</div>';
        if (group.status === 'pending') statusHtml = '<div class="status-badge status-pending">Pending</div>';
        if (group.status === 'expired') statusHtml = '<div class="status-badge status-expired">Expired</div>';
        if (group.status === 'rejected') statusHtml = '<div class="status-badge status-rejected">Rejected</div>';

        const item = document.createElement('div');
        item.className = 'ledger-item glass-panel';
        item.style.marginBottom = '15px';
        item.style.padding = '15px';
        
        item.innerHTML = `
            <div style="display: flex; justify-content: space-between; width: 100%; align-items: flex-start; margin-bottom: 10px;">
                <div class="ledger-info">
                    <h4 style="margin: 0; color: var(--text-light);">${group.name}</h4>
                    <p style="margin: 5px 0 0 0; color: var(--text-muted); font-size: 0.9rem;">
                        <span style="text-transform: capitalize;">${group.platform}</span> | ${group.category}
                    </p>
                </div>
                ${statusHtml}
            </div>
            <div class="ledger-actions" style="display: flex; gap: 10px;">
                <button class="nav-btn edit-btn" onclick="editGroup('${group.id}')">Edit</button>
                <button class="nav-btn delete-btn" style="color: #ff4757; border-color: rgba(255, 71, 87, 0.3);" onclick="deleteGroup('${group.id}')">Delete</button>
            </div>
        `;
        list.appendChild(item);
    });
}

window.editGroup = function(id) {
    const group = window.myPostedGroups.find(g => g.id === id);
    if (!group) return;

    window.editingGroupId = group.id;

    const subName = document.getElementById('subName');
    const subPlatform = document.getElementById('subPlatform');
    const subCategory = document.getElementById('subCategory');
    const subCountry = document.getElementById('subCountry');
    const subCity = document.getElementById('subCity');
    const subLink = document.getElementById('subLink');
    const subDescription = document.getElementById('subDescription');

    if(subName) subName.value = group.name;
    if(subPlatform) subPlatform.value = group.platform;
    if(subCategory) subCategory.value = group.category;
    
    if(subCountry) {
        subCountry.value = group.country;
        subCountry.dispatchEvent(new Event('change')); 
    }
    
    setTimeout(() => {
        if(subCity) subCity.value = group.city;
        if(window.validateForm) window.validateForm();
    }, 50);
    
    if(subLink) { subLink.value = group.link; subLink.disabled = false; }
    if(subDescription) { subDescription.value = group.description; subDescription.disabled = false; }

    if(subLink) subLink.dispatchEvent(new Event('input'));
    if(subDescription) subDescription.dispatchEvent(new Event('input'));
    if(subCategory) subCategory.dispatchEvent(new Event('change'));
    if(subName) subName.dispatchEvent(new Event('input'));

    window.scrollTo({ top: 0, behavior: 'smooth' });
};
