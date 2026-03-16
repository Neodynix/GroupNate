// ==========================================
// admin-ui.js - Renderers & DOM Manipulation
// ==========================================

// --- CUSTOM UI MODALS (Replaces alert and confirm) ---
window.customAlert = function(title, message) {
    document.getElementById('alertTitle').innerText = title;
    document.getElementById('alertMessage').innerText = message;
    window.openModal('customAlertModal');
};

window.customConfirm = function(title, message, onConfirmCallback) {
    document.getElementById('confirmTitle').innerText = title;
    document.getElementById('confirmMessage').innerText = message;
    
    const confirmBtn = document.getElementById('confirmActionBtn');
    
    // Remove old listeners to prevent double-firing
    const newBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);
    
    newBtn.addEventListener('click', () => {
        window.closeModal('customConfirmModal');
        onConfirmCallback();
    });
    
    window.openModal('customConfirmModal');
};

// --- TABLE RENDERERS ---

window.populateUsersTable = function(profiles) {
    const tbody = document.getElementById('allUsersTable');
    if (!tbody) return;
    tbody.innerHTML = '';

    profiles.forEach(profile => {
        let planName = "Free Tier", badgeClass = "free";
        if (profile.subscriptions && profile.subscriptions.length > 0 && profile.subscriptions[0].status === 'active') {
            planName = profile.subscriptions[0].plan_name;
            badgeClass = "active";
        }
        
        const isSuspended = profile.is_suspended;
        const statusBadge = isSuspended ? '<span class="badge suspended">Suspended</span>' : `<span class="badge ${badgeClass}">${planName}</span>`;

        tbody.innerHTML += `
            <tr>
                <td>${profile.email || 'No Email'}</td>
                <td class="mono-text">${profile.id.substring(0, 8)}...</td>
                <td>${statusBadge}</td>
                <td>
                    <div class="action-btns">
                        <button class="btn-icon edit" title="Edit Plan" onclick="window.openPlanModal('${profile.id}', '${profile.email}', '${planName}')"><i class="fa-solid fa-pen"></i></button>
                        <button class="btn-icon reset" title="Reset Password" onclick="window.resetUserPassword('${profile.email}')"><i class="fa-solid fa-key"></i></button>
                        <button class="btn-icon delete" title="${isSuspended ? 'Unsuspend' : 'Suspend'}" onclick="window.toggleSuspendUser('${profile.id}', ${isSuspended})"><i class="fa-solid ${isSuspended ? 'fa-check' : 'fa-ban'}"></i></button>
                    </div>
                </td>
            </tr>
        `;
    });
};

