// --- SISTEMA DE CONTROLE DE ACESSO POR NÍVEL (RBAC) ---
import { state, saveState } from './state.js';
import { stopQRScanner } from './inventario.js';
import { updateHeaderForTab, renderTabContent } from './app.js';
import { switchAdminSubTab } from './admin.js';

export function initUserAccessControl() {
    if (!state.users) {
        state.users = [];
    }
    
    // Remove invalid entries
    state.users = state.users.filter(u => u && typeof u === 'object' && u.username);
    
    // Garantir que todos os usuários tenham o objeto de permissões inicializado
    state.users.forEach(u => {
        if (!u.permissions) u.permissions = {};
    });
    
    // Garantir que o admin existe
    let adminUser = state.users.find(u => u.username === "admin");
    if (!adminUser) {
        adminUser = {
            id: "admin",
            username: "admin",
            name: "Administrador",
            password: state.adminPassword || "1120M@z@dr1",
            permissions: {}
        };
        state.users.unshift(adminUser);
    }
    
    // Sempre forçar permissões do admin para true, e garantir que a senha está sincronizada
    adminUser.id = "admin";
    adminUser.username = "admin";
    adminUser.name = "Administrador";
    if (!adminUser.password) {
        adminUser.password = state.adminPassword || "1120M@z@dr1";
    } else {
        state.adminPassword = adminUser.password;
    }
    
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
        "admin-tab-integracoes": true
    };
}

export function initLoginScreen() {
    const select = document.getElementById("login-user-select");
    if (select && state.users) {
        const currentSelectedId = select.value;
        const currentSelectedUser = state.users.find(u => u.id === currentSelectedId);
        const currentSelectedUsername = currentSelectedUser ? currentSelectedUser.username : null;

        select.innerHTML = state.users.map(u => `<option value="${u.id}">${u.name} (${u.username})</option>`).join("");
        
        // Restaurar seleção pelo username se o ID mudou (ex: de user_admin_001 para admin)
        if (currentSelectedUsername) {
            const newUser = state.users.find(u => u.username === currentSelectedUsername);
            if (newUser) {
                select.value = newUser.id;
            }
        }
    }
    
    // Password visibility togglers
    initPasswordTogglers();
    
    // Handle login form submission
    const form = document.getElementById("app-login-form");
    if (form && !form.dataset.listenerAdded) {
        form.dataset.listenerAdded = 'true';
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            loginUser();
        });
    }
    
    // Check session on startup
    const currentUserId = sessionStorage.getItem("currentUserId");
    if (currentUserId && state.users) {
        const user = state.users.find(u => u.id === currentUserId);
        if (user) {
            document.getElementById("app-login-screen").style.display = "none";
            
            // Update user display name in sidebar
            const userDisplayName = document.getElementById("user-display-name");
            const userDisplayRole = document.getElementById("user-display-role");
            if (userDisplayName) userDisplayName.innerText = user.name;
            if (userDisplayRole) userDisplayRole.innerText = user.username === "admin" ? "Administrador" : "Colaborador";
            
            applyUserPermissions(user);
        } else {
            document.getElementById("app-login-screen").style.display = "flex";
        }
    } else {
        document.getElementById("app-login-screen").style.display = "flex";
    }
}

export function initPasswordTogglers() {
    const btnLogin = document.getElementById("btn-toggle-login-pwd");
    if (btnLogin) {
        btnLogin.addEventListener("click", () => {
            const input = document.getElementById("login-password");
            const icon = btnLogin.querySelector("i");
            if (input.type === "password") {
                input.type = "text";
                if (icon) icon.setAttribute("data-lucide", "eye-off");
            } else {
                input.type = "password";
                if (icon) icon.setAttribute("data-lucide", "eye");
            }
            if (window.lucide) window.lucide.createIcons();
        });
    }
    
    const btnModal = document.getElementById("btn-toggle-modal-pwd");
    if (btnModal) {
        btnModal.addEventListener("click", () => {
            const input = document.getElementById("user-password");
            const icon = btnModal.querySelector("i");
            if (input.type === "password") {
                input.type = "text";
                if (icon) icon.setAttribute("data-lucide", "eye-off");
            } else {
                input.type = "password";
                if (icon) icon.setAttribute("data-lucide", "eye");
            }
            if (window.lucide) window.lucide.createIcons();
        });
    }

    const btnCurrent = document.getElementById("btn-toggle-cfg-current-pwd");
    if (btnCurrent) {
        btnCurrent.addEventListener("click", () => {
            const input = document.getElementById("cfg-current-pwd");
            const icon = btnCurrent.querySelector("i");
            if (input.type === "password") {
                input.type = "text";
                if (icon) icon.setAttribute("data-lucide", "eye-off");
            } else {
                input.type = "password";
                if (icon) icon.setAttribute("data-lucide", "eye");
            }
            if (window.lucide) window.lucide.createIcons();
        });
    }

    const btnNew = document.getElementById("btn-toggle-cfg-new-pwd");
    if (btnNew) {
        btnNew.addEventListener("click", () => {
            const input = document.getElementById("cfg-new-pwd");
            const icon = btnNew.querySelector("i");
            if (input.type === "password") {
                input.type = "text";
                if (icon) icon.setAttribute("data-lucide", "eye-off");
            } else {
                input.type = "password";
                if (icon) icon.setAttribute("data-lucide", "eye");
            }
            if (window.lucide) window.lucide.createIcons();
        });
    }
}

