// Gera o caderno de validação jurídica das questões críticas, a partir do conteúdo real do site.
// Uso: node tools/build-caderno.mjs [Q14,Q16,...]
// Resultado: docs/revisao-juridica/caderno-questoes-criticas.html (e .pdf, se o Google Chrome estiver instalado).

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { gerarLADA, gerarInsistencia, gerarSenhorioObras } from '../assets/js/lib/requerimento.js';

const raiz = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const ler = async (n) => JSON.parse(await readFile(path.join(raiz, 'data', `${n}.json`), 'utf8'));
const [q, arvore, fontes, requerimento] = await Promise.all(['questoes-juridicas', 'arvore', 'fontes', 'requerimento'].map(ler));
const ids = (process.argv[2] || 'Q14,Q16,Q12,Q13,Q20,Q21').split(',');
const hoje = new Date().toISOString().slice(0, 10);
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const fonte = new Map(fontes.fontes.map((f) => [f.id, f]));
const resultado = new Map(arvore.resultados.map((r) => [r.id, r]));

// Condições do questionário em linguagem corrente.
const ROTULOS = {
  motivo: { renovacao: 'carta de não renovação', denuncia: 'carta de denúncia (senhorio precisa da casa, obras, contrato sem prazo)', rendas: 'carta por rendas em atraso', outro: 'motivo não identificado' },
  contrato: { 'pre-rau': 'contrato anterior a novembro de 1990', rau: 'contrato de 1990 a 2006', recente: 'contrato posterior a junho de 2006', desconhecido: 'data do contrato desconhecida' },
  municipio: { lisboa: 'Lisboa', outro: 'outro concelho' }
};
const condicao = (se) => se ? `<span class="cond">Só aparece se: ${esc(Object.entries(se).map(([k, v]) => ROTULOS[k]?.[v] || `${k} = ${v}`).join(' e '))}</span>` : '';
const item = (x) => (typeof x === 'string' ? `<li>${esc(x)}</li>` : `<li>${esc(x.texto)} ${condicao(x.se)}</li>`);

function ficha(id) {
  const r = resultado.get(id);
  return `<div class="ficha"><p class="ficha-t">Ficha no site: «${esc(r.titulo)}»</p>
    <p><strong>Resumo:</strong> ${esc(r.resumo)}</p>
    <p class="sub">O que diz a lei</p><ol>${r.regras.map((g) => `<li>${esc(g.texto)} <em>(${esc(g.referencia)})</em> ${condicao(g.se)}</li>`).join('')}</ol>
    <p class="sub">Próximos passos</p><ol>${r.passos.map(item).join('')}</ol>
    <p class="sub">Limitações</p><ul>${r.limitacoes.map(item).join('')}</ul></div>`;
}

async function textoSobre() {
  const html = await readFile(path.join(raiz, 'sobre.html'), 'utf8');
  const bloco = html.slice(html.indexOf('<h2 id="limites">'), html.indexOf('<h2 id="limitacoes">'));
  const ps = [...bloco.matchAll(/<p>(.*?)<\/p>/gs)].map((m) => m[1].replace(/<[^>]+>/g, ''));
  return `<div class="ficha"><p class="ficha-t">Página «Sobre» — Informação jurídica e limites deste serviço</p>${ps.map((p) => `<p>${esc(p)}</p>`).join('')}
    <p class="sub">Aviso mostrado em todas as fichas</p><p>Informação geral e modelos para preparares os teus próprios pedidos. Não é consulta jurídica individual, representação nem garantia de resultado. Em despejos, prazos judiciais ou litígios, procura um profissional legalmente habilitado.</p></div>`;
}

function modelos() {
  const base = { nome: 'Maria Exemplo', identificacao: 'Cartão de Cidadão n.º 00000000', morada: 'Rua Exemplo, 1, 1000-000 Lisboa', email: 'maria@exemplo.pt', local: 'Lisboa', data: hoje };
  const mod = requerimento.modalidades.find((m) => m.id === 'copia-eletronica');
  const a = gerarLADA({ ...base, entidade: 'Câmara Municipal de Lisboa', documentos: 'Auto de vistoria ao prédio da Rua Exemplo, n.º 10\nContrato de empreitada de reabilitação do mesmo prédio', contexto: 'Processo de obras de 2025.', modalidade: mod.id }, mod);
  const b = gerarInsistencia({ ...base, entidade: 'Câmara Municipal de Lisboa', dataPedido: '2026-09-01', motivoInsistencia: 'resposta-parcial', referencia: 'P-123' });
  const c = gerarSenhorioObras({ ...base, destinatario: 'João Senhorio', moradaImovel: 'Rua Exemplo, 1, 2.º Esq., Lisboa', problemas: 'Infiltração no teto da cozinha\nTomada elétrica com sinais de queimado', desde: 'setembro de 2026', consequencias: 'A cozinha não pode ser usada em segurança.', urgencia: 'risco', prazoDias: '5' });
  const caixa = (t, txt) => `<p class="sub">${t}</p><pre>${esc(txt)}</pre>`;
  return `<div class="ficha"><p class="ficha-t">Os três modelos, tal como o gerador os produz (dados fictícios)</p>
    ${caixa('Modelo A — Pedido de acesso a documentos administrativos', a)}
    ${caixa('Modelo B — Insistência (variante «resposta parcial»; existem também «sem resposta» e «recusa sem fundamentação»)', b)}
    ${caixa('Modelo C — Carta ao senhorio a pedir obras (gravidade «risco»; existem também «grave» e «sem urgência»)', c)}
    <p class="note">Código-fonte: assets/js/lib/requerimento.js. Testes automáticos garantem, entre outros, que a carta ao senhorio nunca anuncia desconto ou suspensão da renda e que a insistência mantém a data do pedido original.</p></div>`;
}

