// Página «Participar» — catálogo de oportunidades com filtros.
// Dados reais: data/oportunidades.json. Dados de demonstração só com ?demo=1, sempre sinalizados.

import { h, clear, externalLink } from '../core/dom.js';
import { loadAll, loadJSON } from '../core/data.js';
import { todayISO, formatDate } from '../core/status.js';
import { alerta, badge, mostrarErro, anunciar } from '../core/ui.js';
import { filtrar, TIPOS_PARTICIPACAO } from '../lib/participacao.js';
import { validarOportunidades } from '../core/validate.js';

const form = document.getElementById('filtros');
const lista = document.getElementById('lista');
const contagem = document.getElementById('contagem');
const avisoDemo = document.getElementById('aviso-demo');
const hoje = todayISO();
let ctx;

async function iniciar() {
  const demo = new URLSearchParams(window.location.search).get('demo') === '1';
  try {
    const d = await loadAll(['entidades', 'municipios', 'fontes']);
    const fonte = demo ? await loadJSON('demo/oportunidades-demo') : await loadJSON('oportunidades');
    ctx = { ...d, oportunidades: fonte.oportunidades || [], demo, fontes: new Map(d.fontes.fontes.map((f) => [f.id, f])) };
  } catch (erro) {
    mostrarErro(lista, erro);
    form.hidden = true;
    return;
  }

  if (demo) {
    avisoDemo.append(alerta('warning', 'Modo de demonstração',
      h('p', {}, 'Estás a ver dados fictícios, que servem só para testar a página. Nenhuma destas oportunidades é real. '),
      h('p', {}, h('a', { href: 'participar.html' }, 'Ver as oportunidades verificadas'))));
    const avisos = validarOportunidades({ oportunidades: ctx.oportunidades }, new Set(ctx.entidades.entidades.map((e) => e.id)));
    if (avisos.length) console.warn('Dados de demonstração com problemas (esperado, para testes):', avisos);
  }

  preencherFiltros();
  form.addEventListener('change', render);
  form.addEventListener('submit', (ev) => { ev.preventDefault(); render(); });
  form.addEventListener('reset', () => window.setTimeout(render, 0));
  render();
}

function opcao(valor, rotulo) { return h('option', { value: valor }, rotulo); }

function preencherFiltros() {
  const nomeEntidade = new Map(ctx.entidades.entidades.map((e) => [e.id, e.nome]));
  const municipios = new Map([['nacional', 'Âmbito nacional'], ...ctx.municipios.municipios.map((m) => [m.id, m.nome])]);
  const usados = (campo) => [...new Set(ctx.oportunidades.map((o) => o[campo]).filter(Boolean))];

  for (const m of new Set([...municipios.keys(), ...usados('municipio')])) form.elements.municipio.append(opcao(m, municipios.get(m) || m));
  for (const [id, rotulo] of Object.entries(TIPOS_PARTICIPACAO)) form.elements.tipo.append(opcao(id, rotulo));
  for (const e of usados('entidade')) form.elements.entidade.append(opcao(e, nomeEntidade.get(e) || e));
  ctx.nomeEntidade = nomeEntidade;
  ctx.nomeMunicipio = municipios;
}

function render() {
  const f = Object.fromEntries(new FormData(form).entries());
  const resultados = filtrar(ctx.oportunidades, f, hoje);
  clear(lista);
  lista.setAttribute('aria-busy', 'false');

  if (ctx.oportunidades.length === 0) {
    contagem.textContent = 'Ainda não há oportunidades verificadas.';
    lista.append(vazio('Ainda não publicámos oportunidades de participação verificadas.',
      'Só publicamos uma consulta depois de confirmarmos as datas e as regras na fonte oficial. Entretanto, consulta diretamente:'));
    return;
  }
  contagem.textContent = `${resultados.length} ${resultados.length === 1 ? 'oportunidade encontrada' : 'oportunidades encontradas'}.`;
  anunciar(contagem.textContent);
  if (resultados.length === 0) {
    lista.append(vazio('Nenhuma oportunidade corresponde aos filtros.', 'Experimenta limpar os filtros ou consulta os portais oficiais:'));
    return;
  }
  lista.append(h('h2', { class: 'visually-hidden' }, 'Oportunidades'), h('ul', { class: 'cards cards--list', role: 'list' }, resultados.map(cartao)));
}

function vazio(titulo, texto) {
  return h('div', { class: 'empty' },
    h('h2', {}, titulo),
    h('p', {}, texto),
    h('ul', {},
      ['participa-gov', 'participa-pt', 'am-lisboa-site', 'cm-lisboa-site'].map((id) => ctx.fontes.get(id)).filter(Boolean)
        .map((fonte) => h('li', {}, externalLink(fonte.url, fonte.titulo)))));
}

function cartao(op) {
  const datas = (v) => formatDate(v) || 'data inválida ou por confirmar';
  return h('li', { class: `card card--${op.procedimento.id}` },
    h('p', { class: 'eyebrow' }, TIPOS_PARTICIPACAO[op.tipo] || 'Participação', ' · ',
      h('span', { class: `status status--${op.procedimento.id}` }, op.procedimento.rotulo)),
    h('h3', { class: 'card__title' }, op.titulo),
    h('p', {}, op.descricao),
    h('dl', { class: 'facts' },
      h('dt', {}, 'Entidade promotora'), h('dd', {}, ctx.nomeEntidade.get(op.entidade) || op.entidade),
      h('dt', {}, 'Âmbito'), h('dd', {}, ctx.nomeMunicipio.get(op.municipio) || op.municipio),
      h('dt', {}, 'Abertura'), h('dd', {}, datas(op.abertura)),
      h('dt', {}, 'Prazo de participação'), h('dd', {}, datas(op.prazo))),
    op.instrucoes ? h('p', {}, h('strong', {}, 'Como participar: '), op.instrucoes) : null,
    h('p', {}, op.url ? externalLink(op.url, 'Consultar na página oficial') : h('span', { class: 'link-missing' }, 'Ligação oficial em falta ou inválida.')),
    h('p', { class: 'meta' }, badge(op, hoje), ' ',
      op.verificadoEm && formatDate(op.verificadoEm) ? `Verificado em ${formatDate(op.verificadoEm)}.` : 'Sem verificação editorial.'));
}

iniciar();
