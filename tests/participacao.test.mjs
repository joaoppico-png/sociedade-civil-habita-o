import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ler } from './helpers.mjs';
import { filtrar, estadoProcedimento } from '../assets/js/lib/participacao.js';

const demo = (await ler('demo/oportunidades-demo')).oportunidades;
const publicaveis = (await ler('oportunidades')).oportunidades;
const hoje = '2026-10-31';

test('lista publicável está vazia e sem registos de demonstração', () => {
  assert.equal(publicaveis.length, 0);
  assert.deepEqual(filtrar(publicaveis, {}, hoje), []);
});

test('estados: aberta, encerrada pelo prazo, por confirmar sem verificação ou com datas inválidas', () => {
  const porId = Object.fromEntries(filtrar(demo, {}, hoje).map((o) => [o.id, o]));
  assert.equal(porId['demo-001'].procedimento.id, 'aberta');
  assert.equal(porId['demo-002'].procedimento.id, 'por-confirmar'); // revisão em atraso → desatualizado → nunca «aberta»
  assert.equal(porId['demo-003'].procedimento.id, 'por-confirmar');
  assert.equal(porId['demo-004'].procedimento.id, 'por-confirmar');
  assert.equal(porId['demo-003'].url, null); // javascript: rejeitado
});

test('encerrada quando o prazo passou e o registo está verificado', () => {
  const op = { ...demo[0], prazo: '2026-10-01', revisaoPrevista: '2026-12-31' };
  assert.equal(estadoProcedimento(op, hoje).id, 'encerrada');
});

test('filtros por município, tipo, entidade, estado e prazo', () => {
  assert.deepEqual(filtrar(demo, { municipio: 'lisboa' }, hoje).map((o) => o.id).sort(), ['demo-001', 'demo-002']);
  assert.deepEqual(filtrar(demo, { tipo: 'reuniao-publica' }, hoje).map((o) => o.id), ['demo-002']);
  assert.deepEqual(filtrar(demo, { entidade: 'governo' }, hoje).map((o) => o.id).sort(), ['demo-003', 'demo-004']);
  assert.deepEqual(filtrar(demo, { estado: 'aberta' }, hoje).map((o) => o.id), ['demo-001']);
  assert.deepEqual(filtrar(demo, { prazoAte: '2026-11-30' }, hoje).map((o) => o.id).sort(), ['demo-002', 'demo-003']);
});

test('registos arquivados ou malformados são descartados', () => {
  assert.equal(filtrar([{ ...demo[0], estado: 'arquivado' }, { id: 1 }, null], {}, hoje).length, 0);
});
