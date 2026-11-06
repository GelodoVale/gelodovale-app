
export function maskEmail(email) {
    if (!email || typeof email !== 'string' || !email.includes('@')) {
        return '<span style="color: var(--color-danger); font-size: 0.72rem;">Não configurado</span>';
    }
    const [local, domain] = email.split('@');
    if (local.length <= 2) return `${local[0]}***@${domain}`;
    return `${local.slice(0, 2)}***${local.slice(-1)}@${domain}`;
}
window.maskEmail = maskEmail;
// --- SISTEMA DE CONTROLE DE ACESSO POR NÍVEL (RBAC) & SEGURANÇA ROOT ---
// GelControl v85 - Arquitetura de Autenticação Segura Multi-PC
import { state, saveState } from './state.js';
import { stopQRScanner } from './inventario.js';
import { updateHeaderForTab, renderTabContent } from './app.js';
import { switchAdminSubTab } from './admin.js';

// Constantes de Política de Segurança
export const MAX_LOGIN_ATTEMPTS = 5;
export const LOCKOUT_DURATION_MS = 3 * 60 * 1000; // 3 minutos de bloqueio
export const SESSION_EXPIRY_MS = 12 * 60 * 60 * 1000; // 12 horas de sessão
let lockoutTimerInterval = null;

// ─── CRIPTOGRAFIA & DERIVAÇÃO DE SENHAS ─────────────────────────────────────
export function generateSecureSalt(length = 16) {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        const bytes = new Uint8Array(length);
        crypto.getRandomValues(bytes);
        return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
    }
    // Fallback pseudo-aleatório seguro
    let salt = '';
    for (let i = 0; i < length * 2; i++) {
        salt += Math.floor(Math.random() * 16).toString(16);
    }
    return salt;
}

export function hashPasswordWithSalt(password, salt, iterations = 1000) {
    if (!salt) salt = generateSecureSalt();
    let hash = sha256(salt + ':' + password);
    for (let i = 1; i < iterations; i++) {
        hash = sha256(hash + ':' + salt);
    }
    return `salted:${iterations}:${salt}:${hash}`;
}

export function verifyPassword(password, storedPassword) {
    if (!storedPassword || typeof storedPassword !== 'string') {
        return { match: false, needsUpgrade: false };
    }
    // 1. Formato moderno salt + multi-iterações
    if (storedPassword.startsWith('salted:')) {
        const parts = storedPassword.split(':');
        if (parts.length === 4) {
            const iterations = parseInt(parts[1], 10) || 1000;
            const salt = parts[2];
            const expectedHash = parts[3];
            let computed = sha256(salt + ':' + password);
            for (let i = 1; i < iterations; i++) {
                computed = sha256(computed + ':' + salt);
            }
            return { match: computed === expectedHash, needsUpgrade: false };
        }
    }
    // 2. Formato legado SHA-256 (64 hex)
    if (isHashed(storedPassword)) {
        const match = sha256(password) === storedPassword;
        return { match, needsUpgrade: match };
    }
    // 3. Formato texto plano legado (transição transparente)
    const match = password === storedPassword;
    return { match, needsUpgrade: match };
}

// ─── RATE LIMITING & LOCKOUT (PROTEÇÃO FORÇA BRUTA) ─────────────────────────
export function checkLoginLockout() {
    try {
        const lockoutUntil = parseInt(localStorage.getItem('gelcontrol_login_lockout_until') || '0', 10);
        const now = Date.now();
        if (lockoutUntil > now) {
            const remainingSeconds = Math.ceil((lockoutUntil - now) / 1000);
            return { locked: true, remainingSeconds };
        }
    } catch (e) {
        console.warn('[Security] Erro ao ler status de lockout:', e);
    }
    return { locked: false, remainingSeconds: 0 };
}

export function recordFailedLoginAttempt() {
    try {
        let attempts = parseInt(localStorage.getItem('gelcontrol_login_failed_attempts') || '0', 10) + 1;
        localStorage.setItem('gelcontrol_login_failed_attempts', attempts.toString());
        if (attempts >= MAX_LOGIN_ATTEMPTS) {
            const lockUntil = Date.now() + LOCKOUT_DURATION_MS;
            localStorage.setItem('gelcontrol_login_lockout_until', lockUntil.toString());
            return { locked: true, remainingSeconds: Math.ceil(LOCKOUT_DURATION_MS / 1000) };
        }
        return { locked: false, remainingAttempts: MAX_LOGIN_ATTEMPTS - attempts };
    } catch (e) {
        return { locked: false, remainingAttempts: 1 };
    }
}

export function clearLoginLockout() {
    try {
        localStorage.removeItem('gelcontrol_login_failed_attempts');
        localStorage.removeItem('gelcontrol_login_lockout_until');
        if (lockoutTimerInterval) {
            clearInterval(lockoutTimerInterval);
            lockoutTimerInterval = null;
        }
    } catch (e) {}
}

function updateLockoutUI(remainingSeconds) {
    const errorMsg = document.getElementById("login-error-msg");
    const pwdInput = document.getElementById("login-password");
    const submitBtn = document.querySelector("#app-login-form button[type='submit']");
    const selectEl = document.getElementById("login-user-select");

    if (errorMsg) {
        const minutes = Math.floor(remainingSeconds / 60);
        const seconds = remainingSeconds % 60;
        const timeStr = minutes > 0 ? `${minutes}m ${seconds.toString().padStart(2, '0')}s` : `${seconds}s`;
        errorMsg.innerText = `🛡️ Acesso bloqueado por segurança devido a tentativas incorretas. Tente novamente em ${timeStr}.`;
        errorMsg.style.display = "block";
        errorMsg.style.color = "var(--color-danger)";
    }
    if (pwdInput) {
        pwdInput.disabled = true;
    }
    if (selectEl) {
        selectEl.disabled = true;
    }
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.style.opacity = "0.5";
        submitBtn.style.cursor = "not-allowed";
    }

    if (!lockoutTimerInterval) {
        lockoutTimerInterval = setInterval(() => {
            const status = checkLoginLockout();
            if (status.locked) {
                updateLockoutUI(status.remainingSeconds);
            } else {
                clearInterval(lockoutTimerInterval);
                lockoutTimerInterval = null;
                if (errorMsg) {
                    errorMsg.style.display = "none";
                    errorMsg.innerText = "";
                }
                if (pwdInput) {
                    pwdInput.disabled = false;
                    pwdInput.focus();
                }
                if (selectEl) selectEl.disabled = false;
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.style.opacity = "1";
                    submitBtn.style.cursor = "pointer";
                }
            }
        }, 1000);
    }
}

