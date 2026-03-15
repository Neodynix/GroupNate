// ==========================================
// Admin Login, Security, & ACTION Logic
// ==========================================

// ⚠️ REPLACE WITH YOUR ACTUAL SUPABASE URL AND KEY ⚠️
const SUPABASE_URL = 'https://zpoktahbfhnanizgvehh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpwb2t0YWhiZmhuYW5pemd2ZWhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3ODkwNTIsImV4cCI6MjA4NzM2NTA1Mn0.9xL_kLbgVQmEDtgggb5PauUCGlt4Be5dbjXjp4Hs-Xg';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- Initialization ---
document.addEventListener('DOMContentLoaded', async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        verifyAdmin(session.user);
    } else {
        hideLoader();
        document.getElementById('adminLoginScreen').classList.remove('hidden');
    }
});

// --- Login Handler ---
document.getElementById('adminLoginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('adminEmail').value;
    const password = document.getElementById('adminPassword').value;
    const btn = document.getElementById('loginBtn');
    const errorTxt = document.getElementById('loginError');
    
    btn.innerText = "Authenticating...";
    errorTxt.style.display = 'none';

    try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        verifyAdmin(data.user);
    } catch (err) {
        btn.innerText = "Login to Portal";
        errorTxt.innerText = err.message;
        errorTxt.style.display = 'block';
    }
});

// --- Admin Verification ---
async function verifyAdmin(user) {
    showLoader("Verifying Clearance...");
    try {
        const { data: profile, error } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
        if (error || !profile || profile.is_admin !== true) {
            await supabase.auth.signOut();
            throw new Error("Access Denied: You do not have administrator privileges.");
        }

        document.getElementById('headerAdminEmail').innerText = user.email || "Admin"; 
        document.getElementById('adminLoginScreen').classList.add('hidden');
        document.getElementById('adminDashboardApp').classList.remove('hidden');
        
        loadDashboardData(); // Fetch all live data!
        hideLoader();
    } catch (err) {
        hideLoader();
        document.getElementById('adminLoginScreen').classList.remove('hidden');
        document.getElementById('loginError').innerText = err.message;
        document.getElementById('loginError').style.display = 'block';
        document.getElementById('loginBtn').innerText = "Login to Portal";
    }
}

// ==========================================
// DATA FETCHING ENGINE
// ==========================================
async function loadDashboardData() {
    try {
        // Fetch Users (Profiles & Subscriptions)
        const { data: profiles, count: userCount } = await supabase
            .from('profiles')
            .select('id, email, is_suspended, created_at, subscriptions(plan_name, status)', { count: 'exact' })
            .order('created_at', { ascending: false });
            
        document.getElementById('statTotalUsers').innerText = userCount || 0;
        if (profiles) { 
            populateUsersTable(profiles); 
            populateLedgerTable(profiles); 
        }

        // Fetch Communities (Your specific table name!)
        const { data: communities, count: communityCount } = await supabase
            .from('communities')
            .select('id, name', { count: 'exact' });
            
        document.getElementById('statTotalGroups').innerText = communityCount || 0;
        if (communities) populateCommunitiesTable(communities);

        // Fetch Announcements
        const { data: announcements } = await supabase
            .from('announcements')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);
            
        if (announcements) populateAnnouncementsTable(announcements);

        // Calculate Revenue from Subscriptions
        const { data: subs } = await supabase
            .from('subscriptions')
            .select('plan_name')
            .eq('status', 'active');
            
        let mrr = 0;
        if (subs) {
            subs.forEach(sub => {
                if (sub.plan_name === 'Creator Pro') mrr += 5;
                if (sub.plan_name === 'Agency') mrr += 15;
            });
        }
        document.getElementById('statMRR').innerText = `$${mrr.toFixed(2)}`;
    } catch (err) { 
        console.error("Data load error:", err); 
    }
}

// ==========================================
// ADMIN ACTIONS (The core features)
// ==========================================

