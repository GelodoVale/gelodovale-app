import { state, saveState, FACTORY_INFO, recalculateClientDebts, APP_VERSION } from './state.js';
import { renderWidgetsSetupPanel } from './widgets.js';

// 1. Alternador de Sub-abas Administrativas
export function switchAdminSubTab(subTabId) {
    // Verificar se o usuário logado tem permissão
    const currentUserId = sessionStorage.getItem("currentUserId");
    if (currentUserId && state.users) {
        const currentUser = state.users.find(u => u.id === currentUserId);
        if (currentUser) {
            const hasPerm = (currentUser.permissions || {})["admin-" + subTabId];
            if (hasPerm === false) {
                window.showToast("Você não possui permissão para acessar esta sub-aba administrativa.", "error");
                return;
            }
        }
    }

    window.activeAdminSubTab = subTabId;
    
    // Atualiza classes ativas dos botões
    const menuButtons = document.querySelectorAll(".admin-menu-btn");
    menuButtons.forEach(btn => {
        const onClickAttr = btn.getAttribute("onclick") || "";
        if (onClickAttr.includes(`'${subTabId}'`) || onClickAttr.includes(`"${subTabId}"`)) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });
    
    // Atualiza classes ativas do conteúdo
    const contents = document.querySelectorAll(".admin-subtab-content");
    contents.forEach(content => {
        if (content.id === subTabId) {
            content.classList.add("active");
        } else {
            content.classList.remove("active");
        }
    });
    
    if (subTabId === "tab-rentabilidade-freezers" && typeof window.renderFreezerRentability === "function") {
        window.renderFreezerRentability();
    }
    
    if (subTabId === "tab-eventos-locais" && typeof window.renderEventosLocaisTable === "function") {
        window.renderEventosLocaisTable();
    }
    
    // Renderizar tabela de usuários se a aba for a correspondente
    if (subTabId === "tab-usuarios" && typeof window.renderUsersTable === "function") {
        window.renderUsersTable();
    }
    
    // Carregar configurações do Mercado Pago e WhatsApp
    if (subTabId === "tab-integracoes") {
        if (typeof window.loadMercadoPagoSettings === "function") {
            window.loadMercadoPagoSettings();
        }
        if (typeof window.loadWhatsAppSettings === "function") {
            window.loadWhatsAppSettings();
        }
    }
    
    // Renderizar painel de widgets
    if (subTabId === "tab-dados-fabrica") {
        renderWidgetsSetupPanel();
    }

    if (subTabId === "tab-acerto") {
        populateCargoSettlementDrivers();
    }
    
    if (subTabId === "tab-financeiro") {
        populateCommissionsDriverFilter();
        renderDriverCommissionsReport();
    }
    
    // Força a renderização dos ícones Lucide recém-exibidos
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

// 2. Fechamento de Autenticação Administrativa
export function closeAdminAuthModal() {
    const modal = document.getElementById("modal-admin-auth");
    if (modal) modal.classList.remove("active");
    
    // Voltar para a aba anterior
    const prevTab = window.lastActiveTab || "dashboard";
    const navItems = document.querySelectorAll(".nav-item");
    const tabContents = document.querySelectorAll(".tab-content");
    
    navItems.forEach(nav => nav.classList.remove("active"));
    const prevNavItem = document.querySelector(`.nav-item[data-tab="${prevTab}"]`);
    if (prevNavItem) prevNavItem.classList.add("active");
    
    tabContents.forEach(content => {
        content.classList.remove("active");
        if (content.id === prevTab) {
            content.classList.add("active");
        }
    });
    
    if (window.updateHeaderForTab) window.updateHeaderForTab(prevTab);
    if (window.renderTabContent) window.renderTabContent(prevTab);
}

export function lockAdminAccess() {
    window.showToast("Acesso restrito bloqueado. Efetuando logout do painel...", "error");
    if (window.logoutUser) window.logoutUser();
}

// 3. Catálogo e Preços Padrão / Clientes Específicos
export function renderPrecos() {
    // 1. Carregar preços padrão de fábrica nos inputs dinâmicos
    const factoryContainer = document.getElementById("factory-prices-inputs-container");
    if (factoryContainer) {
        factoryContainer.innerHTML = "";
        state.products.forEach(p => {
            const hasWholesale = p.wholesalePrices || {};
            const hasPromo = p.flashPromo || { active: false, price: 0, limit: null };
            
            let advancedHTML = `
                <div class="factory-price-row" style="border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 12px; margin-bottom: 12px;">
                    <div class="form-group" style="margin-bottom: 8px;">
                        <label for="cfg-price-${p.id}" style="font-weight: 600; display: flex; justify-content: space-between; align-items: center;">
                            <span>${p.name} (Preço Fardo/Pacote)</span>
                            <span style="font-size: 0.7rem; color: var(--color-primary);">${p.type}</span>
                        </label>
                        <input type="number" step="0.01" min="0" id="cfg-price-${p.id}" class="form-control factory-price-input" data-prod-id="${p.id}" value="${(p.defaultPrice || 0).toFixed(2)}" required>
                    </div>
                    
                    <details style="margin-top: 6px; cursor: pointer;">
                        <summary style="font-size: 0.75rem; color: var(--color-primary); outline: none; user-select: none;">
                            ⚙️ Configurações Avançadas (Atacado, Promoção${p.type === 'Gelo Saborizado' ? ', Varejo' : ''})
                        </summary>
                        <div style="padding: 10px; background: rgba(0, 0, 0, 0.2); border-radius: 6px; margin-top: 6px; display: flex; flex-direction: column; gap: 10px; cursor: default;" onclick="event.stopPropagation();">
            `;
            
            if (p.type === 'Gelo Saborizado') {
                advancedHTML += `
                            <div class="form-group">
                                <label style="font-size: 0.75rem; display: block; margin-bottom: 2px;">Preço Unitário (Varejo - 1 un) (R$)</label>
                                <input type="number" step="0.01" min="0" id="cfg-unit-price-${p.id}" class="form-control factory-unit-price-input" data-prod-id="${p.id}" value="${(p.unitPrice || 0).toFixed(2)}">
                            </div>
                `;
            }
            
            advancedHTML += `
                            <div style="border-top: 1px solid rgba(255,255,255,0.05); padding-top: 8px;">
                                <span style="font-size: 0.75rem; font-weight: bold; color: var(--color-text-main); display: block; margin-bottom: 4px;">Preços de Atacado (Fardo / Pacote)</span>
                                <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px;">
                                    <div>
                                        <span style="font-size: 0.6rem; color: var(--color-text-muted); display: block; text-align: center; margin-bottom: 2px;">Até 10 un</span>
                                        <input type="number" step="0.01" min="0" id="cfg-w1-${p.id}" class="form-control factory-w1-input" data-prod-id="${p.id}" value="${hasWholesale.tier1_10 ? hasWholesale.tier1_10.toFixed(2) : ''}" placeholder="Padrão" style="padding: 4px; font-size: 0.75rem; text-align: center;">
                                    </div>
                                    <div>
                                        <span style="font-size: 0.65rem; color: var(--color-text-muted); display: block; text-align: center; margin-bottom: 2px;">11 a 20 un</span>
                                        <input type="number" step="0.01" min="0" id="cfg-w2-${p.id}" class="form-control factory-w2-input" data-prod-id="${p.id}" value="${hasWholesale.tier11_20 ? hasWholesale.tier11_20.toFixed(2) : ''}" placeholder="Padrão" style="padding: 4px; font-size: 0.75rem; text-align: center;">
                                    </div>
                                    <div>
                                        <span style="font-size: 0.65rem; color: var(--color-text-muted); display: block; text-align: center; margin-bottom: 2px;">21 a 40 un</span>
                                        <input type="number" step="0.01" min="0" id="cfg-w3-${p.id}" class="form-control factory-w3-input" data-prod-id="${p.id}" value="${hasWholesale.tier21_40 ? hasWholesale.tier21_40.toFixed(2) : ''}" placeholder="Padrão" style="padding: 4px; font-size: 0.75rem; text-align: center;">
                                    </div>
                                    <div>
                                        <span style="font-size: 0.65rem; color: var(--color-text-muted); display: block; text-align: center; margin-bottom: 2px;">41 a 50 un</span>
                                        <input type="number" step="0.01" min="0" id="cfg-w4-${p.id}" class="form-control factory-w4-input" data-prod-id="${p.id}" value="${hasWholesale.tier41_50 ? hasWholesale.tier41_50.toFixed(2) : ''}" placeholder="Padrão" style="padding: 4px; font-size: 0.75rem; text-align: center;">
                                    </div>
                                    <div>
                                        <span style="font-size: 0.65rem; color: var(--color-text-muted); display: block; text-align: center; margin-bottom: 2px;">51+ un</span>
                                        <input type="number" step="0.01" min="0" id="cfg-w5-${p.id}" class="form-control factory-w5-input" data-prod-id="${p.id}" value="${hasWholesale.tier51 ? hasWholesale.tier51.toFixed(2) : ''}" placeholder="Padrão" style="padding: 4px; font-size: 0.75rem; text-align: center;">
                                    </div>
                                </div>
                            </div>
                            
                            <div style="border-top: 1px solid rgba(255,255,255,0.05); padding-top: 8px;">
                                <span style="font-size: 0.75rem; font-weight: bold; color: var(--color-text-main); display: block; margin-bottom: 4px;">Promoção Relâmpago</span>
                                <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
                                    <input type="checkbox" id="cfg-promo-active-${p.id}" class="factory-promo-active" data-prod-id="${p.id}" ${hasPromo.active ? 'checked' : ''} style="width: auto; height: auto; cursor: pointer;">
                                    <label for="cfg-promo-active-${p.id}" style="margin: 0; font-size: 0.7rem; cursor: pointer; color: var(--color-text-main);">Ativar Promoção para este item</label>
                                </div>
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                                    <div>
                                        <span style="font-size: 0.65rem; color: var(--color-text-muted); display: block; margin-bottom: 2px;">Preço Promo (R$)</span>
                                        <input type="number" step="0.01" min="0" id="cfg-promo-price-${p.id}" class="form-control factory-promo-price-input" data-prod-id="${p.id}" value="${hasPromo.price ? hasPromo.price.toFixed(2) : ''}" placeholder="0.00">
                                    </div>
                                    <div>
                                        <span style="font-size: 0.65rem; color: var(--color-text-muted); display: block; margin-bottom: 2px;">Qtd Limite de Vendas</span>
                                        <input type="number" min="0" id="cfg-promo-limit-${p.id}" class="form-control factory-promo-limit-input" data-prod-id="${p.id}" value="${(hasPromo.limit !== undefined && hasPromo.limit !== null && hasPromo.limit !== Infinity) ? hasPromo.limit : ''}" placeholder="Sem limite">
                                    </div>
                                </div>
                            </div>
                        </div>
                    </details>
                </div>
            `;
            factoryContainer.innerHTML += advancedHTML;
        });
    }

    // 2. Renderizar cabeçalho e linhas da tabela de preços específicos por cliente
    const thead = document.getElementById("pricing-clients-thead");
    const tbody = document.getElementById("pricing-clients-tbody");
    
    if (thead && tbody) {
        thead.innerHTML = "";
        tbody.innerHTML = "";

        const activeProducts = state.products.filter(p => p.active);
        
        if (state.clients.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="${activeProducts.length + 2}" style="padding: 1.5rem; text-align: center; color: var(--color-text-muted);">
                        Nenhum cliente cadastrado para definir preços específicos.
                    </td>
                </tr>
            `;
        } else {
            // Desenhar Thead
            let theadHTML = `<tr style="border-bottom: 2px solid rgba(255,255,255,0.1); font-weight: bold; text-align: left;">`;
            theadHTML += `<th style="padding: 10px;">Cliente</th>`;
            activeProducts.forEach(p => {
                theadHTML += `<th style="padding: 10px; text-align: right;">${p.name}</th>`;
            });
            theadHTML += `<th style="padding: 10px; text-align: center;">Ações</th>`;
            theadHTML += `</tr>`;
            thead.innerHTML = theadHTML;

            // Desenhar Tbody
            state.clients.forEach(c => {
                const cp = c.customPrices || {};
                
                let tbodyHTML = `<tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.03);">`;
                tbodyHTML += `<td style="padding: 10px; vertical-align: middle;">
                    <div style="font-weight: 600; color: var(--color-text-main);">${c.name}</div>
                    <div style="font-size: 0.7rem; color: var(--color-text-muted);">${c.freezerCode ? `Freezer: ${c.freezerCode}` : 'Sem freezer comodatado'}</div>
                </td>`;

                activeProducts.forEach(p => {
                    let price = "";
                    if (p.type === 'Gelo Saborizado') {
                        const priceFardo = cp[p.id] !== undefined && cp[p.id] > 0
                            ? `Fdo: <span style="color: var(--color-primary); font-weight: 700;">R$ ${cp[p.id].toFixed(2)}</span>`
                            : `Fdo: <span style="color: var(--color-text-muted); font-size: 0.75rem;">R$ ${(p.defaultPrice || 0).toFixed(2)}</span>`;
                        const priceUnit = cp[p.id + "_unit"] !== undefined && cp[p.id + "_unit"] > 0
                            ? `Un: <span style="color: var(--color-primary); font-weight: 700;">R$ ${cp[p.id + "_unit"].toFixed(2)}</span>`
                            : `Un: <span style="color: var(--color-text-muted); font-size: 0.75rem;">R$ ${(p.unitPrice || 0).toFixed(2)}</span>`;
                        price = `<div style="display: flex; flex-direction: column; align-items: flex-end; gap: 2px;">
                                    <div>${priceFardo}</div>
                                    <div>${priceUnit}</div>
                                 </div>`;
                    } else {
                        price = cp[p.id] !== undefined && cp[p.id] > 0 
                            ? `<span style="color: var(--color-primary); font-weight: 700;">R$ ${cp[p.id].toFixed(2)}</span>`
                            : `<span style="color: var(--color-text-muted); font-size: 0.8rem;">R$ ${(p.defaultPrice || 0).toFixed(2)} (Padrão)</span>`;
                    }
                    tbodyHTML += `<td style="padding: 10px; text-align: right; vertical-align: middle;">${price}</td>`;
                });

                const hasCustom = activeProducts.some(p => cp[p.id] > 0 || cp[p.id + "_unit"] > 0);
                tbodyHTML += `<td style="padding: 10px; text-align: center; vertical-align: middle;">
                    <div style="display: inline-flex; gap: 6px; justify-content: center;">
                        <button class="btn btn-primary" onclick="openClientPricesModal('${c.id}')" style="padding: 4px 8px; font-size: 0.75rem; display: inline-flex; align-items: center; gap: 4px;">
                            <i data-lucide="edit-3" style="width: 12px; height: 12px;"></i> Configurar
                        </button>
                        ${hasCustom ? `
                            <button class="btn btn-secondary" onclick="clearClientPrices('${c.id}')" style="padding: 4px 8px; font-size: 0.75rem; color: #ef4444; border-color: rgba(239, 68, 68, 0.2); background: rgba(239, 68, 68, 0.05);">
                                Limpar
                            </button>
                        ` : ""}
                    </div>
                </td>`;
                tbodyHTML += `</tr>`;
                
                tbody.innerHTML += tbodyHTML;
            });
        }
    }

    // 3. Preencher inputs de backup
    if (state.backupSettings) {
        document.getElementById("cfg-app-version").value = state.backupSettings.currentVersion || "1.0";
        document.getElementById("cfg-backup-frequency").value = state.backupSettings.frequencyDays !== undefined ? state.backupSettings.frequencyDays : 7;
        document.getElementById("lbl-last-backup-date").innerText = state.backupSettings.lastBackupDate 
            ? window.formatDateBrazil(state.backupSettings.lastBackupDate) 
            : "Nenhum backup realizado";
    }

    // 4. Renderizar histórico de backups locais
    const backupsTbody = document.getElementById("local-backups-tbody");
    if (backupsTbody) {
        backupsTbody.innerHTML = "";
        const backups = state.localBackups || [];
        
        if (backups.length === 0) {
            backupsTbody.innerHTML = `
                <tr>
                    <td colspan="3" style="padding: 1rem; text-align: center; color: var(--color-text-muted);">
                        Nenhum backup salvo localmente no navegador.
                    </td>
                </tr>
            `;
        } else {
            // Mostrar backups ordenados por data decrescente
            const sortedBackups = [...backups].sort((a, b) => new Date(b.date) - new Date(a.date));
            sortedBackups.forEach(b => {
                const dateStr = window.formatDateBrazil(b.date);
                backupsTbody.innerHTML += `
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);">
                        <td style="padding: 8px 6px; font-weight: 600; color: var(--color-primary);">v${b.version}</td>
                        <td style="padding: 8px 6px; color: var(--color-text-main); font-size: 0.75rem;">${dateStr}</td>
                        <td style="padding: 4px 6px; text-align: right; display: flex; gap: 4px; justify-content: flex-end; align-items: center;">
                            <button class="btn btn-secondary" onclick="restoreLocalBackup('${b.id}')" title="Restaurar este backup" style="padding: 3px 6px; font-size: 0.7rem; display: inline-flex; align-items: center; gap: 2px;">
                                <i data-lucide="rotate-ccw" style="width: 11px; height: 11px;"></i> Restaurar
                            </button>
                            <button class="btn btn-secondary btn-icon-only" onclick="downloadBackupJSON('${b.id}')" title="Baixar arquivo JSON" style="padding: 3px 6px; display: inline-flex; align-items: center; justify-content: center;">
                                <i data-lucide="download" style="width: 12px; height: 12px;"></i>
                            </button>
                            <button class="btn btn-danger btn-icon-only" onclick="deleteLocalBackup('${b.id}')" title="Excluir do histórico" style="padding: 3px 6px; display: inline-flex; align-items: center; justify-content: center;">
                                <i data-lucide="trash-2" style="width: 12px; height: 12px;"></i>
                            </button>
                        </td>
                    </tr>
                `;
            });
        }
    }

    // 5. Preencher inputs de dados comerciais
    if (state.factorySettings) {
        document.getElementById("cfg-factory-name").value = state.factorySettings.name || "";
        document.getElementById("cfg-factory-cnpj").value = state.factorySettings.cnpj || "";
        document.getElementById("cfg-factory-phone").value = state.factorySettings.phone || "";
        document.getElementById("cfg-factory-address").value = state.factorySettings.address || "";
        document.getElementById("cfg-factory-email").value = state.factorySettings.email || "";
        const pixEl = document.getElementById("cfg-factory-pix");
        if (pixEl) pixEl.value = state.factorySettings.pixKey || "";
        
        const rentalTermsEl = document.getElementById("cfg-factory-rental-terms");
        if (rentalTermsEl) rentalTermsEl.value = state.factorySettings.rentalTerms || "";
        
        const logoPreviewImg = document.getElementById("img-logo-preview");
        if (logoPreviewImg) {
            logoPreviewImg.src = state.factorySettings.logo || "logo_horizontal.jpg";
        }
    }

    // 6. Preencher inputs de aparência
    if (state.appearance) {
        const themePreset = state.appearance.themeName || "ciano";
        document.getElementById("cfg-theme-preset").value = themePreset;
        document.getElementById("cfg-custom-color").value = state.appearance.primaryColor || "#00f0ff";
        document.getElementById("cfg-custom-color-text").value = state.appearance.primaryColor || "#00f0ff";
        
        // Destacar o cartão de tema correspondente
        const cards = document.querySelectorAll(".theme-card");
        cards.forEach(card => {
            const t = card.getAttribute("data-theme");
            if (t === themePreset) {
                card.style.border = "2px solid var(--color-primary)";
                card.style.background = "rgba(var(--color-primary-rgb), 0.08)";
                card.style.boxShadow = "0 0 15px rgba(var(--color-primary-rgb), 0.3)";
                card.style.transform = "translateY(-2px)";
            } else {
                card.style.border = "2px solid rgba(255,255,255,0.05)";
                card.style.background = "rgba(255,255,255,0.03)";
                card.style.boxShadow = "none";
                card.style.transform = "none";
            }
        });
        
        const pickerGroup = document.getElementById("custom-color-picker-group");
        if (pickerGroup) {
            pickerGroup.style.display = themePreset === "custom" ? "block" : "none";
        }
        
        // Preencher novas opções avançadas
        const bgStyle = state.appearance.backgroundStyle || "darkSpace";
        document.getElementById("cfg-bg-style").value = bgStyle;
        document.getElementById("cfg-custom-bg-color").value = state.appearance.customBgColor || "#090d16";
        document.getElementById("cfg-custom-bg-color-text").value = state.appearance.customBgColor || "#090d16";
        
        const bgPickerGroup = document.getElementById("custom-bg-color-group");
        if (bgPickerGroup) {
            bgPickerGroup.style.display = bgStyle === "custom" ? "block" : "none";
        }
        
        document.getElementById("cfg-panel-style").value = state.appearance.panelStyle || "glassmorphism";
        document.getElementById("cfg-glow-intensity").value = state.appearance.glowIntensity || "high";

        const chkSound = document.getElementById("cfg-sound-enabled");
        if (chkSound) chkSound.checked = state.appearance.soundEnabled !== false;

        const chkHaptic = document.getElementById("cfg-haptic-enabled");
        if (chkHaptic) chkHaptic.checked = state.appearance.hapticEnabled !== false;

        const chkWeather = document.getElementById("cfg-weather-theme-enabled");
        if (chkWeather) chkWeather.checked = state.appearance.weatherThemeEnabled !== false;

        const chkTilt = document.getElementById("cfg-3d-tilt-enabled");
        if (chkTilt) chkTilt.checked = state.appearance.tilt3DEnabled !== false;
    }

    // 7. Preencher inputs de configuração de impressão
    if (state.printSettings) {
        document.getElementById("cfg-print-format").value = state.printSettings.format || "a4";
        document.getElementById("cfg-print-show-logo").checked = state.printSettings.showLogo !== undefined ? state.printSettings.showLogo : true;
        document.getElementById("cfg-print-show-signatures").checked = state.printSettings.showSignatures !== undefined ? state.printSettings.showSignatures : true;
    }

    // 8. Preencher inputs do Firebase
    if (state.firebaseConfig) {
        const fbEnabled = document.getElementById("cfg-fb-enabled");
        if (fbEnabled) fbEnabled.checked = state.firebaseConfig.enabled || false;
        const fbApiKey = document.getElementById("cfg-fb-api-key");
        if (fbApiKey) fbApiKey.value = state.firebaseConfig.apiKey || "";
        const fbProjectId = document.getElementById("cfg-fb-project-id");
        if (fbProjectId) fbProjectId.value = state.firebaseConfig.projectId || "";
        const fbDbUrl = document.getElementById("cfg-fb-db-url");
        if (fbDbUrl) fbDbUrl.value = state.firebaseConfig.databaseURL || "";
        const fbDeviceKey = document.getElementById("cfg-fb-device-key");
        if (fbDeviceKey) fbDeviceKey.value = state.firebaseConfig.deviceKey || "";
    }

    // Carregar novos painéis operacionais e financeiros
    renderFinancialDashboard();
    renderCargoStockInputs();
    calculateCargoSettlement();
    
    // Novas melhorias operacionais
    renderAccountsReceivable();
    renderSuppliers();
    renderPackaging();
    renderPackagingTransactions();
    if (window.renderComodatosAdmin) window.renderComodatosAdmin();
    
    // Configurações de Comissão
    if (state.commissionSettings) {
        document.getElementById("commission-type").value = state.commissionSettings.type || "none";
        document.getElementById("commission-value").value = state.commissionSettings.value !== undefined ? state.commissionSettings.value : 0;
        toggleCommissionValueLabel();
    }

    switchAdminSubTab(window.activeAdminSubTab || "tab-financeiro");
}

