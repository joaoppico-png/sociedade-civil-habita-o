# Auditoria ao site — 31 de outubro de 2026

Estado no commit seguinte a `35bfc8c`. Verificações automáticas executadas nesta data: validação de dados, 39 testes, ligações internas e externas, CSP, acessibilidade (labels, headings, contraste calculado, landmarks, ids duplicados) e responsivo a 320, 360, 390, 768, 1024 e 1440 px.

## Veredicto

**Não publicar ainda.** O produto funciona e a técnica está sólida. Falta conteúdo verificado: 0 das 16 fichas está verificada e as 21 questões jurídicas continuam abertas, 12 delas de prioridade alta.

## 1. O que está bem (verificado hoje)

| Área | Resultado |
| --- | --- |
| Funcionalidade | 3 módulos a funcionar; 16 fichas alcançáveis; gerador de 3 documentos; calculador de prazos; catálogo com filtros |
| Dados | `npm run validate` sem erros; 39/39 testes |
| Ligações internas | Nenhuma partida |
| Segurança | CSP sem inline, conteúdo via `textContent`, URLs validados, sem cookies, sem armazenamento, sem terceiros |
| Acessibilidade (automática) | `lang="pt-PT"`, 1 `h1` por página, todos os campos com label, 0 contrastes abaixo de AA, 4 landmarks, 0 ids duplicados; ordem de headings corrigida em «Participar» nesta auditoria |
| Responsivo | Sem scroll horizontal; cabeçalho de 102 px no telemóvel; alvos ≥ 24 px |
| Peso | ~300 KB publicáveis, sem pedidos externos |

## 2. Bloqueia a publicação

| # | Falta | Onde | Quem |
| --- | --- | --- | --- |
| B1 | **Revisão por advogado inscrito** das 21 questões. As respostas atuais são preliminares e não estão assinadas. Prioridade às Q12–Q14 (despejo), Q16 (arrendamento apoiado, com contradição por resolver), Q20 e Q21 (responsabilidade e modelos) | `questoes-juridicas.html` | Advogado |
| B2 | **0 de 16 fichas verificadas.** Só as 6 orientações do gerador estão verificadas | `data/arvore.json` | Editor + advogado |
| B3 | **Responsável editorial, contacto e canal de correções** por definir | `sobre.html`, `config.json` | João Pico |
| B4 | **Domínio final** por definir. Falta `canonical`/`og:url` e o sitemap aponta para `example.org` | `tools/set-domain.mjs` | João Pico |
| B5 | **Decidir a política de publicação**: `mostrarPorConfirmar` está `true`. Para publicar só o verificado, passar a `false`, mas então o «Quem resolve?» fica quase vazio | `data/config.json` | João Pico |

## 3. Conteúdo em falta ou incompleto

| # | Falta | Detalhe |
| --- | --- | --- |
| C1 | Percursos separados para **processos urbanísticos** (LADA vs RJUE, art. 110.º) e **processos em curso** (meu, de terceiro, concluído) | Recomendação comum aos dois pareceres (Q05, Q06) |
| C2 | Perguntas adicionais na **carta para sair**: data do contrato, regime, motivo, rendas em atraso, idade ou deficiência (NRAU, art. 36.º) | Q13 |
| C3 | **Julgados de Paz** sem ligação oficial e com competência por confirmar (Lei n.º 78/2001) | Ficha de condomínio |
| C4 | **13 entidades por confirmar**; 4 sem canal de contacto (senhorio, condomínio, câmara genérica, julgados de paz) | `entidades.json` |
| C5 | **Lisboa**: faltam páginas oficiais de habitação, urbanismo e vistorias; versão do regulamento municipal por confirmar | Q17 |
| C6 | **Participar**: catálogo vazio, sem nenhuma consulta pública verificada | `oportunidades.json` |
| C7 | **Tabela de taxas** (Despacho n.º 8617/2002): não localizada por nós; valores não publicados | Q01 |
| C8 | **Modelos do gerador** não validados por advogado | Q21 |
| C9 | 3 fontes com ligação por testar; `lisboa.pt` e `servicos.lisboa.pt` bloqueiam verificação automática (403); `base.gov.pt` falha a cadeia TLS no Node | `npm run check:links` |
| C10 | Ficha «Prédio degradado» e «Arrendamento acessível» sem revisão nesta ronda | — |

## 4. Técnico (não bloqueia, mas convém)

| # | Falta | Esforço |
| --- | --- | --- |
| T1 | Imagem Open Graph (`og:image`) para partilha em redes | Baixo |
| T2 | Fonte display incluída no site (ex.: Anton, licença OFL). Hoje depende das fontes do sistema e o aspeto varia em Android | Baixo (requer descarregar ~50 KB) |
| T3 | Cabeçalhos de segurança no servidor (CSP, `X-Content-Type-Options`, `Referrer-Policy`, HSTS) e página 404 configurada | Baixo, no alojamento |
| T4 | `favicon.ico` de recurso para browsers antigos | Muito baixo |
| T5 | Documentação desatualizada: `docs/TESTES.md` refere 36 testes e não inclui o design nem o mobile | Baixo |
| T6 | O calculador da CADA não considera recusas expressas, prorrogações nem tolerâncias de ponto e feriados municipais. Está assinalado como estimativa | Médio |

## 5. Testes que só um humano pode fazer

- Botão «Copiar», impressão e PDF das fichas, do gerador e do caderno de questões.
- Importar os lembretes `.ics` num calendário real (Google, Apple, Outlook).
- Leitor de ecrã (VoiceOver ou NVDA) nos três módulos.
- Zoom a 200% e a 400%.
- Teste no Portal BASE: abrir um contrato real de habitação em Lisboa.
- Teste com 10 a 15 utilizadores reais (`docs/VALIDACAO.md`).

## 6. Ordem recomendada

1. **B1:** entregar o caderno de questões impresso a um advogado, começando pelas Q12–Q14, Q16, Q20 e Q21.
2. **B3 + B4:** definir o responsável editorial, o contacto e o domínio (30 minutos).
3. **B2:** verificar primeiro as 3 fichas sem questões pendentes (`r-contrato`, `r-emergencia`, `r-participar`) e depois as de despejo, à medida que as respostas chegarem.
4. **C1 + C2:** só depois das respostas do advogado, para não reestruturar duas vezes.
