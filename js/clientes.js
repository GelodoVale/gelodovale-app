// --- TELA 2: GESTÃO DE CLIENTES E FREEZERS ---
import { state, saveState } from './state.js';
import { openComodato } from './comodatos.js';
import { openReceivePaymentModal } from './admin.js';

export function getClientDocStatus(c) {
    const hasDoc = c.document && c.document.trim().length > 0;
    const hasPhoto = c.photoDoc && c.photoDoc.trim().length > 0;
    if (hasDoc && hasPhoto) {
        return "completo";
    } else if (hasDoc) {
        return "sem_foto";
    } else {
        return "incompleto";
    }
}

export function renderClientes() {
    const clientsContainer = document.getElementById("clients-grid-container");
    if (!clientsContainer) return;
    clientsContainer.innerHTML = "";
    
    const searchVal = document.getElementById("client-search-input") ? document.getElementById("client-search-input").value.toLowerCase().trim() : "";
    const filterVal = document.getElementById("client-activity-filter") ? document.getElementById("client-activity-filter").value : "all";
    const docFilterVal = document.getElementById("client-doc-filter") ? document.getElementById("client-doc-filter").value : "all";

    let filteredClients = (state.clients || []);
    
    // Filtro por nome ou endereço
    if (searchVal) {
        filteredClients = filteredClients.filter(c => 
            (c.name || "").toLowerCase().includes(searchVal) || 
            (c.address || "").toLowerCase().includes(searchVal)
        );
    }

    // Calcular dias desde a última compra (churn) e associar status
    const clientActivityInfo = {};
    filteredClients.forEach(c => {
        const clientDeliveries = (state.deliveries || []).filter(d => d.clientId === c.id);
        let daysSinceLast = -1;
        if (clientDeliveries.length > 0) {
            const sorted = [...clientDeliveries].sort((a, b) => new Date(b.date) - new Date(a.date));
            const lastDate = sorted[0].date ? new Date(sorted[0].date) : null;
            if (lastDate && !isNaN(lastDate)) {
                const diffTime = Math.abs(new Date() - lastDate);
                daysSinceLast = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            }
        }
        
        let status = "new";
        if (daysSinceLast >= 0) {
            if (daysSinceLast <= 7) status = "active";
            else if (daysSinceLast <= 14) status = "warning";
            else status = "inactive";
        }
        clientActivityInfo[c.id] = { daysSinceLast, status };
    });

    // Filtro de atividade
    if (filterVal !== "all") {
        filteredClients = filteredClients.filter(c => clientActivityInfo[c.id].status === filterVal);
    }

    // Filtro por documentação
    if (docFilterVal !== "all") {
        filteredClients = filteredClients.filter(c => getClientDocStatus(c) === docFilterVal);
    }

    if (filteredClients.length === 0) {
        clientsContainer.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <i data-lucide="users" style="width: 48px; height: 48px;"></i>
                <p>Nenhum cliente atende aos filtros atuais.</p>
            </div>
        `;
        if (window.lucide) window.lucide.createIcons();
        return;
    }
    
    filteredClients.forEach(c => {
        const threshold = (c.alertThreshold || 20) / 100;
        let hasWarning = false;
        let hasDanger = false;
        
        const geloProducts = (state.products || []).filter(p => p.active && (p.type === 'Gelo' || p.type === 'Gelo Saborizado'));
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
        
        // Atividade/Churn Badge
        const activity = clientActivityInfo[c.id];
        let activityBadgeHTML = "";
        if (activity.status === "active") {
            activityBadgeHTML = `<span class="badge" style="background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.2); font-size: 0.75rem; padding: 3px 6px; border-radius: 4px; display: inline-flex; align-items: center; gap: 4px;"><span style="width: 6px; height: 6px; background: #10b981; border-radius: 50%;"></span>Ativo</span>`;
        } else if (activity.status === "warning") {
            activityBadgeHTML = `<span class="badge" style="background: rgba(234, 179, 8, 0.1); color: #eab308; border: 1px solid rgba(234, 179, 8, 0.2); font-size: 0.75rem; padding: 3px 6px; border-radius: 4px; display: inline-flex; align-items: center; gap: 4px;"><span style="width: 6px; height: 6px; background: #eab308; border-radius: 50%;"></span>Alerta (${activity.daysSinceLast} dias)</span>`;
        } else if (activity.status === "inactive") {
            activityBadgeHTML = `<span class="badge" style="background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2); font-size: 0.75rem; padding: 3px 6px; border-radius: 4px; display: inline-flex; align-items: center; gap: 4px; box-shadow: 0 0 8px rgba(239,68,68,0.25);"><span style="width: 6px; height: 6px; background: #ef4444; border-radius: 50%;"></span>Inativo (${activity.daysSinceLast} dias)</span>`;
        } else {
            activityBadgeHTML = `<span class="badge" style="background: rgba(59, 130, 246, 0.1); color: #3b82f6; border: 1px solid rgba(59, 130, 246, 0.2); font-size: 0.75rem; padding: 3px 6px; border-radius: 4px; display: inline-flex; align-items: center; gap: 4px;">Novo Cliente</span>`;
        }

        // Document Badge
        const docStatus = getClientDocStatus(c);
        let docBadgeHTML = "";
        if (docStatus === "completo") {
            docBadgeHTML = `<span class="badge" style="background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.2); font-size: 0.75rem; padding: 3px 6px; border-radius: 4px; display: inline-flex; align-items: center; gap: 4px;" title="Documentação completa"><i data-lucide="file-check-2" style="width: 13px; height: 13px;"></i> Doc OK</span>`;
        } else if (docStatus === "sem_foto") {
            docBadgeHTML = `<span class="badge" style="background: rgba(234, 179, 8, 0.1); color: #eab308; border: 1px solid rgba(234, 179, 8, 0.2); font-size: 0.75rem; padding: 3px 6px; border-radius: 4px; display: inline-flex; align-items: center; gap: 4px;" title="Possui CPF/CNPJ, mas falta foto do documento"><i data-lucide="file-warning" style="width: 13px; height: 13px;"></i> Sem Foto</span>`;
        } else {
            docBadgeHTML = `<span class="badge" style="background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2); font-size: 0.75rem; padding: 3px 6px; border-radius: 4px; display: inline-flex; align-items: center; gap: 4px;" title="Sem documentação informada"><i data-lucide="file-x-2" style="width: 13px; height: 13px;"></i> Sem Doc</span>`;
        }

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
        
        let facadeSnippet = '';
        if (c.photoFacade) {
            facadeSnippet = `<div class="client-facade-thumbnail" style="background-image: url('${c.photoFacade}'); cursor: pointer;" onclick="window.open('${c.photoFacade}', '_blank')" title="Ver Foto Completa"></div>`;
        } else {
            facadeSnippet = `<div class="client-facade-thumbnail placeholder"><i data-lucide="image" style="width: 18px; height: 18px; opacity: 0.25;"></i></div>`;
        }
        
        const pendingCom = state.comodatos && state.comodatos.find(com => com.clientId === c.id && com.status === 'pendente');
        
        clientsContainer.innerHTML += `
            <div class="client-card">
                <div class="client-card-header" style="flex-wrap: wrap; gap: 10px; align-items: center; justify-content: space-between;">
                    <div style="display: flex; gap: 10px; align-items: center; flex: 1; min-width: 180px;">
                        ${facadeSnippet}
                        <div class="client-name-details" style="display: flex; flex-direction: column; gap: 2px;">
                            <h3 style="margin: 0; font-size: 1.05rem; color: #fff; display: inline-flex; align-items: center; gap: 4px; font-weight: 700;">
                                ${c.fantasyName || c.name}
                                ${c.noWhatsapp ? `<span style="color: var(--color-danger); font-size: 0.8rem; display: inline-flex; align-items: center; gap: 2px;" title="Bloqueado para envios automáticos de WhatsApp">🚫</span>` : ''}
                            </h3>
                            ${c.fantasyName ? `<p style="margin: 0; font-size: 0.75rem; color: var(--color-text-muted); font-style: italic; font-weight: normal;">${c.name}</p>` : ''}
                            <p style="margin: 0; font-size: 0.78rem; color: var(--color-text-muted); font-weight: 500;">
                                ${c.freezerCode ? `Freezer: <strong>${c.freezerCode}</strong>` : 'Sem Freezer'}
                            </p>
                            <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px;">
                                ${activityBadgeHTML}
                                ${docBadgeHTML}
                            </div>
                        </div>
                    </div>
                    ${statusBadgeHTML}
                </div>
                
                <div class="client-contacts">
                    <div class="contact-item">
                        <i data-lucide="map-pin"></i>
                        <span>${c.address || 'Sem endereço informado'}</span>
                    </div>
                    ${c.latitude && c.longitude ? `
                    <div class="contact-item" style="color: var(--color-primary); cursor: pointer;" onclick="window.open('https://www.google.com/maps/search/?api=1&query=${c.latitude},${c.longitude}', '_blank')" title="Ver no Google Maps">
                        <i data-lucide="navigation" style="width: 14px; height: 14px; color: var(--color-primary);"></i>
                        <span>GPS: <strong>${c.latitude}, ${c.longitude}</strong> <span style="font-size: 0.7rem; opacity: 0.8; text-decoration: underline;">(Ver no Mapa)</span></span>
                    </div>
                    ` : ''}
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
                
                <div class="client-actions-group" style="margin-top: 1.25rem; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 0.75rem; display: flex; flex-direction: column; gap: 8px;">
                    <!-- Linha 1: Contrato, Assinar, Contatos e Editar -->
                    <div style="display: flex; align-items: center; justify-content: flex-end; gap: 8px; width: 100%;">
                        ${c.freezerCode ? `
                        <button class="btn btn-secondary" onclick="openComodato('${c.id}')" title="Termo de Comodato" style="margin-right: auto; padding: 4px 10px; font-size: 0.75rem; display: inline-flex; align-items: center; gap: 4px; background: rgba(0, 240, 255, 0.05); border-color: rgba(0, 240, 255, 0.2); color: var(--color-primary)">
                            <i data-lucide="file-text" style="width: 14px; height: 14px;"></i> Contrato
                        </button>
                        ${pendingCom ? `
                        <button class="btn btn-secondary" onclick="window.triggerComodatoSignatureForClient('${c.id}')" title="Assinar Comodato no Aparelho" style="padding: 4px 8px; font-size: 0.75rem; display: inline-flex; align-items: center; gap: 4px; border-color: #f59e0b; color: #f59e0b; background: rgba(245,158,11,0.05);">
                            <i data-lucide="pen-tool" style="width: 14px; height: 14px;"></i> Assinar
                        </button>
                        ` : ''}
                        ` : `
                        <button class="btn btn-secondary" onclick="window.openLinkFreezerModal('${c.id}')" title="Novo Comodato" style="margin-right: auto; padding: 4px 10px; font-size: 0.75rem; display: inline-flex; align-items: center; gap: 4px; background: rgba(59, 130, 246, 0.05); border-color: rgba(59, 130, 246, 0.2); color: #3b82f6;">
                            <i data-lucide="link" style="width: 14px; height: 14px;"></i> Novo Comodato
                        </button>
                        `}
                        
                        ${c.phone ? `
                        <a href="tel:${c.phone.replace(/\D/g,'')}" class="btn btn-secondary btn-icon-only" title="Ligar para ${c.phone}" style="color: #10b981; border-color: rgba(16,185,129,0.2); background: rgba(16,185,129,0.05); width: 28px; height: 28px; padding: 0; display: inline-flex; align-items: center; justify-content: center;">
                            <i data-lucide="phone-call" style="width: 14px; height: 14px;"></i>
                        </a>
                        <button type="button" class="btn btn-secondary btn-icon-only" onclick="window.abrirConfirmacaoWA('${c.id}', 'livre')" title="WhatsApp ${c.phone}" style="color: #00f0ff; border-color: rgba(0,240,255,0.2); background: rgba(0,240,255,0.05); width: 28px; height: 28px; padding: 0; display: inline-flex; align-items: center; justify-content: center;">
                            <i data-lucide="message-circle" style="width: 14px; height: 14px;"></i>
                        </button>
                        ` : ''}
                        
                        <button class="btn btn-secondary btn-icon-only" onclick="editClient('${c.id}')" title="Editar Cliente" style="width: 28px; height: 28px; padding: 0; display: inline-flex; align-items: center; justify-content: center;">
                            <i data-lucide="edit-3" style="width: 14px; height: 14px;"></i>
                        </button>
                    </div>
                    
                    <!-- Linha 2: Desvincular e Excluir -->
                    <div style="display: flex; align-items: center; justify-content: flex-end; gap: 8px; width: 100%;">
                        ${c.freezerCode ? `
                        <button class="btn btn-secondary" onclick="window.unlinkFreezerFromClient('${c.id}')" title="Desvincular Freezer" style="margin-right: auto; padding: 4px 10px; font-size: 0.75rem; display: inline-flex; align-items: center; gap: 4px; border-color: rgba(239, 68, 68, 0.2); color: #ef4444; background: rgba(239, 68, 68, 0.05);">
                            <i data-lucide="link-2" style="width: 14px; height: 14px;"></i> Desvincular
                        </button>
                        ` : ''}
                        
                        <button class="btn btn-danger btn-icon-only" onclick="deleteClient('${c.id}')" title="Remover Cliente" style="width: 28px; height: 28px; padding: 0; display: inline-flex; align-items: center; justify-content: center; ${!c.freezerCode ? 'margin-left: auto;' : ''}">
                            <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    if (window.lucide) window.lucide.createIcons();
}

export function openClientModal(clientId = null) {
    const modal = document.getElementById("modal-client");
    const form = document.getElementById("client-form");
    const title = document.getElementById("client-modal-title");
    if (!modal || !form) return;
    
    form.reset();
    document.getElementById("form-client-id").value = "";
    
    // Resetar novos campos de facade, documento e GPS
    if (document.getElementById("photo-facade-data")) {
        document.getElementById("photo-facade-data").value = "";
    }
    if (document.getElementById("photo-doc-data")) {
        document.getElementById("photo-doc-data").value = "";
    }
    if (document.getElementById("client-doc-type")) {
        document.getElementById("client-doc-type").value = "";
    }
    const previewFacade = document.getElementById("preview-facade");
    if (previewFacade) {
        previewFacade.innerHTML = "<p style='font-size: 0.75rem; color: var(--color-text-muted);'>Nenhuma foto carregada</p>";
    }
    const previewDocReset = document.getElementById("preview-doc");
    if (previewDocReset) previewDocReset.innerHTML = "";
    if (document.getElementById("client-latitude")) {
        document.getElementById("client-latitude").value = "";
    }
    if (document.getElementById("client-longitude")) {
        document.getElementById("client-longitude").value = "";
    }
    
    // Limpar checkboxes de visita
    document.querySelectorAll('input[name="visit-days"]').forEach(cb => cb.checked = false);
    if (document.getElementById("client-birthdate")) {
        document.getElementById("client-birthdate").value = "";
    }
    if (document.getElementById("client-doc-expiry")) {
        document.getElementById("client-doc-expiry").value = "";
    }
    if (document.getElementById("client-no-whatsapp")) {
        document.getElementById("client-no-whatsapp").checked = false;
    }
    
    if (clientId) {
        title.innerText = "Editar Cliente";
        const c = state.clients.find(item => item.id === clientId);
        if (c) {
            document.getElementById("form-client-id").value = c.id;
            document.getElementById("client-name").value = c.name;
            const fantasyEl = document.getElementById("client-fantasy-name");
            if (fantasyEl) fantasyEl.value = c.fantasyName || "";
            document.getElementById("client-address").value = c.address || "";
            document.getElementById("client-phone").value = c.phone || "";
            if (document.getElementById("client-document")) {
                document.getElementById("client-document").value = c.document || "";
            }
            
            // Carregar novos campos de facade e GPS
            if (document.getElementById("photo-facade-data")) {
                document.getElementById("photo-facade-data").value = c.photoFacade || "";
            }
            // Foto do documento de identidade
            if (document.getElementById("photo-doc-data")) {
                document.getElementById("photo-doc-data").value = c.photoDoc || "";
            }
            if (document.getElementById("client-doc-type")) {
                document.getElementById("client-doc-type").value = c.docType || "";
            }
            const previewDoc = document.getElementById("preview-doc");
            if (previewDoc) {
                if (c.photoDoc) {
                    previewDoc.innerHTML = `<img src="${c.photoDoc}" style="max-height: 140px; max-width: 100%; border-radius: 4px; border: 1px solid rgba(255,255,255,0.1);">`;
                } else {
                    previewDoc.innerHTML = "";
                }
            }
            const previewFacade = document.getElementById("preview-facade");
            if (previewFacade) {
                if (c.photoFacade) {
                    previewFacade.innerHTML = `<img src="${c.photoFacade}" style="max-height: 80px; border-radius: 4px;">`;
                } else {
                    previewFacade.innerHTML = "<p style='font-size: 0.75rem; color: var(--color-text-muted);'>Nenhuma foto carregada</p>";
                }
            }
            if (document.getElementById("client-latitude")) {
                document.getElementById("client-latitude").value = c.latitude || "";
            }
            if (document.getElementById("client-longitude")) {
                document.getElementById("client-longitude").value = c.longitude || "";
            }
            if (document.getElementById("client-birthdate")) {
                document.getElementById("client-birthdate").value = c.birthDate || "";
            }
            if (document.getElementById("client-doc-expiry")) {
                document.getElementById("client-doc-expiry").value = c.docExpiry || "";
            }
            if (document.getElementById("client-no-whatsapp")) {
                document.getElementById("client-no-whatsapp").checked = c.noWhatsapp || false;
            }
            if (document.getElementById("alert-threshold")) {
                document.getElementById("alert-threshold").value = c.alertThreshold || 20;
            }
            
            renderClientModalProducts(c);

            // Exibir saldo devedor
            const debtGroup = document.getElementById("client-debt-group");
            if (debtGroup) {
                debtGroup.style.display = "flex";
                const debtVal = parseFloat(c.outstandingDebt) || 0;
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

            // Mostrar e renderizar as notas/observações do cliente
            const notesGroup = document.getElementById("client-notes-group");
            if (notesGroup) {
                notesGroup.style.display = "block";
                if (typeof window.renderClientNotesSection === 'function') {
                    window.renderClientNotesSection(c.id);
                }
            }
        }
    } else {
        title.innerText = "Novo Cliente";
        renderClientModalProducts(null);
        const debtGroup = document.getElementById("client-debt-group");
        if (debtGroup) debtGroup.style.display = "none";
        
        const notesGroup = document.getElementById("client-notes-group");
        if (notesGroup) notesGroup.style.display = "none";
    }
    
    modal.classList.add("active");

    // --- Inicializar validação de CPF / busca de CNPJ ---
    // Limpar feedback anterior ao abrir
    const docFeedback = document.getElementById('client-document-feedback');
    if (docFeedback) docFeedback.innerHTML = '';

    if (window.initDocumentField) {
        window.initDocumentField('client-document', 'client-document-feedback', (cnpjData) => {
            // Razao Social → campo principal (nome juridico)
            const nameEl = document.getElementById('client-name');
            if (nameEl && cnpjData.razao_social) {
                nameEl.value = cnpjData.razao_social;
            }

            // Nome Fantasia → campo separado
            const fantasyEl = document.getElementById('client-fantasy-name');
            if (fantasyEl) {
                fantasyEl.value = cnpjData.nome_fantasia || '';
            }

            // Montar endereço completo
            const addrEl = document.getElementById('client-address');
            if (addrEl) {
                const parts = [
                    cnpjData.logradouro,
                    cnpjData.numero ? ', ' + cnpjData.numero : '',
                    cnpjData.complemento ? ' - ' + cnpjData.complemento : '',
                    cnpjData.bairro ? ' - ' + cnpjData.bairro : '',
                    cnpjData.municipio ? ' - ' + cnpjData.municipio : '',
                    cnpjData.uf ? '/' + cnpjData.uf : ''
                ];
                const fullAddr = parts.join('').replace(/^,\s*/, '').trim();
                if (fullAddr) addrEl.value = fullAddr;
            }

            // Telefone
            const phoneEl = document.getElementById('client-phone');
            if (phoneEl && cnpjData.ddd_telefone_1) {
                phoneEl.value = cnpjData.ddd_telefone_1
                    .replace(/^(\d{2})(\d{4,5})(\d{4})$/, '($1) $2-$3');
            }

            // E-mail (se tiver campo)
            const emailEl = document.getElementById('client-email');
            if (emailEl && cnpjData.email) emailEl.value = cnpjData.email;

            window.showToast('Dados do CNPJ preenchidos automaticamente! Verifique antes de salvar.', 'success');
        });
    }
}

export function deleteClient(clientId) {
    window.showConfirm(
        "Tem certeza que deseja remover este cliente? Todos os dados vinculados a ele serão mantidos no histórico financeiro, mas o freezer será liberado no inventário.",
        () => {
            const linkedFreezer = state.freezers.find(f => f.clientId === clientId);
            if (linkedFreezer) {
                linkedFreezer.status = "disponivel";
                linkedFreezer.clientId = "";
                linkedFreezer.clientName = "";
                if (!linkedFreezer.movementHistory) linkedFreezer.movementHistory = [];
                linkedFreezer.movementHistory.push({
                    date: window.formatDateBrazil(window.getBrazilTimeISO()),
                    from: "Cliente Removido",
                    to: "Fábrica",
                    reason: "Desvinculado devido à remoção do cliente"
                });
            }
            
            state.clients = state.clients.filter(c => c.id !== clientId);
            state.orders = state.orders.filter(o => o.clientId !== clientId);
            saveState();
            if (window.renderApp) window.renderApp();
            window.showToast("Cliente removido com sucesso!", "success");
        },
        null,
        "Remover Cliente",
        "Remover"
    );
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

    const geloProducts = (state.products || []).filter(p => p.active && (p.type === 'Gelo' || p.type === 'Gelo Saborizado'));
    
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

export function predictClientDemand(clientId, currentTemp) {
    const clientDeliveries = (state.deliveries || []).filter(d => d.clientId === clientId);
    if (clientDeliveries.length === 0) return {};

    const tempMin = currentTemp - 3;
    const tempMax = currentTemp + 3;

    // Se as entregas passadas não tiverem o campo temperature, vamos atribuir um de forma determinística
    const deliveriesWithTemp = clientDeliveries.map(d => {
        if (d.temperature !== undefined) return d;
        let mockTemp = 24;
        if (d.date) {
            const dateObj = new Date(d.date);
            const month = dateObj.getMonth();
            if (month >= 10 || month <= 2) {
                mockTemp = 28 + (dateObj.getDate() % 6) - 3; // 25 a 30
            } else if (month >= 5 && month <= 7) {
                mockTemp = 18 + (dateObj.getDate() % 6) - 3; // 15 a 20
            } else {
                mockTemp = 23 + (dateObj.getDate() % 6) - 3; // 20 a 25
            }
        } else {
            let hash = 0;
            const idStr = d.id || "";
            for (let i = 0; i < idStr.length; i++) {
                hash = idStr.charCodeAt(i) + ((hash << 5) - hash);
            }
            mockTemp = 15 + Math.abs(hash % 21);
        }
        return { ...d, temperature: mockTemp };
    });

    const matchingDeliveries = deliveriesWithTemp.filter(d => d.temperature >= tempMin && d.temperature <= tempMax);
    const targetDeliveries = matchingDeliveries.length > 0 ? matchingDeliveries : deliveriesWithTemp;

    const productSums = {};
    const productCounts = {};

    targetDeliveries.forEach(d => {
        if (!d.items) return;
        Object.keys(d.items).forEach(prodId => {
            if (prodId.endsWith("_unit")) return;
            const qty = parseFloat(d.items[prodId]) || 0;
            if (qty > 0) {
                productSums[prodId] = (productSums[prodId] || 0) + qty;
                productCounts[prodId] = (productCounts[prodId] || 0) + 1;
            }
        });
    });

    const suggestions = {};
    Object.keys(productSums).forEach(prodId => {
        const avg = productSums[prodId] / (productCounts[prodId] || 1);
        suggestions[prodId] = Math.max(1, Math.round(avg));
    });

    return suggestions;
}
window.predictClientDemand = predictClientDemand;

export function renderSalesModalProducts(client) {
    const container = document.getElementById("sales-products-container");
    if (!container) return;

    const geloProducts = (state.products || []).filter(p => p.active && (p.type === 'Gelo' || p.type === 'Gelo Saborizado'));

    if (geloProducts.length === 0) {
        container.innerHTML = `<p style="font-size: 0.8rem; color: var(--color-text-muted); text-align: center; grid-column: 1 / -1; padding: 0.5rem 0;">Nenhum produto de Gelo ou Gelo Saborizado cadastrado no catálogo.</p>`;
        return;
    }

    const currentTemp = (state.weatherConfig && state.weatherConfig.temp) !== undefined ? state.weatherConfig.temp : 24;
    const suggestions = predictClientDemand(client.id, currentTemp);

    let html = "";
    geloProducts.forEach(p => {
        const currentStock = (client.stock && client.stock[p.id]) || 0;
        const suggestedQty = suggestions[p.id] || 0;

        if (p.type === 'Gelo Saborizado') {
            const unitsPerPack = p.unitsPerPack || 12;
            const fardos = Math.floor(currentStock);
            const units = Math.round((currentStock - fardos) * unitsPerPack);
            const stockStr = units > 0 ? `${fardos} f (${units} un)` : `${fardos} f`;
            
            const badgeHTML = suggestedQty > 0 ? `
                <span class="climatological-suggestion-badge" 
                      onclick="document.getElementById('sale-${p.id}').value = ${suggestedQty}; document.getElementById('sale-${p.id}').dispatchEvent(new Event('input'));" 
                      style="cursor: pointer; font-size: 0.6rem; background: rgba(0, 240, 255, 0.15); border: 1px solid var(--color-primary); color: var(--color-primary); padding: 1px 4px; border-radius: 4px; display: inline-flex; align-items: center; gap: 2px;" 
                      title="Sugerido: ${suggestedQty} fardos a ${currentTemp}°C">
                    💡 Sugerido: ${suggestedQty} f
                </span>
            ` : '';

            html += `
                <div style="grid-column: span 2; display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; border: 1px solid rgba(255,255,255,0.08); padding: 8px; border-radius: 6px; background: rgba(0,240,255,0.03);">
                    <div style="grid-column: span 2; font-size: 0.75rem; font-weight: bold; color: var(--color-primary); display: flex; justify-content: space-between; align-items: center;">
                        <span style="white-space: normal; line-height: 1.2; word-break: break-word; max-width: 60%;" title="${p.name}">${p.name}</span>
                        <span style="font-size: 0.65rem; color: var(--color-text-muted);">Estoque: ${stockStr}</span>
                    </div>
                    <div class="form-group" style="margin-bottom: 0;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
                            <label for="sale-${p.id}" style="font-size: 0.65rem; color: var(--color-text-muted); margin-bottom: 0;">Fardos</label>
                            ${badgeHTML}
                        </div>
                        <input type="number" id="sale-${p.id}" class="form-control sales-sale-input" data-prod-id="${p.id}" min="0" value="0" required style="padding: 4px 6px; font-size: 0.8rem;">
                    </div>
                    <div class="form-group" style="margin-bottom: 0;">
                        <label for="sale-${p.id}_unit" style="font-size: 0.65rem; color: var(--color-text-muted); display: block; margin-bottom: 2px;">Unidades</label>
                        <input type="number" id="sale-${p.id}_unit" class="form-control sales-sale-unit-input" data-prod-id="${p.id}_unit" min="0" value="0" required style="padding: 4px 6px; font-size: 0.8rem;">
                    </div>
                </div>
            `;
        } else {
            const badgeHTML = suggestedQty > 0 ? `
                <span class="climatological-suggestion-badge" 
                      onclick="document.getElementById('sale-${p.id}').value = ${suggestedQty}; document.getElementById('sale-${p.id}').dispatchEvent(new Event('input'));" 
                      style="cursor: pointer; font-size: 0.65rem; background: rgba(0, 240, 255, 0.15); border: 1px solid var(--color-primary); color: var(--color-primary); padding: 2px 6px; border-radius: 4px; display: inline-flex; align-items: center; gap: 4px; align-self: flex-start; margin-top: 4px;" 
                      title="Clique para preencher sugestão climatológica de ${suggestedQty} fardos para ${currentTemp}°C">
                    💡 Sugestão Clima: ${suggestedQty} fardos (a ${currentTemp}°C)
                </span>
            ` : '';

            html += `
                <div class="form-group" style="display: flex; flex-direction: column; justify-content: space-between;">
                    <div style="display: flex; flex-direction: column; gap: 2px;">
                        <label for="sale-${p.id}" id="label-sale-${p.id}" style="font-size: 0.75rem; white-space: normal; line-height: 1.2; word-break: break-word;" title="${p.name} (Estoque: ${currentStock})">
                            ${p.name} (Est: ${currentStock})
                        </label>
                        ${badgeHTML}
                    </div>
                    <input type="number" id="sale-${p.id}" class="form-control sales-sale-input" data-prod-id="${p.id}" min="0" max="${currentStock}" value="0" required style="padding: 6px 8px; font-size: 0.85rem; width: 100%; margin-top: 4px;">
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
        const debt = parseFloat(c.outstandingDebt) || 0;
        const debtLabel = debt > 0 ? ` ⚠️ Devedor (R$ ${debt.toFixed(2).replace('.', ',')})` : '';
        orderClientSelect.innerHTML += `<option value="${c.id}">${c.name}${debtLabel}</option>`;
        filterClientSelect.innerHTML += `<option value="${c.id}">${c.name}${debtLabel}</option>`;
    });
    
    orderClientSelect.value = currentOrderVal;
    filterClientSelect.value = currentFilterVal;
}

export function captureClientGPS() {
    if (!navigator.geolocation) {
        window.showToast("Geolocalização não é suportada pelo seu navegador.", "warning");
        return;
    }
    
    window.showToast("Capturando coordenadas pelo GPS do aparelho...", "info");
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude.toFixed(6);
            const lng = position.coords.longitude.toFixed(6);
            
            const latInput = document.getElementById("client-latitude");
            const lngInput = document.getElementById("client-longitude");
            
            if (latInput) latInput.value = lat;
            if (lngInput) lngInput.value = lng;
            
            window.showToast("Coordenadas GPS capturadas com sucesso!", "success");
        },
        (error) => {
            console.error("Erro ao obter GPS:", error);
            let msg = "Não foi possível obter a localização.";
            if (error.code === error.PERMISSION_DENIED) {
                msg = "Permissão de localização negada pelo usuário.";
            } else if (error.code === error.POSITION_UNAVAILABLE) {
                msg = "Sinal de GPS indisponível no momento.";
            } else if (error.code === error.TIMEOUT) {
                msg = "Tempo limite atingido para obter localização.";
            }
            window.showToast(msg, "error");
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
}

export function openLinkFreezerModal(clientId) {
    const client = state.clients.find(c => c.id === clientId);
    if (!client) return;
    
    document.getElementById("link-freezer-client-id").value = clientId;
    document.getElementById("link-freezer-client-name").innerText = client.name;
    document.getElementById("link-freezer-code-input").value = "";
    document.getElementById("link-freezer-notes").value = "";
    document.getElementById("link-freezer-delivery-date").value = window.getBrazilTimeISO().split('T')[0];
    
    const searchFeedback = document.getElementById("link-freezer-search-feedback");
    if (searchFeedback) searchFeedback.innerHTML = "";
    const detPanel = document.getElementById("link-freezer-details-panel");
    if (detPanel) detPanel.style.display = "none";
    
    // Popular o dropdown de freezers disponíveis
    const dropdown = document.getElementById("link-freezer-select-dropdown");
    if (dropdown) {
        dropdown.innerHTML = '<option value="">-- Escolher da lista --</option>';
        const availableFreezers = (state.freezers || []).filter(f => f.status === "disponivel");
        availableFreezers.forEach(f => {
            dropdown.innerHTML += `<option value="${f.code}">${f.code} - ${f.brand || ''} (${f.capacity ? f.capacity + 'L' : 'Capacidade N/I'})</option>`;
        });
    }
    
    // Verificar se o cliente tem os dados obrigatórios para o comodato
    const missingPanel = document.getElementById("link-freezer-missing-data-panel");
    if (missingPanel) {
        const hasRequiredData = client.document && client.phone && client.address && client.latitude && client.longitude;
        if (!hasRequiredData) {
            missingPanel.style.display = "block";
            document.getElementById("link-client-document").value = client.document || "";
            document.getElementById("link-client-phone").value = client.phone || "";
            document.getElementById("link-client-address").value = client.address || "";
            document.getElementById("link-client-latitude").value = client.latitude || "";
            document.getElementById("link-client-longitude").value = client.longitude || "";
            
            // Inicializar CPF/CNPJ checker inline se disponível
            const docFeedback = document.getElementById("link-client-document-feedback");
            if (docFeedback) docFeedback.innerHTML = "";
            if (window.initDocumentField) {
                window.initDocumentField('link-client-document', 'link-client-document-feedback', (cnpjData) => {
                    const phoneEl = document.getElementById('link-client-phone');
                    if (phoneEl && cnpjData.ddd_telefone_1) {
                        phoneEl.value = cnpjData.ddd_telefone_1.replace(/^(\d{2})(\d{4,5})(\d{4})$/, '($1) $2-$3');
                    }
                    const addrEl = document.getElementById('link-client-address');
                    if (addrEl) {
                        const parts = [
                            cnpjData.logradouro,
                            cnpjData.numero ? ', ' + cnpjData.numero : '',
                            cnpjData.complemento ? ' - ' + cnpjData.complemento : '',
                            cnpjData.bairro ? ' - ' + cnpjData.bairro : '',
                            cnpjData.municipio ? ' - ' + cnpjData.municipio : '',
                            cnpjData.uf ? '/' + cnpjData.uf : ''
                        ];
                        const fullAddr = parts.join('').replace(/^,\s*/, '').trim();
                        if (fullAddr) addrEl.value = fullAddr;
                    }
                    window.showToast('Dados do CNPJ preenchidos automaticamente!', 'success');
                });
            }
        } else {
            missingPanel.style.display = "none";
        }
    }
    
    const modal = document.getElementById("modal-link-freezer");
    if (modal) modal.classList.add("active");
    if (window.lucide) window.lucide.createIcons();
}

export function searchFreezerForLinking() {
    const codeInput = document.getElementById("link-freezer-code-input");
    if (!codeInput) return;
    
    const code = codeInput.value.toUpperCase().trim();
    const feedback = document.getElementById("link-freezer-search-feedback");
    const detailsPanel = document.getElementById("link-freezer-details-panel");
    const dropdown = document.getElementById("link-freezer-select-dropdown");
    
    if (!code) {
        if (feedback) feedback.innerHTML = '<span style="color: var(--color-danger);">Digite um código de freezer.</span>';
        if (detailsPanel) detailsPanel.style.display = "none";
        return;
    }
    
    const freezer = (state.freezers || []).find(f => f.code.toUpperCase() === code);
    if (!freezer) {
        if (feedback) feedback.innerHTML = `<span style="color: var(--color-danger);">❌ Freezer "${code}" não cadastrado.</span>`;
        if (detailsPanel) detailsPanel.style.display = "none";
        if (dropdown) dropdown.value = "";
        return;
    }
    
    if (freezer.status !== "disponivel") {
        const ownerLabel = freezer.clientName ? `vinculado a ${freezer.clientName}` : `com status "${freezer.status}"`;
        if (feedback) feedback.innerHTML = `<span style="color: #f59e0b;">⚠️ Freezer "${code}" está indisponível (${ownerLabel}).</span>`;
        if (detailsPanel) detailsPanel.style.display = "none";
        if (dropdown) dropdown.value = "";
        return;
    }
    
    // Freezer disponível encontrado!
    if (feedback) feedback.innerHTML = `<span style="color: #10b981;">✅ Freezer "${code}" disponível!</span>`;
    const dBrand = document.getElementById("link-freezer-det-brand");
    const dCap = document.getElementById("link-freezer-det-cap");
    const dVol = document.getElementById("link-freezer-det-voltage");
    if (dBrand) dBrand.innerText = freezer.brand || "Não informada";
    if (dCap) dCap.innerText = freezer.capacity ? freezer.capacity + " Litros" : "Não informada";
    if (dVol) dVol.innerText = freezer.voltage || "Não informada";
    if (detailsPanel) detailsPanel.style.display = "block";
    
    // Selecionar no dropdown também
    if (dropdown) dropdown.value = freezer.code;
}

export function selectFreezerFromDropdownForLinking() {
    const dropdown = document.getElementById("link-freezer-select-dropdown");
    const codeInput = document.getElementById("link-freezer-code-input");
    if (!dropdown || !codeInput) return;
    
    codeInput.value = dropdown.value;
    searchFreezerForLinking();
}

export function captureClientGPSForLinking() {
    if (!navigator.geolocation) {
        window.showToast("Geolocalização não suportada.", "warning");
        return;
    }
    window.showToast("Capturando GPS...", "info");
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const latInput = document.getElementById("link-client-latitude");
            const lngInput = document.getElementById("link-client-longitude");
            if (latInput) latInput.value = position.coords.latitude.toFixed(6);
            if (lngInput) lngInput.value = position.coords.longitude.toFixed(6);
            window.showToast("Localização capturada!", "success");
        },
        (error) => {
            window.showToast("Erro ao obter GPS: " + error.message, "error");
        },
        { enableHighAccuracy: true, timeout: 8000 }
    );
}

export function handleLinkFreezerSubmit(e) {
    if (e) e.preventDefault();
    
    const clientId = document.getElementById("link-freezer-client-id").value;
    const client = state.clients.find(c => c.id === clientId);
    if (!client) return;
    
    const code = document.getElementById("link-freezer-code-input").value.toUpperCase().trim();
    const freezer = (state.freezers || []).find(f => f.code.toUpperCase() === code);
    
    if (!freezer || freezer.status !== "disponivel") {
        window.showToast("Selecione um freezer disponível válido.", "error");
        return;
    }
    
    // Verificar e atualizar dados faltantes do cliente se a seção estiver aberta
    const missingPanel = document.getElementById("link-freezer-missing-data-panel");
    if (missingPanel && missingPanel.style.display !== "none") {
        const docVal = document.getElementById("link-client-document").value.trim();
        const phoneVal = document.getElementById("link-client-phone").value.trim();
        const addressVal = document.getElementById("link-client-address").value.trim();
        const latVal = document.getElementById("link-client-latitude").value.trim();
        const lngVal = document.getElementById("link-client-longitude").value.trim();
        
        if (!docVal || !phoneVal || !addressVal || !latVal || !lngVal) {
            window.showToast("Por favor, preencha todos os dados obrigatórios do cliente para o comodato.", "warning");
            return;
        }
        
        client.document = docVal;
        client.phone = phoneVal;
        client.address = addressVal;
        client.latitude = latVal;
        client.longitude = lngVal;
    }
    
    const deliveryDate = document.getElementById("link-freezer-delivery-date").value;
    const expectedReturnDate = document.getElementById("link-freezer-expected-return-date") ? document.getElementById("link-freezer-expected-return-date").value : "";
    const notes = document.getElementById("link-freezer-notes").value.trim();
    
    // Atualizar dados do freezer
    freezer.status = "alocado";
    freezer.clientId = client.id;
    freezer.clientName = client.name;
    freezer.deliveryDate = deliveryDate;
    freezer.expectedReturnDate = expectedReturnDate;
    freezer.maintenanceNotes = notes;
    if (!freezer.movementHistory) freezer.movementHistory = [];
    freezer.movementHistory.push({
        date: window.formatDateBrazil(window.getBrazilTimeISO()),
        from: "Fábrica",
        to: client.name,
        reason: `Alocação via fluxo separado. Notas: ${notes}`
    });
    
    // Atualizar dados no cliente
    client.freezerCode = freezer.code;
    client.freezerBrand = freezer.brand || "Não informado";
    client.freezerVoltage = freezer.voltage || "Não informado";
    client.freezerCapacity = freezer.capacity || "";
    client.deliveryDate = deliveryDate;
    client.expectedReturnDate = expectedReturnDate;
    client.maintenanceNotes = notes;
    
    // Gerar o Comodato pendente automaticamente!
    const newCom = {
        id: 'com_' + Math.random().toString(36).substr(2, 9),
        clientId: client.id,
        clientName: client.name,
        clientPhone: client.phone || '',
        clientAddress: client.address || '',
        clientDoc: client.document || '',
        latitude: client.latitude || '',
        longitude: client.longitude || '',
        freezerCode: freezer.code,
        freezerBrand: freezer.brand || 'Não informado',
        freezerVoltage: freezer.voltage || 'Não informado',
        freezerCapacity: freezer.capacity || '',
        startDate: deliveryDate,
        expectedReturnDate: expectedReturnDate,
        status: 'pendente',
        signatureBase64: '',
        signatureDate: '',
        notes: notes,
        photos: [],
        createdAt: Date.now()
    };
    
    if (!state.comodatos) state.comodatos = [];
    state.comodatos.push(newCom);
    
    saveState();
    if (window.closeModal) window.closeModal("modal-link-freezer");
    if (window.renderApp) window.renderApp();
    
    window.showToast("Freezer vinculado e contrato de comodato pendente gerado!", "success");
}

export function unlinkFreezerFromClient(clientId) {
    const client = state.clients.find(c => c.id === clientId);
    if (!client) return;
    
    const code = client.freezerCode;
    if (!code) return;
    
    window.showConfirm(
        `Tem certeza que deseja desvincular o freezer "${code}" do cliente "${client.name}"? O comodato correspondente será encerrado e o freezer voltará para o inventário disponível.`,
        () => {
            const freezer = state.freezers.find(f => f.code === code);
            if (freezer) {
                freezer.status = "disponivel";
                freezer.clientId = "";
                freezer.clientName = "";
                if (!freezer.movementHistory) freezer.movementHistory = [];
                freezer.movementHistory.push({
                    date: window.formatDateBrazil(window.getBrazilTimeISO()),
                    from: client.name,
                    to: "Fábrica",
                    reason: "Desvinculado pelo fluxo administrativo"
                });
            }
            
            // Encerrar o comodato correspondente
            if (state.comodatos) {
                state.comodatos.forEach(com => {
                    if (com.clientId === client.id && com.freezerCode === code && com.status !== 'retirado') {
                        com.status = 'retirado';
                        com.returnDate = window.getBrazilTimeISO().split('T')[0];
                        com.returnNotes = "Desvinculado manualmente na tela de clientes";
                    }
                });
            }
            
            // Limpar dados no cliente
            client.freezerCode = "";
            client.freezerBrand = "";
            client.freezerVoltage = "";
            client.freezerCapacity = "";
            client.deliveryDate = "";
            client.maintenanceNotes = "";
            
            saveState();
            if (window.renderApp) window.renderApp();
            window.showToast(`Freezer "${code}" desvinculado com sucesso!`, "success");
        },
        null,
        "Desvincular Freezer",
        "Desvincular"
    );
}

// Bind to window for HTML accessibility
window.renderClientes = renderClientes;
window.openClientModal = openClientModal;
window.deleteClient = deleteClient;
window.editClient = editClient;
window.openSalesModal = openSalesModal;
window.populateClientDropdowns = populateClientDropdowns;
window.captureClientGPS = captureClientGPS;
window.openLinkFreezerModal = openLinkFreezerModal;
window.searchFreezerForLinking = searchFreezerForLinking;
window.selectFreezerFromDropdownForLinking = selectFreezerFromDropdownForLinking;
window.captureClientGPSForLinking = captureClientGPSForLinking;
window.handleLinkFreezerSubmit = handleLinkFreezerSubmit;
window.unlinkFreezerFromClient = unlinkFreezerFromClient;

// Inicializar campo de documento do fornecedor quando o modal abrir
document.addEventListener('DOMContentLoaded', () => {
    // Observar abertura do modal de fornecedor
    const supplierModal = document.getElementById('modal-supplier');
    if (supplierModal) {
        new MutationObserver((mutations) => {
            mutations.forEach(m => {
                if (m.attributeName === 'class' && supplierModal.classList.contains('active')) {
                    const fb = document.getElementById('supplier-document-feedback');
                    if (fb) fb.innerHTML = '';
                    if (window.initDocumentField) {
                        window.initDocumentField('supplier-cnpj-cpf', 'supplier-document-feedback', (data) => {
                            // Preencher nome do fornecedor se o campo existir
                            const nameEl = document.getElementById('supplier-name');
                            if (nameEl && data.razao_social) nameEl.value = data.nome_fantasia || data.razao_social;
                            const phoneEl = document.getElementById('supplier-phone');
                            if (phoneEl && data.ddd_telefone_1) {
                                phoneEl.value = data.ddd_telefone_1.replace(/^(\d{2})(\d{4,5})(\d{4})$/, '($1) $2-$3');
                            }
                            const addrEl = document.getElementById('supplier-address');
                            if (addrEl) {
                                const parts = [data.logradouro, data.numero ? ', '+data.numero:'', data.bairro?' - '+data.bairro:'', data.municipio?' - '+data.municipio:'', data.uf?'/'+data.uf:''];
                                const addr = parts.join('').trim();
                                if (addr) addrEl.value = addr;
                            }
                            window.showToast('Dados do CNPJ preenchidos para o fornecedor!', 'success');
                        });
                    }
                }
            });
        }).observe(supplierModal, { attributes: true });
    }
});
