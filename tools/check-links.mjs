// Verifica se os URLs das fontes respondem. Uso: node tools/check-links.mjs
// Resultado técnico: não substitui a verificação editorial do conteúdo.
import { readFile } from 'node:fs/promises';

const { fontes } = JSON.parse(await readFile(new URL('../data/fontes.json', import.meta.url), 'utf8'));
let falhas = 0;
for (const f of fontes) {
  if (!f.url) { console.log(`SEM URL   ${f.id}`); continue; }
  try {
    const res = await fetch(f.url, { redirect: 'follow', signal: AbortSignal.timeout(15000), headers: { 'User-Agent': 'Mozilla/5.0 (verificacao de ligacoes)' } });
    console.log(`${res.ok ? 'OK ' : 'ERRO'} ${res.status}  ${f.id}  ${f.url}`);
    if (!res.ok) falhas += 1;
  } catch (e) {
    console.log(`ERRO ---  ${f.id}  ${f.url}  (${e.cause?.code || e.message})`);
    falhas += 1;
  }
}
console.log(`\n${falhas} ligação(ões) com problema. Algumas entidades bloqueiam pedidos automáticos (ex.: 403): confirma manualmente.`);
