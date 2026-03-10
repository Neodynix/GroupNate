// ==========================================
// dashboard-auth.js
// Handles Supabase Auth and Database
// ==========================================

console.log("Auth & Data Script Loaded");

const supabaseUrl = "https://zpoktahbfhnanizgvehh.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpwb2t0YWhiZmhuYW5pemd2ZWhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3ODkwNTIsImV4cCI6MjA4NzM2NTA1Mn0.9xL_kLbgVQmEDtgggb5PauUCGlt4Be5dbjXjp4Hs-Xg";
const { createClient } = window.supabase;
const supabase = createClient(supabaseUrl, supabaseKey);

// Global Variables used by both files
window.currentUser = null;
window.editingGroupId = null;
window.myPostedGroups = [];

// --- 1. Authentication ---
supabase.auth.onAuthStateChange((event, session) => {
    if (session?.user) {
        window.currentUser = session.user;
        document.getElementById("authGate")?.classList.add("hidden");
        document.getElementById("dashboardApp")?.classList.remove("hidden");
        
        const avatar = document.getElementById("userAvatar");
        if(avatar) avatar.innerText = window.currentUser.email.charAt(0).toUpperCase();
        
        const emailLabel = document.getElementById("profileEmail");
        if(emailLabel) emailLabel.innerText = window.currentUser.email;
        
        fetchMyGroups();
    } else {
        window.currentUser = null;
        document.getElementById("dashboardApp")?.classList.add("hidden");
        document.getElementById("authGate")?.classList.remove("hidden");
    }
});

// Auth Form Submission
document.getElementById("authForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("authEmail").value;
    const password = document.getElementById("authPassword").value;
    const isLogin = document.getElementById("authTitle").innerText === "Welcome Back";
    const btn = document.getElementById("authSubmitBtn");

    const originalText = btn.innerText;
    btn.disabled = true;
    btn.innerText = "Processing...";

    const { error } = isLogin 
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    if (error) {
        alert(error.message);
    } else if (!isLogin) {
        alert("Check your email for the confirmation link.");
        // Swap back to login mode
        document.getElementById("authTitle").innerText = "Welcome Back";
        btn.innerText = "Log In";
    }
    
    btn.disabled = false;
    if(error) btn.innerText = originalText;
});

window.confirmLogout = async () => { 
    await supabase.auth.signOut(); 
    location.reload(); 
};

// --- 2. Database Operations ---
async function fetchMyGroups() {
    if (!window.currentUser) return;
    const { data, error } = await supabase
        .from("communities")
        .select("*")
        .eq("user_id", window.currentUser.id)
        .order("created_at", { ascending: false });
        
    if (!error) {
        window.myPostedGroups = data || [];
        const count = document.getElementById("activeGroupCount");
        if(count) count.innerText = window.myPostedGroups.length;
        renderMyGroups();
    }
}

document.getElementById("submitGroupForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    if(!window.currentUser) return alert("Please log in");

    const btn = document.getElementById("submitBtn");
    btn.disabled = true;
    btn.innerText = "Saving...";

    // --- NEW: Added the platform type and premium check before saving ---
    const subPlatform = document.getElementById("subPlatform").value;
    const subCategory = document.getElementById("subCategory").value;

    let determinedType = 'Group';
    if (subPlatform === 'discord') determinedType = 'Server';
    if (subPlatform === 'reddit') determinedType = 'Community';
    if (subPlatform === 'instagram' || subPlatform === 'telegram') determinedType = 'Channel';

    const isPremium = window.premiumCategories ? window.premiumCategories.includes(subCategory) : false;

    const groupData = {
        user_id: window.currentUser.id,
        name: document.getElementById("subName").value.trim(),
        platform: subPlatform,
        type: determinedType,
        category: subCategory,
        country: document.getElementById("subCountry").value,
        city: document.getElementById("subCity").value,
        link: document.getElementById("subLink").value.trim(),
        description: document.getElementById("subDescription").value.trim(),
        is_premium: isPremium,
        status: "pending"
    };

    const { error } = window.editingGroupId 
        ? await supabase.from("communities").update(groupData).eq("id", window.editingGroupId)
        : await supabase.from("communities").insert([groupData]);

    if (error) {
        alert(error.message);
    } else {
        alert(window.editingGroupId ? "Updated!" : "Submitted!");
        e.target.reset();
        window.editingGroupId = null;
        
        // --- NEW: Hides the green success text after you submit ---
        document.getElementById("nameSuccess")?.classList.add("hidden");
        document.getElementById("linkSuccess")?.classList.add("hidden");
        document.getElementById("descSuccess")?.classList.add("hidden");
        if(window.validateForm) window.validateForm();

        fetchMyGroups();
    }
    
    btn.disabled = false;
    btn.innerText = "Post Group";
});

