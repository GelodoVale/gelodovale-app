// --- TELA 1: RENDERIZAÇÃO DO DASHBOARD E GRÁFICOS ---
import { state } from './state.js';
import { renderWidgets } from './widgets.js';
import { getWarrantyInfo } from './inventario.js';

// Variáveis privadas de módulo para os charts (evita vazamento global)
let _revChart = null;
let _prodChart = null;

export function renderDashboard() {
    // 1. Calcular indicadores KPIs
    const activeClientsCount = (state.clients || []).length;
    const activeFreezersCount = (state.clients || []).filter(c => c.freezerCode).length;
    
    // Faturamento e total de gelo no mês corrente
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    let totalKgMonth = 0;
    let totalRevenueMonth = 0;
    
    (state.deliveries || []).forEach(del => {
        const delDate = del.date ? new Date(del.date) : null;
        if (delDate && !isNaN(delDate) && delDate.getMonth() === currentMonth && delDate.getFullYear() === currentYear) {
            totalRevenueMonth += (del.revenue || 0);
            // Calcular kg
            if (del.items) {
                (state.products || []).forEach(p => {
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

    // Melhoria 1: Somar faturamento de documentos comerciais (recibos/notas) do mês
    (state.documents || []).forEach(doc => {
        if ((doc.type === 'recibo' || doc.type === 'nota') && doc.date) {
            const docDate = new Date(doc.date + 'T00:00:00');
            if (!isNaN(docDate) && docDate.getMonth() === currentMonth && docDate.getFullYear() === currentYear) {
                totalRevenueMonth += (parseFloat(doc.total) || 0);
            }
        }
    });

    const pendingOrdersCount = (state.orders || []).filter(o => o.status === "pending").length;
    const activeRentalsCount = state.rentals ? (state.rentals || []).filter(r => r.status === "active" || r.status === "overdue").length : 0;
    
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

    // 5. Renderizar Top Devedores do Carnê
    if (typeof window.renderTopDevedores === 'function') {
        window.renderTopDevedores();
        // Atualizar o badge de Top Devedores
        const topDevedoresCountEl = document.getElementById("top-devedores-count");
        if (topDevedoresCountEl) {
            const devedoresCount = (state.clients || []).filter(c => (parseFloat(c.outstandingDebt) || 0) > 0).length;
            topDevedoresCountEl.innerText = `${devedoresCount} Ativo${devedoresCount !== 1 ? 's' : ''}`;
        }
    }

    // 6. Renderizar Pré-Pedidos Agendados
    renderScheduledOrders();
}

export function renderDashboardAlerts() {
    const alertsContainer = document.getElementById("alerts-list-container");
    const alertCountBadge = document.getElementById("alert-count");
    if (!alertsContainer || !alertCountBadge) return;
    alertsContainer.innerHTML = "";
    
    // 1. Obter dados climáticos do estado para projetar a demanda
    const temp = (state.weatherConfig && state.weatherConfig.temp !== undefined) ? state.weatherConfig.temp : 24;
    const locationName = (state.weatherConfig && state.weatherConfig.city) || "São José dos Campos";
    
    let demandLevel = "Normal";
    let demandPct = 50;
    let demandColor = "#00f0ff"; // ciano
    let demandIcon = "thermometer";
    let demandDesc = "Consumo padrão de clima ameno. Mantenha as entregas preventivas no cronograma regular.";
    
    if (temp < 20) {
        demandLevel = "Baixa";
        demandPct = 25;
        demandColor = "var(--color-text-muted)";
        demandDesc = "Clima frio. O consumo cai cerca de 20%. Reduza a frequência de entregas preventivas para evitar acúmulos.";
        demandIcon = "thermometer-snowflake";
    } else if (temp >= 20 && temp <= 26) {
        demandLevel = "Normal";
        demandPct = 50;
        demandColor = "#00f0ff";
        demandDesc = "Consumo padrão estável. Condições climáticas ideais. Abasteça os freezers conforme planejado.";
        demandIcon = "thermometer";
    } else if (temp >= 27 && temp <= 31) {
        demandLevel = "Alta (Tempo Quente)";
        demandPct = 75;
        demandColor = "#ffb703"; // amarelo/laranja
        demandDesc = "Calor em alta! Aumento estimado de 30% a 50% nas vendas. Mantenha os freezers mais abastecidos.";
        demandIcon = "thermometer-sun";
    } else if (temp >= 32) {
        demandLevel = "Crítica (Onda de Calor)";
        demandPct = 100;
        demandColor = "#ff0055"; // neon pink
        demandDesc = "Calor extremo! Consumo projetado de +70% a +90%. Abasteça no máximo e planeje produção extra de emergência!";
        demandIcon = "zap";
    }

    let weatherSnippetHTML = `
        <div class="weather-demand-panel" style="margin-bottom: 1.25rem; padding: 14px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; box-shadow: inset 0 0 12px rgba(255,255,255,0.02);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <span style="font-size: 0.7rem; text-transform: uppercase; letter-spacing: 1.2px; color: var(--color-text-muted); font-weight: 700; display: inline-flex; align-items: center; gap: 4px;">
                    <i data-lucide="brain" style="width:14px; height:14px; color: ${demandColor};"></i> Inteligência de Demanda
                </span>
                <span style="font-size: 0.75rem; color: #fff; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;">
                    <i data-lucide="map-pin" style="width:12px; height:12px; opacity:0.6;"></i> ${locationName}: <strong>${temp}°C</strong>
                </span>
            </div>
            
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 10px;">
                <div style="width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; background: rgba(${temp >= 32 ? '255,0,85' : temp >= 27 ? '255,183,3' : '0,240,255'}, 0.1); border: 1px solid rgba(${temp >= 32 ? '255,0,85' : temp >= 27 ? '255,183,3' : '0,240,255'}, 0.25);">
                    <i data-lucide="${demandIcon}" style="width: 20px; height: 20px; color: ${demandColor};"></i>
                </div>
                <div>
                    <span style="font-size: 0.65rem; color: var(--color-text-muted); display: block; line-height: 1; margin-bottom: 3px;">Demanda Projetada</span>
                    <span style="font-size: 1rem; font-weight: 800; color: ${demandColor}; text-shadow: 0 0 10px rgba(${temp >= 32 ? '255,0,85' : temp >= 27 ? '255,183,3' : '0,240,255'}, 0.3);">${demandLevel}</span>
                </div>
            </div>

            <div class="progress-track" style="height: 6px; border-radius: 3px; background: rgba(255,255,255,0.06); margin-bottom: 8px; overflow: hidden; position: relative;">
                <div class="progress-fill" style="width: ${demandPct}%; height: 100%; border-radius: 3px; background: ${demandColor}; box-shadow: 0 0 8px ${demandColor}; transition: width 0.8s ease-out;"></div>
            </div>

            <p style="font-size: 0.72rem; line-height: 1.4; color: var(--color-text-muted); margin: 0; font-weight: 500;">${demandDesc}</p>
        </div>
    `;
    alertsContainer.innerHTML = weatherSnippetHTML;

    let alerts = [];
    
    (state.clients || []).forEach(client => {
        const threshold = (client.alertThreshold || 20) / 100;
        
        const geloProducts = (state.products || []).filter(p => p.active && (p.type === 'Gelo' || p.type === 'Gelo Saborizado'));
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
        alertsContainer.innerHTML += `
            <div class="empty-alerts" style="margin-top: 1rem;">
                <i data-lucide="check-circle" style="color: var(--color-success); margin-bottom: 0.5rem; width: 32px; height: 32px;"></i>
                <p>Todos os freezers abastecidos e saudáveis!</p>
            </div>
        `;
    } else {
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

    // Funcionalidade 3: Alertas de Garantia Expirando (< 30 dias)
    const today = new Date();
    const warrantyAlerts = (state.freezers || []).filter(f => {
        if (!f.purchaseDate || !f.warrantyMonths) return false;
        const purchaseDate = new Date(f.purchaseDate + 'T00:00:00');
        const expiryDate = new Date(purchaseDate);
        expiryDate.setMonth(purchaseDate.getMonth() + parseInt(f.warrantyMonths));
        const diffDays = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 30;
    });

    if (warrantyAlerts.length > 0) {
        alertsContainer.innerHTML += `
            <div style="margin-top: 1rem; padding: 10px; background: rgba(255,183,3,0.06); border: 1px solid rgba(255,183,3,0.2); border-radius: 8px;">
                <div style="font-size: 0.7rem; text-transform: uppercase; letter-spacing: 1px; color: #ffb703; font-weight: 700; margin-bottom: 8px; display: flex; align-items: center; gap: 4px;">
                    <i data-lucide="shield-alert" style="width:13px;height:13px;"></i> Garantias Vencendo em breve
                </div>
                ${warrantyAlerts.map(f => {
                    const purchaseDate = new Date(f.purchaseDate + 'T00:00:00');
                    const expiryDate = new Date(purchaseDate);
                    expiryDate.setMonth(purchaseDate.getMonth() + parseInt(f.warrantyMonths));
                    const diffDays = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
                    return `
                        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem; padding: 5px 0; border-bottom: 1px solid rgba(255,255,255,0.04);">
                            <span style="color: #fff; font-weight: 600;">${f.code}</span>
                            <span style="color: var(--color-text-muted);">${f.clientName || 'Fábrica'}</span>
                            <span style="color: #ffb703; font-weight: 700;">Vence em ${diffDays}d</span>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    // Funcionalidade 4: Alertas de Ativos Retidos/Atrasados ou Comodatos Pendentes
    const activeRentals = state.rentals || [];
    const activeComodatos = state.comodatos || [];
    const assetAlerts = [];
    
    activeRentals.forEach(r => {
        if (r.status !== "returned") {
            const expectedDate = new Date(r.expectedReturnDate + 'T00:00:00');
            const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const diffTime = expectedDate - todayDateOnly;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays < 0) {
                assetAlerts.push({
                    type: 'danger',
                    icon: 'truck',
                    title: `Tina Retida / Atrasada: ${r.tinaCode}`,
                    desc: `Cliente <strong>${r.clientName}</strong> está com a tina. Atrasado há ${Math.abs(diffDays)} dia(s) (Previsto: ${expectedDate.toLocaleDateString('pt-BR')}).`
                });
            } else if (diffDays <= 2) {
                let timeStr = diffDays === 0 ? "hoje" : `em ${diffDays} dia(s)`;
                assetAlerts.push({
                    type: 'warning',
                    icon: 'clock',
                    title: `Contrato de Tina Expirando: ${r.tinaCode}`,
                    desc: `Busca/devolução com <strong>${r.clientName}</strong> prevista para ${timeStr} (${expectedDate.toLocaleDateString('pt-BR')}).`
                });
            }
        }
    });

    activeComodatos.forEach(c => {
        if (c.status === "pendente") {
            assetAlerts.push({
                type: 'warning',
                icon: 'file-text',
                title: `Assinatura Pendente: Freezer ${c.freezerCode}`,
                desc: `Comodato com <strong>${c.clientName}</strong> aguardando assinatura eletrônica do contrato.`
            });
        }
        
        if (c.status !== "retirado") {
            const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            if (c.expectedReturnDate) {
                const expectedDate = new Date(c.expectedReturnDate + 'T00:00:00');
                const diffTime = expectedDate - todayDateOnly;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                if (diffDays < 0) {
                    assetAlerts.push({
                        type: 'danger',
                        icon: 'alert-circle',
                        title: `Comodato Vencido: Freezer ${c.freezerCode}`,
                        desc: `O prazo de comodato para <strong>${c.clientName}</strong> venceu em ${expectedDate.toLocaleDateString('pt-BR')} (atrasado há ${Math.abs(diffDays)} dias).`
                    });
                } else if (diffDays <= 30) {
                    assetAlerts.push({
                        type: 'warning',
                        icon: 'clock',
                        title: `Comodato a Vencer: Freezer ${c.freezerCode}`,
                        desc: `Contrato com <strong>${c.clientName}</strong> vence em ${diffDays} dias (${expectedDate.toLocaleDateString('pt-BR')}).`
                    });
                }
            } else {
                assetAlerts.push({
                    type: 'info',
                    icon: 'help-circle',
                    title: `Sem Previsão de Retorno: Freezer ${c.freezerCode}`,
                    desc: `Equipamento alocado para <strong>${c.clientName}</strong> sob contrato por prazo indeterminado (sem data de retorno definida).`
                });
            }
        }
    });

    // Alertas de Validade de Documentos do Cliente (CNH/RG <= 60 dias)
    (state.clients || []).forEach(client => {
        if (client.docExpiry) {
            const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const expiryDate = new Date(client.docExpiry + 'T00:00:00');
            const diffTime = expiryDate - todayDateOnly;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays < 0) {
                assetAlerts.push({
                    type: 'danger',
                    icon: 'file-x-2',
                    title: `Doc. Expirado: ${client.name}`,
                    desc: `O documento (CNH/RG) de identificação do cliente está expirado desde ${expiryDate.toLocaleDateString('pt-BR')}.`
                });
            } else if (diffDays <= 60) {
                assetAlerts.push({
                    type: 'warning',
                    icon: 'file-warning',
                    title: `Doc. Expirando: ${client.name}`,
                    desc: `O documento (CNH/RG) vence em ${diffDays} dias (${expiryDate.toLocaleDateString('pt-BR')}).`
                });
            }
        }
    });

    if (assetAlerts.length > 0) {
        alertsContainer.innerHTML += `
            <div style="margin-top: 1rem; padding: 10px; background: rgba(0, 240, 255, 0.04); border: 1px solid rgba(0, 240, 255, 0.15); border-radius: 8px;">
                <div style="font-size: 0.7rem; text-transform: uppercase; letter-spacing: 1px; color: var(--color-primary); font-weight: 700; margin-bottom: 8px; display: flex; align-items: center; gap: 4px;">
                    <i data-lucide="package" style="width:13px;height:13px;"></i> Alertas de Ativos & Comodatos
                </div>
                <div style="display:flex; flex-direction:column; gap:8px;">
                    ${assetAlerts.map(alert => {
                        const alertColor = alert.type === 'danger' ? '#ff4d4d' : alert.type === 'warning' ? '#f59e0b' : '#3b82f6';
                        return `
                            <div style="display: flex; gap: 8px; font-size: 0.75rem; padding: 6px; background: rgba(255,255,255,0.01); border-radius: 4px; border-left: 3px solid ${alertColor};">
                                <div style="color: ${alertColor}; display: flex; align-items: flex-start; padding-top: 2px;">
                                    <i data-lucide="${alert.icon}" style="width: 14px; height: 14px;"></i>
                                </div>
                                <div>
                                    <span style="color: #fff; font-weight: 700; display:block;">${alert.title}</span>
                                    <span style="color: var(--color-text-muted);">${alert.desc}</span>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    if (window.lucide) window.lucide.createIcons();
}

export async function renderDashboardChart() {
    const revCanvas = document.getElementById("revenueChart");
    const prodCanvas = document.getElementById("productsChart");
    
    if (!revCanvas || !prodCanvas) return;
    
    // Destroy existing charts (usar variáveis de módulo em vez de window.* para evitar leak)
    if (_revChart) { _revChart.destroy(); _revChart = null; }
    if (_prodChart) { _prodChart.destroy(); _prodChart = null; }
    // Compatibilidade retroativa
    if (window.myRevChart) { window.myRevChart.destroy(); window.myRevChart = null; }
    if (window.myProdChart) { window.myProdChart.destroy(); window.myProdChart = null; }

    // 1. DADOS DE FATURAMENTO (Últimos 15 dias)
    const now = new Date();
    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(now.getDate() - 15);
    
    const revenueByDay = {};
    const datesArray = [];
    const revLabels = [];
    
    for (let i = 14; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const label = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
        revenueByDay[label] = 0;
        revLabels.push(label);
        datesArray.push(d.toISOString().split('T')[0]); // YYYY-MM-DD
    }

    (state.deliveries || []).forEach(del => {
        const dDate = del.date ? new Date(del.date) : null;
        if (dDate && !isNaN(dDate) && dDate >= fifteenDaysAgo) {
            const label = `${String(dDate.getDate()).padStart(2, '0')}/${String(dDate.getMonth() + 1).padStart(2, '0')}`;
            if (revenueByDay[label] !== undefined) {
                revenueByDay[label] += del.revenue || 0;
            }
        }
    });

    const revData = Object.values(revenueByDay);

    // FETCH HISTORICAL TEMPERATURES
    const lat = (state.weatherConfig && state.weatherConfig.lat) || -23.1791;
    const lon = (state.weatherConfig && state.weatherConfig.lon) || -45.8872;
    
    let dateTempMap = {};
    let cacheKey = `temp_history_${now.toISOString().split('T')[0]}_${lat.toFixed(2)}_${lon.toFixed(2)}`;
    
    try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) dateTempMap = JSON.parse(cached);
    } catch(e) {}
    
    if (Object.keys(dateTempMap).length === 0 && navigator.onLine) {
        try {
            const tempRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max&past_days=15&timezone=auto`);
            if (tempRes.ok) {
                const tempData = await tempRes.json();
                if (tempData && tempData.daily && tempData.daily.time) {
                    for (let j = 0; j < tempData.daily.time.length; j++) {
                        dateTempMap[tempData.daily.time[j]] = tempData.daily.temperature_2m_max[j];
                    }
                    localStorage.setItem(cacheKey, JSON.stringify(dateTempMap));
                }
            }
        } catch(err) {
            console.warn("Erro ao buscar histórico de temperatura:", err);
        }
    }
    
    if (Object.keys(dateTempMap).length === 0) {
        datesArray.forEach(date => {
            const day = parseInt(date.split('-')[2]);
            const mockTemp = 24 + Math.sin(day) * 5 + (Math.random() - 0.5) * 3;
            dateTempMap[date] = parseFloat(mockTemp.toFixed(1));
        });
    }
    
    const tempData = datesArray.map(date => dateTempMap[date] || 25);

    // 2. DADOS DE PRODUTOS MAIS VENDIDOS (Geral)
    const productSales = {};
    (state.products || []).forEach(p => productSales[p.name] = 0);

    (state.deliveries || []).forEach(del => {
        if (!del.items) return;
        (state.products || []).forEach(p => {
            const qtyFardo = del.items[p.id] || 0;
            const qtyUnit = del.items[p.id + "_unit"] || 0;
            const unitsPerPack = p.unitsPerPack || 1;
            const totalUnits = (qtyFardo * unitsPerPack) + qtyUnit;
            if (totalUnits > 0) {
                productSales[p.name] += totalUnits;
            }
        });
    });

    const soldProducts = Object.keys(productSales).filter(k => productSales[k] > 0);
    const soldValues = soldProducts.map(k => productSales[k]);

    // Configuração de Cores Premium (Neon/Dark Theme)
    Chart.defaults.color = 'rgba(255, 255, 255, 0.7)';
    Chart.defaults.font.family = "'Inter', sans-serif";

    const gradientBlue = revCanvas.getContext('2d').createLinearGradient(0, 0, 0, 400);
    gradientBlue.addColorStop(0, 'rgba(0, 240, 255, 0.8)');
    gradientBlue.addColorStop(1, 'rgba(0, 114, 255, 0.2)');

    // Render Revenue Bar & Line Chart
    _revChart = new Chart(revCanvas, {
        data: {
            labels: revLabels,
            datasets: [
                {
                    type: 'bar',
                    label: 'Faturamento Diário (R$)',
                    data: revData,
                    backgroundColor: gradientBlue,
                    borderRadius: 4,
                    yAxisID: 'y',
                    order: 2
                },
                {
                    type: 'line',
                    label: 'Temp. Máxima (°C)',
                    data: tempData,
                    borderColor: '#ff5e00',
                    backgroundColor: 'rgba(255, 94, 0, 0.1)',
                    borderWidth: 2,
                    tension: 0.3,
                    pointBackgroundColor: '#ff5e00',
                    yAxisID: 'y1',
                    order: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    labels: { color: '#fff', boxWidth: 12 }
                },
                tooltip: {
                    backgroundColor: 'rgba(10, 14, 23, 0.9)',
                    titleColor: '#00f0ff',
                    bodyColor: '#fff',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            if (context.dataset.type === 'bar') {
                                return 'Faturamento: R$ ' + context.parsed.y.toLocaleString('pt-BR', {minimumFractionDigits: 2});
                            } else {
                                return 'Temp. Máxima: ' + context.parsed.y + '°C';
                            }
                        }
                    }
                }
            },
            scales: {
                y: {
                    type: 'linear',
                    position: 'left',
                    beginAtZero: true,
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: {
                        callback: function(value) { return 'R$ ' + value; }
                    }
                },
                y1: {
                    type: 'linear',
                    position: 'right',
                    grid: { drawOnChartArea: false },
                    ticks: {
                        callback: function(value) { return value + '°C'; }
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
        _prodChart = new Chart(prodCanvas, {
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
        const ctx = prodCanvas.getContext('2d');
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.font = "12px Inter";
        ctx.textAlign = "center";
        ctx.fillText("Sem vendas registradas", prodCanvas.width/2, prodCanvas.height/2);
    }
}

export function quickAction(type) {
    if (type === 'nova-entrega') {
        if (window.openOrderModal) window.openOrderModal();
    } else if (type === 'novo-contrato') {
        if (window.openNewComodatoModal) window.openNewComodatoModal();
    } else if (type === 'novo-freezer') {
        if (window.openFreezerModal) window.openFreezerModal();
    } else if (type === 'novo-recibo') {
        if (window.openDocModal) window.openDocModal();
    }
}

export function renderScheduledOrders() {
    const container = document.getElementById("scheduled-orders-list");
    const badge = document.getElementById("scheduled-orders-count");
    if (!container) return;

    const scheduled = (state.orders || []).filter(o => o.scheduledDate);
    if (badge) badge.innerText = `${scheduled.length} Agendado${scheduled.length !== 1 ? 's' : ''}`;

    if (scheduled.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding: 20px; color: var(--color-text-muted); font-size: 0.8rem;">
                🕐 Nenhum pré-pedido ou agendamento para os próximos dias.
            </div>
        `;
        return;
    }

    // Ordenar por data de agendamento
    scheduled.sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate));

    container.innerHTML = scheduled.map(order => {
        const client = (state.clients || []).find(c => c.id === order.clientId) || { name: 'Cliente desconhecido' };
        const dueDate = new Date(order.scheduledDate + 'T00:00:00');
        const dueFmt = dueDate.toLocaleDateString('pt-BR');
        const today = new Date();
        today.setHours(0,0,0,0);
        
        let dateColor = '#818cf8'; // indigo
        let warningText = '';
        
        if (dueDate < today) {
            dateColor = '#ef4444'; // atrasado
            warningText = ' (Atrasado!)';
        } else if (dueDate.getTime() === today.getTime()) {
            dateColor = '#f59e0b'; // hoje
            warningText = ' (Entregar hoje!)';
        }

        // Descrição resumida dos itens
        const itemsDesc = Object.keys(order.items).map(key => {
            const p = (state.products || []).find(prod => prod.id === key.replace('_unit', ''));
            if (!p) return '';
            const qty = order.items[key];
            const unitType = key.endsWith('_unit') ? 'unidades' : 'fardos';
            return `${qty} ${unitType} de ${p.name}`;
        }).filter(Boolean).join(', ');

        return `
            <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 10px 12px; display: flex; flex-direction: column; gap: 6px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
                    <div>
                        <h4 style="font-size: 0.82rem; font-weight: 700; color: #fff; margin: 0;">${client.name}</h4>
                        <p style="font-size: 0.75rem; color: var(--color-text-muted); margin: 2px 0 0 0;">${itemsDesc || 'Nenhum item informado'}</p>
                    </div>
                    <div style="text-align: right; flex-shrink: 0;">
                        <span style="font-size: 0.72rem; font-weight: 700; color: ${dateColor};">${dueFmt}${warningText}</span>
                    </div>
                </div>
                ${order.scheduledNote ? `
                    <div style="font-size: 0.72rem; background: rgba(0, 240, 255, 0.05); border-left: 2px solid var(--color-primary); padding: 4px 8px; border-radius: 0 4px 4px 0; color: var(--color-text-main);">
                        <strong>Obs:</strong> ${order.scheduledNote}
                    </div>
                ` : ''}
                <div style="display: flex; gap: 6px; margin-top: 2px; justify-content: flex-end;">
                    <button onclick="window.confirmScheduledDelivery('${order.id}')" style="padding: 4px 8px; font-size: 0.7rem; background: rgba(0, 240, 255, 0.15); border: 1px solid var(--color-primary); color: var(--color-primary); border-radius: 4px; cursor: pointer; font-weight: 700;">Despachar Agora</button>
                    <button onclick="window.cancelScheduledOrder('${order.id}')" style="padding: 4px 8px; font-size: 0.7rem; background: transparent; border: 1px solid rgba(239, 68, 68, 0.3); color: #ef4444; border-radius: 4px; cursor: pointer;">Cancelar</button>
                </div>
            </div>
        `;
    }).join('');
}

// Bind to window for HTML accessibility
window.renderDashboard = renderDashboard;
window.renderDashboardAlerts = renderDashboardAlerts;
window.renderDashboardChart = renderDashboardChart;
window.quickAction = quickAction;
window.renderScheduledOrders = renderScheduledOrders;
