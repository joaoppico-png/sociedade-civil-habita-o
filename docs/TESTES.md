# Testes — resultados (2026-10-31)

Ambiente: macOS, Node.js 22.22.3, Chromium (painel do browser integrado), servidor `python3 -m http.server`.

## Executados

| # | Teste | Como | Resultado |
| --- | --- | --- | --- |
| 1 | Validação de dados (referências, datas, URLs, estados, demo fora da lista publicável) | `npm run validate` | ✅ 50 registos factuais válidos (todos `por-confirmar`) |
| 2 | Testes unitários (32): todos os caminhos da árvore (≥ 20), resultados alcançáveis, Lisboa vs outro concelho, retrocesso, caminhos inválidos, política «sem verificação → sem resultado», datas inválidas, revisão em atraso, geração dos 3 documentos, campos obrigatórios, e-mail, prazo, inputs maliciosos, limites, dias úteis/feriados, `.ics`, filtros e estados de participação, deteção de referências partidas | `npm test` | ✅ 32/32 |
| 3 | Navegação entre páginas e carregamento dos JSON | browser | ✅ sem erros de consola |
| 4 | Fluxo «Quem resolve?» por cliques: avançar, Voltar, Alterar resposta anterior, botão «retroceder» do browser, foco no novo título | browser (JS) | ✅ |
| 5 | Navegação só por teclado: Tab chega ao 1.º caminho com contorno de foco visível; Enter avança; foco passa para a pergunta seguinte | browser (teclas reais) | ✅ |
| 6 | Caminho malicioso no URL (`<img onerror>`) | browser | ✅ ignorado, nada injetado |
| 7 | Gerador: resumo de erros com foco e ligações, `aria-invalid`/`aria-describedby`, e-mail exigido para cópia eletrónica, geração, edição, `.txt` (conteúdo editado confirmado), prazos (13/11 e 15/12 para entrega a 30/10/2026), `.ics` sem dados pessoais, «Preparar insistência», carta ao senhorio sem referência à LADA, prazo inválido, «Apagar tudo» | browser (JS) | ✅ |
| 8 | Privacidade: `localStorage`, `sessionStorage` e cookies vazios depois de usar o gerador | browser | ✅ |
| 9 | Participação: estado vazio com portais oficiais; `?demo=1` com aviso; estados (aberta / por confirmar por revisão em atraso, URL `javascript:` ou datas inválidas); título com HTML mostrado como texto; filtros e limpar filtros | browser | ✅ |
| 10 | Falha de carregamento (JSON em falta → mensagem de erro + portais oficiais) | browser, ficheiro renomeado temporariamente | ✅ |
| 11 | Responsivo: sem scroll horizontal em 360, 768 e 1440 px nas 5 páginas | browser (iframes à largura exata) | ✅ — alvos de rádio aumentados de 22 para 24 px depois do teste |
| 12 | Ligações das fontes | `npm run check:links` | ⚠️ 19 OK · `lisboa.pt` 403 (bloqueio a pedidos automáticos; abre no browser) · `base.gov.pt` erro de cadeia TLS no Node (curl responde 200) · BAS e Julgados de Paz sem URL |

## Pendentes (não executados)

- **Copiar para a área de transferência:** o teste automático falhou porque o painel estava oculto (a API exige foco e um gesto real). Falta testar com um clique humano.
- **Imprimir / guardar em PDF:** a folha de estilos de impressão existe, mas não foi inspecionada visualmente. O painel não estava visível para capturas de ecrã.
- **Inspeção visual (capturas de ecrã)** em 360/768/1440: só foram verificadas métricas de layout, não o aspeto.
- **Leitor de ecrã** (VoiceOver/NVDA), **zoom a 200 %/400 %**, **contraste medido com ferramenta**: não feitos. Os tokens foram escolhidos para AA, mas falta medir.
- **Importar o `.ics`** num calendário real.
- **Conteúdo das páginas do Diário da República:** o site do DR é uma aplicação JavaScript que responde 200 a qualquer endereço. O código 200 **não prova** que o identificador corresponde ao diploma certo. É preciso abrir cada ligação.
- **Revisão jurídica** de todas as regras e do modelo de requerimento (ver `CHECKLIST-PUBLICACAO.md`).

Não se declara conformidade WCAG 2.2 AA: o objetivo foi seguido no desenho, mas não houve auditoria.
