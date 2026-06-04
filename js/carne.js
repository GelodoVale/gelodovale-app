// --- MÓDULO: CARNÊ DIGITAL DE FIADO ---
import { state, saveState } from './state.js';

/**
 * Abre o modal do Carnê de Fiado de um cliente
 */
export function openCarneModal(clientId) {
    const modal = document.getElementById('modal-carne');
    if (!modal) return;
    const client = (state.clients || []).find(c => c.id === clientId);
    if (!client) return;

    document.getElementById('carne-client-id').value = clientId;
    document.getElementById('carne-client-name').textContent = client.name;

    const debt = parseFloat(client.outstandingDebt) || 0;
    const debtEl = document.getElementById('carne-total-debt');
    if (debtEl) {
        debtEl.textContent = `R$ ${debt.toFixed(2).replace('.', ',')}`;
        debtEl.style.color = debt > 0 ? '#ef4444' : '#10b981';
    }

    // Campo de vencimento padrão: 10 dias
    const dueDateInput = document.getElementById('carne-due-date');
    if (dueDateInput) {
        const dt = new Date();
        dt.setDate(dt.getDate() + 10);
        dueDateInput.value = dt.toISOString().split('T')[0];
    }

    renderCarneList(clientId);
    modal.classList.add('active');
}

/**
 * Renderiza o extrato do carnê de um cliente
 */
export function renderCarneList(clientId) {
    const container = document.getElementById('carne-list');
    if (!container) return;
    const client = (state.clients || []).find(c => c.id === clientId);
    if (!client) return;

    const entries = (client.carnet || []).sort((a, b) => {
        // Não pagos primeiro, depois por vencimento
        if (a.paid !== b.paid) return a.paid ? 1 : -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
    });

    if (entries.length === 0) {
        container.innerHTML = `<div style="text-align:center; color: var(--color-text-muted); padding: 20px; font-size: 0.85rem;">Nenhum lançamento no carnê.</div>`;
        return;
    }

    const today = new Date();
    today.setHours(0,0,0,0);

    container.innerHTML = entries.map(entry => {
        const due = entry.dueDate ? new Date(entry.dueDate + 'T00:00:00') : null;
        const isOverdue = !entry.paid && due && due < today;
        const isDueToday = !entry.paid && due && due.getTime() === today.getTime();
        const dueFmt = due ? due.toLocaleDateString('pt-BR') : '—';

        let borderColor = 'rgba(255,255,255,0.07)';
        let badge = '';
        if (entry.paid) {
            borderColor = 'rgba(16,185,129,0.3)';
            badge = `<span style="font-size:0.7rem; background:rgba(16,185,129,0.1); color:#10b981; border:1px solid rgba(16,185,129,0.3); border-radius:4px; padding:2px 6px;">✅ Pago</span>`;
        } else if (isOverdue) {
            borderColor = 'rgba(239,68,68,0.4)';
            badge = `<span style="font-size:0.7rem; background:rgba(239,68,68,0.1); color:#ef4444; border:1px solid rgba(239,68,68,0.3); border-radius:4px; padding:2px 6px; animation: pulse 1.5s infinite;">🔴 Vencido</span>`;
        } else if (isDueToday) {
            borderColor = 'rgba(245,158,11,0.5)';
            badge = `<span style="font-size:0.7rem; background:rgba(245,158,11,0.1); color:#f59e0b; border:1px solid rgba(245,158,11,0.3); border-radius:4px; padding:2px 6px;">⚠️ Vence Hoje</span>`;
        } else {
            badge = `<span style="font-size:0.7rem; background:rgba(99,102,241,0.1); color:#818cf8; border:1px solid rgba(99,102,241,0.2); border-radius:4px; padding:2px 6px;">🕐 Pendente</span>`;
        }

        const clientPhone = (state.clients || []).find(c => c.id === clientId);
        const waPhoneRaw = (clientPhone && (clientPhone.phone || clientPhone.whatsapp) || '').replace(/\D/g, '');
        const waPhone = (waPhoneRaw.length === 10 || waPhoneRaw.length === 11) ? '55' + waPhoneRaw : waPhoneRaw;
        const waMsg = encodeURIComponent(
            `Olá ${client.name}! 👋\n\nPassando para lembrar sobre um pagamento pendente:\n\n` +
            `📋 *${entry.description}*\n💰 *Valor: R$ ${entry.amount.toFixed(2).replace('.', ',')}*\n📅 Vencimento: ${dueFmt}\n\n` +
            `Por favor, entre em contato para acertar. Obrigado! 🙏\n\n— Gelo do Vale`
        );
        const waUrl = waPhone ? `https://api.whatsapp.com/send?phone=${waPhone}&text=${waMsg}` : `https://api.whatsapp.com/send?text=${waMsg}`;

        return `
        <div style="background: rgba(255,255,255,0.02); border: 1px solid ${borderColor}; border-radius: 8px; padding: 10px 12px; display: flex; flex-direction: column; gap: 6px; ${entry.paid ? 'opacity: 0.6;' : ''}">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; flex-wrap: wrap;">
                <div style="flex: 1; min-width: 0;">
                    <div style="font-size: 0.8rem; font-weight: 700; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${entry.description}</div>
                    <div style="font-size: 0.72rem; color: var(--color-text-muted); margin-top: 2px;">Venc: ${dueFmt}</div>
                </div>
                <div style="text-align: right; flex-shrink: 0;">
                    <div style="font-size: 1rem; font-weight: 800; color: ${entry.paid ? '#10b981' : (isOverdue ? '#ef4444' : '#fff')};">R$ ${entry.amount.toFixed(2).replace('.', ',')}</div>
                    ${badge}
                </div>
            </div>
            ${!entry.paid ? `
            <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-top: 2px;">
                <button onclick="payCarneEntry('${clientId}', '${entry.id}')" style="flex: 1; min-width: 80px; padding: 5px 8px; background: rgba(16,185,129,0.12); border: 1px solid rgba(16,185,129,0.3); color: #10b981; border-radius: 6px; font-size: 0.75rem; font-weight: 700; cursor: pointer;">✅ Marcar Pago</button>
                <a href="#" onclick="window.sendCarneBillingWhatsApp('${clientId}', '${entry.id}'); return false;" style="flex: 1; min-width: 80px; padding: 5px 8px; background: rgba(37,211,102,0.1); border: 1px solid rgba(37,211,102,0.3); color: #25D366; border-radius: 6px; font-size: 0.75rem; font-weight: 700; text-decoration: none; display: flex; align-items: center; justify-content: center; gap: 4px;">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    Cobrar
                </a>
                <button onclick="deleteCarneEntry('${clientId}', '${entry.id}')" style="padding: 5px 8px; background: transparent; border: 1px solid rgba(239,68,68,0.2); color: #ef4444; border-radius: 6px; font-size: 0.75rem; cursor: pointer;">🗑️</button>
            </div>
            ` : `<div style="font-size: 0.72rem; color: #10b981; margin-top: 2px;">✅ Pago em ${entry.paidDate ? new Date(entry.paidDate).toLocaleDateString('pt-BR') : '—'}</div>`}
        </div>`;
    }).join('');
}

