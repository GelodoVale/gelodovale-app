import { state, saveState, FACTORY_INFO } from './state.js';
import { loadFirebaseSDK } from './sync.js';

export function migrateLegacyComodatos() {
    if (!state.clients || !state.comodatos) return;
    let migrated = false;
    state.clients.forEach(client => {
        if (client.freezerCode && client.freezerCode !== 'N/A') {
            const exists = state.comodatos.some(c => c.clientId === client.id && c.freezerCode === client.freezerCode && c.status !== 'retirado');
            if (!exists) {
                const freezer = state.freezers ? state.freezers.find(f => f.code === client.freezerCode) : null;
                const newCom = {
                    id: 'com_' + Math.random().toString(36).substr(2, 9),
                    clientId: client.id,
                    clientName: client.name,
                    clientPhone: client.phone || '',
                    clientAddress: client.address || '',
                    freezerCode: client.freezerCode,
                    freezerBrand: client.freezerBrand || (freezer ? freezer.brand : '') || 'Não informado',
                    freezerVoltage: client.freezerVoltage || (freezer ? freezer.voltage : '') || 'Não informado',
                    freezerCapacity: client.freezerCapacity || (freezer ? freezer.capacity : '') || '',
                    startDate: client.deliveryDate || window.getBrazilTimeISO().split('T')[0],
                    status: 'ativo',
                    signatureBase64: '',
                    signatureDate: '',
                    notes: client.maintenanceNotes || '',
                    photos: [],
                    createdAt: Date.now()
                };
                state.comodatos.push(newCom);
                migrated = true;
                if (freezer && freezer.status !== 'alocado') {
                    freezer.status = 'alocado';
                }
            }
        }
    });
    if (migrated) {
        state.lastUpdated = Date.now();
        saveState();
    }
}

export function renderComodatosAdmin() {
    const tableBody = document.getElementById("comodatos-table-body");
    if (!tableBody) return;
    
    tableBody.innerHTML = "";
    
    const comodatos = state.comodatos || [];
    const searchVal = (document.getElementById("comodato-search-input")?.value || "").toLowerCase().trim();
    const statusVal = document.getElementById("comodato-status-filter")?.value || "all";
    
    const filtered = comodatos.filter(c => {
        if (statusVal === 'ativo' && c.status !== 'ativo') return false;
        if (statusVal === 'pendente_assinatura' && c.status !== 'pendente') return false;
        if (statusVal === 'retirado' && c.status !== 'retirado') return false;
        
        if (searchVal) {
            const clientName = (c.clientName || "").toLowerCase();
            const freezerCode = (c.freezerCode || "").toLowerCase();
            if (!clientName.includes(searchVal) && !freezerCode.includes(searchVal)) {
                return false;
            }
        }
        
        return true;
    });
    
    if (filtered.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 20px; color: var(--color-text-muted);">
                    Nenhum comodato encontrado.
                </td>
            </tr>
        `;
        return;
    }
    
    filtered.forEach(c => {
        const tr = document.createElement("tr");
        tr.style.borderBottom = "1px solid rgba(255,255,255,0.05)";
        
        const dateStr = c.startDate ? new Date(c.startDate + 'T00:00:00').toLocaleDateString('pt-BR') : '-';
        
        let sigHTML = '';
        if (c.signatureBase64) {
            sigHTML = `<span style="color: #10b981; display: inline-flex; align-items: center; gap: 4px;"><i data-lucide="check" style="width: 14px; height: 14px;"></i> Assinado</span>`;
        } else {
            sigHTML = `<span style="color: var(--color-text-muted);">Pendente</span>`;
        }
        
        let statusBadge = '';
        if (c.status === 'ativo') {
            statusBadge = `<span class="badge" style="background: rgba(16, 185, 129, 0.2); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3);">Ativo</span>`;
        } else if (c.status === 'pendente') {
            statusBadge = `<span class="badge" style="background: rgba(245, 158, 11, 0.2); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3);">Pendente</span>`;
        } else if (c.status === 'retirado') {
            statusBadge = `<span class="badge" style="background: rgba(239, 68, 68, 0.2); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3);">Retirado</span>`;
        }
        
        tr.innerHTML = `
            <td style="padding: 10px;"><strong>${c.clientName || 'N/A'}</strong></td>
            <td style="padding: 10px;"><code>${c.freezerCode}</code></td>
            <td style="padding: 10px;">${c.freezerBrand || ''} ${c.freezerCapacity || ''}</td>
            <td style="padding: 10px;">${dateStr}</td>
            <td style="padding: 10px; text-align: center;">${sigHTML}</td>
            <td style="padding: 10px; text-align: center;">${statusBadge}</td>
            <td style="padding: 10px; text-align: center;">
                <button type="button" class="btn btn-secondary btn-sm" onclick="openComodatoDetail('${c.id}')" style="padding: 4px 8px; font-size: 0.75rem;" title="Ver Detalhes">
                    <i data-lucide="eye" style="width: 14px; height: 14px;"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(tr);
    });
    
    if (window.lucide) window.lucide.createIcons();
}

export function openNewComodatoModal() {
    const clientSelect = document.getElementById("comodato-client-select");
    const freezerSelect = document.getElementById("comodato-freezer-select");
    if (!clientSelect || !freezerSelect) return;
    
    clientSelect.innerHTML = '<option value="">Selecione um cliente...</option>';
    freezerSelect.innerHTML = '<option value="">Selecione um freezer...</option>';
    document.getElementById("comodato-notes").value = "";
    document.getElementById("comodato-start-date").value = window.getBrazilTimeISO().split('T')[0];
    
    const clients = [...(state.clients || [])].sort((a,b) => (a.name || '').localeCompare(b.name || ''));
    clients.forEach(c => {
        const option = document.createElement("option");
        option.value = c.id;
        option.textContent = c.name;
        clientSelect.appendChild(option);
    });
    
    const freezers = (state.freezers || []).filter(f => f.status === 'disponivel');
    freezers.forEach(f => {
        const option = document.createElement("option");
        option.value = f.code;
        option.textContent = `${f.code} - ${f.brand || ''} ${f.capacity || ''}`;
        freezerSelect.appendChild(option);
    });
    
    document.getElementById("modal-create-comodato").classList.add("active");
}

export function saveNewComodato(e) {
    e.preventDefault();
    
    const clientId = document.getElementById("comodato-client-select").value;
    const freezerCode = document.getElementById("comodato-freezer-select").value;
    const startDate = document.getElementById("comodato-start-date").value;
    const notes = document.getElementById("comodato-notes").value.trim();
    
    if (!clientId || !freezerCode || !startDate) {
        window.showToast("Por favor, preencha todos os campos obrigatórios (*).", "warning");
        return;
    }
    
    const client = state.clients.find(c => c.id === clientId);
    if (!client) {
        window.showToast("Cliente selecionado inválido.", "error");
        return;
    }
    
    if (!client.document || !client.phone || !client.address || !client.latitude || !client.longitude) {
        window.showToast("Não é possível salvar: O cadastro deste cliente está sem os dados obrigatórios para Comodato (CNPJ/CPF, Telefone, Endereço ou GPS). Complete-os no cadastro do cliente antes de prosseguir.", "warning");
        return;
    }
    
    const freezer = state.freezers ? state.freezers.find(f => f.code === freezerCode) : null;
    if (!freezer) {
        window.showToast("Freezer selecionado inválido.", "error");
        return;
    }
    
    const newCom = {
        id: 'com_' + Math.random().toString(36).substr(2, 9),
        clientId: client.id,
        clientName: client.name,
        clientPhone: client.phone || '',
        clientAddress: client.address || '',
        clientDoc: client.document || '',
        latitude: client.latitude || '',
        longitude: client.longitude || '',
        freezerCode: freezerCode,
        freezerBrand: freezer.brand || 'Não informado',
        freezerVoltage: freezer.voltage || 'Não informado',
        freezerCapacity: freezer.capacity || '',
        startDate: startDate,
        status: 'pendente',
        signatureBase64: '',
        signatureDate: '',
        notes: notes,
        photos: [],
        createdAt: Date.now()
    };
    
    if (!state.comodatos) state.comodatos = [];
    state.comodatos.push(newCom);
    
    freezer.status = 'alocado';
    freezer.clientId = client.id;
    freezer.clientName = client.name;
    freezer.deliveryDate = startDate;
    freezer.maintenanceNotes = notes;
    
    client.freezerCode = freezerCode;
    client.freezerBrand = freezer.brand || 'Não informado';
    client.freezerVoltage = freezer.voltage || 'Não informado';
    client.freezerCapacity = freezer.capacity || '';
    client.deliveryDate = startDate;
    client.maintenanceNotes = notes;
    
    saveState();
    if (window.closeModal) window.closeModal("modal-create-comodato");
    if (window.renderApp) window.renderApp();
    window.showToast("Comodato criado com sucesso! Lembre-se de coletar a assinatura eletrônica do cliente.", "success");
}

export function openComodatoDetail(comId) {
    window.currentComodatoId = comId;
    renderComodatoDetail(comId);
    document.getElementById("modal-comodato-detail").classList.add("active");
}