export function loginUser(userId, password) {
    // Buscar atualizações do Service Worker ao fazer login
    if (window.swRegistration) {
        window.swRegistration.update().catch(err => console.log('Erro ao atualizar SW no login:', err));
    }

    // Se chamada sem argumentos (ex: submit do form), ler valores do DOM
    if (!userId) {
        const selectEl = document.getElementById("login-user-select");
        userId = selectEl ? selectEl.value : "";
    }
    if (password === undefined) {
        const pwdEl = document.getElementById("login-password");
        password = pwdEl ? pwdEl.value : "";
    }
    const user = state.users.find(u => u.id === userId);
    if (user && user.password === password) {
        sessionStorage.setItem("currentUserId", user.id);
        
        // If user is admin, also mark authenticated for settings
        if (user.username === "admin") {
            sessionStorage.setItem("admin_authenticated", "true");
        } else {
            sessionStorage.removeItem("admin_authenticated");
        }
        
        const errMsgEl = document.getElementById("login-error-msg");
        if (errMsgEl) errMsgEl.style.display = "none";
        const loginPwdEl = document.getElementById("login-password");
        if (loginPwdEl) loginPwdEl.value = "";
        
        // Hide login screen
        const loginScreenEl = document.getElementById("app-login-screen");
        if (loginScreenEl) loginScreenEl.style.display = "none";
        
        // Update user display name in sidebar
        const userDisplayName = document.getElementById("user-display-name");
        const userDisplayRole = document.getElementById("user-display-role");
        if (userDisplayName) userDisplayName.innerText = user.name;
        if (userDisplayRole) userDisplayRole.innerText = user.username === "admin" ? "Administrador" : "Colaborador";
        
        // Apply user permissions
        applyUserPermissions(user);
        
        if (window.lucide) {
            window.lucide.createIcons();
        }
        
        // Redirecionamento seguro se a aba ativa não for acessível
        const activeNav = document.querySelector(".nav-item.active");
        const currentTab = activeNav ? activeNav.getAttribute("data-tab") : "dashboard";
        const hasAccess = (user.permissions || {})["tab-" + currentTab];
        
        if (!hasAccess) {
            // Ir para a primeira aba disponível nas permissões dele
            const availableTab = Object.keys(user.permissions || {}).find(key => key.startsWith("tab-") && (user.permissions || {})[key] === true);
            if (availableTab) {
                const tabId = availableTab.replace("tab-", "");
                navigateToTab(tabId);
            }
        }
    } else {
        const errorMsg = document.getElementById("login-error-msg");
        if (errorMsg) {
            errorMsg.innerText = "Senha incorreta! Tente novamente.";
            errorMsg.style.display = "block";
        }
        const pwdInput = document.getElementById("login-password");
        if (pwdInput) {
            pwdInput.value = "";
            pwdInput.focus();
        }
    }
}

export function logoutUser() {
    sessionStorage.removeItem("currentUserId");
    sessionStorage.removeItem("admin_authenticated");
    
    // Reset login inputs
    const pwdEl = document.getElementById("login-password");
    if (pwdEl) pwdEl.value = "";
    const errEl = document.getElementById("login-error-msg");
    if (errEl) errEl.style.display = "none";
    
    // Resetar select para a primeira opção (evita mostrar usuário anterior)
    const selectEl = document.getElementById("login-user-select");
    if (selectEl && selectEl.options.length > 0) {
        selectEl.selectedIndex = 0;
    }
    
    // Show login screen
    const screenEl = document.getElementById("app-login-screen");
    if (screenEl) screenEl.style.display = "flex";
}

