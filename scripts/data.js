// ==========================================
// data.js - Handles Data, Fetching, and Notifications
// ==========================================

window.myPostedGroups = [];
window.userPlan = 'Free'; 

// Main bootloader for dashboard data
window.fetchDashboardData = async function() {
    if(!window.currentUser) return;
    
    // 1. Fetch Subscription Tier
    const { data: sub } = await window.supabaseClient
        .from('subscriptions')
        .select('plan_name')
        .eq('user_id', window.currentUser.id)
        .eq('status', 'active')
        .single();
        
    window.userPlan = sub ? sub.plan_name : 'Free';
    document.getElementById('profilePlanLabel').innerText = `${window.userPlan} Tier`;

    document.querySelectorAll('.pricing-card').forEach(card => card.style.border = '1px solid rgba(255,255,255,0.1)');
    const currentCard = document.getElementById(window.userPlan === 'Creator Pro' ? 'plan-Pro' : (window.userPlan === 'Agency' ? 'plan-Agency' : 'plan-Free'));
    if(currentCard) currentCard.style.border = '2px solid var(--accent)';

    // 2. Fetch Groups
    const list = document.getElementById('myGroupsList');
    list.innerHTML = '<p style="text-align:center;"><i class="fa-solid fa-spinner fa-spin"></i></p>';

    const { data: groups, error } = await window.supabaseClient
        .from('communities')
        .select('*')
        .eq('user_id', window.currentUser.id)
        .order('created_at', { ascending: false });

    if (!error) {
        window.myPostedGroups = groups || [];
        document.getElementById('activeGroupCount').innerText = window.myPostedGroups.length;
        window.renderMyGroups();
    }

    // 3. Fetch Notifications & Update Both Badges
    const { data: notifs } = await window.supabaseClient
        .from('notifications')
        .select('*')
        .eq('user_id', window.currentUser.id)
        .order('created_at', { ascending: false });

    const bottomBadge = document.getElementById('bottomNotifBadge');

    if (notifs && notifs.length > 0) {
        document.getElementById('notifBadge').innerText = notifs.length;
        if (bottomBadge) {
            bottomBadge.innerText = notifs.length;
            bottomBadge.classList.remove('hidden');
        }
        
        renderNotifications(notifs);
        
        // Delete them from DB now that they are fetched
        await window.supabaseClient.from('notifications').delete().eq('user_id', window.currentUser.id);
    } else {
        document.getElementById('notifBadge').innerText = '0';
        if (bottomBadge) {
            bottomBadge.classList.add('hidden');
        }
    }

    // 4. Fetch System Announcement
    const { data: announcementData } = await window.supabaseClient
        .from('announcements')
        .select('message')
        .order('created_at', { ascending: false })
        .limit(1)
        .single(); 

    const banner = document.getElementById('systemAnnouncement');
    if (announcementData && announcementData.message && banner) {
        document.getElementById('announcementMessage').innerText = announcementData.message;
        banner.style.display = 'flex';
    } else if (banner) {
        banner.style.display = 'none';
    }
};

// Form Submission logic
document.getElementById('submitGroupForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    if(!window.currentUser) return;
    
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
    submitBtn.disabled = true;

    const subCategory = document.getElementById('subCategory').value;
    const isPremium = window.premiumCategories.includes(subCategory);

    // Save the new dynamic type!
    const groupData = {
        user_id: window.currentUser.id,
        name: document.getElementById('subName').value.trim(),
        platform: document.getElementById('subPlatform').value,
        type: document.getElementById('subType').value || 'Group', 
        category: subCategory,
        country: document.getElementById('subCountry').value,
        city: document.getElementById('subCity').value,
        link: document.getElementById('subLink').value.trim(),
        description: document.getElementById('subDescription').value.trim(),
        is_premium: isPremium
    };

    const { error } = await window.supabaseClient.from('communities').insert([groupData]);

    if (error) {
        window.uiAlert("Submission Failed", error.message);
        submitBtn.innerHTML = 'Post Group';
        submitBtn.disabled = false;
        return;
    }

    window.uiAlert("Success!", "Your community has been successfully submitted for review.", true);
    e.target.reset();
    document.getElementById("typeGroup")?.classList.add("hidden"); // Hide the dropdown again
    window.fetchDashboardData(); 
});

window.renderMyGroups = function() {
    const list = document.getElementById('myGroupsList');
    list.innerHTML = '';

    if (window.myPostedGroups.length === 0) {
        list.innerHTML = '<p style="color:var(--text-muted); text-align:center;">No communities yet.</p>';
        return;
    }

    window.myPostedGroups.forEach(group => {
        let icon = group.status === 'live' ? 'check' : (group.status === 'pending' ? 'clock' : 'ban');
        let statusHtml = `<div class="status-badge status-${group.status}"><i class="fa-solid fa-${icon}"></i> ${group.status}</div>`;

        list.innerHTML += `
            <div class="ledger-item glass-panel" style="margin-bottom: 15px; padding: 15px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                    <div class="ledger-info">
                        <h4 style="margin: 0; color: var(--text-light);">${group.name}</h4>
                        <p style="margin: 5px 0 0 0; color: var(--text-muted); font-size: 0.9rem;">
                            <span style="text-transform: capitalize;">${group.platform}</span> ${group.type ? `(${group.type})` : ''} | ${group.category}
                        </p>
                    </div>
                    ${statusHtml}
                </div>
                <div class="ledger-actions">
                    <button class="nav-btn delete-btn" style="color:#ff4757; border-color:rgba(255, 71, 87, 0.3);" onclick="deleteGroup('${group.id}')"><i class="fa-solid fa-trash"></i> Delete</button>
                </div>
            </div>
        `;
    });
};

window.deleteGroup = async function(id) {
    if (confirm("Delete this community?")) {
        await window.supabaseClient.from('communities').delete().eq('id', id);
        window.fetchDashboardData();
    }
};

function renderNotifications(notifs) {
    const list = document.getElementById('notificationsList');
    list.innerHTML = '';
    notifs.forEach(n => {
        let color = n.type === 'success' ? '#2ed573' : (n.type === 'error' ? '#ff4757' : 'var(--accent)');
        list.innerHTML += `
            <div class="ledger-item glass-panel" style="margin-bottom: 10px; border-left: 4px solid ${color};">
                <strong style="display:block; margin-bottom:5px;">${n.title}</strong>
                <span style="color:var(--text-muted); font-size: 0.9rem;">${n.message}</span>
            </div>
        `;
    });
}