export function openClientPricesModal(clientId) {
    const client = state.clients.find(c => c.id === clientId);
    if (!client) return;

    document.getElementById("form-client-prices-id").value = client.id;
    document.getElementById("custom-price-client-name").innerText = client.name;

    const cp = client.customPrices || {};
    
    // Popular contêiner de inputs dinâmicos
    const container = document.getElementById("client-prices-inputs-container");
    if (container) {
        container.innerHTML = "";
        
        const activeProducts = state.products.filter(p => p.active);
        activeProducts.forEach(p => {
            const val = cp[p.id] ? cp[p.id].toFixed(2) : "";
            container.innerHTML += `
                <div class="form-group">
                    <label for="cust-price-${p.id}">${p.name} (R$)</label>
                    <input type="number" step="0.01" min="0" id="cust-price-${p.id}" class="form-control client-custom-price-input" data-prod-id="${p.id}" value="${val}" placeholder="Padrão: R$ ${(p.defaultPrice || 0).toFixed(2)}">
                </div>
            `;
            
            if (p.type === 'Gelo Saborizado') {
                const valUnit = cp[p.id + "_unit"] ? cp[p.id + "_unit"].toFixed(2) : "";
                container.innerHTML += `
                    <div class="form-group" style="margin-top: -6px; padding-left: 10px; border-left: 2px solid var(--color-primary);">
                        <label for="cust-price-unit-${p.id}" style="font-size: 0.75rem;">${p.name} (Unidade Avulsa - R$)</label>
                        <input type="number" step="0.01" min="0" id="cust-price-unit-${p.id}" class="form-control client-custom-price-unit-input" data-prod-id="${p.id}_unit" value="${valUnit}" placeholder="Padrão: R$ ${(p.unitPrice || 0).toFixed(2)}">
                    </div>
                `;
            }
        });
    }

    document.getElementById("modal-client-prices").classList.add("active");
}

export function clearClientPrices(clientId) {
    const client = state.clients.find(c => c.id === clientId);
    if (!client) return;

    window.showConfirm(
        `Deseja realmente limpar todos os preços especiais de ${client.name}? Ele voltará a pagar os valores padrão da fábrica.`,
        () => {
            client.customPrices = {};
            saveState();
            renderPrecos();
        },
        null,
        "Limpar Preços",
        "Limpar"
    );
}

// 4. Sistema de Backup
export function generateBackup(isAuto = false) {
    const version = (state.backupSettings && state.backupSettings.currentVersion) || "1.0";
    const backupDate = window.getBrazilTimeISO();
    
    // Payload do backup: dados operacionais sem o histórico de backups locais para não estourar o tamanho
    const backupPayload = {
        version: version,
        date: backupDate,
        data: {
            clients: state.clients || [],
            freezers: state.freezers || [],
            rentals: state.rentals || [],
            documents: state.documents || [],
            prices: state.prices || {},
            history: state.history || [],
            deliveries: state.deliveries || [],
            products: state.products || [],
            orders: state.orders || [],
            payments: state.payments || [],
            comodatos: state.comodatos || [],
            cargoSettlements: state.cargoSettlements || [],
            suppliers: state.suppliers || [],
            packaging: state.packaging || [],
            users: state.users || [],
            factorySettings: state.factorySettings || {},
            appearance: state.appearance || {},
            widgets: state.widgets || {}
        }
    };

    const backupId = "bkp_" + Date.now();
    const newBackup = {
        id: backupId,
        version: version,
        date: backupDate,
        payload: backupPayload
    };

    if (!state.localBackups) state.localBackups = [];
    state.localBackups.push(newBackup);

    // Rotacionar histórico local (limite de 5 backups)
    if (state.localBackups.length > 5) {
        state.localBackups.sort((a, b) => new Date(a.date) - new Date(b.date));
        while (state.localBackups.length > 5) {
            state.localBackups.shift();
        }
    }

    if (!state.backupSettings) {
        state.backupSettings = { frequencyDays: 7, lastBackupDate: "", currentVersion: APP_VERSION };
    }
    state.backupSettings.lastBackupDate = backupDate;

    saveState();
    renderPrecos();

    // Disparar o download físico do arquivo JSON
    const jsonString = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupPayload, null, 2));
    const downloadAnchor = document.createElement('a');
    const formattedDate = new Date(backupDate).toISOString().slice(0, 16).replace('T', '_').replace(':', '-');
    
    downloadAnchor.setAttribute("href", jsonString);
    downloadAnchor.setAttribute("download", `gelodovale_backup_v${version}_${formattedDate}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    if (isAuto) {
        window.showToast(`[Backup Automático] Uma cópia de segurança (versão ${version}) foi gerada com sucesso e salva na sua pasta de Downloads.`, "success");
    } else {
        window.showToast(`Backup versão ${version} realizado e baixado com sucesso!`, "success");
    }
}

export function restoreLocalBackup(backupId) {
    const backup = (state.localBackups || []).find(b => b.id === backupId);
    if (!backup) {
        window.showToast("Backup não encontrado!", "error");
        return;
    }

    window.showConfirm(
        `ATENÇÃO: Deseja realmente restaurar o backup da versão ${backup.version} criado em ${window.formatDateBrazil(backup.date)}?\n\nIsso substituirá TODOS os clientes, equipamentos, aluguéis, recibos e configurações atuais.`,
        () => {
            applyBackupData(backup.payload);
        },
        null,
        "Restaurar Backup",
        "Restaurar"
    );
}

export function applyBackupData(payload) {
    try {
        if (!payload || !payload.data) {
            throw new Error("Formato de backup inválido.");
        }

        const d = payload.data;
        state.clients = d.clients || [];
        state.freezers = d.freezers || [];
        state.rentals = d.rentals || [];
        state.documents = d.documents || [];
        state.prices = d.prices || {};
        state.history = d.history || [];
        state.deliveries = d.deliveries || [];
        state.products = d.products || [];
        state.orders = d.orders || [];
        state.payments = d.payments || [];
        state.comodatos = d.comodatos || [];
        state.cargoSettlements = d.cargoSettlements || [];
        state.suppliers = d.suppliers || [];
        state.packaging = d.packaging || [];
        state.users = d.users || [];
        
        if (d.factorySettings) state.factorySettings = d.factorySettings;
        if (d.appearance) {
            state.appearance = d.appearance;
            applyAppearanceTheme(state.appearance);
        }
        if (d.widgets) state.widgets = d.widgets;

        if (payload.version && state.backupSettings) {
            state.backupSettings.currentVersion = payload.version;
        }

        saveState();
        if (window.renderApp) window.renderApp();
        window.showToast("Backup restaurado com sucesso! Os dados foram atualizados.", "success");
    } catch (e) {
        console.error(e);
        window.showToast("Falha ao restaurar o backup: " + e.message, "error");
    }
}

export function downloadBackupJSON(backupId) {
    const backup = (state.localBackups || []).find(b => b.id === backupId);
    if (!backup) return;

    const jsonString = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backup.payload, null, 2));
    const downloadAnchor = document.createElement('a');
    const formattedDate = new Date(backup.date).toISOString().slice(0, 16).replace('T', '_').replace(':', '-');
    downloadAnchor.setAttribute("href", jsonString);
    downloadAnchor.setAttribute("download", `gelodovale_backup_v${backup.version}_${formattedDate}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
}

export function deleteLocalBackup(backupId) {
    window.showConfirm(
        "Deseja realmente excluir este backup do histórico interno do navegador?",
        () => {
            state.localBackups = (state.localBackups || []).filter(b => b.id !== backupId);
            saveState();
            renderPrecos();
        },
        null,
        "Excluir Backup",
        "Excluir"
    );
}

export function importBackupFromFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const payload = JSON.parse(e.target.result);
            if (!payload.data || !payload.version) {
                window.showToast("Erro: O arquivo selecionado não é um backup válido do Gelo do Vale!", "error");
                return;
            }
            window.showConfirm(
                `Deseja realmente restaurar o backup físico da versão ${payload.version} criado em ${window.formatDateBrazil(payload.date || Date.now())}?`,
                () => {
                    applyBackupData(payload);
                },
                null,
                "Restaurar Backup",
                "Restaurar"
            );
        } catch (err) {
            console.error(err);
            window.showToast("Erro ao ler o arquivo JSON: " + err.message, "error");
        }
        event.target.value = "";
    };
    reader.readAsText(file);
}

export function checkAutoBackupOnLoad() {
    if (!state.backupSettings) return;

    const freq = parseInt(state.backupSettings.frequencyDays);
    if (freq === 0) return;

    const lastBackup = state.backupSettings.lastBackupDate;
    if (!lastBackup) {
        console.log("Nenhum backup registrado anteriormente. Disparando backup de primeiro uso...");
        setTimeout(() => {
            generateBackup(true);
        }, 1500);
        return;
    }

    const lastTime = new Date(lastBackup).getTime();
    const nowTime = Date.now();
    const diffDays = (nowTime - lastTime) / (1000 * 60 * 60 * 24);

    if (diffDays >= freq) {
        console.log(`Último backup feito há ${diffDays.toFixed(1)} dias (limite: ${freq} dias). Disparando backup automático...`);
        setTimeout(() => {
            generateBackup(true);
        }, 1500);
    }
}

// 5. Configuração de Aparência e Temas
export function applyAppearanceTheme(customTheme = null) {
    let theme = customTheme || (state && state.appearance);
    if (!theme) {
        theme = {
            themeName: "ciano",
            primaryColor: "#00f0ff",
            primaryColorRgb: "0, 240, 255",
            secondaryColor: "#0072ff",
            backgroundStyle: "darkSpace",
            customBgColor: "#090d16",
            panelStyle: "glassmorphism",
            glowIntensity: "high"
        };
    }
    
    // 1. Determinar cor de fundo geral do app
    let bgColor = "#090d16";
    if (theme.backgroundStyle === "midnightNavy") bgColor = "#0b111e";
    else if (theme.backgroundStyle === "graphiteGrey") bgColor = "#121212";
    else if (theme.backgroundStyle === "amoledBlack") bgColor = "#000000";
    else if (theme.backgroundStyle === "custom") bgColor = theme.customBgColor || "#090d16";
    
    // 2. Determinar estilo de painel (background do card e bordas)
    let cardBg = "rgba(17, 25, 44, 0.65)";
    let cardBgHover = "rgba(26, 38, 64, 0.8)";
    let cardBorder = `rgba(${theme.primaryColorRgb}, 0.08)`;
    let cardBorderHover = `rgba(${theme.primaryColorRgb}, 0.25)`;
    
    if (theme.panelStyle === "solidMinimal") {
        cardBg = "#151b2a";
        cardBgHover = "#1c2438";
        cardBorder = "rgba(255, 255, 255, 0.05)";
        cardBorderHover = "rgba(255, 255, 255, 0.12)";
    } else if (theme.panelStyle === "borderless") {
        cardBg = "rgba(20, 28, 48, 0.7)";
        cardBgHover = "rgba(28, 38, 64, 0.8)";
        cardBorder = "transparent";
        cardBorderHover = "transparent";
    } else if (theme.panelStyle === "highContrast") {
        cardBg = "rgba(10, 15, 28, 0.9)";
        cardBgHover = "rgba(15, 22, 40, 0.95)";
        cardBorder = `rgba(${theme.primaryColorRgb}, 0.3)`;
        cardBorderHover = `rgba(${theme.primaryColorRgb}, 0.6)`;
    }
    
    // 3. Determinar intensidade de brilho neon
    let shadowNeon = `0 0 15px rgba(${theme.primaryColorRgb}, 0.25)`;
    let shadowNeonHover = `0 0 25px rgba(${theme.primaryColorRgb}, 0.45)`;
    
    if (theme.glowIntensity === "soft") {
        shadowNeon = `0 4px 10px rgba(${theme.primaryColorRgb}, 0.1)`;
        shadowNeonHover = `0 6px 15px rgba(${theme.primaryColorRgb}, 0.2)`;
    } else if (theme.glowIntensity === "off") {
        shadowNeon = "none";
        shadowNeonHover = "none";
    }
    
    let styleEl = document.getElementById("dynamic-theme");
    if (!styleEl) {
        styleEl = document.createElement("style");
        styleEl.id = "dynamic-theme";
        document.head.appendChild(styleEl);
    }
    
    styleEl.innerHTML = `
        :root {
            --bg-main: ${bgColor} !important;
            --bg-card: ${cardBg} !important;
            --bg-card-hover: ${cardBgHover} !important;
            --border-card: ${cardBorder} !important;
            --border-card-hover: ${cardBorderHover} !important;
            --color-primary: ${theme.primaryColor} !important;
            --color-primary-rgb: ${theme.primaryColorRgb} !important;
            --color-secondary: ${theme.secondaryColor} !important;
            --shadow-neon: ${shadowNeon} !important;
            --shadow-neon-hover: ${shadowNeonHover} !important;
        }
        ::-webkit-scrollbar-thumb {
            background: rgba(${theme.primaryColorRgb}, 0.2) !important;
        }
        ::-webkit-scrollbar-thumb:hover {
            background: rgba(${theme.primaryColorRgb}, 0.4) !important;
        }
    `;
    
    // Atualizar logotipo da barra lateral
    const logoImg = document.querySelector("aside.sidebar .logo-container img");
    if (logoImg) {
        if (state && state.factorySettings && state.factorySettings.logo) {
            logoImg.src = state.factorySettings.logo;
        } else {
            logoImg.src = "logo_horizontal.jpg";
        }
    }

    // Atualizar UI dos botões rápidos e clima
    if (window.updateQuickTogglesUI) {
        window.updateQuickTogglesUI();
    }
    if (window.renderWeather) {
        window.renderWeather();
    }
}

export function getCurrentUIThemeSettings() {
    const themePreset = document.getElementById("cfg-theme-preset").value || "ciano";
    let primaryColor = "#00f0ff";
    let primaryColorRgb = "0, 240, 255";
    let secondaryColor = "#0072ff";
    
    if (themePreset === "ciano") {
        primaryColor = "#00f0ff";
        primaryColorRgb = "0, 240, 255";
        secondaryColor = "#0072ff";
    } else if (themePreset === "verde") {
        primaryColor = "#10b981";
        primaryColorRgb = "16, 185, 129";
        secondaryColor = "#047857";
    } else if (themePreset === "laranja") {
        primaryColor = "#f59e0b";
        primaryColorRgb = "245, 158, 11";
        secondaryColor = "#b45309";
    } else if (themePreset === "rosa") {
        primaryColor = "#ff007f";
        primaryColorRgb = "255, 0, 127";
        secondaryColor = "#7900ff";
    } else if (themePreset === "roxo") {
        primaryColor = "#8b5cf6";
        primaryColorRgb = "139, 92, 246";
        secondaryColor = "#4c1d95";
    } else if (themePreset === "custom") {
        primaryColor = document.getElementById("cfg-custom-color").value || "#00f0ff";
        const hex = primaryColor.replace("#", "");
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        primaryColorRgb = `${r}, ${g}, ${b}`;
        
        const rSec = Math.max(0, r - 30);
        const gSec = Math.max(0, g - 20);
        const bSec = Math.min(255, b + 50);
        secondaryColor = `rgb(${rSec}, ${gSec}, ${bSec})`;
    }
    
    const backgroundStyle = document.getElementById("cfg-bg-style").value || "darkSpace";
    const customBgColor = document.getElementById("cfg-custom-bg-color").value || "#090d16";
    const panelStyle = document.getElementById("cfg-panel-style").value || "glassmorphism";
    const glowIntensity = document.getElementById("cfg-glow-intensity").value || "high";

    const soundEnabled = document.getElementById("cfg-sound-enabled") ? document.getElementById("cfg-sound-enabled").checked : (state.appearance ? state.appearance.soundEnabled !== false : true);
    const hapticEnabled = document.getElementById("cfg-haptic-enabled") ? document.getElementById("cfg-haptic-enabled").checked : (state.appearance ? state.appearance.hapticEnabled !== false : true);
    const weatherThemeEnabled = document.getElementById("cfg-weather-theme-enabled") ? document.getElementById("cfg-weather-theme-enabled").checked : (state.appearance ? state.appearance.weatherThemeEnabled !== false : true);
    
    return {
        themeName: themePreset,
        primaryColor,
        primaryColorRgb,
        secondaryColor,
        backgroundStyle,
        customBgColor,
        panelStyle,
        glowIntensity,
        soundEnabled,
        hapticEnabled,
        weatherThemeEnabled
    };
}

