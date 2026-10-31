// Página «Questões jurídicas em aberto» — lista para o advogado e para os leitores.

import { h, clear, externalLink } from '../core/dom.js';
import { loadAll } from '../core/data.js';
import { formatDate } from '../core/status.js';
import { mostrarErro } from '../core/ui.js';
import { nomesDosRegistos } from '../lib/questoes.js';

const app = document.getElementById('app');
const ESTADO = { aberta: 'Por responder', respondida: 'Respondida — por aplicar', aplicada: 'Aplicada ao site' };

async function iniciar() {
  let d;
  try {
    d = await loadAll(['questoes-juridicas', 'fontes', 'arvore', 'requerimento']);
  } catch (erro) {
    mostrarErro(app, erro);
    return;
  }
  const fontes = new Map(d.fontes.fontes.map((f) => [f.id, f]));
  const nomes = nomesDosRegistos(d.arvore, d.requerimento);
  const questoes = d['questoes-juridicas'].questoes;
  const temas = [...new Set(questoes.map((q) => q.tema))];
  const abertas = questoes.filter((q) => q.estado === 'aberta').length;

  clear(app).append(
    h('p', { class: 'meta' }, `${questoes.length} questões · ${abertas} por responder · preparado em ${formatDate(d['questoes-juridicas'].meta.preparadoEm)}.`),
    h('div', { class: 'alert alert--neutral' }, h('p', {}, d['questoes-juridicas'].meta.instrucoes)),
    h('nav', { class: 'toc no-print', 'aria-label': 'Temas' }, h('ul', {}, temas.map((t) => h('li', {}, h('a', { href: `questoes-juridicas.html#${slug(t)}` }, t))))),
    ...temas.map((t) => h('section', { class: 'block', id: slug(t), 'aria-labelledby': `t-${slug(t)}` },
      h('h2', { id: `t-${slug(t)}` }, t),
      h('ol', { class: 'questions', role: 'list' }, questoes.filter((q) => q.tema === t).map((q) => cartao(q, fontes, nomes))))));
  app.setAttribute('aria-busy', 'false');
  if (window.location.hash) document.getElementById(window.location.hash.slice(1))?.scrollIntoView();
}

function cartao(q, fontes, nomes) {
  const fs = q.fontesConsultadas.map((id) => fontes.get(id)).filter(Boolean);
  const aberto = window.matchMedia('(min-width: 768px)').matches || window.location.hash === `#${q.id}`;
  return h('li', { id: q.id }, h('details', { class: 'question-card collapsible', open: aberto },
    h('summary', {}, h('div', {},
      h('p', { class: 'eyebrow' }, h('span', { class: 'num' }, q.id), ` · Prioridade ${q.prioridade} · `,
        h('span', { class: `status status--${q.estado === 'aberta' ? 'por-confirmar' : 'aberta'}` }, ESTADO[q.estado] || q.estado)),
      h('h3', {}, q.pergunta))),
    h('dl', { class: 'facts facts--stack' },
      h('dt', {}, 'Contexto'), h('dd', {}, q.contexto),
      h('dt', {}, 'Texto atual no site'), h('dd', {}, q.redacaoAtual),
      h('dt', {}, 'Afeta'), h('dd', {}, q.registos.map((r) => nomes.get(r) || r).join(' · ')),
      h('dt', {}, 'Impacto'), h('dd', {}, q.impacto),
      fs.length ? [h('dt', {}, 'Fontes já consultadas'), h('dd', {}, h('ul', { class: 'sources' }, fs.map((f) => h('li', {}, externalLink(f.url, f.titulo)))))] : null,
      h('dt', {}, 'Resposta'), h('dd', {}, q.resposta
        ? [q.resposta, ' ', h('span', { class: 'meta' }, `(${q.respondidoPor || 'advogado'}, ${formatDate(q.respondidoEm) || 's/ data'})`)]
        : h('span', { class: 'answer-line' }, 'Por responder.')))));
}

const slug = (t) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

iniciar();

window.addEventListener('beforeprint', () => document.querySelectorAll('#app details').forEach((d) => { d.open = true; }));
document.getElementById('imprimir')?.addEventListener('click', () => window.print());
