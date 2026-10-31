// Gera o pacote para publicar numa subpasta de um alojamento Apache/cPanel (ex.: sociedadecivil.pt/direito_habitacao).
// Uso: node tools/build-package.mjs [https://sociedadecivil.pt/direito_habitacao] [--indexar]
//   --indexar  retira o bloqueio aos motores de busca (usar só quando as fichas estiverem verificadas).
// Resultado: dist/habitacao/ (pasta pronta) e dist/habitacao-AAAA-MM-DD.zip.
// O código-fonte não é alterado: o domínio, o noindex e a <base> da 404 só existem no pacote.

import { cp, mkdir, readFile, rm, writeFile, readdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const raiz = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const args = process.argv.slice(2);
const indexar = args.includes('--indexar');
const base = (args.find((a) => a.startsWith('https://')) || 'https://sociedadecivil.pt/direito_habitacao').replace(/\/$/, '');
const url = new URL(base);
if (url.protocol !== 'https:' || url.search || url.hash) {
  console.error('Indica um endereço https sem parâmetros, por exemplo: https://sociedadecivil.pt/direito_habitacao');
  process.exit(1);
}
const caminho = url.pathname.replace(/\/$/, '') || '';          // ex.: /habitacao
const pasta = caminho.split('/').filter(Boolean).pop() || 'site'; // nome da pasta no pacote
const hoje = new Date().toISOString().slice(0, 10);

// 1. Só se empacota o que passa na validação e nos testes.
execFileSync('node', ['tools/validate-data.mjs'], { cwd: raiz, stdio: 'inherit' });
execFileSync('node', ['--test', ...(await readdir(path.join(raiz, 'tests'))).filter((f) => f.endsWith('.test.mjs')).map((f) => `tests/${f}`)], { cwd: raiz, stdio: ['ignore', 'ignore', 'inherit'] });

// 2. Copiar os ficheiros públicos.
const dist = path.join(raiz, 'dist');
const destino = path.join(dist, pasta);
await rm(dist, { recursive: true, force: true });
await mkdir(destino, { recursive: true });
const paginas = (await readdir(raiz)).filter((f) => f.endsWith('.html'));
for (const f of paginas) await cp(path.join(raiz, f), path.join(destino, f));
await cp(path.join(raiz, 'assets'), path.join(destino, 'assets'), { recursive: true });
await cp(path.join(raiz, 'data'), path.join(destino, 'data'), { recursive: true, filter: (src) => !src.includes(`${path.sep}schemas`) });

// 3. Endereço canónico, Open Graph, indexação e <base> na página 404.
const robots = indexar ? 'index, follow' : 'noindex, nofollow';
for (const f of paginas) {
  const ficheiro = path.join(destino, f);
  let html = await readFile(ficheiro, 'utf8');
  const pagina = f === 'index.html' ? `${base}/` : `${base}/${f}`;
  html = html.replace(/<meta name="robots" content="[^"]*">/, `<meta name="robots" content="${f === '404.html' ? 'noindex' : robots}">`);
  if (f !== '404.html') {
    html = html.replace('<meta property="og:type"', `<link rel="canonical" href="${pagina}">\n  <meta property="og:url" content="${pagina}">\n  <meta property="og:type"`);
  } else {
    // A 404 pode ser servida em qualquer endereço: a <base> mantém as ligações relativas corretas.
    html = html.replace('<meta charset="utf-8">', `<meta charset="utf-8">\n  <base href="${caminho}/">`);
  }
  await writeFile(ficheiro, html);
}

// 4. Sitemap e robots (o robots.txt só é lido na raiz do domínio: ver LEIA-ME).
const sitemap = ['index.html', 'quem-resolve.html', 'pedir-documentos.html', 'participar.html', 'sobre.html', 'questoes-juridicas.html']
  .map((f) => `  <url><loc>${f === 'index.html' ? `${base}/` : `${base}/${f}`}</loc><lastmod>${hoje}</lastmod></url>`).join('\n');
await writeFile(path.join(destino, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemap}\n</urlset>\n`);
await writeFile(path.join(destino, 'robots.txt'), `User-agent: *\n${indexar ? 'Allow' : 'Disallow'}: ${caminho}/\n\nSitemap: ${base}/sitemap.xml\n`);

// 5. Configuração Apache.
const origemSite = url.origin;
const ancestors = [`'self'`, origemSite, origemSite.replace('://', '://www.')].filter((v, i, a) => a.indexOf(v) === i).join(' ');
const htaccess = `# Sociedade Civil — Habitação · configuração Apache (cPanel) · gerado em ${hoje}
Options -Indexes
DirectoryIndex index.html
ErrorDocument 404 ${caminho}/404.html

AddType application/json .json
AddType text/javascript .js
AddType image/svg+xml .svg
AddDefaultCharset utf-8

# Forçar HTTPS
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteCond %{HTTPS} !=on
  RewriteCond %{HTTP:X-Forwarded-Proto} !=https
  RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
</IfModule>

<IfModule mod_headers.c>
  Header always set X-Content-Type-Options "nosniff"
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
  Header always set Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=()"
  # Só o próprio site pode incorporar estas páginas num iframe (ex.: página WordPress em ${origemSite}).
  Header always set Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'; frame-ancestors ${ancestors}"
${indexar ? '' : `  # Versão de teste: não indexar nos motores de busca. Gerar com --indexar para retirar.
  Header always set X-Robots-Tag "noindex, nofollow"
`}  <FilesMatch "\\.json$">
    Header set Cache-Control "no-cache"
  </FilesMatch>
  # CSS e JS revalidam sempre (ETag): uma atualização aparece logo, sem limpar a cache.
  <FilesMatch "\\.(css|js)$">
    Header set Cache-Control "no-cache"
  </FilesMatch>
  <FilesMatch "\\.svg$">
    Header set Cache-Control "public, max-age=86400"
  </FilesMatch>
</IfModule>
`;
await writeFile(path.join(destino, '.htaccess'), htaccess);

// 6. Código WordPress com o endereço final e instruções.
const wp = (await readFile(path.join(raiz, 'docs', 'wordpress-embed.html'), 'utf8')).replaceAll('https://sociedadecivil.pt/direito_habitacao', base);
await writeFile(path.join(dist, 'wordpress-embed.html'), wp);
await writeFile(path.join(dist, 'LEIA-ME.txt'), `SOCIEDADE CIVIL — HABITAÇÃO · PACOTE DE PUBLICAÇÃO (${hoje})
Endereço final: ${base}/
Indexação nos motores de busca: ${indexar ? 'PERMITIDA' : 'BLOQUEADA (versão de teste)'}

1. No cPanel (Gestor de Ficheiros) ou por FTP, abrir public_html/.
2. Carregar o ZIP ${pasta}-${hoje}.zip para public_html/ e usar «Extract». Fica public_html/${pasta}/.
   Confirmar que o ficheiro oculto .htaccess foi extraído (no Gestor de Ficheiros: Definições > Mostrar ficheiros ocultos).
3. Abrir ${base}/ e testar: página inicial, «Quem resolve?», gerador de documentos, uma página inexistente (deve mostrar a 404).
4. WordPress no mesmo domínio:
   - A pasta real ${caminho}/ tem prioridade sobre o WordPress. Não criar no WordPress uma página com o mesmo endereço (${caminho}).
   - Para mostrar a ferramenta dentro de uma página WordPress, criar uma página com outro endereço
     (ex.: ${origemSite}/habitacao/) e colar o conteúdo de wordpress-embed.html num bloco «HTML personalizado».
5. robots.txt: os motores de busca só leem ${origemSite}/robots.txt (na raiz). ${indexar
  ? `Quando quiseres indexar, acrescenta lá a linha: Sitemap: ${base}/sitemap.xml`
  : `Enquanto for versão de teste, o bloqueio é garantido pelo cabeçalho X-Robots-Tag do .htaccess e pela meta robots de cada página.`}
6. Para atualizar: gerar novo pacote (node tools/build-package.mjs ${base}) e substituir a pasta inteira.

Notas:
- Se o alojamento não tiver mod_headers, os cabeçalhos não são aplicados; a política de segurança mantém-se na meta de cada página.
- Os dados de demonstração continuam acessíveis em ${base}/participar.html?demo=1 e estão sinalizados como fictícios.
`);

// 7. ZIP (a pasta ${pasta}/ fica na raiz do arquivo).
const zip = `${pasta}-${hoje}.zip`;
execFileSync('zip', ['-qr', zip, pasta], { cwd: dist });
console.log(`\nPacote pronto: dist/${zip}\nPasta: dist/${pasta}/\nEndereço: ${base}/ · indexação ${indexar ? 'permitida' : 'bloqueada'}`);
