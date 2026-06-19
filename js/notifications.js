import { state } from './state.js';

let notifications = [];

export function initNotificationsSystem() {
    // Injetar HTML do popover de notificações dinamicamente se não existir
    if (!document.getElementById("notifications-popover")) {
        document.body.insertAdjacentHTML("beforeend", `
            <div id="notifications-popover"
                 style="position:fixed; top:70px; right:16px; z-index:99999;
                        width:360px; border-radius:12px;
                        background:rgba(12,20,40,0.97); backdrop-filter:blur(20px);
                        border:1px solid rgba(0,240,255,0.2);
                        box-shadow:0 12px 40px rgba(0,0,0,0.6);
                        flex-direction: column; overflow: hidden; max-height: 500px;">
                <div style="padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,0.07); display: flex; justify-content: space-between; align-items: center; background: rgba(0, 240, 255, 0.03);">
                    <span style="color:#fff; font-weight:700; font-size:.88rem; display: flex; align-items: center; gap: 6px;">
                        🔔 Notificações e Alertas
                    </span>
                    <button onclick="window.clearNotifications()" style="background: none; border: none; color: var(--color-primary); font-size: 0.75rem; cursor: pointer; font-weight: 600;">
                        Fechar
                    </button>
                </div>
                <div id="notifications-list" style="overflow-y: auto; flex: 1; display: flex; flex-direction: column;">
                    <!-- Notificações geradas via JS -->
                </div>
            </div>
        `);

        // Garantir que o popover comece OCULTO
        const pop = document.getElementById("notifications-popover");
        if (pop) pop.style.display = "none";
    }

    // Fechar popover ao clicar fora (adicionado apenas uma vez)
    if (!window._notifClickOutsideAdded) {
        document.addEventListener("click", (e) => {
            const pop = document.getElementById("notifications-popover");
            if (pop && pop.style.display === "flex") {
                const btn = document.getElementById("btn-notifications");
                if (!pop.contains(e.target) && !btn?.contains(e.target)) {
                    pop.style.display = "none";
                }
            }
        });
        window._notifClickOutsideAdded = true;
    }

    // Executa a primeira varredura de notificações (sem abrir o popover)
    updateNotifications();
}

