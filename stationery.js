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
    coming: document.getElementById('view-coming') // coming soon
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

        // Remove 'active' from all views
        Object.values(views).forEach(view => {
            if (view) view.classList.remove('active');
        });

        // Add 'active' to the target view
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

// Shop cards
function createIcon(type = 'thd') {
    // New 'thd' icon (Threads) — black color, uses provided SVG path
    if (type === 'thd') {
        const ns = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(ns, 'svg');
        svg.setAttribute('xmlns', ns);
        svg.setAttribute('width', '16');
        svg.setAttribute('height', '16');
        svg.setAttribute('viewBox', '0 0 16 16');
        svg.setAttribute('fill', '#000');
        svg.setAttribute('class', 'bi bi-threads');
        const path = document.createElementNS(ns, 'path');
        path.setAttribute('d', 'M6.321 6.016c-.27-.18-1.166-.802-1.166-.802.756-1.081 1.753-1.502 3.132-1.502.975 0 1.803.327 2.394.948s.928 1.509 1.005 2.644q.492.207.905.484c1.109.745 1.719 1.86 1.719 3.137 0 2.716-2.226 5.075-6.256 5.075C4.594 16 1 13.987 1 7.994 1 2.034 4.482 0 8.044 0 9.69 0 13.55.243 15 5.036l-1.36.353C12.516 1.974 10.163 1.43 8.006 1.43c-3.565 0-5.582 2.171-5.582 6.79 0 4.143 2.254 6.343 5.63 6.343 2.777 0 4.847-1.443 4.847-3.556 0-1.438-1.208-2.127-1.27-2.127-.236 1.234-.868 3.31-3.644 3.31-1.618 0-3.013-1.118-3.013-2.582 0-2.09 1.984-2.847 3.55-2.847.586 0 1.294.04 1.663.114 0-.637-.54-1.728-1.9-1.728-1.25 0-1.566.405-1.967.868ZM8.716 8.19c-2.04 0-2.304.87-2.304 1.416 0 .878 1.043 1.168 1.6 1.168 1.02 0 2.067-.282 2.232-2.423a6.2 6.2 0 0 0-1.528-.161');
        svg.appendChild(path);
        return svg;
    }

    // Preserve existing icons for 'ig' and 'web' (keeps previous styling)
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '18'); svg.setAttribute('height', '18'); svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none'); svg.setAttribute('stroke', type === 'ig' ? '#e4405f' : '#1e88e5');
    svg.setAttribute('stroke-width', '2'); svg.setAttribute('stroke-linecap', 'round'); svg.setAttribute('stroke-linejoin', 'round');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', type === 'ig'
        ? 'M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm5 4a6 6 0 1 0 0 12 6 6 0 0 0 0-12zm6.5-.75a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5z'
        : 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 0s-4 3-4 10 4 10 4 10 4-3 4-10-4-10-4-10zm-9 10h18');
    svg.appendChild(path);
    return svg;
}
function safeText(t) { return (t ?? '').toString(); }


let rawShops = [];       // original json
let currentShops = [];   // use filter + sort

// filter + sort 
const sortNameEl = document.getElementById('sort-name');        // asc | desc
const filterRegionEl = document.getElementById('filter-region'); // "All" or filtered region
const districtWrap = document.getElementById('district-wrap');
const filterDistrictEl = document.getElementById('filter-district'); // "All" or filtered district
const filterCategoryEl = document.getElementById('filter-category'); // "All" or filtered category

