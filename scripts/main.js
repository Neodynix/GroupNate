// ==========================================
// main.js - GroupNate Directory App
// ==========================================

// --- 1. Supabase Initialization ---
const supabaseUrl = 'https://zpoktahbfhnanizgvehh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpwb2t0YWhiZmhuYW5pemd2ZWhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3ODkwNTIsImV4cCI6MjA4NzM2NTA1Mn0.9xL_kLbgVQmEDtgggb5PauUCGlt4Be5dbjXjp4Hs-Xg';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

const categories = [
    "Art & Design", "Automotive", "Business", "Career", "Crypto", "Dating", 
    "Education", "E-commerce", "Entertainment", "Fashion", "Fitness", "Food", 
    "Forex & Trading", "Gaming", "Health", "Hobbies", "Investments", "Jobs", 
    "Lifestyle", "Memes", "Music", "News", "Pets", "Politics", "Real Estate", 
    "Science", "Shopping", "Sports", "Technology", "Travel", "Writing"
];

// --- 2. State Management ---
let allGroups = [];
let currentGroups = []; 
let currentPage = 1;
const itemsPerPage = 8; 

// --- 3. DOM Elements ---
const groupGrid = document.getElementById('groupGrid');
const searchContainer = document.getElementById('searchContainer');
const filterContainer = document.getElementById('filterContainer');
const searchInput = searchContainer.querySelector('input');
const sideMenu = document.querySelector('.side-menu');

const categorySelect = document.getElementById('categorySelect');
const countrySelect = document.getElementById('countrySelect');
const citySelect = document.getElementById('citySelect');
const platformIcons = document.querySelectorAll('.platform-icons i');

const typeFilterGroup = document.getElementById('typeFilterGroup');
const typeBtns = document.querySelectorAll('.type-btn');

const btnFirst = document.querySelector('.glass-footer .nav-btn:first-child');
const btnPrev = document.querySelector('.glass-footer .nav-btn:nth-child(2)');
const btnNext = document.querySelector('.glass-footer .nav-btn:last-child');
const pageInfo = document.querySelector('.page-info');

// --- 4. Initialization ---
async function init() {
    populateCategories();
    await loadCountries();
    setupEventListeners();
    await fetchLiveGroups(); 
}

// --- 5. Database Fetching & AGENCY SORTING ---
async function fetchLiveGroups() {
    groupGrid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;"><i class="fa-solid fa-circle-notch fa-spin fa-3x" style="color:var(--accent);"></i><p style="margin-top:15px;color:var(--text-muted);">Finding communities...</p></div>';
    
    // 1. Fetch live communities
    const { data: communities, error } = await supabaseClient
        .from('communities')
        .select('*')
        .eq('status', 'live');
        
    if (error) {
        groupGrid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:#ff4757;">Failed to load communities.</div>';
        return;
    }
    
    // 2. Safely fetch the usernames from the profiles table
    const userIds = [...new Set((communities || []).map(g => g.user_id))];
    let profiles = [];
    
    if (userIds.length > 0) {
        const { data: profData } = await supabaseClient
            .from('profiles')
            .select('id, username')
            .in('id', userIds);
        profiles = profData || [];
    }

    // Map the usernames to the group data
    allGroups = (communities || []).map(group => {
        const userProfile = profiles.find(p => p.id === group.user_id);
        return {
            ...group,
            poster: userProfile?.username || 'Verified Creator' // Fallback just in case
        };
    });

    // --- MAGIC SORTING: Push Premium/Agency groups to the absolute top ---
    allGroups.sort((a, b) => {
        // 1. Sort by Premium Status First
        if (a.is_premium && !b.is_premium) return -1;
        if (!a.is_premium && b.is_premium) return 1;
        
        // 2. If they have the same status, sort by newest date
        return new Date(b.created_at) - new Date(a.created_at);
    });

    currentGroups = [...allGroups];
    currentPage = 1;
    updatePagination();

    // Trigger Dynamic SEO Injection
    injectDynamicSEO(allGroups);
}

