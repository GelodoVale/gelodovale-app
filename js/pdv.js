// --- LOGICA DO MODO BALCÃO / PDV RAPIDO ---
import { state, saveState } from './state.js';
import { getBrazilTimeISO } from './utils.js';
import { syncDeliveryCarnetEntry } from './carne.js';

// Estado local do carrinho do PDV
let pdvCart = [];

/**
 * Inicializa a tela de PDV (chamado no boot da app)
 */
export function initPDV() {
    pdvCart = [];
    populatePDVClients();
    renderPDVCatalog();
    renderPDVCart();
    
    // Configurar método de pagamento padrão e detalhes de troco
    const paymentSelect = document.getElementById("pdv-payment-method");
    if (paymentSelect) {
        paymentSelect.value = "Pix";
    }
    togglePDVPaymentDetails();
}

/**
 * Popula o select de clientes do PDV
 */
export function populatePDVClients() {
    const clientSelect = document.getElementById("pdv-client-id");
    if (!clientSelect) return;
    
    // Salvar valor atual para não resetar seleção a toa
    const currentVal = clientSelect.value;
    
    // Limpar opções mantendo apenas o consumidor final
    clientSelect.innerHTML = '<option value="">-- Consumidor Final (Balcão) --</option>';
    
    const sortedClients = [...(state.clients || [])].sort((a, b) => 
        (a.name || '').localeCompare(b.name || '')
    );
    
    sortedClients.forEach(c => {
        const debt = parseFloat(c.outstandingDebt) || 0;
        const debtLabel = debt > 0 ? ` ⚠️ Devedor (R$ ${debt.toFixed(2).replace('.', ',')})` : '';
        clientSelect.innerHTML += `<option value="${c.id}">${c.name}${debtLabel}</option>`;
    });
    
    // Restaurar valor se ele ainda existir
    if (currentVal && sortedClients.some(c => c.id === currentVal)) {
        clientSelect.value = currentVal;
    }

    // Listener de inadimplência ao trocar cliente
    if (!clientSelect.dataset.debtListenerAdded) {
        clientSelect.dataset.debtListenerAdded = 'true';
        clientSelect.addEventListener('change', () => {
            const debtWarning = document.getElementById('pdv-debt-warning');
            if (!debtWarning) return;
            const selClient = (state.clients || []).find(c => c.id === clientSelect.value);
            const debt = selClient ? parseFloat(selClient.outstandingDebt) || 0 : 0;
            if (debt > 0) {
                debtWarning.style.display = 'flex';
                debtWarning.innerHTML = `<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><path d='m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3'/><path d='M12 9v4'/><path d='M12 17h.01'/></svg> <strong>⚠️ Cliente Inadimplente!</strong> Débito pendente: <strong>R$ ${debt.toFixed(2).replace('.', ',')}</strong>. Confirme o recebimento antes de prosseguir.`;
            } else {
                debtWarning.style.display = 'none';
            }
        });
    }
}

/**
 * Renderiza o catálogo de produtos no grid lateral
 */
