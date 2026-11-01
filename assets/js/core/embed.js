// Integração em iframe (por exemplo, numa página WordPress).
// Só atua quando a página está dentro de um iframe: comunica a altura ao site anfitrião
// e abre as ligações externas num separador novo (muitos sites oficiais recusam ser abertos em iframe).
// As mensagens levam apenas a altura ou um pedido para voltar ao topo — nunca endereços,
// parâmetros ou dados escritos pelo utilizador — e só são enviadas para a origem do anfitrião.

// Fora dos sites permitidos (lib/anfitriao.js), a página não se mostra: fica só uma ligação
// para a abrir em página própria (proteção contra clickjacking).

import { h } from './dom.js';
import { anfitriaoPermitido } from '../lib/anfitriao.js';

const emIframe = window.self !== window.top;

/**
 * Origem do site anfitrião. Na primeira página vem do referrer (quem abriu o iframe); nas páginas
 * seguintes o referrer já é o próprio site, por isso guarda-se a origem na sessão do separador.
 * Na falta de ambos, usa-se a própria origem (caso habitual: plugin WordPress no mesmo domínio).
 */
function origemAnfitria() {
  const CHAVE = 'sch-anfitriao';
  try {
    const ref = document.referrer ? new URL(document.referrer).origin : null;
    if (ref && ref !== window.location.origin) {
      sessionStorage.setItem(CHAVE, ref);
      return ref;
    }
    return sessionStorage.getItem(CHAVE) || window.location.origin;
  } catch {
    return window.location.origin;
  }
}

/** Origens de todos os sites que contêm o iframe; [null] quando o browser não as revela. */
function origensAncestrais() {
  if (window.location.ancestorOrigins) return [...window.location.ancestorOrigins];
  try {
    const ref = document.referrer ? new URL(document.referrer).origin : null;
    if (ref && ref !== window.location.origin) return [ref];
    return [sessionStorage.getItem('sch-anfitriao')];
  } catch {
    return [null];
  }
}

function bloquear() {
  document.documentElement.classList.add('incorporacao-bloqueada');
  document.body.replaceChildren(h('main', { class: 'wrap' },
    h('p', {}, 'Esta ferramenta só pode ser usada no site da Sociedade Civil.'),
    h('p', {}, h('a', { href: window.location.href, target: '_blank', rel: 'noopener noreferrer' },
      'Abrir a ferramenta numa página própria ↗'))));
}

const permitido = !emIframe || origensAncestrais().every((o) => anfitriaoPermitido(o, window.location.origin));

if (emIframe && !permitido) bloquear();

if (emIframe && permitido) {
  document.documentElement.classList.add('em-iframe');
  const destino = origemAnfitria();
  const enviar = (mensagem) => window.parent.postMessage(mensagem, destino);

  let ultima = 0;
  const altura = () => {
    const valor = Math.ceil(document.documentElement.scrollHeight);
    if (valor === ultima) return;
    ultima = valor;
    enviar({ tipo: 'sch-altura', altura: valor });
  };

  new ResizeObserver(altura).observe(document.body);
  window.addEventListener('load', altura);
  window.addEventListener('popstate', () => window.setTimeout(altura, 50));

  document.addEventListener('click', (ev) => {
    const a = ev.target.closest('a[href]');
    if (!a) return;
    const url = new URL(a.href, window.location.href);
    if (url.origin !== window.location.origin) {
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
    } else if (!a.getAttribute('href').startsWith('#')) {
      enviar({ tipo: 'sch-topo' });
    }
  });
}
