import { state, saveState } from './state.js';

// Calendar and Panel States
export let currentCalendarYear = new Date().getFullYear();
export let currentCalendarMonth = new Date().getMonth();
export let selectedCalendarDateStr = "";

// Helper de Fuso Horário (Registro/SP)
export function getBrazilTimeISO() {
    const brTime = new Date().toLocaleString("en-US", {timeZone: "America/Sao_Paulo"});
    const d = new Date(brTime);
    // Cria formato ISO manual com base no fuso SP para evitar a conversão do toISOString para UTC
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.000-03:00`;
}

export function formatDateBrazil(dateStr) {
    if (!dateStr) return "";
    const options = { timeZone: 'America/Sao_Paulo' };
    const dateObj = new Date(dateStr);
    return dateObj.toLocaleDateString('pt-BR', options);
}

export function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
}

const WEATHER_CONDITIONS = {
    sun: { desc: "Ensolarado", icon: "sun", color: "#eab308" },
    cloud: { desc: "Nublado", icon: "cloud", color: "#94a3b8" },
    "cloud-rain": { desc: "Chuvoso", icon: "cloud-rain", color: "#60a5fa" },
    "cloud-lightning": { desc: "Tempestade", icon: "cloud-lightning", color: "#a855f7" },
    wind: { desc: "Ventania", icon: "wind", color: "#38bdf8" }
};

export function extractDailyForecast(weatherData) {
    let dailyForecast = [];
    if (weatherData && weatherData.daily && weatherData.daily.time) {
        for (let i = 0; i < weatherData.daily.time.length; i++) {
            const dateStr = weatherData.daily.time[i];
            const max = Math.round(weatherData.daily.temperature_2m_max[i]);
            const min = Math.round(weatherData.daily.temperature_2m_min[i]);
            const code = weatherData.daily.weather_code[i];
            let condition = "sun";
            if (code === 0) {
                condition = "sun";
            } else if ([1, 2, 3, 45, 48].includes(code)) {
                condition = "cloud";
            } else if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
                condition = "cloud-rain";
            } else if ([95, 96, 99].includes(code)) {
                condition = "cloud-lightning";
            } else {
                condition = "wind";
            }
            dailyForecast.push({ date: dateStr, max, min, condition });
        }
    }
    return dailyForecast;
}

const WEATHER_REGIONAL_FALLBACKS = {
    "registro": [
        { name: "Juquiá - SP", lat: -24.3200, lon: -47.6353 },
        { name: "Jacupiranga - SP", lat: -24.6942, lon: -48.0028 },
        { name: "Eldorado - SP", lat: -24.5211, lon: -48.1078 },
        { name: "Sete Barras - SP", lat: -24.3908, lon: -47.9250 },
        { name: "Pariquera-Açu - SP", lat: -24.7153, lon: -47.8822 },
        { name: "Iguape - SP", lat: -24.7081, lon: -47.5553 },
        { name: "Cananéia - SP", lat: -25.0147, lon: -47.9272 }
    ],
    "s.j. campos": [
        { name: "Jacareí - SP", lat: -23.3056, lon: -45.9658 },
        { name: "Caçapava - SP", lat: -23.1022, lon: -45.7072 },
        { name: "Taubaté - SP", lat: -23.0264, lon: -45.5558 },
        { name: "Monteiro Lobato - SP", lat: -22.9575, lon: -45.8406 },
        { name: "Tremembé - SP", lat: -22.9589, lon: -45.5517 }
    ],
    "são josé dos campos": [
        { name: "Jacareí - SP", lat: -23.3056, lon: -45.9658 },
        { name: "Caçapava - SP", lat: -23.1022, lon: -45.7072 },
        { name: "Taubaté - SP", lat: -23.0264, lon: -45.5558 },
        { name: "Monteiro Lobato - SP", lat: -22.9575, lon: -45.8406 },
        { name: "Tremembé - SP", lat: -22.9589, lon: -45.5517 }
    ],
    "campos do jordão": [
        { name: "S.J. Campos - SP", lat: -23.1791, lon: -45.8872 },
        { name: "Pindamonhangaba - SP", lat: -22.9258, lon: -45.4611 },
        { name: "Santo Antônio do Pinhal - SP", lat: -22.8272, lon: -45.6672 }
    ]
};

const MONTH_NAMES = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

let currentNeighborsAbortController = null;

export function initUtilityPanel() {
    // 1. Iniciar relógio
    updateClocks();
    setInterval(updateClocks, 1000);

    // 2. Renderizar clima inicial e atualizar com API se online
    renderWeather();
    if (navigator.onLine) {
        updateWeatherFromAPI();
    }
    // Auto-sincronizar clima a cada 15 minutos se online
    setInterval(() => {
        if (navigator.onLine) {
            updateWeatherFromAPI();
        }
    }, 15 * 60 * 1000);

    // 3. Inicializar bloco de notas geral
    const notepad = document.getElementById("general-notepad");
    if (notepad) {
        notepad.value = state.notepadText || "";
        notepad.addEventListener("input", (e) => {
            state.notepadText = e.target.value;
            saveState();
            const status = document.getElementById("notepad-status");
            if (status) {
                status.innerText = "Salvando...";
                setTimeout(() => {
                    status.innerText = "Salvo localmente";
                }, 500);
            }
        });
    }

    // 4. Renderizar calendário inicial
    renderCalendar(currentCalendarYear, currentCalendarMonth);

    // 5. Configurar listener do botão de alternância do painel
    const btnToggle = document.getElementById("btn-toggle-utility");
    if (btnToggle) {
        btnToggle.addEventListener("click", toggleUtilityDrawer);
    }

    // 6. Fechar dropdowns de clima ao clicar fora
    document.addEventListener("click", (e) => {
        const dropdown = document.getElementById("weather-cities-dropdown");
        const configMenu = document.getElementById("weather-config-menu");
        
        // Se clicar fora do dropdown de cidades e do trigger, fechar
        if (dropdown && dropdown.style.display === "block") {
            const trigger = e.target.closest('[onclick^="toggleWeatherCitiesList"]');
            if (!dropdown.contains(e.target) && !trigger) {
                dropdown.style.display = "none";
            }
        }
        
        // Se clicar fora do menu de configuração e do trigger, fechar
        if (configMenu && configMenu.style.display === "block") {
            const trigger = e.target.closest('[onclick="toggleWeatherConfig()"]');
            if (!configMenu.contains(e.target) && !trigger) {
                configMenu.style.display = "none";
            }
        }
    });
}

export function toggleUtilityDrawer() {
    const drawer = document.getElementById("utility-drawer");
    const backdrop = document.getElementById("utility-drawer-backdrop");
    if (drawer && backdrop) {
        const isActive = drawer.classList.contains("active");
        if (isActive) {
            drawer.classList.remove("active");
            backdrop.classList.remove("active");
        } else {
            drawer.classList.add("active");
            backdrop.classList.add("active");
            // Atualizar ícones do Lucide dentro do drawer
            if (window.lucide) window.lucide.createIcons();
        }
    }
}

export function updateClocks() {
    const now = new Date();
    
    // 1. Mini-relógio no cabeçalho (HH:MM)
    const miniClock = document.getElementById("header-mini-clock");
    if (miniClock) {
        const hrs = String(now.getHours()).padStart(2, '0');
        const mins = String(now.getMinutes()).padStart(2, '0');
        miniClock.innerText = `${hrs}:${mins}`;
    }

    // 2. Relógio grande no drawer (HH:MM:SS)
    const drawerClock = document.getElementById("drawer-clock");
    if (drawerClock) {
        const hrs = String(now.getHours()).padStart(2, '0');
        const mins = String(now.getMinutes()).padStart(2, '0');
        const secs = String(now.getSeconds()).padStart(2, '0');
        drawerClock.innerText = `${hrs}:${mins}:${secs}`;
    }

    // 3. Data por extenso no drawer
    const drawerDate = document.getElementById("drawer-date");
    if (drawerDate) {
        const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
        let dateStr = now.toLocaleDateString('pt-BR', options);
        dateStr = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
        drawerDate.innerText = dateStr;
    }
}

function getStaticFallbackCities(cityName) {
    if (!cityName) return [];
    const cleanName = cityName.toLowerCase().trim();
    for (const key in WEATHER_REGIONAL_FALLBACKS) {
        if (cleanName.includes(key) || key.includes(cleanName)) {
            return WEATHER_REGIONAL_FALLBACKS[key];
        }
    }
    return [];
}

async function updateNeighboringCities(lat, lon, cityName) {
    const listEl = document.getElementById("weather-cities-dropdown-list");
    if (!listEl) return;

    if (!lat || !lon) {
        const fallbacks = getStaticFallbackCities(cityName);
        renderNeighborList(fallbacks);
        return;
    }

    if (currentNeighborsAbortController) {
        currentNeighborsAbortController.abort();
    }
    currentNeighborsAbortController = new AbortController();

    const fallbackList = getStaticFallbackCities(cityName);
    renderNeighborList(fallbackList);

    if (!navigator.onLine) {
        return;
    }

    try {
        const overpassQuery = `[out:json][timeout:5];(node["place"~"city|town"](around:45000,${lat},${lon}););out 12;`;
        const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`;
        
        const res = await fetch(url, { signal: currentNeighborsAbortController.signal });
        const data = await res.json();
        
        if (data && data.elements) {
            const list = [];
            const activeCityClean = cityName.split(" - ")[0].toLowerCase().trim();
            const seen = new Set();
            seen.add(activeCityClean);

            for (const elem of data.elements) {
                if (elem.tags && elem.tags.name) {
                    const name = elem.tags.name;
                    const cleanName = name.toLowerCase().trim();
                    if (!seen.has(cleanName)) {
                        seen.add(cleanName);
                        const stateAbbr = cityName.includes(" - RJ") ? "RJ" : 
                                          cityName.includes(" - MG") ? "MG" : "SP";
                        list.push({
                            name: `${name} - ${stateAbbr}`,
                            lat: elem.lat,
                            lon: elem.lon
                        });
                    }
                }
                if (list.length >= 6) break;
            }

            if (list.length > 0) {
                renderNeighborList(list);
            }
        }
    } catch (e) {
        if (e.name !== 'AbortError') {
            console.error("Erro ao buscar cidades vizinhas da API, mantendo fallbacks:", e);
        }
    }
}

