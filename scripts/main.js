// --- 1. Data Simulation ---
const categories = [
    "Art & Design", "Automotive", "Business", "Career", "Crypto", "Dating", 
    "Education", "Entertainment", "Fashion", "Fitness", "Food", "Gaming", 
    "Health", "Hobbies", "Investments", "Jobs", "Lifestyle", "Memes", "Music", 
    "News", "Pets", "Politics", "Real Estate", "Science", "Shopping", "Sports", 
    "Technology", "Travel", "Writing"
];

const locations = {
    "USA": ["New York", "Los Angeles", "Chicago", "Houston", "San Francisco"],
    "India": ["Mumbai", "Delhi", "Bangalore", "Hyderabad"],
    "Nigeria": ["Lagos", "Abuja", "Kano", "Ibadan"],
    "UK": ["London", "Manchester", "Birmingham"],
    "Brazil": ["Sao Paulo", "Rio de Janeiro", "Brasilia"],
    "Kenya": ["Nairobi", "Mombasa", "Kisumu"]
};

// Helper to determine the accurate community type
function getGroupType(platform) {
    if (platform === 'discord') return 'Server';
    if (platform === 'reddit') return 'Community';
    if (platform === 'instagram') return 'Channel';
    // Telegram, WhatsApp, and Facebook can be either
    return Math.random() > 0.5 ? 'Group' : 'Channel'; 
}

// Generate Mock Data for 60 Communities
let allGroups = [];
const platforms = ["facebook", "whatsapp", "reddit", "discord", "telegram", "instagram"];

for(let i=1; i<=60; i++) {
    const randomCountry = Object.keys(locations)[Math.floor(Math.random() * Object.keys(locations).length)];
    const randomCity = locations[randomCountry][Math.floor(Math.random() * locations[randomCountry].length)];
    const randomPlatform = platforms[Math.floor(Math.random()*platforms.length)];
    
    allGroups.push({
        id: i,
        name: `Group ${categories[Math.floor(Math.random()*categories.length)]} ${i}`,
        platform: randomPlatform,
        type: getGroupType(randomPlatform), // Used for the Smart Toggle
        category: categories[Math.floor(Math.random()*categories.length)],
        country: randomCountry,
        city: randomCity,
        description: "Join our active community to discuss daily topics, share tips, and connect with like-minded people!",
        poster: `user_${i}`,
        time: `${Math.floor(Math.random() * 24) + 1} hrs ago`
    });
}

allGroups.sort((a, b) => a.name.localeCompare(b.name));

// --- 2. State Management ---
let currentGroups = [...allGroups]; 
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

// Smart UI Elements
const typeFilterGroup = document.getElementById('typeFilterGroup');
const typeBtns = document.querySelectorAll('.type-btn');

const btnFirst = document.querySelector('.glass-footer .nav-btn:first-child');
const btnPrev = document.querySelector('.glass-footer .nav-btn:nth-child(2)');
const btnNext = document.querySelector('.glass-footer .nav-btn:last-child');
const pageInfo = document.querySelector('.page-info');

// --- 4. Initialization ---
function init() {
    populateDropdowns();
    setupEventListeners();
    updatePagination();
}

// --- 5. Helpers ---
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

// Dynamic terminology for the buttons
function getTerminology(platform) {
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

// --- 6. Event Listeners ---
function setupEventListeners() {
    // Search Filter
    searchInput.addEventListener('input', debounce((e) => {
        const query = e.target.value.toLowerCase();
        currentGroups = allGroups.filter(group => 
            group.name.toLowerCase().includes(query) || 
            group.description.toLowerCase().includes(query)
        );
        currentPage = 1; 
        updatePagination();
    }, 300));

    // Pagination
    btnFirst.addEventListener('click', () => { currentPage = 1; updatePagination(); });
    btnPrev.addEventListener('click', () => { if (currentPage > 1) { currentPage--; updatePagination(); }});
    btnNext.addEventListener('click', () => {
        const maxPage = Math.ceil(currentGroups.length / itemsPerPage);
        if (currentPage < maxPage) { currentPage++; updatePagination(); }
    });

    // Social Media Icons
    platformIcons.forEach(icon => {
        icon.addEventListener('click', function() { 
            this.classList.toggle('active'); 
            updateSmartUI();
            runLiveFilter();
        });
    });

    // Smart Type Toggle Buttons
    if (typeBtns) {
        typeBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                typeBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                runLiveFilter();
            });
        });
    }

    // Dropdowns
    categorySelect.addEventListener('change', runLiveFilter);
    countrySelect.addEventListener('change', runLiveFilter);
    citySelect.addEventListener('change', runLiveFilter);

    // Modal Click-Outside Logic
    document.addEventListener('click', (e) => {
        const overlay = document.getElementById('previewOverlay');
        if (overlay && e.target === overlay) closePreview();
    });
}

