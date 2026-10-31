import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ler } from './helpers.mjs';
import { validarTudo, validarFontes, validarArvore } from '../assets/js/core/validate.js';

const dados = { fontes: await ler('fontes'), entidades: await ler('entidades'), arvore: await ler('arvore'), oportunidades: await ler('oportunidades') };

test('os dados publicáveis são válidos', () => {
  assert.deepEqual(validarTudo(dados), []);
});

test('deteta URL inválido, fonte verificada sem URL e datas inválidas', () => {
  const erros = validarFontes({ fontes: [
    { id: 'a', titulo: 'A', url: 'javascript:alert(1)', estado: 'por-confirmar', verificadoEm: null, revisaoPrevista: '2027-01-01', responsavel: 'x' },
    { id: 'b', titulo: 'B', url: null, estado: 'verificado', verificadoEm: '2026-10-31', revisaoPrevista: '2027-01-01', responsavel: 'x' },
    { id: 'c', titulo: 'C', url: null, estado: 'verificado', verificadoEm: '2026-02-30', revisaoPrevista: 'nunca', responsavel: 'x' }
  ] });
  assert.ok(erros.some((e) => /fonte a: URL inválido/.test(e)));
  assert.ok(erros.some((e) => /fonte b: verificada sem URL/.test(e)));
  assert.ok(erros.some((e) => /fonte c: .*verificadoEm/.test(e)));
  assert.ok(erros.some((e) => /fonte c: revisaoPrevista/.test(e)));
});

test('deteta referências partidas na árvore', () => {
  const arvore = structuredClone(dados.arvore);
  arvore.perguntas[0].opcoes[0].seguinte = 'nao-existe';
  arvore.resultados[0].entidades.push({ id: 'fantasma' });
  arvore.resultados[0].acoes.push({ rotulo: 'x', href: 'javascript:alert(1)' });
  const erros = validarArvore(arvore, new Set(dados.entidades.entidades.map((e) => e.id)), new Set(dados.fontes.fontes.map((f) => f.id)));
  assert.ok(erros.some((e) => /pergunta seguinte inexistente/.test(e)));
  assert.ok(erros.some((e) => /entidade desconhecida «fantasma»/.test(e)));
  assert.ok(erros.some((e) => /ligação interna inválida/.test(e)));
});
