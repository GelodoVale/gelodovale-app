import { state, saveState, FACTORY_INFO } from './state.js';

export function toggleRentalLogisticsCalc() {
    const calcContent = document.getElementById("rental-logistics-calc-content");
    const toggleIcon = document.getElementById("logistics-toggle-icon");
    if (!calcContent) return;

    if (calcContent.style.display === "none" || calcContent.style.display === "") {
        calcContent.style.display = "block";
        if (toggleIcon) toggleIcon.innerText = "▲";
        calculateRentalLogistics();
    } else {
        calcContent.style.display = "none";
        if (toggleIcon) toggleIcon.innerText = "▼";
    }
}

export function updateLogisticsTollMultiplier() {
    const vehicleType = document.getElementById("logistics-vehicle-type").value;
    const multInput = document.getElementById("logistics-toll-multiplier");
    if (!multInput) return;

    if (vehicleType === "passeio") {
        multInput.value = "1.0";
        multInput.disabled = true;
    } else if (vehicleType === "carretinha") {
        multInput.value = "1.5";
        multInput.disabled = true;
    } else if (vehicleType === "trucado") {
        multInput.value = "2.0";
        multInput.disabled = true;
    } else {
        multInput.disabled = false;
    }
    
    calculateRentalLogistics();
}

export function calculateRentalLogistics() {
    const distance = parseFloat(document.getElementById("logistics-distance").value) || 0;
    const avgSpeed = parseFloat(document.getElementById("logistics-avg-speed").value) || 60;
    const vehicleType = document.getElementById("logistics-vehicle-type").value;
    const tollBase = parseFloat(document.getElementById("logistics-toll-base").value) || 0;
    const fuelPrice = parseFloat(document.getElementById("logistics-fuel-price").value) || 0;
    const fuelConsumption = parseFloat(document.getElementById("logistics-fuel-consumption").value) || 10;
    const markupPercent = parseFloat(document.getElementById("logistics-markup-percent").value) || 0;
    const markupFixed = parseFloat(document.getElementById("logistics-markup-fixed").value) || 0;
    const tollReturn = document.getElementById("logistics-toll-return").checked;

    let tollMultiplier = 1.0;
    if (vehicleType === "passeio") tollMultiplier = 1.0;
    else if (vehicleType === "carretinha") tollMultiplier = 1.5;
    else if (vehicleType === "trucado") tollMultiplier = 2.0;
    else {
        tollMultiplier = parseFloat(document.getElementById("logistics-toll-multiplier").value) || 1.0;
    }

    // Salvar no estado global para que sirva de default da próxima vez
    state.logisticsSettings = {
        fuelPrice,
        fuelConsumption,
        avgSpeed,
        tollBase,
        vehicleType,
        tollMultiplier,
        markupPercent,
        markupFixed,
        tollReturn
    };
    saveState();

    // Viagem Simples (Ida e Volta = 2 trechos)
    const tripDistance = distance * 2;
    const tripLiters = tripDistance / fuelConsumption;
    const tripFuelCost = tripLiters * fuelPrice;
    const tollLegs = tollReturn ? 2 : 1;
    const tripTollCost = tollBase * tollMultiplier * tollLegs;
    const tripCostPure = tripFuelCost + tripTollCost;

    // Valor sugerido por viagem
    const suggestedTripValue = (tripCostPure + markupFixed) * (1 + markupPercent / 100);

    // Operação Completa (Levar + Buscar = 4 trechos)
    const totalDistance = distance * 4;
    const totalCostSuggested = suggestedTripValue * 2;

    // Cálculo do Tempo
    const tripTimeHours = tripDistance / avgSpeed;
    const tripTotalMin = Math.round(tripTimeHours * 60);
    const tripH = Math.floor(tripTotalMin / 60);
    const tripM = tripTotalMin % 60;

    const totalTimeHours = totalDistance / avgSpeed;
    const totalTotalMin = Math.round(totalTimeHours * 60);
    const totalH = Math.floor(totalTotalMin / 60);
    const totalM = totalTotalMin % 60;

    // Atualizar HTML
    const resTripDist = document.getElementById("logistics-res-trip-distance");
    if (resTripDist) resTripDist.innerText = tripDistance.toFixed(1) + " km";
    
    const resTripTime = document.getElementById("logistics-res-trip-time");
    if (resTripTime) resTripTime.innerText = `${tripH}h ${tripM}m`;
    
    const resTripLiters = document.getElementById("logistics-res-trip-liters");
    if (resTripLiters) resTripLiters.innerText = tripLiters.toFixed(1) + " L";
    
    const resTripFuelCost = document.getElementById("logistics-res-trip-fuel-cost");
    if (resTripFuelCost) resTripFuelCost.innerText = "R$ " + tripFuelCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    
    const resTripTollCost = document.getElementById("logistics-res-trip-toll-cost");
    if (resTripTollCost) resTripTollCost.innerText = "R$ " + tripTollCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    
    const resTripCostPure = document.getElementById("logistics-res-trip-cost-pure");
    if (resTripCostPure) resTripCostPure.innerText = "R$ " + tripCostPure.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const resTotalDist = document.getElementById("logistics-res-total-distance");
    if (resTotalDist) resTotalDist.innerText = totalDistance.toFixed(1) + " km";
    
    const resTotalTime = document.getElementById("logistics-res-total-time");
    if (resTotalTime) resTotalTime.innerText = `${totalH}h ${totalM}m`;
    
    const resTotalCost = document.getElementById("logistics-res-total-cost");
    if (resTotalCost) resTotalCost.innerText = "R$ " + totalCostSuggested.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    
    const resSuggestedTrip = document.getElementById("logistics-res-suggested-trip");
    if (resSuggestedTrip) resSuggestedTrip.innerText = "R$ " + suggestedTripValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const btnApplyVal = document.getElementById("btn-apply-value");
    if (btnApplyVal) btnApplyVal.innerText = suggestedTripValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function applyCalculatedLogistics() {
    const distance = parseFloat(document.getElementById("logistics-distance").value) || 0;
    const fuelConsumption = parseFloat(document.getElementById("logistics-fuel-consumption").value) || 10;
    const fuelPrice = parseFloat(document.getElementById("logistics-fuel-price").value) || 0;
    const tollBase = parseFloat(document.getElementById("logistics-toll-base").value) || 0;
    const vehicleType = document.getElementById("logistics-vehicle-type").value;
    const tollReturn = document.getElementById("logistics-toll-return").checked;
    const markupFixed = parseFloat(document.getElementById("logistics-markup-fixed").value) || 0;
    const markupPercent = parseFloat(document.getElementById("logistics-markup-percent").value) || 0;

    let tollMultiplier = 1.0;
    if (vehicleType === "passeio") tollMultiplier = 1.0;
    else if (vehicleType === "carretinha") tollMultiplier = 1.5;
    else if (vehicleType === "trucado") tollMultiplier = 2.0;
    else {
        tollMultiplier = parseFloat(document.getElementById("logistics-toll-multiplier").value) || 1.0;
    }

    const tripDistance = distance * 2;
    const tripLiters = tripDistance / fuelConsumption;
    const tripFuelCost = tripLiters * fuelPrice;
    const tollLegs = tollReturn ? 2 : 1;
    const tripTollCost = tollBase * tollMultiplier * tollLegs;
    const tripCostPure = tripFuelCost + tripTollCost;
    
    const suggestedValue = (tripCostPure + markupFixed) * (1 + markupPercent / 100);

    const deliveryFeeInput = document.getElementById("rental-delivery-fee");
    const pickupFeeInput = document.getElementById("rental-pickup-fee");
    
    if (deliveryFeeInput && pickupFeeInput) {
        deliveryFeeInput.value = suggestedValue.toFixed(2);
        pickupFeeInput.value = suggestedValue.toFixed(2);
        window.showToast(`Valores de frete aplicados com sucesso!\nEntrega: R$ ${suggestedValue.toFixed(2)}\nBusca: R$ ${suggestedValue.toFixed(2)}`, "success");
    }
}

export function toggleDocLogisticsCalc() {
    const calcContent = document.getElementById("doc-logistics-calc-content");
    const toggleIcon = document.getElementById("doc-logistics-toggle-icon");
    if (!calcContent) return;

    if (calcContent.style.display === "none" || calcContent.style.display === "") {
        calcContent.style.display = "block";
        if (toggleIcon) toggleIcon.innerText = "▲";
        calculateDocLogistics();
    } else {
        calcContent.style.display = "none";
        if (toggleIcon) toggleIcon.innerText = "▼";
    }
}

export function updateDocLogisticsTollMultiplier() {
    const vehicleType = document.getElementById("doc-logistics-vehicle-type").value;
    const multInput = document.getElementById("doc-logistics-toll-multiplier");
    if (!multInput) return;

    if (vehicleType === "passeio") {
        multInput.value = "1.0";
        multInput.disabled = true;
    } else if (vehicleType === "carretinha") {
        multInput.value = "1.5";
        multInput.disabled = true;
    } else if (vehicleType === "trucado") {
        multInput.value = "2.0";
        multInput.disabled = true;
    } else {
        multInput.disabled = false;
    }
    
    calculateDocLogistics();
}

export function calculateDocLogistics() {
    const distance = parseFloat(document.getElementById("doc-logistics-distance").value) || 0;
    const avgSpeed = parseFloat(document.getElementById("doc-logistics-avg-speed").value) || 60;
    const vehicleType = document.getElementById("doc-logistics-vehicle-type").value;
    const tollBase = parseFloat(document.getElementById("doc-logistics-toll-base").value) || 0;
    const fuelPrice = parseFloat(document.getElementById("doc-logistics-fuel-price").value) || 0;
    const fuelConsumption = parseFloat(document.getElementById("doc-logistics-fuel-consumption").value) || 10;
    const markupPercent = parseFloat(document.getElementById("doc-logistics-markup-percent").value) || 0;
    const markupFixed = parseFloat(document.getElementById("doc-logistics-markup-fixed").value) || 0;
    const tollReturn = document.getElementById("doc-logistics-toll-return").checked;
    const opType = document.getElementById("doc-logistics-op-type").value;

    let tollMultiplier = 1.0;
    if (vehicleType === "passeio") tollMultiplier = 1.0;
    else if (vehicleType === "carretinha") tollMultiplier = 1.5;
    else if (vehicleType === "trucado") tollMultiplier = 2.0;
    else {
        tollMultiplier = parseFloat(document.getElementById("doc-logistics-toll-multiplier").value) || 1.0;
    }

    // Salvar no estado global para que sirva de default da próxima vez
    state.logisticsSettings = {
        fuelPrice,
        fuelConsumption,
        avgSpeed,
        tollBase,
        vehicleType,
        tollMultiplier,
        markupPercent,
        markupFixed,
        tollReturn
    };
    saveState();

    // Viagem Simples (Ida e Volta = 2 trechos)
    const tripDistance = distance * 2;
    const tripLiters = tripDistance / fuelConsumption;
    const tripFuelCost = tripLiters * fuelPrice;
    const tollLegs = tollReturn ? 2 : 1;
    const tripTollCost = tollBase * tollMultiplier * tollLegs;
    const tripCostPure = tripFuelCost + tripTollCost;

    // Valor sugerido por viagem (Simples)
    const suggestedTripValue = (tripCostPure + markupFixed) * (1 + markupPercent / 100);

    // Operação Completa (Levar + Buscar = 4 trechos)
    const totalDistance = distance * 4;
    const totalCostSuggested = suggestedTripValue * 2;

    // Cálculo do Tempo
    const tripTimeHours = tripDistance / avgSpeed;
    const tripTotalMin = Math.round(tripTimeHours * 60);
    const tripH = Math.floor(tripTotalMin / 60);
    const tripM = tripTotalMin % 60;

    const totalTimeHours = totalDistance / avgSpeed;
    const totalTotalMin = Math.round(totalTimeHours * 60);
    const totalH = Math.floor(totalTotalMin / 60);
    const totalM = totalTotalMin % 60;

    // Atualizar HTML
    const titleTrip = document.getElementById("doc-logistics-res-title-trip");
    if (titleTrip) {
        titleTrip.innerText = opType === "simples" ? "Resumo da Viagem (Ida e Volta - 2 Trechos)" : "Resumo de 1 Viagem (Ida e Volta - 2 Trechos)";
    }

    const resTripDist = document.getElementById("doc-logistics-res-trip-distance");
    if (resTripDist) resTripDist.innerText = tripDistance.toFixed(1) + " km";
    
    const resTripTime = document.getElementById("doc-logistics-res-trip-time");
    if (resTripTime) resTripTime.innerText = `${tripH}h ${tripM}m`;
    
    const resTripLiters = document.getElementById("doc-logistics-res-trip-liters");
    if (resTripLiters) resTripLiters.innerText = tripLiters.toFixed(1) + " L";
    
    const resTripFuelCost = document.getElementById("doc-logistics-res-trip-fuel-cost");
    if (resTripFuelCost) resTripFuelCost.innerText = "R$ " + tripFuelCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    
    const resTripTollCost = document.getElementById("doc-logistics-res-trip-toll-cost");
    if (resTripTollCost) resTripTollCost.innerText = "R$ " + tripTollCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    
    const resTripCostPure = document.getElementById("doc-logistics-res-trip-cost-pure");
    if (resTripCostPure) resTripCostPure.innerText = "R$ " + tripCostPure.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const totalSection = document.getElementById("doc-logistics-res-total-section");
    const resDivider = document.getElementById("doc-logistics-res-divider");
    const suggestedValue = opType === "simples" ? suggestedTripValue : totalCostSuggested;

    if (opType === "dupla") {
        if (totalSection) totalSection.style.display = "block";
        if (resDivider) resDivider.style.display = "block";

        const resTotalDist = document.getElementById("doc-logistics-res-total-distance");
        if (resTotalDist) resTotalDist.innerText = totalDistance.toFixed(1) + " km";
        
        const resTotalTime = document.getElementById("doc-logistics-res-total-time");
        if (resTotalTime) resTotalTime.innerText = `${totalH}h ${totalM}m`;
        
        const resTotalCost = document.getElementById("doc-logistics-res-total-cost");
        if (resTotalCost) resTotalCost.innerText = "R$ " + totalCostSuggested.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } else {
        if (totalSection) totalSection.style.display = "none";
    }

    const resSuggestedSub = document.getElementById("doc-logistics-res-suggested-sub");
    if (resSuggestedSub) {
        resSuggestedSub.innerText = opType === "simples" ? "(Preço sugerido para 2 trechos)" : "(Preço sugerido para 4 trechos)";
    }

    const resSuggested = document.getElementById("doc-logistics-res-suggested");
    if (resSuggested) resSuggested.innerText = "R$ " + suggestedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const btnApplyVal = document.getElementById("btn-apply-doc-value");
    if (btnApplyVal) btnApplyVal.innerText = suggestedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function applyDocCalculatedLogistics() {
    const distance = parseFloat(document.getElementById("doc-logistics-distance").value) || 0;
    const vehicleType = document.getElementById("doc-logistics-vehicle-type").value;
    const tollBase = parseFloat(document.getElementById("doc-logistics-toll-base").value) || 0;
    const fuelPrice = parseFloat(document.getElementById("doc-logistics-fuel-price").value) || 0;
    const fuelConsumption = parseFloat(document.getElementById("doc-logistics-fuel-consumption").value) || 10;
    const markupPercent = parseFloat(document.getElementById("doc-logistics-markup-percent").value) || 0;
    const markupFixed = parseFloat(document.getElementById("doc-logistics-markup-fixed").value) || 0;
    const tollReturn = document.getElementById("doc-logistics-toll-return").checked;
    const opType = document.getElementById("doc-logistics-op-type").value;

    let tollMultiplier = 1.0;
    if (vehicleType === "passeio") tollMultiplier = 1.0;
    else if (vehicleType === "carretinha") tollMultiplier = 1.5;
    else if (vehicleType === "trucado") tollMultiplier = 2.0;
    else {
        tollMultiplier = parseFloat(document.getElementById("doc-logistics-toll-multiplier").value) || 1.0;
    }

    const tripDistance = distance * 2;
    const tripLiters = tripDistance / fuelConsumption;
    const tripFuelCost = tripLiters * fuelPrice;
    const tollLegs = tollReturn ? 2 : 1;
    const tripTollCost = tollBase * tollMultiplier * tollLegs;
    const tripCostPure = tripFuelCost + tripTollCost;

    const suggestedTripValue = (tripCostPure + markupFixed) * (1 + markupPercent / 100);
    const suggestedValue = opType === "simples" ? suggestedTripValue : (suggestedTripValue * 2);

    const deliveryFeeInput = document.getElementById("doc-delivery-fee");
    if (deliveryFeeInput) {
        deliveryFeeInput.value = suggestedValue.toFixed(2);
        window.showToast(`Valor de frete aplicado com sucesso!\nFrete (${opType === "simples" ? "Simples" : "Duplo"}): R$ ${suggestedValue.toFixed(2)}`, "success");
    }
}

export async function fetchDocRouteDistance(silent = false) {
    const clientAddress = document.getElementById("doc-address").value.trim();
    const statusEl = document.getElementById("doc-logistics-route-status");
    const btn = document.getElementById("btn-fetch-doc-route");

    if (!clientAddress) {
        if (!silent) {
            window.showToast("Por favor, insira o endereço do cliente no campo 'Endereço de Entrega' primeiro!", "warning");
        }
        return;
    }

    const factoryAddress = FACTORY_INFO.address || "Vale do Paraíba, São José dos Campos - SP";
    const originalBtnHTML = btn ? btn.innerHTML : "";
    
    try {
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<span class="spin-anim" style="display:inline-block; border: 2px solid #fff; border-top: 2px solid transparent; border-radius: 50%; width: 12px; height: 12px; margin-right: 6px; vertical-align: middle;"></span> Geocodificando...';
        }
        if (statusEl) {
            statusEl.style.color = "var(--color-text-muted)";
            statusEl.innerText = "Buscando coordenadas do endereço do cliente...";
        }

        let clientLat, clientLng;
        const docClientSelect = document.getElementById("doc-client-id");
        const docClientId = docClientSelect ? docClientSelect.value : "";
        const clientObj = docClientId ? state.clients.find(c => c.id === docClientId) : null;

        if (clientObj && clientObj.latitude && clientObj.longitude && !isNaN(parseFloat(clientObj.latitude)) && !isNaN(parseFloat(clientObj.longitude))) {
            clientLat = parseFloat(clientObj.latitude);
            clientLng = parseFloat(clientObj.longitude);
        } else {
            // 1. Geocodificar endereço do cliente via Nominatim
            const clientGeoUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(clientAddress)}&format=json&limit=1&email=contato@gelodovale.com.br`;
            const clientResponse = await fetch(clientGeoUrl);
            if (!clientResponse.ok) throw new Error("Erro ao buscar coordenadas do cliente");
            const clientGeoData = await clientResponse.json();
            
            if (clientGeoData.length === 0) {
                throw new Error("Endereço do cliente não encontrado. Tente digitar de forma mais simples (ex: Nome da Rua, Número, Cidade).");
            }

            clientLat = parseFloat(clientGeoData[0].lat);
            clientLng = parseFloat(clientGeoData[0].lon);
        }

        if (statusEl) statusEl.innerText = "Buscando coordenadas da fábrica...";
        if (btn) btn.innerHTML = '<span class="spin-anim" style="display:inline-block; border: 2px solid #fff; border-top: 2px solid transparent; border-radius: 50%; width: 12px; height: 12px; margin-right: 6px; vertical-align: middle;"></span> Roteirizando...';

        // 2. Geocodificar endereço da fábrica via Nominatim
        const factoryGeoUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(factoryAddress)}&format=json&limit=1&email=contato@gelodovale.com.br`;
        const factoryResponse = await fetch(factoryGeoUrl);
        if (!factoryResponse.ok) throw new Error("Erro ao buscar coordenadas da fábrica");
        const factoryGeoData = await factoryResponse.json();
        
        let factoryLat = -23.179; // Fallback para São José dos Campos caso falhe
        let factoryLng = -45.887;
        
        if (factoryGeoData.length > 0) {
            factoryLat = parseFloat(factoryGeoData[0].lat);
            factoryLng = parseFloat(factoryGeoData[0].lon);
        }

        if (statusEl) statusEl.innerText = "Calculando rota via OSRM...";

        // 3. Obter rota/distância real de carro via OSRM
        const routeUrl = `https://router.project-osrm.org/route/v1/driving/${factoryLng},${factoryLat};${clientLng},${clientLat}?overview=false`;
        const routeResponse = await fetch(routeUrl);
        if (!routeResponse.ok) throw new Error("Erro ao calcular rota de trânsito");
        const routeData = await routeResponse.json();

        if (!routeData.routes || routeData.routes.length === 0) {
            throw new Error("Nenhuma rota de trânsito encontrada entre a fábrica e o cliente.");
        }

        // Distância retornada pelo OSRM é em metros
        const distanceMeters = routeData.routes[0].distance;
        const distanceKm = distanceMeters / 1000;

        // Atualizar input
        const distInput = document.getElementById("doc-logistics-distance");
        if (distInput) {
            distInput.value = distanceKm.toFixed(1);
        }

        // Recalcular
        calculateDocLogistics();

        if (statusEl) {
            statusEl.style.color = "#00f0ff";
            statusEl.innerText = `Sucesso! Rota calculada com precisão: ${distanceKm.toFixed(1)} km de ida.`;
        }

    } catch (error) {
        console.error("Erro na busca de rota:", error);
        if (statusEl) {
            statusEl.style.color = "var(--color-danger)";
            statusEl.innerText = `Erro: ${error.message}`;
        }
        if (!silent) {
            window.showToast(`Não foi possível calcular a rota de forma 100% automática:\n${error.message}\n\nVocê pode usar os botões "Google Maps" ou "Waze" ao lado para abrir a rota no seu mapa e preenchê-la manualmente.`, "error");
        }
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalBtnHTML;
        }
    }
}

