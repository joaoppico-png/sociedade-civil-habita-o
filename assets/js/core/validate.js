// Validação dos ficheiros de dados. Partilhada pelo browser (descarta registos inválidos)
// e por tools/validate-data.mjs (falha a publicação). Devolve listas de erros legíveis.

import { ESTADOS, parseDate } from './status.js';
import { safeUrl, safeInternalHref } from './dom.js';

const ID = /^[a-z0-9][a-z0-9-]{0,60}$/;

function meta(registo, onde, erros, { exigeVerificacao = true } = {}) {
  if (!ID.test(registo?.id ?? '')) erros.push(`${onde}: id inválido «${registo?.id}»`);
  if (!ESTADOS[registo?.estado]) erros.push(`${onde}: estado inválido «${registo?.estado}»`);
  if (!exigeVerificacao) return;
  if (registo.estado === 'verificado' && !parseDate(registo.verificadoEm)) erros.push(`${onde}: «verificado» sem verificadoEm válido`);
  if (registo.verificadoEm !== null && registo.verificadoEm !== undefined && !parseDate(registo.verificadoEm)) erros.push(`${onde}: verificadoEm inválido`);
  if (!parseDate(registo.revisaoPrevista)) erros.push(`${onde}: revisaoPrevista inválida`);
  if (typeof registo.responsavel !== 'string' || !registo.responsavel) erros.push(`${onde}: falta responsavel`);
}

function unicos(lista, onde, erros) {
  const vistos = new Set();
  for (const r of lista) {
    if (vistos.has(r.id)) erros.push(`${onde}: id duplicado «${r.id}»`);
    vistos.add(r.id);
  }
  return vistos;
}

export function validarFontes(dados) {
  const erros = [];
  const fontes = dados?.fontes;
  if (!Array.isArray(fontes)) return ['fontes.json: falta a lista «fontes»'];
  unicos(fontes, 'fontes', erros);
  for (const f of fontes) {
    const onde = `fonte ${f.id}`;
    meta(f, onde, erros);
    if (!f.titulo) erros.push(`${onde}: falta título`);
    if (f.url !== null && !safeUrl(f.url)) erros.push(`${onde}: URL inválido`);
    if (f.estado === 'verificado' && !f.url) erros.push(`${onde}: verificada sem URL`);
    if (f.dataPublicacao && !parseDate(f.dataPublicacao)) erros.push(`${onde}: dataPublicacao inválida`);
  }
  return erros;
}

export function validarEntidades(dados, idsFontes) {
  const erros = [];
  const lista = dados?.entidades;
  if (!Array.isArray(lista)) return ['entidades.json: falta a lista «entidades»'];
  unicos(lista, 'entidades', erros);
  for (const e of lista) {
    const onde = `entidade ${e.id}`;
    meta(e, onde, erros);
    if (!e.nome || !e.competencias) erros.push(`${onde}: falta nome ou competências`);
    for (const f of e.fontes || []) if (!idsFontes.has(f)) erros.push(`${onde}: fonte desconhecida «${f}»`);
    if (e.contacto?.fonte && !idsFontes.has(e.contacto.fonte)) erros.push(`${onde}: fonte de contacto desconhecida`);
  }
  return erros;
}

