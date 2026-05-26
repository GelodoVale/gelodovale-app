// --- TELA 1: RENDERIZAÇÃO DO DASHBOARD E GRÁFICOS ---
import { state } from './state.js';

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
    const chartContainer = document.getElementById("dashboard-chart");
    if (!chartContainer) return;
    chartContainer.innerHTML = "";
    
    // Obter últimas 7 entregas
    const recentDeliveries = [...state.deliveries]
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(-7);
        
    if (recentDeliveries.length === 0) {
        chartContainer.innerHTML = `
            <div class="empty-state">
                <i data-lucide="bar-chart-2"></i>
                <p>Nenhuma entrega registrada para gerar gráfico.</p>
            </div>
        `;
        if (window.lucide) lucide.createIcons();
        return;
    }
    
    // Dados para desenhar
    const labels = recentDeliveries.map(d => {
        const dateObj = new Date(d.date);
        return `${dateObj.getDate()}/${dateObj.getMonth() + 1}`;
    });
    
    // Vamos mapear o faturamento como o valor do gráfico
    const values = recentDeliveries.map(d => d.revenue);
    const maxValue = Math.max(...values, 100); // Evitar divisão por zero e dar teto
    
    // Construir SVG
    const width = 500;
    const height = 220;
    const paddingLeft = 45;
    const paddingRight = 15;
    const paddingTop = 20;
    const paddingBottom = 30;
    
    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;
    const barWidth = (chartWidth / values.length) * 0.6;
    const barSpacing = (chartWidth / values.length) * 0.4;
    
    let svgContent = `
        <svg class="chart-svg" viewBox="0 0 ${width} ${height}">
            <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#00f0ff" />
                    <stop offset="100%" stop-color="#0072ff" stop-opacity="0.3" />
                </linearGradient>
                <linearGradient id="barGradHover" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#00f0ff" />
                    <stop offset="100%" stop-color="#00f0ff" stop-opacity="0.6" />
                </linearGradient>
            </defs>
            
            <!-- Linhas de grade horizontais -->
            <line x1="${paddingLeft}" y1="${paddingTop}" x2="${width - paddingRight}" y2="${paddingTop}" class="chart-grid-line" />
            <line x1="${paddingLeft}" y1="${paddingTop + chartHeight / 2}" x2="${width - paddingRight}" y2="${paddingTop + chartHeight / 2}" class="chart-grid-line" />
            <line x1="${paddingLeft}" y1="${paddingTop + chartHeight}" x2="${width - paddingRight}" y2="${paddingTop + chartHeight}" class="chart-axis-line" />
            
            <!-- Eixo X Labels (Datas) e Barras -->
    `;
    
    // Adicionar labels Y
    svgContent += `
        <text x="${paddingLeft - 10}" y="${paddingTop + 4}" class="chart-text" text-anchor="end">R$${Math.round(maxValue)}</text>
        <text x="${paddingLeft - 10}" y="${paddingTop + chartHeight / 2 + 4}" class="chart-text" text-anchor="end">R$${Math.round(maxValue / 2)}</text>
        <text x="${paddingLeft - 10}" y="${paddingTop + chartHeight + 4}" class="chart-text" text-anchor="end">R$0</text>
    `;
    
    for (let i = 0; i < values.length; i++) {
        const val = values[i];
        const barHeight = (val / maxValue) * chartHeight;
        const x = paddingLeft + (i * (barWidth + barSpacing)) + barSpacing / 2;
        const y = paddingTop + chartHeight - barHeight;
        
        // Barra
        svgContent += `
            <rect class="chart-bar" x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" />
            <!-- Valor acima da barra ao passar mouse (ou permanente simples) -->
            <text x="${x + barWidth / 2}" y="${y - 6}" class="chart-text" text-anchor="middle" font-size="9" fill="#fff">R$${Math.round(val)}</text>
        `;
        
        // Eixo X
        svgContent += `
            <text x="${x + barWidth / 2}" y="${paddingTop + chartHeight + 18}" class="chart-text" text-anchor="middle">${labels[i]}</text>
        `;
    }
    
    svgContent += `</svg>`;
    
    chartContainer.innerHTML = svgContent;
    if (window.lucide) lucide.createIcons();
}

// Bind to window for HTML accessibility
window.renderDashboard = renderDashboard;
window.renderDashboardAlerts = renderDashboardAlerts;
window.renderDashboardChart = renderDashboardChart;
