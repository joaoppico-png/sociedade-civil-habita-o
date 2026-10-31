// Página «Pedir documentos» — gerador de documentos, pré-visualização editável e seguimento de prazos.
// Privacidade: os dados vivem só na memória desta página. Nada é enviado nem guardado.

import { h, clear, externalLink } from '../core/dom.js';
import { loadAll } from '../core/data.js';
import { todayISO, formatDate, isDisplayable } from '../core/status.js';
import { alerta, badge, mostrarErro, anunciar, descarregar, copiar } from '../core/ui.js';
import { validar, gerarLADA, gerarInsistencia, gerarSenhorioObras, nomeFicheiro } from '../lib/requerimento.js';
import { calendarioSeguimento, gerarICS } from '../lib/prazos.js';

const form = document.getElementById('gerador');
const resumoErros = document.getElementById('erros');
const preview = document.getElementById('preview');
const texto = document.getElementById('texto-final');
const printArea = document.getElementById('print-area');
const estadoAcao = document.getElementById('estado-acao');
const orientacoes = document.getElementById('orientacoes');
const seguimento = document.getElementById('seguimento');
let dados;

const ROTULOS = {
  entidade: 'Entidade', documentos: 'Documentos pretendidos', modalidade: 'Forma de acesso', nome: 'Nome completo',
  morada: 'Morada', email: 'E-mail', local: 'Localidade', data: 'Data', dataPedido: 'Data do pedido original',
  destinatario: 'Nome do senhorio', moradaImovel: 'Morada da casa arrendada', problemas: 'Problemas', prazoDias: 'Prazo proposto'
};

async function iniciar() {
  try {
    dados = await loadAll(['config', 'entidades', 'fontes', 'requerimento']);
  } catch (erro) {
    mostrarErro(document.getElementById('app-erro'), erro);
    form.hidden = true;
    return;
  }
  const politica = dados.config.politica || {};
  const params = new URLSearchParams(window.location.search);

  // Entidades públicas que recebem pedidos LADA.
  const select = form.elements.entidadeId;
  const publicas = dados.entidades.entidades.filter((e) => e.aceitaLADA && isDisplayable(e, politica));
  for (const e of publicas) select.append(h('option', { value: e.id }, e.nome));
  select.append(h('option', { value: 'outra' }, 'Outra entidade (escrever o nome)'));
  const pedida = params.get('entidade');
  if (pedida && publicas.some((e) => e.id === pedida)) select.value = pedida;

  // Modalidades de acesso.
  const grupo = document.getElementById('modalidades');
  dados.requerimento.modalidades.forEach((m, i) => {
    const id = `modalidade-${m.id}`;
    grupo.append(h('div', { class: 'radio' },
      h('input', { type: 'radio', id, name: 'modalidade', value: m.id, checked: i === 0 }),
      h('label', { for: id }, m.rotulo)));
  });

  form.elements.data.value = todayISO();
  const tipo = params.get('tipo');
  if (['lada', 'insistencia', 'senhorio-obras'].includes(tipo)) form.elements.tipo.value = tipo;

  renderOrientacoes();
  atualizarTipo();
  atualizarEntidadeOutra();

  form.addEventListener('change', (ev) => {
    if (ev.target.name === 'tipo') atualizarTipo();
    if (ev.target.name === 'entidadeId') atualizarEntidadeOutra();
  });
  form.addEventListener('submit', (ev) => { ev.preventDefault(); gerar(); });
  document.getElementById('btn-copiar').addEventListener('click', acaoCopiar);
  document.getElementById('btn-txt').addEventListener('click', () => {
    descarregar(nomeFicheiro(tipoAtual(), form.elements.data.value), texto.value);
    estado('Ficheiro .txt descarregado.');
  });
  document.getElementById('btn-imprimir').addEventListener('click', () => {
    printArea.textContent = texto.value;
    window.print();
  });
  document.getElementById('btn-limpar').addEventListener('click', limparTudo);
  document.getElementById('calc-prazos').addEventListener('submit', (ev) => { ev.preventDefault(); calcularPrazos(); });
  window.addEventListener('beforeprint', () => { printArea.textContent = texto.value; });
}

