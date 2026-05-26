// --- TELA 2: GESTÃO DE CLIENTES E FREEZERS ---
import { state, saveState } from './state.js';
import { openComodato } from './comodatos.js';
import { openReceivePaymentModal } from './admin.js';

export function renderClientes() {
    const clientsContainer = document.getElementById("clients-grid-container");
    if (!clientsContainer) return;
    clientsContainer.innerHTML = "";
    
    if (state.clients.length === 0) {
        clientsContainer.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <i data-lucide="users" style="width: 48px; height: 48px;"></i>
                <p>Nenhum cliente cadastrado no momento.</p>
                <button class="btn btn-primary" style="margin-top: 1rem;" onclick="openClientModal()">
                    <i data-lucide="plus"></i> Cadastrar Primeiro Cliente
                </button>
            </div>
        `;
        if (window.lucide) lucide.createIcons();
        return;
    }
    
    state.clients.forEach(c => {
        const threshold = (c.alertThreshold || 20) / 100;
        let hasWarning = false;
        let hasDanger = false;
        
        const geloProducts = state.products.filter(p => p.active && (p.type === 'Gelo' || p.type === 'Gelo Saborizado'));
        geloProducts.forEach(p => {
            const prod = p.id;
            const max = (c.capacities && c.capacities[prod]) || 0;
            const current = (c.stock && c.stock[prod]) || 0;
            if (max > 0) {
                const pct = current / max;
                if (pct <= 0.1) hasDanger = true;
                else if (pct <= threshold) hasWarning = true;
            }
        });
        
        let statusBadgeHTML = '<span class="status-badge completed">OK</span>';
        if (hasDanger) statusBadgeHTML = '<span class="status-badge pending" style="background: rgba(239,68,68,0.15); color: var(--color-danger);">Estoque Crítico</span>';
        else if (hasWarning) statusBadgeHTML = '<span class="status-badge pending">Atenção</span>';
        
        let stockSectionHTML = '';
        if (c.freezerCode) {
            geloProducts.forEach(p => {
                const prod = p.id;
                const current = (c.stock && c.stock[prod]) || 0;
                const max = (c.capacities && c.capacities[prod]) || 0;
                
                if (max > 0) {
                    const pct = Math.min((current / max) * 100, 100);
                    const isLow = pct <= (c.alertThreshold || 20);
                    
                    stockSectionHTML += `
                        <div class="stock-progress-bar">
                            <div class="stock-label">
                                <span>${p.name}</span>
                                <span class="stock-numbers">${current} / ${max}</span>
                            </div>
                            <div class="progress-track">
                                <div class="progress-fill ${isLow ? 'low-stock' : ''}" style="width: ${pct}%"></div>
                            </div>
                        </div>
                    `;
                }
            });
        } else {
            stockSectionHTML = `<p class="no-freezer-msg">Nenhum freezer vinculado a este cliente.</p>`;
        }
        
        clientsContainer.innerHTML += `
            <div class="client-card">
                <div class="client-card-header">
                    <div class="client-name-details">
                        <h3>${c.name}</h3>
                        <p>${c.freezerCode ? `Freezer: <strong>${c.freezerCode}</strong>` : 'Sem Freezer'}</p>
                    </div>
                    ${statusBadgeHTML}
                </div>
                
                <div class="client-contacts">
                    <div class="contact-item">
                        <i data-lucide="map-pin"></i>
                        <span>${c.address || 'Sem endereço informado'}</span>
                    </div>
                    <div class="contact-item">
                        <i data-lucide="phone"></i>
                        <span>${c.phone || 'Sem contato informado'}</span>
                    </div>
                </div>

                ${c.freezerCode ? `
                <div class="freezer-specs-box" style="margin: 0.75rem 0; padding: 0.6rem; background: rgba(255,255,255,0.02); border-radius: 6px; font-size: 0.75rem; border: 1px solid rgba(255,255,255,0.04);">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                        <span><strong>Equipamento:</strong> ${c.freezerBrand || 'Não informado'}</span>
                        <span><strong>Voltagem:</strong> ${c.freezerVoltage || 'N/I'}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                        <span><strong>Capacidade:</strong> ${c.freezerCapacity ? c.freezerCapacity + ' L' : 'Não informada'}</span>
                        <span><strong>Data Entrega:</strong> ${c.deliveryDate ? new Date(c.deliveryDate + 'T00:00:00').toLocaleDateString('pt-BR') : 'Não informada'}</span>
                    </div>
                    ${c.maintenanceNotes ? `
                    <div style="border-top: 1px solid rgba(255,255,255,0.05); margin-top: 0.4rem; padding-top: 0.3rem; color: var(--color-text-muted); line-height: 1.3;">
                        <strong>Obs/Manut:</strong> ${c.maintenanceNotes}
                    </div>
                    ` : ''}
                </div>
                ` : ''}
                
                <div class="freezer-info-section">
                    <div class="freezer-title">
                        <span>Estoque do Freezer</span>
                        ${c.freezerCode ? `
                            <button class="btn btn-secondary btn-icon-only" style="padding: 2px 6px; font-size: 0.75rem;" onclick="openSalesModal('${c.id}')" title="Registrar Consumo">
                                <i data-lucide="minus-circle" style="width: 14px; height: 14px; color: var(--color-danger)"></i> Consumo
                            </button>
                        ` : ''}
                    </div>
                    <div class="freezer-stocks">
                        ${stockSectionHTML}
                    </div>
                </div>
                
                <div class="client-actions" style="margin-top: 1.5rem; justify-content: flex-end; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 1rem;">
                    ${c.freezerCode ? `
                    <button class="btn btn-secondary" onclick="openComodato('${c.id}')" title="Termo de Comodato" style="margin-right: auto; padding: 4px 10px; font-size: 0.75rem; display: inline-flex; align-items: center; gap: 4px; background: rgba(0, 240, 255, 0.05); border-color: rgba(0, 240, 255, 0.2); color: var(--color-primary)">
                        <i data-lucide="file-text" style="width: 14px; height: 14px;"></i> Contrato
                    </button>
                    ` : ''}
                    <button class="btn btn-secondary btn-icon-only" onclick="editClient('${c.id}')" title="Editar Cliente">
                        <i data-lucide="edit-3" style="width: 16px; height: 16px;"></i>
                    </button>
                    <button class="btn btn-danger btn-icon-only" onclick="deleteClient('${c.id}')" title="Remover Cliente">
                        <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
                    </button>
                </div>
            </div>
        `;
    });
    if (window.lucide) lucide.createIcons();
}

export function openClientModal(clientId = null) {
    const modal = document.getElementById("modal-client");
    const form = document.getElementById("client-form");
    const title = document.getElementById("client-modal-title");
    if (!modal || !form) return;
    
    form.reset();
    document.getElementById("form-client-id").value = "";
    
    // Limpar checkboxes de visita
    document.querySelectorAll('input[name="visit-days"]').forEach(cb => cb.checked = false);
    
    // Popular o dropdown de freezers
    const freezerSelect = document.getElementById("client-freezer-id-select");
    freezerSelect.innerHTML = '<option value="">Nenhum freezer alocado</option>';
    
    let currentFreezer = null;
    if (clientId) {
        currentFreezer = state.freezers.find(f => f.clientId === clientId);
        if (currentFreezer) {
            freezerSelect.innerHTML += `<option value="${currentFreezer.id}" selected>${currentFreezer.code} - ${currentFreezer.brand}</option>`;
        }
    }
    
    state.freezers.forEach(f => {
        if (f.status === "disponivel" && (!currentFreezer || f.id !== currentFreezer.id)) {
            freezerSelect.innerHTML += `<option value="${f.id}">${f.code} - ${f.brand}</option>`;
        }
    });
    
    if (clientId) {
        title.innerText = "Editar Cliente & Freezer";
        const c = state.clients.find(item => item.id === clientId);
        if (c) {
            document.getElementById("form-client-id").value = c.id;
            document.getElementById("client-name").value = c.name;
            document.getElementById("client-address").value = c.address || "";
            document.getElementById("client-phone").value = c.phone || "";
            if (document.getElementById("client-document")) {
                document.getElementById("client-document").value = c.document || "";
            }
            document.getElementById("freezer-code").value = c.freezerCode || "";
            document.getElementById("alert-threshold").value = c.alertThreshold || 20;
            
            document.getElementById("freezer-brand").value = c.freezerBrand || "";
            document.getElementById("freezer-voltage").value = c.freezerVoltage || "";
            document.getElementById("freezer-capacity").value = c.freezerCapacity ? c.freezerCapacity + " Litros" : "";
            document.getElementById("freezer-delivery-date").value = c.deliveryDate || "";
            document.getElementById("freezer-maintenance").value = c.maintenanceNotes || "";
            
            renderClientModalProducts(c);
            
            if (currentFreezer) {
                freezerSelect.value = currentFreezer.id;
            }

            // Exibir saldo devedor
            const debtGroup = document.getElementById("client-debt-group");
            if (debtGroup) {
                debtGroup.style.display = "flex";
                const debtVal = c.outstandingDebt || 0;
                document.getElementById("client-outstanding-debt").innerText = "R$ " + debtVal.toFixed(2).replace(".", ",");
                const btnPay = document.getElementById("btn-pay-debt");
                if (btnPay) {
                    btnPay.onclick = () => {
                        closeModal('modal-client');
                        openReceivePaymentModal(c.id);
                    };
                }
            }

            // Marcar checkboxes de visita
            const visitDays = c.visitDays || [];
            document.querySelectorAll('input[name="visit-days"]').forEach(cb => cb.checked = visitDays.includes(cb.value));
        }
    } else {
        title.innerText = "Novo Cliente & Freezer";
        renderClientModalProducts(null);
        const debtGroup = document.getElementById("client-debt-group");
        if (debtGroup) debtGroup.style.display = "none";
    }
    
    modal.classList.add("active");
}

export function deleteClient(clientId) {
    if (confirm("Tem certeza que deseja remover este cliente? Todos os dados vinculados a ele serão mantidos no histórico financeiro, mas o freezer será liberado no inventário.")) {
        const linkedFreezer = state.freezers.find(f => f.clientId === clientId);
        if (linkedFreezer) {
            linkedFreezer.status = "disponivel";
            linkedFreezer.clientId = "";
            linkedFreezer.clientName = "";
            linkedFreezer.movementHistory.push({
                date: new Date().toLocaleDateString('pt-BR'),
                from: "Cliente Removido",
                to: "Fábrica",
                reason: "Desvinculado devido à remoção do cliente"
            });
        }
        
        state.clients = state.clients.filter(c => c.id !== clientId);
        state.orders = state.orders.filter(o => o.clientId !== clientId);
        saveState();
        if (window.renderApp) window.renderApp();
    }
}

export function editClient(clientId) {
    openClientModal(clientId);
}

export function openSalesModal(clientId) {
    const client = state.clients.find(c => c.id === clientId);
    if (!client) return;
    
    document.getElementById("sales-client-id").value = client.id;
    document.getElementById("sales-client-name").value = client.name;
    
    renderSalesModalProducts(client);
    
    const modal = document.getElementById("modal-sales");
    if (modal) modal.classList.add("active");
}

export function renderClientModalProducts(client = null) {
    const container = document.getElementById("client-products-container");
    if (!container) return;

    const geloProducts = state.products.filter(p => p.active && (p.type === 'Gelo' || p.type === 'Gelo Saborizado'));
    
    if (geloProducts.length === 0) {
        container.innerHTML = `<p style="font-size: 0.8rem; color: var(--color-text-muted); text-align: center; padding: 0.5rem 0;">Nenhum produto de Gelo ou Gelo Saborizado cadastrado no catálogo.</p>`;
        return;
    }

    const capacities = (client && client.capacities) || {};
    const stock = (client && client.stock) || {};

    let html = `
        <div class="form-group" style="margin-bottom: 0.75rem;">
            <label style="margin-bottom: 0.25rem;">Capacidade Máxima de Armazenamento (Pacotes)</label>
            <div class="form-row-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 0.5rem;">
    `;
    geloProducts.forEach(p => {
        const val = capacities[p.id] !== undefined ? capacities[p.id] : 50;
        html += `
            <div>
                <span style="font-size: 0.7rem; color: var(--color-text-muted); display: block; margin-bottom: 2px; white-space: normal; line-height: 1.2; word-break: break-word;" title="${p.name}">${p.name}</span>
                <input type="number" id="cap-${p.id}" class="form-control client-cap-input" data-prod-id="${p.id}" min="0" value="${val}" required style="padding: 6px 8px; font-size: 0.85rem;">
            </div>
        `;
    });
    html += `
            </div>
        </div>
        <div class="form-group" style="margin-top: 0.5rem; margin-bottom: 0;">
            <label style="margin-bottom: 0.25rem;">Estoque Inicial Atual (Pacotes)</label>
            <div class="form-row-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 0.5rem;">
    `;
    geloProducts.forEach(p => {
        const val = stock[p.id] !== undefined ? stock[p.id] : 0;
        html += `
            <div>
                <input type="number" id="stock-${p.id}" class="form-control client-stock-input" data-prod-id="${p.id}" min="0" value="${val}" required style="padding: 6px 8px; font-size: 0.85rem;">
            </div>
        `;
    });
    html += `
            </div>
        </div>
    `;

    container.innerHTML = html;
}

export function renderSalesModalProducts(client) {
    const container = document.getElementById("sales-products-container");
    if (!container) return;

    const geloProducts = state.products.filter(p => p.active && (p.type === 'Gelo' || p.type === 'Gelo Saborizado'));

    if (geloProducts.length === 0) {
        container.innerHTML = `<p style="font-size: 0.8rem; color: var(--color-text-muted); text-align: center; grid-column: 1 / -1; padding: 0.5rem 0;">Nenhum produto de Gelo ou Gelo Saborizado cadastrado no catálogo.</p>`;
        return;
    }

    let html = "";
    geloProducts.forEach(p => {
        const currentStock = (client.stock && client.stock[p.id]) || 0;
        if (p.type === 'Gelo Saborizado') {
            const unitsPerPack = p.unitsPerPack || 12;
            const fardos = Math.floor(currentStock);
            const units = Math.round((currentStock - fardos) * unitsPerPack);
            const stockStr = units > 0 ? `${fardos} f (${units} un)` : `${fardos} f`;
            
            html += `
                <div style="grid-column: span 2; display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; border: 1px solid rgba(255,255,255,0.08); padding: 8px; border-radius: 6px; background: rgba(0,240,255,0.03);">
                    <div style="grid-column: span 2; font-size: 0.75rem; font-weight: bold; color: var(--color-primary); display: flex; justify-content: space-between; align-items: center;">
                        <span style="white-space: normal; line-height: 1.2; word-break: break-word; max-width: 60%;" title="${p.name}">${p.name}</span>
                        <span style="font-size: 0.65rem; color: var(--color-text-muted);">Estoque: ${stockStr}</span>
                    </div>
                    <div class="form-group" style="margin-bottom: 0;">
                        <label for="sale-${p.id}" style="font-size: 0.65rem; color: var(--color-text-muted); display: block; margin-bottom: 2px;">Fardos</label>
                        <input type="number" id="sale-${p.id}" class="form-control sales-sale-input" data-prod-id="${p.id}" min="0" value="0" required style="padding: 4px 6px; font-size: 0.8rem;">
                    </div>
                    <div class="form-group" style="margin-bottom: 0;">
                        <label for="sale-${p.id}_unit" style="font-size: 0.65rem; color: var(--color-text-muted); display: block; margin-bottom: 2px;">Unidades</label>
                        <input type="number" id="sale-${p.id}_unit" class="form-control sales-sale-unit-input" data-prod-id="${p.id}_unit" min="0" value="0" required style="padding: 4px 6px; font-size: 0.8rem;">
                    </div>
                </div>
            `;
        } else {
            html += `
                <div class="form-group" style="display: flex; flex-direction: column; justify-content: space-between;">
                    <label for="sale-${p.id}" id="label-sale-${p.id}" style="font-size: 0.75rem; white-space: normal; line-height: 1.2; word-break: break-word; margin-bottom: 4px;" title="${p.name} (Estoque: ${currentStock})">
                        ${p.name} (Est: ${currentStock})
                    </label>
                    <input type="number" id="sale-${p.id}" class="form-control sales-sale-input" data-prod-id="${p.id}" min="0" max="${currentStock}" value="0" required style="padding: 6px 8px; font-size: 0.85rem; width: 100%;">
                </div>
            `;
        }
    });
    container.innerHTML = html;
}

export function populateClientDropdowns() {
    const orderClientSelect = document.getElementById("order-client-id");
    const filterClientSelect = document.getElementById("filter-client");
    
    if (!orderClientSelect || !filterClientSelect) return;
    
    const currentOrderVal = orderClientSelect.value;
    const currentFilterVal = filterClientSelect.value;
    
    orderClientSelect.innerHTML = '<option value="">Selecione...</option>';
    filterClientSelect.innerHTML = '<option value="">Todos os Clientes</option>';
    
    state.clients.forEach(c => {
        orderClientSelect.innerHTML += `<option value="${c.id}">${c.name}</option>`;
        filterClientSelect.innerHTML += `<option value="${c.id}">${c.name}</option>`;
    });
    
    orderClientSelect.value = currentOrderVal;
    filterClientSelect.value = currentFilterVal;
}

// Bind to window for HTML accessibility
window.renderClientes = renderClientes;
window.openClientModal = openClientModal;
window.deleteClient = deleteClient;
window.editClient = editClient;
window.openSalesModal = openSalesModal;
window.populateClientDropdowns = populateClientDropdowns;
