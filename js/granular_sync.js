// --- ADAPTADOR DE SINCRONIZAÇÃO GRANULAR (FIREBASE) - GELCONTROL ---
// Módulo de sincronização atômica, controle de concorrência, idempotência remota
// e reconciliação sem substituição da base inteira.

import { generateUUID, getDeviceId } from './outbox.js';

// Constantes estruturais da árvore do GelControl
export const GRANULAR_COLLECTIONS = [
    'clients', 'orders', 'deliveries', 'freezers', 'products',
    'rentals', 'documents', 'payments', 'suppliers', 'packaging',
    'packagingTransactions', 'cargoSettlements', 'users', 'equipments',
    'comodatos', 'localEvents', 'ignoredSpikes'
];

export const CONFIG_KEYS = [
    'prices', 'factorySettings', 'backupSettings', 'appearance',
    'printSettings', 'logisticsSettings', 'whatsappTemplates',
    'commissionSettings', 'weatherConfig', 'layoutSettings', 'tabIcons'
];

// ─── CLASSE DO ADAPTADOR DE SINCRONIZAÇÃO GRANULAR ──────────────────────────
export class GranularSyncAdapter {
    constructor(options = {}) {
        this.deviceKey = options.deviceKey || 'gelodovale_oficial';
        this.deviceId = options.deviceId || getDeviceId();
        this.conflictStrategy = options.conflictStrategy || 'field_merge'; // 'field_merge' | 'remote_wins' | 'local_wins'
        this.db = options.db || null; // Objeto de referência Firebase Database
        this.isListening = false;
        this.listeners = new Map(); // entity -> listener reference
    }

    // ── Resolução de caminhos no Firebase ──
    getFactoryRootPath() {
        return `factories/${this.deviceKey}`;
    }

    getEntityPath(entity, entityId = null) {
        const root = this.getFactoryRootPath();
        if (entityId) {
            return `${root}/${entity}/${entityId}`;
        }
        return `${root}/${entity}`;
    }

    getIdempotencyPath(opId) {
        return `${this.getFactoryRootPath()}/_processedOps/${opId}`;
    }

    // ── Verificação e Gravação de Idempotência Remota ──
    async checkRemoteIdempotency(db, opId) {
        if (!opId) return false;
        try {
            const snap = await db.ref(this.getIdempotencyPath(opId)).once('value');
            return snap && snap.exists && snap.exists();
        } catch (e) {
            console.warn('[GranularSync] Falha ao consultar idempotência remota:', e);
            return false;
        }
    }

    async recordRemoteIdempotency(db, op) {
        if (!op || !op.opId) return;
        try {
            const record = {
                opId: op.opId,
                completedAt: Date.now(),
                deviceId: op.deviceId || this.deviceId,
                entity: op.entity,
                action: op.action,
                entityId: op.entityId
            };
            await db.ref(this.getIdempotencyPath(op.opId)).set(record);
        } catch (e) {
            console.warn('[GranularSync] Falha ao registrar idempotência remota:', e);
        }
    }

    // ── Aplicação de Operação Granular (Create / Update / Delete) ──
    async applyOperation(db, operation) {
        if (!db) {
            throw new Error('[GranularSync] Referência de banco de dados não informada.');
        }

        const { opId, entity, action, entityId, payload, timestamp, deviceId } = operation;

        // 1. CHECAGEM DE IDEMPOTÊNCIA NO LADO REMOTO
        const alreadyDone = await this.checkRemoteIdempotency(db, opId);
        if (alreadyDone) {
            return {
                status: 'skipped_idempotent',
                opId,
                message: 'Operação já processada anteriormente no servidor remoto.'
            };
        }

        // 2. DISPATCHER CONFORME AÇÃO
        let result = null;
        if (action === 'CREATE') {
            result = await this._handleCreate(db, entity, entityId, payload, timestamp, deviceId, opId);
        } else if (action === 'UPDATE') {
            result = await this._handleUpdate(db, entity, entityId, payload, timestamp, deviceId, opId);
        } else if (action === 'DELETE') {
            result = await this._handleDelete(db, entity, entityId, opId, timestamp, deviceId);
        } else if (action === 'TRANSACTION') {
            result = await this._handleTransaction(db, entity, entityId, payload, opId);
        } else {
            throw new Error(`[GranularSync] Ação desconhecida: ${action}`);
        }

        // 3. REGISTRAR SUCESSO NO LOG REMOTO DE IDEMPOTÊNCIA
        await this.recordRemoteIdempotency(db, operation);

        // 4. ATUALIZAR CARIMBO GLOBAL DO NÓ
        try {
            await db.ref(`${this.getFactoryRootPath()}/lastUpdated`).set(timestamp || Date.now());
        } catch (e) {
            // Não bloqueia caso o nó global falhe
        }

        return result;
    }