function renderNeighborList(cities) {
    const listEl = document.getElementById("weather-cities-dropdown-list");
    if (!listEl) return;
    listEl.innerHTML = "";
    
    if (cities.length === 0) {
        const emptyEl = document.createElement("div");
        emptyEl.style.fontSize = "0.7rem";
        emptyEl.style.color = "var(--color-text-muted)";
        emptyEl.style.padding = "6px 8px";
        emptyEl.innerText = "Nenhuma cidade próxima";
        listEl.appendChild(emptyEl);
        return;
    }
    
    cities.forEach(city => {
        const item = document.createElement("button");
        item.type = "button";
        item.className = "weather-dropdown-item";
        item.innerText = city.name.split(" - ")[0];
        item.title = `Ver clima de ${city.name}`;
        item.onclick = (e) => {
            e.stopPropagation();
            selectNeighborCity(city.name, city.lat, city.lon);
            const dropdown = document.getElementById("weather-cities-dropdown");
            if (dropdown) dropdown.style.display = "none";
        };
        listEl.appendChild(item);
    });
}

export async function selectNeighborCity(cityName, lat, lon) {
    const iconSync = document.getElementById("icon-sync-weather");
    if (iconSync) iconSync.classList.add("spin-anim");

    try {
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,is_day&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto`;
        const weatherRes = await fetch(weatherUrl);
        const weatherData = await weatherRes.json();
        
        if (weatherData && weatherData.current) {
            const temp = Math.round(weatherData.current.temperature_2m);
            const code = weatherData.current.weather_code;
            const isDay = weatherData.current.is_day;
            
            let condition = "sun";
            if (code === 0) {
                condition = "sun";
            } else if ([1, 2, 3, 45, 48].includes(code)) {
                condition = "cloud";
            } else if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
                condition = "cloud-rain";
            } else if ([95, 96, 99].includes(code)) {
                condition = "cloud-lightning";
            } else {
                condition = "wind";
            }
            
            state.weatherForecast = extractDailyForecast(weatherData);
            state.weatherConfig = { city: cityName, temp, condition, lat, lon, isDay };
            saveState();
            renderWeather();

            // Sincronizar inputs visuais se menu aberto
            const inputCity = document.getElementById("weather-city-input");
            const inputTemp = document.getElementById("weather-temp-input");
            const selectCond = document.getElementById("weather-cond-select");
            if (inputCity) inputCity.value = cityName;
            if (inputTemp) inputTemp.value = temp;
            if (selectCond) selectCond.value = condition;
        }
    } catch (e) {
        console.error("Falha ao buscar clima da cidade vizinha:", e);
        const currentConfig = state.weatherConfig || {};
        const fallbackIsDay = (new Date().getHours() >= 6 && new Date().getHours() < 18) ? 1 : 0;
        state.weatherConfig = {
            city: cityName,
            temp: currentConfig.temp || 24,
            condition: currentConfig.condition || "sun",
            lat,
            lon,
            isDay: currentConfig.hasOwnProperty("isDay") ? currentConfig.isDay : fallbackIsDay
        };
        saveState();
        renderWeather();
    } finally {
        if (iconSync) {
            setTimeout(() => {
                iconSync.classList.remove("spin-anim");
            }, 500);
        }
    }
}

export async function syncWeatherManual() {
    const iconSync = document.getElementById("icon-sync-weather");
    if (iconSync) iconSync.classList.add("spin-anim");
    
    try {
        await updateWeatherFromAPI();
    } catch (e) {
        console.error(e);
    } finally {
        setTimeout(() => {
            if (iconSync) iconSync.classList.remove("spin-anim");
        }, 800);
    }
}

export function renderWeather() {
    const config = state.weatherConfig || { city: "S.J. Campos", temp: 24, condition: "sun", lat: -23.1791, lon: -45.8872 };
    const tempEl = document.getElementById("weather-temp");
    const iconContainer = document.getElementById("weather-icon-container");
    const descEl = document.getElementById("weather-desc");

    // Determinar dia vs noite
    let isDay = true;
    if (config.hasOwnProperty("isDay") && config.isDay !== null && config.isDay !== undefined) {
        isDay = (config.isDay === 1 || config.isDay === true || String(config.isDay) === "1");
    } else {
        const hour = new Date().getHours();
        isDay = (hour >= 6 && hour < 18);
    }

    const cond = WEATHER_CONDITIONS[config.condition] || WEATHER_CONDITIONS.sun;
    let iconName = cond.icon;
    let iconColor = cond.color;
    let descText = cond.desc;

    if (!isDay) {
        if (config.condition === "sun") {
            iconName = "moon";
            iconColor = "#cbd5e1";
            descText = "Noite Limpa";
        } else if (config.condition === "cloud") {
            iconName = "cloud-moon";
            iconColor = "#94a3b8";
            descText = "Noite Nublada";
        }
    }

    if (tempEl) tempEl.innerText = `${config.temp}°C`;
    if (descEl) {
        descEl.innerHTML = `${descText} - <span id="weather-city-name" style="cursor: pointer; border-bottom: 1px dotted var(--color-primary); color: #fff; font-weight: 500;" onclick="toggleWeatherCitiesList(event)">${config.city}</span>`;
    }
    if (iconContainer) {
        iconContainer.innerHTML = `<i data-lucide="${iconName}" style="width: 20px; height: 20px; color: ${iconColor};"></i>`;
        if (window.lucide) window.lucide.createIcons();
    }

    // Aplicar temas baseados no clima reativo e ciclo dia/noite (Astro-Reativo)
    const weatherThemeEnabled = state.appearance && state.appearance.weatherThemeEnabled !== false;
    document.body.classList.remove('weather-hot', 'weather-cold', 'weather-mild', 'astro-day', 'astro-night');
    
    // Ciclo Dia & Noite
    const hour = new Date().getHours();
    const isAstroDay = (hour >= 6 && hour < 18);
    if (isAstroDay) {
        document.body.classList.add('astro-day');
    } else {
        document.body.classList.add('astro-night');
    }

    if (weatherThemeEnabled) {
        if (config.temp >= 30) {
            document.body.classList.add('weather-hot');
        } else if (config.temp <= 18) {
            document.body.classList.add('weather-cold');
        } else {
            document.body.classList.add('weather-mild');
        }
    }

    // Carregar/atualizar a lista de cidades vizinhas
    updateNeighboringCities(config.lat, config.lon, config.city);
}

export function toggleWeatherCitiesList(event) {
    if (event) event.stopPropagation();
    const dropdown = document.getElementById("weather-cities-dropdown");
    if (dropdown) {
        const isHidden = dropdown.style.display === "none" || !dropdown.style.display;
        dropdown.style.display = isHidden ? "block" : "none";
        
        if (isHidden) {
            const configMenu = document.getElementById("weather-config-menu");
            if (configMenu) configMenu.style.display = "none";
        }
    }
}

export function toggleWeatherConfig() {
    const menu = document.getElementById("weather-config-menu");
    if (menu) {
        const isHidden = menu.style.display === "none" || !menu.style.display;
        menu.style.display = isHidden ? "block" : "none";
        
        if (isHidden) {
            const config = state.weatherConfig || { city: "S.J. Campos", temp: 24, condition: "sun", lat: -23.1791, lon: -45.8872 };
            document.getElementById("weather-city-input").value = config.city;
            document.getElementById("weather-temp-input").value = config.temp;
            document.getElementById("weather-cond-select").value = config.condition;
            
            const dropdown = document.getElementById("weather-cities-dropdown");
            if (dropdown) dropdown.style.display = "none";
        }
    }
}

export async function saveWeatherConfig() {
    const cityInput = document.getElementById("weather-city-input").value.trim() || "S.J. Campos";
    const tempInput = parseInt(document.getElementById("weather-temp-input").value) || 24;
    const conditionInput = document.getElementById("weather-cond-select").value;

    const menu = document.getElementById("weather-config-menu");
    const confirmBtn = menu ? menu.querySelector("button.btn-primary") : null;
    const originalText = confirmBtn ? confirmBtn.innerHTML : "Confirmar";

    if (navigator.onLine) {
        if (confirmBtn) confirmBtn.innerHTML = "Buscando...";
        try {
            const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityInput)}&count=1&language=pt`;
            const geoRes = await fetch(geoUrl);
            const geoData = await geoRes.json();
            
            if (geoData.results && geoData.results.length > 0) {
                const result = geoData.results[0];
                const lat = result.latitude;
                const lon = result.longitude;
                let resolvedCityName = result.name;
                
                if (result.admin1) {
                    const stateName = result.admin1;
                    const stateAbbr = stateName === "São Paulo" ? "SP" : 
                                      stateName === "Rio de Janeiro" ? "RJ" : 
                                      stateName === "Minas Gerais" ? "MG" : 
                                      stateName === "Espírito Santo" ? "ES" : 
                                      stateName === "Paraná" ? "PR" : 
                                      stateName === "Santa Catarina" ? "SC" : 
                                      stateName === "Rio Grande do Sul" ? "RS" : stateName;
                    resolvedCityName += ` - ${stateAbbr}`;
                }

                const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,is_day&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto`;
                const weatherRes = await fetch(weatherUrl);
                const weatherData = await weatherRes.json();
                
                if (weatherData && weatherData.current) {
                    const temp = Math.round(weatherData.current.temperature_2m);
                    const code = weatherData.current.weather_code;
                    const isDay = weatherData.current.is_day;
                    
                    let condition = "sun";
                    if (code === 0) {
                        condition = "sun";
                    } else if ([1, 2, 3, 45, 48].includes(code)) {
                        condition = "cloud";
                    } else if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
                        condition = "cloud-rain";
                    } else if ([95, 96, 99].includes(code)) {
                        condition = "cloud-lightning";
                    } else {
                        condition = "wind";
                    }
                    
                    state.weatherForecast = extractDailyForecast(weatherData);
                    state.weatherConfig = { city: resolvedCityName, temp, condition, lat, lon, isDay };
                    saveState();
                    renderWeather();
                    
                    if (menu) menu.style.display = "none";
                    if (confirmBtn) confirmBtn.innerHTML = originalText;
                    return;
                }
            } else {
                window.showToast(`Cidade "${cityInput}" não foi encontrada online. Aplicando valores inseridos manualmente.`, 'warning');
            }
        } catch (e) {
            console.error("Falha ao buscar clima em tempo real, aplicando manual:", e);
        } finally {
            if (confirmBtn) confirmBtn.innerHTML = originalText;
        }
    }

    const oldConfig = state.weatherConfig || {};
    const preserveCoords = oldConfig.city && oldConfig.city.split(" - ")[0].toLowerCase().trim() === cityInput.toLowerCase().trim();
    const fallbackIsDay = (new Date().getHours() >= 6 && new Date().getHours() < 18) ? 1 : 0;
    state.weatherConfig = {
        city: cityInput,
        temp: tempInput,
        condition: conditionInput,
        lat: preserveCoords ? oldConfig.lat : null,
        lon: preserveCoords ? oldConfig.lon : null,
        isDay: preserveCoords && oldConfig.hasOwnProperty("isDay") ? oldConfig.isDay : fallbackIsDay
    };
    saveState();
    renderWeather();

    if (menu) menu.style.display = "none";
}

export async function updateWeatherFromAPI() {
    if (!navigator.onLine) return;
    const config = state.weatherConfig || { city: "S.J. Campos", temp: 24, condition: "sun", lat: -23.1791, lon: -45.8872 };
    
    try {
        let lat = config.lat;
        let lon = config.lon;
        let resolvedCityName = config.city;

        if (!lat || !lon) {
            const cityNameOnly = config.city.split(" - ")[0];
            const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityNameOnly)}&count=1&language=pt`;
            const geoRes = await fetch(geoUrl);
            const geoData = await geoRes.json();
            
            if (geoData.results && geoData.results.length > 0) {
                const result = geoData.results[0];
                lat = result.latitude;
                lon = result.longitude;
                resolvedCityName = result.name;
                if (result.admin1) {
                    const stateName = result.admin1;
                    const stateAbbr = stateName === "São Paulo" ? "SP" : 
                                      stateName === "Rio de Janeiro" ? "RJ" : 
                                      stateName === "Minas Gerais" ? "MG" : stateName;
                    resolvedCityName += ` - ${stateAbbr}`;
                }
            } else {
                return;
            }
        }

        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,is_day&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto`;
        const weatherRes = await fetch(weatherUrl);
        const weatherData = await weatherRes.json();
        
        if (weatherData && weatherData.current) {
            const temp = Math.round(weatherData.current.temperature_2m);
            const code = weatherData.current.weather_code;
            const isDay = weatherData.current.is_day;
            
            let condition = "sun";
            if (code === 0) {
                condition = "sun";
            } else if ([1, 2, 3, 45, 48].includes(code)) {
                condition = "cloud";
            } else if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
                condition = "cloud-rain";
            } else if ([95, 96, 99].includes(code)) {
                condition = "cloud-lightning";
            } else {
                condition = "wind";
            }
            
            state.weatherForecast = extractDailyForecast(weatherData);
            state.weatherConfig = { city: resolvedCityName, temp, condition, lat, lon, isDay };
            saveState();
            renderWeather();
        }
    } catch (e) {
        console.error("Erro na atualização automática do clima em background:", e);
    }
}

export function detectUserLocation() {
    if (!navigator.geolocation) {
        window.showToast("Seu navegador não oferece suporte para geolocalização.", "error");
        return;
    }

    const btn = document.querySelector("#weather-config-menu button[onclick='detectUserLocation()']");
    const originalText = btn ? btn.innerHTML : "Detectar Local";
    if (btn) {
        btn.innerHTML = "Localizando...";
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        try {
            const revGeoUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=pt`;
            const revGeoRes = await fetch(revGeoUrl);
            const revGeoData = await revGeoRes.json();
            
            let city = "Local Detectado";
            if (revGeoData && revGeoData.address) {
                city = revGeoData.address.city || revGeoData.address.town || revGeoData.address.suburb || "São Paulo";
                if (revGeoData.address.state) {
                    const stateName = revGeoData.address.state;
                    const stateAbbr = stateName === "São Paulo" ? "SP" : 
                                      stateName === "Rio de Janeiro" ? "RJ" : 
                                      stateName === "Minas Gerais" ? "MG" : stateName;
                    city += ` - ${stateAbbr}`;
                }
            }

            const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,is_day&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto`;
            const weatherRes = await fetch(weatherUrl);
            const weatherData = await weatherRes.json();

            if (weatherData && weatherData.current) {
                const temp = Math.round(weatherData.current.temperature_2m);
                const code = weatherData.current.weather_code;
                const isDay = weatherData.current.is_day;

                let condition = "sun";
                if (code === 0) {
                    condition = "sun";
                } else if ([1, 2, 3, 45, 48].includes(code)) {
                    condition = "cloud";
                } else if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
                    condition = "cloud-rain";
                } else if ([95, 96, 99].includes(code)) {
                    condition = "cloud-lightning";
                } else {
                    condition = "wind";
                }

                state.weatherForecast = extractDailyForecast(weatherData);
                state.weatherConfig = { city, temp, condition, lat, lon, isDay };
                saveState();
                renderWeather();

                document.getElementById("weather-city-input").value = city;
                document.getElementById("weather-temp-input").value = temp;
                document.getElementById("weather-cond-select").value = condition;

                window.showToast(`Localização identificada: ${city}`, 'success');
            }
        } catch (e) {
            console.error("Erro na geolocalização reversa, aplicando coordenadas direta:", e);
            try {
                const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,is_day&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto`;
                const weatherRes = await fetch(weatherUrl);
                const weatherData = await weatherRes.json();

                if (weatherData && weatherData.current) {
                    const temp = Math.round(weatherData.current.temperature_2m);
                    const code = weatherData.current.weather_code;
                    const isDay = weatherData.current.is_day;

                    let condition = "sun";
                    if (code === 0) {
                        condition = "sun";
                    } else if ([1, 2, 3, 45, 48].includes(code)) {
                        condition = "cloud";
                    } else if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
                        condition = "cloud-rain";
                    } else if ([95, 96, 99].includes(code)) {
                        condition = "cloud-lightning";
                    } else {
                        condition = "wind";
                    }

                    const formattedCoords = `Lat/Lon: ${lat.toFixed(2)}, ${lon.toFixed(2)}`;
                    state.weatherForecast = extractDailyForecast(weatherData);
                    state.weatherConfig = { city: formattedCoords, temp, condition, lat, lon, isDay };
                    saveState();
                    renderWeather();

                    document.getElementById("weather-city-input").value = formattedCoords;
                    document.getElementById("weather-temp-input").value = temp;
                    document.getElementById("weather-cond-select").value = condition;
                }
            } catch (innerErr) {
                console.error("Erro geral no clima via GPS:", innerErr);
                window.showToast("Não foi possível carregar as informações do clima via GPS.", "error");
            }
        } finally {
            if (btn) btn.innerHTML = originalText;
        }
    }, (error) => {
        window.showToast("Permissão de geolocalização negada. Por favor, digite a cidade desejada no campo Cidade.", "warning");
        if (btn) btn.innerHTML = originalText;
    });
}