// ─── GESTÃO DE SESSÃO & ANTI-TAMPERING ───────────────────────────────────────
export function createSession(user) {
    const isRoot = user.username === "admin";
    const issuedAt = Date.now();
    const expiresAt = issuedAt + SESSION_EXPIRY_MS;
    const sessionToken = sha256(`${user.id}:${user.username}:${issuedAt}:${Math.random()}`);
    
    const sessionData = {
        userId: user.id,
        username: user.username,
        name: user.name,
        isRoot: isRoot,
        issuedAt: issuedAt,
        expiresAt: expiresAt,
        token: sessionToken
    };

    try {
        sessionStorage.setItem("gelcontrol_session", JSON.stringify(sessionData));
        sessionStorage.setItem("currentUserId", user.id);
        if (isRoot) {
            sessionStorage.setItem("admin_authenticated", "true");
        } else {
            sessionStorage.removeItem("admin_authenticated");
        }
    } catch (e) {
        console.warn('[Security] Erro ao gravar dados de sessão:', e);
    }
    return sessionData;
}

export function getCurrentSession() {
    try {
        const raw = sessionStorage.getItem("gelcontrol_session");
        if (!raw) return null;
        const session = JSON.parse(raw);
        if (!session || typeof session !== 'object') return null;

        // Verificar expiração temporal
        if (!session.expiresAt || Date.now() > session.expiresAt) {
            console.warn('[Security] Sessão expirada.');
            logoutUser();
            return null;
        }

        // Integridade com a base de usuários atual
        const user = (state.users || []).find(u => u.id === session.userId);
        if (!user) {
            console.warn('[Security] Usuário da sessão não encontrado.');
            logoutUser();
            return null;
        }

        // Anti-tampering: se a flag diz que é Root mas o usuário na base não é 'admin', revogar imediatamente
        if (session.isRoot && user.username !== "admin") {
            console.error('[Security] 🚨 Violação de integridade detectada: usurpação de Root revogada.');
            logoutUser();
            return null;
        }

        return session;
    } catch (e) {
        return null;
    }
}

export function isCurrentUserRoot() {
    const session = getCurrentSession();
    if (!session || !session.isRoot || session.username !== "admin") {
        return false;
    }
    const user = (state.users || []).find(u => u.id === session.userId);
    return !!(user && user.username === "admin");
}

export function canUserPerformAction(actionType, resource = "") {
    if (isCurrentUserRoot()) return true;
    const session = getCurrentSession();
    if (!session || !session.userId) return false;
    const user = (state.users || []).find(u => u.id === session.userId);
    if (!user) return false;

    // Ações exclusivamente administrativas
    if (['manage_users', 'change_admin_security', 'factory_settings', 'restore_backup'].includes(actionType)) {
        return false;
    }

    if (resource) {
        const hasTabPerm = !!((user.permissions || {})["tab-" + resource]);
        const hasAdminTabPerm = !!((user.permissions || {})["admin-tab-" + resource]);
        if (!hasTabPerm && !hasAdminTabPerm) return false;
    }
    return true;
}

// ─── INICIALIZAÇÃO DE CONTROLE DE ACESSO ────────────────────────────────────
export function initUserAccessControl() {
    if (!state.users) {
        state.users = [];
    }
    
    // Remove invalid entries
    state.users = state.users.filter(u => u && typeof u === 'object' && u.username);
    
    // Inicializar permissões em todos os perfis
    state.users.forEach(u => {
        if (!u.permissions) u.permissions = {};
    });
    
    // Garantir que a conta Root do Administrador existe de forma íntegra
    let adminUser = state.users.find(u => u.username === "admin");
    if (!adminUser) {
        adminUser = {
            id: "admin",
            username: "admin",
            name: "Administrador",
            password: "",
            permissions: {}
        };
        state.users.unshift(adminUser);
    }
    
    // Identidade imutável do Root
    adminUser.id = "admin";
    adminUser.username = "admin";
    adminUser.name = "Administrador";
    
    // Preservar senha existente sem jamais reinicializar para senha de fábrica insegura
    if (!adminUser.password) {
        if (state.adminPassword) {
            adminUser.password = state.adminPassword;
        }
    }
    
    // O Administrador Root SEMPRE possui todas as permissões ativas
    adminUser.permissions = {
        "tab-dashboard": true,
        "tab-clientes": true,
        "tab-inventario": true,
        "tab-equipamentos": true,
        "tab-tinas": true,
        "tab-documentos": true,
        "tab-pedidos": true,
        "tab-historico": true,
        "tab-precos": true,
        "admin-tab-financeiro": true,
        "admin-tab-acerto": true,
        "admin-tab-contas-receber": true,
        "admin-tab-catalogo": true,
        "admin-tab-comodatos": true,
        "admin-tab-suprimentos": true,
        "admin-tab-precos": true,
        "admin-tab-dados-fabrica": true,
        "admin-tab-impressao": true,
        "admin-tab-seguranca-backup": true,
        "admin-tab-usuarios": true,
        "admin-tab-integracoes": true,
        "admin-tab-icones-emojis": true
    };

    // Inicializar configurações de segurança se ausentes
    if (!state.securitySettings) {
        state.securitySettings = {
            rootActivated: true,
            maxLoginAttempts: MAX_LOGIN_ATTEMPTS,
            lockoutDurationMinutes: 3,
            sessionTimeoutHours: 12
        };
    }
}

