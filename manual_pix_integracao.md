# ❄️ Manual de Integração PIX - Gelo do Vale

Este manual tem como objetivo orientar você no passo a passo para configurar e utilizar os dois modos de recebimento via PIX no seu sistema **GelControl**: o **PIX Automático (Mercado Pago)** e o **PIX Manual (Chave Estática)**.

---

## 🎯 Sumário
1. [Comparativo: PIX Automático vs. PIX Manual](#1-comparativo-pix-automático-vs-pix-manual)
2. [Passo a Passo: Configurando o PIX Automático (Mercado Pago)](#2-passo-a-passo-configurando-o-pix-automático-mercado-pago)
3. [Passo a Passo: Configurando o PIX Manual (Chave Estática)](#3-passo-a-passo-configurando-o-pix-manual-chave-estática)
4. [Como Funciona o PIX Dentro do GelControl](#4-como-funciona-o-pix-dentro-do-gelcontrol)
5. [⚠️ Dicas de Segurança e Boas Práticas](#5-dicas-de-segurança-e-boas-práticas)

---

## 1. Comparativo: PIX Automático vs. PIX Manual

| Recurso | PIX Automático (Mercado Pago) | PIX Manual (Chave Estática) |
| :--- | :--- | :--- |
| **Tipo de QR Code** | Dinâmico (um valor e link exclusivo por venda) | Estático (chave fixa com o valor da venda embutido) |
| **Geração** | Online (necessita de conexão com a internet) | Offline/Local (funciona mesmo sem internet após configurado) |
| **Confirmador** | O cliente pode pagar e o link é gerado via API | O operador mostra o QR Code e confere o recebimento manualmente |
| **Ideal para** | Envios de cobrança à distância via WhatsApp | Vendas presenciais rápidas e entregas locais rápidas |

---

## 2. Passo a Passo: Configurando o PIX Automático (Mercado Pago)

A integração com o **Mercado Pago** permite gerar links de pagamento dinâmicos e profissionais que podem ser enviados diretamente para o WhatsApp do cliente.

### Passo 1: Acessar o Painel de Desenvolvedores
1. Acesse o site oficial: [Painel de Desenvolvedores do Mercado Pago](https://www.mercadopago.com.br/developers/panel)
2. Faça login com a conta do Mercado Pago da sua empresa (preferencialmente CNPJ para constar o nome correto da sua fábrica no comprovante).

### Passo 2: Criar uma Aplicação
1. Clique em **Criar aplicação** (ou botão similar no canto superior direito).
2. Dê um nome para a aplicação (ex: `GelControl - Gelo do Vale`).
3. Em tipo de solução de pagamento, selecione **Pagamentos Online**.
4. Responda às perguntas básicas na tela e conclua a criação.

### Passo 3: Obter o Access Token de Produção
1. Com a aplicação criada, vá no menu lateral esquerdo em **Credenciais de Produção**.
2. O Mercado Pago solicitará a validação de alguns dados cadastrais simples.
3. Copie o código exibido no campo **Access Token** (ele é uma chave longa que geralmente começa com `APP_USR-`).

### Passo 4: Configurar no GelControl
1. Vá em **Configurações & Fábrica** -> **Integrações (Pix & WhatsApp)**.
2. Marque a caixinha **Ativar Integração Mercado Pago**.
3. Cole o seu Access Token no campo correspondente.
4. Clique em **Salvar Credenciais**.

---

## 3. Passo a Passo: Configurando o PIX Manual (Chave Estática)

O **PIX Manual** utiliza um gerador local baseado no padrão nacional do Banco Central (EMV/BR Code). Ele gera o QR Code e o código "Copia e Cola" instantaneamente no computador ou celular, sem depender de nenhuma API externa.

### Passo 1: Definir sua Chave PIX Principal
A chave PIX configurada deve ser de preferência a mesma que você utiliza no dia a dia da fábrica para receber dos clientes.
* Pode ser: **CNPJ**, **CPF**, **E-mail**, **Celular** ou **Chave Aleatória (EVP)**.

### Passo 2: Configurar no GelControl
1. Vá em **Configurações & Fábrica** -> **Integrações (Pix & WhatsApp)**.
2. No painel **PIX Manual (Chave Estática)**, insira a sua chave no campo de texto.
3. Clique em **Salvar Chave PIX**.
4. *(Opcional)* Você também pode alterar essa mesma chave na sub-aba **Fábrica & Aparência** no campo "Chave Pix para Cobrança". Ambas as telas se mantêm sincronizadas.

---

## 4. Como Funciona o PIX Dentro do GelControl

O sistema utiliza a inteligência híbrida de pagamentos em três cenários principais:

1. **No Fechamento de Vendas do PDV**:
   * Ao selecionar a forma de pagamento **Pix**, se a integração automática com o Mercado Pago estiver ativa, o sistema tentará gerar o link/QR Code dinâmico.
   * Se a integração automática estiver inativa ou se o sistema estiver offline, o GelControl ativa o **Fallback de Segurança** e exibe o modal do **PIX Manual local**. O operador pode exibir o QR Code na tela para o cliente escanear ou clicar em "Copiar Copia e Cola" para enviar ao cliente.

2. **No Envio de Cobranças de Documentos (Recibos / Carnê)**:
   * Ao clicar no ícone do PIX/WhatsApp ao lado de um recibo ou parcela pendente do carnê, o sistema gera o meio de pagamento preferencial e abre o WhatsApp com a mensagem formatada contendo o link de pagamento.

3. **Nas Entregas e Roteiro dos Motoristas**:
   * O motorista pode abrir o recibo de entrega direto no celular e exibir o QR Code estático local na hora para o cliente realizar o pagamento presencialmente.

---

## 5. ⚠️ Dicas de Segurança e Boas Práticas

1. **Confirmação Visual**: No PIX Manual/Estático, o GelControl **não** tem como confirmar se o dinheiro caiu na conta bancária de forma automatizada. Sempre oriente seus colaboradores e motoristas a **conferirem o extrato do banco** antes de liberarem a mercadoria.
2. **Formatação da Chave**: Certifique-se de preencher a chave PIX corretamente (sem espaços ou caracteres desnecessários) para evitar erros de leitura nos aplicativos bancários dos clientes.
3. **Contas CNPJ**: Sempre prefira chaves PIX associadas a contas PJ (CNPJ) para que a razão social da fábrica apareça de forma clara no momento da transferência, transmitindo maior segurança para o cliente.
