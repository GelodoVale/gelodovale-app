import { state, saveState } from './state.js';

// ==========================================================================
//  GELCONTROL LAYOUT MANAGER v5 — Pointer Events com setPointerCapture
// ==========================================================================

export function initLayoutSystem() {
    injectLayoutButton();
    injectLayoutPopover();
    applyCurrentLayout();
    watchLoginState();
}

// Usa admin_authenticated que auth.js seta no sessionStorage ao logar como admin
export function isAdmin() {
    return sessionStorage.getItem("admin_authenticated") === "true";
}

// Somente painéis da aba VISÍVEL ativa
function getActivePanels() {
    const activeTab = document.querySelector('.tab-content.active');
    if (!activeTab) return [];

    // Sub-aba do admin ativa dentro do tab ativo
    const activeSubTab = activeTab.querySelector('.admin-subtab-content.active');
    if (activeSubTab) {
        return Array.from(activeSubTab.querySelectorAll('.dashboard-panel'));
    }

    // Tab normal: exclui painéis que estejam dentro de sub-abas admin
    return Array.from(activeTab.querySelectorAll('.dashboard-panel'))
        .filter(p => !p.closest('.admin-subtab-content'));
}

// --------------------------------------------------------------------------
//  BOTÃO NO CABEÇALHO
// --------------------------------------------------------------------------
function injectLayoutButton() {
    if (document.getElementById("btn-layout-config")) return;
    const ha = document.querySelector(".header-actions");
    if (!ha) return;

    ha.insertAdjacentHTML("beforeend", `
        <button id="btn-layout-config" title="Ajustar Layout (Admin)"
            style="display:none;align-items:center;justify-content:center;
                   padding:8px;width:38px;height:38px;flex-shrink:0;
                   background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.12);
                   border-radius:8px;cursor:pointer;margin-left:4px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                 fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                 style="color:var(--color-primary,#00f0ff)">
                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            </svg>
        </button>`);

    document.getElementById("btn-layout-config").addEventListener("click", togglePopover);
}

// --------------------------------------------------------------------------
//  POPOVER
// --------------------------------------------------------------------------
function injectLayoutPopover() {
    if (document.getElementById("layout-config-popover")) return;

    document.body.insertAdjacentHTML("beforeend", `
        <div id="layout-config-popover"
             style="display:none;position:fixed;top:70px;right:16px;z-index:9999;
                    width:270px;padding:1.2rem;border-radius:12px;
                    background:rgba(12,20,40,0.97);backdrop-filter:blur(20px);
                    border:1px solid rgba(0,240,255,0.2);
                    box-shadow:0 12px 40px rgba(0,0,0,0.6);">
            <p style="color:#fff;font-weight:700;font-size:.88rem;margin:0 0 12px;
                       border-bottom:1px solid rgba(255,255,255,0.07);padding-bottom:8px;">
                ⚙️ Modo de Layout
            </p>
            <div style="display:flex;flex-direction:column;gap:6px;">
                ${[
                    ['fixed',    '🔒 Grade Fixa',              'Layout padrão — sem arrastar'],
                    ['grid',     '🔀 Grade Reposicionável',     'Reordenar painéis na grade'],
                    ['floating', '🪟 Janelas Flutuantes',       'Arrastar e redimensionar livremente']
                ].map(([v,lbl,sub]) => `
                <label style="display:flex;align-items:center;gap:10px;padding:8px 10px;
                               border-radius:6px;border:1px solid rgba(255,255,255,0.06);
                               cursor:pointer;margin:0;">
                    <input type="radio" name="lm" value="${v}"
                           style="accent-color:#00f0ff;margin:0;cursor:pointer;">
                    <div>
                        <strong style="color:#fff;font-size:.8rem;display:block;">${lbl}</strong>
                        <span style="color:rgba(255,255,255,.45);font-size:.7rem;">${sub}</span>
                    </div>
                </label>`).join('')}
            </div>
            <div style="display:flex;gap:8px;margin-top:12px;">
                <button id="btn-lr" style="flex:1;padding:6px;font-size:.75rem;
                    background:rgba(255,255,255,0.05);color:#ccc;border:1px solid rgba(255,255,255,0.12);
                    border-radius:6px;cursor:pointer;">↺ Resetar</button>
                <button id="btn-ls" style="flex:1;padding:6px;font-size:.75rem;
                    background:var(--color-primary,#00f0ff);color:#000;border:none;
                    border-radius:6px;cursor:pointer;font-weight:700;">✓ Salvar</button>
            </div>
        </div>`);

    document.querySelectorAll('input[name="lm"]').forEach(r =>
        r.addEventListener("change", e => applyLayoutMode(e.target.value)));
    document.getElementById("btn-lr").addEventListener("click", resetLayout);
    document.getElementById("btn-ls").addEventListener("click", saveLayout);
}