    // ── Criação Granular ──
    async _handleCreate(db, entity, entityId, payload, timestamp, deviceId, opId) {
        const path = this.getEntityPath(entity, entityId);
        const record = {
            ...payload,
            id: entityId,
            _rev: 1,
            _updatedAt: timestamp || Date.now(),
            _updatedBy: deviceId || this.deviceId,
            _opId: opId
        };
        await db.ref(path).set(record);
        return { status: 'created', entity, entityId, record };
    }

    // ── Atualização Granular com Resolução de Conflitos ──
    async _handleUpdate(db, entity, entityId, payload, timestamp, deviceId, opId) {
        const path = this.getEntityPath(entity, entityId);
        const ref = db.ref(path);

        // Buscar registro remoto atual para detecção de conflitos
        const snap = await ref.once('value');
        const remoteData = (snap && snap.exists && snap.exists()) ? snap.val() : null;

        if (!remoteData) {
            // Registro não existe remotamente: trata como create
            return await this._handleCreate(db, entity, entityId, payload, timestamp, deviceId, opId);
        }

        // Se o registro remoto já foi marcado como apagado (tombstone) e o payload não é uma restauração explícita:
        if (remoteData._deleted && !payload._restore) {
            return {
                status: 'skipped_tombstone',
                entity,
                entityId,
                message: 'Registro já excluído logicamente no servidor central. Não será recriado.'
            };
        }

        // Detecção de conflito: se foi alterado por outro dispositivo e possui rev mais nova
        const localRev = (payload && payload._rev) || 1;
        const remoteRev = remoteData._rev || 1;
        const remoteDevice = remoteData._updatedBy || '';
        const currentDevice = deviceId || this.deviceId;

        let mergedData = null;
        let conflictDetected = false;
        let conflictDetails = null;

        if (remoteRev > localRev && remoteDevice !== currentDevice) {
            conflictDetected = true;
            // Resolver conflito usando a estratégia configurada e registrar auditoria
            const res = this.resolveConflictWithAudit(remoteData, payload, this.conflictStrategy, {
                entity,
                entityId,
                currentDevice,
                timestamp: timestamp || Date.now()
            });
            mergedData = res.merged;
            conflictDetails = res.conflicts;

            // Se houve conflito no mesmo campo, registrar no log auditável remoto
            if (conflictDetails && conflictDetails.length > 0) {
                await this.recordConflictLog(db, {
                    opId,
                    entity,
                    entityId,
                    conflictDetails,
                    localDevice: currentDevice,
                    remoteDevice,
                    timestamp: timestamp || Date.now()
                });
            }
        } else {
            // Atualização limpa: mescla os campos alterados sobre o registro remoto
            mergedData = {
                ...remoteData,
                ...payload
            };
        }

        // Atualizar metadados de auditoria e revisão incremental
        mergedData._rev = Math.max(remoteRev, localRev) + 1;
        mergedData._updatedAt = timestamp || Date.now();
        mergedData._updatedBy = currentDevice;
        mergedData._opId = opId;
        if (entity === 'payments' || entity === 'carnet') {
            mergedData._syncStatus = 'confirmed';
            mergedData._confirmedAt = Date.now();
        }

        await ref.update(mergedData);
        return {
            status: 'updated',
            entity,
            entityId,
            conflictDetected,
            conflictDetails,
            record: mergedData
        };
    }