export function getBrazilianHolidays(year) {
    const holidays = {};

    const pad = n => String(n).padStart(2, '0');
    const setDate = (m, d, name, type = 'holiday') => {
        holidays[`${year}-${pad(m)}-${pad(d)}`] = { name, type };
    };

    // Feriados Fixos Nacionais
    setDate(1, 1, "Ano Novo (Confraternização Universal)", "holiday");
    setDate(4, 21, "Tiradentes", "holiday");
    setDate(5, 1, "Dia do Trabalho", "holiday");
    setDate(9, 7, "Independência do Brasil", "holiday");
    setDate(10, 12, "Nossa Senhora Aparecida (Dia das Crianças)", "holiday");
    setDate(11, 2, "Finados", "holiday");
    setDate(11, 15, "Proclamação da República", "holiday");
    setDate(11, 20, "Dia Nacional de Zumbi e da Consciência Negra", "holiday");
    setDate(12, 25, "Natal", "holiday");

    // Datas Festivas Fixas
    setDate(6, 12, "Dia dos Namorados", "festive");
    setDate(6, 24, "Festa Junina (São João)", "festive");
    setDate(12, 24, "Véspera de Natal", "festive");
    setDate(12, 31, "Véspera de Ano Novo", "festive");

    // Cálculo da Páscoa (Módulo Gauss/Meeus)
    const f = Math.floor,
          c = f(year / 100),
          n = year - 19 * f(year / 19),
          k = f((c - 17) / 25),
          i = c - f(c / 4) - f((c - k) / 3) + 19 * n + 15;
    const i2 = i - 30 * f(i / 30);
    const i3 = i2 - f(i2 / 28) * (1 - f(i2 / 28) * f(29 / (i2 + 1)) * f((21 - n) / 11));
    const j = year + f(year / 4) + i3 + 2 - c + f(c / 4);
    const j2 = j - 7 * f(j / 7);
    const l = i3 - j2;
    const easterMonth = 3 + f((l + 40) / 44);
    const easterDay = l + 28 - 31 * f(easterMonth / 4);

    const easter = new Date(year, easterMonth - 1, easterDay);

    const addDays = (date, days) => {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    };

    const formatDate = (date) => {
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    };

    // Carnaval (48 e 47 dias antes da Páscoa)
    const carnavalSeg = addDays(easter, -48);
    const carnavalTer = addDays(easter, -47);
    const cinzas = addDays(easter, -46);
    holidays[formatDate(carnavalSeg)] = { name: "Carnaval (Segunda-feira)", type: "holiday" };
    holidays[formatDate(carnavalTer)] = { name: "Carnaval (Terça-feira)", type: "holiday" };
    holidays[formatDate(cinzas)] = { name: "Quarta-feira de Cinzas", type: "festive" };

    // Sexta-feira Santa (2 dias antes)
    const sextaSanta = addDays(easter, -2);
    holidays[formatDate(sextaSanta)] = { name: "Sexta-feira Santa", type: "holiday" };

    // Páscoa (Domingo de Páscoa)
    holidays[formatDate(easter)] = { name: "Domingo de Páscoa", type: "festive" };

    // Corpus Christi (60 dias depois)
    const corpusChristi = addDays(easter, 60);
    holidays[formatDate(corpusChristi)] = { name: "Corpus Christi", type: "holiday" };

    // Dia das Mães: Segundo domingo de Maio
    let sundaysInMay = 0;
    for (let d = 1; d <= 14; d++) {
        const dt = new Date(year, 4, d);
        if (dt.getDay() === 0) {
            sundaysInMay++;
            if (sundaysInMay === 2) {
                holidays[formatDate(dt)] = { name: "Dia das Mães", type: "festive" };
                break;
            }
        }
    }

    // Dia dos Pais: Segundo domingo de Agosto
    let sundaysInAug = 0;
    for (let d = 1; d <= 14; d++) {
        const dt = new Date(year, 7, d);
        if (dt.getDay() === 0) {
            sundaysInAug++;
            if (sundaysInAug === 2) {
                holidays[formatDate(dt)] = { name: "Dia dos Pais", type: "festive" };
                break;
            }
        }
    }

    // Integrar Eventos Locais Dinâmicos (state.localEvents)
    if (state.localEvents && Array.isArray(state.localEvents)) {
        state.localEvents.forEach(evt => {
            if (!evt.startDate || !evt.name) return;
            const duration = parseInt(evt.durationDays) || 4;
            
            const parts = evt.startDate.split("-");
            if (parts.length !== 3) return;
            const evtYear = parseInt(parts[0]);
            const evtMonth = parseInt(parts[1]) - 1; // 0-indexed
            const evtDay = parseInt(parts[2]);

            // Se for do tipo "Apenas uma vez" e o ano não bate com o ano atual sendo renderizado
            if (evt.recurrence === 'none' && evtYear !== year) return;

            const pad = n => String(n).padStart(2, '0');

            let startDt;
            if (evt.recurrence === 'monthly') {
                for (let m = 0; m < 12; m++) {
                    startDt = new Date(year, m, evtDay);
                    for (let d = 0; d < duration; d++) {
                        const currentDt = new Date(startDt);
                        currentDt.setDate(startDt.getDate() + d);
                        if (currentDt.getFullYear() === year) {
                            holidays[`${currentDt.getFullYear()}-${pad(currentDt.getMonth() + 1)}-${pad(currentDt.getDate())}`] = {
                                name: evt.name,
                                type: "festive",
                                isLocalEvent: true,
                                eventId: evt.id
                            };
                        }
                    }
                }
            } else {
                startDt = new Date(year, evtMonth, evtDay);
                for (let d = 0; d < duration; d++) {
                    const currentDt = new Date(startDt);
                    currentDt.setDate(startDt.getDate() + d);
                    if (currentDt.getFullYear() === year) {
                        holidays[`${currentDt.getFullYear()}-${pad(currentDt.getMonth() + 1)}-${pad(currentDt.getDate())}`] = {
                            name: evt.name,
                            type: "festive",
                            isLocalEvent: true,
                            eventId: evt.id
                        };
                    }
                }
            }
        });
    }

    return holidays;
}