// --- 6. DYNAMIC SEO INJECTOR (JSON-LD) ---
function injectDynamicSEO(groups) {
    if (!groups || groups.length === 0) return;

    const topCategories = [...new Set(groups.map(g => g.category))].slice(0, 3).join(', ');
    const topNames = groups.slice(0, 3).map(g => g.name).join(', ');
    
    let metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
        metaDesc.setAttribute("content", `Join communities like ${topNames}. Explore top groups in ${topCategories} on GroupNate today.`);
    }

    const schema = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": "Active Social Communities & Groups",
        "description": "A curated directory of the best WhatsApp, Telegram, Discord, and Reddit groups.",
        "itemListElement": groups.slice(0, 15).map((g, index) => ({
            "@type": "ListItem",
            "position": index + 1,
            "item": {
                "@type": "Organization",
                "name": g.name,
                "description": g.description,
                "sameAs": g.link || "https://groupnate.pages.dev"
            }
        }))
    };
    
    let script = document.createElement('script');
    script.type = "application/ld+json";
    script.text = JSON.stringify(schema);
    document.head.appendChild(script);
}

// --- 7. API Fetching ---
async function loadCountries() {
    countrySelect.innerHTML = '<option value="">Loading Countries...</option>';
    try {
        const res = await fetch('https://countriesnow.space/api/v0.1/countries/iso');
        const data = await res.json();
        countrySelect.innerHTML = '<option value="">Select Country</option>';
        data.data.forEach(c => countrySelect.appendChild(new Option(c.name, c.name)));
        countrySelect.appendChild(new Option("Global (Online)", "Global"));
    } catch(e) { 
        countrySelect.innerHTML = '<option value="">Error loading locations</option>';
    }
}

// --- 8. Helpers ---
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

const cardObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if(entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
        }
    });
}, { threshold: 0.1 });

function getTerminology(platform, type) {
    if (type) return type; 
    switch(platform) {
        case 'discord': return 'Server';
        case 'reddit': return 'Community';
        case 'telegram': return 'Channel';
        case 'facebook': return 'Group';
        case 'whatsapp': return 'Group';
        case 'instagram': return 'Channel';
        default: return 'Group';
    }
}

function formatDate(dateString) {
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

// --- 9. Event Listeners ---
function setupEventListeners() {
    searchInput.addEventListener('input', debounce((e) => {
        const query = e.target.value.toLowerCase();
        currentGroups = allGroups.filter(group => 
            group.name.toLowerCase().includes(query) || 
            group.description.toLowerCase().includes(query)
        );
        currentPage = 1; 
        updatePagination();
    }, 300));

    btnFirst.addEventListener('click', () => { currentPage = 1; updatePagination(); });
    btnPrev.addEventListener('click', () => { if (currentPage > 1) { currentPage--; updatePagination(); }});
    btnNext.addEventListener('click', () => {
        const maxPage = Math.ceil(currentGroups.length / itemsPerPage);
        if (currentPage < maxPage) { currentPage++; updatePagination(); }
    });

    platformIcons.forEach(icon => {
        icon.addEventListener('click', function() { 
            this.classList.toggle('active'); 
            updateSmartUI();
            runLiveFilter();
        });
    });

    if (typeBtns) {
        typeBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                typeBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                runLiveFilter();
            });
        });
    }

    countrySelect.addEventListener('change', async function() {
        citySelect.innerHTML = '<option value="">Loading...</option>';
        if (this.value === "Global") {
            citySelect.innerHTML = '<option value="Online">Online / Anywhere</option>';
            runLiveFilter();
            return;
        }
        if (!this.value) {
            citySelect.innerHTML = '<option value="">Select City</option>';
            runLiveFilter();
            return;
        }
        
        try {
            const res = await fetch('https://countriesnow.space/api/v0.1/countries/cities', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ country: this.value })
            });
            const data = await res.json();
            citySelect.innerHTML = '<option value="">Select City</option>';
            if (data.data && data.data.length > 0) {
                data.data.forEach(city => citySelect.appendChild(new Option(city, city)));
            } else {
                citySelect.innerHTML = '<option value="Any">Any City</option>';
            }
        } catch(e) {
            citySelect.innerHTML = '<option value="Any">Any City</option>';
        }
        runLiveFilter();
    });

    categorySelect.addEventListener('change', runLiveFilter);
    citySelect.addEventListener('change', runLiveFilter);

    document.addEventListener('click', (e) => {
        const overlay = document.getElementById('previewOverlay');
        if (overlay && e.target === overlay) closePreview();
    });
}