function togglePopover() {
    const p = document.getElementById("layout-config-popover");
    if (!p) return;
    if (p.style.display === "none") {
        p.style.display = "block";
        const mode = state.layoutSettings?.mode || "fixed";
        const r = p.querySelector(`input[value="${mode}"]`);
        if (r) r.checked = true;
    } else {
        p.style.display = "none";
    }
}

// --------------------------------------------------------------------------
//  WATCH LOGIN — polling 500ms
// --------------------------------------------------------------------------
function watchLoginState() {
    let lastAdmin = null;
    const check = () => {
        const now = isAdmin();
        if (now === lastAdmin) return;
        lastAdmin = now;
        const btn = document.getElementById("btn-layout-config");
        if (btn) btn.style.display = now ? "inline-flex" : "none";
        if (!now) {
            const pop = document.getElementById("layout-config-popover");
            if (pop) pop.style.display = "none";
        } else {
            applyCurrentLayout();
        }
    };
    setInterval(check, 500);
    check();
}

// --------------------------------------------------------------------------
//  APLICAR LAYOUT
// --------------------------------------------------------------------------
export function applyCurrentLayout() {
    applyLayoutMode(state.layoutSettings?.mode || "fixed");
}

function applyLayoutMode(mode) {
    // Remove debug element if it exists
    document.getElementById("layout-debug-log")?.remove();

    // 1. LIMPEZA GLOBAL — remove tudo de todas as versões anteriores
    document.querySelectorAll(".dashboard-panel").forEach(panel => {
        unwrapPanelContents(panel);

        panel.classList.remove(
            "layout-floating-active", "layout-grid-active",
            "is-floating", "is-draggable", "dragging", "layout-drag-enabled"
        );
        panel.style.position = "";
        panel.style.left     = "";
        panel.style.top      = "";
        panel.style.zIndex   = "";
        panel.style.boxShadow = "";
        panel.removeAttribute("draggable");

        // Remove handles injetados
        panel.querySelector(".lyt-resize")?.remove();
        panel.querySelector(".drag-grip")?.remove();
        panel.querySelector(".resize-handle")?.remove();

        // Limpa cursor e flags do header
        const hdr = panel.querySelector(".panel-header, .widget-header, .kpi-info, :scope > h3, :scope > h2");
        if (hdr) {
            hdr.style.cursor      = "";
            hdr.style.userSelect  = "";
            hdr.style.touchAction = "";
            delete hdr.dataset.lytDrag;
        }
        // Limpa flag do grid drag
        delete panel.dataset.lytGrid;
    });

    // 2. Modo fixo: remove transforms e encerra
    if (mode === "fixed") {
        document.querySelectorAll(".dashboard-panel").forEach(p => {
            p.style.transform = "";
            p.style.width     = "";
            p.style.height    = "";
            p.style.order     = "";
        });
        return;
    }

    // 3. Aplicar modo nos painéis da aba ativa
    const panels = getActivePanels();
    const pos    = state.layoutSettings?.positions || {};
    const admin  = isAdmin();

    panels.forEach(panel => {
        if (!panel.id) return;
        const saved = pos[panel.id] || {};

        if (mode === "grid") {
            panel.classList.add("layout-grid-active");
            panel.style.position = "relative";
            if (saved.order !== undefined) panel.style.order  = String(saved.order);
            if (saved.width)               panel.style.width  = saved.width;
            if (saved.height)              panel.style.height = saved.height;
            wrapPanelContents(panel);
            if (admin) {
                setupGridDrag(panel);
                injectResizeHandle(panel);
            }
        }

        else if (mode === "floating") {
            panel.classList.add("layout-floating-active");
            panel.style.position = "relative";
            const tx = saved.tx ?? 0;
            const ty = saved.ty ?? 0;
            panel.style.transform = `translate(${tx}px,${ty}px)`;
            if (saved.width)  panel.style.width  = saved.width;
            if (saved.height) panel.style.height = saved.height;
            wrapPanelContents(panel);
            if (admin) {
                setupPointerDrag(panel);
                injectResizeHandle(panel);
            }
        }
    });
}

function wrapPanelContents(panel) {
    const hasDirectWrapper = Array.from(panel.children).some(c => c.classList.contains("panel-content-scrollable"));
    if (hasDirectWrapper) return;

    const wrapper = document.createElement("div");
    wrapper.className = "panel-content-scrollable";

    const nodesToWrap = Array.from(panel.childNodes).filter(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
            return !node.classList.contains("panel-header") &&
                   !node.classList.contains("widget-header") &&
                   !node.classList.contains("lyt-resize") &&
                   !node.classList.contains("resize-handle") &&
                   !node.classList.contains("drag-grip") &&
                   node.tagName !== "H2" &&
                   node.tagName !== "H3";
        }
        return true;
    });

    nodesToWrap.forEach(node => wrapper.appendChild(node));
    panel.appendChild(wrapper);
}