export function renderPDVCatalog() {
    const catalogGrid = document.getElementById("pdv-catalog-grid");
    if (!catalogGrid) return;
    catalogGrid.innerHTML = "";
    
    // Obter cliente selecionado para carregar preços personalizados se houver
    const clientId = document.getElementById("pdv-client-id") ? document.getElementById("pdv-client-id").value : "";
    const client = clientId ? (state.clients || []).find(c => c.id === clientId) : { customPrices: {} };
    
    const activeProducts = (state.products || []).filter(p => 
        p.active && (p.type === 'Gelo' || p.type === 'Carvão' || p.type === 'Gelo Saborizado')
    );
    
    if (activeProducts.length === 0) {
        catalogGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; color: var(--color-text-muted); padding: 20px;">
                Nenhum produto ativo cadastrado.
            </div>
        `;
        return;
    }
    
    activeProducts.forEach(p => {
        // Ícone ou emoji dependendo do tipo de produto
        const emoji = window.getProductEmoji ? window.getProductEmoji(p) : "❄️";
        
        // Calcular preço baseado nas regras de cliente e promoção
        let priceFardo = p.defaultPrice || 0;
        let priceUnit = p.unitPrice || 0;
        
        if (window.calculateProductRevenue && client) {
            const calcFardo = window.calculateProductRevenue(client, p, 1, 0);
            priceFardo = calcFardo.totalRevenue;
            
            const calcUnit = window.calculateProductRevenue(client, p, 0, 1);
            priceUnit = calcUnit.totalRevenue;
        }
        
        const isSaborizado = p.type === "Gelo Saborizado" || (p.unitsPerPack && p.unitsPerPack > 1);
        
        const card = document.createElement("div");
        card.style.cssText = `
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 8px;
            padding: 10px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            align-items: center;
            gap: 6px;
            text-align: center;
            transition: all 0.2s ease;
        `;
        
        card.addEventListener("mouseenter", () => {
            card.style.background = "rgba(255, 255, 255, 0.04)";
            card.style.borderColor = "var(--color-primary)";
            card.style.boxShadow = "0 0 8px rgba(var(--color-primary-rgb), 0.15)";
        });
        
        card.addEventListener("mouseleave", () => {
            card.style.background = "rgba(255, 255, 255, 0.02)";
            card.style.borderColor = "rgba(255, 255, 255, 0.05)";
            card.style.boxShadow = "none";
        });
        
        let priceHTML = `
            <div style="font-size: 0.85rem; font-weight: bold; color: var(--color-primary);">
                Fardo: R$ ${priceFardo.toFixed(2)}
            </div>
        `;
        if (isSaborizado) {
            priceHTML += `
                <div style="font-size: 0.75rem; color: var(--color-text-muted);">
                    Unid: R$ ${priceUnit.toFixed(2)}
                </div>
            `;
        }
        
        let buttonsHTML = `
            <button type="button" class="btn btn-primary" onclick="addToPDVCart('${p.id}', false)" style="width: 100%; font-size: 0.75rem; padding: 4px 6px; height: auto; border: none; background: linear-gradient(135deg, var(--color-primary), var(--color-secondary)); font-weight: 600;">
                + Fardo
            </button>
        `;
        
        if (isSaborizado) {
            buttonsHTML = `
                <div style="display: flex; gap: 4px; width: 100%;">
                    <button type="button" class="btn btn-primary" onclick="addToPDVCart('${p.id}', false)" style="flex: 1; font-size: 0.7rem; padding: 4px 2px; height: auto; border: none; background: linear-gradient(135deg, var(--color-primary), var(--color-secondary)); font-weight: 600;">
                        + Fardo
                    </button>
                    <button type="button" class="btn btn-secondary" onclick="addToPDVCart('${p.id}', true)" style="flex: 1; font-size: 0.7rem; padding: 4px 2px; height: auto; border-color: rgba(255,255,255,0.1); color: #fff; font-weight: 600;">
                        + Unid.
                    </button>
                </div>
            `;
        }
        
        card.innerHTML = `
            <div style="font-size: 1.5rem; line-height: 1;">${emoji}</div>
            <div style="font-size: 0.75rem; font-weight: 600; color: #fff; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; height: 26px; line-height: 1.2;">
                ${p.name}
            </div>
            ${priceHTML}
            ${buttonsHTML}
        `;
        
        catalogGrid.appendChild(card);
    });
}

/**
 * Adiciona um item ao carrinho do PDV
 * @param {string} productId 
 * @param {boolean} isUnit 
 */
export function addToPDVCart(productId, isUnit) {
    if (window.playSound) window.playSound('tap');
    if (window.triggerHaptic) window.triggerHaptic('tap');

    const product = (state.products || []).find(p => p.id === productId);
    if (!product) return;
    
    const existing = pdvCart.find(item => item.productId === productId && item.isUnit === isUnit);
    if (existing) {
        existing.qty++;
    } else {
        pdvCart.push({
            productId: productId,
            isUnit: isUnit,
            qty: 1
        });
    }
    
    renderPDVCart();
}

/**
 * Remove ou atualiza a quantidade de um item no carrinho
 */
export function updatePDVCartQty(productId, isUnit, newQty) {
    if (window.playSound) window.playSound('tap');
    if (window.triggerHaptic) window.triggerHaptic('tap');

    const idx = pdvCart.findIndex(item => item.productId === productId && item.isUnit === isUnit);
    if (idx === -1) return;
    
    if (newQty <= 0) {
        pdvCart.splice(idx, 1);
    } else {
        pdvCart[idx].qty = newQty;
    }
    
    renderPDVCart();
}

/**
 * Remove um item completamente do carrinho
 */
export function removeFromPDVCart(productId, isUnit) {
    if (window.playSound) window.playSound('warning');
    if (window.triggerHaptic) window.triggerHaptic('warning');

    pdvCart = pdvCart.filter(item => !(item.productId === productId && item.isUnit === isUnit));
    renderPDVCart();
}

/**
 * Limpa o carrinho de compras do PDV
 */
export function clearPDVCart() {
    if (window.playSound) window.playSound('warning');
    if (window.triggerHaptic) window.triggerHaptic('warning');

    pdvCart = [];
    renderPDVCart();
}

/**
 * Renderiza o carrinho de compras e atualiza os totais
 */
export function renderPDVCart() {
    const tbody = document.getElementById("pdv-cart-tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    
    const clientId = document.getElementById("pdv-client-id") ? document.getElementById("pdv-client-id").value : "";
    const client = clientId ? (state.clients || []).find(c => c.id === clientId) : { customPrices: {} };
    
    let totalItems = 0;
    let totalRevenue = 0;
    
    if (pdvCart.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; color: var(--color-text-muted); padding: 20px;">
                    Carrinho vazio. Adicione produtos no catálogo lateral.
                </td>
            </tr>
        `;
        
        document.getElementById("pdv-total-items-qty").textContent = "0 itens";
        document.getElementById("pdv-total-price").textContent = "R$ 0,00";
        calculatePDVChange();
        return;
    }
    
    pdvCart.forEach(item => {
        const p = (state.products || []).find(prod => prod.id === item.productId);
        if (!p) return;
        
        // Calcular preço unitário baseado no tipo
        let price = 0;
        if (window.calculateProductRevenue && client) {
            if (item.isUnit) {
                price = window.calculateProductRevenue(client, p, 0, 1).totalRevenue;
            } else {
                price = window.calculateProductRevenue(client, p, 1, 0).totalRevenue;
            }
        } else {
            price = item.isUnit ? (p.unitPrice || 0) : (p.defaultPrice || 0);
        }
        
        const subtotal = price * item.qty;
        totalRevenue += subtotal;
        totalItems += item.qty;
        
        const label = item.isUnit ? " (Unidade)" : " (Fardo)";
        
        tbody.innerHTML += `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);">
                <td style="padding: 8px 6px; color: #fff;">
                    <strong>${p.name}</strong><span style="font-size: 0.7rem; color: var(--color-text-muted);">${label}</span>
                </td>
                <td style="padding: 8px 6px; text-align: center;">
                    <div style="display: inline-flex; align-items: center; gap: 4px;">
                        <button type="button" class="btn btn-secondary" onclick="updatePDVCartQty('${p.id}', ${item.isUnit}, ${item.qty - 1})" style="width: 20px; height: 20px; min-width: 20px; padding: 0; display: inline-flex; align-items: center; justify-content: center; font-size: 0.75rem; border-color: rgba(255,255,255,0.1); background: rgba(255,255,255,0.02); height: 20px;">-</button>
                        <span style="width: 22px; display: inline-block; font-weight: bold; text-align: center; font-size: 0.8rem;">${item.qty}</span>
                        <button type="button" class="btn btn-secondary" onclick="updatePDVCartQty('${p.id}', ${item.isUnit}, ${item.qty + 1})" style="width: 20px; height: 20px; min-width: 20px; padding: 0; display: inline-flex; align-items: center; justify-content: center; font-size: 0.75rem; border-color: rgba(255,255,255,0.1); background: rgba(255,255,255,0.02); height: 20px;">+</button>
                    </div>
                </td>
                <td style="padding: 8px 6px; text-align: right; color: var(--color-text-muted);">
                    R$ ${price.toFixed(2)}
                </td>
                <td style="padding: 8px 6px; text-align: right; font-weight: 600; color: #fff;">
                    R$ ${subtotal.toFixed(2)}
                </td>
                <td style="padding: 8px 6px; text-align: center;">
                    <button type="button" class="btn btn-secondary" onclick="removeFromPDVCart('${p.id}', ${item.isUnit})" style="border: none; padding: 4px; background: transparent; color: #ef4444; height: auto;" title="Remover item">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                    </button>
                </td>
            </tr>
        `;
    });
    
    document.getElementById("pdv-total-items-qty").textContent = `${totalItems} item${totalItems > 1 ? 's' : ''}`;
    document.getElementById("pdv-total-price").textContent = `R$ ${totalRevenue.toFixed(2)}`;
    
    calculatePDVChange();
}

