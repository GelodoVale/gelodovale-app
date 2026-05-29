// --- CENTRAL DE CONTROLE E BOOTSTRAPPER (GELO DO VALE) ---
import { state, saveState, MOCK_DATA, APP_VERSION } from './state.js';
import { initLoginScreen, initUserAccessControl } from './auth.js';
import { renderDashboard } from './dashboard.js';
import { renderClientes, openClientModal, populateClientDropdowns, openSalesModal, renderSalesModalProducts } from './clientes.js';
import { renderInventario, openFreezerModal, populateFreezerDropdowns, startQRScanner, stopQRScanner, openFreezerDetail } from './inventario.js';
import { renderTinas, openRentalModal, updateRentalFee, renderRentalModalProducts } from './rentals.js';
import { renderDocumentos, openDocModal, deleteDocument, printDocument } from './documents.js';
import { 
    optimizeDeliveryRoute, 
    fetchRentalRouteDistance, 
    fetchDocRouteDistance, 
    toggleRentalLogisticsCalc, 
    applyCalculatedLogistics, 
    calculateRentalLogistics, 
    toggleDocLogisticsCalc, 
    applyDocCalculatedLogistics, 
    updateDocLogisticsTollMultiplier, 
    calculateDocLogistics 
} from './logistics.js';
import { migrateLegacyComodatos, initClientSigningPortal } from './comodatos.js';
import { renderPrecos, checkAutoBackupOnLoad, applyAppearanceTheme, renderProductsCatalog, toggleProductSubfields, openProductModal } from './admin.js';
import { initFirebase, checkOneDriveSync } from './sync.js';
import { initUtilityPanel, getBrazilTimeISO, formatDateBrazil } from './utils.js';
import { runClientDiagnostics } from './diagnostics.js';
import { initPDV, populatePDVClients, renderPDVCatalog, renderPDVCart } from './pdv.js';
import { openCarneModal, renderTopDevedores, renderCarneList, addCarneEntry, payCarneEntry, deleteCarneEntry } from './carne.js';

// ==========================================================================
//  SISTEMA DE TOAST — Notificações elegantes que substituem alert()
// ==========================================================================

const _TOAST_ICONS = {
    success: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
    error:   `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" x2="9" y1="9" y2="15"/><line x1="9" x2="15" y1="9" y2="15"/></svg>`,
    warning: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>`,
    info:    `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`
};

const _TOAST_LABELS = {
    success: 'Sucesso',
    error:   'Erro',
    warning: 'Atenção',
    info:    'Informação'
};

/**
 * Exibe uma notificação Toast.
 * @param {string} message  Texto da notificação
 * @param {'success'|'error'|'warning'|'info'} type  Tipo visual
 * @param {number} duration Duração em ms (padrão: 3500. Erros: 5000)
 */
export function showToast(message, type = 'success', duration = null) {
    const container = document.getElementById('toast-container');
    if (!container) { console.warn('[Toast] Container não encontrado'); return; }

    // Duração automática por tipo se não especificada
    if (duration === null) {
        duration = type === 'error' ? 5000 : type === 'warning' ? 4500 : 3500;
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
        <span class="toast-icon">${_TOAST_ICONS[type] || _TOAST_ICONS.info}</span>
        <div class="toast-body">
            <div class="toast-title">${_TOAST_LABELS[type] || 'Notificação'}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" aria-label="Fechar">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
        </button>
        <div class="toast-progress" style="animation-duration: ${duration}ms;"></div>
    `;

    // Botão de fechar
    toast.querySelector('.toast-close').addEventListener('click', () => _dismissToast(toast));

    container.appendChild(toast);

    // Auto-dismiss
    const timer = setTimeout(() => _dismissToast(toast), duration);
    toast._timer = timer;
}

function _dismissToast(toast) {
    if (!toast || toast._dismissed) return;
    toast._dismissed = true;
    clearTimeout(toast._timer);
    toast.classList.add('toast-hiding');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
}

/**
 * Substitui o confirm() nativo por um modal bonito e não-bloqueante.
 * @param {string} message     Texto da pergunta
 * @param {Function} onConfirm Callback se confirmar
 * @param {Function} onCancel  Callback se cancelar (opcional)
 * @param {string} title       Título do modal (opcional)
 * @param {string} confirmText Texto do botão de confirmar (padrão: 'Confirmar')
 */
export function showConfirm(message, onConfirm, onCancel = null, title = 'Confirmar ação', confirmText = 'Confirmar') {
    const overlay = document.getElementById('confirm-overlay');
    if (!overlay) {
        // Fallback para confirm() nativo se o modal não existir no DOM
        if (window.confirm(message)) { if (onConfirm) onConfirm(); }
        else { if (onCancel) onCancel(); }
        return;
    }

    document.getElementById('confirm-title').textContent = title;
    document.getElementById('confirm-message').textContent = message;
    document.getElementById('confirm-ok-btn').textContent = confirmText;

    overlay.classList.remove('hidden');

    const okBtn = document.getElementById('confirm-ok-btn');
    const cancelBtn = document.getElementById('confirm-cancel-btn');

    // Limpar listeners anteriores clonando os botões
    const newOk = okBtn.cloneNode(true);
    const newCancel = cancelBtn.cloneNode(true);
    okBtn.parentNode.replaceChild(newOk, okBtn);
    cancelBtn.parentNode.replaceChild(newCancel, cancelBtn);

    const close = () => overlay.classList.add('hidden');

    newOk.addEventListener('click', () => { close(); if (onConfirm) onConfirm(); });
    newCancel.addEventListener('click', () => { close(); if (onCancel) onCancel(); });
    overlay.addEventListener('click', (e) => { if (e.target === overlay) { close(); if (onCancel) onCancel(); } }, { once: true });
}

// Expor globalmente para uso nos módulos sem import
window.showToast   = showToast;
window.showConfirm = showConfirm;



// --- SISTEMA DE INICIALIZAÇÃO ---
document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("clientSign") === "comodato") {
        initClientSigningPortal(urlParams);
        return;
    }
    
    // Registro do Service Worker do PWA para carregamento offline instantâneo
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('sw.js')
                .then(reg => console.log('Service Worker do Gelo do Vale registrado com sucesso no escopo:', reg.scope))
                .catch(err => console.error('Erro ao registrar Service Worker do Gelo do Vale:', err));
        });
    }

    // 1. Carregar dados do localStorage
    loadState();
    applyAppearanceTheme();
    initFirebase();
    checkOneDriveSync();

    // Inicializar o modo Sol Forte (Alto Contraste) se salvo
    const savedContrast = localStorage.getItem("highContrastTheme");
    if (savedContrast === "enabled") {
        document.body.classList.add("theme-high-contrast");
        const btn = document.getElementById("btn-toggle-contrast");
        if (btn) btn.innerHTML = '<i data-lucide="moon"></i>';
    }
    
    // 2. Inicializar ícones do Lucide
    if (window.lucide) {
        window.lucide.createIcons();
    }
    
    // 3. Configurar listeners de navegação
    initNavigation();
    
    // 4. Configurar formulários e modais
    initForms();
    
    // 5. Configurar filtros da tela de Histórico
    initHistoryFilters();
    initAllSearchFilters();
    
    // 6. Atualizar a tela inicial
    renderApp();
    
    // 6.5. Verificar necessidade de backup automático
    if (window.checkAutoBackupOnLoad) window.checkAutoBackupOnLoad();
    
    // 7. Botão Mock Data
    const btnMock = document.getElementById("btn-mock-data");
    if (btnMock) {
        btnMock.addEventListener("click", () => {
            window.showConfirm(
                "Deseja carregar os dados de demonstração? Isso substituirá as informações atuais.",
                () => {
                    // Atualizar estado global importado (atribuição por propriedades para manter a reatividade)
                    const mockCopy = JSON.parse(JSON.stringify(MOCK_DATA));
                    Object.keys(state).forEach(key => delete state[key]);
                    Object.assign(state, mockCopy);
                    
                    saveState();
                    renderApp();
                    window.showToast("Dados de demonstração carregados com sucesso!", "success");
                },
                null,
                "Carregar Demonstração",
                "Carregar"
            );
        });
    }

    // 8. Inicializar central de utilitários (Relógio, Clima, Calendário & Notas)
    initUtilityPanel();
    
    // 9. Inicializar controle de acesso e tela de login
    initUserAccessControl();
    initLoginScreen();

    // 10. Inicializar QR Code do GitHub
    if (window.initGitHubQRCode) window.initGitHubQRCode();
    
    // 11. Monitor de status de conexão offline
    initConnectionStatusMonitor();

    // 12. Inicializar Frente de Caixa (PDV)
    initPDV();
});

// --- PERSISTÊNCIA DE DADOS (RETROCOMPATIBILIDADE E LOGICA AUXILIAR) ---

// Credenciais oficiais da Gelo do Vale (sempre usadas)
const FIREBASE_CONFIG_OFICIAL = {
    enabled: true,
    apiKey: 'AIzaSyBfY-uWaXBHNSheNeCsTyMnc6L_yRtcLtE',
    projectId: 'gelo-do-vale',
    databaseURL: 'https://gelo-do-vale-default-rtdb.firebaseio.com',
    deviceKey: 'gelodovale_oficial'
};

export function loadState() {
    const saved = localStorage.getItem("gelcontrol_state");
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            
            // Garantir todas as chaves
            if (!parsed.clients) parsed.clients = [];
            if (!parsed.freezers) parsed.freezers = [];
            if (!parsed.rentals) parsed.rentals = [];
            if (!parsed.documents) parsed.documents = [];
            if (!parsed.orders) parsed.orders = [];
            if (!parsed.deliveries) parsed.deliveries = [];
            if (!parsed.history) parsed.history = [];
            if (!parsed.localBackups) parsed.localBackups = [];
            if (!parsed.factorySettings) parsed.factorySettings = {};
            if (!parsed.backupSettings) parsed.backupSettings = {};
            if (!parsed.appearance) parsed.appearance = {};
            
            // Garantir usuário Administrador Padrão caso não exista nenhum usuário
            if (!parsed.users || !Array.isArray(parsed.users) || parsed.users.length === 0) {
                parsed.users = [{
                    id: "user_admin_001",
                    name: "Administrador Sistema",
                    username: "admin",
                    password: parsed.adminPassword || "admin123", // fallback para a senha antiga
                    role: "Master",
                    permissions: {
                        "admin-tab-dados-fabrica": true,
                        "admin-tab-usuarios": true,
                        "admin-tab-produtos": true,
                        "admin-tab-clientes": true,
                        "admin-tab-pedidos": true,
                        "admin-tab-entregas": true,
                        "admin-tab-financeiro": true,
                        "admin-tab-relatorios": true,
                        "admin-tab-integracoes": true,
                        "admin-tab-seguranca-backup": true
                    }
                }];
            }
            
            // Firebase: SEMPRE ativo com credenciais oficiais
            parsed.firebaseConfig = { ...FIREBASE_CONFIG_OFICIAL };
            
            // Retrocompatibilidade para catálogo dinâmico de produtos
            if (!parsed.products) {
                parsed.products = [
                    { id: "gelo5kg", name: "Pacote Gelo 5kg (Cubo)", type: "Gelo", subtype: "cubo", weight: 5, defaultPrice: (parsed.prices && parsed.prices.gelo5kg) || 10.00, active: true },
                    { id: "gelo2kg", name: "Pacote Gelo 2kg (Cubo)", type: "Gelo", subtype: "cubo", weight: 2, defaultPrice: (parsed.prices && parsed.prices.gelo2kg) || 5.00, active: true },
                    { id: "triturado20kg", name: "Gelo Triturado 20kg", type: "Gelo", subtype: "triturado", weight: 20, defaultPrice: (parsed.prices && parsed.prices.triturado20kg) || 30.00, active: true },
                    { id: "carvao", name: "Saco de Carvão 5kg", type: "Carvão", subtype: "comum", weight: 5, defaultPrice: (parsed.prices && parsed.prices.carvao) || 15.00, active: true },
                    { id: "tina", name: "Aluguel Tina 360L", type: "Equipamento", subtype: "tina", weight: 0, defaultPrice: (parsed.prices && parsed.prices.tina) || 50.00, active: true },
                    { id: "mesa", name: "Aluguel Mesa + 4 Cad.", type: "Equipamento", subtype: "mesa_cadeiras", weight: 0, defaultPrice: (parsed.prices && parsed.prices.mesa) || 30.00, active: true }
                ];
            }
            
            // Atualizar propriedades do state importado
            Object.keys(state).forEach(key => delete state[key]);
            Object.assign(state, parsed);
        } catch (e) {
            console.error("Erro ao carregar estado do localStorage:", e);
        }
    } else {
        // Primeiro acesso (localStorage vazio): ativar Firebase para baixar dados da nuvem
        state.firebaseConfig = { ...FIREBASE_CONFIG_OFICIAL };
        state.users = [{
            id: "user_admin_001",
            name: "Administrador Sistema",
            username: "admin",
            password: "admin123",
            role: "Master",
            permissions: {
                "admin-tab-dados-fabrica": true,
                "admin-tab-usuarios": true,
                "admin-tab-produtos": true,
                "admin-tab-clientes": true,
                "admin-tab-pedidos": true,
                "admin-tab-entregas": true,
                "admin-tab-financeiro": true,
                "admin-tab-relatorios": true,
                "admin-tab-integracoes": true,
                "admin-tab-seguranca-backup": true
            }
        }];
        console.log("Primeiro acesso detectado — Firebase ativado para sincronizar dados da nuvem.");
    }
}


// --- CONTROLE DE NAVEGAÇÃO ENTRE ABAS ---
export function initNavigation() {
    const navItems = document.querySelectorAll(".nav-item");
    const tabContents = document.querySelectorAll(".tab-content");
    const globalBtn = document.getElementById("btn-global-action");

    navItems.forEach(item => {
        item.addEventListener("click", () => {
            const targetTab = item.getAttribute("data-tab");
            
            // Interceptar aba baseada em permissões RBAC
            const currentUserId = sessionStorage.getItem("currentUserId");
            if (currentUserId && state.users) {
                const currentUser = state.users.find(u => u.id === currentUserId);
                if (currentUser) {
                    if (targetTab === "precos") {
                        if (currentUser.username === "admin") {
                            sessionStorage.setItem("admin_authenticated", "true");
                        } else if (!currentUser.permissions["tab-precos"]) {
                            showToast("Você não possui permissão para acessar esta aba.", "error");
                            return;
                        }
                    } else {
                        const hasPerm = currentUser.permissions["tab-" + targetTab];
                        if (hasPerm === false) {
                            showToast("Você não possui permissão para acessar esta aba.", "error");
                            return;
                        }
                    }
                }
            }
            
            // Parar câmera se estiver rodando e mudar de aba
            if (targetTab !== "inventario") {
                if (window.stopQRScanner) window.stopQRScanner();
            }
            
            // Alterar navegação ativa
            navItems.forEach(nav => {
                nav.classList.remove("active");
                if (nav.getAttribute("data-tab") === targetTab) {
                    nav.classList.add("active");
                }
            });
            
            // Alterar abas visíveis
            tabContents.forEach(content => {
                content.classList.remove("active");
                if (content.id === targetTab) {
                    content.classList.add("active");
                }
            });

            // Atualizar títulos e botões dinâmicos
            updateHeaderForTab(targetTab);
            
            // Rerenderizar conteúdo da aba específica
            renderTabContent(targetTab);
        });
    });

    // Ação do Botão Global superior direito
    if (globalBtn) {
        // Remover listener anterior se existir via clonagem
        const newGlobalBtn = globalBtn.cloneNode(true);
        globalBtn.parentNode.replaceChild(newGlobalBtn, globalBtn);
        newGlobalBtn.addEventListener("click", () => {
            const activeTabEl = document.querySelector(".nav-item.active");
            const activeTab = activeTabEl ? activeTabEl.getAttribute("data-tab") : "dashboard";
            if (activeTab === "clientes") {
                if (window.openClientModal) window.openClientModal();
            } else if (activeTab === "inventario") {
                if (window.openFreezerModal) window.openFreezerModal();
            } else if (activeTab === "tinas") {
                if (window.openRentalModal) window.openRentalModal();
            } else if (activeTab === "documentos") {
                if (window.openDocModal) window.openDocModal();
            } else {
                openOrderModal();
            }
        });
    }

    // Ações dos Botões Internos de Painéis de Abas
    const btnAddClient = document.getElementById("btn-add-client");
    if (btnAddClient) {
        btnAddClient.addEventListener("click", () => {
            if (window.openClientModal) window.openClientModal();
        });
    }

    const btnScanQR = document.getElementById("btn-scan-qr");
    if (btnScanQR) {
        btnScanQR.addEventListener("click", () => {
            if (window.startQRScanner) window.startQRScanner();
        });
    }

    const btnAddFreezer = document.getElementById("btn-add-freezer");
    if (btnAddFreezer) {
        btnAddFreezer.addEventListener("click", () => {
            if (window.openFreezerModal) window.openFreezerModal();
        });
    }

    const btnAddRental = document.getElementById("btn-add-rental");
    if (btnAddRental) {
        btnAddRental.addEventListener("click", () => {
            if (window.openRentalModal) window.openRentalModal();
        });
    }

    const btnAddDocument = document.getElementById("btn-add-document");
    if (btnAddDocument) {
        btnAddDocument.addEventListener("click", () => {
            if (window.openDocModal) window.openDocModal();
        });
    }
}

