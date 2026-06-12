// spellcheck.js - Corretor ortográfico integrado em português (pt_BR)
// Carrega Typo.js e inicializa o corretor de forma assíncrona
(function() {
  const script = document.createElement('script');
  script.src = 'js/typo.js?v=68';
  script.onload = () => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initSpellCheck);
    } else {
      initSpellCheck();
    }
  };
  document.head.appendChild(script);
})();

function initSpellCheck() {
  let dictionary = null;
  const affUrl = 'js/dictionaries/pt_BR/pt_BR.aff';
  const dicUrl = 'js/dictionaries/pt_BR/pt_BR.dic';

  // Injetar estilos do tooltip dinamicamente
  const styleEl = document.createElement('style');
  styleEl.textContent = `
    #spellcheck-tooltip {
      position: absolute;
      background: rgba(15, 23, 42, 0.95);
      color: #fff;
      padding: 8px 12px;
      border-radius: 8px;
      font-size: 0.85rem;
      z-index: 20000;
      display: none;
      min-width: 160px;
      max-width: 280px;
      box-shadow: 0 4px 20px rgba(0, 240, 255, 0.25);
      border: 1px solid rgba(0, 240, 255, 0.3);
      font-family: system-ui, -apple-system, sans-serif;
    }
    .spell-suggestion {
      padding: 6px 8px;
      margin-top: 4px;
      border-radius: 4px;
      cursor: pointer;
      transition: background 0.2s, color 0.2s;
      color: #cbd5e1;
    }
    .spell-suggestion:hover {
      background: rgba(0, 240, 255, 0.15);
      color: #00f0ff;
    }
  `;
  document.head.appendChild(styleEl);

  // Criar elemento de tooltip
  const tooltip = document.createElement('div');
  tooltip.id = 'spellcheck-tooltip';
  document.body.appendChild(tooltip);

  // Carregar arquivos de dicionário de forma assíncrona
  Promise.all([
    fetch(affUrl).then(r => {
      if (!r.ok) throw new Error("Falha ao carregar pt_BR.aff: " + r.statusText);
      return r.text();
    }),
    fetch(dicUrl).then(r => {
      if (!r.ok) throw new Error("Falha ao carregar pt_BR.dic: " + r.statusText);
      return r.text();
    })
  ]).then(([affData, dicData]) => {
    dictionary = new Typo("pt_BR", affData, dicData);
    window.spellcheckDictionary = dictionary;
    console.log("Corretor ortográfico pt_BR carregado com sucesso!");
  }).catch(err => {
    window.spellcheckLoadError = err.message || err;
    console.error("Erro ao carregar o dicionário:", err);
  });

  // Função para verificar caracteres de quebra de palavra
  function isWhitespaceOrPunctuation(char) {
    return /\s|[.,\/#!$%\^&\*;:{}=\-_`~()?"'’‘“”]/u.test(char);
  }

  // Obtém palavra ao redor do cursor
  function getWordInfo(el) {
    const caret = el.selectionStart || 0;
    const value = el.value || el.innerText || "";
    
    let left = caret;
    while (left > 0 && !isWhitespaceOrPunctuation(value[left - 1])) {
      left--;
    }
    let right = caret;
    while (right < value.length && !isWhitespaceOrPunctuation(value[right])) {
      right++;
    }
    const word = value.substring(left, right);
    return { word, left, right, value };
  }

  // Exibe tooltip
  function showTooltip(info, cleaned, el) {
    if (!dictionary || !dictionary.suggest) return;
    
    const suggestions = dictionary.suggest(cleaned, 5);
    const html = suggestions.length
      ? suggestions.map(s => `<div class="spell-suggestion" data-replace="${s}">${s}</div>`).join('')
      : '<div class="spell-suggestion" data-replace="">(nenhuma sugestão)</div>';
      
    tooltip.innerHTML = `<div style="font-weight:bold;margin-bottom:6px;color:#00f0ff;">Sugestões para "${cleaned}":</div>${html}`;
    
    // Posicionar o tooltip logo abaixo do campo ativo
    const rect = el.getBoundingClientRect();
    tooltip.style.top = (rect.bottom + window.scrollY + 6) + 'px';
    tooltip.style.left = (rect.left + window.scrollX) + 'px';
    tooltip.style.display = 'block';
    
    // Armazena referências para a substituição
    tooltip.activeElement = el;
    tooltip.replacementRange = { left: info.left, right: info.right };
  }

  function hideTooltip() {
    tooltip.style.display = 'none';
  }

  // Substitui a palavra ao clicar na sugestão
  tooltip.addEventListener('click', e => {
    const target = e.target;
    if (!target.classList.contains('spell-suggestion')) return;
    const replaceWith = target.getAttribute('data-replace');
    if (!replaceWith) return;
    
    const active = tooltip.activeElement;
    if (!active) return;
    
    const { left, right } = tooltip.replacementRange;
    const value = active.value || active.innerText || "";
    
    const newVal = value.substring(0, left) + replaceWith + value.substring(right);
    if (active.value !== undefined) {
      active.value = newVal;
      active.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
      active.innerText = newVal;
      active.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    hideTooltip();
    active.focus();
  });

  // Delegação de eventos nos campos editáveis
  const selector = 'input[type=text], input:not([type]), input[type=search], textarea, [contenteditable="true"]';
  const delay = 300; // debounce
  let timer = null;

  function evaluate(el) {
    if (!dictionary) return; // Se o dicionário ainda não terminou de carregar
    
    // Respeitar atributo nativo spellcheck="false"
    if (el.getAttribute('spellcheck') === 'false' || el.spellcheck === false) {
      hideTooltip();
      return;
    }
    
    const info = getWordInfo(el);
    const { word } = info;
    
    // Limpar pontuação da palavra para checagem
    const cleaned = word.trim().replace(/^[.,\/#!$%\^&\*;:{}=\-_`~()?"'’‘“”]+/g, "").replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'’‘“”]+$/g, "");
    
    if (cleaned && cleaned.length > 1 && !dictionary.check(cleaned)) {
      showTooltip(info, cleaned, el);
    } else {
      hideTooltip();
    }
  }

  document.addEventListener('input', e => {
    if (!e.target.matches(selector)) return;
    clearTimeout(timer);
    timer = setTimeout(() => evaluate(e.target), delay);
  });

  document.addEventListener('focusin', e => {
    if (!e.target.matches(selector)) return;
    evaluate(e.target);
  });

  // Oculta se clicar fora
  document.addEventListener('mousedown', e => {
    if (!tooltip.contains(e.target) && !e.target.matches(selector)) {
      hideTooltip();
    }
  });
}