    // ── Exclusão Granular com Marcador Lógico (Tombstone) ──
    async _handleDelete(db, entity, entityId, opId, timestamp = Date.now(), deviceId = null) {
        const path = this.getEntityPath(entity, entityId);
        const ref = db.ref(path);
        const snap = await ref.once('value');
        const currentData = (snap && snap.exists && snap.exists()) ? snap.val() : {};
        const nextRev = ((currentData && currentData._rev) || 0) + 1;

        const tombstone = {
            id: entityId,
            _deleted: true,
            _deletedAt: timestamp || Date.now(),
            _deletedBy: deviceId || this.deviceId,
            _rev: nextRev,
            _opId: opId
        };

        // Grava marcador lógico de exclusão para que outros computadores não recriem o registro
        await ref.set(tombstone);
        return { status: 'deleted', entity, entityId, opId, tombstone };
    }

    // ── Transação Atômica com Idempotência Interna (Blindagem contra Race Condition) ──
    async _handleTransaction(db, entity, entityId, txOptions, opId) {
        const path = this.getEntityPath(entity, entityId);
        const ref = db.ref(path);
        let alreadyAppliedInsideTx = false;

        const txResult = await ref.transaction((currentValue) => {
            let balance = 0;
            let ops = {};

            if (currentValue === null || currentValue === undefined) {
                balance = txOptions.defaultValue !== undefined ? txOptions.defaultValue : 0;
            } else if (typeof currentValue === 'number') {
                balance = currentValue;
            } else if (typeof currentValue === 'object') {
                balance = typeof currentValue.balance === 'number' ? currentValue.balance : 0;
                ops = currentValue._processedOps && typeof currentValue._processedOps === 'object' ? currentValue._processedOps : {};
            }

            // BLINDAGEM ATÔMICA DENTRO DA TRANSAÇÃO:
            // Se este opId exato já tiver sido processado nesta conta/estoque,
            // o mutator retorna undefined para o Firebase abortar atomicamente a transação
            if (opId && ops[opId]) {
                alreadyAppliedInsideTx = true;
                return; // Aborta a transação no servidor sem aplicar alterações
            }

            // Aplica mutação de saldo
            if (typeof txOptions.mutator === 'function') {
                balance = txOptions.mutator(balance);
            } else if (typeof txOptions.delta === 'number') {
                balance += txOptions.delta;
            }

            // Registra o opId atomicamente DENTRO do mesmo nó de estoque
            if (opId) {
                ops[opId] = {
                    completedAt: Date.now(),
                    delta: txOptions.delta !== undefined ? txOptions.delta : null,
                    deviceId: this.deviceId
                };
            }

            return {
                balance: Number(balance) || 0,
                _processedOps: ops,
                _lastUpdated: Date.now()
            };
        });

        if (alreadyAppliedInsideTx || (!txResult.committed && opId)) {
            const currentSnap = await ref.once('value');
            const val = currentSnap.val();
            const currentBalance = (val && typeof val === 'object' && val.balance !== undefined) ? val.balance : val;
            return {
                status: 'skipped_idempotent',
                entity,
                entityId,
                opId,
                balance: currentBalance,
                message: 'Transação já aplicada atomicamente anteriormente.'
            };
        }

        const finalVal = txResult.snapshot ? txResult.snapshot.val() : null;
        const finalBalance = (finalVal && typeof finalVal === 'object' && finalVal.balance !== undefined) ? finalVal.balance : finalVal;

        // Também registrar no nó geral de _processedOps para auditoria externa
        await this.recordRemoteIdempotency(db, { opId, entity, action: 'TRANSACTION', entityId });

        return {
            status: 'transaction_applied',
            entity,
            entityId,
            committed: txResult.committed,
            balance: finalBalance,
            val: finalVal,
            opId
        };
    }

    // ── Registro de Conflito em Log Remoto de Auditoria ──
    async recordConflictLog(db, details) {
        if (!db || !details) return;
        try {
            const conflictId = `conf_${details.opId || Date.now()}`;
            const path = `${this.getFactoryRootPath()}/_conflicts/${conflictId}`;
            await db.ref(path).set({
                id: conflictId,
                entity: details.entity,
                entityId: details.entityId,
                localDevice: details.localDevice,
                remoteDevice: details.remoteDevice,
                timestamp: details.timestamp,
                status: 'auto_merged_audited',
                conflicts: details.conflictDetails
            });
        } catch (e) {
            console.warn('[GranularSync] Falha ao registrar log de conflito:', e);
        }
    }

