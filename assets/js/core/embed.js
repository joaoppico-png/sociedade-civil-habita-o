// Integração em iframe (por exemplo, numa página WordPress).
// Só atua quando a página está dentro de um iframe: comunica a altura ao site anfitrião
// e abre as ligações externas num separador novo (muitos sites oficiais recusam ser abertos em iframe).
// Não envia dados pessoais: apenas a altura da página e o endereço da página atual.

const emIframe = window.self !== window.top;

if (emIframe) {
  document.documentElement.classList.add('em-iframe');

  let ultima = 0;
  const enviar = () => {
    const altura = Math.ceil(document.documentElement.scrollHeight);
    if (altura === ultima) return;
    ultima = altura;
    window.parent.postMessage({ tipo: 'sch-altura', altura, pagina: window.location.pathname + window.location.search }, '*');
  };

  new ResizeObserver(enviar).observe(document.body);
  window.addEventListener('load', enviar);
  window.addEventListener('popstate', () => window.setTimeout(enviar, 50));

  document.addEventListener('click', (ev) => {
    const a = ev.target.closest('a[href]');
    if (!a) return;
    const url = new URL(a.href, window.location.href);
    if (url.origin !== window.location.origin) {
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
    } else if (a.getAttribute('href')?.startsWith('#') === false) {
      // Mudança de página interna: pedir ao anfitrião que volte ao topo do iframe.
      window.parent.postMessage({ tipo: 'sch-topo' }, '*');
    }
  });
}
