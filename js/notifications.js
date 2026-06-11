import { state } from './state.js';

let notifications = [];

export function initNotificationsSystem() {
    // Injetar HTML do popover de notificações dinamicamente se não existir
    if (!document.getElementById("notifications-popover")) {
        document.body.insertAdjacentHTML("beforeend", `
            <div id="notifications-popover"
                 style="display:none; position:fixed; top:70px; right:16px; z-index:99999;
                        width:350px; border-radius:12px;
                        background:rgba(12,20,40,0.97); backdrop-filter:blur(20px);
                        border:1px solid rgba(0,240,255,0.2);
                        box-shadow:0 12px 40px rgba(0,0,0,0.6);
                        display: flex; flex-direction: column; overflow: hidden; max-height: 480px;">
                <div style="padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,0.07); display: flex; justify-content: space-between; align-items: center; background: rgba(0, 240, 255, 0.03);">
                    <span style="color:#fff; font-weight:700; font-size:.88rem; display: flex; align-items: center; gap: 6px;">
                        🔔 Notificações e Alertas
                    </span>
                    <button onclick="window.clearNotifications()" style="background: none; border: none; color: var(--color-primary); font-size: 0.75rem; cursor: pointer; font-weight: 600;">
                        Limpar
                    </button>
                </div>
                <div id="notifications-list" style="overflow-y: auto; flex: 1; display: flex; flex-direction: column;">
                    <!-- Notificações geradas via JS -->
                </div>
            </div>
        `);
    }

    const btn = document.getElementById("btn-notifications");
    if (btn) {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            toggleNotificationsPopover();
        });
    }

    // Fechar popover ao clicar fora
    document.addEventListener("click", (e) => {
        const pop = document.getElementById("notifications-popover");
        if (pop && pop.style.display !== "none") {
            const btn = document.getElementById("btn-notifications");
            if (!pop.contains(e.target) && !btn?.contains(e.target)) {
                pop.style.display = "none";
            }
        }
    });

    // Executa a primeira varredura de notificações
    updateNotifications();
}

export function updateNotifications() {
    notifications = [];

    // 1. Alertas de Estoque Crítico (Freezers)
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

    // 2. Alertas de Churn / Inatividade (Clientes sem comprar)
    (state.clients || []).forEach(c => {
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
        
        if (daysSinceLast >= 0) {
            if (daysSinceLast > 14) {
                notifications.push({
                    type: 'churn',
                    clientName: c.name,
                    title: '🔴 Cliente Inativo',
                    text: `O cliente ${c.name} está há ${daysSinceLast} dias sem registrar compras.`,
                    severity: 'danger',
                    targetTab: 'clientes',
                    searchVal: c.name
                });
            } else if (daysSinceLast > 7) {
                notifications.push({
                    type: 'churn',
                    clientName: c.name,
                    title: '🟡 Alerta de Inatividade',
                    text: `O cliente ${c.name} está há ${daysSinceLast} dias sem comprar (Alerta).`,
                    severity: 'warning',
                    targetTab: 'clientes',
                    searchVal: c.name
                });
            }
        }
    });

    // 3. Pedidos Pendentes
    (state.orders || []).forEach(o => {
        if (o.status === 'pendente') {
            notifications.push({
                type: 'order',
                clientName: o.clientName || 'Cliente',
                title: '⏳ Pedido Pendente',
                text: `Pedido #${o.id ? o.id.substring(0, 6) : ''} de R$ ${o.total.toFixed(2).replace('.', ',')} pendente para ${o.clientName || 'Cliente'}.`,
                severity: 'info',
                targetTab: 'clientes',
                searchVal: o.clientName || ''
            });
        }
    });

    renderNotificationsList();
}

function toggleNotificationsPopover() {
    const pop = document.getElementById("notifications-popover");
    if (!pop) return;
    if (pop.style.display === "none") {
        pop.style.display = "flex";
    } else {
        pop.style.display = "none";
    }
}

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

        // Ordenar notificações: danger primeiro, depois warning, depois info
        const severityOrder = { danger: 1, warning: 2, info: 3 };
        notifications.sort((a, b) => (severityOrder[a.severity] || 3) - (severityOrder[b.severity] || 3));

        notifications.forEach(notif => {
            const item = document.createElement("div");
            item.className = "notification-item";
            
            // Configurar cores da borda lateral com base no nível
            let borderLeftColor = "var(--color-primary)";
            let bgHover = "rgba(0, 240, 255, 0.04)";
            
            if (notif.severity === 'danger') {
                borderLeftColor = "var(--color-danger)";
                bgHover = "rgba(239, 68, 68, 0.04)";
            } else if (notif.severity === 'warning') {
                borderLeftColor = "#eab308";
                bgHover = "rgba(234, 179, 8, 0.04)";
            } else if (notif.severity === 'info') {
                borderLeftColor = "#3b82f6";
                bgHover = "rgba(59, 130, 246, 0.04)";
            }

            item.style.cssText = `
                padding: 12px 16px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                border-left: 3px solid ${borderLeftColor};
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                flex-direction: column;
                gap: 4px;
            `;

            // Efeito Hover
            item.onmouseenter = () => { item.style.background = bgHover; };
            item.onmouseleave = () => { item.style.background = "none"; };

            // Ação ao clicar na notificação
            item.onclick = () => {
                const pop = document.getElementById("notifications-popover");
                if (pop) pop.style.display = "none";

                // Redirecionar para a aba correta
                if (notif.targetTab && window.navigateToTab) {
                    window.navigateToTab(notif.targetTab);
                }

                // Filtrar cliente específico no campo de pesquisa
                if (notif.searchVal) {
                    const searchInput = document.getElementById("client-search-input");
                    if (searchInput) {
                        searchInput.value = notif.searchVal;
                        if (typeof window.renderClientes === 'function') {
                            window.renderClientes();
                        }
                    }
                }
                
                if (window.triggerHaptic) window.triggerHaptic('light');
            };

            item.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <strong style="font-size:0.8rem; color:#fff;">${notif.title}</strong>
                    <span style="font-size:0.65rem; color:var(--color-text-muted);">${notif.type === 'stock' ? 'Estoque' : notif.type === 'churn' ? 'Inatividade' : 'Pedido'}</span>
                </div>
                <p style="font-size:0.72rem; color:var(--color-text-muted); margin:0; line-height:1.3;">${notif.text}</p>
            `;
            
            list.appendChild(item);
        });
    }

    if (window.lucide) window.lucide.createIcons();
}

window.clearNotifications = function() {
    const pop = document.getElementById("notifications-popover");
    if (pop) pop.style.display = "none";
    if (window.showToast) window.showToast("Os alertas operacionais devem ser resolvidos na aba correspondente.", "info");
};

// Vincula ao escopo global para acesso por outros módulos
window.updateNotifications = updateNotifications;