export function handlePresetThemeChange(val) {
    const pickerGroup = document.getElementById("custom-color-picker-group");
    if (pickerGroup) {
        pickerGroup.style.display = val === "custom" ? "block" : "none";
    }
    applyAppearanceTheme(getCurrentUIThemeSettings());
}

export function handleBgStyleChange(val) {
    const bgPickerGroup = document.getElementById("custom-bg-color-group");
    if (bgPickerGroup) {
        bgPickerGroup.style.display = val === "custom" ? "block" : "none";
    }
    applyAppearanceTheme(getCurrentUIThemeSettings());
}

export function handleCustomBgColorInput(val) {
    const textInput = document.getElementById("cfg-custom-bg-color-text");
    if (textInput) textInput.value = val;
    applyAppearanceTheme(getCurrentUIThemeSettings());
}

export function handleCustomBgColorTextInput(val) {
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
        const pickerInput = document.getElementById("cfg-custom-bg-color");
        if (pickerInput) pickerInput.value = val;
        applyAppearanceTheme(getCurrentUIThemeSettings());
    }
}

export function handlePanelStyleChange(val) {
    applyAppearanceTheme(getCurrentUIThemeSettings());
}

export function handleGlowIntensityChange(val) {
    applyAppearanceTheme(getCurrentUIThemeSettings());
}

export function handleCustomColorInput(val) {
    const textInput = document.getElementById("cfg-custom-color-text");
    if (textInput) textInput.value = val;
    applyAppearanceTheme(getCurrentUIThemeSettings());
}

export function handleCustomColorTextInput(val) {
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
        const pickerInput = document.getElementById("cfg-custom-color");
        if (pickerInput) pickerInput.value = val;
        applyAppearanceTheme(getCurrentUIThemeSettings());
    }
}

export function handleFactoryLogoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            
            const MAX_WIDTH = 300;
            let width = img.width;
            let height = img.height;
            
            if (width > MAX_WIDTH) {
                height = Math.round((height * MAX_WIDTH) / width);
                width = MAX_WIDTH;
            }
            
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
            
            const compressedBase64 = canvas.toDataURL("image/jpeg", 0.6);
            
            if (!state.factorySettings) state.factorySettings = {};
            state.factorySettings.logo = compressedBase64;
            
            const previewImg = document.getElementById("img-logo-preview");
            if (previewImg) previewImg.src = compressedBase64;
            
            const logoImg = document.querySelector("aside.sidebar .logo-container img");
            if (logoImg) logoImg.src = compressedBase64;
            
            saveState();
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

export function removeFactoryLogo() {
    window.showConfirm(
        "Deseja realmente remover o logotipo atual?",
        () => {
            if (!state.factorySettings) state.factorySettings = {};
            state.factorySettings.logo = "";
            
            const previewImg = document.getElementById("img-logo-preview");
            if (previewImg) previewImg.src = "logo_horizontal.jpg";
            
            const logoImg = document.querySelector("aside.sidebar .logo-container img");
            if (logoImg) logoImg.src = "logo_horizontal.jpg";
            
            saveState();
        },
        null,
        "Remover Logotipo",
        "Remover"
    );
}

export function selectThemeCard(themeName) {
    const hiddenPreset = document.getElementById("cfg-theme-preset");
    if (hiddenPreset) hiddenPreset.value = themeName;
    
    const cards = document.querySelectorAll(".theme-card");
    cards.forEach(card => {
        const t = card.getAttribute("data-theme");
        if (t === themeName) {
            card.style.border = "2px solid var(--color-primary)";
            card.style.background = "rgba(var(--color-primary-rgb), 0.08)";
            card.style.boxShadow = "0 0 15px rgba(var(--color-primary-rgb), 0.3)";
            card.style.transform = "translateY(-2px)";
        } else {
            card.style.border = "2px solid rgba(255,255,255,0.05)";
            card.style.background = "rgba(255,255,255,0.03)";
            card.style.boxShadow = "none";
            card.style.transform = "none";
        }
    });
    
    handlePresetThemeChange(themeName);
    
    // Salvar o tema automaticamente ao clicar
    const settings = getCurrentUIThemeSettings();
    state.appearance = settings;
    saveState();
    if (window.showToast) window.showToast("Aparência salva!", "success");
}

// 6. Fechamento de Carga e Acerto de Viagem
export function renderCargoStockInputs() {
    const container = document.getElementById("cargo-stock-inputs");
    if (!container) return;
    
    const activeProds = state.products.filter(p => p.active && (p.type === 'Gelo' || p.type === 'Carvão' || p.type === 'Gelo Saborizado'));
    container.innerHTML = "";
    
    if (activeProds.length === 0) {
        container.innerHTML = `<p style="color: var(--color-text-muted); font-size: 0.8rem;">Nenhum produto ativo cadastrado.</p>`;
        return;
    }
    
    activeProds.forEach(p => {
        container.innerHTML += `
            <div style="border-bottom: 1px solid rgba(255,255,255,0.03); padding-bottom: 8px; margin-bottom: 8px;">
                <h4 style="font-size: 0.85rem; color: #fff; margin-bottom: 4px;">${p.name}</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 8px;">
                    <div>
                        <label style="font-size: 0.65rem; color: var(--color-text-muted);">Saída</label>
                        <input type="number" min="0" id="cargo-out-${p.id}" class="form-control" style="padding: 4px 8px; font-size: 0.8rem;" value="0" oninput="window.calculateCargoSettlement()">
                    </div>
                    <div>
                        <label style="font-size: 0.65rem; color: var(--color-text-muted);">Retorno</label>
                        <input type="number" min="0" id="cargo-return-${p.id}" class="form-control" style="padding: 4px 8px; font-size: 0.8rem;" value="0" oninput="window.calculateCargoSettlement()">
                    </div>
                    <div>
                        <label style="font-size: 0.65rem; color: var(--color-text-muted);">Quebra</label>
                        <input type="number" min="0" id="cargo-loss-${p.id}" class="form-control" style="padding: 4px 8px; font-size: 0.8rem; border-color: rgba(239, 68, 68, 0.4);" value="0" oninput="window.calculateCargoSettlement()">
                    </div>
                    <div>
                        <label style="font-size: 0.65rem; color: var(--color-text-muted);">Vendas</label>
                        <input type="number" min="0" id="cargo-sales-${p.id}" class="form-control" style="padding: 4px 8px; font-size: 0.8rem; background: rgba(0,0,0,0.2); color: #fff;" value="0" readonly>
                    </div>
                </div>
            </div>
        `;
    });
}

export function loadTodaySalesData() {
    const todayStr = window.getBrazilTimeISO().split('T')[0];
    const activeProds = state.products.filter(p => p.active && (p.type === 'Gelo' || p.type === 'Carvão' || p.type === 'Gelo Saborizado'));
    
    const salesMap = {};
    activeProds.forEach(p => {
        salesMap[p.id] = 0;
    });
    
    // 1. Somar de state.deliveries
    state.deliveries.forEach(del => {
        if (del.date && del.date.startsWith(todayStr)) {
            activeProds.forEach(p => {
                const qtyFardos = del.items[p.id] || 0;
                salesMap[p.id] += qtyFardos;
            });
        }
    });
    
    // 2. Somar de state.documents (tipo "recibo" ou "nota")
    state.documents.forEach(doc => {
        if ((doc.type === "recibo" || doc.type === "nota") && doc.date === todayStr) {
            doc.items.forEach(it => {
                const prod = activeProds.find(p => p.name === it.name);
                if (prod) {
                    salesMap[prod.id] += it.qty;
                }
            });
        }
    });
    
    activeProds.forEach(p => {
        const input = document.getElementById(`cargo-sales-${p.id}`);
        if (input) {
            input.value = salesMap[p.id];
        }
    });
    
    // Estimar faturamento recebido hoje por meio de pagamento
    let totalCash = 0;
    let totalPix = 0;
    let totalCard = 0;
    
    state.deliveries.forEach(del => {
        if (del.date && del.date.startsWith(todayStr)) {
            const method = (del.paymentMethod || 'pix').toLowerCase();
            const rev = del.revenue || 0;
            if (method.includes('dinheiro') || method.includes('cash')) {
                totalCash += rev;
            } else if (method.includes('cartão') || method.includes('cartao') || method.includes('card') || method.includes('débito') || method.includes('credito')) {
                totalCard += rev;
            } else {
                totalPix += rev; // Padrão: Pix
            }
        }
    });
    
    state.documents.forEach(doc => {
        if ((doc.type === "recibo" || doc.type === "nota") && doc.date === todayStr) {
            const method = (doc.paymentMethod || "").toLowerCase();
            if (method.includes("dinheiro")) {
                totalCash += doc.total;
            } else if (method.includes("pix")) {
                totalPix += doc.total;
            } else if (method.includes("cartão") || method.includes("cartao") || method.includes("crédito") || method.includes("débito")) {
                totalCard += doc.total;
            } else {
                totalCash += doc.total;
            }
        }
    });
    
    document.getElementById("settle-cash-received").value = totalCash.toFixed(2);
    document.getElementById("settle-pix-received").value = totalPix.toFixed(2);
    document.getElementById("settle-card-received").value = totalCard.toFixed(2);
    
    calculateCargoSettlement();
    window.showToast("Dados de vendas de hoje carregados com sucesso!", "success");
}

export function calculateCargoSettlement() {
    const resultsDiv = document.getElementById("cargo-settlement-results");
    if (!resultsDiv) return;
    
    const driverSelect = document.getElementById("settle-driver-id");
    const driverName = driverSelect && driverSelect.selectedIndex >= 0 ? driverSelect.options[driverSelect.selectedIndex].text : "Não selecionado";
    
    const activeProds = state.products.filter(p => p.active && (p.type === 'Gelo' || p.type === 'Carvão' || p.type === 'Gelo Saborizado'));
    
    let stockDivergenceHTML = "";
    let totalExpectedRevenue = 0;
    let hasDivergence = false;
    let totalFardosSold = 0;
    
    activeProds.forEach(p => {
        const outQty = parseInt(document.getElementById(`cargo-out-${p.id}`).value) || 0;
        const returnQty = parseInt(document.getElementById(`cargo-return-${p.id}`).value) || 0;
        const lossQty = parseInt(document.getElementById(`cargo-loss-${p.id}`).value) || 0;
        const salesQty = parseInt(document.getElementById(`cargo-sales-${p.id}`).value) || 0;
        
        const theoreticalReturn = outQty - salesQty - lossQty;
        const diff = returnQty - theoreticalReturn;
        
        const price = p.defaultPrice || 0;
        const soldQty = outQty - returnQty - lossQty;
        totalFardosSold += Math.max(0, soldQty);
        const expectedRevenue = Math.max(0, soldQty) * price;
        totalExpectedRevenue += expectedRevenue;
        
        let diffClass = "color: var(--color-success);";
        let diffSign = "";
        if (diff < 0) {
            diffClass = "color: var(--color-danger);";
            diffSign = "";
            hasDivergence = true;
        } else if (diff > 0) {
            diffClass = "color: var(--color-primary);";
            diffSign = "+";
            hasDivergence = true;
        }
        
        stockDivergenceHTML += `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);">
                <td style="padding: 6px 0; font-size: 0.8rem; color: #fff;">${p.name}</td>
                <td style="padding: 6px 0; font-size: 0.8rem; text-align: center;">${outQty}</td>
                <td style="padding: 6px 0; font-size: 0.8rem; text-align: center;">${salesQty}</td>
                <td style="padding: 6px 0; font-size: 0.8rem; text-align: center;">${returnQty}</td>
                <td style="padding: 6px 0; font-size: 0.8rem; text-align: center; ${diffClass} font-weight: bold;">${diffSign}${diff}</td>
            </tr>
        `;
    });
    
    const cashReceived = parseFloat(document.getElementById("settle-cash-received").value) || 0;
    const pixReceived = parseFloat(document.getElementById("settle-pix-received").value) || 0;
    const cardReceived = parseFloat(document.getElementById("settle-card-received").value) || 0;
    
    const totalReceived = cashReceived + pixReceived + cardReceived;
    
    const todayStr = window.getBrazilTimeISO().split('T')[0];
    let actualRegisteredRevenue = 0;
    state.deliveries.forEach(del => {
        if (del.date.startsWith(todayStr)) {
            actualRegisteredRevenue += del.revenue;
        }
    });
    state.documents.forEach(doc => {
        if ((doc.type === "recibo" || doc.type === "nota") && doc.date === todayStr) {
            actualRegisteredRevenue += doc.total;
        }
    });
    
    const financialDiff = totalReceived - actualRegisteredRevenue;
    let financialDiffClass = "color: var(--color-success);";
    let financialSign = "";
    if (financialDiff < 0) {
        financialDiffClass = "color: var(--color-danger);";
        financialSign = "";
    } else if (financialDiff > 0) {
        financialDiffClass = "color: var(--color-primary);";
        financialSign = "+";
    }
    
    // Cálculo da comissão
    let commissionEarned = 0;
    let commissionHTML = "";
    if (state.commissionSettings && state.commissionSettings.type !== "none") {
        const comType = state.commissionSettings.type;
        const comVal = state.commissionSettings.value || 0;
        if (comType === "fixed") {
            commissionEarned = totalFardosSold * comVal;
        } else if (comType === "percentage") {
            commissionEarned = actualRegisteredRevenue * (comVal / 100);
        }
        
        commissionHTML = `
            <div>
                <span style="font-size: 0.75rem; color: var(--color-text-muted); display: block;">Comissão do Motorista (${comType === "fixed" ? "Fixo" : "Percentual"}):</span>
                <strong style="font-size: 1.1rem; color: var(--color-primary);">R$ ${commissionEarned.toFixed(2).replace(".", ",")}</strong>
            </div>
        `;
    }

    const kmInitial = parseInt(document.getElementById("settle-km-initial").value) || 0;
    const kmFinal = parseInt(document.getElementById("settle-km-final").value) || 0;
    const expFuel = parseFloat(document.getElementById("settle-exp-fuel").value) || 0;
    const expMeal = parseFloat(document.getElementById("settle-exp-meal").value) || 0;
    const expOthers = parseFloat(document.getElementById("settle-exp-others").value) || 0;
    
    const kmDriven = Math.max(0, kmFinal - kmInitial);
    const totalExpenses = expFuel + expMeal + expOthers;
    const costPerKm = kmDriven > 0 ? totalExpenses / kmDriven : 0;
    const netTravelProfit = totalReceived - totalExpenses - commissionEarned;
    
    resultsDiv.style.display = "block";
    resultsDiv.innerHTML = `
        <h3 style="font-size: 0.95rem; font-weight: 700; color: var(--color-primary); margin-bottom: 0.5rem; display: flex; align-items: center; gap: 6px;">
            <i data-lucide="file-text" style="width: 16px; height: 16px;"></i> Resultado da Auditoria
        </h3>
        <div style="font-size: 0.8rem; margin-bottom: 1rem; color: var(--color-text-muted);">
            Motorista: <strong style="color: #fff;">${driverName}</strong>
        </div>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 1rem;">
            <thead>
                <tr style="border-bottom: 1.5px solid rgba(255,255,255,0.1); color: var(--color-text-muted); font-size: 0.75rem;">
                    <th style="padding: 6px 0; text-align: left;">Produto</th>
                    <th style="padding: 6px 0; text-align: center; width: 60px;">Saída</th>
                    <th style="padding: 6px 0; text-align: center; width: 60px;">Vendas</th>
                    <th style="padding: 6px 0; text-align: center; width: 60px;">Retorno</th>
                    <th style="padding: 6px 0; text-align: center; width: 60px;">Diverg.</th>
                </tr>
            </thead>
            <tbody>
                ${stockDivergenceHTML}
            </tbody>
        </table>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 1rem;">
            <div>
                <span style="font-size: 0.75rem; color: var(--color-text-muted); display: block;">Faturamento Registrado no App:</span>
                <strong style="font-size: 1rem; color: #fff;">R$ ${actualRegisteredRevenue.toFixed(2).replace(".", ",")}</strong>
            </div>
            <div>
                <span style="font-size: 0.75rem; color: var(--color-text-muted); display: block;">Faturamento Entregue (Caixa):</span>
                <strong style="font-size: 1rem; color: #fff;">R$ ${totalReceived.toFixed(2).replace(".", ",")}</strong>
            </div>
            <div>
                <span style="font-size: 0.75rem; color: var(--color-text-muted); display: block;">Saldo do Acerto:</span>
                <strong style="font-size: 1.1rem; ${financialDiffClass}">${financialSign}R$ ${financialDiff.toFixed(2).replace(".", ",")}</strong>
            </div>
            ${commissionHTML}
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 1rem; margin-top: 1rem;">
            <div>
                <span style="font-size: 0.75rem; color: var(--color-text-muted); display: block;">KM Rodados:</span>
                <strong style="font-size: 1rem; color: #fff;">${kmDriven} km</strong>
            </div>
            <div>
                <span style="font-size: 0.75rem; color: var(--color-text-muted); display: block;">Despesas de Viagem:</span>
                <strong style="font-size: 1rem; color: #ff6464;">R$ ${totalExpenses.toFixed(2).replace(".", ",")}</strong>
            </div>
            <div>
                <span style="font-size: 0.75rem; color: var(--color-text-muted); display: block;">Custo por KM:</span>
                <strong style="font-size: 1rem; color: #fff;">R$ ${costPerKm.toFixed(2).replace(".", ",")} / km</strong>
            </div>
            <div>
                <span style="font-size: 0.75rem; color: var(--color-text-muted); display: block;">Lucro Líquido Viagem:</span>
                <strong style="font-size: 1.1rem; color: #00ff64;">R$ ${netTravelProfit.toFixed(2).replace(".", ",")}</strong>
            </div>
        </div>
        
        <div style="margin-top: 1rem; padding: 0.75rem; border-radius: 6px; font-size: 0.75rem; line-height: 1.4; background: ${financialDiff === 0 && !hasDivergence ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'}; border: 1px solid ${financialDiff === 0 && !hasDivergence ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}; color: ${financialDiff === 0 && !hasDivergence ? 'var(--color-success)' : '#ff9999'};">
            ${financialDiff === 0 && !hasDivergence 
                ? "<strong>Tudo certo!</strong> O estoque e o caixa batem perfeitamente com os registros do aplicativo." 
                : `<strong>Atenção!</strong> Foram encontradas divergências. ${hasDivergence ? 'Verifique a contagem de estoque físico do caminhão.' : ''} ${financialDiff !== 0 ? 'Verifique os comprovantes e o dinheiro em espécie com o motorista.' : ''}`}
        </div>

        <div style="margin-top: 1.5rem; text-align: right; display: flex; justify-content: flex-end; gap: 8px;">
            <button type="button" class="btn btn-whatsapp" onclick="shareAcertoWhatsApp()" style="font-size: 0.85rem; padding: 8px 16px; display: inline-flex; align-items: center; gap: 6px; background: #25D366; color: #fff; border-color: #25D366;">
                <i data-lucide="send" style="width: 16px; height: 16px;"></i> WhatsApp
            </button>
            <button type="button" class="btn btn-primary" onclick="saveCargoSettlement()" style="font-size: 0.85rem; padding: 8px 16px; display: inline-flex; align-items: center; gap: 6px;">
                <i data-lucide="check-circle" style="width: 16px; height: 16px;"></i> Salvar e Fechar Acerto
            </button>
        </div>
    `;
    
    if (window.lucide) window.lucide.createIcons();
}

