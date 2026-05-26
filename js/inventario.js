// --- TELA: INVENTÁRIO DE EQUIPAMENTOS ---
import { state, saveState, FACTORY_INFO } from './state.js';
import { populateClientDropdowns } from './clientes.js';
import { openRentalModal } from './rentals.js';

let html5QrCode = null;

export function renderInventario() {
    const freezerGrid = document.getElementById("freezer-grid-container");
    if (!freezerGrid) return;
    freezerGrid.innerHTML = "";
    
    const searchQuery = document.getElementById("search-freezer").value.toLowerCase().trim();
    const filterStatus = document.getElementById("filter-freezer-status").value;
    
    // Filtrar freezers
    const filteredFreezers = state.freezers.filter(f => {
        const matchesSearch = f.code.toLowerCase().includes(searchQuery) ||
                              f.brand.toLowerCase().includes(searchQuery) ||
                              (f.clientName && f.clientName.toLowerCase().includes(searchQuery));
                              
        const matchesStatus = !filterStatus || f.status === filterStatus;
        
        return matchesSearch && matchesStatus;
    });
    
    if (filteredFreezers.length === 0) {
        freezerGrid.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <i data-lucide="package" style="width: 48px; height: 48px;"></i>
                <p>Nenhum equipamento encontrado com os filtros aplicados.</p>
                <button class="btn btn-primary" style="margin-top: 1rem;" onclick="openFreezerModal()">
                    <i data-lucide="plus"></i> Cadastrar Novo Freezer
                </button>
            </div>
        `;
        if (window.lucide) lucide.createIcons();
        return;
    }
    
    filteredFreezers.forEach(f => {
        const warranty = getWarrantyInfo(f.purchaseDate, f.warrantyMonths);
        const warrantyBadgeHTML = `<span class="warranty-badge ${warranty.class}">${warranty.text}</span>`;
        
        let statusBadge = '';
        if (f.status === 'disponivel') {
            statusBadge = '<span class="status-badge completed" style="background: rgba(16,185,129,0.15); color: #10b981;">Disponível</span>';
        } else if (f.status === 'alocado') {
            statusBadge = '<span class="status-badge pending" style="background: rgba(0,114,255,0.15); color: var(--color-primary);">Alocado</span>';
        } else if (f.status === 'manutencao') {
            statusBadge = '<span class="status-badge pending" style="background: rgba(245,158,11,0.15); color: #f59e0b;">Em Manutenção</span>';
        } else if (f.status === 'inativo') {
            statusBadge = '<span class="status-badge expired" style="background: rgba(239,68,68,0.15); color: var(--color-danger);">Inativo</span>';
        }
        
        let locationHTML = '';
        if (f.status === 'alocado') {
            locationHTML = `<div style="margin-bottom: 0.5rem;"><i data-lucide="map-pin" style="width: 14px; height: 14px; display: inline; vertical-align: middle; margin-right: 4px;"></i> Alocado em: <strong>${f.clientName}</strong></div>`;
        } else if (f.status === 'disponivel') {
            locationHTML = `<div style="margin-bottom: 0.5rem; color: #10b981;"><i data-lucide="home" style="width: 14px; height: 14px; display: inline; vertical-align: middle; margin-right: 4px;"></i> Local: Fábrica (Disponível)</div>`;
        } else if (f.status === 'manutencao') {
            locationHTML = `<div style="margin-bottom: 0.5rem; color: #f59e0b;"><i data-lucide="wrench" style="width: 14px; height: 14px; display: inline; vertical-align: middle; margin-right: 4px;"></i> Local: Oficina / Assistência</div>`;
        } else {
            locationHTML = `<div style="margin-bottom: 0.5rem; color: var(--color-danger);"><i data-lucide="slash" style="width: 14px; height: 14px; display: inline; vertical-align: middle; margin-right: 4px;"></i> Equipamento Desativado</div>`;
        }
        
        let imageSnippet = '';
        if (f.photoFreezer) {
            imageSnippet = `<div class="freezer-img-thumbnail" style="background-image: url('${f.photoFreezer}')"></div>`;
        } else {
            imageSnippet = `<div class="freezer-img-thumbnail-placeholder"><i data-lucide="image" style="width: 24px; height: 24px; opacity: 0.3;"></i></div>`;
        }
        
        freezerGrid.innerHTML += `
            <div class="freezer-card">
                <div class="freezer-card-header">
                    <div style="display: flex; gap: 10px; align-items: center;">
                        ${imageSnippet}
                        <div>
                            <h3 style="font-size: 1rem; font-weight: 700; margin: 0; color: #fff;">${f.code}</h3>
                            <p style="font-size: 0.75rem; color: var(--color-text-muted); margin: 2px 0 0 0;">${f.brand}</p>
                        </div>
                    </div>
                    ${statusBadge}
                </div>
                <div class="freezer-card-body" style="padding: 1rem; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 0.8rem; display: flex; flex-direction: column; gap: 6px;">
                    <div style="display: flex; justify-content: space-between;">
                        <span>Voltagem: <strong>${f.voltage || 'Bivolt'}</strong></span>
                        <span>Capacidade: <strong>${f.capacity ? f.capacity + ' L' : 'Não inf.'}</strong></span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span>Aquisição: <strong>${f.purchaseDate ? new Date(f.purchaseDate + 'T00:00:00').toLocaleDateString('pt-BR') : 'Não informada'}</strong></span>
                    </div>
                    ${warrantyBadgeHTML}
                    <div style="border-top: 1px solid rgba(255,255,255,0.05); margin-top: 6px; padding-top: 8px;">
                        ${locationHTML}
                    </div>
                </div>
                <div class="freezer-card-actions" style="padding: 0.75rem 1rem; display: flex; justify-content: flex-end; gap: 8px; background: rgba(0,0,0,0.1);">
                    <button class="btn btn-secondary" onclick="openFreezerDetail('${f.id}')" style="margin-right: auto; padding: 4px 8px; font-size: 0.75rem; display: inline-flex; align-items: center; gap: 4px; background: rgba(255,255,255,0.03);">
                        <i data-lucide="eye" style="width: 14px; height: 14px;"></i> Detalhes
                    </button>
                    <button class="btn btn-secondary btn-icon-only" onclick="openFreezerModal('${f.id}')" title="Editar Freezer">
                        <i data-lucide="edit-3" style="width: 15px; height: 15px;"></i>
                    </button>
                    <button class="btn btn-danger btn-icon-only" onclick="deleteFreezer('${f.id}')" title="Remover Freezer">
                        <i data-lucide="trash-2" style="width: 15px; height: 15px;"></i>
                    </button>
                </div>
            </div>
        `;
    });
    
    if (window.lucide) lucide.createIcons();
}

export function openFreezerModal(freezerId = null) {
    const modal = document.getElementById("modal-freezer");
    const form = document.getElementById("freezer-form");
    const title = document.getElementById("freezer-modal-title");
    if (!modal || !form) return;
    
    form.reset();
    document.getElementById("form-freezer-id").value = "";
    document.getElementById("photo-freezer-data").value = "";
    document.getElementById("photo-invoice-data").value = "";
    document.getElementById("photo-establishment-data").value = "";
    document.getElementById("preview-freezer").innerHTML = "<p style='font-size: 0.75rem; color: var(--color-text-muted);'>Nenhuma foto carregada</p>";
    document.getElementById("preview-invoice").innerHTML = "<p style='font-size: 0.75rem; color: var(--color-text-muted);'>Nenhuma nota carregada</p>";
    document.getElementById("preview-establishment").innerHTML = "<p style='font-size: 0.75rem; color: var(--color-text-muted);'>Nenhuma foto carregada</p>";
    
    const statusFieldContainer = document.getElementById("freezer-status-container");
    if (statusFieldContainer) {
        if (freezerId) {
            statusFieldContainer.style.display = "block";
        } else {
            statusFieldContainer.style.display = "none";
        }
    }
    
    if (freezerId) {
        title.innerText = "Editar Freezer";
        const f = state.freezers.find(item => item.id === freezerId);
        if (f) {
            document.getElementById("form-freezer-id").value = f.id;
            document.getElementById("freezer-code-input").value = f.code;
            document.getElementById("freezer-brand-input").value = f.brand;
            document.getElementById("freezer-voltage-select").value = f.voltage;
            document.getElementById("freezer-capacity-input").value = f.capacity || "";
            document.getElementById("freezer-purchase-date").value = f.purchaseDate || "";
            document.getElementById("freezer-warranty").value = f.warrantyMonths || 12;
            document.getElementById("freezer-status-select").value = f.status;
            
            if (f.photoFreezer) {
                document.getElementById("photo-freezer-data").value = f.photoFreezer;
                document.getElementById("preview-freezer").innerHTML = `<img src="${f.photoFreezer}" style="max-height: 80px; border-radius: 4px;">`;
            }
            if (f.photoInvoice) {
                document.getElementById("photo-invoice-data").value = f.photoInvoice;
                document.getElementById("preview-invoice").innerHTML = `<img src="${f.photoInvoice}" style="max-height: 80px; border-radius: 4px;">`;
            }
            if (f.photoEstablishment) {
                document.getElementById("photo-establishment-data").value = f.photoEstablishment;
                document.getElementById("preview-establishment").innerHTML = `<img src="${f.photoEstablishment}" style="max-height: 80px; border-radius: 4px;">`;
            }
        }
    } else {
        title.innerText = "Novo Equipamento";
    }
    
    modal.classList.add("active");
}

export function deleteFreezer(freezerId) {
    const f = state.freezers.find(item => item.id === freezerId);
    if (!f) return;
    
    if (f.status === 'alocado') {
        alert(`O freezer ${f.code} está alocado ao cliente "${f.clientName}". Desvincule-o no cadastro do cliente antes de remover do inventário!`);
        return;
    }
    
    if (confirm(`Deseja realmente excluir o freezer ${f.code} do inventário? Esta ação é irreversível.`)) {
        state.freezers = state.freezers.filter(item => item.id !== freezerId);
        saveState();
        if (window.renderApp) window.renderApp();
    }
}

export function openFreezerDetail(freezerId) {
    const freezer = state.freezers.find(f => f.id === freezerId);
    if (!freezer) return;
    
    document.getElementById("detail-code").innerText = freezer.code;
    document.getElementById("detail-brand").innerText = freezer.brand;
    document.getElementById("detail-voltage").innerText = freezer.voltage || 'Não informado';
    document.getElementById("detail-capacity").innerText = freezer.capacity ? `${freezer.capacity} Litros` : 'Não informada';
    document.getElementById("detail-purchase-date").innerText = freezer.purchaseDate ? new Date(freezer.purchaseDate + 'T00:00:00').toLocaleDateString('pt-BR') : 'Não informada';
    document.getElementById("detail-warranty").innerText = freezer.warrantyMonths ? `${freezer.warrantyMonths} meses` : 'Sem garantia';
    
    const warranty = getWarrantyInfo(freezer.purchaseDate, freezer.warrantyMonths);
    const detailWarrantyBadge = document.getElementById("detail-warranty-badge");
    if (detailWarrantyBadge) {
        detailWarrantyBadge.innerText = warranty.text;
        detailWarrantyBadge.className = `warranty-badge ${warranty.class}`;
    }
    
    document.getElementById("btn-transferir-freezer").onclick = () => openMoveFreezerModal(freezer.id);
    document.getElementById("btn-gerar-etiqueta").onclick = () => openStickerModal(freezer.id);
    const noteIdEl = document.getElementById("note-freezer-id");
    if (noteIdEl) noteIdEl.value = freezer.id;
    
    let statusText = '';
    if (freezer.status === 'disponivel') statusText = '📍 Fábrica (Disponível)';
    else if (freezer.status === 'alocado') statusText = `🏪 Alocado em: <strong>${freezer.clientName}</strong>`;
    else if (freezer.status === 'manutencao') statusText = '🔧 Oficina / Em Manutenção';
    else statusText = '❌ Inativo';
    document.getElementById("detail-location").innerHTML = statusText;
    
    const photoSection = document.getElementById("detail-photos-gallery");
    if (photoSection) {
        photoSection.innerHTML = "";
        
        if (freezer.photoFreezer) {
            photoSection.innerHTML += `
                <div style="flex: 1; min-width: 120px;">
                    <span style="font-size: 0.7rem; color: var(--color-text-muted); display: block; margin-bottom: 4px;">Foto do Freezer</span>
                    <img src="${freezer.photoFreezer}" style="width: 100%; border-radius: 6px; border: 1px solid rgba(255,255,255,0.05); cursor: pointer;" onclick="window.open('${freezer.photoFreezer}', '_blank')">
                </div>
            `;
        }
        if (freezer.photoInvoice) {
            photoSection.innerHTML += `
                <div style="flex: 1; min-width: 120px;">
                    <span style="font-size: 0.7rem; color: var(--color-text-muted); display: block; margin-bottom: 4px;">Nota Fiscal / Documento</span>
                    <img src="${freezer.photoInvoice}" style="width: 100%; border-radius: 6px; border: 1px solid rgba(255,255,255,0.05); cursor: pointer;" onclick="window.open('${freezer.photoInvoice}', '_blank')">
                </div>
            `;
        }
        if (freezer.photoEstablishment) {
            photoSection.innerHTML += `
                <div style="flex: 1; min-width: 120px;">
                    <span style="font-size: 0.7rem; color: var(--color-text-muted); display: block; margin-bottom: 4px;">Foto do Local</span>
                    <img src="${freezer.photoEstablishment}" style="width: 100%; border-radius: 6px; border: 1px solid rgba(255,255,255,0.05); cursor: pointer;" onclick="window.open('${freezer.photoEstablishment}', '_blank')">
                </div>
            `;
        }
        if (!freezer.photoFreezer && !freezer.photoInvoice && !freezer.photoEstablishment) {
            photoSection.innerHTML = "<p style='font-size: 0.8rem; color: var(--color-text-muted); width: 100%; text-align: center; padding: 1rem;'>Nenhuma foto anexada a este freezer.</p>";
        }
    }
    
    const timeline = document.getElementById("movement-timeline");
    if (timeline) {
        timeline.innerHTML = "";
        if (freezer.movementHistory && freezer.movementHistory.length > 0) {
            const sortedHistory = [...freezer.movementHistory].reverse();
            sortedHistory.forEach(log => {
                timeline.innerHTML += `
                    <div class="timeline-item">
                        <div class="timeline-date">${log.date}</div>
                        <div class="timeline-content">
                            <strong>De:</strong> ${log.from} &rarr; <strong>Para:</strong> ${log.to}
                            <div style="color: var(--color-text-muted); font-size: 0.75rem; margin-top: 2px;">${log.reason}</div>
                        </div>
                    </div>
                `;
            });
        } else {
            timeline.innerHTML = "<p style='font-size: 0.8rem; color: var(--color-text-muted); padding: 0.5rem;'>Sem histórico registrado.</p>";
        }
    }
    
    const maintenanceList = document.getElementById("maintenance-notes-list");
    if (maintenanceList) {
        maintenanceList.innerHTML = "";
        if (freezer.maintenanceLogs && freezer.maintenanceLogs.length > 0) {
            const sortedLogs = [...freezer.maintenanceLogs].reverse();
            sortedLogs.forEach(log => {
                if (log.type) {
                    maintenanceList.innerHTML += `
                        <div style="padding: 10px; background: rgba(255,255,255,0.02); border-radius: 6px; border-left: 4px solid var(--color-primary); font-size: 0.8rem; margin-bottom: 8px; border: 1px solid rgba(255,255,255,0.05); border-left-color: var(--color-primary);">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 4px;">
                                <span style="font-weight: bold; color: var(--color-primary);">${log.type}</span>
                                <span style="font-size: 0.7rem; color: var(--color-text-muted);">${log.date}</span>
                            </div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin-bottom: 6px; font-size: 0.75rem; color: var(--color-text-muted);">
                                <div><strong>Técnico:</strong> ${log.technician || 'N/A'}</div>
                                <div style="text-align: right;"><strong>Custo:</strong> R$ ${(parseFloat(log.cost) || 0).toFixed(2).replace(".", ",")}</div>
                            </div>
                            <div style="font-size: 0.8rem; line-height: 1.3; margin-bottom: 4px; color: #fff;">${log.note}</div>
                            ${log.nextDate ? `
                            <div style="font-size: 0.75rem; margin-top: 6px; padding-top: 4px; border-top: 1px dashed rgba(255,255,255,0.05); color: #ffb703; display: flex; align-items: center; gap: 4px;">
                                <i data-lucide="calendar" style="width: 12px; height: 12px;"></i>
                                <span>Próxima manutenção: ${new Date(log.nextDate + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                            </div>
                            ` : ''}
                        </div>
                    `;
                } else {
                    maintenanceList.innerHTML += `
                        <div style="padding: 10px; background: rgba(255,255,255,0.02); border-radius: 6px; border-left: 4px solid var(--color-primary); font-size: 0.8rem; margin-bottom: 8px; border: 1px solid rgba(255,255,255,0.05); border-left-color: var(--color-primary);">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 0.7rem; color: var(--color-text-muted);">
                                <span>Log de Manutenção:</span>
                                <span>${log.date}</span>
                            </div>
                            <div style="color: #fff;">${log.note}</div>
                        </div>
                    `;
                }
            });
        } else {
            maintenanceList.innerHTML = "<p style='font-size: 0.8rem; color: var(--color-text-muted); padding: 0.5rem;'>Nenhuma manutenção registrada.</p>";
        }
    }
    
    if (window.lucide) lucide.createIcons();
    const modal = document.getElementById("modal-freezer-detail");
    if (modal) modal.classList.add("active");
}

export function openMoveFreezerModal(freezerId) {
    const freezer = state.freezers.find(f => f.id === freezerId);
    if (!freezer) return;
    
    document.getElementById("move-freezer-id").value = freezer.id;
    document.getElementById("move-freezer-code").value = freezer.code;
    document.getElementById("move-destiny").value = "";
    document.getElementById("move-reason").value = "";
    
    populateClientDropdowns();
    toggleMoveClientSelect();
    
    const modal = document.getElementById("modal-move-freezer");
    if (modal) modal.classList.add("active");
}

export function toggleMoveClientSelect() {
    const destiny = document.getElementById("move-destiny").value;
    const clientSelectContainer = document.getElementById("move-client-container");
    if (!clientSelectContainer) return;
    if (destiny === "cliente") {
        clientSelectContainer.style.display = "block";
    } else {
        clientSelectContainer.style.display = "none";
    }
}

export function openStickerModal(freezerId) {
    const freezer = state.freezers.find(f => f.id === freezerId);
    if (!freezer) return;
    
    const printableContent = document.getElementById("printable-sticker-content");
    if (!printableContent) return;
    printableContent.innerHTML = `
        <div class="sticker-header">
            <span class="sticker-logo-text">❄️ Gelo do Vale</span>
            <span style="font-size: 0.75rem; font-weight: bold; border: 1px solid #000; padding: 2px 5px; border-radius: 3px; background: #fff; color: #000;">${freezer.voltage || 'BIVOLT'}</span>
        </div>
        <div class="sticker-body" style="display: flex; justify-content: space-between; align-items: center; gap: 15px; margin-top: 8px;">
            <div class="sticker-specs" style="font-size: 0.75rem; line-height: 1.4; color: #000; text-align: left;">
                <div style="font-size: 1rem; font-weight: 900; margin-bottom: 4px; color: #000;">CÓD: ${freezer.code}</div>
                <div><strong>Equipamento:</strong> ${freezer.brand || 'Freezer'}</div>
                <div><strong>Propriedade de:</strong> Gelo do Vale</div>
                <div style="font-size: 0.55rem; font-weight: bold; margin-top: 5px; color: #ef4444; border: 1px dashed #ef4444; padding: 1px 3px; display: inline-block;">⚠️ Cuidado com a voltagem!</div>
            </div>
            <div class="sticker-qrcode" id="sticker-qrcode-render" style="padding: 4px; background: #fff; border: 1px solid #000; display: flex; align-items: center; justify-content: center;"></div>
        </div>
        <div class="sticker-footer" style="margin-top: 8px; border-top: 1px solid #000; padding-top: 4px; font-size: 0.6rem; font-weight: bold; text-align: center; color: #000;">
            SUPORTE OU ASSISTÊNCIA TÉCNICA: ${FACTORY_INFO.phone}
        </div>
    `;
    
    setTimeout(() => {
        const qrContainer = document.getElementById("sticker-qrcode-render");
        if (qrContainer) {
            qrContainer.innerHTML = "";
            new QRCode(qrContainer, {
                text: freezer.code,
                width: 80,
                height: 80,
                colorDark : "#000000",
                colorLight : "#ffffff",
                correctLevel : QRCode.CorrectLevel.H
            });
        }
    }, 100);
    
    const modal = document.getElementById("modal-sticker");
    if (modal) modal.classList.add("active");
}

export function openRentalStickerModal(rentalId) {
    const rental = state.rentals.find(r => r.id === rentalId);
    if (!rental) return;
    
    const itemLabel = rental.itemType === "mesa_cadeiras" ? "Conjunto Mesa + 4 Cadeiras" : `Tina 360L (${rental.tinaColor || "Azul"})`;
    
    const printableContent = document.getElementById("printable-sticker-content");
    if (!printableContent) return;
    printableContent.innerHTML = `
        <div class="sticker-header">
            <span class="sticker-logo-text">❄️ Gelo do Vale</span>
            <span style="font-size: 0.75rem; font-weight: bold; border: 1px solid #000; padding: 2px 5px; border-radius: 3px; background: #fff; color: #000;">ALUGUEL</span>
        </div>
        <div class="sticker-body" style="display: flex; justify-content: space-between; align-items: center; gap: 15px; margin-top: 8px;">
            <div class="sticker-specs" style="font-size: 0.75rem; line-height: 1.4; color: #000; text-align: left;">
                <div style="font-size: 1rem; font-weight: 900; margin-bottom: 4px; color: #000;">CÓD: ${rental.tinaCode}</div>
                <div><strong>Equipamento:</strong> ${itemLabel}</div>
                <div><strong>Cliente:</strong> ${rental.clientName}</div>
                <div><strong>Devolução:</strong> ${new Date(rental.expectedReturnDate + 'T00:00:00').toLocaleDateString('pt-BR')}</div>
                <div style="font-size: 0.55rem; font-weight: bold; margin-top: 5px; color: #0072ff; border: 1px dashed #0072ff; padding: 1px 3px; display: inline-block;">Propriedade de Gelo do Vale</div>
            </div>
            <div class="sticker-qrcode" id="sticker-qrcode-render" style="padding: 4px; background: #fff; border: 1px solid #000; display: flex; align-items: center; justify-content: center;"></div>
        </div>
        <div class="sticker-footer" style="margin-top: 8px; border-top: 1px solid #000; padding-top: 4px; font-size: 0.6rem; font-weight: bold; text-align: center; color: #000;">
            CONTATO / SUPORTE: ${FACTORY_INFO.phone}
        </div>
    `;
    
    setTimeout(() => {
        const qrContainer = document.getElementById("sticker-qrcode-render");
        if (qrContainer) {
            qrContainer.innerHTML = "";
            new QRCode(qrContainer, {
                text: rental.tinaCode,
                width: 80,
                height: 80,
                colorDark : "#000000",
                colorLight : "#ffffff",
                correctLevel : QRCode.CorrectLevel.H
            });
        }
    }, 100);
    
    const modal = document.getElementById("modal-sticker");
    if (modal) modal.classList.add("active");
}

export function printSticker() {
    const content = document.getElementById("printable-sticker-content").innerHTML;
    const printWindow = window.open("", "_blank");
    
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Etiqueta Patrimonial - Gelo do Vale</title>
            <style>
                body {
                    margin: 0;
                    padding: 20px;
                    background: #fff;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
                .sticker-card-print {
                    width: 320px;
                    border: 2px solid #000;
                    border-radius: 8px;
                    padding: 15px;
                    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                    background: #fff;
                    color: #000;
                    box-sizing: border-box;
                }
                .sticker-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 2px solid #000;
                    padding-bottom: 6px;
                }
                .sticker-logo-text {
                    font-size: 1.1rem;
                    font-weight: 900;
                }
                .sticker-qrcode img {
                    display: block;
                }
                @media print {
                    .print-btn-container { display: none; }
                }
            </style>
        </head>
        <body>
            <div style="text-align: center; width: 100%;">
                <div class="print-btn-container" style="margin-bottom: 20px;">
                    <button onclick="window.print();" style="padding: 10px 20px; font-size: 14px; font-weight: bold; background: #0072ff; color: #fff; border: none; border-radius: 4px; cursor: pointer;">Imprimir Etiqueta</button>
                </div>
                <div style="display: inline-block;">
                    <div class="sticker-card-print">
                        ${content}
                    </div>
                </div>
            </div>
        </body>
        </html>
    `);
    
    printWindow.document.close();
}

