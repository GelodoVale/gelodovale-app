import { state, saveState, FACTORY_INFO, currentPrintDocId, setCurrentPrintDocId } from './state.js';

// Canvas drawing state variables
let signatureCanvas = null;
let signatureCtx = null;
let isDrawing = false;
let lastX = 0;
let lastY = 0;

export function renderDocumentos() {
    const listContainer = document.getElementById("document-grid-container");
    if (!listContainer) return;
    listContainer.innerHTML = "";

    const searchQuery = document.getElementById("search-document").value.toLowerCase().trim();
    const filterType = document.getElementById("filter-document-type").value;

    const filteredDocs = (state.documents || []).filter(d => {
        const matchesSearch = (d.clientName || '').toLowerCase().includes(searchQuery);
        const matchesType = filterType === "all" || d.type === filterType;
        return matchesSearch && matchesType;
    });

    if (filteredDocs.length === 0) {
        listContainer.innerHTML = `
            <div class="empty-state" style="padding: 3rem;">
                <i data-lucide="file-text" style="width:48px; height:48px; margin-bottom:1rem; opacity:0.3;"></i>
                <p>Nenhum recibo ou orçamento comercial gerado.</p>
            </div>
        `;
        if (window.lucide) lucide.createIcons();
        return;
    }

    filteredDocs.forEach(d => {
        const dateFormatted = new Date(d.date + 'T00:00:00').toLocaleDateString('pt-BR');
        let typeBadge = "";
        if (d.type === "orcamento") {
            typeBadge = `<span class="badge badge-warning" style="background: rgba(245, 158, 11, 0.1); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.2);">Orçamento</span>`;
        } else if (d.type === "nota") {
            typeBadge = `<span class="badge badge-info" style="background: rgba(59, 130, 246, 0.1); color: #3b82f6; border: 1px solid rgba(59, 130, 246, 0.2);">Nota</span>`;
        } else {
            typeBadge = `<span class="badge badge-success" style="background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.2);">Recibo</span>`;
        }

        let gpsButton = '';
        if (d.gps && d.gps.lat && d.gps.lng) {
            gpsButton = `
                <a href="https://www.google.com/maps/search/?api=1&query=${d.gps.lat},${d.gps.lng}" target="_blank" class="btn btn-secondary btn-icon-only" style="padding: 6px; display: inline-flex; align-items: center; justify-content: center; text-decoration: none;" title="Ver Localização no GPS">
                    <i data-lucide="map-pin" style="width: 14px; height: 14px; color: var(--color-primary);"></i>
                </a>
            `;
        }

        listContainer.innerHTML += `
            <div class="pedido-item" style="margin-bottom: 0.75rem;">
                <div class="pedido-detalhes">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                        <h4 style="margin: 0; font-weight: 700;">${d.clientName}</h4>
                        ${typeBadge}
                    </div>
                    <p style="margin: 2px 0;">Emissão: ${dateFormatted} | Contato: ${d.phone || 'Não informado'}</p>
                    <p style="margin: 2px 0; font-weight: 600; color: var(--color-primary);">Valor Total: R$ ${d.total.toFixed(2)}</p>
                </div>
                <div class="pedido-acoes">
                    <button class="btn btn-secondary" onclick="openDocumentPrint('${d.id}')" style="display: inline-flex; align-items: center; gap: 4px; padding: 6px 12px; font-size: 0.8rem;">
                        <i data-lucide="eye" style="width: 14px; height: 14px;"></i> Visualizar / Imprimir
                    </button>
                    ${gpsButton}
                    <button class="btn btn-secondary btn-icon-only" onclick="openDocModal('${d.id}')" title="Editar Documento">
                        <i data-lucide="edit-3" style="width: 15px; height: 15px;"></i>
                    </button>
                    <button class="btn btn-danger btn-icon-only" onclick="deleteDocument('${d.id}')" title="Excluir Documento">
                        <i data-lucide="trash-2" style="width: 15px; height: 15px;"></i>
                    </button>
                </div>
            </div>
        `;
    });

    if (window.lucide) lucide.createIcons();
}

