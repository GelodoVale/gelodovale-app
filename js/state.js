// --- ESTADO GLOBAL DA APLICAÇÃO GELO DO VALE ---
import { pushToFirebase } from './sync.js';
import { migrateLegacyComodatos } from './comodatos.js';
import { initUserAccessControl } from './auth.js';

// Versão centralizada — altere aqui para atualizar em todo o sistema
export const APP_VERSION = "3.9";
export const CODE_BUILD = "v56 (12/06/2026 - Antigravity)";

export let state = {
    prices: {
        gelo5kg: 10.00,
        gelo2kg: 5.00,
        triturado20kg: 30.00,
        carvao: 15.00,
        tina: 50.00,
        mesa: 30.00
    },
    products: [
        { id: "gelo5kg", name: "Pacote Gelo 5kg (Cubo)", type: "Gelo", subtype: "cubo", weight: 5, defaultPrice: 10.00, active: true },
        { id: "gelo2kg", name: "Pacote Gelo 2kg (Cubo)", type: "Gelo", subtype: "cubo", weight: 2, defaultPrice: 5.00, active: true },
        { id: "triturado20kg", name: "Gelo Triturado 20kg", type: "Gelo", subtype: "triturado", weight: 20, defaultPrice: 30.00, active: true },
        { id: "carvao", name: "Saco de Carvão 5kg", type: "Carvão", subtype: "comum", weight: 5, defaultPrice: 15.00, active: true },
        { id: "tina", name: "Aluguel Tina 360L", type: "Equipamento", subtype: "tina", weight: 0, defaultPrice: 50.00, active: true },
        { id: "mesa", name: "Aluguel Mesa + 4 Cad.", type: "Equipamento", subtype: "mesa_cadeiras", weight: 0, defaultPrice: 30.00, active: true }
    ],
    adminPassword: "1234qwer",
    clients: [],
    orders: [],
    deliveries: [],
    freezers: [],
    rentals: [],
    documents: [],
    equipments: [],
    comodatos: [],
    localEvents: [],
    ignoredSpikes: []
};

export function updateState(newState, preserveConfigs = false) {
    // Usar Object.assign preserva a referência do objeto original,
    // evitando que módulos que já importaram 'state' fiquem com dados antigos
    let savedConfigs = {};
    if (preserveConfigs) {
        const keysToPreserve = [
            'users', 'factorySettings', 'backupSettings', 'appearance', 
            'printSettings', 'logisticsSettings', 'firebaseConfig', 
            'localBackups', 'adminPassword', 'notepadText', 'calendarNotes',
            'localEvents', 'ignoredSpikes', 'layoutSettings', 'customIconsLibrary', 'tabIcons'
        ];
        keysToPreserve.forEach(key => {
            if (state[key] !== undefined) {
                try {
                    savedConfigs[key] = JSON.parse(JSON.stringify(state[key]));
                } catch (e) {
                    savedConfigs[key] = state[key];
                }
            }
        });
    }

    Object.keys(state).forEach(k => delete state[k]);
    Object.assign(state, newState);

    if (preserveConfigs) {
        Object.keys(savedConfigs).forEach(key => {
            state[key] = savedConfigs[key];
        });
    }

    normalizeStateArrays();
    initializeDefaultFields();
    initUserAccessControl();
}

export function normalizeStateArrays() {
    const collections = [
        'clients', 'products', 'orders', 'deliveries', 'freezers', 
        'rentals', 'documents', 'payments', 'suppliers', 'packaging', 
        'packagingTransactions', 'cargoSettlements', 'users', 'equipments',
        'comodatos', 'localEvents', 'ignoredSpikes', 'pendingForms'
    ];
    collections.forEach(col => {
        if (state[col]) {
            state[col] = Array.isArray(state[col]) ? state[col] : Object.values(state[col]);
        } else {
            state[col] = [];
        }
    });
}

export let currentPrintDocId = null;
export function setCurrentPrintDocId(val) {
    currentPrintDocId = val;
}

// Configuração de dados cadastrais da fábrica (Gelo do Vale) - mapeado dinamicamente para o state
export const FACTORY_INFO = {
    get name() { return (state.factorySettings && state.factorySettings.name) || "GELO DO VALE INDÚSTRIA DE GELO LTDA."; },
    get cnpj() { return (state.factorySettings && state.factorySettings.cnpj) || "65.007.307/0001-60"; },
    get address() { return (state.factorySettings && state.factorySettings.address) || "Vale do Paraíba, São José dos Campos - SP"; },
    get phone() { return (state.factorySettings && state.factorySettings.phone) || "(12) 99887-6655"; },
    get email() { return (state.factorySettings && state.factorySettings.email) || "contato@gelodovale.com.br"; },
    get pixKey() { return (state.factorySettings && state.factorySettings.pixKey) || ""; }
};

// Configurações de pesos para cálculo do total de kg entregues (via Proxy dinâmico)
export const PRODUCT_WEIGHTS = new Proxy({}, {
    get: (target, prop) => {
        if (!state.products) return 0;
        const prod = state.products.find(p => p.id === prop);
        if (prod) return prod.weight || 0;
        const fallback = { gelo5kg: 5, gelo2kg: 2, triturado20kg: 20 };
        return fallback[prop] || 0;
    }
});

