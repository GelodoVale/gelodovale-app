// --- MÓDULO DE INTEGRAÇÃO DO WHATSAPP (COMPLETO) ---
import { state, saveState } from './state.js';

// Templates Padrão (Fallback caso não existam no State)
export const DEFAULT_TEMPLATES = {
    aniversario: "Olá, [Nome]! 🎂 A Gelo do Vale te deseja um feliz aniversário! Muita saúde, paz e muito sucesso. Que seu dia seja incrível! 🧊✨",
    estoque_baixo: "Olá! ⚠️ Notamos que o estoque de gelo no seu freezer está baixo. Gostaria de agendar uma entrega para reposição hoje? — Gelo do Vale 🧊",
    divida: "Olá, [Nome]! 💸 Passando para lembrar que há um saldo em aberto de R$ [Valor] no seu cadastro. Se precisar de chave Pix ou segunda via do carnê, é só avisar. Obrigado! — Gelo do Vale 🧊",
    pedido: "Olá, [Nome]! 📦 Seu pedido foi registrado com sucesso!\n\n*Itens do Pedido:*\n[Produtos]\n\nPrevisão de entrega: [Data]. — Gelo do Vale 🧊",
    entrega: "Olá, [Nome]! 🚚 Sua entrega de gelo foi realizada com sucesso!\n\n*Itens Entregues:*\n[Produtos]\n\nValor total: R$ [Valor]. Agradecemos a preferência! — Gelo do Vale 🧊",
    boas_vindas: "Olá, [Nome]! 🎉 Seja muito bem-vindo à Gelo do Vale!\n\nPara agilizar seu cadastro e marcar a localização GPS exata do seu estabelecimento para entregas, por favor preencha o formulário seguro no link abaixo:\n\n[Link]\n\nEstamos à disposição! 🧊",
    comodato: "Olá, [Nome]! 🔧 O freezer em regime de comodato (Código: [Codigo], Modelo: [Equipamento]) foi instalado com sucesso no seu estabelecimento!\n\nPara formalizar o contrato de comodato, por favor leia e assine digitalmente acessando o link seguro abaixo:\n\n[Link]\n\nQualquer dúvida, conte com nossa assistência técnica. — Gelo do Vale 🧊",
    documento: "Olá, [Nome]! 🧾 Segue o detalhamento do seu documento comercial ([Codigo]):\n\n*Itens:*\n[Produtos]\n\n*Total:* R$ [Valor]\n\nSe precisar da versão em PDF ou de suporte, entre em contato. — Gelo do Vale 🧊",
    visita: "Olá, [Nome]! 📅 Passando para lembrar que nossa equipe fará uma visita para reposição de gelo no seu estabelecimento em [Data]. Até breve! — Gelo do Vale 🧊",
    livre: "Olá, [Nome]! "
};

// Obter templates ativos (personalizados pelo admin ou padrão)
export function getWhatsappTemplates() {
    if (!state.whatsappTemplates) {
        state.whatsappTemplates = { ...DEFAULT_TEMPLATES };
    }
    return state.whatsappTemplates;
}

// Salvar um template personalizado
export function saveWhatsappTemplate(key, text) {
    if (!state.whatsappTemplates) {
        state.whatsappTemplates = { ...DEFAULT_TEMPLATES };
    }
    state.whatsappTemplates[key] = text;
    saveState();
}

// Gerar link do formulário público (form.html) com token encriptado
export function gerarLinkFormulario(tipo) {
    if (!state.firebaseConfig || !state.firebaseConfig.enabled) {
        return '';
    }
    const config = {
        apiKey: state.firebaseConfig.apiKey,
        projectId: state.firebaseConfig.projectId,
        databaseURL: state.firebaseConfig.databaseURL,
        deviceKey: state.firebaseConfig.deviceKey,
        type: tipo // cadastro, comodato, aluguel
    };
    
    // Obter URL base limpa
    const origin = window.location.origin;
    let pathname = window.location.pathname;
    if (pathname.endsWith('index.html')) {
        pathname = pathname.substring(0, pathname.lastIndexOf('/') + 1);
    } else if (!pathname.endsWith('/')) {
        pathname = pathname + '/';
    }
    const baseUrl = origin + pathname + 'form.html';
    
    // Converter para Base64 UTF-8 seguro
    const token = btoa(unescape(encodeURIComponent(JSON.stringify(config))));
    return `${baseUrl}?t=${token}`;
}

