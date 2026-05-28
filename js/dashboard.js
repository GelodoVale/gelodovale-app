// --- TELA 1: RENDERIZAÇÃO DO DASHBOARD E GRÁFICOS ---
import { state } from './state.js';
import { renderWidgets } from './widgets.js';

export function renderDashboard() {
    // 1. Calcular indicadores KPIs
    const activeClientsCount = state.clients.length;
    const activeFreezersCount = state.clients.filter(c => c.freezerCode).length;
    
    // Faturamento e total de gelo no mês corrente
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    let totalKgMonth = 0;
    let totalRevenueMonth = 0;
    
    state.deliveries.forEach(del => {
        const delDate = new Date(del.date);
        if (delDate.getMonth() === currentMonth && delDate.getFullYear() === currentYear) {
            totalRevenueMonth += del.revenue;
            // Calcular kg
            if (del.items) {
                state.products.forEach(p => {
                    if (p.type === 'Gelo') {
                        const qty = del.items[p.id] || 0;
                        const weight = p.weight || 0;
                        totalKgMonth += qty * weight;
                    } else if (p.type === 'Gelo Saborizado') {
                        const qty = del.items[p.id] || 0;
                        const qtyUnits = del.items[p.id + "_unit"] || 0;
                        const unitWeightG = p.unitWeightGrams || 0;
                        const unitsPerPack = p.unitsPerPack || 12;
                        const packWeightKg = (unitWeightG * unitsPerPack) / 1000;
                        totalKgMonth += qty * packWeightKg + qtyUnits * (unitWeightG / 1000);
                    }
                });
            }
        }
    });

    // Somar faturamento de aluguel de tinas
    if (state.rentals) {
        state.rentals.forEach(rent => {
            const rentDate = new Date(rent.deliveryDate);
            if (rentDate.getMonth() === currentMonth && rentDate.getFullYear() === currentYear) {
                totalRevenueMonth += rent.totalRevenue || ((rent.rentalFee || 0) + (rent.deliveryFee || 0) + (rent.pickupFee || 0) + (rent.extraFee || 0));
            }
        });
    }

    const pendingOrdersCount = state.orders.filter(o => o.status === "pending").length;
    const activeRentalsCount = state.rentals ? state.rentals.filter(r => r.status === "active" || r.status === "overdue").length : 0;
    
    // Atualizar HTML de KPIs
    const kpiFreezers = document.getElementById("kpi-freezers");
    if (kpiFreezers) {
        kpiFreezers.innerHTML = `
            <span style="font-size: 1.1rem; display: block; line-height: 1.2;">
                Cli: ${activeClientsCount} | Frz: ${activeFreezersCount}
            </span>
            <span style="font-size: 0.75rem; color: var(--color-primary); display: block; margin-top: 4px; font-weight: 600;">
                Tinas: ${activeRentalsCount} ativas
            </span>
        `;
    }
    const kpiDelivered = document.getElementById("kpi-delivered");
    if (kpiDelivered) kpiDelivered.innerText = `${totalKgMonth.toLocaleString('pt-BR')} kg`;
    
    const kpiPending = document.getElementById("kpi-pending-orders");
    if (kpiPending) kpiPending.innerText = pendingOrdersCount;
    
    const kpiRevenue = document.getElementById("kpi-revenue");
    if (kpiRevenue) kpiRevenue.innerText = `R$ ${totalRevenueMonth.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    // 2. Renderizar lista de alertas de reposição urgente
    renderDashboardAlerts();

    // 3. Renderizar gráfico estatístico SVG
    renderDashboardChart();

    // 4. Renderizar Widgets Customizados
    renderWidgets();
}

export function renderDashboardAlerts() {
    const alertsContainer = document.getElementById("alerts-list-container");
    const alertCountBadge = document.getElementById("alert-count");
    if (!alertsContainer || !alertCountBadge) return;
    alertsContainer.innerHTML = "";
    
    let alerts = [];
    
    state.clients.forEach(client => {
        const threshold = (client.alertThreshold || 20) / 100;
        
        const geloProducts = state.products.filter(p => p.active && (p.type === 'Gelo' || p.type === 'Gelo Saborizado'));
        geloProducts.forEach(p => {
            const prod = p.id;
            const currentStock = (client.stock && client.stock[prod]) || 0;
            const maxCap = (client.capacities && client.capacities[prod]) || 0;
            
            if (maxCap > 0 && currentStock <= maxCap * threshold) {
                const percentage = Math.round((currentStock / maxCap) * 100);
                alerts.push({
                    clientName: client.name,
                    productName: p.name,
                    current: currentStock,
                    max: maxCap,
                    pct: percentage,
                    severity: percentage <= 10 ? 'danger' : 'warning'
                });
            }
        });
    });
    
    // Atualizar badge do painel
    alertCountBadge.innerText = `${alerts.length} ${alerts.length === 1 ? 'Alerta' : 'Alertas'}`;
    if (alerts.length === 0) {
        alertCountBadge.className = "status-badge completed";
    } else {
        alertCountBadge.className = "status-badge pending";
    }
    
    // Renderizar alertas
    if (alerts.length === 0) {
        alertsContainer.innerHTML = `
            <div class="empty-alerts">
                <i data-lucide="check-circle" style="color: var(--color-success); margin-bottom: 0.5rem; width: 32px; height: 32px;"></i>
                <p>Todos os freezers abastecidos e saudáveis!</p>
            </div>
        `;
    } else {
        // Ordenar os alertas de maior urgência (danger primeiro)
        alerts.sort((a, b) => a.pct - b.pct);
        
        alerts.forEach(al => {
            const isDanger = al.severity === 'danger';
            alertsContainer.innerHTML += `
                <div class="alert-item ${isDanger ? '' : 'warning'}">
                    <i data-lucide="alert-triangle" class="alert-icon"></i>
                    <div class="alert-details">
                        <h4>${al.clientName}</h4>
                        <p>Estoque crítico de <strong>${al.productName}</strong>: ${al.current}/${al.max} pacotes (${al.pct}%)</p>
                    </div>
                </div>
            `;
        });
    }
    if (window.lucide) lucide.createIcons();
}

export function renderDashboardChart() {
    const revCanvas = document.getElementById("revenueChart");
    const prodCanvas = document.getElementById("productsChart");
    
    if (!revCanvas || !prodCanvas) return;
    
    // Destroy existing charts to prevent "Canvas is already in use" errors
    if (window.myRevChart) window.myRevChart.destroy();
    if (window.myProdChart) window.myProdChart.destroy();

    // 1. DADOS DE FATURAMENTO (Últimos 15 dias)
    const now = new Date();
    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(now.getDate() - 15);
    
    // Agrupar faturamento por dia (dd/mm)
    const revenueByDay = {};
    for (let i = 14; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const label = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
        revenueByDay[label] = 0;
    }

    state.deliveries.forEach(del => {
        const dDate = new Date(del.date);
        if (dDate >= fifteenDaysAgo) {
            const label = `${String(dDate.getDate()).padStart(2, '0')}/${String(dDate.getMonth() + 1).padStart(2, '0')}`;
            if (revenueByDay[label] !== undefined) {
                revenueByDay[label] += del.revenue || 0;
            }
        }
    });

    const revLabels = Object.keys(revenueByDay);
    const revData = Object.values(revenueByDay);

    // 2. DADOS DE PRODUTOS MAIS VENDIDOS (Geral)
    const productSales = {};
    state.products.forEach(p => productSales[p.name] = 0);

    state.deliveries.forEach(del => {
        if (!del.items) return;
        state.products.forEach(p => {
            const qtyFardo = del.items[p.id] || 0;
            const qtyUnit = del.items[p.id + "_unit"] || 0;
            // Somar pacotes equivalentes. (Se 1 fardo = 12 unidades, então 1 unidade = 1/12 fardo. Vamos somar em unidades totais ou fardos totais? Melhor unidades)
            const unitsPerPack = p.unitsPerPack || (p.type.includes('Gelo') ? 1 : 1);
            const totalUnits = (qtyFardo * unitsPerPack) + qtyUnit;
            if (totalUnits > 0) {
                productSales[p.name] += totalUnits;
            }
        });
    });

    // Filtrar produtos com vendas > 0
    const soldProducts = Object.keys(productSales).filter(k => productSales[k] > 0);
    const soldValues = soldProducts.map(k => productSales[k]);

    // Configuração de Cores Premium (Neon/Dark Theme)
    Chart.defaults.color = 'rgba(255, 255, 255, 0.7)';
    Chart.defaults.font.family = "'Inter', sans-serif";

    const gradientBlue = revCanvas.getContext('2d').createLinearGradient(0, 0, 0, 400);
    gradientBlue.addColorStop(0, 'rgba(0, 240, 255, 0.8)');
    gradientBlue.addColorStop(1, 'rgba(0, 114, 255, 0.2)');

    // Render Revenue Bar Chart
    window.myRevChart = new Chart(revCanvas, {
        type: 'bar',
        data: {
            labels: revLabels,
            datasets: [{
                label: 'Faturamento Diário (R$)',
                data: revData,
                backgroundColor: gradientBlue,
                borderRadius: 4,
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(10, 14, 23, 0.9)',
                    titleColor: '#00f0ff',
                    bodyColor: '#fff',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            return 'R$ ' + context.parsed.y.toLocaleString('pt-BR', {minimumFractionDigits: 2});
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: {
                        callback: function(value) { return 'R$ ' + value; }
                    }
                },
                x: {
                    grid: { display: false }
                }
            }
        }
    });

    // Render Products Doughnut Chart
    if (soldProducts.length > 0) {
        window.myProdChart = new Chart(prodCanvas, {
            type: 'doughnut',
            data: {
                labels: soldProducts,
                datasets: [{
                    data: soldValues,
                    backgroundColor: [
                        '#00f0ff',
                        '#ff0055',
                        '#00ffaa',
                        '#ffaa00',
                        '#aa00ff'
                    ],
                    borderWidth: 2,
                    borderColor: '#0a0e17'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            color: '#fff',
                            usePointStyle: true,
                            boxWidth: 8
                        }
                    }
                }
            }
        });
    } else {
        // Empty state for products
        const ctx = prodCanvas.getContext('2d');
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.font = "12px Inter";
        ctx.textAlign = "center";
        ctx.fillText("Sem vendas registradas", prodCanvas.width/2, prodCanvas.height/2);
    }
}

// Bind to window for HTML accessibility
window.renderDashboard = renderDashboard;
window.renderDashboardAlerts = renderDashboardAlerts;
window.renderDashboardChart = renderDashboardChart;
