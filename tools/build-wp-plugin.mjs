// Gera o plugin WordPress com o site incluído.
// Uso: node tools/build-wp-plugin.mjs [--indexar]
// Resultado: dist/sociedade-civil-habitacao-wp-AAAA-MM-DD.zip, para instalar em
// WordPress → Plugins → Adicionar novo → Carregar plugin.

import { cp, mkdir, readFile, rm, writeFile, readdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const raiz = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const indexar = process.argv.includes('--indexar');
const hoje = new Date().toISOString().slice(0, 10);
const nome = 'sociedade-civil-habitacao';

// Só se empacota o que passa na validação e nos testes.
execFileSync('node', ['tools/validate-data.mjs'], { cwd: raiz, stdio: 'inherit' });
execFileSync('node', ['--test', ...(await readdir(path.join(raiz, 'tests'))).filter((f) => f.endsWith('.test.mjs')).map((f) => `tests/${f}`)], { cwd: raiz, stdio: ['ignore', 'ignore', 'inherit'] });

const trabalho = path.join(raiz, 'dist', 'wp');
const plugin = path.join(trabalho, nome);
const site = path.join(plugin, 'site');
await rm(trabalho, { recursive: true, force: true });
await mkdir(site, { recursive: true });

await cp(path.join(raiz, 'tools', 'wp-plugin', `${nome}.php`), path.join(plugin, `${nome}.php`));
const paginas = (await readdir(raiz)).filter((f) => f.endsWith('.html') && f !== '404.html');
for (const f of paginas) {
  let html = await readFile(path.join(raiz, f), 'utf8');
  html = html.replace(/<meta name="robots" content="[^"]*">/, `<meta name="robots" content="${indexar ? 'index, follow' : 'noindex, nofollow'}">`);
  await writeFile(path.join(site, f), html);
}
await cp(path.join(raiz, 'assets'), path.join(site, 'assets'), { recursive: true });
await cp(path.join(raiz, 'data'), path.join(site, 'data'), { recursive: true, filter: (src) => !src.includes(`${path.sep}schemas`) });
await writeFile(path.join(site, 'index.php'), '<?php // Silêncio.\n');

await writeFile(path.join(plugin, 'readme.txt'), `=== Sociedade Civil — Habitação ===
Stable tag: 1.0.0
License: GPL-2.0-or-later

Ferramenta cívica de habitação em Portugal: quem resolve o teu problema, pedidos de documentos administrativos e participação.

== Instalação ==
1. WordPress → Plugins → Adicionar novo → Carregar plugin → escolher este ZIP → Instalar → Ativar.
2. Criar ou editar uma página e acrescentar um bloco «Shortcode» com:
   [sociedade_civil_habitacao]
3. Publicar a página.

Opções do shortcode:
- pagina: index.html (por defeito), quem-resolve.html, pedir-documentos.html, participar.html, sobre.html, questoes-juridicas.html
- altura: altura inicial em píxeis (por defeito 900; ajusta-se sozinha)
Exemplo: [sociedade_civil_habitacao pagina="quem-resolve.html"]

== Notas ==
- Versão de teste (${hoje}): as páginas da ferramenta têm ${indexar ? 'indexação permitida' : 'noindex'} e a maior parte dos conteúdos está «por confirmar».
- Para atualizar: gerar novo ZIP (node tools/build-wp-plugin.mjs), desativar e apagar a versão antiga, carregar a nova.
- Nada é guardado na base de dados do WordPress; os dados escritos no gerador ficam só no browser de quem os escreve.
`);

const zip = `${nome}-wp-${hoje}.zip`;
await rm(path.join(raiz, 'dist', zip), { force: true });
execFileSync('zip', ['-qr', path.join('..', zip), nome], { cwd: trabalho });
console.log(`\nPlugin pronto: dist/${zip}`);