/**
 * Calcula o troco para pagamentos em dinheiro
 */
export function calculatePDVChange() {
    const changeEl = document.getElementById("pdv-cash-change");
    if (!changeEl) return;
    
    const cashInput = document.getElementById("pdv-cash-received");
    const totalText = document.getElementById("pdv-total-price") ? document.getElementById("pdv-total-price").textContent : "R$ 0,00";
    const totalVal = parseFloat(totalText.replace("R$", "").replace(",", ".").trim()) || 0;
    
    const cashVal = cashInput ? parseFloat(cashInput.value) || 0 : 0;
    
    if (cashVal >= totalVal && totalVal > 0) {
        const change = cashVal - totalVal;
        changeEl.textContent = `R$ ${change.toFixed(2).replace(".", ",")}`;
    } else {
        changeEl.textContent = "R$ 0,00";
    }
}

/**
 * Exibe ou esconde detalhes de troco para dinheiro
 */
export function togglePDVPaymentDetails() {
    const methodSelect = document.getElementById("pdv-payment-method");
    const cashDetails = document.getElementById("pdv-cash-details");
    if (!methodSelect || !cashDetails) return;
    
    if (methodSelect.value === "Dinheiro") {
        cashDetails.style.display = "flex";
        calculatePDVChange();
    } else {
        cashDetails.style.display = "none";
    }
}