// ─── TELA DE LOGIN & PROCESSAMENTO ──────────────────────────────────────────
export function initLoginScreen() {
    const select = document.getElementById("login-user-select");
    if (select && state.users) {
        const currentSelectedId = select.value;
        const currentSelectedUser = state.users.find(u => u.id === currentSelectedId);
        const currentSelectedUsername = currentSelectedUser ? currentSelectedUser.username : null;

        select.innerHTML = state.users.map(u => `<option value="${u.id}">${u.name} (${u.username})</option>`).join("");
        
        if (currentSelectedUsername) {
            const newUser = state.users.find(u => u.username === currentSelectedUsername);
            if (newUser) {
                select.value = newUser.id;
            }
        }
    }
    
    initPasswordTogglers();
    
    const form = document.getElementById("app-login-form");
    if (form && (!form.dataset || !form.dataset.listenerAdded)) {
        if (!form.dataset) form.dataset = {};
        form.dataset.listenerAdded = 'true';
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            loginUser();
        });
    }

    // Verificar se o sistema está em período de bloqueio ativo
    const lockoutStatus = checkLoginLockout();
    if (lockoutStatus.locked) {
        updateLockoutUI(lockoutStatus.remainingSeconds);
    }
    
    // Verificar sessão ativa válida
    const session = getCurrentSession();
    if (session) {
        const user = state.users.find(u => u.id === session.userId);
        if (user) {
            const loginScreen = document.getElementById("app-login-screen");
            if (loginScreen) loginScreen.style.display = "none";
            
            const userDisplayName = document.getElementById("user-display-name");
            const userDisplayRole = document.getElementById("user-display-role");
            if (userDisplayName) userDisplayName.innerText = user.name;
            if (userDisplayRole) userDisplayRole.innerText = user.username === "admin" ? "Administrador" : "Colaborador";
            
            applyUserPermissions(user);
            return;
        }
    }
    
    const loginScreen = document.getElementById("app-login-screen");
    if (loginScreen) loginScreen.style.display = "flex";
}

export function initPasswordTogglers() {
    // Todos os botões de toggle de senha utilizam onclick="togglePasswordVisibility(...)" diretamente no HTML
}

export async function loginUser(userId, password) {
    // 1. Checagem prévia de lockout
    const lockoutStatus = checkLoginLockout();
    if (lockoutStatus.locked) {
        updateLockoutUI(lockoutStatus.remainingSeconds);
        return;
    }

    if (window.swRegistration) {
        window.swRegistration.update().catch(err => console.log('Erro ao atualizar SW no login:', err));
    }

    if (!userId) {
        const selectEl = document.getElementById("login-user-select");
        userId = selectEl ? selectEl.value : "";
    }
    if (password === undefined) {
        const pwdEl = document.getElementById("login-password");
        password = pwdEl ? pwdEl.value : "";
    }

    const user = (state.users || []).find(u => u.id === userId);
    if (!user) {
        const errorMsg = document.getElementById("login-error-msg");
        if (errorMsg) {
            errorMsg.innerText = "Perfil de acesso não encontrado.";
            errorMsg.style.display = "block";
        }
        return;
    }

    let authenticated = false;
    let authSource = 'local';

    const userEmail = (user.username === "admin" && state.factorySettings?.adminEmail) ? 
        state.factorySettings.adminEmail : 
        (user.email || null);

    // 2. INTEGRAÇÃO REAL COM FIREBASE AUTHENTICATION (QUANDO ONLINE)
    const isOnline = typeof navigator !== 'undefined' && navigator.onLine;
    const hasFirebaseAuth = window.firebase && window.firebase.auth;

    if (isOnline && hasFirebaseAuth && userEmail) {
        try {
            await window.firebase.auth().signInWithEmailAndPassword(userEmail, password);
            authenticated = true;
            authSource = 'firebase_auth';
            console.log(`[Security] ✅ Usuário '${user.username}' autenticado com sucesso via Firebase Auth.`);
            
            // Sincronizar hash local imediatamente com a nova senha validada pelo Firebase!
            user.password = hashPasswordWithSalt(password, generateSecureSalt());
            if (user.username === "admin") {
                state.adminPassword = user.password;
            }
            saveState();
        } catch (fbErr) {
            // Se o Firebase rejeitou explicitamente por credencial errada, a senha está incorreta
            if (fbErr.code === 'auth/wrong-password' || fbErr.code === 'auth/invalid-credential') {
                authenticated = false;
            } else {
                // Outros erros de rede ou conta ainda não sincronizada no Firebase Auth: fallback para validação local
                const verification = verifyPassword(password, user.password);
                authenticated = verification.match;
                if (authenticated && verification.needsUpgrade) {
                    user.password = hashPasswordWithSalt(password, generateSecureSalt());
                    if (user.username === "admin") state.adminPassword = user.password;
                    saveState();
                }
            }
        }
    } else {
        // 3. AUTENTICAÇÃO LOCAL (OFFLINE OU SEM FIREBASE CONFIGURADO)
        const verification = verifyPassword(password, user.password);
        authenticated = verification.match;
        if (authenticated && verification.needsUpgrade) {
            user.password = hashPasswordWithSalt(password, generateSecureSalt());
            if (user.username === "admin") state.adminPassword = user.password;
            saveState();
        }
    }

    if (authenticated) {
        // Limpar histórico de tentativas falhas
        clearLoginLockout();

        // Criar sessão segura
        createSession(user);
        
        const errMsgEl = document.getElementById("login-error-msg");
        if (errMsgEl) errMsgEl.style.display = "none";
        const loginPwdEl = document.getElementById("login-password");
        if (loginPwdEl) loginPwdEl.value = "";
        
        // Esconder tela de login
        const loginScreenEl = document.getElementById("app-login-screen");
        if (loginScreenEl) loginScreenEl.style.display = "none";
        
        // Atualizar exibição no cabeçalho/sidebar
        const userDisplayName = document.getElementById("user-display-name");
        const userDisplayRole = document.getElementById("user-display-role");
        if (userDisplayName) userDisplayName.innerText = user.name;
        if (userDisplayRole) userDisplayRole.innerText = user.username === "admin" ? "Administrador" : "Colaborador";
        
        // Aplicar controle de acesso visual
        applyUserPermissions(user);
        
        if (window.updateWeatherFromAPI) {
            window.updateWeatherFromAPI();
        }
        
        if (window.lucide) {
            window.lucide.createIcons();
        }
        
        // Redirecionamento seguro para aba acessível
        const activeNav = document.querySelector(".nav-item.active");
        const currentTab = activeNav ? activeNav.getAttribute("data-tab") : "dashboard";
        const hasAccess = (user.permissions || {})["tab-" + currentTab];
        
        if (!hasAccess) {
            const availableTab = Object.keys(user.permissions || {}).find(key => key.startsWith("tab-") && (user.permissions || {})[key] === true);
            if (availableTab) {
                const tabId = availableTab.replace("tab-", "");
                navigateToTab(tabId);
            }
        }
    } else {
        // Falha na autenticação: registrar e aplicar política de lockout
        const result = recordFailedLoginAttempt();
        if (result.locked) {
            updateLockoutUI(result.remainingSeconds);
        } else {
            const errorMsg = document.getElementById("login-error-msg");
            if (errorMsg) {
                errorMsg.innerText = `Senha incorreta! Tentativas restantes antes do bloqueio: ${result.remainingAttempts}`;
                errorMsg.style.display = "block";
                errorMsg.style.color = "var(--color-danger)";
            }
            const pwdInput = document.getElementById("login-password");
            if (pwdInput) {
                pwdInput.value = "";
                pwdInput.focus();
            }
        }
    }
}

