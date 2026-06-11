import { state, saveState, saveStateLocalOnly } from './state.js';
import { formatCurrency } from './utils.js';
import { applyCurrentLayout } from './layout.js';

// Inicialização de Estado Padrão dos Widgets
function initWidgetsState() {
    if (!state.widgets) state.widgets = {};
    if (!state.widgets.clock) state.widgets.clock = { enabled: true, theme: 'analog-neon' };
    if (!state.widgets.weather) state.widgets.weather = { enabled: true, location: '' };
    if (!state.widgets.notepad) state.widgets.notepad = { enabled: true, theme: 'notepad-glass-sticky', text: '' };
    if (!state.widgets.salesCalc) state.widgets.salesCalc = { enabled: true };
    if (!state.widgets.salesGoal) state.widgets.salesGoal = { enabled: true, monthlyGoal: 10000 };
    if (!state.widgets.birthdays) state.widgets.birthdays = { enabled: true };
    if (!state.widgetOrder) {
        state.widgetOrder = ['clock', 'weather', 'salesGoal', 'salesCalc', 'notepad', 'birthdays'];
    } else if (!state.widgetOrder.includes('birthdays')) {
        state.widgetOrder.push('birthdays');
    }
}

// ============================================================================
// SETUP PANEL (Configurações)
// ============================================================================
export function renderWidgetsSetupPanel() {
    initWidgetsState();
    const panel = document.getElementById('widgets-setup-panel');
    if (!panel) return;

    let html = '';
    
    state.widgetOrder.forEach((key, idx) => {
        let name = '';
        let desc = '';
        let actionsHTML = '';
        
        if (key === 'clock') {
            name = 'Relógio';
            desc = 'Mostra a hora e a data atual no dashboard.';
            actionsHTML = `
                <select class="widget-style-select" id="cfg-widget-clock-theme" onchange="window.updateWidgetConfig('clock', 'theme', this.value)">
                    <option value="analog-neon" ${state.widgets.clock.theme === 'analog-neon' ? 'selected' : ''}>Analógico Neon Cyber</option>
                    <option value="analog-gold" ${state.widgets.clock.theme === 'analog-gold' ? 'selected' : ''}>Analógico Ouro Clássico</option>
                    <option value="analog-minimal" ${state.widgets.clock.theme === 'analog-minimal' ? 'selected' : ''}>Analógico Minimalista</option>
                    <option value="digital-neon" ${state.widgets.clock.theme === 'digital-neon' ? 'selected' : ''}>Digital Azul Cyber</option>
                    <option value="digital-retro" ${state.widgets.clock.theme === 'digital-retro' ? 'selected' : ''}>Digital Verde Matrix</option>
                </select>
                <button type="button" class="btn ${state.widgets.clock.enabled ? 'btn-danger' : 'btn-success'} btn-sm" onclick="window.toggleWidget('clock')">
                    ${state.widgets.clock.enabled ? 'Desativar' : 'Ativar'}
                </button>
            `;
        } else if (key === 'weather') {
            name = 'Clima';
            desc = 'Temperatura local. Digite sua cidade para forçar o local (Ex: São Paulo, SP).';
            actionsHTML = `
                <input type="text" class="widget-style-select" style="width: 120px;" value="${state.widgets.weather.location || ''}" onchange="window.updateWidgetConfig('weather', 'location', this.value)" placeholder="Sua Cidade">
                <button type="button" class="btn ${state.widgets.weather.enabled ? 'btn-danger' : 'btn-success'} btn-sm" onclick="window.toggleWidget('weather')">
                    ${state.widgets.weather.enabled ? 'Desativar' : 'Ativar'}
                </button>
            `;
        } else if (key === 'notepad') {
            name = 'Bloco de Notas';
            desc = 'Anotações rápidas salvas em nuvem.';
            actionsHTML = `
                <select class="widget-style-select" id="cfg-widget-notepad-theme" onchange="window.updateWidgetConfig('notepad', 'theme', this.value)">
                    <option value="notepad-glass-sticky" ${state.widgets.notepad.theme === 'notepad-glass-sticky' ? 'selected' : ''}>Vidro Neon</option>
                    <option value="notepad-yellow-pad" ${state.widgets.notepad.theme === 'notepad-yellow-pad' ? 'selected' : ''}>Post-it Amarelo</option>
                    <option value="notepad-terminal" ${state.widgets.notepad.theme === 'notepad-terminal' ? 'selected' : ''}>Terminal Matrix</option>
                </select>
                <button type="button" class="btn ${state.widgets.notepad.enabled ? 'btn-danger' : 'btn-success'} btn-sm" onclick="window.toggleWidget('notepad')">
                    ${state.widgets.notepad.enabled ? 'Desativar' : 'Ativar'}
                </button>
            `;
        } else if (key === 'salesCalc') {
            name = 'Calculadora de Vendas';
            desc = 'Para contas rápidas de troco e peso.';
            actionsHTML = `
                <button type="button" class="btn ${state.widgets.salesCalc.enabled ? 'btn-danger' : 'btn-success'} btn-sm" onclick="window.toggleWidget('salesCalc')">
                    ${state.widgets.salesCalc.enabled ? 'Desativar' : 'Ativar'}
                </button>
            `;
        } else if (key === 'salesGoal') {
            name = 'Progresso de Meta (Faturamento)';
            desc = 'Visualizador circular de meta de faturamento mensal.';
            actionsHTML = `
                <input type="number" class="widget-style-select" style="width: 80px; text-align: right;" value="${state.widgets.salesGoal.monthlyGoal}" onchange="window.updateWidgetConfig('salesGoal', 'monthlyGoal', Number(this.value))" placeholder="Meta">
                <button type="button" class="btn ${state.widgets.salesGoal.enabled ? 'btn-danger' : 'btn-success'} btn-sm" onclick="window.toggleWidget('salesGoal')">
                    ${state.widgets.salesGoal.enabled ? 'Desativar' : 'Ativar'}
                </button>
            `;
        } else if (key === 'birthdays') {
            name = '🎂 Aniversários';
            desc = 'Mostra os clientes fazendo aniversário nesta semana.';
            actionsHTML = `
                <button type="button" class="btn ${state.widgets.birthdays.enabled ? 'btn-danger' : 'btn-success'} btn-sm" onclick="window.toggleWidget('birthdays')">
                    ${state.widgets.birthdays.enabled ? 'Desativar' : 'Ativar'}
                </button>
            `;
        }

        const isFirst = idx === 0;
        const isLast = idx === state.widgetOrder.length - 1;
        const orderBtnsHTML = `
            <div style="display:flex; flex-direction:column; gap:2px; margin-right:8px; justify-content:center;">
                <button type="button" class="btn btn-secondary btn-sm" style="padding:2px 6px; font-size:0.65rem; height:auto; display:flex; align-items:center; justify-content:center;" onclick="window.moveWidget('${key}', -1)" ${isFirst ? 'disabled style="opacity:0.2;"' : ''}>▲</button>
                <button type="button" class="btn btn-secondary btn-sm" style="padding:2px 6px; font-size:0.65rem; height:auto; display:flex; align-items:center; justify-content:center;" onclick="window.moveWidget('${key}', 1)" ${isLast ? 'disabled style="opacity:0.2;"' : ''}>▼</button>
            </div>
        `;

        html += `
            <div class="widget-setup-item" style="display:flex; align-items:center; width:100%; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:8px; margin-bottom:8px;">
                ${orderBtnsHTML}
                <div class="widget-setup-info" style="flex:1;">
                    <span class="widget-setup-name" style="font-weight:700; color:#fff;">${name}</span>
                    <span class="widget-setup-desc" style="font-size:0.75rem; color:var(--color-text-muted);">${desc}</span>
                </div>
                <div class="widget-setup-actions" style="display:flex; gap:6px; align-items:center;">
                    ${actionsHTML}
                </div>
            </div>
        `;
    });

    panel.innerHTML = html;
}

