// Cartão «O que faço agora?»: resumo de uma ficha já resolvida para o contexto. Função pura.
// Só mostra um prazo quando a ficha tem um prazo confirmado em data (campo cartao.prazo).

export function construirCartao(r, entidades, questoes = []) {
  const principal = (r.entidades || []).map((e) => ({ ...e, dados: entidades.get(e.id) })).find((e) => e.dados) || null;
  const pendentes = questoes.filter((q) => q.registos.includes(r.id)
    && !(q.estadoValidacaoProfissional === 'validada' && q.estadoAplicacaoSite === 'aplicada'));
  return {
    urgente: Boolean(r.cartao?.urgente),
    entidade: principal ? { nome: principal.dados.nome, papel: principal.papel } : null,
    acao: (r.passos || [])[0] || null,
    ligacao: (r.acoes || [])[0] || null,
    documentos: (r.documentos || []).slice(0, 4),
    prazo: r.cartao?.prazo || null,
    porVerificar: pendentes.map((q) => q.id)
  };
}