// --- 3. Render and UI Actions from DB ---
function renderMyGroups() {
    const list = document.getElementById("myGroupsList");
    if (!list) return;
    
    if (window.myPostedGroups.length === 0) {
        list.innerHTML = "<p style='text-align:center; padding:20px; color:gray;'>No communities yet.</p>";
        return;
    }
    
    list.innerHTML = window.myPostedGroups.map(group => {
        // --- NEW: Added back your colorful status badges ---
        let statusHtml = '';
        if (group.status === 'live') statusHtml = '<div class="status-badge status-live"><i class="fa-solid fa-check"></i> Live</div>';
        else if (group.status === 'pending') statusHtml = '<div class="status-badge status-pending"><i class="fa-solid fa-clock"></i> Pending</div>';
        else if (group.status === 'expired') statusHtml = '<div class="status-badge status-expired"><i class="fa-solid fa-triangle-exclamation"></i> Expired</div>';
        else if (group.status === 'rejected') statusHtml = '<div class="status-badge status-rejected"><i class="fa-solid fa-ban"></i> Rejected</div>';
        else statusHtml = `<div class="status-badge status-pending"><i class="fa-solid fa-clock"></i> ${group.status}</div>`;

        return `
        <div class="ledger-item glass-panel" style="margin-bottom:15px; padding:15px;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 15px;">
                <div>
                    <strong style="font-size: 1.1rem; color: var(--text-light);">${group.name}</strong>
                    <p style="font-size:0.8rem; color:gray; margin-top:5px; text-transform: capitalize;">${group.platform} | ${group.category}</p>
                </div>
                ${statusHtml}
            </div>
            <div style="display:flex; gap:10px;">
                <button class="action-btn edit-btn" onclick="editGroup('${group.id}')">Edit</button>
                <button class="action-btn delete-btn" style="color: #ff4757; border-color: rgba(255, 71, 87, 0.3);" onclick="deleteGroup('${group.id}')">Delete</button>
            </div>
        </div>
        `;
    }).join("");
}

window.editGroup = function(id) {
    const g = window.myPostedGroups.find(group => group.id === id);
    if (!g) return;
    
    window.editingGroupId = id;
    
    document.getElementById("subName").value = g.name;
    document.getElementById("subPlatform").value = g.platform;
    document.getElementById("subCategory").value = g.category;
    document.getElementById("subCountry").value = g.country;
    
    // Trigger the country change to load cities
    document.getElementById("subCountry").dispatchEvent(new Event("change"));
    document.getElementById("subCity").value = g.city;
    
    document.getElementById("subLink").value = g.link;
    document.getElementById("subDescription").value = g.description;
    
    // Trigger inputs to validate and show the green success labels
    document.getElementById("subName").dispatchEvent(new Event("input"));
    document.getElementById("subLink").dispatchEvent(new Event("input"));
    document.getElementById("subDescription").dispatchEvent(new Event("input"));
    
    document.getElementById("submitBtn").innerText = "Update Group";
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.deleteGroup = async function(id) {
    if (!confirm("Are you sure you want to delete this community?")) return;
    await supabase.from("communities").delete().eq("id", id);
    fetchMyGroups();
};