export function logoutUser() {
    try {
        sessionStorage.removeItem("gelcontrol_session");
        sessionStorage.removeItem("currentUserId");
        sessionStorage.removeItem("admin_authenticated");
    } catch (e) {}
    
    const pwdEl = document.getElementById("login-password");
    if (pwdEl) {
        pwdEl.value = "";
        pwdEl.disabled = false;
    }
    const errEl = document.getElementById("login-error-msg");
    if (errEl) errEl.style.display = "none";
    
    const selectEl = document.getElementById("login-user-select");
    if (selectEl) {
        selectEl.disabled = false;
        if (selectEl.options.length > 0) selectEl.selectedIndex = 0;
    }
    
    const submitBtn = document.querySelector("#app-login-form button[type='submit']");
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.style.opacity = "1";
        submitBtn.style.cursor = "pointer";
    }

    const screenEl = document.getElementById("app-login-screen");
    if (screenEl) screenEl.style.display = "flex";

    // Verificar se estava bloqueado
    const lockoutStatus = checkLoginLockout();
    if (lockoutStatus.locked) {
        updateLockoutUI(lockoutStatus.remainingSeconds);
    }
}

// ─── APLICAÇÃO RIGOROSA DE PERMISSÕES (RBAC) ────────────────────────────────
export function applyUserPermissions(user) {
    if (!user) return;
    
    const isAdmin = user.username === "admin";

    // 1. Filtragem rigorosa do menu lateral
    const navItems = document.querySelectorAll(".nav-item");
    navItems.forEach(item => {
        const tabId = item.getAttribute("data-tab");
        const hasPerm = (user.permissions || {})["tab-" + tabId];
        if (hasPerm === false && !isAdmin) {
            item.style.display = "none";
        } else {
            item.style.display = "flex";
        }
    });
    
    // 2. Filtragem de abas administrativas (dentro de configurações)
    const adminMenuBtns = document.querySelectorAll(".admin-menu-btn");
    adminMenuBtns.forEach(btn => {
        const onclickAttr = btn.getAttribute("onclick") || "";
        const match = onclickAttr.match(new RegExp("switchAdminSubTab\\('([^']+)'\\)"));
        if (match && match[1]) {
            const subTabId = match[1];
            
            // USU-01 e USU-02 estritamente exclusivos do Administrador Root
            if (subTabId === "tab-usuarios" && !isAdmin) {
                btn.style.display = "none";
                return;
            }
            
            const hasPerm = (user.permissions || {})["admin-tab-" + subTabId.replace("tab-", "")];
            if (hasPerm === false && !isAdmin) {
                btn.style.display = "none";
            } else {
                btn.style.display = "flex";
            }
        }
    });

    // Ocultar seções vazias de submenu administrativo
    const adminMenuSections = document.querySelectorAll(".admin-menu-section");
    adminMenuSections.forEach(section => {
        const buttons = section.querySelectorAll(".admin-menu-btn");
        let anyVisible = false;
        buttons.forEach(btn => {
            if (btn.style.display !== "none") {
                anyVisible = true;
            }
        });
        if (!anyVisible) {
            section.style.display = "none";
        } else {
            section.style.display = "flex";
        }
    });
    
    // Redirecionamento seguro de sub-aba ativa se oculta
    if (window.activeAdminSubTab) {
        const activeBtn = document.querySelector(`.admin-menu-btn[onclick*="${window.activeAdminSubTab}"]`);
        if (activeBtn && activeBtn.style.display === "none") {
            const firstVisibleBtn = document.querySelector(".admin-menu-btn:not([style*='display: none'])");
            if (firstVisibleBtn) {
                const match = firstVisibleBtn.getAttribute("onclick").match(new RegExp("switchAdminSubTab\\('([^']+)'\\)"));
                if (match && match[1]) {
                    switchAdminSubTab(match[1]);
                }
            }
        }
    }

    // Bloqueio físico dos painéis USU-01 e USU-02 para não-administradores
    const adminSecPanel = document.getElementById("admin-security-settings-panel");
    const adminUsersPanel = document.getElementById("admin-users-management-panel");
    if (adminSecPanel) adminSecPanel.style.display = isAdmin ? "block" : "none";
    if (adminUsersPanel) adminUsersPanel.style.display = isAdmin ? "block" : "none";
}

export function navigateToTab(tabId) {
    const session = getCurrentSession();
    if (!session) {
        logoutUser();
        return;
    }
    const user = (state.users || []).find(u => u.id === session.userId);
    if (!user) {
        logoutUser();
        return;
    }

    // Verificação de permissão
    if (user.username !== "admin") {
        const hasPerm = (user.permissions || {})["tab-" + tabId];
        if (hasPerm === false) {
            if (window.showToast) {
                window.showToast("Acesso negado: seu perfil não tem permissão para acessar esta área.", "error");
            }
            return;
        }
    }

    const navItems = document.querySelectorAll(".nav-item");
    const tabContents = document.querySelectorAll(".tab-content");
    
    navItems.forEach(nav => nav.classList.remove("active"));
    const targetNav = document.querySelector(`.nav-item[data-tab="${tabId}"]`);
    if (targetNav) targetNav.classList.add("active");
    
    tabContents.forEach(content => {
        content.classList.remove("active");
        if (content.id === tabId) {
            content.classList.add("active");
        }
    });
    
    if (tabId !== "inventario") {
        stopQRScanner();
    }
    
    updateHeaderForTab(tabId);
    renderTabContent(tabId);
}