export function renderCalendar(year, month) {
    const monthYearEl = document.getElementById("calendar-month-year");
    if (monthYearEl) {
        monthYearEl.innerText = `${MONTH_NAMES[month]} ${year}`;
    }

    const container = document.getElementById("calendar-days-container");
    if (!container) return;
    container.innerHTML = "";

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevMonthTotalDays = new Date(year, month, 0).getDate();

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    // Buscar feriados do ano
    const yearHolidays = getBrazilianHolidays(year);

    // 1. Renderizar dias do mês anterior
    for (let i = firstDayIndex - 1; i >= 0; i--) {
        const prevDay = prevMonthTotalDays - i;
        const dayEl = document.createElement("span");
        dayEl.className = "calendar-day other-month";
        dayEl.innerText = prevDay;
        container.appendChild(dayEl);
    }

    // 2. Renderizar dias do mês atual
    for (let day = 1; day <= totalDays; day++) {
        const dayStr = String(day).padStart(2, '0');
        const monthStr = String(month + 1).padStart(2, '0');
        const dateStr = `${year}-${monthStr}-${dayStr}`;

        const dayEl = document.createElement("span");
        dayEl.className = "calendar-day";
        dayEl.innerText = day;

        if (dateStr === todayStr) {
            dayEl.classList.add("today");
        }

        if (dateStr === selectedCalendarDateStr) {
            dayEl.classList.add("selected");
        }

        // Marcar feriados e datas festivas
        const holiday = yearHolidays[dateStr];
        if (holiday) {
            if (holiday.type === 'holiday') {
                dayEl.classList.add("is-holiday");
            } else if (holiday.type === 'festive') {
                dayEl.classList.add("is-festive");
            }
            dayEl.title = holiday.name;
        }

        if (state.calendarNotes && state.calendarNotes[dateStr]) {
            dayEl.classList.add("has-note");
        }

        dayEl.addEventListener("click", () => {
            selectCalendarDay(dateStr);
        });

        container.appendChild(dayEl);
    }

    // 3. Renderizar dias do próximo mês
    const totalRendered = firstDayIndex + totalDays;
    const remaining = 7 - (totalRendered % 7);
    if (remaining < 7) {
        for (let i = 1; i <= remaining; i++) {
            const dayEl = document.createElement("span");
            dayEl.className = "calendar-day other-month";
            dayEl.innerText = i;
            container.appendChild(dayEl);
        }
    }
}

export function changeMonth(dir) {
    currentCalendarMonth += dir;
    if (currentCalendarMonth < 0) {
        currentCalendarMonth = 11;
        currentCalendarYear--;
    } else if (currentCalendarMonth > 11) {
        currentCalendarMonth = 0;
        currentCalendarYear++;
    }
    renderCalendar(currentCalendarYear, currentCalendarMonth);
}

export function selectCalendarDay(dateStr) {
    selectedCalendarDateStr = dateStr;
    renderCalendar(currentCalendarYear, currentCalendarMonth);

    const [y, m, d] = dateStr.split("-");
    const formattedDate = `${d}/${m}/${y}`;

    const notesBox = document.getElementById("calendar-day-notes-box");
    const label = document.getElementById("selected-day-label");
    const textarea = document.getElementById("selected-day-textarea");

    if (notesBox && label && textarea) {
        notesBox.style.display = "block";
        label.innerText = `Notas do dia ${formattedDate}`;

        // Exibir indicador de feriado se houver
        const yearHolidays = getBrazilianHolidays(parseInt(y));
        const holiday = yearHolidays[dateStr];
        let holidayHtml = "";
        if (holiday) {
            const badgeClass = holiday.type === 'holiday' ? 'badge-holiday' : 'badge-festive';
            const iconName = holiday.type === 'holiday' ? 'calendar-days' : 'sparkles';
            
            let editBtn = "";
            if (holiday.isLocalEvent && holiday.eventId) {
                editBtn = `
                    <button type="button" class="btn btn-secondary btn-mini" onclick="window.openEditLocalEventModal('${holiday.eventId}')" style="font-size: 0.6rem; padding: 2px 6px; margin-left: 8px; border-color: rgba(0, 240, 255, 0.3); background: rgba(0, 240, 255, 0.05); color: var(--color-primary); display: inline-flex; align-items: center; gap: 2px; vertical-align: middle; height: auto; width: auto;">
                        <i data-lucide="edit-3" style="width: 10px; height: 10px;"></i> Editar Evento
                    </button>
                `;
            }
            
            holidayHtml = `
                <div class="holiday-badge ${badgeClass}" style="display: inline-flex; align-items: center; gap: 4px; margin-bottom: 8px; flex-wrap: wrap;">
                    <i data-lucide="${iconName}" style="width: 14px; height: 14px;"></i>
                    <span>${holiday.name}</span>
                    ${editBtn}
                </div>
            `;
        }

        if (!holiday || !holiday.isLocalEvent) {
            holidayHtml += `
                <div style="margin-bottom: 8px;">
                    <button type="button" class="btn btn-secondary btn-mini" onclick="window.openEditLocalEventModal()" style="font-size: 0.6rem; padding: 4px 8px; border-color: rgba(0, 240, 255, 0.3); background: rgba(0, 240, 255, 0.05); color: var(--color-primary); display: inline-flex; align-items: center; gap: 4px; height: auto; width: auto;">
                        <i data-lucide="plus" style="width: 11px; height: 11px;"></i> Agendar Evento Local
                    </button>
                </div>
            `;
        }

        let indicatorEl = document.getElementById("selected-day-holiday-badge");
        if (!indicatorEl) {
            indicatorEl = document.createElement("div");
            indicatorEl.id = "selected-day-holiday-badge";
            label.parentNode.insertBefore(indicatorEl, label.nextSibling);
        }
        indicatorEl.innerHTML = holidayHtml;
        if (window.lucide) window.lucide.createIcons();

        textarea.value = (state.calendarNotes && state.calendarNotes[dateStr]) || "";
        textarea.focus();
    }
}

