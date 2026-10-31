// Geração de documentos por templates fixos (sem IA). Funções puras.
// Tipos: «lada» (pedido a entidade pública), «insistencia» (seguimento do pedido LADA),
// «senhorio-obras» (comunicação privada ao senhorio — regime diferente, não é um pedido LADA).

import { formatDate, parseDate } from '../core/status.js';

export const LIMITES = { curto: 160, medio: 300, longo: 3000, linhas: 25 };

export const TIPOS = {
  lada: { obrigatorios: ['entidade', 'documentos', 'modalidade', 'nome', 'identificacao', 'morada', 'local', 'data'], exigeContacto: true },
  insistencia: { obrigatorios: ['entidade', 'nome', 'identificacao', 'morada', 'local', 'data', 'dataPedido'], exigeContacto: true },
  'senhorio-obras': { obrigatorios: ['destinatario', 'moradaImovel', 'problemas', 'prazoDias', 'nome', 'morada', 'local', 'data'] }
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
  identificacao: 'Indica um documento de identificação e o número (por exemplo, Cartão de Cidadão n.º …). A lei exige dados de identificação de quem pede.',
  contacto: 'Indica pelo menos um contacto: e-mail ou telefone. A lei exige dados de contacto de quem pede.',
  morada: 'Indica a tua morada. A lei exige a morada de quem pede.',
  local: 'Indica a localidade onde assinas.',
  data: 'Indica a data.',
  dataPedido: 'Indica a data em que entregaste o pedido original.',
  destinatario: 'Indica o nome do senhorio.',
  moradaImovel: 'Indica a morada da casa arrendada.',
  problemas: 'Descreve pelo menos um problema.',
  prazoDias: 'Indica o prazo, em dias, que propões ao senhorio.'
};

function cabecalho(d) {
  return [limpar(d.nome), limpar(d.morada), d.email ? limpar(d.email) : null, d.telefone ? `Tel.: ${limpar(d.telefone, 30)}` : null]
    .filter(Boolean).join('\n');
}

function assinatura(d) {
  return `Com os melhores cumprimentos,\n\n\n______________________________\n${limpar(d.nome)}`;
}

function identificacao(d) {
  return `titular do documento de identificação ${limpar(d.identificacao, 80)}`;
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
    'Caso algum dos documentos não se encontre na posse dessa entidade, solicito que me seja indicada a entidade que o detém ou que o pedido lhe seja remetido, nos termos legais aplicáveis.',
    'Caso se entenda que algum documento contém informação de acesso restrito, solicito o acesso à parte restante, com expurgo da informação restrita, e a indicação dos fundamentos da restrição.',
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
    `Assunto: Insistência — pedido de acesso a documentos administrativos de ${formatDate(d.dataPedido) || limpar(d.dataPedido)}${ref ? ` (ref.ª ${ref})` : ''}`,
    `${limpar(d.nome)}, ${identificacao(d)}, residente em ${limpar(d.morada)}, apresentou em ${formatDate(d.dataPedido) || limpar(d.dataPedido)} um pedido de acesso a documentos administrativos ao abrigo da Lei n.º 26/2016, de 22 de agosto, ao qual não obteve, até à presente data, resposta.`,
    'Venho, por isso, solicitar a V. Ex.ª que me seja comunicada, com a maior brevidade, a decisão sobre o referido pedido.',
    'Informo que, na ausência de resposta, ponderarei apresentar queixa à Comissão de Acesso aos Documentos Administrativos (CADA), nos termos da mesma lei.',
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
    d.desde ? `Os problemas verificam-se desde ${limpar(d.desde, 80)}.` : null,
    `Nos termos do contrato de arrendamento e da lei aplicável, solicito a V. Ex.ª que proceda à realização das obras necessárias, propondo para o efeito o prazo de ${prazo} dias a contar da receção desta comunicação, e que me informe da data em que as mesmas terão início, para que possa facultar o acesso ao imóvel.`,
    'Disponho de registo fotográfico, que posso facultar.',
    assinatura(d)
  ].filter(Boolean);
  return partes.join('\n\n') + '\n';
}

export function nomeFicheiro(tipo, data) {
  const base = { lada: 'pedido-acesso-documentos', insistencia: 'insistencia-pedido-documentos', 'senhorio-obras': 'carta-senhorio-obras' }[tipo] || 'documento';
  return `${base}-${parseDate(data) ? data : 'sem-data'}.txt`;
}