export function openDocModal(docId = null) {
    const modal = document.getElementById("modal-document");
    const form = document.getElementById("document-form");
    const title = document.getElementById("document-modal-title");
    const clientSelect = document.getElementById("doc-client-select");

    if (!modal || !form) return;

    form.reset();
    document.getElementById("form-document-id").value = "";
    if (clientSelect) {
        clientSelect.innerHTML = '<option value="">-- Cliente Avulso (Preencher Manualmente) --</option>';
        // Popular Clientes
        (state.clients || []).forEach(c => {
            clientSelect.innerHTML += `<option value="${c.id}">${c.name}</option>`;
        });
    }

    // Data Padrão
    const dateInput = document.getElementById("doc-date");
    if (dateInput) {
        dateInput.value = window.getBrazilTimeISO().split('T')[0];
    }

    // Resetar/Inicializar calculadora com configurações salvas
    const logSettings = state.logisticsSettings || {
        fuelPrice: 5.80,
        fuelConsumption: 10.0,
        avgSpeed: 60,
        tollBase: 0.00,
        vehicleType: "passeio",
        tollMultiplier: 1.0,
        markupPercent: 0,
        markupFixed: 0.00,
        tollReturn: true
    };

    const opTypeInput = document.getElementById("doc-logistics-op-type");
    if (opTypeInput) opTypeInput.value = "simples";
    document.getElementById("doc-logistics-distance").value = "0.0";
    document.getElementById("doc-logistics-avg-speed").value = logSettings.avgSpeed;
    document.getElementById("doc-logistics-vehicle-type").value = logSettings.vehicleType;
    document.getElementById("doc-logistics-toll-base").value = logSettings.tollBase.toFixed(2);
    document.getElementById("doc-logistics-toll-multiplier").value = logSettings.tollMultiplier.toFixed(1);
    document.getElementById("doc-logistics-fuel-price").value = logSettings.fuelPrice.toFixed(2);
    document.getElementById("doc-logistics-fuel-consumption").value = logSettings.fuelConsumption.toFixed(1);
    document.getElementById("doc-logistics-markup-percent").value = logSettings.markupPercent;
    document.getElementById("doc-logistics-markup-fixed").value = logSettings.markupFixed.toFixed(2);
    document.getElementById("doc-logistics-toll-return").checked = logSettings.tollReturn;

    const calcContent = document.getElementById("doc-logistics-calc-content");
    if (calcContent) calcContent.style.display = "none";
    const toggleIcon = document.getElementById("doc-logistics-toggle-icon");
    if (toggleIcon) toggleIcon.innerText = "▼";

    let d = null;
    if (docId) {
        if (title) title.innerText = "Editar Documento Comercial";
        d = state.documents.find(item => item.id === docId);
        if (d) {
            document.getElementById("form-document-id").value = d.id;
            document.getElementById("doc-type").value = d.type;
            if (dateInput) dateInput.value = d.date;
            if (clientSelect) clientSelect.value = d.clientId || "";
            document.getElementById("doc-client-name").value = d.clientName;
            document.getElementById("doc-address").value = d.address || "";
            document.getElementById("doc-phone").value = d.phone || "";
            document.getElementById("doc-delivery-fee").value = d.deliveryFee;
            document.getElementById("doc-payment-method").value = d.paymentMethod || "Dinheiro";

            // Se o documento tem dados da calculadora persistidos, preencher
            if (d.docLogisticsDistance !== undefined) {
                if (opTypeInput) opTypeInput.value = d.docLogisticsOpType || "simples";
                document.getElementById("doc-logistics-distance").value = d.docLogisticsDistance;
                document.getElementById("doc-logistics-avg-speed").value = d.docLogisticsAvgSpeed || logSettings.avgSpeed;
                document.getElementById("doc-logistics-vehicle-type").value = d.docLogisticsVehicleType || logSettings.vehicleType;
                document.getElementById("doc-logistics-toll-base").value = (d.docLogisticsTollBase !== undefined ? d.docLogisticsTollBase : logSettings.tollBase).toFixed(2);
                document.getElementById("doc-logistics-toll-multiplier").value = (d.docLogisticsTollMultiplier !== undefined ? d.docLogisticsTollMultiplier : logSettings.tollMultiplier).toFixed(1);
                document.getElementById("doc-logistics-fuel-price").value = (d.docLogisticsFuelPrice !== undefined ? d.docLogisticsFuelPrice : logSettings.fuelPrice).toFixed(2);
                document.getElementById("doc-logistics-fuel-consumption").value = (d.docLogisticsFuelConsumption !== undefined ? d.docLogisticsFuelConsumption : logSettings.fuelConsumption).toFixed(1);
                document.getElementById("doc-logistics-markup-percent").value = (d.docLogisticsMarkupPercent !== undefined ? d.docLogisticsMarkupPercent : logSettings.markupPercent);
                document.getElementById("doc-logistics-markup-fixed").value = (d.docLogisticsMarkupFixed !== undefined ? d.docLogisticsMarkupFixed : logSettings.markupFixed).toFixed(2);
                document.getElementById("doc-logistics-toll-return").checked = (d.docLogisticsTollReturn !== undefined ? d.docLogisticsTollReturn : logSettings.tollReturn);
            }
        }
    } else {
        if (title) title.innerText = "Novo Documento Comercial";
    }

    if (window.updateDocLogisticsTollMultiplier) window.updateDocLogisticsTollMultiplier();
    if (window.calculateDocLogistics) window.calculateDocLogistics();
    renderDocModalProducts(d);

    modal.classList.add("active");
}

