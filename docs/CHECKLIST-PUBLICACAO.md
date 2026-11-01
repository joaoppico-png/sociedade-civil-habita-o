# Checklist de revisão editorial pré-publicação

Responsável: ______________________ Data: ____________

## Conteúdo jurídico e administrativo
- [ ] Cada artigo citado em `regras[].referencia` foi lido na versão consolidada em vigor (Diário da República).
- [x] LADA arts. 12.º, 15.º e 16.º e contagem dos prazos confirmados através de pareceres da CADA que citam o texto da lei (Proc. 240/2026, Parecer 38/2025, Proc. 518/2026) — 2026-10-31.
- [ ] LADA: ler o texto consolidado no Diário da República (incluindo art. 5.º) e confirmar que não houve alterações posteriores aos pareceres.
- [ ] Código Civil arts. 1036.º, 1074.º e 1430.º e seguintes; RJUE art. 89.º e seguintes; NRAU e BAS — confirmados.
- [ ] Competência dos Julgados de Paz em condomínio e arrendamento confirmada (Lei n.º 78/2001) e URL oficial preenchido.
- [ ] Canal oficial do BAS identificado e preenchido em `fontes.json`.
- [ ] Linha 144: condições atuais confirmadas.
- [x] Contagem: resposta em dias úteis (CPA, art. 87.º); queixa em 20 dias corridos a partir do dia seguinte ao fim da resposta (Parecer CADA, Proc. 518/2026). Testada com dois casos reais citados no parecer.
- [ ] Lista de feriados nacionais confirmada; decidir se se avisa sobre feriados municipais e férias judiciais (contagem processual do prazo de 20 dias).
- [ ] Modelo de requerimento revisto por um jurista.

## Fontes e ligações
- [ ] `npm run check:links` sem erros, ou erros explicados (ex.: 403 de bloqueio automático confirmado manualmente).
- [ ] Página da Câmara Municipal de Lisboa: URLs específicos (habitação, urbanismo, vistorias) identificados.
- [ ] Condições de reutilização das fontes verificadas.

## Estados e datas
- [ ] Todos os registos revistos têm `estado: verificado` (feito em 2026-10-31 para 4 orientações LADA, regra de contagem e 3 pareceres CADA — responsável João Pico), `verificadoEm`, `revisaoPrevista`, `responsavel`.
- [ ] Decidido o valor de `config.politica.mostrarPorConfirmar` para produção.
- [ ] `oportunidades.json` só contém consultas confirmadas na fonte oficial, com prazos em vigor.

## Técnica
- [ ] `npm run check` passa.
- [ ] Domínio definido com `tools/set-domain.mjs`.
- [ ] Teste manual: copiar texto, imprimir/PDF, `.ics` num calendário real (Google, Apple, Outlook).
- [ ] Teste com leitor de ecrã (VoiceOver ou NVDA) nos três módulos.
- [ ] Teste com zoom a 200% e a 400%.
- [ ] Na página WordPress, o `src` do iframe é o endereço real (não `data:`) e a altura acompanha o conteúdo, sem scroll interno.
- [ ] Proteção contra incorporação por outros sites no servidor. O alojamento é nginx, por isso o `.htaccess` não se aplica: pedir ao alojamento que, para `/wp-content/plugins/sociedade-civil-habitacao/site/`, envie
      `add_header Content-Security-Policy "frame-ancestors 'self'" always;`
      e confirmar com `curl -I`. Até lá, só existe a defesa em JavaScript (`assets/js/lib/anfitriao.js`).

## Transparência
- [ ] `sobre.html`: responsável editorial, canal de correções e contacto preenchidos.
- [ ] Texto «Estado atual» atualizado.
