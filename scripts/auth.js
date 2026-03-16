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
            const confirmPassword = document.getElementById('authConfirmPassword').value;
            const username = document.getElementById('authUsername').value;
            
            const submitBtn = document.getElementById('authSubmitBtn');
            const isLogin = document.getElementById('authTitle').innerText.includes('Welcome Back');
            
            // Basic Validation
            if (!email || !password) {
                return alert("Please enter your email and password.");
            }
            
            if (!isLogin) {
                if (!username) return alert("Please provide a username.");
                if (password !== confirmPassword) return alert("Passwords do not match!");
                if (password.length < 6) return alert("Password must be at least 6 characters.");
            }
            
            const originalText = submitBtn.innerText;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';
            submitBtn.disabled = true;

            try {
                // Grab the Cloudflare Turnstile token FIRST for both Login and Sign Up
                const captchaToken = document.querySelector('[name="cf-turnstile-response"]')?.value;
                if (!captchaToken) {
                    throw new Error("Please complete the security check box.");
                }

                if (isLogin) {
                    // LOG IN: Pass the captcha token here too!
                    const { error } = await window.supabaseClient.auth.signInWithPassword({ 
                        email: email, 
                        password: password,
                        options: {
                            captchaToken: captchaToken
                        }
                    });
                    if (error) throw error;
                    
                } else {
                    // SIGN UP: Pass username and captcha token
                    const { error } = await window.supabaseClient.auth.signUp({ 
                        email: email, 
                        password: password,
                        options: {
                            captchaToken: captchaToken,
                            data: {
                                username: username
                            }
                        }
                    });
                    if (error) throw error;
                    
                    alert("Account created successfully! Please check your email to verify your account before logging in.");
                    window.toggleAuthMode(); // Switch back to login screen
                }
            } catch (error) {
                alert(error.message);
                // Reset the captcha widget so they can try again without refreshing the whole page
                if (window.turnstile) {
                    window.turnstile.reset();
                }
            } finally {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    }
});

// --- Auth UI Helpers ---

window.toggleAuthMode = function() {
    const title = document.getElementById('authTitle');
    const btn = document.getElementById('authSubmitBtn');
    const toggleText = document.getElementById('authToggleText');
    const isLogin = title.innerText.includes('Welcome Back');
    
    const signupFields = document.querySelectorAll('.signup-only');
    const loginFields = document.querySelectorAll('.login-only'); // Targets the Forgot Password link

    if (isLogin) {
        // Switch to Sign Up View
        title.innerText = "Create Account";
        btn.innerText = "Sign Up";
        toggleText.innerHTML = 'Already have an account? <span style="color: var(--accent); cursor: pointer; font-weight: bold;" onclick="window.toggleAuthMode()">Log In</span>';
        
        signupFields.forEach(f => f.classList.remove('hidden'));
        loginFields.forEach(f => f.classList.add('hidden')); // Hide 'Forgot?'
        
        document.getElementById('authUsername').setAttribute('required', 'true');
        document.getElementById('authConfirmPassword').setAttribute('required', 'true');
    } else {
        // Switch to Log In View
        title.innerText = "Welcome Back";
        btn.innerText = "Log In";
        toggleText.innerHTML = 'Need an account? <span style="color: var(--accent); cursor: pointer; font-weight: bold;" onclick="window.toggleAuthMode()">Sign Up</span>';
        
        signupFields.forEach(f => f.classList.add('hidden'));
        loginFields.forEach(f => f.classList.remove('hidden')); // Show 'Forgot?'
        
        document.getElementById('authUsername').removeAttribute('required');
        document.getElementById('authConfirmPassword').removeAttribute('required');
    }
    
    // Reset Turnstile widget when switching modes so it gets a fresh token
    if (window.turnstile) {
        window.turnstile.reset();
    }
};

window.togglePasswordVisibility = function(inputId) {
    const input = document.getElementById(inputId);
    const icon = input.nextElementSibling; 
    
    if (input.type === "password") {
        input.type = "text";
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
        icon.style.color = "var(--accent)";
    } else {
        input.type = "password";
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
        icon.style.color = "var(--text-muted)";
    }
};

// --- Password Reset Logic ---
window.handleForgotPassword = async function() {
    const emailInput = document.getElementById('authEmail').value;
    
    if (!emailInput) {
        return alert("Please type your email address into the box first, then click 'Forgot?'.");
    }

    const confirmReset = confirm(`Send a password reset link to ${emailInput}?`);
    if (!confirmReset) return;

    try {
        const { error } = await window.supabaseClient.auth.resetPasswordForEmail(emailInput, {
            redirectTo: window.location.origin + '/dashboard.html'
        });
        
        if (error) throw error;
        alert("Password reset email sent! Please check your inbox.");
        
    } catch (error) {
        alert("Error: " + error.message);
    }
};

// --- Auth State Listener ---
window.supabaseClient.auth.onAuthStateChange((event, session) => {
    const authGate = document.getElementById('authGate');
    const dashboardApp = document.getElementById('dashboardApp');
    
    // Listen specifically for the password reset event
    if (event === 'PASSWORD_RECOVERY') {
        const newPassword = prompt("Enter your new password:");
        if (newPassword) {
            window.supabaseClient.auth.updateUser({ password: newPassword })
                .then(({ error }) => {
                    if (error) alert("Error updating password: " + error.message);
                    else alert("Password updated successfully! You are now logged in.");
                });
        }
    }
    
    if (session?.user) {
        window.currentUser = session.user;
        if(authGate) authGate.classList.add('hidden');
        if(dashboardApp) dashboardApp.classList.remove('hidden');
        
        // Use Username if it exists, otherwise fallback to Email
        const displayAlias = window.currentUser.user_metadata?.username || window.currentUser.email;
        document.getElementById('userAvatar').innerText = displayAlias.charAt(0).toUpperCase();
        document.getElementById('profileEmail').innerText = displayAlias;
        
        if (typeof window.fetchDashboardData === 'function') {
            window.fetchDashboardData(); 
        }
    } else {
        window.currentUser = null;
        if(dashboardApp) dashboardApp.classList.add('hidden');
        if(authGate) authGate.classList.remove('hidden');
        
        // Ensure Turnstile renders if they are logged out
        if (window.turnstile) {
            window.turnstile.reset();
        }
    }
});

window.confirmLogout = async function() {
    await window.supabaseClient.auth.signOut();
    window.location.reload(); 
};