export function openDocRouteInGoogleMaps() {
    const clientAddress = document.getElementById("doc-address").value.trim();
    if (!clientAddress) {
        window.showToast("Por favor, insira o endereço do cliente primeiro!", "warning");
        return;
    }
    const factoryAddress = FACTORY_INFO.address || "Vale do Paraíba, São José dos Campos - SP";
    const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(factoryAddress)}&destination=${encodeURIComponent(clientAddress)}`;
    window.open(url, '_blank');
}

export function openDocRouteInWaze() {
    const clientAddress = document.getElementById("doc-address").value.trim();
    if (!clientAddress) {
        window.showToast("Por favor, insira o endereço do cliente primeiro!", "warning");
        return;
    }
    const url = `https://waze.com/ul?q=${encodeURIComponent(clientAddress)}&navigate=yes`;
    window.open(url, '_blank');
}

export async function fetchRentalRouteDistance(silent = false) {
    const clientAddress = document.getElementById("rental-address").value.trim();
    const statusEl = document.getElementById("rental-logistics-route-status");
    const btn = document.getElementById("btn-fetch-rental-route");

    if (!clientAddress) {
        if (!silent) {
            window.showToast("Por favor, insira o endereço do cliente no campo 'Endereço de Entrega' primeiro!", "warning");
        }
        return;
    }

    const factoryAddress = FACTORY_INFO.address || "Vale do Paraíba, São José dos Campos - SP";
    const originalBtnHTML = btn ? btn.innerHTML : "";
    
    try {
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<span class="spin-anim" style="display:inline-block; border: 2px solid #fff; border-top: 2px solid transparent; border-radius: 50%; width: 12px; height: 12px; margin-right: 6px; vertical-align: middle;"></span> Geocodificando...';
        }
        if (statusEl) {
            statusEl.style.color = "var(--color-text-muted)";
            statusEl.innerText = "Buscando coordenadas do endereço do cliente...";
        }

        let clientLat, clientLng;
        const rentalClientSelect = document.getElementById("rental-client-select");
        const rentalClientId = rentalClientSelect ? rentalClientSelect.value : "";
        const clientObj = rentalClientId ? state.clients.find(c => c.id === rentalClientId) : null;

        if (clientObj && clientObj.latitude && clientObj.longitude && !isNaN(parseFloat(clientObj.latitude)) && !isNaN(parseFloat(clientObj.longitude))) {
            clientLat = parseFloat(clientObj.latitude);
            clientLng = parseFloat(clientObj.longitude);
        } else {
            // 1. Geocodificar endereço do cliente via Nominatim
            const clientGeoUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(clientAddress)}&format=json&limit=1&email=contato@gelodovale.com.br`;
            const clientResponse = await fetch(clientGeoUrl);
            if (!clientResponse.ok) throw new Error("Erro ao buscar coordenadas do cliente");
            const clientGeoData = await clientResponse.json();
            
            if (clientGeoData.length === 0) {
                throw new Error("Endereço do cliente não encontrado. Tente digitar de forma mais simples (ex: Nome da Rua, Número, Cidade).");
            }

            clientLat = parseFloat(clientGeoData[0].lat);
            clientLng = parseFloat(clientGeoData[0].lon);
        }

        if (statusEl) statusEl.innerText = "Buscando coordenadas da fábrica...";
        if (btn) btn.innerHTML = '<span class="spin-anim" style="display:inline-block; border: 2px solid #fff; border-top: 2px solid transparent; border-radius: 50%; width: 12px; height: 12px; margin-right: 6px; vertical-align: middle;"></span> Roteirizando...';

        // 2. Geocodificar endereço da fábrica via Nominatim
        const factoryGeoUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(factoryAddress)}&format=json&limit=1&email=contato@gelodovale.com.br`;
        const factoryResponse = await fetch(factoryGeoUrl);
        if (!factoryResponse.ok) throw new Error("Erro ao buscar coordenadas da fábrica");
        const factoryGeoData = await factoryResponse.json();
        
        let factoryLat = -23.179; // Fallback para São José dos Campos caso falhe
        let factoryLng = -45.887;
        
        if (factoryGeoData.length > 0) {
            factoryLat = parseFloat(factoryGeoData[0].lat);
            factoryLng = parseFloat(factoryGeoData[0].lon);
        }

        if (statusEl) statusEl.innerText = "Calculando rota via OSRM...";

        // 3. Obter rota/distância real de carro via OSRM
        const routeUrl = `https://router.project-osrm.org/route/v1/driving/${factoryLng},${factoryLat};${clientLng},${clientLat}?overview=false`;
        const routeResponse = await fetch(routeUrl);
        if (!routeResponse.ok) throw new Error("Erro ao calcular rota de trânsito");
        const routeData = await routeResponse.json();

        if (!routeData.routes || routeData.routes.length === 0) {
            throw new Error("Nenhuma rota de trânsito encontrada entre a fábrica e o cliente.");
        }

        // Distância retornada pelo OSRM é em metros
        const distanceMeters = routeData.routes[0].distance;
        const distanceKm = distanceMeters / 1000;

        // Atualizar input
        const distInput = document.getElementById("logistics-distance");
        if (distInput) {
            distInput.value = distanceKm.toFixed(1);
        }

        // Recalcular
        calculateRentalLogistics();

        if (statusEl) {
            statusEl.style.color = "#00f0ff";
            statusEl.innerText = `Sucesso! Rota calculada com precisão: ${distanceKm.toFixed(1)} km de ida.`;
        }

    } catch (error) {
        console.error("Erro na busca de rota:", error);
        if (statusEl) {
            statusEl.style.color = "var(--color-danger)";
            statusEl.innerText = `Erro: ${error.message}`;
        }
        if (!silent) {
            window.showToast(`Não foi possível calcular a rota de forma 100% automática:\n${error.message}\n\nVocê pode usar os botões "Google Maps" ou "Waze" ao lado para abrir a rota no seu mapa e preenchê-la manualmente.`, "error");
        }
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalBtnHTML;
        }
    }
}

