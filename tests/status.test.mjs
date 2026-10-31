import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseDate, formatDate, effectiveStatus, isDisplayable } from '../assets/js/core/status.js';

test('parseDate rejeita datas inválidas', () => {
  for (const v of ['2026-13-45', '2026-02-30', 'data-invalida', '', null, 20261031, '31-10-2026']) assert.equal(parseDate(v), null, String(v));
  assert.ok(parseDate('2028-02-29'));
});

test('formatDate em português', () => {
  assert.equal(formatDate('2026-10-31'), '31 de outubro de 2026');
  assert.equal(formatDate('x'), null);
});

test('verificado com revisão em atraso passa a desatualizado e deixa de ser apresentado', () => {
  const r = { estado: 'verificado', verificadoEm: '2025-01-01', revisaoPrevista: '2026-01-01' };
  const s = effectiveStatus(r, '2026-10-31');
  assert.equal(s.estado, 'desatualizado');
  assert.ok(s.avisos.includes('revisao-em-atraso'));
  assert.equal(isDisplayable(r, { mostrarPorConfirmar: true }, '2026-10-31'), false);
});

test('verificado sem data de verificação válida é tratado como por confirmar', () => {
  const s = effectiveStatus({ estado: 'verificado', verificadoEm: 'ontem', revisaoPrevista: '2027-01-01' }, '2026-10-31');
  assert.equal(s.estado, 'por-confirmar');
});

test('estado desconhecido é tratado como por confirmar', () => {
  assert.equal(effectiveStatus({ estado: 'aprovado' }, '2026-10-31').estado, 'por-confirmar');
});

test('data de revisão inválida gera aviso', () => {
  assert.ok(effectiveStatus({ estado: 'por-confirmar', revisaoPrevista: '2026-99-01' }).avisos.includes('data-revisao-invalida'));
});