export function populateDocClientDetails() {
    const clientSelect = document.getElementById("doc-client-select");
    if (!clientSelect) return;
    const clientId = clientSelect.value;
    const client = clientId ? (state.clients || []).find(c => c.id === clientId) : null;
    
    if (client) {
        document.getElementById("doc-client-name").value = client.name;
        document.getElementById("doc-address").value = client.address || "";
        document.getElementById("doc-phone").value = client.phone || "";
    } else {
        document.getElementById("doc-client-name").value = "";
        document.getElementById("doc-address").value = "";
        document.getElementById("doc-phone").value = "";
    }
    
    // Atualizar preços de todos os produtos do catálogo
    state.products.forEach(p => {
        const priceInput = document.getElementById(`doc-price-${p.id}`);
        if (priceInput) {
            let price = p.defaultPrice || 0;
            if (client && client.customPrices && client.customPrices[p.id] > 0) {
                price = client.customPrices[p.id];
            }
            priceInput.value = price.toFixed(2);
        }
        
        if (p.type === 'Gelo Saborizado') {
            const priceUnitInput = document.getElementById(`doc-price-${p.id}_unit`);
            if (priceUnitInput) {
                let priceUnit = p.unitPrice || 0;
                if (client && client.customPrices && client.customPrices[p.id + "_unit"] > 0) {
                    priceUnit = client.customPrices[p.id + "_unit"];
                }
                priceUnitInput.value = priceUnit.toFixed(2);
            }
        }
    });
    if (window.fetchDocRouteDistance) {
        window.fetchDocRouteDistance(true);
    }
}

export function deleteDocument(docId) {
    if (confirm("Deseja realmente excluir este documento comercial?")) {
        state.documents = state.documents.filter(d => d.id !== docId);
        saveState();
        if (window.renderApp) window.renderApp();
    }
}

