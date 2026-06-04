# 🔄 Instruções para Sincronizar o GelControl (Pizzaria ⇄ Casa)

Você está vendo este arquivo porque ele foi criado no computador de casa e sincronizado via **OneDrive** para a sua máquina de trabalho. 

Siga estes passos simples para garantir que o seu trabalho de hoje na pizzaria seja enviado corretamente para que você possa continuar em casa sem problemas.

---

## 📅 Passo a Passo: Amanhã na Pizzaria (após as 18:00)

### 1. Garantir que as alterações da pizzaria estão no GitHub
Como o computador de casa está conectado ao repositório oficial do GitHub, precisamos que a máquina da pizzaria envie todo o progresso dela para lá.

1. No computador da **pizzaria**, abra a pasta do projeto no **Antigravity IDE**.
2. No menu de arquivos (ou no Windows Explorer), clique duas vezes para executar o arquivo:
   👉 **`atualizar_github.bat`**
3. O script vai abrir uma tela preta e perguntar a mensagem do commit. Digite algo simples (ex: `Ajustes da pizzaria`) e dê **Enter**.
4. O script enviará tudo para o GitHub e otimizará o OneDrive automaticamente.
5. Se pedir login do GitHub, faça o login para autorizar o envio.

---

## 🏠 Passo a Passo: Quando voltar para Casa

Assim que voltar para casa, para trazer o código idêntico ao da pizzaria:

1. Abra o **Antigravity IDE** no computador de casa.
2. Abra o terminal (PowerShell) e execute o comando:
   ```bash
   git pull
   ```
3. Pronto! O computador de casa receberá todas as últimas alterações feitas na pizzaria e as duas máquinas estarão 100% alinhadas.

---

*Nota: Após alinhar os dois computadores, você pode deletar este arquivo `INSTRUCOES_SINCRONIZACAO.md` se desejar.*