/**
 * Adiciona uma entrada no carnê do cliente
 */
export function addCarneEntry() {
    const clientId = document.getElementById('carne-client-id').value;
    const client = (state.clients || []).find(c => c.id === clientId);
    if (!client) return;

    const amountEl = document.getElementById('carne-amount');
    const descEl = document.getElementById('carne-description');
    const dueDateEl = document.getElementById('carne-due-date');

    const amount = parseFloat(amountEl ? amountEl.value : 0) || 0;
    const description = descEl ? descEl.value.trim() : '';
    const dueDate = dueDateEl ? dueDateEl.value : '';

    if (amount <= 0) { window.showToast('Informe o valor do lançamento.', 'warning'); return; }
    if (!description) { window.showToast('Informe a descrição do lançamento.', 'warning'); return; }

    if (!client.carnet) client.carnet = [];
    client.carnet.push({
        id: 'cr-' + Date.now(),
        amount,
        description,
        dueDate,
        paid: false,
        paidDate: null,
        createdAt: new Date().toISOString()
    });

    // Somar ao débito total
    client.outstandingDebt = (client.outstandingDebt || 0) + amount;

    saveState();
    if (window.showToast) window.showToast(`Lançamento de R$ ${amount.toFixed(2).replace('.', ',')} adicionado ao carnê.`, 'success');

    // Atualizar UI
    const debtEl = document.getElementById('carne-total-debt');
    if (debtEl) {
        debtEl.textContent = `R$ ${(client.outstandingDebt || 0).toFixed(2).replace('.', ',')}`;
        debtEl.style.color = (client.outstandingDebt || 0) > 0 ? '#ef4444' : '#10b981';
    }
    if (amountEl) amountEl.value = '';
    if (descEl) descEl.value = '';
    renderCarneList(clientId);
}

