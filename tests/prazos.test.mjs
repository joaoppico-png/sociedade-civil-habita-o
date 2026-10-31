import { test } from 'node:test';
import assert from 'node:assert/strict';
import { easterSunday, feriadosNacionais, somarDiasUteis, calendarioSeguimento, gerarICS } from '../assets/js/lib/prazos.js';

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
  assert.equal(cal.limiteQueixaSemResposta, '2026-12-15');
  const ics = gerarICS([{ data: cal.limiteResposta, titulo: 'Prazo; teste, 1', descricao: 'linha\nnova' }], new Date('2026-10-31T10:00:00Z'));
  assert.match(ics, /BEGIN:VCALENDAR\r\n/);
  assert.match(ics, /DTSTART;VALUE=DATE:20261113\r\nDTEND;VALUE=DATE:20261114/);
  assert.ok(ics.includes(String.raw`SUMMARY:Prazo\; teste\, 1`));
  assert.ok(ics.includes(String.raw`DESCRIPTION:linha\nnova`));
  assert.match(ics, /TRIGGER:-P1D/);
});