/**
 * Atualiza preços ao mudar cliente
 */
export function updatePDVClientPricing() {
    renderPDVCatalog();
    renderPDVCart();
}

/**
 * Conclui a venda no PDV
 */
export function checkoutPDVSale() {
    if (pdvCart.length === 0) {
        if (window.showToast) window.showToast("O carrinho está vazio. Adicione pelo menos um item.", "warning");
        return;
    }
    
    const clientId = document.getElementById("pdv-client-id") ? document.getElementById("pdv-client-id").value : "";
    const client = clientId ? (state.clients || []).find(c => c.id === clientId) : null;
    const clientName = client ? client.name : "Consumidor Final (Balcão)";
    
    const paymentMethod = document.getElementById("pdv-payment-method") ? document.getElementById("pdv-payment-method").value : "Pix";
    
    // Obter valor total
    const totalText = document.getElementById("pdv-total-price") ? document.getElementById("pdv-total-price").textContent : "R$ 0,00";
    const totalVal = parseFloat(totalText.replace("R$", "").replace(",", ".").trim()) || 0;
    
    // Construir lista de itens no formato de entregas
    const items = {};
    pdvCart.forEach(item => {
        const key = item.isUnit ? `${item.productId}_unit` : item.productId;
        items[key] = (items[key] || 0) + item.qty;
    });
    
    // Validar cliente para pagamento A Prazo
    if (paymentMethod === "A Prazo" && !client) {
        if (window.showToast) window.showToast("Vendas a prazo requerem a seleção de um cliente cadastrado.", "warning");
        return;
    }
    
    // Validar troco se pago em dinheiro
    if (paymentMethod === "Dinheiro") {
        const cashInput = document.getElementById("pdv-cash-received");
        const cashVal = cashInput ? parseFloat(cashInput.value) || 0 : 0;
        if (cashVal < totalVal) {
            if (window.showToast) window.showToast("Valor recebido é menor que o total do pedido.", "error");
            return;
        }
    }
    
    // Realizar baixas de embalagens no estoque da fábrica
    pdvCart.forEach(item => {
        if (window.deductPackagingStock) {
            const qtyFardos = item.isUnit ? 0 : item.qty;
            const qtyUnits = item.isUnit ? item.qty : 0;
            window.deductPackagingStock(item.productId, qtyFardos, qtyUnits, "Venda PDV Balcão");
        }
    });
    
    // Gerar registro de entrega (venda concluída)
    const deliveryId = "d-" + Date.now();
    const newDelivery = {
        id: deliveryId,
        clientId: clientId || "c-balcao",
        clientName: clientName,
        date: getBrazilTimeISO(),
        items: items,
        revenue: totalVal,
        paymentMethod: paymentMethod,
        gps: null,
        lotNumber: "PDV-" + Date.now().toString().slice(-6),
        exchangeQty: 0,
        temperature: (state.weatherConfig && state.weatherConfig.temp) !== undefined ? state.weatherConfig.temp : 24
    };
    
    if (!state.deliveries) state.deliveries = [];
    state.deliveries.push(newDelivery);
    
    // Se selecionado cliente e pago "A Prazo", sincroniza a parcela no carnê
    if (client) {
        syncDeliveryCarnetEntry(newDelivery);
    }
    
    saveState();
    
    // Trigger interactive sensory effects
    if (window.playSound) window.playSound('cashRegister');
    if (window.triggerConfetti) window.triggerConfetti(items);
    if (window.triggerHaptic) window.triggerHaptic('success');
    
    // Exibir comprovante rápido pós-venda com WhatsApp e impressão térmica
    sharePDVSaleWhatsApp(newDelivery, client);

    // Se for pagamento via PIX, abrir o QR Code estático local para escanear imediatamente no balcão
    if (paymentMethod === "Pix" && window.showLocalPixModal) {
        window.showLocalPixModal(clientName, totalVal);
    }

    // Resetar carrinho e atualizar interface
    initPDV();
    if (window.renderApp) window.renderApp();
}

