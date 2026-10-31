// Componentes de interface partilhados (estados, fontes, alertas). Tudo via h() → textContent.

import { h, clear, externalLink } from './dom.js';
import { ESTADOS, effectiveStatus, formatDate, todayISO } from './status.js';

export function alerta(tom, titulo, ...corpo) {
  return h('div', { class: `alert alert--${tom}`, role: tom === 'danger' ? 'alert' : null },
    titulo ? h('p', { class: 'alert__title' }, titulo) : null, ...corpo);
}

export function badge(registo, today = todayISO()) {
  const { estado, avisos } = effectiveStatus(registo, today);
  const info = ESTADOS[estado];
  const extra = avisos.includes('revisao-em-atraso') ? ' (revisão em atraso)' : '';
  return h('span', { class: `badge badge--${info.tom}` }, info.rotulo + extra);
}

/** Linha «Verificado em … · Próxima revisão …», com tratamento de datas inválidas. */
export function datasEditoriais(registo) {
  const verif = formatDate(registo.verificadoEm);
  const rev = formatDate(registo.revisaoPrevista);
  return h('p', { class: 'meta' },
    verif ? `Última verificação editorial: ${verif}.` : 'Ainda sem verificação editorial.',
    ' ',
    rev ? `Próxima revisão prevista: ${rev}.` : 'Data de revisão por definir.');
}

/** Lista de fontes com estado e data de consulta da ligação. */
export function listaFontes(ids, fontesMap, today = todayISO()) {
  const itens = ids.map((id) => fontesMap.get(id)).filter(Boolean);
  if (itens.length === 0) return h('p', { class: 'meta' }, 'Sem fontes associadas.');
  return h('ul', { class: 'sources' }, itens.map((f) => h('li', {},
    externalLink(f.url, f.titulo),
    h('span', { class: 'sources__meta' },
      ` — ${f.emissor}. `,
      badge(f, today),
      f.ligacaoVerificadaEm ? ` Ligação consultada em ${formatDate(f.ligacaoVerificadaEm) || 'data inválida'}.` : ' Ligação não verificada.'))));
}

export function mostrarErro(container, erro) {
  clear(container).append(alerta('danger', 'Não foi possível carregar a informação.',
    h('p', {}, erro?.message || 'Erro desconhecido.'),
    h('p', {}, 'Entretanto, podes consultar diretamente o ',
      externalLink('https://www.portaldahabitacao.pt/', 'Portal da Habitação'), ' ou o ',
      externalLink('https://diariodarepublica.pt/', 'Diário da República'), '.')));
  container.setAttribute('aria-busy', 'false');
}

/** Anuncia uma mensagem a leitores de ecrã através da região viva global. */
export function anunciar(texto) {
  const regiao = document.getElementById('live');
  if (!regiao) return;
  regiao.textContent = '';
  window.setTimeout(() => { regiao.textContent = texto; }, 50);
}

/** Descarrega texto como ficheiro, sem servidor. */
export function descarregar(nome, conteudo, tipo = 'text/plain;charset=utf-8') {
  const blob = new Blob([conteudo], { type: tipo });
  const url = URL.createObjectURL(blob);
  const a = h('a', {});
  a.href = url;
  a.download = nome;
  document.body.append(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function copiar(texto) {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    const area = h('textarea', { 'aria-hidden': 'true', class: 'visually-hidden' });
    area.value = texto;
    document.body.append(area);
    area.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch { ok = false; }
    area.remove();
    return ok;
  }
}
