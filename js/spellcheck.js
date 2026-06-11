// spellcheck.js - Correto e simplificado (português BR)
// Carrega Typo.js e inicia o corretor após o DOM estar pronto
(function() {
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/typo-js@1.2.0/typo.js';
  script.onload = () => {
    // Quando o Typo.js estiver carregado, inicializa após o DOM estar pronto
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initSpellCheck);
    } else {
      initSpellCheck();
    }
  };
  document.head.appendChild(script);
})();

function initSpellCheck() {
  // Dicionário português do Brasil (pt_BR)
  const dictPath = 'https://cdn.jsdelivr.net/npm/typo-js@1.2.0/dictionaries/pt_BR/';
  const dictionary = new Typo('pt_BR', false, false, { dictionaryPath: dictPath });

  // Tooltip único
  const tooltip = document.createElement('div');
  tooltip.id = 'spellcheck-tooltip';
  Object.assign(tooltip.style, {
    position: 'absolute',
    background: 'rgba(0,0,0,0.85)',
    color: '#fff',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '0.85rem',
    zIndex: 10000,
    display: 'none',
    maxWidth: '250px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.5)'
  });
  document.body.appendChild(tooltip);

  // Obtém palavra ao redor do cursor
  function getWordInfo(el) {
    const caret = el.selectionStart || 0;
    const value = el.value || el.innerText;
    const left = value.lastIndexOf(' ', caret - 1) + 1;
    const rightSpace = value.indexOf(' ', caret);
    const right = rightSpace === -1 ? value.length : rightSpace;
    const word = value.substring(left, right).trim();
    return { word, left, right, value };
  }

  // Exibe tooltip
  function showTooltip(info, ev) {
    const { word } = info;
    const suggestions = dictionary.suggest(word, 5);
    const html = suggestions.length
      ? suggestions.map(s => `<div class="spell-suggestion" data-replace="${s}">${s}</div>`).join('')
      : '<div class="spell-suggestion" data-replace="">(nenhuma sugestão)</div>';
    tooltip.innerHTML = `<strong>${word}</strong><br>${html}`;
    tooltip.style.top = (ev.pageY + 12) + 'px';
    tooltip.style.left = (ev.pageX + 12) + 'px';
    tooltip.style.display = 'block';
  }
  function hideTooltip() { tooltip.style.display = 'none'; }

  // Substitui palavra ao clicar na sugestão
  tooltip.addEventListener('click', e => {
    const target = e.target;
    if (!target.classList.contains('spell-suggestion')) return;
    const replaceWith = target.getAttribute('data-replace');
    const active = document.activeElement;
    if (!active) return;
    const { left, right, value } = getWordInfo(active);
    const newVal = value.substring(0, left) + replaceWith + value.substring(right);
    if (active.value !== undefined) active.value = newVal; else active.innerText = newVal;
    hideTooltip();
  });

  // Delegação de eventos em editáveis
  const selector = 'input[type=text], textarea, [contenteditable="true"]';
  const delay = 300; // debounce
  let timer = null;

  function evaluate(el, ev) {
    const { word } = getWordInfo(el);
    if (word && !dictionary.check(word)) {
      showTooltip(getWordInfo(el), ev);
    } else {
      hideTooltip();
    }
  }

  document.addEventListener('input', e => {
    if (!e.target.matches(selector)) return;
    clearTimeout(timer);
    timer = setTimeout(() => evaluate(e.target, e), delay);
  });

  document.addEventListener('mousemove', e => {
    if (!e.target.matches(selector)) return;
    clearTimeout(timer);
    timer = setTimeout(() => evaluate(e.target, e), delay);
  });

  document.addEventListener('mouseleave', hideTooltip);
}