export function updateHeaderForTab(tab) {
    const pageTitle = document.getElementById("page-title");
    const pageSubtitle = document.getElementById("page-subtitle");
    const globalBtn = document.getElementById("btn-global-action");
    if (!pageTitle || !pageSubtitle || !globalBtn) return;
    
    // Configurações padrão para cada aba
    switch (tab) {
        case "dashboard":
            pageTitle.innerText = "Dashboard";
            pageSubtitle.innerText = "Visão geral da sua fábrica e dos freezers alocados";
            globalBtn.style.display = "inline-flex";
            globalBtn.innerHTML = `<i data-lucide="plus"></i> Novo Pedido`;
            break;
        case "clientes":
            pageTitle.innerText = "Clientes & Freezers";
            pageSubtitle.innerText = "Cadastre novos pontos e monitore os estoques locais";
            globalBtn.style.display = "inline-flex";
            globalBtn.innerHTML = `<i data-lucide="user-plus"></i> Novo Cliente`;
            break;
        case "inventario":
            pageTitle.innerText = "Inventário de Freezers";
            pageSubtitle.innerText = "Gerencie seus equipamentos, garantias, notas fiscais e etiquetas QR";
            globalBtn.style.display = "inline-flex";
            globalBtn.innerHTML = `<i data-lucide="plus"></i> Cadastrar Freezer`;
            break;
        case "tinas":
            pageTitle.innerText = "Aluguel de Equipamentos & Mobiliário";
            pageSubtitle.innerText = "Gerencie o aluguel temporário de tinas de 360L (cores variadas) e kits de mesas/cadeiras";
            globalBtn.style.display = "inline-flex";
            globalBtn.innerHTML = `<i data-lucide="plus"></i> Novo Aluguel`;
            break;
        case "documentos":
            pageTitle.innerText = "Recibos & Orçamentos";
            pageSubtitle.innerText = "Emita recibos de entrega ou orçamentos comerciais em PDF/A4";
            globalBtn.style.display = "inline-flex";
            globalBtn.innerHTML = `<i data-lucide="plus"></i> Novo Documento`;
            break;
        case "pedidos":
            pageTitle.innerText = "Pedidos Pendentes";
            pageSubtitle.innerText = "Lista de reabastecimento pendente e controle de preços";
            globalBtn.style.display = "inline-flex";
            globalBtn.innerHTML = `<i data-lucide="plus"></i> Criar Pedido`;
            break;
        case "historico":
            pageTitle.innerText = "Histórico de Entregas";
            pageSubtitle.innerText = "Relatório financeiro e de mercadorias entregues aos clientes";
            globalBtn.style.display = "none";
            break;
        case "precos":
            pageTitle.innerText = "Configurações & Preços";
            pageSubtitle.innerText = "Edite preços de fábrica, promoções e configure descontos específicos por cliente";
            globalBtn.style.display = "none";
            break;
        case "pdv":
            pageTitle.innerText = "Frente de Caixa (PDV Balcão)";
            pageSubtitle.innerText = "Emita vendas locais e de retirada direto do balcão da fábrica";
            globalBtn.style.display = "none";
            break;
        case "ajuda":
            pageTitle.innerText = "Dúvidas & Soluções";
            pageSubtitle.innerText = "Central de suporte, guias práticos e ferramentas de diagnóstico rápido";
            globalBtn.style.display = "none";
            break;
    }
    if (window.lucide) window.lucide.createIcons();
}

export function renderTabContent(tab) {
    switch (tab) {
        case "dashboard":
            if (window.renderDashboard) window.renderDashboard();
            break;
        case "clientes":
            if (window.renderClientes) window.renderClientes();
            break;
        case "inventario":
            if (window.renderInventario) window.renderInventario();
            break;
        case "tinas":
            if (window.renderTinas) window.renderTinas();
            break;
        case "documentos":
            if (window.renderDocumentos) window.renderDocumentos();
            break;
        case "pedidos":
            renderPedidos();
            if (window.initLeafletRouteMap) {
                setTimeout(window.initLeafletRouteMap, 100);
            }
            break;
        case "historico":
            renderHistorico();
            break;
        case "precos":
            if (window.renderPrecos) window.renderPrecos();
            
            // Popular formulário de dados da fábrica para não parecer que foram perdidos
            if (state.factorySettings) {
                const fields = [
                    { id: "cfg-factory-name", key: "name" },
                    { id: "cfg-factory-cnpj", key: "cnpj" },
                    { id: "cfg-factory-phone", key: "phone" },
                    { id: "cfg-factory-address", key: "address" },
                    { id: "cfg-factory-email", key: "email" },
                    { id: "cfg-factory-pix", key: "pixKey" },
                    { id: "cfg-factory-rental-terms", key: "rentalTerms" }
                ];
                fields.forEach(f => {
                    const el = document.getElementById(f.id);
                    if (el && state.factorySettings[f.key]) {
                        el.value = state.factorySettings[f.key];
                    }
                });
            }
            break;
        case "pdv":
            if (window.populatePDVClients) window.populatePDVClients();
            if (window.renderPDVCatalog) window.renderPDVCatalog();
            if (window.renderPDVCart) window.renderPDVCart();
            break;
        case "ajuda":
            if (window.updateSupportTabStatus) window.updateSupportTabStatus();
            break;
    }
}

export function renderApp() {
    const activeTabEl = document.querySelector(".nav-item.active");
    const activeTab = activeTabEl ? activeTabEl.getAttribute("data-tab") : "dashboard";
    renderTabContent(activeTab);
    
    // Atualizar versão no rodapé lateral
    const versionEl = document.getElementById("app-sidebar-version");
    if (versionEl) {
        const ver = state.backupSettings?.currentVersion || APP_VERSION;
        versionEl.innerText = `Gelo do Vale v${ver} (28/05/2026)`;
    }
    
    // Atualizar dropdowns
    if (window.populateClientDropdowns) window.populateClientDropdowns();
    if (window.populateFreezerDropdowns) window.populateFreezerDropdowns();
}

// --- PEDIDOS E SUAS VISITAS SUGERIDAS ---
export function renderPedidos() {
    renderSuggestedVisits();

    if (window.drawRouteOnLeafletMap) {
        setTimeout(window.drawRouteOnLeafletMap, 100);
    }

    const ordersContainer = document.getElementById("pedidos-list-container");
    if (!ordersContainer) return;
    ordersContainer.innerHTML = "";
    
    const pendingOrders = state.orders.filter(o => o.status === "pending");
    
    if (pendingOrders.length === 0) {
        ordersContainer.innerHTML = `
            <div class="empty-state">
                <i data-lucide="shopping-cart"></i>
                <p>Nenhum pedido de reabastecimento na fila.</p>
                <button class="btn btn-primary" style="margin-top: 1rem;" onclick="openOrderModal()">
                    <i data-lucide="plus"></i> Criar Novo Pedido
                </button>
            </div>
        `;
        if (window.lucide) window.lucide.createIcons();
        return;
    }
    
    pendingOrders.forEach(o => {
        const client = state.clients.find(c => c.id === o.clientId);
        const clientName = client ? client.name : "Cliente Excluído";
        const dateFormatted = formatDateBrazil(o.date);
        
        let tagsHTML = '';
        let totalVal = 0;
        
        const activeProds = state.products.filter(p => p.active && (p.type === 'Gelo' || p.type === 'Carvão' || p.type === 'Gelo Saborizado'));
        activeProds.forEach(p => {
            const prod = p.id;
            const qty = o.items[prod] || 0;
            const qtyUnit = o.items[prod + "_unit"] || 0;
            
            if (qty > 0 || qtyUnit > 0) {
                let tagText = "";
                if (qty > 0 && qtyUnit > 0) {
                    tagText = `${qty}f + ${qtyUnit}u de ${p.name}`;
                } else if (qty > 0) {
                    tagText = `${qty}x ${p.name}`;
                } else {
                    tagText = `${qtyUnit}u de ${p.name}`;
                }
                tagsHTML += `<span class="produto-tag">${tagText}</span>`;
                
                if (client) {
                    const priceRes = calculateProductRevenue(client, p, qty, qtyUnit);
                    totalVal += priceRes.totalRevenue;
                }
            }
        });
        
        const pendingCom = state.comodatos && state.comodatos.find(com => com.clientId === o.clientId && com.status === 'pendente');

        ordersContainer.innerHTML += `
            <div class="pedido-item" style="display: flex; align-items: center; gap: 12px;">
                <input type="checkbox" class="order-route-checkbox" data-order-id="${o.id}" checked style="width: 18px; height: 18px; cursor: pointer; accent-color: var(--color-primary); flex-shrink: 0;">
                <div class="pedido-detalhes" style="flex: 1;">
                    <h4>${clientName}</h4>
                    <p>Solicitado em: ${dateFormatted} | <strong>Faturamento estimado: R$ ${totalVal.toFixed(2)}</strong></p>
                    <div class="pedido-produtos">
                        ${tagsHTML}
                    </div>
                </div>
                <div class="pedido-acoes" style="flex-shrink: 0; display: flex; gap: 4px;">
                    ${pendingCom ? `
                    <button class="btn btn-secondary btn-icon-only" onclick="window.triggerComodatoSignatureForClient('${o.clientId}')" title="Assinar Comodato" style="border-color: #f59e0b; color: #f59e0b; background: rgba(245,158,11,0.05); padding: 4px; display: inline-flex; align-items: center; justify-content: center;">
                        <i data-lucide="pen-tool" style="width: 18px; height: 18px;"></i>
                    </button>
                    ` : ''}
                    <button class="btn btn-primary btn-icon-only" style="background: var(--color-success); box-shadow: none;" onclick="deliverOrder('${o.id}')" title="Marcar como Entregue">
                        <i data-lucide="check" style="color: #000; width: 18px; height: 18px;"></i>
                    </button>
                    <button class="btn btn-danger btn-icon-only" onclick="cancelOrder('${o.id}')" title="Cancelar Pedido">
                        <i data-lucide="x" style="width: 18px; height: 18px;"></i>
                    </button>
                </div>
            </div>
        `;
    });
    
    if (window.lucide) window.lucide.createIcons();
}

export function getCurrentDayName() {
    const days = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
    return days[new Date().getDay()];
}

export function renderSuggestedVisits() {
    const container = document.getElementById("suggested-visits-container");
    if (!container) return;
    container.innerHTML = "";
    const today = getCurrentDayName();
    
    // Obter IDs dos clientes com pedidos pendentes
    const pendingOrderClientIds = state.orders.filter(o => o.status === "pending").map(o => o.clientId);
    
    // Filtrar clientes programados para hoje que NÃO têm pedidos pendentes na fila
    const suggestedClients = state.clients.filter(c => {
        const visitDays = c.visitDays || [];
        return visitDays.includes(today) && !pendingOrderClientIds.includes(c.id);
    });
    
    if (suggestedClients.length === 0) {
        container.innerHTML = `<div style="text-align: center; padding: 15px; color: var(--color-text-muted); font-size: 0.8rem;">Nenhuma visita sugerida para hoje (${today}).</div>`;
        return;
    }
    
    suggestedClients.forEach(c => {
        container.innerHTML += `
            <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.05); padding: 8px 10px; border-radius: 6px; gap: 8px;">
                <div style="display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0;">
                    <input type="checkbox" class="visit-route-checkbox" data-client-id="${c.id}" style="width: 16px; height: 16px; cursor: pointer; accent-color: var(--color-primary); flex-shrink: 0;">
                    <div style="min-width: 0; flex: 1;">
                        <h4 style="font-size: 0.85rem; font-weight: 600; color: #fff; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${c.name}">${c.name}</h4>
                        <p style="font-size: 0.7rem; color: var(--color-text-muted); margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${c.address || 'Sem endereço'}">${c.address || 'Sem endereço'}</p>
                    </div>
                </div>
                <button type="button" class="btn btn-primary" onclick="openOrderModalForClient('${c.id}')" style="padding: 4px 8px; font-size: 0.7rem; height: auto; display: inline-flex; align-items: center; gap: 2px;">
                    <i data-lucide="shopping-cart" style="width: 12px; height: 12px;"></i> Pedido
                </button>
            </div>`;
    });
    if (window.lucide) window.lucide.createIcons();
}

export function openOrderModalForClient(clientId) {
    openOrderModal();
    const select = document.getElementById("order-client-id");
    if (select) {
        select.value = clientId;
        select.dispatchEvent(new Event('change'));
    }
}

export function addSuggestedVisitsToRoute() {
    if (window.optimizeDeliveryRoute) {
        window.optimizeDeliveryRoute();
    }
}

export function openOrderModal() {
    if (state.clients.length === 0) {
        window.showToast("Cadastre pelo menos um cliente antes de registrar pedidos!", "warning");
        return;
    }
    const modal = document.getElementById("modal-order");
    if (!modal) return;
    document.getElementById("order-form").reset();
    if (window.renderOrderModalProducts) window.renderOrderModalProducts();
    if (window.populateClientDropdowns) window.populateClientDropdowns();
    
    // Add change event listener for client selection to recalculate suggestions
    const select = document.getElementById("order-client-id");
    if (select && !select.dataset.listenerAdded) {
        select.dataset.listenerAdded = 'true';
        select.addEventListener('change', () => {
            if (window.renderOrderModalProducts) window.renderOrderModalProducts();
            // Verificar inadimplência ao trocar cliente
            const debtWarning = document.getElementById('order-debt-warning');
            if (debtWarning) {
                const selClient = (state.clients || []).find(c => c.id === select.value);
                const debt = selClient ? parseFloat(selClient.outstandingDebt) || 0 : 0;
                if (debt > 0) {
                    debtWarning.style.display = 'flex';
                    debtWarning.innerHTML = `<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><path d='m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3'/><path d='M12 9v4'/><path d='M12 17h.01'/></svg> <strong>⚠️ Cliente Inadimplente!</strong> Débito pendente: <strong>R$ ${debt.toFixed(2).replace('.', ',')}</strong>. Confirme o recebimento antes de entregar.`;
                } else {
                    debtWarning.style.display = 'none';
                }
            }
        });
    }
    
    modal.classList.add("active");
}