export function saveCargoSettlement() {
    const driverSelect = document.getElementById("settle-driver-id");
    const driverId = driverSelect ? driverSelect.value : "";
    const driverName = driverSelect && driverSelect.selectedIndex >= 0 ? driverSelect.options[driverSelect.selectedIndex].text : "Geral";
    
    if (!driverId) {
        window.showToast("Selecione o motorista responsável antes de fechar o acerto!", "warning");
        return;
    }
    
    const cashReceived = parseFloat(document.getElementById("settle-cash-received").value) || 0;
    const pixReceived = parseFloat(document.getElementById("settle-pix-received").value) || 0;
    const cardReceived = parseFloat(document.getElementById("settle-card-received").value) || 0;
    const totalReceived = cashReceived + pixReceived + cardReceived;

    const kmInitial = parseInt(document.getElementById("settle-km-initial").value) || 0;
    const kmFinal = parseInt(document.getElementById("settle-km-final").value) || 0;
    const expFuel = parseFloat(document.getElementById("settle-exp-fuel").value) || 0;
    const expMeal = parseFloat(document.getElementById("settle-exp-meal").value) || 0;
    const expOthers = parseFloat(document.getElementById("settle-exp-others").value) || 0;

    const kmDriven = Math.max(0, kmFinal - kmInitial);
    const totalExpenses = expFuel + expMeal + expOthers;

    let totalFardosSold = 0;
    const activeProds = state.products.filter(p => p.active && (p.type === 'Gelo' || p.type === 'Carvão' || p.type === 'Gelo Saborizado'));
    
    const cargoDetails = [];
    activeProds.forEach(p => {
        const outQty = parseInt(document.getElementById(`cargo-out-${p.id}`).value) || 0;
        const returnQty = parseInt(document.getElementById(`cargo-return-${p.id}`).value) || 0;
        const lossQty = parseInt(document.getElementById(`cargo-loss-${p.id}`).value) || 0;
        const salesQty = parseInt(document.getElementById(`cargo-sales-${p.id}`).value) || 0;
        const soldQty = Math.max(0, outQty - returnQty - lossQty);
        totalFardosSold += soldQty;

        const theoreticalReturn = outQty - salesQty - lossQty;
        const diff = returnQty - theoreticalReturn;

        cargoDetails.push({
            productId: p.id,
            productName: p.name,
            outQty,
            salesQty,
            returnQty,
            lossQty,
            diff
        });
    });

    const todayStr = window.getBrazilTimeISO().split('T')[0];
    let actualRegisteredRevenue = 0;
    state.deliveries.forEach(del => {
        if (del.date.startsWith(todayStr)) {
            actualRegisteredRevenue += del.revenue;
        }
    });
    state.documents.forEach(doc => {
        if ((doc.type === "recibo" || doc.type === "nota") && doc.date === todayStr) {
            actualRegisteredRevenue += doc.total;
        }
    });

    let commissionEarned = 0;
    if (state.commissionSettings && state.commissionSettings.type !== "none") {
        const comType = state.commissionSettings.type;
        const comVal = state.commissionSettings.value || 0;
        if (comType === "fixed") {
            commissionEarned = totalFardosSold * comVal;
        } else if (comType === "percentage") {
            commissionEarned = actualRegisteredRevenue * (comVal / 100);
        }
    }

    const financialDiff = totalReceived - actualRegisteredRevenue;

    const settlement = {
        id: "settle_" + Date.now(),
        date: window.getBrazilTimeISO(),
        driverId,
        driverName,
        kmInitial,
        kmFinal,
        kmDriven,
        expenses: {
            fuel: expFuel,
            meal: expMeal,
            others: expOthers,
            total: totalExpenses
        },
        financials: {
            cash: cashReceived,
            pix: pixReceived,
            card: cardReceived,
            totalReceived,
            expectedRevenue: actualRegisteredRevenue,
            diff: financialDiff,
            commission: commissionEarned
        },
        cargo: cargoDetails
    };

    if (!state.cargoSettlements) {
        state.cargoSettlements = [];
    }
    state.cargoSettlements.push(settlement);

    // Limpar os campos do formulário
    if (driverSelect) driverSelect.value = "";
    document.getElementById("settle-cash-received").value = "0.00";
    document.getElementById("settle-pix-received").value = "0.00";
    document.getElementById("settle-card-received").value = "0.00";
    document.getElementById("settle-km-initial").value = "0";
    document.getElementById("settle-km-final").value = "0";
    document.getElementById("settle-exp-fuel").value = "0.00";
    document.getElementById("settle-exp-meal").value = "0.00";
    document.getElementById("settle-exp-others").value = "0.00";

    // Limpar campos de estoque do caminhão
    activeProds.forEach(p => {
        const outEl = document.getElementById(`cargo-out-${p.id}`);
        const returnEl = document.getElementById(`cargo-return-${p.id}`);
        const lossEl = document.getElementById(`cargo-loss-${p.id}`);
        const salesEl = document.getElementById(`cargo-sales-${p.id}`);
        if (outEl) outEl.value = "0";
        if (returnEl) returnEl.value = "0";
        if (lossEl) lossEl.value = "0";
        if (salesEl) salesEl.value = "0";
    });

    saveState();
    window.showToast("Acerto de viagem salvo com sucesso no histórico!", "success");
    
    const resultsDiv = document.getElementById("cargo-settlement-results");
    if (resultsDiv) resultsDiv.style.display = "none";

    renderFinancialDashboard();
    if (window.renderApp) window.renderApp();
}

// 7. Painel Financeiro e DRE
export function calculateProductPackagingCost(productId, qtyFardos, qtyUnits = 0) {
    const product = state.products.find(p => p.id === productId);
    if (!product) return 0;
    
    const linkedPacks = (state.packaging || []).filter(pkg => pkg.productId === productId);
    if (linkedPacks.length === 0) return 0;
    
    const unitsPerPack = product.unitsPerPack || 12;
    const deduction = qtyFardos + (qtyUnits / unitsPerPack);
    
    let cost = 0;
    linkedPacks.forEach(pkg => {
        cost += (parseFloat(pkg.costPrice) || 0) * deduction;
    });
    return cost;
}

export function renderFinancialDashboard() {
    // 0. Preencher o seletor de meses se estiver vazio
    const monthSelect = document.getElementById("admin-finance-month-select");
    if (monthSelect && monthSelect.options.length === 0) {
        const availableMonths = new Set();
        const currentMonthStrDefault = window.getBrazilTimeISO().substring(0, 7);
        availableMonths.add(currentMonthStrDefault);
        
        (state.deliveries || []).forEach(del => {
            if (del.date) {
                availableMonths.add(del.date.substring(0, 7));
            }
        });
        (state.documents || []).forEach(doc => {
            if (doc.date) {
                availableMonths.add(doc.date.substring(0, 7));
            }
        });
        
        const sortedMonths = Array.from(availableMonths).sort().reverse();
        sortedMonths.forEach(m => {
            const [yr, mn] = m.split('-');
            const opt = document.createElement("option");
            opt.value = m;
            const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
            opt.textContent = `${monthNames[parseInt(mn) - 1]} / ${yr}`;
            monthSelect.appendChild(opt);
        });
        monthSelect.value = currentMonthStrDefault;
    }
    
    const todayStr = window.getBrazilTimeISO().split('T')[0];
    const selectedMonthStr = monthSelect ? monthSelect.value : window.getBrazilTimeISO().substring(0, 7);
    
    let revToday = 0;
    let revMonth = 0;
    
    let cashMonth = 0;
    let pixMonth = 0;
    let cardMonth = 0;
    
    let packagingCostMonth = 0;
    
    const productSalesCount = {};
    const activeProds = state.products.filter(p => p.active && (p.type === 'Gelo' || p.type === 'Carvão' || p.type === 'Gelo Saborizado'));
    
    // 1. Somar de state.deliveries
    state.deliveries.forEach(del => {
        if (!del.date) return;
        const delDateStr = del.date.split('T')[0];
        const delMonthStr = del.date.substring(0, 7);
        
        if (delDateStr === todayStr) {
            revToday += (del.revenue || 0);
        }
        if (delMonthStr === selectedMonthStr) {
            revMonth += (del.revenue || 0);
            const method = (del.paymentMethod || 'pix').toLowerCase();
            const rev = del.revenue || 0;
            if (method.includes('dinheiro') || method.includes('cash')) {
                cashMonth += rev;
            } else if (method.includes('cartão') || method.includes('cartao') || method.includes('card') || method.includes('débito') || method.includes('credito')) {
                cardMonth += rev;
            } else {
                pixMonth += rev; // Padrão: Pix
            }
            
            activeProds.forEach(p => {
                const qtyFardos = del.items[p.id] || 0;
                const qtyUnits = del.items[p.id + "_unit"] || 0;
                if (qtyFardos > 0 || qtyUnits > 0) {
                    const totalQty = qtyFardos + (qtyUnits / (p.unitsPerPack || 12));
                    productSalesCount[p.name] = (productSalesCount[p.name] || 0) + totalQty;
                }
                
                packagingCostMonth += calculateProductPackagingCost(p.id, qtyFardos, qtyUnits);
            });
        }
    });
    
    // 2. Somar de state.documents
    state.documents.forEach(doc => {
        if (doc.type === "recibo" || doc.type === "nota") {
            if (doc.date === todayStr) {
                revToday += doc.total;
            }
            if (doc.date.startsWith(selectedMonthStr)) {
                revMonth += doc.total;
                
                const method = (doc.paymentMethod || "").toLowerCase();
                if (method.includes("dinheiro")) {
                    cashMonth += doc.total;
                } else if (method.includes("pix")) {
                    pixMonth += doc.total;
                } else if (method.includes("cartão") || method.includes("cartao") || method.includes("crédito") || method.includes("débito")) {
                    cardMonth += doc.total;
                } else {
                    cashMonth += doc.total;
                }
                
                if (doc.items) {
                    doc.items.forEach(it => {
                        productSalesCount[it.name] = (productSalesCount[it.name] || 0) + it.qty;
                        
                        const prod = activeProds.find(p => p.name === it.name);
                        if (prod) {
                            const productId = it.prodId ? it.prodId.replace("_unit", "") : prod.id;
                            const isUnit = it.prodId ? it.prodId.endsWith("_unit") : false;
                            const qtyFardos = isUnit ? 0 : it.qty;
                            const qtyUnits = isUnit ? it.qty : 0;
                            packagingCostMonth += calculateProductPackagingCost(productId, qtyFardos, qtyUnits);
                        }
                    });
                }
            }
        }
    });
    
    // 3. Somar despesas operacionais do mês a partir do histórico de acertos
    let logisticsExpensesMonth = 0;
    let logisticsCommissionsMonth = 0;
    if (state.cargoSettlements) {
        state.cargoSettlements.forEach(settle => {
            if (settle.date && settle.date.substring(0, 7) === selectedMonthStr) {
                const expensesTotal = settle.expenses ? (settle.expenses.total || 0) : 0;
                const commission = settle.financials ? (settle.financials.commission || 0) : 0;
                logisticsExpensesMonth += expensesTotal;
                logisticsCommissionsMonth += commission;
            }
        });
    }
    const logisticsCostMonth = logisticsExpensesMonth + logisticsCommissionsMonth;
    
    // 4. Calcular Lucro Líquido Real (Mês)
    const realProfitMonth = revMonth - packagingCostMonth - logisticsCostMonth;
    
    // Atualizar os KPIs na tela
    const kpiRevenueToday = document.getElementById("admin-kpi-revenue-today");
    if (kpiRevenueToday) kpiRevenueToday.innerText = `R$ ${revToday.toFixed(2).replace(".", ",")}`;
    
    const kpiRevenueMonth = document.getElementById("admin-kpi-revenue-month");
    if (kpiRevenueMonth) kpiRevenueMonth.innerText = `R$ ${revMonth.toFixed(2).replace(".", ",")}`;
    
    const kpiPackagingCost = document.getElementById("admin-kpi-packaging-cost");
    if (kpiPackagingCost) kpiPackagingCost.innerText = `R$ ${packagingCostMonth.toFixed(2).replace(".", ",")}`;
    
    const kpiLogisticsCost = document.getElementById("admin-kpi-logistics-cost");
    if (kpiLogisticsCost) kpiLogisticsCost.innerText = `R$ ${logisticsCostMonth.toFixed(2).replace(".", ",")}`;
    
    const kpiRealProfit = document.getElementById("admin-kpi-real-profit");
    if (kpiRealProfit) {
        kpiRealProfit.innerText = `R$ ${realProfitMonth.toFixed(2).replace(".", ",")}`;
        if (realProfitMonth >= 0) {
            kpiRealProfit.style.color = "#00ff64";
        } else {
            kpiRealProfit.style.color = "#ff4d4d";
        }
    }
    
    const kpiPaymentSplit = document.getElementById("admin-kpi-payment-split");
    if (kpiPaymentSplit) {
        kpiPaymentSplit.innerHTML = `
            Dinheiro: R$ ${cashMonth.toFixed(2).replace(".", ",")}<br>
            Pix: R$ ${pixMonth.toFixed(2).replace(".", ",")}<br>
            Cartão: R$ ${cardMonth.toFixed(2).replace(".", ",")}
        `;
    }
    
    const kpiTopProducts = document.getElementById("admin-kpi-top-products");
    if (kpiTopProducts) {
        const sortedProds = Object.entries(productSalesCount).sort((a, b) => b[1] - a[1]);
        const topProdsHTML = sortedProds.length > 0
            ? sortedProds.slice(0, 3).map(([name, qty]) => `${name}: ${Math.round(qty)} fardos`).join("<br>")
            : "Nenhum dado de venda";
        kpiTopProducts.innerHTML = topProdsHTML;
    }
    
    // 5. Renderizar DRE
    const dreTableBody = document.getElementById("dre-table-body");
    if (dreTableBody) {
        const pctPackaging = revMonth > 0 ? (packagingCostMonth / revMonth * 100).toFixed(1) : "0,0";
        const contributionMargin = revMonth - packagingCostMonth;
        const pctContribution = revMonth > 0 ? (contributionMargin / revMonth * 100).toFixed(1) : "0,0";
        const pctCommissions = revMonth > 0 ? (logisticsCommissionsMonth / revMonth * 100).toFixed(1) : "0,0";
        const pctExpenses = revMonth > 0 ? (logisticsExpensesMonth / revMonth * 100).toFixed(1) : "0,0";
        const pctNetProfit = revMonth > 0 ? (realProfitMonth / revMonth * 100).toFixed(1) : "0,0";

        const formatDRECurrency = (val) => "R$ " + val.toFixed(2).replace(".", ",").replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.");

        dreTableBody.innerHTML = `
            <tr class="dre-row-header">
                <td><i data-lucide="trending-up" style="width:14px; height:14px; color:#00ff64; vertical-align:middle; margin-right:4px;"></i> Receita Bruta de Vendas</td>
                <td style="text-align: right;" class="dre-val-positive">${formatDRECurrency(revMonth)}</td>
                <td style="text-align: right;">100,0%</td>
            </tr>
            <tr class="dre-row-deduction">
                <td>&nbsp;&nbsp;&nbsp;&nbsp;(-) Custo de Sacarias e Embalagens (CMV)</td>
                <td style="text-align: right;">- ${formatDRECurrency(packagingCostMonth)}</td>
                <td style="text-align: right;">${pctPackaging}%</td>
            </tr>
            <tr class="dre-row-subtotal">
                <td>(=) Margem de Contribuição</td>
                <td style="text-align: right;" class="${contributionMargin >= 0 ? 'dre-val-neutral' : 'dre-val-negative'}">${formatDRECurrency(contributionMargin)}</td>
                <td style="text-align: right;">${pctContribution}%</td>
            </tr>
            <tr class="dre-row-deduction">
                <td>&nbsp;&nbsp;&nbsp;&nbsp;(-) Comissões de Entregadores</td>
                <td style="text-align: right;">- ${formatDRECurrency(logisticsCommissionsMonth)}</td>
                <td style="text-align: right;">${pctCommissions}%</td>
            </tr>
            <tr class="dre-row-deduction">
                <td>&nbsp;&nbsp;&nbsp;&nbsp;(-) Despesas de Viagem (Pedágio, Combustível)</td>
                <td style="text-align: right;">- ${formatDRECurrency(logisticsExpensesMonth)}</td>
                <td style="text-align: right;">${pctExpenses}%</td>
            </tr>
            <tr class="dre-row-total">
                <td>(=) Lucro Líquido Real (Resultado Operacional)</td>
                <td style="text-align: right;" class="${realProfitMonth >= 0 ? 'dre-val-positive' : 'dre-val-negative'}">${formatDRECurrency(realProfitMonth)}</td>
                <td style="text-align: right;" class="${realProfitMonth >= 0 ? 'dre-val-positive' : 'dre-val-negative'}">${pctNetProfit}%</td>
            </tr>
        `;
        if (window.lucide) window.lucide.createIcons();
    }
    
    calculateDemandForecast();
    if (window.lucide) window.lucide.createIcons();
}

export function updateSimulatedTempLabel(val) {
    const el = document.getElementById("simulated-temp-val");
    if (el) el.innerText = val + "°C";
}

export function calculateDemandForecast() {
    const resultsContainer = document.getElementById("demand-forecast-results");
    if (!resultsContainer) return;
    
    const slider = document.getElementById("simulated-temp-range");
    const temp = slider ? (parseInt(slider.value) || 30) : 30;
    
    let factor = 1.0;
    if (temp >= 25) {
        factor = 1.0 + (temp - 25) * 0.08;
    } else {
        factor = 1.0 + (temp - 25) * 0.05;
        factor = Math.max(0.1, factor);
    }
    
    const activeProds = state.products.filter(p => p.active && (p.type === 'Gelo' || p.type === 'Carvão' || p.type === 'Gelo Saborizado'));
    resultsContainer.innerHTML = "";
    
    if (activeProds.length === 0) {
        resultsContainer.innerHTML = `<p style="color: var(--color-text-muted); font-size: 0.8rem; grid-column: span 3;">Nenhum produto cadastrado para previsão.</p>`;
        return;
    }
    
    activeProds.forEach(p => {
        let baseline = 30;
        if (p.name.includes("5kg") || p.name.includes("5 kg")) {
            baseline = 50;
        } else if (p.name.includes("20kg") || p.name.includes("20 kg")) {
            baseline = 20;
        } else if (p.type === "Gelo Saborizado") {
            baseline = 15;
        }
        
        const forecastQty = Math.round(baseline * factor);
        
        let alertColor = "var(--color-primary)";
        let alertText = "Demanda Normal";
        if (temp >= 35) {
            alertColor = "var(--color-danger)";
            alertText = "Crítica (Muito Alta)";
        } else if (temp >= 30) {
            alertColor = "#ff9900";
            alertText = "Alta";
        } else if (temp < 20) {
            alertColor = "#55aaee";
            alertText = "Baixa";
        }
        
        resultsContainer.innerHTML += `
            <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.05); padding: 1rem; border-radius: 8px; text-align: center;">
                <h4 style="font-size: 0.8rem; color: var(--color-text-muted); margin-bottom: 4px;">${p.name}</h4>
                <div style="font-size: 1.5rem; font-weight: bold; color: #fff; margin-bottom: 4px;">
                    ${forecastQty} <span style="font-size: 0.8rem; font-weight: normal; color: var(--color-text-muted);">fardos</span>
                </div>
                <div style="font-size: 0.7rem; color: ${alertColor}; font-weight: bold;">
                    ${alertText} (${Math.round((factor - 1) * 100)}%)
                </div>
            </div>
        `;
    });
}