window.populateCommunitiesTable = function(communities) {
    const tbody = document.getElementById('groupsTable');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    communities.forEach(community => {
        // Status Badge formatting
        let statusBadge = '';
        if (community.status === 'live') statusBadge = '<span class="badge active">Live</span>';
        else if (community.status === 'pending') statusBadge = '<span class="badge" style="background: rgba(241,196,15,0.15); color: #f1c40f; border: 1px solid #f1c40f;">Pending</span>';
        else statusBadge = '<span class="badge suspended">Rejected</span>';

        tbody.innerHTML += `
            <tr>
                <td>
                    <strong style="display: block; color: white;">${community.name}</strong>
                    <span style="font-size: 0.8rem; color: var(--text-muted); text-transform: capitalize;">${community.platform} | ${community.category}</span>
                </td>
                <td>${statusBadge}</td>
                <td>
                    <div class="action-btns">
                        <button class="action-btn" style="padding: 8px 15px; width: auto; font-size: 0.8rem;" onclick="window.openReviewModal('${community.id}')">Review</button>
                        <button class="btn-icon delete" onclick="window.deleteGroup('${community.id}')"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    if (communities.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color: var(--text-muted);">No communities found.</td></tr>';
    }
};

window.populateLedgerTable = function(profiles) {
    const tbody = document.getElementById('transactionsTable');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    const paidUsers = profiles.filter(p => p.subscriptions && p.subscriptions.length > 0 && p.subscriptions[0].status === 'active');
    
    paidUsers.forEach(profile => {
        const price = profile.subscriptions[0].plan_name === 'Agency' ? '$15.00' : '$5.00';
        tbody.innerHTML += `
            <tr>
                <td>${new Date(profile.created_at).toLocaleDateString()}</td>
                <td class="mono-text">Sub-${profile.id.substring(0,5)}</td>
                <td>${price}</td>
                <td><span class="badge active">Paid</span></td>
            </tr>
        `;
    });
    
    if (paidUsers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color: var(--text-muted);">No completed transactions found.</td></tr>';
    }
};

window.populateAnnouncementsTable = function(announcements) {
    const tbody = document.getElementById('announcementsTable');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    announcements.forEach(ann => {
        tbody.innerHTML += `
            <tr>
                <td>${ann.message.substring(0,40)}...</td>
                <td>${new Date(ann.created_at).toLocaleDateString()}</td>
                <td><button class="btn-icon delete" onclick="window.customConfirm('Delete Alert', 'Remove this announcement?', () => { window.supabaseClient.from('announcements').delete().eq('id', '${ann.id}').then(window.loadDashboardData); })"><i class="fa-solid fa-trash"></i></button></td>
            </tr>
        `;
    });
    
    if (announcements.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color: var(--text-muted);">No announcements posted.</td></tr>';
    }
};

// --- DOM Controls & Modals ---

window.openReviewModal = function(groupId) {
    // Find the group in our global array
    const group = window.allCommunities.find(g => g.id === groupId);
    if (!group) return;

    document.getElementById('reviewName').innerText = group.name;
    document.getElementById('reviewMeta').innerText = `${group.platform} | ${group.category} | ${group.is_premium ? 'Premium Category' : 'Standard'}`;
    document.getElementById('reviewDesc').innerText = group.description;
    
    const linkBtn = document.getElementById('reviewLink');
    linkBtn.href = group.link;

    // Attach functionality to the approve/reject buttons
    const approveBtn = document.getElementById('approveBtn');
    const rejectBtn = document.getElementById('rejectBtn');

    // Clone to remove old listeners
    const newApprove = approveBtn.cloneNode(true);
    const newReject = rejectBtn.cloneNode(true);
    approveBtn.parentNode.replaceChild(newApprove, approveBtn);
    rejectBtn.parentNode.replaceChild(newReject, rejectBtn);

    newApprove.addEventListener('click', () => window.updateGroupStatus(group.id, group.user_id, group.name, 'live'));
    newReject.addEventListener('click', () => window.updateGroupStatus(group.id, group.user_id, group.name, 'rejected'));

    window.openModal('reviewModal');
};

window.toggleSidebar = function() { 
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    if (sidebar) sidebar.classList.toggle('open');
    if (overlay) {
        if (sidebar.classList.contains('open')) overlay.style.display = 'block';
        else overlay.style.display = 'none';
    }
};

window.openModal = function(id) { document.getElementById(id).classList.remove('hidden'); };
window.closeModal = function(id) { document.getElementById(id).classList.add('hidden'); };

window.openPlanModal = function(userId, email, currentPlan) {
    document.getElementById('editPlanUserId').value = userId;
    document.getElementById('editPlanUserEmail').innerText = email;
    document.getElementById('newPlanSelect').value = currentPlan || 'Free Tier';
    window.openModal('planModal');
};

window.switchView = function(viewName, clickedElement) {
    if (clickedElement && clickedElement.classList.contains('nav-tab')) { 
        document.querySelectorAll('.nav-tab').forEach(el => el.classList.remove('active')); 
        clickedElement.classList.add('active'); 
    }
    if (clickedElement && clickedElement.classList.contains('nav-item')) { 
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active')); 
        clickedElement.classList.add('active'); 
        document.querySelectorAll('.nav-tab').forEach(el => { 
            el.classList.remove('active'); 
            if(el.getAttribute('onclick') && el.getAttribute('onclick').includes(viewName)) el.classList.add('active'); 
        }); 
    }
    document.querySelectorAll('.admin-view').forEach(el => el.classList.remove('active'));
    document.getElementById('view-' + viewName).classList.add('active');
};

window.showLoader = function(text = "Loading...") { 
    const loader = document.getElementById('adminLoader'); 
    if (loader) {
        document.getElementById('loaderText').innerText = text; 
        loader.style.display = 'flex'; 
        loader.classList.remove('hidden');
    }
};

window.hideLoader = function() { 
    const loader = document.getElementById('adminLoader'); 
    if (loader) loader.classList.add('hidden');
};
