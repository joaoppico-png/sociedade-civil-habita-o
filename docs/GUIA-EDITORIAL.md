# Guia editorial — adicionar e atualizar informação

Os conteúdos vivem em `data/*.json`. O código não precisa de ser alterado para mudar uma regra, um contacto, um prazo ou uma oportunidade.

## Princípios

1. **Nada sem fonte.** Cada resultado, entidade e oportunidade aponta para registos de `fontes.json`.
2. **Estado honesto.** `verificado` só depois de um humano confirmar o conteúdo na fonte original e preencher `verificadoEm` e `responsavel`.
3. **Prazo de validade.** `revisaoPrevista` é obrigatória. Depois dessa data, o site deixa de mostrar o registo como orientação.
4. **Distinguir:** `regras` (o que diz a lei, com `referencia` e `fonte`), `passos` (orientação geral), `limitacoes` (o que falta confirmar ou depende do caso).
5. **Sem elegibilidade.** Nunca escrever «tens direito a…». Escrever «pode ser relevante», «quem decide é…».
6. **Linguagem:** português europeu, segunda pessoa do singular, frases curtas, sem siglas por explicar.

## Estados

| Estado | Mostrado? | Quando usar |
| --- | --- | --- |
| `verificado` | Sim | Conteúdo confirmado na fonte, com `verificadoEm`. |
| `por-confirmar` | Só se `config.politica.mostrarPorConfirmar = true`, com aviso | Rascunho ou fonte ainda não lida por um revisor. |
| `desatualizado` | Não (estado vazio + portais oficiais) | A lei ou o procedimento mudou; à espera de revisão. |
| `arquivado` | Não | Deixou de se aplicar. Manter o registo para histórico; nunca reutilizar o `id`. |

Para publicar **só** conteúdo verificado: `config.json` → `"mostrarPorConfirmar": false`.

## Tarefas frequentes

**Verificar um resultado** (`arvore.json → resultados[]`): ler cada fonte, confirmar cada regra e artigo, confirmar as entidades → `estado: "verificado"`, `verificadoEm: "AAAA-MM-DD"`, `revisaoPrevista` (sugestão: +6 meses), `responsavel: "Nome"`. Fazer o mesmo às fontes e entidades usadas.

**Adicionar uma oportunidade de participação** (`oportunidades.json`): copiar o formato de `data/demo/oportunidades-demo.json` (sem o prefixo `demo-`), com URL oficial `https://`, datas `AAAA-MM-DD`, `estadoProcedimento: "aberta"` só se confirmado. Retirar quando o prazo terminar (passar a `arquivado`).

**Adicionar um município:** acrescentar em `municipios.json` com as entidades municipais (`camara`, `habitacaoMunicipal`, `assembleia`) criadas em `entidades.json`, e acrescentar condições `"se": { "municipio": "<id>" }` às entidades dos resultados com `municipal: true`. Não acrescentar um município sem fontes municipais verificadas.

**Adicionar um problema:** nova opção numa pergunta (`seguinte` ou `resultado`) + novo resultado. `npm run validate` acusa referências partidas; `npm test` confirma que todos os caminhos chegam a um resultado.

**Mudar um prazo legal:** `requerimento.json → seguimento` e o texto da `orientacao` correspondente.

## Depois de cada alteração

```bash
npm run check
```

Registar a alteração (data, ficheiro, o que mudou, quem verificou) no histórico do repositório (mensagem de commit).