export function renderComodatoDetail(comId) {
    const comodato = (state.comodatos || []).find(c => c.id === comId);
    if (!comodato) return;
    
    const client = state.clients.find(c => c.id === comodato.clientId);
    
    document.getElementById("det-com-client-name").innerText = client ? client.name : comodato.clientName;
    document.getElementById("det-com-client-doc").innerText = client ? (client.document || 'Não informado') : 'Não informado';
    document.getElementById("det-com-client-phone").innerText = client ? (client.phone || 'Não informado') : (comodato.clientPhone || 'Não informado');
    document.getElementById("det-com-client-address").innerText = client ? (client.address || 'Não informado') : (comodato.clientAddress || 'Não informado');
    
    document.getElementById("det-com-freezer-code").innerText = comodato.freezerCode;
    document.getElementById("det-com-freezer-brand").innerText = comodato.freezerBrand || 'Não informado';
    document.getElementById("det-com-freezer-cap").innerText = comodato.freezerCapacity ? comodato.freezerCapacity + (comodato.freezerCapacity.toString().toLowerCase().includes('litros') ? '' : ' Litros') : 'Não informado';
    document.getElementById("det-com-freezer-voltage").innerText = comodato.freezerVoltage || 'Não informado';
    
    document.getElementById("det-com-start-date").innerText = comodato.startDate ? new Date(comodato.startDate + 'T00:00:00').toLocaleDateString('pt-BR') : '-';

    // Auto-preenchimento retroativo de campos vindos do cliente se vazios no comodato
    let hasUpdated = false;
    if (!comodato.latitude && client && client.latitude) {
        comodato.latitude = client.latitude;
        comodato.longitude = client.longitude;
        hasUpdated = true;
    }
    if (!comodato.clientDoc && client && client.document) {
        comodato.clientDoc = client.document;
        hasUpdated = true;
    }
    if (hasUpdated) {
        saveState();
    }

    // Exibir coordenadas de GPS
    const gpsText = (comodato.latitude && comodato.longitude) ? `${comodato.latitude}, ${comodato.longitude}` : 'Não registrada';
    document.getElementById("det-com-gps-coords").innerText = gpsText;

    // Renderizar QR Code na ficha técnica de detalhes do comodato
    setTimeout(() => {
        const qrContainer = document.getElementById("det-com-qrcode-render");
        if (qrContainer) {
            qrContainer.innerHTML = "";
            new QRCode(qrContainer, {
                text: comodato.freezerCode,
                width: 60,
                height: 60,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });
        }
    }, 100);
    
    const badge = document.getElementById("det-com-status-badge");
    badge.className = "badge";
    if (comodato.status === 'ativo') {
        badge.innerText = "Ativo (Assinado)";
        badge.style.background = "rgba(16, 185, 129, 0.2)";
        badge.style.color = "#10b981";
        badge.style.border = "1px solid rgba(16, 185, 129, 0.3)";
        
        document.getElementById("det-com-return-container").style.display = "none";
        document.getElementById("comodato-withdrawal-section").style.display = "block";
        document.getElementById("comodato-withdrawn-history").style.display = "none";
        
        document.getElementById("comodato-withdrawal-date").value = window.getBrazilTimeISO().split('T')[0];
        document.getElementById("comodato-withdrawal-notes").value = "";
    } else if (comodato.status === 'pendente') {
        badge.innerText = "Pendente Assinatura";
        badge.style.background = "rgba(245, 158, 11, 0.2)";
        badge.style.color = "#f59e0b";
        badge.style.border = "1px solid rgba(245, 158, 11, 0.3)";
        
        document.getElementById("det-com-return-container").style.display = "none";
        document.getElementById("comodato-withdrawal-section").style.display = "block";
        document.getElementById("comodato-withdrawn-history").style.display = "none";
        
        document.getElementById("comodato-withdrawal-date").value = window.getBrazilTimeISO().split('T')[0];
        document.getElementById("comodato-withdrawal-notes").value = "";
    } else if (comodato.status === 'retirado') {
        badge.innerText = "Retirado / Finalizado";
        badge.style.background = "rgba(239, 68, 68, 0.2)";
        badge.style.color = "#ef4444";
        badge.style.border = "1px solid rgba(239, 68, 68, 0.3)";
        
        document.getElementById("det-com-return-container").style.display = "block";
        document.getElementById("det-com-return-date").innerText = comodato.returnDate ? new Date(comodato.returnDate + 'T00:00:00').toLocaleDateString('pt-BR') : '-';
        document.getElementById("comodato-withdrawal-section").style.display = "none";
        
        document.getElementById("comodato-withdrawn-history").style.display = "block";
        document.getElementById("hist-det-return-date").innerText = comodato.returnDate ? new Date(comodato.returnDate + 'T00:00:00').toLocaleDateString('pt-BR') : '-';
        document.getElementById("hist-det-return-notes").innerText = comodato.returnNotes || 'Sem observações.';
    }
    
    document.getElementById("det-com-general-notes").value = comodato.notes || "";
    
    // Renderizar Histórico de Vistorias
    const inspectionsListEl = document.getElementById("comodato-inspections-list");
    if (inspectionsListEl) {
        const inspections = comodato.inspections || [];
        if (inspections.length === 0) {
            inspectionsListEl.innerHTML = `<div style="text-align: center; color: var(--color-text-muted); font-style: italic; padding: 1rem 0;">Nenhuma vistoria registrada.</div>`;
        } else {
            const sortedInspections = [...inspections].sort((a, b) => new Date(b.date) - new Date(a.date));
            let html = `
                <table style="width: 100%; border-collapse: collapse; margin-top: 5px;">
                    <thead>
                        <tr style="border-bottom: 1px solid rgba(255,255,255,0.08); text-align: left; color: var(--color-text-muted); font-size: 0.75rem;">
                            <th style="padding: 6px 4px;">Data</th>
                            <th style="padding: 6px 4px;">Status</th>
                            <th style="padding: 6px 4px;">Observações</th>
                            <th style="padding: 6px 4px; text-align: right;">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            sortedInspections.forEach((ins) => {
                let statusBadge = '';
                if (ins.status === 'excelente') {
                    statusBadge = `<span style="background: rgba(16, 185, 129, 0.15); color: #10b981; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; border: 1px solid rgba(16, 185, 129, 0.2);">Excelente</span>`;
                } else if (ins.status === 'bom') {
                    statusBadge = `<span style="background: rgba(59, 130, 246, 0.15); color: #3b82f6; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; border: 1px solid rgba(59, 130, 246, 0.2);">Bom</span>`;
                } else if (ins.status === 'necessita_manutencao') {
                    statusBadge = `<span style="background: rgba(245, 158, 11, 0.15); color: #f59e0b; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; border: 1px solid rgba(245, 158, 11, 0.2);">Manutenção</span>`;
                } else {
                    statusBadge = `<span style="background: rgba(239, 68, 68, 0.15); color: #ef4444; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; border: 1px solid rgba(239, 68, 68, 0.2);">Sujo / Irregular</span>`;
                }
                
                const formattedInsDate = ins.date ? new Date(ins.date + 'T00:00:00').toLocaleDateString('pt-BR') : '-';
                const originalIndex = inspections.findIndex(x => x.date === ins.date && x.status === ins.status && x.notes === ins.notes);

                html += `
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 0.75rem; vertical-align: middle;">
                        <td style="padding: 6px 4px; white-space: nowrap;">${formattedInsDate}</td>
                        <td style="padding: 6px 4px; white-space: nowrap;">${statusBadge}</td>
                        <td style="padding: 6px 4px; color: var(--color-text-main); line-height: 1.2;">${ins.notes || '-'}</td>
                        <td style="padding: 6px 4px; text-align: right;">
                            <button type="button" class="btn-action" onclick="window.deleteComodatoInspection('${comodato.id}', ${originalIndex})" title="Excluir Vistoria" style="background:none; border:none; color:#ef4444; padding: 2px; cursor:pointer; display: inline-flex; align-items: center;"><i data-lucide="trash-2" style="width: 12px; height: 12px;"></i></button>
                        </td>
                    </tr>
                `;
            });
            html += `
                    </tbody>
                </table>
            `;
            inspectionsListEl.innerHTML = html;
        }
    }
    
    // Renderizar as 4 galerias de fotos/documentos categorizadas
    const categories = ['local', 'qrcode', 'motor', 'contract'];
    const freezerCode = comodato.freezerCode || 'SemCod';
    
    categories.forEach(cat => {
        let arr = [];
        if (cat === 'local') arr = (comodato.photosLocal || []).concat(comodato.photos || []); // Mesclar legadas em local
        else if (cat === 'qrcode') arr = comodato.photosQRCode || [];
        else if (cat === 'motor') arr = comodato.photosMotor || [];
        else if (cat === 'contract') arr = comodato.photosContract || [];
        
        const galleryEl = document.getElementById(`comodato-gallery-${cat}`);
        if (!galleryEl) return;
        
        galleryEl.innerHTML = "";
        if (arr.length > 0) {
            arr.forEach((photo, index) => {
                const card = document.createElement("div");
                card.className = "comodato-photo-card";
                card.style.position = "relative";
                card.style.width = "64px";
                card.style.height = "64px";
                card.style.border = "1px solid rgba(255,255,255,0.1)";
                card.style.borderRadius = "4px";
                card.style.overflow = "hidden";
                card.style.background = "rgba(0,0,0,0.2)";
                card.style.flexShrink = "0";
                
                card.innerHTML = `
                    <img src="${photo}" style="width: 100%; height: 100%; object-fit: cover;">
                    <div class="photo-card-actions" style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.85); display: flex; justify-content: space-around; padding: 2px 0; opacity: 0; transition: opacity 0.2s;">
                        <button type="button" class="btn-action" onclick="window.viewPhoto('${photo}')" title="Visualizar" style="background:none; border:none; color:#00f0ff; padding: 2px; cursor:pointer; display: flex; align-items: center;"><i data-lucide="eye" style="width: 12px; height: 12px;"></i></button>
                        <a href="${photo}" download="comodato_${freezerCode}_${cat}_${index + 1}.jpg" class="btn-action" title="Download" style="color:#00ff64; padding: 2px; cursor:pointer; display: flex; align-items: center;"><i data-lucide="download" style="width: 12px; height: 12px;"></i></a>
                        <button type="button" class="btn-action" onclick="window.printPhoto('${photo}')" title="Imprimir" style="background:none; border:none; color:#ffb703; padding: 2px; cursor:pointer; display: flex; align-items: center;"><i data-lucide="printer" style="width: 12px; height: 12px;"></i></button>
                        <button type="button" class="btn-action" onclick="window.deleteComodatoCategoryPhoto('${comodato.id}', '${cat}', ${index})" title="Excluir" style="background:none; border:none; color:#ef4444; padding: 2px; cursor:pointer; display: flex; align-items: center;"><i data-lucide="trash-2" style="width: 12px; height: 12px;"></i></button>
                    </div>
                `;
                galleryEl.appendChild(card);
            });
        } else {
            galleryEl.innerHTML = `<span style="font-size: 0.7rem; color: var(--color-text-muted); font-style: italic;">Nenhuma foto</span>`;
        }
    });
    
    const sigPending = document.getElementById("comodato-sig-pending-actions");
    const sigSigned = document.getElementById("comodato-sig-signed-container");
    
    if (comodato.signatureBase64) {
        sigPending.style.display = "none";
        sigSigned.style.display = "flex";
        document.getElementById("comodato-sig-preview-img").src = comodato.signatureBase64;
        document.getElementById("comodato-sig-date-text").innerText = "Data: " + window.formatDateBrazil(comodato.signatureDate);
        
        let method = "Assinatura Local";
        if (comodato.signatureMethod === 'remote') method = "Assinatura Remota (Cliente)";
        document.getElementById("comodato-sig-method-text").innerText = "Método: " + method;
    } else {
        sigPending.style.display = "flex";
        sigSigned.style.display = "none";
        
        document.getElementById("btn-comodato-sig-local").onclick = () => {
            if (window.closeModal) window.closeModal("modal-comodato-detail");
            if (window.openSignatureModal) window.openSignatureModal('comodato', comodato.id);
        };
        document.getElementById("btn-comodato-sig-whatsapp").onclick = () => {
            sendComodatoWhatsAppLink(comodato.id);
        };
        document.getElementById("btn-comodato-sig-email").onclick = () => {
            sendComodatoEmailLink(comodato.id);
        };
    }
    
    document.getElementById("btn-comodato-save-notes").onclick = () => {
        saveComodatoNotes(comodato.id);
    };
    
    document.getElementById("btn-comodato-print-doc").onclick = () => {
        openComodato(comodato.id);
    };

    const btnSticker = document.getElementById("btn-comodato-print-sticker");
    if (btnSticker) {
        btnSticker.onclick = () => {
            if (window.closeModal) window.closeModal("modal-comodato-detail");
            const f = (state.freezers || []).find(item => item.code.trim().toUpperCase() === comodato.freezerCode.trim().toUpperCase());
            if (f) {
                if (window.openStickerModal) window.openStickerModal(f.id);
            } else {
                window.showToast(`Equipamento com código "${comodato.freezerCode}" não encontrado no inventário para gerar etiqueta.`, "warning");
            }
        };
    }

    const btnDelete = document.getElementById("btn-comodato-delete");
    if (btnDelete) {
        btnDelete.onclick = () => {
            deleteComodatoRecord(comodato.id);
        };
    }

    const btnMigrate = document.getElementById("btn-comodato-migrate");
    if (btnMigrate) {
        if (comodato.status === 'retirado') {
            btnMigrate.style.display = "none";
        } else {
            btnMigrate.style.display = "inline-flex";
            btnMigrate.onclick = () => {
                openMigrateComodatoModal(comodato.id);
            };
        }
    }
    
    if (window.lucide) window.lucide.createIcons();
}

export function saveComodatoNotes(comId) {
    const comodato = (state.comodatos || []).find(c => c.id === comId);
    if (!comodato) return;
    const notesVal = document.getElementById("det-com-general-notes").value;
    comodato.notes = notesVal;
    
    const client = state.clients.find(c => c.id === comodato.clientId);
    if (client) {
        client.maintenanceNotes = notesVal;
    }
    
    saveState();
    window.showToast("Observações salvas com sucesso!", "success");
    renderComodatoDetail(comId);
    renderComodatosAdmin();
}

export function uploadComodatoPhotos(event) {
    const comId = window.currentComodatoId;
    const comodato = (state.comodatos || []).find(c => c.id === comId);
    if (!comodato) return;
    
    const category = window.currentUploadCategory || 'local';
    let arrName = "";
    if (category === 'local') arrName = 'photosLocal';
    else if (category === 'qrcode') arrName = 'photosQRCode';
    else if (category === 'motor') arrName = 'photosMotor';
    else if (category === 'contract') arrName = 'photosContract';
    
    if (!comodato[arrName]) comodato[arrName] = [];
    
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    if (comodato[arrName].length + files.length > 10) {
        window.showToast("Limite de 10 fotos por categoria atingido.", "warning");
        return;
    }
    
    const btn = document.getElementById(`btn-upload-${category}`);
    const originalHTML = btn ? btn.innerHTML : "";
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="spin-anim" style="display:inline-block; border: 2px solid #fff; border-top: 2px solid transparent; border-radius: 50%; width: 12px; height: 12px; margin-right: 6px; vertical-align: middle; animation: spin 1s linear infinite;"></span>...';
    }
    
    let loadedCount = 0;
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement("canvas");
                let width = img.width;
                let height = img.height;
                const maxDim = 800;
                
                if (width > maxDim || height > maxDim) {
                    if (width > height) {
                        height = Math.round((height * maxDim) / width);
                        width = maxDim;
                    } else {
                        width = Math.round((width * maxDim) / height);
                        height = maxDim;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, width, height);
                
                const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7);
                comodato[arrName].push(compressedBase64);
                
                loadedCount++;
                if (loadedCount === files.length) {
                    saveState();
                    renderComodatoDetail(comId);
                    if (btn) {
                        btn.disabled = false;
                        btn.innerHTML = originalHTML;
                    }
                    event.target.value = "";
                }
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

export function deleteComodatoPhoto(comId, photoIndex) {
    window.showConfirm(
        "Tem certeza que deseja excluir esta foto?",
        () => {
            const comodato = (state.comodatos || []).find(c => c.id === comId);
            if (!comodato) return;
            
            if (comodato.photos && comodato.photos[photoIndex] !== undefined) {
                comodato.photos.splice(photoIndex, 1);
                saveState();
                renderComodatoDetail(comId);
            }
            window.showToast("Foto excluída com sucesso!", "success");
        },
        null,
        "Excluir Foto",
        "Excluir"
    );
}

export function executeComodatoReturn() {
    const comId = window.currentComodatoId;
    const comodato = (state.comodatos || []).find(c => c.id === comId);
    if (!comodato) return;
    
    const returnDate = document.getElementById("comodato-withdrawal-date").value;
    const returnNotes = document.getElementById("comodato-withdrawal-notes").value;
    
    if (!returnDate) {
        window.showToast("Por favor, preencha a data de retirada.", "warning");
        return;
    }
    
    window.showConfirm(
        "Confirmar a retirada / devolução deste freezer? O comodato será finalizado e o equipamento ficará disponível para alocação.",
        () => {
            comodato.status = 'retirado';
            comodato.returnDate = returnDate;
            comodato.returnNotes = returnNotes;
            
            const freezer = state.freezers ? state.freezers.find(f => f.code === comodato.freezerCode) : null;
            if (freezer) {
                freezer.status = 'disponivel';
                delete freezer.clientId;
                delete freezer.clientName;
                delete freezer.deliveryDate;
            }
            
            const client = state.clients.find(c => c.id === comodato.clientId);
            if (client) {
                delete client.freezerCode;
                delete client.freezerBrand;
                delete client.freezerVoltage;
                delete client.freezerCapacity;
                delete client.deliveryDate;
            }
            
            saveState();
            window.showToast("Retirada registrada com sucesso! O freezer voltou a ficar disponível.", "success");
            if (window.closeModal) window.closeModal("modal-comodato-detail");
            if (window.renderApp) window.renderApp();
        },
        null,
        "Registrar Retirada",
        "Confirmar"
    );
}

export function getComodatoPortalURL(comId) {
    if (!state.firebaseConfig || !state.firebaseConfig.enabled || !state.firebaseConfig.apiKey) {
        window.showToast("Atenção: A sincronização com o Firebase precisa estar ativa e configurada nas Configurações da Fábrica para usar o Portal de Assinatura do Cliente.", "warning");
        return null;
    }
    const { apiKey, projectId, databaseURL, deviceKey } = state.firebaseConfig;
    const basePath = window.location.href.split('?')[0];
    
    return `${basePath}?clientSign=comodato&apiKey=${encodeURIComponent(apiKey)}&projectId=${encodeURIComponent(projectId)}&databaseURL=${encodeURIComponent(databaseURL)}&deviceKey=${encodeURIComponent(deviceKey)}&comId=${comId}`;
}

export function sendComodatoWhatsAppLink(comId) {
    const url = getComodatoPortalURL(comId);
    if (!url) return;
    
    const comodato = (state.comodatos || []).find(c => c.id === comId);
    if (!comodato) return;
    
    const client = state.clients.find(c => c.id === comodato.clientId);
    const clientName = client ? client.name : comodato.clientName;
    const clientPhone = client ? client.phone : comodato.clientPhone;
    
    if (!clientPhone) {
        window.showToast("Este cliente não possui telefone cadastrado.", "warning");
        return;
    }
    
    const message = `Olá, ${clientName}! Por favor, acesse o link abaixo para visualizar os termos e assinar digitalmente o Contrato de Comodato do freezer serial (${comodato.freezerCode}):\n\n${url}`;
    
    if (!navigator.onLine) {
        navigator.clipboard.writeText(message)
            .then(() => {
                window.showToast("📶 Você está offline!\nO link de assinatura e mensagem do comodato foram copiados para a sua área de transferência para colar manualmente.", "info");
            })
            .catch(() => {
                window.showToast("Erro ao copiar a mensagem.", "error");
            });
        return;
    }
    
    const cleanPhone = clientPhone.replace(/\D/g, "");
    const formattedPhone = (cleanPhone.length === 10 || cleanPhone.length === 11) ? "55" + cleanPhone : cleanPhone;
    
    const waUrl = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(message)}`;
    window.open(waUrl, "_blank");
}

export function sendComodatoEmailLink(comId) {
    const url = getComodatoPortalURL(comId);
    if (!url) return;
    
    const comodato = (state.comodatos || []).find(c => c.id === comId);
    if (!comodato) return;
    
    const client = state.clients.find(c => c.id === comodato.clientId);
    const clientName = client ? client.name : comodato.clientName;
    
    const subjectText = "Termo de Comodato de Equipamento - Gelo do Vale";
    const bodyText = `Olá, ${clientName},\n\nEnviamos em anexo os dados do comodato do freezer (${comodato.freezerCode}).\n\nPor favor, acesse o link a seguir para ler o contrato e assinar digitalmente:\n${url}\n\nAtenciosamente,\nGelo do Vale`;

    if (!navigator.onLine) {
        const fullEmailText = `Assunto: ${subjectText}\n\n${bodyText}`;
        navigator.clipboard.writeText(fullEmailText)
            .then(() => {
                window.showToast("📶 Você está offline!\nO texto do e-mail de comodato foi copiado para a sua área de transferência.", "info");
            })
            .catch(() => {
                window.showToast("Erro ao copiar o texto do e-mail.", "error");
            });
        return;
    }
    
    window.open(`mailto:?subject=${encodeURIComponent(subjectText)}&body=${encodeURIComponent(bodyText)}`, "_blank");
}

// Portal signature drawing state variables
let portalCanvas = null;
let portalCtx = null;
let portalHasDrawn = false;
let portalLastX = 0;
let portalLastY = 0;
let portalIsDrawing = false;

export function initPortalSignatureCanvas() {
    portalCanvas = document.getElementById("client-portal-canvas");
    if (!portalCanvas) return;
    
    portalCtx = portalCanvas.getContext("2d");
    
    const rect = portalCanvas.getBoundingClientRect();
    portalCanvas.width = rect.width || 500;
    portalCanvas.height = rect.height || 180;
    
    portalCtx.strokeStyle = "#000000";
    portalCtx.lineWidth = 2.5;
    portalCtx.lineCap = "round";
    portalCtx.lineJoin = "round";
    
    portalCanvas.addEventListener("mousedown", (e) => {
        portalIsDrawing = true;
        const coords = getPortalCanvasCoords(e);
        portalLastX = coords.x;
        portalLastY = coords.y;
        
        const label = document.getElementById("portal-canvas-label");
        if (label) label.classList.add("hidden");
        document.getElementById("portal-canvas-container").classList.add("active");
    });
    
    portalCanvas.addEventListener("mousemove", (e) => {
        if (!portalIsDrawing) return;
        const coords = getPortalCanvasCoords(e);
        
        portalCtx.beginPath();
        portalCtx.moveTo(portalLastX, portalLastY);
        portalCtx.lineTo(coords.x, coords.y);
        portalCtx.stroke();
        
        portalLastX = coords.x;
        portalLastY = coords.y;
        portalHasDrawn = true;
    });
    
    portalCanvas.addEventListener("mouseup", () => { portalIsDrawing = false; });
    portalCanvas.addEventListener("mouseout", () => { portalIsDrawing = false; });
    
    portalCanvas.addEventListener("touchstart", (e) => {
        e.preventDefault();
        portalIsDrawing = true;
        const touch = e.touches[0];
        const coords = getPortalCanvasCoords(touch);
        portalLastX = coords.x;
        portalLastY = coords.y;
        
        const label = document.getElementById("portal-canvas-label");
        if (label) label.classList.add("hidden");
        document.getElementById("portal-canvas-container").classList.add("active");
    }, { passive: false });
    
    portalCanvas.addEventListener("touchmove", (e) => {
        e.preventDefault();
        if (!portalIsDrawing) return;
        const touch = e.touches[0];
        const coords = getPortalCanvasCoords(touch);
        
        portalCtx.beginPath();
        portalCtx.moveTo(portalLastX, portalLastY);
        portalCtx.lineTo(coords.x, coords.y);
        portalCtx.stroke();
        
        portalLastX = coords.x;
        portalLastY = coords.y;
        portalHasDrawn = true;
    }, { passive: false });
    
    portalCanvas.addEventListener("touchend", () => { portalIsDrawing = false; });
    
    const btnClear = document.getElementById("btn-portal-clear");
    if (btnClear) {
        btnClear.onclick = () => {
            portalCtx.clearRect(0, 0, portalCanvas.width, portalCanvas.height);
            portalHasDrawn = false;
            const label = document.getElementById("portal-canvas-label");
            if (label) label.classList.remove("hidden");
            document.getElementById("portal-canvas-container").classList.remove("active");
        };
    }
}

function getPortalCanvasCoords(e) {
    if (!portalCanvas) return { x: 0, y: 0 };
    const rect = portalCanvas.getBoundingClientRect();
    return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };
}

