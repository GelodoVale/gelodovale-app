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
    window.updateTopHeaderHelpBadge = function () {
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

        // Identificar qual aba/sub-aba está visível no momento
        let activeKey = 'dashboard';
        const activeTab = document.querySelector('.tab-content.active, section.tab-content:not([style*="display: none"])');
        if (activeTab && activeTab.id) {
            activeKey = activeTab.id.replace('view-', '');
        }

        // Mapeamento de sinonimos de abas para o dicionario
        if (activeKey === 'tinas' || activeKey === 'equipamentos') activeKey = 'rentals';
        if (activeKey === 'inventario') activeKey = 'freezers';
        if (activeKey === 'documentos') activeKey = 'recibos';

        // Se estiver no Admin / Preços / Configurações, verificar sub-aba ativa
        if (activeKey === 'admin' || activeKey === 'configuracoes' || activeKey === 'precos') {
            const activeSubtab = document.querySelector('.admin-subtab-content:not([style*="display: none"]), .subtab-content.active, [id^="tab-"]:not([style*="display: none"])');
            if (activeSubtab && activeSubtab.id) {
                let subId = activeSubtab.id.replace('tab-', '').replace('admin-tab-', '');
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

    // Injetar o modal e botões no carregamento e em intervalo contínuo
    document.addEventListener('DOMContentLoaded', function () {
        injectHelpModalHTML();
        updateTopHeaderHelpBadge();
    });

    window.addEventListener('load', updateTopHeaderHelpBadge);
    setInterval(updateTopHeaderHelpBadge, 400);
})();
