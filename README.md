# Sociedade Civil — Habitação

Plataforma cívica independente de orientação, ação e fiscalização sobre habitação em Portugal.
**A tua casa. Os teus direitos. Respostas concretas.**

Site estático (HTML5, CSS3, JavaScript ES Modules, JSON). Sem frameworks, sem dependências, sem backend, sem IA, sem cookies.

## O que faz (MVP v1.0)

| Módulo | Página | Faz |
| --- | --- | --- |
| Quem resolve? | `quem-resolve.html` | Árvore de decisão → ficha com entidades, regras com fonte, passos, documentos, ações, limitações e datas de verificação. |
| Pedir documentos | `pedir-documentos.html` | Gera pedido LADA, insistência ou carta ao senhorio; texto editável; copiar, `.txt`, imprimir/PDF; calcula prazos em dias úteis e descarrega lembretes `.ics`. |
| Participar | `participar.html` | Catálogo de oportunidades com filtros. Vazio até haver consultas verificadas. Demonstração em `?demo=1`. |

## Executar localmente

Precisa de um servidor HTTP (os módulos ES e o `fetch` dos JSON não funcionam em `file://`).

```bash
cd sites/sociedade-civil-habitacao
python3 -m http.server 8080
```

Abrir <http://localhost:8080>.

## Validar e testar

Requer Node.js ≥ 20 (sem `npm install` — não há dependências).

```bash
npm run validate      # valida data/*.json (referências, datas, URLs, estados) — falha se houver erros
npm test              # testes unitários (node:test)
npm run check:links   # verifica se os URLs das fontes respondem (rede)
```

## Publicar em alojamento estático

1. Correr `npm run check` — tem de passar.
2. Aplicar `docs/CHECKLIST-PUBLICACAO.md` (revisão editorial humana).
3. Definir o domínio: `node tools/set-domain.mjs https://dominio-final.pt` (atualiza `sitemap.xml`, `robots.txt`, `canonical` e `og:url`).
4. Copiar para a raiz pública (`public_html/`, Netlify, GitHub Pages, etc.) **apenas**: `*.html`, `assets/`, `data/` (sem `data/demo/` se preferir), `sitemap.xml`, `robots.txt`. Não é preciso publicar `docs/`, `tests/`, `tools/`.
5. Configurar a página de erro 404 para `404.html` (no cPanel: «Error Pages»; no Apache: `ErrorDocument 404 /404.html`).
6. Recomendado no servidor: HTTPS forçado e cabeçalhos `Content-Security-Policy` (igual ao `<meta>` das páginas), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`.

## Estrutura

```
index.html  quem-resolve.html  pedir-documentos.html  participar.html  sobre.html  404.html
assets/css/styles.css              design tokens + componentes
assets/js/core/                    dom (escrita segura), status (estados/datas), validate, data (fetch), ui
assets/js/lib/                     lógica pura testável: decision, requerimento, prazos, participacao
assets/js/pages/                   ligação de cada página ao DOM
data/                              conteúdos (config, fontes, entidades, arvore, municipios, requerimento, oportunidades, compromissos)
data/demo/                         dados fictícios, só com ?demo=1
data/schemas/                      JSON Schema (documentação dos campos)
docs/                              especificação, guia editorial, checklist, testes, observatório, validação
tests/                             testes node:test
tools/                             validate-data, check-links, set-domain
```

## Atualizar conteúdos

Ver `docs/GUIA-EDITORIAL.md`. Resumo: edita o JSON, corre `npm run check`, regista a alteração.

## Limites desta versão

Conteúdos jurídicos **por confirmar** (nenhum revisor humano os validou ainda). Lisboa é o único município com informação municipal. Ver `docs/TESTES.md` → «Pendentes».
