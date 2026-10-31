// Página «Quem resolve?» — liga o motor da árvore ao DOM.

import { h, clear, externalLink } from '../core/dom.js';
import { loadAll } from '../core/data.js';
import { isDisplayable, todayISO } from '../core/status.js';
import { alerta, badge, datasEditoriais, listaFontes, mostrarErro, anunciar } from '../core/ui.js';
import { indexTree, walk, opcoesDe, resolveResultado, parseCaminho } from '../lib/decision.js';
import { questoesDe } from '../lib/questoes.js';

const app = document.getElementById('app');
const hoje = todayISO();
const largo = () => window.matchMedia('(min-width: 768px)').matches;
let ctx;

async function iniciar() {
  try {
    const d = await loadAll(['config', 'arvore', 'entidades', 'fontes', 'municipios', 'questoes-juridicas']);
    ctx = {
      config: d.config,
      tree: indexTree(d.arvore),
      municipios: d.municipios,
      entidades: new Map(d.entidades.entidades.map((e) => [e.id, e])),
      fontes: new Map(d.fontes.fontes.map((f) => [f.id, f])),
      questoes: d['questoes-juridicas'].questoes
    };
  } catch (erro) {
    mostrarErro(app, erro);
    return;
  }
  window.addEventListener('popstate', () => render(false));
  render(false);
}

function caminhoAtual() {
  return parseCaminho(new URLSearchParams(window.location.search).get('caminho'));
}

function navegar(caminho) {
  // Os ids são [a-z0-9-]: podem ir no URL sem codificação, mantendo as vírgulas legíveis.
  window.history.pushState({}, '', caminho.length ? `?caminho=${caminho.join(',')}` : window.location.pathname);
  render(true);
}

function render(focar) {
  const caminho = caminhoAtual();
  const estado = walk(ctx.tree, caminho, ctx.municipios);
  clear(app);
  app.setAttribute('aria-busy', 'false');
  // Num percurso já iniciado, o telemóvel esconde a introdução para mostrar logo a pergunta ou a ficha.
  document.body.classList.toggle('em-percurso', estado.passos.length > 0);

  if (estado.invalido) {
    app.append(alerta('info', 'Parte do endereço não corresponde a uma resposta válida.',
      h('p', {}, 'Mostramos as respostas que conseguimos reconhecer. Podes continuar a partir daqui.')));
  }
  if (estado.passos.length) app.append(resumo(estado.passos));

  const alvo = estado.resultadoId
    ? ficha(ctx.tree.resultados.get(estado.resultadoId), estado.contexto)
    : pergunta(estado.atual, estado.passos.length);
  app.append(alvo);

  if (focar) {
    const titulo = alvo.querySelector('[data-foco]');
    titulo?.focus();
    anunciar(titulo?.textContent || '');
  }
}

function resumo(passos) {
  const lista = h('ol', { class: 'answers__list' }, passos.map((p, i) => {
      const alterar = h('button', { type: 'button', class: 'btn btn--link' }, 'Alterar',
        h('span', { class: 'visually-hidden' }, ` a resposta «${p.pergunta.texto}»`));
      alterar.addEventListener('click', () => navegar(passos.slice(0, i).map((x) => x.opcao.id)));
      return h('li', {}, h('span', { class: 'answers__q' }, p.pergunta.texto), ' ',
        h('strong', {}, p.opcao.rotulo), ' ', alterar);
    }));
  // No telemóvel as respostas ficam recolhidas para a pergunta atual aparecer logo.
  return h('nav', { class: 'answers', 'aria-label': 'As tuas respostas' },
    h('details', { class: 'collapsible', open: largo() },
      h('summary', {}, h('h2', { class: 'answers__title' }, `As tuas respostas (${passos.length})`)),
      lista));
}

/** Secção da ficha; as secundárias ficam recolhidas no telemóvel. */
function secao(titulo, conteudo, { secundaria = false, classe = '' } = {}) {
  if (!secundaria) return h('section', { class: `block ${classe}`.trim() }, h('h3', {}, titulo), ...conteudo);
  return h('details', { class: `block collapsible ${classe}`.trim(), open: largo() },
    h('summary', {}, h('h3', {}, titulo)), ...conteudo);
}

