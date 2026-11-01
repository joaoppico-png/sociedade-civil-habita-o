import { test } from 'node:test';
import assert from 'node:assert/strict';
import { easterSunday, feriadosNacionais, somarDiasUteis, somarDiasCorridos, calendarioSeguimento, datasComTolerancia, gerarICS } from '../assets/js/lib/prazos.js';

test('Páscoa e feriados móveis', () => {
  assert.equal(easterSunday(2026).toISOString().slice(0, 10), '2026-04-05');
  assert.equal(easterSunday(2027).toISOString().slice(0, 10), '2027-03-28');
  const f = feriadosNacionais(2026);
  assert.ok(f.has('2026-04-03')); // Sexta-feira Santa
  assert.ok(f.has('2026-06-04')); // Corpo de Deus
  assert.ok(f.has('2026-12-08'));
});

test('10 dias úteis contam fins de semana e feriados', () => {
  // Entrega na sexta 30/10/2026; 1/11 é domingo (feriado ao domingo); 10 úteis → 13/11.
  assert.equal(somarDiasUteis('2026-10-30', 10), '2026-11-13');
  // Entrega a 27/11/2026: 1/12 e 8/12 são feriados (terças) → 15/12.
  assert.equal(somarDiasUteis('2026-11-27', 10), '2026-12-15');
  assert.equal(somarDiasUteis('data', 10), null);
});

test('calendário de seguimento e ficheiro .ics', () => {
  const cal = calendarioSeguimento('2026-10-30', { prazoRespostaDiasUteis: 10, prazoQueixaCADADias: 20 });
  assert.equal(cal.limiteResposta, '2026-11-13');
  // Queixa: só a partir do dia seguinte ao fim da resposta; 20 dias corridos (Parecer CADA, Proc. 518/2026).
  assert.equal(cal.queixaDesde, '2026-11-14');
  assert.equal(cal.limiteQueixaSemResposta, '2026-12-03');
  const ics = gerarICS([{ data: cal.limiteResposta, titulo: 'Prazo; teste, 1', descricao: 'linha\nnova' }], new Date('2026-10-31T10:00:00Z'));
  assert.match(ics, /BEGIN:VCALENDAR\r\n/);
  assert.match(ics, /DTSTART;VALUE=DATE:20261113\r\nDTEND;VALUE=DATE:20261114/);
  assert.ok(ics.includes(String.raw`SUMMARY:Prazo\; teste\, 1`));
  assert.ok(ics.includes(String.raw`DESCRIPTION:linha\nnova`));
  assert.match(ics, /TRIGGER:-P1D/);
});

test('20 dias corridos passam para o dia útil seguinte se terminarem em fim de semana ou feriado', () => {
  assert.equal(somarDiasCorridos('2026-11-16', 20), '2026-12-07'); // domingo 6/12 → segunda 7/12
  assert.equal(somarDiasCorridos('2026-11-11', 20), '2026-12-02'); // 1/12 feriado → 2/12
  assert.equal(somarDiasCorridos('x', 20), null);
});

test('caso do Parecer CADA 250/2025: pedido a 23/04/2025 → resposta até 09/05/2025', () => {
  assert.equal(somarDiasUteis('2025-04-23', 10), '2025-05-09');
});

test('caso do Acórdão TCAS citado no Parecer CADA 518/2026: pedido 02/01/2025 → resposta 16/01 → 20 dias até 05/02/2025', () => {
  const cal = calendarioSeguimento('2025-01-02', { prazoRespostaDiasUteis: 10, prazoQueixaCADADias: 20 });
  assert.equal(cal.limiteResposta, '2025-01-16');
  assert.equal(cal.limiteQueixaSemResposta, '2025-02-05');
});

test('datasComTolerancia: assinala 24/12 e 31/12 úteis dentro do prazo', () => {
  assert.deepEqual(datasComTolerancia('2026-12-23', '2027-01-08').map((d) => d.data), ['2026-12-24', '2026-12-31']);
});

test('datasComTolerancia: Carnaval de 2027 (9 de fevereiro) e fora do intervalo', () => {
  assert.deepEqual(datasComTolerancia('2027-02-01', '2027-02-20'), [{ data: '2027-02-09', motivo: 'Carnaval' }]);
  assert.deepEqual(datasComTolerancia('2027-03-01', '2027-04-01'), []);
  assert.deepEqual(datasComTolerancia('2027-02-09', '2027-02-20'), [], 'o dia inicial não conta');
});

test('datasComTolerancia: ignora 24/12 ao fim de semana e datas inválidas', () => {
  assert.deepEqual(datasComTolerancia('2028-12-20', '2028-12-26').length, 0); // 24/12/2028 é domingo
  assert.deepEqual(datasComTolerancia('x', '2027-01-01'), []);
});
