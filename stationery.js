let currentLang = localStorage.getItem('stationery_map_lang') || 'zh';

let myMap = null;
let markersLayer = null;

let allMarkers = [];

// 1. 全域只 Declare 一次圖片路徑 (統一管理，以後改圖/加類別淨係改呢度)
const GLOBAL_CATEGORY_PINS = {
	'文具選物店': './images/pin_1.png',
	'民生文具店': './images/pin_2.png',
	'風格文具店': './images/pin_3.png',
	'筆店': './images/pin_4.png',
	'文具博物館': './images/pin_5.png',
	'default': './images/pin_1.png'
};

// 2. 共用嘅陰影設定
const commonIconOptions = {
    iconSize: [50, 50],
    iconAnchor: [0, 50],
    popupAnchor: [0, -50]
};

// 3. 自動生成地圖用嘅 L.icon 字典 (唔使再人手逐個慢慢打)
const categoryIcons = {};
for (const [catName, imgPath] of Object.entries(GLOBAL_CATEGORY_PINS)) {
    categoryIcons[catName] = L.icon({ iconUrl: imgPath, ...commonIconOptions });
}

let userMarker = null;

function initMap() {
    myMap = L.map('leaflet-map').setView([22.3193, 114.1694], 11);
    myMap.zoomControl.setPosition('topright');

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors, Tiles style by HOT',
        detectRetina: true  // 自動偵測並為高解像度螢幕載入更清晰嘅地圖
    }).addTo(myMap);

    // Group
    markersLayer = L.markerClusterGroup({
        showCoverageOnHover: false, // 隱藏滑鼠移上去時嘅藍色範圍線，保持畫面復古感
        maxClusterRadius: 30,       // 數字越細，圖釘要越近先會合體 (預設係 80)
        spiderfyOnMaxZoom: true,     // 如果放到最大都仲疊住，點擊會好似蜘蛛網咁散開
        disableClusteringAtZoom: 16
    }).addTo(myMap);

    const zoomControl = document.querySelector('.leaflet-control-zoom');
    if (zoomControl) {
        const locateBtn = document.createElement('a');
        locateBtn.href = "#";
        locateBtn.title = currentLang === 'en' ? "Show My Location" : "顯示我的位置";
        // 用 Flexbox 令個 Icon 完美置中
        locateBtn.style.display = "flex";
        locateBtn.style.justifyContent = "center";
        locateBtn.style.alignItems = "center";
        
        // 紙飛機 SVG，縮細少少等佢同 + / - 嘅比例一致
        locateBtn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"></polygon></svg>`;
        
        locateBtn.addEventListener('click', function(e) {
            e.preventDefault(); // 防止畫面跳上頂
            myMap.locate({setView: true, maxZoom: 15});
        });
        
        // 塞入放大縮小面板嘅最尾
        zoomControl.appendChild(locateBtn);
    }

    // 3. 處理成功定位後嘅動作 (畫圓點)
    myMap.on('locationfound', function(e) {
        if (userMarker) {
            myMap.removeLayer(userMarker);
        }
        
        // 畫一個橙色圓點
        userMarker = L.circleMarker(e.latlng, {
            radius: 8,
            fillColor: "#e67e22",
            color: "#fff",
            weight: 2,
            opacity: 1,
            fillOpacity: 0.9
        }).addTo(myMap);

        const locText = currentLang === 'en' ? "You are here!" : "你喺呢度！";
        userMarker.bindPopup(`<div style="font-family: inherit; font-size: 14px; font-weight: bold; color: #451c03; text-align: center;">${locText}</div>`).openPopup();
    });

    // 4. 處理定位失敗
    myMap.on('locationerror', function(e) {
        const errorMsg = currentLang === 'en' ? "Cannot access your location. Please check browser permissions." : "無法獲取位置，請檢查瀏覽器權限設定。";
        alert(errorMsg);
    });
}