export function getWarrantyInfo(purchaseDateStr, months) {
    if (!purchaseDateStr || !months) {
        return { text: "Sem garantia cadastrada", active: false, class: "expired" };
    }
    const purchaseDate = new Date(purchaseDateStr + 'T00:00:00');
    const expiryDate = new Date(purchaseDate);
    expiryDate.setMonth(purchaseDate.getMonth() + parseInt(months));
    const today = new Date();
    
    if (today < expiryDate) {
        const diffTime = Math.abs(expiryDate - today);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const monthsLeft = Math.ceil(diffDays / 30.4);
        return { text: `Em Garantia (~${monthsLeft} meses rest.)`, active: true, class: "active" };
    } else {
        return { text: "Garantia Expirada", active: false, class: "expired" };
    }
}

export function handleImageUpload(inputEl, previewId) {
    const file = inputEl.files[0];
    if (!file) return;
    
    const previewContainer = document.getElementById(previewId);
    if (!previewContainer) return;
    previewContainer.innerHTML = `<div style="font-size: 0.75rem; color: var(--color-primary); padding: 5px;">Carregando e otimizando...</div>`;
    
    const reader = new FileReader();
    reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement("canvas");
            const maxDimension = 320;
            let width = img.width;
            let height = img.height;
            
            if (width > height) {
                if (width > maxDimension) {
                    height = Math.round((height * maxDimension) / width);
                    width = maxDimension;
                }
            } else {
                if (height > maxDimension) {
                    width = Math.round((width * maxDimension) / height);
                    height = maxDimension;
                }
            }
            
            canvas.width = width;
            canvas.height = height;
            
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, width, height);
            
            const compressedBase64 = canvas.toDataURL("image/jpeg", 0.6);
            
            if (previewId === "preview-freezer") {
                document.getElementById("photo-freezer-data").value = compressedBase64;
            } else if (previewId === "preview-invoice") {
                document.getElementById("photo-invoice-data").value = compressedBase64;
            } else if (previewId === "preview-establishment") {
                document.getElementById("photo-establishment-data").value = compressedBase64;
            } else if (previewId === "preview-rental-location") {
                document.getElementById("photo-rental-location-data").value = compressedBase64;
            }
            
            previewContainer.innerHTML = `<img src="${compressedBase64}" style="max-height: 80px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.1);">`;
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

