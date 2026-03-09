// ===============================
// 1. SUPABASE INITIALIZATION
// ===============================

const supabaseUrl = "https://zpoktahbfhnanizgvehh.supabase.co";
const supabaseKey = "YOUR_ANON_KEY";

const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

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
            userAvatar.innerText =
                currentUser.email?.charAt(0)?.toUpperCase() || "U";
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
            userAvatar.innerText =
                currentUser.email?.charAt(0)?.toUpperCase() || "U";
        }

        if (profileEmail) {
            profileEmail.innerText = currentUser.email;
        }

        fetchMyGroups();
    }
}

initDashboard();

// ===============================
// 5. AUTH FORM
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

window.handleEmailAuth = async function (e) {

    e.preventDefault();

    const email = document.getElementById("authEmail").value;
    const password = document.getElementById("authPassword").value;

    const isLogin = authTitle.innerText === "Welcome Back";

    authSubmitBtn.disabled = true;
    authSubmitBtn.innerText = "Processing...";

    let error;

    if (isLogin) {

        const result = await supabase.auth.signInWithPassword({
            email,
            password
        });

        error = result.error;

    } else {

        const result = await supabase.auth.signUp({
            email,
            password
        });

        error = result.error;

        if (!error) {
            alert("Check your email to confirm signup.");
        }
    }

    if (error) alert(error.message);

    authSubmitBtn.disabled = false;
    authSubmitBtn.innerText = isLogin ? "Log In" : "Sign Up";
};

// ===============================
// 6. FETCH USER GROUPS
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
    renderMyGroups();
}

// ===============================
// 7. SUBMIT COMMUNITY
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
// 8. RENDER USER GROUPS
// ===============================

function renderMyGroups() {

    if (!myGroupsList) return;

    if (myPostedGroups.length === 0) {

        myGroupsList.innerHTML =
            "<p style='text-align:center;color:gray;'>No groups yet.</p>";

        return;
    }

    myGroupsList.innerHTML = myPostedGroups.map(group => `

        <div class="ledger-item">

            <div>
                <strong>${group.name}</strong>
                <p>${group.platform}</p>
            </div>

            <div>
                <button onclick="editGroup('${group.id}')">Edit</button>
                <button onclick="deleteGroup('${group.id}')">Delete</button>
            </div>

        </div>

    `).join("");
}

// ===============================
// 9. DELETE GROUP
// ===============================

window.deleteGroup = async function (id) {

    if (!confirm("Delete this group?")) return;

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
// 10. EDIT GROUP
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

    window.scrollTo({ top: 0, behavior: "smooth" });
};

// ===============================
// 11. LOGOUT
// ===============================

window.confirmLogout = async function () {

    const { error } = await supabase.auth.signOut();

    if (error) {
        alert(error.message);
    } else {
        location.reload();
    }
};
