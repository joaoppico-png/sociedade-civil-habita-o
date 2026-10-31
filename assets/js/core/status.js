// Estados editoriais e datas. Funções puras: usadas no browser e nos testes Node.

export const ESTADOS = {
  'verificado': { rotulo: 'Conferido pela equipa', tom: 'success' },
  'por-confirmar': { rotulo: 'Por confirmar', tom: 'warning' },
  'desatualizado': { rotulo: 'Desatualizado', tom: 'danger' },
  'arquivado': { rotulo: 'Arquivado', tom: 'neutral' }
};

/** Converte «AAAA-MM-DD» numa Date UTC válida, ou null. */
export function parseDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null;
  return date;
}

export function todayISO(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto',
  'setembro', 'outubro', 'novembro', 'dezembro'];

/** «31 de outubro de 2026»; datas inválidas devolvem null. */
export function formatDate(value) {
  const date = parseDate(value);
  if (!date) return null;
  return `${date.getUTCDate()} de ${MESES[date.getUTCMonth()]} de ${date.getUTCFullYear()}`;
}

/**
 * Estado efetivo de um registo, tendo em conta a data de revisão.
 * Um registo «verificado» com a revisão em atraso passa a «desatualizado».
 */
export function effectiveStatus(record, today = todayISO()) {
  const avisos = [];
  let estado = ESTADOS[record?.estado] ? record.estado : 'por-confirmar';
  if (!ESTADOS[record?.estado]) avisos.push('estado-invalido');

  if (estado === 'verificado' && !parseDate(record.verificadoEm)) {
    estado = 'por-confirmar';
    avisos.push('data-verificacao-invalida');
  }
  if (record?.revisaoPrevista !== undefined && record?.revisaoPrevista !== null) {
    const revisao = parseDate(record.revisaoPrevista);
    if (!revisao) avisos.push('data-revisao-invalida');
    else if (record.revisaoPrevista < today && (estado === 'verificado' || estado === 'por-confirmar')) {
      estado = 'desatualizado';
      avisos.push('revisao-em-atraso');
    }
  }
  return { estado, avisos };
}

/** Decide se um registo pode ser apresentado como orientação. */
export function isDisplayable(record, politica = {}, today = todayISO()) {
  const { estado } = effectiveStatus(record, today);
  if (estado === 'verificado') return true;
  if (estado === 'por-confirmar') return Boolean(politica.mostrarPorConfirmar);
  return false;
}