export function saveDayNote() {
    if (!selectedCalendarDateStr) return;

    const textarea = document.getElementById("selected-day-textarea");
    if (!textarea) return;

    const noteText = textarea.value.trim();
    if (!state.calendarNotes) state.calendarNotes = {};

    if (noteText) {
        state.calendarNotes[selectedCalendarDateStr] = noteText;
    } else {
        delete state.calendarNotes[selectedCalendarDateStr];
    }

    saveState();
    renderCalendar(currentCalendarYear, currentCalendarMonth);
    window.showToast("Nota salva com sucesso para este dia!", "success");
}

export function clearDayNote() {
    if (!selectedCalendarDateStr) return;

    const textarea = document.getElementById("selected-day-textarea");
    if (textarea) textarea.value = "";

    if (state.calendarNotes) {
        delete state.calendarNotes[selectedCalendarDateStr];
    }

    saveState();
    renderCalendar(currentCalendarYear, currentCalendarMonth);
    
    const notesBox = document.getElementById("calendar-day-notes-box");
    if (notesBox) notesBox.style.display = "none";
}

export function openWeatherForecastModal() {
    const modal = document.getElementById("modal-weather-forecast");
    if (!modal) return;

    modal.classList.add("active");

    const cityLabel = document.getElementById("forecast-active-city");
    if (cityLabel) {
        cityLabel.innerText = (state.weatherConfig && state.weatherConfig.city) || "São José dos Campos - SP";
    }

    let forecast = state.weatherForecast;
    if (!Array.isArray(forecast)) {
        forecast = [];
    }
    forecast = forecast.filter(d => d && typeof d === 'object' && d.date && d.max !== undefined && d.min !== undefined);
    if (forecast.length === 0) {
        forecast = getFallbackForecast();
    }

    const daysToShow = forecast.slice(0, 5);

    const gridContainer = document.getElementById("forecast-grid-container");
    if (gridContainer) {
        gridContainer.innerHTML = "";
        
        daysToShow.forEach(day => {
            const dateObj = new Date(day.date + 'T00:00:00');
            const weekday = dateObj.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
            const capitalizedWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
            const dayMonth = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
            
            const yearHolidays = getBrazilianHolidays(dateObj.getFullYear());
            const holiday = yearHolidays[day.date];
            
            let holidayTagHtml = "";
            if (holiday) {
                const tagColor = holiday.type === 'holiday' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(234, 179, 8, 0.15)';
                const tagTextColor = holiday.type === 'holiday' ? '#f87171' : '#facc15';
                const tagBorderColor = holiday.type === 'holiday' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(234, 179, 8, 0.3)';
                holidayTagHtml = `
                    <span class="badge-mini" style="font-size: 0.5rem; background: ${tagColor}; color: ${tagTextColor}; border: 1px solid ${tagBorderColor}; border-radius: 3px; padding: 1px 3px; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${holiday.name}">
                        ${holiday.type === 'holiday' ? 'Feriado' : 'Festa'}
                    </span>
                `;
            }

            const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
            if (isWeekend && !holiday) {
                holidayTagHtml = `
                    <span class="badge-mini" style="font-size: 0.5rem; background: rgba(0, 240, 255, 0.1); color: var(--color-primary); border: 1px solid rgba(0, 240, 255, 0.2); border-radius: 3px; padding: 1px 3px;">
                        Fim de Sem
                    </span>
                `;
            }

            const cond = WEATHER_CONDITIONS[day.condition] || WEATHER_CONDITIONS.sun;
            
            const card = document.createElement("div");
            card.style.cssText = "background: rgba(0, 0, 0, 0.2); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 6px; padding: 10px 8px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 6px; min-width: 0;";
            card.innerHTML = `
                <span style="font-size: 0.65rem; color: var(--color-text-muted); text-transform: uppercase; font-weight: 700; white-space: nowrap;">${capitalizedWeekday}, ${dayMonth}</span>
                <i data-lucide="${cond.icon}" style="width: 20px; height: 20px; color: ${cond.color};"></i>
                <div style="font-size: 0.75rem; font-weight: 700; color: #fff; margin-top: 2px;">${day.max}° <span style="color: var(--color-text-muted); font-weight: 500;">${day.min}°</span></div>
                ${holidayTagHtml}
            `;
            gridContainer.appendChild(card);
        });
        if (window.lucide) window.lucide.createIcons();
    }

    calculatePredictiveDemand(daysToShow);
    setTimeout(() => {
        renderWeatherTempChart(daysToShow);
    }, 100);
}

function getFallbackForecast() {
    const forecast = [];
    const today = new Date();
    const temp = (state.weatherConfig && state.weatherConfig.temp) || 24;
    const condition = (state.weatherConfig && state.weatherConfig.condition) || "sun";
    
    for (let i = 0; i < 5; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        
        const max = Math.round(temp + Math.sin(i) * 2 + (Math.random() - 0.5) * 2);
        const min = Math.round(max - 7 - (Math.random() * 2));
        
        forecast.push({
            date: dateStr,
            max,
            min,
            condition: i === 0 ? condition : (Math.random() > 0.4 ? "sun" : "cloud")
        });
    }
    return forecast;
}