/**
 * Marca uma entrada do carnê como paga
 */
export function payCarneEntry(clientId, entryId) {
    const client = (state.clients || []).find(c => c.id === clientId);
    if (!client || !client.carnet) return;

    const entry = client.carnet.find(e => e.id === entryId);
    if (!entry || entry.paid) return;

    window.showConfirm(
        `Marcar pagamento de R$ ${entry.amount.toFixed(2).replace('.', ',')} (${entry.description}) como recebido?`,
        () => {
            entry.paid = true;
            entry.paidDate = new Date().toISOString();
            
            // Registrar em state.payments para manter histórico e visibilidade de fluxo de caixa
            if (!state.payments) state.payments = [];
            state.payments.push({
                id: "pay-" + Date.now(),
                clientId: clientId,
                clientName: client.name,
                amount: entry.amount,
                paymentMethod: "Dinheiro",
                date: new Date().toISOString(),
                gps: null
            });
            
            saveState();
            if (window.showToast) window.showToast('Pagamento registrado! Saldo atualizado.', 'success');
            openCarneModal(clientId);
            if (window.renderApp) window.renderApp();
        },
        null,
        'Confirmar Pagamento',
        'Confirmar Recebimento'
    );
}

/**
 * Remove uma entrada do carnê
 */
export function deleteCarneEntry(clientId, entryId) {
    const client = (state.clients || []).find(c => c.id === clientId);
    if (!client || !client.carnet) return;

    const entry = client.carnet.find(e => e.id === entryId);
    if (!entry) return;

    window.showConfirm(
        `Remover lançamento "${entry.description}" de R$ ${entry.amount.toFixed(2).replace('.', ',')} do carnê?`,
        () => {
            if (!entry.paid) {
                client.outstandingDebt = Math.max(0, (client.outstandingDebt || 0) - entry.amount);
            }
            client.carnet = client.carnet.filter(e => e.id !== entryId);
            saveState();
            if (window.showToast) window.showToast('Lançamento removido.', 'success');
            renderCarneList(clientId);
            const debtEl = document.getElementById('carne-total-debt');
            if (debtEl) {
                debtEl.textContent = `R$ ${(client.outstandingDebt || 0).toFixed(2).replace('.', ',')}`;
            }
        },
        null,
        'Remover Lançamento',
        'Remover'
    );
}

/**
 * Renderiza o painel de Top Devedores para o Dashboard
 */