// ─── GERENCIAMENTO DE USUÁRIOS (EXCLUSIVO ROOT) ─────────────────────────────
export function renderUsersTable() {
    if (!isCurrentUserRoot()) {
        console.warn('[Security] Tentativa de renderizar tabela de usuários por perfil não-Root.');
        return;
    }

    const tbody = document.getElementById("users-table-body");
    if (!tbody) return;
    
    tbody.innerHTML = "";
    
    (state.users || []).forEach(user => {
        const isRoot = user.username === "admin";
        
        const activePerms = [];
        Object.keys(user.permissions || {}).forEach(key => {
            if (user.permissions[key]) {
                let friendlyName = key;
                if (key.startsWith("tab-")) {
                    friendlyName = key.replace("tab-", "Aba: ");
                } else if (key.startsWith("admin-tab-")) {
                    friendlyName = key.replace("admin-tab-", "Admin: ");
                }
                activePerms.push(friendlyName);
            }
        });
        
        let permsHTML = "";
        if (isRoot) {
            permsHTML = `<span class="badge" style="background: rgba(0, 240, 255, 0.1); color: var(--color-primary); border: 1px solid rgba(0, 240, 255, 0.2); font-size: 0.75rem; padding: 2px 6px; border-radius: 4px;">Acesso Total (Root)</span>`;
        } else if (activePerms.length === 0) {
            permsHTML = `<span class="badge" style="background: rgba(239, 68, 68, 0.1); color: var(--color-danger); border: 1px solid rgba(239, 68, 68, 0.2); font-size: 0.75rem; padding: 2px 6px; border-radius: 4px;">Sem Permissões</span>`;
        } else {
            const visiblePerms = activePerms.slice(0, 3).map(p => {
                let name = p;
                if (p === "Aba: dashboard") name = "Dashboard";
                else if (p === "Aba: clientes") name = "Clientes";
                else if (p === "Aba: inventario") name = "Inventário";
                else if (p === "Aba: tinas") name = "Aluguéis";
                else if (p === "Aba: documentos") name = "Documentos";
                else if (p === "Aba: pedidos") name = "Pedidos";
                else if (p === "Aba: historico") name = "Histórico";
                else if (p === "Aba: precos") name = "Ajustes";
                else if (p === "Admin: integracoes") name = "Adm Integrações";
                else if (p.startsWith("Admin: ")) name = p.replace("Admin: ", "Adm ");
                return `<span class="badge" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: var(--color-text-muted); margin-right: 4px; font-size: 0.75rem; padding: 2px 6px; border-radius: 4px; display: inline-block; margin-bottom: 2px;">${name}</span>`;
            }).join("");
            
            const extraCount = activePerms.length - 3;
            permsHTML = visiblePerms + (extraCount > 0 ? `<span class="badge" style="background: rgba(0, 240, 255, 0.05); color: var(--color-primary); font-size: 0.75rem; padding: 2px 6px; border-radius: 4px; display: inline-block;">+${extraCount}</span>` : "");
        }
        
        const row = document.createElement("tr");
        row.style.borderBottom = "1px solid rgba(255,255,255,0.05)";
        
        row.innerHTML = `
            <td style="padding: 12px 10px; font-weight: 600; color: #fff;">${user.name}</td>
            <td style="padding: 12px 10px; color: var(--color-text-muted);">${user.username}</td>
            <td style="padding: 12px 10px;">
                <span class="badge" style="background: ${isRoot ? 'rgba(0, 240, 255, 0.1)' : 'rgba(255, 255, 255, 0.03)'}; color: ${isRoot ? 'var(--color-primary)' : 'var(--color-text-muted)'}; font-weight: bold; font-size: 0.75rem; padding: 2px 6px; border-radius: 4px;">
                    ${isRoot ? 'Administrador Root' : 'Colaborador'}
                </span>
            </td>
            <td style="padding: 12px 10px; font-family: monospace; font-size: 0.8rem; color: var(--color-text-light);">${maskEmail(user.email || (isRoot ? (state.factorySettings?.adminEmail || 'contato@gelodovale.com.br') : ''))}</td>
            <td style="padding: 12px 10px;">${permsHTML}</td>
            <td style="padding: 12px 10px; text-align: right;">
                <div style="display: flex; gap: 8px; justify-content: flex-end;">
                    <button type="button" class="btn btn-secondary" onclick="openUserModal('${user.id}')" style="padding: 4px 8px; font-size: 0.75rem; display: inline-flex; align-items: center; gap: 4px;" title="Editar Usuário">
                        <i data-lucide="edit-3" style="width: 12px; height: 12px;"></i> Editar
                    </button>
                    <button type="button" class="btn btn-secondary" onclick="deleteUser('${user.id}')" style="padding: 4px 8px; font-size: 0.75rem; display: inline-flex; align-items: center; gap: 4px; color: var(--color-danger); border-color: rgba(239, 68, 68, 0.1);" ${isRoot ? 'disabled title="Administrador Root não pode ser excluído"' : 'title="Excluir Usuário"'}>
                        <i data-lucide="trash-2" style="width: 12px; height: 12px;"></i> Excluir
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

export function openUserModal(userId = "") {
    if (!isCurrentUserRoot()) {
        if (window.showToast) window.showToast("Acesso restrito ao Administrador Root.", "error");
        return;
    }

    const titleEl = document.getElementById("user-modal-title");
    const idInput = document.getElementById("form-user-id");
    const nameInput = document.getElementById("user-name");
    const usernameInput = document.getElementById("user-username");
    const passwordInput = document.getElementById("user-password");
    const selectAllCheckbox = document.getElementById("user-select-all");
    
    const userForm = document.getElementById("user-form");
    if (userForm) userForm.reset();
    
    const checkboxes = document.querySelectorAll(".perm-checkbox");
    checkboxes.forEach(cb => {
        cb.checked = false;
        cb.disabled = false;
    });
    if (selectAllCheckbox) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.disabled = false;
    }
    if (usernameInput) usernameInput.disabled = false;
    
    if (userId) {
        const user = (state.users || []).find(u => u.id === userId);
        if (!user) return;
        
        if (titleEl) titleEl.innerText = "Editar Usuário & Acessos";
        if (idInput) idInput.value = user.id;
        if (nameInput) nameInput.value = user.name;
        if (usernameInput) usernameInput.value = user.username;
        const emailInput = document.getElementById("user-email");
        if (emailInput) {
            emailInput.value = user.username === "admin" ? (state.factorySettings?.adminEmail || user.email || "") : (user.email || "");
            if (user.username === "admin") {
                emailInput.disabled = true;
                emailInput.title = "O e-mail do Root é gerenciado na janela USU-01";
            } else {
                emailInput.disabled = false;
                emailInput.title = "";
            }
        }
        if (passwordInput) {
            passwordInput.value = "";
            passwordInput.placeholder = "Deixe em branco para manter a atual";
        }
        
        checkboxes.forEach(cb => {
            const permKey = cb.getAttribute("data-perm");
            cb.checked = !!(user.permissions && user.permissions[permKey]);
        });
        
        if (user.username === "admin") {
            if (usernameInput) usernameInput.disabled = true;
            checkboxes.forEach(cb => {
                cb.checked = true;
                cb.disabled = true;
            });
            if (selectAllCheckbox) {
                selectAllCheckbox.checked = true;
                selectAllCheckbox.disabled = true;
            }
        }
    } else {
        if (titleEl) titleEl.innerText = "Cadastrar Novo Usuário";
        if (idInput) idInput.value = "";
        if (passwordInput) passwordInput.placeholder = "Mínimo 4 caracteres";
    }
    
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    if (allChecked && selectAllCheckbox) {
        selectAllCheckbox.checked = true;
    }
    
    const modalEl = document.getElementById("modal-user-form");
    if (modalEl) modalEl.classList.add("active");
}

export function saveUser(event) {
    if (event && event.preventDefault) event.preventDefault();
    
    // Verificação estrita de autorização Root
    if (!isCurrentUserRoot()) {
        if (window.showToast) window.showToast("Acesso negado: apenas o Administrador Root pode criar ou gerenciar usuários.", "error");
        return;
    }

    const id = document.getElementById("form-user-id").value;
    const name = document.getElementById("user-name").value.trim();
    const username = document.getElementById("user-username").value.trim().toLowerCase();
    const emailInput = document.getElementById("user-email");
    const email = emailInput ? emailInput.value.trim().toLowerCase() : "";
    const password = document.getElementById("user-password").value;

    if (!email || !email.includes("@") || !email.includes(".")) {
        if (window.showToast) window.showToast("Informe um e-mail de recuperação válido (SEG-EMAIL-01).", "warning");
        return;
    }

    const emailInUse = (state.users || []).find(u => (u.email === email || (u.username === "admin" && state.factorySettings?.adminEmail === email)) && u.id !== id);
    if (emailInUse && username !== "admin") {
        if (window.showToast) window.showToast("Este e-mail já está vinculado a outro perfil!", "error");
        return;
    }
    
    if (!name || !username || (!id && !password)) {
        if (window.showToast) window.showToast("Por favor, preencha todos os campos obrigatórios.", "warning");
        return;
    }
    if (password && password.length < 4) {
        if (window.showToast) window.showToast("A senha deve ter pelo menos 4 caracteres.", "warning");
        return;
    }
    
    // Não permitir duplicidade de username
    const existing = (state.users || []).find(u => u.username === username && u.id !== id);
    if (existing) {
        if (window.showToast) window.showToast("Este login (usuário) já está em uso por outro perfil!", "error");
        return;
    }
    
    const permissions = {};
    const checkboxes = document.querySelectorAll(".perm-checkbox");
    checkboxes.forEach(cb => {
        const permKey = cb.getAttribute("data-perm");
        permissions[permKey] = cb.checked;
    });
    
    // Derivação de senha com Salt robusto
    const hashedPassword = password ? hashPasswordWithSalt(password, generateSecureSalt()) : null;
    
    if (id) {
        const index = (state.users || []).findIndex(u => u.id === id);
        if (index !== -1) {
            if (state.users[index].username === "admin") {
                state.users[index].name = name;
                // O Root mantém login imutável 'admin'
                state.users[index].username = "admin";
                if (hashedPassword) {
                    state.users[index].password = hashedPassword;
                    state.adminPassword = hashedPassword;
                }
            } else {
                state.users[index].name = name;
                // Previne promoção arbitrária para username 'admin'
                if (username === "admin") {
                    if (window.showToast) window.showToast("O login 'admin' é exclusivo da conta Root.", "error");
                    return;
                }
                state.users[index].username = username;
                if (hashedPassword) {
                    state.users[index].password = hashedPassword;
                }
                state.users[index].permissions = permissions;
            }
        }
    } else {
        if (username === "admin") {
            if (window.showToast) window.showToast("A conta Root 'admin' já existe e é única.", "error");
            return;
        }
        const newUser = {
            id: "user_" + Date.now(),
            name: name,
            username: username,
            email: email,
            password: hashedPassword,
            permissions: permissions
        };
        state.users.push(newUser);
    }
    
    saveUserPostProcess(id, username);
}

function saveUserPostProcess(id, username) {
    saveState();
    if (window.closeModal) window.closeModal("modal-user-form");
    
    const select = document.getElementById("login-user-select");
    if (select) {
        select.innerHTML = state.users.map(u => `<option value="${u.id}">${u.name} (${u.username})</option>`).join("");
    }
    
    const session = getCurrentSession();
    if (session && session.userId === id) {
        const user = state.users.find(u => u.id === id);
        if (user) {
            applyUserPermissions(user);
        }
    }
    
    if (window.activeAdminSubTab === "tab-usuarios") {
        renderUsersTable();
    }
    
    if (window.showToast) window.showToast("Perfil de usuário salvo com sucesso!", "success");
}

export function deleteUser(userId) {
    // Verificação estrita de autorização Root
    if (!isCurrentUserRoot()) {
        if (window.showToast) window.showToast("Acesso negado: apenas o Administrador Root pode excluir usuários.", "error");
        return;
    }

    const user = (state.users || []).find(u => u.id === userId);
    if (!user) return;
    
    // Regra absoluta: a conta Root é protegida contra exclusão
    if (user.username === "admin") {
        if (window.showToast) window.showToast("O Administrador Root não pode ser excluído.", "error");
        return;
    }
    
    const confirmDelete = () => {
        state.users = (state.users || []).filter(u => u.id !== userId);
        saveState();
        
        const select = document.getElementById("login-user-select");
        if (select) {
            select.innerHTML = (state.users || []).map(u => `<option value="${u.id}">${u.name} (${u.username})</option>`).join("");
        }
        
        if (window.activeAdminSubTab === "tab-usuarios") {
            renderUsersTable();
        }
        
        if (window.showToast) window.showToast("Usuário excluído com sucesso!", "success");
    };

    if (window.showConfirm) {
        window.showConfirm(
            `Tem certeza que deseja excluir o usuário "${user.name}"? Esta ação removerá o acesso do colaborador.`,
            confirmDelete,
            null,
            "Excluir Usuário",
            "Excluir"
        );
    } else {
        if (confirm(`Tem certeza que deseja excluir o usuário "${user.name}"?`)) {
            confirmDelete();
        }
    }
}

export function toggleSelectAllPermissions(checked) {
    const idInput = document.getElementById("form-user-id");
    if (idInput && idInput.value) {
        const user = (state.users || []).find(u => u.id === idInput.value);
        if (user && user.username === "admin") return;
    }
    
    const checkboxes = document.querySelectorAll(".perm-checkbox");
    checkboxes.forEach(cb => {
        cb.checked = checked;
    });
}

// ─── ALTERAÇÃO SEGURA DE SENHA DO ROOT (USU-01) ────────────────────────────
export function changeAdminPassword(currentPwd, newPwd) {
    if (!isCurrentUserRoot()) {
        if (window.showToast) window.showToast("Acesso restrito ao Administrador Root.", "error");
        return { success: false, reason: "Apenas o Root pode alterar a senha administrativa." };
    }

    let adminUser = (state.users || []).find(u => u.username === "admin");
    if (!adminUser) {
        return { success: false, reason: "Usuário Root não localizado." };
    }

    // Validar senha atual
    const verification = verifyPassword(currentPwd, adminUser.password);
    if (!verification.match) {
        if (window.showToast) window.showToast("Senha atual incorreta!", "error");
        return { success: false, reason: "Senha atual incorreta." };
    }

    if (!newPwd || newPwd.length < 4) {
        if (window.showToast) window.showToast("A nova senha deve possuir pelo menos 4 caracteres!", "warning");
        return { success: false, reason: "Senha muito curta." };
    }

    // Gerar novo salt e hash
    const newSalt = generateSecureSalt();
    const newHashedPassword = hashPasswordWithSalt(newPwd, newSalt);
    adminUser.password = newHashedPassword;
    state.adminPassword = newHashedPassword;
    saveState();

    // Se conectado com Firebase Auth, sincronizar credencial remota
    if (window.firebase && window.firebase.auth && window.firebase.auth().currentUser) {
        window.firebase.auth().currentUser.updatePassword(newPwd)
            .then(() => console.log('[Security] Senha sincronizada com Firebase Auth com sucesso.'))
            .catch(err => console.warn('[Security] Não foi possível atualizar no Firebase Auth imediatamente:', err));
    }

    if (window.showToast) window.showToast("Senha de administrador atualizada com sucesso!", "success");
    return { success: true };
}

export function saveAdminRecoveryEmail() {
    if (!isCurrentUserRoot()) {
        if (window.showToast) window.showToast("Apenas o Administrador Root pode configurar o e-mail de recuperação.", "error");
        return;
    }
    const input = document.getElementById("cfg-admin-email");
    const val = input ? input.value.trim().toLowerCase() : "";
    if (!val || !val.includes("@")) {
        if (window.showToast) window.showToast("Informe um e-mail válido.", "warning");
        return;
    }
    if (!state.factorySettings) state.factorySettings = {};
    state.factorySettings.adminEmail = val;
    const adminUser = (state.users || []).find(u => u.username === "admin");
    if (adminUser) adminUser.email = val;
    saveState();
    if (window.showToast) window.showToast("E-mail de recuperação do Root salvo com sucesso!", "success");
}

// ─── RECUPERAÇÃO SEGURA DE ACESSO POR E-MAIL ────────────────────────────────
let lastRecoveryAttemptTimestamp = 0;

export function openRecoverAccessModal() {
    const modal = document.getElementById("modal-recover-access");
    if (modal) {
        modal.classList.add("active");
        const select = document.getElementById("recover-user-select");
        if (select && state.users) {
            select.innerHTML = state.users.map(u => `<option value="${u.id}">${u.name} (${u.username})</option>`).join("");
            const loginSelect = document.getElementById("login-user-select");
            if (loginSelect && loginSelect.value) {
                select.value = loginSelect.value;
            }
        }
        const emailInput = document.getElementById("recover-email-input");
        const feedback = document.getElementById("recover-feedback-msg");
        if (feedback) feedback.style.display = "none";
        if (emailInput) {
            emailInput.value = "";
            emailInput.focus();
        }
        if (window.lucide) window.lucide.createIcons();
    }
}

export function submitSecurePasswordRecovery() {
    const userSelect = document.getElementById("recover-user-select");
    const emailInput = document.getElementById("recover-email-input");
    const feedback = document.getElementById("recover-feedback-msg");
    const submitBtn = document.getElementById("btn-submit-recovery");

    const selectedUserId = userSelect ? userSelect.value : "";
    const enteredEmail = emailInput ? emailInput.value.trim().toLowerCase() : "";

    if (!selectedUserId || !enteredEmail) {
        if (feedback) {
            feedback.style.display = "block";
            feedback.style.background = "rgba(239, 68, 68, 0.1)";
            feedback.style.border = "1px solid rgba(239, 68, 68, 0.25)";
            feedback.style.color = "var(--color-danger)";
            feedback.innerText = "Por favor, selecione seu perfil e digite o e-mail cadastrado.";
        }
        return;
    }

    // Rate limiting para recuperação (mínimo 30 segundos entre solicitações)
    const now = Date.now();
    if (now - lastRecoveryAttemptTimestamp < 30000) {
        if (feedback) {
            feedback.style.display = "block";
            feedback.style.background = "rgba(245, 158, 11, 0.1)";
            feedback.style.border = "1px solid rgba(245, 158, 11, 0.25)";
            feedback.style.color = "#f59e0b";
            feedback.innerText = "Aguarde alguns segundos antes de solicitar um novo link de redefinição.";
        }
        return;
    }
    lastRecoveryAttemptTimestamp = now;

    // Verificar conectividade
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
        if (feedback) {
            feedback.style.display = "block";
            feedback.style.background = "rgba(239, 68, 68, 0.1)";
            feedback.style.border = "1px solid rgba(239, 68, 68, 0.25)";
            feedback.style.color = "var(--color-danger)";
            feedback.innerText = "⚠️ Você está offline. A recuperação segura de acesso requer conexão com a internet para comunicar com o servidor de autenticação.";
        }
        return;
    }

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<i data-lucide="loader" style="width: 14px; height: 14px; animation: spin 1s linear infinite;"></i> Enviando...`;
    }

    // REGRA SEG-EMAIL-01: Validar se o e-mail informado coincide exatamente com o da conta selecionada
    const user = (state.users || []).find(u => u.id === selectedUserId);
    let linkedEmail = "";
    if (user) {
        if (user.username === "admin") {
            linkedEmail = (state.factorySettings && state.factorySettings.adminEmail) || user.email || "";
        } else {
            linkedEmail = user.email || "";
        }
    }
    linkedEmail = linkedEmail.trim().toLowerCase();

    // Verificação estrita de correspondência de vínculo
    const isStrictMatch = user && linkedEmail && (enteredEmail === linkedEmail);

    const onFinish = () => {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `<i data-lucide="send" style="width: 14px; height: 14px;"></i> Enviar Link de Redefinição`;
        }
        if (feedback) {
            feedback.style.display = "block";
            feedback.style.background = "rgba(0, 240, 255, 0.08)";
            feedback.style.border = "1px solid rgba(0, 240, 255, 0.3)";
            feedback.style.color = "var(--color-primary)";
            feedback.innerHTML = `🛡️ Se os dados informados corresponderem ao perfil e ao e-mail cadastrado, o link seguro de uso único foi enviado. Verifique sua caixa de entrada e pasta de spam.`;
        }
        if (window.lucide) window.lucide.createIcons();
    };

    // Disparar via Firebase Auth SE E SOMENTE SE houver correspondência estrita
    if (isStrictMatch && window.firebase && window.firebase.auth) {
        window.firebase.auth().sendPasswordResetEmail(linkedEmail)
            .then(() => onFinish())
            .catch(err => {
                console.warn('[Security] Erro ao enviar redefinição pelo Firebase Auth:', err);
                onFinish();
            });
    } else {
        // Se NÃO coincidir: simula tempo e não envia nada (protegendo contra redirecionamento indevido!)
        setTimeout(onFinish, 1200);
    }
}