// 8. Contas a Receber
export function openReceivePaymentModal(clientId) {
    const client = state.clients.find(c => c.id === clientId);
    if (!client) return;

    document.getElementById("payment-client-id").value = client.id;
    document.getElementById("payment-client-name").innerText = client.name;
    
    recalculateClientDebts();
    document.getElementById("payment-client-debt").innerText = "R$ " + (client.outstandingDebt || 0).toFixed(2).replace(".", ",");
    document.getElementById("payment-amount").value = "";
    document.getElementById("payment-amount").max = client.outstandingDebt > 0 ? client.outstandingDebt : "";
    document.getElementById("payment-method").value = "Dinheiro";

    document.getElementById("modal-receive-payment").classList.add("active");
}

export function processReceivePayment(event) {
    if (event) event.preventDefault();
    
    const submitBtn = event.target.querySelector('button[type="submit"]');
    let oldBtnHTML = "";
    if (submitBtn) {
        oldBtnHTML = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="loading-spinner"></span> Obtendo GPS...';
    }
    
    const finishPayment = (gps) => {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = oldBtnHTML;
        }
        
        const clientId = document.getElementById("payment-client-id").value;
        const amount = parseFloat(document.getElementById("payment-amount").value) || 0;
        const method = document.getElementById("payment-method").value;
        
        const client = state.clients.find(c => c.id === clientId);
        if (!client) {
            window.showToast("Cliente não encontrado.", "error");
            return;
        }
        
        const payment = {
            id: "pay-" + Date.now(),
            clientId: clientId,
            clientName: client.name,
            amount: amount,
            paymentMethod: method,
            date: window.getBrazilTimeISO(),
            gps: gps
        };
        
        if (!state.payments) state.payments = [];
        state.payments.push(payment);

        // Alocar o pagamento nas parcelas do carnê (mais antigas primeiro) via FIFO
        if (!client.carnet) client.carnet = [];
        let remaining = amount;
        const unpaid = client.carnet
            .filter(e => !e.paid)
            .sort((a, b) => new Date(a.dueDate || a.createdAt) - new Date(b.dueDate || b.createdAt));
            
        for (const entry of unpaid) {
            if (remaining <= 0) break;
            if (remaining >= entry.amount) {
                entry.paid = true;
                entry.paidDate = window.getBrazilTimeISO();
                remaining -= entry.amount;
            } else {
                entry.amount -= remaining;
                client.carnet.push({
                    id: 'cr-part-' + Date.now() + '-' + Math.random().toString().slice(-4),
                    amount: remaining,
                    description: `${entry.description} (Parcial)`,
                    dueDate: entry.dueDate,
                    paid: true,
                    paidDate: window.getBrazilTimeISO(),
                    createdAt: window.getBrazilTimeISO()
                });
                remaining = 0;
            }
        }

        saveState();
        if (window.renderApp) window.renderApp();
        if (window.closeModal) window.closeModal('modal-receive-payment');
    };

    if (window.getGPSLocation) {
        window.getGPSLocation(finishPayment);
    } else {
        finishPayment(null);
    }
}

export function renderAccountsReceivable() {
    const debtorsTableBody = document.getElementById("debtors-table-body");
    if (debtorsTableBody) {
        debtorsTableBody.innerHTML = "";
        recalculateClientDebts();
        
        const debtors = state.clients.filter(c => c.outstandingDebt > 0);
        
        if (debtors.length === 0) {
            debtorsTableBody.innerHTML = `
                <tr>
                    <td colspan="4" style="padding: 1.5rem; text-align: center; color: var(--color-text-muted);">
                        Nenhum cliente com saldo devedor pendente.
                    </td>
                </tr>
            `;
        } else {
            debtors.forEach(c => {
                debtorsTableBody.innerHTML += `
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);">
                        <td style="padding: 10px; font-weight: 600; color: #fff;">${c.name}</td>
                        <td style="padding: 10px; color: var(--color-text-muted);">${c.phone || 'Sem telefone'}</td>
                        <td style="padding: 10px; text-align: right; color: var(--color-danger); font-weight: 700;">R$ ${(parseFloat(c.outstandingDebt) || 0).toFixed(2).replace(".", ",")}</td>
                        <td style="padding: 10px; text-align: center;">
                            <div style="display: inline-flex; gap: 6px; flex-wrap: wrap; justify-content: center;">
                                <button type="button" class="btn btn-primary" onclick="openReceivePaymentModal('${c.id}')" style="font-size: 0.75rem; padding: 4px 8px; height: auto; display: inline-flex; align-items: center; gap: 4px;">
                                    <i data-lucide="dollar-sign" style="width: 12px; height: 12px;"></i> Receber
                                </button>
                                <button type="button" class="btn" onclick="sendWhatsAppBilling('${c.id}')" style="font-size: 0.75rem; padding: 4px 8px; height: auto; display: inline-flex; align-items: center; gap: 4px; background: #25D366; border: 1px solid #25D366; color: #fff;">
                                    <i data-lucide="message-square" style="width: 12px; height: 12px;"></i> Cobrar
                                </button>
                                ${state.mercadoPago && state.mercadoPago.enabled ? `
                                <button type="button" class="btn" onclick="generateAndSendMP(event, '${c.id}', ${parseFloat(c.outstandingDebt) || 0})" style="font-size: 0.75rem; padding: 4px 8px; height: auto; display: inline-flex; align-items: center; gap: 4px; background: #009ee3; border: 1px solid #009ee3; color: #fff;">
                                    <i data-lucide="link" style="width: 12px; height: 12px;"></i> MP (Pix/Boleto)
                                </button>
                                ` : ''}
                            </div>
                        </td>
                    </tr>
                `;
            });
        }
    }

    const paymentsHistoryTableBody = document.getElementById("payments-history-table-body");
    if (paymentsHistoryTableBody) {
        paymentsHistoryTableBody.innerHTML = "";
        const payments = state.payments || [];
        
        if (payments.length === 0) {
            paymentsHistoryTableBody.innerHTML = `
                <tr>
                    <td colspan="4" style="padding: 1.5rem; text-align: center; color: var(--color-text-muted);">
                        Nenhum recebimento registrado.
                    </td>
                </tr>
            `;
        } else {
            const sortedPayments = [...payments].sort((a, b) => new Date(b.date) - new Date(a.date));
            sortedPayments.forEach(p => {
                const dateFormatted = window.formatDateBrazil(p.date);
                
                let gpsButton = '';
                if (p.gps && p.gps.lat && p.gps.lng) {
                    gpsButton = `
                        <a href="https://www.google.com/maps/search/?api=1&query=${p.gps.lat},${p.gps.lng}" target="_blank" class="btn btn-secondary btn-icon-only" style="padding: 3px; display: inline-flex; align-items: center; justify-content: center; text-decoration: none; margin-left: 6px;" title="Ver Localização no GPS">
                            <i data-lucide="map-pin" style="width: 12px; height: 12px; color: var(--color-primary);"></i>
                        </a>
                    `;
                }
                
                paymentsHistoryTableBody.innerHTML += `
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);">
                        <td style="padding: 10px; font-size: 0.8rem; color: var(--color-text-muted);">
                            ${dateFormatted}
                            ${gpsButton}
                        </td>
                        <td style="padding: 10px; font-weight: 600; color: #fff;">${p.clientName}</td>
                        <td style="padding: 10px; color: var(--color-text-muted);">${p.paymentMethod}</td>
                        <td style="padding: 10px; text-align: right; color: var(--color-success); font-weight: 700;">R$ ${(parseFloat(p.amount) || 0).toFixed(2).replace(".", ",")}</td>
                    </tr>
                `;
            });
        }
    }
}

export function saveCommissionSettings(event) {
    if (event) event.preventDefault();
    const type = document.getElementById("commission-type").value;
    const value = parseFloat(document.getElementById("commission-value").value) || 0;
    
    state.commissionSettings = { type, value };
    saveState();
    window.showToast("Configuração de comissão salva com sucesso!", "success");
    if (window.renderApp) window.renderApp();
}

export function toggleCommissionValueLabel() {
    const type = document.getElementById("commission-type").value;
    const group = document.getElementById("commission-value-group");
    const label = document.getElementById("commission-value-label");
    const valInput = document.getElementById("commission-value");
    
    if (type === "none") {
        if (group) group.style.display = "none";
        if (valInput) valInput.required = false;
    } else {
        if (group) group.style.display = "block";
        if (valInput) valInput.required = true;
        if (label) {
            if (type === "fixed") {
                label.innerText = "Valor Fixo por Fardo (R$) *";
                if (valInput) valInput.placeholder = "Ex: 1.50";
            } else if (type === "percentage") {
                label.innerText = "Percentual da Comissão (%) *";
                if (valInput) valInput.placeholder = "Ex: 5.00";
            }
        }
    }
}

