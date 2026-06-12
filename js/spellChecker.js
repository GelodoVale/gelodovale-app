// spellChecker.js – módulo ES6
// Detecta erros ortográficos em campos editáveis e oferece sugestões em tooltip.

// ---- Dicionário ----
let dictionary = [];
fetch('data/pt_br_dictionary.json')
  .then(r => r.json())
  .then(words => { dictionary = new Set(words); })
  .catch(() => console.error('Failed to load dictionary'));

// ---- Utilitários ----
function levenshtein(a, b) {
  const matrix = [];
  const aLen = a.length;
  const bLen = b.length;
  for (let i = 0; i <= bLen; i++) matrix[i] = [i];
  for (let j = 0; j <= aLen; j++) matrix[0][j] = j;
  for (let i = 1; i <= bLen; i++) {
    for (let j = 1; j <= aLen; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1, // deletion
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j - 1] + 1 // substitution
        );
      }
    }
  }
  return matrix[bLen][aLen];
}

function getSuggestions(word, maxSuggestions = 3, maxDist = 2) {
  if (!dictionary.size) return [];
  const suggestions = [];
  const lower = word.toLowerCase();
  for (const dictWord of dictionary) {
    const dist = levenshtein(lower, dictWord);
    if (dist > 0 && dist <= maxDist) {
      suggestions.push({ word: dictWord, dist });
    }
  }
  suggestions.sort((a, b) => a.dist - b.dist);
  return suggestions.slice(0, maxSuggestions).map(s => s.word);
}

// ---- Tooltip ----
const tooltip = document.createElement('div');
tooltip.className = 'spell-tooltip';
tooltip.style.position = 'absolute';
tooltip.style.zIndex = '10000';
tooltip.style.display = 'none';
document.body.appendChild(tooltip);

function showTooltip(target, suggestions) {
  const rect = target.getBoundingClientRect();
  tooltip.innerHTML = '';
  suggestions.forEach(s => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = s;
    btn.className = 'spell-suggest-btn';
    btn.onclick = () => {
      const span = target;
      const newText = s;
      span.replaceWith(newText);
      hideTooltip();
    };
    tooltip.appendChild(btn);
  });
  // if none, show mensagem
  if (!suggestions.length) {
    const msg = document.createElement('div');
    msg.textContent = 'Sem sugestões';
    msg.style.padding = '4px 8px';
    tooltip.appendChild(msg);
  }
  tooltip.style.left = `${rect.left + window.scrollX}px`;
  tooltip.style.top = `${rect.bottom + window.scrollY + 4}px`;
  tooltip.style.display = 'flex';
  tooltip.style.flexDirection = 'column';
}
function hideTooltip() { tooltip.style.display = 'none'; }

// ---- Core ----
function attachSpellChecker(rootSelector = 'body') {
  const root = document.querySelector(rootSelector);
  if (!root) return;
  const editableSelector = 'input:not([type=hidden]):not([readonly]), textarea:not([readonly]), [contenteditable="true"]';
  root.addEventListener('input', e => {
    const target = e.target;
    if (!target.matches(editableSelector)) return;
    // process whole value
    const words = target.value.split(/\s+/);
    const lastWord = words[words.length - 1];
    if (!lastWord) return;
    if (dictionary.has(lastWord.toLowerCase())) return; // correct
    // highlight (we cannot inject span inside input, so we use tooltip suggestion only)
    const suggestions = getSuggestions(lastWord);
    // show tooltip near caret - simple approximation using target's bounding box
    showTooltip(target, suggestions);
  });
  // For contenteditable elements, we need to wrap misspelled words with a span
  root.addEventListener('keyup', e => {
    const el = e.target;
    if (!el.matches('[contenteditable="true"]')) return;
    // replace words in innerHTML
    const html = el.innerHTML;
    const newHtml = html.replace(/\b(\w{2,})\b/g, (match) => {
      if (dictionary.has(match.toLowerCase())) return match;
      return `<span class="spell-error" data-word="${match}">${match}</span>`;
    });
    if (newHtml !== html) el.innerHTML = newHtml;
  });
  // tooltip activation on hover for spans
  root.addEventListener('mouseover', e => {
    const span = e.target;
    if (!span.classList.contains('spell-error')) return;
    const word = span.dataset.word;
    const suggestions = getSuggestions(word);
    showTooltip(span, suggestions);
  });
  root.addEventListener('mouseleave', e => {
    if (e.target.classList.contains('spell-error')) hideTooltip();
  });
  // hide on click outside
  document.addEventListener('click', e => {
    if (!e.target.closest('.spell-tooltip') && !e.target.classList.contains('spell-error')) hideTooltip();
  });
}

// Auto‑attach to whole page on load
window.addEventListener('DOMContentLoaded', () => attachSpellChecker());