export function validarArvore(arvore, idsEntidades, idsFontes) {
  const erros = [];
  const perguntas = new Map((arvore?.perguntas || []).map((p) => [p.id, p]));
  const resultados = new Map((arvore?.resultados || []).map((r) => [r.id, r]));
  unicos(arvore?.perguntas || [], 'perguntas', erros);
  unicos(arvore?.resultados || [], 'resultados', erros);
  if (!perguntas.has(arvore?.inicio)) erros.push('árvore: pergunta inicial inexistente');

  const destino = (onde, o) => {
    if (o.resultado && !resultados.has(o.resultado)) erros.push(`${onde}: resultado inexistente «${o.resultado}»`);
    if (!o.resultado && !perguntas.has(o.seguinte)) erros.push(`${onde}: pergunta seguinte inexistente «${o.seguinte}»`);
  };
  for (const p of perguntas.values()) {
    if (!p.texto) erros.push(`pergunta ${p.id}: falta texto`);
    if (p.tipo === 'municipio') destino(`pergunta ${p.id}`, p);
    else {
      if (!Array.isArray(p.opcoes) || p.opcoes.length < 1) erros.push(`pergunta ${p.id}: sem opções`);
      for (const o of p.opcoes || []) {
        if (!ID.test(o.id ?? '')) erros.push(`pergunta ${p.id}: opção com id inválido`);
        destino(`pergunta ${p.id} → ${o.id}`, o);
      }
    }
  }
  for (const r of resultados.values()) {
    const onde = `resultado ${r.id}`;
    meta(r, onde, erros);
    if (!r.titulo || !r.resumo) erros.push(`${onde}: falta título ou resumo`);
    if (!Array.isArray(r.fontes) || r.fontes.length === 0) erros.push(`${onde}: sem fontes`);
    for (const f of r.fontes || []) if (!idsFontes.has(f)) erros.push(`${onde}: fonte desconhecida «${f}»`);
    for (const g of r.regras || []) if (!idsFontes.has(g.fonte)) erros.push(`${onde}: regra sem fonte válida`);
    if (!Array.isArray(r.entidades) || r.entidades.length === 0) erros.push(`${onde}: sem entidades`);
    for (const e of r.entidades || []) if (!idsEntidades.has(e.id)) erros.push(`${onde}: entidade desconhecida «${e.id}»`);
    if (!Array.isArray(r.passos) || r.passos.length === 0) erros.push(`${onde}: sem passos`);
    if (r.cartao?.prazo && !idsFontes.has(r.cartao.prazo.fonte)) erros.push(`${onde}: prazo do cartão sem fonte válida`);
    for (const campo of ['passos', 'limitacoes', 'documentos']) {
      for (const x of r[campo] || []) {
        if (typeof x !== 'string' && (typeof x?.texto !== 'string' || typeof x?.se !== 'object')) erros.push(`${onde}: item inválido em ${campo}`);
      }
    }
    for (const a of r.acoes || []) {
      if (a.fonte && !idsFontes.has(a.fonte)) erros.push(`${onde}: ação com fonte desconhecida`);
      if (a.href && !safeInternalHref(a.href.replace(/\{\w+\}/g, 'x'))) erros.push(`${onde}: ação com ligação interna inválida`);
      if (!a.fonte && !a.href) erros.push(`${onde}: ação sem destino`);
    }
  }
  return erros;
}

export function validarOportunidades(dados, idsEntidades) {
  const erros = [];
  const lista = dados?.oportunidades;
  if (!Array.isArray(lista)) return ['oportunidades: falta a lista «oportunidades»'];
  unicos(lista, 'oportunidades', erros);
  for (const o of lista) {
    const onde = `oportunidade ${o.id}`;
    meta(o, onde, erros);
    if (!o.titulo || !o.descricao) erros.push(`${onde}: falta título ou descrição`);
    if (!safeUrl(o.url)) erros.push(`${onde}: URL oficial inválido ou em falta`);
    if (!parseDate(o.abertura)) erros.push(`${onde}: data de abertura inválida`);
    if (!parseDate(o.prazo)) erros.push(`${onde}: prazo inválido`);
    if (idsEntidades && !idsEntidades.has(o.entidade)) erros.push(`${onde}: entidade desconhecida «${o.entidade}»`);
  }
  return erros;
}

export function validarTudo({ fontes, entidades, arvore, oportunidades }) {
  const idsFontes = new Set((fontes?.fontes || []).map((f) => f.id));
  const idsEntidades = new Set((entidades?.entidades || []).map((e) => e.id));
  return [
    ...validarFontes(fontes),
    ...validarEntidades(entidades, idsFontes),
    ...validarArvore(arvore, idsEntidades, idsFontes),
    ...(oportunidades ? validarOportunidades(oportunidades, idsEntidades) : [])
  ];
}