export function openDocumentPrint(docId) {
    let d;
    if (docId === "TEST-0000") {
        d = {
            id: "TEST-0000",
            type: "recibo",
            date: window.getBrazilTimeISO().split('T')[0],
            clientName: "CLIENTE TESTE DA SILVA",
            address: "AV. PAULISTA, 1000 - SÃO PAULO/SP",
            phone: "(11) 99999-9999",
            paymentMethod: "Dinheiro / Pix",
            items: [
                { name: "Pacote Gelo 5kg (Cubo)", qty: 2, price: 10.00 },
                { name: "Gelo Triturado 20kg", qty: 1, price: 30.00 }
            ],
            deliveryFee: 5.00,
            total: 55.00,
            signatureBase64: window.testDocSignatureBase64 || null
        };
    } else {
        d = state.documents.find(item => item.id === docId);
    }
    if (!d) return;

    setCurrentPrintDocId(docId);
    const formattedDate = new Date(d.date + 'T00:00:00').toLocaleDateString('pt-BR');
    const titleDoc = d.type === "orcamento" ? "ORÇAMENTO COMERCIAL" : (d.type === "nota" ? "NOTA DE ENTREGA" : "RECIBO DE ENTREGA");

    // Montar tabela de itens
    let itemsRows = "";
    d.items.forEach(it => {
        const totalItem = it.qty * it.price;
        itemsRows += `
            <tr>
                <td style="padding: 6px; border-bottom: 1px dashed #ddd;">${it.name}</td>
                <td style="padding: 6px; border-bottom: 1px dashed #ddd; text-align: center;">${it.qty}</td>
                <td style="padding: 6px; border-bottom: 1px dashed #ddd; text-align: right;">R$ ${it.price.toFixed(2)}</td>
                <td style="padding: 6px; border-bottom: 1px dashed #ddd; text-align: right;">R$ ${totalItem.toFixed(2)}</td>
            </tr>
        `;
    });

    // Configurações de impressão do estado
    const printFormat = (state.printSettings && state.printSettings.format) || "a4";
    const showLogo = state.printSettings ? state.printSettings.showLogo : true;
    const showSignatures = state.printSettings ? state.printSettings.showSignatures : true;

    // Determinar classes CSS adicionais com base no formato
    let formatClass = "";
    if (printFormat === "thermal80") {
        formatClass = " format-thermal80";
    } else if (printFormat === "thermal58") {
        formatClass = " format-thermal58";
    }

    const logoHTML = showLogo ? `
        <div style="text-align: center; margin-bottom: 15px;">
            <img src="${state.factorySettings && state.factorySettings.logo ? state.factorySettings.logo : 'logo_vertical.png'}" alt="Gelo do Vale" style="max-height: 90px; object-fit: contain;">
        </div>
    ` : "";

    let clientSignatureHTML = "";
    if (d.signatureBase64) {
        clientSignatureHTML = `<img src="${d.signatureBase64}" style="max-height: 50px; max-width: 100%; display: block; margin: 0 auto -10px auto; pointer-events: none;">`;
    }

    const signaturesHTML = showSignatures ? `
        <div style="margin-top: 40px; font-size: 0.75rem; text-align: center; color: #555;">
            <p>Obrigado pela preferência e parceria de sempre!</p>
            <div style="margin-top: 30px; display: flex; justify-content: space-around;">
                <div style="width: 40%; border-top: 1px solid #aaa; padding-top: 5px;">
                    Assinatura Responsável
                </div>
                <div style="width: 40%; border-top: 1px solid #aaa; padding-top: 5px; position: relative;">
                    ${clientSignatureHTML}
                    Assinatura Cliente
                </div>
            </div>
        </div>
    ` : `
        <div style="margin-top: 20px; font-size: 0.75rem; text-align: center; color: #555;">
            <p>Obrigado pela preferência e parceria de sempre!</p>
        </div>
    `;

    const docHTML = `
        <div class="commercial-document${formatClass}">
            ${logoHTML}
            <h2 style="font-size: 1.25rem; font-weight: bold; margin: 0 0 5px 0; text-align: center;">${titleDoc}</h2>
            <div style="font-size: 0.75rem; text-align: center; color: #555; line-height: 1.4; border-bottom: 1px solid #000; padding-bottom: 8px; margin-bottom: 15px;">
                <strong>${FACTORY_INFO.name}</strong><br>
                CNPJ: ${FACTORY_INFO.cnpj} | Telefone: ${FACTORY_INFO.phone}<br>
                Endereço: ${FACTORY_INFO.address}<br>
                Email: ${FACTORY_INFO.email}
            </div>

            <div style="display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 15px; flex-wrap: wrap; gap: 10px;">
                <div>
                    <strong>CLIENTE:</strong> ${d.clientName.toUpperCase()}<br>
                    <strong>ENDEREÇO:</strong> ${d.address || 'Não informado'}<br>
                    <strong>CONTATO:</strong> ${d.phone || 'Não informado'}
                </div>
                <div style="text-align: right;">
                    <strong>Nº DOCUMENTO:</strong> ${d.id}<br>
                    <strong>DATA DE EMISSÃO:</strong> ${formattedDate}<br>
                    <strong>FORMA DE PAGAMENTO:</strong> ${d.paymentMethod || 'Dinheiro'}
                </div>
            </div>

            <table style="width: 100%; border-collapse: collapse; font-size: 0.8rem; margin-top: 10px;">
                <thead>
                    <tr style="border-bottom: 2px solid #000; font-weight: bold;">
                        <th style="padding: 6px; text-align: left;">Descrição do Item</th>
                        <th style="padding: 6px; text-align: center;">Qtd</th>
                        <th style="padding: 6px; text-align: right;">Preço Unit.</th>
                        <th style="padding: 6px; text-align: right;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsRows}
                    ${d.deliveryFee > 0 ? `
                        <tr>
                            <td colspan="3" style="padding: 6px; border-bottom: 1px dashed #ddd;">Taxa de Entrega / Frete</td>
                            <td style="padding: 6px; border-bottom: 1px dashed #ddd; text-align: right;">R$ ${d.deliveryFee.toFixed(2)}</td>
                        </tr>
                    ` : ''}
                    <tr class="total-row">
                        <td colspan="3" style="padding: 8px 6px; text-align: left; font-weight: bold;">VALOR TOTAL DO DOCUMENTO</td>
                        <td style="padding: 8px 6px; text-align: right; font-weight: bold; font-size: 1.1rem; color: #000;">R$ ${d.total.toFixed(2)}</td>
                    </tr>
                </tbody>
            </table>

            ${signaturesHTML}
        </div>
    `;

    const printableEl = document.getElementById("printable-document-content");
    if (printableEl) printableEl.innerHTML = docHTML;
    
    const modalEl = document.getElementById("modal-document-print");
    if (modalEl) {
        modalEl.classList.add("active");
        const btnMp = document.getElementById("btn-mp-doc");
        if (btnMp) {
            if (state.mercadoPago && state.mercadoPago.enabled) {
                btnMp.style.display = "inline-flex";
            } else {
                btnMp.style.display = "none";
            }
        }
    }
}

export function printTestReceipt() {
    openDocumentPrint("TEST-0000");
}

