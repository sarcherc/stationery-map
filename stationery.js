let currentLang = localStorage.getItem('stationery_map_lang') || 'zh';

function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('stationery_map_lang', lang);
    document.documentElement.lang = lang === 'en' ? 'en' : 'zh-Hant';

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[currentLang][key]) {
            el.innerHTML = translations[currentLang][key];
        }
    });

    const toggleBtn = document.getElementById('lang-toggle-btn');
    if (toggleBtn) {
        toggleBtn.textContent = currentLang === 'zh' ? 'EN / 繁中' : '繁中 / EN';
    }

    if (typeof updateDropdowns === 'function') updateDropdowns();
    if (typeof applyAndRender === 'function') applyAndRender();
    if (typeof loadEvents === 'function' && window.rawEvents) renderEvents(window.rawEvents);
}

document.addEventListener('DOMContentLoaded', () => {
    const toggleBtn = document.getElementById('lang-toggle-btn');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            setLanguage(currentLang === 'zh' ? 'en' : 'zh');
        });
    }
    setLanguage(currentLang);

    // 手機版篩選面板收合/展開邏輯
    const filterToggleBtn = document.getElementById('filter-toggle-btn');
    const controlsPanel = document.getElementById('list-controls-panel');

    if (filterToggleBtn && controlsPanel) {
        filterToggleBtn.addEventListener('click', () => {
            controlsPanel.classList.toggle('expanded');
            const isExpanded = controlsPanel.classList.contains('expanded');
            const key = isExpanded ? 'filterToggleBtnClose' : 'filterToggleBtn';
            filterToggleBtn.textContent = translations[currentLang][key];
        });
    }
});

// tab change
function updateStickyOffsets() {
    const header = document.querySelector('header');
    const tabs = document.querySelector('.tabs');
    const headerH = header ? header.offsetHeight : 0;
    const tabsH = tabs ? tabs.offsetHeight : 0;
    document.documentElement.style.setProperty('--header-h', headerH + 'px');
    document.documentElement.style.setProperty('--controls-top', (headerH + tabsH) + 'px');
}
updateStickyOffsets();
window.addEventListener('resize', updateStickyOffsets);

const btns = document.querySelectorAll('.tab-btn');
const views = {
    map: document.getElementById('view-map'),
    list: document.getElementById('view-list'),
    event: document.getElementById('view-event'),
    add: document.getElementById('view-add'),
    coming: document.getElementById('view-coming')
};
btns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        const tab = btn.dataset.tab;
        if (tab === 'coming') {
            e.preventDefault();
            e.stopPropagation();
            return;
        }

        btns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        Object.values(views).forEach(view => {
            if (view) view.classList.remove('active');
        });

        views[tab].classList.add('active');
    });
});

const formBtns = document.querySelectorAll('.form-btn');
const viewFormShop = document.getElementById('view-form-shop');
const viewFormEvent = document.getElementById('view-form-event');

formBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        const tab = btn.dataset.form;

        formBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        if (tab === 'shop') {
            viewFormShop.classList.add('active');
            viewFormEvent.classList.remove('active');
        } else if (tab === 'event') {
            viewFormEvent.classList.add('active');
            viewFormShop.classList.remove('active');
        }
    });
});

// 保留卡片內的網頁/IG圖標生成函式
function createIcon(type = 'web', strokeColor = 'rgb(69, 28, 3)') {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '18'); svg.setAttribute('height', '18'); svg.setAttribute('viewBox', '0 0 24 24');
    svg.style.transition = 'stroke 0.2s ease, fill 0.2s ease';

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');

    if (type === 'ig') {
        svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', strokeColor);
        svg.setAttribute('stroke-width', '2'); svg.setAttribute('stroke-linecap', 'round'); svg.setAttribute('stroke-linejoin', 'round');
        path.setAttribute('d', 'M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm5 4a6 6 0 1 0 0 12 6 6 0 0 0 0-12zm6.5-.75a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5z');
    } else {
        svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', strokeColor);
        svg.setAttribute('stroke-width', '2');
        path.setAttribute('d', 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 0s-4 3-4 10 4 10 4 10 4-3 4-10-4-10-4-10zm-9 10h18');
    }

    svg.appendChild(path);
    return svg;
}