export function cancelOrder(orderId) {
    window.showConfirm(
        "Deseja realmente cancelar este pedido?",
        () => {
            state.orders = state.orders.filter(o => o.id !== orderId);
            saveState();
            renderApp();
            window.showToast("Pedido cancelado com sucesso!", "success");
        },
        null,
        "Cancelar Pedido",
        "Confirmar"
    );
}

export function cancelScheduledOrder(orderId) {
    window.showConfirm(
        "Deseja realmente cancelar este agendamento / pré-pedido?",
        () => {
            state.orders = state.orders.filter(o => o.id !== orderId);
            saveState();
            renderApp();
            window.showToast("Agendamento cancelado com sucesso!", "success");
        },
        null,
        "Cancelar Agendamento",
        "Confirmar"
    );
}

// --- CÁLCULO FINANCEIRO E GEOLOCALIZAÇÃO ---
export function calculateProductRevenue(client, p, qtyFardos, qtyUnits) {
    let fardosRevenue = 0;
    let unitsRevenue = 0;
    
    if (qtyUnits > 0) {
        const customUnitPrice = (client.customPrices && client.customPrices[p.id + "_unit"] > 0) ? client.customPrices[p.id + "_unit"] : null;
        const finalUnitPrice = customUnitPrice !== null ? customUnitPrice : (p.unitPrice || 0);
        unitsRevenue = qtyUnits * finalUnitPrice;
    }
    
    if (qtyFardos > 0) {
        let remainingFardos = qtyFardos;
        
        if (p.flashPromo && p.flashPromo.active) {
            const limit = (p.flashPromo.limit !== undefined && p.flashPromo.limit !== null) ? p.flashPromo.limit : Infinity;
            if (limit > 0) {
                const promoAppliedQty = Math.min(remainingFardos, limit);
                fardosRevenue += promoAppliedQty * p.flashPromo.price;
                remainingFardos -= promoAppliedQty;
            }
        }
        
        if (remainingFardos > 0) {
            let basePrice = p.defaultPrice || 0;
            const customPrice = (client.customPrices && client.customPrices[p.id] > 0) ? client.customPrices[p.id] : null;
            
            if (customPrice !== null) {
                basePrice = customPrice;
            } else if (p.wholesalePrices) {
                const w = p.wholesalePrices;
                if (qtyFardos <= 10) {
                    if (w.tier1_10 !== undefined && w.tier1_10 > 0) basePrice = w.tier1_10;
                } else if (qtyFardos <= 20) {
                    if (w.tier11_20 !== undefined && w.tier11_20 > 0) basePrice = w.tier11_20;
                } else if (qtyFardos <= 40) {
                    if (w.tier21_40 !== undefined && w.tier21_40 > 0) basePrice = w.tier21_40;
                } else if (qtyFardos <= 50) {
                    if (w.tier41_50 !== undefined && w.tier41_50 > 0) basePrice = w.tier41_50;
                } else {
                    if (w.tier51 !== undefined && w.tier51 > 0) basePrice = w.tier51;
                }
            }
            fardosRevenue += remainingFardos * basePrice;
        }
    }
    
    return {
        fardosRevenue,
        unitsRevenue,
        totalRevenue: fardosRevenue + unitsRevenue
    };
}

export function getGPSLocation(callback) {
    if (!navigator.geolocation) {
        callback(null);
        return;
    }
    navigator.geolocation.getCurrentPosition(
        (pos) => callback({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => callback(null),
        { enableHighAccuracy: true, timeout: 3000, maximumAge: 0 }
    );
}

export function deductPackagingStock(productId, qtyFardos, qtyUnits, ref) {
    const product = state.products.find(p => p.id === productId);
    if (!product) return;
    
    const linkedPacks = state.packaging ? state.packaging.filter(pkg => pkg.productId === productId) : [];
    linkedPacks.forEach(pkg => {
        const unitsPerPack = product.unitsPerPack || 12;
        const deduction = qtyFardos + (qtyUnits / unitsPerPack);
        
        if (deduction > 0) {
            pkg.currentStock = (pkg.currentStock || 0) - deduction;
            
            if (!state.packagingTransactions) state.packagingTransactions = [];
            state.packagingTransactions.push({
                id: "pt-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
                packagingId: pkg.id,
                packagingName: pkg.name,
                type: "saida",
                quantity: deduction,
                balanceAfter: pkg.currentStock,
                date: getBrazilTimeISO(),
                observation: `Baixa automática: ${ref} (${product.name})`
            });
        }
    });
}

// --- CONFIRMAÇÃO E FLUXO DE ENTREGA ---
export function deliverOrder(orderId) {
    const order = state.orders.find(o => o.id === orderId);
    if (!order) return;
    
    const client = state.clients.find(c => c.id === order.clientId);
    if (!client) {
        showToast("Cliente não encontrado.", "error");
        return;
    }
    
    let revenue = 0;
    let itemsDescription = [];
    const activeProds = state.products.filter(p => p.active && (p.type === 'Gelo' || p.type === 'Carvão' || p.type === 'Gelo Saborizado'));
    activeProds.forEach(p => {
        const prod = p.id;
        const qtyFardos = order.items[prod] || 0;
        const qtyUnits = order.items[prod + "_unit"] || 0;
        
        if (qtyFardos > 0 || qtyUnits > 0) {
            const priceRes = calculateProductRevenue(client, p, qtyFardos, qtyUnits);
            revenue += priceRes.totalRevenue;
            
            let desc = "";
            if (qtyFardos > 0 && qtyUnits > 0) {
                desc = `${qtyFardos}f + ${qtyUnits}u de ${p.name}`;
            } else if (qtyFardos > 0) {
                desc = `${qtyFardos}x ${p.name}`;
            } else {
                desc = `${qtyUnits}u de ${p.name}`;
            }
            itemsDescription.push(desc);
        }
    });
    
    document.getElementById("checkout-order-id").value = orderId;
    document.getElementById("checkout-client-name").innerText = client.name;
    document.getElementById("checkout-order-details").innerText = itemsDescription.join(", ");
    document.getElementById("checkout-order-total").innerText = "R$ " + revenue.toFixed(2).replace(".", ",");
    document.getElementById("checkout-payment-method").value = "Dinheiro";
    
    const photoInput = document.getElementById("delivery-photo-input");
    if (photoInput) photoInput.value = "";
    
    const modal = document.getElementById("modal-confirm-delivery");
    if (modal) modal.classList.add("active");
}

export function processDeliveryCheckout(event) {
    if (event) event.preventDefault();
    const orderId = document.getElementById("checkout-order-id").value;
    const paymentMethod = document.getElementById("checkout-payment-method").value;
    
    const submitBtn = document.getElementById("btn-submit-delivery-checkout");
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="loading-spinner"></span> Aguardando GPS...';
    }

    // Capturar foto de entrega se houver
    const photoInput = document.getElementById('delivery-photo-input');
    let photoBase64 = null;
    const capturePhoto = (cb) => {
        if (photoInput && photoInput.files && photoInput.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => cb(e.target.result);
            reader.readAsDataURL(photoInput.files[0]);
        } else {
            cb(null);
        }
    };
    
    capturePhoto((photo) => {
        photoBase64 = photo;
        getGPSLocation((gps) => {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i data-lucide="check" style="width: 14px; height: 14px;"></i> Confirmar Entrega';
                if (window.lucide) window.lucide.createIcons();
            }
            closeModal("modal-confirm-delivery");
            deliverOrderWithDetails(orderId, paymentMethod, gps, photoBase64);
        });
    });
}

export function deliverOrderWithDetails(orderId, paymentMethod, gps, photoBase64 = null) {
    const order = state.orders.find(o => o.id === orderId);
    if (!order) return;
    
    const client = state.clients.find(c => c.id === order.clientId);
    if (!client) {
        showToast("Cliente não encontrado.", "error");
        return;
    }
    
    let revenue = 0;
    const activeProds = state.products.filter(p => p.active && (p.type === 'Gelo' || p.type === 'Carvão' || p.type === 'Gelo Saborizado'));
    activeProds.forEach(p => {
        const prod = p.id;
        const qtyFardos = order.items[prod] || 0;
        const qtyUnits = order.items[prod + "_unit"] || 0;
        
        if (qtyFardos > 0 || qtyUnits > 0) {
            const priceRes = calculateProductRevenue(client, p, qtyFardos, qtyUnits);
            revenue += priceRes.totalRevenue;
            
            if (p.flashPromo && p.flashPromo.active && qtyFardos > 0) {
                const limit = (p.flashPromo.limit !== undefined && p.flashPromo.limit !== null) ? p.flashPromo.limit : Infinity;
                if (limit > 0) {
                    const promoAppliedQty = Math.min(qtyFardos, limit);
                    if (limit !== Infinity) {
                        p.flashPromo.limit = Math.max(0, limit - promoAppliedQty);
                        if (p.flashPromo.limit === 0) {
                            p.flashPromo.active = false;
                        }
                    }
                }
            }
            
            if ((p.type === 'Gelo' || p.type === 'Gelo Saborizado') && client.freezerCode) {
                const unitsPerPack = p.unitsPerPack || 12;
                const qtyAdded = qtyFardos + (p.type === 'Gelo Saborizado' ? (qtyUnits / unitsPerPack) : 0);
                client.stock[prod] = (client.stock[prod] || 0) + qtyAdded;
                const cap = (client.capacities && client.capacities[prod]) || 50;
                if (client.stock[prod] > cap) {
                    client.stock[prod] = cap;
                }
            }
            
            deductPackagingStock(p.id, qtyFardos, qtyUnits, `Pedido: ${orderId}`);
        }
    });
    
    const deliveryId = "d-" + Date.now();
    
    const newDelivery = {
        id: deliveryId,
        clientId: client.id,
        clientName: client.name,
        date: getBrazilTimeISO(),
        items: { ...order.items },
        revenue: revenue,
        paymentMethod: paymentMethod,
        gps: gps,
        lotNumber: order.lotNumber || "",
        exchangeQty: order.exchangeQty || 0,
        temperature: (state.weatherConfig && state.weatherConfig.temp) !== undefined ? state.weatherConfig.temp : 24,
        photoBase64: photoBase64 || null
    };
    
    state.deliveries.push(newDelivery);
    
    if (paymentMethod === "A Prazo") {
        client.outstandingDebt = (client.outstandingDebt || 0) + revenue;
        // Criar entrada no carnê automaticamente
        if (!client.carnet) client.carnet = [];
        const dateStr = new Date().toLocaleDateString('pt-BR');
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 10);
        client.carnet.push({
            id: 'cr-' + Date.now(),
            amount: revenue,
            description: `Entrega em ${dateStr}`,
            dueDate: dueDate.toISOString().split('T')[0],
            paid: false,
            paidDate: null,
            createdAt: new Date().toISOString()
        });
    }
    
    state.orders = state.orders.filter(o => o.id !== orderId);
    
    saveState();
    renderApp();
    showToast(`Entrega efetuada com sucesso! R$ ${revenue.toFixed(2)} registrados (${paymentMethod}).`, "success");
}