// Render List
const cardsEl = document.getElementById('cards');
function renderCards(shops) {
    cardsEl.innerHTML = '';
    shops.forEach((s, idx) => {
        const card = document.createElement('div'); card.className = 'card'; card.dataset.index = idx;

        const logo = document.createElement('div'); logo.className = 'logo-wrap';
        if (s.Logo) { const img = document.createElement('img'); img.src = s.Logo; img.alt = `${safeText(s['Name'])} 的標誌`; logo.appendChild(img); }
        else { logo.textContent = '📚'; logo.setAttribute('aria-label', '無標誌'); }

        const body = document.createElement('div');
        const h3 = document.createElement('h3'); h3.textContent = safeText(s['Name']);
        const en = document.createElement('div'); en.className = 'en-name'; en.textContent = safeText(s['Name(English)']);
        const addr = document.createElement('div'); addr.className = 'address'; addr.textContent = safeText(s['Address']);

        const regionLine = document.createElement('span'); regionLine.className = 'en-name'; regionLine.textContent = safeText(s['District']);
        const cat = document.createElement('span'); cat.className = 'category'; cat.textContent = safeText(s['Category']);

        const links = document.createElement('div'); links.className = 'links';
        if (s['Website']) { const aWeb = document.createElement('a'); aWeb.href = s['Website']; aWeb.target = '_blank'; aWeb.rel = 'noopener noreferrer'; aWeb.title = 'Website'; aWeb.appendChild(creat[...]
            links.appendChild(aWeb); }
        if (s['IG']) { const aIg = document.createElement('a'); aIg.href = s['IG']; aIg.target = '_blank'; aIg.rel = 'noopener noreferrer'; aIg.title = 'Instagram'; aIg.appendChild(createIcon('ig'));
            links.appendChild(aIg); }

        body.appendChild(h3); body.appendChild(en); body.appendChild(addr); body.appendChild(cat); body.appendChild(links);

        if (s['Remark']) { const note = document.createElement('div'); note.className = 'notice'; note.textContent = safeText(s['Remark']); body.appendChild(note); }

        card.appendChild(logo); card.appendChild(body);

        // Click card to open My Maps
        card.addEventListener('click', (e) => {
            if (e.target.closest('.links a')) {
                return;
            }

            if (s['MapSite']) { window.open(s['MapSite'], '_blank'); }

        });

        cardsEl.appendChild(card);
    });
}

// read json
async function loadShops() {
    const url = 'https://docs.google.com/spreadsheets/d/1q1OCwmfDULPzFwB-X6hobEqiz7QTJkyO/gviz/tq?tqx=out:json';

    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();
        
        let jsonText = text
            .trim()
            .replace(/^\/\*O_o\*\/\s*/g, '')
            .replace(/^google\.visualization\.Query\.setResponse\(/, '')
            .replace(/\);?$/, '');

        const data = JSON.parse(jsonText);
        const rows = data.table?.rows || [];

        // Map Google Sheet columns to keys (Name, English Name, District, Address, Category, Website, IG, Logo, Remark, MapSite)
        rawShops = rows.map(row => ({
            "Name": row.c[2]?.v || "",
            "Name(English)": row.c[3]?.v || "",
            "Logo": row.c[4]?.v || "",
            "Address": row.c[5]?.v || "",
            "District": row.c[6]?.v || "",
            "Website": row.c[7]?.v || "",
            "IG": row.c[8]?.v || "",
            "Category": row.c[9]?.v || "",
            "Remark": row.c[10]?.v || "",
            "MapSite": row.c[12]?.v || ""
        }));

        console.log('Raw shops data:', rawShops); // Check here — should show ALL rows from the sheet
        // Skip header if first row is "Name"
        if (rawShops.length > 0 && rawShops[0].Name === "Name") {
            rawShops.shift();
        }

        // district selection
        const regionsSet = new Set();
        const regionDistrictsMap = {};

        rawShops.forEach(s => {
            const rawDist = (s.District || '').trim();
            if (!rawDist) return;

            // Split by comma or full-width comma
            const parts = rawDist.split(/[,，]\s*/);
            const r = parts[0];
            const d = parts.length > 1 ? parts[1] : '';

            regionsSet.add(r);
            if (!regionDistrictsMap[r]) {
                regionDistrictsMap[r] = new Set();
            }
            if (d) {
                regionDistrictsMap[r].add(d);
            }
        });

        const regions = Array.from(regionsSet).sort((a, b) => a.localeCompare(b, 'zh-Hant', { sensitivity: 'base', numeric: true }));

        // grab regions
        regions.forEach(r => {
            const opt = document.createElement('option');
            opt.value = r;
            opt.textContent = r;
            filterRegionEl.appendChild(opt);
        });
        
        // initial populate all districts
        const allDists = Array.from(new Set(Object.values(regionDistrictsMap).flatMap(set => Array.from(set)))).sort((a, b) => a.localeCompare(b, 'zh-Hant', { sensitivity: 'base', numeric: true }));
        allDists.forEach(d => {
            if (d) {
                const opt = document.createElement('option');
                opt.value = d;
                opt.textContent = d;
                filterDistrictEl.appendChild(opt);
            }
        });

        // populate category dropdown
        const categoriesSet = new Set();
        rawShops.forEach(s => {
            const cat = (s.Category || '').trim();
            if (cat) categoriesSet.add(cat);
        });
        const categories = Array.from(categoriesSet).sort((a, b) => a.localeCompare(b, 'zh-Hant', { sensitivity: 'base' }));
        categories.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c;
            opt.textContent = c;
            filterCategoryEl.appendChild(opt);
        });
        filterCategoryEl.addEventListener('change', applyAndRender);

        // on region change -> update district dropdown
        filterRegionEl.addEventListener('change', () => {
            const r = filterRegionEl.value;
            filterDistrictEl.innerHTML = '<option value="">全部地區</option>';
            if (!r) {
                // if no region is selected, show all districts again
                allDists.forEach(d => {
                    if (d) {
                        const opt = document.createElement('option');
                        opt.value = d;
                        opt.textContent = d;
                        filterDistrictEl.appendChild(opt);
                    }
                });
            } else {
                const dists = Array.from(regionDistrictsMap[r] || []).sort((a, b) => a.localeCompare(b, 'zh-Hant', { sensitivity: 'base', numeric: true }));
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
        const warn = document.createElement('div');
        warn.style.cssText = 'padding:12px 20px; color:#8a5300; background:#fff7e6; border:1px solid #ffe7ba; border-radius:8px; margin:12px 20px;';
        warn.textContent = 'Fail to load data';
        document.body.insertBefore(warn, document.querySelector('footer'));
    }
}

// filter, sort, render
function applyAndRender() {
    const sortDir = sortNameEl.value;        // 'asc' or 'desc'
    const region = filterRegionEl.value;
    const district = filterDistrictEl.value;
    const category = filterCategoryEl.value;

    // 1) Filter by Region/District/Category
    const filtered = rawShops.filter(s => {
        const rawDist = (s.District || '').trim();
        
        const parts = rawDist.split(/[,，]\s*/);
        const r = parts[0];
        const d = parts.length > 1 ? parts[1] : '';

        if (region && r !== region) return false;
        if (district && d !== district) return false;
        if (category && (s.Category || '').trim() !== category) return false;
        
        return true;
    });

    // 2) Sort by Name
    const sorted = filtered.sort((A, B) => {
        const a = A['Name(English)'] ?? '';
        const b = B['Name(English)'] ?? '';
        const base = a.localeCompare(b, 'zh-Hant', { sensitivity: 'base', numeric: true });
        return sortDir === 'asc' ? base : -base;
    });

    currentShops = sorted;
    renderCards(currentShops);
}

//render events
function renderEvents(events) {
    const viewEventCards = document.getElementById("event-cards");
    viewEventCards.innerHTML = '';

    // helper: robust date parsing for a few common formats
    function parseDateString(s) {
        if (!s) return null;

        // Normalize full-width chars and trim
        s = s.toString().replace(/[／\\。]/g, '/').replace(/\u3000/g, ' ').trim();

        // Collect date-like tokens (yyyy-mm-dd / yyyy/mm/dd / dd/mm/yyyy / mm/dd/yyyy)
        const tokens = [];
        let m;
        const reYMD = /(\d{4}[^\d]\d{1,2}[^\d]\d{1,2})/g;          // 2026-07-12 or 2026/7/12
        const reDMY = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/g;       // 21/07/2026 or 07-21-2026

        while ((m = reYMD.exec(s)) !== null) tokens.push(m[0]);
        while ((m = reDMY.exec(s)) !== null) tokens.push(m[0]);

        // If we found tokens, take the last one as the intended date (end date)
        let token = tokens.length ? tokens[tokens.length - 1] : s;

        // Strip surrounding non-date noise (keep digits, slash, dash, spaces)
        token = token.replace(/[^\d\/\-\s]/g, '').trim();

        // Try native parsing first
        let d = new Date(token);
        if (!isNaN(d.getTime())) return d;

        // Try YYYY MM DD capture
        m = token.match(/(\d{4})[^\d]?(\d{1,2})[^\d]?(\d{1,2})/);
        if (m) {
            const yyyy = m[1];
            const mm = m[2].padStart(2, '0');
            const dd = m[3].padStart(2, '0');
            d = new Date(`${yyyy}-${mm}-${dd}`);
            if (!isNaN(d.getTime())) return d;
        }

        // Try dd/mm/yyyy or mm/dd/yyyy
        m = token.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
        if (m) {
            let part1 = parseInt(m[1], 10);
            let part2 = parseInt(m[2], 10);
            let part3 = parseInt(m[3], 10);
            if (part3 < 100) part3 += 2000; // two-digit year -> 20xx
            // Heuristic: if part1 > 12 => day/month/year, else month/day/year
            if (part1 > 12) {
                d = new Date(part3, part2 - 1, part1);
            } else {
                d = new Date(part3, part1 - 1, part2);
            }
            if (!isNaN(d.getTime())) return d;
        }

        return null;
    }

    function toMidnight(d) {
        if (!d) return null;
        const x = new Date(d);
        x.setHours(0,0,0,0);
        return x;
    }

    // Only include events whose end date is today or later
    const today = new Date();
    today.setHours(0,0,0,0);

    // Build debug info and filter correctly
    const visibleEvents = events.filter(ev => {
        // Prefer the sheet column name date_end, then fall back to other fields
        const raw = ev.date_end ?? ev.dateEnd ?? ev.dateEndFormatted ?? ev.dateEndRaw ?? ev.dateEndString ?? ev.dateStart ?? ev.dateStart ?? '';
        const parsed = parseDateString(raw);
        const endDate = toMidnight(parsed);

        // Debug log to help diagnose mismatches (will appear in console)
        console.debug('Event parse', { name: ev.name, rawDate: raw, parsed: parsed ? parsed.toISOString().slice(0,10) : null, include: !!(endDate && endDate >= today) });

        if (!endDate) return false; // skip unparseable
        // include events that end today or later; exclude strictly past
        return endDate >= today;
    });

    // Render only visibleEvents
    visibleEvents.forEach((event, idx) => {
        const card = document.createElement('div');
        card.className = 'card';
        card.dataset.index = idx;

        // Logo / Icon placeholder (since events don't have logos, use calendar emoji)
        const logoWrap = document.createElement('div');
        logoWrap.className = 'logo-wrap';
        logoWrap.textContent = '📅'; // Calendar icon
        logoWrap.setAttribute('aria-label', '活動');

        // Card body
        const body = document.createElement('div');
        body.className = 'card-body';

        // Event Name 
        const title = document.createElement('h3');
        title.className = 'event-title';
        title.textContent = safeText(event.name || '未命名活動');

        // Date range
        const dateLine = document.createElement('div');
        dateLine.className = 'date-line';
        dateLine.innerHTML = `\n    ${safeText(event.dateStart)}\n    ${event.dateEnd && event.dateEnd !== event.dateStart ? ` – ${safeText(event.dateEnd)}` : ''}\n    <span class="weekday">${safeText(event.weekDay)}</span>\n    `;

        // Venue
        const venue = document.createElement('div');
        venue.className = 'address';
        venue.textContent = safeText(event.venue || '');

        // Address (if available)
        const address = document.createElement('div'); address.className = 'address'; address.textContent = safeText(event.address);

        // Host / Organizer
        const host = document.createElement('div');
        host.className = 'address'; host.innerHTML = `主辦：${safeText(event.host)}`;

        // Assemble body
        body.appendChild(title); body.appendChild(dateLine); body.appendChild(venue);
        body.appendChild(address); body.appendChild(host);

        // Remark (e.g., entry fee)
        if (event.remark) {
            const remark = document.createElement('div');
            remark.className = 'notice';
            remark.textContent = safeText(event.remark);
            body.appendChild(remark);
        }

        // Links section
        const links = document.createElement('div');
        links.className = 'links';

        if (event.site) {
            const aSite = document.createElement('a');
            aSite.href = event.site;
            aSite.target = '_blank';
            aSite.rel = 'noopener noreferrer';
            aSite.title = '官方網站';
            aSite.appendChild(createIcon('web'));
            links.appendChild(aSite);
        }

        if (links.children.length > 0) {
            body.appendChild(links);
        }

        // Assemble card
        card.appendChild(logoWrap); card.appendChild(body);

        // Click handling: open map link, unless clicking a link inside
        card.addEventListener('click', (e) => {
            if (e.target.closest('.links a')) return; // let link handle itself

            if (event.mapSite) {
                window.open(event.mapSite, '_blank');
            }
        });

        // Add cursor pointer for better UX
        card.style.cursor = event.mapSite ? 'pointer' : 'default';

        viewEventCards.appendChild(card);
    });

    // If no events to show, optionally show a note
    if (visibleEvents.length === 0) {
        viewEventCards.innerHTML = '<p style="color:#666; padding: 12px 16px;">目前沒有符合條件的活動。</p>';
    }

    viewEventCards.classList.add("active");
}

// read sheet to json
async function loadEvents() {
    const url = 'https://docs.google.com/spreadsheets/d/1Nch0RpHdftPL4GGANMvLUaL9uFKjzBIoKInhef3wXDk/gviz/tq?tqx=out:json&sheet=event&gid=0';

    fetch(url)
        .then(res => {
            if (!res.ok) throw new Error('Network error');
            return res.text();
        })
        .then(text => {
            try {
                // Safely strip common wrappers
                let jsonText = text
                    .trim()
                    .replace(/^\/\*O_o\*\//\s*/g, '')  // remove optional /*O_o*/
                    .replace(/^google\.visualization\.Query\.setResponse\(/, '')
                    .replace(/\);?$/, '');

                return JSON.parse(jsonText);
            } catch (e) {
                console.error('Parse failed on:', text.substring(0, 200) + '...');
                throw e;
            }
        })
        .then(data => {
            const rows = data.table?.rows || [];
            // Skip header row (first row) if exists
            const dataRows = rows;

            const parsed = dataRows.map(row => ({
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

            console.log('Parsed events:', parsed); // Check here — should show ALL events
            console.log('Total rows from sheet (incl header):', data.table.rows.length);
            console.log('Data rows after slice:', rows.length);
            console.log('Parsed events:', parsed);
            renderEvents(parsed);
        })
        .catch(err => {
            console.error('Load events error:', err);
            const viewEventCards = document.getElementById("event-cards");
            if (viewEventCards) viewEventCards.innerHTML = "<p style='color:red;'>載入失敗，請刷新重試</p>";
        });
}

async function loadfooter() {
    /* const footer = document.getElementById("standardFooter");
    const aIg = document.createElement('a');
    aIg.href = "https://www.instagram.com/s.archer.c/";
    aIg.target = '_blank';
    aIg.rel = 'noopener noreferrer';
    aIg.title = '官方網站';
    aIg.appendChild(createIcon('ig'));


    footer.appendChild(aIg); */
}

// event listener
sortNameEl.addEventListener('change', applyAndRender);
filterRegionEl.addEventListener('change', applyAndRender);
filterDistrictEl.addEventListener('change', applyAndRender);

// load
loadShops();
loadEvents();
loadfooter();