export function sendWhatsAppBilling(clientId) {
    const client = state.clients.find(c => c.id === clientId);
    if (!client) {
        window.showToast("Cliente não encontrado.", "error");
        return;
    }
    if (!client.phone) {
        window.showToast("Este cliente não possui telefone cadastrado.", "warning");
        return;
    }
    
    let phoneDigits = client.phone.replace(/\D/g, "");
    if (phoneDigits.length === 0) {
        window.showToast("O telefone cadastrado é inválido.", "error");
        return;
    }
    
    if (phoneDigits.length === 10 || phoneDigits.length === 11) {
        phoneDigits = "55" + phoneDigits;
    }
    
    const formattedDebt = (parseFloat(client.outstandingDebt) || 0).toFixed(2).replace(".", ",");
    const companyName = FACTORY_INFO.name;
    const pixKey = FACTORY_INFO.pixKey;
    
    let msg = `Olá, *${client.name}*!\n\nPassando para lembrar que você possui um saldo em aberto com a *${companyName}* no valor de *R$ ${formattedDebt}*.\n`;
    if (pixKey) {
        msg += `Para sua comodidade, você pode efetuar o pagamento via Pix utilizando a chave:\n👉 *${pixKey}*\n\n`;
    } else {
        msg += `Por favor, entre em contato para alinharmos a forma de pagamento.\n\n`;
    }
    msg += `Agradecemos pela parceria! Qualquer dúvida, estamos à disposição.`;
    
    const url = `https://api.whatsapp.com/send?phone=${phoneDigits}&text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
}

// 9. Gestão de Fornecedores
export function openSupplierModal(supplierId = null) {
    const form = document.getElementById("supplier-form");
    if (form) form.reset();
    document.getElementById("form-supplier-id").value = "";
    document.getElementById("supplier-modal-title").innerText = "Novo Fornecedor";
    
    if (supplierId) {
        document.getElementById("supplier-modal-title").innerText = "Editar Fornecedor";
        const s = state.suppliers.find(item => item.id === supplierId);
        if (s) {
            document.getElementById("form-supplier-id").value = s.id;
            document.getElementById("supplier-name").value = s.name;
            document.getElementById("supplier-contact").value = s.contact || "";
            document.getElementById("supplier-cnpj-cpf").value = s.cnpjCpf || "";
            document.getElementById("supplier-address").value = s.address || "";
        }
    }
    
    document.getElementById("modal-supplier").classList.add("active");
}

export function saveSupplier(event) {
    if (event) event.preventDefault();
    const id = document.getElementById("form-supplier-id").value;
    const name = document.getElementById("supplier-name").value.trim();
    const contact = document.getElementById("supplier-contact").value.trim();
    const cnpjCpf = document.getElementById("supplier-cnpj-cpf").value.trim();
    const address = document.getElementById("supplier-address").value.trim();
    
    if (!name) {
        window.showToast("O nome do fornecedor é obrigatório.", "warning");
        return;
    }
    
    if (!state.suppliers) state.suppliers = [];

    if (id) {
        const idx = state.suppliers.findIndex(s => s.id === id);
        if (idx !== -1) {
            state.suppliers[idx] = {
                ...state.suppliers[idx],
                name, contact, cnpjCpf, address
            };
        }
    } else {
        const newSup = {
            id: "sup-" + Date.now(),
            name, contact, cnpjCpf, address
        };
        state.suppliers.push(newSup);
    }
    
    saveState();
    if (window.closeModal) window.closeModal("modal-supplier");
    if (window.renderApp) window.renderApp();
}

export function deleteSupplier(supplierId) {
    const s = state.suppliers.find(item => item.id === supplierId);
    if (!s) return;
    
    const linkedPacks = (state.packaging || []).filter(pkg => pkg.supplierId === supplierId);
    if (linkedPacks.length > 0) {
        window.showToast(`Não é possível excluir o fornecedor "${s.name}" pois ele possui embalagens vinculadas.`, "error");
        return;
    }
    
    window.showConfirm(
        `Deseja realmente excluir o fornecedor "${s.name}"?`,
        () => {
            state.suppliers = state.suppliers.filter(item => item.id !== supplierId);
            saveState();
            if (window.renderApp) window.renderApp();
        },
        null,
        "Excluir Fornecedor",
        "Excluir"
    );
}

export function renderSuppliers() {
    const tableBody = document.getElementById("suppliers-table-body");
    if (!tableBody) return;
    tableBody.innerHTML = "";
    
    const suppliers = state.suppliers || [];
    if (suppliers.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" style="padding: 1.5rem; text-align: center; color: var(--color-text-muted);">
                    Nenhum fornecedor cadastrado.
                </td>
            </tr>
        `;
        return;
    }
    
    suppliers.forEach(s => {
        tableBody.innerHTML += `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);">
                <td style="padding: 10px; font-weight: 600; color: #fff;">${s.name}</td>
                <td style="padding: 10px; color: var(--color-text-main);">${s.contact || 'Sem contato'}</td>
                <td style="padding: 10px; color: var(--color-text-muted);">${s.cnpjCpf || 'Sem documento'}</td>
                <td style="padding: 10px; color: var(--color-text-muted);">${s.address || 'Sem endereço'}</td>
                <td style="padding: 10px; text-align: center;">
                    <div style="display: inline-flex; gap: 6px; justify-content: center;">
                        <button type="button" class="btn btn-primary" onclick="openSupplierModal('${s.id}')" style="padding: 4px 8px; font-size: 0.75rem; display: inline-flex; align-items: center; gap: 4px;">
                            <i data-lucide="edit-3" style="width: 12px; height: 12px;"></i> Editar
                        </button>
                        <button type="button" class="btn btn-secondary" onclick="deleteSupplier('${s.id}')" style="padding: 4px 8px; font-size: 0.75rem; color: #ef4444; border-color: rgba(239, 68, 68, 0.2); background: rgba(239, 68, 68, 0.05);">
                            Excluir
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    if (window.lucide) window.lucide.createIcons();
}

// 10. Gestão de Embalagens e Insumos
export function openPackagingModal(packagingId = null) {
    const supplierSelect = document.getElementById("pack-supplier-id");
    const productSelect = document.getElementById("pack-product-id");
    
    if (supplierSelect) {
        supplierSelect.innerHTML = '<option value="" disabled selected>Selecione um fornecedor</option>';
        if (state.suppliers && state.suppliers.length > 0) {
            state.suppliers.forEach(s => {
                supplierSelect.innerHTML += `<option value="${s.id}">${s.name}</option>`;
            });
        }
    }
    
    if (productSelect) {
        productSelect.innerHTML = '<option value="">Não vinculado a produto (Avulso)</option>';
        if (state.products && state.products.length > 0) {
            state.products.forEach(p => {
                if (p.active) {
                    productSelect.innerHTML += `<option value="${p.id}">${p.name}</option>`;
                }
            });
        }
    }
    
    const form = document.getElementById("packaging-form");
    if (form) form.reset();
    document.getElementById("form-packaging-id").value = "";
    document.getElementById("packaging-modal-title").innerText = "Nova Embalagem / Insumo";
    
    const initialStockGroup = document.getElementById("group-pack-initial-stock");
    const initialStockInput = document.getElementById("pack-initial-stock");
    
    if (initialStockGroup) {
        initialStockGroup.style.display = "block";
        if (initialStockInput) initialStockInput.required = true;
    }
    
    if (packagingId) {
        document.getElementById("packaging-modal-title").innerText = "Editar Embalagem / Insumo";
        if (initialStockGroup) {
            initialStockGroup.style.display = "none";
            if (initialStockInput) initialStockInput.required = false;
        }
        
        const pkg = state.packaging.find(p => p.id === packagingId);
        if (pkg) {
            document.getElementById("form-packaging-id").value = pkg.id;
            document.getElementById("pack-name").value = pkg.name;
            if (supplierSelect) supplierSelect.value = pkg.supplierId || "";
            if (productSelect) productSelect.value = pkg.productId || "";
            document.getElementById("pack-cost-price").value = pkg.costPrice !== undefined ? pkg.costPrice : 0;
            document.getElementById("pack-min-stock").value = pkg.minStock !== undefined ? pkg.minStock : 100;
        }
    }
    
    document.getElementById("modal-packaging").classList.add("active");
}

export function savePackaging(event) {
    if (event) event.preventDefault();
    const id = document.getElementById("form-packaging-id").value;
    const name = document.getElementById("pack-name").value.trim();
    const supplierId = document.getElementById("pack-supplier-id").value;
    const productId = document.getElementById("pack-product-id").value;
    const costPrice = parseFloat(document.getElementById("pack-cost-price").value) || 0;
    const minStock = parseInt(document.getElementById("pack-min-stock").value) || 0;
    
    if (!name) {
        window.showToast("O nome da embalagem é obrigatório.", "warning");
        return;
    }
    if (!supplierId) {
        window.showToast("Selecione um fornecedor.", "warning");
        return;
    }
    
    if (!state.packaging) state.packaging = [];
    if (!state.packagingTransactions) state.packagingTransactions = [];

    if (id) {
        const idx = state.packaging.findIndex(pkg => pkg.id === id);
        if (idx !== -1) {
            state.packaging[idx] = {
                ...state.packaging[idx],
                name, supplierId, productId, costPrice, minStock
            };
        }
    } else {
        const initialStock = parseInt(document.getElementById("pack-initial-stock").value) || 0;
        const newId = "pkg-" + Date.now();
        const newPkg = {
            id: newId,
            name, supplierId, productId, costPrice, minStock,
            currentStock: initialStock
        };
        state.packaging.push(newPkg);
        
        if (initialStock > 0) {
            state.packagingTransactions.push({
                id: "tx-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
                packagingId: newId,
                packagingName: name,
                type: "entrada",
                quantity: initialStock,
                balanceAfter: initialStock,
                date: window.getBrazilTimeISO(),
                observation: "Estoque Inicial no cadastro"
            });
        }
    }
    
    saveState();
    if (window.closeModal) window.closeModal("modal-packaging");
    if (window.renderApp) window.renderApp();
}

export function deletePackaging(packagingId) {
    const pkg = state.packaging.find(p => p.id === packagingId);
    if (!pkg) return;
    
    window.showConfirm(
        `Deseja realmente excluir a embalagem "${pkg.name}"?`,
        () => {
            state.packaging = state.packaging.filter(item => item.id !== packagingId);
            saveState();
            if (window.renderApp) window.renderApp();
        },
        null,
        "Excluir Embalagem",
        "Excluir"
    );
}

export function renderPackaging() {
    const tableBody = document.getElementById("packaging-table-body");
    if (!tableBody) return;
    tableBody.innerHTML = "";
    
    const packaging = state.packaging || [];
    if (packaging.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" style="padding: 1.5rem; text-align: center; color: var(--color-text-muted);">
                    Nenhuma embalagem cadastrada.
                </td>
            </tr>
        `;
        return;
    }
    
    packaging.forEach(pkg => {
        const sup = state.suppliers.find(s => s.id === pkg.supplierId);
        const prod = state.products.find(p => p.id === pkg.productId);
        
        const supName = sup ? sup.name : `<span style="color: var(--color-text-muted);">Não informado</span>`;
        const prodName = prod ? prod.name : `<span style="color: var(--color-text-muted);">Sem vínculo (Avulso)</span>`;
        const isLow = (pkg.currentStock || 0) < (pkg.minStock || 0);
        
        let stockBadge = `<span style="font-weight: bold; color: #fff;">${pkg.currentStock || 0}</span>`;
        if (isLow) {
            stockBadge = `<span style="border: 1px solid rgba(239, 68, 68, 0.3); background: rgba(239, 68, 68, 0.1); color: #ef4444; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 0.75rem;" title="Abaixo do estoque mínimo!">
                ${pkg.currentStock || 0} (Crítico)
            </span>`;
        }
        
        tableBody.innerHTML += `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);">
                <td style="padding: 10px; font-weight: 600; color: #fff;">${pkg.name}</td>
                <td style="padding: 10px; color: var(--color-text-main);">${supName}</td>
                <td style="padding: 10px; color: var(--color-text-main);">${prodName}</td>
                <td style="padding: 10px; text-align: right; color: var(--color-text-main);">R$ ${(pkg.costPrice || 0).toFixed(2).replace(".", ",")}</td>
                <td style="padding: 10px; text-align: center; color: var(--color-text-muted);">${pkg.minStock || 0}</td>
                <td style="padding: 10px; text-align: center;">${stockBadge}</td>
                <td style="padding: 10px; text-align: center;">
                    <div style="display: inline-flex; gap: 6px; justify-content: center; align-items: center;">
                        <button type="button" class="btn btn-primary" onclick="openPackagingEntryModal('${pkg.id}')" style="padding: 4px 8px; font-size: 0.75rem; display: inline-flex; align-items: center; gap: 2px;">
                            <i data-lucide="plus-circle" style="width: 12px; height: 12px;"></i> Entrada
                        </button>
                        <button type="button" class="btn btn-secondary btn-icon-only" onclick="openPackagingModal('${pkg.id}')" style="padding: 4px;" title="Editar">
                            <i data-lucide="edit-3" style="width: 12px; height: 12px;"></i>
                        </button>
                        <button type="button" class="btn btn-danger btn-icon-only" onclick="deletePackaging('${pkg.id}')" style="padding: 4px;" title="Excluir">
                            <i data-lucide="trash-2" style="width: 12px; height: 12px;"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    if (window.lucide) window.lucide.createIcons();
}

export function openPackagingEntryModal(packagingId) {
    const pkg = state.packaging.find(p => p.id === packagingId);
    if (!pkg) return;
    
    document.getElementById("entry-packaging-id").value = pkg.id;
    document.getElementById("entry-packaging-name").innerText = pkg.name;
    document.getElementById("entry-packaging-current").innerText = pkg.currentStock || 0;
    
    document.getElementById("entry-qty").value = "";
    document.getElementById("entry-cost").value = "";
    document.getElementById("entry-obs").value = "";
    
    document.getElementById("modal-packaging-entry").classList.add("active");
}

export function savePackagingEntry(event) {
    if (event) event.preventDefault();
    const packagingId = document.getElementById("entry-packaging-id").value;
    const qty = parseInt(document.getElementById("entry-qty").value) || 0;
    const cost = parseFloat(document.getElementById("entry-cost").value) || 0;
    const obs = document.getElementById("entry-obs").value.trim();
    
    if (qty <= 0) {
        window.showToast("A quantidade deve ser maior que zero.", "warning");
        return;
    }
    
    const pkg = state.packaging.find(p => p.id === packagingId);
    if (!pkg) {
        window.showToast("Embalagem não encontrada.", "error");
        return;
    }
    
    pkg.currentStock = (pkg.currentStock || 0) + qty;
    
    if (!state.packagingTransactions) state.packagingTransactions = [];

    state.packagingTransactions.push({
        id: "tx-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
        packagingId: packagingId,
        packagingName: pkg.name,
        type: "entrada",
        quantity: qty,
        balanceAfter: pkg.currentStock,
        date: window.getBrazilTimeISO(),
        observation: obs || "Entrada manual de estoque"
    });
    
    saveState();
    if (window.closeModal) window.closeModal("modal-packaging-entry");
    if (window.renderApp) window.renderApp();
}

export function renderPackagingTransactions() {
    const tableBody = document.getElementById("packaging-transactions-table-body");
    if (!tableBody) return;
    tableBody.innerHTML = "";
    
    const transactions = state.packagingTransactions || [];
    if (transactions.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" style="padding: 1.5rem; text-align: center; color: var(--color-text-muted);">
                    Nenhuma movimentação de insumo registrada.
                </td>
            </tr>
        `;
        return;
    }
    
    const sortedTxs = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    sortedTxs.forEach(tx => {
        const dateFormatted = window.formatDateBrazil(tx.date);
        const typeBadge = tx.type === "entrada" 
            ? `<span style="border: 1px solid rgba(16, 185, 129, 0.3); background: rgba(16, 185, 129, 0.1); color: var(--color-success); padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 0.75rem;">Entrada</span>`
            : `<span style="border: 1px solid rgba(239, 68, 68, 0.3); background: rgba(239, 68, 68, 0.1); color: var(--color-danger); padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 0.75rem;">Saída</span>`;
            
        const qtyFormatted = tx.type === "entrada" ? `+${tx.quantity}` : `-${(parseFloat(tx.quantity) || 0).toFixed(1).replace(".0", "")}`;
        const qtyColor = tx.type === "entrada" ? "var(--color-success)" : "var(--color-danger)";
        
        tableBody.innerHTML += `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);">
                <td style="padding: 8px 10px; font-size: 0.8rem; color: var(--color-text-muted);">${dateFormatted}</td>
                <td style="padding: 8px 10px; font-weight: 600; color: #fff;">${tx.packagingName}</td>
                <td style="padding: 8px 10px; text-align: center;">${typeBadge}</td>
                <td style="padding: 8px 10px; text-align: center; color: ${qtyColor}; font-weight: 700;">${qtyFormatted}</td>
                <td style="padding: 8px 10px; text-align: center; color: #fff;">${(parseFloat(tx.balanceAfter) || 0).toFixed(1).replace(".0", "")}</td>
                <td style="padding: 8px 10px; color: var(--color-text-main); font-size: 0.8rem;">${tx.observation || ''}</td>
            </tr>
        `;
    });
}

// Binds no Window para acesso no HTML inline
window.switchAdminSubTab = switchAdminSubTab;
window.closeAdminAuthModal = closeAdminAuthModal;
window.cancelAdminAuth = closeAdminAuthModal;
window.lockAdminAccess = lockAdminAccess;
window.renderPrecos = renderPrecos;
window.openClientPricesModal = openClientPricesModal;
window.clearClientPrices = clearClientPrices;
window.generateBackup = generateBackup;
window.restoreLocalBackup = restoreLocalBackup;
window.applyBackupData = applyBackupData;
window.downloadBackupJSON = downloadBackupJSON;
window.deleteLocalBackup = deleteLocalBackup;
window.importBackupFromFile = importBackupFromFile;
window.checkAutoBackupOnLoad = checkAutoBackupOnLoad;
window.applyAppearanceTheme = applyAppearanceTheme;
window.getCurrentUIThemeSettings = getCurrentUIThemeSettings;
window.handlePresetThemeChange = handlePresetThemeChange;
window.handleBgStyleChange = handleBgStyleChange;
window.handleCustomBgColorInput = handleCustomBgColorInput;
window.handleCustomBgColorTextInput = handleCustomBgColorTextInput;
window.handlePanelStyleChange = handlePanelStyleChange;
window.handleGlowIntensityChange = handleGlowIntensityChange;
window.handleCustomColorInput = handleCustomColorInput;
window.handleCustomColorTextInput = handleCustomColorTextInput;
window.handleFactoryLogoUpload = handleFactoryLogoUpload;
window.removeFactoryLogo = removeFactoryLogo;
window.selectThemeCard = selectThemeCard;
window.renderCargoStockInputs = renderCargoStockInputs;
window.loadTodaySalesData = loadTodaySalesData;
window.calculateCargoSettlement = calculateCargoSettlement;
window.saveCargoSettlement = saveCargoSettlement;
window.calculateProductPackagingCost = calculateProductPackagingCost;
window.renderFinancialDashboard = renderFinancialDashboard;
window.updateSimulatedTempLabel = updateSimulatedTempLabel;
window.calculateDemandForecast = calculateDemandForecast;
window.openReceivePaymentModal = openReceivePaymentModal;
window.processReceivePayment = processReceivePayment;
window.renderAccountsReceivable = renderAccountsReceivable;
window.saveCommissionSettings = saveCommissionSettings;
window.toggleCommissionValueLabel = toggleCommissionValueLabel;
window.sendWhatsAppBilling = sendWhatsAppBilling;
window.openSupplierModal = openSupplierModal;
window.saveSupplier = saveSupplier;
window.deleteSupplier = deleteSupplier;
window.renderSuppliers = renderSuppliers;
window.openPackagingModal = openPackagingModal;
window.savePackaging = savePackaging;
window.deletePackaging = deletePackaging;
window.renderPackaging = renderPackaging;
window.openPackagingEntryModal = openPackagingEntryModal;
window.savePackagingEntry = savePackagingEntry;
window.renderPackagingTransactions = renderPackagingTransactions;

// Bind missing product catalog functions to window
window.renderProductsCatalog = renderProductsCatalog;
window.toggleFlavoredPackageUnits = toggleFlavoredPackageUnits;
window.toggleProductSubfields = toggleProductSubfields;
window.openProductModal = openProductModal;
window.deleteProduct = deleteProduct;
window.autoFillFactorySettings = autoFillFactorySettings;
window.autoFillAppearanceSettings = autoFillAppearanceSettings;

// --- SISTEMA DINÂMICO DE CATÁLOGO E PREÇOS ---
export function renderProductsCatalog() {
    const tbody = document.getElementById("catalog-products-tbody");
    if (!tbody) return;

    tbody.innerHTML = "";
    
    if (!state.products || state.products.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="padding: 1.5rem; text-align: center; color: var(--color-text-muted);">
                    Nenhum produto cadastrado no catálogo.
                </td>
            </tr>
        `;
        return;
    }

    state.products.forEach(p => {
        const badge = p.active 
            ? `<span class="status-badge completed" style="background: rgba(0, 240, 255, 0.1); color: var(--color-primary); border: 1px solid rgba(0, 240, 255, 0.15);">Ativo</span>`
            : `<span class="status-badge pending" style="background: rgba(255, 255, 255, 0.05); color: var(--color-text-muted); border: 1px solid rgba(255, 255, 255, 0.08);">Inativo</span>`;
        
        const emojiBadge = window.getProductEmojiBadge ? window.getProductEmojiBadge(p) : "";
        
        tbody.innerHTML += `
            <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.03);">
                <td style="padding: 10px; font-weight: 600; color: var(--color-text-main); display: inline-flex; align-items: center; gap: 4px;">${emojiBadge} ${p.name}</td>
                <td style="padding: 10px; color: var(--color-text-muted);">${p.type}</td>
                <td style="padding: 10px; color: var(--color-text-muted);">${p.subtype || '-'}</td>
                <td style="padding: 10px; text-align: center; color: var(--color-text-main);">${p.weight || '0'} kg</td>
                <td style="padding: 10px; text-align: right; font-weight: 700; color: var(--color-primary);">R$ ${(p.defaultPrice || 0).toFixed(2)}</td>
                <td style="padding: 10px; text-align: center;">${badge}</td>
                <td style="padding: 10px; text-align: center;">
                    <div style="display: inline-flex; gap: 6px;">
                        <button class="btn btn-secondary btn-icon-only" onclick="openProductModal('${p.id}')" title="Editar Item" style="padding: 4px 6px; display: inline-flex; align-items: center; justify-content: center;">
                            <i data-lucide="edit-3" style="width: 13px; height: 13px;"></i>
                        </button>
                        <button class="btn btn-danger btn-icon-only" onclick="deleteProduct('${p.id}')" title="Desativar Item" style="padding: 4px 6px; display: inline-flex; align-items: center; justify-content: center;">
                            <i data-lucide="trash-2" style="width: 13px; height: 13px;"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });

    if (window.lucide) window.lucide.createIcons();
}

export function toggleFlavoredPackageUnits() {
    const packageType = document.getElementById("prod-package-type").value;
    const unitsGroup = document.getElementById("group-prod-units-per-pack");
    const unitsInput = document.getElementById("prod-units-per-pack");
    if (packageType === "varejo") {
        unitsGroup.style.display = "none";
        unitsInput.value = 1;
        unitsInput.removeAttribute("required");
    } else {
        unitsGroup.style.display = "block";
        unitsInput.setAttribute("required", "required");
    }
}

export function toggleProductSubfields() {
    const type = document.getElementById("prod-type").value;
    const weightGroup = document.getElementById("group-prod-weight");
    const weightInput = document.getElementById("prod-weight");
    const flavoredGroup = document.getElementById("group-flavored-ice-fields");
    const flavorInput = document.getElementById("prod-flavor");
    const weightGInput = document.getElementById("prod-unit-weight-g");
    const unitsInput = document.getElementById("prod-units-per-pack");
    
    if (type === "Gelo") {
        weightGroup.style.display = "block";
        weightInput.setAttribute("required", "required");
        
        flavoredGroup.style.display = "none";
        flavorInput.removeAttribute("required");
        weightGInput.removeAttribute("required");
        unitsInput.removeAttribute("required");
    } else if (type === "Gelo Saborizado") {
        weightGroup.style.display = "none";
        weightInput.removeAttribute("required");
        weightInput.value = "";
        
        flavoredGroup.style.display = "block";
        flavorInput.setAttribute("required", "required");
        weightGInput.setAttribute("required", "required");
        toggleFlavoredPackageUnits();
    } else {
        weightGroup.style.display = "none";
        weightInput.removeAttribute("required");
        weightInput.value = "";
        
        flavoredGroup.style.display = "none";
        flavorInput.removeAttribute("required");
        weightGInput.removeAttribute("required");
        unitsInput.removeAttribute("required");
    }
}

export function openProductModal(productId = null) {
    const modal = document.getElementById("modal-product-mgmt");
    const title = document.getElementById("product-modal-title");
    const form = document.getElementById("product-mgmt-form");
    
    form.reset();
    document.getElementById("form-product-id").value = "";
    document.getElementById("prod-active").checked = true;
    
    // Defaults para Gelo Saborizado
    document.getElementById("prod-flavor").value = "";
    document.getElementById("prod-package-type").value = "pacote";
    document.getElementById("prod-units-per-pack").value = "12";
    document.getElementById("prod-unit-weight-g").value = "200";
    
    if (productId) {
        title.innerText = "Editar Produto / Item";
        const p = state.products.find(item => item.id === productId);
        if (p) {
            document.getElementById("form-product-id").value = p.id;
            document.getElementById("prod-name").value = p.name;
            document.getElementById("prod-type").value = p.type;
            document.getElementById("prod-subtype-text").value = p.subtype || "";
            document.getElementById("prod-weight").value = p.weight !== undefined ? p.weight : "";
            document.getElementById("prod-price").value = p.defaultPrice || 0;
            document.getElementById("prod-active").checked = p.active !== false;
            
            // Novos campos de gelo saborizado
            document.getElementById("prod-flavor").value = p.flavor || "";
            document.getElementById("prod-package-type").value = p.packageType || "pacote";
            document.getElementById("prod-units-per-pack").value = p.unitsPerPack !== undefined ? p.unitsPerPack : "12";
            document.getElementById("prod-unit-weight-g").value = p.unitWeightGrams !== undefined ? p.unitWeightGrams : "200";
        }
    } else {
        title.innerText = "Novo Produto / Item";
    }
    
    toggleProductSubfields();
    modal.classList.add("active");
}

export function deleteProduct(productId) {
    const p = state.products.find(item => item.id === productId);
    if (!p) return;
    
    window.showConfirm(
        `Deseja realmente desativar o item "${p.name}"? Ele continuará no histórico, mas não estará disponível para novas operações.`,
        () => {
            p.active = false;
            saveState();
            renderProductsCatalog();
            renderPrecos();
            if (window.renderApp) window.renderApp();
        },
        null,
        "Desativar Item",
        "Desativar"
    );
}

export function autoFillFactorySettings() {
    if (!state.factorySettings) {
        state.factorySettings = {};
    }
    state.factorySettings.name = "GELO DO VALE INDÚSTRIA DE GELO LTDA.";
    state.factorySettings.cnpj = "65.007.307/0001-60";
    state.factorySettings.phone = "(12) 99887-6655";
    state.factorySettings.address = "Vale do Paraíba, São José dos Campos - SP";
    state.factorySettings.email = "contato@gelodovale.com.br";
    state.factorySettings.pixKey = "65.007.307/0001-60";
    state.factorySettings.rentalTerms = "1. O LOCATÁRIO compromete-se a devolver o equipamento na data pactuada, em perfeito estado de conservação, limpeza e funcionamento.\n2. Em caso de atraso na devolução, será cobrada uma taxa de diária extra de atraso por cada dia de atraso, calculada pro rata die com base no valor acordado no ato do aluguel.\n3. O LOCATÁRIO assume total responsabilidade por danos, avarias, perda ou furto do equipamento ocorrido durante o período de locação, obrigando-se a ressarcir o LOCADOR pelo valor de mercado para reposição do bem.\n4. O equipamento destina-se exclusivamente ao uso convencional, sendo vedado sublocar ou ceder o uso a terceiros sem prévio consentimento por escrito do LOCADOR.";

    // Update form elements
    const nameEl = document.getElementById("cfg-factory-name");
    if (nameEl) nameEl.value = state.factorySettings.name;
    
    const cnpjEl = document.getElementById("cfg-factory-cnpj");
    if (cnpjEl) cnpjEl.value = state.factorySettings.cnpj;
    
    const phoneEl = document.getElementById("cfg-factory-phone");
    if (phoneEl) phoneEl.value = state.factorySettings.phone;
    
    const addressEl = document.getElementById("cfg-factory-address");
    if (addressEl) addressEl.value = state.factorySettings.address;
    
    const emailEl = document.getElementById("cfg-factory-email");
    if (emailEl) emailEl.value = state.factorySettings.email;
    
    const pixEl = document.getElementById("cfg-factory-pix");
    if (pixEl) pixEl.value = state.factorySettings.pixKey;
    
    const rentalTermsEl = document.getElementById("cfg-factory-rental-terms");
    if (rentalTermsEl) rentalTermsEl.value = state.factorySettings.rentalTerms;

    // Atualizar UI de configurações
    if (window.renderPrecos) {
        window.renderPrecos();
    }
    
    saveState();
    window.showToast("Dados comerciais oficiais da Gelo do Vale preenchidos com sucesso!", "success");
}