window.toggleWidget = function(widgetName) {
    initWidgetsState();
    if (state.widgets[widgetName]) {
        state.widgets[widgetName].enabled = !state.widgets[widgetName].enabled;
        saveState();
        renderWidgetsSetupPanel();
        renderWidgets();
    }
};

window.updateWidgetConfig = function(widgetName, key, value) {
    initWidgetsState();
    if (state.widgets[widgetName]) {
        state.widgets[widgetName][key] = value;
        
        // Sync lateral drawer weather if dashboard weather location changes
        if (widgetName === 'weather' && key === 'location' && window.updateWeatherFromAPI) {
            if (!state.weatherConfig) state.weatherConfig = {};
            state.weatherConfig.city = value;
            state.weatherConfig.lat = null;
            state.weatherConfig.lon = null;
            window.updateWeatherFromAPI();
        }
        
        saveState();
        renderWidgetsSetupPanel();
        renderWidgets();
    }
};

window.moveWidget = function(widgetName, direction) {
    initWidgetsState();
    const idx = state.widgetOrder.indexOf(widgetName);
    if (idx === -1) return;
    
    const targetIdx = idx + direction;
    if (targetIdx >= 0 && targetIdx < state.widgetOrder.length) {
        const temp = state.widgetOrder[idx];
        state.widgetOrder[idx] = state.widgetOrder[targetIdx];
        state.widgetOrder[targetIdx] = temp;
        saveState();
        renderWidgetsSetupPanel();
        renderWidgets();
    }
};

