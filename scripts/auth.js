// ==========================================
// auth.js - Authentication Only
// ==========================================
alert("Auth file connected!");

// 1. Initialize Supabase Globally
const supabaseUrl = 'https://zpoktahbfhnanizgvehh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpwb2t0YWhiZmhuYW5pemd2ZWhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3ODkwNTIsImV4cCI6MjA4NzM2NTA1Mn0.9xL_kLbgVQmEDtgggb5PauUCGlt4Be5dbjXjp4Hs-Xg';

// We attach it to "window" so data.js can use it too
window.supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
window.currentUser = null;

document.addEventListener("DOMContentLoaded", () => {
    
    const authForm = document.getElementById('authForm');
    
    if (authForm) {
        authForm.addEventListener('submit', async function(e) {
            e.preventDefault(); 
            alert("Step 1: Button Clicked!");

            const email = document.getElementById('authEmail').value;
            const password = document.getElementById('authPassword').value;
            const submitBtn = document.getElementById('authSubmitBtn');
            const authTitle = document.getElementById('authTitle');

            if (!email || !password) {
                alert("Please enter an email and password.");
                return;
            }

            const isLogin = authTitle.innerText.includes('Welcome Back');
            alert("Step 2: Trying to " + (isLogin ? "Log In" : "Sign Up"));

            submitBtn.innerText = "Processing...";
            submitBtn.disabled = true;

            try {
                if (isLogin) {
                    const { error } = await window.supabaseClient.auth.signInWithPassword({ email, password });
                    if (error) throw error;
                    alert("Success! You are logged in.");
                } else {
                    const { error } = await window.supabaseClient.auth.signUp({ email, password });
                    if (error) throw error;
                    alert("Success! Check your email to confirm.");
                }
            } catch (error) {
                alert("SUPABASE ERROR: " + error.message);
            } finally {
                submitBtn.innerText = isLogin ? "Log In" : "Sign Up";
                submitBtn.disabled = false;
            }
        });
    }
});

// 2. Listen for Login/Logout changes
window.supabaseClient.auth.onAuthStateChange((event, session) => {
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
        
        // Trigger the data fetch from the other file if it exists
        if (typeof window.fetchMyGroups === 'function') {
            window.fetchMyGroups(); 
        }
    } else {
        window.currentUser = null;
        if(dashboardApp) dashboardApp.classList.add('hidden');
        if(authGate) authGate.classList.remove('hidden');
    }
});

window.confirmLogout = async function() {
    await window.supabaseClient.auth.signOut();
    window.location.reload(); 
};