export function autoFillAppearanceSettings() {
    // Restore appearance settings to default Ciano
    state.appearance = {
        themeName: "ciano",
        primaryColor: "#00f0ff",
        primaryColorRgb: "0, 240, 255",
        secondaryColor: "#0072ff",
        backgroundStyle: "darkSpace",
        customBgColor: "#090d16",
        panelStyle: "glassmorphism",
        glowIntensity: "high"
    };

    if (window.applyAppearanceTheme) {
        window.applyAppearanceTheme();
    }
    
    // Atualizar UI de configurações
    if (window.renderPrecos) {
        window.renderPrecos();
    }
    
    saveState();
    window.showToast("Aparência padrão (Ciano Neon) restaurada com sucesso!", "success");
}

export function shareAcertoWhatsApp() {
    const cashReceived = parseFloat(document.getElementById("settle-cash-received").value) || 0;
    const pixReceived = parseFloat(document.getElementById("settle-pix-received").value) || 0;
    const cardReceived = parseFloat(document.getElementById("settle-card-received").value) || 0;
    const totalReceived = cashReceived + pixReceived + cardReceived;

    const kmInitial = parseInt(document.getElementById("settle-km-initial").value) || 0;
    const kmFinal = parseInt(document.getElementById("settle-km-final").value) || 0;
    const distanceKm = Math.max(0, kmFinal - kmInitial);

    const expFuel = parseFloat(document.getElementById("settle-exp-fuel").value) || 0;
    const expMeal = parseFloat(document.getElementById("settle-exp-meal").value) || 0;
    const expOthers = parseFloat(document.getElementById("settle-exp-others").value) || 0;
    const totalExpenses = expFuel + expMeal + expOthers;

    let text = `*COMPROVANTE DE ACERTO DE CARGA*\n\n`;
    text += `*Data:* ${window.formatDateBrazil(window.getBrazilTimeISO())}\n\n`;
    
    text += `*Resumo Financeiro*\n`;
    text += `- Dinheiro: R$ ${cashReceived.toFixed(2)}\n`;
    text += `- Pix: R$ ${pixReceived.toFixed(2)}\n`;
    text += `- Cartão: R$ ${cardReceived.toFixed(2)}\n`;
    text += `*Total Recebido: R$ ${totalReceived.toFixed(2)}*\n\n`;
    
    text += `*Despesas de Viagem*\n`;
    text += `- Combustível: R$ ${expFuel.toFixed(2)}\n`;
    text += `- Alimentação: R$ ${expMeal.toFixed(2)}\n`;
    text += `- Outros: R$ ${expOthers.toFixed(2)}\n`;
    text += `*Total Despesas: R$ ${totalExpenses.toFixed(2)}*\n\n`;
    
    text += `*Quilometragem*\n`;
    text += `- Distância Percorrida: ${distanceKm} km\n\n`;
    
    text += `_Acerto registrado via Gelo do Vale App_`;

    const encodedText = encodeURIComponent(text);
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedText}`;
    window.open(whatsappUrl, '_blank');
}

window.shareAcertoWhatsApp = shareAcertoWhatsApp;

// ==========================================
// CONTROLE DE PRODUÇÃO (BAIXA DE EMBALAGENS)
// ==========================================

export function openProductionModal() {
    const pkgSelect = document.getElementById("prod-packaging-id");
    pkgSelect.innerHTML = `<option value="">Selecione a embalagem...</option>`;
    
    if (state.packaging && state.packaging.length > 0) {
        state.packaging.forEach(p => {
            pkgSelect.innerHTML += `<option value="${p.id}">${p.name} (Estoque: ${p.currentStock || 0})</option>`;
        });
    }

    document.getElementById("prod-qty").value = "";
    document.getElementById("prod-obs").value = "";
    document.getElementById("prod-packaging-current").textContent = "0";

    document.getElementById("modal-production").classList.add("active");
}

export function updateProductionInfo() {
    const pkgId = document.getElementById("prod-packaging-id").value;
    if (!pkgId) {
        document.getElementById("prod-packaging-current").textContent = "0";
        return;
    }
    const pkg = state.packaging.find(p => p.id === pkgId);
    if (pkg) {
        document.getElementById("prod-packaging-current").textContent = pkg.currentStock || 0;
    }
}

export function saveProduction() {
    const pkgId = document.getElementById("prod-packaging-id").value;
    const qty = parseInt(document.getElementById("prod-qty").value);
    const obs = document.getElementById("prod-obs").value || "Produção Interna";

    if (!pkgId || isNaN(qty) || qty <= 0) {
        window.showToast("Preencha a embalagem e a quantidade produzida válida.", "warning");
        return;
    }

    const pkg = state.packaging.find(p => p.id === pkgId);
    if (!pkg) {
        window.showToast("Embalagem não encontrada.", "error");
        return;
    }

    const performSave = () => {
        const previousStock = pkg.currentStock || 0;
        pkg.currentStock = previousStock - qty;

        if (!state.packagingTransactions) state.packagingTransactions = [];
        
        state.packagingTransactions.push({
            id: 'tx-' + Date.now(),
            date: window.getBrazilTimeISO(),
            packagingId: pkgId,
            packagingName: pkg.name,
            type: 'out',
            qty: qty,
            afterStock: pkg.currentStock,
            obs: obs
        });

        saveState();
        
        window.showToast(`Produção registrada! Foram consumidas ${qty} unidades de embalagem.`, "success");
        
        if (window.closeModal) window.closeModal("modal-production");
        renderPackaging();
        renderPackagingTransactions();
        
        // Atualizar dashboard para mostrar alertas
        if (window.renderDashboard) window.renderDashboard();
    };

    if ((pkg.currentStock || 0) < qty) {
        window.showConfirm(
            `Atenção: A embalagem tem apenas ${pkg.currentStock || 0} unidades. Se continuar, o estoque ficará negativo. Deseja prosseguir?`,
            performSave,
            null,
            "Estoque de Embalagem Baixo",
            "Prosseguir"
        );
    } else {
        performSave();
    }
}

window.openProductionModal = openProductionModal;
window.updateProductionInfo = updateProductionInfo;
window.saveProduction = saveProduction;

// ==========================================
// CONFIGURAÇÕES DO MERCADO PAGO
// ==========================================

export function loadMercadoPagoSettings() {
    if (!state.mercadoPago) {
        state.mercadoPago = { enabled: false, accessToken: "" };
    }
    
    const mpEnabled = document.getElementById("mp-enabled");
    const mpToken = document.getElementById("mp-access-token");
    
    if (mpEnabled && mpToken) {
        mpEnabled.checked = state.mercadoPago.enabled;
        mpToken.value = state.mercadoPago.accessToken || "";
        toggleMpFields();
    }

    // Carregar Chave PIX Manual
    const staticPixKeyInput = document.getElementById("integration-pix-static-key");
    if (staticPixKeyInput) {
        staticPixKeyInput.value = (state.factorySettings && state.factorySettings.pixKey) || "";
    }
}

export function toggleMpFields() {
    const input = document.getElementById("mp-enabled");
    if (!input) return;
    const isEnabled = input.checked;
    const box = document.getElementById("mp-credentials-box");
    if (box) {
        box.style.display = isEnabled ? "block" : "none";
    }
}

export function saveMercadoPagoSettings() {
    const input = document.getElementById("mp-enabled");
    if (!input) return;
    const isEnabled = input.checked;
    const token = document.getElementById("mp-access-token").value.trim();
    
    if (isEnabled && !token) {
        window.showToast("Para ativar a integração, é obrigatório informar o Access Token.", "warning");
        return;
    }
    
    if (!state.mercadoPago) state.mercadoPago = {};
    
    state.mercadoPago.enabled = isEnabled;
    state.mercadoPago.accessToken = token;
    
    saveState();
    window.showToast("Configurações do Mercado Pago salvas com sucesso!", "success");
}

export function saveManualPixSettings() {
    const keyInput = document.getElementById("integration-pix-static-key");
    if (!keyInput) return;
    const key = keyInput.value.trim();
    
    if (!state.factorySettings) state.factorySettings = {};
    state.factorySettings.pixKey = key;
    
    // Sincronizar com o campo de Dados da Fábrica se ele estiver no DOM
    const factoryPixEl = document.getElementById("cfg-factory-pix");
    if (factoryPixEl) {
        factoryPixEl.value = key;
    }
    
    saveState();
    window.showToast("Chave PIX Manual salva com sucesso!", "success");
}

window.toggleMpFields = toggleMpFields;
window.loadMercadoPagoSettings = loadMercadoPagoSettings;
window.saveMercadoPagoSettings = saveMercadoPagoSettings;
window.saveManualPixSettings = saveManualPixSettings;

export async function generateAndSendMP(event, clientId, amount) {
    if (typeof event === 'string') {
        // Fallback for legacy calls where event was clientId
        amount = clientId;
        clientId = event;
        event = null;
    }
    const client = state.clients.find(c => c.id === clientId);
    if (!client) return;
    
    // Mostra um aviso carregando
    const btnIcon = (event && event.currentTarget) ? event.currentTarget.querySelector('i') : null;
    if (btnIcon) {
        btnIcon.setAttribute('data-lucide', 'loader');
        if (window.lucide) window.lucide.createIcons();
    }
    
    try {
        const link = await window.generateMercadoPagoLink(`Acerto de Dívida - ${client.name}`, amount);
        if (link) {
            // Abre o WhatsApp com o link
            const phone = client.phone ? client.phone.replace(/\D/g, '') : '';
            const msg = `Olá! Segue o link de pagamento do Mercado Pago referente ao acerto pendente (R$ ${amount.toFixed(2).replace('.', ',')}).\nVocê pode escolher pagar via PIX ou Boleto:\n${link}`;
            
            if (phone.length >= 10) {
                window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(msg)}`, '_blank');
            } else {
                // Se não tem telefone, apenas copia pro clipboard ou mostra na tela
                window.showToast(`Link gerado com sucesso (cliente sem telefone cadastrado):\n${link}`, "success");
            }
        }
    } finally {
        if (btnIcon) {
            btnIcon.setAttribute('data-lucide', 'link');
            if (window.lucide) window.lucide.createIcons();
        }
    }
}
window.generateAndSendMP = generateAndSendMP;

