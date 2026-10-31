// Construção segura de DOM: todo o conteúdo entra como texto (textContent), nunca como HTML.

const SAFE_PROTOCOLS = new Set(['https:', 'http:']);

/** Devolve um URL absoluto seguro (http/https) ou null. */
export function safeUrl(value) {
  if (typeof value !== 'string' || value.trim() === '') return null;
  try {
    const url = new URL(value.trim());
    return SAFE_PROTOCOLS.has(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

/** Ligação mailto: com endereço válido e, opcionalmente, assunto. */
export function safeMailto(email, assunto = '') {
  if (typeof email !== 'string' || !/^[^\s@<>()"',;:]+@[^\s@<>()"',;:]+\.[a-z]{2,}$/i.test(email.trim())) return null;
  return `mailto:${email.trim()}${assunto ? `?subject=${encodeURIComponent(assunto.slice(0, 150))}` : ''}`;
}

/** Ligação interna relativa (sem protocolo, sem «//»). */
export function safeInternalHref(value) {
  if (typeof value !== 'string') return null;
  const v = value.trim();
  if (!/^[a-z0-9-]+\.html(\?[a-zA-Z0-9=&_%.,-]*)?(#[a-z0-9-]*)?$/.test(v)) return null;
  return v;
}

/**
 * h('p', { class: 'x' }, 'texto', filho)
 * Atributos começados por «on» são ignorados: os eventos ligam-se com addEventListener.
 */
export function h(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs || {})) {
    if (value === null || value === undefined || value === false) continue;
    if (key.startsWith('on')) continue;
    if (key === 'href') {
      const href = safeInternalHref(value) ?? safeUrl(value) ?? (/^mailto:/.test(value) ? value : null);
      if (href) node.setAttribute('href', href);
      continue;
    }
    node.setAttribute(key, value === true ? '' : String(value));
  }
  append(node, children);
  return node;
}

function append(node, children) {
  for (const child of children.flat(Infinity)) {
    if (child === null || child === undefined || child === false) continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
}

export function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
  return node;
}

/** Ligação externa com indicação de que abre noutro sítio; se o URL for inválido devolve texto. */
export function externalLink(url, label) {
  const href = safeUrl(url);
  if (!href) return h('span', { class: 'link-missing' }, label, ' (ligação por confirmar)');
  return h('a', { href, rel: 'noopener noreferrer', class: 'external' }, label,
    h('span', { class: 'visually-hidden' }, ' (site externo)'));
}
