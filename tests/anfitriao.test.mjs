import { test } from 'node:test';
import assert from 'node:assert/strict';
import { anfitriaoPermitido } from '../assets/js/lib/anfitriao.js';

const propria = 'https://sociedadecivil.pt';

test('aceita a própria origem, sociedadecivil.pt e a pré-visualização do Claude', () => {
  assert.equal(anfitriaoPermitido('https://sociedadecivil.pt', propria), true);
  assert.equal(anfitriaoPermitido('https://www.sociedadecivil.pt', propria), true);
  assert.equal(anfitriaoPermitido('http://localhost:8080', 'http://localhost:8080'), true);
  assert.equal(anfitriaoPermitido('https://claude.ai', propria), true);
  assert.equal(anfitriaoPermitido('https://abc.claudeusercontent.com', propria), true);
});

test('recusa outros sites e imitações do domínio', () => {
  assert.equal(anfitriaoPermitido('https://exemplo.com', propria), false);
  assert.equal(anfitriaoPermitido('https://sociedadecivil.pt.exemplo.com', propria), false);
  assert.equal(anfitriaoPermitido('https://falsoclaude.ai', propria), false);
  assert.equal(anfitriaoPermitido('http://claude.ai', propria), false);
  assert.equal(anfitriaoPermitido('null', propria), false);
});

test('origem desconhecida é aceite (sem informação para decidir)', () => {
  assert.equal(anfitriaoPermitido(null, propria), true);
  assert.equal(anfitriaoPermitido('', propria), true);
});
