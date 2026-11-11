// ============================================================================
// GELCONTROL — LIXEIRA INTELIGENTE E PERMANENTE CENTRALIZADA
// Preservação de dados, soft-delete com retenção contínua, governança e restauração segura
// ============================================================================

import { state, saveState } from './state.js';
import { isCurrentUserRoot } from './auth.js';

/**
 * Retorna o array de itens da lixeira garantindo estrutura inicial
 * @returns {Array<Object>}
 */
export function getTrashItems() {
    if (!state.trash || !Array.isArray(state.trash)) {
        state.trash = [];
    }
    return state.trash;
}

/**
 * Retorna a contagem atual de itens na lixeira
 * @returns {number}
 */
export function getTrashCount() {
    return getTrashItems().length;
}

/**
 * Atualiza o indicador numérico (badge) da lixeira no menu lateral
 */
export function updateTrashBadge() {
    const badge = document.getElementById('badge-trash-count');
    if (!badge) return;
    const count = getTrashCount();
    if (count > 0) {
        badge.innerText = count > 99 ? '99+' : String(count);
        badge.style.display = 'inline-block';
    } else {
        badge.style.display = 'none';
    }
}

/**
 * Verifica se um item pode ser enviado para a lixeira com base nas regras de integridade relacional
 * @param {'client'|'freezer'|'product'|'order'} itemType 
 * @param {Object} item 
 * @returns {{ allowed: boolean, warning?: string, error?: string, linkedDetails?: Object }}
 */
export function validateDeletionIntegrity(itemType, item) {
    if (!item) return { allowed: false, error: 'Registro inválido ou inexistente.' };

    if (itemType === 'freezer') {
        // Bloqueio rigoroso de freezer em comodato ativo
        const isAllocated = item.status === 'alocado' || item.status === 'comodato' || (item.clientId && item.clientId.trim() !== '');
        if (isAllocated) {
            const clientName = item.clientName || 'Cliente';
            return {
                allowed: false,
                error: `BLOQUEIO PATRIMONIAL: O freezer '${item.code || item.serialNumber || item.id}' está atualmente em comodato ativo com '${clientName}'. Não é permitido enviar para a lixeira um patrimônio alocado. Realize primeiro a devolução do equipamento no Inventário.`
            };
        }
        return { allowed: true };
    }

    if (itemType === 'client') {
        const freezers = Array.isArray(state.freezers) ? state.freezers : [];
        const linkedFreezers = freezers.filter(f => f && (f.clientId === item.id || f.clientCode === item.id));
        const orders = Array.isArray(state.orders) ? state.orders : [];
        const linkedOrders = orders.filter(o => o && o.clientId === item.id);

        let warning = null;
        if (linkedFreezers.length > 0) {
            warning = `ATENÇÃO: O cliente possui ${linkedFreezers.length} conservadora(s) em comodato. Ao mover para a lixeira, o vínculo patrimonial com as conservadoras será mantido preservado na auditoria e nenhum equipamento será liberado indevidamente da fábrica.`;
        }

        return {
            allowed: true,
            warning: warning,
            linkedDetails: {
                freezersCount: linkedFreezers.length,
                ordersCount: linkedOrders.length
            }
        };
    }

    if (itemType === 'product') {
        const products = Array.isArray(state.products) ? state.products : [];
        if (products.length <= 1) {
            return {
                allowed: false,
                error: 'Não é possível excluir o único produto ativo da fábrica.'
            };
        }
        return { allowed: true };
    }

    return { allowed: true };
}

/**
 * Move um registro para a lixeira central permanente (Soft-Delete)
 * @param {'client'|'freezer'|'product'|'order'} itemType 
 * @param {string|number} itemId 
 * @param {string} reason 
 * @returns {boolean}
 */
