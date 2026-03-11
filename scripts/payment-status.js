document.addEventListener("DOMContentLoaded", async () => {
    // 1. Grab parameters from Pesapal's redirect URL
    const urlParams = new URLSearchParams(window.location.search);
    const trackingId = urlParams.get('OrderTrackingId');
    const merchantRef = urlParams.get('OrderMerchantReference');

    if (!trackingId || !merchantRef) {
        showError("Invalid Link", "No payment tracking information found in the URL.");
        return;
    }

    // Display the tracking ID for the user's records
    document.getElementById('refBox').style.display = 'block';
    document.getElementById('refBox').innerText = "Ref: " + trackingId;

    try {
        // ==========================================
        // ⚠️ IMPORTANT: ADD YOUR KEYS HERE ⚠️
        // ==========================================
        const supabaseUrl = 'https://zpoktahbfhnanizgvehh.supabase.co';
        const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpwb2t0YWhiZmhuYW5pemd2ZWhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3ODkwNTIsImV4cCI6MjA4NzM2NTA1Mn0.9xL_kLbgVQmEDtgggb5PauUCGlt4Be5dbjXjp4Hs-Xg';
        
        const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

        // 2. The Double-Tap Check: Force the Edge Function to verify the payment right now
        const { data, error } = await supabase.functions.invoke(
            'pesapal-ipn-listener?OrderTrackingId=' + trackingId + '&OrderMerchantReference=' + merchantRef, 
            { method: 'GET' }
        );

        if (error) throw error;

        // 3. Evaluate the backend's response
        if (data && data.status === "failed") {
             // User had insufficient funds or payment was blocked
             showError("Payment Failed", data.message || "Your transaction was declined. Your account has not been charged.");
        } else {
             // Success!
             showSuccess("Payment Successful!", "Awesome! Your account has been upgraded and premium features are now unlocked.");
        }
        
    } catch (err) {
        console.error("Verification Error:", err);
        // If the check fails (e.g. poor network), show a warning, not a hard error. 
        // The background webhook will likely still process it later.
        showWarning("Pending Verification", "Payment received, but we couldn't instantly verify the upgrade. It should reflect on your dashboard shortly.");
    }
});

// --- UI Helper Functions ---

function showSuccess(title, message) {
    const icon = document.getElementById('statusIcon');
    icon.className = 'icon-circle success';
    icon.innerHTML = '<i class="fa-solid fa-check"></i>';
    updateUI(title, message, 'white', 'Continue to Dashboard');
}

function showWarning(title, message) {
    const icon = document.getElementById('statusIcon');
    icon.className = 'icon-circle'; 
    icon.innerHTML = '<i class="fa-solid fa-clock"></i>';
    updateUI(title, message, '#f1c40f', 'Back to Dashboard');
}

function showError(title, message) {
    const icon = document.getElementById('statusIcon');
    icon.className = 'icon-circle error';
    icon.innerHTML = '<i class="fa-solid fa-xmark"></i>';
    updateUI(title, message, '#ff4757', 'Try Again');
}

function updateUI(title, message, titleColor, btnText) {
    const titleEl = document.getElementById('statusTitle');
    titleEl.innerText = title;
    titleEl.style.color = titleColor;
    
    document.getElementById('statusMessage').innerText = message;
    
    const btn = document.getElementById('returnBtn');
    btn.innerText = btnText;
    btn.style.display = 'block';
                                     }
