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
            if (window.lucide) lucide.createIcons();
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
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,is_day&timezone=auto`;
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
        if (window.lucide) lucide.createIcons();
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

                const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,is_day&timezone=auto`;
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

        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,is_day&timezone=auto`;
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

            const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,is_day&timezone=auto`;
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
                const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,is_day&timezone=auto`;
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

window.getBrazilTimeISO = getBrazilTimeISO;
window.formatDateBrazil = formatDateBrazil;