export function renderTopDevedores() {
    const container = document.getElementById('top-devedores-list');
    if (!container) return;

    const devedores = (state.clients || [])
        .filter(c => (parseFloat(c.outstandingDebt) || 0) > 0)
        .sort((a, b) => (parseFloat(b.outstandingDebt) || 0) - (parseFloat(a.outstandingDebt) || 0))
        .slice(0, 5);

    if (devedores.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding: 12px; color: var(--color-text-muted); font-size: 0.8rem;">✅ Nenhum devedor no momento!</div>`;
        return;
    }

    container.innerHTML = devedores.map((c, i) => {
        const debt = parseFloat(c.outstandingDebt) || 0;
        const pending = (c.carnet || []).filter(e => !e.paid).length;
        const overdue = (c.carnet || []).filter(e => !e.paid && e.dueDate && new Date(e.dueDate + 'T00:00:00') < new Date()).length;
        const waPhone = (c.phone || '').replace(/\D/g, '');
        const waPhoneDDI = (waPhone.length === 10 || waPhone.length === 11) ? '55' + waPhone : waPhone;
        const waMsg = encodeURIComponent(`Olá ${c.name}! 👋 Passando para lembrar sobre seu débito pendente de *R$ ${debt.toFixed(2).replace('.', ',')}* na Gelo do Vale. Por favor, entre em contato. Obrigado! 🙏`);

        const rankColors = ['#f59e0b', '#9ca3af', '#cd7f32'];
        const rankColor = rankColors[i] || 'var(--color-text-muted)';

        return `
        <div style="display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.04);">
            <div style="width: 22px; height: 22px; border-radius: 50%; background: ${rankColor}22; border: 1px solid ${rankColor}44; color: ${rankColor}; font-size: 0.7rem; font-weight: 800; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">${i + 1}</div>
            <div style="flex: 1; min-width: 0;">
                <div style="font-size: 0.82rem; font-weight: 600; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${c.name}</div>
                <div style="font-size: 0.7rem; color: var(--color-text-muted);">${pending} parcela${pending !== 1 ? 's' : ''} pendente${pending !== 1 ? 's' : ''} ${overdue > 0 ? `<span style="color:#ef4444;">• ${overdue} vencida${overdue !== 1 ? 's' : ''}</span>` : ''}</div>
            </div>
            <div style="text-align:right; flex-shrink: 0;">
                <div style="font-size: 0.95rem; font-weight: 800; color: #ef4444;">R$ ${debt.toFixed(2).replace('.', ',')}</div>
                <div style="display: flex; gap: 4px; margin-top: 2px; justify-content: flex-end;">
                    <button onclick="openCarneModal('${c.id}')" style="padding: 2px 6px; font-size: 0.65rem; background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.3); color: #818cf8; border-radius: 4px; cursor: pointer;">Ver Carnê</button>
                    ${waPhoneDDI ? `<a href="#" onclick="window.sendClientDebtWhatsApp('${c.id}', '${debt}'); return false;" style="padding: 2px 6px; font-size: 0.65rem; background: rgba(37,211,102,0.1); border: 1px solid rgba(37,211,102,0.2); color: #25D366; border-radius: 4px; text-decoration: none;">Cobrar</a>` : ''}
                </div>
            </div>
        </div>`;
    }).join('');
}

// Bindings window
window.openCarneModal = openCarneModal;
window.renderCarneList = renderCarneList;
window.addCarneEntry = addCarneEntry;
window.payCarneEntry = payCarneEntry;
window.deleteCarneEntry = deleteCarneEntry;
window.renderTopDevedores = renderTopDevedores;

