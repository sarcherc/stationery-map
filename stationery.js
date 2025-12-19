// tab change
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
function createIcon(type = 'web') {
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
const filterDistrictEl = document.getElementById('filter-district'); // "All" or filtered district

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
        if (s['Website']) { const aWeb = document.createElement('a'); aWeb.href = s['Website']; aWeb.target = '_blank'; aWeb.rel = 'noopener noreferrer'; aWeb.title = 'Website'; aWeb.appendChild(createIcon('web')); links.appendChild(aWeb); }
        if (s['IG']) { const aIg = document.createElement('a'); aIg.href = s['IG']; aIg.target = '_blank'; aIg.rel = 'noopener noreferrer'; aIg.title = 'Instagram'; aIg.appendChild(createIcon('ig')); links.appendChild(aIg); }

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

    try {
        const res = await fetch('./stationeryJson.json', { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        rawShops = await res.json();

        // district selection
        const districts = Array.from(new Set(
            rawShops
                .map(s => s.District || '')
                .filter(Boolean)
        )).sort((a, b) => a.localeCompare(b, 'zh-Hant', { sensitivity: 'base', numeric: true }));

        // grab district
        districts.forEach(d => {
            const opt = document.createElement('option');
            opt.value = d;
            opt.textContent = d;
            filterDistrictEl.appendChild(opt);
        });

        applyAndRender();
    } catch (err) {

        console.error('Fail to load JSON:', err);
        // optional
        const warn = document.createElement('div');
        warn.style.cssText = 'padding:12px 20px; color:#8a5300; background:#fff7e6; border:1px solid #ffe7ba; border-radius:8px; margin:12px 20px;';
        warn.textContent = 'Fail to load data';
        document.body.insertBefore(warn, document.querySelector('footer'));
    }
}

// filter, sort, render
function applyAndRender() {
    const sortDir = sortNameEl.value;        // 'asc' or 'desc'
    const district = filterDistrictEl.value; // '' or district

    // 1) Filter by District
    const filtered = rawShops.filter(s => {
        if (!district) return true;            // All district
        return (s.District || '') === district;
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

    events.forEach((event, idx) => {
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
        dateLine.innerHTML = `
    ${safeText(event.dateStart)}
    ${event.dateEnd && event.dateEnd !== event.dateStart ? ` – ${safeText(event.dateEnd)}` : ''}
    <span class="weekday">${safeText(event.weekDay)}</span>
    `;

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
                    .replace(/^\/\*O_o\*\/\s*/g, '')  // remove optional /*O_o*/
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
    const footer = document.getElementById("standardFooter");
    const aIg = document.createElement('a');
    aIg.href = "https://www.instagram.com/s.archer.c/";
    aIg.target = '_blank';
    aIg.rel = 'noopener noreferrer';
    aIg.title = '官方網站';
    aIg.appendChild(createIcon('ig'));


    footer.appendChild(aIg);
}

// event listener
sortNameEl.addEventListener('change', applyAndRender);
filterDistrictEl.addEventListener('change', applyAndRender);

// load
loadShops();
loadEvents();
loadfooter();
