/**
 * GELCONTROL - Dicionário Central de Ajuda e Tutoriais Contextuais
 * Conteúdo explicativo detalhado e específico para cada módulo e janela interna da fábrica Gelo do Vale.
 */

window.GEL_HELP_DICTIONARY = {
    // -------------------------------------------------------------
    // ABAS PRINCIPAIS DA SIDEBAR
    // -------------------------------------------------------------
    "dashboard": {
        title: "Painel Financeiro & Clima (Cockpit Executivo)",
        badge: "📊 ❓ Entenda o Painel Principal",
        icon: "📊",
        summary: "Cockpit de controle em tempo real: faturamento diário/mensal, monitoramento do clima local, entregas pendentes e atalhos de vendas.",
        description: "O Dashboard é a central de comando da fábrica de gelo. Ele consolida os Principais Indicadores de Desempenho (KPIs) para a tomada de decisão rápida. Aqui você acompanha em tempo real o faturamento líquido acumulado do dia e do mês, total de fardos comercializados (gelo em cubo 5kg, moído e 20kg), status do caixa, entregas pendentes na rota e a previsão meteorológica de hoje e dos próximos dias — elemento estratégico vital, pois temperaturas acima de 28°C elevam a demanda por gelo em até 50%.",
        steps: [
            "<b>1. Acompanhe os Faturamentos no Topo:</b> Os cards superiores destacam o faturamento bruto e líquido do dia, comparado com o mesmo período do mês anterior.",
            "<b>2. Monitore o Clima Local:</b> O widget de meteorologia consulta o clima em tempo real via Open-Meteo. Se a temperatura subir, prepare a escala de produção dos congeladores com antecedência.",
            "<b>3. Verifique os Alertas de Estoque e Entregas:</b> A lista central exibe clientes em regime de comodato cujo freezer está com estimativa de estoque abaixo de 20% e pedidos aguardando despacho.",
            "<b>4. Atalhos de Ação Rápida:</b> Utilize os botões azuis e verdes para lançar 'Novo Pedido', 'Novo Cliente' ou abrir o 'PDV Balcão' diretamente sem precisar navegar pela sidebar."
        ],
        tips: [
            "💡 <b>Estratégia de Produção:</b> Dias ensolarados com previsão acima de 28°C exigem abastecimento prévio do galpão. Mantenha pelo menos 500 fardos de 5kg prontos para carregamento rápido nos caminhões.",
            "⚠️ <b>Entregas Pendentes:</b> Pedidos marcados com relógio amarelo exigem atenção para não estourar a janela de entrega combinada com os estabelecimentos comerciais.",
            "🔴 <b>Alertas de Fiados:</b> Se o indicador de contas a receber no Dashboard estiver vermelho, consulte a aba de Contas a Receber para disparar lembretes via WhatsApp."
        ]
    },

    "pdv": {
        title: "Frente de Caixa Rápido (PDV Balcão da Fábrica)",
        badge: "🛒 ❓ Entenda o PDV Balcão",
        icon: "🛒",
        summary: "Ponto de Venda de alta agilidade para vendas presenciais e retiradas no galpão com troco, PIX e comprovante WhatsApp/Cupom.",
        description: "O PDV Balcão foi desenvolvido para registrar vendas diretas efetuadas na portaria ou galpão da fábrica (retiradas por clientes finais, motoristas autônomos ou compras à vista). Ele possui atalhos visuais para o catálogo de produtos (Gelo Cubo 5kg, Gelo Moído 5kg, Gelo Barra 20kg, Tinas, etc.), cálculo automático de troco em dinheiro, integração com leitor de código de barras, gerador de QR Code PIX estático/dinâmico e emissão de comprovantes formatados para impressoras térmicas (80mm/58mm) ou envio no WhatsApp.",
        steps: [
            "<b>1. Adicionar Produtos ao Carrinho:</b> Clique no produto desejado no catálogo rápido ou digite o código de barras. Ajuste a quantidade de fardos/sacos nos botões '+' e '-'.",
            "<b>2. Identificar o Cliente:</b> Para vendas à vista rápidas, mantenha '-- Consumidor Final (Balcão) --'. Para registrar no histórico de um parceiro ou vender fiado, selecione o cliente cadastrado.",
            "<b>3. Escolher o Método de Pagamento:</b> Selecione entre Dinheiro, PIX (exibe o QR Code na tela), Cartão de Débito/Crédito ou 'A Prazo (Carnê)'.",
            "<b>4. Informar o Valor Pago (se Dinheiro):</b> Ao selecionar Dinheiro, digite a nota entregue pelo cliente (ex: R$ 50,00) para o sistema calcular o troco exato em destaque verde.",
            "<b>5. Finalizar e Emitir Comprovante:</b> Clique no botão verde 'Concluir Venda Balcão'. O sistema dará baixa automática no estoque, atualizará o caixa e exibirá o menu para imprimir cupom térmico ou enviar comprovante no WhatsApp."
        ],
        tips: [
            "⚠️ <b>Regra de Negócio para Vendas A Prazo (Fiado):</b> O pagamento 'A Prazo (Carnê)' só é liberado se um CLIENTE CADASTRADO for selecionado e ele possuir limite de crédito ativo. Vendas para o 'Consumidor Final (Balcão)' não permitem parcelamento ou fiado.",
            "💡 <b>Leitor de Código de Barras:</b> Se você possui um leitor USB/Bluetooth no balcão, basta bipar a embalagem do saco de gelo que ele é inserido instantaneamente no carrinho.",
            "🖨️ <b>Impressão Térmica:</b> Se sua impressora 80mm estiver configurada, o cupom sai em menos de 2 segundos com o logotipo da Gelo do Vale e a chave PIX."
        ]
    },

    "clientes": {
        title: "Gestão Completa de Clientes & Tabelas de Preço",
        badge: "👥 ❓ Como Gerenciar Clientes",
        icon: "👥",
        summary: "Cadastro unificado de parceiros comerciais, controle do carnê de fiados, limites de crédito e tabelas de preços personalizadas.",
        description: "Nesta central você administra toda a carteira de parceiros comerciais da Gelo do Vale (supermercados, conveniências, distribuidores, bares, restaurantes, quiosques de praia e postos de combustível). O módulo armazena dados cadastrais completos (Razão Social, CNPJ/CPF, Inscrição Estadual, endereço geo-localizado com mapa, contatos e WhatsApp), histórico financeiro de compras, controle do carnê digital de fiados com parcelas a vencer, capacidade do conservador em comodato e permissão para definir preços diferenciados por fardo para cada cliente.",
        steps: [
            "<b>1. Buscar ou Filtrar Clientes:</b> Digite o Nome Fantasia, Razão Social, Cidade ou Bairro na caixa de pesquisa superior para localizar instantaneamente qualquer cliente.",
            "<b>2. Cadastrar Novo Cliente:</b> Clique no botão azul 'Novo Cliente', preencha os dados de contato, CNPJ, limite de crédito pré-aprovado e o tamanho do freezer instalado no local.",
            "<b>3. Abrir Ficha do Cliente:</b> Clique em qualquer card de cliente para acessar o painel 360°: histórico de notas emitidas, extrato do carnê de débitos, posição do freezer e botão de rota no GPS.",
            "<b>4. Configurar Preço Personalizado:</b> Na ficha do cliente, clique em 'Preços Especiais' para fixar um valor customizado por fardo (ex: R$ 10,00/fardo para grande distribuidor vs R$ 12,00 preço padrão)."
        ],
        tips: [
            "🔴 <b>Selo 'Inadimplente / Devedor':</b> Clientes com parcelas do carnê vencidas há mais de 5 dias recebem um selo vermelho automático e o sistema bloqueia novas vendas a prazo até a quitação.",
            "🟡 <b>Alerta 'Estoque Baixo no Freezer':</b> Com base no consumo médio diário registrado nas entregas, o sistema calcula a reserva estimada de sacos no freezer do cliente e avisa quando é hora de enviar o caminhão de reabastecimento.",
            "📱 <b>Atalho de Conversa WhatsApp:</b> Clique no ícone verde de WhatsApp no card do cliente para abrir a conversa direta com mensagem de saudação pronta."
        ]
    },

    "freezers": {
        title: "Inventário Patrimonial de Equipamentos (Freezers em Comodato)",
        badge: "🧊 ❓ Ajuda com Freezers & Conservadores",
        icon: "🧊",
        summary: "Controle patrimonial rigoroso de conservadores horizontais/verticais alocados em clientes ou armazenados na fábrica.",
        description: "Este módulo realiza a gestão patrimonial de todo o acervo de freezers e conservadores de gelo da fábrica. Para garantir que nenhum equipamento seja perdido ou extraviado durante trocas comerciais, você registra a placa de tombamento (número de patrimônio interno), número de série do fabricante, marca (Metalfrio, Fricon, Gelopar, etc.), voltagem (110V/220V), capacidade em sacos (ex: 150 fardos de 5kg) e a localização exata do equipamento (alocado no cliente X, disponível no depósito ou em manutenção técnica).",
        steps: [
            "<b>1. Filtrar por Status Patrimonial:</b> Utilize as abas superiores para visualizar apenas equipamentos 'Alocados em Cliente', 'Disponíveis no Galpão' ou 'Em Manutenção'.",
            "<b>2. Cadastrar Novo Equipamento:</b> Clique em 'Novo Equipamento', insira a etiqueta de tombamento (ex: `FRZ-0042`), número de série da fábrica, capacidade e fotos do aparelho.",
            "<b>3. Alocar ou Transferir Equipamento:</b> Na lista de freezers disponíveis, clique em 'Alocar em Cliente', selecione o estabelecimento de destino e confirme o termo de comodato.",
            "<b>4. Registrar Manutenção Preventiva:</b> Clique na engrenagem do card para lançar trocas de borracha, carga de gás, motor ou limpeza técnica, mantendo o histórico de conservação."
        ],
        tips: [
            "💡 <b>Identificação Visual QR Code:</b> O sistema permite gerar e imprimir uma etiqueta QR Code para colar no freezer. Ao escanear o código com a câmera do celular, o entregador abre a ficha do equipamento na hora.",
            "⚠️ <b>Controle de Garantia e ROI:</b> Manter a data de compra e nota fiscal cadastradas permite acionar a garantia do fabricante em caso de falha no compressor.",
            "📊 <b>Relatório de Giro Mínimo:</b> Freezers que vendem menos de 30 fardos por mês acendem um alerta para que a equipe comercial avalie a retirada ou recolocação do equipamento."
        ]
    },

    "rentals": {
        title: "Aluguel de Equipamentos (Tinas Térmicas & Mobiliário para Eventos)",
        badge: "🏕️ ❓ Ajuda com Aluguel de Tinas",
        icon: "🏕️",
        summary: "Gestão comercial de locações temporárias de tinas térmicas de 360L, caixas isotérmicas e kits de mesas para festas e eventos.",
        description: "Controle as locações de tinas térmicas (tinas de 360 litros em cores variadas para bebidas), caixas térmicas e conjuntos de mesas e cadeiras alugados para eventos corporativos, casamentos, shows e festas particulares. O módulo registra a data e hora de retirada, prazo limite de devolução, valor da diária, caução de garantia retida e o contrato digital de locação.",
        steps: [
            "<b>1. Registrar Nova Locação:</b> Clique em 'Novo Aluguel de Tina/Mesa', selecione ou digite o nome do locatário, CPF/Telefone e endereço do evento.",
            "<b>2. Selecionar Equipamentos e Período:</b> Marque quantas tinas (ex: 2 Tinas Azuis 360L) e jogos de mesas estão sendo entregues, definindo as datas de saída e retorno.",
            "<b>3. Registrar Caução e Pagamento:</b> Insira o valor cobrado pela diária e o valor retido como garantia (caução em dinheiro ou PIX).",
            "<b>4. Dar Baixa na Devolução:</b> Quando o cliente devolver os equipamentos no galpão, localize o contrato e clique em 'Registrar Devolução'. Confira o estado das peças e libere o estorno da caução."
        ],
        tips: [
            "⚠️ <b>Alertas de Atraso na Devolução:</b> Tinas não devolvidas no dia combinado ficam destacadas em vermelho como 'ATRASADA' para que a equipe entre em contato via telefone ou WhatsApp.",
            "💡 <b>Venda Casada de Gelo:</b> Aproveite o lançamento do aluguel da tina para incluir os fardos de gelo de 5kg e 20kg necessários para abastecê-la, gerando uma venda completa no mesmo recibo."
        ]
    },

    "recibos": {
        title: "Recibos, Orçamentos & Comprovantes Formais",
        badge: "📜 ❓ Como Emitir Recibos & Orçamentos",
        icon: "📜",
        summary: "Gerador de documentos timbrados em PDF: recibos de quitação de pagamento, comprovantes de entrega e orçamentos comerciais.",
        description: "Ferramenta para emissão de documentos formais em PDF com o cabeçalho timbrado oficial da Gelo do Vale. Ideal para atender empresas, órgãos públicos, condomínios ou eventos que exigem prestação de contas detalhada. É possível emitir Recibos de Pagamento, Orçamentos Comerciais válidos por X dias e Comprovantes de Entrega com discriminação de itens, valores unitários, impostos e assinatura.",
        steps: [
            "<b>1. Selecionar o Tipo de Documento:</b> Escolha no menu se deseja emitir um 'Recibo de Pagamento', 'Orçamento Comercial' ou 'Comprovante de Entrega'.",
            "<b>2. Preencher Dados do Destinatário:</b> Selecione um cliente da lista cadastrada ou digite manualmente os dados de um recebedor avulso (Nome, CPF/CNPJ, Cidade).",
            "<b>3. Discriminar Itens e Valores:</b> Adicione as linhas de produto (ex: 50 Fardos de Gelo Cubo 5kg a R$ 12,00 = R$ 600,00) e desconto se houver.",
            "<b>4. Gerar e Compartilhar PDF:</b> Clique em 'Gerar Documento (PDF)'. O sistema exibirá o documento formatado na tela com botões para baixar em PDF, imprimir ou disparar o PDF via WhatsApp."
        ],
        tips: [
            "💡 <b>Conversão Instantânea de Orçamento em Pedido:</b> Todos os orçamentos emitidos ficam salvos na aba. Quando o cliente aprovar o orçamento, basta clicar em 'Converter em Pedido' para gerar a entrega sem re-digitar nada!"
        ]
    },

    "pedidos": {
        title: "Central de Pedidos Pendentes & Programação",
        badge: "📦 ❓ Como Gerenciar Pedidos Pendentes",
        icon: "📦",
        summary: "Fila de recepção e triagem de pedidos originados via WhatsApp, catálogo web ou chamados da equipe de vendas.",
        description: "Centraliza todas as solicitações de compra de gelo que entram no sistema e aguardam separação de estoque ou inclusão no roteiro dos motoristas. Permite revisar pedidos recebidos, ajustar quantidades conforme a disponibilidade dos congeladores, aprovar solicitações e despachar a ordem de carregamento diretamente para os caminhões de rota.",
        steps: [
            "<b>1. Monitorar Pedidos Recebidos:</b> Acompanhe a lista de pedidos organizados por ordem cronológica e nível de urgência.",
            "<b>2. Conferir e Editar Detalhes:</b> Clique sobre um pedido pendente para conferir o endereço de entrega, itens solicitados, forma de pagamento e observações do cliente.",
            "<b>3. Aprovar e Enviar para Rota:</b> Clique no botão verde 'Aprovar Pedido' para confirmar a solicitação. O pedido será transferido automaticamente para a aba de 'Acerto de Carga & Viagem'."
        ],
        tips: [
            "💡 <b>Notificação Automática ao Cliente:</b> Ao clicar em 'Aprovar Pedido', o sistema pode disparar um aviso automático no WhatsApp do cliente informando que o pedido entrou na fila de entrega do motorista."
        ]
    },

    "historico": {
        title: "Histórico Geral de Entregas & Auditoria de Rotas",
        badge: "🚚 ❓ Entenda o Histórico de Entregas",
        icon: "🚚",
        summary: "Arquivo histórico e auditável de todas as notas, entregas concluídas, comprovantes e fechamentos efetuados no sistema.",
        description: "Módulo de consulta retroativa para conciliação financeira e conferência de entregas passadas. Permite pesquisar qualquer entrega efetuada pela fábrica por período, motorista, cliente, número do pedido ou status financeiro (pago em dinheiro, PIX, cartão ou lançado no carnê de fiados).",
        steps: [
            "<b>1. Definir Período de Busca:</b> Selecione o intervalo no filtro de datas (Hoje, Esta Semana, Este Mês ou Seleção Personalizada).",
            "<b>2. Filtrar por Motorista ou Cliente:</b> Utilize os menus suspensos para isolar as entregas efetuadas por um motorista específico ou para um determinado cliente.",
            "<b>3. Visualizar Ficha da Entrega:</b> Clique na linha da entrega para abrir o detalhamento: horário exato de conclusão, foto do comprovante assinado e forma de pagamento utilizada.",
            "<b>4. Re-emitir Comprovante:</b> Se o cliente solicitar a segunda via de um comprovante passado, clique no botão 'Enviar 2ª Via WhatsApp'."
        ],
        tips: [
            "💡 <b>Exportação de Dados:</b> Você pode exportar o histórico filtrado para relatórios em planilha Excel ou PDF para entregar ao departamento de contabilidade."
        ]
    },

    // -------------------------------------------------------------
    // SUB-ABAS DO PAINEL ADMINISTRATIVO (CONFIGURAÇÕES & PREÇOS)
    // -------------------------------------------------------------
    "precos": {
        title: "Tabela Mestra de Preços & Descontos por Volume",
        badge: "🏷️ ❓ Configurar Tabela Mestra de Preços",
        icon: "🏷️",
        summary: "Definição dos preços base da fábrica para sacos de gelo em cubo 5kg, moído 5kg, 20kg e promoções de atacado.",
        description: "Esta sub-aba gerencia a tabela geral de preços praticada pela Gelo do Vale no balcão e nas entregas padrão. Você define os preços de venda no varejo e atacado para cada produto do catálogo (Gelo Cubo 5kg, Gelo Moído 5kg, Gelo Barra 20kg, Tinas, etc.), margens de lucro esperadas e regras de desconto progressivo por quantidade de fardos comprados.",
        steps: [
            "<b>1. Localizar o Produto:</b> Encontre o item desejado na lista da Tabela Mestra de Preços.",
            "<b>2. Ajustar Preço Base:</b> Digite o novo preço de venda unitário no campo correspondente (ex: R$ 12,00 por fardo de 5kg).",
            "<b>3. Configurar Faixas de Desconto:</b> Defina preços reduzidos para compras em lote (ex: acima de 50 fardos = R$ 10,50 / acima de 100 fardos = R$ 9,50).",
            "<b>4. Salvar Tabela:</b> Clique no botão verde 'Salvar Alterações de Preço' para atualizar a tabela em todo o sistema (PDV Balcão e Pedidos de Rota)."
        ],
        tips: [
            "⚠️ <b>Impacto Imediato:</b> A alteração na Tabela Mestra atualiza instantaneamente o PDV Balcão para todas as novas vendas. Clientes que possuem 'Preço Especial Personalizado' manterão a sua tabela própria."
        ]
    },

    "viagem": {
        title: "Acerto de Viagem, Fechamento de Carga & Prestação de Contas",
        badge: "📋 ❓ Como Fazer Acerto de Carga",
        icon: "📋",
        summary: "Auditoria diária de acerto de contas do caminhão: conferência de fardos carregados, devolvidos, despesas e valor em dinheiro entregue na tesouraria.",
        description: "Ferramenta essencial para o encerramento do dia de trabalho dos motoristas e entregadores. O acerto de viagem faz o cruzamento exato entre a carga de gelo que saiu do galpão no início do turno, o volume total de entregas confirmadas no aplicativo pelo entregador, os fardos não vendidos que retornaram no baú do caminhão e o dinheiro vivo/comprovantes PIX recolhidos na rota. O sistema calcula automaticamente se houve sobra, furo de carga (perda ou desvio de fardos), custo com combustível/pedágios e a comissão a ser paga ao motorista.",
        steps: [
            "<b>1. Selecionar a Rota / Motorista:</b> Escolha o nome do entregador e a data da viagem que será prestada conta.",
            "<b>2. Informar a Carga Inicial e Retorno:</b> Insira o total de fardos carregados no caminhão na saída da fábrica (ex: 300 fardos) e o total de fardos que sobraram no baú na volta (ex: 20 fardos).",
            "<b>3. Conferir Vendas do Sistema:</b> O aplicativo soma automaticamente os fardos faturados nas entregas concluídas pelo aplicativo (ex: 280 fardos).",
            "<b>4. Lançar Valores em Dinheiro Vivo:</b> Digite o montante de dinheiro em cédulas entregue pelo motorista na tesouraria da fábrica.",
            "<b>5. Registrar Despesas da Rota:</b> Insira gastos comprovados com notas fiscais de combustível, pedágios ou alimentação do ajudante.",
            "<b>6. Finalizar Acerto:</b> O painel exibirá o resultado em verde (Acerto Perfeito sem Divergência) ou em amarelo/vermelho se houver diferença de dinheiro ou faltar sacos de gelo."
        ],
        tips: [
            "💡 <b>Cálculo de Desperdício / Derretimento:</b> Em dias de calor extremo, é possível registrar uma margem técnica de perda por derretimento no baú para não penalizar o motorista indevidamente.",
            "⚠️ <b>Furo de Carga:</b> Se o saldo final indicar diferença de fardos não justificadas, o sistema permite lançar o valor correspondente como débito na folha do entregador."
        ]
    },

    "insumos": {
        title: "Estoque de Insumos & Matéria-Prima da Fábrica",
        badge: "🏭 ❓ Como Controlar Insumos da Fábrica",
        icon: "🏭",
        summary: "Gestão do estoque de embalagens plásticas (sacos 2kg, 5kg, 20kg), fechos metálicos, bobinas e insumos para gelo saborizado.",
        description: "Este módulo controla todo o inventário de materiais necessários para empacotar e produzir o gelo na fábrica. Você acompanha o saldo em estoque de bobinas plásticas, sacos impressos de 2kg, 5kg e 20kg, fechos/arames de selagem e essências para gelo saborizado (coco, limão, maracujá). Ao lançar os custos de aquisição dessas embalagens, o sistema calcula o custo exato de produção de cada fardo para exibir sua margem de lucro real.",
        steps: [
            "<b>1. Verificar Saldos Atuais:</b> Acompanhe a quantidade disponível de cada insumo no almoxarifado da fábrica.",
            "<b>2. Dar Entrada de Compra de Insumos:</b> Ao receber um lote de sacos plásticos do fornecedor, clique em 'Dar Entrada de Insumos', digite a quantidade recebida e o valor pago na nota fiscal.",
            "<b>3. Ajustar Estoque Mínimo de Alerta:</b> Configure a quantidade limite de segurança (ex: aviso quando restarem menos de 2.000 sacos de 5kg) para o sistema alertar a necessidade de nova compra."
        ],
        tips: [
            "💡 <b>Cálculo da Margem de Lucro Real:</b> Mantenha o custo unitário dos sacos sempre atualizado para que o Dashboard calcule a rentabilidade exata por fardo produzido!"
        ]
    },

    "rentabilidade": {
        title: "Análise de Rentabilidade de Freezers & ROI por Cliente",
        badge: "📈 ❓ Como Analisar o ROI dos Freezers",
        icon: "📈",
        summary: "Relatório de inteligência comercial que analisa a taxa de giro e o retorno sobre o investimento de cada freezer alocado em clientes.",
        description: "Módulo estratégico para avaliar se a alocação de um freezer em determinado ponto comercial é vantajosa para a fábrica. O relatório cruza o custo de aquisição e amortização do equipamento (freezer conservador) com o volume mensal de fardos comprados pelo cliente. Locais com alto giro garantem rápida recuperação do investimento (ROI elevado), enquanto pontos fracos consomem energia e patrimônio sem dar o retorno esperado.",
        steps: [
            "<b>1. Analisar a Tabela de Giro por Cliente:</b> Consulte a lista de parceiros comerciais que possuem freezers de propriedade da fábrica.",
            "<b>2. Verificar o Volume Mensal Vendido:</b> Acompanhe a média de fardos consumidos por mês por cada equipamento.",
            "<b>3. Identificar Equipamentos Sob-aproveitados:</b> Filtre clientes marcados com o indicador vermelho de 'Baixo Desempenho' (giro inferior à meta de viabilidade de 30 fardos/mês).",
            "<b>4. Tomar Ação Comercial:</b> Decida entre realizar um trabalho de incentivo de vendas no cliente ou solicitar a recolocação do freezer para um estabelecimento com maior potencial de vendas."
        ],
        tips: [
            "💡 <b>Remanejamento Inteligente:</b> Retirar um freezer ocioso de um bar pequeno e instalá-lo em um posto de combustível de grande movimento pode aumentar o faturamento do equipamento em até 300%!"
        ]
    },

    "contas_receber": {
        title: "Contas a Receber, Fiados & Cobrança Automática WhatsApp",
        badge: "💳 ❓ Como Gerenciar Contas a Receber",
        icon: "💳",
        summary: "Gestão financeira de duplicatas a receber, parcelas do carnê de fiados, baixa de notas e cobrança facilitada por PIX no WhatsApp.",
        description: "Painel de controle financeiro para acompanhamento e liquidação de todas as vendas realizadas a prazo ou com pagamento pendente. Permite filtrar títulos vencidos ou a vencer, dar baixa total ou parcial de recebimentos em Dinheiro, PIX ou Cartão, gerar a chave PIX Copia e Cola para pagamento imediato e disparar mensagens de cobrança amigáveis e formatadas diretamente no WhatsApp do cliente.",
        steps: [
            "<b>1. Filtrar Títulos por Status:</b> Alterne entre as abas 'Todas as Contas', 'Vencidas (Inadimplentes)', 'A Vencer' e 'Quitadas'.",
            "<b>2. Localizar o Débito do Cliente:</b> Digite o nome do cliente na caixa de busca para visualizar todas as parcelas em aberto e o valor total acumulado.",
            "<b>3. Registrar Recebimento / Dar Baixa:</b> Clique no botão verde 'Receber' na linha do título. Escolha a forma de pagamento recebida (Dinheiro, PIX ou Cartão), digite o valor pago e confirme a quitação.",
            "<b>4. Enviar Lembrete de Cobrança no WhatsApp:</b> Clique no botão azul 'Cobrar via WhatsApp'. O sistema abrirá a mensagem preenchida com a discriminação das notas vencidas, o valor total e a chave PIX da fábrica pronta para ser copiada pelo cliente."
        ],
        tips: [
            "💡 <b>Cobrança Facilitada por PIX:</b> A mensagem de WhatsApp gerada inclui automaticamente a chave PIX oficial da fábrica, permitindo que o cliente Quite a dívida em segundos sem precisar ir até a fábrica.",
            "⚠️ <b>Baixa Parcial de Pagamento:</b> Se o cliente pagar apenas uma parte da dívida, digite o valor parcial no campo de baixa. O sistema abaterá a quantia e manterá o saldo restante pendente no carnê."
        ]
    },

    "integracoes": {
        title: "Integração de Pagamentos (PIX) & Gateway de Comunicação (WhatsApp API)",
        badge: "⚙️ ❓ Como Configurar PIX e WhatsApp",
        icon: "⚙️",
        summary: "Configuração dos dados bancários da chave PIX oficial e integração com servidores de API para envio automático de comprovantes via WhatsApp.",
        description: "Central de conexão técnica do aplicativo com serviços externos de pagamento e mensagens. Nesta tela você cadastra a Chave PIX oficial da Gelo do Vale (CNPJ, Celular, E-mail ou Chave Aleatória) exibida nos comprovantes e QR Codes do balcão. Além disso, permite conectar a conta da fábrica a provedores de API do WhatsApp (como Z-API, Evolution API ou Webhooks) para que o aplicativo consiga enviar comprovantes de venda e lembretes de cobrança em segundo plano sem depender da abertura manual do WhatsApp Web.",
        steps: [
            "<b>1. Configurar Chave PIX Principal:</b> Escolha o tipo de chave (CNPJ, Telefone, E-mail ou EVP), digite o código da chave e clique em 'Salvar Chave PIX'.",
            "<b>2. Selecionar Provedor de WhatsApp API:</b> Escolha o gateway utilizado pela fábrica no menu (Z-API, Evolution API, Webhook Próprio ou Modo Manual via Navegador).",
            "<b>3. Inserir Instância e Token de Acesso:</b> Cole o Token da API e o ID da instância fornecidos pelo seu provedor de WhatsApp.",
            "<b>4. Testar Conexão:</b> Clique no botão 'Enviar Mensagem de Teste' para receber uma confirmação no seu número de celular de que a integração está ativa e operacional."
        ],
        tips: [
            "💡 <b>Chave PIX Correta:</b> Certifique-se de digitar a Chave PIX sem espaços ou caracteres inválidos para evitar rejeição no momento do cliente realizar a transferência bancária."
        ]
    },

    "whatsapp_central": {
        title: "Central de Modelos de Mensagem (Templates para WhatsApp)",
        badge: "💬 ❓ Como Usar os Templates de Mensagem",
        icon: "💬",
        summary: "Editor e personalizador de textos pré-formatados para envio de recibos, avisos de cobrança, confirmação de pedido e felicitações.",
        description: "Permite criar, editar e personalizar os textos de todas as mensagens automáticas disparadas pela Gelo do Vale para os clientes via WhatsApp. É possível utilizar 'Variáveis Dinâmicas' entre chaves — como `{nome}`, `{valor}`, `{data}`, `{itens}` e `{chave_pix}` — que são substituídas automaticamente pelo sistema com os dados reais do cliente no momento do envio.",
        steps: [
            "<b>1. Selecionar o Tipo de Template:</b> Escolha o modelo que deseja editar no menu superior (ex: 'Comprovante de Venda Balcão', 'Lembrete de Cobrança de Fiado', 'Aviso de Saída do Motorista').",
            "<b>2. Editar o Texto da Mensagem:</b> Escreva a mensagem utilizando formatações do WhatsApp (asteriscos para *negrito*, underline para _itálico_) e insira as variáveis necessárias.",
            "<b>3. Visualizar a Pré-Visualização:</b> Observe o quadro de pré-visualização ao lado para ver como a mensagem será exibida na tela do cliente.",
            "<b>4. Salvar Alterações:</b> Clique no botão verde 'Salvar Template' para atualizar o modelo de texto."
        ],
        tips: [
            "💡 <b>Exemplo de Uso de Variáveis:</b> Um texto como `Olá {nome}, seu pedido no valor de R$ {valor} saiu para entrega!` será enviado para o cliente João como `Olá João, seu pedido no valor de R$ 150,00 saiu para entrega!`."
        ]
    },

    "seguranca": {
        title: "Segurança, Backup dos Dados & Controle de Versão",
        badge: "🛡️ ❓ Entenda Backup e Versão",
        icon: "🛡️",
        summary: "Gerenciamento de cópias de segurança (backups em arquivo JSON e OneDrive), restauração do banco de dados e controle de versão.",
        description: "Central de proteção dos dados operacionais da fábrica. O GelControl opera com um modelo de alta redundância de dados: salva as informações instantaneamente no armazenamento do navegador (LocalStorage/IndexedDB), mantém cópia sincronizada no arquivo do OneDrive no computador e realiza sincronização em tempo real na nuvem (Firebase). Nesta tela você pode fazer downloads de backups manuais em arquivo `.json`, restaurar dados antigos ou atualizar a versão do banco de dados em caso de manutenção do sistema.",
        steps: [
            "<b>1. Verificar Status do OneDrive:</b> Observe o indicador no topo para confirmar que o salvamento no arquivo do OneDrive está ativo.",
            "<b>2. Fazer Backup Manual (Download JSON):</b> Clique no botão 'Fazer Download do Backup (JSON)' para salvar um arquivo de segurança no seu computador ou pendrive.",
            "<b>3. Restaurar um Backup Antigo:</b> Em caso de troca de computador, clique em 'Restaurar Arquivo de Backup', selecione o arquivo `.json` salvo anteriormente e confirme a restauração dos dados.",
            "<b>4. Ajustar Versão do Banco:</b> Caso seja necessário liberar compatibilidade com versões antigas ou ajustar permissões, altere o número da versão e clique em 'Salvar Configurações'."
        ],
        tips: [
            "🛡️ <b>Segurança Máxima:</b> Recomenda-se realizar o download do arquivo de backup em JSON no último dia de cada mês e armazená-lo em um pendrive ou e-mail de segurança."
        ]
    },

    "usuarios": {
        title: "Gestão de Usuários, Senhas & Controle de Acessos",
        badge: "🔑 ❓ Como Gerenciar Permissões de Usuários",
        icon: "🔑",
        summary: "Cadastro da equipe de funcionários, perfis de acesso (Administrador, Operador de Balcão, Entregador) e criptografia de senhas.",
        description: "Controle de segurança e permissões de acesso dos colaboradores que utilizam o GelControl. Permite cadastrar logins e senhas individuais para cada funcionário (atendentes de balcão, gerentes, caixa e motoristas) e definir exatamente a quais abas e relatórios cada um terá acesso. As senhas de usuário são protegidas com criptografia hash SHA-256 para impedir vazamentos.",
        steps: [
            "<b>1. Visualizar Usuários Cadastrados:</b> Acompanhe a lista de colaboradores que possuem acesso ao sistema.",
            "<b>2. Cadastrar Novo Usuário:</b> Clique no botão 'Novo Usuário', digite o Nome Completo, Login de Acesso (ex: `atendente.marcos`) e defina uma senha inicial.",
            "<b>3. Configurar Grade de Permissões:</b> Marque as caixas de seleção correspondentes às abas que o funcionário pode acessar (ex: para um atendente de balcão, marque apenas 'PDV Balcão' e desmarque relatórios financeiros e configurações).",
            "<b>4. Salvar Perfil:</b> Clique em 'Salvar Usuário' para ativar o novo login."
        ],
        tips: [
            "🔒 <b>Proteção de Dados Financeiros:</b> Restringir os acessos dos colaboradores garante que apenas a diretoria e os gerentes consigam visualizar as margens de lucro e faturamento total da fábrica.",
            "🔑 <b>Alteração de Senha:</b> Para alterar a senha de um colaborador existente, abra a edição do perfil dele, digite a nova senha e salve. Se não quiser alterar a senha, mantenha o campo em branco."
        ]
    },

    "ajuda": {
        title: "Central de Suporte, Diagnóstico & Teste de Impressora",
        badge: "❓ ❓ Manual de Ajuda & Auto-Diagnóstico",
        icon: "❓",
        summary: "Manual de instruções do sistema, auto-teste de integridade dos dados, utilitários de diagnóstico de rede e teste de impressão térmica.",
        description: "Central de auto-atendimento e suporte técnico do sistema GelControl. Reúne tutoriais completos em texto e vídeo para treinamento de novos funcionários, módulo de teste automático para checagem da conexão com a internet e com a nuvem, além de ferramenta para testar a comunicação com impressoras térmicas de cupom (80mm/58mm).",
        steps: [
            "<b>1. Executar Auto-Diagnóstico de Integridade:</b> Clique no botão 'Rodar Auto-Diagnóstico' para que o aplicativo verifique 13 pontos cruciais do sistema (banco de dados, arquivos de layout, sincronização e armazenamento).",
            "<b>2. Testar Impressora Térmica:</b> Clique no botão 'Imprimir Cupom de Teste' para enviar um comprovante de demonstração para a impressora configurada no balcão.",
            "<b>3. Consultar Perguntas Frequentes (FAQ):</b> Clique nas categorias do FAQ para tirar dúvidas sobre fechamento de caixa, cancelamento de vendas e emissão de recibos."
        ],
        tips: [
            "💡 <b>Solução Rápida para Problemas:</b> Em caso de comportamento inesperado no aplicativo, utilize o botão 'Limpar Cache e Forçar Recarga' para recarregar o sistema com a versão mais recente sem perder nenhum dado salvo."
        ]
    },

    // -------------------------------------------------------------
    // AJUDA ESPECÍFICA PARA JANELAS INTERNAS & MODAIS
    // -------------------------------------------------------------
    "modal_client": {
        title: "Janela: Cadastro & Edição de Cliente",
        icon: "👥",
        summary: "Guia completo para preencher cadastros, editar dados, limite de crédito e congelador do cliente.",
        description: "Esta janela permite registrar um novo parceiro comercial da Gelo do Vale ou editar os dados existentes (endereço, contatos, CNPJ, limite de crédito pré-aprovado e tamanho do freezer).",
        steps: [
            "<b>Como Cadastrar / Alterar Nome e CNPJ:</b> Digite a Razão Social ou Nome Fantasia no campo principal e insira o CNPJ/CPF.",
            "<b>Como Configurar Telefone / WhatsApp:</b> Digite o número com DDD no formato de 11 dígitos. Esse número é usado para envio direto de comprovantes e boletos.",
            "<b>Como Definir Limite de Crédito:</b> Insira o valor limite em 'Limite de Crédito' (ex: R$ 2.000,00). O sistema usará este teto para autorizar vendas a prazo no carnê de fiados.",
            "<b>Como Informar o Freezer Instalado:</b> Selecione a capacidade em fardos do conservador em comodato instalado no estabelecimento.",
            "<b>Como Salvar:</b> Clique no botão verde 'Salvar Cliente' no rodapé."
        ],
        tips: [
            "💡 Se o cliente tiver uma tabela de preços diferenciada, você poderá configurá-la após salvar o cadastro clicando em 'Preços Especiais'."
        ]
    },

    "modal_order": {
        title: "Janela: Novo Pedido de Rota",
        icon: "📦",
        summary: "Guia para agendar pedidos de fardos de gelo para a rota dos motoristas.",
        description: "Esta janela permite abrir uma ordem de pedido com data de entrega agendada para os caminhões da fábrica.",
        steps: [
            "<b>Como Selecionar o Cliente:</b> Escolha o cliente na lista suspensa.",
            "<b>Como Selecionar Produtos e Quantidades:</b> Digite a quantidade de fardos de Gelo Cubo 5kg, Moído 5kg ou 20kg desejados.",
            "<b>Como Definir a Data de Entrega:</b> Selecione o dia em que a carga deve ser entregue.",
            "<b>Como Configurar Observações:</b> Digite instruções para o motorista (ex: 'Entregar antes das 10h').",
            "<b>Como Salvar:</b> Clique em 'Salvar Pedido' para encaminhá-lo para aprovação."
        ],
        tips: [
            "⚠️ Pedidos com clientes inadimplentes exibirão um aviso na tela antes de permitir o salvamento."
        ]
    },

    "modal_sales": {
        title: "Janela: Finalizar Venda no Balcão (Checkout PDV)",
        icon: "🛒",
        summary: "Guia para concluir a venda, calcular troco em dinheiro, gerar QR Code PIX e emitir comprovante.",
        description: "Janela de recebimento e fechamento rápido no balcão da fábrica.",
        steps: [
            "<b>Como Escolher a Forma de Pagamento:</b> Clique nos botões Dinheiro, PIX, Cartão ou A Prazo.",
            "<b>Como Calcular Troco:</b> Se o cliente pagar em Dinheiro, digite a nota entregue (ex: R$ 100,00) para o sistema calcular o troco.",
            "<b>Como Usar o PIX:</b> Ao escolher PIX, a tela exibe o QR Code e a chave copia e cola para o cliente escanear no celular.",
            "<b>Como Concluir:</b> Clique em 'Concluir Venda Balcão' para dar baixa no estoque e emitir o cupom térmico."
        ],
        tips: [
            "🖨️ A impressora 80mm imprime o cupom automaticamente se estiver conectada."
        ]
    },

    "modal_freezer": {
        title: "Janela: Cadastro & Edição de Freezer",
        icon: "🧊",
        summary: "Guia para registrar placas de tombamento, número de série, marca e capacidade do conservador.",
        description: "Janela de controle patrimonial para incluir ou alterar dados de um freezer conservador de gelo.",
        steps: [
            "<b>Como Informar o Tombamento:</b> Digite o código da etiqueta de patrimônio da fábrica (ex: `FRZ-0089`).",
            "<b>Como Cadastrar Marca e Série:</b> Insira a marca (Metalfrio, Gelopar, Fricon) e o número de série da nota fiscal.",
            "<b>Como Definir Capacidade:</b> Digite a capacidade total de fardos que cabem no freezer (ex: 200 fardos).",
            "<b>Como Configurar a Localização:</b> Marque se o equipamento está 'Disponível na Fábrica' ou 'Alocado em Cliente'.",
            "<b>Como Salvar:</b> Clique no botão 'Salvar Equipamento'."
        ],
        tips: [
            "💡 Etiquetas de tombamento corretas evitam extravios de equipamentos em trocas de clientes."
        ]
    },

    "modal_freezer_detail": {
        title: "Janela: Ficha Detalhada do Conservador",
        icon: "🧊",
        summary: "Visão geral do equipamento: cliente atual, manutenções técnicas e botão de transferência.",
        description: "Exibe a ficha completa de um freezer da fábrica.",
        steps: [
            "<b>Como Ver Histórico:</b> Acompanhe quando o freezer foi instalado e quantos fardos o cliente comprou no último mês.",
            "<b>Como Registrar Manutenção:</b> Clique em 'Lançar Manutenção' para anotar trocas de gás, borrachas ou motor.",
            "<b>Como Transferir o Freezer:</b> Clique em 'Transferir de Cliente' para recolocar o freezer em outro ponto comercial."
        ],
        tips: [
            "⚠️ Mantenha os registros de manutenção atualizados para controle de custos operacionais."
        ]
    },

    "modal_rental": {
        title: "Janela: Contrato de Aluguel de Tinas & Mobiliário",
        icon: "🏕️",
        summary: "Guia para locação de tinas 360L, caixas térmicas, cálculo de diárias e retenção de caução.",
        description: "Janela de abertura e edição de contratos temporários de locação para festas e eventos.",
        steps: [
            "<b>Como Preencher o Locatário:</b> Digite o Nome Completo, CPF e Telefone do responsável.",
            "<b>Como Selecionar Itens:</b> Indique a quantidade de tinas térmicas (ex: 2 Tinas Azuis 360L) e jogos de mesas.",
            "<b>Como Configurar Período e Caução:</b> Defina a data de saída, data limite de devolução e o valor retido como garantia.",
            "<b>Como Salvar:</b> Clique no botão 'Gerar Contrato de Aluguel'."
        ],
        tips: [
            "⚠️ Sempre inspecione o estado físico da tina antes de liberar a caução no momento do retorno."
        ]
    },

    "modal_document": {
        title: "Janela: Emissão de Recibos & Orçamentos (PDF)",
        icon: "📜",
        summary: "Guia para confeccionar documentos timbrados oficiais em PDF para clientes e empresas.",
        description: "Janela de geração de comprovantes formais e orçamentos comerciais em PDF.",
        steps: [
            "<b>Como Escolher o Documento:</b> Selecione entre 'Recibo de Pagamento', 'Orçamento Comercial' ou 'Comprovante de Entrega'.",
            "<b>Como Discriminar Itens:</b> Digite as descrições dos produtos, quantidades de fardos e valores unitários.",
            "<b>Como Gerar e Enviar:</b> Clique em 'Gerar Documento (PDF)' para visualizar na tela, baixar ou enviar no WhatsApp do cliente."
        ],
        tips: [
            "💡 Orçamentos gerados podem ser convertidos em pedido real a qualquer momento."
        ]
    },

    "modal_client_prices": {
        title: "Janela: Tabela de Preços Especiais do Cliente",
        icon: "🏷️",
        summary: "Guia para fixar valores diferenciados por fardo para clientes VIP ou grandes distribuidores.",
        description: "Janela de desconto personalizado por cliente.",
        steps: [
            "<b>Como Alterar Preço por Produto:</b> Digite o valor especial combinado para o Gelo Cubo 5kg, Moído 5kg ou 20kg.",
            "<b>Como Salvar:</b> Clique em 'Salvar Tabela do Cliente'."
        ],
        tips: [
            "⚠️ Preços cadastrados aqui se sobrepõem à tabela mestra da fábrica apenas para este cliente."
        ]
    },

    "modal_receive_payment": {
        title: "Janela: Baixa de Pagamento & Liquidação de Carnê",
        icon: "💳",
        summary: "Guia para dar baixa em notas fiadas recebidas em Dinheiro, PIX ou Cartão.",
        description: "Janela de liquidação financeira de débitos pendentes.",
        steps: [
            "<b>Como Informar o Valor Pago:</b> Digite a quantia entregue pelo cliente (aceita quitação total ou parcial).",
            "<b>Como Escolher a Forma de Pagamento:</b> Marque Dinheiro, PIX ou Cartão.",
            "<b>Como Confirmar a Baixa:</b> Clique no botão verde 'Confirmar Recebimento'."
        ],
        tips: [
            "💡 Em baixas parciais, o saldo restante permanece pendente no carnê do cliente."
        ]
    },

    "modal_user_form": {
        title: "Janela: Cadastro de Usuário & Grade de Permissões",
        icon: "🔑",
        summary: "Guia para criar logins da equipe, senhas salvas com hash SHA-256 e limitar acesso a abas.",
        description: "Janela de segurança e controle de acessos.",
        steps: [
            "<b>Como Definir Login e Senha:</b> Insira o nome do funcionário, nome de usuário e defina a senha.",
            "<b>Como Marcar Permissões:</b> Marque quais telas da sidebar o colaborador pode visualizar (ex: liberando apenas 'PDV Balcão' para o atendente).",
            "<b>Como Salvar:</b> Clique em 'Salvar Usuário'."
        ],
        tips: [
            "🔒 Restringir acessos protege os relatórios financeiros da fábrica contra visualizações não autorizadas."
        ]
    },

    "modal_packaging_entry": {
        title: "Janela: Entrada de Insumos & Sacos Plásticos",
        icon: "🏭",
        summary: "Guia para lançar compras de sacos de 2kg, 5kg e 20kg e atualizar custo de produção.",
        description: "Janela de abastecimento do estoque de embalagens da fábrica.",
        steps: [
            "<b>Como Informar Quantidades:</b> Digite o número de sacos plásticos ou bobinas recebidos da fábrica de embalagens.",
            "<b>Como Lançar Custo:</b> Digite o valor total da nota fiscal de compra.",
            "<b>Como Salvar:</b> Clique em 'Registrar Entrada de Insumo'."
        ],
        tips: [
            "💡 O custo da embalagem é usado pelo sistema no cálculo do lucro líquido por fardo."
        ]
    },

    "modal_carne": {
        title: "Janela: Extrato do Carnê Digital de Fiados",
        icon: "💳",
        summary: "Guia para consultar parcelas em aberto, débitos vencidos e disparar cobrança PIX no WhatsApp.",
        description: "Janela de extrato financeiro detalhado do cliente.",
        steps: [
            "<b>Como Conferir Débitos:</b> Acompanhe a lista de notas com datas de vencimento e valores.",
            "<b>Como Disparar Cobrança:</b> Clique no botão 'Cobrar via WhatsApp' para enviar o extrato formatado com a chave PIX da fábrica."
        ],
        tips: [
            "🔴 Notas vencidas há mais de 5 dias bloqueiam automaticamente novos pedidos a prazo."
        ]
    },

    "modal_caixa_diario": {
        title: "Janela: Fechamento de Caixa Diário",
        icon: "💵",
        summary: "Guia para conferir o saldo inicial, vendas do dia em dinheiro/PIX e encerrar o caixa.",
        description: "Janela de encerramento diário do caixa do balcão.",
        steps: [
            "<b>Como Conferir Lançamentos:</b> Verifique o valor total registrado pelo sistema em Dinheiro e PIX.",
            "<b>Como Digitar Valor Físico:</b> Insira a quantia em notas contadas na gaveta do caixa.",
            "<b>Como Fechar:</b> Clique em 'Confirmar Fechamento do Caixa'."
        ],
        tips: [
            "⚠️ Divergências entre a gaveta e o sistema são indicadas no relatório de fechamento."
        ]
    },

    "modal_weather_forecast": {
        title: "Janela: Previsão do Tempo & Meteorologia",
        icon: "🌤️",
        summary: "Guia para analisar a temperatura semanal e planejar o estoque de gelo.",
        description: "Janela de dados climáticos consultados via Open-Meteo.",
        steps: [
            "<b>Como Interpretar as Temperaturas:</b> Acompanhe as máximas previstas para o final de semana.",
            "<b>Como Planejar o Estoque:</b> Dias ensolarados acima de 28°C exigem estoques reforçados nos congeladores."
        ],
        tips: [
            "💡 80% do volume de gelo é consumido em dias quentes e finais de semana ensolarados."
        ]
    },

    "modal_pwa": {
        title: "Janela: Instalação do App no Celular (Modo PWA)",
        icon: "📱",
        summary: "Guia para instalar o GelControl como aplicativo nativo no Android, iOS ou Windows.",
        description: "Instruções de instalação para uso offline no celular ou tablet.",
        steps: [
            "<b>No Android (Google Chrome):</b> Abra o menu de 3 pontos do navegador e selecione 'Instalar Aplicativo'.",
            "<b>No iPhone / iPad (Safari):</b> Toque no botão 'Compartilhar' no rodapé e escolha 'Adicionar à Tela de Início'.",
            "<b>No Computador (Chrome/Edge):</b> Clique no ícone de computador na barra de endereço superior e selecione 'Instalar'."
        ],
        tips: [
            "📱 O aplicativo instalado funciona 100% offline no galpão sem depender de conexão contínua."
        ]
    }
};
