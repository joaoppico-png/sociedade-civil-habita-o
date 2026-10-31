# Especificação mínima — Sociedade Civil · Habitação (MVP v1.0)

Data: 2026-10-31 · Estado: implementado, conteúdos por confirmar editorialmente.

## 0. Posicionamento

Plataforma independente de **orientação, ação e fiscalização cívica** sobre habitação — não um portal de informação. Não compete com o IHRU (candidaturas), a PORDATA (estatística) ou os portais municipais: liga-os, explica os procedimentos e acrescenta acompanhamento. Três eixos: **Compreender** (Quem resolve?), **Agir** (gerador + seguimento de prazos), **Fiscalizar** (participação; observatório de compromissos na fase 2).

## 1. Problema

Um cidadão com um problema de habitação concreto não sabe quem é responsável, que documentos pode pedir, nem onde pode participar. O MVP resolve três tarefas:

1. **Quem resolve?** — encaminhamento por árvore de decisão → ficha com entidades, regras com fonte, passos, documentos, limitações.
2. **Pedir documentos** — gerador de pedido LADA, insistência e carta ao senhorio (regimes distintos), com cálculo local de prazos e lembretes `.ics` («E se não me responderem?»). 100% no browser.
3. **Participar** — catálogo de oportunidades de participação carregado de JSON editorial, com filtros e estado vazio honesto.

## 2. Arquitetura de informação

| Página | Pergunta que responde |
| --- | --- |
| `index.html` | «Qual é o teu problema de habitação?» — 6 caminhos |
| `quem-resolve.html` | Quem pode resolver o meu caso e o que faço a seguir? |
| `pedir-documentos.html` | Como peço documentos a uma entidade pública? |
| `participar.html` | Onde posso participar numa decisão? |
| `sobre.html` | Quem faz isto, com que método e com que limites? |
| `404.html` | Página não encontrada |

Cada caminho da página inicial abre `quem-resolve.html?caminho=<opção>`; o estado das respostas vive no URL (sem dados pessoais), o que permite retroceder, corrigir uma resposta anterior e partilhar o resultado.

## 3. Fluxos principais

- **Quem resolve:** pergunta → opções → (concelho, quando relevante) → ficha de resultado. Botão «Voltar», resumo das respostas com «Alterar» em cada passo, «Recomeçar».
- **Pedir documentos:** formulário → validação → pré-visualização editável → copiar / descarregar `.txt` / imprimir. Nada é enviado nem guardado.
- **Participar:** filtros (concelho, tipo, entidade, estado, prazo) → lista de fichas, ou estado vazio com portais oficiais.

## 4. Dados

JSON em `data/`, schemas documentais em `data/schemas/`, validação executável em `assets/js/core/validate.js` (partilhada entre browser e Node).

Todos os registos factuais têm: `id`, `estado` (`verificado` · `por-confirmar` · `desatualizado` · `arquivado`), `verificadoEm`, `revisaoPrevista`, `responsavel`, e ligação a `fontes`.

Política de apresentação (`data/config.json`):

- `verificado` → mostrado como orientação.
- `por-confirmar` → mostrado **só** se `politica.mostrarPorConfirmar = true`, com aviso visível.
- `desatualizado`, `arquivado`, revisão em atraso, data inválida → não apresentado como orientação; mostra estado vazio com portais oficiais.

## 5. Critérios de aceitação

Ver hiperprompt §15. Estado de cada critério em `docs/TESTES.md`. Validação com utilizadores: `docs/VALIDACAO.md`.

## 6. Decisões que podiam bloquear (tomadas)

1. **Ninguém verificou ainda os conteúdos jurídicos.** O agente que construiu o MVP não é responsável editorial. Todos os registos estão `por-confirmar`; as ligações foram testadas tecnicamente em 2026-10-31 (`ligacaoVerificadaEm`). Antes de publicar, um revisor humano aplica `docs/CHECKLIST-PUBLICACAO.md`.
2. **Sem oportunidades de participação verificadas.** `data/oportunidades.json` está vazio de propósito. Há dados de demonstração em `data/demo/`, carregados só com `?demo=1` e sinalizados.
3. **Domínio final indefinido.** `sitemap.xml` e `robots.txt` usam `https://example.org/` como marcador; `canonical` e `og:url` só são inseridos por `tools/set-domain.mjs` quando houver domínio.
4. **Cobertura municipal:** só Lisboa (piloto). «Outro concelho» devolve orientação nacional + aviso de falta de cobertura.