// --- 10. Core Logic & Filtering ---
function populateCategories() {
    categorySelect.innerHTML = '<option value="">Select Category</option>';
    categories.sort().forEach(cat => categorySelect.appendChild(new Option(cat, cat)));
}

function updateSmartUI() {
    if (!typeFilterGroup) return;

    const activePlatforms = Array.from(platformIcons)
        .filter(icon => icon.classList.contains('active'))
        .map(icon => icon.getAttribute('data-platform'));
    
    const singleTypePlatforms = ['discord', 'reddit', 'instagram']; 

    const shouldHide = activePlatforms.length > 0 && activePlatforms.every(p => singleTypePlatforms.includes(p));

    if (shouldHide) {
        typeFilterGroup.classList.add('hidden');
        typeBtns.forEach(b => b.classList.remove('active'));
        document.querySelector('.type-btn[data-type=""]').classList.add('active');
    } else {
        typeFilterGroup.classList.remove('hidden');
    }
}

function runLiveFilter() {
    const activePlatforms = Array.from(platformIcons)
        .filter(icon => icon.classList.contains('active'))
        .map(icon => icon.getAttribute('data-platform'));

    let activeType = "";
    const activeTypeBtn = document.querySelector('.type-btn.active');
    if (activeTypeBtn) {
        activeType = activeTypeBtn.getAttribute('data-type');
    }
    
    const isTypeHidden = typeFilterGroup ? typeFilterGroup.classList.contains('hidden') : false;

    currentGroups = allGroups.filter(group => {
        const platformMatch = activePlatforms.length === 0 || activePlatforms.includes(group.platform);
        const categoryMatch = categorySelect.value === "" || group.category === categorySelect.value;
        const countryMatch = countrySelect.value === "" || group.country === countrySelect.value;
        const cityMatch = citySelect.value === "" || group.city === citySelect.value;
        const typeMatch = isTypeHidden || activeType === "" || group.type === activeType;

        return platformMatch && categoryMatch && countryMatch && cityMatch && typeMatch;
    });

    currentPage = 1;
    updatePagination(); 
}

function applyFilters() {
    runLiveFilter();
    toggleFilters(); 
}

function updatePagination() {
    const totalPages = Math.ceil(currentGroups.length / itemsPerPage) || 1;
    if (currentPage > totalPages) currentPage = totalPages;
    
    // Select elements by ID for total accuracy
    const pageDisplay = document.getElementById('pageDisplay');
    const btnFirst = document.getElementById('btnFirst');
    const btnPrev = document.getElementById('btnPrev');
    const btnNext = document.getElementById('btnNext');

    if (pageDisplay) pageDisplay.innerText = `Page ${currentPage}`;

    // Disable buttons if there's nowhere to go
    if (btnPrev) btnPrev.disabled = (currentPage === 1);
    if (btnFirst) btnFirst.disabled = (currentPage === 1);
    if (btnNext) btnNext.disabled = (currentPage === totalPages);

    const start = (currentPage - 1) * itemsPerPage;
    const paginatedItems = currentGroups.slice(start, start + itemsPerPage);

    renderGroups(paginatedItems);
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
        }

// --- 11. Rendering ---
function getPlatformIcon(platform) {
    const icons = { facebook: 'fa-facebook', whatsapp: 'fa-whatsapp', reddit: 'fa-reddit', discord: 'fa-discord', telegram: 'fa-telegram', instagram: 'fa-instagram' };
    return icons[platform] || 'fa-link';
}

function getPlatformClass(platform) {
    const classes = { facebook: 'fb', whatsapp: 'wa', reddit: 'rd', discord: 'dc', telegram: 'tg', instagram: 'ig' };
    return classes[platform] || '';
}