export function startQRScanner() {
    const container = document.getElementById("qr-reader-container");
    if (!container) return;
    container.innerHTML = "";
    
    const modal = document.getElementById("modal-scanner");
    if (modal) modal.classList.add("active");
    
    setTimeout(() => {
        html5QrCode = new Html5Qrcode("qr-reader-container");
        html5QrCode.start(
            { facingMode: "environment" },
            {
                fps: 10,
                qrbox: { width: 200, height: 200 }
            },
            (decodedText, decodedResult) => {
                console.log("QR Code detectado:", decodedText);
                stopQRScanner();
                if (window.closeModal) window.closeModal('modal-scanner');
                
                const codeScanned = decodedText.trim().toUpperCase();
                const freezer = state.freezers.find(f => f.code && f.code.trim().toUpperCase() === codeScanned);
                const rental = state.rentals.find(r => r.tinaCode && r.tinaCode.trim().toUpperCase() === codeScanned);
                
                if (freezer) {
                    openFreezerDetail(freezer.id);
                } else if (rental) {
                    openRentalModal(rental.id);
                } else {
                    alert(`Código Detectado: "${decodedText}". Equipamento ou Tina não cadastrados no sistema.`);
                }
            },
            (errorMessage) => {
                // Ignore scanning errors
            }
        ).catch(err => {
            console.error("Erro ao abrir câmera:", err);
            alert("Não foi possível acessar a câmera traseira. Certifique-se de dar permissões de câmera ao seu navegador.");
            if (window.closeModal) window.closeModal('modal-scanner');
        });
    }, 200);
}