export function applyUserPermissions(user) {
    if (!user) return;
    
    // 1. Sidebar tabs filtering
    const navItems = document.querySelectorAll(".nav-item");
    navItems.forEach(item => {
        const tabId = item.getAttribute("data-tab");
        const hasPerm = (user.permissions || {})["tab-" + tabId];
        if (hasPerm === false) {
            item.style.display = "none";
        } else {
            item.style.display = "flex";
        }
    });
    
    // 2. Admin subtabs filtering (inside configurations tab)
    const adminMenuBtns = document.querySelectorAll(".admin-menu-btn");
    adminMenuBtns.forEach(btn => {
        const onclickAttr = btn.getAttribute("onclick") || "";
        const match = onclickAttr.match(new RegExp("switchAdminSubTab\\('([^']+)'\\)"));
        if (match && match[1]) {
            const subTabId = match[1];
            const hasPerm = (user.permissions || {})["admin-tab-" + subTabId.replace("tab-", "")];
            if (hasPerm === false) {
                btn.style.display = "none";
            } else {
                btn.style.display = "flex";
            }
        }
    });

    // Handle rendering of sub-tab categories (sections) if all buttons in them are hidden
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
    
    // Update active admin subtab if the current active one is hidden
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
}

export function navigateToTab(tabId) {
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

export function renderUsersTable() {
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
                    ${isRoot ? 'Administrador' : 'Colaborador'}
                </span>
            </td>
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
    const titleEl = document.getElementById("user-modal-title");
    const idInput = document.getElementById("form-user-id");
    const nameInput = document.getElementById("user-name");
    const usernameInput = document.getElementById("user-username");
    const passwordInput = document.getElementById("user-password");
    const selectAllCheckbox = document.getElementById("user-select-all");
    
    document.getElementById("user-form").reset();
    
    const checkboxes = document.querySelectorAll(".perm-checkbox");
    checkboxes.forEach(cb => {
        cb.checked = false;
        cb.disabled = false;
    });
    if (selectAllCheckbox) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.disabled = false;
    }
    usernameInput.disabled = false;
    
    if (userId) {
        const user = (state.users || []).find(u => u.id === userId);
        if (!user) return;
        
        titleEl.innerText = "Editar Usuário & Acessos";
        idInput.value = user.id;
        nameInput.value = user.name;
        usernameInput.value = user.username;
        passwordInput.value = user.password;
        
        checkboxes.forEach(cb => {
            const permKey = cb.getAttribute("data-perm");
            cb.checked = !!(user.permissions && user.permissions[permKey]);
        });
        
        if (user.username === "admin") {
            usernameInput.disabled = true;
            checkboxes.forEach(cb => {
                cb.checked = true;
                cb.disabled = true;
            });
            selectAllCheckbox.checked = true;
            selectAllCheckbox.disabled = true;
        }
    } else {
        titleEl.innerText = "Cadastrar Novo Usuário";
        idInput.value = "";
    }
    
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    if (allChecked) {
        selectAllCheckbox.checked = true;
    }
    
    document.getElementById("modal-user-form").classList.add("active");
}

export function saveUser(event) {
    event.preventDefault();
    
    const id = document.getElementById("form-user-id").value;
    const name = document.getElementById("user-name").value.trim();
    const username = document.getElementById("user-username").value.trim().toLowerCase();
    const password = document.getElementById("user-password").value;
    
    if (!name || !username || !password) {
        window.showToast("Por favor, preencha todos os campos obrigatórios.", "warning");
        return;
    }
    if (password && password.length < 4) {
        window.showToast("A senha deve ter pelo menos 4 caracteres.", "warning");
        return;
    }
    
    const existing = (state.users || []).find(u => u.username === username && u.id !== id);
    if (existing) {
        window.showToast("Este login (usuário) já está em uso por outro perfil!", "error");
        return;
    }
    
    const permissions = {};
    const checkboxes = document.querySelectorAll(".perm-checkbox");
    checkboxes.forEach(cb => {
        const permKey = cb.getAttribute("data-perm");
        permissions[permKey] = cb.checked;
    });
    
    if (id) {
        const index = (state.users || []).findIndex(u => u.id === id);
        if (index !== -1) {
            if (state.users[index].username === "admin") {
                state.users[index].name = name;
                state.users[index].password = password;
                state.adminPassword = password;
            } else {
                state.users[index].name = name;
                state.users[index].username = username;
                state.users[index].password = password;
                state.users[index].permissions = permissions;
            }
        }
    } else {
        const newUser = {
            id: "user_" + Date.now(),
            name: name,
            username: username,
            password: password,
            permissions: permissions
        };
        state.users.push(newUser);
    }
    
    saveUserPostProcess(id, username);
}

