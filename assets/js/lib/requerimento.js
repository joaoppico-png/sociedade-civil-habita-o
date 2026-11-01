// Geração de documentos por templates fixos (sem IA). Funções puras.
// Tipos: «lada» (pedido a entidade pública), «insistencia» (seguimento do pedido LADA),
// «senhorio-obras» (comunicação privada ao senhorio — regime diferente, não é um pedido LADA).

import { formatDate, parseDate } from '../core/status.js';

export const LIMITES = { curto: 160, medio: 300, longo: 3000, linhas: 25 };

export const TIPOS = {
  lada: { obrigatorios: ['entidade', 'documentos', 'modalidade', 'nome', 'identificacao', 'morada', 'local', 'data'], exigeContacto: true },
  insistencia: { obrigatorios: ['entidade', 'nome', 'identificacao', 'morada', 'local', 'data', 'dataPedido', 'motivoInsistencia'], exigeContacto: true },
  'senhorio-obras': { obrigatorios: ['destinatario', 'moradaImovel', 'problemas', 'urgencia', 'prazoDias', 'nome', 'morada', 'local', 'data'] }
};

/** Remove caracteres de controlo (exceto mudança de linha), normaliza espaços e corta no limite. */
export function limpar(valor, max = LIMITES.medio) {
  if (typeof valor !== 'string') return '';
  return valor
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u0009\u000B-\u001F\u007F​-‏‪-‮⁦-⁩]/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, max);
}

export function linhas(texto) {
  return limpar(texto, LIMITES.longo).split('\n').map((l) => l.replace(/^\s*(?:[-•*]|\d+[.)])\s*/, '').trim())
    .filter(Boolean).slice(0, LIMITES.linhas);
}

const EMAIL = /^[^\s@<>()]+@[^\s@<>()]+\.[^\s@<>()]{2,}$/;

/** Valida os campos. Devolve um objeto { campo: mensagem } (vazio = válido). */
export function validar(tipo, dados, opcoes = {}) {
  const erros = {};
  const def = TIPOS[tipo];
  if (!def) return { tipo: 'Tipo de documento desconhecido.' };
  for (const campo of def.obrigatorios) {
    if (!limpar(String(dados[campo] ?? ''), LIMITES.longo)) erros[campo] = MENSAGENS[campo] || 'Campo obrigatório.';
  }
  if (def.exigeContacto && !limpar(dados.email) && !limpar(dados.telefone)) erros.email = MENSAGENS.contacto;
  if (dados.email && !EMAIL.test(limpar(dados.email))) erros.email = 'Indica um endereço de e-mail válido (por exemplo, nome@exemplo.pt).';
  if (tipo === 'lada' && opcoes.modalidadeExigeEmail && !dados.email) erros.email = 'Para receberes cópias por e-mail, indica o teu endereço de e-mail.';
  if (dados.data && !parseDate(dados.data)) erros.data = 'Indica uma data válida.';
  if (tipo === 'insistencia' && dados.dataPedido && !parseDate(dados.dataPedido)) erros.dataPedido = 'Indica uma data válida.';
  if (tipo === 'insistencia' && parseDate(dados.dataPedido) && parseDate(dados.data) && dados.dataPedido > dados.data) erros.dataPedido = 'A data do pedido original não pode ser posterior à data desta insistência.';
  if (tipo === 'insistencia' && dados.motivoInsistencia && !INSISTENCIA[dados.motivoInsistencia]) erros.motivoInsistencia = MENSAGENS.motivoInsistencia;
  if (tipo === 'senhorio-obras' && dados.urgencia && !Object.hasOwn(URGENCIA, dados.urgencia)) erros.urgencia = MENSAGENS.urgencia;
  if (tipo === 'senhorio-obras' && dados.prazoDias !== undefined && dados.prazoDias !== '') {
    const n = Number(dados.prazoDias);
    if (!Number.isInteger(n) || n < 1 || n > 180) erros.prazoDias = 'Indica um número de dias entre 1 e 180.';
  }
  if (tipo === 'lada' && dados.documentos && linhas(dados.documentos).length === 0) erros.documentos = MENSAGENS.documentos;
  return erros;
}

