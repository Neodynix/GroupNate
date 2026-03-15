// ==========================================
// admin-data.js - Database Fetching & Actions
// ==========================================

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

        // Fetch Communities
        const { data: communities, count: communityCount } = await window.supabaseClient
            .from('communities')
            .select('id, name', { count: 'exact' });
            
        document.getElementById('statTotalGroups').innerText = communityCount || 0;
        if (communities) window.populateCommunitiesTable(communities);

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

window.toggleSuspendUser = async function(userId, currentStatus) {
    const action = currentStatus ? "unsuspend" : "suspend";
    if (!confirm(`Are you sure you want to ${action} this user?`)) return;
    
    window.showLoader("Updating status...");
    const { error } = await window.supabaseClient.from('profiles').update({ is_suspended: !currentStatus }).eq('id', userId);
    
    if (error) alert("Error: " + error.message);
    else window.loadDashboardData();
    window.hideLoader();
};

window.resetUserPassword = async function(email) {
    if (!confirm(`Send password reset email to ${email}?`)) return;
    window.showLoader("Sending email...");
    const { error } = await window.supabaseClient.auth.resetPasswordForEmail(email);
    if (error) alert("Error: " + error.message);
    else alert("Password reset email sent!");
    window.hideLoader();
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

    if (error) alert("Error: " + error.message);
    else window.loadDashboardData();
    window.hideLoader();
};

window.deleteGroup = async function(communityId) {
    if (!confirm("Are you sure you want to DELETE this community permanently?")) return;
    window.showLoader("Deleting community...");
    const { error } = await window.supabaseClient.from('communities').delete().eq('id', communityId);
    if (error) alert("Error: " + error.message);
    else window.loadDashboardData();
    window.hideLoader();
};

window.saveAnnouncement = async function() {
    const text = document.getElementById('announcementText').value;
    if (!text) return;
    
    window.showLoader("Posting...");
    window.closeModal('announcementModal');
    
    const { error } = await window.supabaseClient.from('announcements').insert([{ message: text }]);
    
    if (error) alert("Make sure you created an 'announcements' table in Supabase!");
    else window.loadDashboardData();
    document.getElementById('announcementText').value = '';
    window.hideLoader();
};

