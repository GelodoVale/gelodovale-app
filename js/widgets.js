import { state, saveState, saveStateLocalOnly } from './state.js';
import { formatCurrency } from './utils.js';

// Inicialização de Estado Padrão dos Widgets
function initWidgetsState() {
    if (!state.widgets) state.widgets = {};
    if (!state.widgets.clock) state.widgets.clock = { enabled: true, theme: 'analog-neon' };
    if (!state.widgets.weather) state.widgets.weather = { enabled: true, location: '' };
    if (!state.widgets.notepad) state.widgets.notepad = { enabled: true, theme: 'notepad-glass-sticky', text: '' };
    if (!state.widgets.salesCalc) state.widgets.salesCalc = { enabled: true };
    if (!state.widgets.salesGoal) state.widgets.salesGoal = { enabled: true, monthlyGoal: 10000 };
}

// ============================================================================
// SETUP PANEL (Configurações)
// ============================================================================
export function renderWidgetsSetupPanel() {
    initWidgetsState();
    const panel = document.getElementById('widgets-setup-panel');
    if (!panel) return;

    panel.innerHTML = `
        <div class="widget-setup-item">
            <div class="widget-setup-info">
                <span class="widget-setup-name">Relógio</span>
                <span class="widget-setup-desc">Mostra a hora e a data atual no dashboard.</span>
            </div>
            <div class="widget-setup-actions">
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
            </div>
        </div>

        <div class="widget-setup-item">
            <div class="widget-setup-info">
                <span class="widget-setup-name">Clima</span>
                <span class="widget-setup-desc">Temperatura local. Digite sua cidade para forçar o local (Ex: São Paulo, SP).</span>
            </div>
            <div class="widget-setup-actions">
                <input type="text" class="widget-style-select" style="width: 150px;" value="${state.widgets.weather.location || ''}" onchange="window.updateWidgetConfig('weather', 'location', this.value)" placeholder="Sua Cidade">
                <button type="button" class="btn ${state.widgets.weather.enabled ? 'btn-danger' : 'btn-success'} btn-sm" onclick="window.toggleWidget('weather')">
                    ${state.widgets.weather.enabled ? 'Desativar' : 'Ativar'}
                </button>
            </div>
        </div>

        <div class="widget-setup-item">
            <div class="widget-setup-info">
                <span class="widget-setup-name">Bloco de Notas</span>
                <span class="widget-setup-desc">Anotações rápidas salvas em nuvem.</span>
            </div>
            <div class="widget-setup-actions">
                <select class="widget-style-select" id="cfg-widget-notepad-theme" onchange="window.updateWidgetConfig('notepad', 'theme', this.value)">
                    <option value="notepad-glass-sticky" ${state.widgets.notepad.theme === 'notepad-glass-sticky' ? 'selected' : ''}>Vidro Neon</option>
                    <option value="notepad-yellow-pad" ${state.widgets.notepad.theme === 'notepad-yellow-pad' ? 'selected' : ''}>Post-it Amarelo</option>
                    <option value="notepad-terminal" ${state.widgets.notepad.theme === 'notepad-terminal' ? 'selected' : ''}>Terminal Matrix</option>
                </select>
                <button type="button" class="btn ${state.widgets.notepad.enabled ? 'btn-danger' : 'btn-success'} btn-sm" onclick="window.toggleWidget('notepad')">
                    ${state.widgets.notepad.enabled ? 'Desativar' : 'Ativar'}
                </button>
            </div>
        </div>

        <div class="widget-setup-item">
            <div class="widget-setup-info">
                <span class="widget-setup-name">Calculadora de Vendas</span>
                <span class="widget-setup-desc">Para contas rápidas de troco e peso.</span>
            </div>
            <div class="widget-setup-actions">
                <button type="button" class="btn ${state.widgets.salesCalc.enabled ? 'btn-danger' : 'btn-success'} btn-sm" onclick="window.toggleWidget('salesCalc')">
                    ${state.widgets.salesCalc.enabled ? 'Desativar' : 'Ativar'}
                </button>
            </div>
        </div>

        <div class="widget-setup-item">
            <div class="widget-setup-info">
                <span class="widget-setup-name">Progresso de Meta (Faturamento Mensal)</span>
                <span class="widget-setup-desc">Visualizador circular de meta de faturamento.</span>
            </div>
            <div class="widget-setup-actions">
                <input type="number" class="widget-style-select" style="width: 100px; text-align: right;" value="${state.widgets.salesGoal.monthlyGoal}" onchange="window.updateWidgetConfig('salesGoal', 'monthlyGoal', Number(this.value))" placeholder="R$ Meta">
                <button type="button" class="btn ${state.widgets.salesGoal.enabled ? 'btn-danger' : 'btn-success'} btn-sm" onclick="window.toggleWidget('salesGoal')">
                    ${state.widgets.salesGoal.enabled ? 'Desativar' : 'Ativar'}
                </button>
            </div>
        </div>
    `;
}

window.toggleWidget = function(widgetName) {
    if (state.widgets[widgetName]) {
        state.widgets[widgetName].enabled = !state.widgets[widgetName].enabled;
        saveState();
        renderWidgetsSetupPanel();
        renderWidgets();
    }
};