function calculatePredictiveDemand(forecastDays) {
    if (forecastDays.length === 0) return;

    let sumMaxTemp = 0;
    let highestTemp = 0;
    forecastDays.forEach(d => {
        sumMaxTemp += d.max;
        if (d.max > highestTemp) highestTemp = d.max;
    });
    const avgMaxTemp = sumMaxTemp / forecastDays.length;

    let baseChange = 0;
    let demandLevel = "Normal";
    let baseColor = "#00f0ff";
    let baseIcon = "thermometer";
    let progress = 50;

    if (avgMaxTemp >= 32) {
        baseChange = 80;
        demandLevel = "Crítica (Calor Extremo)";
        baseColor = "#ff0055";
        baseIcon = "zap";
        progress = 100;
    } else if (avgMaxTemp >= 27) {
        baseChange = 40;
        demandLevel = "Alta (Tempo Quente)";
        baseColor = "#ffb703";
        baseIcon = "thermometer-sun";
        progress = 75;
    } else if (avgMaxTemp <= 19) {
        baseChange = -25;
        demandLevel = "Baixa (Tempo Frio)";
        baseColor = "#94a3b8";
        baseIcon = "thermometer-snowflake";
        progress = 25;
    } else {
        baseChange = 0;
        demandLevel = "Normal (Estável)";
        baseColor = "#00f0ff";
        baseIcon = "thermometer";
        progress = 50;
    }

    let adjustment = 0;
    let holidaysList = [];
    let isCarnavalPeriod = false;
    let isReveillonPeriod = false;

    forecastDays.forEach(day => {
        const dateObj = new Date(day.date + 'T00:00:00');
        const yearHolidays = getBrazilianHolidays(dateObj.getFullYear());
        const holiday = yearHolidays[day.date];

        if (holiday) {
            holidaysList.push({ name: holiday.name, date: day.date, isLocalEvent: holiday.isLocalEvent });
            
            if (holiday.isLocalEvent) {
                const evt = state.localEvents.find(e => e.id === holiday.eventId);
                const multiplier = evt ? parseFloat(evt.salesMultiplier) || 1.6 : 1.6;
                const boostPercent = Math.round((multiplier - 1) * 100);
                adjustment += boostPercent;
            } else {
                adjustment += 20;
            }

            if (holiday.name.toLowerCase().includes("carnaval") || holiday.name.toLowerCase().includes("cinzas")) {
                isCarnavalPeriod = true;
            }
        }

        const m = dateObj.getMonth() + 1;
        const d = dateObj.getDate();
        if ((m === 12 && d >= 24) || (m === 1 && d <= 2)) {
            isReveillonPeriod = true;
        }

        const wday = dateObj.getDay();
        if (wday === 0 || wday === 6) {
            adjustment += 10;
        }
    });

    if (isCarnavalPeriod) adjustment += 35;
    if (isReveillonPeriod) adjustment += 45;

    let finalChange = baseChange + adjustment;
    if (finalChange > 120) finalChange = 120;
    if (finalChange < -40) finalChange = -40;

    let isExplosao = false;
    if (highestTemp >= 30 && (holidaysList.length > 0 || isCarnavalPeriod || isReveillonPeriod)) {
        isExplosao = true;
    }

    const container = document.getElementById("predictive-demand-container");
    const iconWrapper = document.getElementById("predictive-demand-icon-wrapper");
    const iconEl = document.getElementById("predictive-demand-icon");
    const levelEl = document.getElementById("predictive-demand-level");
    const progressEl = document.getElementById("predictive-demand-progress");
    const analysisEl = document.getElementById("predictive-demand-analysis");

    if (container && iconWrapper && iconEl && levelEl && progressEl && analysisEl) {
        container.className = "demand-alert-panel";
        container.style.animation = "";
        
        let color = baseColor;
        let iconName = baseIcon;
        let labelText = demandLevel;

        if (isExplosao) {
            labelText = "💥 EXPLOSÃO DE VENDAS (Calor + Festa)";
            color = "#ff3300";
            iconName = "flame";
            progress = 100;
            container.classList.add("predictive-boom");
        } else if (finalChange >= 30) {
            labelText = `Alta (+${finalChange}%)`;
            color = "#ffb703";
            iconName = "trending-up";
            progress = 75;
            container.classList.add("predictive-high");
        } else if (finalChange <= -15) {
            labelText = `Baixa (${finalChange}%)`;
            color = "#94a3b8";
            iconName = "trending-down";
            progress = 25;
            container.classList.add("predictive-low");
        } else {
            labelText = `Estável (${finalChange >= 0 ? '+' : ''}${finalChange}%)`;
            color = "#00f0ff";
            iconName = "thermometer";
            progress = 50;
            container.classList.add("predictive-normal");
        }

        iconWrapper.style.background = `rgba(${hexToRgb(color)}, 0.1)`;
        iconWrapper.style.borderColor = `rgba(${hexToRgb(color)}, 0.25)`;
        iconEl.style.color = color;
        iconEl.setAttribute("data-lucide", iconName);
        levelEl.innerText = labelText;
        levelEl.style.color = color;
        progressEl.style.width = `${progress}%`;
        progressEl.style.background = color;
        progressEl.style.boxShadow = `0 0 8px ${color}`;

        let analysisText = `🌡️ **Resumo do Clima:** Média máxima de **${avgMaxTemp.toFixed(1)}°C** nos próximos 5 dias.\n`;
        
        if (holidaysList.length > 0) {
            analysisText += `🎉 **Feriados/Eventos no Período:**\n`;
            holidaysList.forEach(h => {
                const [y, m, d] = h.date.split("-");
                analysisText += `   • **${h.name}** no dia ${d}/${m}${h.isLocalEvent ? ' (Evento Local)' : ''}\n`;
            });
        }

        if (isReveillonPeriod) {
            analysisText += `✨ **Alerta Réveillon/Natal:** Período de festas de Fim de Ano ativo. Procura de gelo no patamar histórico máximo!\n`;
        } else if (isCarnavalPeriod) {
            analysisText += `🎭 **Alerta Carnaval:** Período de festas de Carnaval ativo. Grande fluxo de turismo e eventos.\n`;
        }

        analysisText += `\n📋 **Recomendações para a Fábrica:**\n`;

        if (isExplosao) {
            analysisText += `• ⚙️ **Produção:** **EMERGÊNCIA MÁXIMA.** Ligue todas as máquinas de gelo em capacidade de 100% ininterruptamente.\n`;
            analysisText += `• 📦 **Estoque:** Encha as câmaras frias no limite físico (+100%). Prepare fardos extras de 5kg (gelo em cubo) e fardos de gelo moído.\n`;
            analysisText += `• 🚚 **Logística/Tinas:** Alta procura por tinas de aluguel para festas. Faça carregamento preventivo das tinas e organize rotas de reabastecimento rápido nos clientes de alto fluxo (postos e adegas).`;
        } else if (finalChange >= 30) {
            analysisText += `• ⚙️ **Produção:** Aumente o ritmo de produção diária em cerca de **20% a 30%**.\n`;
            analysisText += `• 📦 **Estoque:** Mantenha um estoque de segurança equivalente a 2 dias de vendas habituais.\n`;
            analysisText += `• 🚚 **Logística:** Abasteça os clientes antes do final de semana para evitar chamadas de emergência.`;
        } else if (finalChange <= -15) {
            analysisText += `• ⚙️ **Produção:** Desacelere as máquinas. Reduza a produção para evitar falta de espaço nas câmaras.\n`;
            analysisText += `• 📦 **Estoque:** Mantenha estoque reduzido (apenas giro de segurança).\n`;
            analysisText += `• 🚚 **Logística:** Frequência de entregas reduzida. Verifique o estoque dos freezers dos clientes via painel para otimizar rotas.`;
        } else {
            analysisText += `• ⚙️ **Produção:** Mantenha o ritmo padrão regular de produção diária.\n`;
            analysisText += `• 📦 **Estoque:** Níveis regulares de estoque comercial.\n`;
            analysisText += `• 🚚 **Logística:** Siga o cronograma regular de rotas de entrega preventiva.`;
        }

        analysisEl.innerHTML = formatMarkdownText(analysisText);
        if (window.lucide) window.lucide.createIcons();
    }
}

function hexToRgb(hex) {
    if (hex === '#00f0ff') return '0, 240, 255';
    if (hex === '#ffb703') return '255, 183, 3';
    if (hex === '#ff0055') return '255, 0, 85';
    if (hex === '#ff3300') return '255, 51, 0';
    if (hex === '#94a3b8') return '148, 163, 184';
    
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '0, 240, 255';
}

function formatMarkdownText(text) {
    return text
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/\*([^*]+)\*/g, '<em>$1</em>');
}

// Bind to window for HTML accessibility
window.initUtilityPanel = initUtilityPanel;
window.toggleUtilityDrawer = toggleUtilityDrawer;
window.updateClocks = updateClocks;
window.selectNeighborCity = selectNeighborCity;
window.syncWeatherManual = syncWeatherManual;
window.toggleWeatherCitiesList = toggleWeatherCitiesList;
window.toggleWeatherConfig = toggleWeatherConfig;
window.saveWeatherConfig = saveWeatherConfig;
window.updateWeatherFromAPI = updateWeatherFromAPI;
window.detectUserLocation = detectUserLocation;
window.renderCalendar = renderCalendar;
window.changeMonth = changeMonth;
window.selectCalendarDay = selectCalendarDay;
window.saveDayNote = saveDayNote;
window.clearDayNote = clearDayNote;
window.getBrazilianHolidays = getBrazilianHolidays;
window.openWeatherForecastModal = openWeatherForecastModal;

window.getBrazilTimeISO = getBrazilTimeISO;
window.formatDateBrazil = formatDateBrazil;

let weatherChartInstance = null;

export function renderWeatherTempChart(forecastDays) {
    const canvas = document.getElementById("weather-temp-chart");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (weatherChartInstance) {
        weatherChartInstance.destroy();
    }

    const labels = forecastDays.map(day => {
        const dateObj = new Date(day.date + 'T00:00:00');
        const dayMonth = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        const weekday = dateObj.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
        return `${weekday.charAt(0).toUpperCase() + weekday.slice(1)} ${dayMonth}`;
    });

    const maxTemps = forecastDays.map(day => day.max);
    const minTemps = forecastDays.map(day => day.min);

    const primaryColor = (state.appearance && state.appearance.primaryColor) || "#00f0ff";
    const primaryColorRgb = (state.appearance && state.appearance.primaryColorRgb) || "0, 240, 255";

    if (typeof Chart === "undefined") {
        console.warn("Chart.js não carregado.");
        return;
    }

    weatherChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Máxima (°C)',
                    data: maxTemps,
                    borderColor: primaryColor,
                    backgroundColor: `rgba(${primaryColorRgb}, 0.15)`,
                    borderWidth: 2.5,
                    pointBackgroundColor: primaryColor,
                    pointBorderColor: '#fff',
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    tension: 0.35,
                    fill: true
                },
                {
                    label: 'Mínima (°C)',
                    data: minTemps,
                    borderColor: 'rgba(255, 255, 255, 0.4)',
                    backgroundColor: 'transparent',
                    borderWidth: 1.5,
                    borderDash: [4, 4],
                    pointBackgroundColor: '#94a3b8',
                    pointBorderColor: 'transparent',
                    pointRadius: 3,
                    tension: 0.35,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: 'rgba(255, 255, 255, 0.7)',
                        font: { size: 9 },
                        boxWidth: 12
                    }
                },
                tooltip: {
                    enabled: true,
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(9, 13, 22, 0.95)',
                    titleColor: primaryColor,
                    bodyColor: '#fff',
                    borderColor: `rgba(${primaryColorRgb}, 0.2)`,
                    borderWidth: 1,
                    titleFont: { size: 10, weight: 'bold' },
                    bodyFont: { size: 9 }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.6)',
                        font: { size: 8 }
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)',
                        drawBorder: false
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.6)',
                        font: { size: 8 },
                        callback: function(value) {
                            return value + '°C';
                        }
                    }
                }
            }
        }
    });
}