// 1. Suspend/Unsuspend User
window.toggleSuspendUser = async (userId, currentStatus) => {
    const action = currentStatus ? "unsuspend" : "suspend";
    if (!confirm(`Are you sure you want to ${action} this user?`)) return;
    
    showLoader("Updating status...");
    const { error } = await supabase.from('profiles').update({ is_suspended: !currentStatus }).eq('id', userId);
    
    if (error) alert("Error: " + error.message);
    else loadDashboardData(); // Refresh table
    hideLoader();
};

// 2. Reset Password
window.resetUserPassword = async (email) => {
    if (!confirm(`Send password reset email to ${email}?`)) return;
    showLoader("Sending email...");
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) alert("Error: " + error.message);
    else alert("Password reset email sent!");
    hideLoader();
};

// 3. Edit Subscription Plan
window.openPlanModal = (userId, email, currentPlan) => {
    document.getElementById('editPlanUserId').value = userId;
    document.getElementById('editPlanUserEmail').innerText = email;
    document.getElementById('newPlanSelect').value = currentPlan || 'Free Tier';
    openModal('planModal');
};

window.saveUserPlan = async () => {
    const userId = document.getElementById('editPlanUserId').value;
    const newPlan = document.getElementById('newPlanSelect').value;
    
    showLoader("Updating plan...");
    closeModal('planModal');

    let error;
    if (newPlan === 'Free Tier') {
        // Delete active sub to revert to free
        const res = await supabase.from('subscriptions').delete().eq('user_id', userId);
        error = res.error;
    } else {
        // Upsert new plan
        const res = await supabase.from('subscriptions').upsert({ user_id: userId, plan_name: newPlan, status: 'active' }, { onConflict: 'user_id' });
        error = res.error;
    }

    if (error) alert("Error: " + error.message);
    else loadDashboardData();
    hideLoader();
};

// 4. Delete Community
window.deleteGroup = async (communityId) => {
    if (!confirm("Are you sure you want to DELETE this community permanently?")) return;
    showLoader("Deleting community...");
    const { error } = await supabase.from('communities').delete().eq('id', communityId);
    if (error) alert("Error: " + error.message);
    else loadDashboardData();
    hideLoader();
};

// 5. Create Announcement
window.saveAnnouncement = async () => {
    const text = document.getElementById('announcementText').value;
    if (!text) return;
    
    showLoader("Posting...");
    closeModal('announcementModal');
    
    const { error } = await supabase.from('announcements').insert([{ message: text }]);
    
    if (error) alert("Make sure you created an 'announcements' table in Supabase!");
    else loadDashboardData();
    document.getElementById('announcementText').value = '';
    hideLoader();
};

// ==========================================
// UI RENDERERS
// ==========================================

function populateUsersTable(profiles) {
    const tbody = document.getElementById('allUsersTable');
    if (!tbody) return;
    tbody.innerHTML = '';

    profiles.forEach(profile => {
        let planName = "Free Tier", badgeClass = "free";
        if (profile.subscriptions && profile.subscriptions.length > 0 && profile.subscriptions[0].status === 'active') {
            planName = profile.subscriptions[0].plan_name;
            badgeClass = "active";
        }
        
        const isSuspended = profile.is_suspended;
        const statusBadge = isSuspended ? '<span class="badge suspended">Suspended</span>' : `<span class="badge ${badgeClass}">${planName}</span>`;

        tbody.innerHTML += `
            <tr>
                <td>${profile.email || 'No Email'}</td>
                <td class="mono-text">${profile.id.substring(0, 8)}...</td>
                <td>${statusBadge}</td>
                <td>
                    <div class="action-btns">
                        <button class="btn-icon edit" title="Edit Plan" onclick="openPlanModal('${profile.id}', '${profile.email}', '${planName}')"><i class="fa-solid fa-pen"></i></button>
                        <button class="btn-icon reset" title="Reset Password" onclick="resetUserPassword('${profile.email}')"><i class="fa-solid fa-key"></i></button>
                        <button class="btn-icon delete" title="${isSuspended ? 'Unsuspend' : 'Suspend'}" onclick="toggleSuspendUser('${profile.id}', ${isSuspended})"><i class="fa-solid ${isSuspended ? 'fa-check' : 'fa-ban'}"></i></button>
                    </div>
                </td>
            </tr>
        `;
    });
}