// ============================================================================
// WIDGETS RENDERING
// ============================================================================
let clockInterval = null;

export function renderWidgets() {
    initWidgetsState();
    const container = document.getElementById('widgets-container');
    if (!container) return;

    // Se nenhum widget estiver habilitado, ocultar o container
    const isAnyEnabled = Object.values(state.widgets).some(w => w.enabled);
    if (!isAnyEnabled) {
        container.style.display = 'none';
        container.innerHTML = '';
        if (clockInterval) clearInterval(clockInterval);
        return;
    }
    
    container.style.display = 'grid';
    let html = '';

    state.widgetOrder.forEach(key => {
        if (!state.widgets[key] || !state.widgets[key].enabled) return;
        if (key === 'clock') html += getClockHTML(state.widgets.clock.theme);
        else if (key === 'weather') html += getWeatherHTML();
        else if (key === 'salesGoal') html += getSalesGoalHTML();
        else if (key === 'salesCalc') html += getSalesCalcHTML();
        else if (key === 'notepad') html += getNotepadHTML(state.widgets.notepad.theme);
        else if (key === 'birthdays') html += getBirthdaysHTML();
    });

    container.innerHTML = html;

    // Inicializar lógicas ativas
    if (state.widgets.clock.enabled) initClockLogic(state.widgets.clock.theme);
    if (state.widgets.weather.enabled) initWeatherLogic();
    if (state.widgets.salesGoal.enabled) initSalesGoalLogic();
    if (state.widgets.salesCalc.enabled) initSalesCalcLogic();
    if (window.lucide) window.lucide.createIcons();
    
    // Iniciar listeners de Drag & Drop
    initWidgetDragAndDrop();

    // Re-aplicar layout (caso esteja em modo flutuante ou grade)
    if (typeof applyCurrentLayout === 'function') {
        applyCurrentLayout();
    }
}

// 1. Relógio
function getClockHTML(theme) {
    const isDigital = theme.startsWith('digital');
    if (isDigital) {
        return `
        <div class="widget-card dashboard-panel size-small" id="widget-clock" data-widget-key="clock">
            <div class="widget-header" style="border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 6px; margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between;">
                <h3 style="margin: 0; display: flex; align-items: center; gap: 6px; width: 100%;"><i data-lucide="clock"></i> Relógio Local <span style="font-size: 0.65rem; font-family: monospace; background: rgba(0,240,255,0.08); color: var(--color-primary); border: 1px solid rgba(0,240,255,0.2); padding: 2px 6px; border-radius: 4px; font-weight: bold; margin-left: auto;">COD: WID-01</span></h3>
            </div>
            <div class="widget-body">
                <div class="digital-clock-widget ${theme}">
                    <div class="digital-clock-time" id="widget-digital-time">00:00:00</div>
                    <div class="digital-clock-date" id="widget-digital-date">Carregando...</div>
                </div>
            </div>
        </div>`;
    } else {
        return `
        <div class="widget-card dashboard-panel size-small" id="widget-clock" data-widget-key="clock">
            <div class="widget-header" style="border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 6px; margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between;">
                <h3 style="margin: 0; display: flex; align-items: center; gap: 6px; width: 100%;"><i data-lucide="clock"></i> Horário <span style="font-size: 0.65rem; font-family: monospace; background: rgba(0,240,255,0.08); color: var(--color-primary); border: 1px solid rgba(0,240,255,0.2); padding: 2px 6px; border-radius: 4px; font-weight: bold; margin-left: auto;">COD: WID-01</span></h3>
            </div>
            <div class="widget-body">
                <div class="analog-clock-container">
                    <div class="analog-clock ${theme}">
                        <div class="clock-center-dot"></div>
                        <div class="hand hour" id="widget-analog-hour"></div>
                        <div class="hand minute" id="widget-analog-minute"></div>
                        <div class="hand second" id="widget-analog-second"></div>
                        <div class="marker"><div class="marker-line quarter" style="transform: rotate(0deg)"></div></div>
                        <div class="marker"><div class="marker-line quarter" style="transform: rotate(90deg)"></div></div>
                        <div class="marker"><div class="marker-line quarter" style="transform: rotate(180deg)"></div></div>
                        <div class="marker"><div class="marker-line quarter" style="transform: rotate(270deg)"></div></div>
                    </div>
                </div>
            </div>
        </div>`;
    }
}