const tipoAtual = () => form.elements.tipo.value;

function atualizarTipo() {
  const t = tipoAtual();
  for (const fs of form.querySelectorAll('[data-tipos]')) {
    const ativo = fs.dataset.tipos.split(' ').includes(t);
    fs.hidden = !ativo;
    fs.disabled = !ativo;
  }
  seguimento.hidden = t === 'senhorio-obras';
  document.getElementById('nota-senhorio').hidden = t !== 'senhorio-obras';
  preview.hidden = true;
  limparErros();
}

function atualizarEntidadeOutra() {
  const outra = form.elements.entidadeId.value === 'outra';
  const campo = document.getElementById('campo-entidade-outra');
  campo.hidden = !outra;
  form.elements.entidadeOutra.required = outra;
}

function lerDados() {
  const fd = new FormData(form);
  const v = Object.fromEntries([...fd.entries()].map(([k, val]) => [k, typeof val === 'string' ? val : '']));
  if (v.entidadeId === 'outra') v.entidade = v.entidadeOutra || '';
  else v.entidade = dados.entidades.entidades.find((e) => e.id === v.entidadeId)?.nome || '';
  return v;
}

function gerar() {
  const t = tipoAtual();
  const v = lerDados();
  const modalidade = dados.requerimento.modalidades.find((m) => m.id === v.modalidade);
  const erros = validar(t, v, { modalidadeExigeEmail: Boolean(modalidade?.exigeEmail) });
  if (v.entidadeId === 'outra' && !v.entidadeOutra?.trim() && t !== 'senhorio-obras') erros.entidade = 'Escreve o nome da entidade.';
  mostrarErros(erros);
  if (Object.keys(erros).length) return;

  texto.value = t === 'lada' ? gerarLADA(v, modalidade) : t === 'insistencia' ? gerarInsistencia(v) : gerarSenhorioObras(v);
  preview.hidden = false;
  const titulo = document.getElementById('preview-titulo');
  titulo.focus();
  anunciar('Documento gerado. Revê e edita o texto antes de o usares.');
}

function limparErros() {
  clear(resumoErros);
  resumoErros.hidden = true;
  for (const el of form.querySelectorAll('[aria-invalid]')) el.removeAttribute('aria-invalid');
  for (const el of form.querySelectorAll('.field__error')) el.remove();
}

function campoDe(nome) {
  if (nome === 'entidade') return form.elements.entidadeId.value === 'outra' ? form.elements.entidadeOutra : form.elements.entidadeId;
  if (nome === 'modalidade') return document.getElementById('modalidades').querySelector('input');
  return form.elements[nome];
}

function mostrarErros(erros) {
  limparErros();
  const nomes = Object.keys(erros);
  if (!nomes.length) return;
  for (const nome of nomes) {
    const campo = campoDe(nome);
    if (!campo || campo instanceof RadioNodeList) continue;
    const id = `erro-${nome}`;
    campo.setAttribute('aria-invalid', 'true');
    const descritores = (campo.getAttribute('aria-describedby') || '').split(' ').filter((x) => x && !x.startsWith('erro-'));
    campo.setAttribute('aria-describedby', [...descritores, id].join(' '));
    (campo.closest('.field') || campo.parentElement).append(h('p', { class: 'field__error', id }, erros[nome]));
  }
  resumoErros.append(
    h('h2', { class: 'alert__title', tabindex: '-1', id: 'erros-titulo' }, `Há ${nomes.length} ${nomes.length === 1 ? 'campo a corrigir' : 'campos a corrigir'}`),
    h('ul', {}, nomes.map((nome) => {
      const campo = campoDe(nome);
      const link = h('a', { href: `pedir-documentos.html#${campo?.id || ''}` }, `${ROTULOS[nome] || nome}: ${erros[nome]}`);
      link.addEventListener('click', (ev) => { ev.preventDefault(); campo?.focus(); });
      return h('li', {}, link);
    })));
  resumoErros.hidden = false;
  document.getElementById('erros-titulo').focus();
}

