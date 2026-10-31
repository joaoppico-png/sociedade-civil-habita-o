// Ligação entre questões jurídicas e registos do site. Funções puras.
// Um registo é o id de um resultado da árvore (ex.: «r-despejo») ou «requerimento:<id da orientação>».

// Estados independentes: investigação, validação por advogado e aplicação no site.
export const ESTADOS_Q = {
  estadoInvestigacao: ['aberta', 'respondida'],
  estadoValidacaoProfissional: ['pendente', 'validada', 'recusada'],
  estadoAplicacaoSite: ['por-aplicar', 'parcial', 'aplicada']
};

/** Uma questão só sai das fichas quando está validada por advogado e aplicada no site. */
export const fechada = (q) => q.estadoValidacaoProfissional === 'validada' && q.estadoAplicacaoSite === 'aplicada';

export function questoesDe(registo, questoes) {
  return (questoes || []).filter((q) => !fechada(q) && q.registos.includes(registo));
}

export function nomesDosRegistos(arvore, requerimento) {
  const nomes = new Map((arvore?.resultados || []).map((r) => [r.id, `Ficha «${r.titulo}»`]));
  for (const o of requerimento?.orientacoes || []) nomes.set(`requerimento:${o.id}`, `Gerador — «${o.titulo}»`);
  nomes.set('requerimento:modelo', 'Gerador — modelos de documentos');
  nomes.set('requerimento:seguimento', 'Gerador — calculador de prazos');
  return nomes;
}

export function validarQuestoes(dados, arvore, requerimento) {
  const erros = [];
  const nomes = nomesDosRegistos(arvore, requerimento);
  const vistos = new Set();
  for (const q of dados?.questoes || []) {
    if (!/^Q\d{2,3}$/.test(q.id)) erros.push(`questão ${q.id}: id inválido`);
    if (vistos.has(q.id)) erros.push(`questão ${q.id}: id duplicado`);
    vistos.add(q.id);
    if (!q.pergunta || !q.tema) erros.push(`questão ${q.id}: falta pergunta ou tema`);
    for (const [campo, valores] of Object.entries(ESTADOS_Q)) {
      if (!valores.includes(q[campo])) erros.push(`questão ${q.id}: ${campo} inválido`);
    }
    if (!Array.isArray(q.registos) || !q.registos.length) erros.push(`questão ${q.id}: sem registos afetados`);
    for (const r of q.registos || []) if (!nomes.has(r)) erros.push(`questão ${q.id}: registo desconhecido «${r}»`);
    if (q.estadoInvestigacao === 'respondida' && !(q.investigacoes || []).length) erros.push(`questão ${q.id}: respondida sem investigação registada`);
    if (q.estadoValidacaoProfissional === 'validada' && !q.parecerAssinado?.advogado) erros.push(`questão ${q.id}: validada sem parecer assinado`);
  }
  return erros;
}