function updateMap(shops) {
    if (!myMap) initMap();
    markersLayer.clearLayers(); //Clear

    shops.forEach(s => {
        if (s.Lat && s.Lng) {
           // const marker = L.marker([parseFloat(s.Lat), parseFloat(s.Lng)], { icon: customIcon });
            
            const shopName = (currentLang === 'en' && s['Name(English)']) ? s['Name(English)'] : s['Name'];
            const address = (currentLang === 'en' && s['Address_en']) ? s['Address_en'] : s['Address'];
            const category = (currentLang === 'en' && s['Category_en']) ? s['Category_en'] : s['Category'];
            
            //for new markers
            const rawCategory = s['Category'] ? s['Category'].trim() : '';
            const selectedIcon = categoryIcons[rawCategory] || categoryIcons['default'];
            const marker = L.marker([parseFloat(s.Lat), parseFloat(s.Lng)], { icon: selectedIcon });

            // Popup 
            const logoHtml = s.Logo ? `<img src="${s.Logo}" style="width:100%; max-height:120px; object-fit:contain; margin-bottom:8px; border-radius:4px;">` : '';
            const navText = currentLang === 'en' ? 'Google Maps Navigation' : 'Google Maps 導航';
            const remarkText = currentLang === 'en' ? s.Remark_en : s.Remark;
            
            const igIconHtml = createIcon('ig').outerHTML;
            const webIconHtml = createIcon('web').outerHTML;
            const linkBtn = s.IG ? `<a href="${s.IG}" target="_blank" style="padding: 4px; display: flex; justify-content: center; align-items: center; text-decoration:none; transition: opacity 0.2s;" onmouseover="this.style.opacity=0.7" onmouseout="this.style.opacity=1">
                ${igIconHtml}
            </a>` : '';

            const navBtn = s.MapSite ? `<a href="${s.MapSite}" target="_blank" style="flex: 1; gap: 5px; padding: 6px; background:#6e380b; color:#fff; text-decoration:none; border-radius:4px; font-size: 12px; display: flex; justify-content: center; align-items: center; box-sizing:border-box;">
                ${navText}
            </a>` : '';
            const buttonsHtml = `
                <div style="display: flex; gap: 8px; width: 100%; box-sizing: border-box;">
                    ${navBtn}
                    ${linkBtn}
                </div>
            `;

            const popupContent = `
                <div style="min-width: 200px; font-family: inherit;">
                    ${logoHtml}
                    <h3 style="margin: 0 0 5px 0; color: #6e380b; font-size: 16px;">${shopName}</h3>
                    <span style="display:inline-block; background:#f0e4d8; color:#6e380b; padding:2px 6px; border-radius:4px; font-size:12px; margin-bottom:6px;">${category}</span>
                    <p style="margin: 0 0 10px 0; font-size: 13px; color: #555;">${address}</p>
                    
                    <!-- Remark 部分 -->
                    ${remarkText ? `<p style="margin: 0 0 10px 0; font-size: 12px; color: #8b5a2b; font-style: italic; background: #fdf8e6; padding: 5px; border-radius: 4px;">* ${remarkText}</p>` : ''}
                    
                    <!-- 呢度放排好咗嘅按鈕 -->
                    ${buttonsHtml}
                </div>
            `;
            
            marker.bindPopup(popupContent);
            markersLayer.addLayer(marker);
            marker.shopData = s; 
            allMarkers.push(marker);
           // marker.addTo(myMap);
        }
    });
}

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
        // 修正 Leaflet 在隱藏 div 顯示時會出現「灰塊」的問題
        if (tab === 'map' && myMap) {
            setTimeout(() => {
                myMap.invalidateSize();
            }, 100);
        }
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