export function initClientSigningPortal(urlParams) {
    const apiKey = urlParams.get("apiKey");
    const projectId = urlParams.get("projectId");
    const databaseURL = urlParams.get("databaseURL");
    const deviceKey = urlParams.get("deviceKey");
    const comId = urlParams.get("comId");
    
    if (!apiKey || !projectId || !databaseURL || !deviceKey || !comId) {
        showPortalError("Parâmetros de assinatura inválidos ou incompletos na URL. Entre em contato com a fábrica para receber um link válido.");
        return;
    }
    
    document.body.innerHTML = `
        <div id="client-portal-root">
            <div class="client-portal-card" id="portal-loading-card" style="text-align: center; margin-top: 10vh;">
                <img src="logo_vertical.png" class="client-portal-logo" alt="Gelo do Vale" style="max-height: 80px; object-fit: contain;">
                <h3 class="client-portal-title">Conectando ao Servidor...</h3>
                <div style="margin: 25px 0;">
                    <span class="spin-anim" style="display:inline-block; border: 3px solid rgba(0,240,255,0.15); border-top: 3px solid var(--color-primary); border-radius: 50%; width: 32px; height: 32px; animation: spin 1s linear infinite;"></span>
                </div>
                <p style="font-size: 0.85rem; color: var(--color-text-muted);">Estabelecendo conexão segura para carregar os termos do comodato.</p>
            </div>
        </div>
    `;
    
    loadFirebaseSDK(() => {
        try {
            const config = { apiKey, projectId, databaseURL };
            if (firebase.apps.length === 0) {
                firebase.initializeApp(config);
            }
            
            firebase.database().ref(`factories/${deviceKey}`).once("value")
                .then(snapshot => {
                    const remoteState = snapshot.val();
                    if (!remoteState) {
                        showPortalError("Não foi possível carregar as informações do sistema da fábrica. Verifique as credenciais.");
                        return;
                    }
                    
                    if (!remoteState.comodatos) {
                        showPortalError("Nenhum registro de comodato encontrado no sistema remoto.");
                        return;
                    }
                    
                    const comodatosArr = Array.isArray(remoteState.comodatos)
                        ? remoteState.comodatos
                        : Object.values(remoteState.comodatos || {});
                    const comodato = comodatosArr.find(c => c.id === comId);
                    if (!comodato) {
                        showPortalError("O Contrato de Comodato solicitado não foi encontrado no sistema ou foi cancelado.");
                        return;
                    }
                    
                    if (comodato.status === 'ativo') {
                        showPortalSuccess(remoteState, comodato, true);
                        return;
                    }
                    
                    if (comodato.status === 'retirado') {
                        showPortalError("Este comodato foi finalizado devido à devolução/retirada do equipamento.");
                        return;
                    }
                    
                    const clientsArr = Array.isArray(remoteState.clients)
                        ? remoteState.clients
                        : Object.values(remoteState.clients || {});
                    const client = remoteState.clients ? clientsArr.find(c => c.id === comodato.clientId) : null;
                    if (!client) {
                        showPortalError("Cliente associado ao comodato não encontrado.");
                        return;
                    }
                    
                    renderPortalInterface(remoteState, comodato, client, deviceKey);
                })
                .catch(err => {
                    console.error("Erro ao obter dados do Firebase:", err);
                    showPortalError("Falha na conexão com o servidor: " + err.message);
                });
        } catch (error) {
            console.error("Erro ao inicializar Firebase no portal:", error);
            showPortalError("Falha ao configurar a conexão segura: " + error.message);
        }
    });
}