export function stopQRScanner() {
    if (html5QrCode) {
        html5QrCode.stop().then(() => {
            html5QrCode = null;
        }).catch(err => {
            console.error("Erro ao parar scanner:", err);
            html5QrCode = null;
        });
    }
}

export function closeQRScannerModal() {
    stopQRScanner();
    if (window.closeModal) window.closeModal('modal-scanner');
}

export function populateFreezerDropdowns() {
    // Dropdown atualizado dinamicamente via HTML
}

export function autoPopulateFreezerDetailsInClientForm() {
    const freezerId = document.getElementById("client-freezer-id-select").value;
    const freezer = state.freezers.find(f => f.id === freezerId);
    
    if (freezer) {
        document.getElementById("freezer-code").value = freezer.code;
        document.getElementById("freezer-brand").value = freezer.brand;
        document.getElementById("freezer-voltage").value = freezer.voltage;
        document.getElementById("freezer-capacity").value = freezer.capacity ? freezer.capacity + " Litros" : "Não informada";
        
        if (freezer.maintenanceLogs && freezer.maintenanceLogs.length > 0) {
            document.getElementById("freezer-maintenance").value = freezer.maintenanceLogs[freezer.maintenanceLogs.length - 1].note;
        } else {
            document.getElementById("freezer-maintenance").value = "";
        }
    } else {
        document.getElementById("freezer-code").value = "";
        document.getElementById("freezer-brand").value = "";
        document.getElementById("freezer-voltage").value = "";
        document.getElementById("freezer-capacity").value = "";
        document.getElementById("freezer-maintenance").value = "";
    }
}

// Bind to window for HTML accessibility
window.renderInventario = renderInventario;
window.openFreezerModal = openFreezerModal;
window.deleteFreezer = deleteFreezer;
window.openFreezerDetail = openFreezerDetail;
window.openMoveFreezerModal = openMoveFreezerModal;
window.toggleMoveClientSelect = toggleMoveClientSelect;
window.openStickerModal = openStickerModal;
window.openRentalStickerModal = openRentalStickerModal;
window.printSticker = printSticker;
window.getWarrantyInfo = getWarrantyInfo;
window.handleImageUpload = handleImageUpload;
window.startQRScanner = startQRScanner;
window.stopQRScanner = stopQRScanner;
window.closeQRScannerModal = closeQRScannerModal;
window.populateFreezerDropdowns = populateFreezerDropdowns;
window.autoPopulateFreezerDetailsInClientForm = autoPopulateFreezerDetailsInClientForm;