function pergunta(p, profundidade) {
  if (!p) {
    return alerta('danger', 'Esta pergunta não está disponível.',
      h('p', {}, h('a', { href: 'quem-resolve.html' }, 'Recomeçar')));
  }
  const opcoes = opcoesDe(p, ctx.municipios);
  const caminho = caminhoAtual();
  const lista = h('ul', { class: 'choices', role: 'list' }, opcoes.map((o) => {
    const b = h('button', { type: 'button', class: 'choice' }, o.rotulo);
    b.addEventListener('click', () => navegar([...walk(ctx.tree, caminho, ctx.municipios).passos.map((x) => x.opcao.id), o.id]));
    return h('li', {}, b);
  }));

  const controlos = h('div', { class: 'actions' });
  if (profundidade > 0) {
    const voltar = h('button', { type: 'button', class: 'btn btn--secondary' }, '← Voltar');
    voltar.addEventListener('click', () => navegar(caminho.slice(0, profundidade - 1)));
    const recomecar = h('button', { type: 'button', class: 'btn btn--link' }, 'Recomeçar');
    recomecar.addEventListener('click', () => navegar([]));
    controlos.append(voltar, recomecar);
  }

  return h('section', { class: 'question', 'aria-labelledby': 'pergunta-titulo' },
    h('p', { class: 'eyebrow' }, `Pergunta ${profundidade + 1}`),
    h('h2', { id: 'pergunta-titulo', tabindex: '-1', 'data-foco': '' }, p.texto),
    p.ajuda ? h('p', { class: 'hint' }, p.ajuda) : null,
    lista, controlos);
}

function ficha(resultadoBase, contexto) {
  const politica = ctx.config.politica || {};
  const caminho = caminhoAtual();
  const voltar = h('button', { type: 'button', class: 'btn btn--secondary' }, '← Voltar');
  voltar.addEventListener('click', () => navegar(caminho.slice(0, -1)));
  const recomecar = h('button', { type: 'button', class: 'btn btn--link' }, 'Recomeçar');
  recomecar.addEventListener('click', () => navegar([]));
  const controlos = h('div', { class: 'actions no-print' }, voltar, recomecar);

  if (!resultadoBase || !isDisplayable(resultadoBase, politica, hoje)) {
    return h('section', { class: 'result', 'aria-labelledby': 'resultado-titulo' },
      h('h2', { id: 'resultado-titulo', tabindex: '-1', 'data-foco': '' }, 'Ainda não temos orientação verificada para esta situação'),
      alerta('info', null,
        h('p', {}, 'Preferimos não te dar uma resposta sem confirmação. Consulta diretamente as fontes oficiais:'),
        h('ul', {},
          h('li', {}, externalLink('https://www.portaldahabitacao.pt/', 'Portal da Habitação (IHRU)')),
          h('li', {}, externalLink('https://diariodarepublica.pt/', 'Diário da República')),
          h('li', {}, externalLink('https://www.provedor-jus.pt/', 'Provedor de Justiça')))),
      controlos);
  }

  const r = resolveResultado(resultadoBase, contexto, ctx.municipios);
  const porConfirmar = r.estado !== 'verificado';

  const entidades = r.entidades
    .map((e) => ({ ...e, dados: ctx.entidades.get(e.id) }))
    .filter((e) => e.dados && isDisplayable(e.dados, politica, hoje));

  const imprimir = h('button', { type: 'button', class: 'btn btn--link' }, 'Imprimir esta ficha');
  imprimir.addEventListener('click', () => window.print());
  window.addEventListener('beforeprint', () => document.querySelectorAll('#app details').forEach((d) => { d.open = true; }));
  controlos.append(imprimir);

  return h('article', { class: 'result', 'aria-labelledby': 'resultado-titulo' },
    h('header', { class: 'result__header' },
      h('p', { class: 'eyebrow' }, 'Resultado ', badge(r, hoje), ' ', revisaoAdvogado(r.id)),
      h('h2', { id: 'resultado-titulo', tabindex: '-1', 'data-foco': '' }, r.titulo)),
    porConfirmar ? alerta('warning', 'Informação por confirmar', h('p', {}, politica.notaPorConfirmar)) : null,
    h('p', { class: 'lead' }, r.resumo),
    r.notaCobertura ? alerta('info', 'Sem cobertura municipal', h('p', {}, r.notaCobertura)) : null,
    alerta('neutral', null, h('p', {}, 'Informação geral e modelos para preparares os teus próprios pedidos. Não é consulta jurídica individual, representação nem garantia de resultado. Em despejos, prazos judiciais ou litígios, procura um profissional legalmente habilitado.')),

    r.regras?.length ? h('section', { class: 'block' },
      h('h3', {}, 'O que diz a lei'),
      h('ul', { class: 'rules' }, r.regras.map((g) => {
        const f = ctx.fontes.get(g.fonte);
        return h('li', {}, h('span', { class: 'tag' }, 'Regra'), ' ', g.texto, ' ',
          h('span', { class: 'meta' }, g.referencia, f ? ' — ' : '', f ? externalLink(f.url, 'ver fonte') : null));
      }))) : null,

    h('section', { class: 'block' },
      h('h3', {}, 'Quem pode ajudar'),
      entidades.length > 1 ? h('p', { class: 'hint' }, 'Pode haver mais do que uma entidade envolvida. Cada uma tem um papel diferente.') : null,
      entidades.length
        ? h('ul', { class: 'cards', role: 'list' }, entidades.map((e) => cartaoEntidade(e)))
        : h('p', {}, 'Ainda não temos entidades verificadas para mostrar neste caso.')),

    h('section', { class: 'block' },
      h('h3', {}, 'Próximos passos'),
      h('p', { class: 'hint' }, h('span', { class: 'tag tag--soft' }, 'Orientação geral'), ' Não substitui aconselhamento jurídico.'),
      h('ol', { class: 'steps' }, r.passos.map((p) => h('li', {}, p)))),

    r.acoes?.length ? h('section', { class: 'block block--action' },
      h('h3', {}, 'O que podes fazer agora'),
      h('ul', { class: 'action-list', role: 'list' }, r.acoes.map((a) => h('li', {}, acao(a))))) : null,

    r.documentos?.length ? secao('Documentos que podem ser úteis', [h('ul', {}, r.documentos.map((d) => h('li', {}, d)))], { secundaria: true }) : null,

    r.limitacoes?.length ? secao('Limitações e o que falta confirmar', [h('ul', {}, r.limitacoes.map((l) => h('li', {}, l)))], { secundaria: true }) : null,

    blocoQuestoes(r.id),

    secao('Fontes', [listaFontes(r.fontes, ctx.fontes, hoje), datasEditoriais(r)], { secundaria: true }),
    controlos);
}