function unwrapPanelContents(panel) {
    const wrapper = Array.from(panel.children).find(c => c.classList.contains("panel-content-scrollable"));
    if (!wrapper) return;

    while (wrapper.firstChild) {
        panel.insertBefore(wrapper.firstChild, wrapper);
    }
    wrapper.remove();
}

// --------------------------------------------------------------------------
//  DRAG FLUTUANTE — Pointer Events + setPointerCapture (mais confiável)
// --------------------------------------------------------------------------
function setupPointerDrag(panel) {
    const hdr = panel.querySelector(".panel-header, .widget-header, .kpi-info, :scope > h3, :scope > h2");
    if (!hdr) return;

    // Marca para não duplicar
    if (hdr.dataset.lytDrag === "1") return;
    hdr.dataset.lytDrag = "1";

    hdr.style.cursor     = "move";
    hdr.style.userSelect = "none";
    // Impede gestos de scroll/drag do browser no header
    hdr.style.touchAction = "none";

    // BLOQUEIA o drag nativo do HTML5 no painel inteiro
    // (sem isso, o browser cria uma "imagem fantasma" ao arrastar e rouba o pointer capture)
    panel.addEventListener("dragstart", e => e.preventDefault());

    // Bloqueia mousedown padrão também (o preventDefault no pointerdown não impede o drag nativo)
    hdr.addEventListener("mousedown", function(e) {
        if (!panel.classList.contains("layout-floating-active")) return;
        if (!e.target.closest("button, input, select, a, label")) {
            e.preventDefault();
        }
    });

    hdr.addEventListener("pointerdown", function onPointerDown(e) {
        // Apenas botão esquerdo
        if (e.button !== 0) return;
        // Ignora cliques em elementos interativos dentro do header
        if (e.target.closest("button, input, select, a, label")) return;
        // Ignora se o painel não estiver com o modo flutuante ativo
        if (!panel.classList.contains("layout-floating-active")) return;

        e.preventDefault();
        e.stopPropagation();

        // Captura o ponteiro — garante que todos os eventos vão para este elemento
        // mesmo que o mouse saia da janela
        hdr.setPointerCapture(e.pointerId);
        hdr.style.cursor = "grabbing";

        // Lê translate atual do state
        const saved   = state.layoutSettings?.positions?.[panel.id] || {};
        const startTx = saved.tx ?? 0;
        const startTy = saved.ty ?? 0;
        const startX  = e.clientX;
        const startY  = e.clientY;

        function onMove(ev) {
            ev.preventDefault();
            const newTx = startTx + (ev.clientX - startX);
            const newTy = startTy + (ev.clientY - startY);
            panel.style.transform = `translate(${newTx}px, ${newTy}px)`;

            // Salva posição no state
            if (!state.layoutSettings.positions)           state.layoutSettings.positions = {};
            if (!state.layoutSettings.positions[panel.id]) state.layoutSettings.positions[panel.id] = {};
            state.layoutSettings.positions[panel.id].tx = newTx;
            state.layoutSettings.positions[panel.id].ty = newTy;
        }

        function onUp(ev) {
            hdr.style.cursor = "move";
            hdr.releasePointerCapture(e.pointerId);
            hdr.removeEventListener("pointermove", onMove);
            hdr.removeEventListener("pointerup",   onUp);
        }

        hdr.addEventListener("pointermove", onMove);
        hdr.addEventListener("pointerup",   onUp);
    });
}