function safeText(t) { return (t ?? '').toString(); }

let rawShops = [];
let currentShops = [];
let globalRegionDistrictsMap = {};

const sortNameEl = document.getElementById('sort-name');
const filterRegionEl = document.getElementById('filter-region');
const districtWrap = document.getElementById('district-wrap');
const filterDistrictEl = document.getElementById('filter-district');
const filterCategoryEl = document.getElementById('filter-category');

function updateDropdowns() {
    const currentRegion = filterRegionEl.value;
    const currentDistrict = filterDistrictEl.value;
    const currentCat = filterCategoryEl.value;

    const allRegionText = currentLang === 'en' ? '▼ All Regions' : '▼ 全部區域';
    const allDistrictText = currentLang === 'en' ? '▼ All Districts' : '▼ 全部地區';
    const allCatText = currentLang === 'en' ? '▼ All Categories' : '▼ 全部類別';

    filterRegionEl.innerHTML = `<option value="">${allRegionText}</option>`;
    const regionsSet = new Set();
    globalRegionDistrictsMap = {};

    rawShops.forEach(s => {
        const rawDist = (currentLang === 'en' && s['District_en']) ? s['District_en'].trim() : (s['District'] || '').trim();
        if (!rawDist) return;

        const parts = rawDist.split(/[,，]\s*/);
        const r = parts[0];
        const d = parts.length > 1 ? parts[1] : '';

        regionsSet.add(r);
        if (!globalRegionDistrictsMap[r]) globalRegionDistrictsMap[r] = new Set();
        if (d) globalRegionDistrictsMap[r].add(d);
    });

    const regions = Array.from(regionsSet).sort((a, b) => a.localeCompare(b, currentLang === 'en' ? 'en' : 'zh-Hant', { sensitivity: 'base', numeric: true }));
    regions.forEach(r => {
        const opt = document.createElement('option');
        opt.value = r;
        opt.textContent = r;
        filterRegionEl.appendChild(opt);
    });
    filterRegionEl.value = currentRegion;

    filterDistrictEl.innerHTML = `<option value="">${allDistrictText}</option>`;
    const allDists = Array.from(new Set(Object.values(globalRegionDistrictsMap).flatMap(set => Array.from(set)))).sort((a, b) => a.localeCompare(b, currentLang === 'en' ? 'en' : 'zh-Hant', { sensitivity: 'base', numeric: true }));
    
    if (!currentRegion) {
        allDists.forEach(d => {
            if (d) {
                const opt = document.createElement('option');
                opt.value = d;
                opt.textContent = d;
                filterDistrictEl.appendChild(opt);
            }
        });
    } else {
        const dists = Array.from(globalRegionDistrictsMap[currentRegion] || []).sort((a, b) => a.localeCompare(b, currentLang === 'en' ? 'en' : 'zh-Hant', { sensitivity: 'base', numeric: true }));
        dists.forEach(d => {
            const opt = document.createElement('option');
            opt.value = d;
            opt.textContent = d;
            filterDistrictEl.appendChild(opt);
        });
    }
    filterDistrictEl.value = currentDistrict;

    filterCategoryEl.innerHTML = `<option value="">${allCatText}</option>`;
    const categoriesSet = new Set();
    rawShops.forEach(s => {
        const cat = (currentLang === 'en' && s['Category_en']) ? s['Category_en'].trim() : (s['Category'] || '').trim();
        if (cat) categoriesSet.add(cat);
    });
    const categories = Array.from(categoriesSet).sort((a, b) => a.localeCompare(b, currentLang === 'en' ? 'en' : 'zh-Hant', { sensitivity: 'base' }));
    categories.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c;
        opt.textContent = c;
        filterCategoryEl.appendChild(opt);
    });
    filterCategoryEl.value = currentCat;
}