function createIcon(type = 'web', strokeColor = 'rgb(69, 28, 3)') {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '18'); svg.setAttribute('height', '18'); svg.setAttribute('viewBox', '0 0 24 24');
    svg.style.transition = 'stroke 0.2s ease, fill 0.2s ease';

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    
    // 統一設定 (所有 Icon 都用得著)
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', strokeColor);
    svg.setAttribute('stroke-width', '2'); 
    svg.setAttribute('stroke-linecap', 'round'); 
    svg.setAttribute('stroke-linejoin', 'round');

    if (type === 'ig') {
        path.setAttribute('d', 'M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm5 4a6 6 0 1 0 0 12 6 6 0 0 0 0-12zm6.5-.75a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5z');
    } else if (type === 'blog') {
        // 新增：鋼筆寫字 Icon (代表 Blog/文章)
        path.setAttribute('d', 'M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z');
    } else {
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

    // 1. 準備計數機
    const regionCounts = {};
    const districtCounts = {};
    const categoryCounts = {};
    let totalShops = 0; // 順便計埋總店舖數量

    const regionsSet = new Set();
    const categoriesSet = new Set();
    globalRegionDistrictsMap = {};

    const catEngToChiMap = {};

    // 2. Loop 晒所有店舖，一邊抽類別一邊計數
    rawShops.forEach(s => {
        totalShops++;
        
        // 處理 Category
        const chiCat = (s['Category'] || '').trim();
        const engCat = (s['Category_en'] || '').trim();
        const cat = (currentLang === 'en' && engCat) ? engCat : chiCat;

        if (cat) {
            categoriesSet.add(cat);
            categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
            // 記錄中英對照，方便陣間搵圖釘
            if (engCat && chiCat) {
                catEngToChiMap[engCat] = chiCat; 
            }
        }

        // 處理 Region & District
        const rawDist = (currentLang === 'en' && s['District_en']) ? s['District_en'].trim() : (s['District'] || '').trim();
        if (!rawDist) return;

        const parts = rawDist.split(/[,，]\s*/);
        const r = parts[0];
        const d = parts.length > 1 ? parts[1] : '';

        regionsSet.add(r);
        regionCounts[r] = (regionCounts[r] || 0) + 1; // 有呢個區域就 +1

        if (!globalRegionDistrictsMap[r]) globalRegionDistrictsMap[r] = new Set();
        if (d) {
            globalRegionDistrictsMap[r].add(d);
            districtCounts[d] = (districtCounts[d] || 0) + 1; // 有呢個地區就 +1
        }
    });

    // 將「全部」選項都加埋總數落去
    const allRegionText = currentLang === 'en' ? `▼ All Regions (${totalShops})` : `▼ 全部區域 (${totalShops})`;
    const allDistrictText = currentLang === 'en' ? `▼ All Districts` : `▼ 全部地區`; // 地區選項會隨區域變動，所以唔加總數
    const allCatText = currentLang === 'en' ? `▼ All Categories (${totalShops})` : `▼ 全部類別 (${totalShops})`;

    // 3. 生成 Region Dropdown (加上數字)
    filterRegionEl.innerHTML = `<option value="">${allRegionText}</option>`;
    const regions = Array.from(regionsSet).sort((a, b) => a.localeCompare(b, currentLang === 'en' ? 'en' : 'zh-Hant', { sensitivity: 'base', numeric: true }));
    regions.forEach(r => {
        const opt = document.createElement('option');
        opt.value = r;
        opt.textContent = `${r} (${regionCounts[r]})`; // 顯示格式：區域 (數量)
        filterRegionEl.appendChild(opt);
    });
    filterRegionEl.value = currentRegion;

    // 4. 生成 District Dropdown (加上數字)
    filterDistrictEl.innerHTML = `<option value="">${allDistrictText}</option>`;
    const allDists = Array.from(new Set(Object.values(globalRegionDistrictsMap).flatMap(set => Array.from(set)))).sort((a, b) => a.localeCompare(b, currentLang === 'en' ? 'en' : 'zh-Hant', { sensitivity: 'base', numeric: true }));
    
    if (!currentRegion) {
        allDists.forEach(d => {
            if (d) {
                const opt = document.createElement('option');
                opt.value = d;
                opt.textContent = `${d} (${districtCounts[d]})`; // 顯示格式：地區 (數量)
                filterDistrictEl.appendChild(opt);
            }
        });
    } else {
        const dists = Array.from(globalRegionDistrictsMap[currentRegion] || []).sort((a, b) => a.localeCompare(b, currentLang === 'en' ? 'en' : 'zh-Hant', { sensitivity: 'base', numeric: true }));
        dists.forEach(d => {
            const opt = document.createElement('option');
            opt.value = d;
            opt.textContent = `${d} (${districtCounts[d]})`; // 顯示格式：地區 (數量)
            filterDistrictEl.appendChild(opt);
        });
    }
    filterDistrictEl.value = currentDistrict;

    // 5. 生成 Directory Category Dropdown (加上數字)
    filterCategoryEl.innerHTML = `<option value="">${allCatText}</option>`;
    
    // 重新排序邏輯：按數量由多至少，然後按名稱
    const categories = Array.from(categoriesSet).sort((a, b) => {
        if (categoryCounts[b] !== categoryCounts[a]) {
            return categoryCounts[b] - categoryCounts[a]; 
        }
        return a.localeCompare(b, currentLang === 'en' ? 'en' : 'zh-Hant', { sensitivity: 'base' });
    });

    // 補返呢個 Loop！將排好序嘅類別，逐個變做 <option> 塞入 Directory 選單
    categories.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c;
        opt.textContent = `${c} (${categoryCounts[c]})`; // 顯示格式：類別 (數量)
        filterCategoryEl.appendChild(opt);
    });
    
    filterCategoryEl.value = currentCat;

    // 6. 更新自訂圖片 Dropdown
    const customList = document.querySelector('#custom-map-dropdown .dropdown-list');
    if (customList) {
        customList.innerHTML = '';
        
        // 加入「全部類別」選項 (無圖片)
        const allItem = document.createElement('div');
        allItem.className = 'dropdown-item';
        allItem.dataset.value = '';
        allItem.innerHTML = `<span style="flex:1;">${allCatText}</span>`;
        customList.appendChild(allItem);

        // 加入各個類別 (連同圖釘圖片)
       categories.forEach(c => {
            const item = document.createElement('div');
            item.className = 'dropdown-item';
            item.dataset.value = c;
            
            // 新增：先透過翻譯機將英文名轉返做中文，如果冇（即係繁體介面）就照用原名 c
            const searchKey = catEngToChiMap[c] || c;
            
            // 用 searchKey 去查圖釘字典
            const imgSrc = GLOBAL_CATEGORY_PINS[searchKey] || GLOBAL_CATEGORY_PINS['default'];
            
            item.innerHTML = `<img src="${imgSrc}" alt="${c}"><span style="flex:1;">${c}</span><span style="opacity:0.6;">(${categoryCounts[c]})</span>`;
            customList.appendChild(item);
        });
    }
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
        if (s['Blog']) { const aBlog = document.createElement('a'); aBlog.href = s['Blog']; aBlog.target = '_blank'; aBlog.rel = 'noopener noreferrer'; aBlog.title = 'Blog / Article'; aBlog.appendChild(createIcon('blog', '#e67e22')); links.appendChild(aBlog); }

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
            "MapSite": row.c[16]?.v || "",
            "Lat": row.c[17]?.v || "", 
            "Lng": row.c[18]?.v || "",
            "Blog": row.c[19]?.v || ""
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
    updateMap(currentShops);
}

