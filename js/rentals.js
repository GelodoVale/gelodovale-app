import { state, saveState, FACTORY_INFO } from './state.js';

export function renderTinas() {
    const tinasGrid = document.getElementById("rental-grid-container");
    if (!tinasGrid) return;
    tinasGrid.innerHTML = "";

    const searchQuery = document.getElementById("search-rental").value.toLowerCase().trim();
    const filterStatus = document.getElementById("filter-rental-status").value;

    const filteredRentals = (state.rentals || []).filter(r => {
        const matchesSearch = (r.clientName || '').toLowerCase().includes(searchQuery) ||
                              (r.tinaCode || '').toLowerCase().includes(searchQuery);
        const matchesStatus = filterStatus === "all" || r.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    if (filteredRentals.length === 0) {
        tinasGrid.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1; padding: 3rem;">
                <i data-lucide="help-circle" style="width:48px; height:48px; margin-bottom:1rem; opacity:0.3;"></i>
                <p>Nenhum aluguel de equipamento ou mobiliário encontrado com os filtros selecionados.</p>
            </div>
        `;
        if (window.lucide) window.lucide.createIcons();
        return;
    }

    filteredRentals.forEach(r => {
        let statusBadge = "";
        let borderClass = "";
        
        if (r.status === "returned") {
            statusBadge = `<span class="badge badge-success">Devolvido</span>`;
            borderClass = "border: 1px solid rgba(16, 185, 129, 0.2);";
        } else {
            // Verificar atraso
            const expectedDate = new Date(r.expectedReturnDate + 'T23:59:59');
            const today = new Date();
            if (today > expectedDate) {
                statusBadge = `<span class="badge badge-danger">Atrasado</span>`;
                borderClass = "border: 1px solid rgba(239, 68, 68, 0.3); box-shadow: 0 0 10px rgba(239, 68, 68, 0.1);";
                r.status = "overdue"; // Atualiza status dinamicamente
            } else {
                statusBadge = `<span class="badge badge-warning">Ativo</span>`;
                borderClass = "border: 1px solid rgba(245, 158, 11, 0.2);";
            }
        }

        // Tipo de Item formatado com ícone
        const matchingProd = state.products.find(p => p.id === r.itemType);
        let typeIcon = `<i data-lucide="archive" style="width: 16px; height: 16px; color: var(--color-primary);"></i>`;
        let typeLabel = (matchingProd ? matchingProd.name : r.itemType) + (r.tinaColor ? ` (${r.tinaColor})` : "");
        if (r.itemType === "mesa" || r.itemType === "mesa_cadeiras") {
            typeIcon = `<i data-lucide="sofa" style="width: 16px; height: 16px; color: #f59e0b;"></i>`;
        }

        // Resumo do Gelo e Carvão (dinâmico)
        let iceSummary = "";
        if (r.iceItems) {
            const itemsArr = [];
            state.products.forEach(p => {
                const qty = r.iceItems[p.id] || 0;
                if (qty > 0) {
                    itemsArr.push(`${qty}x ${p.name}`);
                }
            });
            if (itemsArr.length > 0) {
                iceSummary = `
                    <div style="margin-top: 5px; padding: 6px 8px; background: rgba(0, 240, 255, 0.04); border-left: 2px solid var(--color-primary); border-radius: 2px;">
                        <span style="font-size: 0.7rem; display:block; color:var(--color-primary); font-weight:bold; margin-bottom: 2px;">❄️ Venda Junto:</span>
                        <strong style="color:var(--color-text-main); font-size: 0.75rem;">${itemsArr.join(", ")}</strong>
                    </div>
                `;
            }
        }

        const totalGeral = r.totalRevenue !== undefined ? r.totalRevenue : ((r.rentalFee || 0) + (r.deliveryFee || 0) + (r.pickupFee || 0));

        let locationImageSnippet = "";
        if (r.photoRentalLocation) {
            locationImageSnippet = `
                <div style="margin-bottom: 8px; position: relative; width: 100%;">
                    <span style="position: absolute; top: 4px; left: 4px; background: rgba(0,0,0,0.6); padding: 2px 6px; font-size: 0.65rem; border-radius: 3px; color: #fff; font-weight: 600;">📍 Foto do Local</span>
                    <img src="${r.photoRentalLocation}" style="width: 100%; max-height: 120px; object-fit: cover; border-radius: 4px; border: 1px solid rgba(255,255,255,0.05); cursor: pointer;" onclick="window.open('${r.photoRentalLocation}', '_blank')">
                </div>
            `;
        }

        let shippingLabel = r.shippingType === "retirada" ? "📥 Cliente Retira" : "🚚 Entrega & Busca";
        let shippingBadge = `<span style="font-size: 0.65rem; padding: 2px 6px; border-radius: 3px; background: rgba(255,255,255,0.06); font-weight: 500; color: var(--color-text-muted); display: inline-block; margin-top: 4px;">${shippingLabel}</span>`;

        let addressSnippet = r.address || 'Não informado';
        if (r.address && r.address.trim() !== "" && r.address !== "Retirada pelo Cliente na Fábrica") {
            const factoryAddr = FACTORY_INFO.address || "Vale do Paraíba, São José dos Campos - SP";
            addressSnippet = `
                ${r.address}
                <a href="https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(factoryAddr)}&destination=${encodeURIComponent(r.address)}" 
                   target="_blank" 
                   title="Abrir Rota no Google Maps" 
                   style="margin-left: 8px; padding: 2px 6px; font-size: 0.7rem; background: rgba(0, 240, 255, 0.08); border: 1px solid rgba(0, 240, 255, 0.25); border-radius: 3px; color: var(--color-primary); text-decoration: none; display: inline-flex; align-items: center; gap: 4px; vertical-align: middle; transition: all 0.2s;">
                    <i data-lucide="map-pin" style="width: 12px; height: 12px;"></i> Rota
                </a>
            `;
        }

        let logisticsSummary = "";
        if (r.logisticsDistance !== undefined && r.logisticsDistance > 0) {
            const tripDist = r.logisticsDistance * 2;
            const tripTimeHours = tripDist / (r.logisticsAvgSpeed || 60);
            const tripTotalMin = Math.round(tripTimeHours * 60);
            const tripH = Math.floor(tripTotalMin / 60);
            const tripM = tripTotalMin % 60;
            
            let vehLabel = "Passeio (1.0x)";
            if (r.logisticsVehicleType === "carretinha") vehLabel = "Carretinha (1.5x)";
            else if (r.logisticsVehicleType === "trucado") vehLabel = "Trucado (2.0x)";
            else if (r.logisticsVehicleType === "personalizado") vehLabel = `Personalizado (${r.logisticsTollMultiplier || 1.0}x)`;

            const tollLegs = r.logisticsTollReturn ? 2 : 1;
            const tollBase = r.logisticsTollBase || 0;
            const tollMult = r.logisticsTollMultiplier || 1.0;
            const tripToll = tollBase * tollMult * tollLegs;

            logisticsSummary = `
                <div style="margin-top: 8px; padding: 8px; background: rgba(0, 240, 255, 0.03); border: 1px dashed rgba(0, 240, 255, 0.15); border-radius: 4px;">
                    <span style="font-size: 0.7rem; display:block; color:var(--color-primary); font-weight:bold; margin-bottom: 4px; display: flex; align-items: center; gap: 4px;">
                        <i data-lucide="navigation" style="width: 12px; height: 12px;"></i> Dados de Logística:
                    </span>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 0.72rem; color: var(--color-text-muted);">
                        <div>Dist. Ida: <strong style="color: #fff;">${(parseFloat(r.logisticsDistance) || 0).toFixed(1)} km</strong></div>
                        <div>Tempo Viagem: <strong style="color: #fff;">${tripH}h ${tripM}m</strong></div>
                        <div>Veículo: <strong style="color: #fff;">${vehLabel}</strong></div>
                        <div>Pedágios: <strong style="color: #fff;">R$ ${(parseFloat(tripToll) || 0).toFixed(2)} /viagem</strong></div>
                    </div>
                </div>
            `;
        }

        tinasGrid.innerHTML += `
            <div class="freezer-card" style="display: flex; flex-direction: column; justify-content: space-between; ${borderClass}">
                <div class="freezer-card-header">
                    <div>
                        <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 2px;">
                            ${typeIcon}
                            <span style="font-size: 0.75rem; font-weight: 600; color: var(--color-text-muted);">${typeLabel}</span>
                        </div>
                        <h4 style="font-weight: 700; font-size: 1rem; color: var(--color-text-main);">${r.tinaCode}</h4>
                        <span style="font-size: 0.75rem; color: var(--color-text-muted);">ID: ${r.id}</span>
                        <div>${shippingBadge}</div>
                    </div>
                    ${statusBadge}
                </div>
                <div class="freezer-card-body" style="padding: 1rem; font-size: 0.8rem; display: flex; flex-direction: column; gap: 6px;">
                    ${locationImageSnippet}
                    <div><strong>Cliente:</strong> ${r.clientName}</div>
                    <div><strong>Endereço:</strong> ${addressSnippet}</div>
                    <div><strong>Contato:</strong> ${r.phone || 'Não informado'}</div>
                    <div style="margin-top: 5px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; background: rgba(255,255,255,0.02); padding: 8px; border-radius: 4px;">
                        <div>
                            <span style="display:block; font-size: 0.7rem; color:var(--color-text-muted);">Entrega (${r.rentalDays || 7} dias)</span>
                            <strong>${new Date(r.deliveryDate + 'T00:00:00').toLocaleDateString('pt-BR')}</strong>
                        </div>
                        <div>
                            <span style="display:block; font-size: 0.7rem; color:var(--color-text-muted);">Previsão Retirada</span>
                            <strong>${new Date(r.expectedReturnDate + 'T00:00:00').toLocaleDateString('pt-BR')}</strong>
                        </div>
                    </div>
                    ${iceSummary}
                    ${logisticsSummary}
                    <div style="display: flex; flex-direction: column; gap: 3px; margin-top: 6px; font-size: 0.75rem; color: var(--color-text-muted); border-top: 1px dashed rgba(255,255,255,0.05); padding-top: 6px;">
                        <div style="display: flex; justify-content: space-between;">
                            <span>Aluguel base:</span>
                            <span>R$ ${(r.rentalFee || 0).toFixed(2)}</span>
                        </div>
                        ${r.shippingType !== "retirada" ? `
                        <div style="display: flex; justify-content: space-between;">
                            <span>Fretes (Entrega + Busca):</span>
                            <span>R$ ${((r.deliveryFee || 0) + (r.pickupFee || 0)).toFixed(2)}</span>
                        </div>
                        ` : ''}
                        ${r.extraDayFee > 0 ? `
                        <div style="display: flex; justify-content: space-between; font-style: italic;">
                            <span>Diária Extra:</span>
                            <span>R$ ${(r.extraDayFee || 0).toFixed(2)} / dia</span>
                        </div>
                        ` : ''}
                        ${r.extraFee > 0 ? `
                        <div style="display: flex; justify-content: space-between; color: #ef4444; font-weight: 500;">
                            <span>Atraso (${r.extraDays} dias extras):</span>
                            <span>+ R$ ${(r.extraFee || 0).toFixed(2)}</span>
                        </div>
                        ` : ''}
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-top: 4px; font-weight: 600; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 4px;">
                        <span>Total Faturado:</span>
                        <span style="color: var(--color-primary); font-size: 0.9rem;">R$ ${(parseFloat(totalGeral) || 0).toFixed(2)}</span>
                    </div>
                    ${r.returnDate ? `<div style="color: var(--color-primary); font-weight: 600; margin-top: 4px;">✓ Devolvido em: ${new Date(r.returnDate + 'T00:00:00').toLocaleDateString('pt-BR')}</div>` : ''}
                    ${r.notes ? `<div style="font-style: italic; font-size: 0.75rem; color: var(--color-text-muted); border-top: 1px solid rgba(255,255,255,0.03); padding-top: 4px; margin-top: 4px;">Obs: ${r.notes}</div>` : ''}
                </div>
                <div class="freezer-card-actions" style="padding: 0.75rem 1rem; display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 8px; background: rgba(0,0,0,0.1);">
                    ${r.status !== "returned" ? `
                        <button class="btn btn-primary" onclick="returnRental('${r.id}')" style="margin-right: auto; padding: 4px 8px; font-size: 0.75rem; display: inline-flex; align-items: center; gap: 4px;">
                            <i data-lucide="check" style="width: 14px; height: 14px;"></i> Receber
                        </button>
                    ` : ''}
                    <button class="btn btn-secondary btn-icon-only" onclick="openRentalStickerModal('${r.id}')" title="Gerar Etiqueta QR de Locação">
                        <i data-lucide="qr-code" style="width: 15px; height: 15px;"></i>
                    </button>
                    <button class="btn btn-secondary btn-icon-only" onclick="openTinaPermanentStickerModal('${r.id}')" title="Gerar Etiqueta QR Permanente (Sem dados de aluguel)" style="${r.status === "returned" ? "margin-right: auto;" : ""}">
                        <i data-lucide="tag" style="width: 15px; height: 15px; color: var(--color-primary);"></i>
                    </button>
                    <button class="btn btn-secondary btn-icon-only" onclick="openRentalContract('${r.id}')" title="Contrato de Aluguel">
                        <i data-lucide="file-text" style="width: 15px; height: 15px;"></i>
                    </button>
                    <button class="btn btn-secondary btn-icon-only" onclick="openRentalModal('${r.id}')" title="Editar Aluguel">
                        <i data-lucide="edit-3" style="width: 15px; height: 15px;"></i>
                    </button>
                    <button class="btn btn-danger btn-icon-only" onclick="deleteRental('${r.id}')" title="Excluir Aluguel">
                        <i data-lucide="trash-2" style="width: 15px; height: 15px;"></i>
                    </button>
                </div>
            </div>
        `;
    });

    if (window.lucide) window.lucide.createIcons();
}

export function quickCreateRentalItem() {
    if (sessionStorage.getItem("admin_authenticated") !== "true") {
        window.postAdminAuthAction = "quickCreateRentalItem";
        document.getElementById("modal-admin-auth").classList.add("active");
        return;
    }
    
    // Abrir o modal de produto pré-configurado como Equipamento
    if (window.openProductModal) {
        window.openProductModal();
    }
    const prodType = document.getElementById("prod-type");
    if (prodType) {
        prodType.value = "Equipamento";
    }
    if (window.toggleProductSubfields) {
        window.toggleProductSubfields();
    }
}

export function toggleRentalShippingFields() {
    const shippingType = document.getElementById("rental-shipping-type").value;
    const feesRow = document.getElementById("rental-fees-row");
    const deliveryFeeInput = document.getElementById("rental-delivery-fee");
    const pickupFeeInput = document.getElementById("rental-pickup-fee");
    const addressInput = document.getElementById("rental-address");
    const logisticsContainer = document.getElementById("rental-logistics-calc-container");
    
    if (shippingType === "retirada") {
        if (feesRow) feesRow.style.display = "none";
        if (logisticsContainer) logisticsContainer.style.display = "none";
        if (deliveryFeeInput) deliveryFeeInput.value = "0.00";
        if (pickupFeeInput) pickupFeeInput.value = "0.00";
        if (addressInput && (!addressInput.value.trim() || addressInput.value.trim() === "Retirada pelo Cliente na Fábrica")) {
            addressInput.value = "Retirada pelo Cliente na Fábrica";
        }
    } else {
        if (feesRow) feesRow.style.display = "grid";
        if (logisticsContainer) logisticsContainer.style.display = "block";
        if (addressInput && addressInput.value === "Retirada pelo Cliente na Fábrica") {
            addressInput.value = "";
        }
    }
}

export function updateRentalDates(trigger) {
    const deliveryInput = document.getElementById("rental-delivery-date");
    const daysInput = document.getElementById("rental-days");
    const returnInput = document.getElementById("rental-expected-return");
    
    if (!deliveryInput || !deliveryInput.value) return;
    
    const deliveryDate = new Date(deliveryInput.value + 'T00:00:00');
    
    if (trigger === 'delivery-date' || trigger === 'days') {
        const days = parseInt(daysInput.value) || 1;
        if (days < 1 && daysInput) {
            daysInput.value = 1;
        }
        const returnDate = new Date(deliveryDate);
        returnDate.setDate(deliveryDate.getDate() + (parseInt(daysInput.value) || 1));
        if (returnInput) returnInput.value = returnDate.toISOString().split('T')[0];
    } else if (trigger === 'return-date') {
        if (!returnInput || !returnInput.value) return;
        const returnDate = new Date(returnInput.value + 'T00:00:00');
        const diffTime = returnDate - deliveryDate;
        let days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (days < 1) {
            days = 1;
            if (daysInput) daysInput.value = 1;
            const newReturnDate = new Date(deliveryDate);
            newReturnDate.setDate(deliveryDate.getDate() + 1);
            if (returnInput) returnInput.value = newReturnDate.toISOString().split('T')[0];
        } else {
            if (daysInput) daysInput.value = days;
        }
    }
}

export function openRentalModal(rentalId = null) {
    const modal = document.getElementById("modal-rental");
    const form = document.getElementById("rental-form");
    const title = document.getElementById("rental-modal-title");
    const clientSelect = document.getElementById("rental-client-select");

    if (!modal || !form) return;

    form.reset();
    document.getElementById("form-rental-id").value = "";
    if (clientSelect) {
        clientSelect.innerHTML = '<option value="">-- Cliente Avulso (Preencher Manualmente) --</option>';
        (state.clients || []).forEach(c => {
            clientSelect.innerHTML += `<option value="${c.id}">${c.name}</option>`;
        });
    }

    // Datas padrão
    const today = window.getBrazilTimeISO().split('T')[0];
    const deliveryDateEl = document.getElementById("rental-delivery-date");
    if (deliveryDateEl) deliveryDateEl.value = today;
    
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const expectedReturnEl = document.getElementById("rental-expected-return");
    if (expectedReturnEl) expectedReturnEl.value = nextWeek.toISOString().split('T')[0];

    // Resetar quantidades de produtos e informações gerais
    const activeEquips = (state.products || []).filter(p => p.active && p.type === "Equipamento");
    const defaultEquipId = activeEquips.length > 0 ? activeEquips[0].id : "";
    const defaultEquipPrice = activeEquips.length > 0 ? activeEquips[0].defaultPrice : 0;

    document.getElementById("form-rental-id").value = "";
    if (clientSelect) clientSelect.value = "";
    document.getElementById("rental-client-name").value = "";
    document.getElementById("rental-address").value = "";
    document.getElementById("rental-phone").value = "";
    
    renderRentalModalProducts(null);
    populateRentalEquipmentDropdown(null);

    const itemTypeEl = document.getElementById("rental-item-type");
    if (itemTypeEl && defaultEquipId) {
        itemTypeEl.value = defaultEquipId;
    }
    document.getElementById("rental-tina-color").value = "Azul";
    document.getElementById("rental-fee").value = defaultEquipPrice.toFixed(2);
    document.getElementById("rental-delivery-fee").value = "0.00";
    document.getElementById("rental-pickup-fee").value = "0.00";
    document.getElementById("rental-extra-day-fee").value = "0.00";
    document.getElementById("rental-days").value = "7";
    document.getElementById("rental-shipping-type").value = "entrega";
    document.getElementById("rental-notes").value = "";
    document.getElementById("photo-rental-location-data").value = "";
    document.getElementById("preview-rental-location").innerHTML = "<p style='font-size: 0.75rem; color: var(--color-text-muted);'>Nenhuma foto carregada</p>";
    
    // Resetar/Inicializar calculadora com configurações salvas
    const logSettings = state.logisticsSettings || {
        fuelPrice: 5.80,
        fuelConsumption: 10.0,
        avgSpeed: 60,
        tollBase: 0.00,
        vehicleType: "passeio",
        tollMultiplier: 1.0,
        markupPercent: 0,
        markupFixed: 0.00,
        tollReturn: true
    };
    document.getElementById("logistics-distance").value = "0.0";
    document.getElementById("logistics-avg-speed").value = logSettings.avgSpeed;
    document.getElementById("logistics-vehicle-type").value = logSettings.vehicleType;
    document.getElementById("logistics-toll-base").value = (parseFloat(logSettings.tollBase) || 0).toFixed(2);
    document.getElementById("logistics-toll-multiplier").value = (parseFloat(logSettings.tollMultiplier) || 0).toFixed(1);
    document.getElementById("logistics-fuel-price").value = (parseFloat(logSettings.fuelPrice) || 0).toFixed(2);
    document.getElementById("logistics-fuel-consumption").value = (parseFloat(logSettings.fuelConsumption) || 0).toFixed(1);
    document.getElementById("logistics-markup-percent").value = logSettings.markupPercent;
    document.getElementById("logistics-markup-fixed").value = (parseFloat(logSettings.markupFixed) || 0).toFixed(2);
    document.getElementById("logistics-toll-return").checked = logSettings.tollReturn;

    const calcContent = document.getElementById("rental-logistics-calc-content");
    if (calcContent) calcContent.style.display = "none";
    const toggleIcon = document.getElementById("logistics-toggle-icon");
    if (toggleIcon) toggleIcon.innerText = "▼";
    
    if (window.updateLogisticsTollMultiplier) window.updateLogisticsTollMultiplier();
    if (window.calculateRentalLogistics) window.calculateRentalLogistics();
    toggleRentalShippingFields();

    if (rentalId) {
        if (title) title.innerText = "Editar Aluguel";
        const r = (state.rentals || []).find(item => item.id === rentalId);
        if (r) {
            document.getElementById("form-rental-id").value = r.id;
            if (clientSelect) clientSelect.value = r.clientId || "";
            document.getElementById("rental-client-name").value = r.clientName;
            document.getElementById("rental-address").value = r.address || "";
            document.getElementById("rental-phone").value = r.phone || "";
            renderRentalModalProducts(r);
            if (itemTypeEl) itemTypeEl.value = r.itemType;
            populateRentalEquipmentDropdown(r.tinaCode);
            document.getElementById("rental-tina-color").value = r.tinaColor || "Azul";
            document.getElementById("rental-fee").value = r.rentalFee;
            document.getElementById("rental-delivery-fee").value = r.deliveryFee;
            document.getElementById("rental-pickup-fee").value = r.pickupFee || 0;
            document.getElementById("rental-extra-day-fee").value = r.extraDayFee || 0;
            document.getElementById("rental-days").value = r.rentalDays || 7;
            document.getElementById("rental-shipping-type").value = r.shippingType || "entrega";

            // Se o aluguel tem dados da calculadora persistidos, preencher
            if (r.logisticsDistance !== undefined) {
                document.getElementById("logistics-distance").value = r.logisticsDistance;
                document.getElementById("logistics-avg-speed").value = r.logisticsAvgSpeed || logSettings.avgSpeed;
                document.getElementById("logistics-vehicle-type").value = r.logisticsVehicleType || logSettings.vehicleType;
                document.getElementById("logistics-toll-base").value = (parseFloat(r.logisticsTollBase !== undefined ? r.logisticsTollBase : logSettings.tollBase) || 0).toFixed(2);
                document.getElementById("logistics-toll-multiplier").value = (parseFloat(r.logisticsTollMultiplier !== undefined ? r.logisticsTollMultiplier : logSettings.tollMultiplier) || 0).toFixed(1);
                document.getElementById("logistics-fuel-price").value = (parseFloat(r.logisticsFuelPrice !== undefined ? r.logisticsFuelPrice : logSettings.fuelPrice) || 0).toFixed(2);
                document.getElementById("logistics-fuel-consumption").value = (parseFloat(r.logisticsFuelConsumption !== undefined ? r.logisticsFuelConsumption : logSettings.fuelConsumption) || 0).toFixed(1);
                document.getElementById("logistics-markup-percent").value = (r.logisticsMarkupPercent !== undefined ? r.logisticsMarkupPercent : logSettings.markupPercent);
                document.getElementById("logistics-markup-fixed").value = (parseFloat(r.logisticsMarkupFixed !== undefined ? r.logisticsMarkupFixed : logSettings.markupFixed) || 0).toFixed(2);
                document.getElementById("logistics-toll-return").checked = (r.logisticsTollReturn !== undefined ? r.logisticsTollReturn : logSettings.tollReturn);
                if (window.updateLogisticsTollMultiplier) window.updateLogisticsTollMultiplier();
                if (window.calculateRentalLogistics) window.calculateRentalLogistics();
            }
            if (deliveryDateEl) deliveryDateEl.value = r.deliveryDate;
            if (expectedReturnEl) expectedReturnEl.value = r.expectedReturnDate;
            document.getElementById("rental-notes").value = r.notes || "";
            if (r.photoRentalLocation) {
                document.getElementById("photo-rental-location-data").value = r.photoRentalLocation;
                document.getElementById("preview-rental-location").innerHTML = `<img src="${r.photoRentalLocation}" style="max-height: 80px; border-radius: 4px;">`;
            }
            toggleRentalShippingFields();
        }
    } else {
        if (title) title.innerText = "Novo Aluguel";
        updateRentalFee();
    }

    modal.classList.add("active");
}

export function updateRentalFee() {
    const itemTypeEl = document.getElementById("rental-item-type");
    const clientSelect = document.getElementById("rental-client-select");
    if (!itemTypeEl || !clientSelect) return;

    const itemType = itemTypeEl.value;
    const clientId = clientSelect.value;
    
    let price = 0;
    const equip = (state.products || []).find(p => p.id === itemType);
    if (equip) {
        price = equip.defaultPrice || 0;
        if (clientId) {
            const client = (state.clients || []).find(c => c.id === clientId);
            if (client && client.customPrices && client.customPrices[itemType] > 0) {
                price = client.customPrices[itemType];
            }
        }
    }
    
    const feeInput = document.getElementById("rental-fee");
    if (feeInput) feeInput.value = price.toFixed(2);
}

export function populateRentalClientDetails() {
    const clientSelect = document.getElementById("rental-client-select");
    if (!clientSelect) return;

    const clientId = clientSelect.value;
    if (clientId) {
        const client = state.clients.find(c => c.id === clientId);
        if (client) {
            document.getElementById("rental-client-name").value = client.name;
            document.getElementById("rental-address").value = client.address || "";
            document.getElementById("rental-phone").value = client.phone || "";
        }
    } else {
        document.getElementById("rental-client-name").value = "";
        document.getElementById("rental-address").value = "";
        document.getElementById("rental-phone").value = "";
    }
    updateRentalFee();
    if (window.fetchRentalRouteDistance) {
        window.fetchRentalRouteDistance(true);
    }
}

export function returnRental(rentalId) {
    const rental = (state.rentals || []).find(r => r.id === rentalId);
    if (!rental) return;
    
    const returnDateStr = window.getBrazilTimeISO().split('T')[0];
    const expectedDate = new Date(rental.expectedReturnDate + 'T00:00:00');
    const returnDate = new Date(returnDateStr + 'T00:00:00');
    
    let extraChargeStr = "";
    let extraDays = 0;
    let extraFee = 0;
    
    if (returnDate > expectedDate && rental.extraDayFee > 0) {
        const diffTime = returnDate - expectedDate;
        extraDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        extraFee = extraDays * rental.extraDayFee;
        extraChargeStr = `\n\n⚠️ O aluguel está atrasado em ${extraDays} dia(s).\nTaxa da diária extra: R$ ${rental.extraDayFee.toFixed(2)} por dia.\nValor adicional calculado: R$ ${extraFee.toFixed(2)}.\n\nDeseja adicionar esse valor de diárias extras ao faturamento deste aluguel?`;
    }
    
    window.showConfirm(
        `Confirmar devolução do item ${rental.tinaCode}?${extraChargeStr}`,
        () => {
            rental.status = "returned";
            rental.returnDate = returnDateStr;
            if (extraFee > 0) {
                rental.extraDays = extraDays;
                rental.extraFee = extraFee;
                rental.totalRevenue = (rental.totalRevenue || 0) + extraFee;
            }
            // Atualizar status do equipamento associado
            if (state.equipments && rental.tinaCode) {
                const equip = state.equipments.find(eq => eq.code && eq.code.trim().toUpperCase() === rental.tinaCode.trim().toUpperCase());
                if (equip) {
                    equip.status = "disponivel";
                    equip.clientId = "";
                    equip.clientName = "";
                    if (!equip.movementHistory) equip.movementHistory = [];
                    equip.movementHistory.push({
                        date: returnDateStr,
                        from: rental.clientName || "Cliente",
                        to: "Fábrica (Disponível)",
                        reason: `Devolução do aluguel ${rental.id}`
                    });
                }
            }
            saveState();
            if (window.renderApp) window.renderApp();
            window.showToast("Item devolvido com sucesso!", "success");
        },
        null,
        "Receber Devolução",
        "Confirmar"
    );
}

export function deleteRental(rentalId) {
    const rental = (state.rentals || []).find(r => r.id === rentalId);
    if (!rental) return;

    window.showConfirm(
        "Deseja realmente excluir este registro de aluguel?",
        () => {
            // Se o aluguel ainda estava ativo, devolver o equipamento associado
            if (rental.status !== "returned" && state.equipments && rental.tinaCode) {
                const equip = state.equipments.find(eq => eq.code && eq.code.trim().toUpperCase() === rental.tinaCode.trim().toUpperCase());
                if (equip) {
                    equip.status = "disponivel";
                    equip.clientId = "";
                    equip.clientName = "";
                    if (!equip.movementHistory) equip.movementHistory = [];
                    equip.movementHistory.push({
                        date: window.getBrazilTimeISO().split('T')[0],
                        from: rental.clientName || "Cliente",
                        to: "Fábrica (Disponível)",
                        reason: `Cancelamento / Exclusão do aluguel ${rental.id}`
                    });
                }
            }
            state.rentals = (state.rentals || []).filter(r => r.id !== rentalId);
            saveState();
            if (window.renderApp) window.renderApp();
            window.showToast("Registro de aluguel excluído com sucesso!", "success");
        },
        null,
        "Excluir Aluguel",
        "Excluir"
    );
}

export function renderRentalModalProducts(rental = null) {
    const itemSelect = document.getElementById("rental-item-type");
    if (itemSelect) {
        const currentVal = itemSelect.value || (rental ? rental.itemType : "");
        itemSelect.innerHTML = "";
        const equips = (state.products || []).filter(p => p.active && p.type === "Equipamento");
        equips.forEach(eq => {
            itemSelect.innerHTML += `<option value="${eq.id}">${eq.name}</option>`;
        });
        if (currentVal) itemSelect.value = currentVal;
    }

    const container = document.getElementById("rental-consumables-container");
    if (!container) return;

    const consumables = (state.products || []).filter(p => p.active && p.type !== "Equipamento");

    if (consumables.length === 0) {
        container.innerHTML = `<p style="font-size: 0.8rem; color: var(--color-text-muted); text-align: center; grid-column: 1 / -1; padding: 0.5rem 0;">Nenhum consumível cadastrado no catálogo.</p>`;
        return;
    }

    const items = (rental && rental.iceItems) || {};

    let html = "";
    consumables.forEach(c => {
        const val = items[c.id] !== undefined ? items[c.id] : 0;
        html += `
            <div class="form-group">
                <label style="font-size: 0.75rem; white-space: normal; line-height: 1.2; word-break: break-word;" title="${c.name}">${c.name}</label>
                <input type="number" min="0" step="1" id="rental-qty-${c.id}" class="form-control rental-qty-input" data-prod-id="${c.id}" value="${val}">
            </div>
        `;
    });
    container.innerHTML = html;
}

export function populateRentalEquipmentDropdown(currentTinaCode = null) {
    const itemTypeEl = document.getElementById("rental-item-type");
    const selectEl = document.getElementById("rental-tina-code-select");
    if (!itemTypeEl || !selectEl) return;

    const itemType = itemTypeEl.value;

    const rowTinaDetails = document.getElementById("rental-row-tina-details");
    if (rowTinaDetails) {
        rowTinaDetails.style.display = (itemType === "tina") ? "grid" : "none";
    }

    let targetEquipType = "outros";
    if (itemType === "tina") {
        targetEquipType = "tina";
    } else if (itemType === "mesa" || itemType === "mesa_cadeiras") {
        targetEquipType = "mesa_cadeiras";
    }

    const availableEquips = (state.equipments || []).filter(e => {
        const matchesType = e.type === targetEquipType;
        const isAvailable = e.status === "disponivel";
        const isCurrent = currentTinaCode && e.code && e.code.trim().toUpperCase() === currentTinaCode.trim().toUpperCase();
        return matchesType && (isAvailable || isCurrent);
    });

    selectEl.innerHTML = '<option value="">-- Selecione o Equipamento --</option>';
    availableEquips.forEach(e => {
        const selectedAttr = (currentTinaCode && e.code && e.code.trim().toUpperCase() === currentTinaCode.trim().toUpperCase()) ? 'selected' : '';
        const label = `${e.code} - ${e.brand || (e.type === "tina" ? "Tina" : "Mesa/Cadeiras")} (${e.color || 'sem cor'})`;
        selectEl.innerHTML += `<option value="${e.code}" ${selectedAttr}>${label}</option>`;
    });

    if (availableEquips.length === 0) {
        selectEl.innerHTML = '<option value="">-- Nenhum equipamento disponível para este tipo --</option>';
    }

    onRentalTinaCodeSelectChange();
}

export function onRentalTinaCodeSelectChange() {
    const selectEl = document.getElementById("rental-tina-code-select");
    const colorEl = document.getElementById("rental-tina-color");
    if (!selectEl || !colorEl) return;

    const selectedCode = selectEl.value;
    if (selectedCode && state.equipments) {
        const equip = state.equipments.find(e => e.code && e.code.trim().toUpperCase() === selectedCode.trim().toUpperCase());
        if (equip && equip.color) {
            colorEl.value = equip.color;
        }
    }
}

// Bind to window for HTML accessibility
window.renderTinas = renderTinas;
window.quickCreateRentalItem = quickCreateRentalItem;
window.toggleRentalShippingFields = toggleRentalShippingFields;
window.updateRentalDates = updateRentalDates;
window.openRentalModal = openRentalModal;
window.updateRentalFee = updateRentalFee;
window.populateRentalClientDetails = populateRentalClientDetails;
window.returnRental = returnRental;
window.deleteRental = deleteRental;
window.renderRentalModalProducts = renderRentalModalProducts;
window.populateRentalEquipmentDropdown = populateRentalEquipmentDropdown;
window.onRentalTinaCodeSelectChange = onRentalTinaCodeSelectChange;
