// ==========================================
// auth.js - Production Version
// ==========================================

const supabaseUrl = 'https://zpoktahbfhnanizgvehh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpwb2t0YWhiZmhuYW5pemd2ZWhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3ODkwNTIsImV4cCI6MjA4NzM2NTA1Mn0.9xL_kLbgVQmEDtgggb5PauUCGlt4Be5dbjXjp4Hs-Xg';
window.supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
window.currentUser = null;

document.addEventListener("DOMContentLoaded", () => {
    const authForm = document.getElementById('authForm');
    
    if (authForm) {
        authForm.addEventListener('submit', async function(e) {
            e.preventDefault(); 
            const email = document.getElementById('authEmail').value;
            const password = document.getElementById('authPassword').value;
            const submitBtn = document.getElementById('authSubmitBtn');
            const authTitle = document.getElementById('authTitle');

            if (!email || !password) return alert("Enter email and password.");
            const isLogin = authTitle.innerText.includes('Welcome Back');
            
            const originalText = submitBtn.innerText;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';
            submitBtn.disabled = true;

            try {
                if (isLogin) {
                    const { error } = await window.supabaseClient.auth.signInWithPassword({ email, password });
                    if (error) throw error;
                } else {
                    const { error } = await window.supabaseClient.auth.signUp({ email, password });
                    if (error) throw error;
                    alert("Account created successfully!");
                    if(typeof window.toggleAuthMode === 'function') window.toggleAuthMode();
                }
            } catch (error) {
                alert(error.message);
            } finally {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    }
});

// Auth State Listener
window.supabaseClient.auth.onAuthStateChange((event, session) => {
    const authGate = document.getElementById('authGate');
    const dashboardApp = document.getElementById('dashboardApp');
    
    if (session?.user) {
        window.currentUser = session.user;
        if(authGate) authGate.classList.add('hidden');
        if(dashboardApp) dashboardApp.classList.remove('hidden');
        
        document.getElementById('userAvatar').innerText = window.currentUser.email.charAt(0).toUpperCase();
        document.getElementById('profileEmail').innerText = window.currentUser.email;
        
        // Trigger data fetch for everything (Groups, Subscriptions, Notifications)
        if (typeof window.fetchDashboardData === 'function') {
            window.fetchDashboardData(); 
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