const cardsEl = document.getElementById('cards');
function renderCards(shops) {
    cardsEl.innerHTML = '';
    shops.forEach((s, idx) => {
        const card = document.createElement('div'); card.className = 'card'; card.dataset.index = idx;

        const logo = document.createElement('div'); logo.className = 'logo-wrap';
        if (s.Logo) { const img = document.createElement('img'); img.src = s.Logo; img.alt = `${safeText(s['Name'])} logo`; logo.appendChild(img); }
        else { logo.textContent = '📚'; logo.setAttribute('aria-label', 'No logo'); }

        const body = document.createElement('div');
        const h3 = document.createElement('h3'); 
        h3.textContent = safeText((currentLang === 'en' && s['Name(English)']) ? s['Name(English)'] : s['Name']);
        
        const en = document.createElement('div'); en.className = 'en-name'; 
        en.textContent = currentLang === 'en' ? safeText(s['Name']) : safeText(s['Name(English)']);
        
        const activeAddress = (currentLang === 'en' && s['Address_en']) ? s['Address_en'] : s['Address'];
        const addr = document.createElement('div'); addr.className = 'address'; addr.textContent = safeText(activeAddress);
        
        const cat = document.createElement('span'); cat.className = 'category'; 
        cat.textContent = safeText((currentLang === 'en' && s['Category_en']) ? s['Category_en'] : s['Category']);

        const links = document.createElement('div'); links.className = 'links';
        if (s['Website']) { const aWeb = document.createElement('a'); aWeb.href = s['Website']; aWeb.target = '_blank'; aWeb.rel = 'noopener noreferrer'; aWeb.title = 'Website'; aWeb.appendChild(createIcon('web', '#1e88e5')); links.appendChild(aWeb); }
        if (s['IG']) { const aIg = document.createElement('a'); aIg.href = s['IG']; aIg.target = '_blank'; aIg.rel = 'noopener noreferrer'; aIg.title = 'Instagram'; aIg.appendChild(createIcon('ig', '#e4405f')); links.appendChild(aIg); }

        body.appendChild(h3); body.appendChild(en); body.appendChild(addr); body.appendChild(cat); body.appendChild(links);

        const activeRemark = (currentLang === 'en' && s['Remark_en']) ? s['Remark_en'] : s['Remark'];
        if (activeRemark) { 
            const note = document.createElement('div'); 
            note.className = 'notice'; 
            note.textContent = safeText(activeRemark); 
            body.appendChild(note); 
        }

        card.appendChild(logo); card.appendChild(body);

        card.addEventListener('click', (e) => {
            if (e.target.closest('.links a')) return;
            if (s['MapSite']) { window.open(s['MapSite'], '_blank'); }
        });

        cardsEl.appendChild(card);
    });
}

async function loadShops() {
    const url = 'https://docs.google.com/spreadsheets/d/1q1OCwmfDULPzFwB-X6hobEqiz7QTJkyO/gviz/tq?tqx=out:json';

    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();
        
        let jsonText = text
            .trim()
            .replace(/^\/\*O_o\*\/\s*/g, '')
            .replace(/^google\.visualization\.Query\.setResponse\(/, '') .replace(/\);?$/, '');

        const data = JSON.parse(jsonText);
        const rows = data.table?.rows || [];

        rawShops = rows.map(row => ({
            "Name": row.c[2]?.v || "",
            "Name(English)": row.c[3]?.v || "",
            "Logo": row.c[4]?.v || "",
            "Address": row.c[5]?.v || "",
            "Address_en": row.c[6]?.v || "",
            "District": row.c[7]?.v || "",
            "District_en": row.c[8]?.v || "",
            "Website": row.c[9]?.v || "",
            "IG": row.c[10]?.v || "",
            "Category": row.c[11]?.v || "",
            "Category_en": row.c[12]?.v || "",
            "Remark": row.c[13]?.v || "",
            "Remark_en": row.c[14]?.v || "",
            "MapSite": row.c[16]?.v || ""
        }));

        if (rawShops.length > 0 && rawShops[0].Name === "Name") {
            rawShops.shift();
        }

        updateDropdowns();

        filterCategoryEl.addEventListener('change', applyAndRender);

        filterRegionEl.addEventListener('change', () => {
            const r = filterRegionEl.value;
            const allText = currentLang === 'en' ? 'All Districts' : '全部地區';
            filterDistrictEl.innerHTML = `<option value="">${allText}</option>`;
            
            const allDists = Array.from(new Set(Object.values(globalRegionDistrictsMap).flatMap(set => Array.from(set)))).sort((a, b) => a.localeCompare(b, currentLang === 'en' ? 'en' : 'zh-Hant', { sensitivity: 'base', numeric: true }));

            if (!r) {
                allDists.forEach(d => {
                    if (d) {
                        const opt = document.createElement('option');
                        opt.value = d;
                        opt.textContent = d;
                        filterDistrictEl.appendChild(opt);
                    }
                });
            } else {
                const dists = Array.from(globalRegionDistrictsMap[r] || []).sort((a, b) => a.localeCompare(b, currentLang === 'en' ? 'en' : 'zh-Hant', { sensitivity: 'base', numeric: true }));
                dists.forEach(d => {
                    const opt = document.createElement('option');
                    opt.value = d;
                    opt.textContent = d;
                    filterDistrictEl.appendChild(opt);
                });
            }
            applyAndRender();
        });

        applyAndRender();
    } catch (err) {
        console.error('Fail to load Google Sheet data:', err);
    }
}