export function clearAppCacheAndReload() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
            for (let registration of registrations) {
                registration.unregister();
            }
        });
    }
    const reloadFresh = () => {
        try { sessionStorage.clear(); } catch (e) {}
        const freshUrl = window.location.origin + window.location.pathname + '?cb=' + Date.now();
        window.location.href = freshUrl;
    };
    if (window.caches) {
        caches.keys().then(keys => {
            return Promise.all(keys.map(key => caches.delete(key)));
        }).then(reloadFresh).catch(reloadFresh);
    } else {
        reloadFresh();
    }
}

// ─── BINDINGS GLOBAIS NO OBJETO WINDOW ──────────────────────────────────────
window.initUserAccessControl = initUserAccessControl;
window.initLoginScreen = initLoginScreen;
window.initPasswordTogglers = initPasswordTogglers;
window.loginUser = loginUser;
window.logoutUser = logoutUser;
window.applyUserPermissions = applyUserPermissions;
window.navigateToTab = navigateToTab;
window.renderUsersTable = renderUsersTable;
window.openUserModal = openUserModal;
window.saveUser = saveUser;
window.deleteUser = deleteUser;
window.toggleSelectAllPermissions = toggleSelectAllPermissions;
window.clearAppCacheAndReload = clearAppCacheAndReload;
window.isCurrentUserRoot = isCurrentUserRoot;
window.getCurrentSession = getCurrentSession;
window.canUserPerformAction = canUserPerformAction;
window.changeAdminPassword = changeAdminPassword;
window.openRecoverAccessModal = openRecoverAccessModal;
window.submitSecurePasswordRecovery = submitSecurePasswordRecovery;
window.saveAdminRecoveryEmail = saveAdminRecoveryEmail;
window.checkLoginLockout = checkLoginLockout;