export function renderDocModalProducts(documentObj = null) {
    const container = document.getElementById("document-products-container");
    if (!container) return;

    container.innerHTML = "";
    
    // Reset dos campos de item avulso
    const customNameEl = document.getElementById("doc-custom-name");
    const customQtyEl = document.getElementById("doc-custom-qty");
    const customPriceEl = document.getElementById("doc-custom-price");
    if (customNameEl) customNameEl.value = "";
    if (customQtyEl) customQtyEl.value = 0;
    if (customPriceEl) customPriceEl.value = "0.00";
    
    const activeProducts = (state.products || []).filter(p => p.active);

    if (activeProducts.length === 0) {
        container.innerHTML = `<p style="font-size: 0.8rem; color: var(--color-text-muted); text-align: center; padding: 0.5rem 0;">Nenhum produto cadastrado no catálogo.</p>`;
        return;
    }

    const itemMap = {};
    if (documentObj && documentObj.items) {
        documentObj.items.forEach(it => {
            if (it.prodId) {
                itemMap[it.prodId] = it;
            } else {
                if (customNameEl && !customNameEl.value) {
                    customNameEl.value = it.name || "";
                    if (customQtyEl) customQtyEl.value = it.qty || 0;
                    if (customPriceEl) customPriceEl.value = (it.price || 0).toFixed(2);
                }
            }
        });
    }

    let html = "";
    activeProducts.forEach(p => {
        // Fardo
        const qty = itemMap[p.id] ? itemMap[p.id].qty : 0;
        const price = itemMap[p.id] ? itemMap[p.id].price : (p.defaultPrice || 0);

        html += `
            <div class="form-row-grid" style="grid-template-columns: 2fr 1fr 1.2fr; gap: 0.5rem; align-items: center; margin-bottom: 0.25rem;">
                <span style="font-size: 0.8rem; white-space: normal; line-height: 1.2; word-break: break-word;" title="${p.name}">${p.name}${p.type === 'Gelo Saborizado' ? ' (Fardo)' : ''}</span>
                <input type="number" min="0" id="doc-qty-${p.id}" class="form-control doc-qty-input" data-prod-id="${p.id}" value="${qty}" style="padding: 6px 8px; font-size: 0.85rem;">
                <input type="number" step="0.01" min="0" id="doc-price-${p.id}" class="form-control doc-price-input" data-prod-id="${p.id}" value="${price.toFixed(2)}" style="padding: 6px 8px; font-size: 0.85rem;">
            </div>
        `;

        // Unidade (se for Gelo Saborizado)
        if (p.type === 'Gelo Saborizado') {
            const unitKey = p.id + "_unit";
            const qtyUnit = itemMap[unitKey] ? itemMap[unitKey].qty : 0;
            const priceUnit = itemMap[unitKey] ? itemMap[unitKey].price : (p.unitPrice || 0);
            
            html += `
                <div class="form-row-grid" style="grid-template-columns: 2fr 1fr 1.2fr; gap: 0.5rem; align-items: center; margin-bottom: 0.25rem; border-left: 2px solid var(--color-primary); padding-left: 4px;">
                    <span style="font-size: 0.75rem; white-space: normal; line-height: 1.2; word-break: break-word; color: var(--color-text-muted);" title="${p.name} (Unidade)">↳ ${p.name} (Unidade)</span>
                    <input type="number" min="0" id="doc-qty-${p.id}_unit" class="form-control doc-qty-unit-input" data-prod-id="${p.id}_unit" value="${qtyUnit}" style="padding: 6px 8px; font-size: 0.85rem;">
                    <input type="number" step="0.01" min="0" id="doc-price-${p.id}_unit" class="form-control doc-price-unit-input" data-prod-id="${p.id}_unit" value="${priceUnit.toFixed(2)}" style="padding: 6px 8px; font-size: 0.85rem;">
                </div>
            `;
        }
    });
    container.innerHTML = html;
}

export function printDocument() {
    window.print();
}