// Substituir os Placeholders dinâmicos da mensagem
export function formatarMensagem(templateText, dados = {}) {
    let msg = templateText || "";
    
    // Fallback de valores nulos/undefined
    const nome = dados.nome || dados.clientName || "";
    const valor = dados.valor !== undefined ? parseFloat(dados.valor).toFixed(2).replace('.', ',') : "";
    const produtos = dados.produtos || "";
    const data = dados.data || "";
    const equipamento = dados.equipamento || "";
    const codigo = dados.codigo || "";
    const link = dados.link || "";

    msg = msg.replace(/\[Nome\]/gi, nome);
    msg = msg.replace(/\[Valor\]/gi, valor);
    msg = msg.replace(/\[Produtos\]/gi, produtos);
    msg = msg.replace(/\[Data\]/gi, data);
    msg = msg.replace(/\[Equipamento\]/gi, equipamento);
    msg = msg.replace(/\[Codigo\]/gi, codigo);
    msg = msg.replace(/\[Link\]/gi, link);
    
    return msg;
}

// Função para abrir modal de confirmação antes do envio
export function abrirConfirmacaoWA(clienteId, tipo, dadosContexto = {}) {
    const cliente = state.clients.find(c => c.id === clienteId);
    if (!cliente && tipo !== 'boas_vindas_novo') {
        window.showToast("Cliente não encontrado para envio de WhatsApp.", "error");
        return;
    }

    const templates = getWhatsappTemplates();
    let templateText = templates[tipo] || templates['livre'];

    // Se for opt-out e não for livre/forçado, avisa o usuário
    if (cliente && cliente.noWhatsapp && tipo !== 'livre') {
        window.showConfirm(
            `O cliente ${cliente.name} está marcado para NÃO receber mensagens automatizadas de WhatsApp. Deseja prosseguir mesmo assim?`,
            () => carregarModalConfirmacao(cliente, tipo, templateText, dadosContexto),
            null,
            "Alerta de Preferência",
            "Sim, prosseguir"
        );
    } else {
        carregarModalConfirmacao(cliente || dadosContexto.clienteTemporario, tipo, templateText, dadosContexto);
    }
}

