// ==========================================
// admin-ui.js - Renderers & DOM Manipulation
// ==========================================

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
        tbody.innerHTML += `
            <tr>
                <td>${community.name || 'Unnamed Community'}</td>
                <td>--</td>
                <td><span class="badge active">Active</span></td>
                <td>
                    <div class="action-btns">
                        <button class="btn-icon delete" onclick="window.deleteGroup('${community.id}')"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    if (communities.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color: var(--text-muted);">No communities found.</td></tr>';
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
                <td><button class="btn-icon delete" onclick="window.supabaseClient.from('announcements').delete().eq('id', '${ann.id}').then(window.loadDashboardData)"><i class="fa-solid fa-trash"></i></button></td>
            </tr>
        `;
    });
    
    if (announcements.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color: var(--text-muted);">No announcements posted.</td></tr>';
    }
};

// --- Menus, Modals, Loaders ---

window.toggleSidebar = function() { 
    const menu = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (menu) menu.classList.toggle('open');
    if (overlay) overlay.classList.toggle('open');
};

window.openModal = function(id) { 
    document.getElementById(id).classList.remove('hidden'); 
};

window.closeModal = function(id) { 
    document.getElementById(id).classList.add('hidden'); 
};

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
            if(el.getAttribute('onclick') && el.getAttribute('onclick').includes(viewName)) {
                el.classList.add('active'); 
            }
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
    if (loader) {
        loader.classList.add('hidden');
    }
};