// Nomes amigáveis dos produtos (via Proxy dinâmico)
export const PRODUCT_NAMES = new Proxy({}, {
    get: (target, prop) => {
        if (!state.products) return prop;
        const prod = state.products.find(p => p.id === prop);
        if (prod) return prod.name;
        const fallback = {
            gelo5kg: "Pacote Gelo 5kg",
            gelo2kg: "Pacote Gelo 2kg",
            triturado20kg: "Gelo Triturado 20kg",
            carvao: "Saco de Carvão 5kg",
            tina: "Aluguel Tina 360L",
            mesa: "Aluguel Mesa + 4 Cad."
        };
        return fallback[prop] || prop;
    }
});

// --- DADOS DEMO (MOCK DATA) ---
export const MOCK_DATA = {
    prices: {
        gelo5kg: 12.00,
        gelo2kg: 6.50,
        triturado20kg: 35.00,
        carvao: 15.00,
        tina: 50.00,
        mesa: 30.00
    },
    products: [
        { id: "gelo5kg", name: "Pacote Gelo 5kg (Cubo)", type: "Gelo", subtype: "cubo", weight: 5, defaultPrice: 12.00, active: true },
        { id: "gelo2kg", name: "Pacote Gelo 2kg (Cubo)", type: "Gelo", subtype: "cubo", weight: 2, defaultPrice: 6.50, active: true },
        { id: "triturado20kg", name: "Gelo Triturado 20kg", type: "Gelo", subtype: "triturado", weight: 20, defaultPrice: 35.00, active: true },
        { id: "carvao", name: "Saco de Carvão 5kg", type: "Carvão", subtype: "comum", weight: 5, defaultPrice: 15.00, active: true },
        { id: "tina", name: "Aluguel Tina 360L", type: "Equipamento", subtype: "tina", weight: 0, defaultPrice: 50.00, active: true },
        { id: "mesa", name: "Aluguel Mesa + 4 Cad.", type: "Equipamento", subtype: "mesa_cadeiras", weight: 0, defaultPrice: 30.00, active: true },
        { id: "sab_coco", name: "Gelo Saborizado Água de Coco (12 un)", type: "Gelo Saborizado", flavor: "Água de Coco", packageType: "pacote", unitsPerPack: 12, unitWeightGrams: 200, defaultPrice: 24.00, active: true },
        { id: "sab_melancia", name: "Gelo Saborizado Melancia (12 un)", type: "Gelo Saborizado", flavor: "Melancia", packageType: "pacote", unitsPerPack: 12, unitWeightGrams: 200, defaultPrice: 24.00, active: true },
        { id: "sab_maracuja", name: "Gelo Saborizado Maracujá (12 un)", type: "Gelo Saborizado", flavor: "Maracujá", packageType: "pacote", unitsPerPack: 12, unitWeightGrams: 200, defaultPrice: 24.00, active: true },
        { id: "sab_maca_verde", name: "Gelo Saborizado Maçã Verde (12 un)", type: "Gelo Saborizado", flavor: "Maçã Verde", packageType: "pacote", unitsPerPack: 12, unitWeightGrams: 200, defaultPrice: 24.00, active: true },
        { id: "sab_morango", name: "Gelo Saborizado Morango (12 un)", type: "Gelo Saborizado", flavor: "Morango", packageType: "pacote", unitsPerPack: 12, unitWeightGrams: 200, defaultPrice: 24.00, active: true },
        { id: "sab_sal_limao", name: "Gelo Saborizado Sal e Limão (12 un)", type: "Gelo Saborizado", flavor: "Sal e Limão", packageType: "pacote", unitsPerPack: 12, unitWeightGrams: 200, defaultPrice: 24.00, active: true },
        { id: "sab_frutas_vermelhas", name: "Gelo Saborizado Frutas Vermelhas (12 un)", type: "Gelo Saborizado", flavor: "Frutas Vermelhas", packageType: "pacote", unitsPerPack: 12, unitWeightGrams: 200, defaultPrice: 24.00, active: true },
        { id: "sab_uva", name: "Gelo Saborizado Uva (12 un)", type: "Gelo Saborizado", flavor: "Uva", packageType: "pacote", unitsPerPack: 12, unitWeightGrams: 200, defaultPrice: 24.00, active: true },
        { id: "sab_limao_hortela", name: "Gelo Saborizado Limão com Hortelã (12 un)", type: "Gelo Saborizado", flavor: "Limão com Hortelã", packageType: "pacote", unitsPerPack: 12, unitWeightGrams: 200, defaultPrice: 24.00, active: true },
        { id: "sab_abacaxi", name: "Gelo Saborizado Abacaxi (12 un)", type: "Gelo Saborizado", flavor: "Abacaxi", packageType: "pacote", unitsPerPack: 12, unitWeightGrams: 200, defaultPrice: 24.00, active: true }
    ],
    clients: [
        {
            id: "c-1",
            name: "Supermercado Rondon",
            address: "Rua das Palmeiras, 1024 - Centro",
            phone: "(18) 99123-4567",
            freezerCode: "FRZ-RO-01",
            alertThreshold: 20,
            capacities: { gelo5kg: 60, gelo2kg: 40, triturado20kg: 10 },
            stock: { gelo5kg: 12, gelo2kg: 35, triturado20kg: 1 },
            freezerBrand: "Metalfrio 500L",
            freezerVoltage: "220V",
            freezerCapacity: 500,
            deliveryDate: "2025-10-15",
            maintenanceNotes: "Borracha da porta revisada e preventiva feita em 12/03/2026."
        },
        {
            id: "c-2",
            name: "Quiosque Beira Mar",
            address: "Av. Beira Mar, S/N - Praia Grande",
            phone: "(13) 98111-2233",
            freezerCode: "FRZ-BM-05",
            alertThreshold: 25,
            capacities: { gelo5kg: 40, gelo2kg: 40, triturado20kg: 5 },
            stock: { gelo5kg: 32, gelo2kg: 8, triturado20kg: 4 },
            freezerBrand: "Gelopar 400L",
            freezerVoltage: "110V",
            freezerCapacity: 400,
            deliveryDate: "2025-11-20",
            maintenanceNotes: "Termostato regulado em 05/04/2026."
        },
        {
            id: "c-3",
            name: "Posto Portal da Cidade",
            address: "Rodovia SP-270, Km 450",
            phone: "(11) 97555-8899",
            freezerCode: "FRZ-PT-12",
            alertThreshold: 20,
            capacities: { gelo5kg: 80, gelo2kg: 50, triturado20kg: 15 },
            stock: { gelo5kg: 65, gelo2kg: 42, triturado20kg: 12 },
            freezerBrand: "Fricon 600L",
            freezerVoltage: "220V",
            freezerCapacity: 600,
            deliveryDate: "2024-05-10",
            maintenanceNotes: "Limpeza da condensadora feita em 02/05/2026."
        },
        {
            id: "c-4",
            name: "Restaurante Estrela do Mar",
            address: "Rua dos Pescadores, 85",
            phone: "(11) 3456-7890",
            freezerCode: "FRZ-EM-02",
            alertThreshold: 30,
            capacities: { gelo5kg: 20, gelo2kg: 20, triturado20kg: 20 },
            stock: { gelo5kg: 4, gelo2kg: 12, triturado20kg: 18 },
            freezerBrand: "Metalfrio 300L",
            freezerVoltage: "110V",
            freezerCapacity: 300,
            deliveryDate: "2026-01-08",
            maintenanceNotes: "Entrega inicial do equipamento nova."
        }
    ],
    orders: [
        {
            id: "o-1",
            clientId: "c-1",
            date: new Date(Date.now() - 3600000 * 2).toISOString(),
            status: "pending",
            items: { gelo5kg: 40, gelo2kg: 0, triturado20kg: 8 }
        },
        {
            id: "o-2",
            clientId: "c-4",
            date: new Date(Date.now() - 3600000 * 5).toISOString(),
            status: "pending",
            items: { gelo5kg: 15, gelo2kg: 8, triturado20kg: 0 }
        }
    ],
    deliveries: [
        {
            id: "d-1",
            clientId: "c-3",
            clientName: "Posto Portal da Cidade",
            date: new Date(Date.now() - 86400000 * 6).toISOString(),
            items: { gelo5kg: 30, gelo2kg: 20, triturado20kg: 5 },
            revenue: 665.00
        },
        {
            id: "d-2",
            clientId: "c-2",
            clientName: "Quiosque Beira Mar",
            date: new Date(Date.now() - 86400000 * 5).toISOString(),
            items: { gelo5kg: 20, gelo2kg: 10, triturado20kg: 2 },
            revenue: 375.00
        },
        {
            id: "d-3",
            clientId: "c-1",
            clientName: "Supermercado Rondon",
            date: new Date(Date.now() - 86400000 * 4).toISOString(),
            items: { gelo5kg: 45, gelo2kg: 15, triturado20kg: 5 },
            revenue: 812.50
        },
        {
            id: "d-4",
            clientId: "c-4",
            clientName: "Restaurante Estrela do Mar",
            date: new Date(Date.now() - 86400000 * 3).toISOString(),
            items: { gelo5kg: 10, gelo2kg: 5, triturado20kg: 10 },
            revenue: 502.50
        },
        {
            id: "d-5",
            clientId: "c-3",
            clientName: "Posto Portal da Cidade",
            date: new Date(Date.now() - 86400000 * 2).toISOString(),
            items: { gelo5kg: 50, gelo2kg: 30, triturado20kg: 8 },
            revenue: 1075.00
        },
        {
            id: "d-6",
            clientId: "c-2",
            clientName: "Quiosque Beira Mar",
            date: new Date(Date.now() - 86400000 * 1).toISOString(),
            items: { gelo5kg: 15, gelo2kg: 15, triturado20kg: 0 },
            revenue: 277.50
        }
    ],
    freezers: [
        {
            id: "f-1",
            code: "FRZ-RO-01",
            brand: "Metalfrio 500L",
            voltage: "220V",
            capacity: 500,
            purchaseDate: "2025-10-15",
            warrantyMonths: 24,
            status: "alocado",
            clientId: "c-1",
            clientName: "Supermercado Rondon",
            photoFreezer: "",
            photoInvoice: "",
            maintenanceLogs: [
                { date: "2026-03-12", note: "Borracha da porta revisada e preventiva feita." }
            ],
            movementHistory: [
                { date: "2025-10-15", from: "Fábrica", to: "Supermercado Rondon", reason: "Instalação inicial comodato" }
            ]
        },
        {
            id: "f-2",
            code: "FRZ-BM-05",
            brand: "Gelopar 400L",
            voltage: "110V",
            capacity: 400,
            purchaseDate: "2025-11-20",
            warrantyMonths: 12,
            status: "alocado",
            clientId: "c-2",
            clientName: "Quiosque Beira Mar",
            photoFreezer: "",
            photoInvoice: "",
            maintenanceLogs: [
                { date: "2026-04-05", note: "Termostato regulado devido a oscilação de temperatura." }
            ],
            movementHistory: [
                { date: "2025-11-20", from: "Fábrica", to: "Quiosque Beira Mar", reason: "Instalação inicial comodato" }
            ]
        },
        {
            id: "f-3",
            code: "FRZ-PT-12",
            brand: "Fricon 600L",
            voltage: "220V",
            capacity: 600,
            purchaseDate: "2024-05-10",
            warrantyMonths: 12,
            status: "alocado",
            clientId: "c-3",
            clientName: "Posto Portal da Cidade",
            photoFreezer: "",
            photoInvoice: "",
            maintenanceLogs: [
                { date: "2026-05-02", note: "Limpeza completa da condensadora e carga de gás." }
            ],
            movementHistory: [
                { date: "2024-05-10", from: "Fábrica", to: "Posto Portal da Cidade", reason: "Entrega inicial" }
            ]
        },
        {
            id: "f-4",
            code: "FRZ-EM-02",
            brand: "Metalfrio 300L",
            voltage: "110V",
            capacity: 300,
            purchaseDate: "2026-01-08",
            warrantyMonths: 12,
            status: "alocado",
            clientId: "c-4",
            clientName: "Restaurante Estrela do Mar",
            photoFreezer: "",
            photoInvoice: "",
            maintenanceLogs: [
                { date: "2026-01-08", note: "Entrega inicial do equipamento nova em comodato." }
            ],
            movementHistory: [
                { date: "2026-01-08", from: "Fábrica", to: "Restaurante Estrela do Mar", reason: "Entrega inicial" }
            ]
        },
        {
            id: "f-5",
            code: "FRZ-NEW-01",
            brand: "Metalfrio 500L",
            voltage: "220V",
            capacity: 500,
            purchaseDate: "2026-05-10",
            warrantyMonths: 24,
            status: "disponivel",
            clientId: "",
            clientName: "",
            photoFreezer: "",
            photoInvoice: "",
            maintenanceLogs: [],
            movementHistory: [
                { date: "2026-05-10", from: "Loja Parceira", to: "Fábrica", reason: "Aquisição de novo equipamento" }
            ]
        },
        {
            id: "f-6",
            code: "FRZ-NEW-02",
            brand: "Gelopar 400L",
            voltage: "Bivolt",
            capacity: 400,
            purchaseDate: "2026-05-10",
            warrantyMonths: 12,
            status: "disponivel",
            clientId: "",
            clientName: "",
            photoFreezer: "",
            photoInvoice: "",
            maintenanceLogs: [],
            movementHistory: [
                { date: "2026-05-10", from: "Loja Parceira", to: "Fábrica", reason: "Aquisição de novo equipamento" }
            ]
        },
        {
            id: "f-7",
            code: "FRZ-MNT-03",
            brand: "Consul 400L",
            voltage: "220V",
            capacity: 400,
            purchaseDate: "2023-02-15",
            warrantyMonths: 12,
            status: "manutencao",
            clientId: "",
            clientName: "",
            photoFreezer: "",
            photoInvoice: "",
            maintenanceLogs: [
                { date: "2026-05-15", note: "Envio para oficina por vazamento de gás refrigerante." }
            ],
            movementHistory: [
                { date: "2023-02-15", from: "Fábrica", to: "Quiosque Beira Mar", reason: "Primeira alocação" },
                { date: "2025-11-20", from: "Quiosque Beira Mar", to: "Fábrica", reason: "Recolhido para troca por freezer novo" },
                { date: "2026-05-15", from: "Fábrica", to: "Oficina de Refrigeração", reason: "Conserto de vazamento" }
            ]
        }
    ],
    rentals: [
        {
            id: "r-1",
            clientId: "c-1",
            clientName: "Supermercado Rondon",
            address: "Rua das Palmeiras, 1024 - Centro",
            phone: "(18) 99123-4567",
            itemType: "tina",
            tinaCode: "Tina Azul #02",
            deliveryFee: 15.00,
            rentalFee: 50.00,
            deliveryDate: "2026-05-10",
            expectedReturnDate: "2026-05-20",
            returnDate: null,
            status: "active",
            notes: "Tina alugada para evento interno de inauguração da nova ala.",
            iceItems: { gelo5kg: 5, gelo2kg: 0, triturado20kg: 0, carvao: 2 },
            totalRevenue: 95.00
        },
        {
            id: "r-2",
            clientId: "",
            clientName: "Espetinho do Carlos (Avulso)",
            address: "Av. da Saudade, 450",
            phone: "(12) 98765-4321",
            itemType: "mesa_cadeiras",
            tinaCode: "Conjunto Mesas #05",
            deliveryFee: 20.00,
            rentalFee: 60.00,
            deliveryDate: "2026-05-01",
            expectedReturnDate: "2026-05-04",
            returnDate: "2026-05-04",
            status: "returned",
            notes: "Devolvido limpo e no prazo. Comprou carvão junto.",
            iceItems: { gelo5kg: 0, gelo2kg: 0, triturado20kg: 0, carvao: 3 },
            totalRevenue: 125.00
        },
        {
            id: "r-3",
            clientId: "c-2",
            clientName: "Quiosque Beira Mar",
            address: "Av. Beira Mar, S/N - Praia Grande",
            phone: "(13) 98111-2233",
            itemType: "tina",
            tinaCode: "Tina Verde #01",
            deliveryFee: 10.00,
            rentalFee: 40.00,
            deliveryDate: "2026-05-05",
            expectedReturnDate: "2026-05-08",
            returnDate: null,
            status: "overdue",
            notes: "Cliente solicitou prorrogação, mas a previsão inicial expirou.",
            iceItems: { gelo5kg: 10, gelo2kg: 5, triturado20kg: 1, carvao: 0 },
            totalRevenue: 237.50
        }
    ],
    documents: [
        {
            id: "doc-1",
            type: "orcamento",
            date: "2026-05-18",
            clientId: "c-1",
            clientName: "Supermercado Rondon",
            address: "Rua das Palmeiras, 1024 - Centro",
            phone: "(18) 99123-4567",
            items: [
                { name: "Pacote Gelo 5kg", qty: 20, price: 12.00 },
                { name: "Pacote Gelo 2kg", qty: 10, price: 6.50 },
                { name: "Pacote de Carvão", qty: 5, price: 15.00 }
            ],
            deliveryFee: 15.00,
            total: 395.00
        },
        {
            id: "doc-2",
            type: "recibo",
            date: "2026-05-19",
            clientId: "",
            clientName: "Buffet Festança (Avulso)",
            address: "Rua General Osório, 1420",
            phone: "(12) 99777-8888",
            items: [
                { name: "Gelo Triturado 20kg", qty: 5, price: 35.00 },
                { name: "Aluguel Tina 360L", qty: 2, price: 50.00 },
                { name: "Aluguel Mesa + 4 Cad.", qty: 4, price: 30.00 },
                { name: "Pacote de Carvão", qty: 4, price: 15.00 }
            ],
            deliveryFee: 25.00,
            total: 580.00
        }
    ]
};

