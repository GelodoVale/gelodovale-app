// --- MOTOR DE FILA OFFLINE (OUTBOX PATTERN) - GELCONTROL ---
// Módulo isolado para garantir persistência, ordenação FIFO, idempotência e
// tolerância a falhas na sincronização em segundo plano.

const STORAGE_QUEUE_KEY = 'gelcontrol_sync_outbox';
const STORAGE_PROCESSED_KEY = 'gelcontrol_sync_processed_ops';
const STORAGE_DEAD_LETTER_KEY = 'gelcontrol_sync_dead_letter';
const STORAGE_DEVICE_ID_KEY = 'gelcontrol_device_id';
const MAX_PROCESSED_HISTORY = 500;
const DEFAULT_MAX_ATTEMPTS = 5;

// Utilitário de persistência com fallback seguro
function getStorage() {
    if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage;
    }
    if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
        return globalThis.localStorage;
    }
    // Fallback em memória para ambientes de teste sem localStorage
    if (!globalThis._mockStorage) {
        globalThis._mockStorage = {
            _data: {},
            getItem(key) { return this._data[key] || null; },
            setItem(key, val) { this._data[key] = String(val); },
            removeItem(key) { delete this._data[key]; },
            clear() { this._data = {}; }
        };
    }
    return globalThis._mockStorage;
}

// ─── IDENTIFICAÇÃO ÚNICA DO DISPOSITIVO (DEVICE ID) ─────────────────────────
export function getDeviceId() {
    const storage = getStorage();
    let deviceId = storage.getItem(STORAGE_DEVICE_ID_KEY);
    if (!deviceId) {
        deviceId = 'DEV-' + generateUUID().substring(0, 13).toUpperCase();
        storage.setItem(STORAGE_DEVICE_ID_KEY, deviceId);
    }
    return deviceId;
}

// ─── GERADOR DE UUID V4 (RFC 4122) ──────────────────────────────────────────
export function generateUUID() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        try {
            return crypto.randomUUID();
        } catch (e) {
            // Fallback caso crypto.randomUUID falhe em contextos restritos
        }
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// ─── CLASSE DE OPERAÇÃO DO OUTBOX ───────────────────────────────────────────
export class OutboxOperation {
    constructor(options = {}) {
        this.opId = options.opId || generateUUID();
        this.entity = options.entity || 'general'; // 'clients', 'orders', 'freezers', 'deliveries', etc.
        this.action = options.action || 'UPDATE';   // 'CREATE', 'UPDATE', 'DELETE', 'TRANSACTION'
        this.entityId = options.entityId ? String(options.entityId) : null;
        this.payload = options.payload !== undefined ? options.payload : null;
        this.timestamp = Number(options.timestamp) || Date.now();
        this.deviceId = options.deviceId || getDeviceId();
        this.status = options.status || 'pending'; // 'pending' | 'processing' | 'failed' | 'completed'
        this.attempts = Number(options.attempts) || 0;
        this.maxAttempts = Number(options.maxAttempts) || DEFAULT_MAX_ATTEMPTS;
        this.lastAttemptAt = options.lastAttemptAt || null;
        this.error = options.error || null;
        this.rev = Number(options.rev) || 1;
    }

    toJSON() {
        return {
            opId: this.opId,
            entity: this.entity,
            action: this.action,
            entityId: this.entityId,
            payload: this.payload,
            timestamp: this.timestamp,
            deviceId: this.deviceId,
            status: this.status,
            attempts: this.attempts,
            maxAttempts: this.maxAttempts,
            lastAttemptAt: this.lastAttemptAt,
            error: this.error,
            rev: this.rev
        };
    }
}

// ─── MOTOR DE FILA (OUTBOX ENGINE) ──────────────────────────────────────────
export class OutboxEngine {
    constructor(customStorage = null) {
        this.storage = customStorage || getStorage();
        this.isProcessing = false;
        this.syncHandler = null;
        this.listeners = new Set();
        this._retryTimeoutId = null;

        // Auto-anexar listener de reconexão caso esteja em ambiente browser
        if (typeof window !== 'undefined' && window.addEventListener) {
            window.addEventListener('online', () => {
                this.notifyOnline();
            });
        }
    }