function carregarModalConfirmacao(cliente, tipo, templateText, dadosContexto) {
    const modalId = "modal-whatsapp-confirm";
    let modal = document.getElementById(modalId);
    
    // Se o modal não existe no DOM, vamos injetá-lo dinamicamente
    if (!modal) {
        modal = document.createElement('div');
        modal.id = modalId;
        modal.className = "modal-backdrop";
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 480px;">
                <div class="modal-header">
                    <h3 style="display: flex; align-items: center; gap: 8px;">
                        <i data-lucide="message-square" style="color: var(--color-primary); width: 18px; height: 18px;"></i>
                        Confirmar Mensagem WhatsApp
                    </h3>
                    <button class="close-btn" onclick="closeModal('${modalId}')">
                        <i data-lucide="x"></i>
                    </button>
                </div>
                <div class="modal-body" style="padding: 1.25rem; display: flex; flex-direction: column; gap: 1rem;">
                    <div>
                        <div style="font-size: 0.75rem; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px;">Destinatário</div>
                        <strong id="wa-confirm-dest" style="font-size: 0.95rem; color: #fff;">-</strong>
                        <span id="wa-confirm-phone" style="font-size: 0.85rem; color: var(--color-text-muted); margin-left: 6px;">-</span>
                    </div>

                    <div class="form-group">
                        <label for="wa-confirm-text">Mensagem a ser enviada:</label>
                        <textarea id="wa-confirm-text" class="form-control" rows="6" style="font-size: 0.85rem; line-height: 1.4; font-family: monospace; background: rgba(0,0,0,0.25); border-color: rgba(255,255,255,0.08); color: #f8fafc; padding: 10px;"></textarea>
                    </div>

                    <div id="wa-link-options" class="form-group" style="display:none; background: rgba(0, 240, 255, 0.04); border: 1px solid rgba(0, 240, 255, 0.12); padding: 10px; border-radius: 8px;">
                        <label class="day-checkbox" style="padding: 4px 0; border: none; background: none; font-size: 0.8rem; display: flex; align-items: center; gap: 8px;">
                            <input type="checkbox" id="wa-attach-form-link" style="accent-color: var(--color-primary);">
                            <span>Anexar link do formulário público</span>
                        </label>
                        <div id="wa-link-preview-text" style="font-size: 0.7rem; color: var(--color-text-muted); margin-top: 4px; word-break: break-all; max-height: 40px; overflow-y: auto;"></div>
                    </div>

                    <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 0.5rem;">
                        <button class="btn btn-secondary" onclick="closeModal('${modalId}')">Cancelar</button>
                        <button id="wa-btn-send" class="btn btn-primary btn-whatsapp" style="padding: 0.65rem 1.25rem;">
                            <i data-lucide="send" style="width: 16px; height: 16px;"></i> Abrir WhatsApp
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        if (window.lucide) window.lucide.createIcons();
    }

    // Preencher dados do destinatário
    const nome = cliente ? (cliente.fantasyName || cliente.name) : (dadosContexto.nome || "Cliente");
    const telefone = cliente ? (cliente.phone || "") : (dadosContexto.phone || "");
    
    document.getElementById("wa-confirm-dest").innerText = nome;
    document.getElementById("wa-confirm-phone").innerText = telefone ? `(${telefone})` : "(Sem telefone cadastrado)";
    
    // Gerar link se aplicável
    let linkForm = "";
    const linkDiv = document.getElementById("wa-link-options");
    const chkForm = document.getElementById("wa-attach-form-link");
    const previewLink = document.getElementById("wa-link-preview-text");

    if (tipo === 'boas_vindas' || tipo === 'comodato' || tipo === 'boas_vindas_novo') {
        const formType = tipo === 'comodato' ? 'comodato' : 'cadastro';
        linkForm = gerarLinkFormulario(formType);
        dadosContexto.link = linkForm;
        
        linkDiv.style.display = "block";
        chkForm.checked = true;
        previewLink.innerText = `Link: ${linkForm}`;
    } else {
        linkDiv.style.display = "none";
        chkForm.checked = false;
    }

    // Formatar texto inicial com os dados fornecidos
    const txtArea = document.getElementById("wa-confirm-text");
    txtArea.value = formatarMensagem(templateText, dadosContexto);

    // Ajustar texto ao marcar/desmarcar checkbox de link
    chkForm.onchange = () => {
        if (chkForm.checked) {
            dadosContexto.link = linkForm;
            txtArea.value = formatarMensagem(templateText, dadosContexto);
        } else {
            dadosContexto.link = "";
            // Remove a linha ou marcador do link
            txtArea.value = formatarMensagem(templateText, { ...dadosContexto, link: "[Link omitido]" });
        }
    };

    // Configurar botão de Envio
    const sendBtn = document.getElementById("wa-btn-send");
    sendBtn.onclick = () => {
        const finalMsg = txtArea.value.trim();
        if (!finalMsg) {
            window.showToast("Não é possível enviar uma mensagem vazia.", "warning");
            return;
        }

        const rawPhone = telefone.replace(/\D/g, '');
        if (!rawPhone || rawPhone.length < 8) {
            window.showToast("Número de telefone inválido.", "error");
            return;
        }

        // Registrar no log do cliente se ele existir no state
        if (cliente && cliente.id) {
            const dbClient = state.clients.find(c => c.id === cliente.id);
            if (dbClient) {
                if (!dbClient.whatsappLogs) dbClient.whatsappLogs = [];
                dbClient.whatsappLogs.push({
                    type: tipo,
                    date: Date.now(),
                    text: finalMsg
                });
                
                // Limitar tamanho do histórico para não inflar a nuvem
                if (dbClient.whatsappLogs.length > 50) {
                    dbClient.whatsappLogs.shift();
                }
                saveState();
            }
        }

        // Abrir URL de redirecionamento WhatsApp wa.me
        const waUrl = `https://wa.me/55${rawPhone}?text=${encodeURIComponent(finalMsg)}`;
        window.open(waUrl, '_blank');
        
        window.closeModal(modalId);
        window.showToast("WhatsApp aberto com sucesso!", "success");
    };

    modal.classList.add("active");
}

// Vincular funções ao objeto global window para acesso inline no index.html
window.abrirConfirmacaoWA = abrirConfirmacaoWA;
window.gerarLinkFormulario = gerarLinkFormulario;
