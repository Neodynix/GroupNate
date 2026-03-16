// ==========================================
// admin-auth.js - Security & Initialization
// ==========================================

window.SUPABASE_URL = 'https://zpoktahbfhnanizgvehh.supabase.co';
window.SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpwb2t0YWhiZmhuYW5pemd2ZWhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3ODkwNTIsImV4cCI6MjA4NzM2NTA1Mn0.9xL_kLbgVQmEDtgggb5PauUCGlt4Be5dbjXjp4Hs-Xg';

window.supabaseClient = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

// --- Initialization & Failsafe Bootloader ---
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const { data: { session }, error } = await window.supabaseClient.auth.getSession();
        
        if (error) throw error;
        
        if (session) {
            window.verifyAdmin(session.user);
        } else {
            window.hideLoader();
            document.getElementById('adminLoginScreen').classList.remove('hidden');
        }
    } catch (err) {
        console.error("Bootloader Error:", err);
        window.hideLoader();
        document.getElementById('loginError').innerText = "System Error: " + err.message;
        document.getElementById('loginError').style.display = 'block';
        document.getElementById('adminLoginScreen').classList.remove('hidden');
    }
});

// --- Login Handler ---
document.getElementById('adminLoginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('adminEmail').value;
    const password = document.getElementById('adminPassword').value;
    const btn = document.getElementById('loginBtn');
    const errorTxt = document.getElementById('loginError');
    
    btn.innerText = "Authenticating...";
    errorTxt.style.display = 'none';

    try {
        // Grab the Turnstile token
        const captchaToken = document.querySelector('[name="cf-turnstile-response"]')?.value;
        if (!captchaToken) {
            throw new Error("Please wait for the security check to complete.");
        }

        const { data, error } = await window.supabaseClient.auth.signInWithPassword({ 
            email: email, 
            password: password,
            options: { captchaToken: captchaToken } // Pass token to Supabase
        });
        
        if (error) throw error;
        window.verifyAdmin(data.user);
        
    } catch (err) {
        btn.innerText = "Login to Portal";
        errorTxt.innerText = err.message;
        errorTxt.style.display = 'block';
        
        // Reset CAPTCHA on failure so they can try again
        if (window.turnstile) {
            window.turnstile.reset();
        }
    }
});

// --- Admin Verification ---
window.verifyAdmin = async function(user) {
    window.showLoader("Verifying Clearance...");
    try {
        const { data: profile, error } = await window.supabaseClient.from('profiles').select('is_admin').eq('id', user.id).single();
        
        if (error) throw new Error("Database Error: " + error.message);
        if (!profile || profile.is_admin !== true) {
            await window.supabaseClient.auth.signOut();
            throw new Error("Access Denied: You do not have administrator privileges.");
        }

        document.getElementById('headerAdminEmail').innerText = user.email || "Admin"; 
        document.getElementById('adminLoginScreen').classList.add('hidden');
        document.getElementById('adminDashboardApp').classList.remove('hidden');
        
        window.loadDashboardData(); // Fetch all live data
        window.hideLoader();
    } catch (err) {
        window.hideLoader();
        document.getElementById('adminLoginScreen').classList.remove('hidden');
        document.getElementById('loginError').innerText = err.message;
        document.getElementById('loginError').style.display = 'block';
        document.getElementById('loginBtn').innerText = "Login to Portal";
        
        // Reset CAPTCHA if access denied
        if (window.turnstile) {
            window.turnstile.reset();
        }
    }
};

window.adminLogout = async function() { 
    window.showLoader("Logging out..."); 
    await window.supabaseClient.auth.signOut(); 
    window.location.reload(); 
};
