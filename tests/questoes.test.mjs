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

test('questões aplicadas deixam de aparecer nas fichas; respondida exige resposta', () => {
  const qs = [{ id: 'Q90', tema: 't', pergunta: 'p', estado: 'aplicada', resposta: 'sim', registos: ['r-despejo'] }];
  assert.equal(questoesDe('r-despejo', qs).length, 0);
  const erros = validarQuestoes({ questoes: [{ id: 'Q91', tema: 't', pergunta: 'p', estado: 'respondida', resposta: null, registos: ['inexistente'] }] }, arvore, requerimento);
  assert.ok(erros.some((e) => /sem resposta/.test(e)));
  assert.ok(erros.some((e) => /registo desconhecido/.test(e)));
});