export function moveToTrash(itemType, itemId, reason = '') {
    const trash = getTrashItems();
    let originalList = null;
    let typeName = 'Registro';

    if (itemType === 'client') {
        originalList = state.clients || [];
        typeName = 'Cliente';
    } else if (itemType === 'freezer') {
        originalList = state.freezers || [];
        typeName = 'Freezer / Equipamento';
    } else if (itemType === 'product') {
        originalList = state.products || [];
        typeName = 'Produto';
    } else if (itemType === 'order') {
        originalList = state.orders || [];
        typeName = 'Pedido';
    }

    if (!originalList) return false;

    const itemIndex = originalList.findIndex(x => x && (x.id === itemId || String(x.id) === String(itemId)));
    if (itemIndex === -1) {
        if (window.showToast) window.showToast('Item não localizado na base ativa.', 'warning');
        return false;
    }

    const item = originalList[itemIndex];
    const validation = validateDeletionIntegrity(itemType, item);

    if (!validation.allowed) {
        if (window.showToast) window.showToast(validation.error || 'Operação não permitida.', 'error');
        return false;
    }

    // Montar registro completo e imutável para a Lixeira
    const nowISO = new Date().toISOString();
    const currentUser = (state.currentUser && state.currentUser.username) ? state.currentUser.username : 'Master';

    let title = item.name || item.razaoSocial || item.code || item.description || `Item #${itemId}`;
    let summary = '';

    if (itemType === 'client') {
        const doc = item.cnpj || item.cpf || item.document || 'Sem documento';
        const phone = item.phone || item.whatsapp || '';
        const address = item.address || '';
        summary = `Doc: ${doc} | Tel: ${phone} | End: ${address}`.trim();
    } else if (itemType === 'freezer') {
        summary = `Modelo: ${item.model || ''} | Marca: ${item.brand || ''} | N° Série: ${item.serialNumber || ''}`.trim();
    } else if (itemType === 'product') {
        summary = `Tipo: ${item.type || ''} | Preço Base: R$ ${(Number(item.defaultPrice) || 0).toFixed(2)}`;
    } else if (itemType === 'order') {
        summary = `Cliente: ${item.clientName || ''} | Total: R$ ${(Number(item.total) || 0).toFixed(2)}`;
    }

    const trashEntry = {
        id: `trash_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        itemType: itemType,
        typeName: typeName,
        originalId: item.id,
        title: title,
        summary: summary,
        itemData: JSON.parse(JSON.stringify(item)), // Cópia profunda
        deletedAt: nowISO,
        deletedBy: currentUser,
        reason: reason || 'Removido pelo usuário',
        metadata: validation.linkedDetails || {}
    };

    // 1. Inserir no topo da lixeira
    trash.unshift(trashEntry);

    // 2. Remover da coleção ativa
    originalList.splice(itemIndex, 1);

    // 3. Regra Especial de Clientes: Não liberar conservadoras em comodato!
    // As conservadoras continuam atreladas ao cliente para histórico patrimonial,
    // apenas sinalizadas para auditoria de fábrica.
    if (itemType === 'client' && Array.isArray(state.freezers)) {
        state.freezers.forEach(f => {
            if (f && (f.clientId === itemId || f.clientCode === itemId)) {
                if (!f.movementHistory) f.movementHistory = [];
                f.movementHistory.push({
                    date: window.formatDateBrazil ? window.formatDateBrazil(nowISO) : nowISO,
                    from: f.clientName || 'Cliente',
                    to: 'Comodato sob Custódia (Cliente na Lixeira)',
                    reason: 'Cliente movido para a Lixeira Central — Patrimônio retido e protegido'
                });
            }
        });
    }

    // 4. Salvar estado e propagar sincronização
    saveState();

    // 5. Atualizar interfaces
    updateTrashBadge();
    if (window.renderApp) window.renderApp();
    if (window.renderClientes && itemType === 'client') window.renderClientes();
    if (window.renderInventario && itemType === 'freezer') window.renderInventario();
    if (window.renderPrecos && itemType === 'product') window.renderPrecos();
    renderLixeira();

    if (window.showToast) {
        window.showToast(`${typeName} movido para a Lixeira com sucesso. Pode ser recuperado a qualquer momento.`, 'success');
    }

    return true;
}

/**
 * Restaura um item da lixeira de volta para sua coleção ativa
 * @param {string} trashId 
 * @returns {boolean}
 */
export function restoreFromTrash(trashId) {
    const trash = getTrashItems();
    const index = trash.findIndex(t => t.id === trashId);
    if (index === -1) {
        if (window.showToast) window.showToast('Item não encontrado na lixeira.', 'warning');
        return false;
    }

    const trashEntry = trash[index];
    const { itemType, typeName, itemData, originalId } = trashEntry;

    let targetList = null;
    if (itemType === 'client') targetList = state.clients;
    else if (itemType === 'freezer') targetList = state.freezers;
    else if (itemType === 'product') targetList = state.products;
    else if (itemType === 'order') targetList = state.orders;

    if (!targetList || !Array.isArray(targetList)) {
        if (window.showToast) window.showToast('Coleção de destino inacessível.', 'error');
        return false;
    }

    // Anti-Colisão / Anti-Duplicidade
    const existing = targetList.find(x => x && (x.id === originalId || (x.cnpj && itemData.cnpj && x.cnpj === itemData.cnpj)));
    if (existing) {
        if (window.showToast) {
            window.showToast(`Conflito: Já existe um ${typeName} ativo com a mesma identificação (${existing.name || existing.id}).`, 'warning');
        }
        return false;
    }

    // Restaura o item na coleção ativa
    targetList.push(itemData);

    // Remove da lixeira
    trash.splice(index, 1);

    // Se for cliente, atualiza histórico dos freezers vinculados
    if (itemType === 'client' && Array.isArray(state.freezers)) {
        state.freezers.forEach(f => {
            if (f && (f.clientId === originalId || f.clientCode === originalId)) {
                if (!f.movementHistory) f.movementHistory = [];
                f.movementHistory.push({
                    date: window.formatDateBrazil ? window.formatDateBrazil(new Date().toISOString()) : new Date().toISOString(),
                    from: 'Lixeira Central',
                    to: itemData.name || 'Cliente Restaurado',
                    reason: 'Cliente restaurado com sucesso da Lixeira Central'
                });
            }
        });
    }

    saveState();
    updateTrashBadge();

    if (window.renderApp) window.renderApp();
    if (window.renderClientes && itemType === 'client') window.renderClientes();
    if (window.renderInventario && itemType === 'freezer') window.renderInventario();
    if (window.renderPrecos && itemType === 'product') window.renderPrecos();
    renderLixeira();

    if (window.showToast) {
        window.showToast(`${typeName} restaurado com sucesso para o sistema ativo!`, 'success');
    }

    return true;
}

/**
 * Exclusão definitiva permanente do item da lixeira (Apenas Master com confirmação explícita)
 * @param {string} trashId 
 */
export function permanentDeleteFromTrash(trashId) {
    // Permissão exclusiva de Master
    if (typeof isCurrentUserRoot === 'function' && !isCurrentUserRoot()) {
        if (window.showToast) window.showToast('Apenas o Master possui autorização para exclusão definitiva de registros.', 'error');
        return;
    }

    const trash = getTrashItems();
    const index = trash.findIndex(t => t.id === trashId);
    if (index === -1) {
        if (window.showToast) window.showToast('Item não encontrado na lixeira.', 'warning');
        return;
    }

    const item = trash[index];

    if (typeof window.showConfirm === 'function') {
        window.showConfirm(
            `ATENÇÃO: Deseja realmente excluir DEFINITIVAMENTE o registro '${item.title}' (${item.typeName})?\n\nEsta operação é 100% irreversível e não poderá ser desfeita. Todos os dados desta entrada serão eliminados da base e da nuvem.`,
            () => {
                trash.splice(index, 1);
                saveState();
                updateTrashBadge();
                renderLixeira();
                if (window.showToast) {
                    window.showToast(`Registro '${item.title}' excluído definitivamente.`, 'info');
                }
            },
            null,
            'Exclusão Definitiva (Irreversível)',
            'Excluir Definitivamente'
        );
    } else {
        if (confirm(`Excluir definitivamente '${item.title}'? Esta ação é irreversível.`)) {
            trash.splice(index, 1);
            saveState();
            updateTrashBadge();
            renderLixeira();
        }
    }
}

/**
 * Renderiza o painel e a listagem da Lixeira Central
 */
export function renderLixeira() {
    const container = document.getElementById('lixeira-items-container');
    const emptyState = document.getElementById('lixeira-empty-state');
    const countBadge = document.getElementById('lixeira-total-count');
    const filterSelect = document.getElementById('lixeira-filter-type');
    const searchInput = document.getElementById('lixeira-search-input');

    updateTrashBadge();

    if (!container) return;

    const items = getTrashItems();
    if (countBadge) countBadge.innerText = `${items.length} item(ns)`;

    const selectedFilter = filterSelect ? filterSelect.value : 'all';
    const searchQuery = searchInput ? searchInput.value.toLowerCase().trim() : '';

    const filtered = items.filter(it => {
        if (selectedFilter !== 'all' && it.itemType !== selectedFilter) return false;
        if (searchQuery) {
            const matchTitle = (it.title || '').toLowerCase().includes(searchQuery);
            const matchSummary = (it.summary || '').toLowerCase().includes(searchQuery);
            const matchUser = (it.deletedBy || '').toLowerCase().includes(searchQuery);
            return matchTitle || matchSummary || matchUser;
        }
        return true;
    });

    if (filtered.length === 0) {
        container.innerHTML = '';
        if (emptyState) emptyState.style.display = 'flex';
        return;
    }

    if (emptyState) emptyState.style.display = 'none';

    let html = '';
    filtered.forEach(it => {
        const dateStr = window.formatDateBrazil 
            ? window.formatDateBrazil(it.deletedAt) 
            : new Date(it.deletedAt).toLocaleString('pt-BR');

        let typeBadgeColor = '#00f0ff';
        let typeBadgeBg = 'rgba(0, 240, 255, 0.1)';
        let typeIcon = 'box';

        if (it.itemType === 'client') {
            typeBadgeColor = '#38bdf8';
            typeBadgeBg = 'rgba(56, 189, 248, 0.12)';
            typeIcon = 'user';
        } else if (it.itemType === 'freezer') {
            typeBadgeColor = '#22d3ee';
            typeBadgeBg = 'rgba(34, 211, 238, 0.12)';
            typeIcon = 'archive';
        } else if (it.itemType === 'product') {
            typeBadgeColor = '#4ade80';
            typeBadgeBg = 'rgba(74, 222, 128, 0.12)';
            typeIcon = 'package';
        } else if (it.itemType === 'order') {
            typeBadgeColor = '#fbbf24';
            typeBadgeBg = 'rgba(251, 191, 36, 0.12)';
            typeIcon = 'shopping-cart';
        }

        const isMaster = typeof isCurrentUserRoot === 'function' ? isCurrentUserRoot() : true;

        html += `
            <div class="card lixeira-card" style="padding: 16px; margin-bottom: 12px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.08); border-radius: var(--radius-md); display: flex; flex-direction: column; gap: 10px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; flex-wrap: wrap;">
                    <div style="display: flex; align-items: center; gap: 10px; flex: 1; min-width: 240px;">
                        <div style="width: 38px; height: 38px; border-radius: 8px; background: ${typeBadgeBg}; border: 1px solid ${typeBadgeColor}44; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                            <i data-lucide="${typeIcon}" style="width: 18px; height: 18px; color: ${typeBadgeColor};"></i>
                        </div>
                        <div>
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <h4 style="margin: 0; font-size: 0.95rem; font-weight: 600; color: #fff;">${it.title}</h4>
                                <span style="font-size: 0.65rem; padding: 2px 8px; border-radius: 4px; background: ${typeBadgeBg}; color: ${typeBadgeColor}; border: 1px solid ${typeBadgeColor}33; font-weight: 600; text-transform: uppercase;">
                                    ${it.typeName}
                                </span>
                            </div>
                            <p style="margin: 3px 0 0; font-size: 0.78rem; color: var(--color-text-muted);">${it.summary || 'Sem detalhes adicionais'}</p>
                        </div>
                    </div>

                    <div style="display: flex; align-items: center; gap: 8px;">
                        <button class="btn btn-secondary" onclick="window.restoreFromTrash('${it.id}')" title="Restaurar item para o sistema ativo" style="padding: 6px 12px; font-size: 0.8rem; display: inline-flex; align-items: center; gap: 6px; border-color: rgba(74, 222, 128, 0.4); color: #4ade80;">
                            <i data-lucide="rotate-ccw" style="width: 14px; height: 14px;"></i> Restaurar
                        </button>
                        ${isMaster ? `
                        <button class="btn btn-danger" onclick="window.permanentDeleteFromTrash('${it.id}')" title="Excluir Definitivamente (Irreversível)" style="padding: 6px 12px; font-size: 0.8rem; display: inline-flex; align-items: center; gap: 6px;">
                            <i data-lucide="trash" style="width: 14px; height: 14px;"></i> Excluir Definitivo
                        </button>
                        ` : ''}
                    </div>
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.72rem; color: var(--color-text-muted); border-top: 1px solid rgba(255,255,255,0.04); padding-top: 8px; margin-top: 4px;">
                    <div>
                        <span>Excluído por: <strong>${it.deletedBy || 'Master'}</strong></span>
                        ${it.reason ? `<span style="margin-left: 12px;">Motivo: <em>${it.reason}</em></span>` : ''}
                    </div>
                    <div>
                        <span>Data: <strong>${dateStr}</strong></span>
                    </div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
    if (window.lucide) window.lucide.createIcons();
}

// Exposição global segura para eventos onclick do DOM
if (typeof window !== 'undefined') {
    window.moveToTrash = moveToTrash;
    window.restoreFromTrash = restoreFromTrash;
    window.permanentDeleteFromTrash = permanentDeleteFromTrash;
    window.renderLixeira = renderLixeira;
    window.getTrashCount = getTrashCount;
    window.updateTrashBadge = updateTrashBadge;
}

