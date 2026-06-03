# ❄️ Manual de Automação e Marketing do WhatsApp - Gelo do Vale

Este manual tem como objetivo orientar você no passo a passo para configurar, utilizar e lucrar com a nova integração de WhatsApp API no seu sistema **GelControl**, além de fornecer estratégias para alavancar as vendas da sua fábrica de gelo.

---

## 🎯 Sumário
1. [Como Funciona a Automação](#1-como-funciona-a-automação)
2. [Passo a Passo: Configurando o Z-API (Recomendado/Pronto)](#2-passo-a-passo-configurando-o-z-api-recomendadopronto)
3. [Passo a Passo: Configurando a Evolution API (Baixo Custo)](#3-passo-a-passo-configurando-a-evolution-api-baixo-custo)
4. [Como a Automação Funciona Dentro de Cada Tela do GelControl](#4-como-a-automação-funciona-dentro-de-cada-tela-do-gelcontrol)
5. [Dicas de Ouro de Marketing e Divulgação no WhatsApp](#5-dicas-de-ouro-de-marketing-e-divulgação-no-whatsapp)
6. [⚠️ Regras Importantes para Evitar Bloqueios no WhatsApp](#6-regras-importantes-para-evitar-bloqueios-no-whatsapp)

---

## 1. Como Funciona a Automação

No modelo tradicional, quando você clica em enviar uma cobrança, o sistema abre uma nova aba do WhatsApp Web para que você clique em "Enviar". 
Com a **API de Envio Automático**, o GelControl conversa diretamente com o servidor da API contratada. As mensagens, os PDFs de recibos e as rotas dos motoristas são enviados em segundo plano, **de forma invisível e instantânea**, sem que você precise dar nenhum clique extra no WhatsApp Web.

Se a API estiver desativada ou sofrer alguma falha, o GelControl ativa o **Fallback de Segurança**, abrindo a janela convencional do WhatsApp Web para garantir que nenhuma mensagem deixe de ser enviada.

---

## 2. Passo a Passo: Configurando o Z-API (Recomendado/Pronto)

O **Z-API** é o provedor comercial mais popular e estável do mercado. Ele não exige conhecimentos técnicos de servidor para funcionar.

### Passo 1: Criar sua Conta
1. Acesse o site oficial: [https://www.z-api.io/](https://www.z-api.io/)
2. Cadastre-se e acesse o seu painel de controle.
3. Eles oferecem um período de testes grátis (geralmente de 3 dias). Se quiser continuar usando, os planos custam em média de R$ 49 a R$ 99 por mês.

### Passo 2: Criar e Conectar a Instância (Aparelho)
1. No painel da Z-API, clique em **Criar Instância**.
2. A tela exibirá um **QR Code** (exatamente igual ao WhatsApp Web).
3. No celular da sua fábrica de gelo, abra o WhatsApp, toque nos três pontinhos (ou engrenagem no iPhone) -> **Aparelhos Conectados** -> **Conectar um Aparelho**.
4. Aponte a câmera do celular para o QR Code da tela do computador para conectar.

### Passo 3: Pegar os Dados de Integração
Uma vez conectado, o painel da Z-API vai te mostrar duas chaves essenciais:
* **URL de Envio (Endpoint de Envio de Texto):** Será algo como `https://api.z-api.io/instances/SUA_INSTANCIA/token/SEU_TOKEN/send-text`.
* **Client-Token:** Uma sequência de letras e números que valida a segurança da sua conta.

### Passo 4: Colar no GelControl
1. Acesse o link do **GelControl** no navegador.
2. Vá em **Configurações & Fábrica** (menu esquerdo) -> **Integrações (Pix & WhatsApp)**.
3. Marque a caixinha **Ativar Envio Automático de WhatsApp**.
4. No campo **Provedor de API**, selecione **Z-API**.
5. No campo **URL da Instância**, cole a URL copiada.
6. No campo **Token / API Key**, cole o Client-Token correspondente.
7. Clique no botão **Salvar Configurações**.

Pronto! O sistema já está configurado e operando no modo automático.

---

## 3. Passo a Passo: Configurando a Evolution API (Baixo Custo)

A **Evolution API** é uma solução de código aberto (Open Source). O código do sistema é de graça, o que remove qualquer mensalidade sobre o volume de mensagens ou conexões.

### Passo 1: Aluguel do Servidor (VPS)
Para funcionar 24h, ela precisa estar instalada na nuvem.
1. Você pode alugar um servidor em nuvem barato (ex: Hetzner ou DigitalOcean) por cerca de R$ 20 a R$ 30 por mês.
2. Você instala a Evolution API usando Docker (um processo que posso fazer para você se decidir contratar o servidor no futuro).

### Passo 2: Criar Instância e Conectar o WhatsApp
1. Acesse o gerenciador visual da sua Evolution API.
2. Crie uma nova instância chamada "fabrica-gelo".
3. Leia o **QR Code** no celular da fábrica para sincronizar o WhatsApp.

### Passo 3: Colar no GelControl
No painel da Evolution, pegue as credenciais:
* **URL:** Ex: `https://seu-servidor.com/message/sendText/fabrica-gelo`
* **Apikey:** A chave de segurança que você gerou na Evolution API.
Cole no GelControl nas configurações de WhatsApp marcando o provedor como **Evolution API** e salve.

---

## 4. Como a Automação Funciona Dentro de Cada Tela do GelControl

Agora que a API está ativa, veja o que acontece em cada ação do sistema:

### 📄 Em Recibos & Orçamentos (Cupom Comercial)
* **Ação:** No histórico de documentos ou na tela de impressão do cupom, clique no botão **Enviar via WhatsApp**.
* **Como age a API:** O GelControl usa a biblioteca `html2pdf` por trás da tela, cria um arquivo em PDF completo do cupom (com layout de cupom térmico ou folha A4), transforma o PDF em código Base64 e o despacha direto para o cliente como um anexo PDF oficial no WhatsApp.

### 💰 Em Contas a Receber (Carnê/Fiado)
* **Ação:** Na listagem de cobranças pendentes do cliente ou na tabela de maiores devedores do painel, clique em **Cobrar**.
* **Como age a API:** O sistema envia uma mensagem personalizada no privado do cliente lembrando amigavelmente do vencimento, do valor exato e pedindo o contato para o acerto do débito.

### 🧊 Em Comodato de Freezers e Aluguel de Tinas
* **Ação:** Ao emitir um contrato de comodato pendente de assinatura, clique em **Enviar Link por WhatsApp**.
* **Como age a API:** O sistema envia a mensagem padrão contendo o link do **Portal do Cliente** para ele realizar a assinatura digital usando o dedo diretamente na tela do celular dele. Assim que ele assina lá, o GelControl atualiza o status do freezer para "Ativo" e salva a assinatura no banco.

### 🚚 Em logística e Roteirização de Viagens
* **Ação:** Após selecionar as entregas do dia e criar a rota inteligente, clique em **Compartilhar Rota no WhatsApp**.
* **Como age a API:** O GelControl pergunta na tela o número do motorista da viagem. Ao digitar e dar OK, o sistema monta o roteiro sequencial perfeito de paradas (com nome do cliente, endereço e ordem de entrega) e envia com o link directo do Google Maps traçado para o motorista navegar pelo GPS.

---

## 5. Dicas de Ouro de Marketing e Divulgação no WhatsApp

Com o WhatsApp automatizado, você pode impulsionar suas vendas de gelo usando estratégias simples de divulgação:

### 📢 Campanhas de Promoções Rápidas (Disparos em Lote)
Aproveite dias de calor extremo ou proximidade de feriados/fins de semana para enviar avisos:
* **Para Adegas e Bares (Clientes Recurrentes):** *"Olá [Nome do Cliente]! O fim de semana promete calor. Já abasteceu seu freezer de gelo para não deixar os clientes sem bebida gelada? Responda aqui para garantir sua entrega no primeiro lote da manhã!"*
* **Para Eventos (Clientes Finais):** *"Vai fazer festa neste final de semana? Alugue uma tina de gelo e garanta a bebida trincando por horas! Responda para receber nossa tabela de preços."*

### 🔄 Pós-Venda Automático (Feedback)
Crie o hábito de mandar uma mensagem a cada novo cliente um dia após a entrega:
* *"Olá, tudo bem? Passando para saber se a entrega do seu gelo ontem ocorreu tudo certo e se o produto atendeu às suas expectativas. Sua opinião ajuda a Gelo do Vale a melhorar sempre!"*
* **Dica:** Isso gera confiança e faz o cliente preferir comprar de você nas próximas vezes.

### 🗺️ Campanhas de Anúncios Locais direcionados ao WhatsApp
Use anúncios patrocinados no Instagram e Facebook (Meta Ads) que cobrem um raio de 5 a 10 km ao redor da sua fábrica de gelo. O botão do anúncio deve ser **"Enviar mensagem no WhatsApp"**. 
Quando o comerciante local clicar no anúncio, ele cai no seu WhatsApp pronto para fazer o primeiro pedido.

---

## 6. ⚠️ Regras Importantes para Evitar Bloqueios no WhatsApp

O WhatsApp monitora disparos em massa para evitar spam. Para proteger o número da sua fábrica de gelo e evitar que o seu chip seja banido, siga estas boas práticas:

1. **Nunca envie mensagens em massa para quem nunca falou com você:** Importar uma lista de telefones frios da internet e mandar propaganda para todos eles é a forma mais rápida de ter o chip bloqueado.
2. **Personalize as mensagens:** Use o nome do cliente. O GelControl já faz isso nos disparos de cobrança (ex: *"Olá, João!"* em vez de *"Olá, cliente"*). Textos idênticos enviados em lote acionam o alerta de spam do WhatsApp.
3. **Não abuse do volume de disparos de uma só vez:** Se for enviar promoções para 200 contatos, tente espaçar os envios (ex: mandar para 20 clientes a cada meia hora) ou use as configurações de atraso (delay) do provedor de API.
4. **Use uma conta antiga e aquecida:** Chips novos bloqueiam com extrema facilidade. Use o número que a sua fábrica já usa há meses ou anos para atendimento normal.
5. **Estimule a interação:** Termine a mensagem com uma pergunta para que o cliente responda (ex: *"Deseja que eu reserve a sua entrega de amanhã?"*). Quando o cliente responde ao seu número, o WhatsApp entende que a conversa é legítima e amigável.
