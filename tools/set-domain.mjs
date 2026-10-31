// Define o domínio final: atualiza sitemap.xml, robots.txt e acrescenta canonical/og:url às páginas.
// Uso: node tools/set-domain.mjs https://habitacao.exemplo.pt
import { readFile, writeFile } from 'node:fs/promises';

const dominio = (process.argv[2] || '').replace(/\/$/, '');
if (!/^https:\/\/[a-z0-9.-]+\.[a-z]{2,}$/.test(dominio)) {
  console.error('Indica um domínio https válido, por exemplo: https://habitacao.exemplo.pt');
  process.exit(1);
}
const paginas = ['index.html', 'quem-resolve.html', 'pedir-documentos.html', 'participar.html', 'sobre.html'];
const raiz = new URL('../', import.meta.url);

for (const p of paginas) {
  const caminho = new URL(p, raiz);
  let html = await readFile(caminho, 'utf8');
  const url = p === 'index.html' ? `${dominio}/` : `${dominio}/${p}`;
  html = html.replace(/\n  <link rel="canonical"[^>]*>|\n  <meta property="og:url"[^>]*>/g, '');
  html = html.replace('<meta property="og:type"', `<link rel="canonical" href="${url}">\n  <meta property="og:url" content="${url}">\n  <meta property="og:type"`);
  await writeFile(caminho, html);
}
for (const f of ['sitemap.xml', 'robots.txt']) {
  const caminho = new URL(f, raiz);
  await writeFile(caminho, (await readFile(caminho, 'utf8')).replace(/https:\/\/[^/<\s]+/g, dominio));
}
console.log(`Domínio definido: ${dominio}`);
