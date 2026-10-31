# Checklist de revisão editorial pré-publicação

Responsável: ______________________ Data: ____________

## Conteúdo jurídico e administrativo
- [ ] Cada artigo citado em `regras[].referencia` foi lido na versão consolidada em vigor (Diário da República).
- [ ] LADA: confirmados art. 5.º (acesso sem justificação), art. 12.º (elementos do pedido), art. 15.º (10 dias úteis e prorrogação), art. 16.º (queixa à CADA, prazo e contagem).
- [ ] Código Civil arts. 1036.º, 1074.º e 1430.º e seguintes; RJUE art. 89.º e seguintes; NRAU e BAS — confirmados.
- [ ] Competência dos Julgados de Paz em condomínio e arrendamento confirmada (Lei n.º 78/2001) e URL oficial preenchido.
- [ ] Canal oficial do BAS identificado e preenchido em `fontes.json`.
- [ ] Linha 144: condições atuais confirmadas.
- [ ] Contagem de dias úteis (`lib/prazos.js`) e lista de feriados confirmadas; início do prazo da queixa à CADA confirmado.
- [ ] Modelo de requerimento revisto por um jurista.

## Fontes e ligações
- [ ] `npm run check:links` sem erros, ou erros explicados (ex.: 403 de bloqueio automático confirmado manualmente).
- [ ] Página da Câmara Municipal de Lisboa: URLs específicos (habitação, urbanismo, vistorias) identificados.
- [ ] Condições de reutilização das fontes verificadas.

## Estados e datas
- [ ] Todos os registos revistos têm `estado: verificado`, `verificadoEm`, `revisaoPrevista`, `responsavel`.
- [ ] Decidido o valor de `config.politica.mostrarPorConfirmar` para produção.
- [ ] `oportunidades.json` só contém consultas confirmadas na fonte oficial, com prazos em vigor.

## Técnica
- [ ] `npm run check` passa.
- [ ] Domínio definido com `tools/set-domain.mjs`.
- [ ] Teste manual: copiar texto, imprimir/PDF, `.ics` num calendário real (Google, Apple, Outlook).
- [ ] Teste com leitor de ecrã (VoiceOver ou NVDA) nos três módulos.
- [ ] Teste com zoom a 200% e a 400%.

## Transparência
- [ ] `sobre.html`: responsável editorial, canal de correções e contacto preenchidos.
- [ ] Texto «Estado atual» atualizado.