function initClockLogic(theme) {
    if (clockInterval) clearInterval(clockInterval);
    const isDigital = theme.startsWith('digital');
    
    function updateClock() {
        const now = new Date();
        
        if (isDigital) {
            const timeEl = document.getElementById('widget-digital-time');
            const dateEl = document.getElementById('widget-digital-date');
            if (!timeEl || !dateEl) return;
            
            timeEl.innerText = now.toLocaleTimeString('pt-BR');
            dateEl.innerText = now.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'long', year: 'numeric' });
        } else {
            const hEl = document.getElementById('widget-analog-hour');
            const mEl = document.getElementById('widget-analog-minute');
            const sEl = document.getElementById('widget-analog-second');
            if (!hEl || !mEl || !sEl) return;
            
            const seconds = now.getSeconds();
            const minutes = now.getMinutes();
            const hours = now.getHours();
            
            const sDeg = (seconds / 60) * 360;
            const mDeg = ((minutes + seconds/60) / 60) * 360;
            const hDeg = ((hours % 12 + minutes/60) / 12) * 360;
            
            sEl.style.transform = `translateX(-50%) rotate(${sDeg}deg)`;
            mEl.style.transform = `translateX(-50%) rotate(${mDeg}deg)`;
            hEl.style.transform = `translateX(-50%) rotate(${hDeg}deg)`;
        }
    }
    
    updateClock();
    clockInterval = setInterval(updateClock, 1000);
}

// 2. Clima
function getWeatherHTML() {
    return `
    <div class="widget-card dashboard-panel size-small" id="widget-weather" data-widget-key="weather">
        <div class="widget-header" style="border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 6px; margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between;">
            <h3 style="margin: 0; display: flex; align-items: center; gap: 6px; width: 100%;"><i data-lucide="cloud"></i> Clima <span style="font-size: 0.65rem; font-family: monospace; background: rgba(0,240,255,0.08); color: var(--color-primary); border: 1px solid rgba(0,240,255,0.2); padding: 2px 6px; border-radius: 4px; font-weight: bold; margin-left: auto;">COD: WID-02</span></h3>
        </div>
        <div class="widget-body">
            <div class="weather-widget">
                <div class="weather-detailed-card" id="widget-weather-content">
                    <div style="text-align:center; padding: 20px; font-size: 0.85rem; color: #888;">Carregando clima local...</div>
                </div>
            </div>
        </div>
    </div>`;
}

async function initWeatherLogic() {
    const content = document.getElementById('widget-weather-content');
    if (!content) return;
    
    const configuredCity = state.widgets.weather.location;
    if (configuredCity && configuredCity.trim() !== '') {
        try {
            content.innerHTML = '<div style="text-align:center; padding: 20px; font-size: 0.85rem; color: #888;">Buscando cidade...</div>';
            const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(configuredCity)}&count=1&language=pt&format=json`);
            const geoData = await geoRes.json();
            
            if (geoData.results && geoData.results.length > 0) {
                const lat = geoData.results[0].latitude;
                const lon = geoData.results[0].longitude;
                const resolvedName = geoData.results[0].name;
                fetchWeatherData(lat, lon, resolvedName, content);
                return;
            } else {
                content.innerHTML = '<div style="text-align:center; padding: 20px; font-size: 0.85rem; color: #888;">Cidade não encontrada. Tente "Nome da Cidade, Sigla do Estado".</div>';
                return;
            }
        } catch(e) {
            console.error(e);
        }
    }

    // Se já temos coordenadas GPS e a cidade resolvida salvas no estado, usamos diretamente.
    // Isso evita o prompt de geolocalização repetitivo no protocolo file:///
    if (state.weatherConfig && state.weatherConfig.lat && state.weatherConfig.lon) {
        const lat = state.weatherConfig.lat;
        const lon = state.weatherConfig.lon;
        const resolvedName = state.weatherConfig.city || "Auto (GPS)";
        fetchWeatherData(lat, lon, resolvedName, content);
        return;
    }

    // Se o usuário não está logado, não forçar prompt de geolocalização (evita popup na tela de login)
    if (!sessionStorage.getItem("currentUserId")) {
        fetchWeatherData(-23.1791, -45.8872, "São José dos Campos", content);
        return;
    }
    
    let lat = -23.1791; 
    let lon = -45.8872; // São José dos Campos SP
    
    try {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(async (pos) => {
                lat = pos.coords.latitude;
                lon = pos.coords.longitude;

                // Tentar obter o nome real da cidade (ex: Registro - SP) via geolocalização reversa
                let resolvedName = "Auto (GPS)";
                try {
                    const revGeoRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=pt`);
                    const revGeoData = await revGeoRes.json();
                    if (revGeoData) {
                        const city = revGeoData.city || revGeoData.locality || revGeoData.principalSubdivision || "";
                        let stateAbbr = "";
                        if (revGeoData.principalSubdivisionCode) {
                            const parts = revGeoData.principalSubdivisionCode.split("-");
                            stateAbbr = parts[parts.length - 1];
                        }
                        if (city) {
                            resolvedName = stateAbbr ? `${city} - ${stateAbbr}` : city;
                        }
                    }
                } catch (err) {
                    console.error("Erro na geolocalização reversa inicial:", err);
                }
                
                fetchWeatherData(lat, lon, resolvedName, content);
            }, () => {
                fetchWeatherData(lat, lon, "São José dos Campos", content);
            });
        } else {
            fetchWeatherData(lat, lon, "São José dos Campos", content);
        }
    } catch(e) {
        content.innerHTML = '<div style="color:red; text-align:center;">Erro ao carregar clima</div>';
    }
}