// Algoritmo SHA-256 nativo compacto (FIPS 180-2 compliant)
export function sha256(ascii) {
    if (!ascii) return '';
    function rightRotate(value, amount) {
        return (value>>>amount) | (value<<(32-amount));
    }
    
    var mathPow = Math.pow;
    var maxWord = mathPow(2, 32);
    var lengthProperty = 'length';
    var i, j;

    var result = '';
    var words = [];
    var asciiLength = ascii[lengthProperty];
    
    var hash = sha256.h = sha256.h || [];
    var k = sha256.k = sha256.k || [];
    var primeCounter = k[lengthProperty];

    var isComposite = {};
    for (var candidate = 2; primeCounter < 64; candidate++) {
        if (!isComposite[candidate]) {
            for (i = 0; i < 313; i += candidate) {
                isComposite[i] = 1;
            }
            hash[primeCounter] = (mathPow(candidate, .5)*maxWord)|0;
            k[primeCounter++] = (mathPow(candidate, 1/3)*maxWord)|0;
        }
    }
    
    ascii += '\x80';
    while (ascii[lengthProperty] % 64 - 56) ascii += '\x00';
    
    for (i = 0; i < ascii[lengthProperty]; i++) {
        j = ascii.charCodeAt(i);
        if (j >> 8) return;
        words[i >> 2] |= j << (24 - (i % 4) * 8);
    }
    words[words[lengthProperty]] = ((asciiLength >>> 29) & 7);
    words[words[lengthProperty]] = (asciiLength << 3);
    
    var w = [];
    var hashCopy = hash.slice(0);

    for (var chunkStart = 0; chunkStart < words[lengthProperty]; chunkStart += 16) {
        var a = hash[0], b = hash[1], c = hash[2], d = hash[3], e = hash[4], f = hash[5], g = hash[6], h = hash[7];
        
        for (i = 0; i < 64; i++) {
            if (i < 16) {
                w[i] = words[chunkStart + i];
            } else {
                var s0 = rightRotate(w[i - 15], 7) ^ rightRotate(w[i - 15], 18) ^ (w[i - 15] >>> 3);
                var s1 = rightRotate(w[i - 2], 17) ^ rightRotate(w[i - 2], 19) ^ (w[i - 2] >>> 10);
                w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
            }
            
            var temp1 = (h + (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) + ((e & f) ^ (~e & g)) + k[i] + w[i]) | 0;
            var temp2 = ((rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) | 0;
            
            h = g;
            g = f;
            f = e;
            e = (d + temp1) | 0;
            d = c;
            c = b;
            b = a;
            a = (temp1 + temp2) | 0;
        }
        
        hash[0] = (hash[0] + a) | 0;
        hash[1] = (hash[1] + b) | 0;
        hash[2] = (hash[2] + c) | 0;
        hash[3] = (hash[3] + d) | 0;
        hash[4] = (hash[4] + e) | 0;
        hash[5] = (hash[5] + f) | 0;
        hash[6] = (hash[6] + g) | 0;
        hash[7] = (hash[7] + h) | 0;
    }
    
    for (i = 0; i < 8; i++) {
        var term = hash[i];
        hash[i] = hashCopy[i];
        for (j = 3; j + 1; j--) {
            var byte = (term >>> (j * 8)) & 255;
            result += (byte < 16 ? '0' : '') + byte.toString(16);
        }
    }
    return result;
}

export function isHashed(password) {
    return typeof password === 'string' && /^[0-9a-f]{64}$/.test(password);
}