export function openRentalRouteInGoogleMaps() {
    const clientAddress = document.getElementById("rental-address").value.trim();
    if (!clientAddress) {
        window.showToast("Por favor, insira o endereço do cliente primeiro!", "warning");
        return;
    }
    const factoryAddress = FACTORY_INFO.address || "Vale do Paraíba, São José dos Campos - SP";
    const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(factoryAddress)}&destination=${encodeURIComponent(clientAddress)}`;
    window.open(url, '_blank');
}

export function openRentalRouteInWaze() {
    const clientAddress = document.getElementById("rental-address").value.trim();
    if (!clientAddress) {
        window.showToast("Por favor, insira o endereço do cliente primeiro!", "warning");
        return;
    }
    const url = `https://waze.com/ul?q=${encodeURIComponent(clientAddress)}&navigate=yes`;
    window.open(url, '_blank');
}

// --- Algoritmo TSP Offline (Nearest Neighbor) ---
function haversineDistance(coords1, coords2) {
    const [lat1, lon1] = coords1;
    const [lat2, lon2] = coords2;
    const R = 6371; // Raio da Terra em km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function solveTSP(startCoords, targets) {
    const tour = [];
    let currentCoords = startCoords;
    const unvisited = [...targets];
    
    while (unvisited.length > 0) {
        let nearestIdx = 0;
        let minDistance = Infinity;
        for (let i = 0; i < unvisited.length; i++) {
            const dist = haversineDistance(currentCoords, [unvisited[i].lat, unvisited[i].lng]);
            if (dist < minDistance) {
                minDistance = dist;
                nearestIdx = i;
            }
        }
        const nextNode = unvisited.splice(nearestIdx, 1)[0];
        tour.push(nextNode);
        currentCoords = [nextNode.lat, nextNode.lng];
    }
    return tour;
}