// --- HISTÓRICO DE ENTREGAS ---
export function renderHistorico() {
    const tableBody = document.getElementById("history-table-body");
    if (!tableBody) return;
    tableBody.innerHTML = "";
    
    const filterClient = document.getElementById("filter-client").value;
    const filterProduct = document.getElementById("filter-product").value;
    
    const filteredDeliveries = state.deliveries.filter(del => {
        if (filterClient && del.clientId !== filterClient) return false;
        if (filterProduct) {
            const hasFardo = del.items[filterProduct] && del.items[filterProduct] > 0;
            const hasUnit = del.items[filterProduct + "_unit"] && del.items[filterProduct + "_unit"] > 0;
            if (!hasFardo && !hasUnit) return false;
        }
        return true;
    });
    
    filteredDeliveries.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (filteredDeliveries.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="empty-state" style="padding: 3rem; text-align: center;">
                    Nenhuma entrega encontrada para os filtros aplicados.
                </td>
            </tr>
        `;
        return;
    }
    
    filteredDeliveries.forEach(del => {
        const dateFormatted = formatDateBrazil(del.date);
        
        let itemsText = [];
        state.products.forEach(p => {
            const qty = del.items[p.id] || 0;
            const qtyUnit = del.items[p.id + "_unit"] || 0;
            if (qty > 0 || qtyUnit > 0) {
                if (qty > 0 && qtyUnit > 0) {
                    itemsText.push(`${qty} f + ${qtyUnit} u de ${p.name}`);
                } else if (qty > 0) {
                    itemsText.push(`${qty}x ${p.name}`);
                } else {
                    itemsText.push(`${qtyUnit} u de ${p.name}`);
                }
            }
        });
        
        let extraInfo = "";
        if (del.lotNumber) extraInfo += ` | Lote: ${del.lotNumber}`;
        if (del.exchangeQty > 0) extraInfo += ` | <span style="color:var(--color-danger)">Troca: ${del.exchangeQty}</span>`;
        
        const finalItemsText = itemsText.join(", ") + extraInfo;
        
        let gpsButton = '';
        if (del.gps && del.gps.lat && del.gps.lng) {
            gpsButton = `
                <a href="https://www.google.com/maps/search/?api=1&query=${del.gps.lat},${del.gps.lng}" target="_blank" class="btn btn-secondary btn-icon-only" style="padding: 4px; display: inline-flex; align-items: center; justify-content: center; text-decoration: none;" title="Ver Localização no GPS">
                    <i data-lucide="map-pin" style="width: 14px; height: 14px; color: var(--color-primary);"></i>
                </a>
            `;
        }
        
        // Botão WhatsApp de comprovante do histórico
        const cleanPhone = (del.clientPhone || '').replace(/\D/g, '');
        const phoneWithDDI = (cleanPhone.length === 10 || cleanPhone.length === 11) ? '55' + cleanPhone : cleanPhone;
        const waText = encodeURIComponent(
            `*Comprovante de Entrega - Gelo do Vale*\n` +
            `Cliente: ${del.clientName}\nData: ${dateFormatted}\nItens: ${itemsText.join(', ')}\n*Total: R$ ${(del.revenue || 0).toFixed(2)}*\nPagamento: ${del.paymentMethod || 'Não informado'}\n\nObrigado pela parceria!`
        );
        const waUrl = phoneWithDDI ? `https://api.whatsapp.com/send?phone=${phoneWithDDI}&text=${waText}` : `https://api.whatsapp.com/send?text=${waText}`;
        const whatsappBtn = `<a href="${waUrl}" target="_blank" class="btn btn-secondary btn-icon-only" style="padding: 4px; display: inline-flex; align-items: center; justify-content: center; text-decoration: none; border-color: rgba(37,211,102,0.3); color: #25D366;" title="Enviar comprovante no WhatsApp"><svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='currentColor'><path d='M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z'/></svg></a>`;
        
        tableBody.innerHTML += `
            <tr>
                <td style="font-weight: 500;">${dateFormatted}</td>
                <td><strong>${del.clientName}</strong></td>
                <td>${itemsText.join("<br>")} ${extraInfo !== "" ? "<br><span style='font-size:0.75rem; color:var(--color-text-muted);'>" + extraInfo + "</span>" : ""}</td>
                <td style="color: var(--color-primary); font-weight: 700;">R$ ${(del.revenue || 0).toFixed(2)}</td>
                <td>
                    <div style="display: flex; gap: 4px; justify-content: center; align-items: center;">
                        ${gpsButton}
                        ${whatsappBtn}
                        <button class="btn btn-danger btn-icon-only" style="padding: 4px;" onclick="deleteDelivery('${del.id}')" title="Excluir Registro">
                            <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    if (window.lucide) window.lucide.createIcons();
}

export function deleteDelivery(deliveryId) {
    showConfirm(
        "Excluir este registro apagará os dados de faturamento associados. O estoque do freezer do cliente não será alterado retroativamente. Confirmar?",
        () => {
            state.deliveries = state.deliveries.filter(d => d.id !== deliveryId);
            saveState();
            renderApp();
            showToast("Registro de entrega removido com sucesso!", "success");
        },
        null,
        "Excluir Registro de Entrega",
        "Excluir"
    );
}

// --- FILTROS DE HISTÓRICO E PESQUISAS ---
export function initHistoryFilters() {
    const filterClient = document.getElementById("filter-client");
    if (filterClient) filterClient.addEventListener("change", renderHistorico);

    const filterProduct = document.getElementById("filter-product");
    if (filterProduct) filterProduct.addEventListener("change", renderHistorico);

    const btnClearFilters = document.getElementById("btn-clear-filters");
    if (btnClearFilters) {
        btnClearFilters.addEventListener("click", () => {
            document.getElementById("filter-client").value = "";
            document.getElementById("filter-product").value = "";
            renderHistorico();
        });
    }
}

export function initAllSearchFilters() {
    const searchFreezer = document.getElementById("search-freezer");
    const filterFreezerStatus = document.getElementById("filter-freezer-status");
    if (searchFreezer) searchFreezer.addEventListener("input", () => {
        if (window.renderInventario) window.renderInventario();
    });
    if (filterFreezerStatus) filterFreezerStatus.addEventListener("change", () => {
        if (window.renderInventario) window.renderInventario();
    });

    const searchRental = document.getElementById("search-rental");
    const filterRentalStatus = document.getElementById("filter-rental-status");
    if (searchRental) searchRental.addEventListener("input", () => {
        if (window.renderTinas) window.renderTinas();
    });
    if (filterRentalStatus) filterRentalStatus.addEventListener("change", () => {
        if (window.renderTinas) window.renderTinas();
    });

    const searchDocument = document.getElementById("search-document");
    const filterDocumentType = document.getElementById("filter-document-type");
    if (searchDocument) searchDocument.addEventListener("input", () => {
        if (window.renderDocumentos) window.renderDocumentos();
    });
    if (filterDocumentType) filterDocumentType.addEventListener("change", () => {
        if (window.renderDocumentos) window.renderDocumentos();
    });
}

// --- CONFIGURAÇÃO DE TODOS OS FORMULÁRIOS ---
export function initForms() {
    const clientForm = document.getElementById("client-form");
    if (clientForm) {
        clientForm.addEventListener("submit", (e) => {
            e.preventDefault();
            
            const clientId = document.getElementById("form-client-id").value;
            const name = document.getElementById("client-name").value;
            const address = document.getElementById("client-address").value;
            const phone = document.getElementById("client-phone").value;
            const clientDoc = document.getElementById("client-document") ? document.getElementById("client-document").value.trim() : "";
            
            const selectedFreezerId = document.getElementById("client-freezer-id-select").value;
            const selectedFreezer = state.freezers.find(f => f.id === selectedFreezerId);
            
            const freezerCode = selectedFreezer ? selectedFreezer.code : "";
            const freezerBrand = selectedFreezer ? selectedFreezer.brand : "";
            const freezerVoltage = selectedFreezer ? selectedFreezer.voltage : "";
            const freezerCapacity = selectedFreezer ? selectedFreezer.capacity : "";
            
            const alertThreshold = parseInt(document.getElementById("alert-threshold").value) || 20;
            const deliveryDate = document.getElementById("freezer-delivery-date").value;
            const maintenanceNotes = document.getElementById("freezer-maintenance").value;
            
            const capacities = {};
            const stock = {};
            
            const capInputs = document.querySelectorAll(".client-cap-input");
            capInputs.forEach(input => {
                const prodId = input.getAttribute("data-prod-id");
                capacities[prodId] = parseInt(input.value) || 0;
            });

            const stockInputs = document.querySelectorAll(".client-stock-input");
            stockInputs.forEach(input => {
                const prodId = input.getAttribute("data-prod-id");
                stock[prodId] = parseInt(input.value) || 0;
            });
            
            const targetClientId = clientId || "c-" + Date.now();
            const oldFreezer = state.freezers.find(f => f.clientId === targetClientId);
            
            if (oldFreezer && (!selectedFreezer || oldFreezer.id !== selectedFreezer.id)) {
                oldFreezer.status = "disponivel";
                oldFreezer.clientId = "";
                oldFreezer.clientName = "";
                if (!oldFreezer.movementHistory) oldFreezer.movementHistory = [];
                oldFreezer.movementHistory.push({
                    date: formatDateBrazil(getBrazilTimeISO()),
                    from: name,
                    to: "Fábrica",
                    reason: "Desvinculado devido à alteração no cadastro do cliente"
                });
                if (state.comodatos) {
                    state.comodatos.forEach(com => {
                        if (com.clientId === targetClientId && com.freezerCode === oldFreezer.code && com.status !== 'retirado') {
                            com.status = 'retirado';
                            com.returnDate = getBrazilTimeISO().split('T')[0];
                            com.returnNotes = "Desvinculado no cadastro do cliente";
                        }
                    });
                }
            }
            
            if (selectedFreezer) {
                selectedFreezer.status = "alocado";
                selectedFreezer.clientId = targetClientId;
                selectedFreezer.clientName = name;
                
                if (!oldFreezer || oldFreezer.id !== selectedFreezer.id) {
                    if (!selectedFreezer.movementHistory) selectedFreezer.movementHistory = [];
                    selectedFreezer.movementHistory.push({
                        date: formatDateBrazil(getBrazilTimeISO()),
                        from: "Fábrica",
                        to: name,
                        reason: "Alocação em regime de comodato"
                    });
                }
                
                if (maintenanceNotes) {
                    if (!selectedFreezer.maintenanceLogs) selectedFreezer.maintenanceLogs = [];
                    const jaExiste = selectedFreezer.maintenanceLogs.some(log => log.note === maintenanceNotes);
                    if (!jaExiste) {
                        selectedFreezer.maintenanceLogs.push({
                            date: formatDateBrazil(getBrazilTimeISO()),
                            note: maintenanceNotes
                        });
                    }
                }
            }
            
            const visitDays = Array.from(document.querySelectorAll('input[name="visit-days"]:checked')).map(cb => cb.value);
            
            if (clientId) {
                const idx = state.clients.findIndex(c => c.id === clientId);
                if (idx !== -1) {
                    state.clients[idx] = {
                        ...state.clients[idx],
                        name, address, phone, freezerCode, alertThreshold, capacities, stock,
                        freezerBrand, freezerVoltage, freezerCapacity, deliveryDate, maintenanceNotes,
                        visitDays,
                        document: clientDoc
                    };
                }
            } else {
                const newClient = {
                    id: targetClientId,
                    name, address, phone, freezerCode, alertThreshold, capacities, stock,
                    freezerBrand, freezerVoltage, freezerCapacity, deliveryDate, maintenanceNotes,
                    outstandingDebt: 0,
                    visitDays,
                    document: clientDoc
                };
                state.clients.push(newClient);
            }
            
            if (window.migrateLegacyComodatos) window.migrateLegacyComodatos();
            saveState();
            closeModal("modal-client");
            renderApp();
        });
    }

    const orderForm = document.getElementById("order-form");
    if (orderForm) {
        orderForm.addEventListener("submit", (e) => {
            e.preventDefault();
            
            const clientId = document.getElementById("order-client-id").value;
            if (!clientId) {
                showToast("Selecione um cliente.", "warning");
                return;
            }

            const items = {};
            let totalItemsCount = 0;
            
            const reqInputs = document.querySelectorAll(".order-req-input");
            reqInputs.forEach(input => {
                const prodId = input.getAttribute("data-prod-id");
                const qty = parseInt(input.value) || 0;
                if (qty > 0) {
                    items[prodId] = qty;
                    totalItemsCount += qty;
                }
            });

            const reqUnitInputs = document.querySelectorAll(".order-req-unit-input");
            reqUnitInputs.forEach(input => {
                const prodIdKey = input.getAttribute("data-prod-id");
                const qty = parseInt(input.value) || 0;
                if (qty > 0) {
                    items[prodIdKey] = qty;
                    totalItemsCount += qty;
                }
            });
            
            if (totalItemsCount === 0) {
                showToast("O pedido deve conter pelo menos 1 item.", "warning");
                return;
            }
            
            const lotNumber = document.getElementById("order-lot") ? document.getElementById("order-lot").value : "";
            const exchangeQty = document.getElementById("order-exchange-qty") ? parseInt(document.getElementById("order-exchange-qty").value) || 0 : 0;
            const scheduledDate = document.getElementById("order-scheduled-date") ? document.getElementById("order-scheduled-date").value : "";
            const scheduledNote = document.getElementById("order-scheduled-note") ? document.getElementById("order-scheduled-note").value.trim() : "";
            
            const newOrder = {
                id: "o-" + Date.now(),
                clientId: clientId,
                date: getBrazilTimeISO(),
                status: "pending",
                items: items,
                lotNumber: lotNumber,
                exchangeQty: exchangeQty,
                scheduledDate: scheduledDate || null,
                scheduledNote: scheduledNote || null
            };
            
            state.orders.push(newOrder);
            saveState();
            closeModal("modal-order");
            renderApp();
            if (scheduledDate) {
                showToast(`Pré-pedido agendado para ${new Date(scheduledDate + 'T00:00:00').toLocaleDateString('pt-BR')}! Vai aparecer destacado no dia certo.`, "success");
            }
        });
    }
    
    const salesForm = document.getElementById("sales-form");
    if (salesForm) {
        salesForm.addEventListener("submit", (e) => {
            e.preventDefault();
            
            const clientId = document.getElementById("sales-client-id").value;
            const client = state.clients.find(c => c.id === clientId);
            if (!client) return;
            
            let hasExcess = false;
            let errorMessage = "";
            
            state.products.forEach(p => {
                if (!p.active) return;
                const currentStock = (client.stock && client.stock[p.id]) || 0;
                
                if (p.type === 'Gelo Saborizado') {
                    const fardoInput = document.getElementById(`sale-${p.id}`);
                    const unitInput = document.getElementById(`sale-${p.id}_unit`);
                    const fardos = fardoInput ? (parseInt(fardoInput.value) || 0) : 0;
                    const units = unitInput ? (parseInt(unitInput.value) || 0) : 0;
                    
                    const unitsPerPack = p.unitsPerPack || 12;
                    const totalRequested = fardos + (units / unitsPerPack);
                    if (totalRequested > currentStock) {
                        hasExcess = true;
                        const fardosInteiros = Math.floor(currentStock);
                        const unidadesRestantes = Math.round((currentStock - fardosInteiros) * unitsPerPack);
                        errorMessage = `Estoque insuficiente para ${p.name}. Solicitado: ${fardos} fardos e ${units} unidades. Disponível: ${fardosInteiros} fardos e ${unidadesRestantes} unidades.`;
                    }
                } else if (p.type === 'Gelo') {
                    const fardoInput = document.getElementById(`sale-${p.id}`);
                    const fardos = fardoInput ? (parseInt(fardoInput.value) || 0) : 0;
                    if (fardos > currentStock) {
                        hasExcess = true;
                        errorMessage = `Estoque insuficiente para ${p.name}. Solicitado: ${fardos}. Disponível: ${currentStock}.`;
                    }
                }
            });
            
            if (hasExcess) {
                showToast(errorMessage, "error");
                return;
            }
            
            const saleInputs = document.querySelectorAll(".sales-sale-input");
            saleInputs.forEach(input => {
                const prodId = input.getAttribute("data-prod-id");
                const qty = parseInt(input.value) || 0;
                if (qty > 0) {
                    client.stock[prodId] = Math.max(0, (client.stock[prodId] || 0) - qty);
                }
            });

            const saleUnitInputs = document.querySelectorAll(".sales-sale-unit-input");
            saleUnitInputs.forEach(input => {
                const key = input.getAttribute("data-prod-id");
                const prodId = key.endsWith('_unit') ? key.slice(0, -5) : key;
                const p = state.products.find(x => x.id === prodId);
                const unitsPerPack = p ? (p.unitsPerPack || 12) : 12;
                const qtyUnits = parseInt(input.value) || 0;
                if (qtyUnits > 0) {
                    const fraction = qtyUnits / unitsPerPack;
                    client.stock[prodId] = Math.max(0, (client.stock[prodId] || 0) - fraction);
                }
            });
            
            saveState();
            closeModal("modal-sales");
            renderApp();
        });
    }

    const freezerForm = document.getElementById("freezer-form");
    if (freezerForm) {
        freezerForm.addEventListener("submit", (e) => {
            e.preventDefault();
            
            const freezerId = document.getElementById("form-freezer-id").value;
            const code = document.getElementById("freezer-code-input").value.trim();
            const brand = document.getElementById("freezer-brand-input").value.trim();
            const voltage = document.getElementById("freezer-voltage-select").value;
            const capacity = parseInt(document.getElementById("freezer-capacity-input").value) || null;
            const purchaseDate = document.getElementById("freezer-purchase-date").value;
            const warrantyMonths = parseInt(document.getElementById("freezer-warranty").value) || 0;
            const status = document.getElementById("freezer-status-select").value;
            
            const photoFreezer = document.getElementById("photo-freezer-data").value || "";
            const photoInvoice = document.getElementById("photo-invoice-data").value || "";
            const photoEstablishment = document.getElementById("photo-establishment-data").value || "";
            
            if (!code) {
                showToast("Código do freezer é obrigatório!", "warning");
                return;
            }
            
            const codeExists = state.freezers.some(f => f.code.toUpperCase() === code.toUpperCase() && f.id !== freezerId);
            if (codeExists) {
                showToast(`Já existe um equipamento cadastrado com o código "${code}"!`, "error");
                return;
            }
            
            if (freezerId) {
                const idx = state.freezers.findIndex(f => f.id === freezerId);
                if (idx !== -1) {
                    const currentStatus = state.freezers[idx].status;
                    const currentClientId = state.freezers[idx].clientId;
                    
                    state.freezers[idx] = {
                        ...state.freezers[idx],
                        code, brand, voltage, capacity, purchaseDate, warrantyMonths,
                        photoFreezer: photoFreezer || state.freezers[idx].photoFreezer,
                        photoInvoice: photoInvoice || state.freezers[idx].photoInvoice,
                        photoEstablishment: photoEstablishment || state.freezers[idx].photoEstablishment
                    };
                    
                    if (state.freezers[idx].status === 'alocado' && state.freezers[idx].clientId) {
                        const linkedClient = state.clients.find(c => c.id === state.freezers[idx].clientId);
                        if (linkedClient) {
                            linkedClient.freezerCode = code;
                            linkedClient.freezerBrand = brand;
                            linkedClient.freezerVoltage = voltage;
                            linkedClient.freezerCapacity = capacity;
                        }
                    }
                    
                    if (status !== currentStatus) {
                        state.freezers[idx].status = status;
                        if (status !== 'alocado') {
                            const linkedClient = state.clients.find(c => c.id === currentClientId);
                            if (linkedClient) {
                                linkedClient.freezerCode = "";
                                linkedClient.freezerBrand = "";
                                linkedClient.freezerVoltage = "";
                                linkedClient.freezerCapacity = "";
                            }
                            
                            state.freezers[idx].clientId = "";
                            state.freezers[idx].clientName = "";
                            
                            let destName = "Fábrica";
                            if (status === 'manutencao') destName = "Oficina/Manutenção";
                            if (status === 'inativo') destName = "Inativo";
                            
                            if (!state.freezers[idx].movementHistory) state.freezers[idx].movementHistory = [];
                            state.freezers[idx].movementHistory.push({
                                date: formatDateBrazil(getBrazilTimeISO()),
                                from: "Alocação",
                                to: destName,
                                reason: "Alteração manual de status no cadastro"
                            });
                        }
                    }
                }
            } else {
                const newFreezer = {
                    id: "f-" + Date.now(),
                    code, brand, voltage, capacity, purchaseDate, warrantyMonths,
                    status: "disponivel",
                    clientId: "",
                    clientName: "",
                    photoFreezer,
                    photoInvoice,
                    photoEstablishment,
                    maintenanceLogs: [],
                    movementHistory: [
                        {
                            date: formatDateBrazil(getBrazilTimeISO()),
                            from: "Aquisição",
                            to: "Fábrica",
                            reason: "Cadastro inicial do equipamento"
                        }
                    ]
                };
                state.freezers.push(newFreezer);
            }
            
            saveState();
            closeModal("modal-freezer");
            renderApp();
        });
    }

    const moveFreezerForm = document.getElementById("move-freezer-form");
    if (moveFreezerForm) {
        moveFreezerForm.addEventListener("submit", (e) => {
            e.preventDefault();
            
            const freezerId = document.getElementById("move-freezer-id").value;
            const destiny = document.getElementById("move-destiny").value;
            const clientId = document.getElementById("move-client-id").value;
            const reason = document.getElementById("move-reason").value.trim() || "Movimentação padrão";
            
            const freezer = state.freezers.find(f => f.id === freezerId);
            if (!freezer) return;
            
            const oldLocationName = freezer.status === 'alocado' ? freezer.clientName : (freezer.status === 'disponivel' ? 'Fábrica' : (freezer.status === 'manutencao' ? 'Oficina' : 'Inativo'));
            
            if (destiny === 'cliente') {
                if (!clientId) {
                    showToast("Selecione o cliente de destino!", "warning");
                    return;
                }
                const client = state.clients.find(c => c.id === clientId);
                if (!client) return;
                
                const clientHasFreezer = state.freezers.find(f => f.clientId === clientId && f.id !== freezerId);
                
                const executeMovement = () => {
                    if (clientHasFreezer) {
                        clientHasFreezer.status = "disponivel";
                        clientHasFreezer.clientId = "";
                        clientHasFreezer.clientName = "";
                        if (!clientHasFreezer.movementHistory) clientHasFreezer.movementHistory = [];
                        clientHasFreezer.movementHistory.push({
                            date: formatDateBrazil(getBrazilTimeISO()),
                            from: client.name,
                            to: "Fábrica",
                            reason: "Substituído por outro freezer no cliente"
                        });
                    }
                    
                    if (freezer.status === 'alocado' && freezer.clientId !== clientId) {
                        const prevClient = state.clients.find(c => c.id === freezer.clientId);
                        if (prevClient) {
                            prevClient.freezerCode = "";
                            prevClient.freezerBrand = "";
                            prevClient.freezerVoltage = "";
                            prevClient.freezerCapacity = "";
                        }
                    }
                    
                    freezer.status = "alocado";
                    freezer.clientId = client.id;
                    freezer.clientName = client.name;
                    
                    client.freezerCode = freezer.code;
                    client.freezerBrand = freezer.brand;
                    client.freezerVoltage = freezer.voltage;
                    client.freezerCapacity = freezer.capacity;
                    client.deliveryDate = getBrazilTimeISO().split('T')[0];
                    
                    if (!freezer.movementHistory) freezer.movementHistory = [];
                    freezer.movementHistory.push({
                        date: formatDateBrazil(getBrazilTimeISO()),
                        from: oldLocationName,
                        to: client.name,
                        reason: reason
                    });

                    saveState();
                    closeModal("modal-move-freezer");
                    closeModal("modal-freezer-detail");
                    renderApp();
                    showToast("Movimentação de freezer realizada com sucesso!", "success");
                };

                if (clientHasFreezer) {
                    showConfirm(
                        `O cliente ${client.name} já possui o freezer ${clientHasFreezer.code} vinculado. Deseja liberar o anterior para a fábrica e alocar este?`,
                        executeMovement
                    );
                } else {
                    executeMovement();
                }
                
            } else {
                if (freezer.status === 'alocado') {
                    const prevClient = state.clients.find(c => c.id === freezer.clientId);
                    if (prevClient) {
                        prevClient.freezerCode = "";
                        prevClient.freezerBrand = "";
                        prevClient.freezerVoltage = "";
                        prevClient.freezerCapacity = "";
                    }
                }
                
                freezer.status = destiny;
                freezer.clientId = "";
                freezer.clientName = "";
                
                let destName = "Fábrica";
                if (destiny === 'manutencao') destName = "Oficina/Manutenção";
                if (destiny === 'inativo') destName = "Inativo";
                
                if (!freezer.movementHistory) freezer.movementHistory = [];
                freezer.movementHistory.push({
                    date: formatDateBrazil(getBrazilTimeISO()),
                    from: oldLocationName,
                    to: destName,
                    reason: reason
                });

                saveState();
                closeModal("modal-move-freezer");
                closeModal("modal-freezer-detail");
                renderApp();
                showToast("Movimentação de freezer realizada com sucesso!", "success");
            }
        });
    }

    const noteForm = document.getElementById("note-form");
    if (noteForm) {
        noteForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const freezerId = document.getElementById("note-freezer-id").value;
            const noteText = document.getElementById("note-text").value.trim();
            const maintType = document.getElementById("maint-type").value;
            const maintTech = document.getElementById("maint-technician").value.trim();
            const maintCost = parseFloat(document.getElementById("maint-cost").value) || 0;
            const maintNextDate = document.getElementById("maint-next-date").value;
            
            if (!noteText) return;
            
            const freezer = state.freezers.find(f => f.id === freezerId);
            if (freezer) {
                freezer.maintenanceLogs.push({
                    date: formatDateBrazil(getBrazilTimeISO()),
                    type: maintType,
                    technician: maintTech,
                    cost: maintCost,
                    nextDate: maintNextDate,
                    note: noteText
                });
                
                if (freezer.status === 'alocado') {
                    const client = state.clients.find(c => c.id === freezer.clientId);
                    if (client) {
                        client.maintenanceNotes = `${maintType} por ${maintTech} (R$ ${maintCost.toFixed(2).replace(".", ",")}): ${noteText}`;
                    }
                }
                
                saveState();
                
                document.getElementById("maint-type").value = "Limpeza";
                document.getElementById("maint-technician").value = "";
                document.getElementById("maint-cost").value = "";
                document.getElementById("maint-next-date").value = "";
                document.getElementById("note-text").value = "";
                
                if (window.openFreezerDetail) window.openFreezerDetail(freezerId);
                renderApp();
            }
        });
    }

    const rentalForm = document.getElementById("rental-form");
    if (rentalForm) {
        rentalForm.addEventListener("submit", (e) => {
            e.preventDefault();
            
            const rentalId = document.getElementById("form-rental-id").value;
            const clientId = document.getElementById("rental-client-select").value;
            const clientName = document.getElementById("rental-client-name").value.trim();
            const address = document.getElementById("rental-address").value.trim();
            const phone = document.getElementById("rental-phone").value.trim();
            const itemType = document.getElementById("rental-item-type").value;
            const tinaCode = document.getElementById("rental-tina-code").value.trim();
            const tinaColor = document.getElementById("rental-tina-color").value;
            const rentalFee = parseFloat(document.getElementById("rental-fee").value) || 0;
            const shippingType = document.getElementById("rental-shipping-type").value;
            const extraDayFee = parseFloat(document.getElementById("rental-extra-day-fee").value) || 0;
            const deliveryFee = parseFloat(document.getElementById("rental-delivery-fee").value) || 0;
            const pickupFee = parseFloat(document.getElementById("rental-pickup-fee").value) || 0;
            const deliveryDate = document.getElementById("rental-delivery-date").value;
            const expectedReturnDate = document.getElementById("rental-expected-return").value;
            const rentalDays = parseInt(document.getElementById("rental-days").value) || 7;
            const notes = document.getElementById("rental-notes").value.trim();
            const photoRentalLocation = document.getElementById("photo-rental-location-data").value || "";

            const logisticsDistance = parseFloat(document.getElementById("logistics-distance").value) || 0;
            const logisticsAvgSpeed = parseInt(document.getElementById("logistics-avg-speed").value) || 60;
            const logisticsVehicleType = document.getElementById("logistics-vehicle-type").value;
            const logisticsTollBase = parseFloat(document.getElementById("logistics-toll-base").value) || 0;
            const logisticsTollMultiplier = parseFloat(document.getElementById("logistics-toll-multiplier").value) || 1;
            const logisticsFuelPrice = parseFloat(document.getElementById("logistics-fuel-price").value) || 0;
            const logisticsFuelConsumption = parseFloat(document.getElementById("logistics-fuel-consumption").value) || 10;
            const logisticsMarkupPercent = parseFloat(document.getElementById("logistics-markup-percent").value) || 0;
            const logisticsMarkupFixed = parseFloat(document.getElementById("logistics-markup-fixed").value) || 0;
            const logisticsTollReturn = document.getElementById("logistics-toll-return").checked;

            const iceItems = {};
            let totalRevenue = rentalFee + deliveryFee + pickupFee;
            
            const rentalQtyInputs = document.querySelectorAll(".rental-qty-input");
            rentalQtyInputs.forEach(input => {
                const prodId = input.getAttribute("data-prod-id");
                const qty = parseInt(input.value) || 0;
                iceItems[prodId] = qty;
                
                if (qty > 0) {
                    const client = state.clients.find(c => c.id === clientId);
                    const p = state.products.find(prod => prod.id === prodId);
                    const clientPrice = (client && client.customPrices && client.customPrices[prodId]) || (p && p.defaultPrice) || 0;
                    totalRevenue += qty * clientPrice;
                }
            });

            if (!clientName || !tinaCode) {
                showToast("Nome do cliente e identificação do item são obrigatórios!", "warning");
                return;
            }

            if (rentalId) {
                const idx = state.rentals.findIndex(r => r.id === rentalId);
                if (idx !== -1) {
                    state.rentals[idx] = {
                        ...state.rentals[idx],
                        clientId, clientName, address, phone, itemType, tinaCode, tinaColor, rentalFee, shippingType, extraDayFee, deliveryFee, pickupFee, deliveryDate, expectedReturnDate, rentalDays, notes,
                        iceItems, totalRevenue,
                        photoRentalLocation: photoRentalLocation || state.rentals[idx].photoRentalLocation,
                        logisticsDistance, logisticsAvgSpeed, logisticsVehicleType, logisticsTollBase, logisticsTollMultiplier, logisticsFuelPrice, logisticsFuelConsumption, logisticsMarkupPercent, logisticsMarkupFixed, logisticsTollReturn
                    };
                }
            } else {
                const newRental = {
                    id: "r-" + Date.now(),
                    clientId, clientName, address, phone, itemType, tinaCode, tinaColor, rentalFee, shippingType, extraDayFee, deliveryFee, pickupFee, deliveryDate, expectedReturnDate, rentalDays,
                    returnDate: null,
                    status: "active",
                    notes,
                    iceItems,
                    totalRevenue,
                    photoRentalLocation,
                    logisticsDistance, logisticsAvgSpeed, logisticsVehicleType, logisticsTollBase, logisticsTollMultiplier, logisticsFuelPrice, logisticsFuelConsumption, logisticsMarkupPercent, logisticsMarkupFixed, logisticsTollReturn
                };
                if (!state.rentals) state.rentals = [];
                state.rentals.push(newRental);
            }

            saveState();
            closeModal("modal-rental");
            renderApp();
        });
    }

    const docForm = document.getElementById("document-form");
    if (docForm) {
        docForm.addEventListener("submit", (e) => {
            e.preventDefault();

            const docId = document.getElementById("form-document-id").value;
            const type = document.getElementById("doc-type").value;
            const date = document.getElementById("doc-date").value;
            const clientId = document.getElementById("doc-client-select").value;
            const clientName = document.getElementById("doc-client-name").value.trim();
            const address = document.getElementById("doc-address").value.trim();
            const phone = document.getElementById("doc-phone").value.trim();
            const deliveryFee = parseFloat(document.getElementById("doc-delivery-fee").value) || 0;
            const paymentMethod = document.getElementById("doc-payment-method").value;

            const docLogisticsOpType = document.getElementById("doc-logistics-op-type").value;
            const docLogisticsDistance = parseFloat(document.getElementById("doc-logistics-distance").value) || 0;
            const docLogisticsAvgSpeed = parseFloat(document.getElementById("doc-logistics-avg-speed").value) || 60;
            const docLogisticsVehicleType = document.getElementById("doc-logistics-vehicle-type").value;
            const docLogisticsTollBase = parseFloat(document.getElementById("doc-logistics-toll-base").value) || 0;
            const docLogisticsTollMultiplier = parseFloat(document.getElementById("doc-logistics-toll-multiplier").value) || 1.0;
            const docLogisticsFuelPrice = parseFloat(document.getElementById("doc-logistics-fuel-price").value) || 0;
            const docLogisticsFuelConsumption = parseFloat(document.getElementById("doc-logistics-fuel-consumption").value) || 10;
            const docLogisticsMarkupPercent = parseFloat(document.getElementById("doc-logistics-markup-percent").value) || 0;
            const docLogisticsMarkupFixed = parseFloat(document.getElementById("doc-logistics-markup-fixed").value) || 0;
            const docLogisticsTollReturn = document.getElementById("doc-logistics-toll-return").checked;

            if (!clientName) {
                showToast("Nome do cliente é obrigatório!", "warning");
                return;
            }

            const items = [];
            
            state.products.forEach(p => {
                const qtyEl = document.getElementById(`doc-qty-${p.id}`);
                const priceEl = document.getElementById(`doc-price-${p.id}`);
                if (qtyEl && priceEl) {
                    const qty = parseInt(qtyEl.value) || 0;
                    const price = parseFloat(priceEl.value) || 0;
                    if (qty > 0) {
                        items.push({
                            prodId: p.id,
                            name: p.name + (p.type === 'Gelo Saborizado' ? ' (Fardo)' : ''),
                            qty: qty,
                            price: price
                        });
                    }
                }
                if (p.type === 'Gelo Saborizado') {
                    const qtyUnitEl = document.getElementById(`doc-qty-${p.id}_unit`);
                    const priceUnitEl = document.getElementById(`doc-price-${p.id}_unit`);
                    if (qtyUnitEl && priceUnitEl) {
                        const qtyUnit = parseInt(qtyUnitEl.value) || 0;
                        const priceUnit = parseFloat(priceUnitEl.value) || 0;
                        if (qtyUnit > 0) {
                            items.push({
                                prodId: p.id + "_unit",
                                name: p.name + " (Unidade)",
                                qty: qtyUnit,
                                price: priceUnit
                            });
                        }
                    }
                }
            });

            const customName = document.getElementById("doc-custom-name").value.trim();
            const customQty = parseInt(document.getElementById("doc-custom-qty").value) || 0;
            const customPrice = parseFloat(document.getElementById("doc-custom-price").value) || 0;
            if (customName && customQty > 0) {
                items.push({ name: customName, qty: customQty, price: customPrice });
            }

            if (items.length === 0) {
                showToast("Adicione pelo menos um item com quantidade maior que zero para gerar o documento!", "warning");
                return;
            }

            let subtotal = items.reduce((sum, item) => sum + (item.qty * item.price), 0);
            const total = subtotal + deliveryFee;

            const submitBtn = e.target.querySelector('button[type="submit"]');
            let oldBtnHTML = "";
            if (submitBtn) {
                oldBtnHTML = submitBtn.innerHTML;
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="loading-spinner"></span> Aguardando GPS...';
            }

            getGPSLocation((gps) => {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = oldBtnHTML;
                }

                if (docId) {
                    const idx = state.documents.findIndex(d => d.id === docId);
                    if (idx !== -1) {
                        state.documents[idx] = {
                            ...state.documents[idx],
                            type, date, clientId, clientName, address, phone, items, deliveryFee, total, paymentMethod, gps,
                            docLogisticsOpType, docLogisticsDistance, docLogisticsAvgSpeed, docLogisticsVehicleType,
                            docLogisticsTollBase, docLogisticsTollMultiplier, docLogisticsFuelPrice,
                            docLogisticsFuelConsumption, docLogisticsMarkupPercent, docLogisticsMarkupFixed,
                            docLogisticsTollReturn
                        };
                    }
                } else {
                    const newDoc = {
                        id: "doc-" + Date.now(),
                        type, date, clientId, clientName, address, phone, items, deliveryFee, total, paymentMethod, gps,
                        docLogisticsOpType, docLogisticsDistance, docLogisticsAvgSpeed, docLogisticsVehicleType,
                        docLogisticsTollBase, docLogisticsTollMultiplier, docLogisticsFuelPrice,
                        docLogisticsFuelConsumption, docLogisticsMarkupPercent, docLogisticsMarkupFixed,
                        docLogisticsTollReturn
                    };
                    if (!state.documents) state.documents = [];
                    state.documents.push(newDoc);
                    
                    if (type === "recibo" || type === "nota") {
                        items.forEach(item => {
                            const productId = item.prodId ? item.prodId.replace("_unit", "") : "";
                            const isUnit = item.prodId ? item.prodId.endsWith("_unit") : false;
                            const qtyFardos = isUnit ? 0 : item.qty;
                            const qtyUnits = isUnit ? item.qty : 0;
                            deductPackagingStock(productId, qtyFardos, qtyUnits, `${type === "nota" ? "Nota" : "Recibo"}: ${newDoc.id}`);
                        });
                    }
                }

                saveState();
                closeModal("modal-document");
                renderApp();
            });
        });
    }

    const adminAuthForm = document.getElementById("admin-auth-form");
    if (adminAuthForm) {
        adminAuthForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const enteredPassword = document.getElementById("auth-password").value;
            
            if (enteredPassword === state.adminPassword) {
                sessionStorage.setItem("admin_authenticated", "true");
                document.getElementById("modal-admin-auth").classList.remove("active");
                document.getElementById("auth-password").value = "";
                
                if (window.postAdminAuthAction === "quickCreateRentalItem") {
                    window.postAdminAuthAction = null;
                    if (window.openProductModal) window.openProductModal();
                    const prodTypeEl = document.getElementById("prod-type");
                    if (prodTypeEl) prodTypeEl.value = "Equipamento";
                    if (window.toggleProductSubfields) window.toggleProductSubfields();
                    return;
                }
                
                const navItems = document.querySelectorAll(".nav-item");
                const tabContents = document.querySelectorAll(".tab-content");
                
                navItems.forEach(nav => nav.classList.remove("active"));
                const precosNavItem = document.querySelector('.nav-item[data-tab="precos"]');
                if (precosNavItem) precosNavItem.classList.add("active");
                
                tabContents.forEach(content => {
                    content.classList.remove("active");
                    if (content.id === "precos") {
                        content.classList.add("active");
                    }
                });
                
                updateHeaderForTab("precos");
                renderTabContent("precos");
            } else {
                const errorMsg = document.getElementById("auth-error-msg");
                if (errorMsg) {
                    errorMsg.innerText = "Senha incorreta! Acesso negado.";
                    errorMsg.style.display = "block";
                }
                document.getElementById("auth-password").value = "";
                document.getElementById("auth-password").focus();
            }
        });
    }

    const adminPasswordForm = document.getElementById("admin-password-form");
    if (adminPasswordForm) {
        adminPasswordForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const currentPwd = document.getElementById("cfg-current-pwd").value;
            const newPwd = document.getElementById("cfg-new-pwd").value;

            if (currentPwd !== state.adminPassword) {
                showToast("Senha atual incorreta!", "error");
                return;
            }

            if (newPwd.length < 4) {
                showToast("A nova senha deve possuir pelo menos 4 caracteres!", "warning");
                return;
            }

            state.adminPassword = newPwd;
            if (state.users) {
                const adminUser = state.users.find(u => u.username === "admin");
                if (adminUser) {
                    adminUser.password = newPwd;
                }
            }
            saveState();
            adminPasswordForm.reset();
            showToast("Senha de administrador atualizada com sucesso!", "success");
        });
    }

    const factoryPricesForm = document.getElementById("factory-prices-form");
    if (factoryPricesForm) {
        factoryPricesForm.addEventListener("submit", (e) => {
            e.preventDefault();
            
            const inputs = document.querySelectorAll(".factory-price-input");
            inputs.forEach(input => {
                const prodId = input.getAttribute("data-prod-id");
                const price = parseFloat(input.value) || 0;
                const p = state.products.find(prod => prod.id === prodId);
                if (p) {
                    p.defaultPrice = price;
                    
                    const unitInput = document.getElementById(`cfg-unit-price-${prodId}`);
                    if (unitInput) {
                        p.unitPrice = parseFloat(unitInput.value) || 0;
                    }
                    
                    const w1 = document.getElementById(`cfg-w1-${prodId}`);
                    const w2 = document.getElementById(`cfg-w2-${prodId}`);
                    const w3 = document.getElementById(`cfg-w3-${prodId}`);
                    const w4 = document.getElementById(`cfg-w4-${prodId}`);
                    const w5 = document.getElementById(`cfg-w5-${prodId}`);
                    
                    p.wholesalePrices = {
                        tier1_10: w1 && w1.value !== "" ? parseFloat(w1.value) : null,
                        tier11_20: w2 && w2.value !== "" ? parseFloat(w2.value) : null,
                        tier21_40: w3 && w3.value !== "" ? parseFloat(w3.value) : null,
                        tier41_50: w4 && w4.value !== "" ? parseFloat(w4.value) : null,
                        tier51: w5 && w5.value !== "" ? parseFloat(w5.value) : null
                    };
                    
                    const promoActive = document.getElementById(`cfg-promo-active-${prodId}`);
                    const promoPrice = document.getElementById(`cfg-promo-price-${prodId}`);
                    const promoLimit = document.getElementById(`cfg-promo-limit-${prodId}`);
                    
                    p.flashPromo = {
                        active: promoActive ? promoActive.checked : false,
                        price: promoPrice && promoPrice.value !== "" ? parseFloat(promoPrice.value) : 0,
                        limit: promoLimit && promoLimit.value !== "" ? parseInt(promoLimit.value) : null
                    };
                }
                if (!state.prices) state.prices = {};
                state.prices[prodId] = price;
            });
            
            saveState();
            showToast("Preços padrão da fábrica e configurações avançadas atualizadas com sucesso!", "success");
            if (window.renderPrecos) window.renderPrecos();
        });
    }

    const clientPricesForm = document.getElementById("client-prices-form");
    if (clientPricesForm) {
        clientPricesForm.addEventListener("submit", (e) => {
            e.preventDefault();
            
            const clientId = document.getElementById("form-client-prices-id").value;
            const client = state.clients.find(c => c.id === clientId);
            if (!client) return;
            
            const customPrices = {};
            const inputs = document.querySelectorAll(".client-custom-price-input");
            inputs.forEach(input => {
                const prodId = input.getAttribute("data-prod-id");
                const val = parseFloat(input.value);
                customPrices[prodId] = !isNaN(val) && val > 0 ? val : 0;
            });

            const unitInputs = document.querySelectorAll(".client-custom-price-unit-input");
            unitInputs.forEach(input => {
                const key = input.getAttribute("data-prod-id");
                const val = parseFloat(input.value);
                customPrices[key] = !isNaN(val) && val > 0 ? val : 0;
            });
            
            client.customPrices = customPrices;
            
            saveState();
            closeModal("modal-client-prices");
            showToast("Preços especiais salvos com sucesso!", "success");
            if (window.renderPrecos) window.renderPrecos();
        });
    }

    const backupSettingsForm = document.getElementById("backup-settings-form");
    if (backupSettingsForm) {
        backupSettingsForm.addEventListener("submit", (e) => {
            e.preventDefault();
            
            const newVersion = document.getElementById("cfg-app-version").value.trim();
            const newFrequency = parseInt(document.getElementById("cfg-backup-frequency").value) || 0;
            
            if (!state.backupSettings) state.backupSettings = {};
            state.backupSettings.currentVersion = newVersion;
            state.backupSettings.frequencyDays = newFrequency;
            
            saveState();
            showToast("Configurações de backup e versão salvas com sucesso!", "success");
            if (window.renderPrecos) window.renderPrecos();
        });
    }

    const productMgmtForm = document.getElementById("product-mgmt-form");
    if (productMgmtForm) {
        productMgmtForm.addEventListener("submit", (e) => {
            e.preventDefault();
            
            const productId = document.getElementById("form-product-id").value;
            const name = document.getElementById("prod-name").value.trim();
            const type = document.getElementById("prod-type").value;
            const subtype = document.getElementById("prod-subtype-text").value.trim();
            const weight = parseFloat(document.getElementById("prod-weight").value) || 0;
            const defaultPrice = parseFloat(document.getElementById("prod-price").value) || 0;
            const active = document.getElementById("prod-active").checked;
            
            const flavor = type === "Gelo Saborizado" ? document.getElementById("prod-flavor").value.trim() : "";
            const packageType = type === "Gelo Saborizado" ? document.getElementById("prod-package-type").value : "";
            const unitsPerPack = type === "Gelo Saborizado" ? (parseInt(document.getElementById("prod-units-per-pack").value) || 1) : 0;
            const unitWeightGrams = type === "Gelo Saborizado" ? (parseInt(document.getElementById("prod-unit-weight-g").value) || 0) : 0;
            
            if (!name) {
                showToast("O nome do item é obrigatório!", "warning");
                return;
            }
            
            if (productId) {
                const idx = state.products.findIndex(p => p.id === productId);
                if (idx !== -1) {
                    state.products[idx] = {
                        ...state.products[idx],
                        name, type, subtype, weight, defaultPrice, active,
                        flavor, packageType, unitsPerPack, unitWeightGrams
                    };
                }
            } else {
                const newProduct = {
                    id: "p-" + Date.now(),
                    name, type, subtype, weight, defaultPrice, active,
                    flavor, packageType, unitsPerPack, unitWeightGrams
                };
                if (!state.products) state.products = [];
                state.products.push(newProduct);
            }
            
            saveState();
            closeModal("modal-product-mgmt");
            
            if (window.renderProductsCatalog) window.renderProductsCatalog();
            if (window.renderPrecos) window.renderPrecos();
            renderApp();
            
            const rentalModal = document.getElementById("modal-rental");
            if (rentalModal && rentalModal.classList.contains("active")) {
                if (window.renderRentalModalProducts) window.renderRentalModalProducts();
            }
            
            showToast("Item salvo com sucesso!", "success");
        });
    }

    const rentalItemTypeEl = document.getElementById("rental-item-type");
    if (rentalItemTypeEl) {
        rentalItemTypeEl.addEventListener("change", () => {
            if (window.updateRentalFee) window.updateRentalFee();
        });
    }

    const factoryInfoForm = document.getElementById("factory-info-form");
    if (factoryInfoForm) {
        factoryInfoForm.addEventListener("submit", (e) => {
            e.preventDefault();
            
            if (!state.factorySettings) state.factorySettings = {};
            state.factorySettings.name = document.getElementById("cfg-factory-name").value.trim();
            state.factorySettings.cnpj = document.getElementById("cfg-factory-cnpj").value.trim();
            state.factorySettings.phone = document.getElementById("cfg-factory-phone").value.trim();
            state.factorySettings.address = document.getElementById("cfg-factory-address").value.trim();
            state.factorySettings.email = document.getElementById("cfg-factory-email").value.trim();
            state.factorySettings.pixKey = (document.getElementById("cfg-factory-pix") ? document.getElementById("cfg-factory-pix").value.trim() : "");
            state.factorySettings.rentalTerms = (document.getElementById("cfg-factory-rental-terms") ? document.getElementById("cfg-factory-rental-terms").value.trim() : "");
            
            saveState();
            showToast("Dados comerciais atualizados com sucesso!", "success");
            if (window.renderPrecos) window.renderPrecos();
            renderApp();
        });
    }

    const appearanceForm = document.getElementById("appearance-settings-form");
    if (appearanceForm) {
        appearanceForm.addEventListener("submit", (e) => {
            e.preventDefault();
            
            const preset = document.getElementById("cfg-theme-preset").value;
            let primaryColor = "#00f0ff";
            let primaryColorRgb = "0, 240, 255";
            let secondaryColor = "#0072ff";
            
            if (preset === "ciano") {
                primaryColor = "#00f0ff";
                primaryColorRgb = "0, 240, 255";
                secondaryColor = "#0072ff";
            } else if (preset === "verde") {
                primaryColor = "#10b981";
                primaryColorRgb = "16, 185, 129";
                secondaryColor = "#047857";
            } else if (preset === "laranja") {
                primaryColor = "#f59e0b";
                primaryColorRgb = "245, 158, 11";
                secondaryColor = "#b45309";
            } else if (preset === "rosa") {
                primaryColor = "#ff007f";
                primaryColorRgb = "255, 0, 127";
                secondaryColor = "#7900ff";
            } else if (preset === "roxo") {
                primaryColor = "#8b5cf6";
                primaryColorRgb = "139, 92, 246";
                secondaryColor = "#4c1d95";
            } else if (preset === "custom") {
                primaryColor = document.getElementById("cfg-custom-color").value;
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
            
            const backgroundStyle = document.getElementById("cfg-bg-style").value;
            const customBgColor = document.getElementById("cfg-custom-bg-color").value;
            const panelStyle = document.getElementById("cfg-panel-style").value;
            const glowIntensity = document.getElementById("cfg-glow-intensity").value;
            
            state.appearance = {
                themeName: preset,
                primaryColor,
                primaryColorRgb,
                secondaryColor,
                backgroundStyle,
                customBgColor,
                panelStyle,
                glowIntensity
            };
            
            saveState();
            if (window.applyAppearanceTheme) window.applyAppearanceTheme();
            showToast("Configurações de tema e aparência salvas com sucesso!", "success");
            if (window.renderPrecos) window.renderPrecos();
            renderApp();
        });
    }

    const printSettingsForm = document.getElementById("print-settings-form");
    if (printSettingsForm) {
        printSettingsForm.addEventListener("submit", (e) => {
            e.preventDefault();
            
            if (!state.printSettings) state.printSettings = {};
            state.printSettings.format = document.getElementById("cfg-print-format").value;
            state.printSettings.showLogo = document.getElementById("cfg-print-show-logo").checked;
            state.printSettings.showSignatures = document.getElementById("cfg-print-show-signatures").checked;
            
            saveState();
            showToast("Configurações de impressão salvas com sucesso!", "success");
            if (window.renderPrecos) window.renderPrecos();
        });
    }

    const btnToggleLogistics = document.getElementById("btn-toggle-logistics");
    if (btnToggleLogistics) {
        btnToggleLogistics.addEventListener("click", () => {
            if (window.toggleRentalLogisticsCalc) window.toggleRentalLogisticsCalc();
        });
    }

    const btnApplyLogistics = document.getElementById("btn-apply-logistics");
    if (btnApplyLogistics) {
        btnApplyLogistics.addEventListener("click", () => {
            if (window.applyCalculatedLogistics) window.applyCalculatedLogistics();
        });
    }

    const logInputs = [
        "logistics-distance",
        "logistics-avg-speed",
        "logistics-toll-base",
        "logistics-toll-multiplier",
        "logistics-fuel-price",
        "logistics-fuel-consumption",
        "logistics-markup-percent",
        "logistics-markup-fixed"
    ];
    logInputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener("input", () => {
                if (window.calculateRentalLogistics) window.calculateRentalLogistics();
            });
        }
    });

    const chkTollReturn = document.getElementById("logistics-toll-return");
    if (chkTollReturn) {
        chkTollReturn.addEventListener("change", () => {
            if (window.calculateRentalLogistics) window.calculateRentalLogistics();
        });
    }

    const btnToggleDocLogistics = document.getElementById("btn-toggle-doc-logistics");
    if (btnToggleDocLogistics) {
        btnToggleDocLogistics.addEventListener("click", () => {
            if (window.toggleDocLogisticsCalc) window.toggleDocLogisticsCalc();
        });
    }

    const btnApplyDocLogistics = document.getElementById("btn-apply-doc-logistics");
    if (btnApplyDocLogistics) {
        btnApplyDocLogistics.addEventListener("click", () => {
            if (window.applyDocCalculatedLogistics) window.applyDocCalculatedLogistics();
        });
    }

    const selectDocVehicleType = document.getElementById("doc-logistics-vehicle-type");
    if (selectDocVehicleType) {
        selectDocVehicleType.addEventListener("change", () => {
            if (window.updateDocLogisticsTollMultiplier) window.updateDocLogisticsTollMultiplier();
        });
    }

    const selectDocOpType = document.getElementById("doc-logistics-op-type");
    if (selectDocOpType) {
        selectDocOpType.addEventListener("change", () => {
            if (window.calculateDocLogistics) window.calculateDocLogistics();
        });
    }

    const docLogInputs = [
        "doc-logistics-distance",
        "doc-logistics-avg-speed",
        "doc-logistics-toll-base",
        "doc-logistics-toll-multiplier",
        "doc-logistics-fuel-price",
        "doc-logistics-fuel-consumption",
        "doc-logistics-markup-percent",
        "doc-logistics-markup-fixed"
    ];
    docLogInputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener("input", () => {
                if (window.calculateDocLogistics) window.calculateDocLogistics();
            });
        }
    });

    const chkDocTollReturn = document.getElementById("doc-logistics-toll-return");
    if (chkDocTollReturn) {
        chkDocTollReturn.addEventListener("change", () => {
            if (window.calculateDocLogistics) window.calculateDocLogistics();
        });
    }

    const rentalAddressInput = document.getElementById("rental-address");
    if (rentalAddressInput) {
        rentalAddressInput.addEventListener("change", () => {
            if (window.fetchRentalRouteDistance) window.fetchRentalRouteDistance(true);
        });
    }

    const docAddressInput = document.getElementById("doc-address");
    if (docAddressInput) {
        docAddressInput.addEventListener("change", () => {
            if (window.fetchDocRouteDistance) window.fetchDocRouteDistance(true);
        });
    }
}

export function openModal(modalId) {
    const el = document.getElementById(modalId);
    if (el) el.classList.add("active");
}

export function closeModal(modalId) {
    const el = document.getElementById(modalId);
    if (el) el.classList.remove("active");
}

export function toggleHighContrastTheme() {
    const isContrast = document.body.classList.toggle("theme-high-contrast");
    localStorage.setItem("highContrastTheme", isContrast ? "enabled" : "disabled");
    const btn = document.getElementById("btn-toggle-contrast");
    if (btn) {
        btn.innerHTML = isContrast ? '<i data-lucide="moon"></i>' : '<i data-lucide="sun"></i>';
        if (window.lucide) window.lucide.createIcons();
    }
}

export function renderOrderModalProducts() {
    const container = document.getElementById("order-products-container");
    if (!container) return;

    const activeProds = state.products.filter(p => p.active && (p.type === 'Gelo' || p.type === 'Carvão' || p.type === 'Gelo Saborizado'));

    if (activeProds.length === 0) {
        container.innerHTML = `<p style="font-size: 0.8rem; color: var(--color-text-muted); text-align: center; grid-column: 1 / -1; padding: 0.5rem 0;">Nenhum produto de Gelo, Carvão ou Gelo Saborizado cadastrado no catálogo.</p>`;
        return;
    }

    const clientId = document.getElementById("order-client-id") ? document.getElementById("order-client-id").value : "";
    const currentTemp = (state.weatherConfig && state.weatherConfig.temp) !== undefined ? state.weatherConfig.temp : 24;
    const suggestions = (clientId && window.predictClientDemand) ? window.predictClientDemand(clientId, currentTemp) : {};

    let html = "";
    activeProds.forEach(p => {
        const suggestedQty = suggestions[p.id] || 0;
        if (p.type === 'Gelo Saborizado') {
            const badgeHTML = suggestedQty > 0 ? `
                <span class="climatological-suggestion-badge" 
                      onclick="document.getElementById('req-${p.id}').value = ${suggestedQty};" 
                      style="cursor: pointer; font-size: 0.6rem; background: rgba(0, 240, 255, 0.15); border: 1px solid var(--color-primary); color: var(--color-primary); padding: 1px 4px; border-radius: 4px; display: inline-flex; align-items: center; gap: 2px;" 
                      title="Sugerido: ${suggestedQty} fardos a ${currentTemp}°C">
                    💡 Sugerido: ${suggestedQty} f
                </span>
            ` : '';

            html += `
                <div style="grid-column: span 2; display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; border: 1px solid rgba(255,255,255,0.08); padding: 8px; border-radius: 6px; background: rgba(0,240,255,0.03);">
                    <div style="grid-column: span 2; font-size: 0.75rem; font-weight: bold; color: var(--color-primary); white-space: normal; line-height: 1.2; word-break: break-word;" title="${p.name}">
                        ${p.name}
                    </div>
                    <div class="form-group" style="margin-bottom: 0;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
                            <label for="req-${p.id}" style="font-size: 0.65rem; color: var(--color-text-muted); margin-bottom: 0;">Fardos (12 un)</label>
                            ${badgeHTML}
                        </div>
                        <input type="number" id="req-${p.id}" class="form-control order-req-input" data-prod-id="${p.id}" min="0" value="0" required style="padding: 4px 6px; font-size: 0.8rem;">
                    </div>
                    <div class="form-group" style="margin-bottom: 0;">
                        <label for="req-${p.id}_unit" style="font-size: 0.65rem; color: var(--color-text-muted); display: block; margin-bottom: 2px;">Unidades (1 un)</label>
                        <input type="number" id="req-${p.id}_unit" class="form-control order-req-unit-input" data-prod-id="${p.id}_unit" min="0" value="0" required style="padding: 4px 6px; font-size: 0.8rem;">
                    </div>
                </div>
            `;
        } else {
            const badgeHTML = suggestedQty > 0 ? `
                <span class="climatological-suggestion-badge" 
                      onclick="document.getElementById('req-${p.id}').value = ${suggestedQty};" 
                      style="cursor: pointer; font-size: 0.65rem; background: rgba(0, 240, 255, 0.15); border: 1px solid var(--color-primary); color: var(--color-primary); padding: 2px 6px; border-radius: 4px; display: inline-flex; align-items: center; gap: 4px; align-self: flex-start; margin-top: 4px;" 
                      title="Clique para preencher sugestão climatológica de ${suggestedQty} fardos para ${currentTemp}°C">
                    💡 Sugestão Clima: ${suggestedQty} fardos (a ${currentTemp}°C)
                </span>
            ` : '';

            html += `
                <div class="form-group" style="display: flex; flex-direction: column; justify-content: space-between;">
                    <div style="display: flex; flex-direction: column; gap: 2px;">
                        <label for="req-${p.id}" style="font-size: 0.75rem; white-space: normal; line-height: 1.2; word-break: break-word;" title="${p.name}">${p.name}</label>
                        ${badgeHTML}
                    </div>
                    <input type="number" id="req-${p.id}" class="form-control order-req-input" data-prod-id="${p.id}" min="0" value="0" required style="padding: 6px 8px; font-size: 0.85rem; width: 100%; margin-top: 4px;">
                </div>
            `;
        }
    });
    container.innerHTML = html;
}

export function switchPWATab(tabId) {
    const contents = document.querySelectorAll(".pwa-tab-content");
    contents.forEach(content => {
        if (content.id === tabId) {
            content.style.display = "block";
        } else {
            content.style.display = "none";
        }
    });

    const buttons = document.querySelectorAll(".pwa-tab-btn");
    buttons.forEach(btn => {
        const onClickAttr = btn.getAttribute("onclick") || "";
        if (onClickAttr.includes(`'${tabId}'`) || onClickAttr.includes(`"${tabId}"`)) {
            btn.classList.add("active");
            btn.style.borderBottom = "2px solid var(--color-primary)";
            btn.style.color = "#fff";
        } else {
            btn.classList.remove("active");
            btn.style.borderBottom = "2px solid transparent";
            btn.style.color = "var(--color-text-muted)";
        }
    });
}

export function copyGitHubLink() {
    const urlInput = document.getElementById("github-pages-url");
    if (urlInput) {
        urlInput.select();
        urlInput.setSelectionRange(0, 99999);
        navigator.clipboard.writeText(urlInput.value)
            .then(() => showToast("Link copiado com sucesso!", "success"))
            .catch(() => showToast("Falha ao copiar o link.", "error"));
    }
}

export function initGitHubQRCode() {
    const qrContainer = document.getElementById("github-qr-code");
    if (qrContainer) {
        qrContainer.innerHTML = "";
        try {
            new QRCode(qrContainer, {
                text: "https://gelodovale.github.io/gelodovale-app/",
                width: 128,
                height: 128,
                colorDark: "#090d16",
                colorLight: "#ffffff"
            });
        } catch (e) {
            console.error("Erro ao gerar QR Code do GitHub:", e);
        }
    }
}

export function autoFillFirebaseSettings() {
    if (!state.firebaseConfig) {
        state.firebaseConfig = {};
    }
    state.firebaseConfig.enabled = true;
    state.firebaseConfig.apiKey = "AIzaSyBfY-uWaXBHNSheNeCsTyMnc6L_yRtcLtE";
    state.firebaseConfig.projectId = "gelo-do-vale";
    state.firebaseConfig.databaseURL = "https://gelo-do-vale-default-rtdb.firebaseio.com";
    state.firebaseConfig.deviceKey = "gelodovale_oficial";
    
    // Atualiza os inputs na tela se o usuário estiver visualizando
    const fbEnabled = document.getElementById("cfg-fb-enabled");
    if (fbEnabled) fbEnabled.checked = true;
    
    const fbApiKey = document.getElementById("cfg-fb-api-key");
    if (fbApiKey) fbApiKey.value = state.firebaseConfig.apiKey;
    
    const fbProjectId = document.getElementById("cfg-fb-project-id");
    if (fbProjectId) fbProjectId.value = state.firebaseConfig.projectId;
    
    const fbDbUrl = document.getElementById("cfg-fb-db-url");
    if (fbDbUrl) fbDbUrl.value = state.firebaseConfig.databaseURL;
    
    const fbDeviceKey = document.getElementById("cfg-fb-device-key");
    if (fbDeviceKey) fbDeviceKey.value = state.firebaseConfig.deviceKey;
    
    saveState();
    
    // Inicializar Firebase Sync
    if (window.initFirebase) {
        window.initFirebase(() => {
            showToast("Credenciais oficiais preenchidas e sincronização ativada com sucesso!", "success");
        });
    } else {
        showToast("Credenciais preenchidas e salvas! Recarregue a página para ativar.", "info");
    }
}

export function goToGitHubConfig() {
    // 1. Alternar para a aba principal de Configurações
    const precosTab = document.querySelector(".nav-item[data-tab='precos']");
    if (precosTab) {
        precosTab.click();
    }
    // 2. Alternar para a sub-aba de Segurança & Backup
    if (window.switchAdminSubTab) {
        window.switchAdminSubTab("tab-seguranca-backup");
    }
}

// Bind methods to window for inline HTML event access
window.loadState = loadState;
window.initNavigation = initNavigation;
window.updateHeaderForTab = updateHeaderForTab;
window.renderTabContent = renderTabContent;
window.renderApp = renderApp;
window.renderPedidos = renderPedidos;
window.getCurrentDayName = getCurrentDayName;
window.renderSuggestedVisits = renderSuggestedVisits;
window.openOrderModalForClient = openOrderModalForClient;
window.addSuggestedVisitsToRoute = addSuggestedVisitsToRoute;
window.openOrderModal = openOrderModal;
window.cancelOrder = cancelOrder;
window.cancelScheduledOrder = cancelScheduledOrder;
window.confirmScheduledDelivery = deliverOrder;
window.calculateProductRevenue = calculateProductRevenue;
window.getGPSLocation = getGPSLocation;
window.deductPackagingStock = deductPackagingStock;
window.deliverOrder = deliverOrder;
window.processDeliveryCheckout = processDeliveryCheckout;
window.deliverOrderWithDetails = deliverOrderWithDetails;
window.renderHistorico = renderHistorico;
window.deleteDelivery = deleteDelivery;
window.initHistoryFilters = initHistoryFilters;
window.initAllSearchFilters = initAllSearchFilters;
window.initForms = initForms;
window.openModal = openModal;
window.closeModal = closeModal;
window.toggleHighContrastTheme = toggleHighContrastTheme;
window.renderOrderModalProducts = renderOrderModalProducts;
window.switchPWATab = switchPWATab;
window.copyGitHubLink = copyGitHubLink;
window.initGitHubQRCode = initGitHubQRCode;
window.autoFillFirebaseSettings = autoFillFirebaseSettings;
window.goToGitHubConfig = goToGitHubConfig;

// ==========================================
// MERCADO PAGO INTEGRATION
// ==========================================
export async function generateMercadoPagoLink(title, amount) {
    if (!state.mercadoPago || !state.mercadoPago.enabled || !state.mercadoPago.accessToken) {
        showToast("A integração do Mercado Pago não está configurada ou ativada nas Configurações.", "warning");
        return null;
    }
    
    const token = state.mercadoPago.accessToken;
    const body = {
        items: [
            {
                title: title,
                quantity: 1,
                currency_id: "BRL",
                unit_price: Number(amount)
            }
        ],
        back_urls: {
            success: window.location.href,
            failure: window.location.href,
            pending: window.location.href
        },
        auto_return: "approved"
    };
    
    try {
        const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });
        
        const data = await response.json();
        if (data.init_point) {
            return data.init_point; // URL de checkout (Pix, Boleto, Cartão)
        } else {
            console.error("Erro MP:", data);
            showToast("Erro ao gerar link do Mercado Pago. Verifique se o Token é válido (Credenciais de Produção).", "error");
            return null;
        }
    } catch (err) {
        console.error(err);
        showToast("Erro de conexão com o Mercado Pago.", "error");
        return null;
    }
}
window.generateMercadoPagoLink = generateMercadoPagoLink;

export function initConnectionStatusMonitor() {
    const banner = document.getElementById("offline-status-banner");
    if (!banner) return;
    
    function updateStatus() {
        if (navigator.onLine) {
            const hasOfflineChanges = state.offlineChangesQueue && state.offlineChangesQueue.length > 0;
            if (hasOfflineChanges) {
                // Sincronização automática ao restabelecer a conexão
                if (window.confirmOfflineSyncAll) {
                    window.confirmOfflineSyncAll();
                } else {
                    state.offlineChangesQueue = [];
                    saveState();
                    banner.style.display = "none";
                    banner.onclick = null;
                    showToast("Alterações offline sincronizadas com sucesso com o banco de dados Firebase!", "success");
                    renderApp();
                }
            } else {
                banner.style.display = "none";
                banner.onclick = null;
            }
        } else {
            // Estilo padrão offline (Vermelho/Glow)
            banner.style.background = "rgba(239, 68, 68, 0.15)";
            banner.style.borderBottom = "1px solid rgba(239, 68, 68, 0.3)";
            banner.style.color = "#ff4d4d";
            banner.style.boxShadow = "0 4px 15px rgba(239,68,68,0.15)";
            banner.style.display = "flex";
            banner.style.cursor = "default";
            banner.onclick = null;
            
            banner.innerHTML = `
                <i data-lucide="wifi-off" style="width: 16px; height: 16px;"></i>
                <span>Você está operando offline. Alterações serão salvas localmente e sincronizadas quando restabelecer a conexão.</span>
            `;
            if (window.lucide) window.lucide.createIcons();
        }
    }
    
    window.addEventListener("online", updateStatus);
    window.addEventListener("offline", updateStatus);
    updateStatus();
}
window.initConnectionStatusMonitor = initConnectionStatusMonitor;

window.openOfflineSyncModal = function() {
    const modal = document.getElementById("modal-offline-sync");
    const list = document.getElementById("offline-changes-list");
    if (!modal || !list) return;
    
    const queue = state.offlineChangesQueue || [];
    if (queue.length === 0) {
        showToast("Nenhuma alteração offline pendente de sincronização.", "warning");
        return;
    }
    
    list.innerHTML = queue.map(item => {
        const timeStr = new Date(item.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        let iconName = "edit-3";
        if (item.desc.includes("Pedido")) iconName = "shopping-cart";
        else if (item.desc.includes("Entrega")) iconName = "truck";
        else if (item.desc.includes("Cliente")) iconName = "user-plus";
        else if (item.desc.includes("Tina") || item.desc.includes("Comodato")) iconName = "file-text";
        else if (item.desc.includes("Documento")) iconName = "file-check";
        else if (item.desc.includes("Freezer")) iconName = "box";
        else if (item.desc.includes("Removido") || item.desc.includes("Excluída")) iconName = "trash-2";
        
        return `
            <li style="display: flex; align-items: center; gap: 8px; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.03); padding-bottom: 4px;">
                <span style="display: inline-flex; align-items: center; gap: 6px;">
                    <i data-lucide="${iconName}" style="width: 13px; height: 13px; color: var(--color-primary);"></i>
                    <span style="color: #fff; font-size: 0.8rem;">${item.desc}</span>
                </span>
                <span style="font-size: 0.7rem; color: var(--color-text-muted); font-family: monospace;">[${timeStr}]</span>
            </li>
        `;
    }).join('');
    
    modal.style.display = "flex";
    if (window.lucide) window.lucide.createIcons();
};

window.confirmOfflineSyncAll = function() {
    if (!navigator.onLine) {
        showToast("Você ainda está offline. Conecte-se à internet para sincronizar!", "error");
        return;
    }
    
    // Limpar fila e sincronizar
    state.offlineChangesQueue = [];
    saveState(); // Isso atualizará local e disparará pushToFirebase()
    
    // Fechar modal
    closeModal("modal-offline-sync");
    
    // Ocultar banner
    const banner = document.getElementById("offline-status-banner");
    if (banner) {
        banner.style.display = "none";
        banner.onclick = null;
    }
    
    // Feedback visual
    showToast("Alterações offline sincronizadas com sucesso com o banco de dados Firebase!", "success");
    
    // Re-render
    renderApp();
};
 
export function triggerLocalPixForCheckout() {
    const orderId = document.getElementById("checkout-order-id").value;
    const order = (state.orders || []).find(o => o.id === orderId);
    if (!order) return;
    
    const client = (state.clients || []).find(c => c.id === order.clientId);
    const clientName = client ? client.name : (order.clientName || "Cliente");
    const total = order.total || 0;
    
    if (window.showLocalPixModal) {
        window.showLocalPixModal(clientName, total);
    }
}
window.triggerLocalPixForCheckout = triggerLocalPixForCheckout;
window.openCarneModal = openCarneModal;
window.renderTopDevedores = renderTopDevedores;
window.renderCarneList = renderCarneList;
window.addCarneEntry = addCarneEntry;
window.payCarneEntry = payCarneEntry;
window.deleteCarneEntry = deleteCarneEntry;

// --- OBSERVAÇÕES DO CLIENTE ---
export function addClientNote(clientId, text) {
    const client = (state.clients || []).find(c => c.id === clientId);
    if (!client || !text.trim()) return;
    if (!client.notes) client.notes = [];
    const user = (state.users && state.currentUser) ? (state.users.find(u => u.id === state.currentUser) || {}).name || 'Admin' : 'Admin';
    client.notes.unshift({
        id: 'n-' + Date.now(),
        text: text.trim(),
        date: new Date().toISOString(),
        author: user
    });
    saveState();
    renderClientNotesSection(clientId);
    const input = document.getElementById('client-note-input');
    if (input) input.value = '';
    showToast('Observação salva!', 'success');
}

export function deleteClientNote(clientId, noteId) {
    const client = (state.clients || []).find(c => c.id === clientId);
    if (!client || !client.notes) return;
    client.notes = client.notes.filter(n => n.id !== noteId);
    saveState();
    renderClientNotesSection(clientId);
}

export function renderClientNotesSection(clientId) {
    const container = document.getElementById('client-notes-list');
    if (!container) return;
    const client = (state.clients || []).find(c => c.id === clientId);
    if (!client) return;
    const notes = client.notes || [];
    if (notes.length === 0) {
        container.innerHTML = '<p style="color: var(--color-text-muted); font-size: 0.78rem; text-align: center; padding: 8px;">Nenhuma observação registrada.</p>';
        return;
    }
    container.innerHTML = notes.map(n => {
        const dt = new Date(n.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
        return `
        <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 7px; padding: 8px 10px; margin-bottom: 6px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
                <p style="font-size: 0.8rem; color: #fff; margin: 0; flex: 1; line-height: 1.4;">${n.text}</p>
                <button onclick="deleteClientNote('${clientId}', '${n.id}')" style="background: transparent; border: none; color: #ef4444; cursor: pointer; font-size: 0.8rem; padding: 0; flex-shrink: 0;" title="Excluir">✕</button>
            </div>
            <div style="font-size: 0.68rem; color: var(--color-text-muted); margin-top: 4px;">${n.author} • ${dt}</div>
        </div>`;
    }).join('');
}

window.addClientNote = addClientNote;
window.deleteClientNote = deleteClientNote;
window.renderClientNotesSection = renderClientNotesSection;

// ==========================================
// FECHAMENTO DE CAIXA DIÁRIO
// ==========================================
export function openCaixaDiario() {
    const modal = document.getElementById('modal-caixa-diario');
    if (!modal) return;
    renderCaixaDiario();
    modal.classList.add('active');
}

export function renderCaixaDiario() {
    const today = new Date().toISOString().split('T')[0];
    const todayDeliveries = (state.deliveries || []).filter(d => {
        if (!d.date) return false;
        return d.date.startsWith(today);
    });

    // Totais por método de pagamento
    const byMethod = {};
    todayDeliveries.forEach(d => {
        const method = d.paymentMethod || 'Não informado';
        byMethod[method] = (byMethod[method] || 0) + (parseFloat(d.revenue) || 0);
    });

    // Totais por produto
    const byProduct = {};
    todayDeliveries.forEach(d => {
        (state.products || []).forEach(p => {
            const qty = (d.items && d.items[p.id]) || 0;
            const qtyUnit = (d.items && d.items[p.id + '_unit']) || 0;
            if (qty > 0 || qtyUnit > 0) {
                if (!byProduct[p.name]) byProduct[p.name] = { qty: 0, qtyUnit: 0, revenue: 0 };
                byProduct[p.name].qty += qty;
                byProduct[p.name].qtyUnit += qtyUnit;
                // Calcular receita estimada do produto
                const price = p.defaultPrice || 0;
                const unitPrice = p.unitPrice || 0;
                byProduct[p.name].revenue += qty * price + qtyUnit * unitPrice;
            }
        });
    });

    const totalDay = todayDeliveries.reduce((sum, d) => sum + (parseFloat(d.revenue) || 0), 0);
    const totalOrders = todayDeliveries.length;

    // Renderizar totais por método
    const methodColors = { 'Dinheiro': '#10b981', 'Pix': '#6366f1', 'Cartão': '#f59e0b', 'A Prazo': '#ef4444' };
    let methodHTML = '';
    if (Object.keys(byMethod).length === 0) {
        methodHTML = '<p style="color: var(--color-text-muted); text-align: center; padding: 10px;">Nenhuma venda registrada hoje.</p>';
    } else {
        Object.entries(byMethod).sort((a, b) => b[1] - a[1]).forEach(([method, total]) => {
            const color = methodColors[method] || 'var(--color-primary)';
            methodHTML += `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; background: rgba(255,255,255,0.02); border-radius: 6px; border-left: 3px solid ${color};">
                    <span style="font-size: 0.85rem; color: #fff; font-weight: 600;">${method}</span>
                    <span style="font-size: 1rem; font-weight: 800; color: ${color};">R$ ${total.toFixed(2).replace('.', ',')}</span>
                </div>`;
        });
    }

    // Renderizar totais por produto
    let productHTML = '';
    Object.entries(byProduct).forEach(([name, data]) => {
        const qtyStr = data.qty > 0 ? `${data.qty} fardo${data.qty > 1 ? 's' : ''}` : '';
        const unitStr = data.qtyUnit > 0 ? `${data.qtyUnit} un.` : '';
        const qtyDisplay = [qtyStr, unitStr].filter(Boolean).join(' + ');
        productHTML += `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.04); font-size: 0.8rem;">
                <span style="color: #fff;">${name}</span>
                <span style="color: var(--color-text-muted); font-size: 0.75rem;">${qtyDisplay}</span>
            </div>`;
    });
    if (!productHTML) productHTML = '<p style="color: var(--color-text-muted); text-align: center; font-size: 0.8rem;">Nenhum produto vendido hoje.</p>';

    // Injetar tudo no modal
    const container = document.getElementById('caixa-diario-content');
    if (!container) return;

    const dateDisplay = new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    container.innerHTML = `
        <div style="text-align: center; margin-bottom: 1rem;">
            <p style="font-size: 0.75rem; color: var(--color-text-muted); text-transform: capitalize; margin: 0;">${dateDisplay}</p>
            <div style="font-size: 2rem; font-weight: 900; color: var(--color-primary); text-shadow: 0 0 16px rgba(var(--color-primary-rgb),0.4); margin: 4px 0;">R$ ${totalDay.toFixed(2).replace('.', ',')}</div>
            <p style="font-size: 0.8rem; color: var(--color-text-muted);">${totalOrders} venda${totalOrders !== 1 ? 's' : ''} realizadas hoje</p>
        </div>
        <h4 style="font-size: 0.8rem; font-weight: 700; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin: 1rem 0 0.5rem;">Entradas por Forma de Pagamento</h4>
        <div style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 1rem;">${methodHTML}</div>
        <h4 style="font-size: 0.8rem; font-weight: 700; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin: 1rem 0 0.5rem;">Produtos Vendidos Hoje</h4>
        <div>${productHTML}</div>
    `;
}

export function shareCaixaWhatsApp() {
    const today = new Date().toISOString().split('T')[0];
    const todayDeliveries = (state.deliveries || []).filter(d => d.date && d.date.startsWith(today));
    const total = todayDeliveries.reduce((sum, d) => sum + (parseFloat(d.revenue) || 0), 0);
    const byMethod = {};
    todayDeliveries.forEach(d => {
        const m = d.paymentMethod || 'Outros';
        byMethod[m] = (byMethod[m] || 0) + (parseFloat(d.revenue) || 0);
    });
    const dateStr = new Date().toLocaleDateString('pt-BR');

    let text = `📊 *FECHAMENTO DE CAIXA - ${dateStr}*\n`;
    text += `*Gelo do Vale*\n\n`;
    text += `Total de vendas: ${todayDeliveries.length}\n`;
    text += `*Faturamento Total: R$ ${total.toFixed(2).replace('.', ',')}*\n\n`;
    text += `*Por Forma de Pagamento:*\n`;
    Object.entries(byMethod).forEach(([m, v]) => {
        text += `• ${m}: R$ ${v.toFixed(2).replace('.', ',')}\n`;
    });
    text += `\n✅ Fechamento realizado via GelControl`;

    if (navigator.onLine) {
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
    } else {
        navigator.clipboard.writeText(text).then(() => {
            window.showToast('Resumo copiado! Cole no WhatsApp quando tiver sinal.', 'info');
        });
    }
}

window.openCaixaDiario = openCaixaDiario;
window.renderCaixaDiario = renderCaixaDiario;
window.shareCaixaWhatsApp = shareCaixaWhatsApp;

// --- CENTRAL DE AJUDA, DÚVIDAS & SOLUÇÕES ---

export function updateSupportTabStatus() {
    const el = document.getElementById("support-ping-result");
    if (!el) return;
    if (navigator.onLine) {
        el.textContent = "Online (Pronto)";
        el.style.color = "#00ff64";
    } else {
        el.textContent = "Offline";
        el.style.color = "#ef4444";
    }
}

export async function testConnectionSpeed() {
    const el = document.getElementById("support-ping-result");
    if (!el) return;
    
    if (!navigator.onLine) {
        el.textContent = "Offline (Sem rede)";
        el.style.color = "#ef4444";
        showToast("Você está offline. Conecte-se à internet para testar.", "warning");
        return;
    }
    
    el.textContent = "Testando latência...";
    el.style.color = "#ffaa00";
    
    const startTime = Date.now();
    try {
        const fbUrl = (state.firebaseConfig && state.firebaseConfig.databaseURL) || "https://www.google.com";
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout
        
        await fetch(`${fbUrl}/.json?shallow=true`, { 
            method: 'GET',
            mode: 'no-cors',
            cache: 'no-store',
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        const duration = Date.now() - startTime;
        el.textContent = `Online (Ping: ${duration}ms)`;
        el.style.color = "#00ff64";
        showToast(`Conexão estável! Latência de rede: ${duration}ms`, "success");
    } catch (err) {
        const duration = Date.now() - startTime;
        if (err.name === 'AbortError') {
            el.textContent = "Tempo limite esgotado (>4s)";
            el.style.color = "#f59e0b";
            showToast("O teste de conexão demorou muito para responder.", "warning");
        } else {
            if (duration < 1000) {
                el.textContent = `Online (Ping: ${duration}ms)`;
                el.style.color = "#00ff64";
                showToast(`Conexão estabelecida! Latência: ${duration}ms`, "success");
            } else {
                el.textContent = "Falha no Ping";
                el.style.color = "#ef4444";
                showToast("Erro ao conectar ao banco de dados.", "error");
            }
        }
    }
}

export function runClientDiagnosticsFromSupport() {
    if (window.runFullDiagnostic) {
        const res = window.runFullDiagnostic();
        if (res.failed === 0) {
            showToast(`✨ Auto-Teste concluído: ${res.passed}/${res.total} testes passaram sem falhas! Todos os módulos estão funcionando perfeitamente.`, "success");
        } else {
            showToast(`⚠️ Auto-Teste concluído: Foram encontradas ${res.failed} falha(s). Verifique a aba de Configurações para mais detalhes.`, "warning");
        }
    } else {
        showToast("Módulo de diagnósticos não carregado.", "error");
    }
}

window.updateSupportTabStatus = updateSupportTabStatus;
window.testConnectionSpeed = testConnectionSpeed;
window.runClientDiagnosticsFromSupport = runClientDiagnosticsFromSupport;
