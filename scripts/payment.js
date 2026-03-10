// ==========================================
// payment.js
// Handles Pesapal Checkout
// ==========================================

window.openPaymentModal = async function(planName, priceInUSD) {
    if (!window.currentUser) return alert("Please log in.");

    const modal = document.getElementById('paymentModal');
    const iframe = document.getElementById('gatewayIframe');
    
    modal.classList.remove('hidden');
    iframe.srcdoc = `
        <div style="display:flex; justify-content:center; align-items:center; height:100%; font-family:sans-serif; color:#888;">
            <h2><i class="fa-solid fa-spinner fa-spin"></i> Connecting to Pesapal...</h2>
        </div>
    `;

    try {
        // Calls the secure Supabase Edge Function configured for Pesapal
        const { data, error } = await window.supabaseClient.functions.invoke('create-pesapal-order', {
            body: { plan: planName, amount: priceInUSD }
        });

        if (error) throw new Error(error.message);
        
        // Load the secure Pesapal URL in the iframe
        iframe.removeAttribute('srcdoc'); 
        iframe.src = data.redirect_url; 
    } catch (error) {
        iframe.srcdoc = `
            <div style="display:flex; flex-direction:column; justify-content:center; align-items:center; height:100%; font-family:sans-serif; color:#ff4757;">
                <h2>Payment Error</h2>
                <p>${error.message}</p>
            </div>
        `;
    }
};
