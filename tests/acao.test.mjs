import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ler } from './helpers.mjs';
import { indexTree, walk, resolveResultado } from '../assets/js/lib/decision.js';
import { construirCartao } from '../assets/js/lib/acao.js';
import { safeMailto } from '../assets/js/core/dom.js';

const arvore = await ler('arvore');
const municipios = await ler('municipios');
const entidades = new Map((await ler('entidades')).entidades.map((e) => [e.id, e]));
const questoes = (await ler('questoes-juridicas')).questoes;
const tree = indexTree(arvore);
const ficha = (caminho) => { const w = walk(tree, caminho, municipios); return resolveResultado(tree.resultados.get(w.resultadoId), w.contexto, municipios); };

test('acesso de urgência leva aos três percursos de saída', () => {
  for (const [o, id] of [['carta-senhorio', 'carta-data'], ['notificacao', null], ['apoiado', 'apoiado-concelho']]) {
    const w = walk(tree, ['urgente', o], municipios);
    if (id) assert.equal(w.atual.id, id);
    else assert.equal(w.resultadoId, 'r-despejo-notificacao');
  }
});

test('cartão: só a notificação do BAS mostra prazo; todos os percursos de saída são urgentes', () => {
  const bas = construirCartao(ficha(['urgente', 'notificacao']), entidades, questoes);
  assert.match(bas.prazo.texto, /15 dias/);
  assert.ok(bas.urgente);
  assert.ok(bas.porVerificar.includes('Q14'));
  const carta = construirCartao(ficha(['urgente', 'carta-senhorio', 'depois-2006', 'renovacao']), entidades, questoes);
  assert.equal(carta.prazo, null);
  assert.ok(carta.urgente);
  const contrato = construirCartao(ficha(['arrendada', 'inquilino', 'contrato']), entidades, questoes);
  assert.equal(contrato.urgente, false);
  assert.ok(contrato.entidade && contrato.acao);
});

test('cartão: todas as fichas têm entidade e primeiro passo', () => {
  for (const r of arvore.resultados) {
    const c = construirCartao(resolveResultado(r, {}, municipios), entidades, questoes);
    assert.ok(c.acao, r.id);
  }
});

test('mailto de correções só com endereço válido', () => {
  assert.equal(safeMailto(null), null);
  assert.equal(safeMailto('javascript:alert(1)'), null);
  assert.equal(safeMailto('a@b.pt', 'Erro na ficha: X'), 'mailto:a@b.pt?subject=Erro%20na%20ficha%3A%20X');
});