    // ── Resolução de Conflitos com Auditoria de Campos Colidentes ──
    resolveConflictWithAudit(remoteRecord, localRecord, strategy = 'field_merge', meta = {}) {
        const conflicts = [];
        if (strategy === 'remote_wins') {
            return { merged: { ...remoteRecord }, conflicts: [] };
        }
        if (strategy === 'local_wins') {
            return { merged: { ...localRecord }, conflicts: [] };
        }

        const merged = { ...remoteRecord };

        Object.keys(localRecord).forEach(field => {
            if (field.startsWith('_')) return; // Metadados de controle

            const localVal = localRecord[field];
            const remoteVal = remoteRecord[field];

            if (remoteVal === undefined) {
                merged[field] = localVal;
            } else if (JSON.stringify(remoteVal) !== JSON.stringify(localVal)) {
                // Registrar a divergência no campo para histórico de auditoria
                conflicts.push({
                    field,
                    localValue: localVal,
                    remoteValue: remoteVal,
                    entity: meta.entity,
                    entityId: meta.entityId,
                    localDevice: meta.currentDevice,
                    remoteDevice: remoteRecord._updatedBy,
                    timestamp: meta.timestamp
                });

                if (typeof localVal === 'object' && localVal !== null &&
                    typeof remoteVal === 'object' && remoteVal !== null &&
                    !Array.isArray(localVal)) {
                    merged[field] = { ...remoteVal, ...localVal };
                } else {
                    merged[field] = localVal;
                }
            }
        });

        return { merged, conflicts };
    }

    // ── Motor de Resolução de Conflitos (3-Way Field-Level Merge) ──
    resolveConflict(remoteRecord, localRecord, strategy = 'field_merge') {
        return this.resolveConflictWithAudit(remoteRecord, localRecord, strategy).merged;
    }

    // ── Hidratação / Normalização para o Estado do GelControl v80 ──
    // Converte a árvore granular remota do Firebase em arrays e objetos
    // 100% compatíveis com a estrutura interna do GelControl em memória.
    hydrateGelControlState(rawRemoteData) {
        if (!rawRemoteData || typeof rawRemoteData !== 'object') {
            return {};
        }

        const hydratedState = {};

        // Normalização das coleções para arrays (filtrando soft-deletes)
        GRANULAR_COLLECTIONS.forEach(col => {
            const rawCol = rawRemoteData[col];
            if (!rawCol) {
                hydratedState[col] = [];
            } else if (Array.isArray(rawCol)) {
                hydratedState[col] = rawCol.filter(item => item && !item._deleted);
            } else if (typeof rawCol === 'object') {
                hydratedState[col] = Object.entries(rawCol).map(([key, item]) => {
                    if (item && typeof item === 'object') {
                        if (item._deleted === true) return null; // Filtra registros excluídos logicamente
                        if (!item.id) item.id = key;
                        return item;
                    }
                    return null;
                }).filter(Boolean);
            } else {
                hydratedState[col] = [];
            }
        });

        // Configurações e metadados diretos
        CONFIG_KEYS.forEach(cfg => {
            if (rawRemoteData[cfg] !== undefined) {
                hydratedState[cfg] = rawRemoteData[cfg];
            }
        });

        if (rawRemoteData.lastUpdated) {
            hydratedState.lastUpdated = rawRemoteData.lastUpdated;
        }

        return hydratedState;
    }

    // ── Exportação de Estado para o Formato Granular ──
    exportStateToGranularMap(stateObj) {
        const payloadMap = {};
        GRANULAR_COLLECTIONS.forEach(col => {
            if (Array.isArray(stateObj[col])) {
                payloadMap[col] = {};
                stateObj[col].forEach(item => {
                    if (item && item.id) {
                        payloadMap[col][item.id] = item;
                    }
                });
            }
        });
        CONFIG_KEYS.forEach(cfg => {
            if (stateObj[cfg] !== undefined) {
                payloadMap[cfg] = stateObj[cfg];
            }
        });
        return payloadMap;
    }
}

