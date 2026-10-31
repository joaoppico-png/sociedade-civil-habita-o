import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ler } from './helpers.mjs';
import { questoesDe, validarQuestoes } from '../assets/js/lib/questoes.js';

const q = await ler('questoes-juridicas');
const arvore = await ler('arvore');
const requerimento = await ler('requerimento');

test('questões jurídicas válidas e ligadas a registos existentes', () => {
  assert.deepEqual(validarQuestoes(q, arvore, requerimento), []);
});

test('fichas de maior risco têm questões associadas', () => {
  for (const id of ['r-despejo', 'r-despejo-notificacao', 'r-despejo-apoiado', 'r-pedir-documentos', 'r-conservacao']) {
    assert.ok(questoesDe(id, q.questoes).length > 0, id);
  }
});

test('só sai das fichas com parecer de advogado E aplicação no site; validada exige parecer assinado', () => {
  const base = { id: 'Q90', tema: 't', pergunta: 'p', registos: ['r-despejo'], estadoInvestigacao: 'respondida', investigacoes: [{}] };
  assert.equal(questoesDe('r-despejo', [{ ...base, estadoValidacaoProfissional: 'pendente', estadoAplicacaoSite: 'aplicada' }]).length, 1);
  assert.equal(questoesDe('r-despejo', [{ ...base, estadoValidacaoProfissional: 'validada', estadoAplicacaoSite: 'parcial' }]).length, 1);
  assert.equal(questoesDe('r-despejo', [{ ...base, estadoValidacaoProfissional: 'validada', estadoAplicacaoSite: 'aplicada' }]).length, 0);
  const erros = validarQuestoes({ questoes: [{ ...base, id: 'Q91', registos: ['inexistente'], estadoValidacaoProfissional: 'validada', estadoAplicacaoSite: 'x', parecerAssinado: null }] }, arvore, requerimento);
  assert.ok(erros.some((e) => /validada sem parecer assinado/.test(e)));
  assert.ok(erros.some((e) => /estadoAplicacaoSite inválido/.test(e)));
  assert.ok(erros.some((e) => /registo desconhecido/.test(e)));
});

test('nenhuma questão aparece como validada sem parecer assinado', () => {
  for (const x of q.questoes) assert.ok(x.estadoValidacaoProfissional !== 'validada' || x.parecerAssinado?.advogado, x.id);
});