async function acaoCopiar() {
  estado(await copiar(texto.value) ? 'Texto copiado para a área de transferência.' : 'Não foi possível copiar. Seleciona o texto e copia manualmente.');
}

function estado(msg) {
  estadoAcao.textContent = msg;
}

function limparTudo() {
  form.reset();
  form.elements.data.value = todayISO();
  texto.value = '';
  printArea.textContent = '';
  preview.hidden = true;
  atualizarTipo();
  atualizarEntidadeOutra();
  estado('');
  anunciar('Formulário limpo. Os dados foram apagados desta página.');
  form.querySelector('input, select, textarea')?.focus();
}

function renderOrientacoes() {
  const fontes = new Map(dados.fontes.fontes.map((f) => [f.id, f]));
  clear(orientacoes).append(...dados.requerimento.orientacoes.map((o) => {
    const f = o.fonte ? fontes.get(o.fonte) : null;
    return h('details', { class: 'guide' },
      h('summary', {}, o.titulo, ' ', badge({ estado: o.estado, verificadoEm: null })),
      h('p', {}, o.texto),
      o.referencia || f ? h('p', { class: 'meta' }, o.referencia || '', f ? ' — ' : '', f ? externalLink(f.url, 'ver fonte') : null) : null);
  }));
}

function calcularPrazos() {
  const regras = dados.requerimento.seguimento;
  const campo = document.getElementById('data-entrega');
  const saida = document.getElementById('prazos-resultado');
  clear(saida);
  const cal = calendarioSeguimento(campo.value, regras);
  if (!cal) {
    campo.setAttribute('aria-invalid', 'true');
    saida.append(alerta('danger', 'Indica a data em que entregaste o pedido.'));
    return;
  }
  campo.removeAttribute('aria-invalid');
  const ics = h('button', { type: 'button', class: 'btn btn--secondary' }, 'Descarregar lembretes para o calendário (.ics)');
  ics.addEventListener('click', () => {
    descarregar(`lembretes-pedido-${cal.entrega}.ics`, gerarICS([
      { data: cal.limiteResposta, titulo: 'Fim do prazo de resposta ao pedido de documentos', descricao: `Pedido entregue em ${cal.entrega}. Se não houver resposta, podes insistir ou apresentar queixa à CADA. Confirma o prazo na fonte oficial.` },
      { data: cal.limiteQueixaSemResposta, titulo: 'Data estimada para a queixa à CADA', descricao: 'Estimativa sujeita a confirmação. Confirma o prazo da queixa no site da CADA.' }
    ]), 'text/calendar;charset=utf-8');
    estado('Ficheiro de calendário descarregado.');
  });
  const insistir = h('button', { type: 'button', class: 'btn btn--link' }, 'Preparar uma insistência');
  insistir.addEventListener('click', () => {
    form.elements.tipo.value = 'insistencia';
    atualizarTipo();
    form.elements.dataPedido.value = cal.entrega;
    form.elements.dataPedido.focus();
  });
  saida.append(
    h('dl', { class: 'deadlines' },
      h('dt', {}, 'Fim do prazo de resposta (estimativa)'), h('dd', {}, formatDate(cal.limiteResposta)),
      h('dt', {}, 'Data estimada para a queixa à CADA, se não houver resposta'), h('dd', {}, formatDate(cal.limiteQueixaSemResposta))),
    alerta('warning', 'Estimativa, não prazo oficial', h('p', {}, regras.contagem)),
    h('div', { class: 'actions' }, ics, insistir));
  anunciar(`Fim do prazo de resposta estimado: ${formatDate(cal.limiteResposta)}.`);
}

iniciar();