// --- 7. Core Logic & Filtering ---
function populateDropdowns() {
    categories.forEach(cat => {
        let option = document.createElement('option');
        option.value = cat; option.innerText = cat;
        categorySelect.appendChild(option);
    });

    Object.keys(locations).forEach(country => {
        let option = document.createElement('option');
        option.value = country; option.innerText = country;
        countrySelect.appendChild(option);
    });

    countrySelect.addEventListener('change', function() {
        citySelect.innerHTML = '<option value="">Select City</option>';
        if(locations[this.value]) {
            locations[this.value].forEach(city => {
                let option = document.createElement('option');
                option.value = city; option.innerText = city;
                citySelect.appendChild(option);
            });
        }
    });
}

// Controls when the "Group vs Channel" toggle appears
function updateSmartUI() {
    if (!typeFilterGroup) return;

    const activePlatforms = Array.from(platformIcons)
        .filter(icon => icon.classList.contains('active'))
        .map(icon => icon.getAttribute('data-platform'));
    
    const singleTypePlatforms = ['discord', 'reddit', 'instagram']; 

    // Hide if the user selected ONLY single-type platforms
    const shouldHide = activePlatforms.length > 0 && activePlatforms.every(p => singleTypePlatforms.includes(p));

    if (shouldHide) {
        typeFilterGroup.classList.add('hidden');
        typeBtns.forEach(b => b.classList.remove('active'));
        document.querySelector('.type-btn[data-type=""]').classList.add('active');
    } else {
        typeFilterGroup.classList.remove('hidden');
    }
}

// Re-evaluates all filters instantly
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
    pageInfo.innerText = currentPage;

    const start = (currentPage - 1) * itemsPerPage;
    const paginatedItems = currentGroups.slice(start, start + itemsPerPage);

    renderGroups(paginatedItems);
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
}

// --- 8. Rendering ---
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
        const term = getTerminology(group.platform);
        const card = document.createElement('div');
        card.className = `group-card ${getPlatformClass(group.platform)} reveal-on-scroll`;
        card.innerHTML = `
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
                <button class="join-btn" onclick="showPreview(${group.id})">Join ${term}</button>
                <div class="poster-info">
                    <div><i class="fa-solid fa-user"></i> ${group.poster}</div>
                </div>
            </div>`;
        fragment.appendChild(card);

        // Inject Google AdSense block every 4 items
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

    // Tell Google AdSense to fill the empty ad slots we just rendered
    const adElements = document.querySelectorAll('.adsbygoogle:empty');
    adElements.forEach(() => {
        try {
            (adsbygoogle = window.adsbygoogle || []).push({});
        } catch (e) {
            console.error("AdSense error:", e);
        }
    });
}

// --- 9. UI Utilities ---
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

// --- 10. Preview Modal Logic ---
function getPlatformColor(platform) {
    const colors = { facebook: '#1877F2', whatsapp: '#25D366', reddit: '#FF4500', discord: '#5865F2', telegram: '#0088cc', instagram: '#E1306C' };
    return colors[platform] || '#e94560';
}

function showPreview(id) {
    const group = allGroups.find(g => g.id === id);
    if (!group) return;

    const term = getTerminology(group.platform);

    document.getElementById('pName').textContent = group.name;
    const badge = document.getElementById('pPlatform');
    badge.textContent = group.platform.toUpperCase();
    badge.style.backgroundColor = getPlatformColor(group.platform) + '33';
    
    document.getElementById('pIcon').innerHTML = `<i class="fa-brands ${getPlatformIcon(group.platform)}" style="font-size:3rem;color:${getPlatformColor(group.platform)}"></i>`;
    document.getElementById('pDesc').textContent = group.description;
    
    // Dynamically update the join button inside the modal
    const modalJoinBtn = document.querySelector('.preview-actions .join-btn.full-width');
    if (modalJoinBtn) {
        modalJoinBtn.textContent = `Agree & Join ${term}`;
        modalJoinBtn.onclick = () => alert(`Redirecting you to the ${group.platform} ${term.toLowerCase()}...`);
    }

    document.getElementById('previewOverlay').classList.remove('hidden');
}

function closePreview() {
    document.getElementById('previewOverlay').classList.add('hidden');
}

init();