const MENSAGENS = {
  entidade: 'Indica a entidade a quem diriges o pedido.',
  documentos: 'Descreve pelo menos um documento que pretendes.',
  modalidade: 'Escolhe a forma de acesso.',
  nome: 'Indica o teu nome completo. A lei exige a identificação de quem pede.',
  identificacao: 'Indica dados que te identifiquem (por exemplo, o número de um documento de identificação ou o NIF). A lei exige a identificação de quem pede, sem exigir um documento específico.',
  contacto: 'Indica pelo menos um contacto: e-mail ou telefone. A lei exige dados de contacto de quem pede.',
  morada: 'Indica a tua morada. A lei exige a morada de quem pede.',
  local: 'Indica a localidade onde assinas.',
  data: 'Indica a data.',
  dataPedido: 'Indica a data em que entregaste o pedido original.',
  destinatario: 'Indica o nome do senhorio.',
  moradaImovel: 'Indica a morada da casa arrendada.',
  problemas: 'Descreve pelo menos um problema.',
  prazoDias: 'Indica o prazo, em dias, que propões ao senhorio para responder.',
  motivoInsistencia: 'Escolhe o que aconteceu ao pedido original.',
  urgencia: 'Indica a gravidade da situação.'
};

/** Três situações diferentes que justificam insistir (não são procedimentos equivalentes). */
export const INSISTENCIA = {
  'sem-resposta': (data) => `apresentou em ${data} um pedido de acesso a documentos administrativos ao abrigo da Lei n.º 26/2016, de 22 de agosto, ao qual não obteve, até à presente data, resposta.`,
  'resposta-parcial': (data) => `apresentou em ${data} um pedido de acesso a documentos administrativos ao abrigo da Lei n.º 26/2016, de 22 de agosto, ao qual foi dada apenas resposta parcial, sem que tenham sido facultados todos os documentos pedidos nem indicados os fundamentos para não o fazer.`,
  'recusa-sem-fundamento': (data) => `apresentou em ${data} um pedido de acesso a documentos administrativos ao abrigo da Lei n.º 26/2016, de 22 de agosto, que foi recusado sem que tenham sido comunicados por escrito os fundamentos da recusa, como exige o artigo 15.º, n.º 1, alínea c), da mesma lei.`
};

/** Classificação factual da gravidade indicada pelo inquilino (não determina o regime jurídico). */
export const URGENCIA = {
  risco: 'Considerando que a situação representa risco para a segurança ou a saúde de quem vive na casa, solicito que a mesma seja tratada com a máxima urgência.',
  grave: 'A situação impede a utilização normal de parte da habitação.',
  normal: null
};

function cabecalho(d) {
  return [limpar(d.nome), limpar(d.morada), d.email ? limpar(d.email) : null, d.telefone ? `Tel.: ${limpar(d.telefone, 30)}` : null]
    .filter(Boolean).join('\n');
}

function assinatura(d) {
  return `Com os melhores cumprimentos,\n\n\n______________________________\n${limpar(d.nome)}`;
}

function identificacao(d) {
  return `com os seguintes dados de identificação: ${limpar(d.identificacao, 80)}`;
}

function lista(itens) { return itens.map((t, i) => `${i + 1}. ${t}`).join('\n'); }

/** Pedido de acesso a documentos administrativos (Lei n.º 26/2016). */
export function gerarLADA(d, modalidade) {
  const docs = linhas(d.documentos);
  const contexto = limpar(d.contexto, LIMITES.longo);
  const destinatario = limpar(d.cargo) || 'Responsável pelo acesso à informação';
  const partes = [
    cabecalho(d),
    `Exmo.(a) Senhor(a)\n${destinatario}\n${limpar(d.entidade)}`,
    `${limpar(d.local)}, ${formatDate(d.data) || limpar(d.data)}`,
    'Assunto: Pedido de acesso a documentos administrativos — Lei n.º 26/2016, de 22 de agosto',
    `${limpar(d.nome)}, ${identificacao(d)}, residente em ${limpar(d.morada)}, vem, ao abrigo da Lei n.º 26/2016, de 22 de agosto, que aprova o regime de acesso à informação administrativa e ambiental e de reutilização dos documentos administrativos, na sua redação atual, requerer a V. Ex.ª o acesso aos seguintes documentos administrativos:`,
    lista(docs)
  ];
  if (contexto) partes.push(`Para facilitar a identificação dos documentos, informo o seguinte: ${contexto}`);
  partes.push(
    `Pretendo que o acesso seja facultado sob a forma de ${modalidade?.texto || limpar(d.modalidade)}${modalidade?.exigeEmail && d.email ? ` (${limpar(d.email)})` : ''}.`,
    'Caso algum dos documentos não se encontre na posse dessa entidade, solicito que o pedido seja remetido à entidade que o detém, com conhecimento ao requerente, nos termos do artigo 15.º, n.º 1, alínea d), da Lei n.º 26/2016 e do artigo 41.º do Código do Procedimento Administrativo.',
    'Caso os documentos contenham informação sujeita a restrição legal, solicito o acesso à parte não protegida, mediante expurgo da informação reservada, nos termos do artigo 6.º, n.º 8, da Lei n.º 26/2016.',
    'Solicito ainda que qualquer recusa, total ou parcial, ou qualquer encargo seja comunicado por escrito, de forma fundamentada e com o cálculo discriminado.',
    'Aguardo resposta no prazo legalmente previsto.',
    assinatura(d)
  );
  return partes.join('\n\n') + '\n';
}