export function renderPortalInterface(remoteState, comodato, client, deviceKey) {
    const root = document.getElementById("client-portal-root");
    if (!root) return;
    
    const termsHTML = renderPortalContractTerms(comodato, client, remoteState);
    const clientPhone = client ? (client.phone || comodato.clientPhone || '') : (comodato.clientPhone || '');
    const clientAddress = client ? (client.address || comodato.clientAddress || '') : (comodato.clientAddress || '');
    const clientDoc = client ? (client.document || '') : '';
    
    root.innerHTML = `
        <div class="client-portal-card">
            <div class="client-portal-header">
                <img src="logo_vertical.png" class="client-portal-logo" alt="Gelo do Vale" style="max-height: 85px; object-fit: contain;">
                <h3 class="client-portal-title">Assinatura do Termo de Comodato</h3>
                <p class="client-portal-subtitle">Leia com atenção os termos e confirme seus dados para assinar.</p>
            </div>
            
            <div class="client-portal-contract-box">
                ${termsHTML}
            </div>
            
            <div class="client-portal-form">
                <h4 style="color: var(--color-primary); font-size: 0.9rem; margin-top: 0.5rem; margin-bottom: 0.25rem; font-weight: 700;">Confirme e complete seus dados:</h4>
                
                <div class="form-group" style="margin-bottom: 0.75rem;">
                    <label for="portal-client-doc" style="font-size: 0.8rem; color: var(--color-text-muted); display: block; margin-bottom: 4px;">CNPJ ou CPF *</label>
                    <input type="text" id="portal-client-doc" class="form-control" value="${clientDoc}" placeholder="Ex: 00.000.000/0000-00" required>
                </div>
                
                <div class="form-group" style="margin-bottom: 0.75rem;">
                    <label for="portal-client-phone" style="font-size: 0.8rem; color: var(--color-text-muted); display: block; margin-bottom: 4px;">Telefone / WhatsApp *</label>
                    <input type="text" id="portal-client-phone" class="form-control" value="${clientPhone}" placeholder="Ex: (12) 99999-9999" required>
                </div>
                
                <div class="form-group" style="margin-bottom: 1rem;">
                    <label for="portal-client-address" style="font-size: 0.8rem; color: var(--color-text-muted); display: block; margin-bottom: 4px;">Endereço Completo de Instalação *</label>
                    <input type="text" id="portal-client-address" class="form-control" value="${clientAddress}" placeholder="Ex: Rua Nome da Rua, 123, Bairro, Cidade - SP" required>
                </div>
            </div>
            
            <label style="font-size: 0.8rem; color: var(--color-text-muted); display: block; margin-bottom: 6px;">Assinatura Digital (Use o dedo ou mouse) *</label>
            <div class="client-portal-canvas-container" id="portal-canvas-container" style="background: white; border: 1.5px dashed rgba(255,255,255,0.15); border-radius: 8px;">
                <div class="client-portal-canvas-label" id="portal-canvas-label" style="color: #666; pointer-events: none; z-index: 10;">
                    <i data-lucide="pen-tool" style="display: block; margin: 0 auto 5px auto; width: 18px; height: 18px;"></i>
                    Desenhe sua assinatura aqui
                </div>
                <canvas id="client-portal-canvas" style="background: white;"></canvas>
            </div>
            
            <div class="client-portal-buttons" style="margin-top: 1rem;">
                <button type="button" class="btn btn-secondary" id="btn-portal-clear" style="padding: 8px 16px;">Limpar</button>
                <button type="button" class="btn btn-primary" id="btn-portal-submit" style="padding: 8px 20px; display: inline-flex; align-items: center; gap: 6px;">
                    <i data-lucide="check" style="width: 14px; height: 14px;"></i> Assinar e Enviar
                </button>
            </div>
            <div id="toast-container" aria-live="polite" aria-atomic="false"></div>
        </div>
    `;
    
    if (window.lucide) window.lucide.createIcons();
    initPortalSignatureCanvas();
    
    document.getElementById("btn-portal-submit").onclick = () => {
        const docVal = document.getElementById("portal-client-doc").value.trim();
        const phoneVal = document.getElementById("portal-client-phone").value.trim();
        const addressVal = document.getElementById("portal-client-address").value.trim();
        
        if (!docVal) {
            window.showToast("Por favor, preencha o seu CNPJ ou CPF.", "warning");
            return;
        }
        if (!phoneVal) {
            window.showToast("Por favor, preencha o seu Telefone/WhatsApp.", "warning");
            return;
        }
        if (!addressVal) {
            window.showToast("Por favor, preencha o endereço completo de instalação.", "warning");
            return;
        }
        if (!portalHasDrawn) {
            window.showToast("Por favor, desenhe sua assinatura no campo indicado antes de enviar.", "warning");
            return;
        }
        
        const btnSubmit = document.getElementById("btn-portal-submit");
        const btnClear = document.getElementById("btn-portal-clear");
        if (btnSubmit) btnSubmit.disabled = true;
        if (btnClear) btnClear.disabled = true;
        if (btnSubmit) btnSubmit.innerHTML = '<span class="spin-anim" style="display:inline-block; border: 2px solid #fff; border-top: 2px solid transparent; border-radius: 50%; width: 12px; height: 12px; margin-right: 6px; vertical-align: middle; animation: spin 1s linear infinite;"></span> Enviando...';
        
        const dataUrl = portalCanvas.toDataURL("image/png");
        
        const comId = comodato.id;
        const comodatosArr = Array.isArray(remoteState.comodatos)
            ? remoteState.comodatos
            : Object.values(remoteState.comodatos || {});
        const targetComodato = comodatosArr.find(c => c.id === comId);
        if (targetComodato) {
            targetComodato.signatureBase64 = dataUrl;
            targetComodato.status = 'ativo';
            targetComodato.signatureDate = window.getBrazilTimeISO();
            targetComodato.signatureMethod = 'remote';
            targetComodato.clientPhone = phoneVal;
            targetComodato.clientAddress = addressVal;
        }
        
        const clientsArr = Array.isArray(remoteState.clients)
            ? remoteState.clients
            : Object.values(remoteState.clients || {});
        const targetClient = clientsArr.find(c => c.id === comodato.clientId);
        if (targetClient) {
            targetClient.document = docVal;
            targetClient.phone = phoneVal;
            targetClient.address = addressVal;
            targetClient.freezerCode = comodato.freezerCode;
        }
        
        remoteState.lastUpdated = Date.now();
        
        firebase.database().ref(`factories/${deviceKey}`).set(remoteState)
            .then(() => {
                showPortalSuccess(remoteState, targetComodato || comodato, false);
            })
            .catch(err => {
                console.error("Erro ao salvar assinatura remota no Firebase:", err);
                window.showToast("Ocorreu um erro ao enviar sua assinatura para o servidor. Por favor, tente novamente: " + err.message, "error");
                if (btnSubmit) btnSubmit.disabled = false;
                if (btnClear) btnClear.disabled = false;
                if (btnSubmit) btnSubmit.innerHTML = '<i data-lucide="check" style="width: 14px; height: 14px;"></i> Assinar e Enviar';
                if (window.lucide) window.lucide.createIcons();
            });
    };
}

export function showPortalSuccess(remoteState, comodato, alreadySigned) {
    const root = document.getElementById("client-portal-root");
    if (!root) return;
    
    const facName = remoteState.factorySettings && remoteState.factorySettings.name ? remoteState.factorySettings.name : "Gelo do Vale";
    const titleText = alreadySigned ? "Contrato Já Assinado!" : "Assinatura Enviada com Sucesso!";
    const bodyText = alreadySigned 
        ? `Este termo de comodato para o freezer serial <strong>${comodato.freezerCode}</strong> já foi assinado e encontra-se devidamente ativo no sistema da fábrica.`
        : `Sua assinatura para o comodato do freezer serial <strong>${comodato.freezerCode}</strong> foi registrada e sincronizada com a fábrica com sucesso.`;
        
    root.innerHTML = `
        <div class="client-portal-card" style="text-align: center; border-color: var(--color-success); box-shadow: 0 10px 30px rgba(16, 185, 129, 0.1), var(--shadow-neon);">
            <div style="margin-bottom: 1.5rem;">
                <img src="logo_vertical.png" class="client-portal-logo" alt="Gelo do Vale" style="max-height: 85px; object-fit: contain;">
            </div>
            
            <div style="background: rgba(16, 185, 129, 0.15); border: 2px solid #10b981; width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem auto;">
                <i data-lucide="check-circle-2" style="width: 36px; height: 36px; color: #10b981;"></i>
            </div>
            
            <h3 class="client-portal-title" style="color: #10b981; text-shadow: 0 0 10px rgba(16, 185, 129, 0.2);">${titleText}</h3>
            <p style="font-size: 0.88rem; color: #cbd5e1; margin-top: 10px; line-height: 1.6; padding: 0 10px;">
                ${bodyText}
            </p>
            
            <p style="font-size: 0.8rem; color: var(--color-text-muted); margin-top: 1.5rem; border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 1.25rem;">
                Obrigado pela parceria!<br>
                <strong>${facName}</strong>
            </p>
            
            <div style="margin-top: 1.5rem;">
                <button class="btn btn-secondary" onclick="window.close()" style="font-size: 0.8rem; padding: 6px 16px;">Fechar Janela</button>
            </div>
        </div>
    `;
    
    if (window.lucide) window.lucide.createIcons();
}

export function showPortalError(msg) {
    const root = document.getElementById("client-portal-root");
    if (!root) return;
    
    root.innerHTML = `
        <div class="client-portal-card" style="text-align: center; border-color: var(--color-danger); box-shadow: 0 10px 30px rgba(239, 68, 68, 0.1), var(--shadow-neon);">
            <div style="margin-bottom: 1.5rem;">
                <img src="logo_vertical.png" class="client-portal-logo" alt="Gelo do Vale" style="max-height: 85px; object-fit: contain;">
            </div>
            
            <div style="background: rgba(239, 68, 68, 0.15); border: 2px solid #ef4444; width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem auto;">
                <i data-lucide="alert-triangle" style="width: 36px; height: 36px; color: #ef4444;"></i>
            </div>
            
            <h3 class="client-portal-title" style="color: #ef4444; text-shadow: 0 0 10px rgba(239, 68, 68, 0.2);">Falha ao Carregar Contrato</h3>
            <p style="font-size: 0.88rem; color: #cbd5e1; margin-top: 10px; line-height: 1.6; padding: 0 10px;">
                ${msg}
            </p>
            
            <p style="font-size: 0.8rem; color: var(--color-text-muted); margin-top: 1.5rem; border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 1.25rem;">
                Se o erro persistir, por favor solicite um novo link de assinatura à equipe da fábrica.
            </p>
        </div>
    `;
    
    if (window.lucide) window.lucide.createIcons();
}