export function downloadDocumentPDF() {
    if (typeof html2pdf === "undefined") {
        alert("A biblioteca de geração de PDF ainda não foi carregada. Verifique sua conexão com a internet.");
        return;
    }

    const element = document.getElementById('printable-document-content');
    if (!element) return;

    // Buscar dados do documento para o nome do arquivo
    const docId = currentPrintDocId || Date.now();
    let d;
    if (docId === "TEST-0000") {
        d = {
            id: "TEST-0000",
            type: "recibo",
            date: window.getBrazilTimeISO().split('T')[0],
            clientName: "CLIENTE TESTE DA SILVA",
            address: "AV. PAULISTA, 1000 - SÃO PAULO/SP",
            phone: "(11) 99999-9999",
            paymentMethod: "Dinheiro / Pix",
            items: [
                { name: "Pacote Gelo 5kg (Cubo)", qty: 2, price: 10.00 },
                { name: "Gelo Triturado 20kg", qty: 1, price: 30.00 }
            ],
            deliveryFee: 5.00,
            total: 55.00
        };
    } else {
        d = state.documents.find(item => item.id === docId);
    }
    const prefix = d ? (d.type === "orcamento" ? "orcamento" : (d.type === "nota" ? "nota" : "recibo")) : "documento";
    const clientName = d ? d.clientName.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, "_") : "cliente";
    const filename = `${prefix}_${docId}_${clientName}.pdf`;

    const printFormat = (state.printSettings && state.printSettings.format) || "a4";
    const opt = {
        margin:       10,
        filename:     filename,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, logging: false },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    if (printFormat === "thermal80") {
        opt.margin = [5, 2, 5, 2];
        opt.jsPDF = { unit: 'mm', format: [80, 200], orientation: 'portrait' };
    } else if (printFormat === "thermal58") {
        opt.margin = [3, 1, 3, 1];
        opt.jsPDF = { unit: 'mm', format: [58, 150], orientation: 'portrait' };
    }
    
    // Adicionar um efeito visual temporário para sinalizar o download
    const btn = document.querySelector('.btn-pdf');
    const originalText = btn ? btn.innerHTML : '';
    if (btn) {
        btn.innerHTML = '<span class="spin-anim" style="display:inline-block; border: 2px solid #fff; border-top: 2px solid transparent; border-radius: 50%; width: 12px; height: 12px; margin-right: 6px; vertical-align: middle;"></span> Gerando...';
        btn.disabled = true;
    }

    html2pdf().set(opt).from(element).save().then(() => {
        if (btn) {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }).catch(err => {
        console.error("Erro ao gerar PDF:", err);
        alert("Ocorreu um erro ao gerar o PDF. Tente novamente.");
        if (btn) {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    });
}

export function shareDocumentWhatsApp() {
    const activeDocId = currentPrintDocId;
    if (!activeDocId) return;
    let d;
    if (activeDocId === "TEST-0000") {
        d = {
            id: "TEST-0000",
            type: "recibo",
            date: window.getBrazilTimeISO().split('T')[0],
            clientName: "CLIENTE TESTE DA SILVA",
            address: "AV. PAULISTA, 1000 - SÃO PAULO/SP",
            phone: "(11) 99999-9999",
            paymentMethod: "Dinheiro / Pix",
            items: [
                { name: "Pacote Gelo 5kg (Cubo)", qty: 2, price: 10.00 },
                { name: "Gelo Triturado 20kg", qty: 1, price: 30.00 }
            ],
            deliveryFee: 5.00,
            total: 55.00
        };
    } else {
        d = state.documents.find(item => item.id === activeDocId);
    }
    if (!d) return;

    const formattedDate = new Date(d.date + 'T00:00:00').toLocaleDateString('pt-BR');
    const titleDoc = d.type === "orcamento" ? "Orçamento" : (d.type === "nota" ? "Nota" : "Recibo");
    
    let text = `*${titleDoc.toUpperCase()} - ${FACTORY_INFO.name}*\n\n`;
    text += `*Nº Documento:* ${d.id}\n`;
    text += `*Cliente:* ${d.clientName}\n`;
    text += `*Data:* ${formattedDate}\n`;
    text += `*Forma de Pagamento:* ${d.paymentMethod || 'Dinheiro'}\n\n`;
    text += `*Itens:*\n`;
    
    d.items.forEach(it => {
        text += `- ${it.qty}x ${it.name} (R$ ${it.price.toFixed(2)}): R$ ${(it.qty * it.price).toFixed(2)}\n`;
    });
    
    if (d.deliveryFee > 0) {
        text += `- Frete: R$ ${d.deliveryFee.toFixed(2)}\n`;
    }
    
    text += `\n*Valor Total: R$ ${d.total.toFixed(2)}*\n\n`;
    text += `Obrigado pela parceria!`;

    const encodedText = encodeURIComponent(text);
    const cleanPhone = d.phone ? d.phone.replace(/\D/g, '') : '';
    
    if (!navigator.onLine) {
        navigator.clipboard.writeText(text)
            .then(() => {
                alert("📶 Você está offline!\nO texto do recibo foi copiado para a sua área de transferência para que você possa colar no WhatsApp manualmente.");
            })
            .catch(() => {
                alert("Erro ao copiar o texto para a área de transferência.");
            });
        return;
    }
    
    let whatsappUrl = `https://api.whatsapp.com/send?text=${encodedText}`;
    if (cleanPhone) {
        let phoneWithDDI = cleanPhone;
        if (cleanPhone.length === 10 || cleanPhone.length === 11) {
            phoneWithDDI = '55' + cleanPhone;
        }
        whatsappUrl = `https://api.whatsapp.com/send?phone=${phoneWithDDI}&text=${encodedText}`;
    }
    
    window.open(whatsappUrl, '_blank');
}

export function shareDocumentEmail() {
    const activeDocId = currentPrintDocId;
    if (!activeDocId) return;
    let d;
    if (activeDocId === "TEST-0000") {
        d = {
            id: "TEST-0000",
            type: "recibo",
            date: window.getBrazilTimeISO().split('T')[0],
            clientName: "CLIENTE TESTE DA SILVA",
            address: "AV. PAULISTA, 1000 - SÃO PAULO/SP",
            phone: "(11) 99999-9999",
            paymentMethod: "Dinheiro / Pix",
            items: [
                { name: "Pacote Gelo 5kg (Cubo)", qty: 2, price: 10.00 },
                { name: "Gelo Triturado 20kg", qty: 1, price: 30.00 }
            ],
            deliveryFee: 5.00,
            total: 55.00
        };
    } else {
        d = state.documents.find(item => item.id === activeDocId);
    }
    if (!d) return;

    const formattedDate = new Date(d.date + 'T00:00:00').toLocaleDateString('pt-BR');
    const titleDoc = d.type === "orcamento" ? "Orçamento" : (d.type === "nota" ? "Nota" : "Recibo");
    
    const subject = `${titleDoc} Nº ${d.id} - ${FACTORY_INFO.name}`;
    
    let body = `${titleDoc} de Venda\n`;
    body += `===================================\n`;
    body += `Emitente: ${FACTORY_INFO.name}\n`;
    body += `Cliente: ${d.clientName}\n`;
    body += `Data: ${formattedDate}\n`;
    body += `Forma de Pagamento: ${d.paymentMethod || 'Dinheiro'}\n`;
    body += `===================================\n\n`;
    body += `Itens:\n`;
    
    d.items.forEach(it => {
        body += `- ${it.qty}x ${it.name} (R$ ${it.price.toFixed(2)}): R$ ${(it.qty * it.price).toFixed(2)}\n`;
    });
    
    if (d.deliveryFee > 0) {
        body += `- Frete: R$ ${d.deliveryFee.toFixed(2)}\n`;
    }
    
    body += `\nValor Total: R$ ${d.total.toFixed(2)}\n\n`;
    body += `Atenciosamente,\n${FACTORY_INFO.name}`;

    if (!navigator.onLine) {
        navigator.clipboard.writeText(body)
            .then(() => {
                alert("📶 Você está offline!\nO texto do e-mail foi copiado para a sua área de transferência.");
            })
            .catch(() => {
                alert("Erro ao copiar o texto do e-mail.");
            });
        return;
    }

    const mailtoUrl = `mailto:${d.email || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl, '_self');
}

// Canvas Signature Functions
export function initSignatureCanvas() {
    signatureCanvas = document.getElementById("signature-canvas");
    if (!signatureCanvas) return;
    signatureCtx = signatureCanvas.getContext("2d");
    
    signatureCtx.strokeStyle = "#000000";
    signatureCtx.lineWidth = 2.5;
    signatureCtx.lineCap = "round";
    signatureCtx.lineJoin = "round";
    
    resizeSignatureCanvas();
    
    // Eventos de Mouse
    signatureCanvas.addEventListener("mousedown", startDrawing);
    signatureCanvas.addEventListener("mousemove", draw);
    signatureCanvas.addEventListener("mouseup", stopDrawing);
    signatureCanvas.addEventListener("mouseout", stopDrawing);
    
    // Eventos de Touch
    signatureCanvas.addEventListener("touchstart", startDrawingTouch, { passive: false });
    signatureCanvas.addEventListener("touchmove", drawTouch, { passive: false });
    signatureCanvas.addEventListener("touchend", stopDrawingTouch);
}

export function resizeSignatureCanvas() {
    if (!signatureCanvas) return;
    const rect = signatureCanvas.getBoundingClientRect();
    signatureCanvas.width = rect.width || 418;
    signatureCanvas.height = rect.height || 200;
    
    if (signatureCtx) {
        signatureCtx.strokeStyle = "#000000";
        signatureCtx.lineWidth = 2.5;
        signatureCtx.lineCap = "round";
        signatureCtx.lineJoin = "round";
    }
}

function startDrawing(e) {
    if (!signatureCanvas) return;
    isDrawing = true;
    const rect = signatureCanvas.getBoundingClientRect();
    lastX = e.clientX - rect.left;
    lastY = e.clientY - rect.top;
}

function draw(e) {
    if (!isDrawing || !signatureCanvas || !signatureCtx) return;
    const rect = signatureCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    signatureCtx.beginPath();
    signatureCtx.moveTo(lastX, lastY);
    signatureCtx.lineTo(x, y);
    signatureCtx.stroke();
    
    lastX = x;
    lastY = y;
}

function stopDrawing() {
    isDrawing = false;
}

function startDrawingTouch(e) {
    if (e.touches.length === 1) {
        e.preventDefault();
        isDrawing = true;
        const rect = signatureCanvas.getBoundingClientRect();
        const touch = e.touches[0];
        lastX = touch.clientX - rect.left;
        lastY = touch.clientY - rect.top;
    }
}

function drawTouch(e) {
    if (!isDrawing || e.touches.length !== 1 || !signatureCanvas || !signatureCtx) return;
    e.preventDefault();
    const rect = signatureCanvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    signatureCtx.beginPath();
    signatureCtx.moveTo(lastX, lastY);
    signatureCtx.lineTo(x, y);
    signatureCtx.stroke();
    
    lastX = x;
    lastY = y;
}

function stopDrawingTouch() {
    isDrawing = false;
}

export function clearSignatureCanvas() {
    if (!signatureCanvas || !signatureCtx) return;
    signatureCtx.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height);
}

export function openSignatureModal(targetType = 'document', targetId = null) {
    window.signatureTargetType = targetType;
    window.signatureTargetId = targetId;

    const modal = document.getElementById("modal-signature");
    if (modal) modal.classList.add("active");
    
    setTimeout(() => {
        if (!signatureCanvas) {
            initSignatureCanvas();
        } else {
            resizeSignatureCanvas();
        }
        clearSignatureCanvas();
    }, 200);
}

export function saveSignature() {
    if (!signatureCanvas) return;
    const dataUrl = signatureCanvas.toDataURL("image/png");
    
    const targetType = window.signatureTargetType || 'document';
    const targetId = window.signatureTargetId || currentPrintDocId;
    
    if (targetType === 'comodato') {
        const comodato = (state.comodatos || []).find(item => item.id === targetId);
        if (comodato) {
            comodato.signatureBase64 = dataUrl;
            comodato.status = 'ativo';
            comodato.signatureDate = window.getBrazilTimeISO();
            comodato.signatureMethod = 'local';
            
            const client = (state.clients || []).find(c => c.id === comodato.clientId);
            if (client) {
                client.freezerCode = comodato.freezerCode;
            }
            
            saveState();
            alert("Assinatura do comodato salva com sucesso!");
            if (window.renderComodatoDetail) window.renderComodatoDetail(targetId);
            if (window.renderComodatosAdmin) window.renderComodatosAdmin();
        }
    } else if (targetType === 'rental') {
        const rental = (state.rentals || []).find(item => item.id === targetId);
        if (rental) {
            rental.signatureBase64 = dataUrl;
            saveState();
            alert("Assinatura do contrato salva com sucesso!");
            if (window.updateRentalContractPreview) window.updateRentalContractPreview(targetId);
        }
    } else {
        if (targetId === "TEST-0000") {
            window.testDocSignatureBase64 = dataUrl;
            alert("Assinatura salva com sucesso no cupom de teste!");
        } else {
            const doc = state.documents.find(item => item.id === targetId);
            if (doc) {
                doc.signatureBase64 = dataUrl;
                saveState();
                alert("Assinatura salva com sucesso!");
            }
        }
    }
    
    if (window.closeModal) window.closeModal("modal-signature");
    if (targetType === 'comodato') {
        if (window.openComodatoDetail) window.openComodatoDetail(targetId);
    } else if (targetType !== 'rental') {
        openDocumentPrint(targetId || currentPrintDocId);
    }
}

export function closeSignatureModal() {
    if (window.closeModal) window.closeModal("modal-signature");
    if (window.signatureTargetType === 'comodato' && window.signatureTargetId) {
        if (window.openComodatoDetail) window.openComodatoDetail(window.signatureTargetId);
    }
}

// Bind to window for HTML accessibility
window.renderDocumentos = renderDocumentos;
window.openDocModal = openDocModal;
window.populateDocClientDetails = populateDocClientDetails;
window.deleteDocument = deleteDocument;
window.openDocumentPrint = openDocumentPrint;
window.printTestReceipt = printTestReceipt;
window.renderDocModalProducts = renderDocModalProducts;
window.printDocument = printDocument;
window.downloadDocumentPDF = downloadDocumentPDF;
window.shareDocumentWhatsApp = shareDocumentWhatsApp;
window.shareDocumentEmail = shareDocumentEmail;
window.initSignatureCanvas = initSignatureCanvas;
window.resizeSignatureCanvas = resizeSignatureCanvas;
window.clearSignatureCanvas = clearSignatureCanvas;
window.openSignatureModal = openSignatureModal;
window.saveSignature = saveSignature;
window.closeSignatureModal = closeSignatureModal;

// MP Integration from Document Modal
export async function generateMpFromDocument() {
    const activeDocId = window.currentPrintDocId || currentPrintDocId;
    if (!activeDocId) return;
    
    let d = state.documents.find(item => item.id === activeDocId);
    if (!d) {
        if (activeDocId === "TEST-0000") {
            d = { id: "TEST", total: 55.00, clientName: "Teste", phone: "" };
        } else {
            return;
        }
    }
    
    if (d.total <= 0) {
        alert("O valor do documento deve ser maior que zero para gerar cobrança no Mercado Pago.");
        return;
    }
    
    const btnIcon = document.getElementById("btn-mp-doc").querySelector("i");
    if (btnIcon) {
        btnIcon.setAttribute('data-lucide', 'loader');
        if (window.lucide) lucide.createIcons();
    }
    
    try {
        const link = await window.generateMercadoPagoLink(`Recibo - ${d.clientName}`, d.total);
        if (link) {
            const phone = d.phone ? d.phone.replace(/\D/g, '') : '';
            const msg = `Olá! Segue o link de pagamento do Mercado Pago (R$ ${d.total.toFixed(2).replace('.', ',')}) referente ao seu recibo.\nVocê pode escolher pagar via PIX ou Boleto clicando aqui:\n${link}`;
            
            if (phone.length >= 10) {
                window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(msg)}`, '_blank');
            } else {
                alert(`Link gerado com sucesso (cliente sem telefone cadastrado):\n${link}`);
            }
        }
    } finally {
        if (btnIcon) {
            btnIcon.setAttribute('data-lucide', 'link');
            if (window.lucide) lucide.createIcons();
        }
    }
}
window.generateMpFromDocument = generateMpFromDocument;
