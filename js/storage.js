// --- GERENCIADOR DE ARMAZENAMENTO INDEXEDDB PARA FOTOS (GELO DO VALE) ---

const DB_NAME = 'GelControlStorage';
const DB_VERSION = 1;
const STORE_NAME = 'photos';

let dbInstance = null;

// Inicializa a conexão com o IndexedDB
export function initDB() {
    return new Promise((resolve, reject) => {
        if (dbInstance) {
            resolve(dbInstance);
            return;
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = function(e) {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };

        request.onsuccess = function(e) {
            dbInstance = e.target.result;
            resolve(dbInstance);
        };

        request.onerror = function(e) {
            console.error("Erro ao abrir IndexedDB GelControlStorage:", e.target.error);
            reject(e.target.error);
        };
    });
}

// Salva ou atualiza uma foto no IndexedDB
export async function savePhoto(id, base64Data) {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        
        const record = { id: id, data: base64Data, timestamp: Date.now() };
        const request = store.put(record);

        request.onsuccess = function() {
            resolve(id);
        };

        request.onerror = function(e) {
            console.error("Erro ao salvar foto no IndexedDB:", e.target.error);
            reject(e.target.error);
        };
    });
}

// Recupera uma foto do IndexedDB por ID
export async function getPhoto(id) {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(id);

        request.onsuccess = function(e) {
            const record = e.target.result;
            resolve(record ? record.data : null);
        };

        request.onerror = function(e) {
            console.error("Erro ao buscar foto no IndexedDB:", e.target.error);
            reject(e.target.error);
        };
    });
}

// Remove uma foto do IndexedDB por ID
export async function deletePhoto(id) {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);

        request.onsuccess = function() {
            resolve(true);
        };

        request.onerror = function(e) {
            console.error("Erro ao remover foto do IndexedDB:", e.target.error);
            reject(e.target.error);
        };
    });
}

// Limpa todas as fotos do IndexedDB
export async function clearAllPhotos() {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.clear();

        request.onsuccess = function() {
            resolve(true);
        };

        request.onerror = function(e) {
            console.error("Erro ao limpar fotos do IndexedDB:", e.target.error);
            reject(e.target.error);
        };
    });
}

// Inicializar banco ao carregar
initDB().catch(err => console.error("Falha ao inicializar o banco IndexedDB:", err));

// Vincular ao objeto window para fácil acesso em todos os módulos e scripts inline
window.GelStorage = {
    initDB,
    savePhoto,
    getPhoto,
    deletePhoto,
    clearAllPhotos
};