function applyAndRender() {
    const sortDir = sortNameEl.value;
    const region = filterRegionEl.value;
    const district = filterDistrictEl.value;
    const category = filterCategoryEl.value;

    const filtered = rawShops.filter(s => {
        const rawDist = (currentLang === 'en' && s['District_en']) ? s['District_en'].trim() : (s['District'] || '').trim();
        const parts = rawDist.split(/[,，]\s*/);
        const r = parts[0];
        const d = parts.length > 1 ? parts[1] : '';

        if (region && r !== region) return false;
        if (district && d !== district) return false;
        
        if (category) {
            const sCat = (currentLang === 'en' && s['Category_en']) ? s['Category_en'].trim() : (s['Category'] || '').trim();
            if (sCat !== category) return false;
        }
        
        return true;
    });

    const sorted = filtered.sort((A, B) => {
        const a = (A['Name(English)'] && A['Name(English)'].trim() !== '') ? A['Name(English)'] : (A['Name'] ?? '');
        const b = (B['Name(English)'] && B['Name(English)'].trim() !== '') ? B['Name(English)'] : (B['Name'] ?? '');
        const base = a.localeCompare(b, 'en', { sensitivity: 'base', numeric: true });
        return sortDir === 'asc' ? base : -base;
    });

    currentShops = sorted;
    renderCards(currentShops);
}

