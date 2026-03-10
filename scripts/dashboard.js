// ===============================
// 1. SUPABASE INITIALIZATION
// ===============================

const supabaseUrl = "https://zpoktahbfhnanizgvehh.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpwb2t0YWhiZmhuYW5pemd2ZWhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3ODkwNTIsImV4cCI6MjA4NzM2NTA1Mn0.9xL_kLbgVQmEDtgggb5PauUCGlt4Be5dbjXjp4Hs-Xg";

const { createClient } = window.supabase;
const supabase = createClient(supabaseUrl, supabaseKey);

console.log("GroupNate dashboard loaded");

// ===============================
// 2. DOM ELEMENTS
// ===============================

const authGate = document.getElementById("authGate");
const dashboardApp = document.getElementById("dashboardApp");

const authForm = document.getElementById("authForm");
const authTitle = document.getElementById("authTitle");
const authSubmitBtn = document.getElementById("authSubmitBtn");

const userAvatar = document.getElementById("userAvatar");
const profileEmail = document.getElementById("profileEmail");
const activeGroupCount = document.getElementById("activeGroupCount");

const submitForm = document.getElementById("submitGroupForm");
const submitBtn = document.getElementById("submitBtn");

const myGroupsList = document.getElementById("myGroupsList");

let currentUser = null;
let editingGroupId = null;
let myPostedGroups = [];

// ===============================
// 3. AUTH STATE HANDLER
// ===============================

supabase.auth.onAuthStateChange((event, session) => {
    console.log("Auth event:", event);

    if (session?.user) {
        currentUser = session.user;
        authGate.classList.add("hidden");
        dashboardApp.classList.remove("hidden");

        if (userAvatar) {
            userAvatar.innerText = currentUser.email?.charAt(0)?.toUpperCase() || "U";
        }
        if (profileEmail) {
            profileEmail.innerText = currentUser.email || "";
        }
        
        fetchMyGroups();
    } else {
        currentUser = null;
        dashboardApp.classList.add("hidden");
        authGate.classList.remove("hidden");
    }
});

// ===============================
// 4. INITIAL SESSION CHECK
// ===============================

async function initDashboard() {
    console.log("Checking existing session...");
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.user) {
        currentUser = session.user;
        authGate.classList.add("hidden");
        dashboardApp.classList.remove("hidden");

        if (userAvatar) {
            userAvatar.innerText = currentUser.email?.charAt(0)?.toUpperCase() || "U";
        }
        if (profileEmail) {
            profileEmail.innerText = currentUser.email;
        }

        fetchMyGroups();
    }
}

initDashboard();

// ===============================
// 5. AUTH FORM HANDLING
// ===============================

window.toggleAuthMode = function () {
    if (authTitle.innerText === "Welcome Back") {
        authTitle.innerText = "Create Account";
        authSubmitBtn.innerText = "Sign Up";
    } else {
        authTitle.innerText = "Welcome Back";
        authSubmitBtn.innerText = "Log In";
    }
};

// Listen for the form submission natively to prevent refresh
if (authForm) {
    authForm.addEventListener("submit", async function(e) {
        e.preventDefault(); // STOPS THE PAGE REFRESH
        
        const email = document.getElementById("authEmail").value;
        const password = document.getElementById("authPassword").value;
        const isLogin = authTitle.innerText === "Welcome Back";

        authSubmitBtn.disabled = true;
        authSubmitBtn.innerText = "Processing...";

        let error;

        if (isLogin) {
            const result = await supabase.auth.signInWithPassword({ email, password });
            error = result.error;
        } else {
            const result = await supabase.auth.signUp({ email, password });
            error = result.error;
            if (!error) {
                alert("Check your email to confirm signup.");
            }
        }

        if (error) {
            alert(error.message);
        }

        authSubmitBtn.disabled = false;
        authSubmitBtn.innerText = isLogin ? "Log In" : "Sign Up";
    });
}

// ===============================
// 6. UI INTERACTION FUNCTIONS
// ===============================

window.toggleDashboardMenu = function() {
    const menu = document.getElementById("dashboardMenu");
    menu.classList.toggle("show");
    // Also toggle hidden if that's how your CSS handles it
    menu.classList.toggle("hidden"); 
};

window.toggleProfilePopup = function() {
    const popup = document.getElementById("profilePopup");
    popup.classList.toggle("hidden");
};

window.switchView = function(viewName, clickedElement) {
    // 1. Hide all views
    const views = document.querySelectorAll(".dashboard-view");
    views.forEach(view => view.classList.add("hidden"));
    
    // 2. Show the target view
    const targetView = document.getElementById(`view-${viewName}`);
    if (targetView) targetView.classList.remove("hidden");

    // 3. Update active state on sidebar links
    const links = document.querySelectorAll(".side-menu .nav-link");
    links.forEach(link => link.classList.remove("active"));
    if (clickedElement) clickedElement.classList.add("active");

    // Close menu on mobile after clicking
    document.getElementById("dashboardMenu").classList.add("hidden");
    document.getElementById("dashboardMenu").classList.remove("show");
};