function getClientQualification(clientName, clientDoc, clientAddress, clientPhone) {
    const docClean = (clientDoc || '').replace(/\D/g, '');
    const nameUpper = (clientName || '').toUpperCase();
    if (docClean.length > 11) {
        // CNPJ / Pessoa Jurídica
        return `<strong>COMODATÁRIO:</strong> ${nameUpper}, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº ${clientDoc}, com sede e endereço de instalação no endereço: ${clientAddress}, telefone: ${clientPhone}.`;
    } else if (docClean.length === 11) {
        // CPF / Pessoa Física
        return `<strong>COMODATÁRIO:</strong> ${nameUpper}, pessoa física, portadora do CPF sob o nº ${clientDoc}, residente e domiciliada no endereço de instalação: ${clientAddress}, telefone: ${clientPhone}.`;
    } else {
        // Fallback
        return `<strong>COMODATÁRIO:</strong> ${nameUpper}, CNPJ/CPF: ${clientDoc || 'Não informado'}, endereço de instalação: ${clientAddress}, telefone: ${clientPhone}.`;
    }
}

export function renderPortalContractTerms(comodato, client, remoteState) {
    const clientName = client ? client.name : comodato.clientName;
    const clientDoc = client ? (client.document || comodato.clientDoc || 'Não informado') : (comodato.clientDoc || 'Não informado');
    const clientPhone = client ? (client.phone || comodato.clientPhone || 'Não informado') : (comodato.clientPhone || 'Não informado');
    const clientAddress = client ? (client.address || comodato.clientAddress || 'Não informado') : (comodato.clientAddress || 'Não informado');
    const dataEntrega = comodato.startDate ? new Date(comodato.startDate + 'T00:00:00').toLocaleDateString('pt-BR') : '___/___/______';
    const dataAtual = window.formatDateBrazil(window.getBrazilTimeISO());
    const gpsCoords = (comodato.latitude && comodato.longitude) ? `${comodato.latitude}, ${comodato.longitude}` : (client && client.latitude ? `${client.latitude}, ${client.longitude}` : 'Não registrada');
    
    const facName = remoteState.factorySettings && remoteState.factorySettings.name ? remoteState.factorySettings.name : "GELO DO VALE";
    const facCnpj = remoteState.factorySettings && remoteState.factorySettings.cnpj ? remoteState.factorySettings.cnpj : "00.000.000/0000-00";
    const facAddress = remoteState.factorySettings && remoteState.factorySettings.address ? remoteState.factorySettings.address : "Vale do Paraíba, São José dos Campos - SP";

    return `
        <div style="text-align: center; margin-bottom: 20px;">
            <h3 style="font-weight: bold; border-bottom: 2px solid var(--color-primary); padding-bottom: 10px; font-size: 1rem; color: #fff; margin: 0 0 15px 0;">INSTRUMENTO PARTICULAR DE COMODATO DE EQUIPAMENTO</h3>
        </div>
        
        <p><strong>COMODANTE:</strong> ${facName.toUpperCase()}, inscrita no CNPJ sob o nº ${facCnpj}, com sede no endereço: ${facAddress}.</p>
        <p>${getClientQualification(clientName, clientDoc, clientAddress, clientPhone)}</p>
        
        <p style="margin-top: 15px;">As partes qualificadas acima têm entre si justo e avençado o comodato do equipamento abaixo descrito, regulado pelas seguintes condições:</p>
        
        <h4 style="margin-top: 15px; font-weight: bold; color: var(--color-primary); font-size: 0.85rem;">CLÁUSULA 1ª - DO OBJETO E CARACTERÍSTICAS</h4>
        <p>O presente contrato tem por objeto o empréstimo gratuito (comodato) de 01 (um) freezer para conservação de gelo, de propriedade da COMODANTE, com as seguintes características:</p>
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin: 10px 0; gap: 15px;">
            <div style="flex: 1;">
                <ul style="margin: 0; padding-left: 20px; list-style-type: square; color: #cbd5e1;">
                    <li><strong>Código do Freezer (Serial):</strong> ${comodato.freezerCode}</li>
                    <li><strong>Marca / Modelo:</strong> ${comodato.freezerBrand || 'Não informado'}</li>
                    <li><strong>Voltagem de Operação:</strong> ${comodato.freezerVoltage || 'Não informado'}</li>
                    <li><strong>Capacidade (Volume):</strong> ${comodato.freezerCapacity ? comodato.freezerCapacity + (comodato.freezerCapacity.toString().toLowerCase().includes('litros') ? '' : ' Litros') : 'Não informado'}</li>
                    <li><strong>Data de Entrega ao Cliente:</strong> ${dataEntrega}</li>
                    <li><strong>Coordenadas GPS de Instalação:</strong> ${gpsCoords}</li>
                </ul>
            </div>
            <div style="display: flex; flex-direction: column; align-items: center; text-align: center; border: 1px solid rgba(255,255,255,0.1); padding: 6px; border-radius: 4px; background: #fff; width: 88px; height: 102px; box-sizing: border-box; flex-shrink: 0; align-self: center;">
                <div id="portal-comodato-qrcode" style="width: 76px; height: 76px; display: flex; align-items: center; justify-content: center;"></div>
                <span style="font-size: 0.5rem; color: #000; font-family: sans-serif; font-weight: bold; margin-top: 2px;">COD: ${comodato.freezerCode}</span>
            </div>
        </div>
        <p>O COMODATÁRIO declara receber o equipamento em perfeitas condições de uso, funcionamento, limpeza e conservação.</p>
        
        <h4 style="margin-top: 15px; font-weight: bold; color: var(--color-primary); font-size: 0.85rem;">CLÁUSULA 2ª - DO USO E EXCLUSIVIDADE ABSOLUTA</h4>
        <p>O equipamento destina-se <strong>exclusivamente</strong> ao acondicionamento e comercialização de gelo e carvão fornecidos pela COMODANTE. Fica expressamente vedada a colocação de produtos de outras marcas, concorrentes, bebidas, carnes ou quaisquer outros alimentos no freezer comodado, sob pena de rescisão contratual de pleno direito e recolhimento imediato do equipamento.</p>
        
        <h4 style="margin-top: 15px; font-weight: bold; color: var(--color-primary); font-size: 0.85rem;">CLÁUSULA 3ª - DA CONSERVAÇÃO E PRESERVAÇÃO DURANTE O USO</h4>
        <p>O COMODATÁRIO obriga-se a zelar pelo perfeito estado de conservação, higiene e limpeza do freezer durante todo o período de uso. O equipamento deve ser mantido em local coberto, seco, ventilado e protegido das intempéries (sol e chuva). As despesas de energia elétrica para o seu funcionamento correm por conta exclusiva do COMODATÁRIO, que responderá também por eventuais perdas, furtos, roubos ou danos causados por mau uso, negligência ou vandalismo.</p>
        
        <h4 style="margin-top: 15px; font-weight: bold; color: var(--color-primary); font-size: 0.85rem;">CLÁUSULA 4ª - DA RASTREABILIDADE (QR CODE E GPS)</h4>
        <p>O freezer está cadastrado com número serial rastreável via QR Code e geolocalização física por satélite (GPS). Fica expressamente proibido ao COMODATÁRIO mudar o equipamento do endereço de instalação acordado neste instrumento, bem como emprestar, sublocar ou transferir a posse a terceiros, sem autorização prévia e expressa por escrito da COMODANTE.</p>
        
        <h4 style="margin-top: 15px; font-weight: bold; color: var(--color-primary); font-size: 0.85rem;">CLÁUSULA 5ª - DA MANUTENÇÃO EXCLUSIVA</h4>
        <p>Toda e qualquer manutenção mecânica ou elétrica do freezer deve ser realizada exclusivamente pela equipe credenciada da COMODANTE. O COMODATÁRIO deve comunicar qualquer falha técnica imediatamente e fica proibido de efetuar reparos por conta própria ou através de terceiros não autorizados.</p>
        
        <h4 style="margin-top: 15px; font-weight: bold; color: var(--color-primary); font-size: 0.85rem;">CLÁUSULA 6ª - DA VIABILIDADE (COMPRA MÍNIMA)</h4>
        <p>A permanência do freezer no ponto de venda está vinculada à sua viabilidade econômica. O COMODATÁRIO compromete-se a manter uma média de compras mensais mínimas de produtos da COMODANTE. A inatividade operacional ou a ausência de pedidos por período superior a 30 (trinta) dias ensejará o recolhimento do ativo pela COMODANTE.</p>
        
        <h4 style="margin-top: 15px; font-weight: bold; color: var(--color-primary); font-size: 0.85rem;">CLÁUSULA 7ª - DA VISTORIA E FISCALIZAÇÃO</h4>
        <p>A COMODANTE poderá realizar vistorias técnicas e comerciais periódicas no equipamento, a qualquer tempo durante o horário comercial de funcionamento do estabelecimento, para verificar o cumprimento das cláusulas de higiene, exclusividade de gelo e leitura do QR Code patrimonial.</p>
        
        <h4 style="margin-top: 15px; font-weight: bold; color: var(--color-primary); font-size: 0.85rem;">CLÁUSULA 8ª - DO PRAZO E RESCISÃO</h4>
        <p>O presente contrato é por prazo indeterminado. Qualquer das partes poderá rescindi-lo imotivadamente mediante aviso prévio de 05 (cinco) dias. Em caso de devolução, o freezer deverá ser entregue devidamente higienizado e em perfeito estado de funcionamento.</p>
        
        <p style="margin-top: 25px; text-align: center; color: var(--color-text-muted);">Vale do Paraíba - SP, ${dataAtual}.</p>
    `;
}

