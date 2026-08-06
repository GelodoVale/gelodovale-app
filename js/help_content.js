/**
 * GELCONTROL - Dicionário Central de Ajuda e Tutoriais Contextuais
 * Conteúdo explicativo para abas, sub-abas, modais e painéis operacionais.
 */

window.GEL_HELP_DICTIONARY = {
    // -------------------------------------------------------------
    // ABAS PRINCIPAIS DA SIDEBAR
    // -------------------------------------------------------------
    "dashboard": {
        title: "Painel Financeiro & Clima",
        badge: "📊 ❓ Entenda o Painel Principal",
        icon: "📊",
        summary: "Visão geral em tempo real de faturamento, vendas do dia, previsão do tempo e atalhos rápidos.",
        description: "O Dashboard reúne os principais indicadores da fábrica (KPIs) em um só lugar. Ele mostra o faturamento diário e mensal, total de entregas pendentes, alertas de clientes com estoque baixo e a previsão do tempo local — fundamental para planejar a produção de gelo em dias quentes.",
        steps: [
            "Acompanhe o faturamento total acumulado no topo da tela.",
            "Confira a previsão do tempo para antecipar picos de demanda no final de semana.",
            "Utilize os atalhos rápidos para lançar novas vendas ou cadastrar clientes sem mudar de aba."
        ],
        tips: [
            "💡 Dias com temperatura acima de 28°C costumam aumentar as vendas em até 40%. Prepare o estoque com antecedência!",
            "⚠️ Fique atento ao indicador de 'Entregas Pendentes' para não atrasar os pedidos dos clientes."
        ]
    },

    "pdv": {
        title: "Frente de Caixa (PDV Balcão)",
        badge: "🛒 ❓ Entenda o PDV Balcão",
        icon: "🛒",
        summary: "Ponto de Venda rápido para emitir vendas presenciais no balcão da fábrica com troco e comprovante.",
        description: "O PDV Balcão é utilizado para registrar vendas diretas na fábrica. Permite adicionar produtos rapidamente ao carrinho, calcular troco em dinheiro, gerar QR Code para pagamento PIX e emitir o comprovante via WhatsApp.",
        steps: [
            "Clique nos produtos no Catálogo Rápido para adicionar fardos ou unidades ao carrinho.",
            "Se a venda for para um cliente já cadastrado, selecione o nome dele no campo 'Cliente'. Caso contrário, mantenha '-- Consumidor Final (Balcão) --'.",
            "Escolha o método de pagamento (PIX, Dinheiro, Cartão ou A Prazo).",
            "Clique no botão verde 'Concluir Venda Balcão' para finalizar e gerar o comprovante."
        ],
        tips: [
            "⚠️ **Vendas A Prazo (Carnê):** O pagamento 'A Prazo' exige OBRIGATORIAMENTE que um cliente cadastrado seja selecionado. Vendas para o Consumidor Balcão só podem ser feitas em Dinheiro, Cartão ou PIX.",
            "💡 Para vendas em dinheiro, você pode digitar o valor pago pelo cliente para o sistema calcular o troco exato na hora."
        ]
    },

    "clientes": {
        title: "Gestão de Clientes & Tabela de Preços",
        badge: "👥 ❓ Como Gerenciar Clientes",
        icon: "👥",
        summary: "Cadastro completo de clientes, controle de saldo devedor, carnê digital e preços personalizados.",
        description: "Nesta aba você gerencia todos os parceiros comerciais da fábrica (supermercados, distribuidores, quiosques, postos). É possível visualizar o histórico de compras, controlar o carnê de fiados, ajustar preços por tabela e acompanhar a estimativa de estoque do freezer de cada cliente.",
        steps: [
            "Utilize a barra de pesquisa para localizar um cliente por Nome, Razão Social ou Cidade.",
            "Clique no botão 'Novo Cliente' para cadastrar um novo estabelecimento.",
            "Clique no card do cliente para abrir a ficha completa: histórico de compras, carnê de débitos e capacidade do freezer.",
            "Acesse o botão 'Preços do Cliente' para definir valores diferenciados por fardo se necessário."
        ],
        tips: [
            "💡 Clientes com o aviso amarelo '⚠️ Estoque Baixo' precisam de uma visita de reabastecimento em breve.",
            "🔴 Clientes com o selo 'Devedor' possuem parcelas em aberto no carnê digital."
        ]
    },

    "freezers": {
        title: "Inventário de Equipamentos (Freezers)",
        badge: "🧊 ❓ Ajuda com Freezers & Conservadores",
        icon: "🧊",
        summary: "Controle patrimonial de conservadores e freezers alocados em clientes ou disponíveis no galpão.",
        description: "Mapeie todo o patrimônio de conservadores de gelo da fábrica. Cadastre o número de patrimônio/tombamento, número de série, marca, capacidade em sacos (ex: 200 fardos) e acompanhe a localização exata de cada equipamento em tempo real.",
        steps: [
            "Filtre os equipamentos por status: 'Alocado em Cliente', 'Disponível na Fábrica' ou 'Em Manutenção'.",
            "Para alocar um freezer novo, clique em 'Novo Equipamento', preencha a identificação e escolha o cliente de destino.",
            "Clique no card do freezer para ver a data da última manutenção preventiva e o tempo de uso."
        ],
        tips: [
            "💡 Manter os registros de tombamento atualizados evita perdas de patrimônio durante trocas de clientes.",
            "⚠️ Equipamentos em manutenção exibem um alerta para que a equipe técnica providencie o reparo."
        ]
    },

    "rentals": {
        title: "Aluguel de Equipamentos (Tinas & Mesas)",
        badge: "🏕️ ❓ Ajuda com Aluguel de Tinas",
        icon: "🏕️",
        summary: "Locação de tinas térmicas, caixas térmicas e mesas para eventos, festas e feiras locais.",
        description: "Controle o faturamento e a entrega de tinas térmicas locadas temporariamente para eventos. Registre a data de retirada, previsão de devolução, caução de garantia e valor cobrado por diária.",
        steps: [
            "Clique em 'Novo Aluguel de Tina/Mesa' para abrir o formulário.",
            "Informe o nome do locatário, telefone, quantidade de tinas e a data limite de devolução.",
            "Ao receber a tina de volta na fábrica, clique em 'Registrar Devolução' para liberar o equipamento e fechar a locação."
        ],
        tips: [
            "⚠️ Tinas não devolvidas na data prevista são destacadas em vermelho como 'Atrasadas' no painel.",
            "💡 Sempre confirme o estado físico da tina no momento da devolução antes de restituir o valor da caução."
        ]
    },

    "recibos": {
        title: "Recibos & Orçamentos (Documentos)",
        badge: "📜 ❓ Como Emitir Recibos & Orçamentos",
        icon: "📜",
        summary: "Gerador instantâneo de comprovantes formais, recibos de pagamento e orçamentos em PDF.",
        description: "Emita recibos timbrados e orçamentos profissionais para clientes empresariais ou eventos que exigem comprovação formal. O documento é gerado em PDF com o logotipo da Gelo do Vale e pode ser compartilhado por WhatsApp ou impresso.",
        steps: [
            "Escolha o tipo de documento: 'Recibo de Pagamento' ou 'Orçamento Comercial'.",
            "Selecione o cliente desejado ou preencha os dados avulsos do recebedor.",
            "Insira os itens, quantidades e valores discriminados.",
            "Clique em 'Gerar Documento (PDF)' para visualizar ou compartilhar no WhatsApp."
        ],
        tips: [
            "💡 Todos os orçamentos gerados ficam salvos no histórico e podem ser convertidos em pedido real com apenas 1 clique."
        ]
    },

    "pedidos": {
        title: "Pedidos Pendentes & Solicitações",
        badge: "📦 ❓ Como Gerenciar Pedidos Pendentes",
        icon: "📦",
        summary: "Central de pedidos recebidos via WhatsApp, formulário web ou agendados pela equipe de vendas.",
        description: "Acompanhe a fila de solicitações que aguardam separação ou envio para a rota de entregas. Aqui você pode aprovar pedidos, ajustar quantidades e encaminhar para a folha de carga do motorista.",
        steps: [
            "Confira os novos pedidos na lista por ordem de prioridade/horário.",
            "Clique em 'Aprovar Pedido' para confirmar o envio.",
            "Caso o cliente deseje alterar a quantidade de fardos, clique em 'Editar' antes de liberar para rota."
        ],
        tips: [
            "💡 Pedidos aprovados são enviados automaticamente para a aba de 'Acerto de Carga & Viagem'."
        ]
    },

    "historico": {
        title: "Histórico de Entregas & Rotas",
        badge: "🚚 ❓ Entenda o Histórico de Entregas",
        icon: "🚚",
        summary: "Registro completo de todas as entregas concluídas, rotas finalizadas e comprovantes digitais.",
        description: "Consulte o histórico retroativo de todas as rotas efetuadas pela frota. Filtre por data, entregador, cliente ou status de pagamento para auditorias e acertos de contas.",
        steps: [
            "Selecione o intervalo de datas desejado (ex: Hoje, Esta Semana, Este Mês).",
            "Utilize a caixa de busca para pesquisar o nome de um cliente ou código da entrega.",
            "Clique em uma entrega para ver os detalhes: horário de chegada, fardos entregues e responsável pelo recebimento."
        ],
        tips: [
            "💡 Você pode re-emitir o comprovante de qualquer entrega passada diretamente por esta tela."
        ]
    },

    // -------------------------------------------------------------
    // SUB-ABAS DO PAINEL ADMINISTRATIVO (CONFIGURAÇÕES & PREÇOS)
    // -------------------------------------------------------------
    "viagem": {
        title: "Acerto de Viagem & Fechamento de Carga",
        badge: "📋 ❓ Como Fazer Acerto de Carga",
        icon: "📋",
        summary: "Fechamento diário da rota do caminhão: conferência de sacos carregados, devolvidos e acerto financeiro.",
        description: "Esta tela é usada ao final da rota de entregas para auditar o caminhão. Compara a quantidade de fardos de gelo que saíram da fábrica com as vendas efetuadas no aplicativo e o estoque retornado no veículo, calculando eventuais divergências e a comissão do motorista.",
        steps: [
            "Selecione o Motorista/Entregador responsável pela viagem.",
            "Confira os fardos de saída (carregados) e informe a quantidade de fardos que retornaram no caminhão.",
            "Digite o valor em dinheiro vivo entregue pelo motorista na tesouraria.",
            "Insira as despesas da viagem (combustível, alimentação, pedágio).",
            "Verifique o resultado da auditoria: se houver divergência, o sistema alertará na cor amarela/vermelha."
        ],
        tips: [
            "💡 O sistema calcula o custo por KM rodado e o lucro líquido exato de cada viagem!",
            "⚠️ Sempre confira as notas de combustível antes de fechar o acerto do motorista."
        ]
    },

    "insumos": {
        title: "Insumos & Estoque de Matéria-Prima",
        badge: "🏭 ❓ Como Controlar Insumos da Fábrica",
        icon: "🏭",
        summary: "Gestão do estoque interno de sacos plásticos, fechos/arames, xaropes e componentes de embalagem.",
        description: "Controle a matéria-prima usada na produção de gelo em cubo, triturado e saborizado. Acompanhe a quantidade disponível de embalagens de 2kg, 5kg e 20kg e receba alertas quando precisar comprar mais insumos.",
        steps: [
            "Visualize a quantidade atual de cada insumo no estoque da fábrica.",
            "Ao receber uma nova compra de embalagens do fornecedor, clique em 'Dar Entrada de Insumos'.",
            "Defina a quantidade mínima de alerta para o sistema avisar quando o estoque de sacos estiver acabando."
        ],
        tips: [
            "💡 Cadastrar o custo unitário dos sacos plásticos ajuda o sistema a calcular a margem de lucro exata de cada fardo produzido!"
        ]
    },

    "rentabilidade": {
        title: "Rentabilidade de Freezers & ROI",
        badge: "📈 ❓ Como Analisar o ROI dos Freezers",
        icon: "📈",
        summary: "Análise de retorno financeiro por conservador alocado: faturamento por cliente x custo do equipamento.",
        description: "Descubra quais clientes oferecem o melhor retorno sobre o investimento (ROI) para os freezers instalados em regime de comodato. O relatório compara o custo do equipamento com a média mensal de fardos comprados pelo cliente.",
        steps: [
            "Observe a lista de clientes com equipamentos alocados.",
            "Confira a taxa de giro de fardos por mês.",
            "Identifique pontos comerciais com baixo desempenho para remanejar o freezer para outro cliente mais rentável."
        ],
        tips: [
            "💡 Um freezer com menos de 30 fardos vendidos por mês pode estar dando prejuízo. Avalie uma conversa comercial com o cliente!"
        ]
    },

    "contas_receber": {
        title: "Contas a Receber & Gestão de Fiados",
        badge: "💳 ❓ Como Gerenciar Contas a Receber",
        icon: "💳",
        summary: "Painel financeiro de parcelas pendentes do carnê, cobrança por WhatsApp e quitação de débitos.",
        description: "Centralize todas as contas a receber da fábrica. Registre recebimentos em dinheiro ou PIX, emita relatórios de cobrança e envie lembretes amigáveis de pagamento diretamente no WhatsApp dos clientes inadimplentes.",
        steps: [
            "Filtre os títulos por status: 'Pendentes', 'Vencidos' ou 'Quitados'.",
            "Para dar baixa em um pagamento recebido, localize o cliente e clique no botão verde 'Receber'.",
            "Digite o valor pago, escolha a forma de recebimento (Dinheiro/PIX/Cartão) e confirme.",
            "Clique no botão 'Cobrar via WhatsApp' para enviar uma mensagem formatada com a chave PIX e o saldo pendente."
        ],
        tips: [
            "💡 O botão de cobrança no WhatsApp gera automaticamente a chave PIX Copia e Cola para facilitar o pagamento do cliente."
        ]
    },

    "integracoes": {
        title: "Integrações (PIX & WhatsApp API)",
        badge: "⚙️ ❓ Como Configurar PIX e WhatsApp",
        icon: "⚙️",
        summary: "Configuração da Chave PIX estática/dinâmica e gateway de envio de mensagens do WhatsApp.",
        description: "Configure os dados financeiros e de comunicação da fábrica. Defina a chave PIX que aparece nos recibos e QR Codes offline e conecte sua API do WhatsApp (Z-API, Evolution API ou Webhook) para disparos automáticos.",
        steps: [
            "Insira sua chave PIX principal (E-mail, CNPJ, Celular ou Aleatória) e clique em 'Salvar Chave PIX'.",
            "Para ativar o envio de recibos no WhatsApp sem abrir a tela do celular, selecione o provedor de API e insira o Token da conta.",
            "Teste o envio utilizando o botão 'Enviar Mensagem de Teste'."
        ],
        tips: [
            "💡 Utilizar a chave PIX correta garante que os QR Codes gerados no PDV recebam o pagamento diretamente na conta da fábrica."
        ]
    },

    "whatsapp_central": {
        title: "Central do WhatsApp & Modelos de Mensagem",
        badge: "💬 ❓ Como Usar os Templates de Mensagem",
        icon: "💬",
        summary: "Personalização de modelos de texto para comprovantes, lembretes de cobrança, aniversários e visitas.",
        description: "Cadastre e edite os modelos de mensagens (templates) disparados pelo sistema. Você pode personalizar o texto e utilizar variáveis automáticas como `{nome}`, `{valor}`, `{data}` e `{link}`.",
        steps: [
            "Selecione o tipo de mensagem no menu superior (ex: 'Comprovante de Venda', 'Lembrete de Dívida').",
            "Edite o texto do modelo mantendo as variáveis entre chaves `{...}`.",
            "Observe a pré-visualização em tempo real do texto formatado.",
            "Clique em 'Salvar Template' para atualizar."
        ],
        tips: [
            "💡 Mensagens com o nome do cliente `{nome}` e a saudação correta têm maior taxa de resposta no WhatsApp!"
        ]
    },

    "seguranca": {
        title: "Segurança, Backup & Versão dos Dados",
        badge: "🛡️ ❓ Entenda Backup e Versão",
        icon: "🛡️",
        summary: "Gerenciamento da versão dos dados, backups automáticos no OneDrive e sincronização com a nuvem.",
        description: "Proteja as informações financeiras e operacionais da fábrica. Faça backups manuais em JSON, configure a frequência de download automático e restaure pontos de restauração em caso de troca de computador.",
        steps: [
            "Verifique o status do 'Backup Local OneDrive' no topo do painel.",
            "Para salvar uma cópia de segurança no seu computador agora, clique em 'Gravar no OneDrive (Salvar)'.",
            "Para atualizar a versão do banco de dados (ex: `v4.4`), digite a nova versão no campo correspondente e clique em 'Salvar Configurações'."
        ],
        tips: [
            "🛡️ O GelControl possui salvamento automático redundante no navegador, no OneDrive e no banco de dados em tempo real (Firebase)."
        ]
    },

    "usuarios": {
        title: "Gerenciar Usuários, Senhas e Acessos",
        badge: "🔑 ❓ Como Gerenciar Permissões de Usuários",
        icon: "🔑",
        summary: "Controle de colaboradores, cadastro de perfis (Admin, Operador, Entregador) e criptografia de senhas.",
        description: "Cadastre os logins e senhas da equipe da fábrica e defina exatamente quais abas cada usuário pode acessar. As senhas são armazenadas de forma segura com criptografia SHA-256.",
        steps: [
            "Clique em 'Novo Usuário' para adicionar um colaborador.",
            "Preencha o Nome Completo, Login de Usuário e crie uma Senha inicial.",
            "Marque ou desmarque as caixas de seleção da 'Grade de Permissões' para liberar apenas as telas necessárias para a função dele.",
            "Ao editar um usuário existente, deixe o campo de senha em branco se não desejar alterá-la."
        ],
        tips: [
            "🔒 **Segurança:** Operadores de balcão podem ter acesso restrito apenas à aba 'PDV Balcão', protegendo os relatórios financeiros do sistema."
        ]
    },

    "ajuda": {
        title: "Dúvidas & Soluções (Central de Suporte)",
        badge: "❓ ❓ Manual de Ajuda & Auto-Diagnóstico",
        icon: "❓",
        summary: "Perguntas frequentes, manual de instruções e ferramentas de teste de conexão e impressão.",
        description: "Central completa de treinamento e soluções rápidas para eventuais dúvidas da equipe. Conta com testes automáticos para verificar a internet, teste de impressão em impressoras térmicas e guia interativo.",
        steps: [
            "Para testar se a internet da fábrica está online, clique em 'Testar Conexão'.",
            "Para testar sua impressora de cupons de balcão (USB/Bluetooth), clique em 'Imprimir Cupom de Teste'.",
            "Clique nas perguntas do FAQ para expandir os tutoriais detalhados."
        ],
        tips: [
            "💡 O 'Auto-Teste do Sistema' executa 13 verificações de integridade nos seus dados para garantir que tudo está funcionando perfeitamente."
        ]
    }
};
