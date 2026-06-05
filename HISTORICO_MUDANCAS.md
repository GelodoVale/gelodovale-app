# 📜 Histórico de Atualizações do Sistema (GelControl)

Este arquivo é o registro oficial de todas as alterações feitas no código pelo **Antigravity**. Ele permite que o assistente faça varreduras instantâneas e saiba exatamente o estado do sistema a qualquer momento.

---

### 🚀 Últimas Alterações Realizadas

#### v16 (05/06/2026 - Antigravity)
* **Prevenção Definitiva de Tremor & Atualização de Cache PWA:**
  * Forçado `transition: none !important;` nas classes `.dashboard-panel.layout-floating-active` e `.widget-card.layout-floating-active` no CSS, prevenindo que qualquer transição herdada (como a do `.widget-card`) atrase a renderização da posição `transform` durante o arraste de qualquer widget do dashboard.
  * Atualizada a versão do cache do Service Worker (`sw.js`) para `gelodovale-v108` e atualizados os parâmetros de cache-busting do `index.html` para `v16`. Isso garante que o navegador do usuário recarregue os novos estilos e scripts sem reter versões em cache.

#### v15 (05/06/2026 - Antigravity)
* **Correção de Drag & Tremor no Dashboard:**
  * Removido a transição `transform` do painel flutuante ativo no CSS (`styles.css`), eliminando o efeito de tremor/stutter causado por atrasos de animação durante o movimento do ponteiro.
  * Desativada a escuta de eventos nativos de reordenamento HTML5 de widgets (`widgets.js`) quando o modo de layout ativo não for `'fixed'` (ou seja, quando for `'grid'` ou `'floating'`). Isso evita conflitos de arraste duplo com o gerenciador de layout principal (`layout.js`) e corrige o problema do painel ficar preso ao mouse.

#### v14 (04/06/2026 - Antigravity)
* **Correção do Backup & Sincronização:**
  * Adicionado suporte para salvar/restaurar as posições personalizadas dos painéis (`layoutSettings`).
  * Adicionado suporte para salvar/restaurar o bloco de notas (`notepadText`), notas do calendário (`calendarNotes`), eventos locais (`localEvents`) e alertas ignorados (`ignoredSpikes`).
  * Adicionado suporte para salvar/restaurar preferências de impressão (`printSettings`) e logística.
  * O sistema agora aplica e renderiza o layout de painéis imediatamente após a restauração de um backup.
* **Separação de Versão no Rodapé:**
  * O rodapé lateral agora exibe separadamente a versão dos dados carregados (`Dados: vX.X`) e a versão atualizada do código (`Sistema: vXX`).

#### v13 (04/06/2026 - Antigravity)
* **Resolução de Overflow nos Cards (CLI-02 e outros):**
  * **Clientes:** Divisão das ações do card de cliente em duas linhas organizadas (Linha 1: Contrato, Assinar, Ligar, WhatsApp, Editar; Linha 2: Desvincular e Excluir). Redução dos botões de ícone para `28px x 28px`.
  * **Inventário/Equipamentos & Aluguéis:** Adicionado `flex-wrap: wrap` nos contêineres de botões de ações para evitar vazamento em telas estreitas ou painéis encolhidos.
  * **Documentos/Recibos:** Adicionado `flex-wrap: wrap` nas ações de documentos emitidos.

#### v12 (04/06/2026 - Antigravity)
* **Adaptabilidade de Altura dos Painéis (PED-02):**
  * **Mapa de Rotas:** O mapa interativo (`#leaflet-route-map`) agora tem uma altura mínima de `150px` e escala proporcionalmente.
  * **Lista Textual de Paradas:** Adicionado scroll vertical automático (`overflow-y: auto`) na lista de paradas (`#leaflet-route-fallback`), evitando vazamento do card.
  * **Listas do Dashboard:** Configurado scroll automático para as sugestões de visitas, devedores, agendamentos e alertas de reabastecimento.
  * **Layout Flex:** Impedido que parágrafos, botões e alertas estiquem artificialmente ao redimensionar os painéis.
