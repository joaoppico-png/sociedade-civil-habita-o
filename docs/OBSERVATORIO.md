# Fase 2 — «Prometeram. Cumpriram?» (preparado, não implementado)

Objetivo: acompanhar compromissos públicos de construção e reabilitação de habitação com base em documentos.

- Dados: `data/compromissos.json` (vazio). Schema: `data/schemas/compromisso.schema.json`.
- Estados de execução (definidos em `compromissos.json → estadosExecucao`) são **documentais**, não avaliativos: `nao-documentado`, `sem-inicio-documentado`, `em-execucao-documentada`, `concluido-documentado`, `alterado`. Nunca «cumprida» ou «falhada».
- Regra «Não documentado»: qualquer campo sem documento público fica `null` e aparece como «Não documentado».
- Fluxo editorial: declaração original (fonte + data) → contrato (Portal BASE) → execução (relatórios, autos, PRR) → pedidos LADA para o que falta → atualização do `historico`.
- Interface prevista: nova página `promessas.html` + módulo `assets/js/pages/promessas.js`, reutilizando `core/ui.js` (fontes, estados, datas). O resultado `r-promessa` da árvore passa a ligar para lá.

Também preparados pela arquitetura (sem trabalho feito): «O meu concelho» (indicadores com período, unidade, fonte, metodologia e limitações) e «Que apoios existem?» (questionário de orientação, sem decisões de elegibilidade) — ambos como novos JSON + página, sem tocar nos módulos existentes.

Fora de âmbito por decisão: plataforma pública de relatos e denúncias (exige proteção de identidade, moderação, verificação e consentimento).