/**
 * Exibe o painel de comprovante pós-venda no PDV com opções de WhatsApp e impressão
 */
export function sharePDVSaleWhatsApp(delivery, client) {
    // Montar texto do comprovante
    const items = delivery.items || {};
    const productLines = Object.entries(items).map(([key, qty]) => {
        const isUnit = key.endsWith('_unit');
        const productId = isUnit ? key.replace('_unit', '') : key;
        const product = (state.products || []).find(p => p.id === productId);
        const productName = product ? product.name : productId;
        const label = isUnit ? 'un.' : 'fardo(s)';
        return `${qty}x ${productName} (${label})`;
    });

    const dateStr = new Date().toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

    const whatsappText =
        `📊 *Comprovante de Venda - Gelo do Vale*\n` +
        `Data: ${dateStr}\n` +
        `Cliente: ${delivery.clientName}\n` +
        `Itens: ${productLines.join(', ')}\n` +
        `*Total: R$ ${(delivery.revenue || 0).toFixed(2).replace('.', ',')}*\n` +
        `Pagamento: ${delivery.paymentMethod}\n\n` +
        `✅ Obrigado pela preferência!`;

    // Mostrar painel de pós-venda no PDV
    const panel = document.getElementById('pdv-postsale-panel');
    if (panel) {
        const cleanPhone = client ? (client.phone || client.whatsapp || '').replace(/\D/g, '') : '';
        const phoneWithDDI = (cleanPhone.length === 10 || cleanPhone.length === 11) ? '55' + cleanPhone : cleanPhone;
        const waUrl = phoneWithDDI
            ? `https://api.whatsapp.com/send?phone=${phoneWithDDI}&text=${encodeURIComponent(whatsappText)}`
            : `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappText)}`;

        panel.innerHTML = `
            <div style="background: rgba(16,185,129,0.08); border: 1px solid rgba(16,185,129,0.3); border-radius: 10px; padding: 14px 16px; margin-bottom: 1rem;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px;">
                    <svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='#10b981' stroke-width='2.5'><path d='M22 11.08V12a10 10 0 1 1-5.93-9.14'/><polyline points='22 4 12 14.01 9 11.01'/></svg>
                    <strong style="color: #10b981; font-size: 0.9rem;">Venda Finalizada com Sucesso!</strong>
                </div>
                <p style="font-size: 0.78rem; color: var(--color-text-muted); margin: 0 0 10px;">Total: <strong style="color:#fff;">R$ ${(delivery.revenue || 0).toFixed(2).replace('.', ',')}</strong> • ${delivery.paymentMethod}</p>
                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                    <a href="${waUrl}" target="_blank" style="flex: 1; min-width: 120px; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 8px 12px; background: #25D366; color: #fff; border-radius: 7px; text-decoration: none; font-size: 0.8rem; font-weight: 700;">
                        <svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='currentColor'><path d='M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z'/></svg>
                        Enviar Comprovante
                    </a>
                    ${window.printThermalReceipt ? `<button type="button" onclick="printThermalReceipt('${delivery.id}')" style="flex: 1; min-width: 120px; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 8px 12px; background: rgba(255,255,255,0.06); color: #fff; border: 1px solid rgba(255,255,255,0.12); border-radius: 7px; font-size: 0.8rem; font-weight: 600; cursor: pointer;">
                        <svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'><polyline points='6 9 6 2 18 2 18 9'/><path d='M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2'/><rect width='12' height='8' x='6' y='14'/></svg>
                        Imprimir Cupom
                    </button>` : ''}
                </div>
            </div>
        `;
        panel.style.display = 'block';
        setTimeout(() => { panel.style.display = 'none'; panel.innerHTML = ''; }, 30000);
    } else {
        // Fallback: abrir WhatsApp diretamente se painel não existir
        if (client && navigator.onLine) {
            const cleanPhone = (client.phone || client.whatsapp || '').replace(/\D/g, '');
            const phoneWithDDI = (cleanPhone.length === 10 || cleanPhone.length === 11) ? '55' + cleanPhone : cleanPhone;
            if (phoneWithDDI) {
                window.open(`https://api.whatsapp.com/send?phone=${phoneWithDDI}&text=${encodeURIComponent(whatsappText)}`, '_blank');
            }
        }
    }
}

// Vincula funções ao window para serem invocadas pelos elementos do HTML
window.initPDV = initPDV;
window.populatePDVClients = populatePDVClients;
window.renderPDVCatalog = renderPDVCatalog;
window.addToPDVCart = addToPDVCart;
window.updatePDVCartQty = updatePDVCartQty;
window.removeFromPDVCart = removeFromPDVCart;
window.clearPDVCart = clearPDVCart;
window.renderPDVCart = renderPDVCart;
window.calculatePDVChange = calculatePDVChange;
window.togglePDVPaymentDetails = togglePDVPaymentDetails;
window.updatePDVClientPricing = updatePDVClientPricing;
window.checkoutPDVSale = checkoutPDVSale;
window.sharePDVSaleWhatsApp = sharePDVSaleWhatsApp;