// 動態注入閃爍特效的 CSS Style
if (!document.getElementById('today-badge-style')) {
    const style = document.createElement('style');
    style.id = 'today-badge-style';
    style.innerHTML = `
        @keyframes todayGlow {
            0% { opacity: 1; transform: scale(1); box-shadow: 0 0 4px rgba(229, 57, 53, 0.6); }
            50% { opacity: 0.5; transform: scale(0.96); box-shadow: 0 0 12px rgba(229, 57, 53, 0.9); }
            100% { opacity: 1; transform: scale(1); box-shadow: 0 0 4px rgba(229, 57, 53, 0.6); }
        }
        .today-badge-flash {
            animation: todayGlow 1.5s infinite ease-in-out;
        }
    `;
    document.head.appendChild(style);
}

function renderEvents(events) {
    window.rawEvents = events;
    const viewEventCards = document.getElementById("event-cards");
    viewEventCards.innerHTML = '';

    function parseDateString(s) {
        if (!s) return null;
        s = s.toString().trim();
        const d = new Date(s);
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

    // 1. 篩選出未過期的活動
    const visibleEvents = events.filter(ev => {
        const dateEndVal = ev.date_end ?? ev.dateEnd ?? '';
        const dateStartVal = ev.dateStart ?? '';
        
        const parsedEnd = parseDateString(dateEndVal);
        const parsedStart = parseDateString(dateStartVal);
        
        const endDate = toMidnight(parsedEnd) || toMidnight(parsedStart);
        if (!endDate) return false;
        
        return endDate >= today;
    });

    // 2. 依照開始日期（dateStart）進行排序（由近到遠）
    visibleEvents.sort((a, b) => {
        const dateA = toMidnight(parseDateString(a.dateStart)) || new Date(8640000000000000);
        const dateB = toMidnight(parseDateString(b.dateStart)) || new Date(8640000000000000);
        return dateA - dateB;
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

        // 標題與 TODAY 標籤容器
        const titleRow = document.createElement('div');
        titleRow.style.display = 'flex';
        titleRow.style.alignItems = 'center';
        titleRow.style.gap = '8px';
        titleRow.style.flexWrap = 'wrap';

        const title = document.createElement('h3');
        title.className = 'event-title';
        title.style.margin = '0';
        title.textContent = safeText(event.name || '未命名活動');
        titleRow.appendChild(title);

        // 檢查今天是否在活動期間內 (startDate <= today <= endDate)
        const startDateObj = toMidnight(parseDateString(event.dateStart));
        const endDateObj = toMidnight(parseDateString(event.date_end ?? event.dateEnd));
        
        const effectiveStart = startDateObj || endDateObj;
        const effectiveEnd = endDateObj || startDateObj;

        if (effectiveStart && effectiveEnd && today >= effectiveStart && today <= effectiveEnd) {
            const todayBadge = document.createElement('span');
            todayBadge.textContent = 'TODAY';
            todayBadge.className = 'today-badge-flash'; // 套用閃爍特效 class
            todayBadge.style.backgroundColor = '#e53935'; 
            todayBadge.style.color = '#fff';
            todayBadge.style.fontSize = '0.75rem';
            todayBadge.style.fontWeight = 'bold';
            todayBadge.style.padding = '2px 8px';
            todayBadge.style.borderRadius = '4px';
            todayBadge.style.letterSpacing = '0.5px';
            todayBadge.style.display = 'inline-block';
            titleRow.appendChild(todayBadge);
        }

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

        body.appendChild(titleRow); 
        body.appendChild(dateLine); 
        body.appendChild(venue);
        body.appendChild(address); 
        body.appendChild(host);

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
            const parsed = rows.map(row => {
                function parseGvizDate(cell) {
                    if (!cell) return "";
                    if (cell.f) return cell.f;
                    if (cell.v && typeof cell.v === 'string' && cell.v.startsWith('Date(')) {
                        const parts = cell.v.match(/\d+/g);
                        if (parts && parts.length >= 3) {
                            const y = parts[0];
                            const m = String(parseInt(parts[1]) + 1).padStart(2, '0');
                            const d = String(parseInt(parts[2])).padStart(2, '0');
                            return `${y}-${m}-${d}`;
                        }
                    }
                    return cell.v || "";
                }

                return {
                    name: row.c[0]?.v || "--",
                    dateStart: parseGvizDate(row.c[1]),
                    dateEnd: parseGvizDate(row.c[2]),
                    date_end: parseGvizDate(row.c[2]),
                    weekDay: row.c[3]?.v || "",
                    venue: row.c[4]?.v || "",
                    address: row.c[5]?.v || "",
                    mapSite: row.c[6]?.v || "",
                    host: row.c[7]?.v || "",
                    site: row.c[8]?.v || "",
                    remark: row.c[9]?.v || "",
                    type: row.c[10]?.v || ""
                };
            });

            renderEvents(parsed);
        })
        .catch(err => {
            console.error('Load events error:', err);
            const viewEventCards = document.getElementById("event-cards");
            if (viewEventCards) viewEventCards.innerHTML = `<p style='color:red;'>${translations[currentLang].loadFailed}</p>`;
        });
}

// --- 自訂圖片選單嘅操作邏輯 ---
const customDropdown = document.getElementById('custom-map-dropdown');
if (customDropdown) {
    const dropdownSelected = customDropdown.querySelector('.dropdown-selected');
    const dropdownText = customDropdown.querySelector('.dropdown-text');
    const dropdownIcon = customDropdown.querySelector('.dropdown-icon');
    const dropdownList = customDropdown.querySelector('.dropdown-list');

    // 點擊打開/關閉選單
    dropdownSelected.addEventListener('click', (e) => {
        e.stopPropagation(); // 防止點擊事件向外擴散
        customDropdown.classList.toggle('open');
    });

    // 點擊外面任何地方自動關閉選單
    document.addEventListener('click', () => {
        customDropdown.classList.remove('open');
    });

    // 點擊清單項目
    dropdownList.addEventListener('click', (e) => {
        const item = e.target.closest('.dropdown-item');
        if (!item) return;

        const val = item.dataset.value;
        const imgSrc = item.querySelector('img')?.src;
        
        // 更新顯示狀態
        if (val === '') {
            dropdownIcon.style.display = 'none';
            dropdownText.textContent = item.textContent; // 顯示全部類別
        } else {
            dropdownIcon.src = imgSrc;
            dropdownIcon.style.display = 'block';
            dropdownText.textContent = val; // 只顯示類別名 (唔顯示數量)
        }

        // 執行地圖過濾 (結合 MarkerCluster)
        markersLayer.clearLayers();
        allMarkers.forEach(marker => {
            const s = marker.shopData;
            const catText = (currentLang === 'en' && s['Category_en']) ? s['Category_en'].trim() : (s['Category'] || '').trim();
            
            if (val === "" || catText === val) {
                markersLayer.addLayer(marker); 
            }
        });
    });
}


sortNameEl.addEventListener('change', applyAndRender);
filterRegionEl.addEventListener('change', applyAndRender);
filterDistrictEl.addEventListener('change', applyAndRender);

loadShops();
loadEvents();