window.updateWidgetConfig = function(widgetName, key, value) {
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

    if (state.widgets.clock.enabled) {
        html += getClockHTML(state.widgets.clock.theme);
    }
    if (state.widgets.weather.enabled) {
        html += getWeatherHTML();
    }
    if (state.widgets.salesGoal.enabled) {
        html += getSalesGoalHTML();
    }
    if (state.widgets.salesCalc.enabled) {
        html += getSalesCalcHTML();
    }
    if (state.widgets.notepad.enabled) {
        html += getNotepadHTML(state.widgets.notepad.theme);
    }

    container.innerHTML = html;

    // Inicializar lógicas ativas
    if (state.widgets.clock.enabled) initClockLogic(state.widgets.clock.theme);
    if (state.widgets.weather.enabled) initWeatherLogic();
    if (state.widgets.salesGoal.enabled) initSalesGoalLogic();
    if (state.widgets.salesCalc.enabled) initSalesCalcLogic();
    // Notepad icones SVG e bindings
    if (window.lucide) window.lucide.createIcons();
}

// 1. Relógio
function getClockHTML(theme) {
    const isDigital = theme.startsWith('digital');
    if (isDigital) {
        return `
        <div class="widget-card size-small">
            <div class="widget-header"><h3><i data-lucide="clock"></i> Relógio Local</h3></div>
            <div class="widget-body">
                <div class="digital-clock-widget ${theme}">
                    <div class="digital-clock-time" id="widget-digital-time">00:00:00</div>
                    <div class="digital-clock-date" id="widget-digital-date">Carregando...</div>
                </div>
            </div>
        </div>`;
    } else {
        return `
        <div class="widget-card size-small">
            <div class="widget-header"><h3><i data-lucide="clock"></i> Horário</h3></div>
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
    <div class="widget-card size-small">
        <div class="widget-header"><h3><i data-lucide="cloud"></i> Clima</h3></div>
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
                return; // done
            } else {
                content.innerHTML = '<div style="text-align:center; padding: 20px; font-size: 0.85rem; color: #888;">Cidade não encontrada. Tente "Nome da Cidade, Sigla do Estado".</div>';
                return;
            }
        } catch(e) {
            console.error(e);
            // fallback if geocoding fails
        }
    }
    
    // Fallbacks to standard SP coords if factory settings not found or geolocation fails
    let lat = -23.1895; 
    let lon = -45.8841; // Sao Jose dos Campos SP
    
    try {
        // Try to get user location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(async (pos) => {
                lat = pos.coords.latitude;
                lon = pos.coords.longitude;
                fetchWeatherData(lat, lon, "Auto (GPS)", content);
            }, () => {
                fetchWeatherData(lat, lon, "São José dos Campos", content); // fallback
            });
        } else {
            fetchWeatherData(lat, lon, "São José dos Campos", content); // fallback
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
            
            // Simple logic for weather condition
            let condition = "Céu Limpo";
            let icon = "sun";
            if (code >= 1 && code <= 3) { condition = "Parcialmente Nublado"; icon = "cloud"; }
            else if (code >= 45 && code <= 48) { condition = "Neblina"; icon = "cloud-fog"; }
            else if (code >= 51 && code <= 67) { condition = "Chuva"; icon = "cloud-rain"; }
            else if (code >= 71 && code <= 77) { condition = "Neve"; icon = "cloud-snow"; }
            else if (code >= 80 && code <= 82) { condition = "Pancadas de Chuva"; icon = "cloud-rain"; }
            else if (code >= 95) { condition = "Tempestade"; icon = "cloud-lightning"; }
            
            // is_day specific icons
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

            // Sincronizar com o estado global para o painel de demanda do dashboard
            if (!state.weatherConfig) state.weatherConfig = {};
            state.weatherConfig.temp = temp;
            state.weatherConfig.condition = icon;
            state.weatherConfig.city = locationName;
            saveStateLocalOnly();

            // Atualizar o painel de alertas do dashboard em tempo real se a tela estiver aberta
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
    <div class="widget-card size-small">
        <div class="widget-header"><h3><i data-lucide="target"></i> Meta do Mês</h3></div>
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
    
    // Calculate current revenue for the current month
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
    
    // Animation for circular bar (circumference is ~283)
    const offset = 283 - (283 * pct / 100);
    setTimeout(() => {
        bar.style.strokeDashoffset = offset;
    }, 100);
}

// 4. Calculadora
function getSalesCalcHTML() {
    return `
    <div class="widget-card size-small">
        <div class="widget-header"><h3><i data-lucide="calculator"></i> Calc. Rápida</h3></div>
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
                // simple math evaluation (safe for just these buttons)
                // eslint-disable-next-line
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
    <div class="widget-card size-medium">
        <div class="widget-header">
            <h3><i data-lucide="pen-tool"></i> Lembretes Rápidos</h3>
            <span style="font-size: 0.7rem; color: var(--color-text-muted);">Salvo na nuvem</span>
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
