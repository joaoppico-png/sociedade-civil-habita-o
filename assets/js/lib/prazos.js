// Contagem de prazos em dias úteis (feriados nacionais obrigatórios). Funções puras.
// A regra jurídica de contagem está em data/requerimento.json → seguimento (estado por confirmar).

import { parseDate } from '../core/status.js';

/** Domingo de Páscoa (algoritmo de Meeus/Jones/Butcher), em UTC. */
export function easterSunday(year) {
  const a = year % 19, b = Math.floor(year / 100), c = year % 100;
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3), hh = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - hh - k) % 7;
  const m = Math.floor((a + 11 * hh + 22 * l) / 451);
  const month = Math.floor((hh + l - 7 * m + 114) / 31);
  const day = ((hh + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day));
}

const iso = (date) => date.toISOString().slice(0, 10);
const addDays = (date, n) => new Date(date.getTime() + n * 86400000);

/** Feriados nacionais obrigatórios (Código do Trabalho, art. 234.º — por confirmar). */
export function feriadosNacionais(year) {
  const pascoa = easterSunday(year);
  const fixos = ['01-01', '04-25', '05-01', '06-10', '08-15', '10-05', '11-01', '12-01', '12-08', '12-25']
    .map((md) => `${year}-${md}`);
  return new Set([...fixos, iso(addDays(pascoa, -2)), iso(pascoa), iso(addDays(pascoa, 60))]);
}

export function isDiaUtil(date) {
  const dow = date.getUTCDay();
  if (dow === 0 || dow === 6) return false;
  return !feriadosNacionais(date.getUTCFullYear()).has(iso(date));
}

/** Soma n dias úteis a uma data «AAAA-MM-DD» (o dia inicial não conta). Devolve «AAAA-MM-DD» ou null. */
export function somarDiasUteis(inicio, n) {
  const start = parseDate(inicio);
  if (!start || !Number.isInteger(n) || n < 0) return null;
  let date = start, count = 0;
  while (count < n) {
    date = addDays(date, 1);
    if (isDiaUtil(date)) count += 1;
  }
  return iso(date);
}

/**
 * Soma n dias corridos (o dia inicial não conta). Se o último dia não for útil,
 * o prazo passa para o primeiro dia útil seguinte (regra dos prazos processuais).
 */
export function somarDiasCorridos(inicio, n) {
  const start = parseDate(inicio);
  if (!start || !Number.isInteger(n) || n < 0) return null;
  let date = addDays(start, n);
  while (!isDiaUtil(date)) date = addDays(date, 1);
  return iso(date);
}

/**
 * Calendário de seguimento de um pedido LADA entregue numa data.
 * Resposta: dias úteis (CPA, art. 87.º). Queixa à CADA: dias corridos, contados a partir do
 * dia seguinte ao fim do prazo de resposta; antes disso a queixa é intempestiva.
 */
export function calendarioSeguimento(dataEntrega, regras) {
  const limiteResposta = somarDiasUteis(dataEntrega, regras.prazoRespostaDiasUteis);
  if (!limiteResposta) return null;
  return {
    entrega: dataEntrega,
    limiteResposta,
    queixaDesde: iso(addDays(parseDate(limiteResposta), 1)),
    limiteQueixaSemResposta: somarDiasCorridos(limiteResposta, regras.prazoQueixaCADADias)
  };
}

function icsDate(isoDate) { return isoDate.replace(/-/g, ''); }
function icsEscape(text) {
  return String(text).replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1');
}

/** Ficheiro iCalendar com eventos de dia inteiro e alarme na véspera. Sem dados pessoais. */
export function gerarICS(eventos, agora = new Date()) {
  const stamp = agora.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const linhas = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Sociedade Civil Habitacao//Seguimento//PT', 'CALSCALE:GREGORIAN'];
  eventos.forEach((ev, i) => {
    const fim = icsDate(iso(addDays(parseDate(ev.data), 1)));
    linhas.push('BEGIN:VEVENT', `UID:${icsDate(ev.data)}-${i}@sociedade-civil-habitacao`, `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${icsDate(ev.data)}`, `DTEND;VALUE=DATE:${fim}`,
      `SUMMARY:${icsEscape(ev.titulo)}`, `DESCRIPTION:${icsEscape(ev.descricao)}`,
      'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${icsEscape(ev.titulo)}`, 'TRIGGER:-P1D', 'END:VALARM',
      'END:VEVENT');
  });
  linhas.push('END:VCALENDAR');
  return linhas.join('\r\n') + '\r\n';
}