function saveUserPostProcess(id, username) {
    saveState();
    closeModal("modal-user-form");
    
    const select = document.getElementById("login-user-select");
    if (select) {
        select.innerHTML = state.users.map(u => `<option value="${u.id}">${u.name} (${u.username})</option>`).join("");
    }
    
    const currentUserId = sessionStorage.getItem("currentUserId");
    if (currentUserId === id || (!id && username === "admin" && currentUserId === "admin")) {
        const user = state.users.find(u => u.id === currentUserId);
        if (user) {
            applyUserPermissions(user);
        }
    }
    
    if (window.activeAdminSubTab === "tab-usuarios") {
        renderUsersTable();
    }
    
    window.showToast("Usuário salvo com sucesso!", "success");
}

export function deleteUser(userId) {
    const user = (state.users || []).find(u => u.id === userId);
    if (!user) return;
    
    if (user.username === "admin") {
        window.showToast("O usuário Administrador padrão não pode ser excluído.", "error");
        return;
    }
    
    window.showConfirm(
        `Tem certeza que deseja excluir o usuário "${user.name}"?`,
        () => {
            state.users = (state.users || []).filter(u => u.id !== userId);
            saveState();
            
            const select = document.getElementById("login-user-select");
            if (select) {
                select.innerHTML = (state.users || []).map(u => `<option value="${u.id}">${u.name} (${u.username})</option>`).join("");
            }
            
            if (window.activeAdminSubTab === "tab-usuarios") {
                renderUsersTable();
            }
            
            window.showToast("Usuário excluído com sucesso!", "success");
        },
        null,
        "Excluir Usuário",
        "Excluir"
    );
}

export function toggleSelectAllPermissions(checked) {
    const idInput = document.getElementById("form-user-id").value;
    if (idInput) {
        const user = (state.users || []).find(u => u.id === idInput);
        if (user && user.username === "admin") return;
    }
    
    const checkboxes = document.querySelectorAll(".perm-checkbox");
    checkboxes.forEach(cb => {
        cb.checked = checked;
    });
}

export function recoverAdminPassword() {
    const confirmMessage = "Deseja redefinir a senha do Administrador ('admin') para a senha de fábrica (1120M@z@dr1)? Isso restaurará seu acesso caso a senha tenha sido esquecida ou perdida.";
    const proceedReset = () => {
        if (!state.users) state.users = [];
        let adminUser = state.users.find(u => u.username === "admin");
        if (!adminUser) {
            adminUser = {
                id: "admin",
                username: "admin",
                name: "Administrador",
                password: "1120M@z@dr1",
                permissions: {}
            };
            state.users.unshift(adminUser);
        } else {
            adminUser.password = "1120M@z@dr1";
        }
        state.adminPassword = "1120M@z@dr1";
        saveState();
        
        if (window.showToast) {
            window.showToast("Senha do Administrador redefinida para: 1120M@z@dr1", "success");
        } else {
            alert("Senha do Administrador redefinida para: 1120M@z@dr1");
        }
        
        // Limpar campo de senha
        const pwdEl = document.getElementById("login-password");
        if (pwdEl) {
            pwdEl.value = "";
            pwdEl.focus();
        }
    };

    if (window.showConfirm) {
        window.showConfirm(confirmMessage, proceedReset, null, "Redefinir Senha", "Redefinir");
    } else {
        if (confirm(confirmMessage)) {
            proceedReset();
        }
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
    if (window.caches) {
        caches.keys().then(keys => {
            return Promise.all(keys.map(key => caches.delete(key)));
        }).then(() => {
            sessionStorage.clear();
            window.location.reload();
        });
    } else {
        sessionStorage.clear();
        window.location.reload();
    }
}

// Bind to window for HTML accessibility
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
window.recoverAdminPassword = recoverAdminPassword;
window.clearAppCacheAndReload = clearAppCacheAndReload;
