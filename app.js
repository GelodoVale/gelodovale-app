/* ==========================================================================
   GELCONTROL - LÓGICA E ESTADO DA APLICAÇÃO (VANILLA JS)
   ========================================================================== */

// --- ESTADO GLOBAL DA APLICAÇÃO ---
let state = {
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
    adminPassword: "1120M@z@dr1",
    clients: [],
    orders: [],
    deliveries: [],
    freezers: [], // Inventário de Equipamentos
    rentals: [], // Aluguéis de Tinas (Coolers) e Mobiliário
    documents: [], // Recibos e Orçamentos
    widgetsConfig: {
        activeWidgets: ["clock", "weather", "calendar", "notepad", "sales_calc", "financial", "ice_stock", "contacts"],
        styles: {
            clock: "analog-neon",      // analog-neon, analog-gold, analog-minimal, digital-neon, digital-retro
            weather: "detailed",        // minimal, detailed, graph
            notepad: "glass-sticky",    // glass-sticky, terminal, yellow-pad
            calendar: "interactive",    // interactive, events-only
            sales_calc: "modern",        // modern, retro
            financial: "detailed",
            ice_stock: "progress",
            contacts: "cards"
        },
        sizes: {
            clock: "small",
            weather: "small",
            calendar: "small",
            notepad: "small",
            sales_calc: "small",
            financial: "small",
            ice_stock: "small",
            contacts: "small"
        }
    }
};

let currentPrintDocId = null;

// Configuração de dados cadastrais da fábrica (Gelo do Vale) - mapeado dinamicamente para o state
const FACTORY_INFO = {
    get name() { return (state.factorySettings && state.factorySettings.name) || "GELO DO VALE INDÚSTRIA DE GELO LTDA."; },
    get cnpj() { return (state.factorySettings && state.factorySettings.cnpj) || "65.007.307/0001-60"; },
    get address() { return (state.factorySettings && state.factorySettings.address) || "Vale do Paraíba, São José dos Campos - SP"; },
    get phone() { return (state.factorySettings && state.factorySettings.phone) || "(12) 99887-6655"; },
    get email() { return (state.factorySettings && state.factorySettings.email) || "contato@gelodovale.com.br"; },
    get pixKey() { return (state.factorySettings && state.factorySettings.pixKey) || ""; }
};

// Configurações de pesos para cálculo do total de kg entregues (via Proxy dinâmico)
const PRODUCT_WEIGHTS = new Proxy({}, {
    get: (target, prop) => {
        if (!state.products) return 0;
        const prod = state.products.find(p => p.id === prop);
        if (prod) return prod.weight || 0;
        const fallback = { gelo5kg: 5, gelo2kg: 2, triturado20kg: 20 };
        return fallback[prop] || 0;
    }
});

// Nomes amigáveis dos produtos (via Proxy dinâmico)
const PRODUCT_NAMES = new Proxy({}, {
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
const MOCK_DATA = {
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
            date: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 horas atrás
            status: "pending",
            items: { gelo5kg: 40, gelo2kg: 0, triturado20kg: 8 }
        },
        {
            id: "o-2",
            clientId: "c-4",
            date: new Date(Date.now() - 3600000 * 5).toISOString(), // 5 horas atrás
            status: "pending",
            items: { gelo5kg: 15, gelo2kg: 8, triturado20kg: 0 }
        }
    ],
    deliveries: [
        {
            id: "d-1",
            clientId: "c-3",
            clientName: "Posto Portal da Cidade",
            date: new Date(Date.now() - 86400000 * 6).toISOString(), // 6 dias atrás
            items: { gelo5kg: 30, gelo2kg: 20, triturado20kg: 5 },
            revenue: 665.00 // 30*12 + 20*6.50 + 5*35
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
            totalRevenue: 95.00 // 50 + 15 + 5*12 (60) + 2*15 (30) = 155 -> wait, let's calculate: 50 + 15 + 60 + 30 = 155
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
            totalRevenue: 125.00 // 60 + 20 + 3*15 (45) = 125
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
            totalRevenue: 237.50 // 40 + 10 + 10*12 (120) + 5*6.5 (32.5) + 1*35 (35) = 237.50
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
            total: 395.00 // 20*12 + 10*6.50 + 5*15 + 15 = 240 + 65 + 75 + 15 = 395
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
            total: 580.00 // 5*35 + 2*50 + 4*30 + 4*15 + 25 = 175 + 100 + 120 + 60 + 25 = 480
        }
    ]
};

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

    // Inicializar o modo Sol Forte (Alto Contraste) se salvo
    const savedContrast = localStorage.getItem("highContrastTheme");
    if (savedContrast === "enabled") {
        document.body.classList.add("theme-high-contrast");
        const btn = document.getElementById("btn-toggle-contrast");
        if (btn) btn.innerHTML = '<i data-lucide="moon"></i>';
    }
    
    // 2. Inicializar ícones do Lucide
    lucide.createIcons();
    
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
    checkAutoBackupOnLoad();
    
    // 7. Botão Mock Data
    document.getElementById("btn-mock-data").addEventListener("click", () => {
        if (confirm("Deseja carregar os dados de demonstração? Isso substituirá as informações atuais.")) {
            state = JSON.parse(JSON.stringify(MOCK_DATA));
            saveState();
            renderApp();
            alert("Dados de demonstração carregados com sucesso!");
        }
    });

    // 8. Inicializar central de utilitários (Relógio, Clima, Calendário & Notas)
    initUtilityPanel();
    
    // 9. Inicializar controle de acesso e tela de login
    if (typeof initLoginScreen === "function") {
        initLoginScreen();
    }
    
    // 10. Sincronizar com OneDrive automaticamente no início se aplicável
    checkOneDriveSync();

    // 11. Inicializar QR Code do GitHub Pages
    initGitHubQRCode();
});

// --- PERSISTÊNCIA DE DADOS ---
function loadState() {
    const saved = localStorage.getItem("gelcontrol_state");
    if (saved) {
        try {
            state = JSON.parse(saved);
            // Retrocompatibilidade para arrays operacionais
            if (!state.clients) state.clients = [];
            if (!state.freezers) state.freezers = [];
            if (!state.rentals) state.rentals = [];
            if (!state.documents) state.documents = [];
            if (!state.orders) state.orders = [];
            if (!state.deliveries) state.deliveries = [];
            if (!state.history) state.history = [];
            if (!state.localBackups) state.localBackups = [];
            
            // Retrocompatibilidade para catálogo dinâmico de produtos
            if (!state.products) {
                state.products = [
                    { id: "gelo5kg", name: "Pacote Gelo 5kg (Cubo)", type: "Gelo", subtype: "cubo", weight: 5, defaultPrice: (state.prices && state.prices.gelo5kg) || 10.00, active: true },
                    { id: "gelo2kg", name: "Pacote Gelo 2kg (Cubo)", type: "Gelo", subtype: "cubo", weight: 2, defaultPrice: (state.prices && state.prices.gelo2kg) || 5.00, active: true },
                    { id: "triturado20kg", name: "Gelo Triturado 20kg", type: "Gelo", subtype: "triturado", weight: 20, defaultPrice: (state.prices && state.prices.triturado20kg) || 30.00, active: true },
                    { id: "carvao", name: "Saco de Carvão 5kg", type: "Carvão", subtype: "comum", weight: 5, defaultPrice: (state.prices && state.prices.carvao) || 15.00, active: true },
                    { id: "tina", name: "Aluguel Tina 360L", type: "Equipamento", subtype: "tina", weight: 0, defaultPrice: (state.prices && state.prices.tina) || 50.00, active: true },
                    { id: "mesa", name: "Aluguel Mesa + 4 Cad.", type: "Equipamento", subtype: "mesa_cadeiras", weight: 0, defaultPrice: (state.prices && state.prices.mesa) || 30.00, active: true }
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
            // Atualizar senha padrão do administrador se necessário
            if (!state.adminPassword || state.adminPassword === "admin") {
                state.adminPassword = "1120M@z@dr1";
            }
            
            // Backup e versões retrocompatíveis
            if (!state.backupSettings) {
                state.backupSettings = { frequencyDays: 7, lastBackupDate: "", currentVersion: "2.7" };
            } else {
                if (state.backupSettings.frequencyDays === undefined) state.backupSettings.frequencyDays = 7;
                if (state.backupSettings.lastBackupDate === undefined) state.backupSettings.lastBackupDate = "";
                if (state.backupSettings.currentVersion === undefined || state.backupSettings.currentVersion === "1.0" || state.backupSettings.currentVersion === "2.5" || state.backupSettings.currentVersion === "2.6") {
                    state.backupSettings.currentVersion = "2.7";
                }
            }

            // Inicializar dados cadastrais se vazios
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

            // Inicializar aparência se vazia
            if (!state.appearance) {
                state.appearance = {
                    themeName: "ciano",
                    primaryColor: "#00f0ff",
                    primaryColorRgb: "0, 240, 255",
                    secondaryColor: "#0072ff"
                };
            }

            // Inicializar configurações de widgets se vazias
            if (!state.widgetsConfig) {
                state.widgetsConfig = {
                    activeWidgets: ["clock", "weather", "calendar", "notepad", "sales_calc", "financial", "ice_stock", "contacts"],
                    styles: {
                        clock: "analog-neon",
                        weather: "detailed",
                        notepad: "glass-sticky",
                        calendar: "interactive",
                        sales_calc: "modern",
                        financial: "detailed",
                        ice_stock: "progress",
                        contacts: "cards"
                    },
                    sizes: {
                        clock: "small",
                        weather: "small",
                        calendar: "small",
                        notepad: "small",
                        sales_calc: "small",
                        financial: "small",
                        ice_stock: "small",
                        contacts: "small"
                    }
                };
            }

            // Inicializar configurações de impressão se vazias
            if (!state.printSettings) {
                state.printSettings = {
                    format: "a4",
                    showLogo: true,
                    showSignatures: true
                };
            }

            // Inicializar configurações de logística se vazias
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

            // Adicionar os sabores padrão de gelo saborizado caso não existam
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
                saveState();
            }
        } catch (e) {
            console.error("Erro ao carregar dados salvos. Iniciando limpo.", e);
        }
    } else {
        // Inicializar com dados demo por padrão para melhor experiência visual imediata
        state = JSON.parse(JSON.stringify(MOCK_DATA));
        state.adminPassword = "1120M@z@dr1";
        state.backupSettings = { frequencyDays: 7, lastBackupDate: "", currentVersion: "2.7" };
        state.factorySettings = {
            name: "GELO DO VALE INDÚSTRIA DE GELO LTDA.",
            cnpj: "65.007.307/0001-60",
            address: "Vale do Paraíba, São José dos Campos - SP",
            phone: "(12) 99887-6655",
            email: "contato@gelodovale.com.br",
            logo: ""
        };
        state.appearance = {
            themeName: "ciano",
            primaryColor: "#00f0ff",
            primaryColorRgb: "0, 240, 255",
            secondaryColor: "#0072ff"
        };
        state.printSettings = {
            format: "a4",
            showLogo: true,
            showSignatures: true
        };
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
        state.widgetsConfig = {
            activeWidgets: ["clock", "weather", "calendar", "notepad", "sales_calc", "financial", "ice_stock", "contacts"],
            styles: {
                clock: "analog-neon",
                weather: "detailed",
                notepad: "glass-sticky",
                calendar: "interactive",
                sales_calc: "modern",
                financial: "detailed",
                ice_stock: "progress",
                contacts: "cards"
            },
            sizes: {
                clock: "small",
                weather: "small",
                calendar: "small",
                notepad: "small",
                sales_calc: "small",
                financial: "small",
                ice_stock: "small",
                contacts: "small"
            }
        };
        state.localBackups = [];
        saveState();
    }

    // Garantir campos de precificação avançada para todos os produtos
    if (state.products) {
        let stateChanged = false;
        state.products.forEach(p => {
            if (p.type === "Gelo Saborizado" && p.unitPrice === undefined) {
                p.unitPrice = p.defaultPrice / (p.unitsPerPack || 12);
                stateChanged = true;
            }
            if (!p.wholesalePrices) {
                p.wholesalePrices = {
                    tier1_10: null,
                    tier11_20: null,
                    tier21_40: null,
                    tier41_50: null,
                    tier51: null
                };
                stateChanged = true;
            }
            if (!p.flashPromo) {
                p.flashPromo = {
                    active: false,
                    price: 0,
                    limit: 0
                };
                stateChanged = true;
            }
        });
        if (stateChanged) saveState();
    }

    // Inicializar campos da Central de Utilitários se vazios
    let utilityStateChanged = false;
    if (!state.calendarNotes) {
        state.calendarNotes = {};
        utilityStateChanged = true;
    }
    if (state.notepadText === undefined) {
        state.notepadText = "";
        utilityStateChanged = true;
    }
    if (!state.weatherConfig) {
        state.weatherConfig = { city: "S.J. Campos", temp: 24, condition: "sun", lat: -23.1791, lon: -45.8872 };
        utilityStateChanged = true;
    }
    if (utilityStateChanged) {
        saveState();
    }

    // Inicializar novos campos das melhorias operacionais e suprimentos
    let newFieldsChanged = false;
    if (!state.payments) { state.payments = []; newFieldsChanged = true; }
    if (!state.commissionSettings) { state.commissionSettings = { type: 'none', value: 0 }; newFieldsChanged = true; }
    if (!state.suppliers) { state.suppliers = []; newFieldsChanged = true; }
    if (!state.packaging) { state.packaging = []; newFieldsChanged = true; }
    if (!state.packagingTransactions) { state.packagingTransactions = []; newFieldsChanged = true; }
    if (!state.comodatos) { state.comodatos = []; newFieldsChanged = true; }
    if (state.clients) {
        state.clients.forEach(c => {
            if (c.outstandingDebt === undefined) { c.outstandingDebt = 0; newFieldsChanged = true; }
            if (!c.visitDays) { c.visitDays = []; newFieldsChanged = true; }
        });
    }
    if (!state.firebaseConfig || !state.firebaseConfig.apiKey) {
        state.firebaseConfig = {
            enabled: true,
            apiKey: 'AIzaSyBfY-uWaXBHNSheNeCsTyMnc6L_yRtcLtE',
            projectId: 'gelo-do-vale',
            databaseURL: 'https://gelo-do-vale-default-rtdb.firebaseio.com',
            deviceKey: 'gelodovale_oficial'
        };
        newFieldsChanged = true;
    }
    if (!state.cargoSettlements) {
        state.cargoSettlements = [];
        newFieldsChanged = true;
    }
    if (state.factorySettings) {
        if (state.factorySettings.pixKey === undefined) {
            state.factorySettings.pixKey = '';
            newFieldsChanged = true;
        }
        if (!state.factorySettings.rentalTerms) {
            state.factorySettings.rentalTerms = "1. O LOCATÁRIO compromete-se a devolver o equipamento na data pactuada, em perfeito estado de conservação, limpeza e funcionamento.\n2. Em caso de atraso na devolução, será cobrada uma taxa de diária extra de atraso por cada dia de atraso, calculada pro rata die com base no valor acordado no ato do aluguel.\n3. O LOCATÁRIO assume total responsabilidade por danos, avarias, perda ou furto do equipamento ocorrido durante o período de locação, obrigando-se a ressarcir o LOCADOR pelo valor de mercado para reposição do bem.\n4. O equipamento destina-se exclusivamente ao uso convencional, sendo vedado sublocar ou ceder o uso a terceiros sem prévio consentimento por escrito do LOCADOR.";
            newFieldsChanged = true;
        }
    }
    if (state.lastUpdated === undefined) {
        state.lastUpdated = Date.now();
        newFieldsChanged = true;
    }
    if (newFieldsChanged) saveStateLocalOnly();
    
    migrateLegacyComodatos();
    initUserAccessControl();
}

function recalculateClientDebts() {
    if (!state.clients) return;
    state.clients.forEach(c => { c.outstandingDebt = 0; });
    if (state.deliveries) {
        state.deliveries.forEach(d => {
            if (d.paymentMethod === "A Prazo") {
                const c = state.clients.find(item => item.id === d.clientId);
                if (c) c.outstandingDebt = (c.outstandingDebt || 0) + (d.revenue || 0);
            }
        });
    }
    if (state.documents) {
        state.documents.forEach(doc => {
            if ((doc.type === "recibo" || doc.type === "nota") && doc.paymentMethod === "A Prazo") {
                const c = state.clients.find(item => item.id === doc.clientId);
                if (c) c.outstandingDebt = (c.outstandingDebt || 0) + (doc.total || 0);
            }
        });
    }
    if (state.payments) {
        state.payments.forEach(p => {
            const c = state.clients.find(item => item.id === p.clientId);
            if (c) c.outstandingDebt = (c.outstandingDebt || 0) - (p.amount || 0);
        });
    }
}
window.recalculateClientDebts = recalculateClientDebts;

function saveStateLocalOnly() {
    recalculateClientDebts();
    localStorage.setItem("gelcontrol_state", JSON.stringify(state));
}
window.saveStateLocalOnly = saveStateLocalOnly;

async function checkOneDriveSync() {
    // 1. Detecta se está rodando a partir da pasta do OneDrive analisando o caminho da URL
    const isOneDrivePath = window.location.pathname.includes("OneDrive") || window.location.pathname.includes("GelodoVale-system");
    if (isOneDrivePath) {
        updateOneDriveStatusUI("connected");
    }

    try {
        const response = await fetch("../state_backup.json");
        if (response.ok) {
            const payload = await response.json();
            if (payload && (payload.clients || payload.freezers || payload.prices)) {
                updateOneDriveStatusUI("connected");
                if (!state.firebaseConfig || !state.firebaseConfig.enabled) {
                    updateSyncStatusUI("onedrive");
                }
                const backupLastUpdated = payload.lastUpdated || 0;
                const localLastUpdated = state.lastUpdated || 0;
                const hasLocalStorage = !!localStorage.getItem("gelcontrol_state");
                
                if (!hasLocalStorage || backupLastUpdated > localLastUpdated) {
                    console.log("OneDrive backup is newer. Restoring data automatically...");
                    state = payload;
                    saveStateLocalOnly();
                    renderApp();
                    showOneDriveToast("Dados do OneDrive carregados automaticamente!");
                }
            }
        }
    } catch (err) {
        console.log("OneDrive local backup not loaded automatically via fetch:", err);
    }
}
window.checkOneDriveSync = checkOneDriveSync;

function saveStateToOneDrive() {
    try {
        state.lastUpdated = Date.now();
        saveStateLocalOnly();
        
        const jsonString = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", jsonString);
        downloadAnchor.setAttribute("download", "state_backup.json");
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        
        showOneDriveToast("Backup baixado! Substitua na pasta GelodoVale-system do OneDrive.");
    } catch (e) {
        alert("Erro ao salvar no OneDrive: " + e.message);
    }
}
window.saveStateToOneDrive = saveStateToOneDrive;

function showOneDriveToast(message) {
    const toast = document.createElement("div");
    toast.style.position = "fixed";
    toast.style.top = "20px";
    toast.style.right = "20px";
    toast.style.background = "rgba(0, 240, 255, 0.95)";
    toast.style.color = "#000";
    toast.style.padding = "12px 24px";
    toast.style.borderRadius = "8px";
    toast.style.boxShadow = "0 4px 20px rgba(0, 240, 255, 0.25)";
    toast.style.zIndex = "99999";
    toast.style.fontSize = "0.85rem";
    toast.style.fontWeight = "bold";
    toast.style.display = "flex";
    toast.style.alignItems = "center";
    toast.style.gap = "8px";
    toast.style.border = "1px solid rgba(0, 240, 255, 0.5)";
    toast.style.backdropFilter = "blur(10px)";
    toast.style.transition = "opacity 0.3s ease, transform 0.3s ease";
    toast.style.transform = "translateY(-10px)";
    toast.style.opacity = "0";
    
    toast.innerHTML = `
        <i data-lucide="cloud" style="width: 16px; height: 16px;"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(toast);
    toast.offsetHeight; // force reflow
    toast.style.transform = "translateY(0)";
    toast.style.opacity = "1";
    
    if (window.lucide) {
        lucide.createIcons({ attrs: { class: 'lucide' }, node: toast });
    }
    
    setTimeout(() => {
        toast.style.transform = "translateY(-10px)";
        toast.style.opacity = "0";
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 4000);
}
window.showOneDriveToast = showOneDriveToast;

function saveState() {
    state.lastUpdated = Date.now();
    saveStateLocalOnly();
    pushToFirebase();
}

// --- SISTEMA DE SINCRONIZAÇÃO EM NUVEM (FIREBASE) ---
let firebaseSDKLoaded = false;
let fbDatabaseRef = null;

function loadFirebaseSDK(callback) {
    if (firebaseSDKLoaded || (window.firebase && window.firebase.database)) {
        firebaseSDKLoaded = true;
        if (callback) callback();
        return;
    }
    
    const scriptApp = document.createElement("script");
    scriptApp.src = "https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js";
    scriptApp.onload = () => {
        const scriptDB = document.createElement("script");
        scriptDB.src = "https://www.gstatic.com/firebasejs/9.22.0/firebase-database-compat.js";
        scriptDB.onload = () => {
            firebaseSDKLoaded = true;
            if (callback) callback();
        };
        scriptDB.onerror = (err) => {
            console.error("Erro ao carregar SDK de Banco de Dados do Firebase:", err);
            updateSyncStatusUI("error");
        };
        document.head.appendChild(scriptDB);
    };
    scriptApp.onerror = (err) => {
        console.error("Erro ao carregar SDK Base do Firebase:", err);
        updateSyncStatusUI("error");
    };
    document.head.appendChild(scriptApp);
}

function startSyncListener() {
    if (!state.firebaseConfig || !state.firebaseConfig.deviceKey) return;
    
    const deviceKey = state.firebaseConfig.deviceKey;
    fbDatabaseRef = firebase.database().ref(`factories/${deviceKey}`);
    
    updateSyncStatusUI("syncing");
    
    fbDatabaseRef.off();
    
    fbDatabaseRef.on("value", snapshot => {
        const remoteData = snapshot.val();
        if (!remoteData) {
            pushToFirebase();
            return;
        }
        
        const localLastUpdated = state.lastUpdated || 0;
        const remoteLastUpdated = remoteData.lastUpdated || 0;
        
        if (remoteLastUpdated > localLastUpdated) {
            console.log("Detectado dados mais recentes no Firebase. Sincronizando localmente...");
            state = remoteData;
            saveStateLocalOnly();
            renderApp();
            updateSyncStatusUI("success");
        } else if (localLastUpdated > remoteLastUpdated) {
            console.log("Local é mais recente. Enviando para o Firebase...");
            pushToFirebase();
        } else {
            updateSyncStatusUI("success");
        }
    }, error => {
        console.error("Erro no listener do Firebase:", error);
        updateSyncStatusUI("error");
    });
}

function pushToFirebase() {
    if (!state.firebaseConfig || !state.firebaseConfig.enabled) {
        updateSyncStatusUI("disabled");
        return;
    }
    
    if (!window.firebase || !window.firebase.apps || window.firebase.apps.length === 0) {
        initFirebase();
        return;
    }
    
    const deviceKey = state.firebaseConfig.deviceKey;
    if (!deviceKey) return;
    
    updateSyncStatusUI("syncing");
    
    firebase.database().ref(`factories/${deviceKey}`).set(state)
        .then(() => {
            updateSyncStatusUI("success");
            console.log("Estado sincronizado com o Firebase com sucesso!");
        })
        .catch(err => {
            console.error("Erro ao enviar dados para o Firebase:", err);
            updateSyncStatusUI("error");
        });
}
window.pushToFirebase = pushToFirebase;

function initFirebase(callback) {
    if (!state.firebaseConfig || !state.firebaseConfig.enabled) {
        updateSyncStatusUI("disabled");
        if (callback) callback();
        return;
    }
    
    const { apiKey, projectId, databaseURL, deviceKey } = state.firebaseConfig;
    if (!apiKey || !projectId || !databaseURL || !deviceKey) {
        console.warn("Configurações do Firebase incompletas.");
        updateSyncStatusUI("error");
        if (callback) callback();
        return;
    }
    
    updateSyncStatusUI("syncing");
    
    loadFirebaseSDK(() => {
        try {
            const config = { apiKey, projectId, databaseURL };
            if (firebase.apps.length === 0) {
                firebase.initializeApp(config);
            }
            startSyncListener();
            if (callback) callback();
        } catch (error) {
            console.error("Erro ao inicializar Firebase:", error);
            updateSyncStatusUI("error");
            if (callback) callback();
        }
    });
}
window.initFirebase = initFirebase;

function toggleFirebaseSync(checked) {
    if (!state.firebaseConfig) {
        state.firebaseConfig = { enabled: false, apiKey: '', projectId: '', databaseURL: '', deviceKey: '' };
    }
    state.firebaseConfig.enabled = checked;
    saveStateLocalOnly();
    if (checked) {
        initFirebase();
    } else {
        if (fbDatabaseRef) {
            fbDatabaseRef.off();
        }
        updateSyncStatusUI("disabled");
    }
}
window.toggleFirebaseSync = toggleFirebaseSync;

function saveFirebaseSettings() {
    const enabled = document.getElementById("cfg-fb-enabled").checked;
    const apiKey = document.getElementById("cfg-fb-api-key").value.trim();
    const projectId = document.getElementById("cfg-fb-project-id").value.trim();
    const databaseURL = document.getElementById("cfg-fb-db-url").value.trim();
    const deviceKey = document.getElementById("cfg-fb-device-key").value.trim();
    
    state.firebaseConfig = { enabled, apiKey, projectId, databaseURL, deviceKey };
    saveState();
    
    alert("Configurações do Firebase salvas!");
}
window.saveFirebaseSettings = saveFirebaseSettings;

function forceManualSync() {
    const indicator = document.getElementById("cloud-sync-status");
    if (indicator && indicator.title && indicator.title.includes("OneDrive")) {
        const confirmSave = confirm("OneDrive está conectado! Deseja gravar as alterações atuais e exportar o arquivo 'state_backup.json' para a sua pasta do OneDrive?");
        if (confirmSave) {
            saveStateToOneDrive();
        }
        return;
    }

    if (!state.firebaseConfig || !state.firebaseConfig.enabled) {
        const goToSettings = confirm("A sincronização em nuvem (Firebase) está desativada. Deseja ir para as configurações de Nuvem & Backup para ativá-la?");
        if (goToSettings) {
            navigateToTab('precos');
            switchAdminSubTab('tab-seguranca-backup');
        }
        return;
    }
    
    state.lastUpdated = Date.now();
    saveStateLocalOnly();
    
    if (!window.firebase || !window.firebase.apps || window.firebase.apps.length === 0) {
        initFirebase(() => {
            pushToFirebase();
        });
    } else {
        pushToFirebase();
    }
}
window.forceManualSync = forceManualSync;

function updateSyncStatusUI(status) {
    const indicator = document.getElementById("cloud-sync-status");
    if (!indicator) return;
    
    let iconName = "cloud-off";
    let iconColor = "var(--color-text-muted)";
    let titleText = "Sincronização Desativada";
    let isSpinning = false;
    
    switch (status) {
        case "onedrive":
            iconName = "cloud";
            iconColor = "var(--color-primary)";
            titleText = "Sincronização por Arquivo (OneDrive)";
            break;
        case "success":
            iconName = "cloud";
            iconColor = "#00ff64";
            titleText = "Nuvem Ativa e Sincronizada";
            break;
        case "syncing":
            iconName = "refresh-cw";
            iconColor = "#ffaa00";
            titleText = "Sincronizando com a Nuvem...";
            isSpinning = true;
            break;
        case "error":
            iconName = "alert-triangle";
            iconColor = "#ff4d4d";
            titleText = "Erro de Conexão/Sincronização";
            break;
        case "disabled":
        default:
            iconName = "cloud-off";
            iconColor = "var(--color-text-muted)";
            titleText = "Sincronização na Nuvem Desativada";
            break;
    }
    
    indicator.title = titleText;
    indicator.innerHTML = `<i data-lucide="${iconName}" class="${isSpinning ? 'spin-anim' : ''}" style="width: 18px; height: 18px; color: ${iconColor};"></i>`;
    
    const btnSync = document.getElementById("btn-force-sync");
    if (btnSync) {
        if (status === "syncing") {
            btnSync.innerHTML = `<i data-lucide="refresh-cw" class="spin-anim" style="width: 14px; height: 14px;"></i> Sincronizando...`;
            btnSync.disabled = true;
        } else {
            btnSync.innerHTML = `<i data-lucide="refresh-cw" style="width: 14px; height: 14px;"></i> Forçar Sincronização Agora`;
            btnSync.disabled = false;
        }
    }
    
    lucide.createIcons();
}
window.updateSyncStatusUI = updateSyncStatusUI;

function updateOneDriveStatusUI(status) {
    const indicator = document.getElementById("onedrive-sync-status");
    if (!indicator) return;

    let iconColor = "var(--color-text-muted)";
    let titleText = "OneDrive Desconectado";

    if (status === "connected") {
        iconColor = "var(--color-primary)"; // Ciano
        titleText = "OneDrive Conectado (Local) - Clique para Salvar Backup";
    }

    indicator.title = titleText;
    indicator.innerHTML = `<i data-lucide="folder-sync" style="width: 18px; height: 18px; color: ${iconColor};"></i>`;
    if (window.lucide) {
        lucide.createIcons();
    }
}
window.updateOneDriveStatusUI = updateOneDriveStatusUI;

function toggleHighContrastTheme() {
    const isContrast = document.body.classList.toggle("theme-high-contrast");
    localStorage.setItem("highContrastTheme", isContrast ? "enabled" : "disabled");
    const btn = document.getElementById("btn-toggle-contrast");
    if (btn) {
        btn.innerHTML = isContrast ? '<i data-lucide="moon"></i>' : '<i data-lucide="sun"></i>';
        lucide.createIcons();
    }
}
window.toggleHighContrastTheme = toggleHighContrastTheme;


// --- CONTROLE DE NAVEGAÇÃO ENTRE ABAS ---
function initNavigation() {
    const navItems = document.querySelectorAll(".nav-item");
    const tabContents = document.querySelectorAll(".tab-content");
    const pageTitle = document.getElementById("page-title");
    const pageSubtitle = document.getElementById("page-subtitle");
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
                            alert("Você não possui permissão para acessar esta aba.");
                            return;
                        }
                    } else {
                        const hasPerm = currentUser.permissions["tab-" + targetTab];
                        if (hasPerm === false) {
                            alert("Você não possui permissão para acessar esta aba.");
                            return;
                        }
                    }
                }
            }
            
            // Parar câmera se estiver rodando e mudar de aba
            if (targetTab !== "inventario") {
                stopQRScanner();
            }
            
            // Alterar navegação ativa
            navItems.forEach(nav => nav.classList.remove("active"));
            item.classList.add("active");
            
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
    globalBtn.addEventListener("click", () => {
        const activeTab = document.querySelector(".nav-item.active").getAttribute("data-tab");
        if (activeTab === "clientes") {
            openClientModal();
        } else if (activeTab === "inventario") {
            openFreezerModal();
        } else if (activeTab === "tinas") {
            openRentalModal();
        } else if (activeTab === "documentos") {
            openDocModal();
        } else if (activeTab === "widgets") {
            openWidgetSettingsModal();
        } else {
            openOrderModal();
        }
    });

    // Ações dos Botões Internos de Painéis de Abas
    const btnAddClient = document.getElementById("btn-add-client");
    if (btnAddClient) {
        btnAddClient.addEventListener("click", () => openClientModal());
    }

    const btnScanQR = document.getElementById("btn-scan-qr");
    if (btnScanQR) {
        btnScanQR.addEventListener("click", () => startQRScanner());
    }

    const btnAddFreezer = document.getElementById("btn-add-freezer");
    if (btnAddFreezer) {
        btnAddFreezer.addEventListener("click", () => openFreezerModal());
    }

    const btnAddRental = document.getElementById("btn-add-rental");
    if (btnAddRental) {
        btnAddRental.addEventListener("click", () => openRentalModal());
    }

    const btnAddDocument = document.getElementById("btn-add-document");
    if (btnAddDocument) {
        btnAddDocument.addEventListener("click", () => openDocModal());
    }
}

function updateHeaderForTab(tab) {
    const pageTitle = document.getElementById("page-title");
    const pageSubtitle = document.getElementById("page-subtitle");
    const globalBtn = document.getElementById("btn-global-action");
    
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
            globalBtn.style.display = "none"; // Sem botão global
            break;
        case "widgets":
            pageTitle.innerText = "Widgets & Painel";
            pageSubtitle.innerText = "Visualize seus mini-aplicativos configurados e controle o dia-a-dia";
            globalBtn.style.display = "inline-flex";
            globalBtn.innerHTML = `<i data-lucide="settings"></i> Personalizar`;
            break;
        case "precos":
            pageTitle.innerText = "Configurações & Preços";
            pageSubtitle.innerText = "Edite preços de fábrica, promoções e configure descontos específicos por cliente";
            globalBtn.style.display = "none";
            break;
    }
    lucide.createIcons();
}

function renderTabContent(tab) {
    switch (tab) {
        case "dashboard":
            renderDashboard();
            break;
        case "clientes":
            renderClientes();
            break;
        case "inventario":
            renderInventario();
            break;
        case "tinas":
            renderTinas();
            break;
        case "documentos":
            renderDocumentos();
            break;
        case "pedidos":
            renderPedidos();
            break;
        case "historico":
            renderHistorico();
            break;
        case "widgets":
            renderWidgets();
            break;
        case "precos":
            renderPrecos();
            break;
    }
}

function renderApp() {
    const activeTab = document.querySelector(".nav-item.active").getAttribute("data-tab");
    renderTabContent(activeTab);
    
    // Atualizar versão no rodapé lateral
    const versionEl = document.getElementById("app-sidebar-version");
    if (versionEl) {
        versionEl.innerText = "Gelo do Vale v" + (state.backupSettings?.currentVersion || "2.5");
    }
    
    // Atualizar dropdowns
    populateClientDropdowns();
    populateFreezerDropdowns();
}

// --- PREENCHIMENTO DE DROPDOWNS ---
function populateClientDropdowns() {
    const orderClientSelect = document.getElementById("order-client-id");
    const filterClientSelect = document.getElementById("filter-client");
    const moveClientSelect = document.getElementById("move-client-id");
    
    // Salvar valores atuais selecionados
    const currentOrderVal = orderClientSelect.value;
    const currentFilterVal = filterClientSelect.value;
    const currentMoveVal = moveClientSelect ? moveClientSelect.value : "";
    
    // Limpar
    orderClientSelect.innerHTML = '<option value="">Selecione...</option>';
    filterClientSelect.innerHTML = '<option value="">Todos os Clientes</option>';
    if (moveClientSelect) {
        moveClientSelect.innerHTML = '<option value="">Selecione o Cliente...</option>';
    }
    
    // Adicionar clientes
    state.clients.forEach(c => {
        orderClientSelect.innerHTML += `<option value="${c.id}">${c.name}</option>`;
        filterClientSelect.innerHTML += `<option value="${c.id}">${c.name}</option>`;
        if (moveClientSelect) {
            moveClientSelect.innerHTML += `<option value="${c.id}">${c.name}</option>`;
        }
    });
    
    // Tentar restaurar valores anteriores
    orderClientSelect.value = currentOrderVal;
    filterClientSelect.value = currentFilterVal;
    if (moveClientSelect && currentMoveVal) {
        moveClientSelect.value = currentMoveVal;
    }

    // Popular filtro de produtos no histórico
    const filterProductSelect = document.getElementById("filter-product");
    if (filterProductSelect) {
        const currentProductFilterVal = filterProductSelect.value;
        filterProductSelect.innerHTML = '<option value="">Todos os Produtos</option>';
        state.products.forEach(p => {
            filterProductSelect.innerHTML += `<option value="${p.id}">${p.name}</option>`;
        });
        filterProductSelect.value = currentProductFilterVal;
    }
}


// ==========================================================================
// TELA 1: RENDEREZAÇÃO DO DASHBOARD E GRÁFICOS
// ==========================================================================

function renderDashboard() {
    // 1. Calcular indicadores KPIs
    const activeClientsCount = state.clients.length;
    const activeFreezersCount = state.clients.filter(c => c.freezerCode).length;
    
    // Faturamento e total de gelo no mês corrente
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    let totalKgMonth = 0;
    let totalRevenueMonth = 0;
    
    state.deliveries.forEach(del => {
        const delDate = new Date(del.date);
        if (delDate.getMonth() === currentMonth && delDate.getFullYear() === currentYear) {
            totalRevenueMonth += del.revenue;
            // Calcular kg
            if (del.items) {
                state.products.forEach(p => {
                    if (p.type === 'Gelo') {
                        const qty = del.items[p.id] || 0;
                        const weight = p.weight || 0;
                        totalKgMonth += qty * weight;
                    } else if (p.type === 'Gelo Saborizado') {
                        const qty = del.items[p.id] || 0;
                        const qtyUnits = del.items[p.id + "_unit"] || 0;
                        const unitWeightG = p.unitWeightGrams || 0;
                        const unitsPerPack = p.unitsPerPack || 12;
                        const packWeightKg = (unitWeightG * unitsPerPack) / 1000;
                        totalKgMonth += qty * packWeightKg + qtyUnits * (unitWeightG / 1000);
                    }
                });
            }
        }
    });

    // Somar faturamento de aluguel de tinas
    if (state.rentals) {
        state.rentals.forEach(rent => {
            const rentDate = new Date(rent.deliveryDate);
            if (rentDate.getMonth() === currentMonth && rentDate.getFullYear() === currentYear) {
                totalRevenueMonth += rent.totalRevenue || ((rent.rentalFee || 0) + (rent.deliveryFee || 0) + (rent.pickupFee || 0) + (rent.extraFee || 0));
            }
        });
    }

    const pendingOrdersCount = state.orders.filter(o => o.status === "pending").length;
    const activeRentalsCount = state.rentals ? state.rentals.filter(r => r.status === "active" || r.status === "overdue").length : 0;
    
    // Atualizar HTML de KPIs
    document.getElementById("kpi-freezers").innerHTML = `
        <span style="font-size: 1.1rem; display: block; line-height: 1.2;">
            Cli: ${activeClientsCount} | Frz: ${activeFreezersCount}
        </span>
        <span style="font-size: 0.75rem; color: var(--color-primary); display: block; margin-top: 4px; font-weight: 600;">
            Tinas: ${activeRentalsCount} ativas
        </span>
    `;
    document.getElementById("kpi-delivered").innerText = `${totalKgMonth.toLocaleString('pt-BR')} kg`;
    document.getElementById("kpi-pending-orders").innerText = pendingOrdersCount;
    document.getElementById("kpi-revenue").innerText = `R$ ${totalRevenueMonth.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    // 2. Renderizar lista de alertas de reposição urgente
    renderDashboardAlerts();

    // 3. Renderizar gráfico estatístico SVG
    renderDashboardChart();

    // 4. Renderizar widgets no dashboard
    renderWidgets();
}

function renderDashboardAlerts() {
    const alertsContainer = document.getElementById("alerts-list-container");
    const alertCountBadge = document.getElementById("alert-count");
    alertsContainer.innerHTML = "";
    
    let alerts = [];
    
    state.clients.forEach(client => {
        const threshold = (client.alertThreshold || 20) / 100;
        
        const geloProducts = state.products.filter(p => p.active && (p.type === 'Gelo' || p.type === 'Gelo Saborizado'));
        geloProducts.forEach(p => {
            const prod = p.id;
            const currentStock = (client.stock && client.stock[prod]) || 0;
            const maxCap = (client.capacities && client.capacities[prod]) || 0;
            
            if (maxCap > 0 && currentStock <= maxCap * threshold) {
                const percentage = Math.round((currentStock / maxCap) * 100);
                alerts.push({
                    clientName: client.name,
                    productName: p.name,
                    current: currentStock,
                    max: maxCap,
                    pct: percentage,
                    severity: percentage <= 10 ? 'danger' : 'warning'
                });
            }
        });
    });
    
    // Atualizar badge do painel
    alertCountBadge.innerText = `${alerts.length} ${alerts.length === 1 ? 'Alerta' : 'Alertas'}`;
    if (alerts.length === 0) {
        alertCountBadge.className = "status-badge completed";
    } else {
        alertCountBadge.className = "status-badge pending";
    }
    
    // Renderizar alertas
    if (alerts.length === 0) {
        alertsContainer.innerHTML = `
            <div class="empty-alerts">
                <i data-lucide="check-circle" style="color: var(--color-success); margin-bottom: 0.5rem; width: 32px; height: 32px;"></i>
                <p>Todos os freezers abastecidos e saudáveis!</p>
            </div>
        `;
    } else {
        // Ordenar os alertas de maior urgência (danger primeiro)
        alerts.sort((a, b) => a.pct - b.pct);
        
        alerts.forEach(al => {
            const isDanger = al.severity === 'danger';
            alertsContainer.innerHTML += `
                <div class="alert-item ${isDanger ? '' : 'warning'}">
                    <i data-lucide="alert-triangle" class="alert-icon"></i>
                    <div class="alert-details">
                        <h4>${al.clientName}</h4>
                        <p>Estoque crítico de <strong>${al.productName}</strong>: ${al.current}/${al.max} pacotes (${al.pct}%)</p>
                    </div>
                </div>
            `;
        });
    }
    lucide.createIcons();
}

function renderDashboardChart() {
    const chartContainer = document.getElementById("dashboard-chart");
    chartContainer.innerHTML = "";
    
    // Obter últimas 7 entregas
    const recentDeliveries = [...state.deliveries]
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(-7);
        
    if (recentDeliveries.length === 0) {
        chartContainer.innerHTML = `
            <div class="empty-state">
                <i data-lucide="bar-chart-2"></i>
                <p>Nenhuma entrega registrada para gerar gráfico.</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }
    
    // Dados para desenhar
    const labels = recentDeliveries.map(d => {
        const dateObj = new Date(d.date);
        return `${dateObj.getDate()}/${dateObj.getMonth() + 1}`;
    });
    
    // Vamos mapear o faturamento como o valor do gráfico
    const values = recentDeliveries.map(d => d.revenue);
    const maxValue = Math.max(...values, 100); // Evitar divisão por zero e dar teto
    
    // Construir SVG
    const width = 500;
    const height = 220;
    const paddingLeft = 45;
    const paddingRight = 15;
    const paddingTop = 20;
    const paddingBottom = 30;
    
    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;
    const barWidth = (chartWidth / values.length) * 0.6;
    const barSpacing = (chartWidth / values.length) * 0.4;
    
    let svgContent = `
        <svg class="chart-svg" viewBox="0 0 ${width} ${height}">
            <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#00f0ff" />
                    <stop offset="100%" stop-color="#0072ff" stop-opacity="0.3" />
                </linearGradient>
                <linearGradient id="barGradHover" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#00f0ff" />
                    <stop offset="100%" stop-color="#00f0ff" stop-opacity="0.6" />
                </linearGradient>
            </defs>
            
            <!-- Linhas de grade horizontais -->
            <line x1="${paddingLeft}" y1="${paddingTop}" x2="${width - paddingRight}" y2="${paddingTop}" class="chart-grid-line" />
            <line x1="${paddingLeft}" y1="${paddingTop + chartHeight / 2}" x2="${width - paddingRight}" y2="${paddingTop + chartHeight / 2}" class="chart-grid-line" />
            <line x1="${paddingLeft}" y1="${paddingTop + chartHeight}" x2="${width - paddingRight}" y2="${paddingTop + chartHeight}" class="chart-axis-line" />
            
            <!-- Eixo X Labels (Datas) e Barras -->
    `;
    
    // Adicionar labels Y
    svgContent += `
        <text x="${paddingLeft - 10}" y="${paddingTop + 4}" class="chart-text" text-anchor="end">R$${Math.round(maxValue)}</text>
        <text x="${paddingLeft - 10}" y="${paddingTop + chartHeight / 2 + 4}" class="chart-text" text-anchor="end">R$${Math.round(maxValue / 2)}</text>
        <text x="${paddingLeft - 10}" y="${paddingTop + chartHeight + 4}" class="chart-text" text-anchor="end">R$0</text>
    `;
    
    for (let i = 0; i < values.length; i++) {
        const val = values[i];
        const barHeight = (val / maxValue) * chartHeight;
        const x = paddingLeft + (i * (barWidth + barSpacing)) + barSpacing / 2;
        const y = paddingTop + chartHeight - barHeight;
        
        // Barra
        svgContent += `
            <rect class="chart-bar" x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" />
            <!-- Valor acima da barra ao passar mouse (ou permanente simples) -->
            <text x="${x + barWidth / 2}" y="${y - 6}" class="chart-text" text-anchor="middle" font-size="9" fill="#fff">R$${Math.round(val)}</text>
        `;
        
        // Eixo X
        svgContent += `
            <text x="${x + barWidth / 2}" y="${paddingTop + chartHeight + 18}" class="chart-text" text-anchor="middle">${labels[i]}</text>
        `;
    }
    
    svgContent += `</svg>`;
    
    chartContainer.innerHTML = svgContent;
}


// ==========================================================================
// TELA 2: GESTÃO DE CLIENTES E FREEZERS
// ==========================================================================

function renderClientes() {
    const clientsContainer = document.getElementById("clients-grid-container");
    clientsContainer.innerHTML = "";
    
    if (state.clients.length === 0) {
        clientsContainer.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <i data-lucide="users" style="width: 48px; height: 48px;"></i>
                <p>Nenhum cliente cadastrado no momento.</p>
                <button class="btn btn-primary" style="margin-top: 1rem;" onclick="openClientModal()">
                    <i data-lucide="plus"></i> Cadastrar Primeiro Cliente
                </button>
            </div>
        `;
        lucide.createIcons();
        return;
    }
    
    state.clients.forEach(c => {
        // Obter status de alertas deste freezer para o indicador
        const threshold = (c.alertThreshold || 20) / 100;
        let hasWarning = false;
        let hasDanger = false;
        
        const geloProducts = state.products.filter(p => p.active && (p.type === 'Gelo' || p.type === 'Gelo Saborizado'));
        geloProducts.forEach(p => {
            const prod = p.id;
            const max = (c.capacities && c.capacities[prod]) || 0;
            const current = (c.stock && c.stock[prod]) || 0;
            if (max > 0) {
                const pct = current / max;
                if (pct <= 0.1) hasDanger = true;
                else if (pct <= threshold) hasWarning = true;
            }
        });
        
        let statusBadgeHTML = '<span class="status-badge completed">OK</span>';
        if (hasDanger) statusBadgeHTML = '<span class="status-badge pending" style="background: rgba(239,68,68,0.15); color: var(--color-danger);">Estoque Crítico</span>';
        else if (hasWarning) statusBadgeHTML = '<span class="status-badge pending">Atenção</span>';
        
        // Progresso de Estoques
        let stockSectionHTML = '';
        if (c.freezerCode) {
            geloProducts.forEach(p => {
                const prod = p.id;
                const current = (c.stock && c.stock[prod]) || 0;
                const max = (c.capacities && c.capacities[prod]) || 0;
                
                if (max > 0) {
                    const pct = Math.min((current / max) * 100, 100);
                    const isLow = pct <= (c.alertThreshold || 20);
                    
                    stockSectionHTML += `
                        <div class="stock-progress-bar">
                            <div class="stock-label">
                                <span>${p.name}</span>
                                <span class="stock-numbers">${current} / ${max}</span>
                            </div>
                            <div class="progress-track">
                                <div class="progress-fill ${isLow ? 'low-stock' : ''}" style="width: ${pct}%"></div>
                            </div>
                        </div>
                    `;
                }
            });
        } else {
            stockSectionHTML = `<p class="no-freezer-msg">Nenhum freezer vinculado a este cliente.</p>`;
        }
        
        // Card HTML
        clientsContainer.innerHTML += `
            <div class="client-card">
                <div class="client-card-header">
                    <div class="client-name-details">
                        <h3>${c.name}</h3>
                        <p>${c.freezerCode ? `Freezer: <strong>${c.freezerCode}</strong>` : 'Sem Freezer'}</p>
                    </div>
                    ${statusBadgeHTML}
                </div>
                
                <div class="client-contacts">
                    <div class="contact-item">
                        <i data-lucide="map-pin"></i>
                        <span>${c.address || 'Sem endereço informado'}</span>
                    </div>
                    <div class="contact-item">
                        <i data-lucide="phone"></i>
                        <span>${c.phone || 'Sem contato informado'}</span>
                    </div>
                </div>

                ${c.freezerCode ? `
                <div class="freezer-specs-box" style="margin: 0.75rem 0; padding: 0.6rem; background: rgba(255,255,255,0.02); border-radius: 6px; font-size: 0.75rem; border: 1px solid rgba(255,255,255,0.04);">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                        <span><strong>Equipamento:</strong> ${c.freezerBrand || 'Não informado'}</span>
                        <span><strong>Voltagem:</strong> ${c.freezerVoltage || 'N/I'}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                        <span><strong>Capacidade:</strong> ${c.freezerCapacity ? c.freezerCapacity + ' L' : 'Não informada'}</span>
                        <span><strong>Data Entrega:</strong> ${c.deliveryDate ? new Date(c.deliveryDate + 'T00:00:00').toLocaleDateString('pt-BR') : 'Não informada'}</span>
                    </div>
                    ${c.maintenanceNotes ? `
                    <div style="border-top: 1px solid rgba(255,255,255,0.05); margin-top: 0.4rem; padding-top: 0.3rem; color: var(--color-text-muted); line-height: 1.3;">
                        <strong>Obs/Manut:</strong> ${c.maintenanceNotes}
                    </div>
                    ` : ''}
                </div>
                ` : ''}
                
                <div class="freezer-info-section">
                    <div class="freezer-title">
                        <span>Estoque do Freezer</span>
                        ${c.freezerCode ? `
                            <button class="btn btn-secondary btn-icon-only" style="padding: 2px 6px; font-size: 0.75rem;" onclick="openSalesModal('${c.id}')" title="Registrar Consumo">
                                <i data-lucide="minus-circle" style="width: 14px; height: 14px; color: var(--color-danger)"></i> Consumo
                            </button>
                        ` : ''}
                    </div>
                    <div class="freezer-stocks">
                        ${stockSectionHTML}
                    </div>
                </div>
                
                <div class="client-actions" style="margin-top: 1.5rem; justify-content: flex-end; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 1rem;">
                    ${c.freezerCode ? `
                    <button class="btn btn-secondary" onclick="openComodato('${c.id}')" title="Termo de Comodato" style="margin-right: auto; padding: 4px 10px; font-size: 0.75rem; display: inline-flex; align-items: center; gap: 4px; background: rgba(0, 240, 255, 0.05); border-color: rgba(0, 240, 255, 0.2); color: var(--color-primary)">
                        <i data-lucide="file-text" style="width: 14px; height: 14px;"></i> Contrato
                    </button>
                    ` : ''}
                    <button class="btn btn-secondary btn-icon-only" onclick="editClient('${c.id}')" title="Editar Cliente">
                        <i data-lucide="edit-3" style="width: 16px; height: 16px;"></i>
                    </button>
                    <button class="btn btn-danger btn-icon-only" onclick="deleteClient('${c.id}')" title="Remover Cliente">
                        <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
                    </button>
                </div>
            </div>
        `;
    });
    lucide.createIcons();
}

// --- AÇÕES CRUD DE CLIENTES ---
function openClientModal(clientId = null) {
    const modal = document.getElementById("modal-client");
    const form = document.getElementById("client-form");
    const title = document.getElementById("client-modal-title");
    
    form.reset();
    document.getElementById("form-client-id").value = "";
    
    // Limpar checkboxes de visita
    document.querySelectorAll('input[name="visit-days"]').forEach(cb => cb.checked = false);
    
    // Popular o dropdown de freezers
    const freezerSelect = document.getElementById("client-freezer-id-select");
    freezerSelect.innerHTML = '<option value="">Nenhum freezer alocado</option>';
    
    let currentFreezer = null;
    if (clientId) {
        currentFreezer = state.freezers.find(f => f.clientId === clientId);
        if (currentFreezer) {
            freezerSelect.innerHTML += `<option value="${currentFreezer.id}" selected>${currentFreezer.code} - ${currentFreezer.brand}</option>`;
        }
    }
    
    state.freezers.forEach(f => {
        if (f.status === "disponivel" && (!currentFreezer || f.id !== currentFreezer.id)) {
            freezerSelect.innerHTML += `<option value="${f.id}">${f.code} - ${f.brand}</option>`;
        }
    });
    
    if (clientId) {
        title.innerText = "Editar Cliente & Freezer";
        const c = state.clients.find(item => item.id === clientId);
        if (c) {
            document.getElementById("form-client-id").value = c.id;
            document.getElementById("client-name").value = c.name;
            document.getElementById("client-address").value = c.address || "";
            document.getElementById("client-phone").value = c.phone || "";
            if (document.getElementById("client-document")) {
                document.getElementById("client-document").value = c.document || "";
            }
            document.getElementById("freezer-code").value = c.freezerCode || "";
            document.getElementById("alert-threshold").value = c.alertThreshold || 20;
            
            document.getElementById("freezer-brand").value = c.freezerBrand || "";
            document.getElementById("freezer-voltage").value = c.freezerVoltage || "";
            document.getElementById("freezer-capacity").value = c.freezerCapacity ? c.freezerCapacity + " Litros" : "";
            document.getElementById("freezer-delivery-date").value = c.deliveryDate || "";
            document.getElementById("freezer-maintenance").value = c.maintenanceNotes || "";
            
            renderClientModalProducts(c);
            
            if (currentFreezer) {
                freezerSelect.value = currentFreezer.id;
            }

            // Exibir saldo devedor
            const debtGroup = document.getElementById("client-debt-group");
            if (debtGroup) {
                debtGroup.style.display = "flex";
                const debtVal = c.outstandingDebt || 0;
                document.getElementById("client-outstanding-debt").innerText = "R$ " + debtVal.toFixed(2).replace(".", ",");
                const btnPay = document.getElementById("btn-pay-debt");
                if (btnPay) {
                    btnPay.onclick = () => {
                        closeModal('modal-client');
                        openReceivePaymentModal(c.id);
                    };
                }
            }

            // Marcar checkboxes de visita
            const visitDays = c.visitDays || [];
            document.querySelectorAll('input[name="visit-days"]').forEach(cb => cb.checked = visitDays.includes(cb.value));
        }
    } else {
        title.innerText = "Novo Cliente & Freezer";
        renderClientModalProducts(null);
        const debtGroup = document.getElementById("client-debt-group");
        if (debtGroup) debtGroup.style.display = "none";
    }
    
    modal.classList.add("active");
}

function deleteClient(clientId) {
    if (confirm("Tem certeza que deseja remover este cliente? Todos os dados vinculados a ele serão mantidos no histórico financeiro, mas o freezer será liberado no inventário.")) {
        // Encontrar freezer vinculado e liberar
        const linkedFreezer = state.freezers.find(f => f.clientId === clientId);
        if (linkedFreezer) {
            linkedFreezer.status = "disponivel";
            linkedFreezer.clientId = "";
            linkedFreezer.clientName = "";
            linkedFreezer.movementHistory.push({
                date: new Date().toLocaleDateString('pt-BR'),
                from: "Cliente Removido",
                to: "Fábrica",
                reason: "Desvinculado devido à remoção do cliente"
            });
        }
        
        state.clients = state.clients.filter(c => c.id !== clientId);
        // Também removemos pedidos pendentes do cliente excluído
        state.orders = state.orders.filter(o => o.clientId !== clientId);
        saveState();
        renderApp();
    }
}

function editClient(clientId) {
    openClientModal(clientId);
}


// ==========================================================================
// TELA 3: FILA DE PEDIDOS E ENTREGAS / CONFIG PREÇOS
// ==========================================================================

function renderPedidos() {
    renderSuggestedVisits();

    const ordersContainer = document.getElementById("pedidos-list-container");
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
        lucide.createIcons();
        return;
    }
    
    pendingOrders.forEach(o => {
        const client = state.clients.find(c => c.id === o.clientId);
        const clientName = client ? client.name : "Cliente Excluído";
        const dateFormatted = new Date(o.date).toLocaleString('pt-BR');
        
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
                <div class="pedido-acoes" style="flex-shrink: 0;">
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
    
    lucide.createIcons();
}

function getCurrentDayName() {
    const days = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
    return days[new Date().getDay()];
}

function renderSuggestedVisits() {
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
    lucide.createIcons();
}

function openOrderModalForClient(clientId) {
    openOrderModal();
    const select = document.getElementById("order-client-id");
    if (select) {
        select.value = clientId;
        select.dispatchEvent(new Event('change'));
    }
}

function addSuggestedVisitsToRoute() {
    optimizeDeliveryRoute();
}

window.openOrderModalForClient = openOrderModalForClient;
window.addSuggestedVisitsToRoute = addSuggestedVisitsToRoute;

function openOrderModal() {
    if (state.clients.length === 0) {
        alert("Cadastre pelo menos um cliente antes de registrar pedidos!");
        return;
    }
    const modal = document.getElementById("modal-order");
    document.getElementById("order-form").reset();
    renderOrderModalProducts();
    populateClientDropdowns();
    modal.classList.add("active");
}

function cancelOrder(orderId) {
    if (confirm("Deseja realmente cancelar este pedido?")) {
        state.orders = state.orders.filter(o => o.id !== orderId);
        saveState();
        renderApp();
    }
}

function calculateProductRevenue(client, p, qtyFardos, qtyUnits) {
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
            const limit = p.flashPromo.limit !== undefined ? p.flashPromo.limit : Infinity;
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

function getGPSLocation(callback) {
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

function deductPackagingStock(productId, qtyFardos, qtyUnits, ref) {
    const product = state.products.find(p => p.id === productId);
    if (!product) return;
    
    // Achar embalagens vinculadas a esse produto
    const linkedPacks = state.packaging.filter(pkg => pkg.productId === productId);
    linkedPacks.forEach(pkg => {
        const unitsPerPack = product.unitsPerPack || 12;
        let deduction = 0;
        if (product.type === "Gelo Saborizado") {
            deduction = qtyFardos + (qtyUnits / unitsPerPack);
        } else {
            deduction = qtyFardos + (qtyUnits / unitsPerPack);
        }
        
        if (deduction > 0) {
            pkg.currentStock = (pkg.currentStock || 0) - deduction;
            
            // Registrar transação de saída
            state.packagingTransactions.push({
                id: "pt-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
                packagingId: pkg.id,
                packagingName: pkg.name,
                type: "saida",
                quantity: deduction,
                balanceAfter: pkg.currentStock,
                date: new Date().toISOString(),
                observation: `Baixa automática: ${ref} (${product.name})`
            });
        }
    });
}

function deliverOrder(orderId) {
    const order = state.orders.find(o => o.id === orderId);
    if (!order) return;
    
    const client = state.clients.find(c => c.id === order.clientId);
    if (!client) {
        alert("Cliente não encontrado.");
        return;
    }
    
    // Calcular faturamento da entrega
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
    
    // Preencher os dados no modal de confirmação
    document.getElementById("checkout-order-id").value = orderId;
    document.getElementById("checkout-client-name").innerText = client.name;
    document.getElementById("checkout-order-details").innerText = itemsDescription.join(", ");
    document.getElementById("checkout-order-total").innerText = "R$ " + revenue.toFixed(2).replace(".", ",");
    document.getElementById("checkout-payment-method").value = "Dinheiro"; // padrão
    
    // Exibir o modal
    const modal = document.getElementById("modal-confirm-delivery");
    if (modal) modal.classList.add("active");
}

function processDeliveryCheckout(event) {
    if (event) event.preventDefault();
    const orderId = document.getElementById("checkout-order-id").value;
    const paymentMethod = document.getElementById("checkout-payment-method").value;
    
    const submitBtn = document.getElementById("btn-submit-delivery-checkout");
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="loading-spinner"></span> Aguardando GPS...';
    }
    
    getGPSLocation((gps) => {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i data-lucide="check" style="width: 14px; height: 14px;"></i> Confirmar Entrega';
            lucide.createIcons();
        }
        
        closeModal("modal-confirm-delivery");
        deliverOrderWithDetails(orderId, paymentMethod, gps);
    });
}

function deliverOrderWithDetails(orderId, paymentMethod, gps) {
    const order = state.orders.find(o => o.id === orderId);
    if (!order) return;
    
    const client = state.clients.find(c => c.id === order.clientId);
    if (!client) {
        alert("Cliente não encontrado.");
        return;
    }
    
    // Calcular Faturamento da entrega
    let revenue = 0;
    const activeProds = state.products.filter(p => p.active && (p.type === 'Gelo' || p.type === 'Carvão' || p.type === 'Gelo Saborizado'));
    activeProds.forEach(p => {
        const prod = p.id;
        const qtyFardos = order.items[prod] || 0;
        const qtyUnits = order.items[prod + "_unit"] || 0;
        
        if (qtyFardos > 0 || qtyUnits > 0) {
            const priceRes = calculateProductRevenue(client, p, qtyFardos, qtyUnits);
            revenue += priceRes.totalRevenue;
            
            // Decrementar estoque da Promoção Relâmpago no catálogo (apenas para fardos)
            if (p.flashPromo && p.flashPromo.active && qtyFardos > 0) {
                const limit = p.flashPromo.limit !== undefined ? p.flashPromo.limit : Infinity;
                if (limit > 0) {
                    const promoAppliedQty = Math.min(qtyFardos, limit);
                    p.flashPromo.limit = Math.max(0, limit - promoAppliedQty);
                    if (p.flashPromo.limit === 0) {
                        p.flashPromo.active = false;
                    }
                }
            }
            
            // Atualizar estoque do freezer (somente para Gelo e Gelo Saborizado)
            if ((p.type === 'Gelo' || p.type === 'Gelo Saborizado') && client.freezerCode) {
                const unitsPerPack = p.unitsPerPack || 12;
                const qtyAdded = qtyFardos + (p.type === 'Gelo Saborizado' ? (qtyUnits / unitsPerPack) : 0);
                client.stock[prod] = (client.stock[prod] || 0) + qtyAdded;
                const cap = (client.capacities && client.capacities[prod]) || 50;
                if (client.stock[prod] > cap) {
                    client.stock[prod] = cap;
                }
            }
            
            // Baixa automática de embalagem
            deductPackagingStock(p.id, qtyFardos, qtyUnits, `Pedido: ${orderId}`);
        }
    });
    
    const deliveryId = "d-" + Date.now();
    
    // Registrar na tabela de Entregas (Histórico)
    const newDelivery = {
        id: deliveryId,
        clientId: client.id,
        clientName: client.name,
        date: new Date().toISOString(),
        items: { ...order.items },
        revenue: revenue,
        paymentMethod: paymentMethod,
        gps: gps
    };
    
    state.deliveries.push(newDelivery);
    
    // Se for pagamento "A Prazo", adicionar ao saldo devedor
    if (paymentMethod === "A Prazo") {
        client.outstandingDebt = (client.outstandingDebt || 0) + revenue;
    }
    
    // Remover da fila de pedidos
    state.orders = state.orders.filter(o => o.id !== orderId);
    
    saveState();
    renderApp();
    alert(`Entrega efetuada com sucesso! R$ ${revenue.toFixed(2)} registrados (${paymentMethod}).`);
}

window.processDeliveryCheckout = processDeliveryCheckout;
window.getGPSLocation = getGPSLocation;
window.deductPackagingStock = deductPackagingStock;


// ==========================================================================
// TELA 4: HISTÓRICO DE ENTREGAS
// ==========================================================================

function renderHistorico() {
    const tableBody = document.getElementById("history-table-body");
    tableBody.innerHTML = "";
    
    const filterClient = document.getElementById("filter-client").value;
    const filterProduct = document.getElementById("filter-product").value;
    
    // Filtrar entregas
    const filteredDeliveries = state.deliveries.filter(del => {
        // Filtro de Cliente
        if (filterClient && del.clientId !== filterClient) return false;
        
        // Filtro de Produto
        if (filterProduct) {
            const hasFardo = del.items[filterProduct] && del.items[filterProduct] > 0;
            const hasUnit = del.items[filterProduct + "_unit"] && del.items[filterProduct + "_unit"] > 0;
            if (!hasFardo && !hasUnit) return false;
        }
        
        return true;
    });
    
    // Ordenar por data decrescente (mais recente primeiro)
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
        const dateFormatted = new Date(del.date).toLocaleString('pt-BR');
        
        // Detalhamento dos pacotes
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
        
        let gpsButton = '';
        if (del.gps && del.gps.lat && del.gps.lng) {
            gpsButton = `
                <a href="https://www.google.com/maps/search/?api=1&query=${del.gps.lat},${del.gps.lng}" target="_blank" class="btn btn-secondary btn-icon-only" style="padding: 4px; display: inline-flex; align-items: center; justify-content: center; text-decoration: none;" title="Ver Localização no GPS">
                    <i data-lucide="map-pin" style="width: 14px; height: 14px; color: var(--color-primary);"></i>
                </a>
            `;
        }
        
        tableBody.innerHTML += `
            <tr>
                <td style="font-weight: 500;">${dateFormatted}</td>
                <td><strong>${del.clientName}</strong></td>
                <td>${itemsText.join("<br>")}</td>
                <td style="color: var(--color-primary); font-weight: 700;">R$ ${del.revenue.toFixed(2)}</td>
                <td>
                    <div style="display: flex; gap: 4px; justify-content: center; align-items: center;">
                        ${gpsButton}
                        <button class="btn btn-danger btn-icon-only" style="padding: 4px;" onclick="deleteDelivery('${del.id}')" title="Excluir Registro">
                            <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    lucide.createIcons();
}

function deleteDelivery(deliveryId) {
    if (confirm("Excluir este registro apagará os dados de faturamento associados. O estoque do freezer do cliente não será alterado retroativamente. Confirmar?")) {
        state.deliveries = state.deliveries.filter(d => d.id !== deliveryId);
        saveState();
        renderApp();
    }
}

function initHistoryFilters() {
    document.getElementById("filter-client").addEventListener("change", renderHistorico);
    document.getElementById("filter-product").addEventListener("change", renderHistorico);
    document.getElementById("btn-clear-filters").addEventListener("click", () => {
        document.getElementById("filter-client").value = "";
        document.getElementById("filter-product").value = "";
        renderHistorico();
    });
}

function initAllSearchFilters() {
    const searchFreezer = document.getElementById("search-freezer");
    const filterFreezerStatus = document.getElementById("filter-freezer-status");
    if (searchFreezer) searchFreezer.addEventListener("input", renderInventario);
    if (filterFreezerStatus) filterFreezerStatus.addEventListener("change", renderInventario);

    const searchRental = document.getElementById("search-rental");
    const filterRentalStatus = document.getElementById("filter-rental-status");
    if (searchRental) searchRental.addEventListener("input", renderTinas);
    if (filterRentalStatus) filterRentalStatus.addEventListener("change", renderTinas);

    const searchDocument = document.getElementById("search-document");
    const filterDocumentType = document.getElementById("filter-document-type");
    if (searchDocument) searchDocument.addEventListener("input", renderDocumentos);
    if (filterDocumentType) filterDocumentType.addEventListener("change", renderDocumentos);
}


// ==========================================================================
// FORMULÁRIOS E MODAIS (EVENT LISTENERS E PROCESSAMENTOS)
// ==========================================================================

function initForms() {
    // 1. Envio do Formulário de Cliente/Freezer
    document.getElementById("client-form").addEventListener("submit", (e) => {
        e.preventDefault();
        
        const clientId = document.getElementById("form-client-id").value;
        const name = document.getElementById("client-name").value;
        const address = document.getElementById("client-address").value;
        const phone = document.getElementById("client-phone").value;
        const clientDoc = document.getElementById("client-document") ? document.getElementById("client-document").value.trim() : "";
        
        // Obter freezer selecionado
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
        
        // Gerenciamento de Vinculação de Freezer
        const oldFreezer = state.freezers.find(f => f.clientId === targetClientId);
        
        // 1. Se mudou de freezer (ou desvinculou), liberar o antigo
        if (oldFreezer && (!selectedFreezer || oldFreezer.id !== selectedFreezer.id)) {
            oldFreezer.status = "disponivel";
            oldFreezer.clientId = "";
            oldFreezer.clientName = "";
            oldFreezer.movementHistory.push({
                date: new Date().toLocaleDateString('pt-BR'),
                from: name,
                to: "Fábrica",
                reason: "Desvinculado devido à alteração no cadastro do cliente"
            });
            if (state.comodatos) {
                state.comodatos.forEach(com => {
                    if (com.clientId === targetClientId && com.freezerCode === oldFreezer.code && com.status !== 'retirado') {
                        com.status = 'retirado';
                        com.returnDate = new Date().toISOString().split('T')[0];
                        com.returnNotes = "Desvinculado no cadastro do cliente";
                    }
                });
            }
        }
        
        // 2. Se vinculou um novo freezer, atualizar o status do freezer
        if (selectedFreezer) {
            selectedFreezer.status = "alocado";
            selectedFreezer.clientId = targetClientId;
            selectedFreezer.clientName = name;
            
            // Registrar movimento se for um novo vínculo
            if (!oldFreezer || oldFreezer.id !== selectedFreezer.id) {
                selectedFreezer.movementHistory.push({
                    date: new Date().toLocaleDateString('pt-BR'),
                    from: "Fábrica",
                    to: name,
                    reason: "Alocação em regime de comodato"
                });
            }
            
            // Adicionar notas às logs de manutenção se informado
            if (maintenanceNotes) {
                // Evitar duplicar a mesma nota no mesmo dia
                const jaExiste = selectedFreezer.maintenanceLogs.some(log => log.note === maintenanceNotes);
                if (!jaExiste) {
                    selectedFreezer.maintenanceLogs.push({
                        date: new Date().toLocaleDateString('pt-BR'),
                        note: maintenanceNotes
                    });
                }
            }
        }
        
        // Capturar dias de visita recorrente
        const visitDays = Array.from(document.querySelectorAll('input[name="visit-days"]:checked')).map(cb => cb.value);
        
        if (clientId) {
            // Edição de cliente
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
            // Criação de cliente
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
        
        migrateLegacyComodatos();
        saveState();
        closeModal("modal-client");
        renderApp();
    });

    // 2. Envio do Formulário de Pedidos (Solicitação de Gelo)
    document.getElementById("order-form").addEventListener("submit", (e) => {
        e.preventDefault();
        
        const clientId = document.getElementById("order-client-id").value;
        if (!clientId) {
            alert("Selecione um cliente.");
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
            alert("O pedido deve conter pelo menos 1 item.");
            return;
        }
        
        const newOrder = {
            id: "o-" + Date.now(),
            clientId: clientId,
            date: new Date().toISOString(),
            status: "pending",
            items: items
        };
        
        state.orders.push(newOrder);
        saveState();
        closeModal("modal-order");
        renderApp();
    });
    
    // 4. Envio do Formulário de Consumo de Clientes (Vendas)
    document.getElementById("sales-form").addEventListener("submit", (e) => {
        e.preventDefault();
        
        const clientId = document.getElementById("sales-client-id").value;
        const client = state.clients.find(c => c.id === clientId);
        if (!client) return;
        
        // Validação de Estoque
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
            alert(errorMessage);
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

    // 5. Envio do Formulário de Cadastro/Edição de Freezer
    document.getElementById("freezer-form").addEventListener("submit", (e) => {
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
            alert("Código do freezer é obrigatório!");
            return;
        }
        
        // Validar duplicidade de código
        const codeExists = state.freezers.some(f => f.code.toUpperCase() === code.toUpperCase() && f.id !== freezerId);
        if (codeExists) {
            alert(`Já existe um equipamento cadastrado com o código "${code}"!`);
            return;
        }
        
        if (freezerId) {
            // Edição
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
                
                // Atualizar dados copiados no cliente se o freezer estiver alocado
                if (state.freezers[idx].status === 'alocado' && state.freezers[idx].clientId) {
                    const linkedClient = state.clients.find(c => c.id === state.freezers[idx].clientId);
                    if (linkedClient) {
                        linkedClient.freezerCode = code;
                        linkedClient.freezerBrand = brand;
                        linkedClient.freezerVoltage = voltage;
                        linkedClient.freezerCapacity = capacity;
                    }
                }
                
                // Se alterou status manualmente
                if (status !== currentStatus) {
                    state.freezers[idx].status = status;
                    if (status !== 'alocado') {
                        // Desvincular de qualquer cliente
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
                        
                        state.freezers[idx].movementHistory.push({
                            date: new Date().toLocaleDateString('pt-BR'),
                            from: "Alocação",
                            to: destName,
                            reason: "Alteração manual de status no cadastro"
                        });
                    }
                }
            }
        } else {
            // Criação
            const newFreezer = {
                id: "f-" + Date.now(),
                code, brand, voltage, capacity, purchaseDate, warrantyMonths,
                status: "disponivel", // Começa na fábrica
                clientId: "",
                clientName: "",
                photoFreezer,
                photoInvoice,
                photoEstablishment,
                maintenanceLogs: [],
                movementHistory: [
                    {
                        date: new Date().toLocaleDateString('pt-BR'),
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

    // 6. Envio do Formulário de Transferência
    document.getElementById("move-freezer-form").addEventListener("submit", (e) => {
        e.preventDefault();
        
        const freezerId = document.getElementById("move-freezer-id").value;
        const destiny = document.getElementById("move-destiny").value;
        const clientId = document.getElementById("move-client-id").value;
        const reason = document.getElementById("move-reason").value.trim() || "Movimentação padrão";
        
        const freezer = state.freezers.find(f => f.id === freezerId);
        if (!freezer) return;
        
        const oldStatus = freezer.status;
        const oldLocationName = freezer.status === 'alocado' ? freezer.clientName : (freezer.status === 'disponivel' ? 'Fábrica' : (freezer.status === 'manutencao' ? 'Oficina' : 'Inativo'));
        
        if (destiny === 'cliente') {
            if (!clientId) {
                alert("Selecione o cliente de destino!");
                return;
            }
            const client = state.clients.find(c => c.id === clientId);
            if (!client) return;
            
            // Se já tem outro freezer no cliente, liberar
            const clientHasFreezer = state.freezers.find(f => f.clientId === clientId && f.id !== freezerId);
            if (clientHasFreezer) {
                if (!confirm(`O cliente ${client.name} já possui o freezer ${clientHasFreezer.code} vinculado. Deseja liberar o anterior para a fábrica e alocar este?`)) {
                    return;
                }
                clientHasFreezer.status = "disponivel";
                clientHasFreezer.clientId = "";
                clientHasFreezer.clientName = "";
                clientHasFreezer.movementHistory.push({
                    date: new Date().toLocaleDateString('pt-BR'),
                    from: client.name,
                    to: "Fábrica",
                    reason: "Substituído por outro freezer no cliente"
                });
            }
            
            // Se o freezer atual já estava alocado em outro cliente, remover dele
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
            
            // Atualizar specs do freezer no cliente
            client.freezerCode = freezer.code;
            client.freezerBrand = freezer.brand;
            client.freezerVoltage = freezer.voltage;
            client.freezerCapacity = freezer.capacity;
            client.deliveryDate = new Date().toISOString().split('T')[0];
            
            freezer.movementHistory.push({
                date: new Date().toLocaleDateString('pt-BR'),
                from: oldLocationName,
                to: client.name,
                reason: reason
            });
            
        } else {
            // Se estava alocado, remover dados do cliente
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
            
            freezer.movementHistory.push({
                date: new Date().toLocaleDateString('pt-BR'),
                from: oldLocationName,
                to: destName,
                reason: reason
            });
        }
        
        saveState();
        closeModal("modal-move-freezer");
        closeModal("modal-freezer-detail");
        renderApp();
    });

    // 7. Envio do Formulário de Notas de Manutenção
    document.getElementById("note-form").addEventListener("submit", (e) => {
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
                date: new Date().toLocaleDateString('pt-BR'),
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
            
            // Limpar formulário
            document.getElementById("maint-type").value = "Limpeza";
            document.getElementById("maint-technician").value = "";
            document.getElementById("maint-cost").value = "";
            document.getElementById("maint-next-date").value = "";
            document.getElementById("note-text").value = "";
            
            openFreezerDetail(freezerId);
            renderApp();
        }
    });

    // 8. Envio do Formulário de Aluguel de Tinas e Mobiliário
    document.getElementById("rental-form").addEventListener("submit", (e) => {
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

        // Capturar dados da calculadora de frete para persistir no aluguel
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

        // Quantidades de produtos associados (dinâmico)
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
            alert("Nome do cliente e identificação do item são obrigatórios!");
            return;
        }

        if (rentalId) {
            // Edição
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
            // Criação
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

    // 9. Envio do Formulário de Emissão de Recibo ou Orçamento
    document.getElementById("document-form").addEventListener("submit", (e) => {
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

        // Dados da calculadora de logística do documento
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
            alert("Nome do cliente é obrigatório!");
            return;
        }

        // Construir itens (dinâmico)
        const items = [];
        
        state.products.forEach(p => {
            // Fardo
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
            // Unidade (se for Gelo Saborizado)
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

        // Customizado
        const customName = document.getElementById("doc-custom-name").value.trim();
        const customQty = parseInt(document.getElementById("doc-custom-qty").value) || 0;
        const customPrice = parseFloat(document.getElementById("doc-custom-price").value) || 0;
        if (customName && customQty > 0) {
            items.push({ name: customName, qty: customQty, price: customPrice });
        }

        if (items.length === 0) {
            alert("Adicione pelo menos um item com quantidade maior que zero para gerar o documento!");
            return;
        }

        // Calcular total
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
                // Edição
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
                // Criação
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
                
                // Se for recibo ou nota, realizar a baixa automática das embalagens
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

    // 10. Autenticação do Administrador
    document.getElementById("admin-auth-form").addEventListener("submit", (e) => {
        e.preventDefault();
        const enteredPassword = document.getElementById("auth-password").value;
        
        if (enteredPassword === state.adminPassword) {
            sessionStorage.setItem("admin_authenticated", "true");
            document.getElementById("modal-admin-auth").classList.remove("active");
            document.getElementById("auth-password").value = "";
            
            if (window.postAdminAuthAction === "quickCreateRentalItem") {
                window.postAdminAuthAction = null;
                openProductModal();
                document.getElementById("prod-type").value = "Equipamento";
                toggleProductSubfields();
                return;
            }
            
            // Navegar para a aba de preços
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
            errorMsg.innerText = "Senha incorreta! Acesso negado.";
            errorMsg.style.display = "block";
            document.getElementById("auth-password").value = "";
            document.getElementById("auth-password").focus();
        }
    });

    // 10.5. Atualização de Senha de Administrador
    const adminPasswordForm = document.getElementById("admin-password-form");
    if (adminPasswordForm) {
        adminPasswordForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const currentPwd = document.getElementById("cfg-current-pwd").value;
            const newPwd = document.getElementById("cfg-new-pwd").value;

            if (currentPwd !== state.adminPassword) {
                alert("Senha atual incorreta!");
                return;
            }

            if (newPwd.length < 4) {
                alert("A nova senha deve possuir pelo menos 4 caracteres!");
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
            alert("Senha de administrador atualizada com sucesso!");
        });
    }

    // 11. Salvar Preços de Fábrica
    document.getElementById("factory-prices-form").addEventListener("submit", (e) => {
        e.preventDefault();
        
        const inputs = document.querySelectorAll(".factory-price-input");
        inputs.forEach(input => {
            const prodId = input.getAttribute("data-prod-id");
            const price = parseFloat(input.value) || 0;
            const p = state.products.find(prod => prod.id === prodId);
            if (p) {
                p.defaultPrice = price;
                
                // Preço Unitário (Gelo Saborizado)
                const unitInput = document.getElementById(`cfg-unit-price-${prodId}`);
                if (unitInput) {
                    p.unitPrice = parseFloat(unitInput.value) || 0;
                }
                
                // Preços de Atacado
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
                
                // Promoção Relâmpago
                const promoActive = document.getElementById(`cfg-promo-active-${prodId}`);
                const promoPrice = document.getElementById(`cfg-promo-price-${prodId}`);
                const promoLimit = document.getElementById(`cfg-promo-limit-${prodId}`);
                
                p.flashPromo = {
                    active: promoActive ? promoActive.checked : false,
                    price: promoPrice && promoPrice.value !== "" ? parseFloat(promoPrice.value) : 0,
                    limit: promoLimit && promoLimit.value !== "" ? parseInt(promoLimit.value) : 0
                };
            }
            if (!state.prices) state.prices = {};
            state.prices[prodId] = price;
        });
        
        saveState();
        alert("Preços padrão da fábrica e configurações avançadas atualizadas com sucesso!");
        renderPrecos();
    });

    // 12. Salvar Preços Especiais de Clientes
    document.getElementById("client-prices-form").addEventListener("submit", (e) => {
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
        alert("Preços especiais salvos com sucesso!");
        renderPrecos();
    });

    // 13. Salvar Configurações de Backup e Versão
    document.getElementById("backup-settings-form").addEventListener("submit", (e) => {
        e.preventDefault();
        
        const newVersion = document.getElementById("cfg-app-version").value.trim();
        const newFrequency = parseInt(document.getElementById("cfg-backup-frequency").value) || 0;
        
        state.backupSettings.currentVersion = newVersion;
        state.backupSettings.frequencyDays = newFrequency;
        
        saveState();
        alert("Configurações de backup e versão salvas com sucesso!");
        renderPrecos();
    });

    // 14. Salvar Produto / Equipamento no Catálogo
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
            
            // Novos campos do Gelo Saborizado
            const flavor = type === "Gelo Saborizado" ? document.getElementById("prod-flavor").value.trim() : "";
            const packageType = type === "Gelo Saborizado" ? document.getElementById("prod-package-type").value : "";
            const unitsPerPack = type === "Gelo Saborizado" ? (parseInt(document.getElementById("prod-units-per-pack").value) || 1) : 0;
            const unitWeightGrams = type === "Gelo Saborizado" ? (parseInt(document.getElementById("prod-unit-weight-g").value) || 0) : 0;
            
            if (!name) {
                alert("O nome do item é obrigatório!");
                return;
            }
            
            if (productId) {
                // Edição
                const idx = state.products.findIndex(p => p.id === productId);
                if (idx !== -1) {
                    state.products[idx] = {
                        ...state.products[idx],
                        name, type, subtype, weight, defaultPrice, active,
                        flavor, packageType, unitsPerPack, unitWeightGrams
                    };
                }
            } else {
                // Criação
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
            
            // Re-renderizar catálogos e dropdowns
            renderProductsCatalog();
            renderPrecos();
            renderApp();
            
            // Se o modal de aluguel estiver aberto, atualize o select de equipamentos
            const rentalModal = document.getElementById("modal-rental");
            if (rentalModal && rentalModal.classList.contains("active")) {
                renderRentalModalProducts();
            }
            
            alert("Item salvo com sucesso!");
        });
    }

    // Ouvinte de mudança de item alugado para atualizar o preço dinamicamente
    document.getElementById("rental-item-type").addEventListener("change", updateRentalFee);

    // 15. Salvar Dados Comerciais
    const factoryInfoForm = document.getElementById("factory-info-form");
    if (factoryInfoForm) {
        factoryInfoForm.addEventListener("submit", (e) => {
            e.preventDefault();
            
            state.factorySettings.name = document.getElementById("cfg-factory-name").value.trim();
            state.factorySettings.cnpj = document.getElementById("cfg-factory-cnpj").value.trim();
            state.factorySettings.phone = document.getElementById("cfg-factory-phone").value.trim();
            state.factorySettings.address = document.getElementById("cfg-factory-address").value.trim();
            state.factorySettings.email = document.getElementById("cfg-factory-email").value.trim();
            state.factorySettings.pixKey = (document.getElementById("cfg-factory-pix") ? document.getElementById("cfg-factory-pix").value.trim() : "");
            state.factorySettings.rentalTerms = (document.getElementById("cfg-factory-rental-terms") ? document.getElementById("cfg-factory-rental-terms").value.trim() : "");
            
            saveState();
            alert("Dados comerciais atualizados com sucesso!");
            renderPrecos();
            renderApp();
        });
    }

    // 16. Salvar Tema de Aparência
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
            applyAppearanceTheme();
            alert("Configurações de tema e aparência salvas com sucesso!");
            renderPrecos();
            renderApp();
        });
    }

    // 17. Salvar Configurações de Impressão
    const printSettingsForm = document.getElementById("print-settings-form");
    if (printSettingsForm) {
        printSettingsForm.addEventListener("submit", (e) => {
            e.preventDefault();
            
            if (!state.printSettings) state.printSettings = {};
            state.printSettings.format = document.getElementById("cfg-print-format").value;
            state.printSettings.showLogo = document.getElementById("cfg-print-show-logo").checked;
            state.printSettings.showSignatures = document.getElementById("cfg-print-show-signatures").checked;
            
            saveState();
            alert("Configurações de impressão salvas com sucesso!");
            renderPrecos();
        });
    }

    // Event listeners para calculadora de logística
    const btnToggleLogistics = document.getElementById("btn-toggle-logistics");
    if (btnToggleLogistics) {
        btnToggleLogistics.addEventListener("click", () => toggleRentalLogisticsCalc());
    }

    const btnApplyLogistics = document.getElementById("btn-apply-logistics");
    if (btnApplyLogistics) {
        btnApplyLogistics.addEventListener("click", () => applyCalculatedLogistics());
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
            el.addEventListener("input", () => calculateRentalLogistics());
        }
    });

    const chkTollReturn = document.getElementById("logistics-toll-return");
    if (chkTollReturn) {
        chkTollReturn.addEventListener("change", () => calculateRentalLogistics());
    }

    // --- CALCULADORA DE LOGÍSTICA DE DOCUMENTOS (EVENTOS) ---
    const btnToggleDocLogistics = document.getElementById("btn-toggle-doc-logistics");
    if (btnToggleDocLogistics) {
        btnToggleDocLogistics.addEventListener("click", () => toggleDocLogisticsCalc());
    }

    const btnApplyDocLogistics = document.getElementById("btn-apply-doc-logistics");
    if (btnApplyDocLogistics) {
        btnApplyDocLogistics.addEventListener("click", () => applyDocCalculatedLogistics());
    }

    const selectDocVehicleType = document.getElementById("doc-logistics-vehicle-type");
    if (selectDocVehicleType) {
        selectDocVehicleType.addEventListener("change", () => updateDocLogisticsTollMultiplier());
    }

    const selectDocOpType = document.getElementById("doc-logistics-op-type");
    if (selectDocOpType) {
        selectDocOpType.addEventListener("change", () => calculateDocLogistics());
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
            el.addEventListener("input", () => calculateDocLogistics());
        }
    });

    const chkDocTollReturn = document.getElementById("doc-logistics-toll-return");
    if (chkDocTollReturn) {
        chkDocTollReturn.addEventListener("change", () => calculateDocLogistics());
    }

    // Roteamento Automático ao mudar endereço
    const rentalAddressInput = document.getElementById("rental-address");
    if (rentalAddressInput) {
        rentalAddressInput.addEventListener("change", () => fetchRentalRouteDistance(true));
    }

    const docAddressInput = document.getElementById("doc-address");
    if (docAddressInput) {
        docAddressInput.addEventListener("change", () => fetchDocRouteDistance(true));
    }
}

// --- ABRIR MODAL DE REGISTRO DE VENDAS/CONSUMO ---
function openSalesModal(clientId) {
    const client = state.clients.find(c => c.id === clientId);
    if (!client) return;
    
    document.getElementById("sales-client-id").value = client.id;
    document.getElementById("sales-client-name").value = client.name;
    
    renderSalesModalProducts(client);
    
    const modal = document.getElementById("modal-sales");
    modal.classList.add("active");
}

// --- FUNÇÕES AUXILIARES DE MODAIS ---
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add("active");
    }
}
window.openModal = openModal;

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove("active");
    }
}

// --- TERMO DE COMODATO ---
function openComodato(comId) {
    let comodato = state.comodatos ? state.comodatos.find(c => c.id === comId) : null;
    let client, freezerCode, freezerBrand, freezerVoltage, freezerCapacity, dataEntrega, notes;
    
    if (comodato) {
        client = state.clients.find(c => c.id === comodato.clientId);
        freezerCode = comodato.freezerCode;
        freezerBrand = comodato.freezerBrand;
        freezerVoltage = comodato.freezerVoltage;
        freezerCapacity = comodato.freezerCapacity;
        dataEntrega = comodato.startDate ? new Date(comodato.startDate + 'T00:00:00').toLocaleDateString('pt-BR') : '___/___/______';
        notes = comodato.notes || '';
    } else {
        client = state.clients.find(c => c.id === comId);
        if (!client) return;
        freezerCode = client.freezerCode || 'N/A';
        freezerBrand = client.freezerBrand || 'Não informado';
        freezerVoltage = client.freezerVoltage || 'Não informado';
        freezerCapacity = client.freezerCapacity || '';
        dataEntrega = client.deliveryDate ? new Date(client.deliveryDate + 'T00:00:00').toLocaleDateString('pt-BR') : '___/___/______';
        notes = client.maintenanceNotes || '';
        comodato = state.comodatos ? state.comodatos.find(c => c.clientId === client.id && c.freezerCode === freezerCode && c.status !== 'retirado') : null;
    }

    if (!client) return;

    const dataAtual = new Date().toLocaleDateString('pt-BR');
    const showSignatures = (state.printSettings && state.printSettings.showSignatures !== undefined) ? state.printSettings.showSignatures : true;
    
    let signatureHTML = '';
    if (showSignatures && comodato && comodato.signatureBase64) {
        signatureHTML = `<img src="${comodato.signatureBase64}" style="max-height: 80px; max-width: 100%; display: block; margin: 0 auto -10px auto; pointer-events: none; filter: contrast(1.2);">`;
    }

    const contractHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
            <img src="${state.factorySettings && state.factorySettings.logo ? state.factorySettings.logo : 'logo_vertical.png'}" alt="Gelo do Vale" style="max-height: 100px; object-fit: contain;">
        </div>
        <h2 style="text-align: center; margin-bottom: 20px; font-weight: bold; border-bottom: 2px solid var(--color-primary); padding-bottom: 10px; font-size: 1.25rem;">INSTRUMENTO PARTICULAR DE COMODATO DE EQUIPAMENTO</h2>
        
        <p><strong>COMODANTE:</strong> ${state.factorySettings && state.factorySettings.name ? state.factorySettings.name : FACTORY_INFO.name}, inscrita no CNPJ sob o nº ${state.factorySettings && state.factorySettings.cnpj ? state.factorySettings.cnpj : FACTORY_INFO.cnpj}, com sede no endereço: ${state.factorySettings && state.factorySettings.address ? state.factorySettings.address : FACTORY_INFO.address}.</p>
        <p><strong>COMODATÁRIO:</strong> ${client.name.toUpperCase()}, CNPJ/CPF: ${client.document || 'Não informado'}, endereço: ${client.address || 'Não informado'}, telefone: ${client.phone || 'Não informado'}.</p>
        
        <p style="margin-top: 15px;">As partes qualificadas acima têm entre si justo e avençado o comodato do equipamento abaixo descrito, regulado pelas seguintes condições:</p>
        
        <h4 style="margin-top: 15px; font-weight: bold; color: var(--color-primary); font-size: 0.95rem;">CLÁUSULA 1ª - DO OBJETO E CARACTERÍSTICAS</h4>
        <p>O presente contrato tem por objeto o empréstimo gratuito (comodato) de 01 (um) freezer para conservação de gelo, de propriedade da COMODANTE, com as seguintes características:</p>
        <ul style="margin: 10px 0; padding-left: 20px; list-style-type: square;">
            <li><strong>Código do Freezer (Serial):</strong> ${freezerCode}</li>
            <li><strong>Marca / Modelo:</strong> ${freezerBrand}</li>
            <li><strong>Voltagem de Operação:</strong> ${freezerVoltage}</li>
            <li><strong>Capacidade (Volume):</strong> ${freezerCapacity ? freezerCapacity + (freezerCapacity.toString().toLowerCase().includes('litros') ? '' : ' Litros') : 'Não informado'}</li>
            <li><strong>Data de Entrega ao Cliente:</strong> ${dataEntrega}</li>
        </ul>
        <p>O COMODATÁRIO declara receber o equipamento em perfeitas condições de uso, funcionamento, limpeza e conservação.</p>
        
        <h4 style="margin-top: 15px; font-weight: bold; color: var(--color-primary); font-size: 0.95rem;">CLÁUSULA 2ª - DO USO E EXCLUSIVIDADE</h4>
        <p>O equipamento destina-se <strong>exclusivamente</strong> ao armazenamento e venda de gelo fornecido pela COMODANTE. Fica expressamente vedada a colocação de produtos de outras marcas ou quaisquer outros alimentos e bebidas no freezer comodado, sob pena de rescisão contratual imediata e retirada do equipamento.</p>
        
        <h4 style="margin-top: 15px; font-weight: bold; color: var(--color-primary); font-size: 0.95rem;">CLÁUSULA 3ª - DAS OBRIGAÇÕES E CONSERVAÇÃO</h4>
        <p>O COMODATÁRIO obriga-se a zelar pela conservação do freezer como se fosse seu próprio bem. A energia elétrica consumida para o funcionamento do equipamento correrá por conta exclusiva do COMODATÁRIO.</p>
        <p>Qualquer defeito técnico ou necessidade de manutenção deverá ser comunicado imediatamente à COMODANTE. Fica vedada a intervenção de terceiros não autorizados para reparos no equipamento.</p>
        
        <h4 style="margin-top: 15px; font-weight: bold; color: var(--color-primary); font-size: 0.95rem;">CLÁUSULA 4ª - DO PRAZO E RESCISÃO</h4>
        <p>O comodato é por prazo indeterminado. A COMODANTE reserva-se o direito de solicitar a devolução do equipamento a qualquer momento, mediante aviso prévio por escrito com antecedência mínima de 05 (cinco) dias, sem que caiba ao COMODATÁRIO qualquer tipo de indenização ou direito de devolução tardia.</p>
        
        <p style="margin-top: 25px; text-align: center;">Local e data: Vale do Paraíba - SP, ${comodato && comodato.signatureDate ? new Date(comodato.signatureDate).toLocaleDateString('pt-BR') : dataAtual}.</p>
        
        <div style="margin-top: 40px; display: flex; justify-content: space-between;">
            <div style="width: 45%; border-top: 1px solid #ccc; text-align: center; padding-top: 5px;">
                <p style="font-size: 0.8rem; margin: 0; color: #000;"><strong>COMODANTE</strong></p>
                <p style="font-size: 0.75rem; color: #666; margin: 0;">${state.factorySettings && state.factorySettings.name ? state.factorySettings.name : FACTORY_INFO.name}</p>
            </div>
            <div style="width: 45%; border-top: 1px solid #ccc; text-align: center; padding-top: 5px; min-height: 100px; display: flex; flex-direction: column; justify-content: space-between;">
                <div>
                    ${signatureHTML}
                </div>
                <div>
                    <p style="font-size: 0.8rem; margin: 0; color: #000;"><strong>COMODATÁRIO</strong></p>
                    <p style="font-size: 0.75rem; color: #666; margin: 0;">${client.name}</p>
                </div>
            </div>
        </div>
    `;

    document.getElementById("comodato-content").innerHTML = contractHTML;
    document.getElementById("modal-comodato").classList.add("active");
}

function printComodato() {
    const content = document.getElementById("comodato-content").innerHTML;
    const printWindow = window.open("", "_blank");
    
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Termo de Comodato - Gelo do Vale</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    padding: 40px;
                    color: #000;
                    background: #fff;
                    font-size: 13px;
                }
                h2 {
                    text-align: center;
                    margin-bottom: 30px;
                    font-size: 18px;
                    text-transform: uppercase;
                    border-bottom: 2px solid #000;
                    padding-bottom: 10px;
                }
                h4 {
                    margin-top: 20px;
                    margin-bottom: 5px;
                    font-size: 14px;
                    text-transform: uppercase;
                }
                p, ul {
                    margin-bottom: 12px;
                    text-align: justify;
                }
                ul {
                    padding-left: 20px;
                }
                .signatures {
                    margin-top: 50px;
                    display: flex;
                    justify-content: space-between;
                }
                .sig-box {
                    width: 45%;
                    border-top: 1px solid #000;
                    text-align: center;
                    padding-top: 5px;
                }
                @media print {
                    .print-btn-container { display: none; }
                }
            </style>
        </head>
        <body>
            <div class="print-btn-container" style="text-align: right; margin-bottom: 20px;">
                <button onclick="window.print();" style="padding: 8px 16px; background: #0072ff; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">Imprimir Documento</button>
            </div>
            ${content}
        </body>
        </html>
    `);
    
    printWindow.document.close();
}

// --- CONTRATO DE ALUGUEL DE EQUIPAMENTO ---
function openRentalContract(rentalId) {
    const rental = state.rentals.find(r => r.id === rentalId);
    if (!rental) return;

    document.getElementById("contract-rental-id").value = rentalId;
    
    // Se o aluguel ainda não tem rentalTerms salvo, usa o padrão da fábrica
    if (!rental.rentalTerms) {
        rental.rentalTerms = state.factorySettings.rentalTerms || "";
    }

    // Carregar campos no formulário da esquerda
    document.getElementById("contract-extra-day-fee").value = rental.extraDayFee !== undefined ? rental.extraDayFee.toFixed(2) : "0.00";
    document.getElementById("contract-norms").value = rental.rentalTerms;

    // Atualizar preview
    updateRentalContractPreview(rentalId);

    // Exibir modal
    document.getElementById("modal-rental-contract").classList.add("active");

    // Adicionar listeners para atualizar em tempo real ao digitar
    const extraDayInput = document.getElementById("contract-extra-day-fee");
    const normsTextarea = document.getElementById("contract-norms");

    // Remove listeners antigos para não duplicar
    extraDayInput.oninput = null;
    normsTextarea.oninput = null;

    extraDayInput.oninput = () => {
        const val = parseFloat(extraDayInput.value) || 0;
        rental.extraDayFee = val;
        saveState();
        updateRentalContractPreview(rentalId);
        renderTinas(); // Atualiza o card para refletir a nova diária extra se necessário
    };

    normsTextarea.oninput = () => {
        rental.rentalTerms = normsTextarea.value;
        saveState();
        updateRentalContractPreview(rentalId);
    };
}

function updateRentalContractPreview(rentalId) {
    const rental = state.rentals.find(r => r.id === rentalId);
    if (!rental) return;

    const dataEntrega = rental.deliveryDate ? new Date(rental.deliveryDate + 'T00:00:00').toLocaleDateString('pt-BR') : '___/___/______';
    const dataPrevisaoRetirada = rental.expectedReturnDate ? new Date(rental.expectedReturnDate + 'T00:00:00').toLocaleDateString('pt-BR') : '___/___/______';
    const dataAtual = new Date().toLocaleDateString('pt-BR');

    // Buscar tipo de item formatado
    const matchingProd = state.products.find(p => p.id === rental.itemType);
    const itemLabel = (matchingProd ? matchingProd.name : rental.itemType) + (rental.tinaColor ? ` (${rental.tinaColor})` : "");

    // Resumo financeiro do aluguel
    const totalGeral = rental.totalRevenue || (rental.rentalFee + (rental.deliveryFee || 0) + (rental.pickupFee || 0));

    // Formatar termos com quebras de linha para HTML
    const formattedTerms = (rental.rentalTerms || "")
        .replace(/\n/g, '<br>')
        .replace(/(?:\r\n|\r|\n)/g, '<br>');

    // Obter logo
    const logoSrc = state.factorySettings && state.factorySettings.logo ? state.factorySettings.logo : 'logo_vertical.png';

    let clientSignatureHTML = "";
    if (rental.signatureBase64) {
        clientSignatureHTML = `<img src="${rental.signatureBase64}" style="max-height: 55px; max-width: 100%; display: block; margin: 0 auto -10px auto; pointer-events: none;">`;
    }

    const contractHTML = `
        <div style="text-align: center; margin-bottom: 15px;">
            <img src="${logoSrc}" alt="Gelo do Vale" style="max-height: 80px; object-fit: contain;">
        </div>
        <h2 style="text-align: center; margin-bottom: 20px; font-weight: bold; border-bottom: 2px solid #000; padding-bottom: 5px; font-size: 1.15rem; color: #000;">CONTRATO DE LOCAÇÃO DE EQUIPAMENTO</h2>
        
        <div style="margin-bottom: 12px; font-size: 0.8rem; color: #000;">
            <p><strong>LOCADOR:</strong> ${FACTORY_INFO.name}, CNPJ nº ${FACTORY_INFO.cnpj}, endereço: ${FACTORY_INFO.address}.</p>
            <p><strong>LOCATÁRIO:</strong> ${rental.clientName.toUpperCase()}, endereço: ${rental.address || 'Não informado'}, telefone: ${rental.phone || 'Não informado'}.</p>
        </div>
        
        <p style="margin-top: 10px; font-weight: bold; font-size: 0.8rem; color: #000; border-bottom: 1px solid #ddd; padding-bottom: 3px;">1. OBJETO DA LOCAÇÃO</p>
        <p style="font-size: 0.8rem; color: #000;">O LOCADOR cede em locação ao LOCATÁRIO o seguinte equipamento:</p>
        <ul style="margin: 8px 0; padding-left: 20px; font-size: 0.8rem; color: #000; list-style-type: square;">
            <li><strong>Equipamento / Modelo:</strong> ${itemLabel}</li>
            <li><strong>Identificação (Serial/Código):</strong> ${rental.tinaCode}</li>
            <li><strong>Período de Locação:</strong> ${rental.rentalDays || 7} dias</li>
            <li><strong>Data de Entrega:</strong> ${dataEntrega}</li>
            <li><strong>Previsão de Retirada:</strong> ${dataPrevisaoRetirada}</li>
        </ul>
        
        <p style="margin-top: 10px; font-weight: bold; font-size: 0.8rem; color: #000; border-bottom: 1px solid #ddd; padding-bottom: 3px;">2. VALORES E CONDIÇÕES COMERCIAIS</p>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 8px 0; font-size: 0.8rem; color: #000;">
            <div><strong>Taxa de Locação:</strong> R$ ${rental.rentalFee.toFixed(2)}</div>
            <div><strong>Fretes (Entrega + Busca):</strong> R$ ${((rental.deliveryFee || 0) + (rental.pickupFee || 0)).toFixed(2)}</div>
            <div><strong>Diária Extra (Atraso):</strong> R$ ${(rental.extraDayFee || 0).toFixed(2)} / dia</div>
            <div><strong>Total Geral da Locação:</strong> R$ ${totalGeral.toFixed(2)}</div>
        </div>
        
        <p style="margin-top: 10px; font-weight: bold; font-size: 0.8rem; color: #000; border-bottom: 1px solid #ddd; padding-bottom: 3px;">3. NORMAS E CONDIÇÕES CONTRATUAIS</p>
        <div style="font-size: 0.8rem; color: #000; line-height: 1.4; text-align: justify; margin-bottom: 15px;">
            ${formattedTerms || 'Sem cláusulas declaradas.'}
        </div>
        
        <p style="margin-top: 20px; text-align: center; font-size: 0.8rem; color: #000;">Vale do Paraíba - SP, ${dataAtual}.</p>
        
        <div style="margin-top: 35px; display: flex; justify-content: space-between; font-size: 0.8rem; color: #000;">
            <div style="width: 45%; border-top: 1px solid #000; text-align: center; padding-top: 5px;">
                <p><strong>LOCADOR</strong></p>
                <p style="font-size: 0.75rem; color: #555;">${FACTORY_INFO.name}</p>
            </div>
            <div style="width: 45%; border-top: 1px solid #000; text-align: center; padding-top: 5px; position: relative;">
                ${clientSignatureHTML}
                <p><strong>LOCATÁRIO</strong></p>
                <p style="font-size: 0.75rem; color: #555;">${rental.clientName}</p>
            </div>
        </div>
    `;

    document.getElementById("rental-contract-preview").innerHTML = contractHTML;
}

function printRentalContract() {
    const rentalId = document.getElementById("contract-rental-id").value;
    if (!rentalId) return;
    
    const content = document.getElementById("rental-contract-preview").innerHTML;
    const printWindow = window.open("", "_blank");
    
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Contrato de Locação - Gelo do Vale</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    line-height: 1.5;
                    padding: 40px;
                    color: #000;
                    background: #fff;
                    font-size: 12px;
                }
                h2 {
                    text-align: center;
                    margin-bottom: 25px;
                    font-size: 16px;
                    text-transform: uppercase;
                    border-bottom: 2px solid #000;
                    padding-bottom: 8px;
                }
                p, ul {
                    margin-bottom: 10px;
                    text-align: justify;
                }
                ul {
                    padding-left: 20px;
                }
                .signatures {
                    margin-top: 40px;
                    display: flex;
                    justify-content: space-between;
                }
                .sig-box {
                    width: 45%;
                    border-top: 1px solid #000;
                    text-align: center;
                    padding-top: 5px;
                }
                @media print {
                    .print-btn-container { display: none; }
                    body { padding: 0; }
                }
            </style>
        </head>
        <body>
            <div class="print-btn-container" style="text-align: right; margin-bottom: 20px;">
                <button onclick="window.print();" style="padding: 8px 16px; background: #0072ff; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">Imprimir Contrato</button>
            </div>
            ${content}
        </body>
        </html>
    `);
    
    printWindow.document.close();
}

// ==========================================================================
// TELA 5: INVENTÁRIO E GESTÃO DE FREEZERS
// ==========================================================================

function renderInventario() {
    const freezerGrid = document.getElementById("freezer-grid-container");
    freezerGrid.innerHTML = "";
    
    const searchQuery = document.getElementById("search-freezer").value.toLowerCase().trim();
    const filterStatus = document.getElementById("filter-freezer-status").value;
    
    // Filtrar freezers
    const filteredFreezers = state.freezers.filter(f => {
        // Filtro de Busca
        const matchesSearch = f.code.toLowerCase().includes(searchQuery) ||
                              f.brand.toLowerCase().includes(searchQuery) ||
                              (f.clientName && f.clientName.toLowerCase().includes(searchQuery));
                              
        // Filtro de Status
        const matchesStatus = !filterStatus || f.status === filterStatus;
        
        return matchesSearch && matchesStatus;
    });
    
    if (filteredFreezers.length === 0) {
        freezerGrid.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <i data-lucide="package" style="width: 48px; height: 48px;"></i>
                <p>Nenhum equipamento encontrado com os filtros aplicados.</p>
                <button class="btn btn-primary" style="margin-top: 1rem;" onclick="openFreezerModal()">
                    <i data-lucide="plus"></i> Cadastrar Novo Freezer
                </button>
            </div>
        `;
        lucide.createIcons();
        return;
    }
    
    filteredFreezers.forEach(f => {
        // Garantias
        const warranty = getWarrantyInfo(f.purchaseDate, f.warrantyMonths);
        const warrantyBadgeHTML = `<span class="warranty-badge ${warranty.class}">${warranty.text}</span>`;
        
        // Status Badge
        let statusBadge = '';
        if (f.status === 'disponivel') {
            statusBadge = '<span class="status-badge completed" style="background: rgba(16,185,129,0.15); color: #10b981;">Disponível</span>';
        } else if (f.status === 'alocado') {
            statusBadge = '<span class="status-badge pending" style="background: rgba(0,114,255,0.15); color: var(--color-primary);">Alocado</span>';
        } else if (f.status === 'manutencao') {
            statusBadge = '<span class="status-badge pending" style="background: rgba(245,158,11,0.15); color: #f59e0b;">Em Manutenção</span>';
        } else if (f.status === 'inativo') {
            statusBadge = '<span class="status-badge expired" style="background: rgba(239,68,68,0.15); color: var(--color-danger);">Inativo</span>';
        }
        
        // Localização
        let locationHTML = '';
        if (f.status === 'alocado') {
            locationHTML = `<div style="margin-bottom: 0.5rem;"><i data-lucide="map-pin" style="width: 14px; height: 14px; display: inline; vertical-align: middle; margin-right: 4px;"></i> Alocado em: <strong>${f.clientName}</strong></div>`;
        } else if (f.status === 'disponivel') {
            locationHTML = `<div style="margin-bottom: 0.5rem; color: #10b981;"><i data-lucide="home" style="width: 14px; height: 14px; display: inline; vertical-align: middle; margin-right: 4px;"></i> Local: Fábrica (Disponível)</div>`;
        } else if (f.status === 'manutencao') {
            locationHTML = `<div style="margin-bottom: 0.5rem; color: #f59e0b;"><i data-lucide="wrench" style="width: 14px; height: 14px; display: inline; vertical-align: middle; margin-right: 4px;"></i> Local: Oficina / Assistência</div>`;
        } else {
            locationHTML = `<div style="margin-bottom: 0.5rem; color: var(--color-danger);"><i data-lucide="slash" style="width: 14px; height: 14px; display: inline; vertical-align: middle; margin-right: 4px;"></i> Equipamento Desativado</div>`;
        }
        
        // Imagens do Equipamento
        let imageSnippet = '';
        if (f.photoFreezer) {
            imageSnippet = `<div class="freezer-img-thumbnail" style="background-image: url('${f.photoFreezer}')"></div>`;
        } else {
            imageSnippet = `<div class="freezer-img-thumbnail-placeholder"><i data-lucide="image" style="width: 24px; height: 24px; opacity: 0.3;"></i></div>`;
        }
        
        freezerGrid.innerHTML += `
            <div class="freezer-card">
                <div class="freezer-card-header">
                    <div style="display: flex; gap: 10px; align-items: center;">
                        ${imageSnippet}
                        <div>
                            <h3 style="font-size: 1rem; font-weight: 700; margin: 0; color: #fff;">${f.code}</h3>
                            <p style="font-size: 0.75rem; color: var(--color-text-muted); margin: 2px 0 0 0;">${f.brand}</p>
                        </div>
                    </div>
                    ${statusBadge}
                </div>
                <div class="freezer-card-body" style="padding: 1rem; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 0.8rem; display: flex; flex-direction: column; gap: 6px;">
                    <div style="display: flex; justify-content: space-between;">
                        <span>Voltagem: <strong>${f.voltage || 'Bivolt'}</strong></span>
                        <span>Capacidade: <strong>${f.capacity ? f.capacity + ' L' : 'Não inf.'}</strong></span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span>Aquisição: <strong>${f.purchaseDate ? new Date(f.purchaseDate + 'T00:00:00').toLocaleDateString('pt-BR') : 'Não informada'}</strong></span>
                    </div>
                    ${warrantyBadgeHTML}
                    <div style="border-top: 1px solid rgba(255,255,255,0.05); margin-top: 6px; padding-top: 8px;">
                        ${locationHTML}
                    </div>
                </div>
                <div class="freezer-card-actions" style="padding: 0.75rem 1rem; display: flex; justify-content: flex-end; gap: 8px; background: rgba(0,0,0,0.1);">
                    <button class="btn btn-secondary" onclick="openFreezerDetail('${f.id}')" style="margin-right: auto; padding: 4px 8px; font-size: 0.75rem; display: inline-flex; align-items: center; gap: 4px; background: rgba(255,255,255,0.03);">
                        <i data-lucide="eye" style="width: 14px; height: 14px;"></i> Detalhes
                    </button>
                    <button class="btn btn-secondary btn-icon-only" onclick="openFreezerModal('${f.id}')" title="Editar Freezer">
                        <i data-lucide="edit-3" style="width: 15px; height: 15px;"></i>
                    </button>
                    <button class="btn btn-danger btn-icon-only" onclick="deleteFreezer('${f.id}')" title="Remover Freezer">
                        <i data-lucide="trash-2" style="width: 15px; height: 15px;"></i>
                    </button>
                </div>
            </div>
        `;
    });
    
    lucide.createIcons();
}

function openFreezerModal(freezerId = null) {
    const modal = document.getElementById("modal-freezer");
    const form = document.getElementById("freezer-form");
    const title = document.getElementById("freezer-modal-title");
    
    form.reset();
    document.getElementById("form-freezer-id").value = "";
    document.getElementById("photo-freezer-data").value = "";
    document.getElementById("photo-invoice-data").value = "";
    document.getElementById("photo-establishment-data").value = "";
    document.getElementById("preview-freezer").innerHTML = "<p style='font-size: 0.75rem; color: var(--color-text-muted);'>Nenhuma foto carregada</p>";
    document.getElementById("preview-invoice").innerHTML = "<p style='font-size: 0.75rem; color: var(--color-text-muted);'>Nenhuma nota carregada</p>";
    document.getElementById("preview-establishment").innerHTML = "<p style='font-size: 0.75rem; color: var(--color-text-muted);'>Nenhuma foto carregada</p>";
    
    // Configurar o campo de status
    const statusFieldContainer = document.getElementById("freezer-status-container");
    if (statusFieldContainer) {
        if (freezerId) {
            statusFieldContainer.style.display = "block";
        } else {
            statusFieldContainer.style.display = "none"; // Criação começa como disponível
        }
    }
    
    if (freezerId) {
        title.innerText = "Editar Freezer";
        const f = state.freezers.find(item => item.id === freezerId);
        if (f) {
            document.getElementById("form-freezer-id").value = f.id;
            document.getElementById("freezer-code-input").value = f.code;
            document.getElementById("freezer-brand-input").value = f.brand;
            document.getElementById("freezer-voltage-select").value = f.voltage;
            document.getElementById("freezer-capacity-input").value = f.capacity || "";
            document.getElementById("freezer-purchase-date").value = f.purchaseDate || "";
            document.getElementById("freezer-warranty").value = f.warrantyMonths || 12;
            document.getElementById("freezer-status-select").value = f.status;
            
            if (f.photoFreezer) {
                document.getElementById("photo-freezer-data").value = f.photoFreezer;
                document.getElementById("preview-freezer").innerHTML = `<img src="${f.photoFreezer}" style="max-height: 80px; border-radius: 4px;">`;
            }
            if (f.photoInvoice) {
                document.getElementById("photo-invoice-data").value = f.photoInvoice;
                document.getElementById("preview-invoice").innerHTML = `<img src="${f.photoInvoice}" style="max-height: 80px; border-radius: 4px;">`;
            }
            if (f.photoEstablishment) {
                document.getElementById("photo-establishment-data").value = f.photoEstablishment;
                document.getElementById("preview-establishment").innerHTML = `<img src="${f.photoEstablishment}" style="max-height: 80px; border-radius: 4px;">`;
            }
        }
    } else {
        title.innerText = "Novo Equipamento";
    }
    
    modal.classList.add("active");
}

function deleteFreezer(freezerId) {
    const f = state.freezers.find(item => item.id === freezerId);
    if (!f) return;
    
    if (f.status === 'alocado') {
        alert(`O freezer ${f.code} está alocado ao cliente "${f.clientName}". Desvincule-o no cadastro do cliente antes de remover do inventário!`);
        return;
    }
    
    if (confirm(`Deseja realmente excluir o freezer ${f.code} do inventário? Esta ação é irreversível.`)) {
        state.freezers = state.freezers.filter(item => item.id !== freezerId);
        saveState();
        renderApp();
    }
}

function openFreezerDetail(freezerId) {
    const freezer = state.freezers.find(f => f.id === freezerId);
    if (!freezer) return;
    
    document.getElementById("detail-code").innerText = freezer.code;
    document.getElementById("detail-brand").innerText = freezer.brand;
    document.getElementById("detail-voltage").innerText = freezer.voltage || 'Não informado';
    document.getElementById("detail-capacity").innerText = freezer.capacity ? `${freezer.capacity} Litros` : 'Não informada';
    document.getElementById("detail-purchase-date").innerText = freezer.purchaseDate ? new Date(freezer.purchaseDate + 'T00:00:00').toLocaleDateString('pt-BR') : 'Não informada';
    document.getElementById("detail-warranty").innerText = freezer.warrantyMonths ? `${freezer.warrantyMonths} meses` : 'Sem garantia';
    
    const warranty = getWarrantyInfo(freezer.purchaseDate, freezer.warrantyMonths);
    const detailWarrantyBadge = document.getElementById("detail-warranty-badge");
    detailWarrantyBadge.innerText = warranty.text;
    detailWarrantyBadge.className = `warranty-badge ${warranty.class}`;
    
    // Configurar botões de ação do detalhe
    document.getElementById("btn-transferir-freezer").onclick = () => openMoveFreezerModal(freezer.id);
    document.getElementById("btn-gerar-etiqueta").onclick = () => openStickerModal(freezer.id);
    document.getElementById("note-freezer-id").value = freezer.id;
    
    // Status atual no detalhe
    let statusText = '';
    if (freezer.status === 'disponivel') statusText = '📍 Fábrica (Disponível)';
    else if (freezer.status === 'alocado') statusText = `🏪 Alocado em: <strong>${freezer.clientName}</strong>`;
    else if (freezer.status === 'manutencao') statusText = '🔧 Oficina / Em Manutenção';
    else statusText = '❌ Inativo';
    document.getElementById("detail-location").innerHTML = statusText;
    
    // Fotos na aba de detalhes
    const photoSection = document.getElementById("detail-photos-gallery");
    photoSection.innerHTML = "";
    
    if (freezer.photoFreezer) {
        photoSection.innerHTML += `
            <div style="flex: 1; min-width: 120px;">
                <span style="font-size: 0.7rem; color: var(--color-text-muted); display: block; margin-bottom: 4px;">Foto do Freezer</span>
                <img src="${freezer.photoFreezer}" style="width: 100%; border-radius: 6px; border: 1px solid rgba(255,255,255,0.05); cursor: pointer;" onclick="window.open('${freezer.photoFreezer}', '_blank')">
            </div>
        `;
    }
    if (freezer.photoInvoice) {
        photoSection.innerHTML += `
            <div style="flex: 1; min-width: 120px;">
                <span style="font-size: 0.7rem; color: var(--color-text-muted); display: block; margin-bottom: 4px;">Nota Fiscal / Documento</span>
                <img src="${freezer.photoInvoice}" style="width: 100%; border-radius: 6px; border: 1px solid rgba(255,255,255,0.05); cursor: pointer;" onclick="window.open('${freezer.photoInvoice}', '_blank')">
            </div>
        `;
    }
    if (freezer.photoEstablishment) {
        photoSection.innerHTML += `
            <div style="flex: 1; min-width: 120px;">
                <span style="font-size: 0.7rem; color: var(--color-text-muted); display: block; margin-bottom: 4px;">Foto do Local</span>
                <img src="${freezer.photoEstablishment}" style="width: 100%; border-radius: 6px; border: 1px solid rgba(255,255,255,0.05); cursor: pointer;" onclick="window.open('${freezer.photoEstablishment}', '_blank')">
            </div>
        `;
    }
    if (!freezer.photoFreezer && !freezer.photoInvoice && !freezer.photoEstablishment) {
        photoSection.innerHTML = "<p style='font-size: 0.8rem; color: var(--color-text-muted); width: 100%; text-align: center; padding: 1rem;'>Nenhuma foto anexada a este freezer.</p>";
    }
    
    // Histórico de Movimentações
    const timeline = document.getElementById("movement-timeline");
    timeline.innerHTML = "";
    
    if (freezer.movementHistory && freezer.movementHistory.length > 0) {
        // Inverter para mostrar a mais recente primeiro
        const sortedHistory = [...freezer.movementHistory].reverse();
        sortedHistory.forEach(log => {
            timeline.innerHTML += `
                <div class="timeline-item">
                    <div class="timeline-date">${log.date}</div>
                    <div class="timeline-content">
                        <strong>De:</strong> ${log.from} &rarr; <strong>Para:</strong> ${log.to}
                        <div style="color: var(--color-text-muted); font-size: 0.75rem; margin-top: 2px;">${log.reason}</div>
                    </div>
                </div>
            `;
        });
    } else {
        timeline.innerHTML = "<p style='font-size: 0.8rem; color: var(--color-text-muted); padding: 0.5rem;'>Sem histórico registrado.</p>";
    }
    
    // Histórico de Manutenções
    const maintenanceList = document.getElementById("maintenance-notes-list");
    maintenanceList.innerHTML = "";
    
    if (freezer.maintenanceLogs && freezer.maintenanceLogs.length > 0) {
        const sortedLogs = [...freezer.maintenanceLogs].reverse();
        sortedLogs.forEach(log => {
            if (log.type) {
                // Novo formato estruturado
                maintenanceList.innerHTML += `
                    <div style="padding: 10px; background: rgba(255,255,255,0.02); border-radius: 6px; border-left: 4px solid var(--color-primary); font-size: 0.8rem; margin-bottom: 8px; border: 1px solid rgba(255,255,255,0.05); border-left-color: var(--color-primary);">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 4px;">
                            <span style="font-weight: bold; color: var(--color-primary);">${log.type}</span>
                            <span style="font-size: 0.7rem; color: var(--color-text-muted);">${log.date}</span>
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin-bottom: 6px; font-size: 0.75rem; color: var(--color-text-muted);">
                            <div><strong>Técnico:</strong> ${log.technician || 'N/A'}</div>
                            <div style="text-align: right;"><strong>Custo:</strong> R$ ${(parseFloat(log.cost) || 0).toFixed(2).replace(".", ",")}</div>
                        </div>
                        <div style="font-size: 0.8rem; line-height: 1.3; margin-bottom: 4px; color: #fff;">${log.note}</div>
                        ${log.nextDate ? `
                        <div style="font-size: 0.75rem; margin-top: 6px; padding-top: 4px; border-top: 1px dashed rgba(255,255,255,0.05); color: #ffb703; display: flex; align-items: center; gap: 4px;">
                            <i data-lucide="calendar" style="width: 12px; height: 12px;"></i>
                            <span>Próxima manutenção: ${new Date(log.nextDate + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                        </div>
                        ` : ''}
                    </div>
                `;
            } else {
                // Formato retrocompatível simples
                maintenanceList.innerHTML += `
                    <div style="padding: 10px; background: rgba(255,255,255,0.02); border-radius: 6px; border-left: 4px solid var(--color-primary); font-size: 0.8rem; margin-bottom: 8px; border: 1px solid rgba(255,255,255,0.05); border-left-color: var(--color-primary);">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 0.7rem; color: var(--color-text-muted);">
                            <span>Log de Manutenção:</span>
                            <span>${log.date}</span>
                        </div>
                        <div style="color: #fff;">${log.note}</div>
                    </div>
                `;
            }
        });
    } else {
        maintenanceList.innerHTML = "<p style='font-size: 0.8rem; color: var(--color-text-muted); padding: 0.5rem;'>Nenhuma manutenção registrada.</p>";
    }
    
    lucide.createIcons();
    document.getElementById("modal-freezer-detail").classList.add("active");
}

function openMoveFreezerModal(freezerId) {
    const freezer = state.freezers.find(f => f.id === freezerId);
    if (!freezer) return;
    
    document.getElementById("move-freezer-id").value = freezer.id;
    document.getElementById("move-freezer-code").value = freezer.code;
    document.getElementById("move-destiny").value = "";
    document.getElementById("move-reason").value = "";
    
    // Popular clientes
    populateClientDropdowns();
    toggleMoveClientSelect();
    
    document.getElementById("modal-move-freezer").classList.add("active");
}

function toggleMoveClientSelect() {
    const destiny = document.getElementById("move-destiny").value;
    const clientSelectContainer = document.getElementById("move-client-container");
    if (destiny === "cliente") {
        clientSelectContainer.style.display = "block";
    } else {
        clientSelectContainer.style.display = "none";
    }
}

function openStickerModal(freezerId) {
    const freezer = state.freezers.find(f => f.id === freezerId);
    if (!freezer) return;
    
    const printableContent = document.getElementById("printable-sticker-content");
    printableContent.innerHTML = `
        <div class="sticker-header">
            <span class="sticker-logo-text">❄️ Gelo do Vale</span>
            <span style="font-size: 0.75rem; font-weight: bold; border: 1px solid #000; padding: 2px 5px; border-radius: 3px; background: #fff; color: #000;">${freezer.voltage || 'BIVOLT'}</span>
        </div>
        <div class="sticker-body" style="display: flex; justify-content: space-between; align-items: center; gap: 15px; margin-top: 8px;">
            <div class="sticker-specs" style="font-size: 0.75rem; line-height: 1.4; color: #000; text-align: left;">
                <div style="font-size: 1rem; font-weight: 900; margin-bottom: 4px; color: #000;">CÓD: ${freezer.code}</div>
                <div><strong>Equipamento:</strong> ${freezer.brand || 'Freezer'}</div>
                <div><strong>Propriedade de:</strong> Gelo do Vale</div>
                <div style="font-size: 0.55rem; font-weight: bold; margin-top: 5px; color: #ef4444; border: 1px dashed #ef4444; padding: 1px 3px; display: inline-block;">⚠️ Cuidado com a voltagem!</div>
            </div>
            <div class="sticker-qrcode" id="sticker-qrcode-render" style="padding: 4px; background: #fff; border: 1px solid #000; display: flex; align-items: center; justify-content: center;"></div>
        </div>
        <div class="sticker-footer" style="margin-top: 8px; border-top: 1px solid #000; padding-top: 4px; font-size: 0.6rem; font-weight: bold; text-align: center; color: #000;">
            SUPORTE OU ASSISTÊNCIA TÉCNICA: ${FACTORY_INFO.phone}
        </div>
    `;
    
    // Renderizar o QR Code usando a biblioteca local qrcode.min.js
    setTimeout(() => {
        const qrContainer = document.getElementById("sticker-qrcode-render");
        qrContainer.innerHTML = ""; // Limpar
        new QRCode(qrContainer, {
            text: freezer.code,
            width: 80,
            height: 80,
            colorDark : "#000000",
            colorLight : "#ffffff",
            correctLevel : QRCode.CorrectLevel.H
        });
    }, 100);
    
    document.getElementById("modal-sticker").classList.add("active");
}

function openRentalStickerModal(rentalId) {
    const rental = state.rentals.find(r => r.id === rentalId);
    if (!rental) return;
    
    const itemLabel = rental.itemType === "mesa_cadeiras" ? "Conjunto Mesa + 4 Cadeiras" : `Tina 360L (${rental.tinaColor || "Azul"})`;
    
    const printableContent = document.getElementById("printable-sticker-content");
    printableContent.innerHTML = `
        <div class="sticker-header">
            <span class="sticker-logo-text">❄️ Gelo do Vale</span>
            <span style="font-size: 0.75rem; font-weight: bold; border: 1px solid #000; padding: 2px 5px; border-radius: 3px; background: #fff; color: #000;">ALUGUEL</span>
        </div>
        <div class="sticker-body" style="display: flex; justify-content: space-between; align-items: center; gap: 15px; margin-top: 8px;">
            <div class="sticker-specs" style="font-size: 0.75rem; line-height: 1.4; color: #000; text-align: left;">
                <div style="font-size: 1rem; font-weight: 900; margin-bottom: 4px; color: #000;">CÓD: ${rental.tinaCode}</div>
                <div><strong>Equipamento:</strong> ${itemLabel}</div>
                <div><strong>Cliente:</strong> ${rental.clientName}</div>
                <div><strong>Devolução:</strong> ${new Date(rental.expectedReturnDate + 'T00:00:00').toLocaleDateString('pt-BR')}</div>
                <div style="font-size: 0.55rem; font-weight: bold; margin-top: 5px; color: #0072ff; border: 1px dashed #0072ff; padding: 1px 3px; display: inline-block;">Propriedade de Gelo do Vale</div>
            </div>
            <div class="sticker-qrcode" id="sticker-qrcode-render" style="padding: 4px; background: #fff; border: 1px solid #000; display: flex; align-items: center; justify-content: center;"></div>
        </div>
        <div class="sticker-footer" style="margin-top: 8px; border-top: 1px solid #000; padding-top: 4px; font-size: 0.6rem; font-weight: bold; text-align: center; color: #000;">
            CONTATO / SUPORTE: ${FACTORY_INFO.phone}
        </div>
    `;
    
    // Renderizar o QR Code usando a biblioteca local qrcode.min.js
    setTimeout(() => {
        const qrContainer = document.getElementById("sticker-qrcode-render");
        qrContainer.innerHTML = ""; // Limpar
        new QRCode(qrContainer, {
            text: rental.tinaCode,
            width: 80,
            height: 80,
            colorDark : "#000000",
            colorLight : "#ffffff",
            correctLevel : QRCode.CorrectLevel.H
        });
    }, 100);
    
    document.getElementById("modal-sticker").classList.add("active");
}

function printSticker() {
    const content = document.getElementById("printable-sticker-content").innerHTML;
    const printWindow = window.open("", "_blank");
    
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Etiqueta Patrimonial - Gelo do Vale</title>
            <style>
                body {
                    margin: 0;
                    padding: 20px;
                    background: #fff;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
                .sticker-card-print {
                    width: 320px;
                    border: 2px solid #000;
                    border-radius: 8px;
                    padding: 15px;
                    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                    background: #fff;
                    color: #000;
                    box-sizing: border-box;
                }
                .sticker-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 2px solid #000;
                    padding-bottom: 6px;
                }
                .sticker-logo-text {
                    font-size: 1.1rem;
                    font-weight: 900;
                }
                .sticker-qrcode img {
                    display: block;
                }
                @media print {
                    .print-btn-container { display: none; }
                }
            </style>
        </head>
        <body>
            <div style="text-align: center; width: 100%;">
                <div class="print-btn-container" style="margin-bottom: 20px;">
                    <button onclick="window.print();" style="padding: 10px 20px; font-size: 14px; font-weight: bold; background: #0072ff; color: #fff; border: none; border-radius: 4px; cursor: pointer;">Imprimir Etiqueta</button>
                </div>
                <div style="display: inline-block;">
                    <div class="sticker-card-print">
                        ${content}
                    </div>
                </div>
            </div>
        </body>
        </html>
    `);
    
    printWindow.document.close();
}

// --- FUNÇÃO AUXILIAR DE GARANTIA ---
function getWarrantyInfo(purchaseDateStr, months) {
    if (!purchaseDateStr || !months) {
        return { text: "Sem garantia cadastrada", active: false, class: "expired" };
    }
    const purchaseDate = new Date(purchaseDateStr + 'T00:00:00');
    const expiryDate = new Date(purchaseDate);
    expiryDate.setMonth(purchaseDate.getMonth() + parseInt(months));
    const today = new Date();
    
    if (today < expiryDate) {
        const diffTime = Math.abs(expiryDate - today);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const monthsLeft = Math.ceil(diffDays / 30.4);
        return { text: `Em Garantia (~${monthsLeft} meses rest.)`, active: true, class: "active" };
    } else {
        return { text: "Garantia Expirada", active: false, class: "expired" };
    }
}

// --- COMPRESSÃO DE IMAGENS POR CANVAS ---
function handleImageUpload(inputEl, previewId) {
    const file = inputEl.files[0];
    if (!file) return;
    
    const previewContainer = document.getElementById(previewId);
    previewContainer.innerHTML = `<div style="font-size: 0.75rem; color: var(--color-primary); padding: 5px;">Carregando e otimizando...</div>`;
    
    const reader = new FileReader();
    reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
            // Criar canvas para redimensionamento e otimização
            const canvas = document.createElement("canvas");
            const maxDimension = 320; // Tamanho compacto para banco local
            let width = img.width;
            let height = img.height;
            
            if (width > height) {
                if (width > maxDimension) {
                    height = Math.round((height * maxDimension) / width);
                    width = maxDimension;
                }
            } else {
                if (height > maxDimension) {
                    width = Math.round((width * maxDimension) / height);
                    height = maxDimension;
                }
            }
            
            canvas.width = width;
            canvas.height = height;
            
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, width, height);
            
            // Exportar em qualidade reduzida (JPEG 0.6)
            const compressedBase64 = canvas.toDataURL("image/jpeg", 0.6);
            
            // Salvar no hidden correspondente
            if (previewId === "preview-freezer") {
                document.getElementById("photo-freezer-data").value = compressedBase64;
            } else if (previewId === "preview-invoice") {
                document.getElementById("photo-invoice-data").value = compressedBase64;
            } else if (previewId === "preview-establishment") {
                document.getElementById("photo-establishment-data").value = compressedBase64;
            } else if (previewId === "preview-rental-location") {
                document.getElementById("photo-rental-location-data").value = compressedBase64;
            }
            
            // Renderizar miniatura
            previewContainer.innerHTML = `<img src="${compressedBase64}" style="max-height: 80px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.1);">`;
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

// --- INTEGRAÇÃO SCANNER DE QR CODE (HTML5-QRCODE) ---
let html5QrCode = null;

function startQRScanner() {
    const container = document.getElementById("qr-reader-container");
    container.innerHTML = "";
    
    document.getElementById("modal-scanner").classList.add("active");
    
    setTimeout(() => {
        html5QrCode = new Html5Qrcode("qr-reader-container");
        html5QrCode.start(
            { facingMode: "environment" },
            {
                fps: 10,
                qrbox: { width: 200, height: 200 }
            },
            (decodedText, decodedResult) => {
                console.log("QR Code detectado:", decodedText);
                stopQRScanner();
                closeModal('modal-scanner');
                
                const codeScanned = decodedText.trim().toUpperCase();
                const freezer = state.freezers.find(f => f.code && f.code.trim().toUpperCase() === codeScanned);
                const rental = state.rentals.find(r => r.tinaCode && r.tinaCode.trim().toUpperCase() === codeScanned);
                
                if (freezer) {
                    openFreezerDetail(freezer.id);
                } else if (rental) {
                    openRentalModal(rental.id);
                } else {
                    alert(`Código Detectado: "${decodedText}". Equipamento ou Tina não cadastrados no sistema.`);
                }
            },
            (errorMessage) => {
                // omitir logs
            }
        ).catch(err => {
            console.error("Erro ao abrir câmera:", err);
            alert("Não foi possível acessar a câmera de ré. Certifique-se de dar permissões de câmera ao seu navegador.");
            closeModal('modal-scanner');
        });
    }, 200);
}

function stopQRScanner() {
    if (html5QrCode) {
        html5QrCode.stop().then(() => {
            html5QrCode = null;
        }).catch(err => {
            console.error("Erro ao parar scanner:", err);
            html5QrCode = null;
        });
    }
}

function closeQRScannerModal() {
    stopQRScanner();
    closeModal('modal-scanner');
}

// --- POPULAR SELEÇÃO DE FREEZER DISPONÍVEL NO CADASTRO DE CLIENTE ---
function populateFreezerDropdowns() {
    // Dropdown atualizado dinamicamente ao abrir modal-client
}

function autoPopulateFreezerDetailsInClientForm() {
    const freezerId = document.getElementById("client-freezer-id-select").value;
    const freezer = state.freezers.find(f => f.id === freezerId);
    
    if (freezer) {
        document.getElementById("freezer-code").value = freezer.code;
        document.getElementById("freezer-brand").value = freezer.brand;
        document.getElementById("freezer-voltage").value = freezer.voltage;
        document.getElementById("freezer-capacity").value = freezer.capacity ? freezer.capacity + " Litros" : "Não informada";
        
        if (freezer.maintenanceLogs && freezer.maintenanceLogs.length > 0) {
            document.getElementById("freezer-maintenance").value = freezer.maintenanceLogs[freezer.maintenanceLogs.length - 1].note;
        } else {
            document.getElementById("freezer-maintenance").value = "";
        }
    } else {
        document.getElementById("freezer-code").value = "";
        document.getElementById("freezer-brand").value = "";
        document.getElementById("freezer-voltage").value = "";
        document.getElementById("freezer-capacity").value = "";
        document.getElementById("freezer-maintenance").value = "";
    }
}

// ==========================================================================
// TELA 6: ALUGUEL DE TINAS (COOLERS)
// ==========================================================================

function renderTinas() {
    const tinasGrid = document.getElementById("rental-grid-container");
    tinasGrid.innerHTML = "";

    const searchQuery = document.getElementById("search-rental").value.toLowerCase().trim();
    const filterStatus = document.getElementById("filter-rental-status").value;

    const filteredRentals = (state.rentals || []).filter(r => {
        const matchesSearch = r.clientName.toLowerCase().includes(searchQuery) ||
                              r.tinaCode.toLowerCase().includes(searchQuery);
        const matchesStatus = filterStatus === "all" || r.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    if (filteredRentals.length === 0) {
        tinasGrid.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1; padding: 3rem;">
                <i data-lucide="help-circle" style="width:48px; height:48px; margin-bottom:1rem; opacity:0.3;"></i>
                <p>Nenhum aluguel de equipamento ou mobiliário encontrado com os filtros selecionados.</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    filteredRentals.forEach(r => {
        let statusBadge = "";
        let borderClass = "";
        
        if (r.status === "returned") {
            statusBadge = `<span class="badge badge-success">Devolvido</span>`;
            borderClass = "border: 1px solid rgba(16, 185, 129, 0.2);";
        } else {
            // Verificar atraso
            const expectedDate = new Date(r.expectedReturnDate + 'T23:59:59');
            const today = new Date();
            if (today > expectedDate) {
                statusBadge = `<span class="badge badge-danger">Atrasado</span>`;
                borderClass = "border: 1px solid rgba(239, 68, 68, 0.3); box-shadow: 0 0 10px rgba(239, 68, 68, 0.1);";
                r.status = "overdue"; // Atualiza status dinamicamente
            } else {
                statusBadge = `<span class="badge badge-warning">Ativo</span>`;
                borderClass = "border: 1px solid rgba(245, 158, 11, 0.2);";
            }
        }

        // Tipo de Item formatado com ícone
        const matchingProd = state.products.find(p => p.id === r.itemType);
        let typeIcon = `<i data-lucide="archive" style="width: 16px; height: 16px; color: var(--color-primary);"></i>`;
        let typeLabel = (matchingProd ? matchingProd.name : r.itemType) + (r.tinaColor ? ` (${r.tinaColor})` : "");
        if (r.itemType === "mesa" || r.itemType === "mesa_cadeiras") {
            typeIcon = `<i data-lucide="sofa" style="width: 16px; height: 16px; color: #f59e0b;"></i>`;
        }

        // Resumo do Gelo e Carvão (dinâmico)
        let iceSummary = "";
        if (r.iceItems) {
            const itemsArr = [];
            state.products.forEach(p => {
                const qty = r.iceItems[p.id] || 0;
                if (qty > 0) {
                    itemsArr.push(`${qty}x ${p.name}`);
                }
            });
            if (itemsArr.length > 0) {
                iceSummary = `
                    <div style="margin-top: 5px; padding: 6px 8px; background: rgba(0, 240, 255, 0.04); border-left: 2px solid var(--color-primary); border-radius: 2px;">
                        <span style="font-size: 0.7rem; display:block; color:var(--color-primary); font-weight:bold; margin-bottom: 2px;">❄️ Venda Junto:</span>
                        <strong style="color:var(--color-text-main); font-size: 0.75rem;">${itemsArr.join(", ")}</strong>
                    </div>
                `;
            }
        }

        const totalGeral = r.totalRevenue || (r.rentalFee + (r.deliveryFee || 0) + (r.pickupFee || 0));

        let locationImageSnippet = "";
        if (r.photoRentalLocation) {
            locationImageSnippet = `
                <div style="margin-bottom: 8px; position: relative; width: 100%;">
                    <span style="position: absolute; top: 4px; left: 4px; background: rgba(0,0,0,0.6); padding: 2px 6px; font-size: 0.65rem; border-radius: 3px; color: #fff; font-weight: 600;">📍 Foto do Local</span>
                    <img src="${r.photoRentalLocation}" style="width: 100%; max-height: 120px; object-fit: cover; border-radius: 4px; border: 1px solid rgba(255,255,255,0.05); cursor: pointer;" onclick="window.open('${r.photoRentalLocation}', '_blank')">
                </div>
            `;
        }

        let shippingLabel = r.shippingType === "retirada" ? "📥 Cliente Retira" : "🚚 Entrega & Busca";
        let shippingBadge = `<span style="font-size: 0.65rem; padding: 2px 6px; border-radius: 3px; background: rgba(255,255,255,0.06); font-weight: 500; color: var(--color-text-muted); display: inline-block; margin-top: 4px;">${shippingLabel}</span>`;

        let addressSnippet = r.address || 'Não informado';
        if (r.address && r.address.trim() !== "" && r.address !== "Retirada pelo Cliente na Fábrica") {
            const factoryAddr = FACTORY_INFO.address || "Vale do Paraíba, São José dos Campos - SP";
            addressSnippet = `
                ${r.address}
                <a href="https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(factoryAddr)}&destination=${encodeURIComponent(r.address)}" 
                   target="_blank" 
                   title="Abrir Rota no Google Maps" 
                   style="margin-left: 8px; padding: 2px 6px; font-size: 0.7rem; background: rgba(0, 240, 255, 0.08); border: 1px solid rgba(0, 240, 255, 0.25); border-radius: 3px; color: var(--color-primary); text-decoration: none; display: inline-flex; align-items: center; gap: 4px; vertical-align: middle; transition: all 0.2s;">
                    <i data-lucide="map-pin" style="width: 12px; height: 12px;"></i> Rota
                </a>
            `;
        }

        let logisticsSummary = "";
        if (r.logisticsDistance !== undefined && r.logisticsDistance > 0) {
            const tripDist = r.logisticsDistance * 2;
            const tripTimeHours = tripDist / (r.logisticsAvgSpeed || 60);
            const tripTotalMin = Math.round(tripTimeHours * 60);
            const tripH = Math.floor(tripTotalMin / 60);
            const tripM = tripTotalMin % 60;
            
            let vehLabel = "Passeio (1.0x)";
            if (r.logisticsVehicleType === "carretinha") vehLabel = "Carretinha (1.5x)";
            else if (r.logisticsVehicleType === "trucado") vehLabel = "Trucado (2.0x)";
            else if (r.logisticsVehicleType === "personalizado") vehLabel = `Personalizado (${r.logisticsTollMultiplier || 1.0}x)`;

            const tollLegs = r.logisticsTollReturn ? 2 : 1;
            const tollBase = r.logisticsTollBase || 0;
            const tollMult = r.logisticsTollMultiplier || 1.0;
            const tripToll = tollBase * tollMult * tollLegs;

            logisticsSummary = `
                <div style="margin-top: 8px; padding: 8px; background: rgba(0, 240, 255, 0.03); border: 1px dashed rgba(0, 240, 255, 0.15); border-radius: 4px;">
                    <span style="font-size: 0.7rem; display:block; color:var(--color-primary); font-weight:bold; margin-bottom: 4px; display: flex; align-items: center; gap: 4px;">
                        <i data-lucide="navigation" style="width: 12px; height: 12px;"></i> Dados de Logística:
                    </span>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 0.72rem; color: var(--color-text-muted);">
                        <div>Dist. Ida: <strong style="color: #fff;">${r.logisticsDistance.toFixed(1)} km</strong></div>
                        <div>Tempo Viagem: <strong style="color: #fff;">${tripH}h ${tripM}m</strong></div>
                        <div>Veículo: <strong style="color: #fff;">${vehLabel}</strong></div>
                        <div>Pedágios: <strong style="color: #fff;">R$ ${tripToll.toFixed(2)} /viagem</strong></div>
                    </div>
                </div>
            `;
        }

        tinasGrid.innerHTML += `
            <div class="freezer-card" style="display: flex; flex-direction: column; justify-content: space-between; ${borderClass}">
                <div class="freezer-card-header">
                    <div>
                        <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 2px;">
                            ${typeIcon}
                            <span style="font-size: 0.75rem; font-weight: 600; color: var(--color-text-muted);">${typeLabel}</span>
                        </div>
                        <h4 style="font-weight: 700; font-size: 1rem; color: var(--color-text-main);">${r.tinaCode}</h4>
                        <span style="font-size: 0.75rem; color: var(--color-text-muted);">ID: ${r.id}</span>
                        <div>${shippingBadge}</div>
                    </div>
                    ${statusBadge}
                </div>
                <div class="freezer-card-body" style="padding: 1rem; font-size: 0.8rem; display: flex; flex-direction: column; gap: 6px;">
                    ${locationImageSnippet}
                    <div><strong>Cliente:</strong> ${r.clientName}</div>
                    <div><strong>Endereço:</strong> ${addressSnippet}</div>
                    <div><strong>Contato:</strong> ${r.phone || 'Não informado'}</div>
                    <div style="margin-top: 5px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; background: rgba(255,255,255,0.02); padding: 8px; border-radius: 4px;">
                        <div>
                            <span style="display:block; font-size: 0.7rem; color:var(--color-text-muted);">Entrega (${r.rentalDays || 7} dias)</span>
                            <strong>${new Date(r.deliveryDate + 'T00:00:00').toLocaleDateString('pt-BR')}</strong>
                        </div>
                        <div>
                            <span style="display:block; font-size: 0.7rem; color:var(--color-text-muted);">Previsão Retirada</span>
                            <strong>${new Date(r.expectedReturnDate + 'T00:00:00').toLocaleDateString('pt-BR')}</strong>
                        </div>
                    </div>
                    ${iceSummary}
                    ${logisticsSummary}
                    <div style="display: flex; flex-direction: column; gap: 3px; margin-top: 6px; font-size: 0.75rem; color: var(--color-text-muted); border-top: 1px dashed rgba(255,255,255,0.05); padding-top: 6px;">
                        <div style="display: flex; justify-content: space-between;">
                            <span>Aluguel base:</span>
                            <span>R$ ${r.rentalFee.toFixed(2)}</span>
                        </div>
                        ${r.shippingType !== "retirada" ? `
                        <div style="display: flex; justify-content: space-between;">
                            <span>Fretes (Entrega + Busca):</span>
                            <span>R$ ${((r.deliveryFee || 0) + (r.pickupFee || 0)).toFixed(2)}</span>
                        </div>
                        ` : ''}
                        ${r.extraDayFee > 0 ? `
                        <div style="display: flex; justify-content: space-between; font-style: italic;">
                            <span>Diária Extra:</span>
                            <span>R$ ${r.extraDayFee.toFixed(2)} / dia</span>
                        </div>
                        ` : ''}
                        ${r.extraFee > 0 ? `
                        <div style="display: flex; justify-content: space-between; color: #ef4444; font-weight: 500;">
                            <span>Atraso (${r.extraDays} dias extras):</span>
                            <span>+ R$ ${r.extraFee.toFixed(2)}</span>
                        </div>
                        ` : ''}
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-top: 4px; font-weight: 600; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 4px;">
                        <span>Total Faturado:</span>
                        <span style="color: var(--color-primary); font-size: 0.9rem;">R$ ${totalGeral.toFixed(2)}</span>
                    </div>
                    ${r.returnDate ? `<div style="color: var(--color-primary); font-weight: 600; margin-top: 4px;">✓ Devolvido em: ${new Date(r.returnDate + 'T00:00:00').toLocaleDateString('pt-BR')}</div>` : ''}
                    ${r.notes ? `<div style="font-style: italic; font-size: 0.75rem; color: var(--color-text-muted); border-top: 1px solid rgba(255,255,255,0.03); padding-top: 4px; margin-top: 4px;">Obs: ${r.notes}</div>` : ''}
                </div>
                <div class="freezer-card-actions" style="padding: 0.75rem 1rem; display: flex; justify-content: flex-end; gap: 8px; background: rgba(0,0,0,0.1);">
                    ${r.status !== "returned" ? `
                        <button class="btn btn-primary" onclick="returnRental('${r.id}')" style="margin-right: auto; padding: 4px 8px; font-size: 0.75rem; display: inline-flex; align-items: center; gap: 4px;">
                            <i data-lucide="check" style="width: 14px; height: 14px;"></i> Receber
                        </button>
                    ` : ''}
                    <button class="btn btn-secondary btn-icon-only" onclick="openRentalStickerModal('${r.id}')" title="Gerar Etiqueta QR" style="${r.status === "returned" ? "margin-right: auto;" : ""}">
                        <i data-lucide="qr-code" style="width: 15px; height: 15px;"></i>
                    </button>
                    <button class="btn btn-secondary btn-icon-only" onclick="openRentalContract('${r.id}')" title="Contrato de Aluguel">
                        <i data-lucide="file-text" style="width: 15px; height: 15px;"></i>
                    </button>
                    <button class="btn btn-secondary btn-icon-only" onclick="openRentalModal('${r.id}')" title="Editar Aluguel">
                        <i data-lucide="edit-3" style="width: 15px; height: 15px;"></i>
                    </button>
                    <button class="btn btn-danger btn-icon-only" onclick="deleteRental('${r.id}')" title="Excluir Aluguel">
                        <i data-lucide="trash-2" style="width: 15px; height: 15px;"></i>
                    </button>
                </div>
            </div>
        `;
    });

    lucide.createIcons();
}

function quickCreateRentalItem() {
    if (sessionStorage.getItem("admin_authenticated") !== "true") {
        window.postAdminAuthAction = "quickCreateRentalItem";
        document.getElementById("modal-admin-auth").classList.add("active");
        return;
    }
    
    // Abrir o modal de produto pré-configurado como Equipamento
    openProductModal();
    document.getElementById("prod-type").value = "Equipamento";
    toggleProductSubfields();
}

function toggleRentalShippingFields() {
    const shippingType = document.getElementById("rental-shipping-type").value;
    const feesRow = document.getElementById("rental-fees-row");
    const deliveryFeeInput = document.getElementById("rental-delivery-fee");
    const pickupFeeInput = document.getElementById("rental-pickup-fee");
    const addressInput = document.getElementById("rental-address");
    const logisticsContainer = document.getElementById("rental-logistics-calc-container");
    
    if (shippingType === "retirada") {
        feesRow.style.display = "none";
        if (logisticsContainer) logisticsContainer.style.display = "none";
        deliveryFeeInput.value = "0.00";
        pickupFeeInput.value = "0.00";
        if (!addressInput.value.trim() || addressInput.value.trim() === "Retirada pelo Cliente na Fábrica") {
            addressInput.value = "Retirada pelo Cliente na Fábrica";
        }
    } else {
        feesRow.style.display = "grid";
        if (logisticsContainer) logisticsContainer.style.display = "block";
        if (addressInput.value === "Retirada pelo Cliente na Fábrica") {
            addressInput.value = "";
        }
    }
}

function updateRentalDates(trigger) {
    const deliveryInput = document.getElementById("rental-delivery-date");
    const daysInput = document.getElementById("rental-days");
    const returnInput = document.getElementById("rental-expected-return");
    
    if (!deliveryInput.value) return;
    
    const deliveryDate = new Date(deliveryInput.value + 'T00:00:00');
    
    if (trigger === 'delivery-date' || trigger === 'days') {
        const days = parseInt(daysInput.value) || 1;
        if (days < 1) {
            daysInput.value = 1;
        }
        const returnDate = new Date(deliveryDate);
        returnDate.setDate(deliveryDate.getDate() + parseInt(daysInput.value));
        returnInput.value = returnDate.toISOString().split('T')[0];
    } else if (trigger === 'return-date') {
        if (!returnInput.value) return;
        const returnDate = new Date(returnInput.value + 'T00:00:00');
        const diffTime = returnDate - deliveryDate;
        let days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (days < 1) {
            days = 1;
            daysInput.value = 1;
            const newReturnDate = new Date(deliveryDate);
            newReturnDate.setDate(deliveryDate.getDate() + 1);
            returnInput.value = newReturnDate.toISOString().split('T')[0];
        } else {
            daysInput.value = days;
        }
    }
}

function openRentalModal(rentalId = null) {
    const modal = document.getElementById("modal-rental");
    const form = document.getElementById("rental-form");
    const title = document.getElementById("rental-modal-title");
    const clientSelect = document.getElementById("rental-client-select");

    form.reset();
    document.getElementById("form-rental-id").value = "";
    clientSelect.innerHTML = '<option value="">-- Cliente Avulso (Preencher Manualmente) --</option>';
    
    // Popular Clientes
    state.clients.forEach(c => {
        clientSelect.innerHTML += `<option value="${c.id}">${c.name}</option>`;
    });

    // Datas padrão
    const today = new Date().toISOString().split('T')[0];
    document.getElementById("rental-delivery-date").value = today;
    
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    document.getElementById("rental-expected-return").value = nextWeek.toISOString().split('T')[0];

    // Resetar quantidades de produtos e informações gerais
    const activeEquips = state.products.filter(p => p.active && p.type === "Equipamento");
    const defaultEquipId = activeEquips.length > 0 ? activeEquips[0].id : "";
    const defaultEquipPrice = activeEquips.length > 0 ? activeEquips[0].defaultPrice : 0;

    document.getElementById("form-rental-id").value = "";
    clientSelect.value = "";
    document.getElementById("rental-client-name").value = "";
    document.getElementById("rental-address").value = "";
    document.getElementById("rental-phone").value = "";
    
    renderRentalModalProducts(null);

    if (defaultEquipId) {
        document.getElementById("rental-item-type").value = defaultEquipId;
    }
    document.getElementById("rental-tina-code").value = "";
    document.getElementById("rental-tina-color").value = "Azul";
    document.getElementById("rental-fee").value = defaultEquipPrice.toFixed(2);
    document.getElementById("rental-delivery-fee").value = "0.00";
    document.getElementById("rental-pickup-fee").value = "0.00";
    document.getElementById("rental-extra-day-fee").value = "0.00";
    document.getElementById("rental-days").value = "7";
    document.getElementById("rental-shipping-type").value = "entrega";
    document.getElementById("rental-notes").value = "";
    document.getElementById("photo-rental-location-data").value = "";
    document.getElementById("preview-rental-location").innerHTML = "<p style='font-size: 0.75rem; color: var(--color-text-muted);'>Nenhuma foto carregada</p>";
    
    // Resetar/Inicializar calculadora com configurações salvas
    const logSettings = state.logisticsSettings || {
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
    document.getElementById("logistics-distance").value = "0.0";
    document.getElementById("logistics-avg-speed").value = logSettings.avgSpeed;
    document.getElementById("logistics-vehicle-type").value = logSettings.vehicleType;
    document.getElementById("logistics-toll-base").value = logSettings.tollBase.toFixed(2);
    document.getElementById("logistics-toll-multiplier").value = logSettings.tollMultiplier.toFixed(1);
    document.getElementById("logistics-fuel-price").value = logSettings.fuelPrice.toFixed(2);
    document.getElementById("logistics-fuel-consumption").value = logSettings.fuelConsumption.toFixed(1);
    document.getElementById("logistics-markup-percent").value = logSettings.markupPercent;
    document.getElementById("logistics-markup-fixed").value = logSettings.markupFixed.toFixed(2);
    document.getElementById("logistics-toll-return").checked = logSettings.tollReturn;

    const calcContent = document.getElementById("rental-logistics-calc-content");
    if (calcContent) calcContent.style.display = "none";
    const toggleIcon = document.getElementById("logistics-toggle-icon");
    if (toggleIcon) toggleIcon.innerText = "▼";
    
    updateLogisticsTollMultiplier();
    calculateRentalLogistics();
    toggleRentalShippingFields();

    if (rentalId) {
        title.innerText = "Editar Aluguel";
        const r = state.rentals.find(item => item.id === rentalId);
        if (r) {
            document.getElementById("form-rental-id").value = r.id;
            clientSelect.value = r.clientId || "";
            document.getElementById("rental-client-name").value = r.clientName;
            document.getElementById("rental-address").value = r.address || "";
            document.getElementById("rental-phone").value = r.phone || "";
            renderRentalModalProducts(r);
            document.getElementById("rental-item-type").value = r.itemType;
            document.getElementById("rental-tina-code").value = r.tinaCode;
            document.getElementById("rental-tina-color").value = r.tinaColor || "Azul";
            document.getElementById("rental-fee").value = r.rentalFee;
            document.getElementById("rental-delivery-fee").value = r.deliveryFee;
            document.getElementById("rental-pickup-fee").value = r.pickupFee || 0;
            document.getElementById("rental-extra-day-fee").value = r.extraDayFee || 0;
            document.getElementById("rental-days").value = r.rentalDays || 7;
            document.getElementById("rental-shipping-type").value = r.shippingType || "entrega";

            // Se o aluguel tem dados da calculadora persistidos, preencher
            if (r.logisticsDistance !== undefined) {
                document.getElementById("logistics-distance").value = r.logisticsDistance;
                document.getElementById("logistics-avg-speed").value = r.logisticsAvgSpeed || logSettings.avgSpeed;
                document.getElementById("logistics-vehicle-type").value = r.logisticsVehicleType || logSettings.vehicleType;
                document.getElementById("logistics-toll-base").value = (r.logisticsTollBase !== undefined ? r.logisticsTollBase : logSettings.tollBase).toFixed(2);
                document.getElementById("logistics-toll-multiplier").value = (r.logisticsTollMultiplier !== undefined ? r.logisticsTollMultiplier : logSettings.tollMultiplier).toFixed(1);
                document.getElementById("logistics-fuel-price").value = (r.logisticsFuelPrice !== undefined ? r.logisticsFuelPrice : logSettings.fuelPrice).toFixed(2);
                document.getElementById("logistics-fuel-consumption").value = (r.logisticsFuelConsumption !== undefined ? r.logisticsFuelConsumption : logSettings.fuelConsumption).toFixed(1);
                document.getElementById("logistics-markup-percent").value = (r.logisticsMarkupPercent !== undefined ? r.logisticsMarkupPercent : logSettings.markupPercent);
                document.getElementById("logistics-markup-fixed").value = (r.logisticsMarkupFixed !== undefined ? r.logisticsMarkupFixed : logSettings.markupFixed).toFixed(2);
                document.getElementById("logistics-toll-return").checked = (r.logisticsTollReturn !== undefined ? r.logisticsTollReturn : logSettings.tollReturn);
                updateLogisticsTollMultiplier();
                calculateRentalLogistics();
            }
            document.getElementById("rental-delivery-date").value = r.deliveryDate;
            document.getElementById("rental-expected-return").value = r.expectedReturnDate;
            document.getElementById("rental-notes").value = r.notes || "";
            if (r.photoRentalLocation) {
                document.getElementById("photo-rental-location-data").value = r.photoRentalLocation;
                document.getElementById("preview-rental-location").innerHTML = `<img src="${r.photoRentalLocation}" style="max-height: 80px; border-radius: 4px;">`;
            }
            toggleRentalShippingFields();
        }
    } else {
        title.innerText = "Novo Aluguel";
        updateRentalFee();
    }

    modal.classList.add("active");
}

function updateRentalFee() {
    const itemType = document.getElementById("rental-item-type").value;
    const clientId = document.getElementById("rental-client-select").value;
    
    let price = 0;
    const equip = state.products.find(p => p.id === itemType);
    if (equip) {
        price = equip.defaultPrice || 0;
        if (clientId) {
            const client = state.clients.find(c => c.id === clientId);
            if (client && client.customPrices && client.customPrices[itemType] > 0) {
                price = client.customPrices[itemType];
            }
        }
    }
    
    document.getElementById("rental-fee").value = price.toFixed(2);
}

function populateRentalClientDetails() {
    const clientId = document.getElementById("rental-client-select").value;
    if (clientId) {
        const client = state.clients.find(c => c.id === clientId);
        if (client) {
            document.getElementById("rental-client-name").value = client.name;
            document.getElementById("rental-address").value = client.address || "";
            document.getElementById("rental-phone").value = client.phone || "";
        }
    } else {
        document.getElementById("rental-client-name").value = "";
        document.getElementById("rental-address").value = "";
        document.getElementById("rental-phone").value = "";
    }
    updateRentalFee();
    fetchRentalRouteDistance(true);
}

function returnRental(rentalId) {
    const rental = state.rentals.find(r => r.id === rentalId);
    if (!rental) return;
    
    const returnDateStr = new Date().toISOString().split('T')[0];
    const expectedDate = new Date(rental.expectedReturnDate + 'T00:00:00');
    const returnDate = new Date(returnDateStr + 'T00:00:00');
    
    let extraChargeStr = "";
    let extraDays = 0;
    let extraFee = 0;
    
    if (returnDate > expectedDate && rental.extraDayFee > 0) {
        const diffTime = returnDate - expectedDate;
        extraDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        extraFee = extraDays * rental.extraDayFee;
        extraChargeStr = `\n\n⚠️ O aluguel está atrasado em ${extraDays} dia(s).\nTaxa da diária extra: R$ ${rental.extraDayFee.toFixed(2)} por dia.\nValor adicional calculado: R$ ${extraFee.toFixed(2)}.\n\nDeseja adicionar esse valor de diárias extras ao faturamento deste aluguel?`;
    }
    
    if (confirm(`Confirmar devolução do item ${rental.tinaCode}?${extraChargeStr}`)) {
        rental.status = "returned";
        rental.returnDate = returnDateStr;
        if (extraFee > 0) {
            rental.extraDays = extraDays;
            rental.extraFee = extraFee;
            rental.totalRevenue = (rental.totalRevenue || 0) + extraFee;
        }
        saveState();
        renderApp();
    }
}

function deleteRental(rentalId) {
    if (confirm("Deseja realmente excluir este registro de aluguel?")) {
        state.rentals = state.rentals.filter(r => r.id !== rentalId);
        saveState();
        renderApp();
    }
}


// ==========================================================================
// TELA 7: EMISSÃO DE RECIBOS E ORÇAMENTOS
// ==========================================================================

function renderDocumentos() {
    const listContainer = document.getElementById("document-grid-container");
    listContainer.innerHTML = "";

    const searchQuery = document.getElementById("search-document").value.toLowerCase().trim();
    const filterType = document.getElementById("filter-document-type").value;

    const filteredDocs = (state.documents || []).filter(d => {
        const matchesSearch = d.clientName.toLowerCase().includes(searchQuery);
        const matchesType = filterType === "all" || d.type === filterType;
        return matchesSearch && matchesType;
    });

    if (filteredDocs.length === 0) {
        listContainer.innerHTML = `
            <div class="empty-state" style="padding: 3rem;">
                <i data-lucide="file-text" style="width:48px; height:48px; margin-bottom:1rem; opacity:0.3;"></i>
                <p>Nenhum recibo ou orçamento comercial gerado.</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    filteredDocs.forEach(d => {
        const dateFormatted = new Date(d.date + 'T00:00:00').toLocaleDateString('pt-BR');
        let typeBadge = "";
        if (d.type === "orcamento") {
            typeBadge = `<span class="badge badge-warning" style="background: rgba(245, 158, 11, 0.1); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.2);">Orçamento</span>`;
        } else if (d.type === "nota") {
            typeBadge = `<span class="badge badge-info" style="background: rgba(59, 130, 246, 0.1); color: #3b82f6; border: 1px solid rgba(59, 130, 246, 0.2);">Nota</span>`;
        } else {
            typeBadge = `<span class="badge badge-success" style="background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.2);">Recibo</span>`;
        }

        let gpsButton = '';
        if (d.gps && d.gps.lat && d.gps.lng) {
            gpsButton = `
                <a href="https://www.google.com/maps/search/?api=1&query=${d.gps.lat},${d.gps.lng}" target="_blank" class="btn btn-secondary btn-icon-only" style="padding: 6px; display: inline-flex; align-items: center; justify-content: center; text-decoration: none;" title="Ver Localização no GPS">
                    <i data-lucide="map-pin" style="width: 14px; height: 14px; color: var(--color-primary);"></i>
                </a>
            `;
        }

        listContainer.innerHTML += `
            <div class="pedido-item" style="margin-bottom: 0.75rem;">
                <div class="pedido-detalhes">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                        <h4 style="margin: 0; font-weight: 700;">${d.clientName}</h4>
                        ${typeBadge}
                    </div>
                    <p style="margin: 2px 0;">Emissão: ${dateFormatted} | Contato: ${d.phone || 'Não informado'}</p>
                    <p style="margin: 2px 0; font-weight: 600; color: var(--color-primary);">Valor Total: R$ ${d.total.toFixed(2)}</p>
                </div>
                <div class="pedido-acoes">
                    <button class="btn btn-secondary" onclick="openDocumentPrint('${d.id}')" style="display: inline-flex; align-items: center; gap: 4px; padding: 6px 12px; font-size: 0.8rem;">
                        <i data-lucide="eye" style="width: 14px; height: 14px;"></i> Visualizar / Imprimir
                    </button>
                    ${gpsButton}
                    <button class="btn btn-secondary btn-icon-only" onclick="openDocModal('${d.id}')" title="Editar Documento">
                        <i data-lucide="edit-3" style="width: 15px; height: 15px;"></i>
                    </button>
                    <button class="btn btn-danger btn-icon-only" onclick="deleteDocument('${d.id}')" title="Excluir Documento">
                        <i data-lucide="trash-2" style="width: 15px; height: 15px;"></i>
                    </button>
                </div>
            </div>
        `;
    });

    lucide.createIcons();
}

function openDocModal(docId = null) {
    const modal = document.getElementById("modal-document");
    const form = document.getElementById("document-form");
    const title = document.getElementById("document-modal-title");
    const clientSelect = document.getElementById("doc-client-select");

    form.reset();
    document.getElementById("form-document-id").value = "";
    clientSelect.innerHTML = '<option value="">-- Cliente Avulso (Preencher Manualmente) --</option>';

    // Popular Clientes
    state.clients.forEach(c => {
        clientSelect.innerHTML += `<option value="${c.id}">${c.name}</option>`;
    });

    // Data Padrão
    document.getElementById("doc-date").value = new Date().toISOString().split('T')[0];

    // Resetar/Inicializar calculadora com configurações salvas
    const logSettings = state.logisticsSettings || {
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

    document.getElementById("doc-logistics-op-type").value = "simples";
    document.getElementById("doc-logistics-distance").value = "0.0";
    document.getElementById("doc-logistics-avg-speed").value = logSettings.avgSpeed;
    document.getElementById("doc-logistics-vehicle-type").value = logSettings.vehicleType;
    document.getElementById("doc-logistics-toll-base").value = logSettings.tollBase.toFixed(2);
    document.getElementById("doc-logistics-toll-multiplier").value = logSettings.tollMultiplier.toFixed(1);
    document.getElementById("doc-logistics-fuel-price").value = logSettings.fuelPrice.toFixed(2);
    document.getElementById("doc-logistics-fuel-consumption").value = logSettings.fuelConsumption.toFixed(1);
    document.getElementById("doc-logistics-markup-percent").value = logSettings.markupPercent;
    document.getElementById("doc-logistics-markup-fixed").value = logSettings.markupFixed.toFixed(2);
    document.getElementById("doc-logistics-toll-return").checked = logSettings.tollReturn;

    const calcContent = document.getElementById("doc-logistics-calc-content");
    if (calcContent) calcContent.style.display = "none";
    const toggleIcon = document.getElementById("doc-logistics-toggle-icon");
    if (toggleIcon) toggleIcon.innerText = "▼";

    let d = null;
    if (docId) {
        title.innerText = "Editar Documento Comercial";
        d = state.documents.find(item => item.id === docId);
        if (d) {
            document.getElementById("form-document-id").value = d.id;
            document.getElementById("doc-type").value = d.type;
            document.getElementById("doc-date").value = d.date;
            clientSelect.value = d.clientId || "";
            document.getElementById("doc-client-name").value = d.clientName;
            document.getElementById("doc-address").value = d.address || "";
            document.getElementById("doc-phone").value = d.phone || "";
            document.getElementById("doc-delivery-fee").value = d.deliveryFee;
            document.getElementById("doc-payment-method").value = d.paymentMethod || "Dinheiro";

            // Se o documento tem dados da calculadora persistidos, preencher
            if (d.docLogisticsDistance !== undefined) {
                document.getElementById("doc-logistics-op-type").value = d.docLogisticsOpType || "simples";
                document.getElementById("doc-logistics-distance").value = d.docLogisticsDistance;
                document.getElementById("doc-logistics-avg-speed").value = d.docLogisticsAvgSpeed || logSettings.avgSpeed;
                document.getElementById("doc-logistics-vehicle-type").value = d.docLogisticsVehicleType || logSettings.vehicleType;
                document.getElementById("doc-logistics-toll-base").value = (d.docLogisticsTollBase !== undefined ? d.docLogisticsTollBase : logSettings.tollBase).toFixed(2);
                document.getElementById("doc-logistics-toll-multiplier").value = (d.docLogisticsTollMultiplier !== undefined ? d.docLogisticsTollMultiplier : logSettings.tollMultiplier).toFixed(1);
                document.getElementById("doc-logistics-fuel-price").value = (d.docLogisticsFuelPrice !== undefined ? d.docLogisticsFuelPrice : logSettings.fuelPrice).toFixed(2);
                document.getElementById("doc-logistics-fuel-consumption").value = (d.docLogisticsFuelConsumption !== undefined ? d.docLogisticsFuelConsumption : logSettings.fuelConsumption).toFixed(1);
                document.getElementById("doc-logistics-markup-percent").value = (d.docLogisticsMarkupPercent !== undefined ? d.docLogisticsMarkupPercent : logSettings.markupPercent);
                document.getElementById("doc-logistics-markup-fixed").value = (d.docLogisticsMarkupFixed !== undefined ? d.docLogisticsMarkupFixed : logSettings.markupFixed).toFixed(2);
                document.getElementById("doc-logistics-toll-return").checked = (d.docLogisticsTollReturn !== undefined ? d.docLogisticsTollReturn : logSettings.tollReturn);
            }
        }
    } else {
        title.innerText = "Novo Documento Comercial";
    }

    updateDocLogisticsTollMultiplier();
    calculateDocLogistics();
    renderDocModalProducts(d);

    modal.classList.add("active");
}

function populateDocClientDetails() {
    const clientId = document.getElementById("doc-client-select").value;
    const client = clientId ? state.clients.find(c => c.id === clientId) : null;
    
    if (client) {
        document.getElementById("doc-client-name").value = client.name;
        document.getElementById("doc-address").value = client.address || "";
        document.getElementById("doc-phone").value = client.phone || "";
    } else {
        document.getElementById("doc-client-name").value = "";
        document.getElementById("doc-address").value = "";
        document.getElementById("doc-phone").value = "";
    }
    
    // Atualizar preços de todos os produtos do catálogo
    state.products.forEach(p => {
        const priceInput = document.getElementById(`doc-price-${p.id}`);
        if (priceInput) {
            let price = p.defaultPrice || 0;
            if (client && client.customPrices && client.customPrices[p.id] > 0) {
                price = client.customPrices[p.id];
            }
            priceInput.value = price.toFixed(2);
        }
        
        if (p.type === 'Gelo Saborizado') {
            const priceUnitInput = document.getElementById(`doc-price-${p.id}_unit`);
            if (priceUnitInput) {
                let priceUnit = p.unitPrice || 0;
                if (client && client.customPrices && client.customPrices[p.id + "_unit"] > 0) {
                    priceUnit = client.customPrices[p.id + "_unit"];
                }
                priceUnitInput.value = priceUnit.toFixed(2);
            }
        }
    });
    fetchDocRouteDistance(true);
}

function deleteDocument(docId) {
    if (confirm("Deseja realmente excluir este documento comercial?")) {
        state.documents = state.documents.filter(d => d.id !== docId);
        saveState();
        renderApp();
    }
}

function openDocumentPrint(docId) {
    let d;
    if (docId === "TEST-0000") {
        d = {
            id: "TEST-0000",
            type: "recibo",
            date: new Date().toISOString().split('T')[0],
            clientName: "CLIENTE TESTE DA SILVA",
            address: "AV. PAULISTA, 1000 - SÃO PAULO/SP",
            phone: "(11) 99999-9999",
            paymentMethod: "Dinheiro / Pix",
            items: [
                { name: "Pacote Gelo 5kg (Cubo)", qty: 2, price: 10.00 },
                { name: "Gelo Triturado 20kg", qty: 1, price: 30.00 }
            ],
            deliveryFee: 5.00,
            total: 55.00,
            signatureBase64: window.testDocSignatureBase64 || null
        };
    } else {
        d = state.documents.find(item => item.id === docId);
    }
    if (!d) return;

    currentPrintDocId = docId;
    const formattedDate = new Date(d.date + 'T00:00:00').toLocaleDateString('pt-BR');
    const titleDoc = d.type === "orcamento" ? "ORÇAMENTO COMERCIAL" : (d.type === "nota" ? "NOTA DE ENTREGA" : "RECIBO DE ENTREGA");

    // Montar tabela de itens
    let itemsRows = "";
    d.items.forEach(it => {
        const totalItem = it.qty * it.price;
        itemsRows += `
            <tr>
                <td style="padding: 6px; border-bottom: 1px dashed #ddd;">${it.name}</td>
                <td style="padding: 6px; border-bottom: 1px dashed #ddd; text-align: center;">${it.qty}</td>
                <td style="padding: 6px; border-bottom: 1px dashed #ddd; text-align: right;">R$ ${it.price.toFixed(2)}</td>
                <td style="padding: 6px; border-bottom: 1px dashed #ddd; text-align: right;">R$ ${totalItem.toFixed(2)}</td>
            </tr>
        `;
    });

    // Configurações de impressão do estado
    const printFormat = (state.printSettings && state.printSettings.format) || "a4";
    const showLogo = state.printSettings ? state.printSettings.showLogo : true;
    const showSignatures = state.printSettings ? state.printSettings.showSignatures : true;

    // Determinar classes CSS adicionais com base no formato
    let formatClass = "";
    if (printFormat === "thermal80") {
        formatClass = " format-thermal80";
    } else if (printFormat === "thermal58") {
        formatClass = " format-thermal58";
    }

    const logoHTML = showLogo ? `
        <div style="text-align: center; margin-bottom: 15px;">
            <img src="${state.factorySettings && state.factorySettings.logo ? state.factorySettings.logo : 'logo_vertical.png'}" alt="Gelo do Vale" style="max-height: 90px; object-fit: contain;">
        </div>
    ` : "";

    let clientSignatureHTML = "";
    if (d.signatureBase64) {
        clientSignatureHTML = `<img src="${d.signatureBase64}" style="max-height: 50px; max-width: 100%; display: block; margin: 0 auto -10px auto; pointer-events: none;">`;
    }

    const signaturesHTML = showSignatures ? `
        <div style="margin-top: 40px; font-size: 0.75rem; text-align: center; color: #555;">
            <p>Obrigado pela preferência e parceria de sempre!</p>
            <div style="margin-top: 30px; display: flex; justify-content: space-around;">
                <div style="width: 40%; border-top: 1px solid #aaa; padding-top: 5px;">
                    Assinatura Responsável
                </div>
                <div style="width: 40%; border-top: 1px solid #aaa; padding-top: 5px; position: relative;">
                    ${clientSignatureHTML}
                    Assinatura Cliente
                </div>
            </div>
        </div>
    ` : `
        <div style="margin-top: 20px; font-size: 0.75rem; text-align: center; color: #555;">
            <p>Obrigado pela preferência e parceria de sempre!</p>
        </div>
    `;

    const docHTML = `
        <div class="commercial-document${formatClass}">
            ${logoHTML}
            <h2 style="font-size: 1.25rem; font-weight: bold; margin: 0 0 5px 0; text-align: center;">${titleDoc}</h2>
            <div style="font-size: 0.75rem; text-align: center; color: #555; line-height: 1.4; border-bottom: 1px solid #000; padding-bottom: 8px; margin-bottom: 15px;">
                <strong>${FACTORY_INFO.name}</strong><br>
                CNPJ: ${FACTORY_INFO.cnpj} | Telefone: ${FACTORY_INFO.phone}<br>
                Endereço: ${FACTORY_INFO.address}<br>
                Email: ${FACTORY_INFO.email}
            </div>

            <div style="display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 15px; flex-wrap: wrap; gap: 10px;">
                <div>
                    <strong>CLIENTE:</strong> ${d.clientName.toUpperCase()}<br>
                    <strong>ENDEREÇO:</strong> ${d.address || 'Não informado'}<br>
                    <strong>CONTATO:</strong> ${d.phone || 'Não informado'}
                </div>
                <div style="text-align: right;">
                    <strong>Nº DOCUMENTO:</strong> ${d.id}<br>
                    <strong>DATA DE EMISSÃO:</strong> ${formattedDate}<br>
                    <strong>FORMA DE PAGAMENTO:</strong> ${d.paymentMethod || 'Dinheiro'}
                </div>
            </div>

            <table style="width: 100%; border-collapse: collapse; font-size: 0.8rem; margin-top: 10px;">
                <thead>
                    <tr style="border-bottom: 2px solid #000; font-weight: bold;">
                        <th style="padding: 6px; text-align: left;">Descrição do Item</th>
                        <th style="padding: 6px; text-align: center;">Qtd</th>
                        <th style="padding: 6px; text-align: right;">Preço Unit.</th>
                        <th style="padding: 6px; text-align: right;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsRows}
                    ${d.deliveryFee > 0 ? `
                        <tr>
                            <td colspan="3" style="padding: 6px; border-bottom: 1px dashed #ddd;">Taxa de Entrega / Frete</td>
                            <td style="padding: 6px; border-bottom: 1px dashed #ddd; text-align: right;">R$ ${d.deliveryFee.toFixed(2)}</td>
                        </tr>
                    ` : ''}
                    <tr class="total-row">
                        <td colspan="3" style="padding: 8px 6px; text-align: left; font-weight: bold;">VALOR TOTAL DO DOCUMENTO</td>
                        <td style="padding: 8px 6px; text-align: right; font-weight: bold; font-size: 1.1rem; color: #000;">R$ ${d.total.toFixed(2)}</td>
                    </tr>
                </tbody>
            </table>

            ${signaturesHTML}
        </div>
    `;

    document.getElementById("printable-document-content").innerHTML = docHTML;
    document.getElementById("modal-document-print").classList.add("active");
}

function printTestReceipt() {
    openDocumentPrint("TEST-0000");
}
// --- SISTEMA DINÂMICO DE CATÁLOGO E PREÇOS ---
function renderProductsCatalog() {
    const tbody = document.getElementById("catalog-products-tbody");
    if (!tbody) return;

    tbody.innerHTML = "";
    
    if (!state.products || state.products.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="padding: 1.5rem; text-align: center; color: var(--color-text-muted);">
                    Nenhum produto cadastrado no catálogo.
                </td>
            </tr>
        `;
        return;
    }

    state.products.forEach(p => {
        const badge = p.active 
            ? `<span class="status-badge completed" style="background: rgba(0, 240, 255, 0.1); color: var(--color-primary); border: 1px solid rgba(0, 240, 255, 0.15);">Ativo</span>`
            : `<span class="status-badge pending" style="background: rgba(255, 255, 255, 0.05); color: var(--color-text-muted); border: 1px solid rgba(255, 255, 255, 0.08);">Inativo</span>`;
        
        tbody.innerHTML += `
            <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.03);">
                <td style="padding: 10px; font-weight: 600; color: var(--color-text-main);">${p.name}</td>
                <td style="padding: 10px; color: var(--color-text-muted);">${p.type}</td>
                <td style="padding: 10px; color: var(--color-text-muted);">${p.subtype || '-'}</td>
                <td style="padding: 10px; text-align: center; color: var(--color-text-main);">${p.weight || '0'} kg</td>
                <td style="padding: 10px; text-align: right; font-weight: 700; color: var(--color-primary);">R$ ${(p.defaultPrice || 0).toFixed(2)}</td>
                <td style="padding: 10px; text-align: center;">${badge}</td>
                <td style="padding: 10px; text-align: center;">
                    <div style="display: inline-flex; gap: 6px;">
                        <button class="btn btn-secondary btn-icon-only" onclick="openProductModal('${p.id}')" title="Editar Item" style="padding: 4px 6px; display: inline-flex; align-items: center; justify-content: center;">
                            <i data-lucide="edit-3" style="width: 13px; height: 13px;"></i>
                        </button>
                        <button class="btn btn-danger btn-icon-only" onclick="deleteProduct('${p.id}')" title="Desativar Item" style="padding: 4px 6px; display: inline-flex; align-items: center; justify-content: center;">
                            <i data-lucide="trash-2" style="width: 13px; height: 13px;"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });

    lucide.createIcons();
}

function toggleFlavoredPackageUnits() {
    const packageType = document.getElementById("prod-package-type").value;
    const unitsGroup = document.getElementById("group-prod-units-per-pack");
    const unitsInput = document.getElementById("prod-units-per-pack");
    if (packageType === "varejo") {
        unitsGroup.style.display = "none";
        unitsInput.value = 1;
        unitsInput.removeAttribute("required");
    } else {
        unitsGroup.style.display = "block";
        unitsInput.setAttribute("required", "required");
    }
}

function toggleProductSubfields() {
    const type = document.getElementById("prod-type").value;
    const weightGroup = document.getElementById("group-prod-weight");
    const weightInput = document.getElementById("prod-weight");
    const flavoredGroup = document.getElementById("group-flavored-ice-fields");
    const flavorInput = document.getElementById("prod-flavor");
    const weightGInput = document.getElementById("prod-unit-weight-g");
    const unitsInput = document.getElementById("prod-units-per-pack");
    
    if (type === "Gelo") {
        weightGroup.style.display = "block";
        weightInput.setAttribute("required", "required");
        
        flavoredGroup.style.display = "none";
        flavorInput.removeAttribute("required");
        weightGInput.removeAttribute("required");
        unitsInput.removeAttribute("required");
    } else if (type === "Gelo Saborizado") {
        weightGroup.style.display = "none";
        weightInput.removeAttribute("required");
        weightInput.value = "";
        
        flavoredGroup.style.display = "block";
        flavorInput.setAttribute("required", "required");
        weightGInput.setAttribute("required", "required");
        toggleFlavoredPackageUnits();
    } else {
        weightGroup.style.display = "none";
        weightInput.removeAttribute("required");
        weightInput.value = "";
        
        flavoredGroup.style.display = "none";
        flavorInput.removeAttribute("required");
        weightGInput.removeAttribute("required");
        unitsInput.removeAttribute("required");
    }
}

function openProductModal(productId = null) {
    const modal = document.getElementById("modal-product-mgmt");
    const title = document.getElementById("product-modal-title");
    const form = document.getElementById("product-mgmt-form");
    
    form.reset();
    document.getElementById("form-product-id").value = "";
    document.getElementById("prod-active").checked = true;
    
    // Defaults para Gelo Saborizado
    document.getElementById("prod-flavor").value = "";
    document.getElementById("prod-package-type").value = "pacote";
    document.getElementById("prod-units-per-pack").value = "12";
    document.getElementById("prod-unit-weight-g").value = "200";
    
    if (productId) {
        title.innerText = "Editar Produto / Item";
        const p = state.products.find(item => item.id === productId);
        if (p) {
            document.getElementById("form-product-id").value = p.id;
            document.getElementById("prod-name").value = p.name;
            document.getElementById("prod-type").value = p.type;
            document.getElementById("prod-subtype-text").value = p.subtype || "";
            document.getElementById("prod-weight").value = p.weight !== undefined ? p.weight : "";
            document.getElementById("prod-price").value = p.defaultPrice || 0;
            document.getElementById("prod-active").checked = p.active !== false;
            
            // Novos campos de gelo saborizado
            document.getElementById("prod-flavor").value = p.flavor || "";
            document.getElementById("prod-package-type").value = p.packageType || "pacote";
            document.getElementById("prod-units-per-pack").value = p.unitsPerPack !== undefined ? p.unitsPerPack : "12";
            document.getElementById("prod-unit-weight-g").value = p.unitWeightGrams !== undefined ? p.unitWeightGrams : "200";
        }
    } else {
        title.innerText = "Novo Produto / Item";
    }
    
    toggleProductSubfields();
    modal.classList.add("active");
}

function deleteProduct(productId) {
    const p = state.products.find(item => item.id === productId);
    if (!p) return;
    
    if (confirm(`Deseja realmente desativar o item "${p.name}"? Ele continuará no histórico, mas não estará disponível para novas operações.`)) {
        p.active = false;
        saveState();
        renderProductsCatalog();
        renderPrecos();
        renderApp();
    }
}

function syncLegacyPrices() {
    if (!state.prices) state.prices = {};
    state.products.forEach(p => {
        state.prices[p.id] = p.defaultPrice || 0;
    });
}

function renderClientModalProducts(client = null) {
    const container = document.getElementById("client-products-container");
    if (!container) return;

    // Obter produtos do tipo Gelo e Gelo Saborizado ativos
    const geloProducts = state.products.filter(p => p.active && (p.type === 'Gelo' || p.type === 'Gelo Saborizado'));
    
    if (geloProducts.length === 0) {
        container.innerHTML = `<p style="font-size: 0.8rem; color: var(--color-text-muted); text-align: center; padding: 0.5rem 0;">Nenhum produto de Gelo ou Gelo Saborizado cadastrado no catálogo.</p>`;
        return;
    }

    const capacities = (client && client.capacities) || {};
    const stock = (client && client.stock) || {};

    let html = `
        <div class="form-group" style="margin-bottom: 0.75rem;">
            <label style="margin-bottom: 0.25rem;">Capacidade Máxima de Armazenamento (Pacotes)</label>
            <div class="form-row-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 0.5rem;">
    `;
    geloProducts.forEach(p => {
        const val = capacities[p.id] !== undefined ? capacities[p.id] : 50;
        html += `
            <div>
                <span style="font-size: 0.7rem; color: var(--color-text-muted); display: block; margin-bottom: 2px; white-space: normal; line-height: 1.2; word-break: break-word;" title="${p.name}">${p.name}</span>
                <input type="number" id="cap-${p.id}" class="form-control client-cap-input" data-prod-id="${p.id}" min="0" value="${val}" required style="padding: 6px 8px; font-size: 0.85rem;">
            </div>
        `;
    });
    html += `
            </div>
        </div>
        <div class="form-group" style="margin-top: 0.5rem; margin-bottom: 0;">
            <label style="margin-bottom: 0.25rem;">Estoque Inicial Atual (Pacotes)</label>
            <div class="form-row-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 0.5rem;">
    `;
    geloProducts.forEach(p => {
        const val = stock[p.id] !== undefined ? stock[p.id] : 0;
        html += `
            <div>
                <input type="number" id="stock-${p.id}" class="form-control client-stock-input" data-prod-id="${p.id}" min="0" value="${val}" required style="padding: 6px 8px; font-size: 0.85rem;">
            </div>
        `;
    });
    html += `
            </div>
        </div>
    `;

    container.innerHTML = html;
}

function renderOrderModalProducts() {
    const container = document.getElementById("order-products-container");
    if (!container) return;

    const activeProds = state.products.filter(p => p.active && (p.type === 'Gelo' || p.type === 'Carvão' || p.type === 'Gelo Saborizado'));

    if (activeProds.length === 0) {
        container.innerHTML = `<p style="font-size: 0.8rem; color: var(--color-text-muted); text-align: center; grid-column: 1 / -1; padding: 0.5rem 0;">Nenhum produto de Gelo, Carvão ou Gelo Saborizado cadastrado no catálogo.</p>`;
        return;
    }

    let html = "";
    activeProds.forEach(p => {
        if (p.type === 'Gelo Saborizado') {
            html += `
                <div style="grid-column: span 2; display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; border: 1px solid rgba(255,255,255,0.08); padding: 8px; border-radius: 6px; background: rgba(0,240,255,0.03);">
                    <div style="grid-column: span 2; font-size: 0.75rem; font-weight: bold; color: var(--color-primary); white-space: normal; line-height: 1.2; word-break: break-word;" title="${p.name}">
                        ${p.name}
                    </div>
                    <div class="form-group" style="margin-bottom: 0;">
                        <label for="req-${p.id}" style="font-size: 0.65rem; color: var(--color-text-muted); display: block; margin-bottom: 2px;">Fardos (12 un)</label>
                        <input type="number" id="req-${p.id}" class="form-control order-req-input" data-prod-id="${p.id}" min="0" value="0" required style="padding: 4px 6px; font-size: 0.8rem;">
                    </div>
                    <div class="form-group" style="margin-bottom: 0;">
                        <label for="req-${p.id}_unit" style="font-size: 0.65rem; color: var(--color-text-muted); display: block; margin-bottom: 2px;">Unidades (1 un)</label>
                        <input type="number" id="req-${p.id}_unit" class="form-control order-req-unit-input" data-prod-id="${p.id}_unit" min="0" value="0" required style="padding: 4px 6px; font-size: 0.8rem;">
                    </div>
                </div>
            `;
        } else {
            html += `
                <div class="form-group" style="display: flex; flex-direction: column; justify-content: space-between;">
                    <label for="req-${p.id}" style="font-size: 0.75rem; white-space: normal; line-height: 1.2; word-break: break-word; margin-bottom: 4px;" title="${p.name}">${p.name}</label>
                    <input type="number" id="req-${p.id}" class="form-control order-req-input" data-prod-id="${p.id}" min="0" value="0" required style="padding: 6px 8px; font-size: 0.85rem; width: 100%;">
                </div>
            `;
        }
    });
    container.innerHTML = html;
}

function renderSalesModalProducts(client) {
    const container = document.getElementById("sales-products-container");
    if (!container) return;

    const geloProducts = state.products.filter(p => p.active && (p.type === 'Gelo' || p.type === 'Gelo Saborizado'));

    if (geloProducts.length === 0) {
        container.innerHTML = `<p style="font-size: 0.8rem; color: var(--color-text-muted); text-align: center; grid-column: 1 / -1; padding: 0.5rem 0;">Nenhum produto de Gelo ou Gelo Saborizado cadastrado no catálogo.</p>`;
        return;
    }

    let html = "";
    geloProducts.forEach(p => {
        const currentStock = (client.stock && client.stock[p.id]) || 0;
        if (p.type === 'Gelo Saborizado') {
            const unitsPerPack = p.unitsPerPack || 12;
            const fardos = Math.floor(currentStock);
            const units = Math.round((currentStock - fardos) * unitsPerPack);
            const stockStr = units > 0 ? `${fardos} f (${units} un)` : `${fardos} f`;
            
            html += `
                <div style="grid-column: span 2; display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; border: 1px solid rgba(255,255,255,0.08); padding: 8px; border-radius: 6px; background: rgba(0,240,255,0.03);">
                    <div style="grid-column: span 2; font-size: 0.75rem; font-weight: bold; color: var(--color-primary); display: flex; justify-content: space-between; align-items: center;">
                        <span style="white-space: normal; line-height: 1.2; word-break: break-word; max-width: 60%;" title="${p.name}">${p.name}</span>
                        <span style="font-size: 0.65rem; color: var(--color-text-muted);">Estoque: ${stockStr}</span>
                    </div>
                    <div class="form-group" style="margin-bottom: 0;">
                        <label for="sale-${p.id}" style="font-size: 0.65rem; color: var(--color-text-muted); display: block; margin-bottom: 2px;">Fardos</label>
                        <input type="number" id="sale-${p.id}" class="form-control sales-sale-input" data-prod-id="${p.id}" min="0" value="0" required style="padding: 4px 6px; font-size: 0.8rem;">
                    </div>
                    <div class="form-group" style="margin-bottom: 0;">
                        <label for="sale-${p.id}_unit" style="font-size: 0.65rem; color: var(--color-text-muted); display: block; margin-bottom: 2px;">Unidades</label>
                        <input type="number" id="sale-${p.id}_unit" class="form-control sales-sale-unit-input" data-prod-id="${p.id}_unit" min="0" value="0" required style="padding: 4px 6px; font-size: 0.8rem;">
                    </div>
                </div>
            `;
        } else {
            html += `
                <div class="form-group" style="display: flex; flex-direction: column; justify-content: space-between;">
                    <label for="sale-${p.id}" id="label-sale-${p.id}" style="font-size: 0.75rem; white-space: normal; line-height: 1.2; word-break: break-word; margin-bottom: 4px;" title="${p.name} (Estoque: ${currentStock})">
                        ${p.name} (Est: ${currentStock})
                    </label>
                    <input type="number" id="sale-${p.id}" class="form-control sales-sale-input" data-prod-id="${p.id}" min="0" max="${currentStock}" value="0" required style="padding: 6px 8px; font-size: 0.85rem; width: 100%;">
                </div>
            `;
        }
    });
    container.innerHTML = html;
}

function renderRentalModalProducts(rental = null) {
    const itemSelect = document.getElementById("rental-item-type");
    if (itemSelect) {
        const currentVal = itemSelect.value || (rental ? rental.itemType : "");
        itemSelect.innerHTML = "";
        const equips = state.products.filter(p => p.active && p.type === "Equipamento");
        equips.forEach(eq => {
            itemSelect.innerHTML += `<option value="${eq.id}">${eq.name}</option>`;
        });
        if (currentVal) itemSelect.value = currentVal;
    }

    const container = document.getElementById("rental-consumables-container");
    if (!container) return;

    const consumables = state.products.filter(p => p.active && p.type !== "Equipamento");

    if (consumables.length === 0) {
        container.innerHTML = `<p style="font-size: 0.8rem; color: var(--color-text-muted); text-align: center; grid-column: 1 / -1; padding: 0.5rem 0;">Nenhum consumível cadastrado no catálogo.</p>`;
        return;
    }

    const items = (rental && rental.iceItems) || {};

    let html = "";
    consumables.forEach(c => {
        const val = items[c.id] !== undefined ? items[c.id] : 0;
        html += `
            <div class="form-group">
                <label style="font-size: 0.75rem; white-space: normal; line-height: 1.2; word-break: break-word;" title="${c.name}">${c.name}</label>
                <input type="number" min="0" step="1" id="rental-qty-${c.id}" class="form-control rental-qty-input" data-prod-id="${c.id}" value="${val}">
            </div>
        `;
    });
    container.innerHTML = html;
}

function renderDocModalProducts(documentObj = null) {
    const container = document.getElementById("document-products-container");
    if (!container) return;

    container.innerHTML = "";
    
    // Reset dos campos de item avulso
    const customNameEl = document.getElementById("doc-custom-name");
    const customQtyEl = document.getElementById("doc-custom-qty");
    const customPriceEl = document.getElementById("doc-custom-price");
    if (customNameEl) customNameEl.value = "";
    if (customQtyEl) customQtyEl.value = 0;
    if (customPriceEl) customPriceEl.value = "0.00";
    
    const activeProducts = state.products.filter(p => p.active);

    if (activeProducts.length === 0) {
        container.innerHTML = `<p style="font-size: 0.8rem; color: var(--color-text-muted); text-align: center; padding: 0.5rem 0;">Nenhum produto cadastrado no catálogo.</p>`;
        return;
    }

    const itemMap = {};
    if (documentObj && documentObj.items) {
        documentObj.items.forEach(it => {
            if (it.prodId) {
                itemMap[it.prodId] = it;
            } else {
                if (customNameEl && !customNameEl.value) {
                    customNameEl.value = it.name || "";
                    if (customQtyEl) customQtyEl.value = it.qty || 0;
                    if (customPriceEl) customPriceEl.value = (it.price || 0).toFixed(2);
                }
            }
        });
    }

    let html = "";
    activeProducts.forEach(p => {
        // Fardo
        const qty = itemMap[p.id] ? itemMap[p.id].qty : 0;
        const price = itemMap[p.id] ? itemMap[p.id].price : (p.defaultPrice || 0);

        html += `
            <div class="form-row-grid" style="grid-template-columns: 2fr 1fr 1.2fr; gap: 0.5rem; align-items: center; margin-bottom: 0.25rem;">
                <span style="font-size: 0.8rem; white-space: normal; line-height: 1.2; word-break: break-word;" title="${p.name}">${p.name}${p.type === 'Gelo Saborizado' ? ' (Fardo)' : ''}</span>
                <input type="number" min="0" id="doc-qty-${p.id}" class="form-control doc-qty-input" data-prod-id="${p.id}" value="${qty}" style="padding: 6px 8px; font-size: 0.85rem;">
                <input type="number" step="0.01" min="0" id="doc-price-${p.id}" class="form-control doc-price-input" data-prod-id="${p.id}" value="${price.toFixed(2)}" style="padding: 6px 8px; font-size: 0.85rem;">
            </div>
        `;

        // Unidade (se for Gelo Saborizado)
        if (p.type === 'Gelo Saborizado') {
            const unitKey = p.id + "_unit";
            const qtyUnit = itemMap[unitKey] ? itemMap[unitKey].qty : 0;
            const priceUnit = itemMap[unitKey] ? itemMap[unitKey].price : (p.unitPrice || 0);
            
            html += `
                <div class="form-row-grid" style="grid-template-columns: 2fr 1fr 1.2fr; gap: 0.5rem; align-items: center; margin-bottom: 0.25rem; border-left: 2px solid var(--color-primary); padding-left: 4px;">
                    <span style="font-size: 0.75rem; white-space: normal; line-height: 1.2; word-break: break-word; color: var(--color-text-muted);" title="${p.name} (Unidade)">↳ ${p.name} (Unidade)</span>
                    <input type="number" min="0" id="doc-qty-${p.id}_unit" class="form-control doc-qty-unit-input" data-prod-id="${p.id}_unit" value="${qtyUnit}" style="padding: 6px 8px; font-size: 0.85rem;">
                    <input type="number" step="0.01" min="0" id="doc-price-${p.id}_unit" class="form-control doc-price-unit-input" data-prod-id="${p.id}_unit" value="${priceUnit.toFixed(2)}" style="padding: 6px 8px; font-size: 0.85rem;">
                </div>
            `;
        }
    });
    container.innerHTML = html;
}


function printDocument() {
    window.print();
}

function downloadDocumentPDF() {
    if (typeof html2pdf === "undefined") {
        alert("A biblioteca de geração de PDF ainda não foi carregada. Verifique sua conexão com a internet.");
        return;
    }

    const element = document.getElementById('printable-document-content');
    if (!element) return;

    // Buscar dados do documento para o nome do arquivo
    const docId = currentPrintDocId || Date.now();
    let d;
    if (docId === "TEST-0000") {
        d = {
            id: "TEST-0000",
            type: "recibo",
            date: new Date().toISOString().split('T')[0],
            clientName: "CLIENTE TESTE DA SILVA",
            address: "AV. PAULISTA, 1000 - SÃO PAULO/SP",
            phone: "(11) 99999-9999",
            paymentMethod: "Dinheiro / Pix",
            items: [
                { name: "Pacote Gelo 5kg (Cubo)", qty: 2, price: 10.00 },
                { name: "Gelo Triturado 20kg", qty: 1, price: 30.00 }
            ],
            deliveryFee: 5.00,
            total: 55.00
        };
    } else {
        d = state.documents.find(item => item.id === docId);
    }
    const prefix = d ? (d.type === "orcamento" ? "orcamento" : (d.type === "nota" ? "nota" : "recibo")) : "documento";
    const clientName = d ? d.clientName.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, "_") : "cliente";
    const filename = `${prefix}_${docId}_${clientName}.pdf`;

    const printFormat = (state.printSettings && state.printSettings.format) || "a4";
    const opt = {
        margin:       10,
        filename:     filename,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, logging: false },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    if (printFormat === "thermal80") {
        opt.margin = [5, 2, 5, 2];
        opt.jsPDF = { unit: 'mm', format: [80, 200], orientation: 'portrait' };
    } else if (printFormat === "thermal58") {
        opt.margin = [3, 1, 3, 1];
        opt.jsPDF = { unit: 'mm', format: [58, 150], orientation: 'portrait' };
    }
    
    // Adicionar um efeito visual temporário para sinalizar o download
    const btn = document.querySelector('.btn-pdf');
    const originalText = btn ? btn.innerHTML : '';
    if (btn) {
        btn.innerHTML = '<span class="spin-anim" style="display:inline-block; border: 2px solid #fff; border-top: 2px solid transparent; border-radius: 50%; width: 12px; height: 12px; margin-right: 6px; vertical-align: middle;"></span> Gerando...';
        btn.disabled = true;
    }

    html2pdf().set(opt).from(element).save().then(() => {
        if (btn) {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }).catch(err => {
        console.error("Erro ao gerar PDF:", err);
        alert("Ocorreu um erro ao gerar o PDF. Tente novamente.");
        if (btn) {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    });
}

function shareDocumentWhatsApp() {
    if (!currentPrintDocId) return;
    let d;
    if (currentPrintDocId === "TEST-0000") {
        d = {
            id: "TEST-0000",
            type: "recibo",
            date: new Date().toISOString().split('T')[0],
            clientName: "CLIENTE TESTE DA SILVA",
            address: "AV. PAULISTA, 1000 - SÃO PAULO/SP",
            phone: "(11) 99999-9999",
            paymentMethod: "Dinheiro / Pix",
            items: [
                { name: "Pacote Gelo 5kg (Cubo)", qty: 2, price: 10.00 },
                { name: "Gelo Triturado 20kg", qty: 1, price: 30.00 }
            ],
            deliveryFee: 5.00,
            total: 55.00
        };
    } else {
        d = state.documents.find(item => item.id === currentPrintDocId);
    }
    if (!d) return;

    const formattedDate = new Date(d.date + 'T00:00:00').toLocaleDateString('pt-BR');
    const titleDoc = d.type === "orcamento" ? "Orçamento" : (d.type === "nota" ? "Nota" : "Recibo");
    
    let text = `*${titleDoc.toUpperCase()} - ${FACTORY_INFO.name}*\n\n`;
    text += `*Nº Documento:* ${d.id}\n`;
    text += `*Cliente:* ${d.clientName}\n`;
    text += `*Data:* ${formattedDate}\n`;
    text += `*Forma de Pagamento:* ${d.paymentMethod || 'Dinheiro'}\n\n`;
    text += `*Itens:*\n`;
    
    d.items.forEach(it => {
        text += `- ${it.qty}x ${it.name} (R$ ${it.price.toFixed(2)}): R$ ${(it.qty * it.price).toFixed(2)}\n`;
    });
    
    if (d.deliveryFee > 0) {
        text += `- Frete: R$ ${d.deliveryFee.toFixed(2)}\n`;
    }
    
    text += `\n*Valor Total: R$ ${d.total.toFixed(2)}*\n\n`;
    text += `Obrigado pela parceria!`;

    const encodedText = encodeURIComponent(text);
    const cleanPhone = d.phone ? d.phone.replace(/\D/g, '') : '';
    
    let whatsappUrl = `https://api.whatsapp.com/send?text=${encodedText}`;
    if (cleanPhone) {
        let phoneWithDDI = cleanPhone;
        if (cleanPhone.length === 10 || cleanPhone.length === 11) {
            phoneWithDDI = '55' + cleanPhone;
        }
        whatsappUrl = `https://api.whatsapp.com/send?phone=${phoneWithDDI}&text=${encodedText}`;
    }
    
    window.open(whatsappUrl, '_blank');
}

function shareDocumentEmail() {
    if (!currentPrintDocId) return;
    let d;
    if (currentPrintDocId === "TEST-0000") {
        d = {
            id: "TEST-0000",
            type: "recibo",
            date: new Date().toISOString().split('T')[0],
            clientName: "CLIENTE TESTE DA SILVA",
            address: "AV. PAULISTA, 1000 - SÃO PAULO/SP",
            phone: "(11) 99999-9999",
            paymentMethod: "Dinheiro / Pix",
            items: [
                { name: "Pacote Gelo 5kg (Cubo)", qty: 2, price: 10.00 },
                { name: "Gelo Triturado 20kg", qty: 1, price: 30.00 }
            ],
            deliveryFee: 5.00,
            total: 55.00
        };
    } else {
        d = state.documents.find(item => item.id === currentPrintDocId);
    }
    if (!d) return;

    const formattedDate = new Date(d.date + 'T00:00:00').toLocaleDateString('pt-BR');
    const titleDoc = d.type === "orcamento" ? "Orçamento" : (d.type === "nota" ? "Nota" : "Recibo");
    
    const subject = `${titleDoc} Nº ${d.id} - ${FACTORY_INFO.name}`;
    
    let body = `${titleDoc} de Venda\n`;
    body += `===================================\n`;
    body += `Emitente: ${FACTORY_INFO.name}\n`;
    body += `Cliente: ${d.clientName}\n`;
    body += `Data: ${formattedDate}\n`;
    body += `Forma de Pagamento: ${d.paymentMethod || 'Dinheiro'}\n`;
    body += `===================================\n\n`;
    body += `Itens:\n`;
    
    d.items.forEach(it => {
        body += `- ${it.qty}x ${it.name} (R$ ${it.price.toFixed(2)}): R$ ${(it.qty * it.price).toFixed(2)}\n`;
    });
    
    if (d.deliveryFee > 0) {
        body += `- Frete: R$ ${d.deliveryFee.toFixed(2)}\n`;
    }
    
    body += `\nValor Total: R$ ${d.total.toFixed(2)}\n\n`;
    body += `Atenciosamente,\n${FACTORY_INFO.name}`;

    const mailtoUrl = `mailto:${d.email || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl, '_self');
}

function renderPrecos() {
    // 1. Carregar preços padrão de fábrica nos inputs dinâmicos
    const factoryContainer = document.getElementById("factory-prices-inputs-container");
    if (factoryContainer) {
        factoryContainer.innerHTML = "";
        state.products.forEach(p => {
            const hasWholesale = p.wholesalePrices || {};
            const hasPromo = p.flashPromo || { active: false, price: 0, limit: 0 };
            
            let advancedHTML = `
                <div class="factory-price-row" style="border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 12px; margin-bottom: 12px;">
                    <div class="form-group" style="margin-bottom: 8px;">
                        <label for="cfg-price-${p.id}" style="font-weight: 600; display: flex; justify-content: space-between; align-items: center;">
                            <span>${p.name} (Preço Fardo/Pacote)</span>
                            <span style="font-size: 0.7rem; color: var(--color-primary);">${p.type}</span>
                        </label>
                        <input type="number" step="0.01" min="0" id="cfg-price-${p.id}" class="form-control factory-price-input" data-prod-id="${p.id}" value="${(p.defaultPrice || 0).toFixed(2)}" required>
                    </div>
                    
                    <details style="margin-top: 6px; cursor: pointer;">
                        <summary style="font-size: 0.75rem; color: var(--color-primary); outline: none; user-select: none;">
                            ⚙️ Configurações Avançadas (Atacado, Promoção${p.type === 'Gelo Saborizado' ? ', Varejo' : ''})
                        </summary>
                        <div style="padding: 10px; background: rgba(0, 0, 0, 0.2); border-radius: 6px; margin-top: 6px; display: flex; flex-direction: column; gap: 10px; cursor: default;" onclick="event.stopPropagation();">
            `;
            
            if (p.type === 'Gelo Saborizado') {
                advancedHTML += `
                            <div class="form-group">
                                <label style="font-size: 0.75rem; display: block; margin-bottom: 2px;">Preço Unitário (Varejo - 1 un) (R$)</label>
                                <input type="number" step="0.01" min="0" id="cfg-unit-price-${p.id}" class="form-control factory-unit-price-input" data-prod-id="${p.id}" value="${(p.unitPrice || 0).toFixed(2)}">
                            </div>
                `;
            }
            
            advancedHTML += `
                            <div style="border-top: 1px solid rgba(255,255,255,0.05); padding-top: 8px;">
                                <span style="font-size: 0.75rem; font-weight: bold; color: var(--color-text-main); display: block; margin-bottom: 4px;">Preços de Atacado (Fardo / Pacote)</span>
                                <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px;">
                                    <div>
                                        <span style="font-size: 0.6rem; color: var(--color-text-muted); display: block; text-align: center; margin-bottom: 2px;">Até 10 un</span>
                                        <input type="number" step="0.01" min="0" id="cfg-w1-${p.id}" class="form-control factory-w1-input" data-prod-id="${p.id}" value="${hasWholesale.tier1_10 ? hasWholesale.tier1_10.toFixed(2) : ''}" placeholder="Padrão" style="padding: 4px; font-size: 0.75rem; text-align: center;">
                                    </div>
                                    <div>
                                        <span style="font-size: 0.65rem; color: var(--color-text-muted); display: block; text-align: center; margin-bottom: 2px;">11 a 20 un</span>
                                        <input type="number" step="0.01" min="0" id="cfg-w2-${p.id}" class="form-control factory-w2-input" data-prod-id="${p.id}" value="${hasWholesale.tier11_20 ? hasWholesale.tier11_20.toFixed(2) : ''}" placeholder="Padrão" style="padding: 4px; font-size: 0.75rem; text-align: center;">
                                    </div>
                                    <div>
                                        <span style="font-size: 0.65rem; color: var(--color-text-muted); display: block; text-align: center; margin-bottom: 2px;">21 a 40 un</span>
                                        <input type="number" step="0.01" min="0" id="cfg-w3-${p.id}" class="form-control factory-w3-input" data-prod-id="${p.id}" value="${hasWholesale.tier21_40 ? hasWholesale.tier21_40.toFixed(2) : ''}" placeholder="Padrão" style="padding: 4px; font-size: 0.75rem; text-align: center;">
                                    </div>
                                    <div>
                                        <span style="font-size: 0.65rem; color: var(--color-text-muted); display: block; text-align: center; margin-bottom: 2px;">41 a 50 un</span>
                                        <input type="number" step="0.01" min="0" id="cfg-w4-${p.id}" class="form-control factory-w4-input" data-prod-id="${p.id}" value="${hasWholesale.tier41_50 ? hasWholesale.tier41_50.toFixed(2) : ''}" placeholder="Padrão" style="padding: 4px; font-size: 0.75rem; text-align: center;">
                                    </div>
                                    <div>
                                        <span style="font-size: 0.65rem; color: var(--color-text-muted); display: block; text-align: center; margin-bottom: 2px;">51+ un</span>
                                        <input type="number" step="0.01" min="0" id="cfg-w5-${p.id}" class="form-control factory-w5-input" data-prod-id="${p.id}" value="${hasWholesale.tier51 ? hasWholesale.tier51.toFixed(2) : ''}" placeholder="Padrão" style="padding: 4px; font-size: 0.75rem; text-align: center;">
                                    </div>
                                </div>
                            </div>
                            
                            <div style="border-top: 1px solid rgba(255,255,255,0.05); padding-top: 8px;">
                                <span style="font-size: 0.75rem; font-weight: bold; color: var(--color-text-main); display: block; margin-bottom: 4px;">Promoção Relâmpago</span>
                                <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
                                    <input type="checkbox" id="cfg-promo-active-${p.id}" class="factory-promo-active" data-prod-id="${p.id}" ${hasPromo.active ? 'checked' : ''} style="width: auto; height: auto; cursor: pointer;">
                                    <label for="cfg-promo-active-${p.id}" style="margin: 0; font-size: 0.7rem; cursor: pointer; color: var(--color-text-main);">Ativar Promoção para este item</label>
                                </div>
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                                    <div>
                                        <span style="font-size: 0.65rem; color: var(--color-text-muted); display: block; margin-bottom: 2px;">Preço Promo (R$)</span>
                                        <input type="number" step="0.01" min="0" id="cfg-promo-price-${p.id}" class="form-control factory-promo-price-input" data-prod-id="${p.id}" value="${hasPromo.price ? hasPromo.price.toFixed(2) : ''}" placeholder="0.00">
                                    </div>
                                    <div>
                                        <span style="font-size: 0.65rem; color: var(--color-text-muted); display: block; margin-bottom: 2px;">Qtd Limite de Vendas</span>
                                        <input type="number" min="0" id="cfg-promo-limit-${p.id}" class="form-control factory-promo-limit-input" data-prod-id="${p.id}" value="${hasPromo.limit !== undefined ? hasPromo.limit : ''}" placeholder="Sem limite">
                                    </div>
                                </div>
                            </div>
                        </div>
                    </details>
                </div>
            `;
            factoryContainer.innerHTML += advancedHTML;
        });
    }

    // 2. Renderizar cabeçalho e linhas da tabela de preços específicos por cliente
    const thead = document.getElementById("pricing-clients-thead");
    const tbody = document.getElementById("pricing-clients-tbody");
    
    if (thead && tbody) {
        thead.innerHTML = "";
        tbody.innerHTML = "";

        const activeProducts = state.products.filter(p => p.active);
        
        if (state.clients.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="${activeProducts.length + 2}" style="padding: 1.5rem; text-align: center; color: var(--color-text-muted);">
                        Nenhum cliente cadastrado para definir preços específicos.
                    </td>
                </tr>
            `;
        } else {
            // Desenhar Thead
            let theadHTML = `<tr style="border-bottom: 2px solid rgba(255,255,255,0.1); font-weight: bold; text-align: left;">`;
            theadHTML += `<th style="padding: 10px;">Cliente</th>`;
            activeProducts.forEach(p => {
                theadHTML += `<th style="padding: 10px; text-align: right;">${p.name}</th>`;
            });
            theadHTML += `<th style="padding: 10px; text-align: center;">Ações</th>`;
            theadHTML += `</tr>`;
            thead.innerHTML = theadHTML;

            // Desenhar Tbody
            state.clients.forEach(c => {
                const cp = c.customPrices || {};
                
                let tbodyHTML = `<tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.03);">`;
                tbodyHTML += `<td style="padding: 10px; vertical-align: middle;">
                    <div style="font-weight: 600; color: var(--color-text-main);">${c.name}</div>
                    <div style="font-size: 0.7rem; color: var(--color-text-muted);">${c.freezerCode ? `Freezer: ${c.freezerCode}` : 'Sem freezer comodatado'}</div>
                </td>`;

                activeProducts.forEach(p => {
                    let price = "";
                    if (p.type === 'Gelo Saborizado') {
                        const priceFardo = cp[p.id] !== undefined && cp[p.id] > 0
                            ? `Fdo: <span style="color: var(--color-primary); font-weight: 700;">R$ ${cp[p.id].toFixed(2)}</span>`
                            : `Fdo: <span style="color: var(--color-text-muted); font-size: 0.75rem;">R$ ${(p.defaultPrice || 0).toFixed(2)}</span>`;
                        const priceUnit = cp[p.id + "_unit"] !== undefined && cp[p.id + "_unit"] > 0
                            ? `Un: <span style="color: var(--color-primary); font-weight: 700;">R$ ${cp[p.id + "_unit"].toFixed(2)}</span>`
                            : `Un: <span style="color: var(--color-text-muted); font-size: 0.75rem;">R$ ${(p.unitPrice || 0).toFixed(2)}</span>`;
                        price = `<div style="display: flex; flex-direction: column; align-items: flex-end; gap: 2px;">
                                    <div>${priceFardo}</div>
                                    <div>${priceUnit}</div>
                                 </div>`;
                    } else {
                        price = cp[p.id] !== undefined && cp[p.id] > 0 
                            ? `<span style="color: var(--color-primary); font-weight: 700;">R$ ${cp[p.id].toFixed(2)}</span>`
                            : `<span style="color: var(--color-text-muted); font-size: 0.8rem;">R$ ${(p.defaultPrice || 0).toFixed(2)} (Padrão)</span>`;
                    }
                    tbodyHTML += `<td style="padding: 10px; text-align: right; vertical-align: middle;">${price}</td>`;
                });

                const hasCustom = activeProducts.some(p => cp[p.id] > 0 || cp[p.id + "_unit"] > 0);
                tbodyHTML += `<td style="padding: 10px; text-align: center; vertical-align: middle;">
                    <div style="display: inline-flex; gap: 6px; justify-content: center;">
                        <button class="btn btn-primary" onclick="openClientPricesModal('${c.id}')" style="padding: 4px 8px; font-size: 0.75rem; display: inline-flex; align-items: center; gap: 4px;">
                            <i data-lucide="edit-3" style="width: 12px; height: 12px;"></i> Configurar
                        </button>
                        ${hasCustom ? `
                            <button class="btn btn-secondary" onclick="clearClientPrices('${c.id}')" style="padding: 4px 8px; font-size: 0.75rem; color: #ef4444; border-color: rgba(239, 68, 68, 0.2); background: rgba(239, 68, 68, 0.05);">
                                Limpar
                            </button>
                        ` : ""}
                    </div>
                </td>`;
                tbodyHTML += `</tr>`;
                
                tbody.innerHTML += tbodyHTML;
            });
        }
    }

    // 3. Preencher inputs de backup
    if (state.backupSettings) {
        document.getElementById("cfg-app-version").value = state.backupSettings.currentVersion || "1.0";
        document.getElementById("cfg-backup-frequency").value = state.backupSettings.frequencyDays !== undefined ? state.backupSettings.frequencyDays : 7;
        document.getElementById("lbl-last-backup-date").innerText = state.backupSettings.lastBackupDate 
            ? new Date(state.backupSettings.lastBackupDate).toLocaleString('pt-BR') 
            : "Nenhum backup realizado";
    }

    // 4. Renderizar histórico de backups locais
    const backupsTbody = document.getElementById("local-backups-tbody");
    if (backupsTbody) {
        backupsTbody.innerHTML = "";
        const backups = state.localBackups || [];
        
        if (backups.length === 0) {
            backupsTbody.innerHTML = `
                <tr>
                    <td colspan="3" style="padding: 1rem; text-align: center; color: var(--color-text-muted);">
                        Nenhum backup salvo localmente no navegador.
                    </td>
                </tr>
            `;
        } else {
            // Mostrar backups ordenados por data decrescente
            const sortedBackups = [...backups].sort((a, b) => new Date(b.date) - new Date(a.date));
            sortedBackups.forEach(b => {
                const dateStr = new Date(b.date).toLocaleString('pt-BR');
                backupsTbody.innerHTML += `
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);">
                        <td style="padding: 8px 6px; font-weight: 600; color: var(--color-primary);">v${b.version}</td>
                        <td style="padding: 8px 6px; color: var(--color-text-main); font-size: 0.75rem;">${dateStr}</td>
                        <td style="padding: 4px 6px; text-align: right; display: flex; gap: 4px; justify-content: flex-end; align-items: center;">
                            <button class="btn btn-secondary" onclick="restoreLocalBackup('${b.id}')" title="Restaurar este backup" style="padding: 3px 6px; font-size: 0.7rem; display: inline-flex; align-items: center; gap: 2px;">
                                <i data-lucide="rotate-ccw" style="width: 11px; height: 11px;"></i> Restaurar
                            </button>
                            <button class="btn btn-secondary btn-icon-only" onclick="downloadBackupJSON('${b.id}')" title="Baixar arquivo JSON" style="padding: 3px 6px; display: inline-flex; align-items: center; justify-content: center;">
                                <i data-lucide="download" style="width: 12px; height: 12px;"></i>
                            </button>
                            <button class="btn btn-danger btn-icon-only" onclick="deleteLocalBackup('${b.id}')" title="Excluir do histórico" style="padding: 3px 6px; display: inline-flex; align-items: center; justify-content: center;">
                                <i data-lucide="trash-2" style="width: 12px; height: 12px;"></i>
                            </button>
                        </td>
                    </tr>
                `;
            });
        }
    }

    // 5. Preencher inputs de dados comerciais
    if (state.factorySettings) {
        document.getElementById("cfg-factory-name").value = state.factorySettings.name || "";
        document.getElementById("cfg-factory-cnpj").value = state.factorySettings.cnpj || "";
        document.getElementById("cfg-factory-phone").value = state.factorySettings.phone || "";
        document.getElementById("cfg-factory-address").value = state.factorySettings.address || "";
        document.getElementById("cfg-factory-email").value = state.factorySettings.email || "";
        const pixEl = document.getElementById("cfg-factory-pix");
        if (pixEl) pixEl.value = state.factorySettings.pixKey || "";
        
        const rentalTermsEl = document.getElementById("cfg-factory-rental-terms");
        if (rentalTermsEl) rentalTermsEl.value = state.factorySettings.rentalTerms || "";
        
        const logoPreviewImg = document.getElementById("img-logo-preview");
        if (logoPreviewImg) {
            logoPreviewImg.src = state.factorySettings.logo || "logo_horizontal.jpg";
        }
    }

    // 6. Preencher inputs de aparência
    if (state.appearance) {
        const themePreset = state.appearance.themeName || "ciano";
        document.getElementById("cfg-theme-preset").value = themePreset;
        document.getElementById("cfg-custom-color").value = state.appearance.primaryColor || "#00f0ff";
        document.getElementById("cfg-custom-color-text").value = state.appearance.primaryColor || "#00f0ff";
        
        // Destacar o cartão de tema correspondente
        const cards = document.querySelectorAll(".theme-card");
        cards.forEach(card => {
            const t = card.getAttribute("data-theme");
            if (t === themePreset) {
                card.style.border = "2px solid var(--color-primary)";
                card.style.background = "rgba(var(--color-primary-rgb), 0.08)";
                card.style.boxShadow = "0 0 15px rgba(var(--color-primary-rgb), 0.3)";
                card.style.transform = "translateY(-2px)";
            } else {
                card.style.border = "2px solid rgba(255,255,255,0.05)";
                card.style.background = "rgba(255,255,255,0.03)";
                card.style.boxShadow = "none";
                card.style.transform = "none";
            }
        });
        
        const pickerGroup = document.getElementById("custom-color-picker-group");
        if (pickerGroup) {
            pickerGroup.style.display = themePreset === "custom" ? "block" : "none";
        }
        
        // Preencher novas opções avançadas
        const bgStyle = state.appearance.backgroundStyle || "darkSpace";
        document.getElementById("cfg-bg-style").value = bgStyle;
        document.getElementById("cfg-custom-bg-color").value = state.appearance.customBgColor || "#090d16";
        document.getElementById("cfg-custom-bg-color-text").value = state.appearance.customBgColor || "#090d16";
        
        const bgPickerGroup = document.getElementById("custom-bg-color-group");
        if (bgPickerGroup) {
            bgPickerGroup.style.display = bgStyle === "custom" ? "block" : "none";
        }
        
        document.getElementById("cfg-panel-style").value = state.appearance.panelStyle || "glassmorphism";
        document.getElementById("cfg-glow-intensity").value = state.appearance.glowIntensity || "high";
    }

    // 7. Preencher inputs de configuração de impressão
    if (state.printSettings) {
        document.getElementById("cfg-print-format").value = state.printSettings.format || "a4";
        document.getElementById("cfg-print-show-logo").checked = state.printSettings.showLogo !== undefined ? state.printSettings.showLogo : true;
        document.getElementById("cfg-print-show-signatures").checked = state.printSettings.showSignatures !== undefined ? state.printSettings.showSignatures : true;
    }

    // 8. Preencher inputs do Firebase
    if (state.firebaseConfig) {
        const fbEnabled = document.getElementById("cfg-fb-enabled");
        if (fbEnabled) fbEnabled.checked = state.firebaseConfig.enabled || false;
        const fbApiKey = document.getElementById("cfg-fb-api-key");
        if (fbApiKey) fbApiKey.value = state.firebaseConfig.apiKey || "";
        const fbProjectId = document.getElementById("cfg-fb-project-id");
        if (fbProjectId) fbProjectId.value = state.firebaseConfig.projectId || "";
        const fbDbUrl = document.getElementById("cfg-fb-db-url");
        if (fbDbUrl) fbDbUrl.value = state.firebaseConfig.databaseURL || "";
        const fbDeviceKey = document.getElementById("cfg-fb-device-key");
        if (fbDeviceKey) fbDeviceKey.value = state.firebaseConfig.deviceKey || "";
    }

    // Carregar novos painéis operacionais e financeiros
    renderFinancialDashboard();
    renderCargoStockInputs();
    calculateCargoSettlement();
    
    // Novas melhorias operacionais
    renderAccountsReceivable();
    renderSuppliers();
    renderPackaging();
    renderPackagingTransactions();
    renderComodatosAdmin();
    
    // Configurações de Comissão
    if (state.commissionSettings) {
        document.getElementById("commission-type").value = state.commissionSettings.type || "none";
        document.getElementById("commission-value").value = state.commissionSettings.value !== undefined ? state.commissionSettings.value : 0;
        toggleCommissionValueLabel();
    }

    switchAdminSubTab(window.activeAdminSubTab || "tab-financeiro");
}

function openClientPricesModal(clientId) {
    const client = state.clients.find(c => c.id === clientId);
    if (!client) return;

    document.getElementById("form-client-prices-id").value = client.id;
    document.getElementById("custom-price-client-name").innerText = client.name;

    const cp = client.customPrices || {};
    
    // Popular contêiner de inputs dinâmicos
    const container = document.getElementById("client-prices-inputs-container");
    if (container) {
        container.innerHTML = "";
        
        const activeProducts = state.products.filter(p => p.active);
        activeProducts.forEach(p => {
            const val = cp[p.id] ? cp[p.id].toFixed(2) : "";
            container.innerHTML += `
                <div class="form-group">
                    <label for="cust-price-${p.id}">${p.name} (R$)</label>
                    <input type="number" step="0.01" min="0" id="cust-price-${p.id}" class="form-control client-custom-price-input" data-prod-id="${p.id}" value="${val}" placeholder="Padrão: R$ ${(p.defaultPrice || 0).toFixed(2)}">
                </div>
            `;
            
            if (p.type === 'Gelo Saborizado') {
                const valUnit = cp[p.id + "_unit"] ? cp[p.id + "_unit"].toFixed(2) : "";
                container.innerHTML += `
                    <div class="form-group" style="margin-top: -6px; padding-left: 10px; border-left: 2px solid var(--color-primary);">
                        <label for="cust-price-unit-${p.id}" style="font-size: 0.75rem;">${p.name} (Unidade Avulsa - R$)</label>
                        <input type="number" step="0.01" min="0" id="cust-price-unit-${p.id}" class="form-control client-custom-price-unit-input" data-prod-id="${p.id}_unit" value="${valUnit}" placeholder="Padrão: R$ ${(p.unitPrice || 0).toFixed(2)}">
                    </div>
                `;
            }
        });
    }

    document.getElementById("modal-client-prices").classList.add("active");
}

function clearClientPrices(clientId) {
    const client = state.clients.find(c => c.id === clientId);
    if (!client) return;

    if (confirm(`Deseja realmente limpar todos os preços especiais de ${client.name}? Ele voltará a pagar os valores padrão da fábrica.`)) {
        client.customPrices = {};
        saveState();
        renderPrecos();
    }
}

function switchAdminSubTab(subTabId) {
    // Verificar se o usuário logado tem permissão
    const currentUserId = sessionStorage.getItem("currentUserId");
    if (currentUserId && state.users) {
        const currentUser = state.users.find(u => u.id === currentUserId);
        if (currentUser) {
            const hasPerm = currentUser.permissions["admin-" + subTabId];
            if (hasPerm === false) {
                alert("Você não possui permissão para acessar esta sub-aba administrativa.");
                return;
            }
        }
    }

    window.activeAdminSubTab = subTabId;
    
    // Atualiza classes ativas dos botões
    const menuButtons = document.querySelectorAll(".admin-menu-btn");
    menuButtons.forEach(btn => {
        const onClickAttr = btn.getAttribute("onclick") || "";
        if (onClickAttr.includes(`'${subTabId}'`) || onClickAttr.includes(`"${subTabId}"`)) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });
    
    // Atualiza classes ativas do conteúdo
    const contents = document.querySelectorAll(".admin-subtab-content");
    contents.forEach(content => {
        if (content.id === subTabId) {
            content.classList.add("active");
        } else {
            content.classList.remove("active");
        }
    });
    
    // Renderizar tabela de usuários se a aba for a correspondente
    if (subTabId === "tab-usuarios" && typeof renderUsersTable === "function") {
        renderUsersTable();
    }
    
    // Força a renderização dos ícones Lucide recém-exibidos
    if (window.lucide) {
        lucide.createIcons();
    }
}

function closeAdminAuthModal() {
    document.getElementById("modal-admin-auth").classList.remove("active");
    // Voltar para a aba anterior
    const prevTab = window.lastActiveTab || "dashboard";
    const navItems = document.querySelectorAll(".nav-item");
    const tabContents = document.querySelectorAll(".tab-content");
    
    navItems.forEach(nav => nav.classList.remove("active"));
    const prevNavItem = document.querySelector(`.nav-item[data-tab="${prevTab}"]`);
    if (prevNavItem) prevNavItem.classList.add("active");
    
    tabContents.forEach(content => {
        content.classList.remove("active");
        if (content.id === prevTab) {
            content.classList.add("active");
        }
    });
    
    updateHeaderForTab(prevTab);
    renderTabContent(prevTab);
}

function lockAdminAccess() {
    alert("Acesso restrito bloqueado. Efetuando logout do painel...");
    logoutUser();
}

// Vincula ao objeto window para uso nos botões HTML inline
window.closeModal = closeModal;
window.editClient = editClient;
window.lockAdminAccess = lockAdminAccess;
window.switchAdminSubTab = switchAdminSubTab;
window.deleteClient = deleteClient;
window.deleteDelivery = deleteDelivery;
window.deliverOrder = deliverOrder;
window.cancelOrder = cancelOrder;
window.openClientModal = openClientModal;
window.openSalesModal = openSalesModal;
window.openOrderModal = openOrderModal;
window.openComodato = openComodato;
window.printComodato = printComodato;

// Novas exportações para o Inventário de Freezers e novos módulos
window.renderInventario = renderInventario;
window.openFreezerModal = openFreezerModal;
window.deleteFreezer = deleteFreezer;
window.openFreezerDetail = openFreezerDetail;
window.openMoveFreezerModal = openMoveFreezerModal;
window.toggleMoveClientSelect = toggleMoveClientSelect;
window.openStickerModal = openStickerModal;
window.printSticker = printSticker;
window.handleImageUpload = handleImageUpload;
window.startQRScanner = startQRScanner;
window.stopQRScanner = stopQRScanner;
window.closeQRScannerModal = closeQRScannerModal;
window.autoPopulateFreezerDetailsInClientForm = autoPopulateFreezerDetailsInClientForm;
window.populateFreezerDropdowns = populateFreezerDropdowns;

// Novas exportações de aluguel e documentos
window.renderTinas = renderTinas;
window.openRentalModal = openRentalModal;
window.populateRentalClientDetails = populateRentalClientDetails;
window.returnRental = returnRental;
window.deleteRental = deleteRental;
window.openRentalStickerModal = openRentalStickerModal;
window.openRentalContract = openRentalContract;
window.printRentalContract = printRentalContract;
window.renderDocumentos = renderDocumentos;
window.openDocModal = openDocModal;
window.populateDocClientDetails = populateDocClientDetails;
window.deleteDocument = deleteDocument;
window.openDocumentPrint = openDocumentPrint;
window.printDocument = printDocument;
window.printTestReceipt = printTestReceipt;
window.downloadDocumentPDF = downloadDocumentPDF;
window.shareDocumentWhatsApp = shareDocumentWhatsApp;
window.shareDocumentEmail = shareDocumentEmail;

// Exportações do painel de preços restrito do Admin
window.renderPrecos = renderPrecos;
window.openClientPricesModal = openClientPricesModal;
window.clearClientPrices = clearClientPrices;
window.closeAdminAuthModal = closeAdminAuthModal;
window.cancelAdminAuth = closeAdminAuthModal;

// --- SISTEMA DE BACKUP VERSIONADO ---
function generateBackup(isAuto = false) {
    const version = (state.backupSettings && state.backupSettings.currentVersion) || "1.0";
    const backupDate = new Date().toISOString();
    
    // Payload do backup: dados operacionais sem o histórico de backups locais para não estourar o tamanho
    const backupPayload = {
        version: version,
        date: backupDate,
        data: {
            clients: state.clients || [],
            freezers: state.freezers || [],
            rentals: state.rentals || [],
            documents: state.documents || [],
            prices: state.prices || {},
            history: state.history || []
        }
    };

    const backupId = "bkp_" + Date.now();
    const newBackup = {
        id: backupId,
        version: version,
        date: backupDate,
        payload: backupPayload
    };

    // Inicializar array se necessário
    if (!state.localBackups) state.localBackups = [];

    // Adicionar novo backup
    state.localBackups.push(newBackup);

    // Rotacionar histórico local (limite de 5 backups)
    if (state.localBackups.length > 5) {
        state.localBackups.sort((a, b) => new Date(a.date) - new Date(b.date));
        while (state.localBackups.length > 5) {
            state.localBackups.shift();
        }
    }

    // Atualizar a data do último backup
    if (!state.backupSettings) {
        state.backupSettings = { frequencyDays: 7, lastBackupDate: "", currentVersion: "2.6" };
    }
    state.backupSettings.lastBackupDate = backupDate;

    saveState();
    renderPrecos();

    // Disparar o download físico do arquivo JSON
    const jsonString = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupPayload, null, 2));
    const downloadAnchor = document.createElement('a');
    
    // Formatar data para o nome do arquivo (YYYY-MM-DD_HH-mm)
    const formattedDate = new Date(backupDate).toISOString().slice(0, 16).replace('T', '_').replace(':', '-');
    
    downloadAnchor.setAttribute("href", jsonString);
    downloadAnchor.setAttribute("download", `gelodovale_backup_v${version}_${formattedDate}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    if (isAuto) {
        alert(`[Backup Automático] Uma cópia de segurança (versão ${version}) foi gerada com sucesso e salva na sua pasta de Downloads. Certifique-se de organizá-la na sua pasta de backup dedicada!`);
    } else {
        alert(`Backup versão ${version} realizado e baixado com sucesso!`);
    }
}

function restoreLocalBackup(backupId) {
    const backup = (state.localBackups || []).find(b => b.id === backupId);
    if (!backup) {
        alert("Backup não encontrado!");
        return;
    }

    if (confirm(`ATENÇÃO: Deseja realmente restaurar o backup da versão ${backup.version} criado em ${new Date(backup.date).toLocaleString('pt-BR')}?\n\nIsso substituirá TODOS os clientes, equipamentos, aluguéis, recibos e configurações atuais pelos dados contidos no backup.`)) {
        applyBackupData(backup.payload);
    }
}

function applyBackupData(payload) {
    try {
        if (!payload || !payload.data) {
            throw new Error("Formato de backup inválido.");
        }

        const d = payload.data;
        state.clients = d.clients || [];
        state.freezers = d.freezers || [];
        state.rentals = d.rentals || [];
        state.documents = d.documents || [];
        state.prices = d.prices || {};
        state.history = d.history || [];

        // Opcional: Atualizar versão atual se contida no backup
        if (payload.version && state.backupSettings) {
            state.backupSettings.currentVersion = payload.version;
        }

        saveState();
        renderApp();
        alert("Backup restaurado com sucesso! Os dados foram atualizados.");
    } catch (e) {
        console.error(e);
        alert("Falha ao restaurar o backup: " + e.message);
    }
}

function downloadBackupJSON(backupId) {
    const backup = (state.localBackups || []).find(b => b.id === backupId);
    if (!backup) return;

    const jsonString = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backup.payload, null, 2));
    const downloadAnchor = document.createElement('a');
    const formattedDate = new Date(backup.date).toISOString().slice(0, 16).replace('T', '_').replace(':', '-');
    downloadAnchor.setAttribute("href", jsonString);
    downloadAnchor.setAttribute("download", `gelodovale_backup_v${backup.version}_${formattedDate}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
}

function deleteLocalBackup(backupId) {
    if (confirm("Deseja realmente excluir este backup do histórico interno do navegador? O arquivo baixado no seu computador continuará existindo.")) {
        state.localBackups = (state.localBackups || []).filter(b => b.id !== backupId);
        saveState();
        renderPrecos();
    }
}

function importBackupFromFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const payload = JSON.parse(e.target.result);
            let stateData = null;
            let version = "1.0";
            let dateStr = new Date().toLocaleString('pt-BR');
            
            if (payload.data && payload.version) {
                stateData = payload.data;
                version = payload.version;
                dateStr = new Date(payload.date || Date.now()).toLocaleString('pt-BR');
            } else if (payload.clients || payload.freezers || payload.prices) {
                stateData = payload;
                if (payload.backupSettings && payload.backupSettings.currentVersion) {
                    version = payload.backupSettings.currentVersion;
                }
                if (payload.lastUpdated) {
                    dateStr = new Date(payload.lastUpdated).toLocaleString('pt-BR');
                }
            }
            
            if (!stateData) {
                alert("Erro: O arquivo selecionado não é um backup válido do Gelo do Vale!");
                return;
            }
            
            if (confirm(`Deseja realmente restaurar o backup de dados da versão ${version} criado em ${dateStr}?\n\nIsso substituirá TODOS os dados atuais.`)) {
                if (payload.data && payload.version) {
                    applyBackupData(payload);
                } else {
                    state = stateData;
                    saveState();
                    renderApp();
                    alert("Backup restaurado com sucesso! Os dados foram atualizados.");
                }
            }
        } catch (err) {
            console.error(err);
            alert("Erro ao ler o arquivo JSON: " + err.message);
        }
        event.target.value = "";
    };
    reader.readAsText(file);
}

function checkAutoBackupOnLoad() {
    if (!state.backupSettings) return;

    const freq = parseInt(state.backupSettings.frequencyDays);
    if (freq === 0) return;

    const lastBackup = state.backupSettings.lastBackupDate;
    if (!lastBackup) {
        console.log("Nenhum backup registrado anteriormente. Disparando backup de primeiro uso...");
        setTimeout(() => {
            generateBackup(true);
        }, 1500);
        return;
    }

    const lastTime = new Date(lastBackup).getTime();
    const nowTime = Date.now();
    const diffDays = (nowTime - lastTime) / (1000 * 60 * 60 * 24);

    if (diffDays >= freq) {
        console.log(`Último backup feito há ${diffDays.toFixed(1)} dias (limite: ${freq} dias). Disparando backup automático...`);
        setTimeout(() => {
            generateBackup(true);
        }, 1500);
    }
}

// Binds de backup na Window
window.generateBackup = generateBackup;
window.restoreLocalBackup = restoreLocalBackup;
window.downloadBackupJSON = downloadBackupJSON;
window.deleteLocalBackup = deleteLocalBackup;
window.importBackupFromFile = importBackupFromFile;
window.updateRentalFee = updateRentalFee;
window.quickCreateRentalItem = quickCreateRentalItem;
window.openProductModal = openProductModal;
window.toggleProductSubfields = toggleProductSubfields;
window.toggleFlavoredPackageUnits = toggleFlavoredPackageUnits;

// --- DADOS CADASTRAIS & APARÊNCIA DINÂMICA (v2.7) ---
function applyAppearanceTheme(customTheme = null) {
    let theme = customTheme || (state && state.appearance);
    if (!theme) {
        theme = {
            themeName: "ciano",
            primaryColor: "#00f0ff",
            primaryColorRgb: "0, 240, 255",
            secondaryColor: "#0072ff",
            backgroundStyle: "darkSpace",
            customBgColor: "#090d16",
            panelStyle: "glassmorphism",
            glowIntensity: "high"
        };
    }
    
    // 1. Determinar cor de fundo geral do app
    let bgColor = "#090d16";
    if (theme.backgroundStyle === "midnightNavy") bgColor = "#0b111e";
    else if (theme.backgroundStyle === "graphiteGrey") bgColor = "#121212";
    else if (theme.backgroundStyle === "amoledBlack") bgColor = "#000000";
    else if (theme.backgroundStyle === "custom") bgColor = theme.customBgColor || "#090d16";
    
    // 2. Determinar estilo de painel (background do card e bordas)
    let cardBg = "rgba(17, 25, 44, 0.65)";
    let cardBgHover = "rgba(26, 38, 64, 0.8)";
    let cardBorder = `rgba(${theme.primaryColorRgb}, 0.08)`;
    let cardBorderHover = `rgba(${theme.primaryColorRgb}, 0.25)`;
    
    if (theme.panelStyle === "solidMinimal") {
        cardBg = "#151b2a";
        cardBgHover = "#1c2438";
        cardBorder = "rgba(255, 255, 255, 0.05)";
        cardBorderHover = "rgba(255, 255, 255, 0.12)";
    } else if (theme.panelStyle === "borderless") {
        cardBg = "rgba(20, 28, 48, 0.7)";
        cardBgHover = "rgba(28, 38, 64, 0.8)";
        cardBorder = "transparent";
        cardBorderHover = "transparent";
    } else if (theme.panelStyle === "highContrast") {
        cardBg = "rgba(10, 15, 28, 0.9)";
        cardBgHover = "rgba(15, 22, 40, 0.95)";
        cardBorder = `rgba(${theme.primaryColorRgb}, 0.3)`;
        cardBorderHover = `rgba(${theme.primaryColorRgb}, 0.6)`;
    }
    
    // 3. Determinar intensidade de brilho neon
    let shadowNeon = `0 0 15px rgba(${theme.primaryColorRgb}, 0.25)`;
    let shadowNeonHover = `0 0 25px rgba(${theme.primaryColorRgb}, 0.45)`;
    
    if (theme.glowIntensity === "soft") {
        shadowNeon = `0 4px 10px rgba(${theme.primaryColorRgb}, 0.1)`;
        shadowNeonHover = `0 6px 15px rgba(${theme.primaryColorRgb}, 0.2)`;
    } else if (theme.glowIntensity === "off") {
        shadowNeon = "none";
        shadowNeonHover = "none";
    }
    
    let styleEl = document.getElementById("dynamic-theme");
    if (!styleEl) {
        styleEl = document.createElement("style");
        styleEl.id = "dynamic-theme";
        document.head.appendChild(styleEl);
    }
    
    styleEl.innerHTML = `
        :root {
            --bg-main: ${bgColor} !important;
            --bg-card: ${cardBg} !important;
            --bg-card-hover: ${cardBgHover} !important;
            --border-card: ${cardBorder} !important;
            --border-card-hover: ${cardBorderHover} !important;
            --color-primary: ${theme.primaryColor} !important;
            --color-primary-rgb: ${theme.primaryColorRgb} !important;
            --color-secondary: ${theme.secondaryColor} !important;
            --shadow-neon: ${shadowNeon} !important;
            --shadow-neon-hover: ${shadowNeonHover} !important;
        }
        ::-webkit-scrollbar-thumb {
            background: rgba(${theme.primaryColorRgb}, 0.2) !important;
        }
        ::-webkit-scrollbar-thumb:hover {
            background: rgba(${theme.primaryColorRgb}, 0.4) !important;
        }
    `;
    
    // Atualizar logotipo da barra lateral
    const logoImg = document.querySelector("aside.sidebar .logo-container img");
    if (logoImg) {
        if (state && state.factorySettings && state.factorySettings.logo) {
            logoImg.src = state.factorySettings.logo;
        } else {
            logoImg.src = "logo_horizontal.jpg";
        }
    }
}
window.applyAppearanceTheme = applyAppearanceTheme;

function getCurrentUIThemeSettings() {
    const themePreset = document.getElementById("cfg-theme-preset").value || "ciano";
    let primaryColor = "#00f0ff";
    let primaryColorRgb = "0, 240, 255";
    let secondaryColor = "#0072ff";
    
    if (themePreset === "ciano") {
        primaryColor = "#00f0ff";
        primaryColorRgb = "0, 240, 255";
        secondaryColor = "#0072ff";
    } else if (themePreset === "verde") {
        primaryColor = "#10b981";
        primaryColorRgb = "16, 185, 129";
        secondaryColor = "#047857";
    } else if (themePreset === "laranja") {
        primaryColor = "#f59e0b";
        primaryColorRgb = "245, 158, 11";
        secondaryColor = "#b45309";
    } else if (themePreset === "rosa") {
        primaryColor = "#ff007f";
        primaryColorRgb = "255, 0, 127";
        secondaryColor = "#7900ff";
    } else if (themePreset === "roxo") {
        primaryColor = "#8b5cf6";
        primaryColorRgb = "139, 92, 246";
        secondaryColor = "#4c1d95";
    } else if (themePreset === "custom") {
        primaryColor = document.getElementById("cfg-custom-color").value || "#00f0ff";
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
    
    const backgroundStyle = document.getElementById("cfg-bg-style").value || "darkSpace";
    const customBgColor = document.getElementById("cfg-custom-bg-color").value || "#090d16";
    const panelStyle = document.getElementById("cfg-panel-style").value || "glassmorphism";
    const glowIntensity = document.getElementById("cfg-glow-intensity").value || "high";
    
    return {
        themeName: themePreset,
        primaryColor,
        primaryColorRgb,
        secondaryColor,
        backgroundStyle,
        customBgColor,
        panelStyle,
        glowIntensity
    };
}

function handlePresetThemeChange(val) {
    const pickerGroup = document.getElementById("custom-color-picker-group");
    if (pickerGroup) {
        pickerGroup.style.display = val === "custom" ? "block" : "none";
    }
    applyAppearanceTheme(getCurrentUIThemeSettings());
}
window.handlePresetThemeChange = handlePresetThemeChange;

function handleBgStyleChange(val) {
    const bgPickerGroup = document.getElementById("custom-bg-color-group");
    if (bgPickerGroup) {
        bgPickerGroup.style.display = val === "custom" ? "block" : "none";
    }
    applyAppearanceTheme(getCurrentUIThemeSettings());
}
window.handleBgStyleChange = handleBgStyleChange;

function handleCustomBgColorInput(val) {
    const textInput = document.getElementById("cfg-custom-bg-color-text");
    if (textInput) textInput.value = val;
    applyAppearanceTheme(getCurrentUIThemeSettings());
}
window.handleCustomBgColorInput = handleCustomBgColorInput;

function handleCustomBgColorTextInput(val) {
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
        const pickerInput = document.getElementById("cfg-custom-bg-color");
        if (pickerInput) pickerInput.value = val;
        applyAppearanceTheme(getCurrentUIThemeSettings());
    }
}
window.handleCustomBgColorTextInput = handleCustomBgColorTextInput;

function handlePanelStyleChange(val) {
    applyAppearanceTheme(getCurrentUIThemeSettings());
}
window.handlePanelStyleChange = handlePanelStyleChange;

function handleGlowIntensityChange(val) {
    applyAppearanceTheme(getCurrentUIThemeSettings());
}
window.handleGlowIntensityChange = handleGlowIntensityChange;

function handleCustomColorInput(val) {
    const textInput = document.getElementById("cfg-custom-color-text");
    if (textInput) textInput.value = val;
    applyAppearanceTheme(getCurrentUIThemeSettings());
}
window.handleCustomColorInput = handleCustomColorInput;

function handleCustomColorTextInput(val) {
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
        const pickerInput = document.getElementById("cfg-custom-color");
        if (pickerInput) pickerInput.value = val;
        applyAppearanceTheme(getCurrentUIThemeSettings());
    }
}
window.handleCustomColorTextInput = handleCustomColorTextInput;

function handleFactoryLogoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            
            const MAX_WIDTH = 300;
            let width = img.width;
            let height = img.height;
            
            if (width > MAX_WIDTH) {
                height = Math.round((height * MAX_WIDTH) / width);
                width = MAX_WIDTH;
            }
            
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
            
            const compressedBase64 = canvas.toDataURL("image/jpeg", 0.6);
            
            if (!state.factorySettings) state.factorySettings = {};
            state.factorySettings.logo = compressedBase64;
            
            // Atualizar preview
            const previewImg = document.getElementById("img-logo-preview");
            if (previewImg) previewImg.src = compressedBase64;
            
            // Atualizar sidebar logo
            const logoImg = document.querySelector("aside.sidebar .logo-container img");
            if (logoImg) logoImg.src = compressedBase64;
            
            saveState();
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}
window.handleFactoryLogoUpload = handleFactoryLogoUpload;

function removeFactoryLogo() {
    if (confirm("Deseja realmente remover o logotipo atual?")) {
        if (!state.factorySettings) state.factorySettings = {};
        state.factorySettings.logo = "";
        
        const previewImg = document.getElementById("img-logo-preview");
        if (previewImg) previewImg.src = "logo_horizontal.jpg";
        
        const logoImg = document.querySelector("aside.sidebar .logo-container img");
        if (logoImg) logoImg.src = "logo_horizontal.jpg";
        
        saveState();
    }
}
window.removeFactoryLogo = removeFactoryLogo;

function selectThemeCard(themeName) {
    const hiddenPreset = document.getElementById("cfg-theme-preset");
    if (hiddenPreset) hiddenPreset.value = themeName;
    
    const cards = document.querySelectorAll(".theme-card");
    cards.forEach(card => {
        const t = card.getAttribute("data-theme");
        if (t === themeName) {
            card.style.border = "2px solid var(--color-primary)";
            card.style.background = "rgba(var(--color-primary-rgb), 0.08)";
            card.style.boxShadow = "0 0 15px rgba(var(--color-primary-rgb), 0.3)";
            card.style.transform = "translateY(-2px)";
        } else {
            card.style.border = "2px solid rgba(255,255,255,0.05)";
            card.style.background = "rgba(255,255,255,0.03)";
            card.style.boxShadow = "none";
            card.style.transform = "none";
        }
    });
    
    handlePresetThemeChange(themeName);
}
window.selectThemeCard = selectThemeCard;

// ==========================================================================
// CENTRAL DE UTILITÁRIOS: RELÓGIO, CLIMA, CALENDÁRIO & BLOCO DE NOTAS
// ==========================================================================

let currentCalendarYear = new Date().getFullYear();
let currentCalendarMonth = new Date().getMonth(); // 0-indexed
let selectedCalendarDateStr = null;

function initUtilityPanel() {
    // 1. Iniciar relógio
    updateClocks();
    setInterval(updateClocks, 1000);

    // 2. Renderizar clima inicial e atualizar com API se online
    renderWeather();
    if (navigator.onLine) {
        updateWeatherFromAPI();
    }
    // Auto-sincronizar clima a cada 15 minutos se online
    setInterval(() => {
        if (navigator.onLine) {
            updateWeatherFromAPI();
        }
    }, 15 * 60 * 1000);

    // 3. Inicializar bloco de notas geral
    const notepad = document.getElementById("general-notepad");
    if (notepad) {
        notepad.value = state.notepadText || "";
        notepad.addEventListener("input", (e) => {
            state.notepadText = e.target.value;
            saveState();
            const status = document.getElementById("notepad-status");
            if (status) {
                status.innerText = "Salvando...";
                setTimeout(() => {
                    status.innerText = "Salvo localmente";
                }, 500);
            }
        });
    }

    // 4. Renderizar calendário inicial
    renderCalendar(currentCalendarYear, currentCalendarMonth);

    // 5. Configurar listener do botão de alternância do painel
    const btnToggle = document.getElementById("btn-toggle-utility");
    if (btnToggle) {
        btnToggle.addEventListener("click", toggleUtilityDrawer);
    }

    // 6. Fechar dropdowns de clima ao clicar fora
    document.addEventListener("click", (e) => {
        const dropdown = document.getElementById("weather-cities-dropdown");
        const configMenu = document.getElementById("weather-config-menu");
        
        // Se clicar fora do dropdown de cidades e do trigger, fechar
        if (dropdown && dropdown.style.display === "block") {
            const trigger = e.target.closest('[onclick^="toggleWeatherCitiesList"]');
            if (!dropdown.contains(e.target) && !trigger) {
                dropdown.style.display = "none";
            }
        }
        
        // Se clicar fora do menu de configuração e do trigger, fechar
        if (configMenu && configMenu.style.display === "block") {
            const trigger = e.target.closest('[onclick="toggleWeatherConfig()"]');
            if (!configMenu.contains(e.target) && !trigger) {
                configMenu.style.display = "none";
            }
        }
    });
}

function toggleUtilityDrawer() {
    const drawer = document.getElementById("utility-drawer");
    const backdrop = document.getElementById("utility-drawer-backdrop");
    if (drawer && backdrop) {
        const isActive = drawer.classList.contains("active");
        if (isActive) {
            drawer.classList.remove("active");
            backdrop.classList.remove("active");
        } else {
            drawer.classList.add("active");
            backdrop.classList.add("active");
            // Atualizar ícones do Lucide dentro do drawer
            lucide.createIcons();
        }
    }
}
window.toggleUtilityDrawer = toggleUtilityDrawer;

function updateClocks() {
    const now = new Date();
    
    // 1. Mini-relógio no cabeçalho (HH:MM)
    const miniClock = document.getElementById("header-mini-clock");
    if (miniClock) {
        const hrs = String(now.getHours()).padStart(2, '0');
        const mins = String(now.getMinutes()).padStart(2, '0');
        miniClock.innerText = `${hrs}:${mins}`;
    }

    // 2. Relógio grande no drawer (HH:MM:SS)
    const drawerClock = document.getElementById("drawer-clock");
    if (drawerClock) {
        const hrs = String(now.getHours()).padStart(2, '0');
        const mins = String(now.getMinutes()).padStart(2, '0');
        const secs = String(now.getSeconds()).padStart(2, '0');
        drawerClock.innerText = `${hrs}:${mins}:${secs}`;
    }

    // 3. Data por extenso no drawer
    const drawerDate = document.getElementById("drawer-date");
    if (drawerDate) {
        const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
        // Formatar para português do Brasil
        let dateStr = now.toLocaleDateString('pt-BR', options);
        // Capitalizar a primeira letra
        dateStr = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
        drawerDate.innerText = dateStr;
    }

    // 4. Ponteiros do Relógio Analógico nos widgets
    const hourHands = document.querySelectorAll(".analog-clock .hand.hour");
    const minHands = document.querySelectorAll(".analog-clock .hand.minute");
    const secHands = document.querySelectorAll(".analog-clock .hand.second");
    
    if (hourHands.length > 0 || minHands.length > 0 || secHands.length > 0) {
        const seconds = now.getSeconds();
        const minutes = now.getMinutes();
        const hours = now.getHours() % 12;
        
        const secDeg = seconds * 6;
        const minDeg = (minutes * 6) + (seconds * 0.1);
        const hourDeg = (hours * 30) + (minutes * 0.5);
        
        hourHands.forEach(h => h.style.transform = `translateX(-50%) rotate(${hourDeg}deg)`);
        minHands.forEach(h => h.style.transform = `translateX(-50%) rotate(${minDeg}deg)`);
        secHands.forEach(h => h.style.transform = `translateX(-50%) rotate(${secDeg}deg)`);
    }

    // 5. Relógio digital nos widgets
    const widgetDigTimes = document.querySelectorAll(".widget-digital-time");
    const widgetDigDates = document.querySelectorAll(".widget-digital-date");
    if (widgetDigTimes.length > 0) {
        const hrs = String(now.getHours()).padStart(2, '0');
        const mins = String(now.getMinutes()).padStart(2, '0');
        const secs = String(now.getSeconds()).padStart(2, '0');
        widgetDigTimes.forEach(el => el.innerText = `${hrs}:${mins}:${secs}`);
    }
    if (widgetDigDates.length > 0) {
        const options = { weekday: 'long', day: 'numeric', month: 'long' };
        let dateStr = now.toLocaleDateString('pt-BR', options);
        dateStr = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
        widgetDigDates.forEach(el => el.innerText = dateStr);
    }
}

// Mecanismo de Clima (Weather)
const WEATHER_CONDITIONS = {
    sun: { desc: "Ensolarado", icon: "sun", color: "#eab308" },
    cloud: { desc: "Nublado", icon: "cloud", color: "#94a3b8" },
    "cloud-rain": { desc: "Chuvoso", icon: "cloud-rain", color: "#60a5fa" },
    "cloud-lightning": { desc: "Tempestade", icon: "cloud-lightning", color: "#a855f7" },
    wind: { desc: "Ventania", icon: "wind", color: "#38bdf8" }
};

// Mapas estáticos de cidades vizinhas para fallback rápido regional
const WEATHER_REGIONAL_FALLBACKS = {
    "registro": [
        { name: "Juquiá - SP", lat: -24.3200, lon: -47.6353 },
        { name: "Jacupiranga - SP", lat: -24.6942, lon: -48.0028 },
        { name: "Eldorado - SP", lat: -24.5211, lon: -48.1078 },
        { name: "Sete Barras - SP", lat: -24.3908, lon: -47.9250 },
        { name: "Pariquera-Açu - SP", lat: -24.7153, lon: -47.8822 },
        { name: "Iguape - SP", lat: -24.7081, lon: -47.5553 },
        { name: "Cananéia - SP", lat: -25.0147, lon: -47.9272 }
    ],
    "s.j. campos": [
        { name: "Jacareí - SP", lat: -23.3056, lon: -45.9658 },
        { name: "Caçapava - SP", lat: -23.1022, lon: -45.7072 },
        { name: "Taubaté - SP", lat: -23.0264, lon: -45.5558 },
        { name: "Monteiro Lobato - SP", lat: -22.9575, lon: -45.8406 },
        { name: "Tremembé - SP", lat: -22.9589, lon: -45.5517 }
    ],
    "são josé dos campos": [
        { name: "Jacareí - SP", lat: -23.3056, lon: -45.9658 },
        { name: "Caçapava - SP", lat: -23.1022, lon: -45.7072 },
        { name: "Taubaté - SP", lat: -23.0264, lon: -45.5558 },
        { name: "Monteiro Lobato - SP", lat: -22.9575, lon: -45.8406 },
        { name: "Tremembé - SP", lat: -22.9589, lon: -45.5517 }
    ],
    "campos do jordão": [
        { name: "S.J. Campos - SP", lat: -23.1791, lon: -45.8872 },
        { name: "Pindamonhangaba - SP", lat: -22.9258, lon: -45.4611 },
        { name: "Santo Antônio do Pinhal - SP", lat: -22.8272, lon: -45.6672 }
    ]
};

function getStaticFallbackCities(cityName) {
    if (!cityName) return [];
    const cleanName = cityName.toLowerCase().trim();
    for (const key in WEATHER_REGIONAL_FALLBACKS) {
        if (cleanName.includes(key) || key.includes(cleanName)) {
            return WEATHER_REGIONAL_FALLBACKS[key];
        }
    }
    return [];
}

let currentNeighborsAbortController = null;

async function updateNeighboringCities(lat, lon, cityName) {
    const listEl = document.getElementById("weather-cities-dropdown-list");
    if (!listEl) return;

    // Se não houver coordenadas, tentar obter do fallback estático usando o nome da cidade
    if (!lat || !lon) {
        const fallbacks = getStaticFallbackCities(cityName);
        renderNeighborList(fallbacks);
        return;
    }

    // Abortar requisição anterior se houver
    if (currentNeighborsAbortController) {
        currentNeighborsAbortController.abort();
    }
    currentNeighborsAbortController = new AbortController();

    // Mostrar fallback imediatamente para melhor UX, depois atualiza se der certo
    const fallbackList = getStaticFallbackCities(cityName);
    renderNeighborList(fallbackList);

    if (!navigator.onLine) {
        return;
    }

    try {
        // Consultar Overpass API para buscar cidades/vilas vizinhas num raio de 45km
        const overpassQuery = `[out:json][timeout:5];(node["place"~"city|town"](around:45000,${lat},${lon}););out 12;`;
        const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`;
        
        const res = await fetch(url, { signal: currentNeighborsAbortController.signal });
        const data = await res.json();
        
        if (data && data.elements) {
            const list = [];
            const activeCityClean = cityName.split(" - ")[0].toLowerCase().trim();
            const seen = new Set();
            seen.add(activeCityClean);

            for (const elem of data.elements) {
                if (elem.tags && elem.tags.name) {
                    const name = elem.tags.name;
                    const cleanName = name.toLowerCase().trim();
                    if (!seen.has(cleanName)) {
                        seen.add(cleanName);
                        // Determinar o estado da UF de forma inteligente com base na cidade ativa
                        const stateAbbr = cityName.includes(" - RJ") ? "RJ" : 
                                          cityName.includes(" - MG") ? "MG" : "SP";
                        list.push({
                            name: `${name} - ${stateAbbr}`,
                            lat: elem.lat,
                            lon: elem.lon
                        });
                    }
                }
                if (list.length >= 6) break;
            }

            if (list.length > 0) {
                renderNeighborList(list);
            }
        }
    } catch (e) {
        if (e.name !== 'AbortError') {
            console.error("Erro ao buscar cidades vizinhas da API, mantendo fallbacks:", e);
        }
    }
}

function renderNeighborList(cities) {
    const listEl = document.getElementById("weather-cities-dropdown-list");
    if (!listEl) return;
    listEl.innerHTML = "";
    
    if (cities.length === 0) {
        const emptyEl = document.createElement("div");
        emptyEl.style.fontSize = "0.7rem";
        emptyEl.style.color = "var(--color-text-muted)";
        emptyEl.style.padding = "6px 8px";
        emptyEl.innerText = "Nenhuma cidade próxima";
        listEl.appendChild(emptyEl);
        return;
    }
    
    cities.forEach(city => {
        const item = document.createElement("button");
        item.type = "button";
        item.className = "weather-dropdown-item";
        item.innerText = city.name.split(" - ")[0]; // Apenas nome principal
        item.title = `Ver clima de ${city.name}`;
        item.onclick = (e) => {
            e.stopPropagation();
            selectNeighborCity(city.name, city.lat, city.lon);
            const dropdown = document.getElementById("weather-cities-dropdown");
            if (dropdown) dropdown.style.display = "none";
        };
        listEl.appendChild(item);
    });
}

async function selectNeighborCity(cityName, lat, lon) {
    const iconSync = document.getElementById("icon-sync-weather");
    if (iconSync) iconSync.classList.add("spin-anim");

    try {
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,is_day&timezone=auto`;
        const weatherRes = await fetch(weatherUrl);
        const weatherData = await weatherRes.json();
        
        if (weatherData && weatherData.current) {
            const temp = Math.round(weatherData.current.temperature_2m);
            const code = weatherData.current.weather_code;
            const isDay = weatherData.current.is_day;
            
            let condition = "sun";
            if (code === 0) {
                condition = "sun";
            } else if ([1, 2, 3, 45, 48].includes(code)) {
                condition = "cloud";
            } else if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
                condition = "cloud-rain";
            } else if ([95, 96, 99].includes(code)) {
                condition = "cloud-lightning";
            } else {
                condition = "wind";
            }
            
            state.weatherConfig = { city: cityName, temp, condition, lat, lon, isDay };
            saveState();
            renderWeather();

            // Sincronizar inputs visuais se menu aberto
            document.getElementById("weather-city-input").value = cityName;
            document.getElementById("weather-temp-input").value = temp;
            document.getElementById("weather-cond-select").value = condition;
        }
    } catch (e) {
        console.error("Falha ao buscar clima da cidade vizinha:", e);
        const currentConfig = state.weatherConfig || {};
        const fallbackIsDay = (new Date().getHours() >= 6 && new Date().getHours() < 18) ? 1 : 0;
        state.weatherConfig = {
            city: cityName,
            temp: currentConfig.temp || 24,
            condition: currentConfig.condition || "sun",
            lat,
            lon,
            isDay: currentConfig.hasOwnProperty("isDay") ? currentConfig.isDay : fallbackIsDay
        };
        saveState();
        renderWeather();
    } finally {
        if (iconSync) {
            setTimeout(() => {
                iconSync.classList.remove("spin-anim");
            }, 500);
        }
    }
}
window.selectNeighborCity = selectNeighborCity;

async function syncWeatherManual() {
    const iconSync = document.getElementById("icon-sync-weather");
    if (iconSync) iconSync.classList.add("spin-anim");
    
    try {
        await updateWeatherFromAPI();
    } catch (e) {
        console.error(e);
    } finally {
        setTimeout(() => {
            if (iconSync) iconSync.classList.remove("spin-anim");
        }, 800);
    }
}
window.syncWeatherManual = syncWeatherManual;

function renderWeather() {
    const config = state.weatherConfig || { city: "S.J. Campos", temp: 24, condition: "sun", lat: -23.1791, lon: -45.8872 };
    const tempEl = document.getElementById("weather-temp");
    const iconContainer = document.getElementById("weather-icon-container");
    const descEl = document.getElementById("weather-desc");

    // Determinar dia vs noite
    let isDay = true;
    if (config.hasOwnProperty("isDay") && config.isDay !== null && config.isDay !== undefined) {
        isDay = (config.isDay === 1 || config.isDay === true || String(config.isDay) === "1");
    } else {
        const hour = new Date().getHours();
        isDay = (hour >= 6 && hour < 18);
    }

    const cond = WEATHER_CONDITIONS[config.condition] || WEATHER_CONDITIONS.sun;
    let iconName = cond.icon;
    let iconColor = cond.color;
    let descText = cond.desc;

    // Sobrescrever para noite se limpo ou nublado
    if (!isDay) {
        if (config.condition === "sun") {
            iconName = "moon";
            iconColor = "#cbd5e1";
            descText = "Noite Limpa";
        } else if (config.condition === "cloud") {
            iconName = "cloud-moon";
            iconColor = "#94a3b8";
            descText = "Noite Nublada";
        }
    }

    if (tempEl) tempEl.innerText = `${config.temp}°C`;
    if (descEl) {
        descEl.innerHTML = `${descText} - <span id="weather-city-name" style="cursor: pointer; border-bottom: 1px dotted var(--color-primary); color: #fff; font-weight: 500;" onclick="toggleWeatherCitiesList(event)">${config.city}</span>`;
    }
    if (iconContainer) {
        iconContainer.innerHTML = `<i data-lucide="${iconName}" style="width: 20px; height: 20px; color: ${iconColor};"></i>`;
        lucide.createIcons();
    }

    // Carregar/atualizar a lista de cidades vizinhas
    updateNeighboringCities(config.lat, config.lon, config.city);
}

function toggleWeatherCitiesList(event) {
    if (event) event.stopPropagation();
    const dropdown = document.getElementById("weather-cities-dropdown");
    if (dropdown) {
        const isHidden = dropdown.style.display === "none" || !dropdown.style.display;
        dropdown.style.display = isHidden ? "block" : "none";
        
        if (isHidden) {
            const configMenu = document.getElementById("weather-config-menu");
            if (configMenu) configMenu.style.display = "none";
        }
    }
}
window.toggleWeatherCitiesList = toggleWeatherCitiesList;

function toggleWeatherConfig() {
    const menu = document.getElementById("weather-config-menu");
    if (menu) {
        const isHidden = menu.style.display === "none" || !menu.style.display;
        menu.style.display = isHidden ? "block" : "none";
        
        if (isHidden) {
            const config = state.weatherConfig || { city: "S.J. Campos", temp: 24, condition: "sun", lat: -23.1791, lon: -45.8872 };
            document.getElementById("weather-city-input").value = config.city;
            document.getElementById("weather-temp-input").value = config.temp;
            document.getElementById("weather-cond-select").value = config.condition;
            
            // Se abrir ajuste manual, fechar a lista de cidades
            const dropdown = document.getElementById("weather-cities-dropdown");
            if (dropdown) dropdown.style.display = "none";
        }
    }
}
window.toggleWeatherConfig = toggleWeatherConfig;

async function saveWeatherConfig() {
    const cityInput = document.getElementById("weather-city-input").value.trim() || "S.J. Campos";
    const tempInput = parseInt(document.getElementById("weather-temp-input").value) || 24;
    const conditionInput = document.getElementById("weather-cond-select").value;

    const menu = document.getElementById("weather-config-menu");
    const confirmBtn = menu ? menu.querySelector("button.btn-primary") : null;
    const originalText = confirmBtn ? confirmBtn.innerHTML : "Confirmar";

    if (navigator.onLine) {
        if (confirmBtn) confirmBtn.innerHTML = "Buscando...";
        try {
            const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityInput)}&count=1&language=pt`;
            const geoRes = await fetch(geoUrl);
            const geoData = await geoRes.json();
            
            if (geoData.results && geoData.results.length > 0) {
                const result = geoData.results[0];
                const lat = result.latitude;
                const lon = result.longitude;
                let resolvedCityName = result.name;
                
                if (result.admin1) {
                    const stateName = result.admin1;
                    const stateAbbr = stateName === "São Paulo" ? "SP" : 
                                      stateName === "Rio de Janeiro" ? "RJ" : 
                                      stateName === "Minas Gerais" ? "MG" : 
                                      stateName === "Espírito Santo" ? "ES" : 
                                      stateName === "Paraná" ? "PR" : 
                                      stateName === "Santa Catarina" ? "SC" : 
                                      stateName === "Rio Grande do Sul" ? "RS" : stateName;
                    resolvedCityName += ` - ${stateAbbr}`;
                }

                const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,is_day&timezone=auto`;
                const weatherRes = await fetch(weatherUrl);
                const weatherData = await weatherRes.json();
                
                if (weatherData && weatherData.current) {
                    const temp = Math.round(weatherData.current.temperature_2m);
                    const code = weatherData.current.weather_code;
                    const isDay = weatherData.current.is_day;
                    
                    let condition = "sun";
                    if (code === 0) {
                        condition = "sun";
                    } else if ([1, 2, 3, 45, 48].includes(code)) {
                        condition = "cloud";
                    } else if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
                        condition = "cloud-rain";
                    } else if ([95, 96, 99].includes(code)) {
                        condition = "cloud-lightning";
                    } else {
                        condition = "wind";
                    }
                    
                    state.weatherConfig = { city: resolvedCityName, temp, condition, lat, lon, isDay };
                    saveState();
                    renderWeather();
                    
                    if (menu) menu.style.display = "none";
                    if (confirmBtn) confirmBtn.innerHTML = originalText;
                    return;
                }
            } else {
                alert(`Cidade "${cityInput}" não foi encontrada online. Aplicando valores inseridos manualmente.`);
            }
        } catch (e) {
            console.error("Falha ao buscar clima em tempo real, aplicando manual:", e);
        } finally {
            if (confirmBtn) confirmBtn.innerHTML = originalText;
        }
    }

    const oldConfig = state.weatherConfig || {};
    const preserveCoords = oldConfig.city && oldConfig.city.split(" - ")[0].toLowerCase().trim() === cityInput.toLowerCase().trim();
    const fallbackIsDay = (new Date().getHours() >= 6 && new Date().getHours() < 18) ? 1 : 0;
    state.weatherConfig = {
        city: cityInput,
        temp: tempInput,
        condition: conditionInput,
        lat: preserveCoords ? oldConfig.lat : null,
        lon: preserveCoords ? oldConfig.lon : null,
        isDay: preserveCoords && oldConfig.hasOwnProperty("isDay") ? oldConfig.isDay : fallbackIsDay
    };
    saveState();
    renderWeather();

    if (menu) menu.style.display = "none";
}
window.saveWeatherConfig = saveWeatherConfig;

async function updateWeatherFromAPI() {
    if (!navigator.onLine) return;
    const config = state.weatherConfig || { city: "S.J. Campos", temp: 24, condition: "sun", lat: -23.1791, lon: -45.8872 };
    
    try {
        let lat = config.lat;
        let lon = config.lon;
        let resolvedCityName = config.city;

        if (lat && lon && (resolvedCityName === "Auto (GPS)" || resolvedCityName === "Local Detectado" || !resolvedCityName)) {
            try {
                const revGeoUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=pt`;
                const revGeoRes = await fetch(revGeoUrl);
                const revGeoData = await revGeoRes.json();
                if (revGeoData) {
                    const cityResolved = revGeoData.city || revGeoData.locality || revGeoData.principalSubdivision || "";
                    let stateAbbr = "";
                    if (revGeoData.principalSubdivisionCode) {
                        const parts = revGeoData.principalSubdivisionCode.split("-");
                        stateAbbr = parts[parts.length - 1];
                    }
                    if (cityResolved) {
                        resolvedCityName = stateAbbr ? `${cityResolved} - ${stateAbbr}` : cityResolved;
                    }
                }
            } catch (err) {
                console.error("Erro na geolocalização reversa em updateWeatherFromAPI:", err);
            }
        }

        if (!lat || !lon) {
            const cityNameOnly = config.city.split(" - ")[0];
            const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityNameOnly)}&count=1&language=pt`;
            const geoRes = await fetch(geoUrl);
            const geoData = await geoRes.json();
            
            if (geoData.results && geoData.results.length > 0) {
                const result = geoData.results[0];
                lat = result.latitude;
                lon = result.longitude;
                resolvedCityName = result.name;
                if (result.admin1) {
                    const stateName = result.admin1;
                    const stateAbbr = stateName === "São Paulo" ? "SP" : 
                                      stateName === "Rio de Janeiro" ? "RJ" : 
                                      stateName === "Minas Gerais" ? "MG" : stateName;
                    resolvedCityName += ` - ${stateAbbr}`;
                }
            } else {
                return;
            }
        }

        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,is_day&timezone=auto`;
        const weatherRes = await fetch(weatherUrl);
        const weatherData = await weatherRes.json();
        
        if (weatherData && weatherData.current) {
            const temp = Math.round(weatherData.current.temperature_2m);
            const code = weatherData.current.weather_code;
            const isDay = weatherData.current.is_day;
            
            let condition = "sun";
            if (code === 0) {
                condition = "sun";
            } else if ([1, 2, 3, 45, 48].includes(code)) {
                condition = "cloud";
            } else if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
                condition = "cloud-rain";
            } else if ([95, 96, 99].includes(code)) {
                condition = "cloud-lightning";
            } else {
                condition = "wind";
            }
            
            state.weatherConfig = { city: resolvedCityName, temp, condition, lat, lon, isDay };
            saveState();
            renderWeather();
        }
    } catch (e) {
        console.error("Erro na atualização automática do clima em background:", e);
    }
}
window.updateWeatherFromAPI = updateWeatherFromAPI;

function detectUserLocation() {
    if (!navigator.geolocation) {
        alert("Seu navegador não oferece suporte para geolocalização.");
        return;
    }

    const btn = document.querySelector("#weather-config-menu button[onclick='detectUserLocation()']");
    const originalText = btn ? btn.innerHTML : "Detectar Local";
    if (btn) {
        btn.innerHTML = "Localizando...";
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        try {
            const revGeoUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=pt`;
            const revGeoRes = await fetch(revGeoUrl);
            const revGeoData = await revGeoRes.json();
            
            let city = "Local Detectado";
            if (revGeoData) {
                const cityResolved = revGeoData.city || revGeoData.locality || revGeoData.principalSubdivision || "";
                let stateAbbr = "";
                if (revGeoData.principalSubdivisionCode) {
                    const parts = revGeoData.principalSubdivisionCode.split("-");
                    stateAbbr = parts[parts.length - 1];
                }
                if (cityResolved) {
                    city = stateAbbr ? `${cityResolved} - ${stateAbbr}` : cityResolved;
                }
            }

            const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,is_day&timezone=auto`;
            const weatherRes = await fetch(weatherUrl);
            const weatherData = await weatherRes.json();

            if (weatherData && weatherData.current) {
                const temp = Math.round(weatherData.current.temperature_2m);
                const code = weatherData.current.weather_code;
                const isDay = weatherData.current.is_day;

                let condition = "sun";
                if (code === 0) {
                    condition = "sun";
                } else if ([1, 2, 3, 45, 48].includes(code)) {
                    condition = "cloud";
                } else if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
                    condition = "cloud-rain";
                } else if ([95, 96, 99].includes(code)) {
                    condition = "cloud-lightning";
                } else {
                    condition = "wind";
                }

                state.weatherConfig = { city, temp, condition, lat, lon, isDay };
                saveState();
                renderWeather();

                document.getElementById("weather-city-input").value = city;
                document.getElementById("weather-temp-input").value = temp;
                document.getElementById("weather-cond-select").value = condition;

                alert(`Localização identificada:\n${city}`);
            }
        } catch (e) {
            console.error("Erro na geolocalização reversa, aplicando coordenadas direta:", e);
            try {
                const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,is_day&timezone=auto`;
                const weatherRes = await fetch(weatherUrl);
                const weatherData = await weatherRes.json();

                if (weatherData && weatherData.current) {
                    const temp = Math.round(weatherData.current.temperature_2m);
                    const code = weatherData.current.weather_code;
                    const isDay = weatherData.current.is_day;

                    let condition = "sun";
                    if (code === 0) {
                        condition = "sun";
                    } else if ([1, 2, 3, 45, 48].includes(code)) {
                        condition = "cloud";
                    } else if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
                        condition = "cloud-rain";
                    } else if ([95, 96, 99].includes(code)) {
                        condition = "cloud-lightning";
                    } else {
                        condition = "wind";
                    }

                    const formattedCoords = `Lat/Lon: ${lat.toFixed(2)}, ${lon.toFixed(2)}`;
                    state.weatherConfig = { city: formattedCoords, temp, condition, lat, lon, isDay };
                    saveState();
                    renderWeather();

                    document.getElementById("weather-city-input").value = formattedCoords;
                    document.getElementById("weather-temp-input").value = temp;
                    document.getElementById("weather-cond-select").value = condition;
                }
            } catch (innerErr) {
                console.error("Erro geral no clima via GPS:", innerErr);
                alert("Não foi possível carregar as informações do clima via GPS.");
            }
        } finally {
            if (btn) btn.innerHTML = originalText;
        }
    }, (error) => {
        alert("Permissão de geolocalização negada. Por favor, digite a cidade desejada no campo Cidade.");
        if (btn) btn.innerHTML = originalText;
    });
}
window.detectUserLocation = detectUserLocation;


// Mecanismo do Calendário Mensal
const MONTH_NAMES = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

function renderCalendar(year, month) {
    const monthYearEl = document.getElementById("calendar-month-year");
    if (monthYearEl) {
        monthYearEl.innerText = `${MONTH_NAMES[month]} ${year}`;
    }

    const container = document.getElementById("calendar-days-container");
    if (!container) return;
    container.innerHTML = "";

    // Obter dia da semana do primeiro dia do mês (0: Dom, 1: Seg, ..., 6: Sáb)
    const firstDayIndex = new Date(year, month, 1).getDay();
    // Obter número total de dias no mês
    const totalDays = new Date(year, month + 1, 0).getDate();
    // Obter número de dias do mês anterior
    const prevMonthTotalDays = new Date(year, month, 0).getDate();

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    // 1. Renderizar dias do mês anterior (cinzas / desativados)
    for (let i = firstDayIndex - 1; i >= 0; i--) {
        const prevDay = prevMonthTotalDays - i;
        const dayEl = document.createElement("span");
        dayEl.className = "calendar-day other-month";
        dayEl.innerText = prevDay;
        container.appendChild(dayEl);
    }

    // 2. Renderizar dias do mês atual
    for (let day = 1; day <= totalDays; day++) {
        const dayStr = String(day).padStart(2, '0');
        const monthStr = String(month + 1).padStart(2, '0');
        const dateStr = `${year}-${monthStr}-${dayStr}`;

        const dayEl = document.createElement("span");
        dayEl.className = "calendar-day";
        dayEl.innerText = day;

        // Se for hoje
        if (dateStr === todayStr) {
            dayEl.classList.add("today");
        }

        // Se estiver selecionado
        if (dateStr === selectedCalendarDateStr) {
            dayEl.classList.add("selected");
        }

        // Se tiver nota registrada
        if (state.calendarNotes && state.calendarNotes[dateStr]) {
            dayEl.classList.add("has-note");
        }

        // Evento de clique
        dayEl.addEventListener("click", () => {
            selectCalendarDay(dateStr);
        });

        container.appendChild(dayEl);
    }

    // 3. Renderizar dias do próximo mês para completar o grid (semanas completas de 7 colunas)
    const totalRendered = firstDayIndex + totalDays;
    const remaining = 7 - (totalRendered % 7);
    if (remaining < 7) {
        for (let i = 1; i <= remaining; i++) {
            const dayEl = document.createElement("span");
            dayEl.className = "calendar-day other-month";
            dayEl.innerText = i;
            container.appendChild(dayEl);
        }
    }
}

function changeMonth(dir) {
    currentCalendarMonth += dir;
    if (currentCalendarMonth < 0) {
        currentCalendarMonth = 11;
        currentCalendarYear--;
    } else if (currentCalendarMonth > 11) {
        currentCalendarMonth = 0;
        currentCalendarYear++;
    }
    renderCalendar(currentCalendarYear, currentCalendarMonth);
}
window.changeMonth = changeMonth;

function selectCalendarDay(dateStr) {
    selectedCalendarDateStr = dateStr;
    
    // Rerenderizar calendário para atualizar destaque do dia selecionado
    renderCalendar(currentCalendarYear, currentCalendarMonth);

    // Formatar data em português para exibição
    const [y, m, d] = dateStr.split("-");
    const formattedDate = `${d}/${m}/${y}`;

    const notesBox = document.getElementById("calendar-day-notes-box");
    const label = document.getElementById("selected-day-label");
    const textarea = document.getElementById("selected-day-textarea");

    if (notesBox && label && textarea) {
        notesBox.style.display = "block";
        label.innerText = `Notas do dia ${formattedDate}`;
        textarea.value = (state.calendarNotes && state.calendarNotes[dateStr]) || "";
        textarea.focus();
    }
}

function saveDayNote() {
    if (!selectedCalendarDateStr) return;

    const textarea = document.getElementById("selected-day-textarea");
    if (!textarea) return;

    const noteText = textarea.value.trim();

    if (!state.calendarNotes) state.calendarNotes = {};

    if (noteText) {
        state.calendarNotes[selectedCalendarDateStr] = noteText;
    } else {
        delete state.calendarNotes[selectedCalendarDateStr];
    }

    saveState();
    renderCalendar(currentCalendarYear, currentCalendarMonth);
    
    // Atualizar indicador visual no calendário
    alert("Nota salva com sucesso para este dia!");
}
window.saveDayNote = saveDayNote;

function clearDayNote() {
    if (!selectedCalendarDateStr) return;

    const textarea = document.getElementById("selected-day-textarea");
    if (textarea) textarea.value = "";

    if (state.calendarNotes) {
        delete state.calendarNotes[selectedCalendarDateStr];
    }

    saveState();
    renderCalendar(currentCalendarYear, currentCalendarMonth);
    
    const notesBox = document.getElementById("calendar-day-notes-box");
    if (notesBox) notesBox.style.display = "none";
}
window.clearDayNote = clearDayNote;

// ==========================================================================
// OPERAÇÕES OPERACIONAIS: ROTEIRIZAÇÃO, ASSINATURA, CARGO E FINANÇAS
// ==========================================================================

// 1. Roteirização Otimizada (Google Maps Multi-paradas)
function optimizeDeliveryRoute() {
    const orderCheckboxes = document.querySelectorAll(".order-route-checkbox:checked");
    const visitCheckboxes = document.querySelectorAll(".visit-route-checkbox:checked");
    
    if (orderCheckboxes.length === 0 && visitCheckboxes.length === 0) {
        alert("Por favor, selecione pelo menos um pedido ou sugestão de visita para traçar a rota.");
        return;
    }
    
    const uniqueIntermediaries = new Set();
    
    orderCheckboxes.forEach(cb => {
        const orderId = cb.getAttribute("data-order-id");
        const order = state.orders.find(o => o.id === orderId);
        if (order) {
            const client = state.clients.find(c => c.id === order.clientId);
            if (client && client.address && client.address.trim() !== "") {
                uniqueIntermediaries.add(client.address.trim());
            }
        }
    });
    
    visitCheckboxes.forEach(cb => {
        const clientId = cb.getAttribute("data-client-id");
        const client = state.clients.find(c => c.id === clientId);
        if (client && client.address && client.address.trim() !== "") {
            uniqueIntermediaries.add(client.address.trim());
        }
    });
    
    if (uniqueIntermediaries.size === 0) {
        alert("Nenhum endereço válido encontrado nos itens selecionados.");
        return;
    }
    
    const addresses = [FACTORY_INFO.address, ...Array.from(uniqueIntermediaries), FACTORY_INFO.address];
    
    const baseUrl = "https://www.google.com/maps/dir/";
    const routeUrl = baseUrl + addresses.map(addr => encodeURIComponent(addr)).join("/");
    
    window.open(routeUrl, "_blank");
}
window.optimizeDeliveryRoute = optimizeDeliveryRoute;

// 2. Assinatura Digital Integrada (HTML5 Canvas Signature Pad)
let signatureCanvas = null;
let signatureCtx = null;
let isDrawing = false;
let lastX = 0;
let lastY = 0;

function initSignatureCanvas() {
    signatureCanvas = document.getElementById("signature-canvas");
    if (!signatureCanvas) return;
    signatureCtx = signatureCanvas.getContext("2d");
    
    signatureCtx.strokeStyle = "#000000";
    signatureCtx.lineWidth = 2.5;
    signatureCtx.lineCap = "round";
    signatureCtx.lineJoin = "round";
    
    resizeSignatureCanvas();
    
    // Eventos de Mouse
    signatureCanvas.addEventListener("mousedown", startDrawing);
    signatureCanvas.addEventListener("mousemove", draw);
    signatureCanvas.addEventListener("mouseup", stopDrawing);
    signatureCanvas.addEventListener("mouseout", stopDrawing);
    
    // Eventos de Touch
    signatureCanvas.addEventListener("touchstart", startDrawingTouch, { passive: false });
    signatureCanvas.addEventListener("touchmove", drawTouch, { passive: false });
    signatureCanvas.addEventListener("touchend", stopDrawingTouch);
}

function resizeSignatureCanvas() {
    if (!signatureCanvas) return;
    const rect = signatureCanvas.getBoundingClientRect();
    signatureCanvas.width = rect.width || 418;
    signatureCanvas.height = rect.height || 200;
    
    if (signatureCtx) {
        signatureCtx.strokeStyle = "#000000";
        signatureCtx.lineWidth = 2.5;
        signatureCtx.lineCap = "round";
        signatureCtx.lineJoin = "round";
    }
}

function startDrawing(e) {
    isDrawing = true;
    const rect = signatureCanvas.getBoundingClientRect();
    lastX = e.clientX - rect.left;
    lastY = e.clientY - rect.top;
}

function draw(e) {
    if (!isDrawing) return;
    const rect = signatureCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    signatureCtx.beginPath();
    signatureCtx.moveTo(lastX, lastY);
    signatureCtx.lineTo(x, y);
    signatureCtx.stroke();
    
    lastX = x;
    lastY = y;
}

function stopDrawing() {
    isDrawing = false;
}

function startDrawingTouch(e) {
    if (e.touches.length === 1) {
        e.preventDefault();
        isDrawing = true;
        const rect = signatureCanvas.getBoundingClientRect();
        const touch = e.touches[0];
        lastX = touch.clientX - rect.left;
        lastY = touch.clientY - rect.top;
    }
}

function drawTouch(e) {
    if (!isDrawing || e.touches.length !== 1) return;
    e.preventDefault();
    const rect = signatureCanvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    signatureCtx.beginPath();
    signatureCtx.moveTo(lastX, lastY);
    signatureCtx.lineTo(x, y);
    signatureCtx.stroke();
    
    lastX = x;
    lastY = y;
}

function stopDrawingTouch() {
    isDrawing = false;
}

function clearSignatureCanvas() {
    if (!signatureCanvas || !signatureCtx) return;
    signatureCtx.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height);
}
window.clearSignatureCanvas = clearSignatureCanvas;

function openSignatureModal(targetType = 'document', targetId = null) {
    window.signatureTargetType = targetType;
    window.signatureTargetId = targetId;

    document.getElementById("modal-signature").classList.add("active");
    setTimeout(() => {
        if (!signatureCanvas) {
            initSignatureCanvas();
        } else {
            resizeSignatureCanvas();
        }
        clearSignatureCanvas();
    }, 200);
}
window.openSignatureModal = openSignatureModal;

function saveSignature() {
    if (!signatureCanvas) return;
    const dataUrl = signatureCanvas.toDataURL("image/png");
    
    const targetType = window.signatureTargetType || 'document';
    const targetId = window.signatureTargetId || currentPrintDocId;
    
    if (targetType === 'comodato') {
        const comodato = state.comodatos.find(item => item.id === targetId);
        if (comodato) {
            comodato.signatureBase64 = dataUrl;
            comodato.status = 'ativo';
            comodato.signatureDate = new Date().toISOString();
            comodato.signatureMethod = 'local';
            
            const client = state.clients.find(c => c.id === comodato.clientId);
            if (client) {
                client.freezerCode = comodato.freezerCode;
            }
            
            saveState();
            alert("Assinatura do comodato salva com sucesso!");
            renderComodatoDetail(targetId);
            renderComodatosAdmin();
        }
    } else if (targetType === 'rental') {
        const rental = state.rentals.find(item => item.id === targetId);
        if (rental) {
            rental.signatureBase64 = dataUrl;
            saveState();
            alert("Assinatura do contrato salva com sucesso!");
            updateRentalContractPreview(targetId);
        }
    } else {
        if (targetId === "TEST-0000") {
            window.testDocSignatureBase64 = dataUrl;
            alert("Assinatura salva com sucesso no cupom de teste!");
        } else {
            const doc = state.documents.find(item => item.id === targetId);
            if (doc) {
                doc.signatureBase64 = dataUrl;
                saveState();
                alert("Assinatura salva com sucesso!");
            }
        }
    }
    
    closeModal("modal-signature");
    if (targetType === 'comodato') {
        openComodatoDetail(targetId);
    } else if (targetType !== 'rental') {
        openDocumentPrint(targetId || currentPrintDocId);
    }
}
window.saveSignature = saveSignature;

function closeSignatureModal() {
    closeModal("modal-signature");
    if (window.signatureTargetType === 'comodato' && window.signatureTargetId) {
        openComodatoDetail(window.signatureTargetId);
    }
}
window.closeSignatureModal = closeSignatureModal;

// 3. Fechamento de Carga & Acerto de Viagem
function renderCargoStockInputs() {
    const container = document.getElementById("cargo-stock-inputs");
    if (!container) return;
    
    const activeProds = state.products.filter(p => p.active && (p.type === 'Gelo' || p.type === 'Carvão' || p.type === 'Gelo Saborizado'));
    container.innerHTML = "";
    
    if (activeProds.length === 0) {
        container.innerHTML = `<p style="color: var(--color-text-muted); font-size: 0.8rem;">Nenhum produto ativo cadastrado.</p>`;
        return;
    }
    
    activeProds.forEach(p => {
        container.innerHTML += `
            <div style="border-bottom: 1px solid rgba(255,255,255,0.03); padding-bottom: 8px; margin-bottom: 8px;">
                <h4 style="font-size: 0.85rem; color: #fff; margin-bottom: 4px;">${p.name}</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px;">
                    <div>
                        <label style="font-size: 0.7rem; color: var(--color-text-muted);">Saída (Fardos)</label>
                        <input type="number" min="0" id="cargo-out-${p.id}" class="form-control" style="padding: 4px 8px; font-size: 0.8rem;" value="0" oninput="calculateCargoSettlement()">
                    </div>
                    <div>
                        <label style="font-size: 0.7rem; color: var(--color-text-muted);">Retorno (Fardos)</label>
                        <input type="number" min="0" id="cargo-return-${p.id}" class="form-control" style="padding: 4px 8px; font-size: 0.8rem;" value="0" oninput="calculateCargoSettlement()">
                    </div>
                    <div>
                        <label style="font-size: 0.7rem; color: var(--color-text-muted);">Vendas (Hoje)</label>
                        <input type="number" min="0" id="cargo-sales-${p.id}" class="form-control" style="padding: 4px 8px; font-size: 0.8rem; background: rgba(0,0,0,0.2); color: #fff;" value="0" readonly>
                    </div>
                </div>
            </div>
        `;
    });
}
window.renderCargoStockInputs = renderCargoStockInputs;

function loadTodaySalesData() {
    const todayStr = new Date().toISOString().split('T')[0];
    const activeProds = state.products.filter(p => p.active && (p.type === 'Gelo' || p.type === 'Carvão' || p.type === 'Gelo Saborizado'));
    
    const salesMap = {};
    activeProds.forEach(p => {
        salesMap[p.id] = 0;
    });
    
    // 1. Somar de state.deliveries
    state.deliveries.forEach(del => {
        if (del.date.startsWith(todayStr)) {
            activeProds.forEach(p => {
                const qtyFardos = del.items[p.id] || 0;
                salesMap[p.id] += qtyFardos;
            });
        }
    });
    
    // 2. Somar de state.documents (tipo "recibo" ou "nota")
    state.documents.forEach(doc => {
        if ((doc.type === "recibo" || doc.type === "nota") && doc.date === todayStr) {
            doc.items.forEach(it => {
                const prod = activeProds.find(p => p.name === it.name);
                if (prod) {
                    salesMap[prod.id] += it.qty;
                }
            });
        }
    });
    
    activeProds.forEach(p => {
        const input = document.getElementById(`cargo-sales-${p.id}`);
        if (input) {
            input.value = salesMap[p.id];
        }
    });
    
    // Estimar faturamento recebido hoje por meio de pagamento
    let totalCash = 0;
    let totalPix = 0;
    let totalCard = 0;
    
    state.deliveries.forEach(del => {
        if (del.date.startsWith(todayStr)) {
            totalPix += del.revenue;
        }
    });
    
    state.documents.forEach(doc => {
        if ((doc.type === "recibo" || doc.type === "nota") && doc.date === todayStr) {
            const method = (doc.paymentMethod || "").toLowerCase();
            if (method.includes("dinheiro")) {
                totalCash += doc.total;
            } else if (method.includes("pix")) {
                totalPix += doc.total;
            } else if (method.includes("cartão") || method.includes("cartao") || method.includes("crédito") || method.includes("débito")) {
                totalCard += doc.total;
            } else {
                totalCash += doc.total;
            }
        }
    });
    
    document.getElementById("settle-cash-received").value = totalCash.toFixed(2);
    document.getElementById("settle-pix-received").value = totalPix.toFixed(2);
    document.getElementById("settle-card-received").value = totalCard.toFixed(2);
    
    calculateCargoSettlement();
    alert("Dados de vendas de hoje carregados com sucesso!");
}
window.loadTodaySalesData = loadTodaySalesData;

function calculateCargoSettlement() {
    const resultsDiv = document.getElementById("cargo-settlement-results");
    if (!resultsDiv) return;
    
    const activeProds = state.products.filter(p => p.active && (p.type === 'Gelo' || p.type === 'Carvão' || p.type === 'Gelo Saborizado'));
    
    let stockDivergenceHTML = "";
    let totalExpectedRevenue = 0;
    let hasDivergence = false;
    let totalFardosSold = 0;
    
    activeProds.forEach(p => {
        const outQty = parseInt(document.getElementById(`cargo-out-${p.id}`).value) || 0;
        const returnQty = parseInt(document.getElementById(`cargo-return-${p.id}`).value) || 0;
        const salesQty = parseInt(document.getElementById(`cargo-sales-${p.id}`).value) || 0;
        
        const theoreticalReturn = outQty - salesQty;
        const diff = returnQty - theoreticalReturn;
        
        const price = p.defaultPrice || 0;
        const soldQty = outQty - returnQty;
        totalFardosSold += Math.max(0, soldQty);
        const expectedRevenue = Math.max(0, soldQty) * price;
        totalExpectedRevenue += expectedRevenue;
        
        let diffClass = "color: var(--color-success);";
        let diffSign = "";
        if (diff < 0) {
            diffClass = "color: var(--color-danger);";
            diffSign = "";
            hasDivergence = true;
        } else if (diff > 0) {
            diffClass = "color: var(--color-primary);";
            diffSign = "+";
            hasDivergence = true;
        }
        
        stockDivergenceHTML += `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);">
                <td style="padding: 6px 0; font-size: 0.8rem; color: #fff;">${p.name}</td>
                <td style="padding: 6px 0; font-size: 0.8rem; text-align: center;">${outQty}</td>
                <td style="padding: 6px 0; font-size: 0.8rem; text-align: center;">${salesQty}</td>
                <td style="padding: 6px 0; font-size: 0.8rem; text-align: center;">${returnQty}</td>
                <td style="padding: 6px 0; font-size: 0.8rem; text-align: center; ${diffClass} font-weight: bold;">${diffSign}${diff}</td>
            </tr>
        `;
    });
    
    const cashReceived = parseFloat(document.getElementById("settle-cash-received").value) || 0;
    const pixReceived = parseFloat(document.getElementById("settle-pix-received").value) || 0;
    const cardReceived = parseFloat(document.getElementById("settle-card-received").value) || 0;
    
    const totalReceived = cashReceived + pixReceived + cardReceived;
    
    const todayStr = new Date().toISOString().split('T')[0];
    let actualRegisteredRevenue = 0;
    state.deliveries.forEach(del => {
        if (del.date.startsWith(todayStr)) {
            actualRegisteredRevenue += del.revenue;
        }
    });
    state.documents.forEach(doc => {
        if ((doc.type === "recibo" || doc.type === "nota") && doc.date === todayStr) {
            actualRegisteredRevenue += doc.total;
        }
    });
    
    const financialDiff = totalReceived - actualRegisteredRevenue;
    let financialDiffClass = "color: var(--color-success);";
    let financialSign = "";
    if (financialDiff < 0) {
        financialDiffClass = "color: var(--color-danger);";
        financialSign = "";
    } else if (financialDiff > 0) {
        financialDiffClass = "color: var(--color-primary);";
        financialSign = "+";
    }
    
    // Cálculo da comissão
    let commissionEarned = 0;
    let commissionHTML = "";
    if (state.commissionSettings && state.commissionSettings.type !== "none") {
        const comType = state.commissionSettings.type;
        const comVal = state.commissionSettings.value || 0;
        if (comType === "fixed") {
            commissionEarned = totalFardosSold * comVal;
        } else if (comType === "percentage") {
            commissionEarned = actualRegisteredRevenue * (comVal / 100);
        }
        
        commissionHTML = `
            <div>
                <span style="font-size: 0.75rem; color: var(--color-text-muted); display: block;">Comissão do Motorista (${comType === "fixed" ? "Fixo" : "Percentual"}):</span>
                <strong style="font-size: 1.1rem; color: var(--color-primary);">R$ ${commissionEarned.toFixed(2).replace(".", ",")}</strong>
            </div>
        `;
    }

    // Novos cálculos de Despesas e Odômetro
    const kmInitial = parseInt(document.getElementById("settle-km-initial").value) || 0;
    const kmFinal = parseInt(document.getElementById("settle-km-final").value) || 0;
    const expFuel = parseFloat(document.getElementById("settle-exp-fuel").value) || 0;
    const expMeal = parseFloat(document.getElementById("settle-exp-meal").value) || 0;
    const expOthers = parseFloat(document.getElementById("settle-exp-others").value) || 0;
    
    const kmDriven = Math.max(0, kmFinal - kmInitial);
    const totalExpenses = expFuel + expMeal + expOthers;
    const costPerKm = kmDriven > 0 ? totalExpenses / kmDriven : 0;
    const netTravelProfit = totalReceived - totalExpenses - commissionEarned;
    
    resultsDiv.style.display = "block";
    resultsDiv.innerHTML = `
        <h3 style="font-size: 0.95rem; font-weight: 700; color: var(--color-primary); margin-bottom: 1rem; display: flex; align-items: center; gap: 6px;">
            <i data-lucide="file-text" style="width: 16px; height: 16px;"></i> Resultado da Auditoria
        </h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 1rem;">
            <thead>
                <tr style="border-bottom: 1.5px solid rgba(255,255,255,0.1); color: var(--color-text-muted); font-size: 0.75rem;">
                    <th style="padding: 6px 0; text-align: left;">Produto</th>
                    <th style="padding: 6px 0; text-align: center; width: 60px;">Saída</th>
                    <th style="padding: 6px 0; text-align: center; width: 60px;">Vendas</th>
                    <th style="padding: 6px 0; text-align: center; width: 60px;">Retorno</th>
                    <th style="padding: 6px 0; text-align: center; width: 60px;">Diverg.</th>
                </tr>
            </thead>
            <tbody>
                ${stockDivergenceHTML}
            </tbody>
        </table>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 1rem;">
            <div>
                <span style="font-size: 0.75rem; color: var(--color-text-muted); display: block;">Faturamento Registrado no App:</span>
                <strong style="font-size: 1rem; color: #fff;">R$ ${actualRegisteredRevenue.toFixed(2).replace(".", ",")}</strong>
            </div>
            <div>
                <span style="font-size: 0.75rem; color: var(--color-text-muted); display: block;">Faturamento Entregue (Caixa):</span>
                <strong style="font-size: 1rem; color: #fff;">R$ ${totalReceived.toFixed(2).replace(".", ",")}</strong>
            </div>
            <div>
                <span style="font-size: 0.75rem; color: var(--color-text-muted); display: block;">Saldo do Acerto:</span>
                <strong style="font-size: 1.1rem; ${financialDiffClass}">${financialSign}R$ ${financialDiff.toFixed(2).replace(".", ",")}</strong>
            </div>
            ${commissionHTML}
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 1rem; margin-top: 1rem;">
            <div>
                <span style="font-size: 0.75rem; color: var(--color-text-muted); display: block;">KM Rodados:</span>
                <strong style="font-size: 1rem; color: #fff;">${kmDriven} km</strong>
            </div>
            <div>
                <span style="font-size: 0.75rem; color: var(--color-text-muted); display: block;">Despesas de Viagem:</span>
                <strong style="font-size: 1rem; color: #ff6464;">R$ ${totalExpenses.toFixed(2).replace(".", ",")}</strong>
            </div>
            <div>
                <span style="font-size: 0.75rem; color: var(--color-text-muted); display: block;">Custo por KM:</span>
                <strong style="font-size: 1rem; color: #fff;">R$ ${costPerKm.toFixed(2).replace(".", ",")} / km</strong>
            </div>
            <div>
                <span style="font-size: 0.75rem; color: var(--color-text-muted); display: block;">Lucro Líquido Viagem:</span>
                <strong style="font-size: 1.1rem; color: #00ff64;">R$ ${netTravelProfit.toFixed(2).replace(".", ",")}</strong>
            </div>
        </div>
        
        <div style="margin-top: 1rem; padding: 0.75rem; border-radius: 6px; font-size: 0.75rem; line-height: 1.4; background: ${financialDiff === 0 && !hasDivergence ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'}; border: 1px solid ${financialDiff === 0 && !hasDivergence ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}; color: ${financialDiff === 0 && !hasDivergence ? 'var(--color-success)' : '#ff9999'};">
            ${financialDiff === 0 && !hasDivergence 
                ? "<strong>Tudo certo!</strong> O estoque e o caixa batem perfeitamente com os registros do aplicativo." 
                : `<strong>Atenção!</strong> Foram encontradas divergências. ${hasDivergence ? 'Verifique a contagem de estoque físico do caminhão.' : ''} ${financialDiff !== 0 ? 'Verifique os comprovantes e o dinheiro em espécie com o motorista.' : ''}`}
        </div>

        <div style="margin-top: 1.5rem; text-align: right; display: flex; justify-content: flex-end; gap: 8px;">
            <button type="button" class="btn btn-primary" onclick="saveCargoSettlement()" style="font-size: 0.85rem; padding: 8px 16px; display: inline-flex; align-items: center; gap: 6px;">
                <i data-lucide="check-circle" style="width: 16px; height: 16px;"></i> Salvar e Fechar Acerto
            </button>
        </div>
    `;
    
    lucide.createIcons();
}
window.calculateCargoSettlement = calculateCargoSettlement;

function saveCargoSettlement() {
    const cashReceived = parseFloat(document.getElementById("settle-cash-received").value) || 0;
    const pixReceived = parseFloat(document.getElementById("settle-pix-received").value) || 0;
    const cardReceived = parseFloat(document.getElementById("settle-card-received").value) || 0;
    const totalReceived = cashReceived + pixReceived + cardReceived;

    const kmInitial = parseInt(document.getElementById("settle-km-initial").value) || 0;
    const kmFinal = parseInt(document.getElementById("settle-km-final").value) || 0;
    const expFuel = parseFloat(document.getElementById("settle-exp-fuel").value) || 0;
    const expMeal = parseFloat(document.getElementById("settle-exp-meal").value) || 0;
    const expOthers = parseFloat(document.getElementById("settle-exp-others").value) || 0;

    const kmDriven = Math.max(0, kmFinal - kmInitial);
    const totalExpenses = expFuel + expMeal + expOthers;

    // Recalcular comissão
    let totalFardosSold = 0;
    const activeProds = state.products.filter(p => p.active && (p.type === 'Gelo' || p.type === 'Carvão' || p.type === 'Gelo Saborizado'));
    
    // Obter divergências e estoques do caminhão
    const cargoDetails = [];
    activeProds.forEach(p => {
        const outQty = parseInt(document.getElementById(`cargo-out-${p.id}`).value) || 0;
        const returnQty = parseInt(document.getElementById(`cargo-return-${p.id}`).value) || 0;
        const salesQty = parseInt(document.getElementById(`cargo-sales-${p.id}`).value) || 0;
        const soldQty = Math.max(0, outQty - returnQty);
        totalFardosSold += soldQty;

        const theoreticalReturn = outQty - salesQty;
        const diff = returnQty - theoreticalReturn;

        cargoDetails.push({
            productId: p.id,
            productName: p.name,
            outQty,
            salesQty,
            returnQty,
            diff
        });
    });

    const todayStr = new Date().toISOString().split('T')[0];
    let actualRegisteredRevenue = 0;
    state.deliveries.forEach(del => {
        if (del.date.startsWith(todayStr)) {
            actualRegisteredRevenue += del.revenue;
        }
    });
    state.documents.forEach(doc => {
        if ((doc.type === "recibo" || doc.type === "nota") && doc.date === todayStr) {
            actualRegisteredRevenue += doc.total;
        }
    });

    let commissionEarned = 0;
    if (state.commissionSettings && state.commissionSettings.type !== "none") {
        const comType = state.commissionSettings.type;
        const comVal = state.commissionSettings.value || 0;
        if (comType === "fixed") {
            commissionEarned = totalFardosSold * comVal;
        } else if (comType === "percentage") {
            commissionEarned = actualRegisteredRevenue * (comVal / 100);
        }
    }

    const financialDiff = totalReceived - actualRegisteredRevenue;

    const settlement = {
        id: "settle_" + Date.now(),
        date: new Date().toISOString(),
        kmInitial,
        kmFinal,
        kmDriven,
        expenses: {
            fuel: expFuel,
            meal: expMeal,
            others: expOthers,
            total: totalExpenses
        },
        financials: {
            cash: cashReceived,
            pix: pixReceived,
            card: cardReceived,
            totalReceived,
            expectedRevenue: actualRegisteredRevenue,
            diff: financialDiff,
            commission: commissionEarned
        },
        cargo: cargoDetails
    };

    if (!state.cargoSettlements) {
        state.cargoSettlements = [];
    }
    state.cargoSettlements.push(settlement);

    // Limpar os campos do formulário
    document.getElementById("settle-cash-received").value = "0.00";
    document.getElementById("settle-pix-received").value = "0.00";
    document.getElementById("settle-card-received").value = "0.00";
    document.getElementById("settle-km-initial").value = "0";
    document.getElementById("settle-km-final").value = "0";
    document.getElementById("settle-exp-fuel").value = "0.00";
    document.getElementById("settle-exp-meal").value = "0.00";
    document.getElementById("settle-exp-others").value = "0.00";

    // Limpar campos de estoque do caminhão
    activeProds.forEach(p => {
        const outEl = document.getElementById(`cargo-out-${p.id}`);
        const returnEl = document.getElementById(`cargo-return-${p.id}`);
        const salesEl = document.getElementById(`cargo-sales-${p.id}`);
        if (outEl) outEl.value = "0";
        if (returnEl) returnEl.value = "0";
        if (salesEl) salesEl.value = "0";
    });

    saveState();
    alert("Acerto de viagem salvo com sucesso no histórico!");
    
    // Ocultar a div de resultados após limpar
    const resultsDiv = document.getElementById("cargo-settlement-results");
    if (resultsDiv) resultsDiv.style.display = "none";

    renderFinancialDashboard();
    renderApp();
}
window.saveCargoSettlement = saveCargoSettlement;

// 4. Painel Financeiro & Previsão de Demanda
function calculateProductPackagingCost(productId, qtyFardos, qtyUnits = 0) {
    const product = state.products.find(p => p.id === productId);
    if (!product) return 0;
    
    const linkedPacks = (state.packaging || []).filter(pkg => pkg.productId === productId);
    if (linkedPacks.length === 0) return 0;
    
    const unitsPerPack = product.unitsPerPack || 12;
    const deduction = qtyFardos + (qtyUnits / unitsPerPack);
    
    let cost = 0;
    linkedPacks.forEach(pkg => {
        cost += (parseFloat(pkg.costPrice) || 0) * deduction;
    });
    return cost;
}
window.calculateProductPackagingCost = calculateProductPackagingCost;

// 4. Painel Financeiro & Previsão de Demanda
function renderFinancialDashboard() {
    const todayStr = new Date().toISOString().split('T')[0];
    const currentMonthStr = new Date().toISOString().substring(0, 7);
    
    let revToday = 0;
    let revMonth = 0;
    
    let cashMonth = 0;
    let pixMonth = 0;
    let cardMonth = 0;
    
    let packagingCostMonth = 0;
    
    const productSalesCount = {};
    const activeProds = state.products.filter(p => p.active && (p.type === 'Gelo' || p.type === 'Carvão' || p.type === 'Gelo Saborizado'));
    
    // 1. Somar de state.deliveries
    state.deliveries.forEach(del => {
        const delDateStr = del.date.split('T')[0];
        const delMonthStr = del.date.substring(0, 7);
        
        if (delDateStr === todayStr) {
            revToday += del.revenue;
        }
        if (delMonthStr === currentMonthStr) {
            revMonth += del.revenue;
            pixMonth += del.revenue; // Assumido Pix para entregas da fila
            
            activeProds.forEach(p => {
                const qtyFardos = del.items[p.id] || 0;
                const qtyUnits = del.items[p.id + "_unit"] || 0;
                if (qtyFardos > 0 || qtyUnits > 0) {
                    const totalQty = qtyFardos + (qtyUnits / (p.unitsPerPack || 12));
                    productSalesCount[p.name] = (productSalesCount[p.name] || 0) + totalQty;
                }
                
                // Calcular custo de embalagens
                packagingCostMonth += calculateProductPackagingCost(p.id, qtyFardos, qtyUnits);
            });
        }
    });
    
    // 2. Somar de state.documents
    state.documents.forEach(doc => {
        if (doc.type === "recibo" || doc.type === "nota") {
            if (doc.date === todayStr) {
                revToday += doc.total;
            }
            if (doc.date.startsWith(currentMonthStr)) {
                revMonth += doc.total;
                
                const method = (doc.paymentMethod || "").toLowerCase();
                if (method.includes("dinheiro")) {
                    cashMonth += doc.total;
                } else if (method.includes("pix")) {
                    pixMonth += doc.total;
                } else if (method.includes("cartão") || method.includes("cartao") || method.includes("crédito") || method.includes("débito")) {
                    cardMonth += doc.total;
                } else {
                    cashMonth += doc.total;
                }
                
                if (doc.items) {
                    doc.items.forEach(it => {
                        productSalesCount[it.name] = (productSalesCount[it.name] || 0) + it.qty;
                        
                        const prod = activeProds.find(p => p.name === it.name);
                        if (prod) {
                            const productId = it.prodId ? it.prodId.replace("_unit", "") : prod.id;
                            const isUnit = it.prodId ? it.prodId.endsWith("_unit") : false;
                            const qtyFardos = isUnit ? 0 : it.qty;
                            const qtyUnits = isUnit ? it.qty : 0;
                            packagingCostMonth += calculateProductPackagingCost(productId, qtyFardos, qtyUnits);
                        }
                    });
                }
            }
        }
    });
    
    // 3. Somar despesas operacionais do mês a partir do histórico de acertos
    let logisticsCostMonth = 0;
    if (state.cargoSettlements) {
        state.cargoSettlements.forEach(settle => {
            if (settle.date && settle.date.substring(0, 7) === currentMonthStr) {
                const expensesTotal = settle.expenses ? (settle.expenses.total || 0) : 0;
                const commission = settle.financials ? (settle.financials.commission || 0) : 0;
                logisticsCostMonth += expensesTotal + commission;
            }
        });
    }
    
    // 4. Calcular Lucro Líquido Real (Mês)
    const realProfitMonth = revMonth - packagingCostMonth - logisticsCostMonth;
    
    // Atualizar os KPIs na tela
    const kpiRevenueToday = document.getElementById("admin-kpi-revenue-today");
    if (kpiRevenueToday) kpiRevenueToday.innerText = `R$ ${revToday.toFixed(2).replace(".", ",")}`;
    
    const kpiRevenueMonth = document.getElementById("admin-kpi-revenue-month");
    if (kpiRevenueMonth) kpiRevenueMonth.innerText = `R$ ${revMonth.toFixed(2).replace(".", ",")}`;
    
    const kpiPackagingCost = document.getElementById("admin-kpi-packaging-cost");
    if (kpiPackagingCost) kpiPackagingCost.innerText = `R$ ${packagingCostMonth.toFixed(2).replace(".", ",")}`;
    
    const kpiLogisticsCost = document.getElementById("admin-kpi-logistics-cost");
    if (kpiLogisticsCost) kpiLogisticsCost.innerText = `R$ ${logisticsCostMonth.toFixed(2).replace(".", ",")}`;
    
    const kpiRealProfit = document.getElementById("admin-kpi-real-profit");
    if (kpiRealProfit) {
        kpiRealProfit.innerText = `R$ ${realProfitMonth.toFixed(2).replace(".", ",")}`;
        if (realProfitMonth >= 0) {
            kpiRealProfit.style.color = "#00ff64"; // Verde neon para lucro positivo
        } else {
            kpiRealProfit.style.color = "#ff4d4d"; // Vermelho neon para prejuízo
        }
    }
    
    const kpiPaymentSplit = document.getElementById("admin-kpi-payment-split");
    if (kpiPaymentSplit) {
        kpiPaymentSplit.innerHTML = `
            Dinheiro: R$ ${cashMonth.toFixed(2).replace(".", ",")}<br>
            Pix: R$ ${pixMonth.toFixed(2).replace(".", ",")}<br>
            Cartão: R$ ${cardMonth.toFixed(2).replace(".", ",")}
        `;
    }
    
    const kpiTopProducts = document.getElementById("admin-kpi-top-products");
    if (kpiTopProducts) {
        const sortedProds = Object.entries(productSalesCount).sort((a, b) => b[1] - a[1]);
        const topProdsHTML = sortedProds.length > 0
            ? sortedProds.slice(0, 3).map(([name, qty]) => `${name}: ${Math.round(qty)} fardos`).join("<br>")
            : "Nenhum dado de venda";
        kpiTopProducts.innerHTML = topProdsHTML;
    }
    
    calculateDemandForecast();
    lucide.createIcons();
}
window.renderFinancialDashboard = renderFinancialDashboard;

function updateSimulatedTempLabel(val) {
    const el = document.getElementById("simulated-temp-val");
    if (el) el.innerText = val + "°C";
}
window.updateSimulatedTempLabel = updateSimulatedTempLabel;

function calculateDemandForecast() {
    const resultsContainer = document.getElementById("demand-forecast-results");
    if (!resultsContainer) return;
    
    const slider = document.getElementById("simulated-temp-range");
    const temp = slider ? (parseInt(slider.value) || 30) : 30;
    
    let factor = 1.0;
    if (temp >= 25) {
        factor = 1.0 + (temp - 25) * 0.08;
    } else {
        factor = 1.0 + (temp - 25) * 0.05;
        factor = Math.max(0.1, factor);
    }
    
    const activeProds = state.products.filter(p => p.active && (p.type === 'Gelo' || p.type === 'Carvão' || p.type === 'Gelo Saborizado'));
    resultsContainer.innerHTML = "";
    
    if (activeProds.length === 0) {
        resultsContainer.innerHTML = `<p style="color: var(--color-text-muted); font-size: 0.8rem; grid-column: span 3;">Nenhum produto cadastrado para previsão.</p>`;
        return;
    }
    
    activeProds.forEach(p => {
        let baseline = 30;
        if (p.name.includes("5kg") || p.name.includes("5 kg")) {
            baseline = 50;
        } else if (p.name.includes("20kg") || p.name.includes("20 kg")) {
            baseline = 20;
        } else if (p.type === "Gelo Saborizado") {
            baseline = 15;
        }
        
        const forecastQty = Math.round(baseline * factor);
        
        let alertColor = "var(--color-primary)";
        let alertText = "Demanda Normal";
        if (temp >= 35) {
            alertColor = "var(--color-danger)";
            alertText = "Crítica (Muito Alta)";
        } else if (temp >= 30) {
            alertColor = "#ff9900";
            alertText = "Alta";
        } else if (temp < 20) {
            alertColor = "#55aaee";
            alertText = "Baixa";
        }
        
        resultsContainer.innerHTML += `
            <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.05); padding: 1rem; border-radius: 8px; text-align: center;">
                <h4 style="font-size: 0.8rem; color: var(--color-text-muted); margin-bottom: 4px;">${p.name}</h4>
                <div style="font-size: 1.5rem; font-weight: bold; color: #fff; margin-bottom: 4px;">
                    ${forecastQty} <span style="font-size: 0.8rem; font-weight: normal; color: var(--color-text-muted);">fardos</span>
                </div>
                <div style="font-size: 0.7rem; color: ${alertColor}; font-weight: bold;">
                    ${alertText} (${Math.round((factor - 1) * 100)}%)
                </div>
            </div>
        `;
    });
}
window.calculateDemandForecast = calculateDemandForecast;

// ==========================================================================
// MÓDULOS DE CONTAS A RECEBER, CONFIGURAÇÃO DE COMISSÃO E SUPRIMENTOS
// ==========================================================================

// --- CONTAS A RECEBER ---
function openReceivePaymentModal(clientId) {
    const client = state.clients.find(c => c.id === clientId);
    if (!client) return;

    document.getElementById("payment-client-id").value = client.id;
    document.getElementById("payment-client-name").innerText = client.name;
    
    recalculateClientDebts();
    document.getElementById("payment-client-debt").innerText = "R$ " + (client.outstandingDebt || 0).toFixed(2).replace(".", ",");
    document.getElementById("payment-amount").value = "";
    document.getElementById("payment-amount").max = client.outstandingDebt > 0 ? client.outstandingDebt : "";
    document.getElementById("payment-method").value = "Dinheiro";

    document.getElementById("modal-receive-payment").classList.add("active");
}
window.openReceivePaymentModal = openReceivePaymentModal;

function processReceivePayment(event) {
    if (event) event.preventDefault();
    
    const submitBtn = event.target.querySelector('button[type="submit"]');
    let oldBtnHTML = "";
    if (submitBtn) {
        oldBtnHTML = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="loading-spinner"></span> Obtendo GPS...';
    }
    
    getGPSLocation((gps) => {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = oldBtnHTML;
        }
        
        const clientId = document.getElementById("payment-client-id").value;
        const amount = parseFloat(document.getElementById("payment-amount").value) || 0;
        const method = document.getElementById("payment-method").value;
        
        const client = state.clients.find(c => c.id === clientId);
        if (!client) {
            alert("Cliente não encontrado.");
            return;
        }
        
        const payment = {
            id: "pay-" + Date.now(),
            clientId: clientId,
            clientName: client.name,
            amount: amount,
            paymentMethod: method,
            date: new Date().toISOString(),
            gps: gps
        };
        
        state.payments.push(payment);
        saveState();
        renderApp();
        closeModal('modal-receive-payment');
    });
}
window.processReceivePayment = processReceivePayment;

function renderAccountsReceivable() {
    const debtorsTableBody = document.getElementById("debtors-table-body");
    if (debtorsTableBody) {
        debtorsTableBody.innerHTML = "";
        recalculateClientDebts();
        
        const debtors = state.clients.filter(c => c.outstandingDebt > 0);
        
        if (debtors.length === 0) {
            debtorsTableBody.innerHTML = `
                <tr>
                    <td colspan="4" style="padding: 1.5rem; text-align: center; color: var(--color-text-muted);">
                        Nenhum cliente com saldo devedor pendente.
                    </td>
                </tr>
            `;
        } else {
            debtors.forEach(c => {
                debtorsTableBody.innerHTML += `
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);">
                        <td style="padding: 10px; font-weight: 600; color: #fff;">${c.name}</td>
                        <td style="padding: 10px; color: var(--color-text-muted);">${c.phone || 'Sem telefone'}</td>
                        <td style="padding: 10px; text-align: right; color: var(--color-danger); font-weight: 700;">R$ ${c.outstandingDebt.toFixed(2).replace(".", ",")}</td>
                        <td style="padding: 10px; text-align: center;">
                            <div style="display: inline-flex; gap: 6px;">
                                <button type="button" class="btn btn-primary" onclick="openReceivePaymentModal('${c.id}')" style="font-size: 0.75rem; padding: 4px 8px; height: auto; display: inline-flex; align-items: center; gap: 4px;">
                                    <i data-lucide="dollar-sign" style="width: 12px; height: 12px;"></i> Receber
                                </button>
                                <button type="button" class="btn" onclick="sendWhatsAppBilling('${c.id}')" style="font-size: 0.75rem; padding: 4px 8px; height: auto; display: inline-flex; align-items: center; gap: 4px; background: #25D366; border: 1px solid #25D366; color: #fff;">
                                    <i data-lucide="message-square" style="width: 12px; height: 12px;"></i> Cobrar
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            });
        }
    }

    const paymentsHistoryTableBody = document.getElementById("payments-history-table-body");
    if (paymentsHistoryTableBody) {
        paymentsHistoryTableBody.innerHTML = "";
        const payments = state.payments || [];
        
        if (payments.length === 0) {
            paymentsHistoryTableBody.innerHTML = `
                <tr>
                    <td colspan="4" style="padding: 1.5rem; text-align: center; color: var(--color-text-muted);">
                        Nenhum recebimento registrado.
                    </td>
                </tr>
            `;
        } else {
            const sortedPayments = [...payments].sort((a, b) => new Date(b.date) - new Date(a.date));
            sortedPayments.forEach(p => {
                const dateFormatted = new Date(p.date).toLocaleString('pt-BR');
                
                let gpsButton = '';
                if (p.gps && p.gps.lat && p.gps.lng) {
                    gpsButton = `
                        <a href="https://www.google.com/maps/search/?api=1&query=${p.gps.lat},${p.gps.lng}" target="_blank" class="btn btn-secondary btn-icon-only" style="padding: 3px; display: inline-flex; align-items: center; justify-content: center; text-decoration: none; margin-left: 6px;" title="Ver Localização no GPS">
                            <i data-lucide="map-pin" style="width: 12px; height: 12px; color: var(--color-primary);"></i>
                        </a>
                    `;
                }
                
                paymentsHistoryTableBody.innerHTML += `
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);">
                        <td style="padding: 10px; font-size: 0.8rem; color: var(--color-text-muted);">
                            ${dateFormatted}
                            ${gpsButton}
                        </td>
                        <td style="padding: 10px; font-weight: 600; color: #fff;">${p.clientName}</td>
                        <td style="padding: 10px; color: var(--color-text-muted);">${p.paymentMethod}</td>
                        <td style="padding: 10px; text-align: right; color: var(--color-success); font-weight: 700;">R$ ${p.amount.toFixed(2).replace(".", ",")}</td>
                    </tr>
                `;
            });
        }
    }
}
window.renderAccountsReceivable = renderAccountsReceivable;

// --- CONFIGURAÇÃO E CÁLCULO DE COMISSÃO ---
function saveCommissionSettings(event) {
    if (event) event.preventDefault();
    const type = document.getElementById("commission-type").value;
    const value = parseFloat(document.getElementById("commission-value").value) || 0;
    
    state.commissionSettings = { type, value };
    saveState();
    alert("Configuração de comissão salva com sucesso!");
    renderApp();
}
window.saveCommissionSettings = saveCommissionSettings;

function toggleCommissionValueLabel() {
    const type = document.getElementById("commission-type").value;
    const group = document.getElementById("commission-value-group");
    const label = document.getElementById("commission-value-label");
    const valInput = document.getElementById("commission-value");
    
    if (type === "none") {
        if (group) group.style.display = "none";
        if (valInput) valInput.required = false;
    } else {
        if (group) group.style.display = "block";
        if (valInput) valInput.required = true;
        if (label) {
            if (type === "fixed") {
                label.innerText = "Valor Fixo por Fardo (R$) *";
                if (valInput) valInput.placeholder = "Ex: 1.50";
            } else if (type === "percentage") {
                label.innerText = "Percentual da Comissão (%) *";
                if (valInput) valInput.placeholder = "Ex: 5.00";
            }
        }
    }
}
window.toggleCommissionValueLabel = toggleCommissionValueLabel;

function sendWhatsAppBilling(clientId) {
    const client = state.clients.find(c => c.id === clientId);
    if (!client) {
        alert("Cliente não encontrado.");
        return;
    }
    if (!client.phone) {
        alert("Este cliente não possui telefone cadastrado.");
        return;
    }
    
    // Sanitizar telefone (manter apenas números)
    let phoneDigits = client.phone.replace(/\D/g, "");
    if (phoneDigits.length === 0) {
        alert("O telefone cadastrado é inválido.");
        return;
    }
    
    // Se não tiver o DDI do Brasil (55), e tiver 10 ou 11 dígitos, adicionar
    if (phoneDigits.length === 10 || phoneDigits.length === 11) {
        phoneDigits = "55" + phoneDigits;
    }
    
    const formattedDebt = client.outstandingDebt.toFixed(2).replace(".", ",");
    const companyName = FACTORY_INFO.name;
    const pixKey = FACTORY_INFO.pixKey;
    
    let msg = `Olá, *${client.name}*!\n\nPassando para lembrar que você possui um saldo em aberto com a *${companyName}* no valor de *R$ ${formattedDebt}*.\n`;
    if (pixKey) {
        msg += `Para sua comodidade, você pode efetuar o pagamento via Pix utilizando a chave:\n👉 *${pixKey}*\n\n`;
    } else {
        msg += `Por favor, entre em contato para alinharmos a forma de pagamento.\n\n`;
    }
    msg += `Agradecemos pela parceria! Qualquer dúvida, estamos à disposição.`;
    
    const url = `https://api.whatsapp.com/send?phone=${phoneDigits}&text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
}
window.sendWhatsAppBilling = sendWhatsAppBilling;

// --- GESTÃO DE FORNECEDORES ---
function openSupplierModal(supplierId = null) {
    const form = document.getElementById("supplier-form");
    if (form) form.reset();
    document.getElementById("form-supplier-id").value = "";
    document.getElementById("supplier-modal-title").innerText = "Novo Fornecedor";
    
    if (supplierId) {
        document.getElementById("supplier-modal-title").innerText = "Editar Fornecedor";
        const s = state.suppliers.find(item => item.id === supplierId);
        if (s) {
            document.getElementById("form-supplier-id").value = s.id;
            document.getElementById("supplier-name").value = s.name;
            document.getElementById("supplier-contact").value = s.contact || "";
            document.getElementById("supplier-cnpj-cpf").value = s.cnpjCpf || "";
            document.getElementById("supplier-address").value = s.address || "";
        }
    }
    
    document.getElementById("modal-supplier").classList.add("active");
}
window.openSupplierModal = openSupplierModal;

function saveSupplier(event) {
    if (event) event.preventDefault();
    const id = document.getElementById("form-supplier-id").value;
    const name = document.getElementById("supplier-name").value.trim();
    const contact = document.getElementById("supplier-contact").value.trim();
    const cnpjCpf = document.getElementById("supplier-cnpj-cpf").value.trim();
    const address = document.getElementById("supplier-address").value.trim();
    
    if (!name) {
        alert("O nome do fornecedor é obrigatório.");
        return;
    }
    
    if (id) {
        const idx = state.suppliers.findIndex(s => s.id === id);
        if (idx !== -1) {
            state.suppliers[idx] = {
                ...state.suppliers[idx],
                name, contact, cnpjCpf: cnpjCpf, address
            };
        }
    } else {
        const newSup = {
            id: "sup-" + Date.now(),
            name, contact, cnpjCpf: cnpjCpf, address
        };
        state.suppliers.push(newSup);
    }
    
    saveState();
    closeModal("modal-supplier");
    renderApp();
}
window.saveSupplier = saveSupplier;

function deleteSupplier(supplierId) {
    const s = state.suppliers.find(item => item.id === supplierId);
    if (!s) return;
    
    const linkedPacks = state.packaging.filter(pkg => pkg.supplierId === supplierId);
    if (linkedPacks.length > 0) {
        alert(`Não é possível excluir o fornecedor "${s.name}" pois ele possui embalagens vinculadas.`);
        return;
    }
    
    if (confirm(`Deseja realmente excluir o fornecedor "${s.name}"?`)) {
        state.suppliers = state.suppliers.filter(item => item.id !== supplierId);
        saveState();
        renderApp();
    }
}
window.deleteSupplier = deleteSupplier;

function renderSuppliers() {
    const tableBody = document.getElementById("suppliers-table-body");
    if (!tableBody) return;
    tableBody.innerHTML = "";
    
    const suppliers = state.suppliers || [];
    if (suppliers.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" style="padding: 1.5rem; text-align: center; color: var(--color-text-muted);">
                    Nenhum fornecedor cadastrado.
                </td>
            </tr>
        `;
        return;
    }
    
    suppliers.forEach(s => {
        tableBody.innerHTML += `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);">
                <td style="padding: 10px; font-weight: 600; color: #fff;">${s.name}</td>
                <td style="padding: 10px; color: var(--color-text-main);">${s.contact || 'Sem contato'}</td>
                <td style="padding: 10px; color: var(--color-text-muted);">${s.cnpjCpf || 'Sem documento'}</td>
                <td style="padding: 10px; color: var(--color-text-muted);">${s.address || 'Sem endereço'}</td>
                <td style="padding: 10px; text-align: center;">
                    <div style="display: inline-flex; gap: 6px; justify-content: center;">
                        <button type="button" class="btn btn-primary" onclick="openSupplierModal('${s.id}')" style="padding: 4px 8px; font-size: 0.75rem; display: inline-flex; align-items: center; gap: 4px;">
                            <i data-lucide="edit-3" style="width: 12px; height: 12px;"></i> Editar
                        </button>
                        <button type="button" class="btn btn-secondary" onclick="deleteSupplier('${s.id}')" style="padding: 4px 8px; font-size: 0.75rem; color: #ef4444; border-color: rgba(239, 68, 68, 0.2); background: rgba(239, 68, 68, 0.05);">
                            Excluir
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    lucide.createIcons();
}
window.renderSuppliers = renderSuppliers;

// --- GESTÃO DE EMBALAGENS E INSUMOS ---
function openPackagingModal(packagingId = null) {
    const supplierSelect = document.getElementById("pack-supplier-id");
    const productSelect = document.getElementById("pack-product-id");
    
    if (supplierSelect) {
        supplierSelect.innerHTML = '<option value="" disabled selected>Selecione um fornecedor</option>';
        if (state.suppliers && state.suppliers.length > 0) {
            state.suppliers.forEach(s => {
                supplierSelect.innerHTML += `<option value="${s.id}">${s.name}</option>`;
            });
        }
    }
    
    if (productSelect) {
        productSelect.innerHTML = '<option value="">Não vinculado a produto (Avulso)</option>';
        if (state.products && state.products.length > 0) {
            state.products.forEach(p => {
                if (p.active) {
                    productSelect.innerHTML += `<option value="${p.id}">${p.name}</option>`;
                }
            });
        }
    }
    
    const form = document.getElementById("packaging-form");
    if (form) form.reset();
    document.getElementById("form-packaging-id").value = "";
    document.getElementById("packaging-modal-title").innerText = "Nova Embalagem / Insumo";
    
    const initialStockGroup = document.getElementById("group-pack-initial-stock");
    const initialStockInput = document.getElementById("pack-initial-stock");
    
    if (initialStockGroup) {
        initialStockGroup.style.display = "block";
        if (initialStockInput) initialStockInput.required = true;
    }
    
    if (packagingId) {
        document.getElementById("packaging-modal-title").innerText = "Editar Embalagem / Insumo";
        if (initialStockGroup) {
            initialStockGroup.style.display = "none";
            if (initialStockInput) initialStockInput.required = false;
        }
        
        const pkg = state.packaging.find(p => p.id === packagingId);
        if (pkg) {
            document.getElementById("form-packaging-id").value = pkg.id;
            document.getElementById("pack-name").value = pkg.name;
            if (supplierSelect) supplierSelect.value = pkg.supplierId || "";
            if (productSelect) productSelect.value = pkg.productId || "";
            document.getElementById("pack-cost-price").value = pkg.costPrice !== undefined ? pkg.costPrice : 0;
            document.getElementById("pack-min-stock").value = pkg.minStock !== undefined ? pkg.minStock : 100;
        }
    }
    
    document.getElementById("modal-packaging").classList.add("active");
}
window.openPackagingModal = openPackagingModal;

function savePackaging(event) {
    if (event) event.preventDefault();
    const id = document.getElementById("form-packaging-id").value;
    const name = document.getElementById("pack-name").value.trim();
    const supplierId = document.getElementById("pack-supplier-id").value;
    const productId = document.getElementById("pack-product-id").value;
    const costPrice = parseFloat(document.getElementById("pack-cost-price").value) || 0;
    const minStock = parseInt(document.getElementById("pack-min-stock").value) || 0;
    
    if (!name) {
        alert("O nome da embalagem é obrigatório.");
        return;
    }
    if (!supplierId) {
        alert("Selecione um fornecedor.");
        return;
    }
    
    if (id) {
        const idx = state.packaging.findIndex(pkg => pkg.id === id);
        if (idx !== -1) {
            state.packaging[idx] = {
                ...state.packaging[idx],
                name, supplierId, productId, costPrice, minStock
            };
        }
    } else {
        const initialStock = parseInt(document.getElementById("pack-initial-stock").value) || 0;
        const newId = "pkg-" + Date.now();
        const newPkg = {
            id: newId,
            name, supplierId, productId, costPrice, minStock,
            currentStock: initialStock
        };
        state.packaging.push(newPkg);
        
        if (initialStock > 0) {
            state.packagingTransactions.push({
                id: "tx-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
                packagingId: newId,
                packagingName: name,
                type: "entrada",
                quantity: initialStock,
                balanceAfter: initialStock,
                date: new Date().toISOString(),
                observation: "Estoque Inicial no cadastro"
            });
        }
    }
    
    saveState();
    closeModal("modal-packaging");
    renderApp();
}
window.savePackaging = savePackaging;

function deletePackaging(packagingId) {
    const pkg = state.packaging.find(p => p.id === packagingId);
    if (!pkg) return;
    
    if (confirm(`Deseja realmente excluir a embalagem "${pkg.name}"?`)) {
        state.packaging = state.packaging.filter(item => item.id !== packagingId);
        saveState();
        renderApp();
    }
}
window.deletePackaging = deletePackaging;

function renderPackaging() {
    const tableBody = document.getElementById("packaging-table-body");
    if (!tableBody) return;
    tableBody.innerHTML = "";
    
    const packaging = state.packaging || [];
    if (packaging.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" style="padding: 1.5rem; text-align: center; color: var(--color-text-muted);">
                    Nenhuma embalagem cadastrada.
                </td>
            </tr>
        `;
        return;
    }
    
    packaging.forEach(pkg => {
        const sup = state.suppliers.find(s => s.id === pkg.supplierId);
        const prod = state.products.find(p => p.id === pkg.productId);
        
        const supName = sup ? sup.name : `<span style="color: var(--color-text-muted);">Não informado</span>`;
        const prodName = prod ? prod.name : `<span style="color: var(--color-text-muted);">Sem vínculo (Avulso)</span>`;
        const isLow = (pkg.currentStock || 0) < (pkg.minStock || 0);
        
        let stockBadge = `<span style="font-weight: bold; color: #fff;">${pkg.currentStock || 0}</span>`;
        if (isLow) {
            stockBadge = `<span style="border: 1px solid rgba(239, 68, 68, 0.3); background: rgba(239, 68, 68, 0.1); color: #ef4444; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 0.75rem;" title="Abaixo do estoque mínimo!">
                ${pkg.currentStock || 0} (Crítico)
            </span>`;
        }
        
        tableBody.innerHTML += `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);">
                <td style="padding: 10px; font-weight: 600; color: #fff;">${pkg.name}</td>
                <td style="padding: 10px; color: var(--color-text-main);">${supName}</td>
                <td style="padding: 10px; color: var(--color-text-main);">${prodName}</td>
                <td style="padding: 10px; text-align: right; color: var(--color-text-main);">R$ ${(pkg.costPrice || 0).toFixed(2).replace(".", ",")}</td>
                <td style="padding: 10px; text-align: center; color: var(--color-text-muted);">${pkg.minStock || 0}</td>
                <td style="padding: 10px; text-align: center;">${stockBadge}</td>
                <td style="padding: 10px; text-align: center;">
                    <div style="display: inline-flex; gap: 6px; justify-content: center; align-items: center;">
                        <button type="button" class="btn btn-primary" onclick="openPackagingEntryModal('${pkg.id}')" style="padding: 4px 8px; font-size: 0.75rem; display: inline-flex; align-items: center; gap: 2px;">
                            <i data-lucide="plus-circle" style="width: 12px; height: 12px;"></i> Entrada
                        </button>
                        <button type="button" class="btn btn-secondary btn-icon-only" onclick="openPackagingModal('${pkg.id}')" style="padding: 4px;" title="Editar">
                            <i data-lucide="edit-3" style="width: 12px; height: 12px;"></i>
                        </button>
                        <button type="button" class="btn btn-danger btn-icon-only" onclick="deletePackaging('${pkg.id}')" style="padding: 4px;" title="Excluir">
                            <i data-lucide="trash-2" style="width: 12px; height: 12px;"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    lucide.createIcons();
}
window.renderPackaging = renderPackaging;

function openPackagingEntryModal(packagingId) {
    const pkg = state.packaging.find(p => p.id === packagingId);
    if (!pkg) return;
    
    document.getElementById("entry-packaging-id").value = pkg.id;
    document.getElementById("entry-packaging-name").innerText = pkg.name;
    document.getElementById("entry-packaging-current").innerText = pkg.currentStock || 0;
    
    document.getElementById("entry-qty").value = "";
    document.getElementById("entry-cost").value = "";
    document.getElementById("entry-obs").value = "";
    
    document.getElementById("modal-packaging-entry").classList.add("active");
}
window.openPackagingEntryModal = openPackagingEntryModal;

function savePackagingEntry(event) {
    if (event) event.preventDefault();
    const packagingId = document.getElementById("entry-packaging-id").value;
    const qty = parseInt(document.getElementById("entry-qty").value) || 0;
    const cost = parseFloat(document.getElementById("entry-cost").value) || 0;
    const obs = document.getElementById("entry-obs").value.trim();
    
    if (qty <= 0) {
        alert("A quantidade deve ser maior que zero.");
        return;
    }
    
    const pkg = state.packaging.find(p => p.id === packagingId);
    if (!pkg) {
        alert("Embalagem não encontrada.");
        return;
    }
    
    pkg.currentStock = (pkg.currentStock || 0) + qty;
    
    state.packagingTransactions.push({
        id: "tx-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
        packagingId: packagingId,
        packagingName: pkg.name,
        type: "entrada",
        quantity: qty,
        balanceAfter: pkg.currentStock,
        date: new Date().toISOString(),
        observation: obs || "Entrada manual de estoque"
    });
    
    saveState();
    closeModal("modal-packaging-entry");
    renderApp();
}
window.savePackagingEntry = savePackagingEntry;

function renderPackagingTransactions() {
    const tableBody = document.getElementById("packaging-transactions-table-body");
    if (!tableBody) return;
    tableBody.innerHTML = "";
    
    const transactions = state.packagingTransactions || [];
    if (transactions.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" style="padding: 1.5rem; text-align: center; color: var(--color-text-muted);">
                    Nenhuma movimentação de insumo registrada.
                </td>
            </tr>
        `;
        return;
    }
    
    const sortedTxs = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    sortedTxs.forEach(tx => {
        const dateFormatted = new Date(tx.date).toLocaleString('pt-BR');
        const typeBadge = tx.type === "entrada" 
            ? `<span style="border: 1px solid rgba(16, 185, 129, 0.3); background: rgba(16, 185, 129, 0.1); color: var(--color-success); padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 0.75rem;">Entrada</span>`
            : `<span style="border: 1px solid rgba(239, 68, 68, 0.3); background: rgba(239, 68, 68, 0.1); color: var(--color-danger); padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 0.75rem;">Saída</span>`;
            
        const qtyFormatted = tx.type === "entrada" ? `+${tx.quantity}` : `-${tx.quantity.toFixed(1).replace(".0", "")}`;
        const qtyColor = tx.type === "entrada" ? "var(--color-success)" : "var(--color-danger)";
        
        tableBody.innerHTML += `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);">
                <td style="padding: 8px 10px; font-size: 0.8rem; color: var(--color-text-muted);">${dateFormatted}</td>
                <td style="padding: 8px 10px; font-weight: 600; color: #fff;">${tx.packagingName}</td>
                <td style="padding: 8px 10px; text-align: center;">${typeBadge}</td>
                <td style="padding: 8px 10px; text-align: center; color: ${qtyColor}; font-weight: 700;">${qtyFormatted}</td>
                <td style="padding: 8px 10px; text-align: center; color: #fff;">${tx.balanceAfter.toFixed(1).replace(".0", "")}</td>
                <td style="padding: 8px 10px; color: var(--color-text-main); font-size: 0.8rem;">${tx.observation || ''}</td>
            </tr>
        `;
    });
}
window.renderPackagingTransactions = renderPackagingTransactions;

// --- CALCULADORA DE LOGÍSTICA DE ENTREGA ---
function toggleRentalLogisticsCalc() {
    const calcContent = document.getElementById("rental-logistics-calc-content");
    const toggleIcon = document.getElementById("logistics-toggle-icon");
    if (!calcContent) return;

    if (calcContent.style.display === "none" || calcContent.style.display === "") {
        calcContent.style.display = "block";
        toggleIcon.innerText = "▲";
        calculateRentalLogistics();
    } else {
        calcContent.style.display = "none";
        toggleIcon.innerText = "▼";
    }
}

function updateLogisticsTollMultiplier() {
    const vehicleType = document.getElementById("logistics-vehicle-type").value;
    const multInput = document.getElementById("logistics-toll-multiplier");
    if (!multInput) return;

    if (vehicleType === "passeio") {
        multInput.value = "1.0";
        multInput.disabled = true;
    } else if (vehicleType === "carretinha") {
        multInput.value = "1.5";
        multInput.disabled = true;
    } else if (vehicleType === "trucado") {
        multInput.value = "2.0";
        multInput.disabled = true;
    } else {
        multInput.disabled = false;
    }
    
    calculateRentalLogistics();
}

function calculateRentalLogistics() {
    const distance = parseFloat(document.getElementById("logistics-distance").value) || 0;
    const avgSpeed = parseFloat(document.getElementById("logistics-avg-speed").value) || 60;
    const vehicleType = document.getElementById("logistics-vehicle-type").value;
    const tollBase = parseFloat(document.getElementById("logistics-toll-base").value) || 0;
    const fuelPrice = parseFloat(document.getElementById("logistics-fuel-price").value) || 0;
    const fuelConsumption = parseFloat(document.getElementById("logistics-fuel-consumption").value) || 10;
    const markupPercent = parseFloat(document.getElementById("logistics-markup-percent").value) || 0;
    const markupFixed = parseFloat(document.getElementById("logistics-markup-fixed").value) || 0;
    const tollReturn = document.getElementById("logistics-toll-return").checked;

    let tollMultiplier = 1.0;
    if (vehicleType === "passeio") tollMultiplier = 1.0;
    else if (vehicleType === "carretinha") tollMultiplier = 1.5;
    else if (vehicleType === "trucado") tollMultiplier = 2.0;
    else {
        tollMultiplier = parseFloat(document.getElementById("logistics-toll-multiplier").value) || 1.0;
    }

    // Salvar no estado global para que sirva de default da próxima vez
    state.logisticsSettings = {
        fuelPrice,
        fuelConsumption,
        avgSpeed,
        tollBase,
        vehicleType,
        tollMultiplier,
        markupPercent,
        markupFixed,
        tollReturn
    };
    saveState();

    // Viagem Simples (Ida e Volta = 2 trechos)
    const tripDistance = distance * 2;
    const tripLiters = tripDistance / fuelConsumption;
    const tripFuelCost = tripLiters * fuelPrice;
    const tollLegs = tollReturn ? 2 : 1;
    const tripTollCost = tollBase * tollMultiplier * tollLegs;
    const tripCostPure = tripFuelCost + tripTollCost;

    // Valor sugerido por viagem
    const suggestedTripValue = (tripCostPure + markupFixed) * (1 + markupPercent / 100);

    // Operação Completa (Levar + Buscar = 4 trechos)
    const totalDistance = distance * 4;
    const totalCostSuggested = suggestedTripValue * 2;

    // Cálculo do Tempo
    const tripTimeHours = tripDistance / avgSpeed;
    const tripTotalMin = Math.round(tripTimeHours * 60);
    const tripH = Math.floor(tripTotalMin / 60);
    const tripM = tripTotalMin % 60;

    const totalTimeHours = totalDistance / avgSpeed;
    const totalTotalMin = Math.round(totalTimeHours * 60);
    const totalH = Math.floor(totalTotalMin / 60);
    const totalM = totalTotalMin % 60;

    // Atualizar HTML
    const resTripDist = document.getElementById("logistics-res-trip-distance");
    if (resTripDist) resTripDist.innerText = tripDistance.toFixed(1) + " km";
    
    const resTripTime = document.getElementById("logistics-res-trip-time");
    if (resTripTime) resTripTime.innerText = `${tripH}h ${tripM}m`;
    
    const resTripLiters = document.getElementById("logistics-res-trip-liters");
    if (resTripLiters) resTripLiters.innerText = tripLiters.toFixed(1) + " L";
    
    const resTripFuelCost = document.getElementById("logistics-res-trip-fuel-cost");
    if (resTripFuelCost) resTripFuelCost.innerText = "R$ " + tripFuelCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    
    const resTripTollCost = document.getElementById("logistics-res-trip-toll-cost");
    if (resTripTollCost) resTripTollCost.innerText = "R$ " + tripTollCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    
    const resTripCostPure = document.getElementById("logistics-res-trip-cost-pure");
    if (resTripCostPure) resTripCostPure.innerText = "R$ " + tripCostPure.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const resTotalDist = document.getElementById("logistics-res-total-distance");
    if (resTotalDist) resTotalDist.innerText = totalDistance.toFixed(1) + " km";
    
    const resTotalTime = document.getElementById("logistics-res-total-time");
    if (resTotalTime) resTotalTime.innerText = `${totalH}h ${totalM}m`;
    
    const resTotalCost = document.getElementById("logistics-res-total-cost");
    if (resTotalCost) resTotalCost.innerText = "R$ " + totalCostSuggested.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    
    const resSuggestedTrip = document.getElementById("logistics-res-suggested-trip");
    if (resSuggestedTrip) resSuggestedTrip.innerText = "R$ " + suggestedTripValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const btnApplyVal = document.getElementById("btn-apply-value");
    if (btnApplyVal) btnApplyVal.innerText = suggestedTripValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function applyCalculatedLogistics() {
    const distance = parseFloat(document.getElementById("logistics-distance").value) || 0;
    const fuelConsumption = parseFloat(document.getElementById("logistics-fuel-consumption").value) || 10;
    const fuelPrice = parseFloat(document.getElementById("logistics-fuel-price").value) || 0;
    const tollBase = parseFloat(document.getElementById("logistics-toll-base").value) || 0;
    const vehicleType = document.getElementById("logistics-vehicle-type").value;
    const tollReturn = document.getElementById("logistics-toll-return").checked;
    const markupFixed = parseFloat(document.getElementById("logistics-markup-fixed").value) || 0;
    const markupPercent = parseFloat(document.getElementById("logistics-markup-percent").value) || 0;

    let tollMultiplier = 1.0;
    if (vehicleType === "passeio") tollMultiplier = 1.0;
    else if (vehicleType === "carretinha") tollMultiplier = 1.5;
    else if (vehicleType === "trucado") tollMultiplier = 2.0;
    else {
        tollMultiplier = parseFloat(document.getElementById("logistics-toll-multiplier").value) || 1.0;
    }

    const tripDistance = distance * 2;
    const tripLiters = tripDistance / fuelConsumption;
    const tripFuelCost = tripLiters * fuelPrice;
    const tollLegs = tollReturn ? 2 : 1;
    const tripTollCost = tollBase * tollMultiplier * tollLegs;
    const tripCostPure = tripFuelCost + tripTollCost;
    
    const suggestedValue = (tripCostPure + markupFixed) * (1 + markupPercent / 100);

    const deliveryFeeInput = document.getElementById("rental-delivery-fee");
    const pickupFeeInput = document.getElementById("rental-pickup-fee");
    
    if (deliveryFeeInput && pickupFeeInput) {
        deliveryFeeInput.value = suggestedValue.toFixed(2);
        pickupFeeInput.value = suggestedValue.toFixed(2);
        alert(`Valores de frete aplicados com sucesso!\nEntrega: R$ ${suggestedValue.toFixed(2)}\nBusca: R$ ${suggestedValue.toFixed(2)}`);
    }
}

window.toggleRentalLogisticsCalc = toggleRentalLogisticsCalc;
window.updateLogisticsTollMultiplier = updateLogisticsTollMultiplier;
window.calculateRentalLogistics = calculateRentalLogistics;
window.applyCalculatedLogistics = applyCalculatedLogistics;

// --- CALCULADORA DE LOGÍSTICA DE ENTREGA DE DOCUMENTOS ---
function toggleDocLogisticsCalc() {
    const calcContent = document.getElementById("doc-logistics-calc-content");
    const toggleIcon = document.getElementById("doc-logistics-toggle-icon");
    if (!calcContent) return;

    if (calcContent.style.display === "none" || calcContent.style.display === "") {
        calcContent.style.display = "block";
        if (toggleIcon) toggleIcon.innerText = "▲";
        calculateDocLogistics();
    } else {
        calcContent.style.display = "none";
        if (toggleIcon) toggleIcon.innerText = "▼";
    }
}

function updateDocLogisticsTollMultiplier() {
    const vehicleType = document.getElementById("doc-logistics-vehicle-type").value;
    const multInput = document.getElementById("doc-logistics-toll-multiplier");
    if (!multInput) return;

    if (vehicleType === "passeio") {
        multInput.value = "1.0";
        multInput.disabled = true;
    } else if (vehicleType === "carretinha") {
        multInput.value = "1.5";
        multInput.disabled = true;
    } else if (vehicleType === "trucado") {
        multInput.value = "2.0";
        multInput.disabled = true;
    } else {
        multInput.disabled = false;
    }
    
    calculateDocLogistics();
}

function calculateDocLogistics() {
    const distance = parseFloat(document.getElementById("doc-logistics-distance").value) || 0;
    const avgSpeed = parseFloat(document.getElementById("doc-logistics-avg-speed").value) || 60;
    const vehicleType = document.getElementById("doc-logistics-vehicle-type").value;
    const tollBase = parseFloat(document.getElementById("doc-logistics-toll-base").value) || 0;
    const fuelPrice = parseFloat(document.getElementById("doc-logistics-fuel-price").value) || 0;
    const fuelConsumption = parseFloat(document.getElementById("doc-logistics-fuel-consumption").value) || 10;
    const markupPercent = parseFloat(document.getElementById("doc-logistics-markup-percent").value) || 0;
    const markupFixed = parseFloat(document.getElementById("doc-logistics-markup-fixed").value) || 0;
    const tollReturn = document.getElementById("doc-logistics-toll-return").checked;
    const opType = document.getElementById("doc-logistics-op-type").value;

    let tollMultiplier = 1.0;
    if (vehicleType === "passeio") tollMultiplier = 1.0;
    else if (vehicleType === "carretinha") tollMultiplier = 1.5;
    else if (vehicleType === "trucado") tollMultiplier = 2.0;
    else {
        tollMultiplier = parseFloat(document.getElementById("doc-logistics-toll-multiplier").value) || 1.0;
    }

    // Salvar no estado global para que sirva de default da próxima vez
    state.logisticsSettings = {
        fuelPrice,
        fuelConsumption,
        avgSpeed,
        tollBase,
        vehicleType,
        tollMultiplier,
        markupPercent,
        markupFixed,
        tollReturn
    };
    saveState();

    // Viagem Simples (Ida e Volta = 2 trechos)
    const tripDistance = distance * 2;
    const tripLiters = tripDistance / fuelConsumption;
    const tripFuelCost = tripLiters * fuelPrice;
    const tollLegs = tollReturn ? 2 : 1;
    const tripTollCost = tollBase * tollMultiplier * tollLegs;
    const tripCostPure = tripFuelCost + tripTollCost;

    // Valor sugerido por viagem (Simples)
    const suggestedTripValue = (tripCostPure + markupFixed) * (1 + markupPercent / 100);

    // Operação Completa (Levar + Buscar = 4 trechos)
    const totalDistance = distance * 4;
    const totalCostSuggested = suggestedTripValue * 2;

    // Cálculo do Tempo
    const tripTimeHours = tripDistance / avgSpeed;
    const tripTotalMin = Math.round(tripTimeHours * 60);
    const tripH = Math.floor(tripTotalMin / 60);
    const tripM = tripTotalMin % 60;

    const totalTimeHours = totalDistance / avgSpeed;
    const totalTotalMin = Math.round(totalTimeHours * 60);
    const totalH = Math.floor(totalTotalMin / 60);
    const totalM = totalTotalMin % 60;

    // Atualizar HTML
    const titleTrip = document.getElementById("doc-logistics-res-title-trip");
    if (titleTrip) {
        titleTrip.innerText = opType === "simples" ? "Resumo da Viagem (Ida e Volta - 2 Trechos)" : "Resumo de 1 Viagem (Ida e Volta - 2 Trechos)";
    }

    const resTripDist = document.getElementById("doc-logistics-res-trip-distance");
    if (resTripDist) resTripDist.innerText = tripDistance.toFixed(1) + " km";
    
    const resTripTime = document.getElementById("doc-logistics-res-trip-time");
    if (resTripTime) resTripTime.innerText = `${tripH}h ${tripM}m`;
    
    const resTripLiters = document.getElementById("doc-logistics-res-trip-liters");
    if (resTripLiters) resTripLiters.innerText = tripLiters.toFixed(1) + " L";
    
    const resTripFuelCost = document.getElementById("doc-logistics-res-trip-fuel-cost");
    if (resTripFuelCost) resTripFuelCost.innerText = "R$ " + tripFuelCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    
    const resTripTollCost = document.getElementById("doc-logistics-res-trip-toll-cost");
    if (resTripTollCost) resTripTollCost.innerText = "R$ " + tripTollCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    
    const resTripCostPure = document.getElementById("doc-logistics-res-trip-cost-pure");
    if (resTripCostPure) resTripCostPure.innerText = "R$ " + tripCostPure.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const totalSection = document.getElementById("doc-logistics-res-total-section");
    const resDivider = document.getElementById("doc-logistics-res-divider");
    const suggestedValue = opType === "simples" ? suggestedTripValue : totalCostSuggested;

    if (opType === "dupla") {
        if (totalSection) totalSection.style.display = "block";
        if (resDivider) resDivider.style.display = "block";

        const resTotalDist = document.getElementById("doc-logistics-res-total-distance");
        if (resTotalDist) resTotalDist.innerText = totalDistance.toFixed(1) + " km";
        
        const resTotalTime = document.getElementById("doc-logistics-res-total-time");
        if (resTotalTime) resTotalTime.innerText = `${totalH}h ${totalM}m`;
        
        const resTotalCost = document.getElementById("doc-logistics-res-total-cost");
        if (resTotalCost) resTotalCost.innerText = "R$ " + totalCostSuggested.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } else {
        if (totalSection) totalSection.style.display = "none";
    }

    const resSuggestedSub = document.getElementById("doc-logistics-res-suggested-sub");
    if (resSuggestedSub) {
        resSuggestedSub.innerText = opType === "simples" ? "(Preço sugerido para 2 trechos)" : "(Preço sugerido para 4 trechos)";
    }

    const resSuggested = document.getElementById("doc-logistics-res-suggested");
    if (resSuggested) resSuggested.innerText = "R$ " + suggestedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const btnApplyVal = document.getElementById("btn-apply-doc-value");
    if (btnApplyVal) btnApplyVal.innerText = suggestedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function applyDocCalculatedLogistics() {
    const distance = parseFloat(document.getElementById("doc-logistics-distance").value) || 0;
    const avgSpeed = parseFloat(document.getElementById("doc-logistics-avg-speed").value) || 60;
    const vehicleType = document.getElementById("doc-logistics-vehicle-type").value;
    const tollBase = parseFloat(document.getElementById("doc-logistics-toll-base").value) || 0;
    const fuelPrice = parseFloat(document.getElementById("doc-logistics-fuel-price").value) || 0;
    const fuelConsumption = parseFloat(document.getElementById("doc-logistics-fuel-consumption").value) || 10;
    const markupPercent = parseFloat(document.getElementById("doc-logistics-markup-percent").value) || 0;
    const markupFixed = parseFloat(document.getElementById("doc-logistics-markup-fixed").value) || 0;
    const tollReturn = document.getElementById("doc-logistics-toll-return").checked;
    const opType = document.getElementById("doc-logistics-op-type").value;

    let tollMultiplier = 1.0;
    if (vehicleType === "passeio") tollMultiplier = 1.0;
    else if (vehicleType === "carretinha") tollMultiplier = 1.5;
    else if (vehicleType === "trucado") tollMultiplier = 2.0;
    else {
        tollMultiplier = parseFloat(document.getElementById("doc-logistics-toll-multiplier").value) || 1.0;
    }

    const tripDistance = distance * 2;
    const tripLiters = tripDistance / fuelConsumption;
    const tripFuelCost = tripLiters * fuelPrice;
    const tollLegs = tollReturn ? 2 : 1;
    const tripTollCost = tollBase * tollMultiplier * tollLegs;
    const tripCostPure = tripFuelCost + tripTollCost;

    const suggestedTripValue = (tripCostPure + markupFixed) * (1 + markupPercent / 100);
    const suggestedValue = opType === "simples" ? suggestedTripValue : (suggestedTripValue * 2);

    const deliveryFeeInput = document.getElementById("doc-delivery-fee");
    if (deliveryFeeInput) {
        deliveryFeeInput.value = suggestedValue.toFixed(2);
        alert(`Valor de frete aplicado com sucesso!\nFrete (${opType === "simples" ? "Simples" : "Duplo"}): R$ ${suggestedValue.toFixed(2)}`);
    }
}

window.toggleDocLogisticsCalc = toggleDocLogisticsCalc;
window.updateDocLogisticsTollMultiplier = updateDocLogisticsTollMultiplier;
window.calculateDocLogistics = calculateDocLogistics;
window.applyDocCalculatedLogistics = applyDocCalculatedLogistics;

async function fetchDocRouteDistance(silent = false) {
    const clientAddress = document.getElementById("doc-address").value.trim();
    const statusEl = document.getElementById("doc-logistics-route-status");
    const btn = document.getElementById("btn-fetch-doc-route");

    if (!clientAddress) {
        if (!silent) {
            alert("Por favor, insira o endereço do cliente no campo 'Endereço de Entrega' primeiro!");
        }
        return;
    }

    const factoryAddress = FACTORY_INFO.address || "Vale do Paraíba, São José dos Campos - SP";
    const originalBtnHTML = btn ? btn.innerHTML : "";
    
    try {
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<span class="spin-anim" style="display:inline-block; border: 2px solid #fff; border-top: 2px solid transparent; border-radius: 50%; width: 12px; height: 12px; margin-right: 6px; vertical-align: middle;"></span> Geocodificando...';
        }
        if (statusEl) {
            statusEl.style.color = "var(--color-text-muted)";
            statusEl.innerText = "Buscando coordenadas do endereço do cliente...";
        }

        // 1. Geocodificar endereço do cliente via Nominatim
        const clientGeoUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(clientAddress)}&format=json&limit=1&email=contato@gelodovale.com.br`;
        const clientResponse = await fetch(clientGeoUrl);
        if (!clientResponse.ok) throw new Error("Erro ao buscar coordenadas do cliente");
        const clientGeoData = await clientResponse.json();
        
        if (clientGeoData.length === 0) {
            throw new Error("Endereço do cliente não encontrado. Tente digitar de forma mais simples (ex: Nome da Rua, Número, Cidade).");
        }

        const clientLat = parseFloat(clientGeoData[0].lat);
        const clientLng = parseFloat(clientGeoData[0].lon);

        if (statusEl) statusEl.innerText = "Buscando coordenadas da fábrica...";
        if (btn) btn.innerHTML = '<span class="spin-anim" style="display:inline-block; border: 2px solid #fff; border-top: 2px solid transparent; border-radius: 50%; width: 12px; height: 12px; margin-right: 6px; vertical-align: middle;"></span> Roteirizando...';

        // 2. Geocodificar endereço da fábrica via Nominatim
        const factoryGeoUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(factoryAddress)}&format=json&limit=1&email=contato@gelodovale.com.br`;
        const factoryResponse = await fetch(factoryGeoUrl);
        if (!factoryResponse.ok) throw new Error("Erro ao buscar coordenadas da fábrica");
        const factoryGeoData = await factoryResponse.json();
        
        let factoryLat = -23.179; // Fallback para São José dos Campos caso falhe
        let factoryLng = -45.887;
        
        if (factoryGeoData.length > 0) {
            factoryLat = parseFloat(factoryGeoData[0].lat);
            factoryLng = parseFloat(factoryGeoData[0].lon);
        }

        if (statusEl) statusEl.innerText = "Calculando rota via OSRM...";

        // 3. Obter rota/distância real de carro via OSRM
        const routeUrl = `https://router.project-osrm.org/route/v1/driving/${factoryLng},${factoryLat};${clientLng},${clientLat}?overview=false`;
        const routeResponse = await fetch(routeUrl);
        if (!routeResponse.ok) throw new Error("Erro ao calcular rota de trânsito");
        const routeData = await routeResponse.json();

        if (!routeData.routes || routeData.routes.length === 0) {
            throw new Error("Nenhuma rota de trânsito encontrada entre a fábrica e o cliente.");
        }

        // Distância retornada pelo OSRM é em metros
        const distanceMeters = routeData.routes[0].distance;
        const distanceKm = distanceMeters / 1000;

        // Atualizar input
        const distInput = document.getElementById("doc-logistics-distance");
        if (distInput) {
            distInput.value = distanceKm.toFixed(1);
        }

        // Recalcular
        calculateDocLogistics();

        if (statusEl) {
            statusEl.style.color = "#00f0ff";
            statusEl.innerText = `Sucesso! Rota calculada com precisão: ${distanceKm.toFixed(1)} km de ida.`;
        }

    } catch (error) {
        console.error("Erro na busca de rota:", error);
        if (statusEl) {
            statusEl.style.color = "var(--color-danger)";
            statusEl.innerText = `Erro: ${error.message}`;
        }
        if (!silent) {
            alert(`Não foi possível calcular a rota de forma 100% automática:\n${error.message}\n\nVocê pode usar os botões "Google Maps" ou "Waze" ao lado para abrir a rota no seu mapa, ver a quilometragem e preenchê-la manualmente.`);
        }
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalBtnHTML;
        }
    }
}

function openDocRouteInGoogleMaps() {
    const clientAddress = document.getElementById("doc-address").value.trim();
    if (!clientAddress) {
        alert("Por favor, insira o endereço do cliente primeiro!");
        return;
    }
    const factoryAddress = FACTORY_INFO.address || "Vale do Paraíba, São José dos Campos - SP";
    const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(factoryAddress)}&destination=${encodeURIComponent(clientAddress)}`;
    window.open(url, '_blank');
}

function openDocRouteInWaze() {
    const clientAddress = document.getElementById("doc-address").value.trim();
    if (!clientAddress) {
        alert("Por favor, insira o endereço do cliente primeiro!");
        return;
    }
    const url = `https://waze.com/ul?q=${encodeURIComponent(clientAddress)}&navigate=yes`;
    window.open(url, '_blank');
}

async function fetchRentalRouteDistance(silent = false) {
    const clientAddress = document.getElementById("rental-address").value.trim();
    const statusEl = document.getElementById("rental-logistics-route-status");
    const btn = document.getElementById("btn-fetch-rental-route");

    if (!clientAddress) {
        if (!silent) {
            alert("Por favor, insira o endereço do cliente no campo 'Endereço de Entrega' primeiro!");
        }
        return;
    }

    const factoryAddress = FACTORY_INFO.address || "Vale do Paraíba, São José dos Campos - SP";
    const originalBtnHTML = btn ? btn.innerHTML : "";
    
    try {
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<span class="spin-anim" style="display:inline-block; border: 2px solid #fff; border-top: 2px solid transparent; border-radius: 50%; width: 12px; height: 12px; margin-right: 6px; vertical-align: middle;"></span> Geocodificando...';
        }
        if (statusEl) {
            statusEl.style.color = "var(--color-text-muted)";
            statusEl.innerText = "Buscando coordenadas do endereço do cliente...";
        }

        // 1. Geocodificar endereço do cliente via Nominatim
        const clientGeoUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(clientAddress)}&format=json&limit=1&email=contato@gelodovale.com.br`;
        const clientResponse = await fetch(clientGeoUrl);
        if (!clientResponse.ok) throw new Error("Erro ao buscar coordenadas do cliente");
        const clientGeoData = await clientResponse.json();
        
        if (clientGeoData.length === 0) {
            throw new Error("Endereço do cliente não encontrado. Tente digitar de forma mais simples (ex: Nome da Rua, Número, Cidade).");
        }

        const clientLat = parseFloat(clientGeoData[0].lat);
        const clientLng = parseFloat(clientGeoData[0].lon);

        if (statusEl) statusEl.innerText = "Buscando coordenadas da fábrica...";
        if (btn) btn.innerHTML = '<span class="spin-anim" style="display:inline-block; border: 2px solid #fff; border-top: 2px solid transparent; border-radius: 50%; width: 12px; height: 12px; margin-right: 6px; vertical-align: middle;"></span> Roteirizando...';

        // 2. Geocodificar endereço da fábrica via Nominatim
        const factoryGeoUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(factoryAddress)}&format=json&limit=1&email=contato@gelodovale.com.br`;
        const factoryResponse = await fetch(factoryGeoUrl);
        if (!factoryResponse.ok) throw new Error("Erro ao buscar coordenadas da fábrica");
        const factoryGeoData = await factoryResponse.json();
        
        let factoryLat = -23.179; // Fallback para São José dos Campos caso falhe
        let factoryLng = -45.887;
        
        if (factoryGeoData.length > 0) {
            factoryLat = parseFloat(factoryGeoData[0].lat);
            factoryLng = parseFloat(factoryGeoData[0].lon);
        }

        if (statusEl) statusEl.innerText = "Calculando rota via OSRM...";

        // 3. Obter rota/distância real de carro via OSRM
        const routeUrl = `https://router.project-osrm.org/route/v1/driving/${factoryLng},${factoryLat};${clientLng},${clientLat}?overview=false`;
        const routeResponse = await fetch(routeUrl);
        if (!routeResponse.ok) throw new Error("Erro ao calcular rota de trânsito");
        const routeData = await routeResponse.json();

        if (!routeData.routes || routeData.routes.length === 0) {
            throw new Error("Nenhuma rota de trânsito encontrada entre a fábrica e o cliente.");
        }

        // Distância retornada pelo OSRM é em metros
        const distanceMeters = routeData.routes[0].distance;
        const distanceKm = distanceMeters / 1000;

        // Atualizar input
        const distInput = document.getElementById("logistics-distance");
        if (distInput) {
            distInput.value = distanceKm.toFixed(1);
        }

        // Recalcular
        calculateRentalLogistics();

        if (statusEl) {
            statusEl.style.color = "#00f0ff";
            statusEl.innerText = `Sucesso! Rota calculada com precisão: ${distanceKm.toFixed(1)} km de ida.`;
        }

    } catch (error) {
        console.error("Erro na busca de rota:", error);
        if (statusEl) {
            statusEl.style.color = "var(--color-danger)";
            statusEl.innerText = `Erro: ${error.message}`;
        }
        if (!silent) {
            alert(`Não foi possível calcular a rota de forma 100% automática:\n${error.message}\n\nVocê pode usar os botões "Google Maps" ou "Waze" ao lado para abrir a rota no seu mapa, ver a quilometragem e preenchê-la manualmente.`);
        }
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalBtnHTML;
        }
    }
}

function openRentalRouteInGoogleMaps() {
    const clientAddress = document.getElementById("rental-address").value.trim();
    if (!clientAddress) {
        alert("Por favor, insira o endereço do cliente primeiro!");
        return;
    }
    const factoryAddress = FACTORY_INFO.address || "Vale do Paraíba, São José dos Campos - SP";
    const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(factoryAddress)}&destination=${encodeURIComponent(clientAddress)}`;
    window.open(url, '_blank');
}

function openRentalRouteInWaze() {
    const clientAddress = document.getElementById("rental-address").value.trim();
    if (!clientAddress) {
        alert("Por favor, insira o endereço do cliente primeiro!");
        return;
    }
    const url = `https://waze.com/ul?q=${encodeURIComponent(clientAddress)}&navigate=yes`;
    window.open(url, '_blank');
}

function openRentalRouteInWaze() {
    const clientAddress = document.getElementById("rental-address").value.trim();
    if (!clientAddress) {
        alert("Por favor, insira o endereço do cliente primeiro!");
        return;
    }
    const url = `https://waze.com/ul?q=${encodeURIComponent(clientAddress)}&navigate=yes`;
    window.open(url, '_blank');
}

window.fetchDocRouteDistance = fetchDocRouteDistance;
window.openDocRouteInGoogleMaps = openDocRouteInGoogleMaps;
window.openDocRouteInWaze = openDocRouteInWaze;
window.fetchRentalRouteDistance = fetchRentalRouteDistance;
window.openRentalRouteInGoogleMaps = openRentalRouteInGoogleMaps;
window.openRentalRouteInWaze = openRentalRouteInWaze;

// ==========================================
// --- GESTÃO DE COMODATOS DE EQUIPAMENTOS ---
// ==========================================

function migrateLegacyComodatos() {
    if (!state.clients || !state.comodatos) return;
    let migrated = false;
    state.clients.forEach(client => {
        if (client.freezerCode && client.freezerCode !== 'N/A') {
            const exists = state.comodatos.some(c => c.clientId === client.id && c.freezerCode === client.freezerCode && c.status !== 'retirado');
            if (!exists) {
                const freezer = state.freezers ? state.freezers.find(f => f.code === client.freezerCode) : null;
                const newCom = {
                    id: 'com_' + Math.random().toString(36).substr(2, 9),
                    clientId: client.id,
                    clientName: client.name,
                    clientPhone: client.phone || '',
                    clientAddress: client.address || '',
                    freezerCode: client.freezerCode,
                    freezerBrand: client.freezerBrand || (freezer ? freezer.brand : '') || 'Não informado',
                    freezerVoltage: client.freezerVoltage || (freezer ? freezer.voltage : '') || 'Não informado',
                    freezerCapacity: client.freezerCapacity || (freezer ? freezer.capacity : '') || '',
                    startDate: client.deliveryDate || new Date().toISOString().split('T')[0],
                    status: 'ativo',
                    signatureBase64: '',
                    signatureDate: '',
                    notes: client.maintenanceNotes || '',
                    photos: [],
                    createdAt: Date.now()
                };
                state.comodatos.push(newCom);
                migrated = true;
                if (freezer && freezer.status !== 'alocado') {
                    freezer.status = 'alocado';
                }
            }
        }
    });
    if (migrated) {
        state.lastUpdated = Date.now();
        saveState();
    }
}

function renderComodatosAdmin() {
    const tableBody = document.getElementById("comodatos-table-body");
    if (!tableBody) return;
    
    tableBody.innerHTML = "";
    
    const comodatos = state.comodatos || [];
    const searchVal = (document.getElementById("comodato-search-input")?.value || "").toLowerCase().trim();
    const statusVal = document.getElementById("comodato-status-filter")?.value || "all";
    
    const filtered = comodatos.filter(c => {
        // Status filter
        if (statusVal === 'ativo' && c.status !== 'ativo') return false;
        if (statusVal === 'pendente_assinatura' && c.status !== 'pendente') return false;
        if (statusVal === 'retirado' && c.status !== 'retirado') return false;
        
        // Search filter
        if (searchVal) {
            const clientName = (c.clientName || "").toLowerCase();
            const freezerCode = (c.freezerCode || "").toLowerCase();
            if (!clientName.includes(searchVal) && !freezerCode.includes(searchVal)) {
                return false;
            }
        }
        
        return true;
    });
    
    if (filtered.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 20px; color: var(--color-text-muted);">
                    Nenhum comodato encontrado.
                </td>
            </tr>
        `;
        return;
    }
    
    filtered.forEach(c => {
        const tr = document.createElement("tr");
        tr.style.borderBottom = "1px solid rgba(255,255,255,0.05)";
        
        // Date formatting
        const dateStr = c.startDate ? new Date(c.startDate + 'T00:00:00').toLocaleDateString('pt-BR') : '-';
        
        // Signature column content
        let sigHTML = '';
        if (c.signatureBase64) {
            sigHTML = `<span style="color: #10b981; display: inline-flex; align-items: center; gap: 4px;"><i data-lucide="check" style="width: 14px; height: 14px;"></i> Assinado</span>`;
        } else {
            sigHTML = `<span style="color: var(--color-text-muted);">Pendente</span>`;
        }
        
        // Status badge
        let statusBadge = '';
        if (c.status === 'ativo') {
            statusBadge = `<span class="badge" style="background: rgba(16, 185, 129, 0.2); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3);">Ativo</span>`;
        } else if (c.status === 'pendente') {
            statusBadge = `<span class="badge" style="background: rgba(245, 158, 11, 0.2); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3);">Pendente</span>`;
        } else if (c.status === 'retirado') {
            statusBadge = `<span class="badge" style="background: rgba(239, 68, 68, 0.2); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3);">Retirado</span>`;
        }
        
        tr.innerHTML = `
            <td style="padding: 10px;"><strong>${c.clientName || 'N/A'}</strong></td>
            <td style="padding: 10px;"><code>${c.freezerCode}</code></td>
            <td style="padding: 10px;">${c.freezerBrand || ''} ${c.freezerCapacity || ''}</td>
            <td style="padding: 10px;">${dateStr}</td>
            <td style="padding: 10px; text-align: center;">${sigHTML}</td>
            <td style="padding: 10px; text-align: center;">${statusBadge}</td>
            <td style="padding: 10px; text-align: center;">
                <button type="button" class="btn btn-secondary btn-sm" onclick="openComodatoDetail('${c.id}')" style="padding: 4px 8px; font-size: 0.75rem;" title="Ver Detalhes">
                    <i data-lucide="eye" style="width: 14px; height: 14px;"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(tr);
    });
    
    lucide.createIcons();
}

function openNewComodatoModal() {
    const clientSelect = document.getElementById("comodato-client-select");
    const freezerSelect = document.getElementById("comodato-freezer-select");
    if (!clientSelect || !freezerSelect) return;
    
    clientSelect.innerHTML = '<option value="">Selecione um cliente...</option>';
    freezerSelect.innerHTML = '<option value="">Selecione um freezer...</option>';
    document.getElementById("comodato-notes").value = "";
    document.getElementById("comodato-start-date").value = new Date().toISOString().split('T')[0];
    
    const clients = [...(state.clients || [])].sort((a,b) => a.name.localeCompare(b.name));
    clients.forEach(c => {
        const option = document.createElement("option");
        option.value = c.id;
        option.textContent = c.name;
        clientSelect.appendChild(option);
    });
    
    const freezers = (state.freezers || []).filter(f => f.status === 'disponivel');
    freezers.forEach(f => {
        const option = document.createElement("option");
        option.value = f.code;
        option.textContent = `${f.code} - ${f.brand || ''} ${f.capacity || ''}`;
        freezerSelect.appendChild(option);
    });
    
    document.getElementById("modal-create-comodato").classList.add("active");
}

function saveNewComodato(e) {
    e.preventDefault();
    
    const clientId = document.getElementById("comodato-client-select").value;
    const freezerCode = document.getElementById("comodato-freezer-select").value;
    const startDate = document.getElementById("comodato-start-date").value;
    const notes = document.getElementById("comodato-notes").value.trim();
    
    if (!clientId || !freezerCode || !startDate) {
        alert("Por favor, preencha todos os campos obrigatórios (*).");
        return;
    }
    
    const client = state.clients.find(c => c.id === clientId);
    if (!client) {
        alert("Cliente selecionado inválido.");
        return;
    }
    
    const freezer = state.freezers ? state.freezers.find(f => f.code === freezerCode) : null;
    if (!freezer) {
        alert("Freezer selecionado inválido.");
        return;
    }
    
    const newCom = {
        id: 'com_' + Math.random().toString(36).substr(2, 9),
        clientId: client.id,
        clientName: client.name,
        clientPhone: client.phone || '',
        clientAddress: client.address || '',
        freezerCode: freezerCode,
        freezerBrand: freezer.brand || 'Não informado',
        freezerVoltage: freezer.voltage || 'Não informado',
        freezerCapacity: freezer.capacity || '',
        startDate: startDate,
        status: 'pendente',
        signatureBase64: '',
        signatureDate: '',
        notes: notes,
        photos: [],
        createdAt: Date.now()
    };
    
    if (!state.comodatos) state.comodatos = [];
    state.comodatos.push(newCom);
    
    freezer.status = 'alocado';
    freezer.clientId = client.id;
    freezer.clientName = client.name;
    freezer.deliveryDate = startDate;
    freezer.maintenanceNotes = notes;
    
    client.freezerCode = freezerCode;
    client.freezerBrand = freezer.brand || 'Não informado';
    client.freezerVoltage = freezer.voltage || 'Não informado';
    client.freezerCapacity = freezer.capacity || '';
    client.deliveryDate = startDate;
    client.maintenanceNotes = notes;
    
    saveState();
    closeModal("modal-create-comodato");
    renderApp();
    alert("Comodato criado com sucesso! Lembre-se de coletar a assinatura eletrônica do cliente.");
}

function openComodatoDetail(comId) {
    window.currentComodatoId = comId;
    renderComodatoDetail(comId);
    document.getElementById("modal-comodato-detail").classList.add("active");
}

function renderComodatoDetail(comId) {
    const comodato = state.comodatos.find(c => c.id === comId);
    if (!comodato) return;
    
    const client = state.clients.find(c => c.id === comodato.clientId);
    
    document.getElementById("det-com-client-name").innerText = client ? client.name : comodato.clientName;
    document.getElementById("det-com-client-doc").innerText = client ? (client.document || 'Não informado') : 'Não informado';
    document.getElementById("det-com-client-phone").innerText = client ? (client.phone || 'Não informado') : (comodato.clientPhone || 'Não informado');
    document.getElementById("det-com-client-address").innerText = client ? (client.address || 'Não informado') : (comodato.clientAddress || 'Não informado');
    
    document.getElementById("det-com-freezer-code").innerText = comodato.freezerCode;
    document.getElementById("det-com-freezer-brand").innerText = comodato.freezerBrand || 'Não informado';
    document.getElementById("det-com-freezer-cap").innerText = comodato.freezerCapacity ? comodato.freezerCapacity + (comodato.freezerCapacity.toString().toLowerCase().includes('litros') ? '' : ' Litros') : 'Não informado';
    document.getElementById("det-com-freezer-voltage").innerText = comodato.freezerVoltage || 'Não informado';
    
    document.getElementById("det-com-start-date").innerText = comodato.startDate ? new Date(comodato.startDate + 'T00:00:00').toLocaleDateString('pt-BR') : '-';
    
    const badge = document.getElementById("det-com-status-badge");
    badge.className = "badge";
    if (comodato.status === 'ativo') {
        badge.innerText = "Ativo (Assinado)";
        badge.style.background = "rgba(16, 185, 129, 0.2)";
        badge.style.color = "#10b981";
        badge.style.border = "1px solid rgba(16, 185, 129, 0.3)";
        
        document.getElementById("det-com-return-container").style.display = "none";
        document.getElementById("comodato-withdrawal-section").style.display = "block";
        document.getElementById("comodato-withdrawn-history").style.display = "none";
        
        document.getElementById("comodato-withdrawal-date").value = new Date().toISOString().split('T')[0];
        document.getElementById("comodato-withdrawal-notes").value = "";
    } else if (comodato.status === 'pendente') {
        badge.innerText = "Pendente Assinatura";
        badge.style.background = "rgba(245, 158, 11, 0.2)";
        badge.style.color = "#f59e0b";
        badge.style.border = "1px solid rgba(245, 158, 11, 0.3)";
        
        document.getElementById("det-com-return-container").style.display = "none";
        document.getElementById("comodato-withdrawal-section").style.display = "block";
        document.getElementById("comodato-withdrawn-history").style.display = "none";
        
        document.getElementById("comodato-withdrawal-date").value = new Date().toISOString().split('T')[0];
        document.getElementById("comodato-withdrawal-notes").value = "";
    } else if (comodato.status === 'retirado') {
        badge.innerText = "Retirado / Finalizado";
        badge.style.background = "rgba(239, 68, 68, 0.2)";
        badge.style.color = "#ef4444";
        badge.style.border = "1px solid rgba(239, 68, 68, 0.3)";
        
        document.getElementById("det-com-return-container").style.display = "block";
        document.getElementById("det-com-return-date").innerText = comodato.returnDate ? new Date(comodato.returnDate + 'T00:00:00').toLocaleDateString('pt-BR') : '-';
        document.getElementById("comodato-withdrawal-section").style.display = "none";
        
        document.getElementById("comodato-withdrawn-history").style.display = "block";
        document.getElementById("hist-det-return-date").innerText = comodato.returnDate ? new Date(comodato.returnDate + 'T00:00:00').toLocaleDateString('pt-BR') : '-';
        document.getElementById("hist-det-return-notes").innerText = comodato.returnNotes || 'Sem observações.';
    }
    
    document.getElementById("det-com-general-notes").value = comodato.notes || "";
    
    const gallery = document.getElementById("comodato-photos-gallery-container");
    gallery.innerHTML = "";
    if (comodato.photos && comodato.photos.length > 0) {
        comodato.photos.forEach((photo, index) => {
            const card = document.createElement("div");
            card.className = "comodato-photo-card";
            card.style.position = "relative";
            card.style.width = "100px";
            card.style.height = "100px";
            card.style.border = "1px solid rgba(255,255,255,0.1)";
            card.style.borderRadius = "6px";
            card.style.overflow = "hidden";
            card.style.background = "rgba(0,0,0,0.2)";
            
            card.innerHTML = `
                <img src="${photo}" style="width: 100%; height: 100%; object-fit: cover; cursor: pointer;">
                <button type="button" class="btn-delete-photo" style="position: absolute; top: 4px; right: 4px; background: rgba(239,68,68,0.85); border: none; border-radius: 4px; width: 22px; height: 22px; color: white; display: flex; align-items: center; justify-content: center; cursor: pointer;">
                    <i data-lucide="trash-2" style="width: 12px; height: 12px;"></i>
                </button>
            `;
            
            card.querySelector("img").onclick = () => {
                const viewer = window.open();
                viewer.document.write(`<img src="${photo}" style="max-width:100%; max-height:100vh; display:block; margin:auto;">`);
            };
            
            card.querySelector(".btn-delete-photo").onclick = (e) => {
                e.stopPropagation();
                deleteComodatoPhoto(comodato.id, index);
            };
            
            gallery.appendChild(card);
        });
    } else {
        gallery.innerHTML = `<p style="font-size: 0.8rem; color: var(--color-text-muted); margin: 0;">Nenhuma foto anexada.</p>`;
    }
    
    const sigPending = document.getElementById("comodato-sig-pending-actions");
    const sigSigned = document.getElementById("comodato-sig-signed-container");
    
    if (comodato.signatureBase64) {
        sigPending.style.display = "none";
        sigSigned.style.display = "flex";
        document.getElementById("comodato-sig-preview-img").src = comodato.signatureBase64;
        document.getElementById("comodato-sig-date-text").innerText = "Data: " + new Date(comodato.signatureDate).toLocaleString('pt-BR');
        
        let method = "Assinatura Local";
        if (comodato.signatureMethod === 'remote') method = "Assinatura Remota (Cliente)";
        document.getElementById("comodato-sig-method-text").innerText = "Método: " + method;
    } else {
        sigPending.style.display = "flex";
        sigSigned.style.display = "none";
        
        document.getElementById("btn-comodato-sig-local").onclick = () => {
            closeModal("modal-comodato-detail");
            openSignatureModal('comodato', comodato.id);
        };
        document.getElementById("btn-comodato-sig-whatsapp").onclick = () => {
            sendComodatoWhatsAppLink(comodato.id);
        };
        document.getElementById("btn-comodato-sig-email").onclick = () => {
            sendComodatoEmailLink(comodato.id);
        };
    }
    
    document.getElementById("btn-comodato-save-notes").onclick = () => {
        saveComodatoNotes(comodato.id);
    };
    
    document.getElementById("btn-comodato-print-doc").onclick = () => {
        openComodato(comodato.id);
    };
    
    lucide.createIcons();
}

function saveComodatoNotes(comId) {
    const comodato = state.comodatos.find(c => c.id === comId);
    if (!comodato) return;
    const notesVal = document.getElementById("det-com-general-notes").value;
    comodato.notes = notesVal;
    
    const client = state.clients.find(c => c.id === comodato.clientId);
    if (client) {
        client.maintenanceNotes = notesVal;
    }
    
    saveState();
    alert("Observações salvas com sucesso!");
    renderComodatoDetail(comId);
    renderComodatosAdmin();
}

function uploadComodatoPhotos(event) {
    const comId = window.currentComodatoId;
    const comodato = state.comodatos.find(c => c.id === comId);
    if (!comodato) return;
    
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    if (!comodato.photos) comodato.photos = [];
    
    if (comodato.photos.length + files.length > 10) {
        alert("Limite de 10 fotos por comodato atingido.");
        return;
    }
    
    const btn = document.getElementById("btn-comodato-upload-photo");
    const originalHTML = btn ? btn.innerHTML : "";
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="spin-anim" style="display:inline-block; border: 2px solid #fff; border-top: 2px solid transparent; border-radius: 50%; width: 12px; height: 12px; margin-right: 6px; vertical-align: middle; animation: spin 1s linear infinite;"></span> Carregando...';
    }
    
    let loadedCount = 0;
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement("canvas");
                let width = img.width;
                let height = img.height;
                const maxDim = 800;
                
                if (width > maxDim || height > maxDim) {
                    if (width > height) {
                        height = Math.round((height * maxDim) / width);
                        width = maxDim;
                    } else {
                        width = Math.round((width * maxDim) / height);
                        height = maxDim;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, width, height);
                
                const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7);
                comodato.photos.push(compressedBase64);
                
                loadedCount++;
                if (loadedCount === files.length) {
                    saveState();
                    renderComodatoDetail(comId);
                    if (btn) {
                        btn.disabled = false;
                        btn.innerHTML = originalHTML;
                    }
                    event.target.value = "";
                }
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

function deleteComodatoPhoto(comId, photoIndex) {
    if (!confirm("Tem certeza que deseja excluir esta foto?")) return;
    const comodato = state.comodatos.find(c => c.id === comId);
    if (!comodato) return;
    
    if (comodato.photos && comodato.photos[photoIndex] !== undefined) {
        comodato.photos.splice(photoIndex, 1);
        saveState();
        renderComodatoDetail(comId);
    }
}

function executeComodatoReturn() {
    const comId = window.currentComodatoId;
    const comodato = state.comodatos.find(c => c.id === comId);
    if (!comodato) return;
    
    const returnDate = document.getElementById("comodato-withdrawal-date").value;
    const returnNotes = document.getElementById("comodato-withdrawal-notes").value;
    
    if (!returnDate) {
        alert("Por favor, preencha a data de retirada.");
        return;
    }
    
    if (!confirm("Confirmar a retirada / devolução deste freezer? O comodato será finalizado e o equipamento ficará disponível para alocação.")) {
        return;
    }
    
    comodato.status = 'retirado';
    comodato.returnDate = returnDate;
    comodato.returnNotes = returnNotes;
    
    const freezer = state.freezers ? state.freezers.find(f => f.code === comodato.freezerCode) : null;
    if (freezer) {
        freezer.status = 'disponivel';
        delete freezer.clientId;
        delete freezer.clientName;
        delete freezer.deliveryDate;
    }
    
    const client = state.clients.find(c => c.id === comodato.clientId);
    if (client) {
        delete client.freezerCode;
        delete client.freezerBrand;
        delete client.freezerVoltage;
        delete client.freezerCapacity;
        delete client.deliveryDate;
    }
    
    saveState();
    alert("Retirada registrada com sucesso! O freezer voltou a ficar disponível.");
    closeModal("modal-comodato-detail");
    renderApp();
}

function getComodatoPortalURL(comId) {
    if (!state.firebaseConfig || !state.firebaseConfig.enabled || !state.firebaseConfig.apiKey) {
        const goToSettings = confirm("Atenção: A sincronização com o Firebase precisa estar ativa e configurada na aba \"Nuvem, Segurança & Backup\" (dentro de \"Configurações & Preços\") para usar o Portal de Assinatura do Cliente.\n\nDeseja ir para as configurações de nuvem agora?");
        if (goToSettings) {
            navigateToTab('precos');
            switchAdminSubTab('tab-seguranca-backup');
        }
        return null;
    }
    const { apiKey, projectId, databaseURL, deviceKey } = state.firebaseConfig;
    const basePath = window.location.href.split('?')[0];
    
    return `${basePath}?clientSign=comodato&apiKey=${encodeURIComponent(apiKey)}&projectId=${encodeURIComponent(projectId)}&databaseURL=${encodeURIComponent(databaseURL)}&deviceKey=${encodeURIComponent(deviceKey)}&comId=${comId}`;
}

function sendComodatoWhatsAppLink(comId) {
    const url = getComodatoPortalURL(comId);
    if (!url) return;
    
    const comodato = state.comodatos.find(c => c.id === comId);
    if (!comodato) return;
    
    const client = state.clients.find(c => c.id === comodato.clientId);
    const clientName = client ? client.name : comodato.clientName;
    const clientPhone = client ? client.phone : comodato.clientPhone;
    
    if (!clientPhone) {
        alert("Este cliente não possui telefone cadastrado.");
        return;
    }
    
    const message = `Olá, ${clientName}! Por favor, acesse o link abaixo para visualizar os termos e assinar digitalmente o Contrato de Comodato do freezer serial (${comodato.freezerCode}):\n\n${url}`;
    
    const cleanPhone = clientPhone.replace(/\D/g, "");
    const formattedPhone = (cleanPhone.length === 10 || cleanPhone.length === 11) ? "55" + cleanPhone : cleanPhone;
    
    const waUrl = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(message)}`;
    window.open(waUrl, "_blank");
}

function sendComodatoEmailLink(comId) {
    const url = getComodatoPortalURL(comId);
    if (!url) return;
    
    const comodato = state.comodatos.find(c => c.id === comId);
    if (!comodato) return;
    
    const client = state.clients.find(c => c.id === comodato.clientId);
    const clientName = client ? client.name : comodato.clientName;
    
    const subject = encodeURIComponent("Termo de Comodato de Equipamento - Gelo do Vale");
    const body = encodeURIComponent(`Olá, ${clientName},\n\nEnviamos em anexo os dados do comodato do freezer (${comodato.freezerCode}).\n\nPor favor, acesse o link a seguir para ler o contrato e assinar digitalmente:\n${url}\n\nAtenciosamente,\nGelo do Vale`);
    
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
}

// --- PORTAL DE ASSINATURA ELETRÔNICA DO CLIENTE ---
let portalCanvas = null;
let portalCtx = null;
let portalHasDrawn = false;
let portalLastX = 0;
let portalLastY = 0;
let portalIsDrawing = false;

function initPortalSignatureCanvas() {
    portalCanvas = document.getElementById("client-portal-canvas");
    if (!portalCanvas) return;
    
    portalCtx = portalCanvas.getContext("2d");
    
    const rect = portalCanvas.getBoundingClientRect();
    portalCanvas.width = rect.width || 500;
    portalCanvas.height = rect.height || 180;
    
    portalCtx.strokeStyle = "#000000";
    portalCtx.lineWidth = 2.5;
    portalCtx.lineCap = "round";
    portalCtx.lineJoin = "round";
    
    portalCanvas.addEventListener("mousedown", (e) => {
        portalIsDrawing = true;
        const coords = getPortalCanvasCoords(e);
        portalLastX = coords.x;
        portalLastY = coords.y;
        
        const label = document.getElementById("portal-canvas-label");
        if (label) label.classList.add("hidden");
        document.getElementById("portal-canvas-container").classList.add("active");
    });
    
    portalCanvas.addEventListener("mousemove", (e) => {
        if (!portalIsDrawing) return;
        const coords = getPortalCanvasCoords(e);
        
        portalCtx.beginPath();
        portalCtx.moveTo(portalLastX, portalLastY);
        portalCtx.lineTo(coords.x, coords.y);
        portalCtx.stroke();
        
        portalLastX = coords.x;
        portalLastY = coords.y;
        portalHasDrawn = true;
    });
    
    portalCanvas.addEventListener("mouseup", () => { portalIsDrawing = false; });
    portalCanvas.addEventListener("mouseout", () => { portalIsDrawing = false; });
    
    portalCanvas.addEventListener("touchstart", (e) => {
        e.preventDefault();
        portalIsDrawing = true;
        const touch = e.touches[0];
        const coords = getPortalCanvasCoords(touch);
        portalLastX = coords.x;
        portalLastY = coords.y;
        
        const label = document.getElementById("portal-canvas-label");
        if (label) label.classList.add("hidden");
        document.getElementById("portal-canvas-container").classList.add("active");
    }, { passive: false });
    
    portalCanvas.addEventListener("touchmove", (e) => {
        e.preventDefault();
        if (!portalIsDrawing) return;
        const touch = e.touches[0];
        const coords = getPortalCanvasCoords(touch);
        
        portalCtx.beginPath();
        portalCtx.moveTo(portalLastX, portalLastY);
        portalCtx.lineTo(coords.x, coords.y);
        portalCtx.stroke();
        
        portalLastX = coords.x;
        portalLastY = coords.y;
        portalHasDrawn = true;
    }, { passive: false });
    
    portalCanvas.addEventListener("touchend", () => { portalIsDrawing = false; });
    
    const btnClear = document.getElementById("btn-portal-clear");
    if (btnClear) {
        btnClear.onclick = () => {
            portalCtx.clearRect(0, 0, portalCanvas.width, portalCanvas.height);
            portalHasDrawn = false;
            const label = document.getElementById("portal-canvas-label");
            if (label) label.classList.remove("hidden");
            document.getElementById("portal-canvas-container").classList.remove("active");
        };
    }
}

function getPortalCanvasCoords(e) {
    const rect = portalCanvas.getBoundingClientRect();
    return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };
}

function initClientSigningPortal(urlParams) {
    const apiKey = urlParams.get("apiKey");
    const projectId = urlParams.get("projectId");
    const databaseURL = urlParams.get("databaseURL");
    const deviceKey = urlParams.get("deviceKey");
    const comId = urlParams.get("comId");
    
    if (!apiKey || !projectId || !databaseURL || !deviceKey || !comId) {
        showPortalError("Parâmetros de assinatura inválidos ou incompletos na URL. Entre em contato com a fábrica para receber um link válido.");
        return;
    }
    
    document.body.innerHTML = `
        <div id="client-portal-root">
            <div class="client-portal-card" id="portal-loading-card" style="text-align: center; margin-top: 10vh;">
                <img src="logo_vertical.png" class="client-portal-logo" alt="Gelo do Vale" style="max-height: 80px; object-fit: contain;">
                <h3 class="client-portal-title">Conectando ao Servidor...</h3>
                <div style="margin: 25px 0;">
                    <span class="spin-anim" style="display:inline-block; border: 3px solid rgba(0,240,255,0.15); border-top: 3px solid var(--color-primary); border-radius: 50%; width: 32px; height: 32px; animation: spin 1s linear infinite;"></span>
                </div>
                <p style="font-size: 0.85rem; color: var(--color-text-muted);">Estabelecendo conexão segura para carregar os termos do comodato.</p>
            </div>
        </div>
    `;
    
    loadFirebaseSDK(() => {
        try {
            const config = { apiKey, projectId, databaseURL };
            if (firebase.apps.length === 0) {
                firebase.initializeApp(config);
            }
            
            firebase.database().ref(`factories/${deviceKey}`).once("value")
                .then(snapshot => {
                    const remoteState = snapshot.val();
                    if (!remoteState) {
                        showPortalError("Não foi possível carregar as informações do sistema da fábrica. Verifique as credenciais.");
                        return;
                    }
                    
                    if (!remoteState.comodatos) {
                        showPortalError("Nenhum registro de comodato encontrado no sistema remoto.");
                        return;
                    }
                    
                    const comodato = remoteState.comodatos.find(c => c.id === comId);
                    if (!comodato) {
                        showPortalError("O Contrato de Comodato solicitado não foi encontrado no sistema ou foi cancelado.");
                        return;
                    }
                    
                    if (comodato.status === 'ativo') {
                        showPortalSuccess(remoteState, comodato, true);
                        return;
                    }
                    
                    if (comodato.status === 'retirado') {
                        showPortalError("Este comodato foi finalizado devido à devolução/retirada do equipamento.");
                        return;
                    }
                    
                    const client = remoteState.clients ? remoteState.clients.find(c => c.id === comodato.clientId) : null;
                    if (!client) {
                        showPortalError("Cliente associado ao comodato não encontrado.");
                        return;
                    }
                    
                    renderPortalInterface(remoteState, comodato, client, deviceKey);
                })
                .catch(err => {
                    console.error("Erro ao obter dados do Firebase:", err);
                    showPortalError("Falha na conexão com o servidor: " + err.message);
                });
        } catch (error) {
            console.error("Erro ao inicializar Firebase no portal:", error);
            showPortalError("Falha ao configurar a conexão segura: " + error.message);
        }
    });
}

function renderPortalInterface(remoteState, comodato, client, deviceKey) {
    const root = document.getElementById("client-portal-root");
    if (!root) return;
    
    const termsHTML = renderPortalContractTerms(comodato, client, remoteState);
    const clientName = client ? client.name : comodato.clientName;
    const clientDoc = client ? (client.document || '') : '';
    const clientPhone = client ? (client.phone || comodato.clientPhone || '') : (comodato.clientPhone || '');
    const clientAddress = client ? (client.address || comodato.clientAddress || '') : (comodato.clientAddress || '');
    
    root.innerHTML = `
        <div class="client-portal-card">
            <div class="client-portal-header">
                <img src="logo_vertical.png" class="client-portal-logo" alt="Gelo do Vale" style="max-height: 85px; object-fit: contain;">
                <h3 class="client-portal-title">Assinatura do Termo de Comodato</h3>
                <p class="client-portal-subtitle">Leia com atenção os termos e confirme seus dados para assinar.</p>
            </div>
            
            <div class="client-portal-contract-box">
                ${termsHTML}
            </div>
            
            <div class="client-portal-form">
                <h4 style="color: var(--color-primary); font-size: 0.9rem; margin-top: 0.5rem; margin-bottom: 0.25rem; font-weight: 700;">Confirme e complete seus dados:</h4>
                
                <div class="form-group" style="margin-bottom: 0.75rem;">
                    <label for="portal-client-doc" style="font-size: 0.8rem; color: var(--color-text-muted); display: block; margin-bottom: 4px;">CNPJ ou CPF *</label>
                    <input type="text" id="portal-client-doc" class="form-control" value="${clientDoc}" placeholder="Ex: 00.000.000/0000-00" required>
                </div>
                
                <div class="form-group" style="margin-bottom: 0.75rem;">
                    <label for="portal-client-phone" style="font-size: 0.8rem; color: var(--color-text-muted); display: block; margin-bottom: 4px;">Telefone / WhatsApp *</label>
                    <input type="text" id="portal-client-phone" class="form-control" value="${clientPhone}" placeholder="Ex: (12) 99999-9999" required>
                </div>
                
                <div class="form-group" style="margin-bottom: 1rem;">
                    <label for="portal-client-address" style="font-size: 0.8rem; color: var(--color-text-muted); display: block; margin-bottom: 4px;">Endereço Completo de Instalação *</label>
                    <input type="text" id="portal-client-address" class="form-control" value="${clientAddress}" placeholder="Ex: Rua Nome da Rua, 123, Bairro, Cidade - SP" required>
                </div>
            </div>
            
            <label style="font-size: 0.8rem; color: var(--color-text-muted); display: block; margin-bottom: 6px;">Assinatura Digital (Use o dedo ou mouse) *</label>
            <div class="client-portal-canvas-container" id="portal-canvas-container" style="background: white; border: 1.5px dashed rgba(255,255,255,0.15); border-radius: 8px;">
                <div class="client-portal-canvas-label" id="portal-canvas-label" style="color: #666; pointer-events: none; z-index: 10;">
                    <i data-lucide="pen-tool" style="display: block; margin: 0 auto 5px auto; width: 18px; height: 18px;"></i>
                    Desenhe sua assinatura aqui
                </div>
                <canvas id="client-portal-canvas" style="background: white;"></canvas>
            </div>
            
            <div class="client-portal-buttons" style="margin-top: 1rem;">
                <button type="button" class="btn btn-secondary" id="btn-portal-clear" style="padding: 8px 16px;">Limpar</button>
                <button type="button" class="btn btn-primary" id="btn-portal-submit" style="padding: 8px 20px; display: inline-flex; align-items: center; gap: 6px;">
                    <i data-lucide="check" style="width: 14px; height: 14px;"></i> Assinar e Enviar
                </button>
            </div>
        </div>
    `;
    
    lucide.createIcons();
    initPortalSignatureCanvas();
    
    document.getElementById("btn-portal-submit").onclick = () => {
        const docVal = document.getElementById("portal-client-doc").value.trim();
        const phoneVal = document.getElementById("portal-client-phone").value.trim();
        const addressVal = document.getElementById("portal-client-address").value.trim();
        
        if (!docVal) {
            alert("Por favor, preencha o seu CNPJ ou CPF.");
            return;
        }
        if (!phoneVal) {
            alert("Por favor, preencha o seu Telefone/WhatsApp.");
            return;
        }
        if (!addressVal) {
            alert("Por favor, preencha o endereço completo de instalação.");
            return;
        }
        if (!portalHasDrawn) {
            alert("Por favor, desenhe sua assinatura no campo indicado antes de enviar.");
            return;
        }
        
        const btnSubmit = document.getElementById("btn-portal-submit");
        const btnClear = document.getElementById("btn-portal-clear");
        btnSubmit.disabled = true;
        if (btnClear) btnClear.disabled = true;
        btnSubmit.innerHTML = '<span class="spin-anim" style="display:inline-block; border: 2px solid #fff; border-top: 2px solid transparent; border-radius: 50%; width: 12px; height: 12px; margin-right: 6px; vertical-align: middle; animation: spin 1s linear infinite;"></span> Enviando...';
        
        const dataUrl = portalCanvas.toDataURL("image/png");
        
        const comId = comodato.id;
        const targetComodato = remoteState.comodatos.find(c => c.id === comId);
        if (targetComodato) {
            targetComodato.signatureBase64 = dataUrl;
            targetComodato.status = 'ativo';
            targetComodato.signatureDate = new Date().toISOString();
            targetComodato.signatureMethod = 'remote';
            targetComodato.clientPhone = phoneVal;
            targetComodato.clientAddress = addressVal;
        }
        
        const targetClient = remoteState.clients.find(c => c.id === comodato.clientId);
        if (targetClient) {
            targetClient.document = docVal;
            targetClient.phone = phoneVal;
            targetClient.address = addressVal;
            targetClient.freezerCode = comodato.freezerCode;
        }
        
        remoteState.lastUpdated = Date.now();
        
        firebase.database().ref(`factories/${deviceKey}`).set(remoteState)
            .then(() => {
                showPortalSuccess(remoteState, targetComodato || comodato, false);
            })
            .catch(err => {
                console.error("Erro ao salvar assinatura remota no Firebase:", err);
                alert("Ocorreu um erro ao enviar sua assinatura para o servidor. Por favor, tente novamente: " + err.message);
                btnSubmit.disabled = false;
                if (btnClear) btnClear.disabled = false;
                btnSubmit.innerHTML = '<i data-lucide="check" style="width: 14px; height: 14px;"></i> Assinar e Enviar';
                lucide.createIcons();
            });
    };
}

function showPortalSuccess(remoteState, comodato, alreadySigned) {
    const root = document.getElementById("client-portal-root");
    if (!root) return;
    
    const facName = remoteState.factorySettings && remoteState.factorySettings.name ? remoteState.factorySettings.name : "Gelo do Vale";
    const titleText = alreadySigned ? "Contrato Já Assinado!" : "Assinatura Enviada com Sucesso!";
    const bodyText = alreadySigned 
        ? `Este termo de comodato para o freezer serial <strong>${comodato.freezerCode}</strong> já foi assinado e encontra-se devidamente ativo no sistema da fábrica.`
        : `Sua assinatura para o comodato do freezer serial <strong>${comodato.freezerCode}</strong> foi registrada e sincronizada com a fábrica com sucesso.`;
        
    root.innerHTML = `
        <div class="client-portal-card" style="text-align: center; border-color: var(--color-success); box-shadow: 0 10px 30px rgba(16, 185, 129, 0.1), var(--shadow-neon);">
            <div style="margin-bottom: 1.5rem;">
                <img src="logo_vertical.png" class="client-portal-logo" alt="Gelo do Vale" style="max-height: 85px; object-fit: contain;">
            </div>
            
            <div style="background: rgba(16, 185, 129, 0.15); border: 2px solid #10b981; width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem auto;">
                <i data-lucide="check-circle-2" style="width: 36px; height: 36px; color: #10b981;"></i>
            </div>
            
            <h3 class="client-portal-title" style="color: #10b981; text-shadow: 0 0 10px rgba(16, 185, 129, 0.2);">${titleText}</h3>
            <p style="font-size: 0.88rem; color: #cbd5e1; margin-top: 10px; line-height: 1.6; padding: 0 10px;">
                ${bodyText}
            </p>
            
            <p style="font-size: 0.8rem; color: var(--color-text-muted); margin-top: 1.5rem; border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 1.25rem;">
                Obrigado pela parceria!<br>
                <strong>${facName}</strong>
            </p>
            
            <div style="margin-top: 1.5rem;">
                <button class="btn btn-secondary" onclick="window.close()" style="font-size: 0.8rem; padding: 6px 16px;">Fechar Janela</button>
            </div>
        </div>
    `;
    
    lucide.createIcons();
}

function showPortalError(msg) {
    const root = document.getElementById("client-portal-root");
    if (!root) return;
    
    root.innerHTML = `
        <div class="client-portal-card" style="text-align: center; border-color: var(--color-danger); box-shadow: 0 10px 30px rgba(239, 68, 68, 0.1), var(--shadow-neon);">
            <div style="margin-bottom: 1.5rem;">
                <img src="logo_vertical.png" class="client-portal-logo" alt="Gelo do Vale" style="max-height: 85px; object-fit: contain;">
            </div>
            
            <div style="background: rgba(239, 68, 68, 0.15); border: 2px solid #ef4444; width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem auto;">
                <i data-lucide="alert-triangle" style="width: 36px; height: 36px; color: #ef4444;"></i>
            </div>
            
            <h3 class="client-portal-title" style="color: #ef4444; text-shadow: 0 0 10px rgba(239, 68, 68, 0.2);">Falha ao Carregar Contrato</h3>
            <p style="font-size: 0.88rem; color: #cbd5e1; margin-top: 10px; line-height: 1.6; padding: 0 10px;">
                ${msg}
            </p>
            
            <p style="font-size: 0.8rem; color: var(--color-text-muted); margin-top: 1.5rem; border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 1.25rem;">
                Se o erro persistir, por favor solicite um novo link de assinatura à equipe da fábrica.
            </p>
        </div>
    `;
    
    lucide.createIcons();
}

function renderPortalContractTerms(comodato, client, remoteState) {
    const clientName = client ? client.name : comodato.clientName;
    const clientDoc = client ? (client.document || 'Não informado') : 'Não informado';
    const clientPhone = client ? (client.phone || 'Não informado') : (comodato.clientPhone || 'Não informado');
    const clientAddress = client ? (client.address || 'Não informado') : (comodato.clientAddress || 'Não informado');
    const dataEntrega = comodato.startDate ? new Date(comodato.startDate + 'T00:00:00').toLocaleDateString('pt-BR') : '___/___/______';
    const dataAtual = new Date().toLocaleDateString('pt-BR');
    
    const facName = remoteState.factorySettings && remoteState.factorySettings.name ? remoteState.factorySettings.name : "GELO DO VALE";
    const facCnpj = remoteState.factorySettings && remoteState.factorySettings.cnpj ? remoteState.factorySettings.cnpj : "00.000.000/0000-00";
    const facAddress = remoteState.factorySettings && remoteState.factorySettings.address ? remoteState.factorySettings.address : "Vale do Paraíba, São José dos Campos - SP";

    return `
        <div style="text-align: center; margin-bottom: 20px;">
            <h3 style="font-weight: bold; border-bottom: 2px solid var(--color-primary); padding-bottom: 10px; font-size: 1rem; color: #fff; margin: 0 0 15px 0;">INSTRUMENTO PARTICULAR DE COMODATO DE EQUIPAMENTO</h3>
        </div>
        
        <p><strong>COMODANTE:</strong> ${facName.toUpperCase()}, inscrita no CNPJ sob o nº ${facCnpj}, com sede no endereço: ${facAddress}.</p>
        <p><strong>COMODATÁRIO:</strong> ${clientName.toUpperCase()}, CNPJ/CPF: ${clientDoc}, endereço: ${clientAddress}, telefone: ${clientPhone}.</p>
        
        <p style="margin-top: 15px;">As partes qualificadas acima têm entre si justo e avençado o comodato do equipamento abaixo descrito, regulado pelas seguintes condições:</p>
        
        <h4 style="margin-top: 15px; font-weight: bold; color: var(--color-primary); font-size: 0.85rem;">CLÁUSULA 1ª - DO OBJETO E CARACTERÍSTICAS</h4>
        <p>O presente contrato tem por objeto o empréstimo gratuito (comodato) de 01 (um) freezer para conservação de gelo, de propriedade da COMODANTE, com as seguintes características:</p>
        <ul style="margin: 10px 0; padding-left: 20px; list-style-type: square; color: #cbd5e1;">
            <li><strong>Código do Freezer (Serial):</strong> ${comodato.freezerCode}</li>
            <li><strong>Marca / Modelo:</strong> ${comodato.freezerBrand || 'Não informado'}</li>
            <li><strong>Voltagem de Operação:</strong> ${comodato.freezerVoltage || 'Não informado'}</li>
            <li><strong>Capacidade (Volume):</strong> ${comodato.freezerCapacity ? comodato.freezerCapacity + (comodato.freezerCapacity.toString().toLowerCase().includes('litros') ? '' : ' Litros') : 'Não informado'}</li>
            <li><strong>Data de Entrega ao Cliente:</strong> ${dataEntrega}</li>
        </ul>
        <p>O COMODATÁRIO declara receber o equipamento em perfeitas condições de uso, funcionamento, limpeza e conservação.</p>
        
        <h4 style="margin-top: 15px; font-weight: bold; color: var(--color-primary); font-size: 0.85rem;">CLÁUSULA 2ª - DO USO E EXCLUSIVIDADE</h4>
        <p>O equipamento destina-se <strong>exclusivamente</strong> ao armazenamento e venda de gelo fornecido pela COMODANTE. Fica expressamente vedada a colocação de produtos de outras marcas ou quaisquer outros alimentos e bebidas no freezer comodado, sob pena de rescisão contratual imediata e retirada do equipamento.</p>
        
        <h4 style="margin-top: 15px; font-weight: bold; color: var(--color-primary); font-size: 0.85rem;">CLÁUSULA 3ª - DAS OBRIGAÇÕES E CONSERVAÇÃO</h4>
        <p>O COMODATÁRIO obriga-se a zelar pela conservação do freezer como se fosse seu próprio bem. A energia elétrica consumida para o funcionamento do equipamento correrá por conta exclusiva do COMODATÁRIO.</p>
        <p>Qualquer defeito técnico ou necessidade de manutenção deverá ser comunicado imediatamente à COMODANTE. Fica vedada a intervenção de terceiros não autorizados para reparos no equipamento.</p>
        
        <h4 style="margin-top: 15px; font-weight: bold; color: var(--color-primary); font-size: 0.85rem;">CLÁUSULA 4ª - DO PRAZO E RESCISÃO</h4>
        <p>O comodato é por prazo indeterminado. A COMODANTE reserva-se o direito de solicitar a devolução do equipamento a qualquer momento, mediante aviso prévio por escrito com antecedência mínima de 05 (cinco) dias, sem que caiba ao COMODATÁRIO qualquer tipo de indenização ou direito de devolução tardia.</p>
        
        <p style="margin-top: 25px; text-align: center; color: var(--color-text-muted);">Local e data: Vale do Paraíba - SP, ${dataAtual}.</p>
    `;
}

// Expose functions to window
window.migrateLegacyComodatos = migrateLegacyComodatos;
window.renderComodatosAdmin = renderComodatosAdmin;
window.openNewComodatoModal = openNewComodatoModal;
window.saveNewComodato = saveNewComodato;
window.openComodatoDetail = openComodatoDetail;
window.renderComodatoDetail = renderComodatoDetail;
window.saveComodatoNotes = saveComodatoNotes;
window.uploadComodatoPhotos = uploadComodatoPhotos;
window.deleteComodatoPhoto = deleteComodatoPhoto;
window.executeComodatoReturn = executeComodatoReturn;
window.getComodatoPortalURL = getComodatoPortalURL;
window.sendComodatoWhatsAppLink = sendComodatoWhatsAppLink;
window.sendComodatoEmailLink = sendComodatoEmailLink;
window.initPortalSignatureCanvas = initPortalSignatureCanvas;
window.initClientSigningPortal = initClientSigningPortal;
window.renderPortalInterface = renderPortalInterface;
window.showPortalSuccess = showPortalSuccess;
window.showPortalError = showPortalError;
window.renderPortalContractTerms = renderPortalContractTerms;

// --- SISTEMA DE CONTROLE DE ACESSO POR NÍVEL (RBAC) ---

function initUserAccessControl() {
    if (!state.users) {
        state.users = [];
    }
    
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
        "tab-tinas": true,
        "tab-documentos": true,
        "tab-pedidos": true,
        "tab-historico": true,
        "tab-widgets": true,
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
        "admin-tab-usuarios": true
    };
}

function initLoginScreen() {
    const select = document.getElementById("login-user-select");
    if (select && state.users) {
        select.innerHTML = state.users.map(u => `<option value="${u.id}">${u.name} (${u.username})</option>`).join("");
    }
    
    // Password visibility togglers
    initPasswordTogglers();
    
    // Handle login form submission
    const form = document.getElementById("app-login-form");
    if (form) {
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            const userId = document.getElementById("login-user-select").value;
            const password = document.getElementById("login-password").value;
            loginUser(userId, password);
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

function initPasswordTogglers() {
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
            if (window.lucide) lucide.createIcons();
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
            if (window.lucide) lucide.createIcons();
        });
    }
}

function loginUser(userId, password) {
    const user = state.users.find(u => u.id === userId);
    if (user && user.password === password) {
        sessionStorage.setItem("currentUserId", user.id);
        
        // If user is admin, also mark authenticated for settings
        if (user.username === "admin") {
            sessionStorage.setItem("admin_authenticated", "true");
        } else {
            sessionStorage.removeItem("admin_authenticated");
        }
        
        document.getElementById("login-error-msg").style.display = "none";
        document.getElementById("login-password").value = "";
        
        // Hide login screen
        document.getElementById("app-login-screen").style.display = "none";
        
        // Update user display name in sidebar
        const userDisplayName = document.getElementById("user-display-name");
        const userDisplayRole = document.getElementById("user-display-role");
        if (userDisplayName) userDisplayName.innerText = user.name;
        if (userDisplayRole) userDisplayRole.innerText = user.username === "admin" ? "Administrador" : "Colaborador";
        
        // Apply user permissions
        applyUserPermissions(user);
        
        if (window.lucide) {
            lucide.createIcons();
        }
        
        // Redirecionamento seguro se a aba ativa não for acessível
        const activeNav = document.querySelector(".nav-item.active");
        const currentTab = activeNav ? activeNav.getAttribute("data-tab") : "dashboard";
        const hasAccess = user.permissions["tab-" + currentTab];
        
        if (hasAccess === false) {
            // Ir para a primeira aba disponível nas permissões dele
            const availableTab = Object.keys(user.permissions).find(key => key.startsWith("tab-") && user.permissions[key] === true);
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

function logoutUser() {
    sessionStorage.removeItem("currentUserId");
    sessionStorage.removeItem("admin_authenticated");
    
    // Reset login inputs
    document.getElementById("login-password").value = "";
    document.getElementById("login-error-msg").style.display = "none";
    
    // Show login screen
    document.getElementById("app-login-screen").style.display = "flex";
}

function applyUserPermissions(user) {
    if (!user) return;
    
    // 1. Sidebar tabs filtering
    const navItems = document.querySelectorAll(".nav-item");
    navItems.forEach(item => {
        const tabId = item.getAttribute("data-tab");
        const hasPerm = user.permissions["tab-" + tabId];
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
        // Extract tab-name from switchAdminSubTab('tab-name')
        const match = onclickAttr.match(/switchAdminSubTab\('([^']+)'\)/);
        if (match && match[1]) {
            const subTabId = match[1];
            // Permission key format: admin-tab-financeiro, admin-tab-acerto, etc.
            const hasPerm = user.permissions["admin-tab-" + subTabId.replace("tab-", "")];
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
            // Find first visible sub-tab button and switch to it
            const firstVisibleBtn = document.querySelector(".admin-menu-btn:not([style*='display: none'])");
            if (firstVisibleBtn) {
                const match = firstVisibleBtn.getAttribute("onclick").match(/switchAdminSubTab\('([^']+)'\)/);
                if (match && match[1]) {
                    switchAdminSubTab(match[1]);
                }
            }
        }
    }
}

function navigateToTab(tabId) {
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
    
    // Parar câmera se estiver rodando e mudar de aba
    if (tabId !== "inventario") {
        stopQRScanner();
    }
    
    updateHeaderForTab(tabId);
    renderTabContent(tabId);
}

function renderUsersTable() {
    const tbody = document.getElementById("users-table-body");
    if (!tbody) return;
    
    tbody.innerHTML = "";
    
    state.users.forEach(user => {
        const isRoot = user.username === "admin";
        
        // Count and list permissions
        const activePerms = [];
        Object.keys(user.permissions).forEach(key => {
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
            // Show first 3 permissions, then "... +N"
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
                else if (p === "Admin: seguranca-backup") name = "Adm Nuvem & Backup";
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
        lucide.createIcons();
    }
}

function openUserModal(userId = "") {
    const titleEl = document.getElementById("user-modal-title");
    const idInput = document.getElementById("form-user-id");
    const nameInput = document.getElementById("user-name");
    const usernameInput = document.getElementById("user-username");
    const passwordInput = document.getElementById("user-password");
    const selectAllCheckbox = document.getElementById("user-select-all");
    
    // Reset form
    document.getElementById("user-form").reset();
    
    const checkboxes = document.querySelectorAll(".perm-checkbox");
    checkboxes.forEach(cb => {
        cb.checked = false;
        cb.disabled = false;
    });
    selectAllCheckbox.checked = false;
    selectAllCheckbox.disabled = false;
    usernameInput.disabled = false;
    
    if (userId) {
        const user = state.users.find(u => u.id === userId);
        if (!user) return;
        
        titleEl.innerText = "Editar Usuário & Acessos";
        idInput.value = user.id;
        nameInput.value = user.name;
        usernameInput.value = user.username;
        passwordInput.value = user.password;
        
        checkboxes.forEach(cb => {
            const permKey = cb.getAttribute("data-perm");
            cb.checked = !!user.permissions[permKey];
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

function saveUser(event) {
    event.preventDefault();
    
    const id = document.getElementById("form-user-id").value;
    const name = document.getElementById("user-name").value.trim();
    const username = document.getElementById("user-username").value.trim().toLowerCase();
    const password = document.getElementById("user-password").value;
    
    if (!name || !username || !password) {
        alert("Por favor, preencha todos os campos obrigatórios.");
        return;
    }
    
    const existing = state.users.find(u => u.username === username && u.id !== id);
    if (existing) {
        alert("Este login (usuário) já está em uso por outro perfil!");
        return;
    }
    
    const permissions = {};
    const checkboxes = document.querySelectorAll(".perm-checkbox");
    checkboxes.forEach(cb => {
        const permKey = cb.getAttribute("data-perm");
        permissions[permKey] = cb.checked;
    });
    
    if (id) {
        const index = state.users.findIndex(u => u.id === id);
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
    
    saveState();
    closeModal("modal-user-form");
    
    // Update select options in login screen
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
    
    alert("Usuário salvo com sucesso!");
}

function deleteUser(userId) {
    const user = state.users.find(u => u.id === userId);
    if (!user) return;
    
    if (user.username === "admin") {
        alert("O usuário Administrador padrão não pode ser excluído.");
        return;
    }
    
    if (confirm(`Tem certeza que deseja excluir o usuário "${user.name}"?`)) {
        state.users = state.users.filter(u => u.id !== userId);
        saveState();
        
        // Update select options in login screen
        const select = document.getElementById("login-user-select");
        if (select) {
            select.innerHTML = state.users.map(u => `<option value="${u.id}">${u.name} (${u.username})</option>`).join("");
        }
        
        if (window.activeAdminSubTab === "tab-usuarios") {
            renderUsersTable();
        }
        
        alert("Usuário excluído com sucesso!");
    }
}

function toggleSelectAllPermissions(checked) {
    const idInput = document.getElementById("form-user-id").value;
    if (idInput) {
        const user = state.users.find(u => u.id === idInput);
        if (user && user.username === "admin") return;
    }
    
    const checkboxes = document.querySelectorAll(".perm-checkbox");
    checkboxes.forEach(cb => {
        cb.checked = checked;
    });
}

// Expose functions to window
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

// ==========================================================================
// SISTEMA DE WIDGETS PERSONALIZÁVEIS E RELÓGIO ANALÓGICO
// ==========================================================================

const ALL_WIDGETS = [
    { id: "clock", name: "RelÃ³gio (Tempo)", desc: "RelÃ³gio analÃ³gico redondo com ponteiros ou digital de alta precisÃ£o.", styles: [
        { id: "analog-neon", name: "AnalÃ³gico Cyber Neon" },
        { id: "analog-gold", name: "AnalÃ³gico Ouro ClÃ¡ssico" },
        { id: "analog-minimal", name: "AnalÃ³gico Minimalista" },
        { id: "digital-neon", name: "Digital Neon Blue" },
        { id: "digital-retro", name: "Digital Verde Retro" }
    ]},
    { id: "weather", name: "Climatologia & Clima", desc: "Clima atual regional e previsÃ£o grÃ¡fica de fim de semana.", styles: [
        { id: "detailed", name: "VisualizaÃ§Ã£o Detalhada" },
        { id: "minimal", name: "VisualizaÃ§Ã£o MÃ­nima" },
        { id: "graph", name: "GrÃ¡fico de PrevisÃ£o" }
    ]},
    { id: "calendar", name: "CalendÃ¡rio & Agenda", desc: "Mini-grade mensal ou lista de lembretes importantes agendados.", styles: [
        { id: "interactive", name: "Grade Mensal Interativa" },
        { id: "list", name: "Lista de Eventos/Lembretes" }
    ]},
    { id: "notepad", name: "Bloco de Notas", desc: "Sticky note para anotaÃ§Ãµes rÃ¡pidas e sincronizadas com a fÃ¡brica.", styles: [
        { id: "glass-sticky", name: "Vidro/Neon Glass" },
        { id: "terminal", name: "Terminal Verde Hacker" },
        { id: "yellow-pad", name: "Post-it Amarelo ClÃ¡ssico" }
    ]},
    { id: "sales_calc", name: "Calculadora de Troco", desc: "UtilitÃ¡rio rÃ¡pido para verificar troco de compras de sacos de gelo.", styles: [
        { id: "modern", name: "Interface PadrÃ£o" }
    ]},
    { id: "sales_goal", name: "Meta de Vendas DiÃ¡ria", desc: "GrÃ¡fico circular indicando o atingimento da meta de vendas do dia.", styles: [
        { id: "modern", name: "Interface Circular" }
    ]},
    { id: "financial", name: "Financeiro RÃ¡pido", desc: "Fluxo de pagamentos e faturamento de hoje detalhado.", styles: [
        { id: "detailed", name: "VisualizaÃ§Ã£o Detalhada" },
        { id: "simple", name: "VisualizaÃ§Ã£o Simples" }
    ]},
    { id: "ice_stock", name: "Estoque nos Clientes", desc: "Estoque somado de gelo e carvÃ£o nos freezers dos clientes.", styles: [
        { id: "progress", name: "Barras de Progresso" },
        { id: "grid", name: "Grade Detalhada" }
    ]},
    { id: "contacts", name: "Contatos de EmergÃªncia", desc: "Telefones importantes como manutenÃ§Ã£o e suporte tÃ©cnico.", styles: [
        { id: "cards", name: "Lista de CartÃµes" }
    ]}
];

function renderDrawerClock() {
    const container = document.getElementById("drawer-clock-container");
    if (!container) return;
    
    const style = (state.widgetsConfig && state.widgetsConfig.styles && state.widgetsConfig.styles["clock"]) || "analog-neon";
    const isAnalog = style.startsWith("analog");
    
    // Obter data por extenso para o portuguÃªs do Brasil
    const now = new Date();
    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    let dateStr = now.toLocaleDateString('pt-BR', options);
    dateStr = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
    
    if (isAnalog) {
        container.innerHTML = `
            <div style="display: flex; gap: 15px; align-items: center; width: 100%;">
                <div class="analog-clock-container" style="transform: scale(0.5); transform-origin: left center; height: 75px; width: 75px; flex-shrink: 0; margin-bottom: 0;">
                    <div class="analog-clock ${style}">
                        <div class="clock-center-dot"></div>
                        <div class="hand hour"></div>
                        <div class="hand minute"></div>
                        <div class="hand second"></div>
                        <div class="marker-line quarter" style="transform: rotate(0deg);"></div>
                        <div class="marker-line quarter" style="transform: rotate(90deg);"></div>
                        <div class="marker-line quarter" style="transform: rotate(180deg);"></div>
                        <div class="marker-line quarter" style="transform: rotate(270deg);"></div>
                    </div>
                </div>
                <div>
                    <div style="font-size: 0.95rem; font-weight: bold; color: #fff;">RelÃ³gio AnalÃ³gico</div>
                    <div style="font-size: 0.72rem; color: var(--color-text-muted); margin-top: 2px;">${dateStr}</div>
                </div>
            </div>
        `;
    } else {
        container.innerHTML = `
            <div class="digital-clock-widget ${style}" style="background: none; border: none; padding: 0; min-height: auto; align-items: flex-start; text-align: left; box-shadow: none;">
                <div class="digital-clock-time widget-digital-time" id="drawer-clock" style="font-size: 2rem; font-weight: 700; font-family: monospace; letter-spacing: 1px; line-height: 1;">00:00:00</div>
                <div id="drawer-date" style="font-size: 0.75rem; color: var(--color-text-muted); margin-top: 4px;">${dateStr}</div>
            </div>
        `;
    }
}

function renderWidgets() {
    const containerTab = document.getElementById("widgets-board-container");
    const containerDash = document.getElementById("dashboard-widgets-board-container");
    
    const active = (state.widgetsConfig && state.widgetsConfig.activeWidgets) || [];
    const sizes = (state.widgetsConfig && state.widgetsConfig.sizes) || {};
    
    // Renderizar relÃ³gio do topo do Drawer
    renderDrawerClock();
    
    // Verificar permissÃµes para exibiÃ§Ã£o no dashboard principal
    let showOnDashboard = false;
    const currentUserId = sessionStorage.getItem("currentUserId");
    if (currentUserId && state.users) {
        const currentUser = state.users.find(u => u.id === currentUserId);
        if (currentUser && currentUser.permissions["tab-widgets"] !== false) {
            showOnDashboard = true;
        }
    } else {
        // Fallback admin ou sem login definido
        showOnDashboard = true;
    }
    
    // Atualizar visibilidade do container no Dashboard
    if (containerDash) {
        if (showOnDashboard && active.length > 0) {
            containerDash.style.display = "grid";
        } else {
            containerDash.style.display = "none";
        }
    }
    
    const targets = [];
    if (containerTab) {
        containerTab.innerHTML = "";
        targets.push({ element: containerTab, isDash: false });
    }
    if (containerDash && showOnDashboard) {
        containerDash.innerHTML = "";
        targets.push({ element: containerDash, isDash: true });
    }
    
    if (targets.length === 0) return;
    
    if (active.length === 0) {
        if (containerTab) {
            containerTab.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1; padding: 4rem 1rem;">
                    <i data-lucide="layout-grid" style="width: 48px; height: 48px; color: var(--color-text-muted); margin-bottom: 1rem; display: block; margin-left: auto; margin-right: auto;"></i>
                    <p style="color: var(--color-text-muted);">Nenhum widget ativo. Clique em 'Personalizar Widgets' para adicionar!</p>
                </div>
            `;
        }
        lucide.createIcons();
        return;
    }
    
    targets.forEach(t => {
        const isDash = t.isDash;
        const targetElement = t.element;
        
        active.forEach(wId => {
            const card = document.createElement("div");
            const wSize = sizes[wId] || "small";
            card.className = "widget-card size-" + wSize;
            card.id = "widget-card-" + (isDash ? 'dash-' : '') + wId;
            
            let headerHTML = "";
            let bodyHTML = "";
            const style = (state.widgetsConfig && state.widgetsConfig.styles && state.widgetsConfig.styles[wId]) || "default";
            
            switch (wId) {
                case "clock":
                    const isAnalog = style.startsWith("analog");
                    headerHTML = `
                        <h3><i data-lucide="clock"></i> RelÃ³gio</h3>
                        <div class="widget-controls">
                            <span class="status-badge completed" style="font-size: 0.6rem; padding: 2px 6px;">${isAnalog ? 'AnalÃ³gico' : 'Digital'}</span>
                        </div>
                    `;
                    if (isAnalog) {
                        bodyHTML = `
                            <div class="analog-clock-container">
                                <div class="analog-clock ${style}">
                                    <div class="clock-center-dot"></div>
                                    <div class="hand hour"></div>
                                    <div class="hand minute"></div>
                                    <div class="hand second"></div>
                                    <div class="marker-line quarter" style="transform: rotate(0deg);"></div>
                                    <div class="marker-line quarter" style="transform: rotate(90deg);"></div>
                                    <div class="marker-line quarter" style="transform: rotate(180deg);"></div>
                                    <div class="marker-line quarter" style="transform: rotate(270deg);"></div>
                                    <div class="marker-line" style="transform: rotate(30deg);"></div>
                                    <div class="marker-line" style="transform: rotate(60deg);"></div>
                                    <div class="marker-line" style="transform: rotate(120deg);"></div>
                                    <div class="marker-line" style="transform: rotate(150deg);"></div>
                                    <div class="marker-line" style="transform: rotate(210deg);"></div>
                                    <div class="marker-line" style="transform: rotate(240deg);"></div>
                                    <div class="marker-line" style="transform: rotate(300deg);"></div>
                                    <div class="marker-line" style="transform: rotate(330deg);"></div>
                                </div>
                            </div>
                        `;
                    } else {
                        bodyHTML = `
                            <div class="digital-clock-widget ${style}">
                                <div class="digital-clock-time widget-digital-time">00:00:00</div>
                                <div class="digital-clock-date widget-digital-date">Carregando...</div>
                            </div>
                        `;
                    }
                    break;
                    
                case "weather":
                    headerHTML = `
                        <h3><i data-lucide="thermometer-sun"></i> Clima & Climatologia</h3>
                        <div class="widget-controls">
                            <button class="btn btn-secondary btn-icon-only" onclick="syncWeatherManual()" title="Sincronizar" style="padding: 2px; height: 22px; width: 22px; background: none; border: none; cursor: pointer;">
                                <i data-lucide="refresh-cw" style="width: 12px; height: 12px; color: var(--color-text-muted);"></i>
                            </button>
                        </div>
                    `;
                    
                    const wCity = (state.weatherConfig && state.weatherConfig.city) || "S.J. Campos";
                    const wTemp = (state.weatherConfig && state.weatherConfig.temp) || 24;
                    const wCond = (state.weatherConfig && state.weatherConfig.condition) || "sun";
                    const condDesc = WEATHER_CONDITIONS[wCond]?.desc || "Limpo";
                    const condIcon = WEATHER_CONDITIONS[wCond]?.icon || "sun";
                    const condColor = WEATHER_CONDITIONS[wCond]?.color || "#eab308";
                    
                    if (style === "minimal") {
                        bodyHTML = `
                            <div class="weather-widget" style="text-align: center; padding: 1rem 0;">
                                <div style="font-size: 2.2rem; font-weight: bold; color: #fff; display: flex; align-items: center; justify-content: center; gap: 8px;">
                                    <span style="font-size: 2rem; color: ${condColor}; display: flex; align-items: center;"><i data-lucide="${condIcon}" style="width: 36px; height: 36px;"></i></span>
                                    <span>${wTemp}°C</span>
                                </div>
                                <div style="font-size: 0.8rem; color: var(--color-text-muted); margin-top: 4px;">${condDesc} - ${wCity}</div>
                            </div>
                        `;
                    } else if (style === "graph") {
                        bodyHTML = `
                            <div class="weather-widget">
                                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                                    <span style="font-size:0.85rem; font-weight:bold;">${wCity}</span>
                                    <span style="font-size:0.95rem; font-weight:bold; color:var(--color-primary);">${wTemp}°C</span>
                                </div>
                                <div class="weather-graph-chart">
                                    <svg viewBox="0 0 200 60" style="width:100%; height:100%; overflow:visible;">
                                        <path d="M 0 45 Q 33 20 66 35 T 132 15 T 200 25" fill="none" stroke="var(--color-primary)" stroke-width="2"></path>
                                        <circle cx="66" cy="35" r="3" fill="#fff"></circle>
                                        <text x="66" y="52" fill="var(--color-text-muted)" font-size="7" text-anchor="middle">Hoje (${wTemp}°)</text>
                                        <text x="132" y="10" fill="var(--color-warning)" font-size="7" text-anchor="middle">Sáb (28°)</text>
                                        <text x="180" y="20" fill="var(--color-warning)" font-size="7" text-anchor="middle">Dom (31°)</text>
                                    </svg>
                                </div>
                            </div>
                        `;
                    } else { // detailed
                        bodyHTML = `
                            <div class="weather-widget">
                                <div class="weather-detailed-card">
                                    <div class="weather-main-info">
                                        <div>
                                            <div style="font-size: 1.6rem; font-weight: bold; color: #fff;">${wTemp}°C</div>
                                            <div style="font-size: 0.8rem; color: var(--color-text-muted);">${wCity}</div>
                                        </div>
                                        <i data-lucide="${condIcon}" style="width: 42px; height: 42px; color: ${condColor};"></i>
                                    </div>
                                    <div class="weather-grid-details">
                                        <div class="weather-detail-item">
                                            <i data-lucide="droplet" style="width: 12px; height: 12px;"></i> Umidade: <span>65%</span>
                                        </div>
                                        <div class="weather-detail-item">
                                            <i data-lucide="wind" style="width: 12px; height: 12px;"></i> Vento: <span>14 km/h</span>
                                        </div>
                                        <div class="weather-detail-item">
                                            <i data-lucide="eye" style="width: 12px; height: 12px;"></i> UV: <span>Baixo</span>
                                        </div>
                                        <div class="weather-detail-item">
                                            <i data-lucide="trending-up" style="width: 12px; height: 12px;"></i> PrevisÃ£o: <span>${condDesc}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `;
                    }
                    break;
                    
                case "calendar":
                    headerHTML = `
                        <h3><i data-lucide="calendar"></i> CalendÃ¡rio</h3>
                        <div class="widget-controls">
                            <span class="status-badge completed" style="font-size: 0.6rem; padding: 2px 6px;">${style === 'interactive' ? 'Interativo' : 'Agenda'}</span>
                        </div>
                    `;
                    
                    if (style === "interactive") {
                        const mName = ["Janeiro", "Fevereiro", "MarÃ§o", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"][currentCalendarMonth];
                        bodyHTML = `
                            <div class="weather-widget" style="width: 100%;">
                                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                                    <span style="font-size:0.8rem; font-weight:bold; color:#fff;">${mName} ${currentCalendarYear}</span>
                                    <span style="font-size:0.65rem; color:var(--color-primary); font-weight:600; cursor:pointer;" onclick="toggleUtilityDrawer()">Lembretes</span>
                                </div>
                                <div style="display: grid; grid-template-columns: repeat(7, 1fr); text-align: center; font-size: 0.6rem; color: var(--color-text-muted); font-weight: bold; margin-bottom: 4px;">
                                    <span>D</span><span>S</span><span>T</span><span>Q</span><span>Q</span><span>S</span><span>S</span>
                                </div>
                                <div class="widget-calendar-days" style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; text-align: center; font-size: 0.7rem;">
                                </div>
                            </div>
                        `;
                    } else { // list
                        const notes = state.calendarNotes || {};
                        let eventsListHTML = "";
                        let count = 0;
                        
                        for (const key in notes) {
                            if (notes[key] && notes[key].trim() !== "") {
                                const dateParts = key.split('-');
                                const dayFormatted = dateParts[2] + "/" + dateParts[1];
                                eventsListHTML += `
                                    <div style="display:flex; gap:8px; border-bottom:1px solid rgba(255,255,255,0.03); padding-bottom:6px; margin-bottom:6px; font-size:0.75rem;">
                                        <span style="color:var(--color-primary); font-weight:bold; flex-shrink:0;">${dayFormatted}:</span>
                                        <span style="color:#cbd5e1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; width:100%; text-align:left;" title="${notes[key]}">${notes[key]}</span>
                                    </div>
                                `;
                                count++;
                            }
                        }
                        
                        if (count === 0) {
                            eventsListHTML = `<div style="text-align:center; padding:1.5rem; font-size:0.75rem; color:var(--color-text-muted);">Nenhum lembrete salvo no calendÃ¡rio.</div>`;
                        }
                        
                        bodyHTML = `
                            <div style="width: 100%; max-height: 170px; overflow-y: auto;">
                                <div style="font-size:0.8rem; font-weight:bold; color:#fff; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
                                    <span>Lembretes Ativos</span>
                                    <span class="status-badge pending" style="font-size:0.6rem; padding: 2px 6px;">${count} Notas</span>
                                </div>
                                ${eventsListHTML}
                            </div>
                        `;
                    }
                    break;
                    
                case "notepad":
                    headerHTML = `
                        <h3><i data-lucide="edit-3"></i> Bloco de Notas</h3>
                        <div class="widget-controls">
                            <span class="widget-notepad-status" style="font-size: 0.6rem; color: var(--color-text-muted); align-self:center; margin-right:4px;">Salvo</span>
                        </div>
                    `;
                    
                    const noteText = state.notepadText || "";
                    let padClass = "notepad-glass-sticky";
                    if (style === "terminal") padClass = "notepad-terminal";
                    if (style === "yellow-pad") padClass = "notepad-yellow-pad";
                    
                    bodyHTML = `
                        <div class="${padClass}" style="width: 100%; flex: 1; display: flex; flex-direction: column; min-height: 160px;">
                            <textarea class="widget-notepad-textarea" placeholder="AnotaÃ§Ãµes rÃ¡pidas..."></textarea>
                        </div>
                    `;
                    break;
                    
                case "sales_calc":
                    headerHTML = `
                        <h3><i data-lucide="calculator"></i> Calc Troco</h3>
                        <div class="widget-controls">
                            <span class="status-badge completed" style="font-size: 0.6rem; padding: 2px 6px;">Troco</span>
                        </div>
                    `;
                    
                    bodyHTML = `
                        <div class="sales-calc-widget">
                            <div class="sales-calc-display widget-calc-display" style="font-size:1.1rem; font-weight:bold; color:#00f0ff;">R$ 0,00</div>
                            <div style="display:flex; gap:4px; font-size:0.7rem;">
                                <input type="number" class="widget-calc-val-total" placeholder="Total R$" style="width:50%; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.08); border-radius:4px; padding:4px; color:#fff; outline:none;" oninput="calcWidgetChange(this)">
                                <input type="number" class="widget-calc-val-pago" placeholder="Pago R$" style="width:50%; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.08); border-radius:4px; padding:4px; color:#fff; outline:none;" oninput="calcWidgetChange(this)">
                            </div>
                            <div style="display:flex; justify-content:space-between; font-size:0.72rem; color:var(--color-text-muted); border-top:1px solid rgba(255,255,255,0.05); padding-top:6px; margin-top:2px;">
                                <span>Troco a devolver:</span>
                                <span class="widget-calc-change" style="font-weight:bold; color:#10b981;">R$ 0,00</span>
                            </div>
                        </div>
                    `;
                    break;
                    
                case "sales_goal":
                    headerHTML = `
                        <h3><i data-lucide="trending-up"></i> Meta DiÃ¡ria</h3>
                        <div class="widget-controls">
                            <span class="status-badge completed" style="font-size: 0.6rem; padding: 2px 6px;">Vendas</span>
                        </div>
                    `;
                    
                    const todayStrGoal = new Date().toISOString().split('T')[0];
                    const todayDeliveries = state.deliveries ? state.deliveries.filter(d => d.date.startsWith(todayStrGoal)) : [];
                    const todayRevenue = todayDeliveries.reduce((sum, d) => sum + (d.revenue || 0), 0);
                    
                    const target = 1500;
                    const percent = Math.min(100, Math.round((todayRevenue / target) * 100));
                    
                    const r = 45;
                    const circumference = 2 * Math.PI * r;
                    const offset = circumference - (percent / 100) * circumference;
                    
                    bodyHTML = `
                        <div class="sales-goal-widget">
                            <div class="circular-progress-container">
                                <svg class="circular-progress-svg">
                                    <circle class="circular-progress-bg" cx="55" cy="55" r="45"></circle>
                                    <circle class="circular-progress-bar" cx="55" cy="55" r="45" style="stroke-dashoffset: ${offset};"></circle>
                                </svg>
                                <span class="circular-progress-text">${percent}%</span>
                            </div>
                            <div style="text-align:center; font-size:0.75rem;">
                                <div style="color:#fff; font-weight:600;">Hoje: R$ ${todayRevenue.toFixed(2).replace('.', ',')}</div>
                                <div style="color:var(--color-text-muted); font-size:0.65rem;">Meta DiÃ¡ria: R$ ${target.toFixed(2).replace('.', ',')}</div>
                            </div>
                        </div>
                    `;
                    break;

                case "financial":
                    headerHTML = `
                        <h3><i data-lucide="dollar-sign"></i> Resumo Financeiro</h3>
                        <div class="widget-controls">
                            <span class="status-badge completed" style="font-size: 0.6rem; padding: 2px 6px;">Hoje</span>
                        </div>
                    `;
                    
                    const todayStrFin = new Date().toISOString().split('T')[0];
                    const todayDelsFin = state.deliveries ? state.deliveries.filter(d => d.date.startsWith(todayStrFin)) : [];
                    const totalTodayFin = todayDelsFin.reduce((sum, d) => sum + (d.revenue || 0), 0);
                    
                    let pixFin = 0, dinheiroFin = 0, cartaoFin = 0, prazoFin = 0;
                    todayDelsFin.forEach(d => {
                        const method = (d.paymentMethod || "").toLowerCase();
                        const rev = d.revenue || 0;
                        if (method.indexOf("pix") !== -1) pixFin += rev;
                        else if (method.indexOf("dinheiro") !== -1) dinheiroFin += rev;
                        else if (method.indexOf("cartÃ£o") !== -1 || method.indexOf("cartao") !== -1 || method.indexOf("debito") !== -1 || method.indexOf("credito") !== -1) cartaoFin += rev;
                        else if (method.indexOf("prazo") !== -1) prazoFin += rev;
                        else dinheiroFin += rev;
                    });

                    if (style === "simple") {
                        bodyHTML = `
                            <div style="text-align: center; padding: 0.5rem 0;">
                                <div style="font-size: 0.75rem; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.05em;">Vendas de Hoje</div>
                                <div style="font-size: 1.8rem; font-weight: bold; color: #10b981; margin-top: 4px;">R$ ${totalTodayFin.toFixed(2).replace('.', ',')}</div>
                                <div style="font-size: 0.7rem; color: var(--color-text-muted); margin-top: 4px;">${todayDelsFin.length} entregas realizadas</div>
                            </div>
                        `;
                    } else { // detailed
                        bodyHTML = `
                            <div style="width: 100%;">
                                <div style="display:flex; justify-content:space-between; margin-bottom: 8px; font-size: 0.85rem; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 4px;">
                                    <span style="color:#fff; font-weight:600;">Total Faturado:</span>
                                    <span style="color:#10b981; font-weight:bold;">R$ ${totalTodayFin.toFixed(2).replace('.', ',')}</span>
                                </div>
                                <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 0.72rem;">
                                    <div style="background:rgba(255,255,255,0.02); padding: 6px; border-radius: 4px; border:1px solid rgba(255,255,255,0.03);">
                                        <span style="color:var(--color-text-muted); display:block;">Pix:</span>
                                        <strong style="color:#fff; font-size:0.8rem;">R$ ${pixFin.toFixed(2).replace('.', ',')}</strong>
                                    </div>
                                    <div style="background:rgba(255,255,255,0.02); padding: 6px; border-radius: 4px; border:1px solid rgba(255,255,255,0.03);">
                                        <span style="color:var(--color-text-muted); display:block;">Dinheiro:</span>
                                        <strong style="color:#fff; font-size:0.8rem;">R$ ${dinheiroFin.toFixed(2).replace('.', ',')}</strong>
                                    </div>
                                    <div style="background:rgba(255,255,255,0.02); padding: 6px; border-radius: 4px; border:1px solid rgba(255,255,255,0.03);">
                                        <span style="color:var(--color-text-muted); display:block;">CartÃ£o:</span>
                                        <strong style="color:#fff; font-size:0.8rem;">R$ ${cartaoFin.toFixed(2).replace('.', ',')}</strong>
                                    </div>
                                    <div style="background:rgba(255,255,255,0.02); padding: 6px; border-radius: 4px; border:1px solid rgba(255,255,255,0.03);">
                                        <span style="color:var(--color-text-muted); display:block;">A Prazo:</span>
                                        <strong style="color:#f59e0b; font-size:0.8rem;">R$ ${prazoFin.toFixed(2).replace('.', ',')}</strong>
                                    </div>
                                </div>
                            </div>
                        `;
                    }
                    break;

                case "ice_stock":
                    headerHTML = `
                        <h3><i data-lucide="warehouse"></i> Estoque nos Clientes</h3>
                        <div class="widget-controls">
                            <span class="status-badge pending" style="font-size: 0.6rem; padding: 2px 6px;">Freezers</span>
                        </div>
                    `;
                    
                    const clientStocks = {};
                    const clientMaxCapacities = {};
                    if (state.clients) {
                        state.clients.forEach(c => {
                            if (c.stock) {
                                for (const prodId in c.stock) {
                                    clientStocks[prodId] = (clientStocks[prodId] || 0) + (c.stock[prodId] || 0);
                                }
                            }
                            if (c.capacities) {
                                for (const prodId in c.capacities) {
                                    clientMaxCapacities[prodId] = (clientMaxCapacities[prodId] || 0) + (c.capacities[prodId] || 0);
                                }
                            }
                        });
                    }
                    
                    const activeProdsForStock = state.products ? state.products.filter(p => p.active && (p.type === 'Gelo' || p.type === 'Gelo Saborizado' || p.type === 'CarvÃ£o')) : [];
                    
                    let stockItemsHTML = "";
                    if (style === "progress") {
                        activeProdsForStock.forEach(p => {
                            const current = clientStocks[p.id] || 0;
                            const max = clientMaxCapacities[p.id] || current || 1;
                            const pct = Math.min(100, Math.round((current / max) * 100));
                            const isLow = pct < 30;
                            stockItemsHTML += `
                                <div style="margin-bottom: 8px;">
                                    <div style="display:flex; justify-content:space-between; font-size:0.7rem; color:#cbd5e1; margin-bottom: 2px;">
                                        <span>${p.name.replace('Pacote Gelo ', '')}</span>
                                        <strong>${current} / ${max} un (${pct}%)</strong>
                                    </div>
                                    <div style="height:6px; background:rgba(255,255,255,0.05); border-radius:3px; overflow:hidden;">
                                        <div style="height:100%; width:${pct}%; background:${isLow ? 'var(--color-danger)' : 'var(--color-primary)'}; border-radius:3px; transition: width 0.3s ease;"></div>
                                    </div>
                                </div>
                            `;
                        });
                    } else { // grid
                        stockItemsHTML += `<div style="display:grid; grid-template-columns:1fr 1fr; gap:6px;">`;
                        activeProdsForStock.forEach(p => {
                            const current = clientStocks[p.id] || 0;
                            stockItemsHTML += `
                                <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.03); border-radius:4px; padding:6px; display:flex; flex-direction:column; align-items:center;">
                                    <span style="font-size:0.62rem; color:var(--color-text-muted); text-align:center; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; width:100%;" title="${p.name}">${p.name.replace('Pacote Gelo ', '')}</span>
                                    <strong style="font-size:0.95rem; color:var(--color-primary); margin-top:2px;">${current} <span style="font-size:0.6rem; color:var(--color-text-muted); font-weight:normal;">un</span></strong>
                                </div>
                            `;
                        });
                        stockItemsHTML += `</div>`;
                    }
                    
                    if (activeProdsForStock.length === 0) {
                        stockItemsHTML = `<div style="text-align:center; padding:1rem; font-size:0.75rem; color:var(--color-text-muted);">Nenhum produto cadastrado.</div>`;
                    }
                    
                    bodyHTML = `<div style="width: 100%; max-height: 180px; overflow-y: auto; padding-right: 2px;">${stockItemsHTML}</div>`;
                    break;

                case "contacts":
                    headerHTML = `
                        <h3><i data-lucide="phone-call"></i> Contatos RÃ¡pidos</h3>
                        <div class="widget-controls">
                            <span class="status-badge completed" style="font-size: 0.6rem; padding: 2px 6px;">Suporte</span>
                        </div>
                    `;
                    
                    bodyHTML = `
                        <div style="width: 100%; display: flex; flex-direction: column; gap: 8px;">
                            <a href="tel:12998876655" style="display:flex; align-items:center; justify-content:space-between; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.04); border-radius:6px; padding:8px; text-decoration:none; color:inherit; transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.06)'" onmouseout="this.style.background='rgba(255,255,255,0.02)'">
                                <div style="display:flex; align-items:center; gap:8px;">
                                    <div style="width:24px; height:24px; border-radius:50%; background:rgba(0,240,255,0.1); display:flex; align-items:center; justify-content:center;"><i data-lucide="phone" style="width:12px; height:12px; color:var(--color-primary);"></i></div>
                                    <div>
                                        <span style="font-size:0.72rem; font-weight:600; display:block; color:#fff;">FÃ¡brica (EscritÃ³rio)</span>
                                        <span style="font-size:0.62rem; color:var(--color-text-muted);">(12) 99887-6655</span>
                                    </div>
                                </div>
                                <i data-lucide="external-link" style="width:12px; height:12px; color:var(--color-text-muted);"></i>
                            </a>
                            <a href="tel:12991112222" style="display:flex; align-items:center; justify-content:space-between; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.04); border-radius:6px; padding:8px; text-decoration:none; color:inherit; transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.06)'" onmouseout="this.style.background='rgba(255,255,255,0.02)'">
                                <div style="display:flex; align-items:center; gap:8px;">
                                    <div style="width:24px; height:24px; border-radius:50%; background:rgba(16,185,129,0.1); display:flex; align-items:center; justify-content:center;"><i data-lucide="wrench" style="width:12px; height:12px; color:#10b981;"></i></div>
                                    <div>
                                        <span style="font-size:0.72rem; font-weight:600; display:block; color:#fff;">ManutenÃ§Ã£o Freezers</span>
                                        <span style="font-size:0.62rem; color:var(--color-text-muted);">(12) 99111-2222</span>
                                    </div>
                                </div>
                                <i data-lucide="external-link" style="width:12px; height:12px; color:var(--color-text-muted);"></i>
                            </a>
                            <a href="tel:123456789" style="display:flex; align-items:center; justify-content:space-between; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.04); border-radius:6px; padding:8px; text-decoration:none; color:inherit; transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.06)'" onmouseout="this.style.background='rgba(255,255,255,0.02)'">
                                <div style="display:flex; align-items:center; gap:8px;">
                                    <div style="width:24px; height:24px; border-radius:50%; background:rgba(239,68,68,0.1); display:flex; align-items:center; justify-content:center;"><i data-lucide="shield" style="width:12px; height:12px; color:#ef4444;"></i></div>
                                    <div>
                                        <span style="font-size:0.72rem; font-weight:600; display:block; color:#fff;">Suporte TÃ©cnico</span>
                                        <span style="font-size:0.62rem; color:var(--color-text-muted);">GelControl Help</span>
                                    </div>
                                </div>
                                <i data-lucide="external-link" style="width:12px; height:12px; color:var(--color-text-muted);"></i>
                            </a>
                        </div>
                    `;
                    break;
            }
            
            card.innerHTML = `
                <div class="widget-header">
                    ${headerHTML}
                </div>
                <div class="widget-body">
                    ${bodyHTML}
                </div>
            `;
            
            targetElement.appendChild(card);
        });
    });
    
    lucide.createIcons();
    
    // Configurar blocos de notas no DOM (sincronizando escrita e injetando valor inicial)
    setTimeout(() => {
        const textareas = document.querySelectorAll(".widget-notepad-textarea");
        const noteTextVal = state.notepadText || "";
        textareas.forEach(txt => {
            txt.value = noteTextVal;
            txt.addEventListener("input", (e) => {
                const val = e.target.value;
                state.notepadText = val;
                saveStateLocalOnly();
                
                // Atualiza todas as outras caixas de bloco de notas em tempo real
                document.querySelectorAll(".widget-notepad-textarea").forEach(other => {
                    if (other !== e.target && other.value !== val) {
                        other.value = val;
                    }
                });
                
                const genNotepad = document.getElementById("general-notepad");
                if (genNotepad) genNotepad.value = val;
                
                const statusEls = document.querySelectorAll(".widget-notepad-status");
                statusEls.forEach(status => {
                    status.innerText = "Salvando...";
                });
                
                if (window.widgetSaveTimeout) clearTimeout(window.widgetSaveTimeout);
                window.widgetSaveTimeout = setTimeout(() => {
                    statusEls.forEach(status => {
                        status.innerText = "Salvo";
                    });
                    saveState();
                }, 1000);
            });
        });
    }, 0);
    
    // Renderizar calendÃ¡rios nos widgets
    setTimeout(() => renderWidgetCalendar(), 0);
    
    // ForÃ§ar atualizaÃ§Ã£o imediata do relÃ³gio
    updateClocks();
}

function renderWidgetCalendar() {
    const daysContainers = document.querySelectorAll(".widget-calendar-days");
    if (daysContainers.length === 0) return;
    
    daysContainers.forEach(daysContainer => {
        daysContainer.innerHTML = "";
        
        const year = currentCalendarYear;
        const month = currentCalendarMonth;
        
        const firstDayIndex = new Date(year, month, 1).getDay();
        const totalDays = new Date(year, month + 1, 0).getDate();
        const prevTotalDays = new Date(year, month, 0).getDate();
        
        const today = new Date();
        const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
        const currentDay = today.getDate();
        
        for (let i = firstDayIndex; i > 0; i--) {
            const day = prevTotalDays - i + 1;
            const cell = document.createElement("div");
            cell.style.color = "rgba(255, 255, 255, 0.1)";
            cell.style.padding = "4px";
            cell.innerText = day;
            daysContainer.appendChild(cell);
        }
        
        for (let day = 1; day <= totalDays; day++) {
            const cell = document.createElement("div");
            cell.style.padding = "4px";
            cell.style.borderRadius = "4px";
            cell.innerText = day;
            
            const dateStr = year + "-" + String(month + 1).padStart(2, '0') + "-" + String(day).padStart(2, '0');
            const hasNote = state.calendarNotes && state.calendarNotes[dateStr] && state.calendarNotes[dateStr].trim() !== "";
            
            if (hasNote) {
                cell.style.border = "1px solid var(--color-primary)";
                cell.title = state.calendarNotes[dateStr];
            }
            
            if (isCurrentMonth && day === currentDay) {
                cell.style.background = "var(--color-primary)";
                cell.style.color = "#000";
                cell.style.fontWeight = "bold";
            } else if (hasNote) {
                cell.style.color = "var(--color-primary)";
            } else {
                cell.style.color = "#fff";
            }
            
            daysContainer.appendChild(cell);
        }
    });
}

function calcWidgetChange(input) {
    const card = input.closest(".widget-card");
    if (!card) return;
    
    const totalInput = card.querySelector(".widget-calc-val-total");
    const pagoInput = card.querySelector(".widget-calc-val-pago");
    const display = card.querySelector(".widget-calc-display");
    const change = card.querySelector(".widget-calc-change");
    
    if (!totalInput || !pagoInput) return;
    
    const total = parseFloat(totalInput.value) || 0;
    const pago = parseFloat(pagoInput.value) || 0;
    
    if (total > 0) {
        display.innerText = "R$ " + total.toFixed(2).replace('.', ',');
    } else {
        display.innerText = "R$ 0,00";
    }
    
    const diff = pago - total;
    if (change) {
        if (diff > 0) {
            change.innerText = "R$ " + diff.toFixed(2).replace('.', ',');
            change.style.color = "#10b981";
        } else if (diff === 0) {
            change.innerText = "R$ 0,00";
            change.style.color = "var(--color-text-muted)";
        } else {
            change.innerText = "Falta R$ " + Math.abs(diff).toFixed(2).replace('.', ',');
            change.style.color = "var(--color-danger)";
        }
    }
}

function renderWidgetSettingsList() {
    const list = document.getElementById("widgets-setup-list");
    if (!list) return;
    
    list.innerHTML = "";
    
    const active = (state.widgetsConfig && state.widgetsConfig.activeWidgets) || [];
    const styles = (state.widgetsConfig && state.widgetsConfig.styles) || {};
    const sizes = (state.widgetsConfig && state.widgetsConfig.sizes) || {};
    
    window.tempWidgetsOrder.forEach((w, index) => {
        const isChecked = active.indexOf(w.id) !== -1 ? "checked" : "";
        const selectedStyle = styles[w.id] || w.styles[0].id;
        const selectedSize = sizes[w.id] || "small";
        
        let selectOptions = "";
        w.styles.forEach(s => {
            const isSel = s.id === selectedStyle ? "selected" : "";
            selectOptions += `<option value="${s.id}" ${isSel}>${s.name}</option>`;
        });
        
        const sizeOptions = `
            <option value="small" ${selectedSize === "small" ? "selected" : ""}>Pequeno (1col)</option>
            <option value="medium" ${selectedSize === "medium" ? "selected" : ""}>MÃ©dio (2col)</option>
            <option value="large" ${selectedSize === "large" ? "selected" : ""}>Grande (3col)</option>
        `;
        
        const item = document.createElement("div");
        item.className = "widget-setup-item";
        item.style.display = "flex";
        item.style.justifyContent = "space-between";
        item.style.alignItems = "center";
        item.style.padding = "10px 0";
        item.style.borderBottom = "1px solid rgba(255,255,255,0.05)";
        
        item.innerHTML = `
            <div class="widget-setup-info" style="flex: 1; text-align: left;">
                <span class="widget-setup-name" style="font-weight: bold; color: #fff; display: block; font-size: 0.85rem;">${w.name}</span>
                <span class="widget-setup-desc" style="color: var(--color-text-muted); font-size: 0.7rem; display: block; margin-top: 2px;">${w.desc}</span>
            </div>
            <div class="widget-setup-actions" style="display: flex; align-items: center; gap: 8px;">
                <div style="display: flex; gap: 2px;">
                    <button type="button" class="btn btn-secondary" onclick="moveWidgetInSettings(${index}, -1)" title="Mover para cima" style="padding: 2px; width: 22px; height: 22px; display: inline-flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.08);">
                        <i data-lucide="chevron-up" style="width: 12px; height: 12px; color: #fff;"></i>
                    </button>
                    <button type="button" class="btn btn-secondary" onclick="moveWidgetInSettings(${index}, 1)" title="Mover para baixo" style="padding: 2px; width: 22px; height: 22px; display: inline-flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.08);">
                        <i data-lucide="chevron-down" style="width: 12px; height: 12px; color: #fff;"></i>
                    </button>
                </div>
                <select class="widget-size-select" id="setup-size-${w.id}" ${isChecked ? "" : "disabled"} style="font-size: 0.72rem; padding: 4px; background: #070a12; border: 1px solid rgba(255,255,255,0.1); color: #fff; border-radius: 4px; outline: none; width: 100px;">
                    ${sizeOptions}
                </select>
                <select class="widget-style-select" id="setup-style-${w.id}" ${isChecked ? "" : "disabled"} style="font-size: 0.72rem; padding: 4px; background: #070a12; border: 1px solid rgba(255,255,255,0.1); color: #fff; border-radius: 4px; outline: none; width: 120px;">
                    ${selectOptions}
                </select>
                <label class="switch-label" style="display:inline-flex; align-items:center; cursor:pointer;">
                    <input type="checkbox" class="widget-setup-checkbox" data-id="${w.id}" ${isChecked} onchange="toggleWidgetSetupSelect(this)" style="width:16px; height:16px; accent-color:var(--color-primary);">
                </label>
            </div>
        `;
        list.appendChild(item);
    });
    
    lucide.createIcons();
}

function openWidgetSettingsModal() {
    const active = (state.widgetsConfig && state.widgetsConfig.activeWidgets) || [];
    const activeOrdered = [];
    active.forEach(id => {
        const found = ALL_WIDGETS.find(w => w.id === id);
        if (found) activeOrdered.push(found);
    });
    
    const inactive = ALL_WIDGETS.filter(w => active.indexOf(w.id) === -1);
    window.tempWidgetsOrder = activeOrdered.concat(inactive);
    
    renderWidgetSettingsList();
    openModal("modal-widget-settings");
}

function moveWidgetInSettings(index, direction) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= window.tempWidgetsOrder.length) return;
    
    // Salvar temporariamente escolhas do DOM
    const checkboxes = document.querySelectorAll(".widget-setup-checkbox");
    const tempActive = [];
    const tempStyles = {};
    const tempSizes = {};
    
    checkboxes.forEach(cb => {
        const id = cb.getAttribute("data-id");
        if (cb.checked) {
            tempActive.push(id);
        }
        const selectStyle = document.getElementById("setup-style-" + id);
        if (selectStyle) {
            tempStyles[id] = selectStyle.value;
        }
        const selectSize = document.getElementById("setup-size-" + id);
        if (selectSize) {
            tempSizes[id] = selectSize.value;
        }
    });
    
    // Trocar posiÃ§Ãµes
    const temp = window.tempWidgetsOrder[index];
    window.tempWidgetsOrder[index] = window.tempWidgetsOrder[newIndex];
    window.tempWidgetsOrder[newIndex] = temp;
    
    // Atualizar estado temporariamente
    state.widgetsConfig.activeWidgets = tempActive;
    state.widgetsConfig.styles = Object.assign({}, state.widgetsConfig.styles, tempStyles);
    state.widgetsConfig.sizes = Object.assign({}, state.widgetsConfig.sizes, tempSizes);
    
    renderWidgetSettingsList();
}

function toggleWidgetSetupSelect(checkbox) {
    const wId = checkbox.getAttribute("data-id");
    const select = document.getElementById("setup-style-" + wId);
    const selectSize = document.getElementById("setup-size-" + wId);
    if (select) {
        select.disabled = !checkbox.checked;
    }
    if (selectSize) {
        selectSize.disabled = !checkbox.checked;
    }
}

function saveWidgetSettings() {
    const checkboxes = document.querySelectorAll(".widget-setup-checkbox");
    const active = [];
    const styles = (state.widgetsConfig && state.widgetsConfig.styles) || {};
    const sizes = (state.widgetsConfig && state.widgetsConfig.sizes) || {};
    
    window.tempWidgetsOrder.forEach(w => {
        const cb = document.querySelector(".widget-setup-checkbox[data-id='" + w.id + "']");
        if (cb && cb.checked) {
            active.push(w.id);
            const selectStyle = document.getElementById("setup-style-" + w.id);
            if (selectStyle) {
                styles[w.id] = selectStyle.value;
            }
            const selectSize = document.getElementById("setup-size-" + w.id);
            if (selectSize) {
                sizes[w.id] = selectSize.value;
            }
        }
    });
    
    state.widgetsConfig = {
        activeWidgets: active,
        styles: styles,
        sizes: sizes
    };
    
    saveState();
    closeModal("modal-widget-settings");
    renderWidgets();
}

// Expose widget functions to window
window.renderWidgets = renderWidgets;
window.renderWidgetCalendar = renderWidgetCalendar;
window.calcWidgetChange = calcWidgetChange;
window.openWidgetSettingsModal = openWidgetSettingsModal;
window.toggleWidgetSetupSelect = toggleWidgetSetupSelect;
window.saveWidgetSettings = saveWidgetSettings;
window.toggleSelectAllPermissions = toggleSelectAllPermissions;
window.moveWidgetInSettings = moveWidgetInSettings;
window.renderWidgetSettingsList = renderWidgetSettingsList;
window.renderDrawerClock = renderDrawerClock;

// --- SISTEMA DE DISTRIBUIÇÃO E SUPORTE PWA (GITHUB PAGES) ---

// Controlar abas do guia de instalação PWA
function switchPWATab(tabId) {
    // Remover a classe active de todos os botões
    document.querySelectorAll(".pwa-tab-btn").forEach(btn => {
        btn.classList.remove("active");
    });

    // Esconder todos os painéis de conteúdo
    document.querySelectorAll(".pwa-content-panel").forEach(panel => {
        panel.style.display = "none";
    });

    // Ativar o botão selecionado
    const activeBtn = document.getElementById("pwa-tab-" + tabId);
    if (activeBtn) {
        activeBtn.classList.add("active");
    }

    // Mostrar o conteúdo correspondente
    const activePanel = document.getElementById("pwa-content-" + tabId);
    if (activePanel) {
        activePanel.style.display = "block";
    }
}

// Copiar link do GitHub Pages para a Área de Transferência
function copyGitHubLink() {
    const urlInput = document.getElementById("github-app-url");
    if (!urlInput) return;

    urlInput.select();
    urlInput.setSelectionRange(0, 99999); // Para dispositivos móveis

    navigator.clipboard.writeText(urlInput.value)
        .then(() => {
            const btn = document.getElementById("btn-copy-github");
            if (btn) {
                const originalHTML = btn.innerHTML;
                btn.innerHTML = `<i data-lucide="check" style="width: 14px; height: 14px; color: #10b981;"></i> Copiado!`;
                btn.style.borderColor = "rgba(16, 185, 129, 0.4)";
                btn.style.background = "rgba(16, 185, 129, 0.05)";
                
                if (typeof lucide !== "undefined") {
                    lucide.createIcons();
                }
                
                setTimeout(() => {
                    btn.innerHTML = originalHTML;
                    btn.style.borderColor = "";
                    btn.style.background = "";
                    if (typeof lucide !== "undefined") {
                        lucide.createIcons();
                    }
                }, 2000);
            }
        })
        .catch(err => {
            console.error("Erro ao copiar link: ", err);
            alert("Copie manualmente: " + urlInput.value);
        });
}

// Inicialização do QR Code do GitHub Pages
function initGitHubQRCode() {
    const qrContainer = document.getElementById("github-qr-code");
    if (qrContainer && typeof QRCode !== "undefined") {
        qrContainer.innerHTML = ""; // Limpar antigo
        try {
            new QRCode(qrContainer, {
                text: "https://gelodovale.github.io/gelodovale-app/",
                width: 100,
                height: 100,
                colorDark : "#000000",
                colorLight : "#ffffff",
                correctLevel : QRCode.CorrectLevel.H
            });
        } catch (e) {
            console.error("Erro ao gerar QR Code:", e);
        }
    }
}

// Auto-preencher as configurações oficiais do Firebase
function autoFillFirebaseSettings() {
    const apiKeyEl = document.getElementById("cfg-fb-api-key");
    const projectIdEl = document.getElementById("cfg-fb-project-id");
    const dbUrlEl = document.getElementById("cfg-fb-db-url");
    const deviceKeyEl = document.getElementById("cfg-fb-device-key");
    const enabledEl = document.getElementById("cfg-fb-enabled");

    if (apiKeyEl) apiKeyEl.value = "AIzaSyBfY-uWaXBHNSheNeCsTyMnc6L_yRtcLtE";
    if (projectIdEl) projectIdEl.value = "gelo-do-vale";
    if (dbUrlEl) dbUrlEl.value = "https://gelo-do-vale-default-rtdb.firebaseio.com";
    if (deviceKeyEl) deviceKeyEl.value = "gelodovale_oficial";
    if (enabledEl) enabledEl.checked = true;

    alert("Configurações oficiais do Firebase preenchidas! Não se esqueça de clicar em 'Salvar Configurações' para gravar no navegador.");
}

// Navegar diretamente para o painel de configurações do GitHub Pages
function goToGitHubConfig() {
    const navPrecos = document.getElementById("nav-precos");
    if (navPrecos) {
        navPrecos.click();
        setTimeout(() => {
            if (typeof switchAdminSubTab === "function") {
                switchAdminSubTab("tab-seguranca-backup");
            }
        }, 50);
    }
}

// Expor no escopo global
window.switchPWATab = switchPWATab;
window.copyGitHubLink = copyGitHubLink;
window.initGitHubQRCode = initGitHubQRCode;
window.autoFillFirebaseSettings = autoFillFirebaseSettings;
window.goToGitHubConfig = goToGitHubConfig;