    // ── Carregamento e salvamento atômico da fila ──
    _loadQueue() {
        try {
            const raw = this.storage.getItem(STORAGE_QUEUE_KEY);
            if (!raw) return [];
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) return [];
            return parsed.map(item => new OutboxOperation(item));
        } catch (e) {
            console.error('[Outbox] Erro ao carregar fila:', e);
            return [];
        }
    }

    _saveQueue(queue) {
        try {
            this.storage.setItem(STORAGE_QUEUE_KEY, JSON.stringify(queue.map(op => op.toJSON())));
            this._notifyListeners('change', { queueLength: queue.length });
        } catch (e) {
            console.error('[Outbox] Erro ao salvar fila no storage:', e);
            throw e;
        }
    }

    // ── Cache de operações processadas (Idempotência) ──
    _loadProcessedOps() {
        try {
            const raw = this.storage.getItem(STORAGE_PROCESSED_KEY);
            if (!raw) return [];
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            return [];
        }
    }

    _saveProcessedOps(ops) {
        try {
            // Limitar aos últimos MAX_PROCESSED_HISTORY para não sobrecarregar o storage
            const trimmed = ops.slice(-MAX_PROCESSED_HISTORY);
            this.storage.setItem(STORAGE_PROCESSED_KEY, JSON.stringify(trimmed));
        } catch (e) {
            console.warn('[Outbox] Falha ao persistir cache de operações processadas:', e);
        }
    }

    isOperationProcessed(opId) {
        if (!opId) return false;
        const processed = this._loadProcessedOps();
        return processed.some(item => (typeof item === 'string' ? item === opId : item.opId === opId));
    }

    recordOperationProcessed(opId) {
        if (!opId) return;
        const processed = this._loadProcessedOps();
        if (!this.isOperationProcessed(opId)) {
            processed.push({ opId, completedAt: Date.now() });
            this._saveProcessedOps(processed);
        }
    }

    // ── Dead-Letter Queue (Operações que excederam tentativas) ──
    _loadDeadLetter() {
        try {
            const raw = this.storage.getItem(STORAGE_DEAD_LETTER_KEY);
            if (!raw) return [];
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            return [];
        }
    }

    _saveDeadLetter(deadLetterQueue) {
        try {
            this.storage.setItem(STORAGE_DEAD_LETTER_KEY, JSON.stringify(deadLetterQueue));
        } catch (e) {
            console.warn('[Outbox] Falha ao persistir Dead Letter Queue:', e);
        }
    }

    moveToDeadLetter(operation) {
        const deadLetter = this._loadDeadLetter();
        deadLetter.push({
            ...operation.toJSON(),
            movedAt: Date.now()
        });
        this._saveDeadLetter(deadLetter);
        this._notifyListeners('dead-letter', operation);
    }

    // ── Enfileirar Operação (Enqueue) ──
    enqueue(entity, action, entityId, payload, options = {}) {
        if (!entity || !action) {
            throw new Error('[Outbox] Entidade e Ação são obrigatórias para enfileiramento.');
        }

        // Criar a operação com identificador único
        const op = new OutboxOperation({
            entity,
            action,
            entityId,
            payload,
            ...options
        });

        // Carregar fila atual
        const queue = this._loadQueue();

        // Otimização: se já houver uma operação pendente idêntica para o mesmo registro
        // e ação UPDATE dentro de curto intervalo, podemos consolidar se solicitado
        if (options.coalesce && action === 'UPDATE' && entityId) {
            const existingIdx = queue.findIndex(item =>
                item.status === 'pending' &&
                item.entity === entity &&
                item.action === 'UPDATE' &&
                item.entityId === String(entityId)
            );
            if (existingIdx !== -1) {
                // Atualiza payload e timestamp mantendo a mesma ordem FIFO
                queue[existingIdx].payload = payload;
                queue[existingIdx].timestamp = op.timestamp;
                queue[existingIdx].rev = (queue[existingIdx].rev || 1) + 1;
                this._saveQueue(queue);
                return queue[existingIdx];
            }
        }

        queue.push(op);
        this._saveQueue(queue);

        this._notifyListeners('enqueue', op);
        return op;
    }

    // ── Obter operações pendentes (Ordenação cronológica FIFO) ──
    getPendingOperations() {
        const queue = this._loadQueue();
        return queue
            .filter(op => op.status === 'pending' || op.status === 'failed')
            .sort((a, b) => a.timestamp - b.timestamp);
    }

    getAllOperations() {
        return this._loadQueue();
    }

    getOperationById(opId) {
        const queue = this._loadQueue();
        return queue.find(op => op.opId === opId) || null;
    }

    // ── Registrar Manipulador Assíncrono de Sincronização ──
    registerSyncHandler(handler) {
        if (typeof handler !== 'function') {
            throw new Error('[Outbox] O sync handler deve ser uma função executável.');
        }
        this.syncHandler = handler;
    }

    // ── Processador Principal da Fila (Sequential FIFO Dispatcher) ──
    async processQueue() {
        if (this.isProcessing) {
            return { status: 'already_running' };
        }

        if (!this.syncHandler) {
            return { status: 'no_handler_registered' };
        }

        // Verificar se está online (em ambiente browser)
        if (typeof navigator !== 'undefined' && navigator.onLine === false) {
            return { status: 'offline', message: 'Dispositivo desconectado da rede.' };
        }

        this.isProcessing = true;
        this._notifyListeners('processing-start');

        let processedCount = 0;
        let failedCount = 0;

        try {
            while (true) {
                const queue = this._loadQueue();
                const pendingOps = queue
                    .filter(op => op.status === 'pending' || op.status === 'failed')
                    .sort((a, b) => a.timestamp - b.timestamp);

                if (pendingOps.length === 0) {
                    break;
                }

                const currentOp = pendingOps[0];

                // Verificação de idempotência: se já foi processado antes, descarta da fila
                if (this.isOperationProcessed(currentOp.opId)) {
                    const remainingQueue = queue.filter(item => item.opId !== currentOp.opId);
                    this._saveQueue(remainingQueue);
                    continue;
                }

                // Marcar como 'processing'
                currentOp.status = 'processing';
                currentOp.attempts += 1;
                currentOp.lastAttemptAt = Date.now();
                this._saveQueue(queue);

                try {
                    // Executar manipulador registrado
                    await this.syncHandler(currentOp);

                    // SUCESSO: registrar no cache de idempotência e remover da fila ativa
                    this.recordOperationProcessed(currentOp.opId);
                    const updatedQueue = this._loadQueue().filter(item => item.opId !== currentOp.opId);
                    this._saveQueue(updatedQueue);

                    processedCount++;
                    this._notifyListeners('operation-success', currentOp);
                } catch (err) {
                    failedCount++;
                    const errorMessage = (err && err.message) ? err.message : String(err);
                    console.warn(`[Outbox] Falha na operação ${currentOp.opId}:`, errorMessage);

                    // Atualizar estado da operação
                    currentOp.error = errorMessage;
                    currentOp.status = 'failed';

                    // Checagem de limite de tentativas
                    if (currentOp.attempts >= currentOp.maxAttempts) {
                        console.error(`[Outbox] Operação ${currentOp.opId} excedeu ${currentOp.maxAttempts} tentativas. Movendo para Dead-Letter.`);
                        const filteredQueue = this._loadQueue().filter(item => item.opId !== currentOp.opId);
                        this._saveQueue(filteredQueue);
                        this.moveToDeadLetter(currentOp);
                    } else {
                        // Persiste o erro e falha no item
                        this._saveQueue(queue);

                        // Cálculo de backoff exponencial: 1s, 2s, 4s, 8s... até 30s
                        const backoffDelay = Math.min(1000 * Math.pow(2, currentOp.attempts), 30000);
                        this._notifyListeners('operation-retry-scheduled', {
                            operation: currentOp,
                            delayMs: backoffDelay
                        });

                        // Agenda retry e interrompe o loop sequencial para preservar a ordem FIFO
                        this._scheduleRetry(backoffDelay);
                        break;
                    }
                }
            }
        } finally {
            this.isProcessing = false;
            this._notifyListeners('processing-end', { processedCount, failedCount });
        }

        return {
            status: 'completed',
            processedCount,
            failedCount
        };
    }

    _scheduleRetry(delayMs) {
        if (this._retryTimeoutId) {
            clearTimeout(this._retryTimeoutId);
        }
        if (typeof setTimeout !== 'undefined') {
            this._retryTimeoutId = setTimeout(() => {
                this.processQueue();
            }, delayMs);
            if (this._retryTimeoutId && typeof this._retryTimeoutId.unref === 'function') {
                this._retryTimeoutId.unref(); // Não travar o event loop do Node em testes
            }
        }
    }

    stop() {
        if (this._retryTimeoutId) {
            clearTimeout(this._retryTimeoutId);
            this._retryTimeoutId = null;
        }
        this.isProcessing = false;
    }

    notifyOnline() {
        if (this._retryTimeoutId) {
            clearTimeout(this._retryTimeoutId);
            this._retryTimeoutId = null;
        }
        // Se houver operações pendentes, dispara processamento imediato
        if (this.getPendingOperations().length > 0) {
            this.processQueue();
        }
    }

    // ── Limpeza e gerenciamento ──
    clearQueue() {
        this.storage.removeItem(STORAGE_QUEUE_KEY);
        this._notifyListeners('clear');
    }

    // Limpeza cirúrgica: limpa exclusivamente operações com timestamp <= cutoffTimestamp.
    // Qualquer operação enfileirada após o cutoffTimestamp (ex: durante envio de rede) é preservada!
    clearOperationsUpTo(cutoffTimestamp) {
        if (!cutoffTimestamp) return;
        const queue = this._loadQueue();
        const remaining = queue.filter(op => (op.timestamp || 0) > cutoffTimestamp);
        this._saveQueue(remaining);
        this._notifyListeners('clear-partial', { remainingLength: remaining.length });
    }

    clearAll() {
        this.storage.removeItem(STORAGE_QUEUE_KEY);
        this.storage.removeItem(STORAGE_PROCESSED_KEY);
        this.storage.removeItem(STORAGE_DEAD_LETTER_KEY);
        this._notifyListeners('clear-all');
    }

    // ── Estatísticas do Motor ──
    getStats() {
        const queue = this._loadQueue();
        const processed = this._loadProcessedOps();
        const deadLetter = this._loadDeadLetter();

        return {
            totalInQueue: queue.length,
            pending: queue.filter(op => op.status === 'pending').length,
            failed: queue.filter(op => op.status === 'failed').length,
            processing: queue.filter(op => op.status === 'processing').length,
            processedHistoryCount: processed.length,
            deadLetterCount: deadLetter.length,
            isProcessing: this.isProcessing,
            deviceId: getDeviceId()
        };
    }

    // ── Sistema de Notificações / Listeners ──
    subscribe(listener) {
        if (typeof listener === 'function') {
            this.listeners.add(listener);
            return () => this.listeners.delete(listener);
        }
        return () => {};
    }

    _notifyListeners(event, data) {
        this.listeners.forEach(fn => {
            try {
                fn(event, data);
            } catch (e) {
                console.error('[Outbox] Erro em listener:', e);
            }
        });
    }
}

// Instância padrão do motor (singleton) para quando for conectado
export const defaultOutbox = new OutboxEngine();