function populateCommunitiesTable(communities) {
    const tbody = document.getElementById('groupsTable'); // Connects to the HTML table ID
    if (!tbody) return;
    tbody.innerHTML = '';
    
    communities.forEach(community => {
        // We use community.name to render the table rows
        tbody.innerHTML += `
            <tr>
                <td>${community.name || 'Unnamed Community'}</td>
                <td><span class="badge active">Active</span></td>
                <td>
                    <div class="action-btns">
                        <button class="btn-icon delete" onclick="deleteGroup('${community.id}')"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    if (communities.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color: var(--text-muted);">No communities found.</td></tr>';
    }
}

function populateLedgerTable(profiles) {
    const tbody = document.getElementById('transactionsTable');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    const paidUsers = profiles.filter(p => p.subscriptions && p.subscriptions.length > 0 && p.subscriptions[0].status === 'active');
    
    paidUsers.forEach(profile => {
        const price = profile.subscriptions[0].plan_name === 'Agency' ? '$15.00' : '$5.00';
        tbody.innerHTML += `
            <tr>
                <td>${new Date(profile.created_at).toLocaleDateString()}</td>
                <td class="mono-text">Sub-${profile.id.substring(0,5)}</td>
                <td>${price}</td>
                <td><span class="badge active">Paid</span></td>
            </tr>
        `;
    });
    
    if (paidUsers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color: var(--text-muted);">No completed transactions found.</td></tr>';
    }
}

function populateAnnouncementsTable(announcements) {
    const tbody = document.getElementById('announcementsTable');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    announcements.forEach(ann => {
        tbody.innerHTML += `
            <tr>
                <td>${ann.message.substring(0,40)}...</td>
                <td>${new Date(ann.created_at).toLocaleDateString()}</td>
                <td><button class="btn-icon delete" onclick="supabase.from('announcements').delete().eq('id', '${ann.id}').then(loadDashboardData)"><i class="fa-solid fa-trash"></i></button></td>
            </tr>
        `;
    });
    
    if (announcements.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color: var(--text-muted);">No announcements posted.</td></tr>';
    }
}

// --- Navigation & Modals ---
function toggleSidebar() { 
    document.getElementById('sidebar').classList.toggle('open'); 
    document.getElementById('sidebarOverlay').classList.toggle('open'); 
}

function openModal(id) { 
    document.getElementById(id).classList.remove('hidden'); 
}

function closeModal(id) { 
    document.getElementById(id).classList.add('hidden'); 
}

function switchView(viewName, clickedElement) {
    if (clickedElement && clickedElement.classList.contains('nav-tab')) { 
        document.querySelectorAll('.nav-tab').forEach(el => el.classList.remove('active')); 
        clickedElement.classList.add('active'); 
    }
    
    if (clickedElement && clickedElement.classList.contains('nav-item')) { 
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active')); 
        clickedElement.classList.add('active'); 
        document.querySelectorAll('.nav-tab').forEach(el => { 
            el.classList.remove('active'); 
            if(el.getAttribute('onclick').includes(viewName)) el.classList.add('active'); 
        }); 
    }
    
    document.querySelectorAll('.admin-view').forEach(el => el.classList.remove('active'));
    document.getElementById('view-' + viewName).classList.add('active');
}

async function adminLogout() { 
    showLoader("Logging out..."); 
    await supabase.auth.signOut(); 
    window.location.reload(); 
}

function showLoader(text = "Loading...") { 
    const loader = document.getElementById('adminLoader'); 
    document.getElementById('loaderText').innerText = text; 
    loader.style.display = 'flex'; 
    setTimeout(() => loader.style.opacity = '1', 10); 
}

function hideLoader() { 
    const loader = document.getElementById('adminLoader'); 
    loader.style.opacity = '0'; 
    setTimeout(() => loader.style.display = 'none', 500); 
}