export function loadState() {
    const saved = localStorage.getItem("gelcontrol_state");
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            Object.keys(state).forEach(k => delete state[k]);
            Object.assign(state, parsed);
            normalizeStateArrays();
            initializeDefaultFields();
        } catch (e) {
            console.error("Erro ao carregar dados salvos. Iniciando limpo.", e);
        }
    } else {
        Object.keys(state).forEach(k => delete state[k]);
        Object.assign(state, JSON.parse(JSON.stringify(MOCK_DATA)));
        initializeDefaultFields();
        saveStateLocalOnly();
    }
    
    migrateLegacyDebtsToCarnet();
    migrateLegacyComodatos();
    initUserAccessControl();
}

export function initializeDefaultFields() {
    // Retrocompatibilidade para arrays operacionais
    if (!state.clients) state.clients = [];
    // Layout settings — versão 4 usa transform (não mais position:absolute)
    if (!state.layoutSettings) {
        state.layoutSettings = { mode: "fixed", positions: {}, layoutVersion: 4 };
    } else if (!state.layoutSettings.layoutVersion || state.layoutSettings.layoutVersion < 4) {
        // Dados antigos (left/top) são incompatíveis com novo sistema (tx/ty transform)
        // Reset completo: posições limpas, modo volta para fixed
        state.layoutSettings = { mode: "fixed", positions: {}, layoutVersion: 4 };
    }
    if (!state.freezers) state.freezers = [];
    if (!state.rentals) state.rentals = [];
    if (!state.documents) state.documents = [];
    if (!state.orders) state.orders = [];
    if (!state.deliveries) state.deliveries = [];
    if (!state.history) state.history = [];
    if (!state.localBackups) state.localBackups = [];
    if (!state.equipments) state.equipments = [];
    if (!state.localEvents) state.localEvents = [];
    if (!state.ignoredSpikes) state.ignoredSpikes = [];
    
    // Retrocompatibilidade para catálogo dinâmico de produtos
    if (!state.products) {
        state.products = [
            { id: "gelo5kg", name: "Pacote Gelo 5kg (Cubo)", type: "Gelo", subtype: "cubo", weight: 5, defaultPrice: 10.00, active: true },
            { id: "gelo2kg", name: "Pacote Gelo 2kg (Cubo)", type: "Gelo", subtype: "cubo", weight: 2, defaultPrice: 5.00, active: true },
            { id: "triturado20kg", name: "Gelo Triturado 20kg", type: "Gelo", subtype: "triturado", weight: 20, defaultPrice: 30.00, active: true },
            { id: "carvao", name: "Saco de Carvão 5kg", type: "Carvão", subtype: "comum", weight: 5, defaultPrice: 15.00, active: true },
            { id: "tina", name: "Aluguel Tina 360L", type: "Equipamento", subtype: "tina", weight: 0, defaultPrice: 50.00, active: true },
            { id: "mesa", name: "Aluguel Mesa + 4 Cad.", type: "Equipamento", subtype: "mesa_cadeiras", weight: 0, defaultPrice: 30.00, active: true }
        ];
    }

    // Retrocompatibilidade para preços de fábrica
    if (!state.prices) state.prices = {};
    if (state.prices.gelo5kg === undefined) state.prices.gelo5kg = 10.00;
    if (state.prices.gelo2kg === undefined) state.prices.gelo2kg = 5.00;
    if (state.prices.triturado20kg === undefined) state.prices.triturado20kg = 30.00;
    if (state.prices.carvao === undefined) state.prices.carvao = 15.00;
    if (state.prices.tina === undefined) state.prices.tina = 50.00;
    if (state.prices.mesa === undefined) state.prices.mesa = 30.00;

    // Senha padrão do admin
    if (!state.adminPassword || state.adminPassword === "admin") {
        state.adminPassword = "1234qwer";
    }
    
    // Configurações de backup
    if (!state.backupSettings) {
        state.backupSettings = { frequencyDays: 7, lastBackupDate: "", currentVersion: APP_VERSION };
    } else {
        if (state.backupSettings.frequencyDays === undefined) state.backupSettings.frequencyDays = 7;
        if (state.backupSettings.lastBackupDate === undefined) state.backupSettings.lastBackupDate = "";
        if (state.backupSettings.currentVersion === undefined || 
            ["1.0", "2.5", "2.6", "2.7", "3.0", "3.1"].includes(state.backupSettings.currentVersion)) {
             state.backupSettings.currentVersion = APP_VERSION;
        }
    }

    // Dados cadastrais
    if (!state.factorySettings) {
        state.factorySettings = {
            name: "GELO DO VALE INDÚSTRIA DE GELO LTDA.",
            cnpj: "65.007.307/0001-60",
            address: "Vale do Paraíba, São José dos Campos - SP",
            phone: "(12) 99887-6655",
            email: "contato@gelodovale.com.br",
            logo: ""
        };
    }
    if (!state.factorySettings.rentalTerms) {
        state.factorySettings.rentalTerms = "1. O LOCATÁRIO compromete-se a devolver o equipamento na data pactuada, em perfeito estado de conservação, limpeza e funcionamento.\n2. Em caso de atraso na devolução, será cobrada uma taxa de diária extra de atraso por cada dia de atraso, calculada pro rata die com base no valor acordado no ato do aluguel.\n3. O LOCATÁRIO assume total responsabilidade por danos, avarias, perda ou furto do equipamento ocorrido durante o período de locação, obrigando-se a ressarcir o LOCADOR pelo valor de mercado para reposição do bem.\n4. O equipamento destina-se exclusivamente ao uso convencional, sendo vedado sublocar ou ceder o uso a terceiros sem prévio consentimento por escrito do LOCADOR.";
    }

    // Configurações visuais / Aparência
    if (!state.appearance) {
        state.appearance = {
            themeName: "ciano",
            primaryColor: "#00f0ff",
            primaryColorRgb: "0, 240, 255",
            secondaryColor: "#0072ff",
            soundEnabled: true,
            hapticEnabled: true,
            weatherThemeEnabled: true
        };
    }
    if (state.appearance.soundEnabled === undefined) state.appearance.soundEnabled = true;
    if (state.appearance.hapticEnabled === undefined) state.appearance.hapticEnabled = true;
    if (state.appearance.weatherThemeEnabled === undefined) state.appearance.weatherThemeEnabled = true;

    // Impressão
    if (!state.printSettings) {
        state.printSettings = {
            format: "a4",
            showLogo: true,
            showSignatures: true
        };
    }

    // Logística
    if (!state.logisticsSettings) {
        state.logisticsSettings = {
            fuelPrice: 5.80,
            fuelConsumption: 10.0,
            avgSpeed: 60,
            tollBase: 0.00,
            vehicleType: "passeio",
            tollMultiplier: 1.0,
            markupPercent: 0,
            markupFixed: 0.00,
            tollReturn: true
        };
    }

    // Biblioteca de ícones customizados
    if (!state.customIconsLibrary) {
        state.customIconsLibrary = [];
    }
    if (!state.tabIcons) {
        state.tabIcons = {
            dashboard: "📊",
            clientes: "👥",
            inventario: "🧊",
            equipamentos: "📦",
            tinas: "🪣",
            documentos: "🧾",
            pedidos: "⏳",
            historico: "🚚",
            pdv: "🛒",
            admin: "⚙️"
        };
    }

    // Sabores saborizados
    if (state.products && !state.products.some(p => p.type === "Gelo Saborizado")) {
        const defaultFlavored = [
            { id: "sab_coco", name: "Gelo Saborizado Água de Coco (12 un)", type: "Gelo Saborizado", flavor: "Água de Coco", packageType: "pacote", unitsPerPack: 12, unitWeightGrams: 200, defaultPrice: 24.00, active: true },
            { id: "sab_melancia", name: "Gelo Saborizado Melancia (12 un)", type: "Gelo Saborizado", flavor: "Melancia", packageType: "pacote", unitsPerPack: 12, unitWeightGrams: 200, defaultPrice: 24.00, active: true },
            { id: "sab_maracuja", name: "Gelo Saborizado Maracujá (12 un)", type: "Gelo Saborizado", flavor: "Maracujá", packageType: "pacote", unitsPerPack: 12, unitWeightGrams: 200, defaultPrice: 24.00, active: true },
            { id: "sab_maca_verde", name: "Gelo Saborizado Maçã Verde (12 un)", type: "Gelo Saborizado", flavor: "Maçã Verde", packageType: "pacote", unitsPerPack: 12, unitWeightGrams: 200, defaultPrice: 24.00, active: true },
            { id: "sab_morango", name: "Gelo Saborizado Morango (12 un)", type: "Gelo Saborizado", flavor: "Morango", packageType: "pacote", unitsPerPack: 12, unitWeightGrams: 200, defaultPrice: 24.00, active: true },
            { id: "sab_sal_limao", name: "Gelo Saborizado Sal e Limão (12 un)", type: "Gelo Saborizado", flavor: "Sal e Limão", packageType: "pacote", unitsPerPack: 12, unitWeightGrams: 200, defaultPrice: 24.00, active: true },
            { id: "sab_frutas_vermelhas", name: "Gelo Saborizado Frutas Vermelhas (12 un)", type: "Gelo Saborizado", flavor: "Frutas Vermelhas", packageType: "pacote", unitsPerPack: 12, unitWeightGrams: 200, defaultPrice: 24.00, active: true },
            { id: "sab_uva", name: "Gelo Saborizado Uva (12 un)", type: "Gelo Saborizado", flavor: "Uva", packageType: "pacote", unitsPerPack: 12, unitWeightGrams: 200, defaultPrice: 24.00, active: true },
            { id: "sab_limao_hortela", name: "Gelo Saborizado Limão com Hortelã (12 un)", type: "Gelo Saborizado", flavor: "Limão com Hortelã", packageType: "pacote", unitsPerPack: 12, unitWeightGrams: 200, defaultPrice: 24.00, active: true },
            { id: "sab_abacaxi", name: "Gelo Saborizado Abacaxi (12 un)", type: "Gelo Saborizado", flavor: "Abacaxi", packageType: "pacote", unitsPerPack: 12, unitWeightGrams: 200, defaultPrice: 24.00, active: true }
        ];
        state.products.push(...defaultFlavored);
    }

    if (state.products) {
        state.products.forEach(p => {
            if (p.type === "Gelo Saborizado" && p.unitPrice === undefined) {
                p.unitPrice = p.defaultPrice / (p.unitsPerPack || 12);
            }
            if (!p.wholesalePrices) {
                p.wholesalePrices = {
                    tier1_10: null,
                    tier11_20: null,
                    tier21_40: null,
                    tier41_50: null,
                    tier51: null
                };
            }
            if (!p.flashPromo) {
                p.flashPromo = {
                    active: false,
                    price: 0,
                    limit: null
                };
            }
        });
    }

    // Notas e clima
    if (!state.calendarNotes) state.calendarNotes = {};
    if (state.notepadText === undefined) state.notepadText = "";
    if (!state.weatherConfig) {
        state.weatherConfig = { city: "S.J. Campos", temp: 24, condition: "sun", lat: -23.1791, lon: -45.8872 };
    }

    // Novas coleções vazias se ausentes
    if (!state.payments) state.payments = [];
    if (!state.localEvents) state.localEvents = [];
    if (!state.commissionSettings) state.commissionSettings = { type: 'none', value: 0 };
    if (!state.suppliers) state.suppliers = [];
    if (!state.packaging) state.packaging = [];
    if (!state.packagingTransactions) state.packagingTransactions = [];
    if (!state.comodatos) state.comodatos = [];
    if (!state.equipments) state.equipments = [];
    if (state.clients) {
        state.clients.forEach(c => {
            if (c.outstandingDebt === undefined) c.outstandingDebt = 0;
            if (!c.visitDays) c.visitDays = [];
        });
    }
    if (!state.firebaseConfig || !state.firebaseConfig.apiKey) {
        state.firebaseConfig = {
            enabled: true,  // AUTO-ATIVADO: sync em tempo real ligado por padrão
            apiKey: 'AIzaSyBfY-uWaXBHNSheNeCsTyMnc6L_yRtcLtE',
            projectId: 'gelo-do-vale',
            databaseURL: 'https://gelo-do-vale-default-rtdb.firebaseio.com',
            deviceKey: 'gelodovale_oficial'
        };
    }
    // Migração: ativar auto-sync para dispositivos existentes que tinham enabled=false
    // mas já possuem as credenciais preenchidas (não vai afetar quem desativou manualmente pós v34)
    if (state.firebaseConfig && state.firebaseConfig.apiKey &&
        state.firebaseConfig.projectId && state.firebaseConfig.databaseURL &&
        state.firebaseConfig.enabled === false && !state.firebaseConfig._manuallyDisabled) {
        state.firebaseConfig.enabled = true;
    }
    if (!state.cargoSettlements) state.cargoSettlements = [];
    if (state.factorySettings) {
        if (state.factorySettings.pixKey === undefined) state.factorySettings.pixKey = '';
    }
    if (state.lastUpdated === undefined) {
        state.lastUpdated = Date.now();
    }
}

