/**
 * GELCONTROL - Dicionário Central de Ajuda e Tutoriais Contextuais
 * Conteúdo explicativo hiper-detalhado, mapeando cada card, código, botão e campo de cada tela do GelControl.
 */

window.GEL_HELP_DICTIONARY = {
    // -------------------------------------------------------------
    // ABAS PRINCIPAIS DA SIDEBAR
    // -------------------------------------------------------------
    "dashboard": {
        title: "Dashboard - Painel Financeiro & Clima",
        badge: "📊 ❓ Entenda o Painel Principal",
        icon: "📊",
        summary: "Cockpit executivo: KPIs de faturamento, widget de clima Open-Meteo, alertas de picos e atalhos rápidos.",
        description: "O Dashboard é a central de comando da Gelo do Vale. Aqui você encontra a distribuição espacial dos principais indicadores de desempenho da fábrica.",
        steps: [
            "<b>📌 Card 'KPI-01' (Clientes / Freezers):</b> No canto superior esquerdo, mostra o total de parceiros cadastrados e quantos freezers estão alocados na rua. Clique direto no card para abrir o inventário de equipamentos.",
            "<b>📌 Card 'KPI-02' (Gelo Entregue Mês):</b> Exibe a tonelada/fardos totais de gelo em cubo e moído entregues no mês atual com código de acompanhamento.",
            "<b>📌 Card 'KPI-03' (Pedidos Pendentes):</b> Exibe o número de pedidos que aguardam separação ou carregamento no caminhão de rota. Clique para abrir a central de pedidos.",
            "<b>📌 Card 'KPI-04' (Faturamento Mensal):</b> Mostra o total faturado acumulado no mês líquido em R$ com destaque na cor verde.",
            "<b>📌 Painel de Alertas de Faturamento Atípico:</b> Na área central superior, exibe caixas amarelas avisando quando um dia registrar vendas 50% acima da média diária, com campo para cadastrar eventos locais (ex: Festa do Peão, Rodeio, Quermesse).",
            "<b>📌 Painel de Meteorologia & Clima (COD: WID-02):</b> No módulo inferior, exibe a temperatura local atualizada via Open-Meteo e a curva dos próximos dias. Dias acima de 28°C elevam a demanda por gelo em até 50%.",
            "<b>📌 Barra de Atalhos Rápido (COD: DASH-00):</b> Botões diretos para 'Registrar Pedido', 'Novo Contrato', 'Cadastrar Freezer', 'Emitir Recibo' e 'Fechar Caixa'."
        ],
        tips: [
            "💡 <b>Previsão de Picos:</b> Ao observar temperaturas >28°C no widget de clima, prepare o carregamento prévio dos caminhões com pelo menos 500 fardos de 5kg.",
            "⚠️ <b>Alertas Amarelos:</b> Se o card 'Pedidos Pendentes' indicar mais de 5 pedidos, acione a equipe de separação no galpão para não atrasar a rota."
        ]
    },

    "pdv": {
        title: "Frente de Caixa Rápido (PDV Balcão da Fábrica)",
        badge: "🛒 ❓ Entenda o PDV Balcão",
        icon: "🛒",
        summary: "Ponto de Venda balcão: catálogo visual de produtos, leitor de código de barras, troco e cupom 80mm.",
        description: "Janela de operação de caixa para vendas diretas na portaria e retiradas no galpão da fábrica.",
        steps: [
            "<b>📌 Catálogo Rápido de Produtos (Lado Esquerdo):</b> Grade de botões com as fotos e preços unitários dos sacos de Gelo Cubo 5kg, Gelo 2kg, Moído 5kg, Barra 20kg e Tinas. Clique no card para colocar o item no carrinho.",
            "<b>📌 Leitor de Código de Barras (Topo do Carrinho):</b> Campo onde você pode bipar com leitor USB/Bluetooth a embalagem do gelo para inserção automática no pedido.",
            "<b>📌 Seletor de Cliente:</b> Menu suspenso para escolher entre '-- Consumidor Final (Balcão) --' para vendas à vista ou um cliente cadastrado para lançar no histórico/carnê.",
            "<b>📌 Botões de Forma de Pagamento:</b> Botões seletores para 'Dinheiro', 'PIX (QR Code)', 'Cartão Débito/Crédito' ou 'A Prazo (Carnê)'.",
            "<b>📌 Calculadora de Troco em Dinheiro:</b> Campo 'Valor Entregue pelo Cliente' onde você digita a nota recebida (ex: R$ 50,00) e o sistema calcula o troco exato em letras verdes.",
            "<b>📌 Botão Verde 'Concluir Venda Balcão':</b> Dá baixa imediata no estoque de sacos, lança o dinheiro no caixa e abre o menu de impressão térmica (80mm/58mm) ou envio via WhatsApp."
        ],
        tips: [
            "⚠️ <b>Regra A Prazo:</b> Vendas a prazo (carnê) só são liberadas se um cliente cadastrado for selecionado. Consumidor Balcão exige pagamento imediato à vista.",
            "🖨️ <b>Impressão Térmica:</b> A impressora de cupom 80mm imprime o recibo completo com a chave PIX da fábrica em 2 segundos."
        ]
    },

    "clientes": {
        title: "Gestão Completa de Clientes & Tabela de Preços",
        badge: "👥 ❓ Como Gerenciar Clientes",
        icon: "👥",
        summary: "Painel de carteira de parceiros: busca por CNPJ, carnê de fiados, nível de estoque do freezer e tabela especial.",
        description: "Módulo de administração da carteira comercial de supermercados, conveniências, bares, quiosques e distribuidores.",
        steps: [
            "<b>📌 Barra de Busca e Filtros (COD: CLT-01):</b> No topo da página, caixa para pesquisar por Nome Fantasia, Razão Social, Bairro ou CNPJ. Filtros suspensos para 'Status: Todos / Em Dia / Inadimplentes'.",
            "<b>📌 Botão Verde '+ Adicionar' (Canto Superior):</b> Abre a janela para cadastrar um novo parceiro comercial.",
            "<b>📌 Card do Cliente (COD: CLT-02):</b> Exibe o Nome Fantasia, CNPJ/Telefone, Endereço completo, Tombamento do freezer instalado (ex: `FRZ-RO-01`), voltagem e capacidade.",
            "<b>📌 Selos de Status no Card:</b> Selo vermelho 'ESTOQUE CRÍTICO' (freezer precisando de gelo urgente), amarelo 'ATENÇÃO' ou cinza 'EM DIA'.",
            "<b>📌 Barras de Progresso de Estoque Estimado:</b> No rodapé de cada card, mostra barras visuais de nível restante para Pacote Gelo 5kg (Cubo), Gelo 2kg e Gelo Triturado 20kg.",
            "<b>📌 Botões de Ação na Ficha:</b> Botões para abrir o 'Carnê de Fiados', 'Editar Cadastro', 'Definir Preços Especiais' e 'Conversar no WhatsApp'."
        ],
        tips: [
            "🔴 <b>Selo Inadimplente:</b> Clientes com parcelas vencidas há mais de 5 dias ficam travados para novas vendas a prazo até a quitação.",
            "📱 <b>WhatsApp Direto:</b> Clique no ícone de WhatsApp para enviar a tabela de preços ou orçamento sem digitar o telefone."
        ]
    },

    "freezers": {
        title: "Inventário Patrimonial de Equipamentos (Freezers em Comodato)",
        badge: "🧊 ❓ Ajuda com Freezers & Conservadores",
        icon: "🧊",
        summary: "Gestão patrimonial: controle de placas de tombamento, marcas, capacidades e manutenções técnicas.",
        description: "Módulo de controle patrimonial para evitar perdas ou extravios de conservadores de gelo em clientes.",
        steps: [
            "<b>📌 Filtros de Status Patrimonial:</b> Botões no topo para isolar equipamentos 'Alocados em Cliente', 'Disponíveis no Galpão' ou 'Em Manutenção'.",
            "<b>📌 Botão 'Novo Equipamento':</b> Cadastra um novo conservador com placa de tombamento, número de série da fábrica e voltagem (110V/220V).",
            "<b>📌 Card do Freezer:</b> Mostra a etiqueta de tombamento (ex: `FRZ-0042`), marca (Metalfrio, Fricon, Gelopar), capacidade em sacos (ex: 200 fardos 5kg) e cliente atual.",
            "<b>📌 Botão 'Gerar Etiqueta QR Code':</b> Gera a imagem da etiqueta adesiva QR Code para imprimir e colar no freezer físico.",
            "<b>📌 Botão 'Lançar Manutenção':</b> Abre a janela de registro de troca de compressor, carga de gás ou borracha de vedação."
        ],
        tips: [
            "💡 <b>Consulta por Câmera:</b> Ao escanear o QR Code colado no freezer com o celular do motorista, a ficha do equipamento abre na hora.",
            "📊 <b>Giro Mínimo:</b> Freezers que vendem menos de 30 fardos/mês são sinalizados para avaliação de recolocação."
        ]
    },

    "rentals": {
        title: "Aluguel de Equipamentos (Tinas Térmicas & Mobiliário para Eventos)",
        badge: "🏕️ ❓ Ajuda com Aluguel de Tinas",
        icon: "🏕️",
        summary: "Controle de locação de tinas 360L, caixas térmicas, cálculo de diárias, garantia e devoluções.",
        description: "Gestão comercial de contratos temporários de tinas térmicas de 360 litros e jogos de mesas para festas e eventos.",
        steps: [
            "<b>📌 Botão 'Novo Aluguel de Tina/Mesa':</b> Abre o formulário para registrar o locatário, evento e equipamentos.",
            "<b>📌 Lista de Contratos Ativos:</b> Exibe os cards de aluguel com nome do locatário, telefone com WhatsApp, quantidade de tinas alugadas (ex: 2 Tinas Azuis 360L) e data limite de devolução.",
            "<b>📌 Selos de Situação:</b> Selo verde 'Ativo', selo vermelho 'ATRASADO' e selo cinza 'Devolvido'.",
            "<b>📌 Painel Financeiro de Caução:</b> Mostra o valor cobrado pela diária e o montante retido como caução de garantia.",
            "<b>📌 Botão 'Registrar Devolução':</b> Dá baixa na locação, inspeciona o estado das peças e efetua a liberação da caução."
        ],
        tips: [
            "⚠️ <b>Inspecione antes de devolver caução:</b> Sempre confira se as tinas não possuem furadas ou travas quebradas antes de devolver o dinheiro da caução."
        ]
    },

    "recibos": {
        title: "Recibos, Orçamentos & Comprovantes Formais",
        badge: "📜 ❓ Como Emitir Recibos & Orçamentos",
        icon: "📜",
        summary: "Emissor de documentos timbrados em PDF: recibos de pagamento, orçamentos e comprovantes formais.",
        description: "Módulo de confecção de recibos e orçamentos em PDF com o logotipo timbrado oficial da Gelo do Vale.",
        steps: [
            "<b>📌 Seletor de Tipo de Documento:</b> Alternador entre 'Recibo de Pagamento', 'Orçamento Comercial' e 'Comprovante de Entrega'.",
            "<b>📌 Seleção de Cliente ou Avulso:</b> Escolha um parceiro da lista ou digite o nome e CPF/CNPJ de um recebedor avulso.",
            "<b>📌 Tabela de Itens e Valores:</b> Campos para adicionar produtos, quantidades de fardos, preço unitário e descontos.",
            "<b>📌 Botão 'Gerar Documento (PDF)':</b> Confecciona o PDF timbrado na tela com opções para baixar, imprimir ou enviar link no WhatsApp."
        ],
        tips: [
            "💡 <b>Converter Orçamento em Pedido:</b> Orçamentos aprovados possuem o botão 'Converter em Pedido' para abrir a rota sem redigitar nada."
        ]
    },

    "pedidos": {
        title: "Central de Pedidos Pendentes & Programação",
        badge: "📦 ❓ Como Gerenciar Pedidos Pendentes",
        icon: "📦",
        summary: "Fila de recepção de pedidos via WhatsApp ou representante para triagem e envio aos caminhões.",
        description: "Gerencia a fila de solicitações de fardos de gelo que aguardam separação no estoque ou inclusão na rota.",
        steps: [
            "<b>📌 Lista Cronológica de Pedidos:</b> Cards organizados por horário de chegada, nome do cliente e urgência.",
            "<b>📌 Detalhamento da Solicitado:</b> Mostra os fardos pedidos (ex: 40 Fardos 5kg Cubo), valor total, forma de pagamento e observações do motorista.",
            "<b>📌 Botão Verde 'Aprovar Pedido':</b> Confirma o pedido e despacha a ordem para a folha de carga do caminhão.",
            "<b>📌 Botão 'Editar / Cancelar':</b> Permite alterar quantidades antes do carregamento do veículo."
        ],
        tips: [
            "💡 Ao aprovar o pedido, o sistema dispara um aviso no WhatsApp do cliente avisando que o caminhão saiu para entrega."
        ]
    },

    "historico": {
        title: "Histórico Geral de Entregas & Auditoria de Rotas",
        badge: "🚚 ❓ Entenda o Histórico de Entregas",
        icon: "🚚",
        summary: "Consulta retroativa auditável de todas as entregas concluídas, notas, comprovantes e valores.",
        description: "Arquivo de auditoria de entregas concluídas para conciliação contábil e conferência de rotas passadas.",
        steps: [
            "<b>📌 Filtro por Intervalo de Datas:</b> Menus para filtrar por 'Hoje', 'Esta Semana', 'Este Mês' ou intervalo customizado.",
            "<b>📌 Filtro por Motorista / Cliente:</b> Caixas de seleção para isolar as entregas de um entregador específico.",
            "<b>📌 Tabela Auditável de Entregas:</b> Mostra data/hora da conclusão, fardos entregues, valor total, forma de pagamento e foto do comprovante assinado.",
            "<b>📌 Botão 'Re-emitir Comprovante':</b> Re-envia a 2ª via do recibo no WhatsApp do cliente."
        ],
        tips: [
            "💡 Exporte a lista filtrada para planilha Excel ou PDF para conciliação bancária mensal."
        ]
    },

    // -------------------------------------------------------------
    // SUB-ABAS DO PAINEL ADMINISTRATIVO (CONFIGURAÇÕES & PREÇOS)
    // -------------------------------------------------------------
    "precos": {
        title: "Tabela Mestra de Preços & Descontos por Volume",
        badge: "🏷️ ❓ Configurar Tabela Mestra de Preços",
        icon: "🏷️",
        summary: "Tabela geral de preços da fábrica para Gelo Cubo 5kg, Moído 5kg, Barra 20kg e faixas de atacado.",
        description: "Sub-aba para definir os preços de tabela praticados no balcão e nas entregas padrão da fábrica.",
        steps: [
            "<b>📌 Lista Mestra de Produtos:</b> Exibe todos os itens produzidos pela Gelo do Vale.",
            "<b>📌 Campo de Preço Base de Venda:</b> Edite o valor unitário por fardo (ex: R$ 12,00 por saco de 5kg).",
            "<b>📌 Tabela de Desconto por Volume:</b> Configure preços reduzidos para compras no atacado (ex: acima de 100 fardos = R$ 9,50).",
            "<b>📌 Botão Verde 'Salvar Alterações':</b> Atualiza a tabela mestra em todo o sistema (PDV Balcão e Pedidos de Rota)."
        ],
        tips: [
            "⚠️ A alteração da Tabela Mestra atualiza o PDV Balcão na hora. Clientes com 'Preço Especial' mantêm sua tabela própria."
        ]
    },

    "viagem": {
        title: "Acerto de Viagem, Fechamento de Carga & Prestação de Contas",
        badge: "📋 ❓ Como Fazer Acerto de Carga",
        icon: "📋",
        summary: "Fechamento diário do caminhão: conferência de fardos carregados, devolvidos, despesas e acerto financeiro.",
        description: "Sub-aba usada no final do dia para auditar a prestação de contas dos motoristas de rota.",
        steps: [
            "<b>📌 Seletor de Motorista e Data:</b> Escolha o entregador responsável pelo fechamento.",
            "<b>📌 Campos de Carga (Saída vs Retorno):</b> Digite o total de fardos que saíram do galpão (ex: 300 fardos) e o total retornado no baú (ex: 20 fardos).",
            "<b>📌 Campo de Dinheiro Recolhido:</b> Digite o montante de cédulas entregues na tesouraria pelo motorista.",
            "<b>📌 Tabela de Despesas da Viagem:</b> Lance gastos comprovados com combustível, pedágio ou refeição do ajudante.",
            "<b>📌 Painel de Resultado da Auditoria:</b> Mostra em verde (Acerto Perfeito sem Divergência) ou amarelo/vermelho se houver furo de carga (sacos faltantes)."
        ],
        tips: [
            "💡 Permite lançar margem técnica de derretimento em dias de calor extremo para não penalizar o entregador indevidamente."
        ]
    },

    "insumos": {
        title: "Estoque de Insumos & Matéria-Prima da Fábrica",
        badge: "🏭 ❓ Como Controlar Insumos da Fábrica",
        icon: "🏭",
        summary: "Gestão do estoque de embalagens plásticas (2kg, 5kg, 20kg), fechos metálicos e essências saborizadas.",
        description: "Controle do estoque de insumos necessários para empacotar e produzir o gelo.",
        steps: [
            "<b>📌 Grade de Insumos no Almoxarifado:</b> Mostra o saldo de sacos plásticos de 2kg, 5kg e 20kg, bobinas e arames de selagem.",
            "<b>📌 Botão 'Dar Entrada de Insumos':</b> Registra a compra de novos lotes de sacos plásticos com valor pago na nota fiscal.",
            "<b>📌 Campo de Estoque Mínimo de Alerta:</b> Define a quantidade limite para o sistema avisar quando for hora de comprar mais sacos."
        ],
        tips: [
            "💡 O custo unitário das embalagens é utilizado pelo Dashboard para calcular a margem de lucro real por fardo."
        ]
    },

    "rentabilidade": {
        title: "Análise de Rentabilidade de Freezers & ROI por Cliente",
        badge: "📈 ❓ Como Analisar o ROI dos Freezers",
        icon: "📈",
        summary: "Relatório comercial que analisa o volume de compras por freezer alocado para medir o retorno do investimento.",
        description: "Relatório de giro de fardos por conservador instalado em regime de comodato.",
        steps: [
            "<b>📌 Tabela de Giro por Cliente:</b> Exibe a média mensal de fardos comprados por cada cliente que possui freezer da fábrica.",
            "<b>📌 Indicadores de Desempenho:</b> Selo verde (Giro Alto) ou vermelho (Giro Baixo < 30 fardos/mês).",
            "<b>📌 Ação Comercial de Remanejamento:</b> Permite identificar locais fracos para retirar o freezer e recolocá-lo em um parceiro mais rentável."
        ],
        tips: [
            "💡 Recolocar um freezer ocioso em um ponto comercial forte pode triplicar o faturamento do equipamento."
        ]
    },

    "contas_receber": {
        title: "Contas a Receber, Fiados & Cobrança Automática WhatsApp",
        badge: "💳 ❓ Como Gerenciar Contas a Receber",
        icon: "💳",
        summary: "Painel de duplicatas pendentes, baixa de valores recebidos e cobrança facilitada por PIX no WhatsApp.",
        description: "Central de liquidação financeira de vendas realizadas a prazo no carnê de fiados.",
        steps: [
            "<b>📌 Filtros de Títulos:</b> Alternador para 'Todas', 'Vencidas (Inadimplentes)', 'A Vencer' e 'Quitadas'.",
            "<b>📌 Botão Verde 'Receber':</b> Abre a janela de baixa de pagamento em Dinheiro, PIX ou Cartão (suporta baixa parcial ou total).",
            "<b>📌 Botão Azul 'Cobrar via WhatsApp':</b> Abre a mensagem formatada contendo o extrato da dívida e a chave PIX Copia e Cola pronta."
        ],
        tips: [
            "💡 A cobrança via WhatsApp gera automaticamente o código PIX Copia e Cola para o cliente pagar pelo app do banco em segundos."
        ]
    },

    "integracoes": {
        title: "Integração de Pagamentos (PIX) & Gateway de Comunicação (WhatsApp API)",
        badge: "⚙️ ❓ Como Configurar PIX e WhatsApp",
        icon: "⚙️",
        summary: "Configuração da Chave PIX oficial da fábrica e servidores de envio automático de WhatsApp.",
        description: "Central de conexões de pagamento e servidores de envio de mensagens do sistema.",
        steps: [
            "<b>📌 Campo de Chave PIX Principal:</b> Insira sua chave oficial (CNPJ, Celular, E-mail ou Chave Aleatória) exibida nos comprovantes e QR Codes.",
            "<b>📌 Configuração WhatsApp API:</b> Selecione o provedor (Z-API, Evolution API, Webhook) e digite o Token e Instância de acesso.",
            "<b>📌 Botão 'Enviar Mensagem de Teste':</b> Testa o disparo de mensagens para confirmar que a integração está ativa."
        ],
        tips: [
            "💡 A chave PIX correta evita que os pagamentos gerados no balcão sejam rejeitados pelo banco."
        ]
    },

    "whatsapp_central": {
        title: "Central de Modelos de Mensagem (Templates para WhatsApp)",
        badge: "💬 ❓ Como Usar os Templates de Mensagem",
        icon: "💬",
        summary: "Editor de modelos de texto pré-formatados com variáveis dinâmicas `{nome}`, `{valor}`, `{chave_pix}`.",
        description: "Personalizador de mensagens automáticas disparadas pelo aplicativo.",
        steps: [
            "<b>📌 Seletor de Modelo:</b> Escolha entre 'Comprovante de Venda', 'Lembrete de Cobrança', 'Aviso de Saída do Motorista'.",
            "<b>📌 Editor de Texto:</b> Digite a mensagem utilizando variáveis dinâmicas entre chaves `{...}`.",
            "<b>📌 Painel de Pré-Visualização:</b> Mostra como a mensagem será exibida na tela do celular do cliente.",
            "<b>📌 Botão 'Salvar Template':</b> Atualiza o modelo de texto no sistema."
        ],
        tips: [
            "💡 Variáveis como `{nome}` e `{valor}` são substituídas automaticamente pelos dados reais da venda no envio."
        ]
    },

    "seguranca": {
        title: "Segurança, Backup dos Dados & Controle de Versão",
        badge: "🛡️ ❓ Entenda Backup e Versão",
        icon: "🛡️",
        summary: "Gerenciamento de backups manuais em JSON, salvamento redundante no OneDrive e sincronização em nuvem.",
        description: "Painel de proteção e segurança dos dados operacionais e financeiros da fábrica.",
        steps: [
            "<b>📌 Indicador de Status OneDrive / Nuvem:</b> Confirma se o salvamento no arquivo do OneDrive e Firebase está ativo.",
            "<b>📌 Botão 'Download Backup (JSON)':</b> Baixa uma cópia física de segurança dos dados no seu computador.",
            "<b>📌 Botão 'Restaurar Arquivo de Backup':</b> Carrega um arquivo `.json` salvo anteriormente em caso de troca de computador."
        ],
        tips: [
            "🛡️ Faça o download do arquivo de backup em JSON no último dia de cada mês para guarda de segurança."
        ]
    },

    "usuarios": {
        title: "Gestão de Usuários, Senhas & Controle de Acessos",
        badge: "🔑 ❓ Como Gerenciar Permissões de Usuários",
        icon: "🔑",
        summary: "Cadastro de funcionários, senhas com criptografia SHA-256 e limitação de telas por perfil.",
        description: "Controle de acessos dos colaboradores aos módulos do sistema.",
        steps: [
            "<b>📌 Tabela de Usuários:</b> Lista os funcionários cadastrados e seus perfis (Admin, Atendente Balcão, Entregador).",
            "<b>📌 Botão 'Novo Usuário':</b> Cadastra um novo funcionário com login de acesso e senha criptografada SHA-256.",
            "<b>📌 Grade de Checkboxes de Permissões:</b> Marque quais abas da sidebar o funcionário tem permissão para acessar (ex: liberando apenas 'PDV Balcão')."
        ],
        tips: [
            "🔒 Restringir acessos protege relatórios de faturamento e margens de lucro contra visualizações de funcionários do balcão."
        ]
    },

    "ajuda": {
        title: "Central de Suporte, Diagnóstico & Teste de Impressora",
        badge: "❓ ❓ Manual de Ajuda & Auto-Diagnóstico",
        icon: "❓",
        summary: "Módulo de auto-teste do sistema (13 verificações), teste de impressão térmica e guia de treinamento.",
        description: "Central de suporte técnico e integridade do GelControl.",
        steps: [
            "<b>📌 Botão 'Rodar Auto-Diagnóstico (13 Pontos)':</b> Executa testes de integridade no banco de dados, layout, conexão e armazenamento.",
            "<b>📌 Botão 'Imprimir Cupom de Teste':</b> Envia um cupom de teste para validar a impressora térmica 80mm/58mm do balcão.",
            "<b>📌 Guia de Perguntas Frequentes (FAQ):</b> Expanda as perguntas para ler tutoriais de treinamento."
        ],
        tips: [
            "💡 Utilize o botão 'Limpar Cache e Forçar Recarga' para atualizar o sistema imediatamente se houver atualizações pendentes."
        ]
    },

    // -------------------------------------------------------------
    // AJUDA ESPECÍFICA PARA JANELAS INTERNAS & MODAIS
    // -------------------------------------------------------------
    "modal_client": {
        title: "Janela: Cadastro & Edição de Cliente",
        icon: "👥",
        summary: "Mapeamento completo dos campos do formulário de cadastro do cliente.",
        description: "Esta janela é usada para cadastrar ou editar um parceiro comercial da Gelo do Vale.",
        steps: [
            "<b>📌 Campo 'Razão Social / Nome Fantasia':</b> Digite o nome comercial do estabelecimento (ex: Supermercado Rondon).",
            "<b>📌 Campo 'CNPJ / CPF':</b> Insira o documento fiscal para identificação e emissão de recibos.",
            "<b>📌 Campo 'Telefone / WhatsApp (com DDD)':</b> Insira o número de celular com 11 dígitos. Esse campo habilita o botão de envio direto de cobranças e comprovantes via WhatsApp.",
            "<b>📌 Campo 'Endereço, Bairro e Cidade':</b> Preencha o endereço completo. O sistema usa esses dados para gerar a localização no mapa do GPS da frota.",
            "<b>📌 Campo 'Limite de Crédito Aprovado':</b> Digite o valor teto para compras no carnê de fiados (ex: R$ 2.000,00).",
            "<b>📌 Seletor 'Capacidade do Freezer Instalado':</b> Selecione quantos fardos cabem no conservador do cliente para o cálculo do alerta de estoque baixo.",
            "<b>📌 Botão Verde 'Salvar Cliente':</b> Grava o cadastro no banco de dados local e sincroniza na nuvem."
        ],
        tips: [
            "💡 Após salvar o cliente, você pode definir uma tabela de preços diferenciada para ele clicando em 'Preços Especiais'."
        ]
    },

    "modal_order": {
        title: "Janela: Novo Pedido de Rota",
        icon: "📦",
        summary: "Mapeamento dos campos para agendamento de entregas de gelo.",
        description: "Janela para abrir um pedido de rota de carregamento para os motoristas.",
        steps: [
            "<b>📌 Menu Suspenso 'Selecionar Cliente':</b> Escolha o parceiro comercial cadastrado que solicitou a entrega.",
            "<b>📌 Campos de Quantidades de Produtos:</b> Digite quantos fardos de Gelo Cubo 5kg, Gelo 2kg ou Barra 20kg o cliente pediu.",
            "<b>📌 Campo 'Data de Entrega Agendada':</b> Escolha a data de envio da carga no calendário.",
            "<b>📌 Seletor 'Forma de Pagamento Combinada':</b> Escolha entre Dinheiro, PIX, Cartão ou Carnê A Prazo.",
            "<b>📌 Campo 'Observações para o Motorista':</b> Digite recados específicos (ex: 'Entregar na porta dos fundos antes das 11h').",
            "<b>📌 Botão Verde 'Confirmar Pedido':</b> Transmite o pedido para a central de Pedidos Pendentes e rota dos caminhões."
        ],
        tips: [
            "⚠️ O sistema alertará em vermelho se o cliente selecionado possuir parcelas vencidas no carnê de fiados."
        ]
    },

    "modal_sales": {
        title: "Janela: Finalizar Venda no Balcão (Checkout PDV)",
        icon: "🛒",
        summary: "Mapeamento da janela de recebimento, troco e impressão do balcão.",
        description: "Janela de fechamento de vendas diretas na fábrica.",
        steps: [
            "<b>📌 Seleção do Método de Pagamento:</b> Clique nos botões visuais para 'Dinheiro', 'PIX', 'Cartão' ou 'Carnê A Prazo'.",
            "<b>📌 Campo 'Valor Entregue pelo Cliente':</b> Digite a nota em cédulas recebida (ex: R$ 50,00) para o cálculo automático do troco em verde.",
            "<b>📌 Quadrado de QR Code PIX:</b> Mostra o QR Code dinâmico/estático na tela para o cliente escanear com o celular do banco.",
            "<b>📌 Botão Verde 'Concluir Venda Balcão':</b> Dá baixa imediata no estoque, lança a receita no caixa e ativa a impressão no cupom 80mm."
        ],
        tips: [
            "🖨️ A impressora térmica de balcão imprime o cupom automaticamente em 2 segundos."
        ]
    },

    "modal_freezer": {
        title: "Janela: Cadastro & Edição de Freezer (Conservador)",
        icon: "🧊",
        summary: "Mapeamento dos campos de tombamento, marca, número de série e voltagem.",
        description: "Janela de controle patrimonial para incluir ou alterar um conservador de gelo.",
        steps: [
            "<b>📌 Campo 'Código de Tombamento (Patrimônio)':</b> Digite o identificador interno da fábrica colado no freezer (ex: `FRZ-0089`).",
            "<b>📌 Campo 'Marca e Número de Série':</b> Insira o fabricante (Metalfrio, Fricon, Gelopar) e o número de série da nota fiscal.",
            "<b>📌 Campo 'Voltagem (110V / 220V)':</b> Escolha a voltagem elétrica do aparelho.",
            "<b>📌 Campo 'Capacidade Total em Sacos':</b> Digite a capacidade em fardos de 5kg (ex: 150 fardos).",
            "<b>📌 Seletor 'Status de Alocação':</b> Defina se o equipamento está 'Na Fábrica (Disponível)' ou 'Alocado em Cliente'.",
            "<b>📌 Botão Verde 'Salvar Equipamento':</b> Registra o freezer no sistema patrimonial."
        ],
        tips: [
            "💡 Etiquetas de tombamento corretas evitam perdas de patrimônio em trocas de clientes."
        ]
    },

    "modal_freezer_detail": {
        title: "Janela: Ficha Detalhada do Conservador",
        icon: "🧊",
        summary: "Visão 360° do equipamento: cliente instalado, histórico de manutenções e transferência.",
        description: "Ficha de informações técnicas e operacionais do freezer.",
        steps: [
            "<b>📌 Bloco de Dados do Cliente Instalado:</b> Mostra o nome do estabelecimento comercial onde o freezer está fisicamente.",
            "<b>📌 Tabela de Manutenções Registradas:</b> Lista trocas de borrachas, compressores e cargas de gás efetuadas.",
            "<b>📌 Botão 'Lançar Manutenção':</b> Registra um novo reparo técnico efetuado pela equipe da fábrica.",
            "<b>📌 Botão 'Transferir de Cliente':</b> Abre o formulário de recolocação para mover o freezer para outro endereço."
        ],
        tips: [
            "⚠️ Registrar manutenções previne falhas no compressor em finais de semana ensolarados."
        ]
    },

    "modal_rental": {
        title: "Janela: Contrato de Aluguel de Tinas & Mobiliário",
        icon: "🏕️",
        summary: "Mapeamento dos campos de locação de tinas 360L, caixas térmicas, diárias e caução.",
        description: "Formulário de contrato temporário de locação para festas e eventos.",
        steps: [
            "<b>📌 Campos de Dados do Locatário:</b> Preencha o Nome Completo, CPF e Telefone com WhatsApp do cliente.",
            "<b>📌 Seletor de Equipamentos Retirados:</b> Digite quantas tinas térmicas (ex: 2 Tinas Azuis 360L) e jogos de mesas estão sendo entregues.",
            "<b>📌 Campos 'Data de Saída' e 'Data Limite de Devolução':</b> Defina o período total da locação.",
            "<b>📌 Campos 'Valor da Diária' e 'Valor da Caução de Garantia':</b> Insira os valores financeiros negociados.",
            "<b>📌 Botão Verde 'Gerar Contrato de Aluguel':</b> Grava o contrato e emite o comprovante em PDF."
        ],
        tips: [
            "⚠️ Sempre inspecione o estado físico da tina antes de liberar a restituição da caução."
        ]
    },

    "modal_document": {
        title: "Janela: Emissão de Recibos & Orçamentos (PDF)",
        icon: "📜",
        summary: "Mapeamento do gerador de documentos timbrados em PDF.",
        description: "Janela de confecção de recibos e orçamentos comerciais formais.",
        steps: [
            "<b>📌 Seletor 'Tipo de Documento':</b> Alternador entre 'Recibo de Pagamento', 'Orçamento Comercial' e 'Comprovante de Entrega'.",
            "<b>📌 Tabela de Discriminação de Itens:</b> Digite a descrição do produto, quantidade de fardos e valor unitário por linha.",
            "<b>📌 Campo 'Observações / Condições Comerciais':</b> Insira dados de validade do orçamento ou conta bancária para depósito.",
            "<b>📌 Botão Verde 'Gerar Documento (PDF)':</b> Confecciona o arquivo PDF na tela pronto para baixar, imprimir ou enviar via WhatsApp."
        ],
        tips: [
            "💡 Orçamentos gerados podem ser convertidos em pedido real com apenas 1 clique."
        ]
    },

    "modal_client_prices": {
        title: "Janela: Tabela de Preços Especiais do Cliente",
        icon: "🏷️",
        summary: "Mapeamento dos campos de desconto exclusivo por cliente.",
        description: "Janela para fixar tabela personalizada por fardo para grandes distribuidores.",
        steps: [
            "<b>📌 Tabela de Produtos:</b> Lista os produtos da fábrica (Gelo 5kg, Gelo 2kg, 20kg, etc.).",
            "<b>📌 Campo 'Preço Especial R$':</b> Digite o valor negociado exclusivo por fardo para este cliente.",
            "<b>📌 Botão Verde 'Salvar Tabela do Cliente':</b> Grava os preços especiais."
        ],
        tips: [
            "⚠️ Preços definidos nesta janela substituem a tabela mestra da fábrica apenas para este cliente."
        ]
    },

    "modal_receive_payment": {
        title: "Janela: Baixa de Pagamento & Liquidação de Carnê",
        icon: "💳",
        summary: "Mapeamento dos campos de baixa de duplicatas recebidas em Dinheiro/PIX.",
        description: "Janela para liquidar débitos e dar baixa no carnê de fiados.",
        steps: [
            "<b>📌 Campo 'Valor Recebido R$':</b> Digite a quantia entregue pelo cliente (aceita quitação total ou parcial).",
            "<b>📌 Seletor 'Forma de Pagamento':</b> Marque Dinheiro, PIX ou Cartão.",
            "<b>📌 Botão Verde 'Confirmar Recebimento':</b> Dá baixa na dívida e atualiza o saldo do cliente."
        ],
        tips: [
            "💡 Em baixas parciais, o saldo restante permanece pendente no carnê do cliente."
        ]
    },

    "modal_user_form": {
        title: "Janela: Cadastro de Usuário & Grade de Permissões",
        icon: "🔑",
        summary: "Mapeamento de logins, senhas SHA-256 e grade de permissões por tela.",
        description: "Janela para cadastrar funcionários e definir acessos às abas.",
        steps: [
            "<b>📌 Campos 'Nome Completo', 'Login' e 'Senha':</b> Digite os dados de acesso do colaborador.",
            "<b>📌 Grade de Checkboxes de Permissões:</b> Marque ou desmarque as caixas de seleção correspondentes a cada aba da sidebar.",
            "<b>📌 Botão Verde 'Salvar Usuário':</b> Grava o perfil criptografado em SHA-256."
        ],
        tips: [
            "🔒 Restringir acessos dos funcionários do balcão protege relatórios de faturamento e margens de lucro."
        ]
    },

    "modal_packaging_entry": {
        title: "Janela: Entrada de Insumos & Sacos Plásticos",
        icon: "🏭",
        summary: "Mapeamento dos campos de entrada de bobinas e sacos de embalagem.",
        description: "Formulário de abastecimento de matéria-prima.",
        steps: [
            "<b>📌 Campo 'Quantidade de Sacos Recebidos':</b> Digite o número de embalagens de 2kg, 5kg ou 20kg entregues pelo fornecedor.",
            "<b>📌 Campo 'Valor Total da Nota Fiscal R$':</b> Digite o valor pago para atualizar o custo unitário por embalagem.",
            "<b>📌 Botão Verde 'Registrar Entrada':</b> Soma a quantidade no estoque do almoxarifado."
        ],
        tips: [
            "💡 O custo da embalagem é usado pelo Dashboard para calcular a margem de lucro real da fábrica."
        ]
    },

    "modal_carne": {
        title: "Janela: Extrato do Carnê Digital de Fiados",
        icon: "💳",
        summary: "Mapeamento de parcelas pendentes e cobrança via WhatsApp.",
        description: "Janela de extrato financeiro detalhado do cliente.",
        steps: [
            "<b>📌 Tabela de Parcelas:</b> Lista todas as notas com datas de vencimento, valores e status.",
            "<b>📌 Botão Azul 'Cobrar via WhatsApp':</b> Abre a mensagem formatada com o valor total e a chave PIX Copia e Cola."
        ],
        tips: [
            "🔴 Notas vencidas há mais de 5 dias bloqueiam automaticamente novos pedidos a prazo."
        ]
    },

    "modal_caixa_diario": {
        title: "Janela: Fechamento de Caixa Diário",
        icon: "💵",
        summary: "Mapeamento da conferência de saldo em gaveta vs sistema.",
        description: "Janela de encerramento diário do caixa do balcão.",
        steps: [
            "<b>📌 Totais Registrados no Sistema:</b> Exibe os valores acumulados no dia em Dinheiro e PIX.",
            "<b>📌 Campo 'Valor em Dinheiro Contado na Gaveta':</b> Digite a quantia física presente na gaveta.",
            "<b>📌 Botão Verde 'Confirmar Fechamento':</b> Registra o fechamento diário do caixa."
        ],
        tips: [
            "⚠️ Divergências entre o sistema e a gaveta são destacadas em amarelo/vermelho."
        ]
    },

    "modal_weather_forecast": {
        title: "Janela: Previsão Meteorológica & Demandas de Gelo",
        icon: "🌤️",
        summary: "Mapeamento da curva de temperatura semanal Open-Meteo.",
        description: "Janela de inteligência climática da fábrica.",
        steps: [
            "<b>📌 Gráfico / Curva de Temperatura:</b> Acompanhe as máximas previstas para os próximos dias.",
            "<b>📌 Alerta de Demanda:</b> Dias ensolarados acima de 28°C exigem estoques reforçados."
        ],
        tips: [
            "💡 80% do volume de gelo é consumido em dias quentes e finais de semana ensolarados."
        ]
    },

    "modal_pwa": {
        title: "Janela: Instalação do App no Celular (Modo PWA)",
        icon: "📱",
        summary: "Mapeamento do passo a passo de instalação no Android/iOS.",
        description: "Guia para utilizar o GelControl offline como app nativo.",
        steps: [
            "<b>📌 No Android (Google Chrome):</b> Menu de 3 pontos > 'Instalar Aplicativo'.",
            "<b>📌 No iPhone / iPad (Safari):</b> Botão 'Compartilhar' > 'Adicionar à Tela de Início'.",
            "<b>📌 No Computador (Chrome/Edge):</b> Ícone de computador na barra de endereço > 'Instalar'."
        ],
        tips: [
            "📱 O modo PWA roda em tela cheia e funciona 100% offline no galpão."
        ]
    }
};
