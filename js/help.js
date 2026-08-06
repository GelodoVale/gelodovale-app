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
            li.innerHTML = step;
            stepsOL.appendChild(li);
        });

        // Preencher Dicas
        const tipsUL = document.getElementById('help-modal-tips');
        tipsUL.innerHTML = "";
        (topic.tips || []).forEach(tip => {
            const li = document.createElement('li');
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

    // 4. Mapeamento e Injeção Automática de Botões de Ajuda nos Cabeçalhos
    const HELP_MAP = [
        { selector: '#view-pdv, #pdv', key: 'pdv', text: '🛒 ❓ Entenda o PDV Balcão' },
        { selector: '#view-dashboard, #dashboard', key: 'dashboard', text: '📊 ❓ Entenda o Painel Principal' },
        { selector: '#view-clientes, #clientes', key: 'clientes', text: '👥 ❓ Como Gerenciar Clientes' },
        { selector: '#view-freezers, #freezers', key: 'freezers', text: '🧊 ❓ Ajuda com Freezers' },
        { selector: '#view-rentals, #rentals', key: 'rentals', text: '🏕️ ❓ Ajuda com Aluguel de Tinas' },
        { selector: '#view-recibos, #recibos', key: 'recibos', text: '📜 ❓ Como Emitir Recibos' },
        { selector: '#view-pedidos, #pedidos', key: 'pedidos', text: '📦 ❓ Como Gerenciar Pedidos' },
        { selector: '#view-historico, #historico', key: 'historico', text: '🚚 ❓ Entenda o Histórico de Entregas' },
        { selector: '#tab-viagem, #admin-tab-viagem', key: 'viagem', text: '📋 ❓ Como Fazer Acerto de Carga' },
        { selector: '#tab-insumos, #admin-tab-insumos', key: 'insumos', text: '🏭 ❓ Como Controlar Insumos' },
        { selector: '#tab-rentabilidade, #admin-tab-rentabilidade', key: 'rentabilidade', text: '📈 ❓ Como Analisar o ROI' },
        { selector: '#tab-contas-receber, #admin-tab-contas-receber', key: 'contas_receber', text: '💳 ❓ Como Gerenciar Contas a Receber' },
        { selector: '#tab-integracoes, #admin-tab-integracoes', key: 'integracoes', text: '⚙️ ❓ Como Configurar PIX e WhatsApp' },
        { selector: '#tab-whatsapp, #admin-tab-whatsapp', key: 'whatsapp_central', text: '💬 ❓ Como Usar os Templates' },
        { selector: '#tab-seguranca, #admin-tab-seguranca', key: 'seguranca', text: '🛡️ ❓ Entenda Backup e Versão' },
        { selector: '#tab-usuarios, #admin-tab-usuarios', key: 'usuarios', text: '🔑 ❓ Como Gerenciar Permissões' },
        { selector: '#view-ajuda, #ajuda', key: 'ajuda', text: '❓ ❓ Manual de Ajuda & Auto-Diagnóstico' }
    ];

    window.attachHelpBadges = function () {
        HELP_MAP.forEach(item => {
            const containers = document.querySelectorAll(item.selector);
            containers.forEach(container => {
                if (!container) return;

                // Procurar título h1, h2 ou h3 dentro do container
                const header = container.querySelector('h1, h2, h3, .section-title, .page-header');
                if (header && !header.querySelector('.btn-help-badge')) {
                    // Criar o botão de ajuda
                    const helpBtn = document.createElement('button');
                    helpBtn.type = 'button';
                    helpBtn.className = 'btn-help-badge';
                    helpBtn.innerHTML = item.text;
                    helpBtn.style.marginLeft = '12px';
                    helpBtn.onclick = function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        window.openHelpTopic(item.key);
                    };

                    // Ajustar alinhamento do header
                    header.style.display = 'flex';
                    header.style.alignItems = 'center';
                    header.style.justifyContent = 'space-between';
                    header.style.flexWrap = 'wrap';
                    header.style.gap = '8px';

                    header.appendChild(helpBtn);
                }
            });
        });
    };

    // Injetar o modal e botões no carregamento e em intervalos curtos
    document.addEventListener('DOMContentLoaded', function () {
        injectHelpModalHTML();
        attachHelpBadges();
    });

    // Observar mudanças de abas para reinjetar botões se necessário
    window.addEventListener('load', attachHelpBadges);
    setInterval(attachHelpBadges, 1500);
})();
