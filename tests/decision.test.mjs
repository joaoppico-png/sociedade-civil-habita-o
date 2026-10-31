import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ler } from './helpers.mjs';
import { indexTree, walk, todosOsCaminhos, resolveResultado, parseCaminho } from '../assets/js/lib/decision.js';
import { isDisplayable } from '../assets/js/core/status.js';

const arvore = await ler('arvore');
const municipios = await ler('municipios');
const entidades = await ler('entidades');
const tree = indexTree(arvore);
const idsEntidades = new Set(entidades.entidades.map((e) => e.id));

test('todos os caminhos da árvore chegam a um resultado existente', () => {
  const caminhos = todosOsCaminhos(tree, municipios);
  assert.ok(caminhos.length >= 20, `esperava ≥20 caminhos, obtive ${caminhos.length}`);
  for (const { caminho, resultadoId } of caminhos) {
    const r = walk(tree, caminho, municipios);
    assert.equal(r.invalido, false, caminho.join(','));
    assert.equal(r.resultadoId, resultadoId);
    assert.ok(tree.resultados.has(resultadoId));
  }
});

test('todos os resultados são alcançáveis', () => {
  const alcancados = new Set(todosOsCaminhos(tree, municipios).map((c) => c.resultadoId));
  for (const id of tree.resultados.keys()) assert.ok(alcancados.has(id), `resultado inalcançável: ${id}`);
});

test('cada caminho resolvido tem pelo menos uma entidade conhecida e uma fonte', () => {
  for (const { caminho, resultadoId } of todosOsCaminhos(tree, municipios)) {
    const { contexto } = walk(tree, caminho, municipios);
    const r = resolveResultado(tree.resultados.get(resultadoId), contexto, municipios);
    assert.ok(r.entidades.length > 0, caminho.join(','));
    for (const e of r.entidades) assert.ok(idsEntidades.has(e.id));
    assert.ok(r.fontes.length > 0);
  }
});

test('Lisboa mostra entidades municipais de Lisboa; outro concelho mostra aviso de cobertura', () => {
  const lx = walk(tree, ['arrendada', 'inquilino', 'conservacao', 'lisboa'], municipios);
  const rLx = resolveResultado(tree.resultados.get(lx.resultadoId), lx.contexto, municipios);
  assert.ok(rLx.entidades.some((e) => e.id === 'cm-lisboa'));
  assert.ok(!rLx.entidades.some((e) => e.id === 'camara-municipal'));
  assert.equal(rLx.semCobertura, false);
  assert.ok(rLx.acoes.some((a) => a.href === 'pedir-documentos.html?entidade=cm-lisboa'));

  const ou = walk(tree, ['arrendada', 'inquilino', 'conservacao', 'outro'], municipios);
  const rOu = resolveResultado(tree.resultados.get(ou.resultadoId), ou.contexto, municipios);
  assert.ok(rOu.entidades.some((e) => e.id === 'camara-municipal'));
  assert.equal(rOu.semCobertura, true);
  assert.match(rOu.notaCobertura, /Ainda não temos informação municipal/);
});

test('morador municipal em Lisboa encaminha para a Gebalis', () => {
  const w = walk(tree, ['responsavel', 'morador-municipal', 'lisboa'], municipios);
  const r = resolveResultado(tree.resultados.get(w.resultadoId), w.contexto, municipios);
  assert.ok(r.entidades.some((e) => e.id === 'gebalis'));
  assert.ok(r.acoes.some((a) => a.href === 'pedir-documentos.html?entidade=gebalis'));
});

test('retroceder: um caminho parcial devolve a pergunta certa', () => {
  const w = walk(tree, ['arrendada', 'inquilino'], municipios);
  assert.equal(w.atual.id, 'inquilino-problema');
  assert.equal(w.resultadoId, null);
});

test('caminhos inválidos são cortados sem erro', () => {
  const w = walk(tree, ['arrendada', 'inexistente', 'x'], municipios);
  assert.equal(w.invalido, true);
  assert.equal(w.atual.id, 'arrendada-relacao');
  assert.deepEqual(parseCaminho('<script>,arrendada,../x,' + 'a'.repeat(80)), ['arrendada']);
});

test('sem informação verificada não há resultado quando a política o exige', () => {
  const r = tree.resultados.get('r-conservacao');
  assert.equal(isDisplayable(r, { mostrarPorConfirmar: false }, '2026-10-31'), false);
  assert.equal(isDisplayable(r, { mostrarPorConfirmar: true }, '2026-10-31'), true);
  assert.equal(isDisplayable({ ...r, estado: 'arquivado' }, { mostrarPorConfirmar: true }, '2026-10-31'), false);
});

test('Q13: a carta para sair mostra só as regras do motivo indicado e avisa sobre contratos antigos', () => {
  const base = ['arrendada', 'inquilino', 'saida', 'carta-senhorio'];
  const res = (data, motivo) => { const w = walk(tree, [...base, data, motivo], municipios); return resolveResultado(tree.resultados.get(w.resultadoId), w.contexto, municipios); };
  const ren = res('depois-2006', 'renovacao');
  assert.ok(ren.regras.some((g) => /1097/.test(g.referencia)));
  assert.ok(!ren.regras.some((g) => /1101/.test(g.referencia)));
  const rendas = res('antes-1990', 'rendas');
  assert.ok(rendas.regras.some((g) => /1084/.test(g.referencia)));
  assert.ok(!rendas.regras.some((g) => /1097/.test(g.referencia)));
  assert.ok(rendas.limitacoes.some((l) => /anterior a novembro de 1990/.test(l)));
  assert.ok(rendas.regras.some((g) => /1041/.test(g.referencia)) && rendas.regras.some((g) => /1048/.test(g.referencia)));
  const den = res('antes-1990', 'denuncia');
  assert.ok(den.regras.some((g) => /28\.º, n\.º 2/.test(g.referencia)));
  assert.ok(!res('depois-2006', 'denuncia').regras.some((g) => /28\.º, n\.º 2/.test(g.referencia)));
  assert.ok(rendas.passos.every((p) => typeof p === 'string'));
});

test('Q05–Q07: quatro percursos para pedir documentos ou dados', () => {
  const ids = ['concluido', 'meu-processo', 'processo-terceiro', 'dados'].map((o) => walk(tree, ['documentos', o], municipios).resultadoId);
  assert.deepEqual(ids, ['r-pedir-documentos', 'r-processo-proprio', 'r-processo-terceiro', 'r-dados-pessoais']);
});