export function updateNotifications() {
    notifications = [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // ─── 1. Estoque Crítico / Baixo nos Freezers ────────────────────────────
    (state.clients || []).forEach(client => {
        if (!client.freezerCode) return;
        const threshold = (client.alertThreshold || 20) / 100;
        const geloProducts = (state.products || []).filter(p => p.active && (p.type === 'Gelo' || p.type === 'Gelo Saborizado'));

        geloProducts.forEach(p => {
            const prod = p.id;
            const currentStock = (client.stock && client.stock[prod]) || 0;
            const maxCap = (client.capacities && client.capacities[prod]) || 0;

            if (maxCap > 0 && currentStock <= maxCap * threshold) {
                const percentage = Math.round((currentStock / maxCap) * 100);
                const isDanger = percentage <= 10;
                notifications.push({
                    type: 'stock',
                    label: 'Estoque',
                    clientName: client.name,
                    title: isDanger ? '🚨 Estoque Crítico' : '⚠️ Baixo Estoque',
                    text: `Freezer em ${client.name} está com ${currentStock}/${maxCap} pacotes (${percentage}%) de ${p.name}.`,
                    severity: isDanger ? 'danger' : 'warning',
                    targetTab: 'clientes',
                    searchVal: client.name
                });
            }
        });
    });

    // ─── 2. Inatividade de Clientes ─────────────────────────────────────────
    (state.clients || []).forEach(c => {
        const clientDeliveries = (state.deliveries || []).filter(d => d.clientId === c.id);
        let daysSinceLast = -1;
        if (clientDeliveries.length > 0) {
            const sorted = [...clientDeliveries].sort((a, b) => new Date(b.date) - new Date(a.date));
            const lastDate = sorted[0].date ? new Date(sorted[0].date) : null;
            if (lastDate && !isNaN(lastDate)) {
                daysSinceLast = Math.floor((new Date() - lastDate) / (1000 * 60 * 60 * 24));
            }
        }

        if (daysSinceLast > 14) {
            notifications.push({
                type: 'churn',
                label: 'Inatividade',
                clientName: c.name,
                title: '🔴 Cliente Inativo',
                text: `${c.name} está há ${daysSinceLast} dias sem registrar compras.`,
                severity: 'danger',
                targetTab: 'clientes',
                searchVal: c.name
            });
        } else if (daysSinceLast > 7) {
            notifications.push({
                type: 'churn',
                label: 'Inatividade',
                clientName: c.name,
                title: '🟡 Alerta de Inatividade',
                text: `${c.name} está há ${daysSinceLast} dias sem comprar.`,
                severity: 'warning',
                targetTab: 'clientes',
                searchVal: c.name
            });
        }
    });

    // ─── 3. Pedidos Pendentes ───────────────────────────────────────────────
    (state.orders || []).forEach(o => {
        if (o.status === 'pending') {
            notifications.push({
                type: 'order',
                label: 'Pedido',
                clientName: o.clientName || 'Cliente',
                title: '⏳ Pedido Pendente',
                text: `Pedido #${o.id ? o.id.substring(0, 6) : ''} de R$ ${(o.total || 0).toFixed(2).replace('.', ',')} para ${o.clientName || 'Cliente'}.`,
                severity: 'info',
                targetTab: 'clientes',
                searchVal: o.clientName || ''
            });
        }
    });

    // ─── 4. Aluguéis Atrasados ──────────────────────────────────────────────
    (state.rentals || []).forEach(r => {
        if (r.returnDate) return; // já devolvido
        if (!r.expectedReturnDate) return;
        const expected = new Date(r.expectedReturnDate + 'T00:00:00');
        if (expected < today) {
            const diffDays = Math.floor((today - expected) / (1000 * 60 * 60 * 24));
            const equipDesc = r.tinaCode || r.itemType || 'equipamento';
            notifications.push({
                type: 'rental',
                label: 'Aluguel',
                clientName: r.clientName || 'Cliente',
                title: '📦 Aluguel Atrasado',
                text: `${r.clientName || 'Cliente'}: ${equipDesc} com ${diffDays} dia(s) de atraso.`,
                severity: diffDays >= 3 ? 'danger' : 'warning',
                targetTab: 'tinas',
                searchVal: r.clientName || ''
            });
        }
    });

    // ─── 5. Dívidas em Aberto ───────────────────────────────────────────────
    (state.clients || []).forEach(c => {
        const debt = parseFloat(c.outstandingDebt) || 0;
        if (debt > 0) {
            const isCritical = debt >= 200;
            notifications.push({
                type: 'debt',
                label: 'Dívida',
                clientName: c.name,
                title: isCritical ? '💸 Dívida Alta' : '💰 Dívida em Aberto',
                text: `${c.name} possui R$ ${debt.toFixed(2).replace('.', ',')} em aberto.`,
                severity: isCritical ? 'danger' : 'warning',
                targetTab: 'clientes',
                searchVal: c.name
            });
        }
    });

    // ─── 6. Comodatos Pendentes ─────────────────────────────────────────────
    (state.comodatos || []).forEach(cm => {
        if (cm.status === 'pendente') {
            notifications.push({
                type: 'comodato',
                label: 'Comodato',
                clientName: cm.clientName || 'Cliente',
                title: '🔧 Comodato Pendente',
                text: `Freezer ${cm.freezerCode || ''} aguardando ativação para ${cm.clientName || 'Cliente'}.`,
                severity: 'warning',
                targetTab: 'admin',
                adminSubTab: 'tab-comodatos',
                searchVal: cm.clientName || ''
            });
        }
    });

    // ─── 7. Aniversariantes de Hoje ─────────────────────────────────────────
    const todayMonth = today.getMonth() + 1;
    const todayDay = today.getDate();
    (state.clients || []).forEach(c => {
        if (!c.birthDate) return;
        const parts = c.birthDate.split('-');
        if (parts.length !== 3) return;
        if (parseInt(parts[1]) === todayMonth && parseInt(parts[2]) === todayDay) {
            notifications.push({
                type: 'birthday',
                label: 'Aniversário',
                clientName: c.name,
                title: '🎂 Aniversário Hoje!',
                text: `${c.fantasyName || c.name} faz aniversário hoje! Envie uma mensagem de parabéns.`,
                severity: 'info',
                targetTab: 'clientes',
                searchVal: c.name
            });
        }
    });

    // ─── 8. Recibos Não Pagos há mais de 7 dias ─────────────────────────────
    (state.documents || []).filter(d => d.type === 'recibo' && !d.paidDate && d.status !== 'cancelado').forEach(d => {
        if (!d.date) return;
        const docDate = new Date(d.date + 'T00:00:00');
        const diffDays = Math.floor((today - docDate) / (1000 * 60 * 60 * 24));
        if (diffDays >= 7) {
            notifications.push({
                type: 'document',
                label: 'Recibo',
                clientName: d.clientName || 'Cliente',
                title: '🧾 Recibo Não Pago',
                text: `Recibo de R$ ${(d.total || 0).toFixed(2).replace('.', ',')} para ${d.clientName || 'Cliente'} há ${diffDays} dias sem pagamento.`,
                severity: diffDays >= 14 ? 'danger' : 'warning',
                targetTab: 'documentos',
                searchVal: d.clientName || ''
            });
        }
    });

    // ─── 9. Insumos/Embalagens com Estoque Baixo (Fábrica) ──────────────────────────────────
    (state.packaging || []).forEach(pkg => {
        const qty = pkg.currentStock || 0;
        const minQty = pkg.minStock || 0;
        if (minQty > 0 && qty <= minQty) {
            notifications.push({
                type: 'factory',
                label: 'Fábrica',
                clientName: 'Fábrica',
                title: qty === 0 ? '🚫 Insumo Zerado' : '📉 Insumo Baixo',
                text: `${pkg.name || 'Insumo'}: ${qty} un. em estoque (mínimo: ${minQty}).`,
                severity: qty === 0 ? 'danger' : 'warning',
                targetTab: 'admin',
                adminSubTab: 'tab-dados-fabrica',
                searchVal: ''
            });
        }
    });

    // ─── 10. Formulários de Clientes Pendentes (WhatsApp) ───────────────────
    (state.pendingForms || []).forEach(form => {
        if (form.status === 'pending') {
            const fd = form.data || {};
            const labelTipo = form.type === 'comodato' ? 'Comodato' : (form.type === 'aluguel' ? 'Aluguel' : 'Cadastro');
            notifications.push({
                type: 'pending_form',
                label: 'WhatsApp',
                clientName: fd.name || 'Cliente',
                title: `📝 Form. de ${labelTipo} Recebido`,
                text: `${fd.name || 'Cliente'} preencheu o formulário enviado. Clique para revisar e aprovar.`,
                severity: 'info',
                targetTab: 'tab-admin',
                adminSubTab: 'tab-whatsapp'
            });
        }
    });

    // Atualiza badge e lista — NÃO abre o popover
    renderNotificationsList();
}

function toggleNotificationsPopover() {
    const pop = document.getElementById("notifications-popover");
    if (!pop) return;
    const isVisible = pop.style.display === "flex";
    pop.style.display = isVisible ? "none" : "flex";
}

// Expõe globalmente para uso via onclick no HTML
window.toggleNotificationsPopover = function(e) {
    if (e) e.stopPropagation();
    toggleNotificationsPopover();
};

function renderNotificationsList() {
    const list = document.getElementById("notifications-list");
    const badge = document.getElementById("notifications-badge");
    if (!list) return;

    list.innerHTML = "";

    if (notifications.length === 0) {
        list.innerHTML = `
            <div style="padding:2rem 1rem; text-align:center; color:var(--color-text-muted); font-size:0.8rem; display:flex; flex-direction:column; align-items:center; gap:8px;">
                <i data-lucide="bell-off" style="width:24px; height:24px; opacity:0.5;"></i>
                Sem novas notificações ou alertas ativos.
            </div>
        `;
        if (badge) {
            badge.style.display = "none";
            badge.innerText = "0";
        }
    } else {
        if (badge) {
            badge.style.display = "flex";
            badge.innerText = notifications.length;
        }

        // Ordenar: danger → warning → info
        const severityOrder = { danger: 1, warning: 2, info: 3 };
        notifications.sort((a, b) => (severityOrder[a.severity] || 3) - (severityOrder[b.severity] || 3));

        notifications.forEach(notif => {
            const item = document.createElement("div");
            item.className = "notification-item";

            let borderLeftColor = "var(--color-primary)";
            let bgHover = "rgba(0, 240, 255, 0.04)";

            if (notif.severity === 'danger') {
                borderLeftColor = "var(--color-danger)";
                bgHover = "rgba(239, 68, 68, 0.05)";
            } else if (notif.severity === 'warning') {
                borderLeftColor = "#eab308";
                bgHover = "rgba(234, 179, 8, 0.05)";
            } else if (notif.severity === 'info') {
                borderLeftColor = "#3b82f6";
                bgHover = "rgba(59, 130, 246, 0.05)";
            }

            item.style.cssText = `
                padding: 11px 14px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                border-left: 3px solid ${borderLeftColor};
                cursor: pointer;
                transition: background 0.15s ease;
                display: flex;
                flex-direction: column;
                gap: 3px;
            `;

            item.onmouseenter = () => { item.style.background = bgHover; };
            item.onmouseleave = () => { item.style.background = "none"; };

            item.onclick = () => {
                const pop = document.getElementById("notifications-popover");
                if (pop) pop.style.display = "none";

                if (notif.targetTab && window.navigateToTab) {
                    window.navigateToTab(notif.targetTab);
                }

                if (notif.adminSubTab && typeof window.switchAdminSubTab === 'function') {
                    window.switchAdminSubTab(notif.adminSubTab);
                }

                if (notif.searchVal) {
                    setTimeout(() => {
                        const searchInput = document.getElementById("client-search-input");
                        if (searchInput) {
                            searchInput.value = notif.searchVal;
                            if (typeof window.renderClientes === 'function') window.renderClientes();
                        }
                    }, 150);
                }

                if (window.triggerHaptic) window.triggerHaptic('light');
            };

            let waBtnHtml = '';
            const isWaApplicable = ['birthday', 'debt', 'stock'].includes(notif.type);
            let matchingClient = null;
            if (isWaApplicable && notif.clientName) {
                matchingClient = (state.clients || []).find(c => c.name === notif.clientName);
            }
            
            if (matchingClient && matchingClient.phone) {
                const templateMap = { birthday: 'aniversario', debt: 'divida', stock: 'estoque_baixo' };
                const templateType = templateMap[notif.type];
                const contexto = {
                    nome: matchingClient.fantasyName || matchingClient.name,
                    phone: matchingClient.phone,
                    valor: matchingClient.outstandingDebt || 0
                };
                const contextoStr = JSON.stringify(contexto).replace(/"/g, '&quot;');
                
                waBtnHtml = `
                    <div style="margin-top: 6px; display: flex; justify-content: flex-end;">
                        <button onclick="event.stopPropagation(); window.abrirConfirmacaoWA('${matchingClient.id}', '${templateType}', ${contextoStr})" 
                                class="btn btn-secondary" 
                                style="padding: 2px 8px; font-size: 0.68rem; display: inline-flex; align-items: center; gap: 4px; background: rgba(0, 240, 255, 0.05); border-color: rgba(0, 240, 255, 0.15); color: var(--color-primary); height: auto;">
                            <i data-lucide="message-circle" style="width: 12px; height: 12px;"></i> Enviar WA
                        </button>
                    </div>
                `;
            }

            item.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; gap:6px;">
                    <strong style="font-size:0.8rem; color:#fff; flex:1;">${notif.title}</strong>
                    <span style="font-size:0.62rem; color:var(--color-text-muted); white-space:nowrap; background:rgba(255,255,255,0.05); border-radius:4px; padding:1px 5px;">${notif.label || ''}</span>
                </div>
                <p style="font-size:0.72rem; color:var(--color-text-muted); margin:0; line-height:1.35;">${notif.text}</p>
                ${waBtnHtml}
            `;

            list.appendChild(item);
        });
    }

    if (window.lucide) window.lucide.createIcons();
}

window.clearNotifications = function() {
    const pop = document.getElementById("notifications-popover");
    if (pop) pop.style.display = "none";
};

// Vincula ao escopo global para acesso por outros módulos
window.updateNotifications = updateNotifications;