const PERGUNTA = {
  Q14: 'A ficha «Recebi uma notificação do BAS ou de um tribunal» está correta e é prudente quanto ao prazo de oposição, à taxa de justiça e caução, e ao efeito do pedido de nomeação de patrono?',
  Q16: 'A ficha «A câmara ou a empresa municipal quer pôr fim ao meu contrato» descreve corretamente o direito de recurso, a natureza administrativa do contrato e os limites do que se pode afirmar em geral?',
  Q12: 'As regras sobre a oposição à renovação (antecedências, primeira renovação, carta tardia, forma) estão corretas na ficha «Recebi uma carta do senhorio para sair»?',
  Q13: 'As regras sobre contratos antigos e rendas em atraso, e as condições em que cada uma aparece, estão corretas na mesma ficha?',
  Q20: 'O texto de limites do serviço e o aviso das fichas são adequados à luz da Lei n.º 10/2024, considerando que o site fornece informação geral, um questionário de encaminhamento e modelos de documentos, sem declarar validade de situações individuais nem gerar peças processuais?',
  Q21: 'Os três modelos podem ser disponibilizados ao público tal como estão?'
};
const CONTEUDO = { Q14: () => ficha('r-despejo-notificacao'), Q16: () => ficha('r-despejo-apoiado'), Q12: () => ficha('r-despejo'), Q13: () => '<p class="note">Mesma ficha da questão anterior (Q12): ver as regras e limitações assinaladas com «carta por rendas em atraso», «contrato anterior a novembro de 1990» e «contrato de 1990 a 2006».</p>', Q20: textoSobre, Q21: modelos };

const blocos = [];
for (const [i, id] of ids.entries()) {
  const x = q.questoes.find((y) => y.id === id);
  const normas = [...new Set(x.fontesConsultadas)].map((f) => fonte.get(f)).filter(Boolean);
  blocos.push(`<section class="q">
    <p class="kicker">Questão ${i + 1} de ${ids.length} · ${esc(x.id)} · ${esc(x.tema)}</p>
    <h2>${esc(PERGUNTA[id] || x.pergunta)}</h2>
    ${await CONTEUDO[id]()}
    <p class="sub">Normas consultadas pela equipa</p>
    <ul class="fontes">${normas.map((f) => `<li>${esc(f.titulo)} — ${esc(f.url || 'sem ligação')}</li>`).join('')}</ul>
    <p class="sub">Notas da equipa</p><p class="note">${esc(x.investigacoes.at(-1).verificacaoNossa)}</p>
    <div class="decisao">
      <p class="sub">Decisão do advogado</p>
      <p class="box">☐ Aprovo tal como está</p>
      <p class="box">☐ Aprovo com as alterações seguintes</p>
      <p class="box">☐ Não aprovo, pelas razões seguintes</p>
      <div class="linhas"></div>
    </div>
  </section>`);
}

