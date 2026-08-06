/**
 * GELCONTROL - Dicionário Central de Ajuda e Tutoriais Contextuais
 * Conteúdo explicativo hiper-detalhado, estruturado CARD POR CARD com os códigos oficiais (COD: XXX-XX).
 */

window.GEL_HELP_DICTIONARY = {
    // -------------------------------------------------------------
    // ABAS PRINCIPAIS DA SIDEBAR
    // -------------------------------------------------------------
    "dashboard": {
        title: "Dashboard - Painel Principal (Visão Geral por Cards)",
        badge: "📊 ❓ Entenda os Cards do Dashboard",
        icon: "📊",
        summary: "Cockpit executivo detalhado card por card: KPIs financeiros, alertas atípicos, clima e atalhos.",
        description: "O Dashboard reúne os principais painéis (cards) de inteligência da fábrica. Abaixo está a explicação direta e específica de cada card presente nesta tela:",
        steps: [
            "<b>🔲 Card [COD: KPI-01] - Total de Clientes & Freezers Alocados:</b> Localizado no canto superior esquerdo. Mostra a quantidade exata de parceiros comerciais ativos e quantos conservadores de gelo estão instalados em clientes na rua. <br><i>• Como interagir:</i> Clique direto sobre este card para ser redirecionado automaticamente à tela de Inventário Patrimonial de Freezers.",
            "<b>🔲 Card [COD: KPI-02] - Volume de Gelo Entregue no Mês:</b> Exibe a tonelada/fardos totais de gelo em cubo (5kg/2kg) e gelo moído/barra distribuídos no mês atual. <br><i>• Como interagir:</i> Acompanhe este indicador para medir a velocidade de saída de estoque do galpão.",
            "<b>🔲 Card [COD: KPI-03] - Pedidos Pendentes de Carregamento:</b> Indica quantos pedidos foram solicitados por clientes ou representantes e estão aguardando triagem, separação ou carregamento no caminhão de rota. <br><i>• Como interagir:</i> Clique no card para abrir a Central de Pedidos e despachar a carga.",
            "<b>🔲 Card [COD: KPI-04] - Faturamento Mensal Líquido (R$):</b> Mostra em destaque verde a receita bruta acumulada no mês corrente, deduzida de eventuais descontos. <br><i>• Como interagir:</i> Serve para monitorar a meta financeira mensal da fábrica em tempo real.",
            "<b>🔲 Painel [COD: DASH-00] - Barra de Atalhos Operacionais Rápidos:</b> Localizada logo abaixo dos KPIs principais. Possui botões diretos de 1-clique para: <br><i>• 'Registrar Pedido'</i> (Abre novo pedido de rota); <br><i>• 'Novo Contrato'</i> (Abre locação de tinas); <br><i>• 'Cadastrar Freezer'</i> (Inclui novo patrimônio); <br><i>• 'Emitir Recibo'</i> (Abre gerador de PDF); <br><i>• 'Fechar Caixa'</i> (Abre acerto diário).",
            "<b>🔲 Painel [COD: WID-01] - Alertas de Faturamento Atípico & Eventos Locais:</b> Exibe caixas amareladas de aviso quando o faturamento diário ultrapassar 50% da média diária. <br><i>• Como interagir:</i> Permite cadastrar festas locais (Festa do Peão, Quermesses, Carnavais) para que o sistema entenda o motivo do pico e projete o estoque dos anos seguintes.",
            "<b>🔲 Painel [COD: WID-02] - Widget Meteorológico & Inteligência de Clima (Open-Meteo):</b> Conectado à API meteorológica, exibe a temperatura atual da região da fábrica e a previsão dos próximos 7 dias. <br><i>• Como interagir:</i> Dias com temperatura acima de 28°C geram picos de consumo de gelo de até 50%. Use a previsão para abastecer a fábrica preventivamente.",
            "<b>🔲 Painel [COD: WID-03] - Gráficos & Comparativos Comerciais:</b> Exibe o gráfico de barras comparando o volume de vendas por dia da semana e a curva comparativa com o mês anterior."
        ],
        tips: [
            "💡 <b>Dica de Operação:</b> Ao verificar temperaturas elevadas no [COD: WID-02], utilize o atalho rápido do [COD: DASH-00] para antecipar a produção de fardos de 5kg.",
            "⚠️ <b>Alerta de Pedidos:</b> Se o card [COD: KPI-03] ultrapassar 5 pedidos, ordene a triagem imediata no galpão para evitar atrasos na rota dos caminhões."
        ]
    },

    "pdv": {
        title: "Frente de Caixa Balcão - PDV (Visão Geral por Cards)",
        badge: "🛒 ❓ Entenda os Cards do PDV Balcão",
        icon: "🛒",
        summary: "Mapeamento dos 3 cards operacionais do PDV: Catálogo visual, Leitor de código de barras e Checkout/Troco.",
        description: "A tela de Frente de Caixa Balcão é dividida em 3 cards operacionais principais para vendas rápidas na portaria da fábrica:",
        steps: [
            "<b>🔲 Card [COD: PDV-01] - Catálogo Visual de Produtos (Lado Esquerdo):</b> Grade de cartões de produtos com imagem, nome e preço unitário dos fardos (Gelo Cubo 5kg, Gelo 2kg, Moído 5kg, Barra 20kg, Tinas). <br><i>• Como funciona:</i> Basta clicar no cartão do produto desejado para adicioná-lo imediatamente ao carrinho de compras.",
            "<b>🔲 Card [COD: PDV-02] - Painel do Carrinho de Compras & Leitor de Código de Barras:</b> Fica no centro/topo do caixa. Exibe a lista de itens adicionados, quantidades, preço unitário e subtotal acumulado. <br><i>• Leitor de Código de Barras:</i> Possui o campo de busca onde você pode bipar com leitor USB/Bluetooth a embalagem de saco de gelo para inserção instantânea no carrinho.",
            "<b>🔲 Card [COD: PDV-03] - Painel de Recebimento, Troco & Impressão (Lado Direito):</b> Módulo de fechamento financeiro da venda. <br><i>• Seletor de Cliente:</i> Permite escolher entre '-- Consumidor Final (Balcão) --' ou selecionar um cliente cadastrado para lançar no histórico; <br><i>• Formas de Pagamento:</i> Botões visuais para 'Dinheiro', 'PIX (QR Code)', 'Cartão Débito/Crédito' ou 'A Prazo (Carnê)'; <br><i>• Calculadora de Troco:</i> Campo 'Valor Entregue' onde você digita a nota recebida (ex: R$ 50,00) e o sistema calcula o troco em letras verdes; <br><i>• Botão Verde 'Concluir Venda':</i> Dá baixa imediata no estoque de sacos, registra o dinheiro e aciona a impressora térmica (80mm/58mm)."
        ],
        tips: [
            "⚠️ <b>Regra A Prazo no [COD: PDV-03]:</b> A modalidade 'A Prazo (Carnê)' só é ativada se um cliente cadastrado for selecionado. Vendas para Consumidor Balcão exigem pagamento à vista.",
            "🖨️ <b>Impressão Térmica:</b> O cupom impresso pelo [COD: PDV-03] já inclui o QR Code PIX e o endereço da fábrica."
        ]
    },

    "clientes": {
        title: "Gestão de Clientes & Carnê (Visão Geral por Cards)",
        badge: "👥 ❓ Entenda os Cards da Tela de Clientes",
        icon: "👥",
        summary: "Detalhamento card por card da carteira comercial: busca, cards de clientes, barra de estoque e carnê.",
        description: "Esta tela gerencia a carteira de parceiros comerciais. Ela é composta pelos seguintes cards e estruturas:",
        steps: [
            "<b>🔲 Card [COD: CLT-01] - Barra de Busca, Filtros & Novo Cadastro:</b> Localizado no topo da tela. <br><i>• Caixa de Pesquisa:</i> Digite Razão Social, Nome Fantasia, CNPJ/CPF ou Bairro para localizar qualquer parceiro; <br><i>• Filtros de Status:</i> Botões seletores 'Todos', 'Em Dia', 'Inadimplentes'; <br><i>• Botão Verde '+ Adicionar Cliente':</i> Abre o formulário [modal-client] para incluir novo parceiro.",
            "<b>🔲 Card [COD: CLT-02] - Ficha do Cliente & Nível de Estoque do Freezer:</b> Cada cliente possui seu card individual exibindo: <br><i>• Dados Principais:</i> Nome Fantasia, CNPJ, Telefone com botão direto de WhatsApp e Endereço; <br><i>• Dados do Conservador:</i> Tombamento do freezer instalado (ex: `FRZ-RO-01`), voltagem e capacidade em sacos; <br><i>• Selos de Alerta:</i> Selo vermelho 'ESTOQUE CRÍTICO' (freezer precisando de abastecimento urgente), amarelo 'ATENÇÃO' ou cinza 'EM DIA'; <br><i>• Barra de Progresso de Estoque:</i> Indicador gráfico de sacos restantes de Gelo 5kg, Gelo 2kg e Triturado 20kg; <br><i>• Botões de Ação:</i> Botão 'Carnê de Fiados', 'Editar', 'Preços Especiais' e 'Conversar no WhatsApp'.",
            "<b>🔲 Card [COD: CLT-03] - Extrato & Gerenciador do Carnê de Fiados:</b> Abre ao clicar no botão 'Carnê' de um cliente. <br><i>• Tabela de Parcelas:</i> Exibe datas de lançamento, vencimento, valor e status ('Pendente', 'Vencido', 'Pago'); <br><i>• Botão Azul 'Cobrar via WhatsApp':</i> Dispara mensagem pronta com extrato e chave PIX Copia e Cola."
        ],
        tips: [
            "🔴 <b>Bloqueio no [COD: CLT-02]:</b> Clientes com parcelas no [COD: CLT-03] vencidas há mais de 5 dias ficam travados para novas compras a prazo.",
            "📱 <b>WhatsApp em 1 Clique:</b> O ícone de WhatsApp no [COD: CLT-02] abre o aplicativo com o número formatado com DDD."
        ]
    },

    "freezers": {
        title: "Inventário Patrimonial de Freezers (Visão Geral por Cards)",
        badge: "🧊 ❓ Entenda os Cards do Inventário de Freezers",
        icon: "🧊",
        summary: "Detalhamento card por card do controle patrimonial: filtros, cards de equipamentos e histórico técnico.",
        description: "Controle físico e patrimonial dos conservadores de gelo cedidos em regime de comodato:",
        steps: [
            "<b>🔲 Card [COD: FRZ-01] - Barra de Filtros Patrimoniais & Novo Equipamento:</b> Fica no topo da tela. <br><i>• Filtros de Situação:</i> Botões para isolar 'Alocados em Cliente', 'Disponíveis na Fábrica' ou 'Em Manutenção'; <br><i>• Botão Verde '+ Novo Equipamento':</i> Abre a janela [modal-freezer] para cadastrar novo conservador.",
            "<b>🔲 Card [COD: FRZ-02] - Ficha de Tombamento do Conservador & QR Code:</b> Cada freezer possui seu card individual apresentando: <br><i>• Placa de Tombamento:</i> Código gravado no chassi (ex: `FRZ-0042`); <br><i>• Dados Técnicos:</i> Marca (Metalfrio, Fricon, Gelopar), capacidade total (ex: 200 fardos 5kg) e voltagem (110V/220V); <br><i>• Endereço Atual:</i> Nome do cliente onde está alocado ou 'Galpão Principal'; <br><i>• Botão 'Gerar Etiqueta QR Code':</i> Exibe e imprime a etiqueta adesiva QR Code para colar no aparelho físico.",
            "<b>🔲 Card [COD: FRZ-03] - Histórico de Manutenções & Reparos Técnicos:</b> Painel dentro da ficha detalhada do equipamento. <br><i>• Tabela de Serviços:</i> Lista trocas de borrachas de vedação, cargas de gás refrigerante e substituições de motor compressor; <br><i>• Botão 'Lançar Manutenção':</i> Registra nova intervenção feita pela equipe técnica."
        ],
        tips: [
            "💡 <b>Leitura por Celular no [COD: FRZ-02]:</b> Ao apontar a câmera do celular para o QR Code colado no freezer, a ficha do equipamento abre no sistema.",
            "📊 <b>Aviso de Rendimento:</b> Freezers que vendem menos de 30 fardos/mês são destacados para avaliação de recolocação."
        ]
    },

    "rentals": {
        title: "Aluguel de Tinas & Mobiliário (Visão Geral por Cards)",
        badge: "🏕️ ❓ Entenda os Cards da Tela de Tinas",
        icon: "🏕️",
        summary: "Detalhamento card por card dos contratos de aluguel: cadastro de locação e tabela de contratos ativos.",
        description: "Módulo de controle comercial para contratos temporários de tinas térmicas de 360L e jogos de mesas:",
        steps: [
            "<b>🔲 Card [COD: LOC-01] - Cadastro de Novo Aluguel de Tina/Mesa:</b> Fica no topo da página. <br><i>• Formulário de Saída:</i> Campos para registrar nome do locatário, CPF, telefone, quantidade de tinas 360L e jogos de mesas retirados; <br><i>• Definição de Diárias & Caução:</i> Campos para digitar o valor da diária e o valor retido como garantia financeira (caução); <br><i>• Botão Verde 'Registrar Aluguel':</i> Confirma a saída das tinas do galpão.",
            "<b>🔲 Card [COD: LOC-02] - Tabela de Contratos Ativos, Garantias & Devoluções:</b> Exibe a lista de locações em aberto. <br><i>• Ficha do Contrato:</i> Nome do locatário, telefone de contato com WhatsApp, data de retirada e data limite de devolução; <br><i>• Selos de Status:</i> Selo verde 'Ativo', selo vermelho 'ATRASADO' e selo cinza 'Devolvido'; <br><i>• Botão 'Registrar Devolução':</i> Abre a janela de vistoria de danos e efetua a restituição do valor da caução ao cliente."
        ],
        tips: [
            "⚠️ <b>Vistoria no [COD: LOC-02]:</b> Antes de clicar em 'Registrar Devolução', verifique se as tinas não possuem travas quebradas ou perfurações."
        ]
    },

    "recibos": {
        title: "Recibos & Orçamentos em PDF (Visão Geral por Cards)",
        badge: "📜 ❓ Entenda os Cards de Documentos",
        icon: "📜",
        summary: "Detalhamento card por card do gerador de recibos e histórico de documentos timbrados.",
        description: "Módulo de confecção e controle de documentos comerciais timbrados em PDF:",
        steps: [
            "<b>🔲 Card [COD: DOC-01] - Emissor de Recibos, Orçamentos & Comprovantes Timbrados:</b> Formulário gerador do documento. <br><i>• Seletor de Tipo:</i> Alternador entre 'Recibo de Pagamento', 'Orçamento Comercial' e 'Comprovante de Entrega'; <br><i>• Seletor de Cliente:</i> Escolha um parceiro da carteira ou digite um recebedor avulso; <br><i>• Tabela de Descriminação de Itens:</i> Adicione descrições dos fardos, quantidades e preços unitários; <br><i>• Botão Verde 'Gerar Documento (PDF)':</i> Confecciona o PDF timbrado oficial na tela com logotipo da Gelo do Vale.",
            "<b>🔲 Card [COD: DOC-02] - Histórico de Documentos Emitidos & 2ª Via:</b> Exibe a lista de documentos gerados anteriormente. <br><i>• Ações:</i> Permite baixar novamente o arquivo PDF, imprimir ou enviar o link timbrado no WhatsApp do cliente."
        ],
        tips: [
            "💡 <b>Converter Orçamento no [COD: DOC-01]:</b> Orçamentos aprovados possuem o botão 'Converter em Pedido' para abrir a entrega automaticamente."
        ]
    },

    "pedidos": {
        title: "Central de Pedidos Pendentes (Visão Geral por Cards)",
        badge: "📦 ❓ Entenda os Cards da Tela de Pedidos",
        icon: "📦",
        summary: "Detalhamento card por card da fila de triagem de entregas e aprovação de cargas.",
        description: "Fila de recepção e despacho de pedidos que aguardam envio nos caminhões:",
        steps: [
            "<b>🔲 Card [COD: PED-01] - Fila de Pedidos Pendentes para Triagem:</b> Painel principal com a lista de solicitações. <br><i>• Ordenação Cronológica:</i> Exibe os pedidos organizados por horário de chegada, cliente e grau de urgência; <br><i>• Resumo do Pedido:</i> Mostra o fardamento solicitado (ex: 40 Fardos 5kg Cubo), valor total em R$ e forma de pagamento combinada.",
            "<b>🔲 Card [COD: PED-02] - Painel de Detalhes, Edição & Aprovação para Rota:</b> Ficha expandida de cada pedido. <br><i>• Observações do Motorista:</i> Exibe recados de entrega (ex: 'Entregar na portaria dos fundos'); <br><i>• Botão Verde 'Aprovar Pedido':</i> Confirma o pedido e inclui os fardos na folha de carga do caminhão; <br><i>• Botões 'Editar / Cancelar':</i> Permitem modificar quantidades antes do carregamento do veículo."
        ],
        tips: [
            "💡 Ao clicar em 'Aprovar Pedido' no [COD: PED-02], o sistema envia aviso automático no WhatsApp do cliente informando que o caminhão saiu."
        ]
    },

    "historico": {
        title: "Histórico Geral de Entregas (Visão Geral por Cards)",
        badge: "🚚 ❓ Entenda os Cards do Histórico",
        icon: "🚚",
        summary: "Detalhamento card por card da auditoria de entregas concluídas e re-emissão de comprovantes.",
        description: "Registro histórico auditável de todas as entregas finalizadas pela frota da fábrica:",
        steps: [
            "<b>🔲 Card [COD: HIS-01] - Filtros por Período, Motorista & Cliente:</b> Fica no topo da página. <br><i>• Seletor de Intervalo:</i> Filtre por 'Hoje', 'Esta Semana', 'Este Mês' ou escolha datas no calendário; <br><i>• Seletor de Entregador:</i> Isola as entregas feitas por um motorista específico para conferência.",
            "<b>🔲 Card [COD: HIS-02] - Tabela Auditável de Entregas Concluídas:</b> Lista completa de comprovantes gravados. <br><i>• Detalhes do Registro:</i> Mostra data/hora da conclusão, fardos entregues, valor recebido e foto do comprovante assinado pelo cliente; <br><i>• Botão 'Re-emitir Comprovante':</i> Envia a 2ª via do recibo diretamente no WhatsApp do cliente."
        ],
        tips: [
            "💡 Exporte a tabela filtrada do [COD: HIS-02] para planilha Excel para fazer a conciliação bancária mensal."
        ]
    },

    // -------------------------------------------------------------
    // SUB-ABAS DO PAINEL ADMINISTRATIVO
    // -------------------------------------------------------------
    "precos": {
        title: "Tabela Mestra de Preços (Visão Geral por Cards)",
        badge: "🏷️ ❓ Entenda os Cards de Preços",
        icon: "🏷️",
        summary: "Detalhamento card por card da tabela mestra de produtos e faixas de desconto por volume.",
        description: "Sub-aba para gerenciamento dos preços oficiais praticados pela fábrica:",
        steps: [
            "<b>🔲 Card [COD: PRC-01] - Tabela Mestra de Preços da Fábrica:</b> Exibe a lista de produtos (Gelo Cubo 5kg, Gelo 2kg, Moído 5kg, Barra 20kg). <br><i>• Campo 'Preço Base R$':</i> Digite o valor unitário por fardo para vendas padrão de balcão e entregas; <br><i>• Botão Verde 'Salvar Alterações':</i> Atualiza a tabela imediatamente em todo o sistema.",
            "<b>🔲 Card [COD: PRC-02] - Matriz de Desconto por Volume de Atacado:</b> Tabela de faixas promocionais por quantidade. <br><i>• Configuração de Faixas:</i> Permite definir preços reduzidos para grandes compras (ex: acima de 100 fardos = R$ 9,50)."
        ],
        tips: [
            "⚠️ Salvar alterações no [COD: PRC-01] atualiza o PDV Balcão na hora. Clientes com 'Preço Especial' mantêm sua tabela própria."
        ]
    },

    "viagem": {
        title: "Acerto de Viagem & Carga (Visão Geral por Cards)",
        badge: "📋 ❓ Entenda os Cards de Acerto de Carga",
        icon: "📋",
        summary: "Detalhamento card por card da conferência de carga de saída, retorno, despesas e saldo do caminhão.",
        description: "Sub-aba usada no final do dia para auditar a prestação de contas dos motoristas de rota:",
        steps: [
            "<b>🔲 Card [COD: VIA-01] - Conferência de Carga (Saída vs Retorno do Baú):</b> Módulo de contagem física de fardos. <br><i>• Seletor de Motorista e Data:</i> Escolha o entregador responsável pela rota; <br><i>• Campos de Fardamento:</i> Digite a quantidade de fardos carregados na saída (ex: 300 fardos) e a quantidade retornada no baú (ex: 20 fardos).",
            "<b>🔲 Card [COD: VIA-02] - Prestação de Contas, Despesas & Auditoria de Divergência:</b> Fechamento financeiro da rota. <br><i>• Campo 'Dinheiro Recolhido':</i> Digite o montante de cédulas entregues na tesouraria pelo motorista; <br><i>• Tabela de Despesas da Rota:</i> Lance notas fiscais de combustível, pedágio ou refeição do ajudante; <br><i>• Indicador de Auditoria:</i> Exibe em verde (Sem Diferença) ou amarelo/vermelho se houver furo de carga (sacos faltantes ou diferença no caixa)."
        ],
        tips: [
            "💡 O [COD: VIA-02] permite lançar uma margem técnica de derretimento em dias de calor extremo."
        ]
    },

    "insumos": {
        title: "Estoque de Insumos da Fábrica (Visão Geral por Cards)",
        badge: "🏭 ❓ Entenda os Cards de Insumos",
        icon: "🏭",
        summary: "Detalhamento card por card do controle de almoxarifado, embalagens plásticas e compras.",
        description: "Controle de estoque de insumos e matérias-primas de produção:",
        steps: [
            "<b>🔲 Card [COD: INS-01] - Estoque do Almoxarifado de Sacos Plásticos & Matéria-Prima:</b> Painel de saldos de estoque. <br><i>• Saldos Atuais:</i> Mostra o total de sacos plásticos de 2kg, 5kg e 20kg, bobinas de celofane e fechos metálicos; <br><i>• Nível de Alerta:</i> Alerta quando o estoque atingir a quantidade mínima de segurança.",
            "<b>🔲 Card [COD: INS-02] - Lançamento de Entradas & Compras de Embalagens:</b> Formulário de recepção de notas de compra. <br><i>• Campos de Entrada:</i> Digite o lote de sacos recebidos e o valor pago na nota fiscal para atualizar o custo unitário por embalagem."
        ],
        tips: [
            "💡 O custo da embalagem lançado no [COD: INS-02] é usado pelo Dashboard para calcular o lucro líquido real por fardo."
        ]
    },

    "rentabilidade": {
        title: "Rentabilidade ROI de Freezers (Visão Geral por Cards)",
        badge: "📈 ❓ Entenda os Cards de Rentabilidade ROI",
        icon: "📈",
        summary: "Detalhamento card por card do giro mensal por freezer alocado e análise de substituição.",
        description: "Relatório de desempenho comercial dos conservadores cedidos em comodato:",
        steps: [
            "<b>🔲 Card [COD: ROI-01] - Tabela de Giro Mensal por Freezer em Comodato:</b> Exibe a média mensal de fardos comprados por cada cliente que possui freezer da fábrica. <br><i>• Medidor de Volume:</i> Exibe o faturamento gerado pelo conservador instalado.",
            "<b>🔲 Card [COD: ROI-02] - Análise de Performance & Remanejamento de Conservador:</b> Módulo de tomada de decisão. <br><i>• Indicadores Visuais:</i> Selo verde 'Giro Alto' ou vermelho 'Giro Baixo (< 30 fardos/mês)'; <br><i>• Ação Comercial:</i> Permite identificar conservadores ociosos para recolocar em estabelecimentos de maior movimento."
        ],
        tips: [
            "💡 Recolocar um freezer ocioso mapeado no [COD: ROI-02] em um novo cliente pode aumentar as vendas em até 300%."
        ]
    },

    "contas_receber": {
        title: "Contas a Receber & Fiados (Visão Geral por Cards)",
        badge: "💳 ❓ Entenda os Cards de Contas a Receber",
        icon: "💳",
        summary: "Detalhamento card por card do controle de duplicatas, liquidação de carnês e cobrança por PIX.",
        description: "Central de controle financeiro para liquidação de vendas a prazo:",
        steps: [
            "<b>🔲 Card [COD: REC-01] - Central de Contas a Receber & Duplicatas A Vencer:</b> Painel de controle de títulos. <br><i>• Filtros de Situação:</i> Alternador para 'Todas', 'Vencidas (Inadimplentes)', 'A Vencer' e 'Quitadas'; <br><i>• Visão de Totais:</i> Soma total a receber acumulada na rua.",
            "<b>🔲 Card [COD: REC-02] - Baixa de Pagamento & Cobrança PIX WhatsApp:</b> Módulo de liquidação de parcelas. <br><i>• Botão Verde 'Receber':</i> Abre a janela de baixa de valores em Dinheiro, PIX ou Cartão (aceita baixa parcial ou total); <br><i>• Botão Azul 'Cobrar via WhatsApp':</i> Dispara mensagem contendo o extrato da dívida e a chave PIX Copia e Cola pronta."
        ],
        tips: [
            "💡 O botão de cobrança do [COD: REC-02] gera o PIX Copia e Cola para o cliente colar no aplicativo do banco."
        ]
    },

    "integracoes": {
        title: "Integrações PIX & WhatsApp API (Visão Geral por Cards)",
        badge: "⚙️ ❓ Entenda os Cards de Integração",
        icon: "⚙️",
        summary: "Detalhamento card por card das configurações de chave PIX e servidores de WhatsApp API.",
        description: "Central de conexões de pagamento e servidores de mensagens:",
        steps: [
            "<b>🔲 Card [COD: INT-01] - Configuração da Chave PIX Oficial da Fábrica:</b> Módulo de cadastro da chave bancária. <br><i>• Campo de Chave PIX:</i> Digite a chave oficial da fábrica (CNPJ, Celular, E-mail ou EVP) exibida em comprovantes e QR Codes.",
            "<b>🔲 Card [COD: INT-02] - Gateway de Comunicação WhatsApp API:</b> Servidor de envio automático de mensagens. <br><i>• Parâmetros de Conexão:</i> Selecione o provedor (Z-API, Evolution API) e insira o Token e a Instância de envio; <br><i>• Botão 'Testar Envio':</i> Dispara uma mensagem de teste para validar a conexão."
        ],
        tips: [
            "💡 Manter a chave PIX correta no [COD: INT-01] garante que o QR Code do caixa seja lido sem erros."
        ]
    },

    "whatsapp_central": {
        title: "Central de Templates WhatsApp (Visão Geral por Cards)",
        badge: "💬 ❓ Entenda os Cards da Central WhatsApp",
        icon: "💬",
        summary: "Detalhamento card por card do editor de mensagens dinâmicas com variáveis automáticas.",
        description: "Central de personalização de mensagens disparadas pelo aplicativo:",
        steps: [
            "<b>🔲 Card [COD: WTP-01] - Editor de Modelos de Mensagem com Variáveis Dinâmicas:</b> Formulário de confecção de textos. <br><i>• Seletor de Modelo:</i> Escolha entre 'Comprovante de Venda', 'Lembrete de Cobrança', 'Aviso de Saída do Motorista'; <br><i>• Editor de Texto:</i> Digite a mensagem utilizando variáveis dinâmicas `{nome}`, `{valor}`, `{chave_pix}`; <br><i>• Pré-Visualização:</i> Exibe na hora como a mensagem ficará no WhatsApp do cliente."
        ],
        tips: [
            "💡 As variáveis entre chaves `{...}` no [COD: WTP-01] são substituídas automaticamente pelos dados reais da venda."
        ]
    },

    "seguranca": {
        title: "Segurança & Backup dos Dados (Visão Geral por Cards)",
        badge: "🛡️ ❓ Entenda os Cards de Segurança & Backup",
        icon: "🛡️",
        summary: "Detalhamento card por card do status do OneDrive, backup em JSON e pontos de restauração.",
        description: "Painel de proteção contra perdas e salvamento redundante dos dados:",
        steps: [
            "<b>🔲 Card [COD: SEG-01] - Status de Sincronização em Nuvem & OneDrive:</b> Indicador de salvamento online. <br><i>• Indicador LED:</i> Confirma se os dados estão sincronizados com a pasta do OneDrive e Firebase em tempo real.",
            "<b>🔲 Card [COD: SEG-02] - Download de Backup Físico JSON:</b> Módulo de cópia de segurança manual. <br><i>• Botão 'Download Backup (JSON)':</i> Gera e baixa um arquivo `.json` contendo todas as vendas, clientes e estoque no seu computador.",
            "<b>🔲 Card [COD: SEG-04] - Restauração de Dados & Versão do Aplicativo:</b> Gerenciador de restauração. <br><i>• Botão 'Restaurar Arquivo de Backup':</i> Carrega um arquivo de backup salvo anteriormente em caso de troca de computador."
        ],
        tips: [
            "🛡️ Faça o download do arquivo de backup no [COD: SEG-02] no último dia útil de cada mês para guarda externa."
        ]
    },

    "usuarios": {
        title: "Gestão de Usuários & Permissões (Visão Geral por Cards)",
        badge: "🔑 ❓ Entenda os Cards de Gerenciamento de Usuários",
        icon: "🔑",
        summary: "Detalhamento card por card dos logins de colaboradores, senhas SHA-256 e matriz de permissões.",
        description: "Controle de segurança dos colaboradores e acessos aos módulos do sistema:",
        steps: [
            "<b>🔲 Card [COD: USU-01] - Segurança da Conta do Administrador:</b> Módulo de proteção de acesso master. <br><i>• Alteração de Senha Master:</i> Permite atualizar a senha do usuário Administrador com criptografia SHA-256.",
            "<b>🔲 Card [COD: USU-02] - Tabela de Funcionários & Matriz de Permissões por Tela:</b> Cadastro de colaboradores. <br><i>• Cadastro de Login:</i> Permite criar novo funcionário com usuário e senha próprios; <br><i>• Matriz de Permissões:</i> Marque quais abas da sidebar o funcionário pode visualizar (ex: bloqueando abas de faturamento)."
        ],
        tips: [
            "🔒 Restringir acessos no [COD: USU-02] evita que atendentes do balcão visualizem margens de lucro ou relatórios sigilosos."
        ]
    },

    "ajuda": {
        title: "Central de Suporte & Auto-Diagnóstico (Visão Geral por Cards)",
        badge: "❓ ❓ Entenda os Cards da Central de Ajuda",
        icon: "❓",
        summary: "Detalhamento card por card do auto-teste de 13 pontos, impressora térmica e limpeza de cache.",
        description: "Central de auditoria de integridade técnica e testes do sistema:",
        steps: [
            "<b>🔲 Card [COD: AJU-01] - Auto-Diagnóstico de Integridade do Sistema (13 Pontos):</b> Teste técnico automatizado. <br><i>• Botão 'Rodar Auto-Diagnóstico':</i> Executa 13 testes em tempo real verificando banco de dados, conexão, layout, memória e sincronização.",
            "<b>🔲 Card [COD: AJU-02] - Teste de Impressora Térmica 80mm/58mm:</b> Módulo de validação de hardware. <br><i>• Botão 'Imprimir Cupom de Teste':</i> Dispara uma impressão de validação para conferir o alinhamento do papel e QR Code."
        ],
        tips: [
            "💡 Utilize o botão 'Limpar Cache e Forçar Recarga' para atualizar o aplicativo imediatamente caso uma nova versão seja disponibilizada."
        ]
    }
};