window.openLogoutModal = function() {
    document.getElementById("logoutModal").classList.remove("hidden");
};

window.openPaymentModal = function(planName, price) {
    document.getElementById("paymentModal").classList.remove("hidden");
    console.log(`Preparing checkout for ${planName} at $${price}`);
};

window.closeModals = function() {
    document.getElementById("logoutModal").classList.add("hidden");
    document.getElementById("paymentModal").classList.add("hidden");
};

// ===============================
// 7. FETCH USER GROUPS
// ===============================

async function fetchMyGroups() {
    if (!currentUser) return;

    const { data, error } = await supabase
        .from("communities")
        .select("*")
        .eq("user_id", currentUser.id)
        .order("created_at", { ascending: false });

    if (error) {
        console.error(error);
        return;
    }

    myPostedGroups = data || [];
    
    // Update stat in profile popup
    if(activeGroupCount) {
        activeGroupCount.innerText = myPostedGroups.length;
    }

    renderMyGroups();
}

// ===============================
// 8. SUBMIT COMMUNITY
// ===============================

submitForm?.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!currentUser) {
        alert("You must be logged in.");
        return;
    }

    submitBtn.disabled = true;
    submitBtn.innerText = "Saving...";

    const groupData = {
        user_id: currentUser.id,
        name: document.getElementById("subName").value.trim(),
        platform: document.getElementById("subPlatform").value,
        category: document.getElementById("subCategory").value,
        country: document.getElementById("subCountry").value,
        city: document.getElementById("subCity").value,
        link: document.getElementById("subLink").value.trim(),
        description: document.getElementById("subDescription").value.trim(),
        status: "pending"
    };

    let error;

    if (editingGroupId) {
        const result = await supabase
            .from("communities")
            .update(groupData)
            .eq("id", editingGroupId);
        error = result.error;
    } else {
        const result = await supabase
            .from("communities")
            .insert([groupData]);
        error = result.error;
    }

    if (error) {
        alert("Error: " + error.message);
        console.error(error);
    } else {
        alert("Community submitted!");
        submitForm.reset();
        editingGroupId = null;
        fetchMyGroups();
    }

    submitBtn.disabled = false;
    submitBtn.innerText = "Post Group";
});

// ===============================
// 9. RENDER USER GROUPS
// ===============================

function renderMyGroups() {
    if (!myGroupsList) return;

    if (myPostedGroups.length === 0) {
        myGroupsList.innerHTML = "<p style='text-align:center;color:gray;padding: 20px;'>No groups yet.</p>";
        return;
    }

    myGroupsList.innerHTML = myPostedGroups.map(group => `
        <div class="ledger-item glass-panel" style="margin-bottom: 15px; padding: 15px; display: flex; justify-content: space-between; align-items: center;">
            <div>
                <strong style="font-size: 1.1rem; color: var(--text-light);">${group.name}</strong>
                <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 5px;">
                    <i class="fa-brands fa-${group.platform.toLowerCase()}"></i> ${group.platform} | ${group.category}
                </p>
            </div>
            <div style="display: flex; gap: 10px;">
                <button class="nav-btn" onclick="editGroup('${group.id}')">Edit</button>
                <button class="nav-btn" style="color: #ff4757; border-color: rgba(255, 71, 87, 0.3);" onclick="deleteGroup('${group.id}')">Delete</button>
            </div>
        </div>
    `).join("");
}

// ===============================
// 10. DELETE GROUP
// ===============================

window.deleteGroup = async function (id) {
    if (!confirm("Are you sure you want to delete this group?")) return;

    const { error } = await supabase
        .from("communities")
        .delete()
        .eq("id", id);

    if (error) {
        alert(error.message);
    } else {
        fetchMyGroups();
    }
};

// ===============================
// 11. EDIT GROUP
// ===============================

window.editGroup = function (id) {
    const group = myPostedGroups.find(g => g.id == id);
    if (!group) return;

    editingGroupId = id;

    document.getElementById("subName").value = group.name;
    document.getElementById("subPlatform").value = group.platform;
    document.getElementById("subCategory").value = group.category;
    document.getElementById("subCountry").value = group.country;
    document.getElementById("subCity").value = group.city;
    document.getElementById("subLink").value = group.link;
    document.getElementById("subDescription").value = group.description;

    submitBtn.innerText = "Update Group";
    window.scrollTo({ top: 0, behavior: "smooth" });
};

// ===============================
// 12. LOGOUT
// ===============================

window.confirmLogout = async function () {
    const { error } = await supabase.auth.signOut();
    if (error) {
        alert(error.message);
    } else {
        location.reload();
    }
};
