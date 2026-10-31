import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ler } from './helpers.mjs';
import { validar, gerarLADA, gerarInsistencia, gerarSenhorioObras, limpar, linhas, nomeFicheiro } from '../assets/js/lib/requerimento.js';

const { modalidades } = await ler('requerimento');
const base = { nome: 'Maria Silva', identificacao: 'Cartão de Cidadão n.º 12345678', morada: 'Rua A, 1, 1000-001 Lisboa', telefone: '210000000', local: 'Lisboa', data: '2026-10-31' };

test('LADA: campos obrigatórios em falta geram erros', () => {
  const erros = validar('lada', {});
  for (const c of ['entidade', 'documentos', 'modalidade', 'nome', 'identificacao', 'morada', 'local', 'data']) assert.ok(erros[c], c);
  assert.match(erros.email, /pelo menos um contacto/);
});

test('LADA e insistência exigem identificação e um contacto (art. 12.º, n.º 1); carta ao senhorio não', () => {
  const d = { ...base, entidade: 'IHRU', documentos: 'Ata', modalidade: 'consulta' };
  assert.deepEqual(validar('lada', d), {});
  assert.ok(validar('lada', { ...d, identificacao: '' }).identificacao);
  assert.ok(validar('lada', { ...d, telefone: '' }).email);
  assert.ok(validar('insistencia', { ...base, entidade: 'IHRU', dataPedido: '2026-09-01', identificacao: '' }).identificacao);
  const senhorio = { ...base, identificacao: '', telefone: '', destinatario: 'J', moradaImovel: 'R', problemas: 'P', prazoDias: '30' };
  assert.deepEqual(validar('senhorio-obras', senhorio), {});
});

test('LADA: cópia eletrónica exige e-mail válido', () => {
  const d = { ...base, entidade: 'Câmara Municipal de Lisboa', documentos: 'Ata', modalidade: 'copia-eletronica' };
  assert.ok(validar('lada', d, { modalidadeExigeEmail: true }).email);
  assert.ok(validar('lada', { ...d, email: 'nao-e-email' }, { modalidadeExigeEmail: true }).email);
  assert.deepEqual(validar('lada', { ...d, email: 'maria@exemplo.pt' }, { modalidadeExigeEmail: true }), {});
});

test('LADA: gera requerimento completo com lei, documentos numerados, modalidade e assinatura', () => {
  const d = { ...base, entidade: 'Câmara Municipal de Lisboa', documentos: '- Auto de vistoria de 2026\n2) Projeto de arquitetura\n\n', contexto: 'Prédio da Rua B, 3.', modalidade: 'consulta' };
  const t = gerarLADA(d, modalidades.find((m) => m.id === 'consulta'));
  assert.match(t, /Lei n\.º 26\/2016, de 22 de agosto/);
  assert.match(t, /1\. Auto de vistoria de 2026\n2\. Projeto de arquitetura/);
  assert.match(t, /consulta gratuita/);
  assert.match(t, /Lisboa, 31 de outubro de 2026/);
  assert.match(t, /expurgo/);
  assert.match(t, /_{10,}\nMaria Silva\n$/);
  assert.match(t, /Prédio da Rua B/);
  assert.match(t, /Maria Silva, titular do documento de identificação Cartão de Cidadão n\.º 12345678, residente em/);
});

test('insistência refere a data do pedido original e a CADA', () => {
  const t = gerarInsistencia({ ...base, entidade: 'IHRU', dataPedido: '2026-09-01', referencia: 'P-123' });
  assert.match(t, /1 de setembro de 2026 \(ref\.ª P-123\)/);
  assert.match(t, /CADA/);
});

test('carta ao senhorio não invoca a LADA e valida o prazo', () => {
  const d = { ...base, destinatario: 'João Costa', moradaImovel: 'Rua C, 2', problemas: 'Infiltração na cozinha', prazoDias: '30' };
  assert.deepEqual(validar('senhorio-obras', d), {});
  const t = gerarSenhorioObras(d);
  assert.doesNotMatch(t, /26\/2016/);
  assert.match(t, /prazo de 30 dias/);
  assert.ok(validar('senhorio-obras', { ...d, prazoDias: '0' }).prazoDias);
  assert.ok(validar('senhorio-obras', { ...d, prazoDias: '2.5' }).prazoDias);
});

test('inputs maliciosos são tratados como texto e caracteres de controlo removidos', () => {
  const mal = '<script>alert(1)</script>‮abc\u0000';
  assert.equal(limpar(mal), '<script>alert(1)</script>abc');
  const t = gerarLADA({ ...base, nome: mal, entidade: '"><img src=x>', documentos: mal, modalidade: 'consulta' }, modalidades[0]);
  assert.ok(!t.includes('‮') && !t.includes('\u0000'));
  assert.equal(linhas(Array(40).fill('x').join('\n')).length, 25);
  assert.equal(limpar('a'.repeat(5000), 160).length, 160);
});

test('datas inválidas são rejeitadas e nome do ficheiro é seguro', () => {
  assert.ok(validar('lada', { ...base, data: '2026-02-30' }).data);
  assert.equal(nomeFicheiro('lada', '2026-10-31'), 'pedido-acesso-documentos-2026-10-31.txt');
  assert.equal(nomeFicheiro('lada', '../../x'), 'pedido-acesso-documentos-sem-data.txt');
});

test('Q21: cláusulas do pedido LADA — remessa (CPA 41.º), expurgo (6.º, n.º 8) e fundamentação de recusa ou encargo', () => {
  const t = gerarLADA({ ...base, entidade: 'IHRU', documentos: 'Ata', modalidade: 'consulta' }, modalidades[0]);
  assert.match(t, /artigo 41\.º do Código do Procedimento Administrativo/);
  assert.match(t, /artigo 6\.º, n\.º 8/);
  assert.match(t, /recusa, total ou parcial, ou qualquer encargo/);
});

test('Q21: insistência mantém a data do pedido original e não reinicia prazos', () => {
  const t = gerarInsistencia({ ...base, entidade: 'IHRU', dataPedido: '2026-09-01' });
  assert.match(t, /mantém essa data de apresentação/);
  assert.match(t, /artigo 15\.º/);
});

test('Q21: carta ao senhorio pede calendário, reserva direitos e nunca anuncia desconto ou suspensão da renda', () => {
  const t = gerarSenhorioObras({ ...base, destinatario: 'J', moradaImovel: 'Rua C', problemas: 'Infiltração', prazoDias: '30', consequencias: 'Quarto inutilizável', desde: 'março de 2026' });
  assert.match(t, /respetivo calendário/);
  assert.match(t, /sem prejuízo dos direitos legalmente previstos/);
  assert.match(t, /Quarto inutilizável/);
  assert.doesNotMatch(t, /dedu|suspen|compensa|reter/i);
});

test('Q21: campos vazios não produzem factos inventados', () => {
  const t = gerarSenhorioObras({ ...base, destinatario: 'J', moradaImovel: 'Rua C', problemas: 'Infiltração', prazoDias: '30' });
  assert.doesNotMatch(t, /detetados em|afetam a utilização|undefined|null/);
});