export function openComodato(comId) {
    let comodato = state.comodatos ? (state.comodatos || []).find(c => c.id === comId) : null;
    let client, freezerCode, freezerBrand, freezerVoltage, freezerCapacity, dataEntrega, notes;
    
    if (comodato) {
        client = state.clients.find(c => c.id === comodato.clientId);
        freezerCode = comodato.freezerCode;
        freezerBrand = comodato.freezerBrand;
        freezerVoltage = comodato.freezerVoltage;
        freezerCapacity = comodato.freezerCapacity;
        dataEntrega = comodato.startDate ? new Date(comodato.startDate + 'T00:00:00').toLocaleDateString('pt-BR') : '___/___/______';
        notes = comodato.notes || '';
    } else {
        client = state.clients.find(c => c.id === comId);
        if (!client) return;
        freezerCode = client.freezerCode || 'N/A';
        freezerBrand = client.freezerBrand || 'Não informado';
        freezerVoltage = client.freezerVoltage || 'Não informado';
        freezerCapacity = client.freezerCapacity || '';
        dataEntrega = client.deliveryDate ? new Date(client.deliveryDate + 'T00:00:00').toLocaleDateString('pt-BR') : '___/___/______';
        notes = client.maintenanceNotes || '';
        comodato = state.comodatos ? (state.comodatos || []).find(c => c.clientId === client.id && c.freezerCode === freezerCode && c.status !== 'retirado') : null;
    }

    if (!client) return;

    const dataAtual = window.formatDateBrazil(window.getBrazilTimeISO());
    const showSignatures = (state.printSettings && state.printSettings.showSignatures !== undefined) ? state.printSettings.showSignatures : true;
    
    let signatureHTML = '';
    if (showSignatures && comodato && comodato.signatureBase64) {
        signatureHTML = `<img src="${comodato.signatureBase64}" style="max-height: 80px; max-width: 100%; display: block; margin: 0 auto -10px auto; pointer-events: none; filter: contrast(1.2);">`;
    }

    const gpsCoords = (comodato && comodato.latitude && comodato.longitude) ? `${comodato.latitude}, ${comodato.longitude}` : (client.latitude ? `${client.latitude}, ${client.longitude}` : 'Não registrada');
    const clientDoc = client.document || (comodato && comodato.clientDoc) || 'Não informado';

    const facName = state.factorySettings && state.factorySettings.name ? state.factorySettings.name : FACTORY_INFO.name;
    const facCnpj = state.factorySettings && state.factorySettings.cnpj ? state.factorySettings.cnpj : FACTORY_INFO.cnpj;
    const facAddress = state.factorySettings && state.factorySettings.address ? state.factorySettings.address : FACTORY_INFO.address;

    const contractHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
            <img src="${state.factorySettings && state.factorySettings.logo ? state.factorySettings.logo : 'logo_vertical.png'}" alt="Gelo do Vale" style="max-height: 100px; object-fit: contain;">
        </div>
        <h2 style="text-align: center; margin-bottom: 20px; font-weight: bold; border-bottom: 2px solid var(--color-primary); padding-bottom: 10px; font-size: 1.25rem;">INSTRUMENTO PARTICULAR DE COMODATO DE EQUIPAMENTO</h2>
        
        <p><strong>COMODANTE:</strong> ${facName.toUpperCase()}, inscrita no CNPJ sob o nº ${facCnpj}, com sede no endereço: ${facAddress}.</p>
        <p>${getClientQualification(client.name, clientDoc, client.address || 'Não informado', client.phone || 'Não informado')}</p>
        
        <p style="margin-top: 15px;">As partes qualificadas acima têm entre si justo e avençado o comodato do equipamento abaixo descrito, regulado pelas seguintes condições:</p>
        
        <h4 style="margin-top: 15px; font-weight: bold; color: var(--color-primary); font-size: 0.95rem;">CLÁUSULA 1ª - DO OBJETO E CARACTERÍSTICAS</h4>
        <p>O presente contrato tem por objeto o empréstimo gratuito (comodato) de 01 (um) freezer para conservação de gelo, de propriedade da COMODANTE, com as seguintes características:</p>
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin: 10px 0; gap: 15px;">
            <div style="flex: 1;">
                <ul style="margin: 0; padding-left: 20px; list-style-type: square;">
                    <li><strong>Código do Freezer (Serial):</strong> ${freezerCode}</li>
                    <li><strong>Marca / Modelo:</strong> ${freezerBrand}</li>
                    <li><strong>Voltagem de Operação:</strong> ${freezerVoltage}</li>
                    <li><strong>Capacidade (Volume):</strong> ${freezerCapacity ? freezerCapacity + (freezerCapacity.toString().toLowerCase().includes('litros') ? '' : ' Litros') : 'Não informado'}</li>
                    <li><strong>Data de Entrega ao Cliente:</strong> ${dataEntrega}</li>
                    <li><strong>Coordenadas GPS de Instalação:</strong> ${gpsCoords}</li>
                </ul>
            </div>
            <div style="display: flex; flex-direction: column; align-items: center; text-align: center; border: 1px solid #ccc; padding: 6px; border-radius: 4px; background: #fff; width: 88px; height: 102px; box-sizing: border-box; flex-shrink: 0; align-self: center;">
                <div id="print-comodato-qrcode" style="width: 76px; height: 76px; display: flex; align-items: center; justify-content: center;"></div>
                <span style="font-size: 0.5rem; color: #000; font-family: sans-serif; font-weight: bold; margin-top: 2px;">COD: ${freezerCode}</span>
            </div>
        </div>
        <p>O COMODATÁRIO declara receber o equipamento em perfeitas condições de uso, funcionamento, limpeza e conservação.</p>
        
        <h4 style="margin-top: 15px; font-weight: bold; color: var(--color-primary); font-size: 0.95rem;">CLÁUSULA 2ª - DO USO E EXCLUSIVIDADE ABSOLUTA</h4>
        <p>O equipamento destina-se <strong>exclusivamente</strong> ao acondicionamento e comercialização de gelo e carvão fornecidos pela COMODANTE. Fica expressamente vedada a colocação de produtos de outras marcas, concorrentes, bebidas, carnes ou quaisquer outros alimentos no freezer comodado, sob pena de rescisão contratual de pleno direito e recolhimento imediato do equipamento.</p>
        
        <h4 style="margin-top: 15px; font-weight: bold; color: var(--color-primary); font-size: 0.95rem;">CLÁUSULA 3ª - DA CONSERVAÇÃO E PRESERVAÇÃO DURANTE O USO</h4>
        <p>O COMODATÁRIO obriga-se a zelar pelo perfeito estado de conservação, higiene e limpeza do freezer durante todo o período de uso. O equipamento deve ser mantido em local coberto, seco, ventilado e protegido das intempéries (sol e chuva). As despesas de energia elétrica para o seu funcionamento correm por conta exclusiva do COMODATÁRIO, que responderá também por eventuais perdas, furtos, roubos ou danos causados por mau uso, negligência ou vandalismo.</p>
        
        <h4 style="margin-top: 15px; font-weight: bold; color: var(--color-primary); font-size: 0.95rem;">CLÁUSULA 4ª - DA RASTREABILIDADE (QR CODE E GPS)</h4>
        <p>O freezer está cadastrado com número serial rastreável via QR Code e geolocalização física por satélite (GPS). Fica expressamente proibido ao COMODATÁRIO mudar o equipamento do endereço de instalação acordado neste instrumento, bem como emprestar, sublocar ou transferir a posse a terceiros, sem autorização prévia e expressa por escrito da COMODANTE.</p>
        
        <h4 style="margin-top: 15px; font-weight: bold; color: var(--color-primary); font-size: 0.95rem;">CLÁUSULA 5ª - DA MANUTENÇÃO EXCLUSIVA</h4>
        <p>Toda e qualquer manutenção mecânica ou elétrica do freezer deve ser realizada exclusivamente pela equipe credenciada da COMODANTE. O COMODATÁRIO deve comunicar qualquer falha técnica imediatamente e fica proibido de efetuar reparos por conta própria ou através de terceiros não autorizados.</p>
        
        <h4 style="margin-top: 15px; font-weight: bold; color: var(--color-primary); font-size: 0.95rem;">CLÁUSULA 6ª - DA VIABILIDADE (COMPRA MÍNIMA)</h4>
        <p>A permanência do freezer no ponto de venda está vinculada à sua viabilidade econômica. O COMODATÁRIO compromete-se a manter uma média de compras mensais mínimas de produtos da COMODANTE. A inatividade operacional ou a ausência de pedidos por período superior a 30 (trinta) dias ensejará o recolhimento do ativo pela COMODANTE.</p>
        
        <h4 style="margin-top: 15px; font-weight: bold; color: var(--color-primary); font-size: 0.95rem;">CLÁUSULA 7ª - DA VISTORIA E FISCALIZAÇÃO</h4>
        <p>A COMODANTE poderá realizar vistorias técnicas e comerciais periódicas no equipamento, a qualquer tempo durante o horário comercial de funcionamento do estabelecimento, para verificar o cumprimento das cláusulas de higiene, exclusividade de gelo e leitura do QR Code patrimonial.</p>
        
        <h4 style="margin-top: 15px; font-weight: bold; color: var(--color-primary); font-size: 0.95rem;">CLÁUSULA 8ª - DO PRAZO E RESCISÃO</h4>
        <p>O presente contrato é por prazo indeterminado. Qualquer das partes poderá rescindi-lo imotivadamente mediante aviso prévio de 05 (cinco) dias. Em caso de devolução, o freezer deverá ser entregue devidamente higienizado e em perfeito estado de funcionamento.</p>
        
        <p style="margin-top: 25px; text-align: center;">Vale do Paraíba - SP, ${comodato && comodato.signatureDate ? new Date(comodato.signatureDate).toLocaleDateString('pt-BR') : dataAtual}.</p>
        
        <div style="margin-top: 40px; display: flex; justify-content: space-between;">
            <div style="width: 45%; border-top: 1px solid #ccc; text-align: center; padding-top: 5px;">
                <p style="font-size: 0.8rem; margin: 0; color: #000;"><strong>COMODANTE</strong></p>
                <p style="font-size: 0.75rem; color: #666; margin: 0;">${facName}</p>
            </div>
            <div style="width: 45%; border-top: 1px solid #ccc; text-align: center; padding-top: 5px; min-height: 100px; display: flex; flex-direction: column; justify-content: space-between;">
                <div>
                    ${signatureHTML}
                </div>
                <div>
                    <p style="font-size: 0.8rem; margin: 0; color: #000;"><strong>COMODATÁRIO</strong></p>
                    <p style="font-size: 0.75rem; color: #666; margin: 0;">${client.name}</p>
                </div>
            </div>
        </div>
    `;

    document.getElementById("comodato-content").innerHTML = contractHTML;
    document.getElementById("modal-comodato").classList.add("active");
    
    // Desenhar QR Code na folha de impressão
    setTimeout(() => {
        const qrContainer = document.getElementById("print-comodato-qrcode");
        if (qrContainer) {
            qrContainer.innerHTML = "";
            new QRCode(qrContainer, {
                text: freezerCode,
                width: 76,
                height: 76,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });
        }
    }, 100);
}

export function printComodato() {
    const content = document.getElementById("comodato-content").innerHTML;
    const printWindow = window.open("", "_blank");
    
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Termo de Comodato - Gelo do Vale</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    padding: 40px;
                    color: #000;
                    background: #fff;
                    font-size: 13px;
                }
                h2 {
                    text-align: center;
                    margin-bottom: 30px;
                    font-size: 18px;
                    text-transform: uppercase;
                    border-bottom: 2px solid #000;
                    padding-bottom: 10px;
                }
                h4 {
                    margin-top: 20px;
                    margin-bottom: 5px;
                    font-size: 14px;
                    text-transform: uppercase;
                }
                p, ul {
                    margin-bottom: 12px;
                    text-align: justify;
                }
                ul {
                    padding-left: 20px;
                }
                .signatures {
                    margin-top: 50px;
                    display: flex;
                    justify-content: space-between;
                }
                .sig-box {
                    width: 45%;
                    border-top: 1px solid #000;
                    text-align: center;
                    padding-top: 5px;
                }
                @media print {
                    .print-btn-container { display: none; }
                }
            </style>
        </head>
        <body>
            <div class="print-btn-container" style="text-align: right; margin-bottom: 20px;">
                <button onclick="window.print();" style="padding: 8px 16px; background: #0072ff; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">Imprimir Documento</button>
            </div>
            ${content}
        </body>
        </html>
    `);
    
    printWindow.document.close();
}

export function openRentalContract(rentalId) {
    const rental = (state.rentals || []).find(r => r.id === rentalId);
    if (!rental) return;

    document.getElementById("contract-rental-id").value = rentalId;
    
    if (!rental.rentalTerms) {
        rental.rentalTerms = (state.factorySettings && state.factorySettings.rentalTerms) || "";
    }

    document.getElementById("contract-extra-day-fee").value = rental.extraDayFee !== undefined ? rental.extraDayFee.toFixed(2) : "0.00";
    document.getElementById("contract-norms").value = rental.rentalTerms;

    updateRentalContractPreview(rentalId);

    document.getElementById("modal-rental-contract").classList.add("active");

    const extraDayInput = document.getElementById("contract-extra-day-fee");
    const normsTextarea = document.getElementById("contract-norms");

    extraDayInput.oninput = null;
    normsTextarea.oninput = null;

    extraDayInput.oninput = () => {
        const val = parseFloat(extraDayInput.value) || 0;
        rental.extraDayFee = val;
        saveState();
        updateRentalContractPreview(rentalId);
        if (window.renderTinas) window.renderTinas();
    };

    normsTextarea.oninput = () => {
        rental.rentalTerms = normsTextarea.value;
        saveState();
        updateRentalContractPreview(rentalId);
    };
}

