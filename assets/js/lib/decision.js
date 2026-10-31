// Motor da árvore de decisão «Quem resolve?». Puro: sem DOM, testável em Node.
// Estado = lista de respostas [{ pergunta, opcao }]. Serializa-se no URL (?caminho=a,b,c).

export function indexTree(arvore) {
  return {
    inicio: arvore.inicio,
    perguntas: new Map(arvore.perguntas.map((p) => [p.id, p])),
    resultados: new Map(arvore.resultados.map((r) => [r.id, r]))
  };
}

/** Opções de uma pergunta; perguntas «municipio» geram-nas a partir de municipios.json. */
export function opcoesDe(pergunta, municipios) {
  if (pergunta.tipo !== 'municipio') return pergunta.opcoes || [];
  const lista = (municipios?.municipios || []).map((m) => ({ id: m.id, rotulo: m.nome, resultado: pergunta.resultado, seguinte: pergunta.seguinte }));
  const outro = municipios?.outro;
  if (outro) lista.push({ id: outro.id, rotulo: outro.nome, resultado: pergunta.resultado, seguinte: pergunta.seguinte });
  return lista;
}

/**
 * Percorre um caminho de ids de opções a partir do início.
 * Devolve { passos, atual (pergunta|null), resultadoId|null, contexto, invalido }.
 * Um id desconhecido corta o caminho nesse ponto (invalido = true).
 */
export function walk(tree, caminho, municipios) {
  const passos = [];
  const contexto = {};
  let atual = tree.perguntas.get(tree.inicio) || null;
  let resultadoId = null;
  let invalido = false;

  for (const opcaoId of caminho) {
    if (!atual) { invalido = true; break; }
    const opcao = opcoesDe(atual, municipios).find((o) => o.id === opcaoId);
    if (!opcao) { invalido = true; break; }
    passos.push({ pergunta: atual, opcao });
    if (atual.tipo === 'municipio') contexto.municipio = opcao.id;
    if (opcao.define) Object.assign(contexto, opcao.define);
    if (opcao.resultado) { resultadoId = opcao.resultado; atual = null; break; }
    atual = tree.perguntas.get(opcao.seguinte) || null;
    if (!atual) { invalido = true; break; }
  }
  if (resultadoId === null && passos.length < caminho.length) invalido = true;
  return { passos, atual: resultadoId ? null : atual, resultadoId, contexto, invalido };
}

const cumpre = (condicao, contexto) =>
  !condicao || Object.entries(condicao).every(([k, v]) => contexto[k] === v);

// Itens de listas podem ser texto ou { texto, se }; os condicionados só aparecem se o contexto cumprir.
const textos = (lista, contexto) => (lista || [])
  .filter((x) => typeof x === 'string' || cumpre(x.se, contexto))
  .map((x) => (typeof x === 'string' ? x : x.texto));

/** Resultado resolvido para o contexto das respostas (concelho, tipo de contrato, motivo…). */
export function resolveResultado(resultado, contexto, municipios) {
  const municipio = (municipios?.municipios || []).find((m) => m.id === contexto.municipio) || null;
  const marcadores = {
    camara: municipio?.camara || 'camara-municipal',
    habitacaoMunicipal: municipio?.habitacaoMunicipal || 'camara-municipal'
  };
  const substituir = (href) => href.replace(/\{(\w+)\}/g, (_, k) => encodeURIComponent(marcadores[k] || ''));
  return {
    ...resultado,
    regras: (resultado.regras || []).filter((g) => cumpre(g.se, contexto)),
    passos: textos(resultado.passos, contexto),
    documentos: textos(resultado.documentos, contexto),
    limitacoes: textos(resultado.limitacoes, contexto),
    entidades: (resultado.entidades || []).filter((e) => cumpre(e.se, contexto)),
    acoes: (resultado.acoes || []).filter((a) => cumpre(a.se, contexto))
      .map((a) => (a.href ? { ...a, href: substituir(a.href) } : a)),
    semCobertura: Boolean(resultado.municipal && contexto.municipio && !municipio),
    notaCobertura: resultado.municipal && contexto.municipio && !municipio ? municipios?.outro?.nota : null
  };
}

/** Todos os caminhos completos da árvore (para testes). */
export function todosOsCaminhos(tree, municipios) {
  const caminhos = [];
  const visitar = (perguntaId, prefixo, vistos) => {
    if (vistos.has(perguntaId)) throw new Error(`Ciclo na árvore em «${perguntaId}»`);
    const pergunta = tree.perguntas.get(perguntaId);
    if (!pergunta) throw new Error(`Pergunta inexistente: «${perguntaId}»`);
    for (const opcao of opcoesDe(pergunta, municipios)) {
      const caminho = [...prefixo, opcao.id];
      if (opcao.resultado) caminhos.push({ caminho, resultadoId: opcao.resultado });
      else visitar(opcao.seguinte, caminho, new Set([...vistos, perguntaId]));
    }
  };
  visitar(tree.inicio, [], new Set());
  return caminhos;
}

export function parseCaminho(param) {
  if (typeof param !== 'string' || param === '') return [];
  return param.split(',').map((s) => s.trim()).filter((s) => /^[a-z0-9-]{1,40}$/.test(s)).slice(0, 12);
}
