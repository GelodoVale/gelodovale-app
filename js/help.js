/**
 * GELCONTROL - Gerenciador do Sistema de Ajuda Contextual
 */

(function () {
    // Inject CSS styles for help badges
    function injectHelpCSS() {
        if (document.getElementById('gel-help-css')) return;
        const style = document.createElement('style');
        style.id = 'gel-help-css';
        style.textContent = `
            .btn-help-icon-only {
                background: rgba(56, 189, 248, 0.15) !important;
                border: 1px solid rgba(56, 189, 248, 0.4) !important;
                color: #38bdf8 !important;
                width: 24px !important;
                height: 24px !important;
                min-width: 24px !important;
                min-height: 24px !important;
                border-radius: 50% !important;
                font-size: 0.8rem !important;
                font-weight: 700 !important;
                cursor: pointer !important;
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
                transition: all 0.2s ease !important;
                margin-left: 8px !important;
                vertical-align: middle !important;
                box-shadow: 0 0 8px rgba(56, 189, 248, 0.2) !important;
                padding: 0 !important;
                line-height: 1 !important;
            }
            .btn-help-icon-only:hover {
                background: rgba(56, 189, 248, 0.35) !important;
                color: #ffffff !important;
                transform: scale(1.15) !important;
                box-shadow: 0 0 14px rgba(56, 189, 248, 0.5) !important;
            }
            .btn-help-badge {
                background: rgba(56, 189, 248, 0.1) !important;
                border: 1px solid rgba(56, 189, 248, 0.35) !important;
                color: #38bdf8 !important;
                padding: 6px 14px !important;
                border-radius: 20px !important;
                font-size: 0.82rem !important;
                font-weight: 600 !important;
                cursor: pointer !important;
                display: inline-flex !important;
                align-items: center !important;
                gap: 6px !important;
                transition: all 0.2s ease !important;
                box-shadow: 0 0 12px rgba(56, 189, 248, 0.15) !important;
                text-decoration: none !important;
            }
            .btn-help-badge:hover {
                background: rgba(56, 189, 248, 0.25) !important;
                border-color: #38bdf8 !important;
                color: #ffffff !important;
                transform: translateY(-1px) !important;
                box-shadow: 0 0 18px rgba(56, 189, 248, 0.35) !important;
            }
            .help-modal-card {
                animation: helpModalSlide 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
            @keyframes helpModalSlide {
                from { opacity: 0; transform: translateY(15px) scale(0.97); }
                to { opacity: 1; transform: translateY(0) scale(1); }
            }
        `;
        document.head.appendChild(style);
    }
    injectHelpCSS();

    // 1. Criar o HTML do Modal de Ajuda se ainda não existir
    function injectHelpModalHTML() {
        if (document.getElementById('gel-help-modal')) return;

        const modalHTML = `
        <div id="gel-help-modal" class="modal-overlay" style="display:none; z-index: 10000;">
            <div class="modal-card help-modal-card" style="max-width: 650px; width: 90%; background: #0f172a; border: 1px solid #1e293b; border-radius: 16px; box-shadow: 0 20px 50px rgba(0,0,0,0.8); color: #f8fafc; padding: 24px; position: relative;">
                
                <!-- Header -->
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1e293b; padding-bottom: 16px; margin-bottom: 16px;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <span id="help-modal-icon" style="font-size: 1.8rem; background: rgba(56, 189, 248, 0.1); padding: 8px 12px; border-radius: 12px; border: 1px solid rgba(56, 189, 248, 0.2);">💡</span>
                        <div>
                            <h3 id="help-modal-title" style="margin: 0; font-size: 1.25rem; font-weight: 700; color: #38bdf8;">Título da Ajuda</h3>
                            <p id="help-modal-summary" style="margin: 2px 0 0 0; font-size: 0.85rem; color: #94a3b8;">Resumo da seção</p>
                        </div>
                    </div>
                    <button type="button" onclick="closeHelpModal()" style="background: transparent; border: none; color: #94a3b8; font-size: 1.5rem; cursor: pointer; padding: 4px 8px; border-radius: 8px; transition: all 0.2s;" onmouseover="this.style.color='#f8fafc'" onmouseout="this.style.color='#94a3b8'">&times;</button>
                </div>

                <!-- Body Scrollable -->
                <div id="help-modal-body" style="max-height: 60vh; overflow-y: auto; padding-right: 8px;">
                    
                    <!-- Explicação -->
                    <div style="background: rgba(30, 41, 59, 0.5); border-left: 4px solid #38bdf8; padding: 12px 16px; border-radius: 8px; margin-bottom: 16px;">
                        <h4 style="margin: 0 0 6px 0; font-size: 0.95rem; color: #f8fafc; display: flex; align-items: center; gap: 6px;">
                            <span>💡 O que é esta tela?</span>
                        </h4>
                        <p id="help-modal-description" style="margin: 0; font-size: 0.9rem; line-height: 1.5; color: #cbd5e1;"></p>
                    </div>

                    <!-- Passo a Passo -->
                    <div style="margin-bottom: 16px;">
                        <h4 style="margin: 0 0 10px 0; font-size: 0.95rem; color: #38bdf8; display: flex; align-items: center; gap: 6px;">
                            <span>📋 Passo a Passo de Como Usar:</span>
                        </h4>
                        <ol id="help-modal-steps" style="margin: 0; padding-left: 20px; font-size: 0.9rem; line-height: 1.6; color: #cbd5e1;"></ol>
                    </div>

                    <!-- Dicas e Alertas -->
                    <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.2); padding: 12px 16px; border-radius: 8px;">
                        <h4 style="margin: 0 0 6px 0; font-size: 0.95rem; color: #fbbf24; display: flex; align-items: center; gap: 6px;">
                            <span>⚠️ Dicas & Regras de Negócio:</span>
                        </h4>
                        <ul id="help-modal-tips" style="margin: 0; padding-left: 20px; font-size: 0.85rem; line-height: 1.5; color: #fef3c7;"></ul>
                    </div>

                </div>

                <!-- Footer -->
                <div style="margin-top: 20px; pt-16px; border-top: 1px solid #1e293b; display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 0.75rem; color: #64748b;">GelControl • Central de Conhecimento</span>
                    <button type="button" onclick="closeHelpModal()" class="btn btn-secondary" style="padding: 6px 16px; font-size: 0.85rem; border-radius: 8px;">Entendi</button>
                </div>

            </div>
        </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    // 2. Abrir o modal de ajuda pelo ID do tópico
    window.openHelpTopic = function (topicKey) {
        injectHelpModalHTML();

        const dict = window.GEL_HELP_DICTIONARY || {};
        const topic = dict[topicKey] || {
            title: "Ajuda Contextual",
            icon: "❓",
            summary: "Informações sobre esta funcionalidade.",
            description: "Esta seção contém recursos do sistema GelControl.",
            steps: ["Utilize os controles na tela para gerenciar as informações."],
            tips: ["Em caso de dúvidas, consulte o suporte da fábrica."]
        };

        document.getElementById('help-modal-icon').innerText = topic.icon || "❓";
        document.getElementById('help-modal-title').innerText = topic.title || "Ajuda";
        document.getElementById('help-modal-summary').innerText = topic.summary || "";
        document.getElementById('help-modal-description').innerText = topic.description || "";

        // Preencher Passo a Passo
        const stepsOL = document.getElementById('help-modal-steps');
        stepsOL.innerHTML = "";
        (topic.steps || []).forEach(step => {
            const li = document.createElement('li');
            li.style.marginBottom = '10px';
            li.style.lineHeight = '1.6';
            li.innerHTML = step;
            stepsOL.appendChild(li);
        });

        // Preencher Dicas
        const tipsUL = document.getElementById('help-modal-tips');
        tipsUL.innerHTML = "";
        (topic.tips || []).forEach(tip => {
            const li = document.createElement('li');
            li.style.marginBottom = '8px';
            li.style.lineHeight = '1.5';
            li.innerHTML = tip;
            tipsUL.appendChild(li);
        });

        // Exibir o modal
        const modal = document.getElementById('gel-help-modal');
        modal.style.display = 'flex';
        modal.classList.add('active');
    };

    // 3. Fechar o modal de ajuda
    window.closeHelpModal = function () {
        const modal = document.getElementById('gel-help-modal');
        if (modal) {
            modal.style.display = 'none';
            modal.classList.remove('active');
        }
    };

    // Fechar ao clicar no overlay
    document.addEventListener('click', function (e) {
        const modal = document.getElementById('gel-help-modal');
        if (modal && e.target === modal) {
            closeHelpModal();
        }
    });

    // Fechar com a tecla ESC
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            closeHelpModal();
        }
    });

    // 4. Mapeamento do Botão de Ajuda Principal do Topo (ao lado do Nome Principal no Cabeçalho)
    window.updateTopHeaderHelpBadge = function (explicitKey) {
        let slotEl = document.getElementById('header-help-slot');
        const pageTitleEl = document.getElementById('page-title');
        if (!pageTitleEl) return;

        if (!slotEl) {
            slotEl = document.createElement('span');
            slotEl.id = 'header-help-slot';
            slotEl.style.display = 'inline-flex';
            slotEl.style.alignItems = 'center';
            slotEl.style.marginLeft = '12px';
            if (pageTitleEl.parentNode) {
                pageTitleEl.parentNode.insertBefore(slotEl, pageTitleEl.nextSibling);
            }
        }

        // Determinar chave ativa com prioridade imediata
        let activeKey = explicitKey || '';

        if (!activeKey) {
            const activeNav = document.querySelector('.nav-item.active');
            if (activeNav) {
                activeKey = activeNav.getAttribute('data-tab') || '';
            }
        }

        if (!activeKey) {
            activeKey = 'dashboard';
        }

        // Sanitizar chaves e sinonimos principais
        if (typeof activeKey === 'string' && activeKey.startsWith('view-')) {
            activeKey = activeKey.replace('view-', '');
        }
        if (activeKey === 'tinas' || activeKey === 'equipamentos') activeKey = 'rentals';
        if (activeKey === 'inventario') activeKey = 'freezers';
        if (activeKey === 'documentos') activeKey = 'recibos';

        // Se estiver no Admin / Preços / Configurações, verificar sub-aba ativa
        if (activeKey === 'admin' || activeKey === 'configuracoes' || activeKey === 'precos') {
            let subId = window.activeAdminSubTab || '';
            if (!subId) {
                const activeMenuBtn = document.querySelector('.admin-menu-btn.active');
                if (activeMenuBtn) {
                    const attr = activeMenuBtn.getAttribute('onclick') || '';
                    const match = attr.match(/['"]([^'"]+)['"]/);
                    if (match) subId = match[1];
                }
            }
            if (!subId) {
                const activeSubtab = document.querySelector('.admin-subtab-content:not([style*="display: none"]), .admin-subtab-content.active');
                if (activeSubtab && activeSubtab.id) subId = activeSubtab.id;
            }
            if (subId) {
                subId = subId.replace('tab-', '').replace('admin-tab-', '');
                if (subId === 'rentabilidade-freezers') subId = 'rentabilidade';
                if (subId === 'suprimentos') subId = 'insumos';
                if (subId === 'seguranca-backup') subId = 'seguranca';
                if (subId === 'catalogo' || subId === 'financeiro') subId = 'precos';
                if (subId === 'acerto') subId = 'viagem';
                if (subId === 'contas-receber') subId = 'contas_receber';
                if (subId) activeKey = subId;
            }
        }

        const dict = window.GEL_HELP_DICTIONARY || {};
        const topic = dict[activeKey] || dict['dashboard'];

        // Se o botão já existir no slot e corresponder à aba atual, não recriar
        const existingBtn = slotEl.querySelector('.btn-help-badge');
        if (existingBtn && existingBtn.getAttribute('data-help-key') === activeKey) {
            return;
        }

        slotEl.innerHTML = '';

        if (topic && topic.badge) {
            const helpBtn = document.createElement('button');
            helpBtn.type = 'button';
            helpBtn.className = 'btn-help-badge';
            helpBtn.setAttribute('data-help-key', activeKey);
            helpBtn.innerHTML = topic.badge;
            helpBtn.onclick = function (e) {
                e.preventDefault();
                e.stopPropagation();
                window.openHelpTopic(activeKey);
            };

            slotEl.appendChild(helpBtn);
        }
    };

    // Delegação instantânea de clique (0ms de atraso na resposta visual)
    document.addEventListener('click', function (e) {
        const navItem = e.target.closest('.nav-item');
        if (navItem) {
            const tab = navItem.getAttribute('data-tab');
            if (tab) {
                updateTopHeaderHelpBadge(tab);
            }
        }
        const adminBtn = e.target.closest('.admin-menu-btn');
        if (adminBtn) {
            const attr = adminBtn.getAttribute('onclick') || '';
            const match = attr.match(/['"]([^'"]+)['"]/);
            if (match) {
                updateTopHeaderHelpBadge(match[1]);
                setTimeout(attachInternalHelpButtons, 40);
            }
        }
        const modalTrigger = e.target.closest('[onclick*="openModal"], [onclick*="openClientModal"], [onclick*="openFreezerModal"], [onclick*="openRentalModal"], [onclick*="openDocModal"]');
        if (modalTrigger) {
            setTimeout(attachInternalHelpButtons, 60);
        }
    }, true);

    // 5. Injeção Específica de Ícones ? (sem título) em Janelas Internas (Modais) e Sub-abas
    const MODAL_HELP_MAP = {
        'modal-client': 'modal_client',
        'modal-order': 'modal_order',
        'modal-sales': 'modal_sales',
        'modal-freezer': 'modal_freezer',
        'modal-freezer-detail': 'modal_freezer_detail',
        'modal-comodato': 'modal_comodato',
        'modal-create-comodato': 'modal_comodato',
        'modal-rental': 'modal_rental',
        'modal-document': 'modal_document',
        'modal-client-prices': 'modal_client_prices',
        'modal-receive-payment': 'modal_receive_payment',
        'modal-user-form': 'modal_user_form',
        'modal-packaging-entry': 'modal_packaging_entry',
        'modal-carne': 'modal_carne',
        'modal-caixa-diario': 'modal_caixa_diario',
        'modal-weather-forecast': 'modal_weather_forecast',
        'modal-pwa-tutorial': 'modal_pwa',
        'modal-pix-local': 'modal_pix_local',
        'modal-edit-local-event': 'modal_local_event',
        'modal-confirm-delivery': 'modal_confirm_delivery',
        'modal-product-mgmt': 'modal_product_mgmt',
        'modal-supplier': 'modal_supplier'
    };

    window.attachHelpIconToSingleModal = function (modalId) {
        const helpKey = MODAL_HELP_MAP[modalId];
        if (!helpKey) return;
        const modalEl = document.getElementById(modalId);
        if (!modalEl) return;

        const headerTitle = modalEl.querySelector('h2, h3, h4, .modal-title, .modal-header h3, .modal-header h2, .confirm-dialog h3');
        if (headerTitle && !headerTitle.querySelector('.btn-help-icon-only')) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'btn-help-icon-only';
            btn.title = 'Como funciona esta janela?';
            btn.innerText = '?';
            btn.onclick = function (e) {
                e.preventDefault();
                e.stopPropagation();
                window.openHelpTopic(helpKey);
            };

            headerTitle.style.display = 'inline-flex';
            headerTitle.style.alignItems = 'center';
            headerTitle.style.gap = '8px';
            headerTitle.appendChild(btn);
        }
    };

    window.attachInternalHelpButtons = function () {
        // Processar apenas modais que possuem a classe active no momento
        const activeModals = document.querySelectorAll('.modal-backdrop.active, .modal-overlay.active, .confirm-overlay:not(.hidden)');
        activeModals.forEach(modal => {
            if (modal.id && MODAL_HELP_MAP[modal.id]) {
                window.attachHelpIconToSingleModal(modal.id);
            }
        });

        // Processar apenas a sub-aba ativa visível no momento
        const activeSubtab = document.querySelector('.admin-subtab-content:not([style*="display: none"]), .admin-subtab-content.active');
        if (activeSubtab && activeSubtab.id) {
            let subId = activeSubtab.id.replace('tab-', '').replace('admin-tab-', '');
            const dict = window.GEL_HELP_DICTIONARY || {};
            if (dict[subId]) {
                const subHeader = activeSubtab.querySelector('h2, h3, h4, .section-title, .card-header h3');
                if (subHeader && !subHeader.querySelector('.btn-help-icon-only')) {
                    const btn = document.createElement('button');
                    btn.type = 'button';
                    btn.className = 'btn-help-icon-only';
                    btn.title = 'Como funciona esta sub-aba?';
                    btn.innerText = '?';
                    btn.onclick = function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        window.openHelpTopic(subId);
                    };

                    subHeader.style.display = 'inline-flex';
                    subHeader.style.alignItems = 'center';
                    subHeader.style.gap = '8px';
                    subHeader.appendChild(btn);
                }
            }
        }
    };

    // Inicializar no carregamento inicial da página (F5) sem polling no evento de loop
    document.addEventListener('DOMContentLoaded', function () {
        injectHelpModalHTML();
        setTimeout(function () {
            updateTopHeaderHelpBadge();
            attachInternalHelpButtons();
        }, 80);
    });

    window.addEventListener('load', function () {
        setTimeout(function () {
            updateTopHeaderHelpBadge();
            attachInternalHelpButtons();
        }, 150);
    });
})();
