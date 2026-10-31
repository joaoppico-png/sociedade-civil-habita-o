// Valida os ficheiros de dados antes de publicar. Sai com código 1 se houver erros.
// Uso: node tools/validate-data.mjs
import { readFile } from 'node:fs/promises';
import { validarTudo, validarOportunidades } from '../assets/js/core/validate.js';
import { effectiveStatus, todayISO } from '../assets/js/core/status.js';

const ler = async (n) => JSON.parse(await readFile(new URL(`../data/${n}.json`, import.meta.url), 'utf8'));
const [config, fontes, entidades, arvore, oportunidades, municipios, requerimento, compromissos] = await Promise.all(
  ['config', 'fontes', 'entidades', 'arvore', 'oportunidades', 'municipios', 'requerimento', 'compromissos'].map(ler));

const erros = validarTudo({ fontes, entidades, arvore, oportunidades });
if (!Array.isArray(compromissos.compromissos)) erros.push('compromissos.json: falta a lista «compromissos»');
if (!requerimento.modalidades?.length) erros.push('requerimento.json: sem modalidades');
for (const m of municipios.municipios) {
  if (!entidades.entidades.some((e) => e.id === m.camara)) erros.push(`município ${m.id}: câmara desconhecida`);
}

// Os dados de demonstração não podem estar na lista publicável.
if (oportunidades.oportunidades.some((o) => o.id.startsWith('demo-') || /\[DEMO\]/.test(o.titulo))) {
  erros.push('oportunidades.json contém registos de demonstração');
}
const demo = await ler('demo/oportunidades-demo');
const avisosDemo = validarOportunidades(demo, new Set(entidades.entidades.map((e) => e.id)));

// Relatório editorial.
const hoje = todayISO();
const todos = [...fontes.fontes, ...entidades.entidades, ...arvore.resultados];
const contagem = {};
for (const r of todos) {
  const { estado } = effectiveStatus(r, hoje);
  contagem[estado] = (contagem[estado] || 0) + 1;
}
console.log(`Registos factuais: ${todos.length}`, contagem);
console.log(`Política: mostrarPorConfirmar = ${config.politica.mostrarPorConfirmar}`);
console.log(`Demonstração: ${demo.oportunidades.length} registos, ${avisosDemo.length} problemas intencionais detetados.`);
if (erros.length) {
  console.error(`\n${erros.length} erro(s):\n- ${erros.join('\n- ')}`);
  process.exit(1);
}
console.log('Dados válidos.');
