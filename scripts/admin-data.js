// ==========================================
// admin-data.js - Database Fetching & Actions
// ==========================================

// Store communities globally so the Review Modal can find them easily
window.allCommunities = [];

window.loadDashboardData = async function() {
    try {
        // Fetch Users
        const { data: profiles, count: userCount } = await window.supabaseClient
            .from('profiles')
            .select('id, email, is_suspended, created_at, subscriptions(plan_name, status)', { count: 'exact' })
            .order('created_at', { ascending: false });
            
        document.getElementById('statTotalUsers').innerText = userCount || 0;
        if (profiles) { 
            window.populateUsersTable(profiles); 
            window.populateLedgerTable(profiles); 
        }

        // Fetch Communities (Now fetching ALL details for the review modal)
        const { data: communities, count: communityCount } = await window.supabaseClient
            .from('communities')
            .select('id, user_id, name, platform, category, link, description, status, is_premium', { count: 'exact' })
            .order('created_at', { ascending: false });
            
        document.getElementById('statTotalGroups').innerText = communityCount || 0;
        if (communities) {
            window.allCommunities = communities;
            window.populateCommunitiesTable(communities);
        }

        // Fetch Announcements
        const { data: announcements } = await window.supabaseClient
            .from('announcements')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);
            
        if (announcements) window.populateAnnouncementsTable(announcements);

        // Calculate Revenue
        const { data: subs } = await window.supabaseClient
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
};

// --- Notification Engine ---
window.notifyUser = async function(userId, title, message, type) {
    await window.supabaseClient.from('notifications').insert([{
        user_id: userId,
        title: title,
        message: message,
        type: type // 'success', 'error', 'warning', 'info'
    }]);
};

// --- Admin Actions (Using Custom UI Modals) ---

window.toggleSuspendUser = async function(userId, currentStatus) {
    const action = currentStatus ? "unsuspend" : "suspend";
    
    window.customConfirm("Confirm Status Change", `Are you sure you want to ${action} this user?`, async () => {
        window.showLoader("Updating status...");
        const { error } = await window.supabaseClient.from('profiles').update({ is_suspended: !currentStatus }).eq('id', userId);
        
        if (error) {
            window.customAlert("Error", error.message);
        } else {
            // Notify the user about their account status
            const title = currentStatus ? "Account Restored" : "Account Suspended";
            const msg = currentStatus ? "Your account has been fully restored. Welcome back!" : "Your account has been suspended by an administrator due to a violation of our terms.";
            const type = currentStatus ? "success" : "error";
            await window.notifyUser(userId, title, msg, type);
            
            window.loadDashboardData();
        }
        window.hideLoader();
    });
};

window.resetUserPassword = async function(email) {
    window.customConfirm("Reset Password", `Send a password reset email to ${email}?`, async () => {
        window.showLoader("Sending email...");
        const { error } = await window.supabaseClient.auth.resetPasswordForEmail(email);
        
        if (error) window.customAlert("Error", error.message);
        else window.customAlert("Success", "Password reset email has been sent successfully.");
        
        window.hideLoader();
    });
};

window.saveUserPlan = async function() {
    const userId = document.getElementById('editPlanUserId').value;
    const newPlan = document.getElementById('newPlanSelect').value;
    
    window.showLoader("Updating plan...");
    window.closeModal('planModal');

    let error;
    if (newPlan === 'Free Tier') {
        const res = await window.supabaseClient.from('subscriptions').delete().eq('user_id', userId);
        error = res.error;
    } else {
        const res = await window.supabaseClient.from('subscriptions').upsert({ user_id: userId, plan_name: newPlan, status: 'active' }, { onConflict: 'user_id' });
        error = res.error;
    }

    if (error) {
        window.customAlert("Error", error.message);
    } else {
        await window.notifyUser(userId, "Plan Updated", `An admin has updated your account to the ${newPlan}.`, "info");
        window.loadDashboardData();
    }
    window.hideLoader();
};

window.deleteGroup = async function(communityId) {
    window.customConfirm("Delete Community", "Are you sure you want to completely delete this community? This cannot be undone.", async () => {
        window.showLoader("Deleting...");
        const { error } = await window.supabaseClient.from('communities').delete().eq('id', communityId);
        
        if (error) window.customAlert("Error", error.message);
        else window.loadDashboardData();
        window.hideLoader();
    });
};

window.saveAnnouncement = async function() {
    const text = document.getElementById('announcementText').value;
    if (!text) return;
    
    window.showLoader("Posting...");
    window.closeModal('announcementModal');
    
    const { error } = await window.supabaseClient.from('announcements').insert([{ message: text }]);
    
    if (error) window.customAlert("Error", "Could not post announcement. Make sure the table exists.");
    else window.loadDashboardData();
    
    document.getElementById('announcementText').value = '';
    window.hideLoader();
};

// --- NEW: Approve or Reject a Group ---
window.updateGroupStatus = async function(groupId, userId, groupName, newStatus) {
    window.showLoader(`Marking as ${newStatus}...`);
    
    const { error } = await window.supabaseClient.from('communities').update({ status: newStatus }).eq('id', groupId);
    
    if (error) {
        window.customAlert("Error", error.message);
    } else {
        // Build the notification
        const title = newStatus === 'live' ? "Community Approved!" : "Community Rejected";
        const msg = newStatus === 'live' 
            ? `Good news! Your community "${groupName}" has been approved and is now live on the platform.`
            : `We're sorry, but your community "${groupName}" was rejected because it did not meet our quality guidelines.`;
        const type = newStatus === 'live' ? "success" : "error";
        
        await window.notifyUser(userId, title, msg, type);
        
        window.closeModal('reviewModal');
        window.loadDashboardData();
        window.customAlert("Success", `Community has been marked as ${newStatus}. The user has been notified.`);
    }
    window.hideLoader();
};