/** Nível de confiança separado do estado editorial: só há «validada» com parecer assinado. */
function revisaoAdvogado(id) {
  const ligadas = ctx.questoes.filter((q) => q.registos.includes(id));
  const validada = ligadas.length > 0 && ligadas.every((q) => q.estadoValidacaoProfissional === 'validada');
  return h('span', { class: `badge ${validada ? 'badge--success' : 'badge--neutral'}` },
    validada ? 'Validada por advogado' : 'Sem revisão por advogado');
}

function blocoQuestoes(id) {
  const qs = questoesDe(id, ctx.questoes);
  if (!qs.length) return null;
  return secao(`Em análise jurídica (${qs.length})`, [
    h('p', { class: 'hint' }, 'Estas dúvidas foram enviadas a um advogado. Até haver resposta, a ficha não as resolve.'),
    h('ul', {}, qs.map((q) => h('li', {}, h('a', { href: `questoes-juridicas.html#${q.id}` }, q.id), ' — ', q.pergunta.length > 180 ? `${q.pergunta.slice(0, 177)}…` : q.pergunta)))],
  { secundaria: true, classe: 'block--pending' });
}

function cartaoEntidade(e) {
  const contacto = e.dados.contacto?.fonte ? ctx.fontes.get(e.dados.contacto.fonte) : null;
  return h('li', { class: 'card' },
    h('h4', { class: 'card__title' }, e.dados.nome),
    h('p', { class: 'card__role' }, e.papel),
    h('p', { class: 'meta' }, e.dados.competencias),
    contacto
      ? h('p', {}, externalLink(contacto.url, 'Canal oficial'), contacto.ligacaoVerificadaEm ? '' : ' (ligação não verificada)')
      : h('p', { class: 'meta' }, 'Canal de contacto ainda não verificado.'),
    e.dados.contacto?.notas ? h('p', { class: 'meta' }, e.dados.contacto.notas) : null,
    h('p', {}, badge(e.dados, hoje)));
}

function acao(a) {
  if (a.href) return h('a', { href: a.href, class: 'btn btn--primary' }, a.rotulo);
  const f = ctx.fontes.get(a.fonte);
  return f ? externalLink(f.url, a.rotulo) : h('span', {}, a.rotulo, ' (ligação por confirmar)');
}

iniciar();