export function openEditLocalEventModal(eventId = "") {
    const titleEl = document.getElementById("local-event-modal-title");
    const idInput = document.getElementById("form-event-id");
    const nameInput = document.getElementById("event-name");
    const locationInput = document.getElementById("event-location");
    const startDateInput = document.getElementById("event-start-date");
    const durationInput = document.getElementById("event-duration");
    const recurrenceInput = document.getElementById("event-recurrence");
    const multiplierInput = document.getElementById("event-multiplier");
    const deleteBtn = document.getElementById("btn-delete-local-event");
    
    document.getElementById("local-event-form").reset();
    
    if (eventId) {
        const evt = state.localEvents.find(e => e.id === eventId);
        if (!evt) return;
        
        titleEl.innerHTML = `<i data-lucide="edit-3" style="width: 20px; height: 20px;"></i> Editar Evento Local`;
        idInput.value = evt.id;
        nameInput.value = evt.name;
        if (locationInput) locationInput.value = evt.location || "";
        startDateInput.value = evt.startDate;
        durationInput.value = evt.durationDays !== undefined ? evt.durationDays.toString() : "4";
        recurrenceInput.value = evt.recurrence || "annual";
        
        const mult = evt.salesMultiplier !== undefined ? parseFloat(evt.salesMultiplier) : 1.6;
        if (mult >= 2.0) multiplierInput.value = "2.0";
        else if (mult >= 1.6) multiplierInput.value = "1.6";
        else multiplierInput.value = "1.3";
        
        if (deleteBtn) deleteBtn.style.display = "block";
    } else {
        titleEl.innerHTML = `<i data-lucide="calendar-days" style="width: 20px; height: 20px;"></i> Configurar Evento Local`;
        idInput.value = "";
        if (locationInput) locationInput.value = "";
        if (deleteBtn) deleteBtn.style.display = "none";
        
        if (selectedCalendarDateStr && startDateInput) {
            startDateInput.value = selectedCalendarDateStr;
        }
    }
    
    if (window.lucide) window.lucide.createIcons();
    const modal = document.getElementById("modal-edit-local-event");
    if (modal) modal.classList.add("active");
}
 
export function saveLocalEventForm(event) {
    if (event) event.preventDefault();
    
    const id = document.getElementById("form-event-id").value;
    const name = document.getElementById("event-name").value.trim();
    const locationInput = document.getElementById("event-location");
    const location = locationInput ? locationInput.value.trim() : "";
    const startDate = document.getElementById("event-start-date").value;
    const durationDays = parseInt(document.getElementById("event-duration").value) || 4;
    const recurrence = document.getElementById("event-recurrence").value;
    const salesMultiplier = parseFloat(document.getElementById("event-multiplier").value) || 1.6;
    
    if (!name || !startDate || !location) {
        window.showToast("Preencha todos os campos obrigatórios.", "warning");
        return;
    }
    
    if (id) {
        const index = state.localEvents.findIndex(e => e.id === id);
        if (index !== -1) {
            state.localEvents[index].name = name;
            state.localEvents[index].location = location;
            state.localEvents[index].startDate = startDate;
            state.localEvents[index].durationDays = durationDays;
            state.localEvents[index].recurrence = recurrence;
            state.localEvents[index].salesMultiplier = salesMultiplier;
        }
    } else {
        const newEvt = {
            id: "evt_" + Date.now(),
            name: name,
            location: location,
            startDate: startDate,
            durationDays: durationDays,
            recurrence: recurrence,
            salesMultiplier: salesMultiplier
        };
        state.localEvents.push(newEvt);
    }
    
    saveState();
    closeModal("modal-edit-local-event");
    window.showToast("Evento local salvo com sucesso!", "success");
    
    if (window.renderCalendar && currentCalendarYear !== undefined && currentCalendarMonth !== undefined) {
        window.renderCalendar(currentCalendarYear, currentCalendarMonth);
    }
    if (selectedCalendarDateStr) {
        selectCalendarDay(selectedCalendarDateStr);
    }
    if (window.checkUpcomingLocalEvents) {
        window.checkUpcomingLocalEvents();
    }
    if (window.renderEventosLocaisTable) {
        window.renderEventosLocaisTable();
    }
}

export function deleteLocalEventFromForm() {
    const id = document.getElementById("form-event-id").value;
    if (!id) return;
    
    const evt = state.localEvents.find(e => e.id === id);
    if (!evt) return;
    
    window.showConfirm(
        `Tem certeza que deseja excluir o evento "${evt.name}"? Ele deixará de ser considerado nas projeções de demanda.`,
        () => {
            state.localEvents = state.localEvents.filter(e => e.id !== id);
            saveState();
            closeModal("modal-edit-local-event");
            window.showToast("Evento excluído com sucesso!", "success");
            
            if (window.renderCalendar && currentCalendarYear !== undefined && currentCalendarMonth !== undefined) {
                window.renderCalendar(currentCalendarYear, currentCalendarMonth);
            }
            if (selectedCalendarDateStr) {
                selectCalendarDay(selectedCalendarDateStr);
            }
            if (window.checkUpcomingLocalEvents) {
                window.checkUpcomingLocalEvents();
            }
            if (window.renderEventosLocaisTable) {
                window.renderEventosLocaisTable();
            }
        },
        null,
        "Excluir Evento",
        "Excluir"
    );
}

window.renderWeatherTempChart = renderWeatherTempChart;
window.openEditLocalEventModal = openEditLocalEventModal;
window.saveLocalEventForm = saveLocalEventForm;
window.deleteLocalEventFromForm = deleteLocalEventFromForm;

function cleanStringForPix(str) {
    if (!str) return "";
    return str.normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^A-Z0-9\s]/gi, "")
        .toUpperCase()
        .trim();
}

export function generateStaticPixPayload(key, amount, city = "SAO JOSE DOS CAMPOS", name = "GELO DO VALE", txid = "***") {
    const cleanKey = key.trim();
    const cleanName = cleanStringForPix(name).substring(0, 25) || "GELO DO VALE";
    const cleanCity = cleanStringForPix(city).substring(0, 15) || "SAO JOSE DOS CAMPOS";
    const cleanTxid = cleanStringForPix(txid).substring(0, 25) || "***";
    const amountStr = parseFloat(amount).toFixed(2);

    function formatTLV(id, value) {
        const len = value.length.toString().padStart(2, '0');
        return id + len + value;
    }

    let payload = formatTLV("00", "01");
    payload += formatTLV("01", "11");

    const gui = formatTLV("00", "br.gov.bcb.pix");
    const keyTLV = formatTLV("01", cleanKey);
    payload += formatTLV("26", gui + keyTLV);

    payload += formatTLV("52", "0000");
    payload += formatTLV("53", "986");
    payload += formatTLV("54", amountStr);
    payload += formatTLV("58", "BR");
    payload += formatTLV("59", cleanName);
    payload += formatTLV("60", cleanCity);

    const txidTLV = formatTLV("05", cleanTxid);
    payload += formatTLV("62", txidTLV);

    payload += "6304";

    let crc = 0xFFFF;
    const polynomial = 0x1021;
    for (let i = 0; i < payload.length; i++) {
        let b = payload.charCodeAt(i);
        for (let j = 0; j < 8; j++) {
            let bit = ((b >> (7 - j)) & 1) === 1;
            let c15 = ((crc >> 15) & 1) === 1;
            crc <<= 1;
            if (c15 ^ bit) {
                crc ^= polynomial;
            }
        }
    }
    crc &= 0xFFFF;
    const crcHex = crc.toString(16).toUpperCase().padStart(4, '0');

    return payload + crcHex;
}
window.generateStaticPixPayload = generateStaticPixPayload;

export function showLocalPixModal(clientName, amount) {
    const pixKey = (state.factorySettings && state.factorySettings.pixKey) || "";
    if (!pixKey) {
        window.showToast("Chave PIX da Fábrica não configurada nas Configurações!", "warning");
        return;
    }

    const factoryName = (state.factorySettings && state.factorySettings.name) || "GELO DO VALE";
    const factoryCity = (state.factorySettings && state.factorySettings.address) ? state.factorySettings.address.split(",")[0] : "SAO JOSE DOS CAMPOS";

    const txid = "COB" + Date.now().toString().slice(-8);
    const payload = generateStaticPixPayload(pixKey, amount, factoryCity, factoryName, txid);

    const modal = document.getElementById("modal-pix-local");
    if (!modal) {
        console.warn("Modal modal-pix-local não encontrado no DOM.");
        return;
    }

    const clientEl = document.getElementById("pix-local-client");
    if (clientEl) clientEl.innerText = clientName;

    const amountEl = document.getElementById("pix-local-amount");
    if (amountEl) amountEl.innerText = "R$ " + parseFloat(amount).toFixed(2).replace(".", ",");
    
    const inputPayload = document.getElementById("pix-local-payload");
    if (inputPayload) inputPayload.value = payload;

    const qrContainer = document.getElementById("pix-local-qrcode");
    if (qrContainer) {
        qrContainer.innerHTML = "";
        try {
            new QRCode(qrContainer, {
                text: payload,
                width: 200,
                height: 200,
                colorDark: "#090d16",
                colorLight: "#ffffff"
            });
        } catch (e) {
            console.error("Erro ao gerar QR Code do PIX local:", e);
            qrContainer.innerText = "Erro ao renderizar QR Code.";
        }
    }

    modal.classList.add("active");
}
window.showLocalPixModal = showLocalPixModal;

export function copyLocalPixPayload() {
    const payloadInput = document.getElementById("pix-local-payload");
    if (payloadInput) {
        payloadInput.select();
        payloadInput.setSelectionRange(0, 99999);
        navigator.clipboard.writeText(payloadInput.value)
            .then(() => window.showToast("PIX Copia e Cola copiado com sucesso!", "success"))
            .catch(() => window.showToast("Falha ao copiar PIX.", "error"));
    }
}
window.copyLocalPixPayload = copyLocalPixPayload;
window.renderWeather = renderWeather;

// =====================================================================
// CPF / CNPJ — Validação e Busca Automática (BrasilAPI + CNPJá Fallback)
// =====================================================================