export function updateRentalContractPreview(rentalId) {
    const rental = (state.rentals || []).find(r => r.id === rentalId);
    if (!rental) return;

    const dataEntrega = rental.deliveryDate ? new Date(rental.deliveryDate + 'T00:00:00').toLocaleDateString('pt-BR') : '___/___/______';
    const dataPrevisaoRetirada = rental.expectedReturnDate ? new Date(rental.expectedReturnDate + 'T00:00:00').toLocaleDateString('pt-BR') : '___/___/______';
    const dataAtual = window.formatDateBrazil(window.getBrazilTimeISO());

    const matchingProd = (state.products || []).find(p => p.id === rental.itemType);
    const itemLabel = (matchingProd ? matchingProd.name : rental.itemType) + (rental.tinaColor ? ` (${rental.tinaColor})` : "");

    const totalGeral = rental.totalRevenue || (rental.rentalFee + (rental.deliveryFee || 0) + (rental.pickupFee || 0));

    const formattedTerms = (rental.rentalTerms || "")
        .replace(/\n/g, '<br>')
        .replace(/(?:\r\n|\r|\n)/g, '<br>');

    const logoSrc = state.factorySettings && state.factorySettings.logo ? state.factorySettings.logo : 'logo_vertical.png';

    let clientSignatureHTML = "";
    if (rental.signatureBase64) {
        clientSignatureHTML = `<img src="${rental.signatureBase64}" style="max-height: 55px; max-width: 100%; display: block; margin: 0 auto -10px auto; pointer-events: none;">`;
    }

    const contractHTML = `
        <div style="text-align: center; margin-bottom: 15px;">
            <img src="${logoSrc}" alt="Gelo do Vale" style="max-height: 80px; object-fit: contain;">
        </div>
        <h2 style="text-align: center; margin-bottom: 20px; font-weight: bold; border-bottom: 2px solid #000; padding-bottom: 5px; font-size: 1.15rem; color: #000;">CONTRATO DE LOCAÇÃO DE EQUIPAMENTO</h2>
        
        <div style="margin-bottom: 12px; font-size: 0.8rem; color: #000;">
            <p><strong>LOCADOR:</strong> ${FACTORY_INFO.name}, CNPJ nº ${FACTORY_INFO.cnpj}, endereço: ${FACTORY_INFO.address}.</p>
            <p><strong>LOCATÁRIO:</strong> ${rental.clientName.toUpperCase()}, endereço: ${rental.address || 'Não informado'}, telefone: ${rental.phone || 'Não informado'}.</p>
        </div>
        
        <p style="margin-top: 10px; font-weight: bold; font-size: 0.8rem; color: #000; border-bottom: 1px solid #ddd; padding-bottom: 3px;">1. OBJETO DA LOCAÇÃO</p>
        <p style="font-size: 0.8rem; color: #000;">O LOCADOR cede em locação ao LOCATÁRIO o seguinte equipamento:</p>
        <ul style="margin: 8px 0; padding-left: 20px; font-size: 0.8rem; color: #000; list-style-type: square;">
            <li><strong>Equipamento / Modelo:</strong> ${itemLabel}</li>
            <li><strong>Identificação (Serial/Código):</strong> ${rental.tinaCode}</li>
            <li><strong>Período de Locação:</strong> ${rental.rentalDays || 7} dias</li>
            <li><strong>Data de Entrega:</strong> ${dataEntrega}</li>
            <li><strong>Previsão de Retirada:</strong> ${dataPrevisaoRetirada}</li>
        </ul>
        
        <p style="margin-top: 10px; font-weight: bold; font-size: 0.8rem; color: #000; border-bottom: 1px solid #ddd; padding-bottom: 3px;">2. VALORES E CONDIÇÕES COMERCIAIS</p>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 8px 0; font-size: 0.8rem; color: #000;">
            <div><strong>Taxa de Locação:</strong> R$ ${rental.rentalFee.toFixed(2)}</div>
            <div><strong>Fretes (Entrega + Busca):</strong> R$ ${((rental.deliveryFee || 0) + (rental.pickupFee || 0)).toFixed(2)}</div>
            <div><strong>Diária Extra (Atraso):</strong> R$ ${(rental.extraDayFee || 0).toFixed(2)} / dia</div>
            <div><strong>Total Geral da Locação:</strong> R$ ${totalGeral.toFixed(2)}</div>
        </div>
        
        <p style="margin-top: 10px; font-weight: bold; font-size: 0.8rem; color: #000; border-bottom: 1px solid #ddd; padding-bottom: 3px;">3. NORMAS E CONDIÇÕES CONTRATUAIS</p>
        <div style="font-size: 0.8rem; color: #000; line-height: 1.4; text-align: justify; margin-bottom: 15px;">
            ${formattedTerms || 'Sem cláusulas declaradas.'}
        </div>
        
        <p style="margin-top: 20px; text-align: center; font-size: 0.8rem; color: #000;">Vale do Paraíba - SP, ${dataAtual}.</p>
        
        <div style="margin-top: 35px; display: flex; justify-content: space-between; font-size: 0.8rem; color: #000;">
            <div style="width: 45%; border-top: 1px solid #000; text-align: center; padding-top: 5px;">
                <p><strong>LOCADOR</strong></p>
                <p style="font-size: 0.75rem; color: #555;">${FACTORY_INFO.name}</p>
            </div>
            <div style="width: 45%; border-top: 1px solid #000; text-align: center; padding-top: 5px; position: relative;">
                ${clientSignatureHTML}
                <p><strong>LOCATÁRIO</strong></p>
                <p style="font-size: 0.75rem; color: #555;">${rental.clientName}</p>
            </div>
        </div>
    `;

    document.getElementById("rental-contract-preview").innerHTML = contractHTML;
}

export function printRentalContract() {
    const rentalId = document.getElementById("contract-rental-id").value;
    if (!rentalId) return;
    
    const content = document.getElementById("rental-contract-preview").innerHTML;
    const printWindow = window.open("", "_blank");
    
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Contrato de Locação - Gelo do Vale</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    line-height: 1.5;
                    padding: 40px;
                    color: #000;
                    background: #fff;
                    font-size: 12px;
                }
                h2 {
                    text-align: center;
                    margin-bottom: 25px;
                    font-size: 16px;
                    text-transform: uppercase;
                    border-bottom: 2px solid #000;
                    padding-bottom: 8px;
                }
                p, ul {
                    margin-bottom: 10px;
                    text-align: justify;
                }
                ul {
                    padding-left: 20px;
                }
                .signatures {
                    margin-top: 40px;
                    display: flex;
                    justify-content: space-between;
                }
                .sig-box {
                    width: 45%;
                    border-top: 1px solid #000;
                    text-align: center;
                    padding-top: 5px;
                }
                @media print {
                    .print-btn-container { display: none; }
                    body { padding: 0; }
                }
            </style>
        </head>
        <body>
            <div class="print-btn-container" style="text-align: right; margin-bottom: 20px;">
                <button onclick="window.print();" style="padding: 8px 16px; background: #0072ff; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">Imprimir Contrato</button>
            </div>
            ${content}
        </body>
        </html>
    `);
    
    printWindow.document.close();
}

export function deleteComodatoCategoryPhoto(comId, category, index) {
    window.showConfirm(
        "Tem certeza que deseja excluir esta foto?",
        () => {
            const comodato = (state.comodatos || []).find(c => c.id === comId);
            if (!comodato) return;
            
            if (category === 'local') {
                const localLen = (comodato.photosLocal || []).length;
                if (index < localLen) {
                    comodato.photosLocal.splice(index, 1);
                } else {
                    const legacyIndex = index - localLen;
                    if (comodato.photos && comodato.photos[legacyIndex] !== undefined) {
                        comodato.photos.splice(legacyIndex, 1);
                    }
                }
            } else {
                let arrName = "";
                if (category === 'qrcode') arrName = 'photosQRCode';
                else if (category === 'motor') arrName = 'photosMotor';
                else if (category === 'contract') arrName = 'photosContract';
                
                if (comodato[arrName] && comodato[arrName][index] !== undefined) {
                    comodato[arrName].splice(index, 1);
                }
            }
            
            saveState();
            renderComodatoDetail(comId);
            if (window.renderApp) window.renderApp();
            window.showToast("Foto excluída com sucesso!", "success");
        },
        null,
        "Excluir Foto",
        "Excluir"
    );
}

export function triggerComodatoPhotoUpload(category) {
    window.currentUploadCategory = category;
    const input = document.getElementById("comodato-photo-upload-input");
    if (input) {
        input.click();
    }
}

export function viewPhoto(photoBase64) {
    const viewWindow = window.open("", "_blank");
    if (!viewWindow) {
        window.showToast("Bloqueador de pop-ups ativo! Permita pop-ups para visualizar a foto.", "warning");
        return;
    }
    viewWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Visualizar Imagem - Gelo do Vale</title>
            <style>
                body {
                    margin: 0;
                    padding: 0;
                    background-color: #0b0f19;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                }
                .container {
                    position: relative;
                    max-width: 95vw;
                    max-height: 95vh;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.5), 0 0 15px rgba(0, 240, 255, 0.2);
                    border: 1px solid rgba(0, 240, 255, 0.3);
                    border-radius: 8px;
                    overflow: hidden;
                    background: #111827;
                }
                img {
                    display: block;
                    max-width: 100%;
                    max-height: 90vh;
                    object-fit: contain;
                }
                .close-btn {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    background: rgba(0, 0, 0, 0.7);
                    border: 1px solid rgba(0, 240, 255, 0.5);
                    color: #00f0ff;
                    border-radius: 50%;
                    width: 32px;
                    height: 32px;
                    font-size: 18px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                }
                .close-btn:hover {
                    background: #00f0ff;
                    color: #000;
                    box-shadow: 0 0 10px #00f0ff;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <button class="close-btn" onclick="window.close()">×</button>
                <img src="${photoBase64}">
            </div>
        </body>
        </html>
    `);
    viewWindow.document.close();
}