const html = `<!doctype html><html lang="pt-PT"><head><meta charset="utf-8">
<title>Caderno de validação jurídica — Sociedade Civil · Habitação</title>
<style>
  @page { size: A4; margin: 18mm 16mm 18mm 16mm; }
  body { font: 10.5pt/1.45 -apple-system, "Helvetica Neue", Arial, sans-serif; color: #121212; }
  h1 { font: 800 22pt/1.1 "Impact", "Arial Narrow", sans-serif; text-transform: uppercase; margin: 0 0 6mm; letter-spacing: .01em; }
  h2 { font-size: 12.5pt; line-height: 1.35; margin: 2mm 0 4mm; }
  .kicker { font-size: 8.5pt; text-transform: uppercase; letter-spacing: .08em; color: #b42c25; font-weight: 700; margin: 0; }
  .q { page-break-before: always; }
  .ficha { border: 1px solid #121212; padding: 3mm 4mm; margin: 0 0 4mm; background: #faf7f2; }
  .ficha-t { font-weight: 700; margin: 0 0 2mm; }
  .sub { font-weight: 700; font-size: 9pt; text-transform: uppercase; letter-spacing: .06em; margin: 3mm 0 1mm; }
  .cond { display: inline-block; font-size: 8pt; color: #6e4500; background: #f3e2bf; padding: 0 1.5mm; }
  ol, ul { margin: 0 0 2mm; padding-left: 6mm; } li { margin-bottom: 1mm; }
  pre { white-space: pre-wrap; font: 8.5pt/1.4 Menlo, monospace; border-left: 3px solid #b42c25; padding-left: 3mm; margin: 0 0 3mm; }
  .fontes { font-size: 8.5pt; } .note { font-size: 9pt; color: #2e2b29; }
  .decisao { border: 2px solid #121212; padding: 3mm 4mm; margin-top: 4mm; page-break-inside: avoid; }
  .box { margin: 1.5mm 0; font-size: 11pt; }
  .linhas { height: 42mm; background: repeating-linear-gradient(#fff, #fff 7mm, #999 7mm, #999 7.3mm); margin-top: 2mm; }
  .assin { border: 2px solid #121212; padding: 4mm; margin-top: 6mm; page-break-inside: avoid; }
  .assin p { margin: 5mm 0; } .campo { display: inline-block; border-bottom: 1px solid #121212; min-width: 95mm; }
  .capa p { max-width: 165mm; }
</style></head><body>
<section class="capa">
  <p class="kicker">Sociedade Civil — Habitação · ${hoje}</p>
  <h1>Caderno de validação jurídica</h1>
  <p><strong>O que é:</strong> a Sociedade Civil — Habitação é uma plataforma cívica, gratuita e sem fins lucrativos, que ajuda cidadãos a perceber quem é responsável por um problema de habitação, o que diz a lei e qual o próximo passo, com ligações às fontes oficiais. Não tem publicidade, contas, inteligência artificial nem recolha de dados.</p>
  <p><strong>O que pedimos:</strong> a revisão de ${ids.length} questões críticas, sobretudo sobre despejos, que são as situações em que um erro pode custar a casa a alguém. Para cada questão, mostramos o texto exatamente como está publicado e as normas em que se baseia. Basta escolher uma de três decisões e, se for o caso, indicar a alteração.</p>
  <p><strong>Tempo estimado:</strong> 2 a 3 horas.</p>
  <p><strong>O que não pedimos:</strong> um parecer extenso, nem representação ou responsabilidade por casos concretos. Os textos são informação geral; o site encaminha sempre para apoio jurídico nas situações de despejo e litígio.</p>
  <p><strong>Como usamos a resposta:</strong> só marcamos uma ficha como «validada» com nome, cédula profissional e data. As alterações indicadas são aplicadas tal como escritas. A identificação do revisor só é publicada se o autorizar na última página.</p>
  <p><strong>Contexto:</strong> estas questões já passaram por quatro revisões documentais e pela leitura direta das normas no Diário da República. Essas revisões não estão assinadas por advogado, e foi isso que nos levou a pedir esta validação.</p>
  <p><strong>Ver o site:</strong> pode ser disponibilizado um acesso de teste a pedido.</p>
</section>
${blocos.join('\n')}
<section class="q">
  <p class="kicker">Identificação e assinatura</p>
  <h2>Validação profissional</h2>
  <div class="assin">
    <p>Nome: <span class="campo">&nbsp;</span></p>
    <p>Cédula profissional n.º: <span class="campo">&nbsp;</span></p>
    <p>Data: <span class="campo">&nbsp;</span></p>
    <p>Assinatura: <span class="campo">&nbsp;</span></p>
    <p class="box">☐ Autorizo a publicação do meu nome e cédula na página pública «Questões jurídicas em aberto», junto das questões que validei.</p>
    <p class="box">☐ Prefiro que a validação seja registada sem identificação pública (fica no registo interno do projeto).</p>
  </div>
</section>
</body></html>`;

const dir = path.join(raiz, 'docs', 'revisao-juridica');
await mkdir(dir, { recursive: true });
const ficheiroHtml = path.join(dir, 'caderno-questoes-criticas.html');
await writeFile(ficheiroHtml, html);
console.log(`Caderno HTML: ${path.relative(raiz, ficheiroHtml)}`);

const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
if (existsSync(chrome)) {
  const pdf = path.join(dir, 'caderno-questoes-criticas.pdf');
  execFileSync(chrome, ['--headless=new', '--disable-gpu', '--no-pdf-header-footer', `--print-to-pdf=${pdf}`, `file://${ficheiroHtml}`], { stdio: 'ignore' });
  console.log(`Caderno PDF: ${path.relative(raiz, pdf)}`);
}