export function generateMonthlyPDFReport() {
    if (typeof html2pdf === "undefined") {
        window.showToast("A biblioteca de geração de PDF ainda não foi carregada. Verifique sua conexão com a internet.", "warning");
        return;
    }

    const monthSelect = document.getElementById("admin-finance-month-select");
    const currentMonthStr = monthSelect ? monthSelect.value : window.getBrazilTimeISO().substring(0, 7);
    const [yr, mn] = currentMonthStr.split('-');
    const monthNames = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    const periodStr = `${monthNames[parseInt(mn) - 1]} de ${yr}`;

    // Get Factory Settings
    const factoryName = (state.factorySettings && state.factorySettings.name) || FACTORY_INFO.name;
    const factoryCnpj = (state.factorySettings && state.factorySettings.cnpj) || FACTORY_INFO.cnpj;
    const factoryPhone = (state.factorySettings && state.factorySettings.phone) || FACTORY_INFO.phone;

    let revMonth = 0;
    let cashMonth = 0;
    let pixMonth = 0;
    let cardMonth = 0;
    let packagingCostMonth = 0;
    let totalKgMonth = 0;

    const productSalesCount = {};
    const activeProds = state.products.filter(p => p.active && (p.type === 'Gelo' || p.type === 'Carvão' || p.type === 'Gelo Saborizado'));

    // 1. Somar de state.deliveries
    state.deliveries.forEach(del => {
        if (!del.date) return;
        const delMonthStr = del.date.substring(0, 7);
        
        if (delMonthStr === currentMonthStr) {
            revMonth += (del.revenue || 0);
            const method = (del.paymentMethod || 'pix').toLowerCase();
            const rev = del.revenue || 0;
            if (method.includes('dinheiro') || method.includes('cash')) {
                cashMonth += rev;
            } else if (method.includes('cartão') || method.includes('cartao') || method.includes('card') || method.includes('débito') || method.includes('credito')) {
                cardMonth += rev;
            } else {
                pixMonth += rev; // Padrão: Pix
            }
            
            activeProds.forEach(p => {
                const qtyFardos = del.items[p.id] || 0;
                const qtyUnits = del.items[p.id + "_unit"] || 0;
                if (qtyFardos > 0 || qtyUnits > 0) {
                    const totalQty = qtyFardos + (qtyUnits / (p.unitsPerPack || 12));
                    productSalesCount[p.name] = (productSalesCount[p.name] || 0) + totalQty;
                }
                
                // Calcular kg
                if (p.type === 'Gelo') {
                    totalKgMonth += qtyFardos * (p.weight || 0);
                } else if (p.type === 'Gelo Saborizado') {
                    const unitWeightG = p.unitWeightGrams || 0;
                    const unitsPerPack = p.unitsPerPack || 12;
                    const packWeightKg = (unitWeightG * unitsPerPack) / 1000;
                    totalKgMonth += qtyFardos * packWeightKg + qtyUnits * (unitWeightG / 1000);
                }

                packagingCostMonth += calculateProductPackagingCost(p.id, qtyFardos, qtyUnits);
            });
        }
    });
    
    // 2. Somar de state.documents
    state.documents.forEach(doc => {
        if (doc.type === "recibo" || doc.type === "nota") {
            if (doc.date && doc.date.startsWith(currentMonthStr)) {
                revMonth += doc.total;
                
                const method = (doc.paymentMethod || "").toLowerCase();
                if (method.includes("dinheiro")) {
                    cashMonth += doc.total;
                } else if (method.includes("pix")) {
                    pixMonth += doc.total;
                } else if (method.includes("cartão") || method.includes("cartao") || method.includes("crédito") || method.includes("débito")) {
                    cardMonth += doc.total;
                } else {
                    cashMonth += doc.total;
                }
                
                if (doc.items) {
                    doc.items.forEach(it => {
                        productSalesCount[it.name] = (productSalesCount[it.name] || 0) + it.qty;
                        
                        const prod = activeProds.find(p => p.name === it.name);
                        if (prod) {
                            const productId = it.prodId ? it.prodId.replace("_unit", "") : prod.id;
                            const isUnit = it.prodId ? it.prodId.endsWith("_unit") : false;
                            const qtyFardos = isUnit ? 0 : it.qty;
                            const qtyUnits = isUnit ? it.qty : 0;
                            
                            // Calcular kg de gelo se for gelo em recibo/nota
                            if (prod.type === 'Gelo') {
                                totalKgMonth += qtyFardos * (prod.weight || 0);
                            } else if (prod.type === 'Gelo Saborizado') {
                                const unitWeightG = prod.unitWeightGrams || 0;
                                const unitsPerPack = prod.unitsPerPack || 12;
                                const packWeightKg = (unitWeightG * unitsPerPack) / 1000;
                                totalKgMonth += qtyFardos * packWeightKg + qtyUnits * (unitWeightG / 1000);
                            }

                            packagingCostMonth += calculateProductPackagingCost(productId, qtyFardos, qtyUnits);
                        }
                    });
                }
            }
        }
    });

    // 3. Somar despesas operacionais do mês a partir do histórico de acertos
    let logisticsCostMonth = 0;
    if (state.cargoSettlements) {
        state.cargoSettlements.forEach(settle => {
            if (settle.date && settle.date.substring(0, 7) === currentMonthStr) {
                const expensesTotal = settle.expenses ? (settle.expenses.total || 0) : 0;
                const commission = settle.financials ? (settle.financials.commission || 0) : 0;
                logisticsCostMonth += expensesTotal + commission;
            }
        });
    }

    // Calcular Lucro Líquido Real (Mês)
    const realProfitMonth = revMonth - packagingCostMonth - logisticsCostMonth;
    const totalCostsMonth = packagingCostMonth + logisticsCostMonth;

    // Calcular Clientes Top 10 por Receita
    const clientRevenue = {};
    (state.clients || []).forEach(c => {
        clientRevenue[c.id] = { name: c.name, revenue: 0 };
    });

    state.deliveries.forEach(del => {
        if (del.date && del.date.substring(0, 7) === currentMonthStr) {
            if (clientRevenue[del.clientId]) {
                clientRevenue[del.clientId].revenue += del.revenue || 0;
            } else {
                clientRevenue[del.clientId] = { name: del.clientName || "Cliente Removido", revenue: del.revenue || 0 };
            }
        }
    });

    state.documents.forEach(doc => {
        if ((doc.type === "recibo" || doc.type === "nota") && doc.date && doc.date.startsWith(currentMonthStr)) {
            if (clientRevenue[doc.clientId]) {
                clientRevenue[doc.clientId].revenue += doc.total || 0;
            } else {
                clientRevenue[doc.clientId] = { name: doc.clientName || "Cliente Removido", revenue: doc.total || 0 };
            }
        }
    });

    const topClients = Object.values(clientRevenue)
        .filter(c => c.revenue > 0)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

    let topClientsHTML = "";
    if (topClients.length === 0) {
        topClientsHTML = `<tr><td colspan="3" style="padding: 6px 0; text-align: center; color: #64748b;">Nenhuma receita registrada neste mês.</td></tr>`;
    } else {
        topClients.forEach((tc, idx) => {
            topClientsHTML += `
                <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 6px 0; color: #64748b;">#${idx + 1}</td>
                    <td style="padding: 6px 0; font-weight: 600; color: #334155;">${tc.name}</td>
                    <td style="padding: 6px 0; text-align: right; font-weight: 700; color: #0f172a;">R$ ${tc.revenue.toFixed(2).replace(".", ",")}</td>
                </tr>
            `;
        });
    }

    // Top Products HTML
    const sortedProds = Object.entries(productSalesCount).sort((a, b) => b[1] - a[1]);
    let topProductsHTML = "";
    if (sortedProds.length === 0) {
        topProductsHTML = `<tr><td colspan="2" style="padding: 6px 0; text-align: center; color: #64748b;">Nenhum produto vendido neste mês.</td></tr>`;
    } else {
        sortedProds.forEach(([name, qty]) => {
            topProductsHTML += `
                <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 6px 0; color: #334155; font-weight: 500;">${name}</td>
                    <td style="padding: 6px 0; text-align: right; font-weight: 600; color: #0f172a;">${Math.round(qty)} fardos</td>
                </tr>
            `;
        });
    }

    // Patrimônio
    const activeFreezersCount = (state.clients || []).filter(c => c.freezerCode).length;
    const activeRentalsCount = state.rentals ? (state.rentals || []).filter(r => r.status === "active" || r.status === "overdue").length : 0;

    // Obter imagem dos gráficos se existirem
    const revCanvas = document.getElementById("revenueChart");
    const prodCanvas = document.getElementById("productsChart");
    let revChartImg = "";
    let prodChartImg = "";
    if (revCanvas) {
        try {
            revChartImg = revCanvas.toDataURL("image/png");
        } catch (e) {
            console.error("Erro ao ler revenueChart:", e);
        }
    }
    if (prodCanvas) {
        try {
            prodChartImg = prodCanvas.toDataURL("image/png");
        } catch (e) {
            console.error("Erro ao ler productsChart:", e);
        }
    }

    // Format strings
    const revMonthStr = revMonth.toFixed(2).replace(".", ",");
    const costsMonthStr = totalCostsMonth.toFixed(2).replace(".", ",");
    const realProfitMonthStr = realProfitMonth.toFixed(2).replace(".", ",");
    const cashMonthStr = cashMonth.toFixed(2).replace(".", ",");
    const pixMonthStr = pixMonth.toFixed(2).replace(".", ",");
    const cardMonthStr = cardMonth.toFixed(2).replace(".", ",");
    const packagingCostMonthStr = packagingCostMonth.toFixed(2).replace(".", ",");
    const logisticsCostMonthStr = logisticsCostMonth.toFixed(2).replace(".", ",");

    // Construir container HTML temporário
    const reportWrapper = document.createElement("div");
    reportWrapper.style.position = "absolute";
    reportWrapper.style.left = "-9999px";
    reportWrapper.style.top = "-9999px";
    reportWrapper.style.width = "800px";

    reportWrapper.innerHTML = `
        <div id="monthly-pdf-report-content" style="color: #1e293b; font-family: Arial, sans-serif; padding: 30px; background: #ffffff; box-sizing: border-box;">
            <!-- Header -->
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 15px; margin-bottom: 20px;">
                <div>
                    <h1 style="font-size: 22px; font-weight: 800; color: #0f172a; margin: 0; text-transform: uppercase;">Relatório Mensal de Gestão</h1>
                    <p style="font-size: 14px; color: #64748b; margin: 5px 0 0 0;">Competência: ${periodStr}</p>
                </div>
                <div style="text-align: right;">
                    <h2 style="font-size: 16px; font-weight: 700; color: #0f172a; margin: 0;">${factoryName}</h2>
                    <p style="font-size: 11px; color: #64748b; margin: 2px 0 0 0;">CNPJ: ${factoryCnpj}</p>
                    <p style="font-size: 11px; color: #64748b; margin: 2px 0 0 0;">Tel: ${factoryPhone}</p>
                </div>
            </div>

            <!-- KPI Summary Cards -->
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px;">
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; text-align: center;">
                    <span style="font-size: 10px; color: #64748b; display: block; font-weight: 600; text-transform: uppercase; margin-bottom: 4px;">Faturamento Bruto</span>
                    <strong style="font-size: 18px; color: #0f172a;">R$ ${revMonthStr}</strong>
                </div>
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; text-align: center;">
                    <span style="font-size: 10px; color: #64748b; display: block; font-weight: 600; text-transform: uppercase; margin-bottom: 4px;">Custos Operacionais</span>
                    <strong style="font-size: 18px; color: #dc2626;">R$ ${costsMonthStr}</strong>
                </div>
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; text-align: center; border-left: 4px solid ${realProfitMonth >= 0 ? '#16a34a' : '#dc2626'};">
                    <span style="font-size: 10px; color: #64748b; display: block; font-weight: 600; text-transform: uppercase; margin-bottom: 4px;">Resultado Líquido</span>
                    <strong style="font-size: 18px; color: ${realProfitMonth >= 0 ? '#16a34a' : '#dc2626'};">R$ ${realProfitMonthStr}</strong>
                </div>
            </div>

            <!-- Secondary Info Rows -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                <!-- Meios de Pagamento -->
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px;">
                    <h3 style="font-size: 12px; font-weight: 700; color: #0f172a; margin: 0 0 10px 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; text-transform: uppercase;">Receita por Meio de Pagamento</h3>
                    <div style="display: flex; flex-direction: column; gap: 6px; font-size: 11px;">
                        <div style="display: flex; justify-content: space-between;">
                            <span style="color: #64748b;">Dinheiro:</span>
                            <strong style="color: #334155;">R$ ${cashMonthStr}</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span style="color: #64748b;">Pix:</span>
                            <strong style="color: #334155;">R$ ${pixMonthStr}</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span style="color: #64748b;">Cartão:</span>
                            <strong style="color: #334155;">R$ ${cardMonthStr}</strong>
                        </div>
                    </div>
                </div>
                <!-- Detalhamento de Custos -->
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px;">
                    <h3 style="font-size: 12px; font-weight: 700; color: #0f172a; margin: 0 0 10px 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; text-transform: uppercase;">Detalhamento de Custos</h3>
                    <div style="display: flex; flex-direction: column; gap: 6px; font-size: 11px;">
                        <div style="display: flex; justify-content: space-between;">
                            <span style="color: #64748b;">Custo de Embalagens:</span>
                            <strong style="color: #334155;">R$ ${packagingCostMonthStr}</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span style="color: #64748b;">Custos Logísticos & Comissões:</span>
                            <strong style="color: #334155;">R$ ${logisticsCostMonthStr}</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span style="color: #64748b;">Gelo Total Entregue:</span>
                            <strong style="color: #334155;">${totalKgMonth.toLocaleString('pt-BR')} kg</strong>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Charts Section -->
            ${(revChartImg || prodChartImg) ? `
            <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 15px; margin-bottom: 20px;">
                ${revChartImg ? `
                <div style="border: 1px solid #e2e8f0; padding: 10px; border-radius: 8px; text-align: center;">
                    <h4 style="font-size: 10px; color: #64748b; margin: 0 0 8px 0; text-transform: uppercase;">Evolução de Vendas (Últimos 15 dias)</h4>
                    <img src="${revChartImg}" style="max-width: 100%; height: auto; border-radius: 4px;" />
                </div>` : ''}
                ${prodChartImg ? `
                <div style="border: 1px solid #e2e8f0; padding: 10px; border-radius: 8px; text-align: center;">
                    <h4 style="font-size: 10px; color: #64748b; margin: 0 0 8px 0; text-transform: uppercase;">Mix de Produtos Vendidos</h4>
                    <img src="${prodChartImg}" style="max-width: 100%; height: auto; border-radius: 4px;" />
                </div>` : ''}
            </div>
            ` : ''}

            <!-- Top Clients and Top Products -->
            <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 15px; margin-bottom: 20px; page-break-inside: avoid;">
                <!-- Top 10 Clientes -->
                <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; background: #ffffff;">
                    <h3 style="font-size: 11px; font-weight: 700; color: #0f172a; margin: 0 0 8px 0; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">Top 10 Clientes por Receita</h3>
                    <table style="width: 100%; border-collapse: collapse; font-size: 10px; text-align: left;">
                        <thead>
                            <tr style="border-bottom: 1px solid #cbd5e1; font-weight: bold;">
                                <th style="padding: 4px 0; width: 40px;">Rank</th>
                                <th style="padding: 4px 0;">Cliente</th>
                                <th style="padding: 4px 0; text-align: right;">Receita</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${topClientsHTML}
                        </tbody>
                    </table>
                </div>
                
                <!-- Mix de Produtos e Resumo de Aluguéis -->
                <div style="display: flex; flex-direction: column; gap: 12px;">
                    <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; background: #ffffff;">
                        <h3 style="font-size: 11px; font-weight: 700; color: #0f172a; margin: 0 0 8px 0; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">Produtos Mais Vendidos</h3>
                        <table style="width: 100%; border-collapse: collapse; font-size: 10px; text-align: left;">
                            <thead>
                                <tr style="border-bottom: 1px solid #cbd5e1; font-weight: bold;">
                                    <th style="padding: 4px 0;">Produto</th>
                                    <th style="padding: 4px 0; text-align: right;">Qtd (Fdos)</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${topProductsHTML}
                            </tbody>
                        </table>
                    </div>

                    <!-- Aluguéis Ativos no Mês -->
                    <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; background: #ffffff;">
                        <h3 style="font-size: 11px; font-weight: 700; color: #0f172a; margin: 0 0 8px 0; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">Resumo Patrimonial</h3>
                        <div style="font-size: 10px; display: flex; flex-direction: column; gap: 6px;">
                            <div style="display: flex; justify-content: space-between;">
                                <span style="color: #64748b;">Freezers Alocados:</span>
                                <strong style="color: #334155;">${activeFreezersCount} unidades</strong>
                            </div>
                            <div style="display: flex; justify-content: space-between;">
                                <span style="color: #64748b;">Aluguéis Ativos de Tinas:</span>
                                <strong style="color: #334155;">${activeRentalsCount} ativas</strong>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Footer / Signatures -->
            <div style="margin-top: 30px; display: flex; justify-content: space-between; font-size: 9px; color: #64748b; border-top: 1px dashed #cbd5e1; padding-top: 15px;">
                <div>Gerado automaticamente pelo sistema GelControl v${APP_VERSION}</div>
                <div style="text-align: right;">Emissão: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}</div>
            </div>
        </div>
    `;

    document.body.appendChild(reportWrapper);

    const filename = `relatorio_mensal_${currentMonthStr.replace("-", "_")}.pdf`;
    const opt = {
        margin:       10,
        filename:     filename,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, logging: false },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    const btn = document.querySelector('.btn-generate-report');
    const originalText = btn ? btn.innerHTML : '';
    if (btn) {
        btn.innerHTML = '<span class="spin-anim" style="display:inline-block; border: 2px solid #fff; border-top: 2px solid transparent; border-radius: 50%; width: 12px; height: 12px; margin-right: 6px; vertical-align: middle;"></span> Gerando...';
        btn.disabled = true;
    }

    html2pdf().set(opt).from(reportWrapper).save().then(() => {
        if (btn) {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
        document.body.removeChild(reportWrapper);
        window.showToast("Relatório mensal gerado com sucesso!", "success");
    }).catch(err => {
        console.error("Erro ao gerar PDF:", err);
        window.showToast("Ocorreu um erro ao gerar o PDF.", "error");
        if (btn) {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
        if (reportWrapper.parentNode) {
            document.body.removeChild(reportWrapper);
        }
    });
}

window.generateMonthlyPDFReport = generateMonthlyPDFReport;

export function renderFreezerRentability() {
    const tbody = document.getElementById("freezer-rentability-tbody");
    if (!tbody) return;
    tbody.innerHTML = "";

    const activeFreezers = (state.freezers || []).filter(f => f.status === "alocado");

    if (activeFreezers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align: center; padding: 2rem; color: var(--color-text-muted);">
                    Nenhum freezer alocado (em comodato) no momento.
                </td>
            </tr>
        `;
        return;
    }

    activeFreezers.forEach(f => {
        // 1. Manutenção: Soma dos custos de registros de manutenção do freezer
        let totalMaintenanceCost = 0;
        if (f.maintenanceLogs) {
            f.maintenanceLogs.forEach(log => {
                totalMaintenanceCost += parseFloat(log.cost) || 0;
            });
        }

        // 2. Depreciação: Estimativa baseada na data de compra e vida útil de 10 anos (120 meses).
        // Custo estimado do freezer novo: R$ 3500.00
        const purchaseCost = 3500.00;
        let depreciation = 0;
        if (f.purchaseDate) {
            const purchaseDateObj = new Date(f.purchaseDate + 'T00:00:00');
            const today = new Date();
            const diffMonths = (today.getFullYear() - purchaseDateObj.getFullYear()) * 12 + (today.getMonth() - purchaseDateObj.getMonth());
            const monthsClamped = Math.max(0, Math.min(120, diffMonths));
            depreciation = (purchaseCost / 120) * monthsClamped;
        }

        // 3. Faturamento Gerado: Receita acumulada das vendas de fardos de gelo do cliente alocado
        let totalSalesRevenue = 0;
        if (f.clientId && state.deliveries) {
            state.deliveries.forEach(del => {
                if (del.clientId === f.clientId) {
                    totalSalesRevenue += parseFloat(del.revenue) || 0;
                }
            });
        }

        // 4. Resultado Líquido
        const netResult = totalSalesRevenue - totalMaintenanceCost - depreciation;

        // 5. ROI %: (Resultado Líquido / (Depreciação + Custos de Manutenção)) * 100
        const costBasis = depreciation + totalMaintenanceCost;
        let roiPercent = 0;
        if (costBasis > 0) {
            roiPercent = (netResult / costBasis) * 100;
        } else if (totalSalesRevenue > 0) {
            roiPercent = 100.00; // Faturamento com custo zero
        }

        // 6. Badge visual de ROI
        let statusBadge = "";
        if (roiPercent > 50) {
            statusBadge = `<span class="status-badge completed" style="background: rgba(16,185,129,0.15); color: #10b981; font-weight: bold; border: 1px solid rgba(16,185,129,0.3);">🟢 Lucrativo</span>`;
        } else if (roiPercent >= 0) {
            statusBadge = `<span class="status-badge pending" style="background: rgba(245,158,11,0.15); color: #f59e0b; font-weight: bold; border: 1px solid rgba(245,158,11,0.3);">🟡 Equilibrado</span>`;
        } else {
            statusBadge = `<span class="status-badge expired" style="background: rgba(239,68,68,0.15); color: var(--color-danger); font-weight: bold; border: 1px solid rgba(239,68,68,0.3);">🔴 Prejuízo</span>`;
        }

        tbody.innerHTML += `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.03); font-size: 0.8rem;">
                <td style="padding: 12px 8px; font-weight: bold; color: var(--color-primary);">${f.code}</td>
                <td style="padding: 12px 8px;">${f.clientName || 'N/A'}</td>
                <td style="padding: 12px 8px; color: var(--color-text-muted);">${f.brand || 'Freezer'}</td>
                <td style="padding: 12px 8px; text-align: right; color: var(--color-danger);">R$ ${depreciation.toFixed(2).replace(".", ",")}</td>
                <td style="padding: 12px 8px; text-align: right; color: #ffb703;">R$ ${totalMaintenanceCost.toFixed(2).replace(".", ",")}</td>
                <td style="padding: 12px 8px; text-align: right; color: #10b981; font-weight: 600;">R$ ${totalSalesRevenue.toFixed(2).replace(".", ",")}</td>
                <td style="padding: 12px 8px; text-align: right; font-weight: 700; color: ${netResult >= 0 ? '#10b981' : 'var(--color-danger)'}">R$ ${netResult.toFixed(2).replace(".", ",")}</td>
                <td style="padding: 12px 8px; text-align: center; font-weight: bold; color: ${roiPercent >= 0 ? 'var(--color-primary)' : 'var(--color-danger)'}">${roiPercent.toFixed(1)}%</td>
                <td style="padding: 12px 8px; text-align: center;">${statusBadge}</td>
            </tr>
        `;
    });
}
window.renderFreezerRentability = renderFreezerRentability;

export function populateCargoSettlementDrivers() {
    const select = document.getElementById("settle-driver-id");
    if (!select) return;
    select.innerHTML = '<option value="">-- Selecione o Motorista --</option>';
    
    const users = state.users || [];
    users.forEach(u => {
        const option = document.createElement("option");
        option.value = u.id;
        option.textContent = u.name;
        select.appendChild(option);
    });
}
window.populateCargoSettlementDrivers = populateCargoSettlementDrivers;

export function populateCommissionsDriverFilter() {
    const select = document.getElementById("commission-driver-filter");
    if (!select) return;
    select.innerHTML = '<option value="">-- Todos os Motoristas --</option>';
    
    const users = state.users || [];
    users.forEach(u => {
        const option = document.createElement("option");
        option.value = u.id;
        option.textContent = u.name;
        select.appendChild(option);
    });
}
window.populateCommissionsDriverFilter = populateCommissionsDriverFilter;

export function renderDriverCommissionsReport() {
    const tbody = document.getElementById("driver-commissions-tbody");
    if (!tbody) return;
    
    tbody.innerHTML = "";
    
    const filterSelect = document.getElementById("commission-driver-filter");
    const driverIdFilter = filterSelect ? filterSelect.value : "";
    
    const settlements = state.cargoSettlements || [];
    
    let totalTrips = 0;
    let totalRevenue = 0;
    let totalExpenses = 0;
    let totalCommission = 0;
    
    settlements.forEach(s => {
        if (driverIdFilter && s.driverId !== driverIdFilter) return;
        
        totalTrips++;
        const rev = s.financials ? (s.financials.totalReceived || 0) : 0;
        const exp = s.expenses ? (s.expenses.total || 0) : 0;
        const com = s.financials ? (s.financials.commission || 0) : 0;
        
        totalRevenue += rev;
        totalExpenses += exp;
        totalCommission += com;
        
        const netProfit = rev - exp - com;
        const row = document.createElement("tr");
        row.style.borderBottom = "1px solid rgba(255,255,255,0.05)";
        row.innerHTML = `
            <td style="padding: 8px 6px; color: #fff;">${s.date ? new Date(s.date).toLocaleDateString('pt-BR') : '-'}</td>
            <td style="padding: 8px 6px; color: var(--color-text-muted);">${s.driverName || 'Geral'}</td>
            <td style="padding: 8px 6px; text-align: right; color: #fff;">R$ ${rev.toFixed(2).replace(".", ",")}</td>
            <td style="padding: 8px 6px; text-align: right; color: var(--color-danger);">R$ ${exp.toFixed(2).replace(".", ",")}</td>
            <td style="padding: 8px 6px; text-align: right; color: var(--color-primary); font-weight: bold;">R$ ${com.toFixed(2).replace(".", ",")}</td>
            <td style="padding: 8px 6px; text-align: right; color: ${netProfit >= 0 ? '#00ff64' : '#ef4444'}; font-weight: bold;">R$ ${netProfit.toFixed(2).replace(".", ",")}</td>
        `;
        tbody.appendChild(row);
    });
    
    // Atualizar KPIs na tela
    const tripsEl = document.getElementById("driver-kpi-trips");
    if (tripsEl) tripsEl.textContent = totalTrips;
    
    const revEl = document.getElementById("driver-kpi-revenue");
    if (revEl) revEl.textContent = "R$ " + totalRevenue.toFixed(2).replace(".", ",");
    
    const expEl = document.getElementById("driver-kpi-expenses");
    if (expEl) expEl.textContent = "R$ " + totalExpenses.toFixed(2).replace(".", ",");
    
    const comEl = document.getElementById("driver-kpi-commission");
    if (comEl) comEl.textContent = "R$ " + totalCommission.toFixed(2).replace(".", ",");
}
window.renderDriverCommissionsReport = renderDriverCommissionsReport;

export function loadWhatsAppSettings() {
    if (!state.whatsapp) {
        state.whatsapp = { enabled: false, provider: "z-api", url: "", token: "" };
    }
    
    const waEnabled = document.getElementById("wa-api-enabled");
    const waProvider = document.getElementById("wa-api-provider");
    const waUrl = document.getElementById("wa-api-url");
    const waToken = document.getElementById("wa-api-token");
    
    if (waEnabled && waProvider && waUrl && waToken) {
        waEnabled.checked = state.whatsapp.enabled || false;
        waProvider.value = state.whatsapp.provider || "z-api";
        waUrl.value = state.whatsapp.url || "";
        waToken.value = state.whatsapp.token || "";
        toggleWaFields();
    }
}

export function toggleWaFields() {
    const input = document.getElementById("wa-api-enabled");
    if (!input) return;
    const isEnabled = input.checked;
    const box = document.getElementById("wa-credentials-box");
    if (box) {
        box.style.display = isEnabled ? "block" : "none";
    }
}

export function saveWhatsAppSettings() {
    const input = document.getElementById("wa-api-enabled");
    if (!input) return;
    const isEnabled = input.checked;
    const provider = document.getElementById("wa-api-provider").value;
    const url = document.getElementById("wa-api-url").value.trim();
    const token = document.getElementById("wa-api-token").value.trim();
    
    if (isEnabled && !url) {
        window.showToast("Para ativar a integração, é obrigatório informar a URL do servidor.", "warning");
        return;
    }
    
    if (!state.whatsapp) state.whatsapp = {};
    
    state.whatsapp.enabled = isEnabled;
    state.whatsapp.provider = provider;
    state.whatsapp.url = url;
    state.whatsapp.token = token;
    
    saveState();
    window.showToast("Configurações do WhatsApp salvas com sucesso!", "success");
}

window.toggleWaFields = toggleWaFields;
window.loadWhatsAppSettings = loadWhatsAppSettings;
window.saveWhatsAppSettings = saveWhatsAppSettings;