function renderGroups(groups) {
    groupGrid.innerHTML = '';
    
    if(groups.length === 0) {
        groupGrid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding: 40px; color: #ccc;">No communities found. Try adjusting your filters.</div>';
        return;
    }

    const fragment = document.createDocumentFragment();
    let counter = 0;

    groups.forEach((group) => {
        const term = getTerminology(group.platform, group.type);
        const card = document.createElement('div');
        
        const isAgency = group.is_premium; 
        const agencyClass = isAgency ? 'agency-card' : '';
        const agencyBadge = isAgency ? '<div class="agency-badge"><i class="fa-solid fa-rocket"></i> Featured</div>' : '';
        
        card.className = `group-card ${getPlatformClass(group.platform)} ${agencyClass} reveal-on-scroll`;
        
        // RESTORED USERNAME TO THE FOOTER
        card.innerHTML = `
            ${agencyBadge}
            <div class="card-bar"></div>
            <div class="card-header">
                <i class="fa-brands ${getPlatformIcon(group.platform)} platform-icon"></i>
                <div class="group-name">${group.name}</div>
            </div>
            <div class="card-meta">
                <span><i class="fa-solid fa-layer-group"></i> ${group.category}</span>
                <span><i class="fa-solid fa-location-dot"></i> ${group.city}</span>
            </div>
            <div class="card-desc">${group.description}</div>
            <div class="card-footer">
                <button class="join-btn" onclick="showPreview('${group.id}')">Join ${term}</button>
                <div class="poster-info">
                    <div style="font-size: 0.8rem; margin-bottom: 3px; font-weight: 600;"><i class="fa-solid fa-user"></i> ${group.poster}</div>
                    <div style="font-size: 0.7rem; color: var(--text-muted);"><i class="fa-solid fa-calendar-days"></i> Listed: ${formatDate(group.created_at)}</div>
                </div>
            </div>`;
        fragment.appendChild(card);

        // AdSense Injector
        counter++;
        if(counter % 4 === 0) {
            const adCard = document.createElement('div');
            adCard.className = 'ad-card reveal-on-scroll';
            adCard.innerHTML = `
                <span class="ad-label" style="position: absolute; top: 10px; left: 10px; font-size: 0.8rem; color: #ccc;">Advertisement</span>
                <ins class="adsbygoogle"
                     style="display:block; width: 100%; height: 100%;"
                     data-ad-client="ca-pub-XXXXXXXXXXXXXXXX" 
                     data-ad-slot="YYYYYYYYYY"
                     data-ad-format="auto"
                     data-full-width-responsive="true"></ins>
            `;
            fragment.appendChild(adCard);
        }
    });

    groupGrid.appendChild(fragment);
    document.querySelectorAll('.reveal-on-scroll').forEach(el => cardObserver.observe(el));

    const adElements = document.querySelectorAll('.adsbygoogle:empty');
    adElements.forEach(() => {
        try {
            (adsbygoogle = window.adsbygoogle || []).push({});
        } catch (e) {
            console.error("AdSense error:", e);
        }
    });
}

// --- 12. UI Utilities & Preview Modal ---
function toggleSearch() {
    if(searchContainer.classList.contains('hidden')) {
        searchContainer.classList.remove('hidden');
        filterContainer.classList.add('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => searchInput.focus(), 400); 
    } else { searchContainer.classList.add('hidden'); }
}

function toggleFilters() {
    if(filterContainer.classList.contains('hidden')) {
        filterContainer.classList.remove('hidden');
        searchContainer.classList.add('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } else { filterContainer.classList.add('hidden'); }
}

function toggleMenu() { sideMenu.classList.toggle('active'); }

function getPlatformColor(platform) {
    const colors = { facebook: '#1877F2', whatsapp: '#25D366', reddit: '#FF4500', discord: '#5865F2', telegram: '#0088cc', instagram: '#E1306C' };
    return colors[platform] || '#e94560';
}

function showPreview(id) {
    const group = allGroups.find(g => String(g.id) === String(id));
    if (!group) return;

    const term = getTerminology(group.platform, group.type);

    document.getElementById('pName').textContent = group.name;
    const badge = document.getElementById('pPlatform');
    badge.textContent = group.platform.toUpperCase();
    badge.style.backgroundColor = getPlatformColor(group.platform) + '33';
    
    document.getElementById('pIcon').innerHTML = `<i class="fa-brands ${getPlatformIcon(group.platform)}" style="font-size:3rem;color:${getPlatformColor(group.platform)}"></i>`;
    document.getElementById('pDesc').textContent = group.description;
    
    const modalJoinBtn = document.querySelector('.preview-actions .join-btn.full-width');
    if (modalJoinBtn) {
        modalJoinBtn.textContent = `Agree & Join ${term}`;
        modalJoinBtn.onclick = () => {
            window.open(group.link, '_blank');
            closePreview();
        };
    }

    document.getElementById('previewOverlay').classList.remove('hidden');
}

function closePreview() {
    document.getElementById('previewOverlay').classList.add('hidden');
}

// Start App
init();