// --------------------------------------------------------------------------
//  DRAG GRADE — reordena por CSS flex order
// --------------------------------------------------------------------------
function setupGridDrag(panel) {
    if (panel.dataset.lytGrid === "1") return;
    panel.dataset.lytGrid = "1";

    panel.setAttribute("draggable", "true");
    const hdr = panel.querySelector(".panel-header, .widget-header, .kpi-info, :scope > h3, :scope > h2");
    if (hdr) { hdr.style.cursor = "grab"; hdr.style.userSelect = "none"; }

    panel.addEventListener("dragstart", e => {
        if (!panel.classList.contains("layout-grid-active")) {
            e.preventDefault();
            return;
        }
        panel.style.opacity = "0.5";
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", panel.id);
    });
    panel.addEventListener("dragend",  () => { panel.style.opacity = ""; });
    panel.addEventListener("dragover", e => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; });
    panel.addEventListener("drop", e => {
        e.preventDefault();
        const fromId = e.dataTransfer.getData("text/plain");
        if (fromId === panel.id) return;
        const from = document.getElementById(fromId);
        if (!from || from.parentNode !== panel.parentNode) return;

        const sibs = Array.from(panel.parentNode.children)
            .filter(c => c.classList.contains("dashboard-panel"));
        const iA = sibs.indexOf(from), iB = sibs.indexOf(panel);

        sibs.forEach((s, i) => {
            s.style.order = i * 10;
            if (!state.layoutSettings.positions)           state.layoutSettings.positions = {};
            if (!state.layoutSettings.positions[s.id])     state.layoutSettings.positions[s.id] = {};
            state.layoutSettings.positions[s.id].order = i * 10;
        });
        from.style.order   = iB * 10;
        panel.style.order  = iA * 10;
        state.layoutSettings.positions[fromId].order  = iB * 10;
        state.layoutSettings.positions[panel.id].order = iA * 10;
    });
}

// --------------------------------------------------------------------------
//  HANDLE DE RESIZE — canto inferior direito, também com Pointer Events
// --------------------------------------------------------------------------
function injectResizeHandle(panel) {
    if (panel.querySelector(".lyt-resize")) return;

    // Garante position:relative para o handle se posicionar corretamente
    if (getComputedStyle(panel).position === "static") {
        panel.style.position = "relative";
    }

    const handle = document.createElement("div");
    handle.className  = "lyt-resize";
    handle.title = "Redimensionar";
    handle.style.cssText = `
        position:absolute;bottom:0;right:0;width:20px;height:20px;
        cursor:se-resize;z-index:20;touch-action:none;
        background:linear-gradient(135deg,transparent 50%,rgba(0,240,255,0.5) 50%);
        border-bottom-right-radius:6px;
    `;
    panel.appendChild(handle);

    handle.addEventListener("pointerdown", function(e) {
        e.preventDefault();
        e.stopPropagation();
        handle.setPointerCapture(e.pointerId);

        const startX = e.clientX, startY = e.clientY;
        const startW = panel.offsetWidth, startH = panel.offsetHeight;

        function onMove(ev) {
            const newW = Math.max(220, startW + (ev.clientX - startX));
            const newH = Math.max(120, startH + (ev.clientY - startY));
            panel.style.width  = newW + "px";
            panel.style.height = newH + "px";

            if (!state.layoutSettings.positions)            state.layoutSettings.positions = {};
            if (!state.layoutSettings.positions[panel.id])  state.layoutSettings.positions[panel.id] = {};
            state.layoutSettings.positions[panel.id].width  = newW + "px";
            state.layoutSettings.positions[panel.id].height = newH + "px";
        }

        function onUp() {
            handle.releasePointerCapture(e.pointerId);
            handle.removeEventListener("pointermove", onMove);
            handle.removeEventListener("pointerup",   onUp);
        }

        handle.addEventListener("pointermove", onMove);
        handle.addEventListener("pointerup",   onUp);
    });
}

// --------------------------------------------------------------------------
//  SALVAR / RESETAR
// --------------------------------------------------------------------------
function saveLayout() {
    const pop  = document.getElementById("layout-config-popover");
    const mode = pop?.querySelector('input[name="lm"]:checked')?.value || "fixed";

    if (!state.layoutSettings) state.layoutSettings = {};
    state.layoutSettings.mode          = mode;
    state.layoutSettings.layoutVersion = 4;
    saveState();

    applyCurrentLayout();

    if (window.showToast) window.showToast(`Layout "${mode}" salvo! ✓`, "success");
    if (pop) pop.style.display = "none";
}

function resetLayout() {
    const doIt = () => {
        // Limpa flags de drag para permitir reinicialização limpa
        document.querySelectorAll(".dashboard-panel").forEach(p => {
            const hdr = p.querySelector(".panel-header, .widget-header, .kpi-info, :scope > h3, :scope > h2");
            if (hdr) delete hdr.dataset.lytDrag;
            delete p.dataset.lytGrid;
        });

        state.layoutSettings = { mode: "fixed", positions: {}, layoutVersion: 4 };
        saveState();
        applyCurrentLayout();

        const pop = document.getElementById("layout-config-popover");
        if (pop) {
            const r = pop.querySelector('input[value="fixed"]');
            if (r) r.checked = true;
            pop.style.display = "none";
        }
        if (window.showToast) window.showToast("Layout padrão restaurado.", "success");
    };

    if (window.showConfirm) {
        window.showConfirm("Resetar todas as posições dos painéis?", doIt, null, "Resetar Layout", "Resetar");
    } else doIt();
}