export async function getOptimizedRouteData() {
    const orderCheckboxes = document.querySelectorAll(".order-route-checkbox:checked");
    const visitCheckboxes = document.querySelectorAll(".visit-route-checkbox:checked");
    
    const uniqueIntermediaries = [];
    const clientDetails = [];
    
    orderCheckboxes.forEach(cb => {
        const orderId = cb.getAttribute("data-order-id");
        const order = (state.orders || []).find(o => o.id === orderId);
        if (order) {
            const client = (state.clients || []).find(c => c.id === order.clientId);
            if (client && client.address && client.address.trim() !== "") {
                const addr = client.address.trim();
                if (!uniqueIntermediaries.includes(addr)) {
                    uniqueIntermediaries.push(addr);
                    clientDetails.push({ 
                        id: client.id, 
                        name: client.name, 
                        address: addr, 
                        type: "Pedido",
                        latitude: client.latitude,
                        longitude: client.longitude
                    });
                }
            }
        }
    });
    
    visitCheckboxes.forEach(cb => {
        const clientId = cb.getAttribute("data-client-id");
        const client = (state.clients || []).find(c => c.id === clientId);
        if (client && client.address && client.address.trim() !== "") {
            const addr = client.address.trim();
            if (!uniqueIntermediaries.includes(addr)) {
                uniqueIntermediaries.push(addr);
                clientDetails.push({ 
                    id: client.id, 
                    name: client.name, 
                    address: addr, 
                    type: "Visita",
                    latitude: client.latitude,
                    longitude: client.longitude
                });
            }
        }
    });
    
    if (clientDetails.length === 0) {
        return null;
    }
    
    const factoryLat = -23.1791;
    const factoryLng = -45.8872;
    const factoryAddress = FACTORY_INFO.address || "Vale do Paraíba, São José dos Campos - SP";
    
    // Ler cache de geocodificacao
    let cache = {};
    try {
        const cached = localStorage.getItem("gelcontrol_geocode_cache");
        if (cached) cache = JSON.parse(cached);
    } catch (e) {
        console.warn("Erro ao ler cache de geocodificacao:", e);
    }
    
    const targets = [];
    let geocodingFailed = false;
    
    for (let i = 0; i < clientDetails.length; i++) {
        const item = clientDetails[i];
        const addr = item.address;
        
        // Se o cliente ja tem coordenadas GPS salvas
        if (item.latitude && item.longitude && !isNaN(parseFloat(item.latitude)) && !isNaN(parseFloat(item.longitude))) {
            targets.push({
                ...item,
                lat: parseFloat(item.latitude),
                lng: parseFloat(item.longitude)
            });
            continue;
        }
        
        if (cache[addr]) {
            targets.push({
                ...item,
                lat: cache[addr].lat,
                lng: cache[addr].lng
            });
            continue;
        }
        
        if (navigator.onLine) {
            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(addr)}&format=json&limit=1&email=contato@gelodovale.com.br`);
                if (response.ok) {
                    const data = await response.json();
                    if (data && data.length > 0) {
                        const lat = parseFloat(data[0].lat);
                        const lng = parseFloat(data[0].lon);
                        targets.push({
                            ...item,
                            lat,
                            lng
                        });
                        cache[addr] = { lat, lng };
                        continue;
                    }
                }
            } catch (err) {
                console.warn(`Erro de rede ao geocodificar: ${addr}`, err);
            }
        }
        
        geocodingFailed = true;
    }
    
    // Salvar cache
    try {
        localStorage.setItem("gelcontrol_geocode_cache", JSON.stringify(cache));
    } catch (e) {}
    
    // Resolver TSP
    let tour = [];
    if (targets.length > 0) {
        tour = solveTSP([factoryLat, factoryLng], targets);
    }
    
    // Se algum ponto falhou na geocodificacao, adicionamos no fim do tour
    const geocodedAddresses = targets.map(t => t.address);
    clientDetails.forEach(item => {
        if (!geocodedAddresses.includes(item.address)) {
            tour.push({
                ...item,
                lat: factoryLat + (Math.random() - 0.5) * 0.01,
                lng: factoryLng + (Math.random() - 0.5) * 0.01
            });
        }
    });
    
    return {
        tour,
        factoryLat,
        factoryLng,
        factoryAddress,
        geocodingFailed
    };
}

export async function optimizeDeliveryRoute() {
    const orderCheckboxes = document.querySelectorAll(".order-route-checkbox:checked");
    const visitCheckboxes = document.querySelectorAll(".visit-route-checkbox:checked");
    
    if (orderCheckboxes.length === 0 && visitCheckboxes.length === 0) {
        window.showToast("Por favor, selecione pelo menos um pedido ou sugestão de visita para traçar a rota.", "warning");
        return;
    }
    
    window.showToast("Otimizando ordem das entregas (TSP)...", "info");
    
    const routeData = await getOptimizedRouteData();
    if (!routeData) {
        window.showToast("Nenhum endereço válido encontrado nos itens selecionados.", "warning");
        return;
    }
    
    const addresses = [
        routeData.factoryAddress,
        ...routeData.tour.map(t => t.address),
        routeData.factoryAddress
    ];
    
    const baseUrl = "https://www.google.com/maps/dir/";
    const routeUrl = baseUrl + addresses.map(addr => encodeURIComponent(addr)).join("/");
    
    window.open(routeUrl, "_blank");
}

export async function shareOptimizedRouteWhatsApp() {
    const orderCheckboxes = document.querySelectorAll(".order-route-checkbox:checked");
    const visitCheckboxes = document.querySelectorAll(".visit-route-checkbox:checked");
    
    if (orderCheckboxes.length === 0 && visitCheckboxes.length === 0) {
        window.showToast("Por favor, selecione pelo menos um pedido ou sugestão de visita para compartilhar a rota.", "warning");
        return;
    }
    
    window.showToast("Gerando roteiro otimizado...", "info");
    
    const routeData = await getOptimizedRouteData();
    if (!routeData) {
        window.showToast("Nenhum endereço válido encontrado nos itens selecionados.", "warning");
        return;
    }
    
    const addresses = [
        routeData.factoryAddress,
        ...routeData.tour.map(t => t.address),
        routeData.factoryAddress
    ];
    const baseUrl = "https://www.google.com/maps/dir/";
    const routeUrl = baseUrl + addresses.map(addr => encodeURIComponent(addr)).join("/");
    
    // Montar texto WhatsApp
    let msg = `❄️ *GELO DO VALE - ROTEIRO DE ENTREGAS OTIMIZADO* 🚚\n\n`;
    msg += `Olá, segue a rota de entregas otimizada para o dia de hoje (menor caminho calculado):\n\n`;
    msg += `📍 *1. Partida:* Fábrica\n`;
    
    routeData.tour.forEach((c, idx) => {
        msg += `📦 *${idx + 2}. ${c.name}* (${c.type})\n`;
        msg += `   └ Endereço: ${c.address}\n`;
    });
    
    msg += `📍 *${routeData.tour.length + 2}. Retorno:* Fábrica\n\n`;
    msg += `🗺️ *Link do Mapa Otimizado (Google Maps):*\n${routeUrl}`;
    
    if (!navigator.onLine) {
        navigator.clipboard.writeText(msg)
            .then(() => {
                window.showToast("📶 Você está offline!\nO roteiro de entregas e link do Google Maps foram copiados para a sua área de transferência para colar manualmente.", "info");
            })
            .catch(() => {
                window.showToast("Erro ao copiar o roteiro.", "error");
            });
        return;
    }
    
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.open(whatsappUrl, "_blank");
}

let leafletMap = null;
let leafletRouteLayer = null;
let leafletMarkers = [];

export function initLeafletRouteMap() {
    const mapDiv = document.getElementById("leaflet-route-map");
    if (!mapDiv) return;

    if (leafletMap) {
        drawRouteOnLeafletMap();
        return;
    }

    const factoryLat = -23.1791;
    const factoryLng = -45.8872;

    try {
        leafletMap = L.map('leaflet-route-map').setView([factoryLat, factoryLng], 12);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap'
        }).addTo(leafletMap);

        // Delegated event listener for route checkbox changes
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('order-route-checkbox') || e.target.classList.contains('visit-route-checkbox')) {
                drawRouteOnLeafletMap();
            }
        });

        drawRouteOnLeafletMap();
    } catch (e) {
        console.error("Erro ao inicializar mapa Leaflet:", e);
        showLeafletFallback();
    }
}

function showLeafletFallback(tour = null) {
    const fallbackDiv = document.getElementById("leaflet-route-fallback");
    if (!fallbackDiv) return;
    
    fallbackDiv.style.display = "block";
    fallbackDiv.innerHTML = `
        <div style="display:flex; align-items:center; gap:6px; color:var(--color-primary); margin-bottom:6px; font-weight:bold;">
            <i data-lucide="map-pin" style="width:14px; height:14px;"></i> Roteiro Sequencial Otimizado (TSP)
        </div>
        <div style="margin-bottom: 4px; font-size: 0.72rem;">Ordem de visitas sugerida para economizar combustível:</div>
        <ol style="margin: 6px 0 0 16px; padding: 0; line-height: 1.5;" id="route-textual-list"></ol>
    `;
    
    const list = document.getElementById("route-textual-list");
    if (!list) return;
    list.innerHTML = "";
    
    const factoryAddress = FACTORY_INFO.address || "Vale do Paraíba, São José dos Campos - SP";
    list.innerHTML += `<li><strong>Saída:</strong> ${factoryAddress}</li>`;
    
    if (tour && tour.length > 0) {
        tour.forEach((item, idx) => {
            list.innerHTML += `<li><strong>[${idx + 1}] ${item.name}</strong> (${item.type}): ${item.address}</li>`;
        });
    } else {
        const orderCheckboxes = document.querySelectorAll(".order-route-checkbox:checked");
        const visitCheckboxes = document.querySelectorAll(".visit-route-checkbox:checked");

        let index = 1;
        orderCheckboxes.forEach(cb => {
            const orderId = cb.getAttribute("data-order-id");
            const order = (state.orders || []).find(o => o.id === orderId);
            if (order) {
                const client = (state.clients || []).find(c => c.id === order.clientId);
                if (client && client.address) {
                    list.innerHTML += `<li><strong>[${index++}] ${client.name}</strong> (Pedido): ${client.address}</li>`;
                }
            }
        });

        visitCheckboxes.forEach(cb => {
            const clientId = cb.getAttribute("data-client-id");
            const client = (state.clients || []).find(c => c.id === clientId);
            if (client && client.address) {
                list.innerHTML += `<li><strong>[${index++}] ${client.name}</strong> (Visita): ${client.address}</li>`;
            }
        });
    }
    
    list.innerHTML += `<li><strong>Retorno:</strong> ${factoryAddress}</li>`;
    if (window.lucide) window.lucide.createIcons();
}

export async function drawRouteOnLeafletMap() {
    if (!leafletMap) {
        showLeafletFallback();
        return;
    }

    leafletMarkers.forEach(m => leafletMap.removeLayer(m));
    leafletMarkers = [];
    if (leafletRouteLayer) {
        leafletMap.removeLayer(leafletRouteLayer);
        leafletRouteLayer = null;
    }

    const orderCheckboxes = document.querySelectorAll(".order-route-checkbox:checked");
    const visitCheckboxes = document.querySelectorAll(".visit-route-checkbox:checked");

    if (orderCheckboxes.length === 0 && visitCheckboxes.length === 0) {
        document.getElementById("leaflet-route-fallback").style.display = "block";
        document.getElementById("leaflet-route-fallback").innerText = "Selecione pedidos ou visitas para ver a rota no mapa.";
        return;
    }

    document.getElementById("leaflet-route-fallback").style.display = "none";

    const routeData = await getOptimizedRouteData();
    if (!routeData) {
        showLeafletFallback();
        return;
    }

    // Ponto de partida
    const factoryMarker = L.marker([routeData.factoryLat, routeData.factoryLng], {
        title: "Fábrica - Partida/Retorno",
        icon: L.divIcon({
            className: 'custom-div-icon',
            html: "<div style='background-color:#0072ff; width:12px; height:12px; border-radius:50%; border:2px solid #fff; box-shadow:0 0 8px #0072ff;'></div>",
            iconSize: [12, 12]
        })
    }).addTo(leafletMap).bindPopup(`<b>Fábrica (Partida/Retorno)</b><br>${routeData.factoryAddress}`);
    leafletMarkers.push(factoryMarker);

    const waypoints = [[routeData.factoryLat, routeData.factoryLng]];

    // Desenhar cada ponto do tour otimizado
    routeData.tour.forEach((item, idx) => {
        waypoints.push([item.lat, item.lng]);

        const m = L.marker([item.lat, item.lng], {
            title: item.name,
            icon: L.divIcon({
                className: 'custom-div-icon',
                html: `<div style='background-color:#00f0ff; width:22px; height:22px; border-radius:50%; border:2px solid #fff; box-shadow:0 0 8px #00f0ff; display:flex; align-items:center; justify-content:center; color:#0a0e17; font-size:0.75rem; font-weight:800;'>${idx + 1}</div>`,
                iconSize: [22, 22]
            })
        }).addTo(leafletMap).bindPopup(`<b>Parada ${idx + 1}: ${item.name}</b> (${item.type})<br>${item.address}`);
        leafletMarkers.push(m);
    });

    waypoints.push([routeData.factoryLat, routeData.factoryLng]);

    showLeafletFallback(routeData.tour);

    leafletRouteLayer = L.polyline(waypoints, {
        color: '#00f0ff',
        weight: 4,
        opacity: 0.7,
        dashArray: '5, 10'
    }).addTo(leafletMap);

    try {
        const group = new L.featureGroup(leafletMarkers);
        leafletMap.fitBounds(group.getBounds().pad(0.1));
    } catch (e) {
        console.warn("Erro ao ajustar zoom do Leaflet:", e);
    }
}

// Bind to window for HTML accessibility
window.shareOptimizedRouteWhatsApp = shareOptimizedRouteWhatsApp;
window.toggleRentalLogisticsCalc = toggleRentalLogisticsCalc;
window.updateLogisticsTollMultiplier = updateLogisticsTollMultiplier;
window.calculateRentalLogistics = calculateRentalLogistics;
window.applyCalculatedLogistics = applyCalculatedLogistics;
window.toggleDocLogisticsCalc = toggleDocLogisticsCalc;
window.updateDocLogisticsTollMultiplier = updateDocLogisticsTollMultiplier;
window.calculateDocLogistics = calculateDocLogistics;
window.applyDocCalculatedLogistics = applyDocCalculatedLogistics;
window.fetchDocRouteDistance = fetchDocRouteDistance;
window.openDocRouteInGoogleMaps = openDocRouteInGoogleMaps;
window.openDocRouteInWaze = openDocRouteInWaze;
window.fetchRentalRouteDistance = fetchRentalRouteDistance;
window.openRentalRouteInGoogleMaps = openRentalRouteInGoogleMaps;
window.openRentalRouteInWaze = openRentalRouteInWaze;
window.optimizeDeliveryRoute = optimizeDeliveryRoute;
window.initLeafletRouteMap = initLeafletRouteMap;
window.drawRouteOnLeafletMap = drawRouteOnLeafletMap;