export function sendCarneBillingWhatsApp(clientId, entryId) {
    const client = (state.clients || []).find(c => c.id === clientId);
    if (!client) return;
    const entry = (client.carnet || []).find(e => e.id === entryId);
    if (!entry) return;

    const due = entry.dueDate ? new Date(entry.dueDate + 'T00:00:00') : null;
    const dueFmt = due ? due.toLocaleDateString('pt-BR') : '—';
    const clientPhone = client.phone || client.whatsapp || '';
    const cleanPhone = clientPhone.replace(/\D/g, '');
    const formattedPhone = (cleanPhone.length === 10 || cleanPhone.length === 11) ? '55' + cleanPhone : cleanPhone;

    const message = `Olá ${client.name}! 👋\n\nPassando para lembrar sobre um pagamento pendente:\n\n` +
        `📋 *${entry.description}*\n💰 *Valor: R$ ${entry.amount.toFixed(2).replace('.', ',')}*\n📅 Vencimento: ${dueFmt}\n\n` +
        `Por favor, entre em contato para acertar. Obrigado! 🙏\n\n— Gelo do Vale`;

    if (state.whatsapp && state.whatsapp.enabled && typeof window.sendWhatsAppMessageAPI === "function") {
        window.sendWhatsAppMessageAPI(formattedPhone, message).then(success => {
            if (!success) {
                const waUrl = formattedPhone 
                    ? `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(message)}`
                    : `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
                window.open(waUrl, "_blank");
            }
        });
    } else {
        const waUrl = formattedPhone 
            ? `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(message)}`
            : `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
        window.open(waUrl, "_blank");
    }
}

export function sendClientDebtWhatsApp(clientId, debtAmount) {
    const client = (state.clients || []).find(c => c.id === clientId);
    if (!client) return;

    const clientPhone = client.phone || client.whatsapp || '';
    const cleanPhone = clientPhone.replace(/\D/g, '');
    const formattedPhone = (cleanPhone.length === 10 || cleanPhone.length === 11) ? '55' + cleanPhone : cleanPhone;

    const message = `Olá ${client.name}! 👋 Passando para lembrar sobre seu débito pendente de *R$ ${parseFloat(debtAmount).toFixed(2).replace('.', ',')}* na Gelo do Vale. Por favor, entre em contato. Obrigado! 🙏`;

    if (state.whatsapp && state.whatsapp.enabled && typeof window.sendWhatsAppMessageAPI === "function") {
        window.sendWhatsAppMessageAPI(formattedPhone, message).then(success => {
            if (!success) {
                const waUrl = formattedPhone 
                    ? `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(message)}`
                    : `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
                window.open(waUrl, "_blank");
            }
        });
    } else {
        const waUrl = formattedPhone 
            ? `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(message)}`
            : `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
        window.open(waUrl, "_blank");
    }
}

window.sendCarneBillingWhatsApp = sendCarneBillingWhatsApp;
window.sendClientDebtWhatsApp = sendClientDebtWhatsApp;

export function syncDeliveryCarnetEntry(delivery) {
    if (!delivery) return;
    const clientId = delivery.clientId;
    const carnetId = 'cr-del-' + delivery.id;
    const isAPrazo = delivery.paymentMethod === "A Prazo";

    // Garantir que nenhum outro cliente tenha essa parcela
    state.clients.forEach(c => {
        if (c.id !== clientId && c.carnet) {
            c.carnet = c.carnet.filter(e => e.id !== carnetId);
        }
    });

    if (!clientId || clientId === "c-balcao") return;
    const client = (state.clients || []).find(c => c.id === clientId);
    if (!client) return;
    if (!client.carnet) client.carnet = [];

    const idx = client.carnet.findIndex(e => e.id === carnetId);

    if (isAPrazo) {
        const dateStr = delivery.date ? new Date(delivery.date).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR');
        const dueDate = new Date(delivery.date || Date.now());
        dueDate.setDate(dueDate.getDate() + 10);

        const entryData = {
            id: carnetId,
            amount: delivery.revenue || 0,
            description: `Entrega em ${dateStr}`,
            dueDate: dueDate.toISOString().split('T')[0],
            paid: false,
            paidDate: null,
            createdAt: delivery.date || new Date().toISOString()
        };

        if (idx === -1) {
            client.carnet.push(entryData);
        } else {
            if (!client.carnet[idx].paid) {
                client.carnet[idx].amount = entryData.amount;
                client.carnet[idx].description = entryData.description;
            }
        }
    } else {
        if (idx !== -1 && !client.carnet[idx].paid) {
            client.carnet.splice(idx, 1);
        }
    }
}

export function syncDocumentCarnetEntry(doc) {
    if (!doc) return;
    const clientId = doc.clientId;
    const carnetId = 'cr-doc-' + doc.id;
    const isAPrazo = doc.paymentMethod === "A Prazo" && (doc.type === "recibo" || doc.type === "nota");

    // Limpar o carnê de qualquer outro cliente
    state.clients.forEach(c => {
        if (c.id !== clientId && c.carnet) {
            c.carnet = c.carnet.filter(e => e.id !== carnetId);
        }
    });

    if (!clientId) return;
    const client = (state.clients || []).find(c => c.id === clientId);
    if (!client) return;
    if (!client.carnet) client.carnet = [];

    const idx = client.carnet.findIndex(e => e.id === carnetId);

    if (isAPrazo) {
        const dateStr = doc.date ? new Date(doc.date + 'T00:00:00').toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR');
        const dueDate = new Date(doc.date ? doc.date + 'T12:00:00' : Date.now());
        dueDate.setDate(dueDate.getDate() + 10);

        const entryData = {
            id: carnetId,
            amount: doc.total || 0,
            description: `${doc.type === "nota" ? "Nota" : "Recibo"} em ${dateStr}`,
            dueDate: dueDate.toISOString().split('T')[0],
            paid: false,
            paidDate: null,
            createdAt: doc.date ? doc.date + 'T12:00:00' : new Date().toISOString()
        };

        if (idx === -1) {
            client.carnet.push(entryData);
        } else {
            if (!client.carnet[idx].paid) {
                client.carnet[idx].amount = entryData.amount;
                client.carnet[idx].description = entryData.description;
            }
        }
    } else {
        if (idx !== -1 && !client.carnet[idx].paid) {
            client.carnet.splice(idx, 1);
        }
    }
}

window.syncDeliveryCarnetEntry = syncDeliveryCarnetEntry;
window.syncDocumentCarnetEntry = syncDocumentCarnetEntry;