export function recalculateClientDebts() {
    if (!state.clients) return;
    state.clients.forEach(c => {
        if (!c.carnet) c.carnet = [];
        c.outstandingDebt = c.carnet
            .filter(e => !e.paid)
            .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    });
}

export function migrateLegacyDebtsToCarnet() {
    if (!state.clients) return;
    let migratedAny = false;
    
    state.clients.forEach(c => {
        if (!c.carnet) c.carnet = [];
        if (c.carnet.length > 0) return; // já migrado ou possui lançamentos
        
        // 1. Coletar entregas a prazo
        const clientDeliveries = (state.deliveries || []).filter(d => d.clientId === c.id && d.paymentMethod === "A Prazo");
        clientDeliveries.forEach(d => {
            const dateStr = d.date ? new Date(d.date).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR');
            c.carnet.push({
                id: 'cr-mig-del-' + d.id,
                amount: parseFloat(d.revenue) || 0,
                description: `Entrega em ${dateStr}`,
                dueDate: d.date ? d.date.split('T')[0] : new Date().toISOString().split('T')[0],
                paid: false,
                paidDate: null,
                createdAt: d.date || new Date().toISOString()
            });
            migratedAny = true;
        });
        
        // 2. Coletar documentos a prazo
        const clientDocs = (state.documents || []).filter(doc => doc.clientId === c.id && (doc.type === "recibo" || doc.type === "nota") && doc.paymentMethod === "A Prazo");
        clientDocs.forEach(doc => {
            const dateStr = doc.date ? new Date(doc.date + 'T00:00:00').toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR');
            c.carnet.push({
                id: 'cr-mig-doc-' + doc.id,
                amount: parseFloat(doc.total) || 0,
                description: `${doc.type === "nota" ? "Nota" : "Recibo"} em ${dateStr}`,
                dueDate: doc.date || new Date().toISOString().split('T')[0],
                paid: false,
                paidDate: null,
                createdAt: doc.date ? doc.date + 'T12:00:00' : new Date().toISOString()
            });
            migratedAny = true;
        });
        
        // 3. Ordenar o carnê por data de criação
        c.carnet.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        
        // 4. Aplicar pagamentos existentes via FIFO
        const clientPayments = (state.payments || []).filter(p => p.clientId === c.id);
        clientPayments.forEach(p => {
            let remaining = parseFloat(p.amount) || 0;
            const unpaid = c.carnet.filter(e => !e.paid);
            for (const entry of unpaid) {
                if (remaining <= 0) break;
                if (remaining >= entry.amount) {
                    entry.paid = true;
                    entry.paidDate = p.date || new Date().toISOString();
                    remaining -= entry.amount;
                } else {
                    entry.amount -= remaining;
                    c.carnet.push({
                        id: 'cr-mig-part-' + Date.now() + '-' + Math.random().toString().slice(-4),
                        amount: remaining,
                        description: `${entry.description} (Parcial)`,
                        dueDate: entry.dueDate,
                        paid: true,
                        paidDate: p.date || new Date().toISOString(),
                        createdAt: p.date || new Date().toISOString()
                    });
                    remaining = 0;
                }
            }
        });
    });
    
    if (migratedAny) {
        saveStateLocalOnly();
    }
}