async function fetchWeatherData(lat, lon, locationName, contentDiv) {
    try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,is_day,wind_speed_10m&timezone=auto`);
        const data = await res.json();
        
        if (data && data.current) {
            const temp = Math.round(data.current.temperature_2m);
            const wind = Math.round(data.current.wind_speed_10m);
            const code = data.current.weather_code;
            
            let condition = "Céu Limpo";
            let icon = "sun";
            if (code >= 1 && code <= 3) { condition = "Parcialmente Nublado"; icon = "cloud"; }
            else if (code >= 45 && code <= 48) { condition = "Neblina"; icon = "cloud-fog"; }
            else if (code >= 51 && code <= 67) { condition = "Chuva"; icon = "cloud-rain"; }
            else if (code >= 71 && code <= 77) { condition = "Neve"; icon = "cloud-snow"; }
            else if (code >= 80 && code <= 82) { condition = "Pancadas de Chuva"; icon = "cloud-rain"; }
            else if (code >= 95) { condition = "Tempestade"; icon = "cloud-lightning"; }
            
            if (data.current.is_day === 0) {
                if (icon === "sun") {
                    icon = "moon";
                    condition = "Noite Limpa";
                } else if (icon === "cloud") {
                    icon = "cloud-moon";
                    condition = "Noite Nublada";
                }
            }
            contentDiv.innerHTML = `
                <div class="weather-main-info">
                    <div style="display:flex; align-items:center; gap: 15px;">
                        <i data-lucide="${icon}" style="width: 42px; height: 42px; color: var(--color-primary);"></i>
                        <div>
                            <div style="font-size: 2.5rem; font-weight: bold; line-height: 1;">${temp}°<span style="font-size: 1.2rem; color: #888;">C</span></div>
                            <div style="font-size: 0.85rem; color: var(--color-text-muted);">${condition}</div>
                        </div>
                    </div>
                </div>
                <div class="weather-grid-details">
                    <div class="weather-detail-item"><i data-lucide="wind" style="width:14px;"></i> Vento: <span>${wind} km/h</span></div>
                    <div class="weather-detail-item" style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${locationName}"><i data-lucide="map-pin" style="width:14px;"></i> Local: <span>${locationName}</span></div>
                </div>
            `;
            if (window.lucide) window.lucide.createIcons();

            if (!state.weatherConfig) state.weatherConfig = {};
            state.weatherConfig.temp = temp;
            state.weatherConfig.condition = icon;
            state.weatherConfig.city = locationName;
            state.weatherConfig.lat = lat;
            state.weatherConfig.lon = lon;
            saveState();

            const activeEl = document.querySelector(".nav-item.active");
            const activeTab = activeEl ? activeEl.getAttribute("data-tab") : "dashboard";
            if (activeTab === "dashboard" && window.renderDashboardAlerts) {
                window.renderDashboardAlerts();
            }
        }
    } catch(e) {
        contentDiv.innerHTML = '<div style="color:red; text-align:center;">Sem conexão para clima.</div>';
    }
}

// 3. Meta de Vendas
function getSalesGoalHTML() {
    return `
    <div class="widget-card dashboard-panel size-small" id="widget-salesGoal" data-widget-key="salesGoal">
        <div class="widget-header" style="border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 6px; margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between;">
            <h3 style="margin: 0; display: flex; align-items: center; gap: 6px; width: 100%;"><i data-lucide="target"></i> Meta do Mês <span style="font-size: 0.65rem; font-family: monospace; background: rgba(0,240,255,0.08); color: var(--color-primary); border: 1px solid rgba(0,240,255,0.2); padding: 2px 6px; border-radius: 4px; font-weight: bold; margin-left: auto;">COD: WID-03</span></h3>
        </div>
        <div class="widget-body">
            <div class="sales-goal-widget">
                <div class="circular-progress-container">
                    <svg class="circular-progress-svg" viewBox="0 0 100 100">
                        <defs>
                            <linearGradient id="goalGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stop-color="var(--color-primary)" />
                                <stop offset="100%" stop-color="var(--color-secondary)" />
                            </linearGradient>
                        </defs>
                        <circle class="circular-progress-bg" cx="50" cy="50" r="45"></circle>
                        <circle class="circular-progress-bar" id="widget-goal-bar" cx="50" cy="50" r="45"></circle>
                    </svg>
                    <div class="circular-progress-text" id="widget-goal-pct">0%</div>
                </div>
                <div style="text-align:center; font-size: 0.85rem; color: var(--color-text-muted); line-height: 1.4;">
                    Alcançado: <strong style="color: #fff;" id="widget-goal-current">R$ 0,00</strong><br>
                    Meta: <strong style="color: #fff;">${formatCurrency(state.widgets.salesGoal.monthlyGoal)}</strong>
                </div>
            </div>
        </div>
    </div>`;
}

function initSalesGoalLogic() {
    const bar = document.getElementById('widget-goal-bar');
    const pctTxt = document.getElementById('widget-goal-pct');
    const currTxt = document.getElementById('widget-goal-current');
    if (!bar) return;
    
    const now = new Date();
    const currMonth = now.getMonth() + 1;
    const currYear = now.getFullYear();
    
    let totalRevenue = 0;
    
    if (state.payments) {
        state.payments.forEach(p => {
            if (p.date) {
                const parts = p.date.split('-');
                if (parts.length >= 2) {
                    const y = parts[0];
                    const m = parts[1];
                    if (parseInt(y) === currYear && parseInt(m) === currMonth) {
                        totalRevenue += p.amount || 0;
                    }
                }
            }
        });
    }
    
    const goal = state.widgets.salesGoal.monthlyGoal || 1;
    let pct = Math.round((totalRevenue / goal) * 100);
    if (pct > 100) pct = 100;
    
    currTxt.innerText = formatCurrency(totalRevenue);
    pctTxt.innerText = pct + '%';
    
    const offset = 283 - (283 * pct / 100);
    setTimeout(() => {
        bar.style.strokeDashoffset = offset;
    }, 100);
}

// 4. Calculadora
function getSalesCalcHTML() {
    return `
    <div class="widget-card dashboard-panel size-small" id="widget-salesCalc" data-widget-key="salesCalc">
        <div class="widget-header" style="border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 6px; margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between;">
            <h3 style="margin: 0; display: flex; align-items: center; gap: 6px; width: 100%;"><i data-lucide="calculator"></i> Calc. Rápida <span style="font-size: 0.65rem; font-family: monospace; background: rgba(0,240,255,0.08); color: var(--color-primary); border: 1px solid rgba(0,240,255,0.2); padding: 2px 6px; border-radius: 4px; font-weight: bold; margin-left: auto;">COD: WID-04</span></h3>
        </div>
        <div class="widget-body">
            <div class="sales-calc-widget">
                <div class="sales-calc-display" id="widget-calc-display">0</div>
                <div class="sales-calc-grid">
                    <button class="sales-calc-btn" onclick="window.calcPress('7')">7</button>
                    <button class="sales-calc-btn" onclick="window.calcPress('8')">8</button>
                    <button class="sales-calc-btn" onclick="window.calcPress('9')">9</button>
                    <button class="sales-calc-btn op" onclick="window.calcPress('/')">/</button>
                    
                    <button class="sales-calc-btn" onclick="window.calcPress('4')">4</button>
                    <button class="sales-calc-btn" onclick="window.calcPress('5')">5</button>
                    <button class="sales-calc-btn" onclick="window.calcPress('6')">6</button>
                    <button class="sales-calc-btn op" onclick="window.calcPress('*')">x</button>
                    
                    <button class="sales-calc-btn" onclick="window.calcPress('1')">1</button>
                    <button class="sales-calc-btn" onclick="window.calcPress('2')">2</button>
                    <button class="sales-calc-btn" onclick="window.calcPress('3')">3</button>
                    <button class="sales-calc-btn op" onclick="window.calcPress('-')">-</button>
                    
                    <button class="sales-calc-btn" onclick="window.calcPress('C')">C</button>
                    <button class="sales-calc-btn" onclick="window.calcPress('0')">0</button>
                    <button class="sales-calc-btn eq" onclick="window.calcPress('=')">=</button>
                    <button class="sales-calc-btn op" onclick="window.calcPress('+')">+</button>
                </div>
            </div>
        </div>
    </div>`;
}

function initSalesCalcLogic() {
    let expression = '';
    const display = document.getElementById('widget-calc-display');
    
    window.calcPress = function(val) {
        if (!display) return;
        
        if (val === 'C') {
            expression = '';
            display.innerText = '0';
            return;
        }
        
        if (val === '=') {
            try {
                let res = new Function('return ' + expression)();
                expression = String(res);
                display.innerText = expression;
            } catch(e) {
                display.innerText = 'Erro';
                expression = '';
            }
            return;
        }
        
        expression += val;
        display.innerText = expression;
    };
}

// 5. Bloco de Notas
function getNotepadHTML(theme) {
    return `
    <div class="widget-card dashboard-panel size-medium" id="widget-notepad" data-widget-key="notepad">
        <div class="widget-header" style="border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 6px; margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 6px; width: 100%;">
            <h3 style="margin: 0; display: flex; align-items: center; gap: 6px;"><i data-lucide="pen-tool"></i> Lembretes Rápidos</h3>
            <span style="font-size: 0.7rem; color: var(--color-text-muted); margin-left: 6px;">Salvo na nuvem</span>
            <span style="font-size: 0.65rem; font-family: monospace; background: rgba(0,240,255,0.08); color: var(--color-primary); border: 1px solid rgba(0,240,255,0.2); padding: 2px 6px; border-radius: 4px; font-weight: bold; margin-left: auto;">COD: WID-05</span>
        </div>
        <div class="widget-body" style="align-items: stretch;">
            <div class="${theme}" style="flex:1; display:flex; flex-direction:column;">
                <textarea class="widget-notepad-textarea" id="widget-notepad-input" placeholder="Digite seus recados aqui... O sistema salva automaticamente." onblur="window.saveNotepad(this.value)">${state.widgets.notepad.text || ''}</textarea>
            </div>
        </div>
    </div>`;
}

window.saveNotepad = function(value) {
    if (state.widgets && state.widgets.notepad) {
        state.widgets.notepad.text = value;
        saveState();
    }
};

// ============================================================================
// DRAG & DROP LOGIC
// ============================================================================
export function initWidgetDragAndDrop() {
    const container = document.getElementById('widgets-container');
    if (!container) return;
    
    // Se o layout não for "fixed", desativa a lógica de drag & drop nativa do widgets.js
    // para evitar conflitos com a lógica de layout do layout.js
    if (state.layoutSettings && state.layoutSettings.mode && state.layoutSettings.mode !== 'fixed') {
        return;
    }
    
    let draggedKey = null;

    container.addEventListener('dragstart', (e) => {
        if (state.layoutSettings && state.layoutSettings.mode && state.layoutSettings.mode !== 'fixed') {
            return;
        }
        const card = e.target.closest('.widget-card');
        if (card) {
            draggedKey = card.getAttribute('data-widget-key');
            card.classList.add('widget-dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', draggedKey);
        }
    });

    container.addEventListener('dragend', (e) => {
        if (state.layoutSettings && state.layoutSettings.mode && state.layoutSettings.mode !== 'fixed') {
            return;
        }
        const card = e.target.closest('.widget-card');
        if (card) {
            card.classList.remove('widget-dragging');
        }
        document.querySelectorAll('.widget-card').forEach(c => c.classList.remove('drag-over'));
    });

    container.addEventListener('dragover', (e) => {
        if (state.layoutSettings && state.layoutSettings.mode && state.layoutSettings.mode !== 'fixed') {
            return;
        }
        e.preventDefault();
        const card = e.target.closest('.widget-card');
        if (card && card.getAttribute('data-widget-key') !== draggedKey) {
            card.classList.add('drag-over');
        }
    });

    container.addEventListener('dragleave', (e) => {
        if (state.layoutSettings && state.layoutSettings.mode && state.layoutSettings.mode !== 'fixed') {
            return;
        }
        const card = e.target.closest('.widget-card');
        if (card) {
            card.classList.remove('drag-over');
        }
    });

    container.addEventListener('drop', (e) => {
        if (state.layoutSettings && state.layoutSettings.mode && state.layoutSettings.mode !== 'fixed') {
            return;
        }
        e.preventDefault();
        const targetCard = e.target.closest('.widget-card');
        if (!targetCard) return;
        
        const targetKey = targetCard.getAttribute('data-widget-key');
        if (draggedKey && targetKey && draggedKey !== targetKey) {
            const fromIdx = state.widgetOrder.indexOf(draggedKey);
            const toIdx = state.widgetOrder.indexOf(targetKey);
            
            if (fromIdx > -1 && toIdx > -1) {
                // Swap position in layout array
                state.widgetOrder.splice(fromIdx, 1);
                state.widgetOrder.splice(toIdx, 0, draggedKey);
                saveState();
                renderWidgets();
            }
        }
    });
}

// 6. Aniversariantes da Semana
function getBirthdaysHTML() {
    const today = new Date();
    const todayYear = today.getFullYear();
    
    // Obter data de início e fim da semana corrente (de domingo a sábado)
    const currentDayOfWeek = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - currentDayOfWeek);
    startOfWeek.setHours(0,0,0,0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23,59,59,999);

    const upcomingBirthdays = [];

    (state.clients || []).forEach(c => {
        if (!c.birthDate) return;
        
        const parts = c.birthDate.split('-');
        if (parts.length !== 3) return;
        const bMonth = parseInt(parts[1]) - 1;
        const bDay = parseInt(parts[2]);

        const bdateThisYear = new Date(todayYear, bMonth, bDay);
        
        let isThisWeek = false;
        let targetBdate = bdateThisYear;
        
        if (bdateThisYear >= startOfWeek && bdateThisYear <= endOfWeek) {
            isThisWeek = true;
        } else {
            const bdateNextYear = new Date(todayYear + 1, bMonth, bDay);
            if (bdateNextYear >= startOfWeek && bdateNextYear <= endOfWeek) {
                isThisWeek = true;
                targetBdate = bdateNextYear;
            }
            const bdatePrevYear = new Date(todayYear - 1, bMonth, bDay);
            if (bdatePrevYear >= startOfWeek && bdatePrevYear <= endOfWeek) {
                isThisWeek = true;
                targetBdate = bdatePrevYear;
            }
        }

        if (isThisWeek) {
            const weekdays = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
            const dayName = weekdays[targetBdate.getDay()];
            
            upcomingBirthdays.push({
                clientName: c.name,
                fantasyName: c.fantasyName,
                phone: c.phone,
                dateStr: `${String(bDay).padStart(2, '0')}/${String(bMonth + 1).padStart(2, '0')}`,
                dayName: dayName,
                dayIndex: targetBdate.getDay(),
                bDay: bDay
            });
        }
    });

    upcomingBirthdays.sort((a, b) => a.dayIndex - b.dayIndex);

    let listHTML = '';
    if (upcomingBirthdays.length === 0) {
        listHTML = `
            <div style="text-align: center; padding: 15px; color: var(--color-text-muted); font-size: 0.78rem;">
                🎂 Nenhum aniversariante nesta semana.
            </div>
        `;
    } else {
        listHTML = upcomingBirthdays.map(b => {
            const displayName = b.fantasyName || b.clientName;
            const waButton = b.phone ? `
                <a href="https://api.whatsapp.com/send?phone=55${b.phone.replace(/\D/g,'')}&text=Parab%C3%A9ns,%20${encodeURIComponent(displayName)}!%20Desejamos%20muito%20sucesso%20e%20parceria%20com%20a%20Gelo%20do%20Vale.%20%F0%9F%8E%82%F0%9F%8E%89" target="_blank" class="btn btn-secondary btn-icon-only" style="padding: 2px; width: 22px; height: 22px; border-color: rgba(0,240,255,0.2); background: rgba(0,240,255,0.05); color: #00f0ff; display: inline-flex; align-items: center; justify-content: center;" title="Enviar parabéns">
                    <i data-lucide="message-circle" style="width: 12px; height: 12px;"></i>
                </a>
            ` : '';
            
            return `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 8px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.04); border-radius: 6px; font-size: 0.78rem;">
                    <div style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-right: 8px;">
                        <strong style="color: #fff; display: block; overflow: hidden; text-overflow: ellipsis;">${displayName}</strong>
                        <span style="color: var(--color-text-muted); font-size: 0.7rem;">${b.dayName} (${b.dateStr})</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 6px; flex-shrink: 0;">
                        <span class="status-badge completed" style="font-size: 0.65rem; background: rgba(16, 185, 129, 0.1); color: #10b981; padding: 2px 5px;">🎂 Parabéns</span>
                        ${waButton}
                    </div>
                </div>
            `;
        }).join('');
    }

    return `
        <div class="widget-card dashboard-panel size-small" id="widget-birthdays" data-widget-key="birthdays">
            <div class="widget-header" style="border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 6px; display: flex; align-items: center; justify-content: space-between;">
                <h3 style="margin: 0; display: flex; align-items: center; gap: 6px; width: 100%;"><i data-lucide="cake" style="color: #ff5e00;"></i> Aniversários da Semana <span style="font-size: 0.65rem; font-family: monospace; background: rgba(0,240,255,0.08); color: var(--color-primary); border: 1px solid rgba(0,240,255,0.2); padding: 2px 6px; border-radius: 4px; font-weight: bold; margin-left: auto;">COD: WID-06</span></h3>
            </div>
            <div class="widget-body" style="padding: 10px; display: flex; flex-direction: column; gap: 6px; max-height: 220px; overflow-y: auto;">
                ${listHTML}
            </div>
        </div>
    `;
}
