// Catálogo de participação: estado efetivo e filtros. Funções puras.

import { parseDate, effectiveStatus, todayISO } from '../core/status.js';
import { safeUrl } from '../core/dom.js';

export const TIPOS_PARTICIPACAO = {
  'consulta-publica': 'Consulta pública',
  'discussao-publica': 'Discussão pública',
  'reuniao-publica': 'Reunião ou sessão pública',
  'orcamento-participativo': 'Orçamento participativo',
  'peticao': 'Petição'
};

/**
 * Estado do procedimento apresentado ao cidadão. Nunca diz «aberta» sem verificação editorial
 * e datas válidas: um registo por confirmar aparece como «Estado por confirmar».
 */
export function estadoProcedimento(op, today = todayISO()) {
  const { estado } = effectiveStatus(op, today);
  const prazo = parseDate(op.prazo);
  const abertura = parseDate(op.abertura);
  if (estado !== 'verificado' || !prazo) return { id: 'por-confirmar', rotulo: 'Estado por confirmar' };
  if (op.prazo < today) return { id: 'encerrada', rotulo: 'Encerrada' };
  if (abertura && op.abertura > today) return { id: 'brevemente', rotulo: 'Abre brevemente' };
  if (op.estadoProcedimento === 'aberta') return { id: 'aberta', rotulo: 'Aberta' };
  return { id: 'por-confirmar', rotulo: 'Estado por confirmar' };
}

/** Normaliza um registo; registos sem id/título ou arquivados são descartados. */
export function normalizar(op, today = todayISO()) {
  if (!op || typeof op.id !== 'string' || typeof op.titulo !== 'string') return null;
  if (op.estado === 'arquivado') return null;
  return { ...op, url: safeUrl(op.url), procedimento: estadoProcedimento(op, today) };
}

export function filtrar(lista, filtros = {}, today = todayISO()) {
  return lista
    .map((op) => normalizar(op, today))
    .filter(Boolean)
    .filter((op) => !filtros.municipio || op.municipio === filtros.municipio)
    .filter((op) => !filtros.tipo || op.tipo === filtros.tipo)
    .filter((op) => !filtros.entidade || op.entidade === filtros.entidade)
    .filter((op) => !filtros.estado || op.procedimento.id === filtros.estado)
    .filter((op) => !filtros.prazoAte || (parseDate(op.prazo) && op.prazo <= filtros.prazoAte))
    .sort((a, b) => ordem(a) - ordem(b) || String(a.prazo).localeCompare(String(b.prazo)));
}

const ORDEM = { aberta: 0, brevemente: 1, 'por-confirmar': 2, encerrada: 3 };
const ordem = (op) => ORDEM[op.procedimento.id] ?? 9;
