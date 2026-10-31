// Integração em iframe (por exemplo, numa página WordPress).
// Só atua quando a página está dentro de um iframe: comunica a altura ao site anfitrião
// e abre as ligações externas num separador novo (muitos sites oficiais recusam ser abertos em iframe).
// As mensagens levam apenas a altura ou um pedido para voltar ao topo — nunca endereços,
// parâmetros ou dados escritos pelo utilizador — e só são enviadas para a origem do anfitrião.

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

if (emIframe) {
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