export function printPhoto(photoBase64) {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
        window.showToast("Bloqueador de pop-ups ativo! Permita pop-ups para imprimir a foto.", "warning");
        return;
    }
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Imprimir Imagem - Gelo do Vale</title>
            <style>
                body {
                    margin: 0;
                    padding: 0;
                    background: #fff;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                }
                img {
                    max-width: 100%;
                    max-height: 100vh;
                    object-fit: contain;
                }
                @media print {
                    body {
                        margin: 0;
                    }
                    img {
                        max-width: 100%;
                        max-height: 100vh;
                        page-break-inside: avoid;
                    }
                }
            </style>
        </head>
        <body>
            <img src="${photoBase64}" onload="window.print(); window.close();">
        </body>
        </html>
    `);
    printWindow.document.close();
}

// Expose functions to window
window.migrateLegacyComodatos = migrateLegacyComodatos;
window.renderComodatosAdmin = renderComodatosAdmin;
window.openNewComodatoModal = openNewComodatoModal;
window.saveNewComodato = saveNewComodato;
window.openComodatoDetail = openComodatoDetail;
window.renderComodatoDetail = renderComodatoDetail;
window.saveComodatoNotes = saveComodatoNotes;
window.uploadComodatoPhotos = uploadComodatoPhotos;
window.deleteComodatoPhoto = deleteComodatoPhoto;
window.executeComodatoReturn = executeComodatoReturn;
window.getComodatoPortalURL = getComodatoPortalURL;
window.sendComodatoWhatsAppLink = sendComodatoWhatsAppLink;
window.sendComodatoEmailLink = sendComodatoEmailLink;
window.initPortalSignatureCanvas = initPortalSignatureCanvas;
window.initClientSigningPortal = initClientSigningPortal;
window.renderPortalInterface = renderPortalInterface;
window.showPortalSuccess = showPortalSuccess;
window.showPortalError = showPortalError;
window.renderPortalContractTerms = renderPortalContractTerms;
window.openComodato = openComodato;
window.printComodato = printComodato;
window.openRentalContract = openRentalContract;
window.updateRentalContractPreview = updateRentalContractPreview;
window.printRentalContract = printRentalContract;
window.deleteComodatoCategoryPhoto = deleteComodatoCategoryPhoto;
window.triggerComodatoPhotoUpload = triggerComodatoPhotoUpload;
window.viewPhoto = viewPhoto;
window.printPhoto = printPhoto;
 
export function triggerComodatoSignatureForClient(clientId) {
    const comodato = (state.comodatos || []).find(c => c.clientId === clientId && c.status === 'pendente');
    if (!comodato) {
        window.showToast("Nenhum contrato de comodato pendente encontrado para este cliente.", "warning");
        return;
    }
    if (window.openSignatureModal) {
        window.openSignatureModal('comodato', comodato.id);
    }
}
window.triggerComodatoSignatureForClient = triggerComodatoSignatureForClient;

export function captureComodatoGPS() {
    const comId = window.currentComodatoId;
    const comodato = (state.comodatos || []).find(c => c.id === comId);
    if (!comodato) return;

    if (!navigator.geolocation) {
        window.showToast("Geolocalização não é suportada por este navegador.", "error");
        return;
    }

    window.showToast("Obtendo localização de alta precisão...", "info");

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude.toFixed(6);
            const lng = position.coords.longitude.toFixed(6);
            
            comodato.latitude = lat;
            comodato.longitude = lng;
            
            // Sincronizar com o cliente, caso ele não tenha coordenadas salvas
            const client = state.clients.find(c => c.id === comodato.clientId);
            if (client && (!client.latitude || !client.longitude)) {
                client.latitude = lat;
                client.longitude = lng;
            }

            saveState();
            window.showToast("Localização GPS do freezer registrada com sucesso!", "success");
            renderComodatoDetail(comId);
            if (window.renderApp) window.renderApp();
        },
        (error) => {
            let msg = "Erro ao capturar GPS.";
            if (error.code === error.PERMISSION_DENIED) msg = "Permissão para acessar GPS negada.";
            else if (error.code === error.POSITION_UNAVAILABLE) msg = "Sinal de GPS indisponível.";
            else if (error.code === error.TIMEOUT) msg = "Tempo limite atingido para obter sinal GPS.";
            window.showToast(msg, "error");
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
}
window.captureComodatoGPS = captureComodatoGPS;

export function deleteComodatoRecord(comId) {
    window.showConfirm(
        "Tem certeza que deseja excluir PERMANENTEMENTE este comodato? Esta ação não pode ser desfeita e removerá todo o histórico deste contrato.",
        () => {
            const index = (state.comodatos || []).findIndex(c => c.id === comId);
            if (index === -1) return;
            
            const comodato = state.comodatos[index];
            
            // Liberar o freezer se estiver vinculado a este comodato e ainda não tiver sido alocado em outro ativo
            const freezer = state.freezers ? state.freezers.find(f => f.code === comodato.freezerCode) : null;
            if (freezer && freezer.clientId === comodato.clientId) {
                freezer.status = 'disponivel';
                delete freezer.clientId;
                delete freezer.clientName;
                delete freezer.deliveryDate;
            }
            
            // Remover o vínculo do freezer no cliente
            const client = state.clients.find(c => c.id === comodato.clientId);
            if (client && client.freezerCode === comodato.freezerCode) {
                delete client.freezerCode;
                delete client.freezerBrand;
                delete client.freezerVoltage;
                delete client.freezerCapacity;
                delete client.deliveryDate;
            }
            
            // Remover o comodato do array
            state.comodatos.splice(index, 1);
            
            saveState();
            window.showToast("Comodato excluído com sucesso!", "success");
            if (window.closeModal) window.closeModal("modal-comodato-detail");
            if (window.renderApp) window.renderApp();
        },
        null,
        "Excluir Comodato",
        "Excluir"
    );
}
window.deleteComodatoRecord = deleteComodatoRecord;

export function toggleAddInspectionForm() {
    const form = document.getElementById("inline-inspection-form");
    if (!form) return;
    if (form.style.display === "none") {
        form.style.display = "block";
        const today = window.getBrazilTimeISO().split('T')[0];
        document.getElementById("ins-date").value = today;
        document.getElementById("ins-status").value = "excelente";
        document.getElementById("ins-notes").value = "";
    } else {
        form.style.display = "none";
    }
}
window.toggleAddInspectionForm = toggleAddInspectionForm;

export function saveComodatoInspection() {
    const comId = window.currentComodatoId;
    const comodato = (state.comodatos || []).find(c => c.id === comId);
    if (!comodato) return;

    const dateVal = document.getElementById("ins-date").value;
    const statusVal = document.getElementById("ins-status").value;
    const notesVal = document.getElementById("ins-notes").value.trim();

    if (!dateVal) {
        window.showToast("Por favor, preencha a data da vistoria.", "warning");
        return;
    }

    if (!comodato.inspections) {
        comodato.inspections = [];
    }

    comodato.inspections.push({
        date: dateVal,
        status: statusVal,
        notes: notesVal,
        checker: 'Operador'
    });

    saveState();
    window.showToast("Vistoria registrada com sucesso!", "success");
    
    const form = document.getElementById("inline-inspection-form");
    if (form) form.style.display = "none";

    renderComodatoDetail(comId);
}
window.saveComodatoInspection = saveComodatoInspection;

export function deleteComodatoInspection(comId, index) {
    window.showConfirm(
        "Tem certeza que deseja excluir esta vistoria?",
        () => {
            const comodato = (state.comodatos || []).find(c => c.id === comId);
            if (!comodato) return;

            if (comodato.inspections && comodato.inspections[index] !== undefined) {
                comodato.inspections.splice(index, 1);
                saveState();
                renderComodatoDetail(comId);
                window.showToast("Vistoria excluída com sucesso!", "success");
            }
        },
        null,
        "Excluir Vistoria",
        "Excluir"
    );
}
window.deleteComodatoInspection = deleteComodatoInspection;

export function openMigrateComodatoModal(comId) {
    const comodato = (state.comodatos || []).find(c => c.id === comId);
    if (!comodato) return;

    window.currentComodatoId = comId;

    document.getElementById("migrate-comodato-freezer-label").innerText = `${comodato.freezerCode} (${comodato.freezerBrand || 'Sem Marca'})`;
    document.getElementById("migrate-comodato-date").value = window.getBrazilTimeISO().split('T')[0];
    document.getElementById("migrate-comodato-notes").value = "";

    const clientSelect = document.getElementById("migrate-comodato-client-select");
    if (clientSelect) {
        clientSelect.innerHTML = '<option value="">-- Selecionar Cliente --</option>';
        
        const eligibleClients = (state.clients || []).filter(c => {
            if (c.id === comodato.clientId) return false;
            if (!c.document || !c.phone || !c.address || !c.latitude || !c.longitude) return false;
            return true;
        });

        if (eligibleClients.length === 0) {
            const opt = document.createElement("option");
            opt.value = "";
            opt.disabled = true;
            opt.innerText = "Nenhum cliente elegível com cadastro completo encontrado.";
            clientSelect.appendChild(opt);
        } else {
            eligibleClients.sort((a, b) => a.name.localeCompare(b.name));
            eligibleClients.forEach(c => {
                const opt = document.createElement("option");
                opt.value = c.id;
                opt.innerText = `${c.name} (${c.document})`;
                clientSelect.appendChild(opt);
            });
        }
    }

    if (window.closeModal) window.closeModal("modal-comodato-detail");
    document.getElementById("modal-migrate-comodato").classList.add("active");
}
window.openMigrateComodatoModal = openMigrateComodatoModal;

export function executeComodatoMigration() {
    const comId = window.currentComodatoId;
    const comodato = (state.comodatos || []).find(c => c.id === comId);
    if (!comodato) {
        window.showToast("Contrato de comodato original não encontrado.", "error");
        return;
    }

    const newClientId = document.getElementById("migrate-comodato-client-select").value;
    const transferDate = document.getElementById("migrate-comodato-date").value;
    const migrationNotes = document.getElementById("migrate-comodato-notes").value.trim();

    if (!newClientId) {
        window.showToast("Por favor, selecione o novo proprietário.", "warning");
        return;
    }
    if (!transferDate) {
        window.showToast("Por favor, selecione a data da transferência.", "warning");
        return;
    }

    const newClient = state.clients.find(c => c.id === newClientId);
    if (!newClient) {
        window.showToast("Novo proprietário selecionado é inválido.", "error");
        return;
    }

    if (!newClient.document || !newClient.phone || !newClient.address || !newClient.latitude || !newClient.longitude) {
        window.showToast("O novo proprietário não possui os dados obrigatórios para Comodato (CNPJ/CPF, Telefone, Endereço ou GPS). Complete-os no cadastro antes de migrar.", "warning");
        return;
    }

    window.showConfirm(
        `Confirmar a migração do freezer ${comodato.freezerCode} para o cliente ${newClient.name}? O comodato atual será finalizado e um novo contrato pendente de assinatura será criado.`,
        () => {
            const oldClientName = comodato.clientName || 'Cliente Anterior';
            comodato.status = 'retirado';
            comodato.returnDate = transferDate;
            comodato.returnNotes = `Migração de Proprietário: Equipamento transferido para o cliente ${newClient.name} (CNPJ/CPF: ${newClient.document}) em ${new Date(transferDate + 'T00:00:00').toLocaleDateString('pt-BR')}. Obs: ${migrationNotes}`;

            const newCom = {
                id: 'com_' + Math.random().toString(36).substr(2, 9),
                clientId: newClient.id,
                clientName: newClient.name,
                clientPhone: newClient.phone || '',
                clientAddress: newClient.address || '',
                clientDoc: newClient.document || '',
                latitude: newClient.latitude || comodato.latitude,
                longitude: newClient.longitude || comodato.longitude,
                freezerCode: comodato.freezerCode,
                freezerBrand: comodato.freezerBrand || 'Não informado',
                freezerVoltage: comodato.freezerVoltage || 'Não informado',
                freezerCapacity: comodato.freezerCapacity || '',
                startDate: transferDate,
                status: 'pendente',
                signatureBase64: '',
                signatureDate: '',
                notes: `Migrado a partir do contrato antigo de ${oldClientName}. Obs: ${migrationNotes}`,
                photos: comodato.photos || [],
                photosLocal: comodato.photosLocal || [],
                photosQRCode: comodato.photosQRCode || [],
                photosMotor: comodato.photosMotor || [],
                photosContract: comodato.photosContract || [],
                createdAt: Date.now()
            };

            if (!state.comodatos) state.comodatos = [];
            state.comodatos.push(newCom);

            const freezer = state.freezers ? state.freezers.find(f => f.code === comodato.freezerCode) : null;
            if (freezer) {
                freezer.status = 'alocado';
                freezer.clientId = newClient.id;
                freezer.clientName = newClient.name;
                freezer.deliveryDate = transferDate;
                freezer.maintenanceNotes = `Migrado do cliente ${oldClientName}. Obs: ${migrationNotes}`;
            }

            const oldClient = state.clients.find(c => c.id === comodato.clientId);
            if (oldClient) {
                delete oldClient.freezerCode;
                delete oldClient.freezerBrand;
                delete oldClient.freezerVoltage;
                delete oldClient.freezerCapacity;
                delete oldClient.deliveryDate;
            }

            newClient.freezerCode = comodato.freezerCode;
            newClient.freezerBrand = comodato.freezerBrand || 'Não informado';
            newClient.freezerVoltage = comodato.freezerVoltage || 'Não informado';
            newClient.freezerCapacity = comodato.freezerCapacity || '';
            newClient.deliveryDate = transferDate;
            newClient.maintenanceNotes = `Migrado do cliente ${oldClientName}. Obs: ${migrationNotes}`;

            saveState();
            
            window.showToast("Migração concluída com sucesso! Novo comodato gerado como pendente de assinatura.", "success");
            if (window.closeModal) window.closeModal("modal-migrate-comodato");
            if (window.renderApp) window.renderApp();
        },
        null,
        "Confirmar Migração",
        "Confirmar"
    );
}
window.executeComodatoMigration = executeComodatoMigration;