function detectOfflineChangeType() {
    try {
        const lastSavedStr = localStorage.getItem("gelcontrol_state");
        if (!lastSavedStr) return "Atualização Geral";
        const last = JSON.parse(lastSavedStr);
        
        if ((state.orders || []).length > (last.orders || []).length) return "Novo Pedido Registrado";
        if ((state.deliveries || []).length > (last.deliveries || []).length) return "Nova Entrega Realizada";
        if ((state.clients || []).length > (last.clients || []).length) return "Novo Cliente Cadastrado";
        if ((state.rentals || []).length > (last.rentals || []).length) return "Novo Aluguel de Tina";
        if ((state.comodatos || []).length > (last.comodatos || []).length) return "Novo Contrato de Comodato";
        if ((state.documents || []).length > (last.documents || []).length) return "Novo Documento Comercial";
        if ((state.freezers || []).length > (last.freezers || []).length) return "Novo Freezer Cadastrado";
        
        if ((state.orders || []).length < (last.orders || []).length) return "Pedido Cancelado/Removido";
        if ((state.clients || []).length < (last.clients || []).length) return "Cliente Removido";
        if ((state.deliveries || []).length < (last.deliveries || []).length) return "Entrega Excluída";
        
        return "Edição de Dados / Atualização de Cadastro";
    } catch (e) {
        return "Alteração de Dados";
    }
}

export function saveStateLocalOnly() {
    recalculateClientDebts();
    localStorage.setItem("gelcontrol_state", JSON.stringify(state));
}

export function saveState() {
    state.lastUpdated = Date.now();
    
    // Se estiver offline, registrar alteração na fila offline
    if (!navigator.onLine) {
        if (!state.offlineChangesQueue) state.offlineChangesQueue = [];
        const changeDesc = detectOfflineChangeType();
        const timestamp = Date.now();
        
        // Evitar registrar duplicatas idênticas em um curto período
        const isDuplicate = state.offlineChangesQueue.some(
            item => item.desc === changeDesc && Math.abs(item.timestamp - timestamp) < 2000
        );
        if (!isDuplicate) {
            state.offlineChangesQueue.push({
                desc: changeDesc,
                timestamp: timestamp
            });
        }
    }
    
    saveStateLocalOnly();
    pushToFirebase();
}