function renderEvents(events) {
    window.rawEvents = events;
    const viewEventCards = document.getElementById("event-cards");
    viewEventCards.innerHTML = '';

    function parseDateString(s) {
        if (!s) return null;
        s = s.toString().replace(/[／\\。]/g, '/').replace(/\u3000/g, ' ').trim();
        const tokens = [];
        let m;
        const reYMD = /(\d{4}[^\d]\d{1,2}[^\d]\d{1,2})/g;
        const reDMY = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/g;

        while ((m = reYMD.exec(s)) !== null) tokens.push(m[0]);
        while ((m = reDMY.exec(s)) !== null) tokens.push(m[0]);

        let token = tokens.length ? tokens[tokens.length - 1] : s;
        token = token.replace(/[^\d\/\-\s]/g, '').trim();

        let d = new Date(token);
        if (!isNaN(d.getTime())) return d;
        return null;
    }

    function toMidnight(d) {
        if (!d) return null;
        const x = new Date(d);
        x.setHours(0,0,0,0);
        return x;
    }

    const today = new Date();
    today.setHours(0,0,0,0);

    const visibleEvents = events.filter(ev => {
        const raw = ev.date_end ?? ev.dateEnd ?? '';
        const parsed = parseDateString(raw);
        const endDate = toMidnight(parsed);
        if (!endDate) return false;
        return endDate >= today;
    });

    visibleEvents.forEach((event, idx) => {
        const card = document.createElement('div');
        card.className = 'card';
        card.dataset.index = idx;

        const logoWrap = document.createElement('div');
        logoWrap.className = 'logo-wrap';
        logoWrap.textContent = '📅';

        const body = document.createElement('div');
        body.className = 'card-body';

        const title = document.createElement('h3');
        title.className = 'event-title';
        title.textContent = safeText(event.name || '未命名活動');

        const dateLine = document.createElement('div');
        dateLine.className = 'date-line';
        dateLine.innerHTML = `
            ${safeText(event.dateStart)}
            ${event.dateEnd && event.dateEnd !== event.dateStart ? ` – ${safeText(event.dateEnd)}` : ''}
            <span class="weekday">${safeText(event.weekDay)}</span>
        `;

        const venue = document.createElement('div');
        venue.className = 'address';
        venue.textContent = safeText(event.venue || '');

        const address = document.createElement('div'); 
        address.className = 'address'; 
        address.textContent = safeText(event.address);

        const host = document.createElement('div');
        host.className = 'address'; 
        host.innerHTML = `${currentLang === 'en' ? 'Organizer: ' : '主辦：'}${safeText(event.host)}`;

        body.appendChild(title); body.appendChild(dateLine); body.appendChild(venue);
        body.appendChild(address); body.appendChild(host);

        if (event.remark) {
            const remark = document.createElement('div');
            remark.className = 'notice';
            remark.textContent = safeText(event.remark);
            body.appendChild(remark);
        }

        const links = document.createElement('div');
        links.className = 'links';

        if (event.site) {
            const aSite = document.createElement('a');
            aSite.href = event.site;
            aSite.target = '_blank';
            aSite.rel = 'noopener noreferrer';
            aSite.title = 'Official Website';
            aSite.appendChild(createIcon('web', '#1e88e5'));
            links.appendChild(aSite);
        }

        if (links.children.length > 0) {
            body.appendChild(links);
        }

        card.appendChild(logoWrap); card.appendChild(body);

        card.addEventListener('click', (e) => {
            if (e.target.closest('.links a')) return;
            if (event.mapSite) {
                window.open(event.mapSite, '_blank');
            }
        });

        card.style.cursor = event.mapSite ? 'pointer' : 'default';
        viewEventCards.appendChild(card);
    });

    if (visibleEvents.length === 0) {
        viewEventCards.innerHTML = `<p style="color:white; padding: 12px 16px;">${translations[currentLang].noEvents}</p>`;
    }

    viewEventCards.classList.add("active");
}

async function loadEvents() {
    const url = 'https://docs.google.com/spreadsheets/d/1Nch0RpHdftPL4GGANMvLUaL9uFKjzBIoKInhef3wXDk/gviz/tq?tqx=out:json&sheet=event&gid=0';

    fetch(url)
        .then(res => {
            if (!res.ok) throw new Error('Network error');
            return res.text();
        })
        .then(text => {
            let jsonText = text
                .trim()
                .replace(/^\/\*O_o\*\/\s*/g, '')
                .replace(/^google\.visualization\.Query\.setResponse\(/, '') .replace(/\);?$/, '');

            return JSON.parse(jsonText);
        })
        .then(data => {
            const rows = data.table?.rows || [];
            const parsed = rows.map(row => ({
                name: row.c[0]?.v || "--",
                dateStart: row.c[1]?.f || row.c[1]?.v || "",
                dateEnd: row.c[2]?.f || row.c[2]?.v || "",
                date_end: row.c[2]?.f || row.c[2]?.v || "",
                weekDay: row.c[3]?.v || "",
                venue: row.c[4]?.v || "",
                address: row.c[5]?.v || "",
                mapSite: row.c[6]?.v || "",
                host: row.c[7]?.v || "",
                site: row.c[8]?.v || "",
                remark: row.c[9]?.v || "",
                type: row.c[10]?.v || ""
            }));

            renderEvents(parsed);
        })
        .catch(err => {
            console.error('Load events error:', err);
            const viewEventCards = document.getElementById("event-cards");
            if (viewEventCards) viewEventCards.innerHTML = `<p style='color:red;'>${translations[currentLang].loadFailed}</p>`;
        });
}

sortNameEl.addEventListener('change', applyAndRender);
filterRegionEl.addEventListener('change', applyAndRender);
filterDistrictEl.addEventListener('change', applyAndRender);

loadShops();
loadEvents();