/** Valida CPF usando algoritmo de módulo 11 */
export function validateCPF(cpf) {
    const c = cpf.replace(/\D/g, '');
    if (c.length !== 11) return false;
    if (/^(\d)\1+$/.test(c)) return false; // todos dígitos iguais
    let sum = 0;
    for (let i = 0; i < 9; i++) sum += parseInt(c[i]) * (10 - i);
    let r = (sum * 10) % 11;
    if (r === 10 || r === 11) r = 0;
    if (r !== parseInt(c[9])) return false;
    sum = 0;
    for (let i = 0; i < 10; i++) sum += parseInt(c[i]) * (11 - i);
    r = (sum * 10) % 11;
    if (r === 10 || r === 11) r = 0;
    return r === parseInt(c[10]);
}

/** Valida CNPJ usando algoritmo de módulo 11 */
export function validateCNPJ(cnpj) {
    const c = cnpj.replace(/\D/g, '');
    if (c.length !== 14) return false;
    if (/^(\d)\1+$/.test(c)) return false;
    const calc = (str, weights) => {
        let s = 0;
        for (let i = 0; i < weights.length; i++) s += parseInt(str[i]) * weights[i];
        const r = s % 11;
        return r < 2 ? 0 : 11 - r;
    };
    const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    return calc(c, w1) === parseInt(c[12]) && calc(c, w2) === parseInt(c[13]);
}

/** Detecta tipo de documento pelos dígitos */
export function detectDocumentType(raw) {
    const d = raw.replace(/\D/g, '');
    if (d.length <= 11) return 'cpf';
    return 'cnpj';
}

/** Aplica máscara automática CPF ou CNPJ conforme digita */
export function maskDocumentInput(input) {
    let v = input.value.replace(/\D/g, '').substring(0, 14);
    if (v.length <= 11) {
        v = v.replace(/^(\d{3})(\d)/, '$1.$2')
              .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
              .replace(/\.(\d{3})(\d)$/, '.$1-$2');
    } else {
        v = v.replace(/^(\d{2})(\d)/, '$1.$2')
              .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
              .replace(/\.(\d{3})(\d)/, '.$1/$2')
              .replace(/(\d{4})(\d)/, '$1-$2');
    }
    input.value = v;
}

/** Busca dados do CNPJ na BrasilAPI (fallback: CNPJá) */
export async function fetchCNPJData(cnpj) {
    const c = cnpj.replace(/\D/g, '');
    try {
        const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${c}`);
        if (!res.ok) throw new Error('brasilapi_fail');
        return await res.json();
    } catch (e) {
        // Fallback: CNPJá Open API
        try {
            const res2 = await fetch(`https://open.cnpja.com/office/${c}`);
            if (!res2.ok) throw new Error('cnpja_fail');
            const d = await res2.json();
            // Normalizar para o mesmo formato da BrasilAPI
            return {
                cnpj: c,
                razao_social: d.company?.name || '',
                nome_fantasia: d.alias || '',
                descricao_situacao_cadastral: d.status?.text || '',
                logradouro: d.address?.street || '',
                numero: d.address?.number || '',
                complemento: d.address?.details || '',
                bairro: d.address?.district || '',
                municipio: d.address?.city || '',
                uf: d.address?.state || '',
                cep: d.address?.zip || '',
                ddd_telefone_1: d.phones?.[0]?.number || '',
                email: d.emails?.[0]?.address || '',
                natureza_juridica: d.company?.nature?.text || '',
                qsa: (d.members || []).map(m => ({ nome_socio: m.person?.name || '', qualificacao_socio: m.role?.text || '' }))
            };
        } catch (e2) {
            throw new Error('Não foi possível consultar o CNPJ. Verifique sua conexão.');
        }
    }
}

/**
 * Inicializa validação/busca em um campo de documento.
 * @param {string} inputId       - ID do input
 * @param {string} feedbackId    - ID do elemento de feedback (criado abaixo do input)
 * @param {Function} onFillFn   - Callback chamado com os dados do CNPJ para auto-preencher
 */
export function initDocumentField(inputId, feedbackId, onFillFn = null) {
    const input = document.getElementById(inputId);
    const feedback = document.getElementById(feedbackId);
    if (!input || !feedback) return;

    let debounceTimer = null;

    input.addEventListener('input', () => {
        maskDocumentInput(input);
        clearTimeout(debounceTimer);
        const raw = input.value.replace(/\D/g, '');
        const type = detectDocumentType(raw);

        if (type === 'cpf' && raw.length === 11) {
            const ok = validateCPF(raw);
            feedback.innerHTML = ok
                ? `<div class="doc-feedback doc-valid-warn">
                       ✅ CPF <strong>matematicamente válido</strong> — os dígitos verificadores estão corretos.<br>
                       <span style="font-size:0.72rem; opacity:0.85;">⚠️ A validação <u>não confirma a identidade</u> do titular. Verifique um documento com foto antes de cadastrar.</span>
                   </div>`
                : `<div class="doc-feedback doc-invalid">❌ CPF inválido — os dígitos verificadores não conferem. Confira se foi digitado corretamente.</div>`;
        } else if (type === 'cnpj' && raw.length === 14) {
            if (!validateCNPJ(raw)) {
                feedback.innerHTML = `<div class="doc-feedback doc-invalid">❌ CNPJ inválido — verifique os dígitos</div>`;
                return;
            }
            feedback.innerHTML = `<div class="doc-feedback doc-searching">🔍 Consultando Receita Federal...</div>`;
            debounceTimer = setTimeout(async () => {
                try {
                    const data = await fetchCNPJData(raw);
                    const sit = (data.descricao_situacao_cadastral || '').toUpperCase();
                    const isAtiva = sit === 'ATIVA';
                    const sitColor = isAtiva ? '#22c55e' : '#ef4444';
                    const sitIcon = isAtiva ? '✅' : '⚠️';

                    // Montar endereço
                    const addr = [
                        data.descricao_tipo_de_logradouro ? data.descricao_tipo_de_logradouro + ' ' : '',
                        data.logradouro,
                        data.numero ? ', ' + data.numero : '',
                        data.complemento ? ' - ' + data.complemento : '',
                        data.bairro ? ' - ' + data.bairro : '',
                        data.municipio ? ' - ' + data.municipio : '',
                        data.uf ? '/' + data.uf : '',
                        data.cep ? ' (CEP: ' + data.cep.replace(/(\d{5})(\d{3})/, '$1-$2') + ')' : ''
                    ].join('').trim();

                    // Telefone formatado
                    const fone = data.ddd_telefone_1
                        ? data.ddd_telefone_1.replace(/^(\d{2})(\d{4,5})(\d{4})$/, '($1) $2-$3')
                        : '';

                    // Sócios
                    const socios = (data.qsa || []).slice(0, 3).map(s =>
                        `${s.nome_socio}${s.qualificacao_socio ? ' (' + s.qualificacao_socio + ')' : ''}`
                    ).join('<br>');

                    // Guardar dados no input para uso pelo callback
                    input._cnpjData = data;

                    feedback.innerHTML = `
                        <div class="doc-feedback doc-cnpj-card">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                                <span style="font-weight:700; font-size:0.85rem; color:#fff;">${data.razao_social || 'Razão Social não informada'}</span>
                                <span style="font-size:0.75rem; font-weight:600; color:${sitColor};">${sitIcon} ${sit || 'Situação desconhecida'}</span>
                            </div>
                            ${data.nome_fantasia ? `<div style="font-size:0.78rem; color:var(--color-text-muted); margin-bottom:4px;">🏷️ <em>${data.nome_fantasia}</em></div>` : ''}
                            ${addr ? `<div style="font-size:0.78rem; color:var(--color-text-muted); margin-bottom:3px;">📍 ${addr}</div>` : ''}
                            ${fone ? `<div style="font-size:0.78rem; color:var(--color-text-muted); margin-bottom:3px;">📞 ${fone}</div>` : ''}
                            ${data.email ? `<div style="font-size:0.78rem; color:var(--color-text-muted); margin-bottom:3px;">✉️ ${data.email}</div>` : ''}
                            ${socios ? `<div style="font-size:0.75rem; color:var(--color-text-muted); border-top:1px solid rgba(255,255,255,0.06); padding-top:5px; margin-top:5px;">👥 ${socios}</div>` : ''}
                            ${!isAtiva ? `<div style="margin-top:6px; font-size:0.75rem; background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); border-radius:4px; padding:5px 8px; color:#ef4444;">⚠️ Empresa com situação <strong>${sit}</strong> na Receita Federal. Verifique antes de prosseguir.</div>` : ''}
                            ${onFillFn ? `<button type="button" class="btn btn-primary" style="margin-top:8px; width:100%; font-size:0.78rem; padding:6px;" onclick="this.closest('.doc-cnpj-card')._fillFn()">✨ Preencher dados automaticamente</button>` : ''}
                        </div>
                    `;
                    // Associar callback ao botão (sem eval)
                    if (onFillFn) {
                        const card = feedback.querySelector('.doc-cnpj-card');
                        if (card) card._fillFn = () => onFillFn(data);
                    }
                } catch (err) {
                    feedback.innerHTML = `<div class="doc-feedback doc-invalid">❌ ${err.message}</div>`;
                }
            }, 600);
        } else if (raw.length < 11) {
            feedback.innerHTML = '';
        }
    });
}

window.validateCPF = validateCPF;
window.validateCNPJ = validateCNPJ;
window.detectDocumentType = detectDocumentType;
window.maskDocumentInput = maskDocumentInput;
window.fetchCNPJData = fetchCNPJData;
window.initDocumentField = initDocumentField;