/** Insistência após falta de resposta a um pedido LADA. */
export function gerarInsistencia(d) {
  const ref = limpar(d.referencia, 80);
  const partes = [
    cabecalho(d),
    `Exmo.(a) Senhor(a)\n${limpar(d.cargo) || 'Responsável pelo acesso à informação'}\n${limpar(d.entidade)}`,
    `${limpar(d.local)}, ${formatDate(d.data) || limpar(d.data)}`,
    `Assunto: ${d.motivoInsistencia === 'recusa-sem-fundamento' ? 'Pedido de fundamentação da recusa' : 'Insistência'} — pedido de acesso a documentos administrativos de ${formatDate(d.dataPedido) || limpar(d.dataPedido)}${ref ? ` (ref.ª ${ref})` : ''}`,
    `${limpar(d.nome)}, ${identificacao(d)}, residente em ${limpar(d.morada)}, ${(INSISTENCIA[d.motivoInsistencia] || INSISTENCIA['sem-resposta'])(formatDate(d.dataPedido) || limpar(d.dataPedido))}`,
    `Reitero integralmente o pedido apresentado em ${formatDate(d.dataPedido) || limpar(d.dataPedido)}, que mantém essa data de apresentação, e solicito a V. Ex.ª que me seja comunicada, com a maior brevidade, a decisão sobre o mesmo, nos termos do artigo 15.º da referida lei.`,
    'Esta insistência é feita sem prejuízo dos meios de reação previstos na Lei n.º 26/2016, incluindo a queixa à Comissão de Acesso aos Documentos Administrativos (CADA).',
    assinatura(d)
  ];
  return partes.join('\n\n') + '\n';
}

/** Comunicação ao senhorio a pedir obras (relação privada; não invoca a LADA). */
export function gerarSenhorioObras(d) {
  const problemas = linhas(d.problemas);
  const prazo = Number(d.prazoDias);
  const partes = [
    cabecalho(d),
    `Exmo.(a) Senhor(a)\n${limpar(d.destinatario)}${d.moradaDestinatario ? `\n${limpar(d.moradaDestinatario)}` : ''}`,
    `${limpar(d.local)}, ${formatDate(d.data) || limpar(d.data)}`,
    `Assunto: Pedido de realização de obras de conservação — ${limpar(d.moradaImovel)}`,
    `Na qualidade de arrendatário(a) do imóvel sito em ${limpar(d.moradaImovel)}, venho comunicar a V. Ex.ª a existência dos seguintes problemas, que carecem de obras de conservação:`,
    lista(problemas),
    d.desde ? `Os problemas foram detetados em ${limpar(d.desde, 80)}.` : null,
    d.consequencias ? `Estes problemas afetam a utilização da habitação da seguinte forma: ${limpar(d.consequencias, LIMITES.longo)}` : null,
    URGENCIA[d.urgencia] || null,
    'Nos termos do contrato de arrendamento e da lei aplicável, solicito a V. Ex.ª a avaliação e a realização das reparações necessárias à reposição das condições adequadas de utilização do imóvel.',
    `Solicito igualmente resposta a esta comunicação no prazo de ${prazo} dias a contar da sua receção, com a indicação das medidas previstas e do respetivo calendário de execução, para que possa facultar o acesso ao imóvel.`,
    'Disponho de registo fotográfico, que posso facultar.',
    'A presente comunicação é feita sem prejuízo dos direitos legalmente previstos para situações urgentes ou de incumprimento.',
    assinatura(d)
  ].filter(Boolean);
  return partes.join('\n\n') + '\n';
}

export function nomeFicheiro(tipo, data) {
  const base = { lada: 'pedido-acesso-documentos', insistencia: 'insistencia-pedido-documentos', 'senhorio-obras': 'carta-senhorio-obras' }[tipo] || 'documento';
  return `${base}-${parseDate(data) ? data : 'sem-data'}.txt`;
}
